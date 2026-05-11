---
phase: 05-design-system
fixed_at: 2026-05-11T10:30:00Z
review_path: .planning/phases/05-design-system/05-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 05 (design-system) — Code Review Fix Report

**Fixed at:** 2026-05-11T10:30:00Z
**Source review:** `.planning/phases/05-design-system/05-REVIEW.md`
**Iteration:** 1
**Mode:** `--auto` (Warnings only, Info findings skipped per scope policy)

**Summary:**

- Findings in scope: 4 (Warnings)
- Fixed: 4
- Skipped: 0
- Info findings (7): out of scope per `--auto` mode, deferred for manual review

**Verification:**

- `pnpm typecheck` — 17/17 tasks successful
- `pnpm test` — 14/14 tasks successful (no regressions)

## Fixed Issues

### WR-04: palette `updatePalette` 검증 실패가 silent — 사용자 피드백 없음

**Files modified:** `apps/web/src/app/palette-context.ts`
**Commit:** `4212d73`
**Applied fix:** `updatePalette` 시그니처를 `(id, patch) => void` → `(id, patch) => boolean` 으로 변경. 유효성 검사 실패 시 `success=false` 플래그로 `setPalettes` / `persist` 호출을 스킵하고 `false` 반환. `addPalette` 의 `null` 반환 패턴과 일관된 실패 시그널.

### WR-01: palette name inline 편집이 매 keystroke localStorage write 발생

**Files modified:** `apps/web/src/app/palette-manager-dialog.tsx`
**Commit:** `8501e4a`
**Applied fix:** `editingName: { id, value } | null` 로컬 state 도입. `onChange` 는 `editingName` 만 갱신하고, `onBlur` 시점에 `updatePalette` 한 번만 호출. WR-04 의 boolean 반환을 활용해 실패 시 toast (`'팔레트 이름 변경 실패'`) 노출. 한국어 IME 자모 단위 keystroke 가 더 이상 localStorage 를 건드리지 않음.

### WR-02: dialog close 시 draft state 가 살아남아 다음 open 에 노출됨

**Files modified:** `apps/web/src/app/palette-manager-dialog.tsx`
**Commit:** `de70f07`
**Applied fix:** `useEffect([open])` 추가 — `open=false` 일 때 `draftName` / `draftColors` / `editingName` 모두 초기화. hook 순서 위반을 피하기 위해 `if (!open) return null` 이른 반환 위에 배치.

### WR-03: dialog 에 ESC 키 / focus trap / 초점 복원 미구현 (WCAG 2.1 키보드 위반)

**Files modified:** `apps/web/src/app/palette-manager-dialog.tsx`
**Commit:** `596402d`
**Applied fix:** `useEffect([open, onClose])` 에서 `open=true` 일 때 `window.addEventListener('keydown', …)` 등록 — Escape 키 누르면 `e.preventDefault()` + `onClose()`. 동일 effect 에서 열기 직전 `document.activeElement` 를 기억해 cleanup 단계에서 `focus()` 복원. detached element 등 `focus()` throw 가능성은 `try/catch` 로 안전 처리. focus trap (Tab cycle) 은 deferred — headlessui Dialog 도입 시점에 일괄 처리 권장 (REVIEW.md WR-03 fix 가이드와 일치).

## Skipped Issues

None — all 4 Warning findings fixed cleanly.

## Out-of-Scope (Info findings — deferred)

다음 7개 Info 항목은 `--auto` 모드에서 의도적으로 스킵. 별도 사이클에서 처리 권장:

- IN-01: hex regex 의도 주석에 alpha 미지원 명시
- IN-02: `setTheme` defensive check (런타임 invalid 값 거부)
- IN-03: `generateId` 가 `crypto.randomUUID` 우선 시도
- IN-04: 색 picker key=idx — reorder 미구현이라 현재는 OK, v3 시점에 stable id
- IN-05: token 키 prefix 통일 (`'dw-color-1'`, `'dw-space-24'`)
- IN-06: token-export `.ts` 가 Tailwind v3 호환 — README 에 v4 사용자 안내
- IN-07: `tokens.test.ts` 에 한글 fontFamily JSON 직렬화 fixture 추가

---

_Fixed: 2026-05-11T10:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
