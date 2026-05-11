// SelectableNode + CanvasNodeToolbar — 캔버스 렌더된 노드 wrapper.
// page.tsx 분할(Phase 6)에서 분리. CanvasNode가 노드 type별 콘텐츠를 만든 뒤
// 이걸 SelectableNode로 감싸 click/hover/keyboard 선택 + 툴바 표시.

import {
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

import type { TreeNode } from '@dworks/tree'

import {
  CanvasHoverContext,
  CanvasReadOnlyContext,
  CanvasSelectionContext,
  CanvasToolbarContext,
  CanvasViewportContext,
} from './canvas-contexts'
import { resolveTransform } from './design-resolver'
import {
  getPositionStyle,
  getTransformStyle,
  getTransitionStyle,
} from './design-style'
import { nodeTypeIcons, nodeTypeLabels } from './node-meta'

interface CanvasToolbarButtonProps {
  ariaLabel: string
  disabled?: boolean
  icon: LucideIcon
  onClick: () => void
  shortcut?: string
  tone?: 'neutral' | 'danger'
}

function CanvasToolbarButton({
  ariaLabel,
  disabled = false,
  icon: Icon,
  onClick,
  shortcut,
  tone = 'neutral',
}: CanvasToolbarButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-[var(--dw-ui-danger-text)] hover:bg-[var(--dw-ui-danger-bg)] focus-visible:bg-[var(--dw-ui-danger-bg)]'
      : 'text-[var(--dw-ui-text-body)] hover:bg-[var(--dw-ui-soft)] focus-visible:bg-[var(--dw-ui-soft)]'

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={shortcut ? `${ariaLabel} (${shortcut})` : ariaLabel}
      className={`inline-flex h-6 w-6 items-center justify-center rounded outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dw-accent)] disabled:cursor-not-allowed disabled:text-[var(--dw-ui-text-faint)] disabled:hover:bg-transparent ${toneClass}`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation()
        }
      }}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
    </button>
  )
}

function CanvasNodeToolbar({ nodeId }: { nodeId: string }) {
  const ctx = useContext(CanvasToolbarContext)
  if (ctx === null || ctx.selectedNodeId !== nodeId) {
    return null
  }

  const {
    selectedStructureInfo: info,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
  } = ctx

  if (info.isRoot) {
    return null
  }

  const canMoveUp = (info.index ?? 0) > 0
  const canMoveDown = (info.index ?? 0) < (info.siblingCount ?? 0) - 1

  return (
    <div
      role="toolbar"
      aria-label="선택 노드 툴바"
      className="pointer-events-auto absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-md border border-[var(--dw-ui-border)] bg-[var(--dw-ui-elevated)] px-1 py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    >
      <CanvasToolbarButton
        ariaLabel="위로 이동"
        shortcut="⌘↑"
        disabled={!canMoveUp}
        icon={ArrowUp}
        onClick={onMoveUp}
      />
      <CanvasToolbarButton
        ariaLabel="아래로 이동"
        shortcut="⌘↓"
        disabled={!canMoveDown}
        icon={ArrowDown}
        onClick={onMoveDown}
      />
      <CanvasToolbarButton
        ariaLabel="복제"
        shortcut="⌘D"
        icon={Copy}
        onClick={onDuplicate}
      />
      <CanvasToolbarButton
        ariaLabel="삭제"
        shortcut="Del"
        icon={Trash2}
        onClick={onDelete}
        tone="danger"
      />
    </div>
  )
}

export interface SelectableNodeProps {
  node: TreeNode
  selectedNodeId: string
  onSelect: (nodeId: string) => void
  children: ReactNode
}

