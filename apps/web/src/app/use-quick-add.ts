'use client'
// Figma 스타일 quick-add 단축키 hook.
// 캔버스 포커스 + 비편집 상태에서 T/B/I/R/C/H/L/F 등 단일 키로 노드를 트리에 즉시 추가.
// 추가 위치 분기 (D-18):
//   1) 선택된 노드가 컨테이너 → 그 children 에 append
//   2) 선택된 노드가 leaf → 부모에 sibling 으로 추가
//   3) 선택 없음 → root 에 append

import { useEffect } from 'react'

import type { Tree, TreeNode } from '@dworks/tree'
import type { ContainerNodeType, LeafNodeType } from '@dworks/tree-editor'

// UX-SPEC line 231-243 — Shift 없는 단일 키 매핑.
// (NOTE: carousel/tabs/accordion/modal 은 tree-editor 에 add 연산이 없어 현재는 no-op.
//  cheatsheet 에는 표기하되 실제 핸들러 호출은 건너뜀 — 후속 plan 에서 editor 확장 시 자동 활성.)
const QUICK_ADD_KEYS: Readonly<Record<string, TreeNode['type']>> = {
  t: 'text',
  b: 'button',
  i: 'image',
  r: 'section', // R = rectangle 연상 → section
  c: 'card',
  h: 'hero',
  l: 'list',
  f: 'form',
  a: 'accordion',
  m: 'modal',
}

// Shift+ 조합 — C/T 가 card/text 와 충돌하므로 carousel/tabs 는 Shift 조합.
const QUICK_ADD_SHIFT_KEYS: Readonly<Record<string, TreeNode['type']>> = {
  c: 'carousel',
  t: 'tabs',
}

// tree-editor 가 add 연산을 제공하는 leaf 노드 타입 (3 종).
const LEAF_TYPES: ReadonlySet<TreeNode['type']> = new Set<TreeNode['type']>([
  'text',
  'button',
  'image',
])

// tree-editor 의 ContainerNodeType 과 동일 (section/hero/card/list/form, 5 종).
// 컨테이너 분기 _목적_ 으로는 carousel/tabs/accordion/modal 도 컨테이너성 노드지만
// add 연산이 없으므로 EDITABLE_CONTAINER_TYPES 에만 포함 → 핸들러 호출 대상.
const EDITABLE_CONTAINER_TYPES: ReadonlySet<ContainerNodeType> =
  new Set<ContainerNodeType>(['section', 'hero', 'card', 'list', 'form'])

// 선택 노드의 _컨테이너성_ 판단 — carousel/tabs/accordion/modal 도 children 이 없어
// sibling 로 추가하는 게 자연스러우므로 EDITABLE_CONTAINER_TYPES 만 컨테이너로 본다.
function isEditableContainer(node: TreeNode): node is TreeNode & {
  type: ContainerNodeType
} {
  return EDITABLE_CONTAINER_TYPES.has(node.type as ContainerNodeType)
}

// page.tsx 의 동일 패턴 그대로 — DRY 보다 hook 자기-완결성 우선.
function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

// DFS 로 nodeId 찾기.
function findNodeById(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root
  if ('children' in root && Array.isArray(root.children)) {
    for (const child of root.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  return null
}

export interface UseQuickAddArgs {
  enabled: boolean
  tree: Tree
  selectedNodeId: string | null
  // tree.root.id — 선택 없을 때 fallback parent.
  rootId: string
  onAddLeafChild: (parentId: string, type: LeafNodeType) => void
  onAddLeafSibling: (siblingId: string, type: LeafNodeType) => void
  onAddContainerChild: (parentId: string, type: ContainerNodeType) => void
  onAddContainerSibling: (siblingId: string, type: ContainerNodeType) => void
}

export function useQuickAddShortcuts(args: UseQuickAddArgs): void {
  const {
    enabled,
    tree,
    selectedNodeId,
    rootId,
    onAddLeafChild,
    onAddLeafSibling,
    onAddContainerChild,
    onAddContainerSibling,
  } = args

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(event: globalThis.KeyboardEvent) {
      // 가드 1: 입력 필드 / contenteditable 에서는 무시.
      if (isEditableTarget(event.target)) return
      // 가드 2: meta/ctrl/alt modifier 가 있으면 무시 (Shift 만 예외 — Shift+C/Shift+T 처리).
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const key = event.key.toLowerCase()
      const targetType = event.shiftKey
        ? QUICK_ADD_SHIFT_KEYS[key]
        : QUICK_ADD_KEYS[key]
      if (!targetType) return

      // 매핑된 키였으므로 브라우저 기본 동작 차단 (예: Backspace 같은 건 없지만 안전망).
      event.preventDefault()

      // 위치 분기 — D-18.
      const selectedNode = selectedNodeId
        ? findNodeById(tree.root, selectedNodeId)
        : null
      const isLeaf = LEAF_TYPES.has(targetType)

      if (!selectedNode || selectedNode.id === rootId) {
        // 선택 없음 OR root 선택 → root 에 append.
        if (isLeaf) {
          onAddLeafChild(rootId, targetType as LeafNodeType)
        } else if (EDITABLE_CONTAINER_TYPES.has(targetType as ContainerNodeType)) {
          onAddContainerChild(rootId, targetType as ContainerNodeType)
        }
        // 그 외 (carousel/tabs/accordion/modal): tree-editor 미지원 — no-op.
        return
      }

      if (isEditableContainer(selectedNode)) {
        // 선택 노드가 컨테이너 → children 에 append.
        if (isLeaf) {
          onAddLeafChild(selectedNode.id, targetType as LeafNodeType)
        } else if (
          EDITABLE_CONTAINER_TYPES.has(targetType as ContainerNodeType)
        ) {
          onAddContainerChild(selectedNode.id, targetType as ContainerNodeType)
        }
        return
      }

      // 선택 노드가 leaf (또는 carousel/tabs/accordion/modal 등 non-container) → 부모에 sibling.
      if (isLeaf) {
        onAddLeafSibling(selectedNode.id, targetType as LeafNodeType)
      } else if (EDITABLE_CONTAINER_TYPES.has(targetType as ContainerNodeType)) {
        onAddContainerSibling(selectedNode.id, targetType as ContainerNodeType)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    enabled,
    tree,
    selectedNodeId,
    rootId,
    onAddLeafChild,
    onAddLeafSibling,
    onAddContainerChild,
    onAddContainerSibling,
  ])
}
