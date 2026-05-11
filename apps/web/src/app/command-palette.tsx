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

import { X, type LucideIcon } from 'lucide-react'

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

// ============================================================================
// ShortcutHelpModal — ⌘K "단축키" 항목에서 호출되는 cheatsheet 모달.
// UX-06 D-19 — 노드 추가 / 정렬 / 분포 / 패널 토글 카테고리.
// 정렬·분포는 Plan 07 에서 구현. 본 plan 은 cheatsheet 표기만 _먼저 박음_.
// ============================================================================

export interface ShortcutHelpModalProps {
  open: boolean
  onClose: () => void
}

// kbd 단축키 chip 공용 스타일 (accent 톤, monospace).
const KBD_CLASS =
  'inline-flex h-6 min-w-6 items-center justify-center rounded-[var(--dw-radius-sm)] border border-[var(--dw-ui-accent-border)] bg-[var(--dw-ui-accent-soft)] px-1.5 font-mono text-[length:var(--dw-text-caption)] font-semibold text-[var(--dw-ui-accent-text)]'

interface ShortcutGroup {
  category: string
  items: Array<{ keys: readonly string[]; label: string }>
}

// UX-06 + UX-05 + 기존 chrome 단축키를 한 자리에 모음.
// 한국어 라벨 (Korean UI mandate).
const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    category: '노드 추가',
    items: [
      { keys: ['T'], label: '텍스트' },
      { keys: ['B'], label: '버튼' },
      { keys: ['I'], label: '이미지' },
      { keys: ['R'], label: '섹션' },
      { keys: ['C'], label: '카드' },
      { keys: ['H'], label: '히어로' },
      { keys: ['L'], label: '리스트' },
      { keys: ['F'], label: '폼' },
      { keys: ['A'], label: '아코디언' },
      { keys: ['M'], label: '모달' },
      { keys: ['Shift+C'], label: '캐러셀' },
      { keys: ['Shift+T'], label: '탭' },
    ],
  },
  {
    category: '정렬',
    items: [
      { keys: ['Alt+A'], label: '좌측 정렬' },
      { keys: ['Alt+H'], label: '가로 중앙 정렬' },
      { keys: ['Alt+D'], label: '우측 정렬' },
      { keys: ['Alt+W'], label: '상단 정렬' },
      { keys: ['Alt+V'], label: '세로 중앙 정렬' },
      { keys: ['Alt+S'], label: '하단 정렬' },
    ],
  },
  {
    category: '분포',
    items: [
      { keys: ['Alt+Shift+H'], label: '가로 균등 분포' },
      { keys: ['Alt+Shift+V'], label: '세로 균등 분포' },
    ],
  },
  {
    category: '패널',
    items: [
      { keys: ['['], label: '컴포넌트 패널 토글' },
      { keys: ['⌘', '\\'], label: '좌/우 패널 숨기기 (집중 모드)' },
      { keys: ['⌘', 'F'], label: '레이어 검색 focus' },
      { keys: ['⌘', 'K'], label: '명령 팔레트' },
    ],
  },
  {
    category: '편집',
    items: [
      { keys: ['⌘', 'Z'], label: '실행 취소' },
      { keys: ['⌘', '⇧', 'Z'], label: '다시 실행' },
      { keys: ['⌘', 'D'], label: '복제' },
      { keys: ['Delete'], label: '삭제' },
    ],
  },
  {
    category: '노드 이동',
    items: [
      { keys: ['⌘', '↑'], label: '형제 위로 이동' },
      { keys: ['⌘', '↓'], label: '형제 아래로 이동' },
    ],
  },
  {
    category: '다중 선택',
    items: [
      { keys: ['⇧', 'click'], label: '범위 선택 (primary ~ target)' },
      { keys: ['⌘', 'click'], label: '개별 토글' },
      { keys: ['⌘', 'A'], label: '전체 선택' },
    ],
  },
  {
    category: '캔버스 패닝 / 줌',
    items: [
      { keys: ['Space', '+ drag'], label: '캔버스 panning' },
      { keys: ['middle', 'drag'], label: '캔버스 panning (대체)' },
      { keys: ['⌘', 'wheel'], label: '캔버스 줌 (트랙패드 pinch 도 OK)' },
      { keys: ['⌘', '+'], label: '줌 인 10%' },
      { keys: ['⌘', '-'], label: '줌 아웃 10%' },
      { keys: ['⌘', '0'], label: '줌 100% 리셋' },
      { keys: ['⌘', '1'], label: '화면에 맞춤 (fit to screen)' },
      { keys: ['⌘', '2'], label: '선택 노드를 화면 중앙에 fit' },
    ],
  },
  {
    // VIS-01..VIS-03 — Phase 3 시각 보조 카테고리.
    category: '시각 보조',
    items: [
      { keys: ['G'], label: '12-col 그리드 토글' },
    ],
  },
  {
    category: '선택 / 도움말',
    items: [
      { keys: ['Esc'], label: '선택 해제 / 닫기' },
      { keys: ['?'], label: '이 도움말 토글' },
    ],
  },
]

export function ShortcutHelpModal({ open, onClose }: ShortcutHelpModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  // 마운트 직후 닫기 버튼에 focus — 키보드 사용자 첫 진입.
  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="단축키 도움말 닫기"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-black/60"
        style={{ animation: 'dw-fade-in 180ms ease-out both' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
        aria-label="단축키 도움말"
        className="fixed bottom-6 right-6 z-50 flex max-h-[calc(100vh-3rem)] w-[26rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg border border-[var(--dw-ui-border)] bg-[var(--dw-ui-elevated)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        style={{ animation: 'dw-fade-up 200ms ease-out both' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--dw-ui-border)] px-5 py-3">
          <h2
            id="shortcut-help-title"
            className="text-sm font-semibold text-[var(--dw-ui-text-primary)]"
          >
            단축키
          </h2>
          <button
            type="button"
            aria-label="닫기"
            ref={closeBtnRef}
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--dw-ui-text-muted)] hover:bg-[var(--dw-ui-soft)] hover:text-[var(--dw-ui-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-ui-accent)]"
          >
            <X aria-hidden="true" size={14} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4 text-sm">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.category}>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--dw-ui-text-faint)]">
                {group.category}
              </div>
              <dl className="space-y-1">
                {group.items.map((item) => (
                  <div
                    key={`${group.category}-${item.label}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <dt className="text-[var(--dw-ui-text-muted)]">
                      {item.label}
                    </dt>
                    <dd className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <kbd
                          key={`${item.label}-${i}`}
                          className={KBD_CLASS}
                          aria-hidden="true"
                        >
                          {k}
                        </kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <p className="pt-2 text-[11px] text-[var(--dw-ui-text-faint)]">
            입력 필드 / 모달 / ⌘K 팔레트가 열려있을 때는 단축키가 비활성화됩니다.
          </p>
        </div>
      </div>
    </>
  )
}
