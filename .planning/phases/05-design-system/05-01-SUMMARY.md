---
phase: 05-design-system
plan: 01
completed: 2026-05-11
status: complete
commits:
  - 46d503c
  - 3efc3a7
  - 656ddcb
requirements:
  - DS-01
---

# Plan 05-01 Summary — Theme switcher (DS-01)

## Delivered

3 테마 (dark/light/sepia) chrome 토큰 swap. localStorage 영속화. ⌘K 명령 팔레트 변경 UI.

### Files created/modified

- `apps/web/src/app/globals.css` (modified) — `[data-theme="light"]` + `[data-theme="sepia"]` 토큰 set 각 25개 chrome 토큰 (bg/panel/elevated/soft/strong + text 5종 + border + accent 6종 + warn 4종 + danger 4종)
- `apps/web/src/app/theme-context.ts` (created) — `ThemeProvider` + `useTheme` hook + `Theme = 'dark' | 'light' | 'sepia'` + localStorage `dw:theme:v1` 동기 (createElement 패턴, .ts 확장자)
- `apps/web/src/app/page.tsx` (modified) — `ThemeProvider` wrap + `useTheme` 호출 + ⌘K 3 액션 ('테마: 다크/라이트/세피아')

### Verification

- `pnpm --filter @dworks/web typecheck` → exit 0
- `pnpm --filter @dworks/web test` → 376/376 pass (regression 0)

## 테마 토큰 mapping

| Theme | bg | text-primary | accent | 톤 |
|-------|-------|--------------|--------|-----|
| dark (기본 :root) | #0d0e10 | #ebecef | #6366f1 | 어두운 navy |
| light | #ffffff | #1a1d22 | #6366f1 (브랜드 일관) | 깨끗한 흰 |
| sepia | #f5e6d3 | #3d2a1f | #c2410c | warm 베이지 (orange accent) |

## Deviations

1. **[Rule 1] theme-context.ts uses createElement (NOT JSX).** `.ts` 확장자 — toast-context.ts 와 동일 패턴 유지. `.tsx` 로 rename 시 2-file 컨벤션 깨짐.
2. **[Rule 3] layout.tsx 미수정 (plan files_modified 에는 listed).** layout.tsx 는 server component — localStorage 접근 불가. hydration 책임은 ThemeProvider 의 useEffect 가 담당 (D-04 결정). server 측 기본 dark = `:root` 이므로 hydration 전 flash 없음.

## Downstream consumers

- Plan 05-02 (palette manager) — useTheme + 토큰 swap 동작 확인 필요 시 활용
- v3 future — theme 별 palette 자동 매핑
