'use client'

// 노드 타입 변환 utility — UX-03 호환 매트릭스 (D-05/D-06) 의 app-level 구현.
// canConvertNodeType 으로 호환성 검사 후, 12 호환 쌍 별로 필드 매핑 + 손실 정보 반환.
// 손실 toast 문구는 UI-SPEC.md line 269-272 의 한국어 문자열 정확 일치.
// 함수 pure — input tree 비-mutation, 새 tree 반환.

import type {
  Tree,
  TreeNode,
  AccordionItem,
  CarouselItem,
} from '@dworks/tree'
import { canConvertNodeType } from './node-meta'

// ============================================================================
// 결과 인터페이스
// ============================================================================

export interface ConversionResult {
  // 변환된 새 tree (변환 불가/no-op 시 입력 tree 동일 참조 반환).
  tree: Tree
  // 변환된 노드 id — commitTreeEdit focus 용. no-op 시 입력 nodeId 그대로.
  changedNodeId: string
  // 한국어 toast 문자열 리스트 — UI-SPEC line 269-272.
  // 비호환/실패 안내도 여기 포함 (caller 가 첫 메시지를 warn toast 로 표시).
  lossWarnings: readonly string[]
}

// ============================================================================
// 손실 toast 메시지 — UI-SPEC line 269-272 정확 일치 (i18n 미래 대비 단일 export)
// ============================================================================

export const CONVERSION_LOSS_MESSAGES = {
  // button → text: button 의 href/클릭 동작이 텍스트로는 표현 불가.
  onClickLost: '버튼의 클릭 동작이 텍스트로 변환되며 사라졌습니다.',
  // carousel → image: items[1+] 손실. remaining = items.length - 1.
  carouselSlidesLost: (remaining: number) =>
    `이미지로 변환되며 첫 슬라이드만 유지되었습니다 (남은 ${remaining}개 슬라이드 제거).`,
  // accordion → list: items[].content 본문 손실.
  accordionBodyLost: '리스트로 변환되며 각 항목의 본문은 제거되었습니다.',
  // card → section: card.image 손실 — card 노드에 image 필드는 없지만 UI-SPEC 문구 보존.
  cardImageLost: '섹션으로 변환되며 이미지가 제거되었습니다.',
} as const

// ============================================================================
// 내부 헬퍼 — base props 추출 (모든 노드 공통 BaseNodeMeta 필드 가능한 한 보존)
// ============================================================================

function extractBaseProps(node: TreeNode) {
  return {
    id: node.id,
    editKind: node.editKind,
    ...(node.hidden !== undefined ? { hidden: node.hidden } : {}),
    ...(node.disabled !== undefined ? { disabled: node.disabled } : {}),
    ...(node.opacity !== undefined ? { opacity: node.opacity } : {}),
    ...(node.pointerEvents !== undefined
      ? { pointerEvents: node.pointerEvents }
      : {}),
    ...(node.cursor !== undefined ? { cursor: node.cursor } : {}),
    ...(node.responsive !== undefined ? { responsive: node.responsive } : {}),
    ...(node.styleTokens !== undefined
      ? { styleTokens: node.styleTokens }
      : {}),
    ...(node.spacing !== undefined ? { spacing: node.spacing } : {}),
    ...(node.shape !== undefined ? { shape: node.shape } : {}),
    ...(node.color !== undefined ? { color: node.color } : {}),
    ...(node.layout !== undefined ? { layout: node.layout } : {}),
    ...(node.transition !== undefined ? { transition: node.transition } : {}),
    ...(node.transform !== undefined ? { transform: node.transform } : {}),
    ...(node.position !== undefined ? { position: node.position } : {}),
    ...(node.inset !== undefined ? { inset: node.inset } : {}),
    ...(node.hideOn !== undefined ? { hideOn: node.hideOn } : {}),
    ...(node.responsiveStyle !== undefined
      ? { responsiveStyle: node.responsiveStyle }
      : {}),
    ...(node.entranceAnimation !== undefined
      ? { entranceAnimation: node.entranceAnimation }
      : {}),
  }
}

