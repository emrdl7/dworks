'use client'

// DS-02 custom palette — 사용자 정의 색 set 저장/관리.
// CONTEXT D-06 (5-10색), D-07 (localStorage dw:palettes:v1), D-09 (Provider + hook).
// theme-context.ts 와 동일 — .ts 파일이므로 JSX 대신 createElement 사용.

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

// Palette — 사용자가 정의한 색 set. id 는 내부 자동 생성, 사용자는 name 과 colors 만 제공.
export interface Palette {
  id: string
  name: string
  // hex 문자열 배열, 5-10개 (D-06).
  colors: string[]
}

// localStorage key — v1 (스키마 변경 시 v2 로 bump).
const STORAGE_KEY = 'dw:palettes:v1'
// 최대 palette 개수 — 너무 많으면 dialog UI 가 무거워짐.
const MAX_PALETTES = 8
const MIN_COLORS_PER_PALETTE = 5
const MAX_COLORS_PER_PALETTE = 10

interface PaletteContextValue {
  palettes: Palette[]
  activePaletteId: string | null
  // id 는 내부 생성 — addPalette 는 Omit<Palette, 'id'> 받음. 유효성 위반 시 null 반환.
  addPalette: (palette: Omit<Palette, 'id'>) => Palette | null
  removePalette: (id: string) => void
  // 부분 갱신 — colors 가 포함되면 5-10 / hex 검증, 실패 시 무시.
  updatePalette: (id: string, patch: Partial<Omit<Palette, 'id'>>) => void
  setActivePaletteId: (id: string | null) => void
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

// hex 검증 — #RGB 또는 #RRGGBB. 사용자가 '#000', '#abcdef' 모두 입력 가능.
function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value)
}

// localStorage 에서 읽은 raw 값이 Palette 형태인지 확인 — invalid entry 는 silently drop.
function isValidPalette(value: unknown): value is Palette {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string') return false
  if (typeof v.name !== 'string') return false
  if (!Array.isArray(v.colors)) return false
  if (
    v.colors.length < MIN_COLORS_PER_PALETTE ||
    v.colors.length > MAX_COLORS_PER_PALETTE
  ) {
    return false
  }
  return v.colors.every((c) => typeof c === 'string' && isValidHex(c))
}

// localStorage 에서 저장된 palette 배열 + activeId 읽기.
// invalid JSON / 차단 환경은 빈 배열 + null fallback.
function readSaved(): { palettes: Palette[]; activeId: string | null } {
  if (typeof window === 'undefined') return { palettes: [], activeId: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { palettes: [], activeId: null }
    const parsed = JSON.parse(raw) as { palettes?: unknown; activeId?: unknown }
    const palettes = Array.isArray(parsed.palettes)
      ? parsed.palettes.filter(isValidPalette)
      : []
    const activeId =
      typeof parsed.activeId === 'string' ? parsed.activeId : null
    return { palettes, activeId }
  } catch {
    // JSON 파싱 실패 / localStorage 차단 — 기본값.
    return { palettes: [], activeId: null }
  }
}

// localStorage 영속화 — 차단 환경은 메모리만, 새로고침 시 손실 acceptable.
function persist(palettes: Palette[], activeId: string | null): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ palettes, activeId }),
    )
  } catch {
    // 차단 — 메모리만
  }
}

// 고유 id 생성 — crypto.randomUUID 없는 환경 대응 fallback.
function generateId(): string {
  return `pal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

interface PaletteProviderProps {
  children: ReactNode
}

export function PaletteProvider({ children }: PaletteProviderProps) {
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [activePaletteId, setActivePaletteIdState] = useState<string | null>(
    null,
  )

  // hydration — 클라이언트 첫 마운트 시 localStorage 읽고 state 동기.
  // SSR 단계는 빈 배열로 렌더 (palette UI 는 dialog 안에서만 노출되므로 깜빡임 영향 없음).
  useEffect(() => {
    const saved = readSaved()
    setPalettes(saved.palettes)
    setActivePaletteIdState(saved.activeId)
  }, [])

  const addPalette = useCallback(
    (partial: Omit<Palette, 'id'>): Palette | null => {
      // 유효성 검사 — 위반 시 null 반환, dialog 에서 toast 노출.
      if (palettes.length >= MAX_PALETTES) return null
      if (partial.colors.length < MIN_COLORS_PER_PALETTE) return null
      if (partial.colors.length > MAX_COLORS_PER_PALETTE) return null
      if (!partial.colors.every(isValidHex)) return null
      const next: Palette = { id: generateId(), ...partial }
      const list = [...palettes, next]
      setPalettes(list)
      persist(list, activePaletteId)
      return next
    },
    [palettes, activePaletteId],
  )

  const removePalette = useCallback(
    (id: string) => {
      const list = palettes.filter((p) => p.id !== id)
      // 삭제된 palette 가 activeId 였으면 active 도 해제.
      const nextActive = activePaletteId === id ? null : activePaletteId
      setPalettes(list)
      setActivePaletteIdState(nextActive)
      persist(list, nextActive)
    },
    [palettes, activePaletteId],
  )

  const updatePalette = useCallback(
    (id: string, patch: Partial<Omit<Palette, 'id'>>) => {
      const list = palettes.map((p) => {
        if (p.id !== id) return p
        const next: Palette = { ...p, ...patch }
        // colors 패치가 있으면 유효성 검사 — 위반 시 patch 무시 (원본 p 반환).
        if (patch.colors !== undefined) {
          if (
            next.colors.length < MIN_COLORS_PER_PALETTE ||
            next.colors.length > MAX_COLORS_PER_PALETTE
          ) {
            return p
          }
          if (!next.colors.every(isValidHex)) return p
        }
        return next
      })
      setPalettes(list)
      persist(list, activePaletteId)
    },
    [palettes, activePaletteId],
  )

  const setActivePaletteId = useCallback(
    (id: string | null) => {
      setActivePaletteIdState(id)
      persist(palettes, id)
    },
    [palettes],
  )

  const value = useMemo<PaletteContextValue>(
    () => ({
      palettes,
      activePaletteId,
      addPalette,
      removePalette,
      updatePalette,
      setActivePaletteId,
    }),
    [
      palettes,
      activePaletteId,
      addPalette,
      removePalette,
      updatePalette,
      setActivePaletteId,
    ],
  )

  // theme-context.ts 와 동일 — .ts 파일이므로 JSX 대신 createElement 사용.
  return createElement(PaletteContext.Provider, { value }, children)
}

// usePalettes — Provider 외부 호출 시 throw (한국어 오류 메시지).
export function usePalettes(): PaletteContextValue {
  const ctx = useContext(PaletteContext)
  if (ctx === null) {
    throw new Error('usePalettes 는 PaletteProvider 내부에서만 사용 가능합니다')
  }
  return ctx
}

export { MAX_PALETTES, MIN_COLORS_PER_PALETTE, MAX_COLORS_PER_PALETTE }
