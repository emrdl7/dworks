// LLM 생성 트리 normalize — schema 통과한 응답에 대해 _구조적 일관성_ 보강.
//
// design-resolver가 type별 default를 _런타임에_ 채워주므로, normalize는 schema
// 외 _구조 자체의 무결성_만 다룬다:
//   - id 중복 자동 rename (schema에 unique 검사 없음 — 같은 id가 두 노드에 박히면
//     인스펙터/캔버스의 querySelector가 첫 매치로 잘못 동작)
//   - root이 section이 아닌 경우 wrapper section 보강 (LLM이 단편 응답 시)
//   - 풍부도 13 신호 자동 보강 (validateTreeRichness missing[] 기반 — idempotent + safe 변환만)
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

// ─────── Sub-routines (Task 2, Task 3 에서 추가) ───────

function ensureInteractiveComponent(tree: Tree, _domain: DomainKey): Tree {
  // Task 2 에서 구현. 현재는 그대로 반환 (no-op stub).
  return tree
}

function ensureEntranceAnimations(tree: Tree): Tree {
  // Task 3 에서 구현. 현재는 그대로 반환 (no-op stub).
  return tree
}
