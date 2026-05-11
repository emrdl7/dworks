'use client'

// Inspector 패널 공통 atomic 컴포넌트 — page.tsx 분할(Phase 6)에서 분리.
// SpacingControls/LayoutControls/ShapeControls/NodeColorControls/TypographyControls
// + UX-03 NodeTypeConvertDropdown 등이 공유.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'

import { ChevronDown, type LucideIcon } from 'lucide-react'

import type { TreeNode } from '@dworks/tree'

import {
  canConvertNodeType,
  nodeTypeConversionDisabledReason,
  nodeTypeIcons,
  nodeTypeLabels,
} from './node-meta'

export interface InspectorDisclosureControl {
  onOpenChange: (next: boolean) => void
  open: boolean
}

interface InspectorDisclosureProps {
  actionLabel?: string
  children: ReactNode
  defaultOpen?: boolean
  description?: string
  // 노드에 명시 override가 있는 영역인지 — true면 title 옆에 작은 dot으로 표시
  hasExplicit?: boolean
  isActionDisabled?: boolean
  onAction?: () => void
  onOpenChange?: (next: boolean) => void
  open?: boolean
  summaryEnd?: ReactNode
  title: string
}

export function DisclosureChevron() {
  return (
    <svg
      aria-hidden="true"
      className="dw-chevron h-4 w-4 text-[var(--dw-ui-text-muted)] transition-transform"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function InspectorDisclosure({
  actionLabel,
  children,
  defaultOpen = true,
  description,
  hasExplicit = false,
  isActionDisabled = false,
  onAction,
  onOpenChange,
  open,
  summaryEnd,
  title,
}: InspectorDisclosureProps) {
  const isControlled = open !== undefined && onOpenChange !== undefined
  const detailsOpen = isControlled ? open : defaultOpen

  return (
    <details
      className="rounded-[var(--dw-radius-md)] border border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] transition-[border-color] duration-[var(--dw-motion-base)] [&[open]>summary_.dw-chevron]:rotate-180 [&[open]]:border-[var(--dw-ui-strong)]"
      open={detailsOpen}
      onToggle={
        isControlled
          ? (event) => {
              const next = event.currentTarget.open
              if (next !== open) {
                onOpenChange(next)
              }
            }
          : undefined
      }
    >
      <summary
        className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 transition-colors duration-[var(--dw-motion-fast)] hover:bg-[var(--dw-ui-elevated)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dw-ui-accent)] [&::-webkit-details-marker]:hidden"
      >
        <div className="min-w-0">
          <h3
            className="flex items-center gap-1.5 font-[number:var(--dw-font-weight-label)] text-[length:var(--dw-text-section-heading)] uppercase tracking-[0.04em] text-[var(--dw-ui-text-body)]"
          >
            {title}
            {hasExplicit ? (
              <span
                aria-label="명시 override 있음"
                title="이 노드에 명시 override가 박혀있음 (AI 또는 사용자가 박은 값)"
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--dw-ui-accent)] shadow-[0_0_6px_var(--dw-ui-accent)]"
              />
            ) : null}
          </h3>
          {description ? (
            <p
              className="mt-0.5 truncate text-[length:var(--dw-text-caption)] text-[var(--dw-ui-text-faint)]"
            >
              {description}
            </p>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {onAction ? (
            <button
              type="button"
              className="rounded-[var(--dw-radius-sm)] px-1.5 py-0.5 text-[length:var(--dw-text-label)] font-[number:var(--dw-font-weight-label)] text-[var(--dw-ui-accent-text)] transition-colors duration-[var(--dw-motion-fast)] hover:bg-[var(--dw-ui-accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-ui-accent)] disabled:cursor-not-allowed disabled:text-[var(--dw-ui-text-disabled)] disabled:hover:bg-transparent"
              disabled={isActionDisabled}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onAction()
              }}
            >
              {actionLabel ?? '초기화'}
            </button>
          ) : (
            summaryEnd
          )}
          <DisclosureChevron />
        </span>
      </summary>
      <div className="border-t border-[var(--dw-ui-border)] p-3">{children}</div>
    </details>
  )
}

interface TypographyNumberFieldProps {
  disabled?: boolean
  // value가 effective(캔버스 default 측정)에서 왔으면 true. 시각 dot + italic으로 구분.
  isEffective?: boolean
  label: string
  max: number
  min: number
  onChange: (value: string) => void
  placeholder: string
  step: number
  unit?: string
  value?: number
}

