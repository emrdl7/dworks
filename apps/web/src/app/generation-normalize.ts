// LLM 생성 트리 normalize — schema 통과한 응답에 대해 _구조적 일관성_ 보강.
//
// design-resolver가 type별 default를 _런타임에_ 채워주므로, normalize는 schema
// 외 _구조 자체의 무결성_만 다룬다:
//   - id 중복 자동 rename (schema에 unique 검사 없음 — 같은 id가 두 노드에 박히면
//     인스펙터/캔버스의 querySelector가 첫 매치로 잘못 동작)
//   - root이 section이 아닌 경우 wrapper section 보강 (LLM이 단편 응답 시)
//   - 풍부도 13 신호 자동 보강 (validateTreeRichness missing[] 기반 — idempotent + safe 변환만)
//   - ensureInteractiveComponent: AI-02 — main 직계 마지막 section 직전에 도메인-적합 interactive 1개 삽입
//   - ensureEntranceAnimations: AI-03 — hero.title slide-up 700 load + cards staggered slide-up 600 scroll + final heading fade-in 500 (총 ≤8개, idempotent)
//
// AI 자유도 ↑로 LLM이 _자유롭게 override_를 박아도 resolver와 정합 — 이 normalize
// 의 역할은 _구조적 안전망_에 그친다.

import type { Tree, TreeNode } from '@dworks/tree'

import { validateTreeRichness, type RichnessSignalKey } from './richness'

interface NormalizeContext {
  // root이 section이 아니면 wrap 시 사용할 ID prefix
  fallbackRootId?: string
  /** 사용자 prompt — enforceRichness 단계에서 도메인 추론에 사용. 없으면 enforceRichness skip. */
  prompt?: string
}

/**
 * id 중복을 방지하기 위해 트리를 traverse하며 같은 id가 또 나타나면 suffix를 붙임.
 * 트리 구조와 id_prefix가 동일한 LLM 응답이 _합쳐질 때_ 충돌 방지.
 */
function deduplicateIds(node: TreeNode, seen: Set<string>): TreeNode {
  let nextId = node.id
  if (seen.has(nextId)) {
    let suffix = 2
    while (seen.has(`${node.id}-${suffix}`)) {
      suffix += 1
    }
    nextId = `${node.id}-${suffix}`
  }
  seen.add(nextId)

  if ('children' in node && Array.isArray(node.children)) {
    return {
      ...node,
      id: nextId,
      children: node.children.map((child) => deduplicateIds(child, seen)),
    } as TreeNode
  }

  return { ...node, id: nextId } as TreeNode
}

/**
 * root이 section이 아니면 빈 section으로 wrap. LLM이 단편 hero/card만 반환할 때
 * 페이지 구조 안정망.
 */
function ensureRootSection(root: TreeNode, fallbackRootId: string): TreeNode {
  if (root.type === 'section') return root
  return {
    id: fallbackRootId,
    type: 'section',
    editKind: 'structure',
    responsive: undefined,
    children: [root],
  } as TreeNode
}

export function normalizeDesignTree(
  tree: Tree,
  context: NormalizeContext = {},
): Tree {
  const fallbackRootId = context.fallbackRootId ?? 'auto-root-section'
  // 1) root이 section임을 보장
  const rooted = ensureRootSection(tree.root, fallbackRootId)
  // 2) id 중복 제거
  const deduped = deduplicateIds(rooted, new Set<string>())
  const intermediate: Tree = { ...tree, root: deduped }
  // 3) 풍부도 13 신호 자동 보강 (prompt 있을 때만 — backward compat)
  if (context.prompt === undefined) return intermediate
  return enforceRichness(intermediate, context.prompt)
}

/**
 * 13 풍부도 신호 자동 보강 — idempotent + safe 변환만.
 *   - interactiveComponent missing: 도메인 추론 후 carousel/tabs/accordion/modal 1개 추가 (D-05, D-07)
 *   - entranceAnimationSpread missing: hero.title + main 직계 카드 + final CTA staggered (D-08, D-09, D-10)
 * 보강 후에도 잔여 missing 이 있으면 호출 측이 toast 로 사용자에게 안내.
 */
