---
phase: 03-visual-aids
plan: 02
subsystem: visual-aids
tags: [zoom, viewport-center-pivot, useCallback, keyboard-shortcut, toolbar, command-palette, context-menu]
requires:
  - apps/web/src/app/page.tsx (canvasZoom, canvasScrollRef, pendingZoomAnchorRef, CanvasZoomControl)
provides:
  - 'setZoomWithCenterPivot helper (number | (prev)=>next 두 시그니처)'
  - 'toolbar +/- 버튼 + ⌘0/⌘+/⌘- + ⌘K zoom-100 + GlobalContextMenu reset 모두 viewport 중앙 pivot 통일'
affects:
  - apps/web/src/app/page.tsx (1 file, 5 진입점 + 1 helper + 1 import)
tech-stack:
  added:
    - react.useCallback (page.tsx import 추가)
  patterns:
    - 'pendingZoomAnchorRef cursor-anchor 단일 보정 effect 재사용 (line 3470-3487)'
    - 'cursorX=rect.width/2, cursorY=rect.height/2 viewport 중앙 pivot'
    - 'number | ((prev)=>next) 두 시그니처 — keydown effect stale closure 회피'
    - 'clamp 0.25~2.0 + prev===next noop 을 helper 단일 위치에 캡슐화'
key-files:
  created: []
  modified:
    - apps/web/src/app/page.tsx
decisions:
  - 'helper 시그니처 number | ((prev)=>next) — keydown effect dep 에 canvasZoom 추가하지 않고도 ⌘+/⌘- 가 항상 최신 값 기준으로 ±0.1 계산'
  - 'CanvasZoomControl onChange: (next: number) => void 시그니처 그대로 호환 — 인라인 wrapper 불필요'
  - '⌘0 리셋 surface 3 곳 (keydown / 명령 팔레트 / GlobalContextMenu) 모두 동일 helper 로 통일 — Rule 2 일관성'
  - 'handleCanvasFit (⌘1) / handleZoomToSelection (⌘2) / wheel cursor-pivot 은 변경 없음 — 의도된 별도 동작 (pendingDirectScrollRef 또는 실제 cursor 좌표)'
  - 'canvasScrollRef null 시(초기 mount) anchor 없이 setCanvasZoom — 보정 effect 가 anchor null 분기 처리'
metrics:
  duration: ~8 min
  completed: 2026-05-11
---

# Phase 3 Plan 2: VIS-02 viewport 중앙 pivot 줌 통일 Summary

**Result**: toolbar `+/-` 버튼 + 키보드 ⌘0/⌘+/⌘- + 명령 팔레트 zoom-100 + GlobalContextMenu reset 5 진입점이 _canvas viewport 중앙_ 을 pivot 으로 줌하도록 통일. wheel ⌘+scroll 의 _cursor 위치_ pivot 은 보존.

## Implementation

### Helper definition (apps/web/src/app/page.tsx:3405-3429)

`pendingDirectScrollRef` 정의 직후에 `setZoomWithCenterPivot` 헬퍼를 useCallback 으로 정의:

- 인자: `number | ((prev: number) => number)` — 직접 값 또는 prev 기반 delta 계산
- canvasScrollRef.current.getBoundingClientRect() 호출 후 rect 중앙(rect.width/2, rect.height/2)을 cursorX/cursorY 로 저장
- `setCanvasZoom((prev) => ...)` 안에서 raw 값 → clamp 0.25~2.0 → prev===next noop → pendingZoomAnchorRef 저장 + next 반환
- canvasScrollRef 가 mount 전이면 target null — anchor 없이 setCanvasZoom 만 호출 (보정 effect 가 안전 skip)

### 진입점 5곳 wiring (모두 동일 helper)

| Site | 위치 | 전 → 후 |
|---|---|---|
| 1) 키보드 ⌘0 리셋 | page.tsx:3216 | `setCanvasZoom(1)` → `setZoomWithCenterPivot(1)` |
| 2) 키보드 ⌘+/⌘= 줌인 | page.tsx:3235 | `setCanvasZoom((z) => Math.min(2, ...))` → `setZoomWithCenterPivot((z) => z + 0.1)` |
| 3) 키보드 ⌘- 줌아웃 | page.tsx:3242 | `setCanvasZoom((z) => Math.max(0.25, ...))` → `setZoomWithCenterPivot((z) => z - 0.1)` |
| 4) 명령 팔레트 zoom-100 action | page.tsx:3710 | `setCanvasZoom(1)` → `setZoomWithCenterPivot(1)` |
| 5) toolbar CanvasZoomControl onChange | page.tsx:5083 | `onChange={setCanvasZoom}` → `onChange={setZoomWithCenterPivot}` |
| 6) GlobalContextMenu onZoomReset | page.tsx:5656 | `() => setCanvasZoom(1)` → `() => setZoomWithCenterPivot(1)` |

(plan 의 must_haves 4 site + Rule 2 일관성 확장 2 site)

### 변경 없음