// DFS 탐색 — nodeId 매칭 노드 찾기.
function findNode(root: TreeNode, nodeId: string): TreeNode | null {
  if (root.id === nodeId) return root
  if (
    root.type === 'section' ||
    root.type === 'hero' ||
    root.type === 'card' ||
    root.type === 'list' ||
    root.type === 'form'
  ) {
    for (const child of root.children) {
      const found = findNode(child, nodeId)
      if (found) return found
    }
  }
  return null
}

// tree 의 노드 교체 — pure (immutable).
function replaceNode(
  root: TreeNode,
  nodeId: string,
  newNode: TreeNode,
): TreeNode {
  if (root.id === nodeId) return newNode
  if (
    root.type === 'section' ||
    root.type === 'hero' ||
    root.type === 'card' ||
    root.type === 'list' ||
    root.type === 'form'
  ) {
    return {
      ...root,
      children: root.children.map((child) =>
        replaceNode(child, nodeId, newNode),
      ),
    }
  }
  return root
}

// ============================================================================
// 핵심 변환 함수 — 12 호환 쌍 매핑
// ============================================================================

// 노드의 _첫 텍스트 자손_ content 추출 — accordion title 자동 생성용 fallback.
function firstTextContent(node: TreeNode): string | null {
  if (node.type === 'text') return node.content
  if (node.type === 'button') return node.label
  if (
    node.type === 'section' ||
    node.type === 'hero' ||
    node.type === 'card' ||
    node.type === 'list' ||
    node.type === 'form'
  ) {
    for (const child of node.children) {
      const found = firstTextContent(child)
      if (found) return found
    }
  }
  return null
}

