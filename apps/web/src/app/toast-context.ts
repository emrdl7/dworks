'use client'

// 전역 toast 시스템 — ToastProvider/useToast/dismissToast API.
// UX-03 변환 손실 안내, UX-05 정렬/분포 경고 등 page.tsx 전역에서 1줄 호출.

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

// toast tone — 4종 (UI-SPEC Color 매핑).
export type ToastTone = 'info' | 'warn' | 'error' | 'success'

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
  durationMs?: number
}

// 외부 노출 context value. showToast가 1차 API, toasts/dismissToast는 ToastHost 전용이지만
// 단일 context로 통합 (사용 가이드 — 외부에서는 showToast만 호출).
export interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone, durationMs?: number) => void
  toasts: readonly ToastItem[]
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION_MS = 3500
const DEDUPE_WINDOW_MS = 500

// useToast — Provider 외부 호출 시 throw (한국어 오류 메시지).
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast 는 ToastProvider 내부에서만 사용 가능합니다')
  }
  return ctx
}

// 고유 id 생성 — crypto.randomUUID 있으면 사용, 아니면 fallback.
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  // toast id → timeout handle (자동 dismiss용).
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  // dedupe — 직전 toast의 message+tone+id 기록.
  const lastToastRef = useRef<{ message: string; tone: ToastTone; id: string; at: number } | null>(null)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info', durationMs: number = DEFAULT_DURATION_MS) => {
      const now = Date.now()
      const last = lastToastRef.current
      // 동일 메시지+tone이 500ms 이내 연타되면 기존 toast의 timer만 reset.
      if (last && last.message === message && last.tone === tone && now - last.at < DEDUPE_WINDOW_MS) {
        const existingTimer = timersRef.current.get(last.id)
        if (existingTimer) clearTimeout(existingTimer)
        const refreshed = setTimeout(() => dismissToast(last.id), durationMs)
        timersRef.current.set(last.id, refreshed)
        lastToastRef.current = { ...last, at: now }
        return
      }

      const id = generateId()
      const item: ToastItem = { id, message, tone, durationMs }
      setToasts((prev) => [...prev, item])
      lastToastRef.current = { message, tone, id, at: now }

      const timer = setTimeout(() => dismissToast(id), durationMs)
      timersRef.current.set(id, timer)
    },
    [dismissToast],
  )

  // unmount 시 모든 타이머 정리.
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const value: ToastContextValue = { showToast, toasts, dismissToast }
  return createElement(ToastContext.Provider, { value }, children)
}

// ToastHost가 내부 toasts/dismissToast 사용을 위해 직접 import.
export { ToastContext }
