'use client'

// 전역 toast 호스트 — UX-03 변환 손실 / UX-05 정렬 경고 등에서 useToast 로 호출.
// fixed bottom-right 영역에 4가지 tone 별 한국어 toast 렌더 (UI-SPEC Color line 76-97).

import { useContext } from 'react'
import { X } from 'lucide-react'

import { ToastContext, type ToastTone } from './toast-context'

// tone 별 Tailwind class 매핑 — chrome 토큰 재사용.
function toneClasses(tone: ToastTone): string {
  switch (tone) {
    case 'warn':
      return 'bg-[var(--dw-ui-warn-bg)] border-[var(--dw-ui-warn-text)]/40 text-[var(--dw-ui-warn-text)]'
    case 'error':
      return 'bg-[var(--dw-ui-danger-bg)] border-[var(--dw-ui-danger-text)]/40 text-[var(--dw-ui-danger-text)]'
    case 'success':
      return 'bg-[var(--dw-ui-panel)] border-[var(--dw-ui-accent-border)] text-[var(--dw-ui-accent-text)]'
    case 'info':
    default:
      return 'bg-[var(--dw-ui-panel)] border-[var(--dw-ui-border)] text-[var(--dw-ui-text-body)]'
  }
}

export function ToastHost() {
  // ToastProvider 외부에서도 안전하게 마운트 가능하도록 useToast가 아닌 useContext 직접 사용.
  const ctx = useContext(ToastContext)
  if (!ctx) return null
  const { toasts, dismissToast } = ctx
  if (toasts.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-[var(--dw-radius-md)] border px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.5)] min-w-[18rem] max-w-[26rem] animate-[dw-fade-in_var(--dw-motion-slow)_var(--dw-motion-ease)_both] ${toneClasses(
            toast.tone,
          )}`}
        >
          <p className="flex-1 text-[length:var(--dw-text-value)] leading-relaxed">
            {toast.message}
          </p>
          <button
            type="button"
            aria-label="알림 닫기"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 rounded-[var(--dw-radius-sm)] p-0.5 opacity-60 hover:opacity-100 hover:bg-black/20"
          >
            <X aria-hidden="true" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
