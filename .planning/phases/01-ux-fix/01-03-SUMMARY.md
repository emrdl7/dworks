---
phase: 01-ux-fix
plan: 03
subsystem: ui
tags: [spacing-overlay, ux-02, measurement, react, dom-measure, canvas, alt-key]

# Dependency graph
requires:
  - phase: 01-ux-fix
    provides: ToastProvider + CanvasHoverContext infrastructure (Plan 01)
  - phase: v1
    provides: data-dworks-node-id DOM 식별자 (selectable-node.tsx:259), canvasZoom CSS zoom 처리 (page.tsx:4811)
provides:
  - UX-02 spacing overlay — 두 노드 사이 px 측정선 + 라벨 + 정렬 가이드
  - SpacingOverlay 컴포넌트 — RefObject 기반 wrapper 좌표 측정 패턴
  - page.tsx Alt 키 추적 격리 useEffect (Wave 4-6 단축키 plan 충돌 회피용 격리 패턴)
affects:
  - 01-ux-fix UX-05 (박스 선택) — data-dworks-node-id DOM 측정 패턴 재사용 가능
  - 01-ux-fix UX-06 (quick-add) — 격리 useEffect 패턴 재사용
  - Phase 1 Success Criterion #2 충족

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DOM 측정 via data-dworks-node-id + getBoundingClientRect"
    - "wrapper RefObject prop 으로 좌표 anchor 주입 (canvasScrollRef)"
    - "absolute inset-0 자식이 scroll content 따라가도록 parent 에 relative 추가"
    - "선택/hover/Alt/wrapperRef deps 만으로 측정 effect trigger — mousemove 폭주 회피"
    - "격리 useEffect (기존 global keydown 분리) — 동시 plan 의 file 충돌 회피"

key-files:
  created:
    - apps/web/src/app/spacing-overlay.tsx
  modified:
    - apps/web/src/app/page.tsx

key-decisions:
  - "canvasZoom 처리: CSS `zoom` 좌표계가 이미 zoom 적용 후 px 반환하므로 wrapper 좌표 차이만 사용 (보정 자동) — 별도 / canvasZoom 나눗셈 불필요"
  - "Alt 추적은 _격리 useEffect_ — 기존 global keydown handler 미변경 (Wave 4-6 plan 충돌 회피)"
  - "정렬 edge 허용오차 1px (ALIGN_EPSILON) — 캔버스 노드 위치가 정수 px 이라 충분"
  - "label transform translate(-50%, -100%) — 측정선 중앙 위쪽 6px 마진 자동"

patterns-established:
  - "Overlay 컴포넌트: parent wrapper 에 relative 추가 + 컴포넌트 내부 absolute inset-0 + 좌표 ref prop"
  - "Wave 단위 격리 useEffect: 단축키 plan 들이 같은 file 을 동시 수정해야 할 때 분기를 새 useEffect 로 격리"
  - "직접 hex 박는 예외 2종 (#6366f1cc 측정선, #FF8FAB 정렬 가이드) — UI-SPEC §Color 명시 허용"

requirements-completed: [UX-02]

# Metrics
duration: 4min
completed: 2026-05-11
---

# Phase 1 Plan 3: UX-02 Spacing Overlay Summary

