'use client'

// UX-05 정렬/분포 hook — 8 단축키 (Alt+A/H/D/W/V/S, Alt+Shift+H/V).
//
// 동작 요약 (D-14..D-16, UI-SPEC line 207-227):
//   - 정렬 (≥2 선택): 좌(Alt+A) / 가운데가로(Alt+H) / 우(Alt+D) / 상(Alt+W) /
//     가운데세로(Alt+V) / 하(Alt+S).
//   - 분포 (≥3 선택): 가로 균등(Alt+Shift+H) / 세로 균등(Alt+Shift+V).
//   - _공통 부모_ 단위로 그룹화 — 다른 부모 자식들은 따로 정렬 (각 그룹 안에서만).
//   - 자식 layout 이 absolute 아니면 toast 경고 + 그 그룹 skip (D-16).
//   - selected 노드 부족 (정렬 < 2 / 분포 < 3) 시 한국어 toast 경고.
//
// 좌표 — DOM 측정 (getBoundingClientRect) + canvasZoom 보정 → logical px. inset 값은
// _부모 노드 기준 상대 좌표_ (childRect - parentRect).
//
// onAnnounce — 정렬/분포 commit 성공 시 한국어 액션 이름 ("좌측 정렬", "가로 균등 분포" 등)
// 호출 — page.tsx 가 aria-live polite 영역에 알림 (UI-SPEC line 327, 체커 warning fix).

import { useCallback, useEffect, type RefObject } from 'react'
import type { NodeInset, Tree, TreeNode } from '@dworks/tree'
import { updateNodeMeta } from '@dworks/tree-editor'

// 8개 정렬/분포 액션 한국어 이름 — onAnnounce 호출 페이로드 (UI-SPEC line 327).
const ALIGN_ACTION_NAMES = {
  alignLeft: '좌측 정렬',
  alignCenter: '가로 중앙 정렬',
  alignRight: '우측 정렬',
  alignTop: '상단 정렬',
  alignMiddle: '세로 중앙 정렬',
  alignBottom: '하단 정렬',
  distributeH: '가로 균등 분포',
  distributeV: '세로 균등 분포',
} as const

// 한국어 경고 toast 문구 (UI-SPEC line 224-226).
const WARN_NEED_2_NODES = '정렬에는 2개 이상의 노드 선택이 필요합니다.'
const WARN_NEED_3_NODES = '분포에는 3개 이상의 노드 선택이 필요합니다.'
const WARN_NON_ABSOLUTE = '정렬은 절대 위치(position: absolute) 노드에만 적용됩니다.'

// DFS — 트리에서 id 로 노드 찾기.
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

// DFS — child id 의 부모 노드 찾기. root 의 직계 자식이면 root 반환.
function findParent(root: TreeNode, childId: string): TreeNode | null {
  if ('children' in root && Array.isArray(root.children)) {
    for (const child of root.children) {
      if (child.id === childId) return root
      const found = findParent(child, childId)
      if (found) return found
    }
  }
  return null
}

// 같은 부모 노드끼리 자식들을 그룹화 — 정렬/분포는 공통 부모 안에서만 (D-16).
function groupByParent(
  tree: Tree,
  ids: ReadonlySet<string>,
): Map<TreeNode, TreeNode[]> {
  const groups = new Map<TreeNode, TreeNode[]>()
  ids.forEach((id) => {
    if (id === tree.root.id) return // root 는 정렬 대상 아님
    const node = findNodeById(tree.root, id)
    if (!node) return
    const parent = findParent(tree.root, id)
    if (!parent) return
    const arr = groups.get(parent) ?? []
    arr.push(node)
    groups.set(parent, arr)
  })
  return groups
}

// position 이 'absolute' 인지 — 정렬 가능 여부 판단 (D-16).
function isAbsolute(node: TreeNode): boolean {
  return node.position === 'absolute'
}