export function SelectableNode({
  node,
  selectedNodeId,
  onSelect,
  children,
}: SelectableNodeProps) {
  const readOnly = useContext(CanvasReadOnlyContext)
  const { hoveredNodeId, setHoveredNodeId } = useContext(CanvasHoverContext)
  const _selectionCtxTopLevel = useContext(CanvasSelectionContext)
  const viewport = useContext(CanvasViewportContext)
  // viewport-merged transform — mobile/tablet에 transform override 있으면 그게 base를 덮음.
  const transformStyle = getTransformStyle(resolveTransform(node, viewport))
  const transitionStyle = getTransitionStyle(node.transition)
  // node.position(absolute/sticky/fixed)은 wrapper에 적용 — wrapper가 정상 flow를
  // 떠나야 부모 안에서 떠있는 layer가 됨. 내부 section에 박으면 wrapper 안에 갇힘.
  const positionStyle = getPositionStyle(node.position, node.inset)

  // entranceAnimation 미리보기 — 선택될 때마다 한 번 재생. (hooks는 readOnly 분기 위)
  const anim = node.entranceAnimation
  const isPrimaryForEntrance = !readOnly && node.id === selectedNodeId
  const [entrancePlaying, setEntrancePlaying] = useState(false)
  useEffect(() => {
    if (!anim || !isPrimaryForEntrance) {
      setEntrancePlaying(false)
      return
    }
    setEntrancePlaying(true)
    const total = (anim.duration ?? 600) + (anim.delay ?? 0) + 100
    const timer = window.setTimeout(() => setEntrancePlaying(false), total)
    return () => window.clearTimeout(timer)
  }, [anim, isPrimaryForEntrance])
  const entranceStyle: CSSProperties =
    entrancePlaying && anim
      ? {
          animationName: `dw-entrance-${anim.type}`,
          animationDuration: `${anim.duration ?? 600}ms`,
          animationDelay: `${anim.delay ?? 0}ms`,
          animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          animationFillMode: 'both',
        }
      : {}

  if (readOnly) {
    const readOnlyStyle: CSSProperties = {
      pointerEvents: 'none',
      ...(node.opacity === undefined ? {} : { opacity: node.opacity }),
      ...(transitionStyle ?? {}),
      ...(transformStyle ?? {}),
      ...(positionStyle ?? {}),
    }
    return (
      <div className="border border-transparent" style={readOnlyStyle}>
        {children}
      </div>
    )
  }

  const selectionCtx = _selectionCtxTopLevel
  const isPrimary = node.id === selectedNodeId
  const isInSelection = selectionCtx.allSelectedIds.has(node.id)
  const isCanvasSelectable = node.pointerEvents !== 'none'
  const isHovered = hoveredNodeId === node.id && !isInSelection

  const nodeMetaStyle: CSSProperties = {
    pointerEvents: isCanvasSelectable ? 'auto' : 'none',
    ...(node.opacity === undefined ? {} : { opacity: node.opacity }),
    ...(node.cursor === undefined ? {} : { cursor: node.cursor }),
    ...(transitionStyle ?? {}),
    ...(transformStyle ?? {}),
    ...(positionStyle ?? {}),
    ...entranceStyle,
  }

  function selectNode(modifiers?: { shift?: boolean; meta?: boolean }) {
    if (!isCanvasSelectable) {
      return
    }
    // Shift = 범위 선택 (primary~target). Cmd/Ctrl = 개별 토글.
    if (modifiers?.shift === true) {
      selectionCtx.selectRange(node.id)
      return
    }
    if (modifiers?.meta === true) {
      selectionCtx.toggleAdditional(node.id)
      return
    }
    onSelect(node.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!isCanvasSelectable) {
      return
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    selectNode({
      shift: event.shiftKey,
      meta: event.metaKey || event.ctrlKey,
    })
  }

  return (
    <div
      role="button"
      tabIndex={isCanvasSelectable ? 0 : -1}
      data-dworks-node-id={node.id}
      className={`group/dwnode relative border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-accent)] ${
        isPrimary
          ? 'border-[var(--dw-accent)] shadow-[0_0_0_3px_var(--dw-selection-ring)]'
          : isInSelection
            ? 'border-[var(--dw-accent)] shadow-[0_0_0_2px_rgba(99,102,241,0.45)]'
            : isHovered
              ? 'border-[var(--dw-accent)]/60 shadow-[0_0_0_2px_rgba(99,102,241,0.3)]'
              : 'border-transparent hover:border-[var(--dw-border)]'
      }`}
      style={nodeMetaStyle}
      onMouseEnter={() => {
        if (isCanvasSelectable) setHoveredNodeId(node.id)
      }}
      onMouseLeave={() => {
        if (isCanvasSelectable && hoveredNodeId === node.id) {
          setHoveredNodeId(null)
        }
      }}
      onClick={(event) => {
        event.stopPropagation()
        // Space drag로 panning 시작했으면 click 무시 (selection 변경 방지)
        if (selectionCtx.isPanActive) return
        selectNode({
          shift: event.shiftKey,
          meta: event.metaKey || event.ctrlKey,
        })
      }}
      onDoubleClick={(event) => {
        // 텍스트/버튼/이미지: 더블클릭 → 인스펙터의 콘텐츠 input/textarea로 focus 이동
        // 사용자가 캔버스에서 직접 편집하는 mental model
        event.stopPropagation()
        if (selectionCtx.isPanActive) return
        if (
          node.type !== 'text' &&
          node.type !== 'button' &&
          node.type !== 'image'
        )
          return
        // 1) 노드 선택 (보통 이미 선택됨)
        onSelect(node.id)
        // 2) 콘텐츠 탭으로 명시 전환 — 이전엔 활성 탭에 input이 없으면 실패했음
        requestAnimationFrame(() => {
          const tabBtn = document.getElementById('inspector-tab-content')
          tabBtn?.click()
          // 3) 탭 전환 후 다음 frame에서 panel 안의 input 찾아 focus + select
          requestAnimationFrame(() => {
            const panel = document.getElementById(
              'inspector-tabpanel-content',
            )
            if (!panel) return
            const target =
              panel.querySelector<HTMLTextAreaElement | HTMLInputElement>(
                'textarea, input[type="text"]',
              )
            if (target) {
              target.focus()
              if (target instanceof HTMLTextAreaElement) {
                target.select()
              } else if (target instanceof HTMLInputElement) {
                target.select()
              }
            }
          })
        })
      }}
      onKeyDown={handleKeyDown}
    >
      {isPrimary ? (
        <span className="pointer-events-none absolute -top-3 left-2 z-10 inline-flex items-center gap-1 rounded bg-[var(--dw-accent)] px-2 py-1 text-[11px] font-semibold text-[var(--dw-accent-text)]">
          {(() => {
            const Icon = nodeTypeIcons[node.type]
            return <Icon aria-hidden="true" size={11} />
          })()}
          {nodeTypeLabels[node.type]}
        </span>
      ) : null}
      {isPrimary ? <CanvasNodeToolbar nodeId={node.id} /> : null}
      {children}
    </div>
  )
}