export function enforceRichness(tree: Tree, prompt: string): Tree {
  const { missing }: { missing: RichnessSignalKey[] } = validateTreeRichness(tree)
  let next = tree
  if (missing.includes('interactiveComponent')) {
    next = ensureInteractiveComponent(next, inferDomain(prompt))
  }
  if (missing.includes('entranceAnimationSpread')) {
    next = ensureEntranceAnimations(next)
  }
  return next
}

/** 도메인 → 권장 인터랙티브 컴포넌트 매핑 (D-05). */
export type DomainKey = 'ecommerce' | 'saas' | 'faq' | 'auth' | 'default'

/** prompt 의도 키워드 매칭 — pure regex. (D-05) */
export function inferDomain(prompt: string): DomainKey {
  const p = prompt.toLowerCase()
  if (/e-?commerce|쇼핑|제품|카탈로그/.test(p)) return 'ecommerce' // → carousel
  if (/saas|b2b|dashboard|기능|pricing/.test(p)) return 'saas' // → tabs
  if (/faq|컨퍼런스|일정|specs/.test(p)) return 'faq' // → accordion
  if (/가입|회원|약관/.test(p)) return 'auth' // → modal
  return 'default' // → accordion
}

// ─────── Sub-routines ───────

/** D-05: 도메인 → 권장 interactive type 매핑. */
const DOMAIN_TO_INTERACTIVE: Record<
  DomainKey,
  'carousel' | 'tabs' | 'accordion' | 'modal'
> = {
  ecommerce: 'carousel',
  saas: 'tabs',
  faq: 'accordion',
  auth: 'modal',
  default: 'accordion',
}

/** main 컨테이너 (role === 'main') 를 재귀로 찾아 반환. 없으면 undefined. */
function findMainContainer(node: TreeNode): TreeNode | undefined {
  const n = node as unknown as Record<string, unknown>
  if (
    n.role === 'main' &&
    'children' in node &&
    Array.isArray((node as { children?: unknown }).children)
  ) {
    return node
  }
  if (
    'children' in node &&
    Array.isArray((node as { children?: TreeNode[] }).children)
  ) {
    for (const child of (node as { children: TreeNode[] }).children) {
      const found = findMainContainer(child)
      if (found !== undefined) return found
    }
  }
  return undefined
}

/** TreeNode 가 interactive type 인지 검사. */
function isInteractive(node: TreeNode): boolean {
  return (
    node.type === 'carousel' ||
    node.type === 'tabs' ||
    node.type === 'accordion' ||
    node.type === 'modal'
  )
}

/** 트리 어디든 interactive 노드가 1개 이상 존재하는지 — D-07 idempotent guard. */
function hasAnyInteractive(node: TreeNode): boolean {
  if (isInteractive(node)) return true
  if (
    'children' in node &&
    Array.isArray((node as { children?: TreeNode[] }).children)
  ) {
    for (const child of (node as { children: TreeNode[] }).children) {
      if (hasAnyInteractive(child)) return true
    }
  }
  return false
}

/** 빈 interactive 노드 fabricate — 한국어 placeholder 포함. D-06 사용자 편집 anchor. */
function makeInteractiveNode(
  type: 'carousel' | 'tabs' | 'accordion' | 'modal',
): TreeNode {
  const id = `auto-${type}-${Date.now().toString(36)}`
  const placeholder = '인터랙티브 요소 — 도메인에 맞게 편집하세요'
  // schema 호환: carousel/tabs/accordion 은 items, modal 은 children + label.
  if (type === 'modal') {
    return {
      id,
      type: 'modal',
      editKind: 'structure',
      label: placeholder,
      children: [],
    } as unknown as TreeNode
  }
  return {
    id,
    type,
    editKind: 'structure',
    items: [
      {
        id: `${id}-slot-1`,
        label: placeholder,
        children: [],
      },
    ],
  } as unknown as TreeNode
}

