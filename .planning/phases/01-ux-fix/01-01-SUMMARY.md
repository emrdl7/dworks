---
phase: 01-ux-fix
plan: 01
completed: 2026-05-11
status: complete
commits:
  - 619655c
  - 5f2ac48
  - 825e525
  - d4a4d3c
requirements:
  - UX-03
  - UX-05
---

# Plan 01-01 Summary — Toast host + node-meta 변환 매트릭스 foundation

## Delivered

Foundation work for UX-03 (변환 후 손실 toast) + UX-05 (정렬 비호환 toast).

### Files created

- `apps/web/src/app/toast-context.ts` (116 lines) — `ToastProvider` + `useToast` hook + 4 tone (`info`/`success`/`warn`/`error`) + dedupe/timer
- `apps/web/src/app/toast-host.tsx` (62 lines) — fixed bottom-right 렌더, `role="status"` + `aria-live="polite"` + 한국어 `aria-label="알림 닫기"`

### Files modified

- `apps/web/src/app/node-meta.ts` — `nodeTypeConversionMatrix`, `nodeTypeConversionDisabledReason`, `canConvertNodeType` 추가 (UX-03 12 호환 쌍 source-of-truth, +32 lines)
- `apps/web/src/app/page.tsx` — `ToastProvider` / `ToastHost` import + 최상위 래핑 + 마운트 (+5 lines)

## Verification

- `pnpm --filter web typecheck` → 0 errors
- 12 노드 type 모두 매트릭스 키로 존재
- 한국어 mandate 준수 (모든 메시지 한국어, 코드 주석 한국어)
- chrome 토큰만 사용 (직접 hex 미사용)

## Downstream consumers

- Plan 05 (UX-03): `useToast` + `nodeTypeConversionMatrix` 소비
- Plan 07 (UX-05): `useToast` (align/distribute 비호환 경고)
- Plan 06 (UX-04): `useToast` (drop placement 안내)

## Deviation: none

Plan as written.