// DOM 측정 — node id 의 logical 좌표/크기 (canvas wrapper 기준, zoom 보정).
// 부모 / 자식 모두 본 헬퍼로 측정 후 자식의 inset 을 부모 기준 상대 좌표로 계산.
function measureNodeRect(
  nodeId: string,
  wrapper: HTMLElement | null,
  zoom: number,
): { logicalX: number; logicalY: number; logicalW: number; logicalH: number } | null {
  if (!wrapper) return null
  if (typeof document === 'undefined') return null
  const el = document.querySelector<HTMLElement>(
    `[data-dworks-node-id="${CSS.escape(nodeId)}"]`,
  )
  if (!el) return null
  const r = el.getBoundingClientRect()
  const wrapperRect = wrapper.getBoundingClientRect()
  const z = zoom > 0 ? zoom : 1
  return {
    logicalX: (r.left - wrapperRect.left + wrapper.scrollLeft) / z,
    logicalY: (r.top - wrapperRect.top + wrapper.scrollTop) / z,
    logicalW: r.width / z,
    logicalH: r.height / z,
  }
}

// 노드 inset 패치 적용 — updateNodeMeta 로 immutable 트리 반환. 기존 inset 과 merge.
function setNodeInsetPatch(
  tree: Tree,
  nodeId: string,
  patch: Partial<NodeInset>,
): Tree {
  const existing = findNodeById(tree.root, nodeId)
  if (!existing) return tree
  const merged: NodeInset = { ...(existing.inset ?? {}), ...patch }
  return updateNodeMeta(tree, nodeId, { inset: merged })
}

export interface UseAlignDistributeArgs {
  /** 활성화 가드 — 팔레트/모달 등 열림 중이거나 boxSelect.active 시 false. */
  enabled: boolean
  /** 현재 트리 — 매 commit 마다 새 참조. */
  tree: Tree
  /** 다중 선택 노드 id 집합 (primary + additional). */
  selectedIds: ReadonlySet<string>
  /** 캔버스 wrapper ref — DOM 측정 기준 좌표 계산용. */
  canvasScrollRef: RefObject<HTMLElement | null>
  /** 현재 canvas zoom (0.25..2). */
  canvasZoom: number
  /** page.tsx 의 commitTreeEdit 래퍼. */
  onCommit: (nextTree: Tree, focusId: string) => void
  /** page.tsx 의 showToast(msg, 'warn') 래퍼. */
  onWarn: (message: string) => void
  /**
   * aria-live polite 한국어 액션 알림 — 성공 commit 시에만 호출 (UI-SPEC line 327).
   * undefined 면 호출 안 함 — runtime 안전.
   */
  onAnnounce?: (message: string) => void
}

/**
 * 정렬/분포 hook — 8 단축키 keydown 핸들러 + 6 정렬 + 2 분포 액션 등록.
 *
 * 캔버스에 마운트되어 있을 때 단 1회 호출. enabled 가 false 면 keydown 이 등록 안 됨.
 */