/** main 직계 children 의 _마지막 section/hero 직전_ 에 노드 삽입 (D-06). */
function insertBeforeLastSection(
  mainNode: TreeNode,
  newNode: TreeNode,
): TreeNode {
  if (
    !('children' in mainNode) ||
    !Array.isArray((mainNode as { children?: TreeNode[] }).children)
  ) {
    return mainNode
  }
  const children = (mainNode as { children: TreeNode[] }).children
  let lastIdx = -1
  for (let i = children.length - 1; i >= 0; i--) {
    const c = children[i]
    if (c !== undefined && (c.type === 'section' || c.type === 'hero')) {
      lastIdx = i
      break
    }
  }
  const insertAt = lastIdx === -1 ? children.length : lastIdx
  const nextChildren = [
    ...children.slice(0, insertAt),
    newNode,
    ...children.slice(insertAt),
  ]
  return { ...mainNode, children: nextChildren } as TreeNode
}

/** 재귀로 트리 안의 특정 id 노드를 교체. */
function replaceNode(
  node: TreeNode,
  targetId: string,
  replacement: TreeNode,
): TreeNode {
  if (node.id === targetId) return replacement
  if (
    'children' in node &&
    Array.isArray((node as { children?: TreeNode[] }).children)
  ) {
    const children = (node as { children: TreeNode[] }).children
    return {
      ...node,
      children: children.map((c) => replaceNode(c, targetId, replacement)),
    } as TreeNode
  }
  return node
}

function ensureInteractiveComponent(tree: Tree, domain: DomainKey): Tree {
  // D-07: 이미 interactive 있으면 skip (idempotent safety).
  if (hasAnyInteractive(tree.root)) return tree
  const interactiveType = DOMAIN_TO_INTERACTIVE[domain]
  const newNode = makeInteractiveNode(interactiveType)
  const main = findMainContainer(tree.root)
  if (main === undefined) {
    // main 없으면 root.children 직접 — fallback (root 가 container 일 때만).
    if (
      'children' in tree.root &&
      Array.isArray((tree.root as { children?: TreeNode[] }).children)
    ) {
      const replaced = insertBeforeLastSection(tree.root, newNode)
      return { ...tree, root: replaced }
    }
    return tree
  }
  const replacedMain = insertBeforeLastSection(main, newNode)
  return {
    ...tree,
    root: replaceNode(tree.root, main.id, replacedMain),
  }
}

/** D-09 entranceAnimation prop shape — schema (packages/tree) 와 일치. */
export interface EntranceAnimation {
  type: 'slide-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-up'
  duration: number
  delay?: number
  trigger: 'load' | 'scroll'
}

const MAX_ANIMATIONS = 8
const STAGGER_DELAY_MS = 150

/** TreeNode 의 entranceAnimation prop 이 이미 있는지 — D-10 덮어쓰기 방지 guard. */
function hasEntranceAnimation(node: TreeNode): boolean {
  const n = node as unknown as Record<string, unknown>
  return n.entranceAnimation !== undefined && n.entranceAnimation !== null
}

/** 노드에 entranceAnimation 부착 — 기존 값 있으면 그대로 둠 (D-10). */
function withEntranceAnimation(
  node: TreeNode,
  anim: EntranceAnimation,
): TreeNode {
  if (hasEntranceAnimation(node)) return node
  return { ...node, entranceAnimation: anim } as unknown as TreeNode
}

/** heading 자식 찾기 — emphasis === 'heading-1' 우선, 없으면 첫 text. */
function findHeadingChild(container: TreeNode): TreeNode | undefined {
  if (
    !('children' in container) ||
    !Array.isArray((container as { children?: TreeNode[] }).children)
  ) {
    return undefined
  }
  const children = (container as { children: TreeNode[] }).children
  for (const c of children) {
    const n = c as unknown as Record<string, unknown>
    if (n.emphasis === 'heading-1') return c
  }
  for (const c of children) {
    if (c.type === 'text') return c
  }
  return undefined
}

