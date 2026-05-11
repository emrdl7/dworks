'use client'
// Open Design 흡수 — 149 design system 중 활성 시스템 선택 UI.
// 의도 입력 textarea 옆 chip 으로 노출, 클릭 시 modal 에서 카테고리 그룹 + 검색 + accent swatch.
// API: GET /design-systems → 메모리 캐시 1회 fetch.

import { useEffect, useMemo, useRef, useState } from 'react'

export interface DesignSystemMeta {
  id: string
  title: string
  category: string | null
  accent: string | null
  bg: string | null
  blurb: string | null
}

export interface DesignSystemPickerProps {
  apiBase: string                  // 예: 'http://localhost:3001'
  value: string | null              // 현재 활성 system id (null = 기본 톤)
  onChange: (id: string | null) => void
  disabled?: boolean
}

const NONE_LABEL = '기본 톤 (디자인 시스템 미적용)'

export function DesignSystemPicker({
  apiBase,
  value,
  onChange,
  disabled = false,
}: DesignSystemPickerProps) {
  const [systems, setSystems] = useState<DesignSystemMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // 1회 catalog fetch
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${apiBase}/design-systems`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: { systems: DesignSystemMeta[] } = await res.json()
        if (!cancelled) {
          setSystems(data.systems)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'fetch failed')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiBase])

  // ESC 닫기
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = useMemo(
    () => systems.find((s) => s.id === value) ?? null,
    [systems, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return systems
    return systems.filter((s) => {
      const haystack = `${s.id} ${s.title} ${s.category ?? ''} ${s.blurb ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [systems, query])

  const grouped = useMemo(() => {
    const map = new Map<string, DesignSystemMeta[]>()
    for (const s of filtered) {
      const key = s.category ?? '기타'
      const arr = map.get(key) ?? []
      arr.push(s)
      map.set(key, arr)
    }
    // 정렬: 카테고리 알파벳, 각 그룹 안 title 알파벳
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, list]) => [cat, list.sort((a, b) => a.title.localeCompare(b.title))] as const)
  }, [filtered])

  return (
    <div className="design-system-picker">
      {/* Chip trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled || loading}
        className="group flex w-full items-center gap-2 rounded-md border border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] px-3 py-2 text-left text-xs hover:border-[var(--dw-ui-accent)] disabled:opacity-50"
        aria-label="디자인 시스템 선택"
      >
        <span
          className="inline-block h-4 w-4 shrink-0 rounded border border-[var(--dw-ui-border)]"
          style={{ backgroundColor: current?.accent ?? 'transparent' }}
          aria-hidden="true"
        />
        <span className="flex-1 truncate">
          <span className="text-[10px] uppercase tracking-wide text-[var(--dw-ui-text-faint)]">
            디자인 시스템
          </span>
          <span className="block text-sm font-medium text-[var(--dw-ui-text-primary)]">
            {current === null ? NONE_LABEL : current.title}
          </span>
        </span>
        {current !== null && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onChange(null)
              }
            }}
            className="rounded p-1 text-[var(--dw-ui-text-muted)] hover:bg-[var(--dw-ui-soft)] hover:text-[var(--dw-ui-text-primary)]"
            aria-label="디자인 시스템 해제"
          >
            ✕
          </span>
        )}
        <span className="text-[var(--dw-ui-text-muted)] group-hover:text-[var(--dw-ui-accent)]">
          ▾
        </span>
      </button>

      {error !== null && (
        <p className="mt-1 text-[10px] text-[var(--dw-ui-danger-text)]">
          카탈로그 로드 실패: {error}
        </p>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="디자인 시스템 선택"
        >
          <div
            ref={dialogRef}
            className="flex max-h-[80vh] w-[720px] max-w-full flex-col overflow-hidden rounded-lg border border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-[var(--dw-ui-border)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--dw-ui-text-primary)]">
                디자인 시스템 선택 ({systems.length}개)
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-[var(--dw-ui-text-muted)] hover:bg-[var(--dw-ui-soft)]"
                aria-label="닫기"
              >
                ✕
              </button>
            </header>

            <div className="border-b border-[var(--dw-ui-border)] px-4 py-2">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름·카테고리·설명으로 검색 (예: linear, productivity, dark)"
                className="w-full rounded-md border border-[var(--dw-ui-border)] bg-[var(--dw-ui-bg)] px-3 py-1.5 text-xs text-[var(--dw-ui-text-primary)] outline-none focus:border-[var(--dw-ui-accent)]"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {/* None option */}
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className={`mb-2 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs hover:bg-[var(--dw-ui-soft)] ${
                  value === null
                    ? 'bg-[var(--dw-ui-soft)] ring-1 ring-[var(--dw-ui-accent)]'
                    : ''
                }`}
              >
                <span className="inline-block h-4 w-4 rounded border border-dashed border-[var(--dw-ui-border)]" />
                <span className="flex-1">
                  <span className="font-medium text-[var(--dw-ui-text-primary)]">
                    {NONE_LABEL}
                  </span>
                  <span className="block text-[10px] text-[var(--dw-ui-text-faint)]">
                    기존 톤 매핑 (다크/미니멀/빈티지/…)만 사용
                  </span>
                </span>
              </button>

              {grouped.length === 0 && !loading && (
                <p className="px-3 py-4 text-center text-xs text-[var(--dw-ui-text-faint)]">
                  검색 결과 없음
                </p>
              )}

              {grouped.map(([category, list]) => (
                <section key={category} className="mb-3">
                  <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--dw-ui-text-faint)]">
                    {category} ({list.length})
                  </h3>
                  <ul>
                    {list.map((s) => {
                      const active = s.id === value
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onChange(s.id)
                              setOpen(false)
                            }}
                            className={`flex w-full items-start gap-2 rounded px-3 py-2 text-left text-xs hover:bg-[var(--dw-ui-soft)] ${
                              active
                                ? 'bg-[var(--dw-ui-soft)] ring-1 ring-[var(--dw-ui-accent)]'
                                : ''
                            }`}
                          >
                            <span
                              className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-[var(--dw-ui-border)]"
                              style={{
                                backgroundColor: s.accent ?? 'transparent',
                              }}
                              aria-hidden="true"
                            />
                            <span className="flex-1 min-w-0">
                              <span className="block truncate font-medium text-[var(--dw-ui-text-primary)]">
                                {s.title}
                              </span>
                              <span className="block text-[10px] text-[var(--dw-ui-text-faint)]">
                                {s.id}
                                {s.accent !== null ? ` · ${s.accent}` : ''}
                              </span>
                              {s.blurb !== null && s.blurb.length > 0 && (
                                <span className="mt-0.5 block text-[10px] text-[var(--dw-ui-text-muted)] line-clamp-2">
                                  {s.blurb}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}

              {loading && (
                <p className="px-3 py-4 text-center text-xs text-[var(--dw-ui-text-faint)]">
                  카탈로그 로드 중…
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