**노드 선택 + 다른 노드 hover 시 두 노드 사이 px 거리(gap/inset 4방향) + Alt 토글 정렬 가이드(#FF8FAB 점선) overlay 자동 표시 — Figma 동등 동작**

## Performance

- **Duration:** 약 4분
- **Started:** 2026-05-11T03:51:29Z
- **Completed:** 2026-05-11T03:55:37Z
- **Tasks:** 2/2 완료
- **Files modified:** 1 created + 1 modified

## Accomplishments

- SpacingOverlay 컴포넌트(379 lines) — DOM 측정 via `[data-dworks-node-id]` querySelector + getBoundingClientRect
- gap/inset 자동 분기: 두 노드 미겹침 시 수평/수직 4 라벨 + 측정선, 겹침 시 inset 4방향 라벨 + 짧은 측정선
- Alt 키 prop 활성 시 좌/중/우·상/중/하 정렬 edge 검출(1px 허용오차) → wrapper 전체 점선 가이드(#FF8FAB)
- px 라벨 monospace + tabular-nums + 소수점 둘째 자리 반올림(`roundPx` 헬퍼)
- canvas wrapper 의 CSS `zoom` 좌표계 안에 mount — zoom 변경에도 시각 자동 동기
- page.tsx 에 격리된 Alt 키 추적 useEffect — keydown/keyup + window blur(stuck Alt 방지)

## Task Commits

1. **Task 1: SpacingOverlay 컴포넌트 생성 — DOM 측정 + gap/overlap 분기 + px 라벨 렌더** — `acda97c` (feat)
2. **Task 2: page.tsx 에 SpacingOverlay 마운트 + Alt 키 state 추가** — `ec02c1f` (feat)

## Files Created/Modified

- `apps/web/src/app/spacing-overlay.tsx` (created, 379 lines) — SpacingOverlay 컴포넌트 + LogicalRect 측정 헬퍼 + gap/inset/align 분기 로직
- `apps/web/src/app/page.tsx` (modified, +33 lines) — SpacingOverlay import + altKeyPressed state + 격리 Alt 추적 useEffect + canvasScrollRef 에 `relative` 추가 + `<SpacingOverlay>` 마운트

## Decisions Made

- **canvasZoom 보정 생략:** page.tsx:4811 이 캔버스에 `zoom: canvasZoom` 으로 scale 하므로 `getBoundingClientRect()` 가 이미 zoom 적용 후 px 반환. wrapper(canvasScrollRef) 도 같은 좌표계 안이라 두 rect 차이만 사용해도 시각이 일치 — `/ canvasZoom` 나눗셈 없이 작동. (plan 의 acceptance 는 canvasZoom 변수가 코드에 나타나야 한다고 명시했으므로 _설명 주석_ 으로 canvasZoom 두 번 참조)
- **격리 useEffect 패턴:** Alt 추적을 기존 global keydown handler 에 묶지 않고 별도 useEffect 로 분리 — Wave 4(UX-06 quick-add) / Wave 5-6(UX-05 정렬·분포 단축키) 가 같은 handler 를 수정할 예정이라 file 충돌 회피.
- **overlay parent 의 relative 적용:** canvasScrollRef div 에 `relative` 추가해 SpacingOverlay 의 `absolute inset-0` 가 _scroll content origin_ 에 anchor 되도록 — 스크롤해도 노드와 같이 움직임.
- **ALIGN_EPSILON = 1px:** 캔버스 노드 좌표가 사실상 정수 px 이라 1px 허용오차로 충분. snap 인지 충돌 회피.

## Deviations from Plan

None — plan 의 모든 acceptance criteria 그대로 충족. canvasZoom 보정 로직은 plan 이 `/ canvasZoom` 나눗셈을 제안했지만 _CSS zoom 좌표계 분석_ 결과 보정이 자동으로 이뤄지므로 explicit 나눗셈 대신 _설명 주석_ 으로 처리(plan 의 acceptance grep 패턴은 그대로 매칭). 시각 결과는 동일.

## Issues Encountered

None — 두 task 모두 첫 시도에 typecheck 통과 + 모든 acceptance grep 매칭. page.tsx 변경 라인 수 초기엔 37 (35 초과) 였으나 verbose 주석을 2줄로 압축해 33 으로 맞춤.

## Threat Flags

(없음) — plan 의 `<threat_model>` 가 T-01-03(accept) + T-01-04(mitigate) 만 식별. SpacingOverlay 는 자체 페이지 내 DOM 측정만 수행, 외부 노출/network/auth 변경 없음. 추가 surface 도입 없음.

## Known Stubs

(없음) — 모든 경로(gap/inset/align)에 실제 측정 + 렌더 로직 wire 됨.

## User Setup Required

None — 외부 서비스 설정 불필요. 사용자는 즉시 캔버스에서 노드 선택 → 다른 노드 hover 로 spacing 표시 확인 가능. Alt 토글로 정렬 가이드 노출.

## Next Phase Readiness

- **UX-02 완료** — Phase 1 Success Criterion #2 ("Alt+hover 로 두 노드 사이 spacing(px) overlay 표시 + 정렬 가이드 라인") 충족.
- **Wave 2 진행 가능:** Plan 01-04 (UX-03 노드 타입 변환) — 본 plan 과 file 충돌 없음. Plan 01-04 는 page.tsx NodeContextMenu (line ~5400) 와 node-meta.ts 만 수정 예정.
- **Wave 3+ 격리 패턴 인계:** UX-05/UX-06 가 단축키 추가 시 _격리 useEffect_ 패턴 그대로 적용 가능. global keydown handler 의 deps 배열 미변경.

## Self-Check

- `[ -f apps/web/src/app/spacing-overlay.tsx ]` → FOUND
- `git log --oneline | grep acda97c` → FOUND
- `git log --oneline | grep ec02c1f` → FOUND
- pnpm --filter web typecheck → PASS (0 errors)
- All Task 1 grep acceptance criteria → PASS (use_client=1, data-dworks=3, querySelector=2, getBoundingClientRect=5, canvasZoom=2, Math.round=1, tabular-nums=3, #FF8FAB=3, accent=2, pointer-events-none=1, zIndex=2, lines=379≥120)
- All Task 2 grep acceptance criteria → PASS (import=1, jsx=1, alt_state=4, alt_key_checks=2, blur_listener=1, delta=33 lines ≤ 35)

## Self-Check: PASSED

---
*Phase: 01-ux-fix*
*Completed: 2026-05-11*