export function useAlignDistribute(args: UseAlignDistributeArgs): void {
  const {
    enabled,
    tree,
    selectedIds,
    canvasScrollRef,
    canvasZoom,
    onCommit,
    onWarn,
    onAnnounce,
  } = args

  // 공통 정렬 처리 — getKey 가 노드 rect 에서 정렬 기준 좌표 (number) 반환.
  // updateInset 이 rect 차이 + 그룹 기준값으로 새 inset 패치 반환.
  // 모든 그룹에 대해 검증 + commit 까지 단일 핸들러로 통일.
  const performAlign = useCallback(
    (
      actionKey: keyof typeof ALIGN_ACTION_NAMES,
      axis: 'x' | 'y',
      anchor: 'min' | 'center' | 'max',
    ) => {
      if (selectedIds.size < 2) {
        onWarn(WARN_NEED_2_NODES)
        return
      }
      const wrapper = canvasScrollRef.current
      const groups = groupByParent(tree, selectedIds)
      if (groups.size === 0) return
      let nextTree = tree
      let focusId: string | null = null
      let anyApplied = false
      let warnedAbsolute = false
      groups.forEach((children, parent) => {
        // 그룹 안에서 absolute 가 아닌 자식이 하나라도 있으면 그 그룹 skip + 1회 toast.
        const nonAbsolute = children.find((c) => !isAbsolute(c))
        if (nonAbsolute) {
          if (!warnedAbsolute) {
            onWarn(WARN_NON_ABSOLUTE)
            warnedAbsolute = true
          }
          return
        }
        const parentRect = measureNodeRect(parent.id, wrapper, canvasZoom)
        if (!parentRect) return
        const rects = children
          .map((c) => ({ node: c, rect: measureNodeRect(c.id, wrapper, canvasZoom) }))
          .filter((r): r is { node: TreeNode; rect: NonNullable<typeof r.rect> } => r.rect !== null)
        if (rects.length < 2) return
        // 그룹 기준 좌표 계산.
        let groupAnchor: number
        if (axis === 'x') {
          const mins = rects.map((r) => r.rect.logicalX)
          const maxs = rects.map((r) => r.rect.logicalX + r.rect.logicalW)
          if (anchor === 'min') groupAnchor = Math.min(...mins)
          else if (anchor === 'max') groupAnchor = Math.max(...maxs)
          else groupAnchor =
            rects.reduce((sum, r) => sum + r.rect.logicalX + r.rect.logicalW / 2, 0) /
            rects.length
        } else {
          const mins = rects.map((r) => r.rect.logicalY)
          const maxs = rects.map((r) => r.rect.logicalY + r.rect.logicalH)
          if (anchor === 'min') groupAnchor = Math.min(...mins)
          else if (anchor === 'max') groupAnchor = Math.max(...maxs)
          else groupAnchor =
            rects.reduce((sum, r) => sum + r.rect.logicalY + r.rect.logicalH / 2, 0) /
            rects.length
        }
        // 각 자식의 새 inset 적용 — 부모 기준 상대 좌표.
        for (const r of rects) {
          let newAxisLogical: number
          if (anchor === 'min') newAxisLogical = groupAnchor
          else if (anchor === 'max')
            newAxisLogical =
              groupAnchor - (axis === 'x' ? r.rect.logicalW : r.rect.logicalH)
          else
            newAxisLogical =
              groupAnchor - (axis === 'x' ? r.rect.logicalW / 2 : r.rect.logicalH / 2)
          const relative =
            newAxisLogical -
            (axis === 'x' ? parentRect.logicalX : parentRect.logicalY)
          const patch: Partial<NodeInset> =
            axis === 'x' ? { left: relative } : { top: relative }
          nextTree = setNodeInsetPatch(nextTree, r.node.id, patch)
          if (focusId === null) focusId = r.node.id
          anyApplied = true
        }
      })
      if (anyApplied && focusId) {
        onCommit(nextTree, focusId)
        onAnnounce?.(ALIGN_ACTION_NAMES[actionKey])
      }
    },
    [tree, selectedIds, canvasScrollRef, canvasZoom, onCommit, onWarn, onAnnounce],
  )

  const alignLeft = useCallback(() => performAlign('alignLeft', 'x', 'min'), [performAlign])
  const alignCenterH = useCallback(() => performAlign('alignCenter', 'x', 'center'), [performAlign])
  const alignRight = useCallback(() => performAlign('alignRight', 'x', 'max'), [performAlign])
  const alignTop = useCallback(() => performAlign('alignTop', 'y', 'min'), [performAlign])
  const alignCenterV = useCallback(() => performAlign('alignMiddle', 'y', 'center'), [performAlign])
  const alignBottom = useCallback(() => performAlign('alignBottom', 'y', 'max'), [performAlign])

  // 분포 — 가로/세로 균등. leftmost/rightmost (or top/bottom) 고정, 중간 균등 배치.
  const performDistribute = useCallback(
    (actionKey: 'distributeH' | 'distributeV', axis: 'x' | 'y') => {
      if (selectedIds.size < 3) {
        onWarn(WARN_NEED_3_NODES)
        return
      }
      const wrapper = canvasScrollRef.current
      const groups = groupByParent(tree, selectedIds)
      if (groups.size === 0) return
      let nextTree = tree
      let focusId: string | null = null
      let anyApplied = false
      let warnedAbsolute = false
      groups.forEach((children, parent) => {
        if (children.length < 3) return // 부모별 3 미만이면 그 그룹 skip
        const nonAbsolute = children.find((c) => !isAbsolute(c))
        if (nonAbsolute) {
          if (!warnedAbsolute) {
            onWarn(WARN_NON_ABSOLUTE)
            warnedAbsolute = true
          }
          return
        }
        const parentRect = measureNodeRect(parent.id, wrapper, canvasZoom)
        if (!parentRect) return
        const rects = children
          .map((c) => ({ node: c, rect: measureNodeRect(c.id, wrapper, canvasZoom) }))
          .filter((r): r is { node: TreeNode; rect: NonNullable<typeof r.rect> } => r.rect !== null)
        if (rects.length < 3) return
        // 정렬 후 균등 — 시작/끝 고정, 중간 노드만 재배치.
        rects.sort((a, b) =>
          axis === 'x'
            ? a.rect.logicalX - b.rect.logicalX
            : a.rect.logicalY - b.rect.logicalY,
        )
        const first = rects[0]
        const last = rects[rects.length - 1]
        if (!first || !last) return
        const firstStart = axis === 'x' ? first.rect.logicalX : first.rect.logicalY
        const lastStart = axis === 'x' ? last.rect.logicalX : last.rect.logicalY
        const span = lastStart - firstStart
        const step = span / (rects.length - 1)
        for (let i = 1; i < rects.length - 1; i++) {
          const r = rects[i]
          if (!r) continue
          const newLogical = firstStart + step * i
          const relative =
            newLogical -
            (axis === 'x' ? parentRect.logicalX : parentRect.logicalY)
          const patch: Partial<NodeInset> =
            axis === 'x' ? { left: relative } : { top: relative }
          nextTree = setNodeInsetPatch(nextTree, r.node.id, patch)
          if (focusId === null) focusId = r.node.id
          anyApplied = true
        }
      })
      if (anyApplied && focusId) {
        onCommit(nextTree, focusId)
        onAnnounce?.(ALIGN_ACTION_NAMES[actionKey])
      }
    },
    [tree, selectedIds, canvasScrollRef, canvasZoom, onCommit, onWarn, onAnnounce],
  )

  const distributeH = useCallback(() => performDistribute('distributeH', 'x'), [performDistribute])
  const distributeV = useCallback(() => performDistribute('distributeV', 'y'), [performDistribute])

  // 8 단축키 — Alt + (A/H/D/W/V/S) 정렬, Alt+Shift + (H/V) 분포.
  useEffect(() => {
    if (!enabled) return
    function onKeyDown(event: globalThis.KeyboardEvent) {
      // INPUT/TEXTAREA/contentEditable 가드.
      const target = event.target
      if (target instanceof HTMLElement) {
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return
        }
      }
      // ⌘/Ctrl 충돌 회피 (브라우저 hide / 저장 단축키 보호).
      if (event.metaKey || event.ctrlKey) return
      // 모든 정렬/분포 단축키는 Alt 필수.
      if (!event.altKey) return

      const key = event.key.toLowerCase()
      if (event.shiftKey) {
        // 분포 — Alt+Shift+H/V.
        if (key === 'h') {
          event.preventDefault()
          distributeH()
        } else if (key === 'v') {
          event.preventDefault()
          distributeV()
        }
        return
      }
      // 정렬 — Alt+A/H/D/W/V/S.
      switch (key) {
        case 'a':
          event.preventDefault()
          alignLeft()
          break
        case 'h':
          event.preventDefault()
          alignCenterH()
          break
        case 'd':
          event.preventDefault()
          alignRight()
          break
        case 'w':
          event.preventDefault()
          alignTop()
          break
        case 'v':
          event.preventDefault()
          alignCenterV()
          break
        case 's':
          event.preventDefault()
          alignBottom()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    enabled,
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    distributeH,
    distributeV,
  ])
}
