// Figma/Linear 스타일 ⌘K 명령 팔레트.
// modal overlay + 검색 input + 필터된 명령 리스트 + 키보드 navigation.

'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import type { LucideIcon } from 'lucide-react'

export interface CommandPaletteItem {
  // 안정 id — key 및 react reorder.
  id: string
  // 표시 레이블 (한글 권장).
  label: string
  // 카테고리 (그룹핑 표시용 — 예: "노드 추가", "줌", "AI").
  group: string
  // 추가 검색 키워드 (라벨로 못 잡는 한영 혼용 등).
  keywords?: string[]
  // 단축키 표시 (예: '⌘D'). 동작은 따로 등록.
  shortcut?: string
  icon?: LucideIcon
  // 비활성화 — 선택 노드 없음 등 컨텍스트 미충족.
  disabled?: boolean
  // 비활성 사유 — tooltip 표시.
  disabledReason?: string
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  items: readonly CommandPaletteItem[]
}

// 단순 substring + 토큰 분할 — fuzzy 라이브러리 없이.
function matchesQuery(item: CommandPaletteItem, query: string): boolean {
  if (query.trim().length === 0) return true
  const haystack = [item.label, item.group, ...(item.keywords ?? [])]
    .join(' ')
    .toLowerCase()
  const tokens = query.toLowerCase().trim().split(/\s+/)
  return tokens.every((token) => haystack.includes(token))
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 열릴 때 input focus + query 리셋.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // next frame — modal 마운트 후 focus
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [open])

  const filteredItems = useMemo(
    () => items.filter((item) => matchesQuery(item, query)),
    [items, query],
  )

  // 필터 결과 변하면 active index 안전 clamp.
  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(0)
    }
  }, [filteredItems.length, activeIndex])

  // active item이 보이도록 스크롤.
  useEffect(() => {
    if (!open) return
    const container = listRef.current
    if (!container) return
    const target = container.querySelector<HTMLButtonElement>(
      `[data-command-index="${activeIndex}"]`,
    )
    if (target) {
      target.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, open])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((idx) => (idx + 1) % Math.max(1, filteredItems.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((idx) =>
        idx === 0 ? Math.max(0, filteredItems.length - 1) : idx - 1,
      )
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const target = filteredItems[activeIndex]
      if (target && !target.disabled) {
        target.action()
        onClose()
      }
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  function handleItemClick(item: CommandPaletteItem) {
    if (item.disabled) return
    item.action()
    onClose()
  }

  if (!open) return null

  // group별 그룹핑 — 표시 순서는 첫 등장 순서.
  const groupedItems: Array<{ group: string; items: CommandPaletteItem[] }> = []
  filteredItems.forEach((item) => {
    const existing = groupedItems.find((g) => g.group === item.group)
    if (existing) {
      existing.items.push(item)
    } else {
      groupedItems.push({ group: item.group, items: [item] })
    }
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="명령 팔레트"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      style={{ animation: 'dw-fade-in var(--dw-motion-base) var(--dw-motion-ease) both' }}
    >
      <button
        type="button"
        aria-label="팔레트 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--dw-ui-bg)]/70 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div
        className="relative z-10 w-full max-w-[600px] overflow-hidden rounded-[var(--dw-radius-lg)] border border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] shadow-[var(--dw-shadow-elev-3)]"
        style={{ animation: 'dw-fade-up var(--dw-motion-base) var(--dw-motion-ease) both' }}
      >
        <div className="border-b border-[var(--dw-ui-border)]">
          <input
            ref={inputRef}
            type="text"
            placeholder="명령 검색…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            className="h-12 w-full bg-transparent px-4 text-[length:var(--dw-text-value)] text-[var(--dw-ui-text-primary)] placeholder:text-[var(--dw-ui-text-faint)] focus:outline-none"
          />
        </div>
        <div
          ref={listRef}
          role="listbox"
          aria-label="명령 목록"
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {filteredItems.length === 0 ? (
            <div className="px-3 py-8 text-center text-[length:var(--dw-text-caption)] text-[var(--dw-ui-text-faint)]">
              일치하는 명령이 없습니다
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.group} className="mb-2 last:mb-0">
                <div className="px-3 pb-1 pt-2 text-[length:var(--dw-text-caption)] font-[number:var(--dw-font-weight-label)] uppercase tracking-wide text-[var(--dw-ui-text-faint)]">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const flatIndex = filteredItems.indexOf(item)
                  const isActive = flatIndex === activeIndex
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={item.disabled}
                      title={item.disabled ? item.disabledReason : undefined}
                      data-command-index={flatIndex}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => handleItemClick(item)}
                      disabled={item.disabled}
                      className={`flex w-full items-center justify-between gap-3 rounded-[var(--dw-radius-sm)] px-3 py-2 text-left text-[length:var(--dw-text-value)] transition-colors duration-[var(--dw-motion-fast)] disabled:cursor-not-allowed disabled:opacity-40 ${
                        isActive
                          ? 'bg-[var(--dw-ui-accent-soft)] text-[var(--dw-ui-accent-text-strong)]'
                          : 'text-[var(--dw-ui-text-body)] hover:bg-[var(--dw-ui-elevated)]'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {Icon ? (
                          <Icon
                            aria-hidden="true"
                            size={16}
                            className={
                              isActive
                                ? 'text-[var(--dw-ui-accent-text)]'
                                : 'text-[var(--dw-ui-text-muted)]'
                            }
                          />
                        ) : (
                          <span className="inline-block h-4 w-4" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.shortcut ? (
                        <span
                          className={`shrink-0 rounded-[var(--dw-radius-sm)] border px-1.5 py-0.5 font-mono text-[length:var(--dw-text-caption)] ${
                            isActive
                              ? 'border-[var(--dw-ui-accent-border)] text-[var(--dw-ui-accent-text)]'
                              : 'border-[var(--dw-ui-border)] text-[var(--dw-ui-text-muted)]'
                          }`}
                        >
                          {item.shortcut}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
