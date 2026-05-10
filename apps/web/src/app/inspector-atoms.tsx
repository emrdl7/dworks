// Inspector 패널 공통 atomic 컴포넌트 — page.tsx 분할(Phase 6)에서 분리.
// SpacingControls/LayoutControls/ShapeControls/NodeColorControls/TypographyControls
// 등이 공유.

import type { ReactNode } from 'react'

import type { LucideIcon } from 'lucide-react'

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
      className="dw-chevron h-4 w-4 text-[#898d97] transition-transform"
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
      className="rounded-md border border-[#2a2e35] bg-[#16181c] [&[open]>summary_.dw-chevron]:rotate-180"
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
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6366f1] [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#ebecef]">
            {title}
            {hasExplicit ? (
              <span
                aria-label="명시 override 있음"
                title="이 노드에 명시 override가 박혀있음 (AI 또는 사용자가 박은 값)"
                className="inline-block h-1.5 w-1.5 rounded-full bg-[#6366f1]"
              />
            ) : null}
          </h3>
          {description ? (
            <p className="mt-1 truncate text-xs text-[#898d97]">{description}</p>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {onAction ? (
            <button
              type="button"
              className="text-xs font-semibold text-[#a5b4fc] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] disabled:cursor-not-allowed disabled:text-[#3a3f48] disabled:hover:no-underline"
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
      <div className="border-t border-[#2a2e35] p-4">{children}</div>
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
      <span className="flex items-center gap-1 text-xs font-semibold text-[#898d97]">
        {label}
        {isEffective ? (
          <span
            aria-label="캔버스 default 값"
            title="캔버스 default 값 (트리에 명시 없음). 입력하면 이 노드 전용으로 override."
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#5b6069]"
          />
        ) : null}
      </span>
      <span className="mt-2 flex h-10 items-center rounded-md border border-[#2a2e35] bg-[#16181c] focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
        <input
          className={`h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed ${
            isEffective ? 'text-[#898d97] italic' : ''
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
          <span className="shrink-0 px-2 text-xs font-semibold text-[#898d97]">
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
      className={`h-9 rounded-md border px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
        isSelected
          ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
          : 'border-[#2a2e35] bg-[#16181c] text-[#c5c8cf] hover:bg-[#1d2025]'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#16181c]`}
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
      className={`flex h-9 items-center justify-center rounded-md border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
        isSelected
          ? isEffective
            ? 'border-[#3a3f55] bg-[#1a1c24] text-[#7e8395]'
            : 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
          : 'border-[#2a2e35] bg-[#16181c] text-[#c5c8cf] hover:bg-[#1d2025]'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#16181c]`}
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
      <dt className="text-[#898d97]">{label}</dt>
      <dd className="break-all text-right font-medium text-[#ebecef]">
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
          className="w-full accent-[#6366f1] disabled:cursor-not-allowed"
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
