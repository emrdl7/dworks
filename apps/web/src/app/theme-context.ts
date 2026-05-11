'use client'

// DS-01 theme switcher — 3 테마 (dark | light | sepia) chrome 토큰 swap.
// CONTEXT D-04 (localStorage dw:theme:v1), D-05 (ThemeProvider + useTheme hook).
// dark 는 :root 기본 토큰, light/sepia 는 globals.css 의 [data-theme] selector 로 토큰 override.

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

// 3 테마 — dark 가 기본 (SSR 깜빡임 회피).
export type Theme = 'dark' | 'light' | 'sepia'

// localStorage key — v1 (스키마 변경 시 v2 로 bump).
const THEME_STORAGE_KEY = 'dw:theme:v1'
const VALID_THEMES: readonly Theme[] = ['dark', 'light', 'sepia']

export interface ThemeContextValue {
  theme: Theme
  setTheme: (next: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// localStorage 에서 저장된 테마 읽기 — invalid 값/차단 환경은 dark fallback.
function readSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved !== null && VALID_THEMES.includes(saved as Theme)) {
      return saved as Theme
    }
  } catch {
    // localStorage 차단 (private mode 등) — 기본 dark
  }
  return 'dark'
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('dark')

  // hydration — 클라이언트 첫 마운트 시 localStorage 읽고 <html data-theme> attr 적용.
  // SSR 단계는 dark 가 default 이므로 :root 토큰만으로 렌더 (깜빡임 최소).
  useEffect(() => {
    const saved = readSavedTheme()
    setThemeState(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // 차단 — 메모리만 갱신, 새로고침 시 dark 복귀
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme }),
    [theme, setTheme],
  )

  // toast-context.ts 와 동일 — .ts 파일이므로 JSX 대신 createElement 사용.
  return createElement(ThemeContext.Provider, { value }, children)
}

// useTheme — Provider 외부 호출 시 throw (한국어 오류 메시지).
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (ctx === null) {
    throw new Error('useTheme 는 ThemeProvider 내부에서만 사용 가능합니다')
  }
  return ctx
}