export function TypographyNumberField({
  disabled = false,
  isEffective = false,
  label,
  max,
  min,
  onChange,
  placeholder,
  step,
  unit,
  value,
}: TypographyNumberFieldProps) {
  return (
    <label className={disabled ? 'block opacity-50' : 'block'}>
      <span
        className="flex items-center gap-1 font-[number:var(--dw-font-weight-label)] text-[length:var(--dw-text-label)] tracking-wide text-[var(--dw-ui-text-muted)]"
      >
        {label}
        {isEffective ? (
          <span
            aria-label="캔버스 default 값"
            title="캔버스 default 값 (트리에 명시 없음). 입력하면 이 노드 전용으로 override."
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--dw-ui-text-faint)]"
          />
        ) : null}
      </span>
      <span
        className="mt-1.5 flex h-8 items-center rounded-[var(--dw-radius-sm)] border border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] transition-[border-color,box-shadow] duration-[var(--dw-motion-base)] focus-within:border-[var(--dw-ui-accent)] focus-within:bg-[var(--dw-ui-bg)] focus-within:shadow-[0_0_0_1px_var(--dw-ui-accent)] hover:border-[var(--dw-ui-strong)]"
      >
        <input
          className={`h-full min-w-0 flex-1 rounded-[var(--dw-radius-sm)] bg-transparent px-2.5 font-mono text-[length:var(--dw-text-mono-value)] tabular-nums outline-none disabled:cursor-not-allowed ${
            isEffective
              ? 'text-[var(--dw-ui-text-muted)] italic'
              : 'text-[var(--dw-ui-text-primary)]'
          }`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ''}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        {unit ? (
          <span className="shrink-0 px-2 font-mono text-[10px] font-medium text-[var(--dw-ui-text-faint)]">
            {unit}
          </span>
        ) : null}
      </span>
    </label>
  )
}

interface TypographyToggleButtonProps {
  children: ReactNode
  disabled?: boolean
  isSelected: boolean
  onClick: () => void
}

export function TypographyToggleButton({
  children,
  disabled = false,
  isSelected,
  onClick,
}: TypographyToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={`h-8 rounded-[var(--dw-radius-sm)] border px-2 text-[length:var(--dw-text-label)] font-[number:var(--dw-font-weight-label)] transition-[background-color,border-color,color] duration-[var(--dw-motion-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-ui-accent)] active:scale-[0.97] ${
        isSelected
          ? 'border-[var(--dw-ui-accent)] bg-[var(--dw-ui-accent-soft)] text-[var(--dw-ui-accent-text)]'
          : 'border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] text-[var(--dw-ui-text-body)] hover:border-[var(--dw-ui-strong)] hover:bg-[var(--dw-ui-elevated)]'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--dw-ui-border)] disabled:hover:bg-[var(--dw-ui-panel)]`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface IconToggleButtonProps {
  disabled?: boolean
  icon: LucideIcon
  isSelected: boolean
  // selected가 사용자 explicit이 아닌 default/responsive에서 왔는지 — 시각 약화
  isEffective?: boolean
  label: string
  onClick: () => void
}

export function IconToggleButton({
  disabled = false,
  icon: Icon,
  isSelected,
  isEffective = false,
  label,
  onClick,
}: IconToggleButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      title={
        isSelected && isEffective
          ? `${label} (캔버스 default — 클릭하면 명시 박힘)`
          : label
      }
      className={`flex h-8 items-center justify-center rounded-[var(--dw-radius-sm)] border transition-[background-color,border-color,color] duration-[var(--dw-motion-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-ui-accent)] active:scale-[0.97] ${
        isSelected
          ? isEffective
            ? 'border-[var(--dw-ui-strong)] bg-[var(--dw-ui-elevated)] text-[var(--dw-ui-text-faint)]'
            : 'border-[var(--dw-ui-accent)] bg-[var(--dw-ui-accent-soft)] text-[var(--dw-ui-accent-text)]'
          : 'border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] text-[var(--dw-ui-text-body)] hover:border-[var(--dw-ui-strong)] hover:bg-[var(--dw-ui-elevated)]'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--dw-ui-border)] disabled:hover:bg-[var(--dw-ui-panel)]`}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
    </button>
  )
}

export function InspectorRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--dw-ui-text-muted)]">{label}</dt>
      <dd className="break-all text-right font-medium text-[var(--dw-ui-text-primary)]">
        {value}
      </dd>
    </div>
  )
}

export function getOpacityPercent(value: number | undefined): number {
  return Math.round((value ?? 1) * 100)
}

interface OpacityControlProps {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  value?: number
}

