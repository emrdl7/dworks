---
phase: 01-ux-fix
plan: 02
subsystem: ui
tags: [context-menu, viewport-boundary, ux-fix, react, useEffect]
requirement: UX-01
status: done
type: verification-stub

# Dependency graph
requires:
  - phase: v1
    provides: NodeContextMenu 컴포넌트 (page.tsx:5375)
provides:
  - UX-01 완료 기록 — boundary auto-flip 검증 결과를 phase SUMMARY 로 박음
affects: [01-ux-fix 후속 plan (UX-02..UX-06), Phase 1 Success Criterion #1 추적]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useEffect + getBoundingClientRect 로 mount 후 viewport clamp"
    - "Math.max(margin, vw - rect.width - margin) 로 좌/상 flip"

key-files:
  created:
    - .planning/phases/01-ux-fix/01-02-SUMMARY.md
  modified: []

key-decisions:
  - "코드 수정 0 — UX-01 은 이미 commit 679bfb6 에서 적용 완료"
  - "본 plan 은 verification stub — 회귀 부재 + Phase SUMMARY 기록만 수행"

patterns-established:
  - "기존 완료 작업의 retroactive plan 화 — commit hash 인용 + grep 검증으로 무코드 SUMMARY 작성"

requirements-completed:
  - UX-01

# Metrics
duration: 3min
completed: 2026-05-11
---

# Phase 01 Plan 02 SUMMARY — UX-01 NodeContextMenu boundary auto-flip 검증

**코드 수정 없음 — UX-01 boundary auto-flip 은 commit `679bfb6` 에서 이미 완료. 본 plan 은 grep 으로 회귀 부재를 확인하고 phase 기록에 박는 verification stub.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-11T03:47:26Z
- **Completed:** 2026-05-11T03:50:00Z (대략)
- **Tasks:** 2 (검증 + SUMMARY 작성)
- **Files modified:** 0 (source) / 1 (doc 신규)

## What Was Built

**소스 코드 수정 없음.** UX-01 ("NodeContextMenu 가 화면 우측/하단 boundary 근처에서 auto-flip 으로 모든 항목 보임") 은 사용자 비판 직후 commit `679bfb6 fix: NodeContextMenu 화면 boundary auto-flip — UX-01 (사용자 비판)` 에서 이미 적용됨.

본 plan 의 산출물은 `01-02-SUMMARY.md` (현재 문서) 하나로, ROADMAP Phase 1 Success Criterion #1 의 _이미 완료_ 사실을 PLAN/SUMMARY 워크플로우에 통합한다. Wave 1 의 가장 가벼운 plan — 코드 충돌 위험 0.

## Verification

### git log 확인

```
679bfb6 fix: NodeContextMenu 화면 boundary auto-flip — UX-01 (사용자 비판)
```

`git log --oneline | grep -E "679bfb6|NodeContextMenu.*boundary"` 매칭 1건 확인.

### 코드 위치 + clamp 로직 확인

`apps/web/src/app/page.tsx` 의 `NodeContextMenu` 함수 (line 5375) 안 `useEffect` 블록 (line 5398–5424) 에 viewport boundary clamp 로직 존재.

```bash
sed -n '5400,5500p' apps/web/src/app/page.tsx | grep -nE "window\.inner|Math\.(min|max)"
```

매칭 결과:

| Line (relative) | Code |
|---|---|
| 6 | `const vw = window.innerWidth` |
| 7 | `const vh = window.innerHeight` |
| 13 | `left = Math.max(margin, vw - rect.width - margin)` |
| 17 | `top = Math.max(margin, vh - rect.height - margin)` |

총 4건 매칭 (acceptance criteria ≥3 만족). `window.innerWidth/Height` 로 viewport 측정, `Math.max(margin, vw - rect.width - margin)` 로 우측 초과 시 좌측으로 flip, `Math.max(margin, vh - rect.height - margin)` 로 하단 초과 시 위쪽으로 flip.

핵심 로직 발췌:

```tsx
const rect = el.getBoundingClientRect()
const vw = window.innerWidth
const vh = window.innerHeight
const margin = 8
let left = position.x
let top = position.y
// 우측 초과: 메뉴 폭만큼 좌측으로 flip (cursor 왼쪽으로 펼침)
if (left + rect.width + margin > vw) {
  left = Math.max(margin, vw - rect.width - margin)
}
// 하단 초과: 메뉴 높이만큼 위로 flip
if (top + rect.height + margin > vh) {
  top = Math.max(margin, vh - rect.height - margin)
}
```

`useEffect([position])` 안에서 mount 후 `getBoundingClientRect()` 로 실제 메뉴 크기 측정 → `adjustedPosition` state 로 clamp 결과 반영. React 의 render → mount → measure → re-render 사이클로 깜빡임 없이 flip 처리.

## Goal Alignment

**ROADMAP Phase 1 Success Criterion #1:** "NodeContextMenu 가 화면 우측/하단 boundary 근처에서 _flip_ 으로 모든 항목 보임" — **충족**.

- 우측 boundary: `left + rect.width + margin > vw` 검사 후 `vw - rect.width - margin` 으로 클램프 → cursor 왼쪽으로 펼침
- 하단 boundary: `top + rect.height + margin > vh` 검사 후 `vh - rect.height - margin` 으로 클램프 → cursor 위쪽으로 펼침
- 8px margin 으로 viewport edge 와 충돌 방지
- `Math.max(margin, ...)` 으로 좌/상단 음수 좌표 방지 (메뉴가 viewport 보다 큰 극단 케이스 대비)

## Decisions Made

- 본 plan 은 verification stub — 코드 변경 0. 향후 같은 패턴 (기존 완료 작업 retroactive plan) 으로 재사용 가능.
- Playwright 자동 회귀 테스트는 _현재 미구현_ — Phase 1 종료 후 별도 testing phase 에서 일괄 도입 예정 (deferred).

## Deviations from Plan

None — plan executed exactly as written. 2 tasks, 코드 수정 0, SUMMARY 1개 신규.

## Issues Encountered

None.

## User Setup Required

None — 외부 서비스 / 환경 변수 / 인증 의존성 없음.

## Notes

- **Multi-monitor 컨텍스트 메뉴 follow-up** 은 `01-CONTEXT.md` 의 `<deferred>` 섹션에 박혀 있음 — 현재는 단일 viewport 기준만 처리, multi-monitor 시 `window.screen` 좌표계 보강은 v3.0+.
- **회귀 테스트 (Playwright)** 미작성 — 향후 testing phase 에서 viewport 1280x720 / 1920x1080 양쪽에서 우하단 우클릭 → 메뉴 flip 자동 캡처 회귀 검증 추가 예정.
- **수동 회귀 검증 권장:** 개발자가 임의 노드 우클릭을 화면 우측/하단 근처에서 시도해 메뉴 항목 잘림 없음 육안 확인.

## Next Phase Readiness

- UX-01 완료 사실이 phase SUMMARY 로 박힘 → ROADMAP Phase 1 Success Criterion #1 추적 가능
- Wave 1 의 다른 plan (UX-02..UX-06) 과 코드 충돌 위험 0 — 본 plan 은 read-only
- Phase 1 잔여 5건 (UX-02..UX-06) 진행 가능

## Task Commits

1. **Task 1: NodeContextMenu boundary auto-flip 회귀 검증** — 코드 수정 0 (verification only, no commit)
2. **Task 2: 01-02-SUMMARY.md 작성** — 본 문서 (commit 예정, 최종 docs commit 에 포함)

**Plan metadata commit:** (최종 단계에서 생성)

## Self-Check: PASSED

- `01-02-SUMMARY.md` 파일 존재 확인 (FOUND)
- commit `679bfb6` git log 존재 확인 (FOUND)
- Task 1 verify: `window.innerWidth/Height` + `Math.max` 매칭 4건 (≥3 만족)
- Task 2 verify: `UX-01|679bfb6|boundary` 매칭 16건 (≥5 만족)

---

*Phase: 01-ux-fix*
*Plan: 02*
*Completed: 2026-05-11*