- `handleCanvasFit` (⌘1, line 3009) — 자체 zoom 계산 + pendingDirectScrollRef 없이 직접 setCanvasZoom — 별도 동작 의도
- `handleZoomToSelection` (⌘2, line 3048) — pendingDirectScrollRef 로 노드 중심을 화면 중심에 맞추는 별도 패턴
- wheel onWheel 핸들러 (line 3437~) — 실제 cursor 좌표를 anchor 로 저장 (Figma 표준)
- 보정 effect (line 3470-3487) — pendingZoomAnchorRef 분기 + pendingDirectScrollRef 분기 그대로 재사용

### keydown effect dep 배열 변경 없음

⌘+/⌘- 가 `setZoomWithCenterPivot((z) => z + 0.1)` 의 functional updater 변형을 사용하므로 keydown closure 가 `canvasZoom` 을 캡처하지 않음 — 기존 dep `[historyPast, historyFuture, selectedNodeId, tree, shortcutHelpOpen, commandPaletteOpen, briefDrawerOpen, inspectorDrawerOpen, additionalSelectedNodeIds, allSelectedNodeIds]` 보존.

`setZoomWithCenterPivot` 은 `useCallback([])` 으로 ref-stable — closure 도 새 instance 생성 안 함.

## Verification

- `pnpm --filter web typecheck` — clean (no errors)
- `grep -nE "setZoomWithCenterPivot" page.tsx` — 7 occurrences (1 definition + 6 consumers, 예상치와 정확 일치)
- 잔존 `setCanvasZoom` 5 곳:
  - 675 `useState` 선언
  - 1052 localStorage 복원 (초기 mount)
  - 3009 `handleCanvasFit` (별도 동작, 의도 보존)
  - 3048 `handleZoomToSelection` (pendingDirectScrollRef 패턴)
  - 3443 wheel onWheel (실제 cursor anchor, 의도 보존)
- 수동(다음 세션 사용자 확인 권장): canvas 중앙에 마커 두고 toolbar `+` 클릭 → 같은 위치 유지 / ⌘+ → 동일 / ⌘0 → 100% 중앙 / wheel ⌘+scroll → cursor 아래 점 유지

## Threat Flags

없음. 변경은 클라이언트 측 좌표 계산만, 새 네트워크/auth/file/IO surface 없음.

## Deviations from Plan

### Rule 2 - 일관성 확장

**1. [Rule 2 - Consistency] 명령 팔레트 zoom-100 (page.tsx:3710) 도 setZoomWithCenterPivot 사용**
- **Found during:** Task 2 (⌘0 keydown 교체 직후 동일 액션의 다른 surface 발견)
- **Issue:** plan 의 must_haves 는 keydown ⌘0 만 명시. 명령 팔레트 `zoom-100` action 도 같은 "줌 100% 리셋" UX 인데 setCanvasZoom(1) 직접 호출 — 사용자가 ⌘K → "줌 100% 리셋" 으로 리셋했을 때 viewport 중앙 pivot 동작이 누락되면 일관성 깨짐.
- **Fix:** action 을 `() => setZoomWithCenterPivot(1)` 로 교체.
- **Files modified:** apps/web/src/app/page.tsx:3710
- **Commit:** 280884c

**2. [Rule 2 - Consistency] GlobalContextMenu onZoomReset (page.tsx:5656) 도 동일 helper**
- **Found during:** Task 2 (final audit)
- **Issue:** 우클릭 컨텍스트 메뉴의 "줌 리셋" 도 setCanvasZoom(1) 직접 — 동일 일관성 이슈.
- **Fix:** `onZoomReset={() => setZoomWithCenterPivot(1)}` 로 교체.
- **Files modified:** apps/web/src/app/page.tsx:5656
- **Commit:** 280884c

### Plan 라인 번호 보정

Plan 은 ⌘0=line 3174, ⌘+/⌘=line 3192, ⌘-=line 3200 등을 명시했으나 실제 파일에서는 각각 line 3213/3231/3239 (Phase 1 누적 변경분 영향). grep 으로 정확한 위치 확인 후 교체 — 동일 코드 패턴이므로 라인 차이만 있음.

## Self-Check: PASSED

**Files modified:**
- /Users/johyeonchang/dworks/apps/web/src/app/page.tsx — FOUND (M)

**Commits:**
- 7ab2cf5 — FOUND (Task 1: helper + toolbar onChange)
- 280884c — FOUND (Task 2: keydown ⌘0/⌘+/⌘- + 명령 팔레트 + context menu)

**Truth check (plan must_haves.truths):**
- [x] toolbar `+/-` 버튼 클릭 viewport 중앙 pivot — line 5083
- [x] ⌘+ / ⌘= 동일 — line 3235
- [x] ⌘- 동일 — line 3242
- [x] ⌘0 동일 — line 3216
- [x] wheel ⌘+scroll cursor-anchor pivot 영향 없음 — line 3437 onWheel 변경 없음
- [x] pendingZoomAnchorRef 단일 보정 effect 변경 없음 — line 3470-3487 보존
- [x] clamp 0.25~2.0 모든 진입점 동일 — helper 내부 단일 위치 캡슐화로 보장