/** main 직계 section/hero 들 반환. */
function findMainDirectSections(tree: Tree): TreeNode[] {
  const main = findMainContainer(tree.root)
  if (main === undefined) return []
  if (
    !('children' in main) ||
    !Array.isArray((main as { children?: TreeNode[] }).children)
  ) {
    return []
  }
  return (main as { children: TreeNode[] }).children.filter(
    (c) => c.type === 'section' || c.type === 'hero',
  )
}

/** 트리 전체 재귀로 특정 id 의 노드를 변환 함수로 교체. */
function transformNode(
  node: TreeNode,
  targetId: string,
  transform: (n: TreeNode) => TreeNode,
): TreeNode {
  if (node.id === targetId) return transform(node)
  if (
    'children' in node &&
    Array.isArray((node as { children?: TreeNode[] }).children)
  ) {
    const children = (node as { children: TreeNode[] }).children
    return {
      ...node,
      children: children.map((c) => transformNode(c, targetId, transform)),
    } as TreeNode
  }
  return node
}

function ensureEntranceAnimations(tree: Tree): Tree {
  let placed = 0
  let next = tree
  const mainSections = findMainDirectSections(tree)
  if (mainSections.length === 0) return tree

  // 우선순위 1: 첫 hero 의 heading → slide-up 700 trigger:load
  const firstHero = mainSections.find((s) => s.type === 'hero')
  if (firstHero !== undefined) {
    const heroHeading = findHeadingChild(firstHero)
    if (heroHeading !== undefined && !hasEntranceAnimation(heroHeading)) {
      next = {
        ...next,
        root: transformNode(next.root, heroHeading.id, (n) =>
          withEntranceAnimation(n, {
            type: 'slide-up',
            duration: 700,
            trigger: 'load',
          }),
        ),
      }
      placed += 1
    }
  }

  // 우선순위 2: main 직계 section/hero 의 _직접 자식_ 카드들 staggered slide-up 600 scroll
  // (첫 hero 의 heading 자식과 충돌 회피)
  for (const sec of mainSections) {
    if (placed >= MAX_ANIMATIONS) break
    if (
      !('children' in sec) ||
      !Array.isArray((sec as { children?: TreeNode[] }).children)
    ) {
      continue
    }
    const sectionChildren = (sec as { children: TreeNode[] }).children
    let staggerIdx = 0
    for (const card of sectionChildren) {
      if (placed >= MAX_ANIMATIONS) break
      if (hasEntranceAnimation(card)) continue
      // 첫 hero 의 heading text 자식이면 skip (이미 우선순위 1 에서 처리)
      if (sec === firstHero && card.type === 'text') continue
      const delay = staggerIdx * STAGGER_DELAY_MS
      const cardId = card.id
      next = {
        ...next,
        root: transformNode(next.root, cardId, (n) =>
          withEntranceAnimation(n, {
            type: 'slide-up',
            duration: 600,
            delay,
            trigger: 'scroll',
          }),
        ),
      }
      placed += 1
      staggerIdx += 1
    }
  }

  // 우선순위 3: 마지막 section/hero 의 heading → fade-in 500 scroll
  if (placed < MAX_ANIMATIONS) {
    const last = mainSections[mainSections.length - 1]
    if (last !== undefined) {
      const lastHeading = findHeadingChild(last)
      if (
        lastHeading !== undefined &&
        !hasEntranceAnimation(lastHeading) &&
        placed < MAX_ANIMATIONS
      ) {
        next = {
          ...next,
          root: transformNode(next.root, lastHeading.id, (n) =>
            withEntranceAnimation(n, {
              type: 'fade-in',
              duration: 500,
              trigger: 'scroll',
            }),
          ),
        }
        placed += 1
      }
    }
  }

  return next
}
