// LLM 생성 트리 normalize — schema 통과한 응답에 대해 _구조적 일관성_ 보강.
//
// design-resolver가 type별 default를 _런타임에_ 채워주므로, normalize는 schema
// 외 _구조 자체의 무결성_만 다룬다:
//   - id 중복 자동 rename (schema에 unique 검사 없음 — 같은 id가 두 노드에 박히면
//     인스펙터/캔버스의 querySelector가 첫 매치로 잘못 동작)
//   - root이 section이 아닌 경우 wrapper section 보강 (LLM이 단편 응답 시)
//
// AI 자유도 ↑로 LLM이 _자유롭게 override_를 박아도 resolver와 정합 — 이 normalize
// 의 역할은 _구조적 안전망_에 그친다.

import type { Tree, TreeNode } from '@dworks/tree'

interface NormalizeContext {
  // root이 section이 아니면 wrap 시 사용할 ID prefix
  fallbackRootId?: string
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
  return { ...tree, root: deduped }
}