export function OpacityControl({
  disabled = false,
  label,
  onChange,
  value,
}: OpacityControlProps) {
  const percent = getOpacityPercent(value)

  return (
    <div>
      <TypographyNumberField
        disabled={disabled}
        label={label}
        unit="%"
        min={0}
        max={100}
        step={1}
        value={value === undefined ? undefined : percent}
        placeholder="100"
        onChange={onChange}
      />
      <label className="mt-2 block">
        <span className="sr-only">{label} 슬라이더</span>
        <input
          className="w-full accent-[var(--dw-ui-accent)] disabled:cursor-not-allowed"
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          aria-label={`${label} 슬라이더`}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  )
}

// ============================================================================
// NodeTypeConvertDropdown — UX-03 D-05 3-route 중 인스펙터 route.
//   현재 노드 type 의 아이콘 + 한국어 라벨 표시, 펼치면 12 type 목록 + 호환 enabled.
//   keyboard 접근성: aria-haspopup="listbox" + role="listbox"/option + ESC/outside close.
// ============================================================================

export interface NodeTypeConvertDropdownProps {
  currentType: TreeNode['type']
  // 호환 type 선택 시 호출. 같은 type / 비호환 type 은 본 컴포넌트에서 차단.
  onConvert: (nextType: TreeNode['type']) => void
}

export function NodeTypeConvertDropdown({
  currentType,
  onConvert,
}: NodeTypeConvertDropdownProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const CurrentIcon = nodeTypeIcons[currentType]
  const allTypes = Object.keys(nodeTypeLabels) as TreeNode['type'][]

  // outside click — close
  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (
        !buttonRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // MR-04 — ESC 처리는 dropdown 루트 onKeyDown 으로 스코프 한정.
  //   기존: document.addEventListener('keydown') — 다른 모달/⌘K 안에서 ESC 가 눌려도
  //         이 dropdown 도 react 했었음 (멀티 인스턴스 시 listener 누적).
  //   현재: 컴포넌트 트리 안에서 발생한 ESC bubbling 만 처리 → 의도된 scope.
  const handleRootKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!open) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
        buttonRef.current?.focus()
      }
    },
    [open],
  )

  const handleSelect = useCallback(
    (nextType: TreeNode['type']) => {
      if (nextType === currentType) {
        setOpen(false)
        return
      }
      if (!canConvertNodeType(currentType, nextType)) return
      onConvert(nextType)
      setOpen(false)
    },
    [currentType, onConvert],
  )

  return (
    <div className="relative" onKeyDown={handleRootKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`노드 타입 변경 — 현재 ${nodeTypeLabels[currentType]}`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-[var(--dw-radius-sm)] border border-[var(--dw-ui-border)] bg-[var(--dw-ui-elevated)] px-2 py-1 text-[length:var(--dw-text-label)] font-semibold text-[var(--dw-ui-text-strong)] hover:border-[var(--dw-ui-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dw-ui-accent)]"
      >
        <CurrentIcon aria-hidden="true" size={14} strokeWidth={1.75} />
        <span>{nodeTypeLabels[currentType]}</span>
        <ChevronDown aria-hidden="true" size={12} strokeWidth={1.75} />
      </button>
      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="노드 타입 변경"
          className="absolute left-0 top-full z-[200] mt-1 min-w-[10rem] rounded-[var(--dw-radius-sm)] border border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {allTypes.map((t) => {
            const isSelf = t === currentType
            const compatible = canConvertNodeType(currentType, t)
            const Icon = nodeTypeIcons[t]
            const disabledReason =
              nodeTypeConversionDisabledReason[currentType] ??
              `${nodeTypeLabels[currentType]}은(는) ${nodeTypeLabels[t]}(으)로 변환할 수 없습니다`
            const buttonDisabled = !compatible || isSelf
            return (
              <li key={t} role="option" aria-selected={isSelf}>
                <button
                  type="button"
                  disabled={buttonDisabled}
                  title={
                    !compatible && !isSelf
                      ? `변환 불가: ${disabledReason}`
                      : undefined
                  }
                  onClick={() => handleSelect(t)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[length:var(--dw-text-value)] ${
                    isSelf
                      ? 'bg-[var(--dw-ui-accent-soft)] text-[var(--dw-ui-accent-text)]'
                      : compatible
                        ? 'text-[var(--dw-ui-text-body)] hover:bg-[var(--dw-ui-elevated)]'
                        : 'cursor-not-allowed text-[var(--dw-ui-text-muted)] opacity-50'
                  }`}
                >
                  <Icon aria-hidden="true" size={14} strokeWidth={1.75} />
                  <span>{nodeTypeLabels[t]}</span>
                  {isSelf ? (
                    <span className="ml-auto text-[length:var(--dw-text-caption)]">
                      현재
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