// 실제 노드 변환 — switch / if-else chain 으로 12 쌍 처리.
// 실패/비호환 시 null 반환 (caller 가 no-op 처리).
function convertNode(
  node: TreeNode,
  nextType: TreeNode['type'],
  lossWarnings: string[],
): TreeNode | null {
  // no-op — 같은 type
  if (node.type === nextType) return node

  // 호환성 검사 — 비호환이면 null
  if (!canConvertNodeType(node.type, nextType)) return null

  const base = extractBaseProps(node)

  // text ↔ button
  if (node.type === 'text' && nextType === 'button') {
    return { ...base, type: 'button', label: node.content }
  }
  if (node.type === 'button' && nextType === 'text') {
    // button → text: href 있으면 클릭 동작 손실 안내 (UI-SPEC 의 onClick 문구 재사용)
    if (node.href) {
      lossWarnings.push(CONVERSION_LOSS_MESSAGES.onClickLost)
    }
    return { ...base, type: 'text', content: node.label }
  }

  // section ↔ hero ↔ card  (모두 children 보존만, 추가 필드 없음 — schema 기준)
  if (
    (node.type === 'section' ||
      node.type === 'hero' ||
      node.type === 'card') &&
    (nextType === 'section' || nextType === 'hero' || nextType === 'card')
  ) {
    // card → section 으로 변환 시 UI-SPEC 의 'card.image 손실' 안내 표시.
    // schema 상 card 자체에 image 필드는 없으나, 사용자 의도(=카드 안 이미지 영역)
    // 가 변환 의미상 사라지지 않음(children 보존). UI-SPEC 문구는 그대로 유지하되
    // _실제 card 첫 자식이 image 노드일 때만_ 안내 — 헷갈림 방지.
    if (node.type === 'card' && nextType === 'section') {
      const hasImageChild = node.children.some((c) => c.type === 'image')
      if (hasImageChild) {
        // children 은 유지되지만, "카드 → 섹션" 의미 변화 안내.
        lossWarnings.push(CONVERSION_LOSS_MESSAGES.cardImageLost)
      }
    }
    // 공용 컨테이너 변환 — children + layoutIntent 보존 시도.
    const baseLayoutIntent =
      'layoutIntent' in node ? node.layoutIntent : undefined
    if (nextType === 'section') {
      return {
        ...base,
        type: 'section',
        ...(baseLayoutIntent !== undefined
          ? { layoutIntent: baseLayoutIntent }
          : {}),
        children: node.children,
      }
    }
    if (nextType === 'hero') {
      return {
        ...base,
        type: 'hero',
        ...(baseLayoutIntent !== undefined
          ? { layoutIntent: baseLayoutIntent }
          : {}),
        children: node.children,
      }
    }
    // nextType === 'card'
    return {
      ...base,
      type: 'card',
      ...(baseLayoutIntent !== undefined
        ? { layoutIntent: baseLayoutIntent }
        : {}),
      children: node.children,
    }
  }

  // list ↔ accordion
  if (node.type === 'list' && nextType === 'accordion') {
    // list.children (TreeNode[]) → accordion.items (title + content).
    // title 은 자식의 첫 텍스트 content, 없으면 "항목 N" 자동 생성.
    const items: AccordionItem[] = node.children.map((child, i) => ({
      id: `${node.id}-item-${i + 1}`,
      title: firstTextContent(child) ?? `항목 ${i + 1}`,
      content: '',
    }))
    return { ...base, type: 'accordion', items }
  }
  if (node.type === 'accordion' && nextType === 'list') {
    // accordion.items → list.children (text 노드 배열).
    const hasBody = node.items.some((it) => it.content.trim().length > 0)
    if (hasBody) {
      lossWarnings.push(CONVERSION_LOSS_MESSAGES.accordionBodyLost)
    }
    const newChildren: TreeNode[] = node.items.map((it, i) => ({
      type: 'text',
      id: `${node.id}-item-${i + 1}`,
      editKind: 'text',
      content: it.title,
    }))
    return {
      ...base,
      type: 'list',
      children: newChildren,
    }
  }

  // image ↔ carousel
  if (node.type === 'image' && nextType === 'carousel') {
    const item: CarouselItem = {
      id: `${node.id}-item-1`,
      src: node.src,
      alt: node.alt,
      ...(node.focalPoint !== undefined ? { focalPoint: node.focalPoint } : {}),
    }
    return {
      ...base,
      type: 'carousel',
      items: [item],
      ...(node.aspectRatio !== undefined
        ? { aspectRatio: node.aspectRatio }
        : {}),
    }
  }
  if (node.type === 'carousel' && nextType === 'image') {
    const first = node.items[0]
    const extraCount = Math.max(0, node.items.length - 1)
    if (extraCount > 0) {
      lossWarnings.push(
        CONVERSION_LOSS_MESSAGES.carouselSlidesLost(extraCount),
      )
    }
    return {
      ...base,
      type: 'image',
      src: first?.src ?? '',
      alt: first?.alt ?? '',
      ...(first?.focalPoint !== undefined
        ? { focalPoint: first.focalPoint }
        : {}),
      ...(node.aspectRatio !== undefined
        ? { aspectRatio: node.aspectRatio }
        : {}),
    }
  }

  // 매트릭스에 정의됐지만 본 함수에서 미처 처리 못한 쌍 — defensive null
  return null
}

// ============================================================================
// public API — convertNodeType
// ============================================================================

export function convertNodeType(
  tree: Tree,
  nodeId: string,
  nextType: TreeNode['type'],
): ConversionResult {
  const target = findNode(tree.root, nodeId)
  if (!target) {
    return {
      tree,
      changedNodeId: nodeId,
      lossWarnings: ['변환 대상 노드를 찾을 수 없습니다.'],
    }
  }

  // no-op — 같은 type
  if (target.type === nextType) {
    return { tree, changedNodeId: nodeId, lossWarnings: [] }
  }

  // 비호환
  if (!canConvertNodeType(target.type, nextType)) {
    return {
      tree,
      changedNodeId: nodeId,
      lossWarnings: [`변환 불가: ${target.type} → ${nextType} 은 지원되지 않습니다.`],
    }
  }

  const lossWarnings: string[] = []
  const newNode = convertNode(target, nextType, lossWarnings)
  if (!newNode) {
    return {
      tree,
      changedNodeId: nodeId,
      lossWarnings: ['변환 처리 중 오류가 발생했습니다.'],
    }
  }

  const newRoot = replaceNode(tree.root, nodeId, newNode)
  return {
    tree: { ...tree, root: newRoot },
    changedNodeId: newNode.id,
    lossWarnings,
  }
}
