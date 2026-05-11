'use client'

// DS-02 palette manager dialog — 사용자 정의 palette CRUD UI.
// CONTEXT D-08 (인스펙터 통합은 v3+ deferred), D-10 (dialog UI + 색 picker grid).
// 색 picker 는 native <input type="color"> — HSL picker 는 v3 (CONTEXT specifics).

import { useState } from 'react'

import {
  MAX_COLORS_PER_PALETTE,
  MAX_PALETTES,
  MIN_COLORS_PER_PALETTE,
  usePalettes,
  type Palette,
} from './palette-context'
import { useToast } from './toast-context'

export interface PaletteManagerDialogProps {
  open: boolean
  onClose: () => void
}

// 새 palette 의 기본 색상 — 5색 (Tailwind indigo/violet/pink/red/amber 톤).
// 사용자가 즉시 add 해도 유효성 검사 통과하도록 MIN_COLORS_PER_PALETTE 개수 유지.
const DEFAULT_COLORS: string[] = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
]

export function PaletteManagerDialog({
  open,
  onClose,
}: PaletteManagerDialogProps) {
  const { palettes, addPalette, removePalette, updatePalette } = usePalettes()
  const { showToast } = useToast()
  const [draftName, setDraftName] = useState('새 팔레트')
  const [draftColors, setDraftColors] = useState<string[]>(DEFAULT_COLORS)

  if (!open) return null

  function handleAdd() {
    if (palettes.length >= MAX_PALETTES) {
      showToast(`최대 ${MAX_PALETTES}개의 팔레트만 저장할 수 있습니다`, 'warn')
      return
    }
    if (draftColors.length < MIN_COLORS_PER_PALETTE) {
      showToast(`팔레트는 최소 ${MIN_COLORS_PER_PALETTE}색 필요합니다`, 'warn')
      return
    }
    const added = addPalette({
      name: draftName.trim() || '이름 없음',
      colors: draftColors,
    })
    if (added === null) {
      showToast('팔레트 추가 실패 — 유효성 검사 위반', 'error')
      return
    }
    setDraftName('새 팔레트')
    setDraftColors(DEFAULT_COLORS)
    showToast(`"${added.name}" 팔레트가 추가되었습니다`, 'success')
  }

  function handleColorChange(idx: number, value: string) {
    setDraftColors((prev) => prev.map((c, i) => (i === idx ? value : c)))
  }

  function handleAddColor() {
    if (draftColors.length >= MAX_COLORS_PER_PALETTE) return
    setDraftColors((prev) => [...prev, '#000000'])
  }

  function handleRemoveColor(idx: number) {
    // 최소 색상 수 보장 — 5색 미만으로 떨어지지 않도록.
    if (draftColors.length <= MIN_COLORS_PER_PALETTE) return
    setDraftColors((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleRemove(p: Palette) {
    removePalette(p.id)
    showToast(`"${p.name}" 팔레트가 삭제되었습니다`, 'info')
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="팔레트 관리"
    >
      <div
        className="w-[640px] max-h-[80vh] overflow-y-auto rounded-lg bg-[var(--dw-ui-panel)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--dw-ui-text-primary)]">
            팔레트 관리
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--dw-ui-text-muted)] hover:bg-[var(--dw-ui-soft)]"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 기존 palette 목록 — 이름 inline 편집 + 색상 swatch + 삭제 */}
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-medium text-[var(--dw-ui-text-muted)]">
            내 팔레트 ({palettes.length}/{MAX_PALETTES})
          </h3>
          {palettes.length === 0 && (
            <p className="text-xs text-[var(--dw-ui-text-faint)]">
              아직 저장된 팔레트가 없습니다
            </p>
          )}
          {palettes.map((p) => (
            <div
              key={p.id}
              className="mb-2 flex items-center gap-2 rounded border border-[var(--dw-ui-border)] p-2"
            >
              <input
                type="text"
                value={p.name}
                onChange={(e) =>
                  updatePalette(p.id, { name: e.target.value })
                }
                className="w-32 rounded bg-transparent px-2 py-1 text-xs text-[var(--dw-ui-text-primary)]"
                aria-label={`${p.name} 이름 편집`}
              />
              <div className="flex gap-1">
                {p.colors.map((c, i) => (
                  <div
                    key={`${p.id}-${i}`}
                    className="h-6 w-6 rounded border border-[var(--dw-ui-border)]"
                    style={{ backgroundColor: c }}
                    title={c}
                    aria-label={`색 ${i + 1}: ${c}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(p)}
                className="ml-auto rounded px-2 py-1 text-xs text-[var(--dw-ui-danger-text)] hover:bg-[var(--dw-ui-danger-bg)]"
                aria-label={`${p.name} 팔레트 삭제`}
              >
                삭제
              </button>
            </div>
          ))}
        </div>

        {/* 새 palette 추가 — name input + 색 picker grid + add 버튼 */}
        <div className="rounded border border-[var(--dw-ui-border)] p-3">
          <h3 className="mb-2 text-xs font-medium text-[var(--dw-ui-text-muted)]">
            새 팔레트
          </h3>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="팔레트 이름"
            aria-label="새 팔레트 이름"
            className="mb-3 w-full rounded border border-[var(--dw-ui-border)] bg-[var(--dw-ui-bg)] px-2 py-1 text-xs text-[var(--dw-ui-text-primary)]"
          />
          <div className="mb-3 flex flex-wrap gap-2">
            {draftColors.map((c, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <input
                  type="color"
                  value={c}
                  onChange={(e) => handleColorChange(idx, e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-[var(--dw-ui-border)]"
                  aria-label={`색 ${idx + 1}`}
                />
                {draftColors.length > MIN_COLORS_PER_PALETTE && (
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(idx)}
                    className="h-4 w-4 rounded-full text-[10px] text-[var(--dw-ui-danger-text)] hover:bg-[var(--dw-ui-danger-bg)]"
                    aria-label={`색 ${idx + 1} 제거`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {draftColors.length < MAX_COLORS_PER_PALETTE && (
              <button
                type="button"
                onClick={handleAddColor}
                className="h-8 w-8 rounded border border-dashed border-[var(--dw-ui-border)] text-[var(--dw-ui-text-muted)] hover:bg-[var(--dw-ui-elevated)]"
                aria-label="색 추가"
              >
                +
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={palettes.length >= MAX_PALETTES}
            className="rounded bg-[var(--dw-ui-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--dw-ui-accent-hover)] disabled:opacity-50"
          >
            팔레트 추가
          </button>
        </div>
      </div>
    </div>
  )
}
