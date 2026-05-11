---
phase: 01-ux-fix
plan: 07
subsystem: ui/canvas
tags: [ux, selection, alignment, distribute, keyboard, a11y]
requires:
  - 01-01  # ToastProvider/useToast — onWarn 의존
  - 01-04  # useQuickAddShortcuts — !boxSelect.active 가드 추가
  - 01-06  # 좌측 패널 토글 등 기존 state 보존
provides:
  - BoxSelectOverlay  # Shift+drag 사각형 시각 컴포넌트
  - findNodesInBox  # intersect-mode DOM 검출 헬퍼
  - useAlignDistribute  # 6 정렬 + 2 분포 + 8 단축키 hook
affects:
  - apps/web/src/app/page.tsx  # boxSelect state + onMouseDown 분기 + global mousemove/mouseup + 2 hook wiring + aria-live region
tech-stack:
  added: []
  patterns:
    - global mousemove/mouseup capture (resize handler 동등)
    - data-dworks-node-id getBoundingClientRect intersect 검사
    - groupByParent 그룹 단위 정렬 (D-16)
    - updateNodeMeta inset patch (immutable, 부모 기준 상대 좌표)
key-files:
  created:
    - apps/web/src/app/box-select-overlay.tsx
    - apps/web/src/app/use-align-distribute.ts
  modified:
    - apps/web/src/app/page.tsx
decisions:
  - "D-12 박스 선택 트리거: Shift+drag + event.target === currentTarget"
  - "D-13 박스 시각: accent #6366f1 50% border + 10% bg + z-200"
  - "D-14 정렬 6 단축키 Alt+A/H/D/W/V/S (≥2 선택)"
  - "D-15 분포 2 단축키 Alt+Shift+H/V (≥3 선택)"
  - "D-16 공통 부모 그룹화 + non-absolute 자식 발견 시 그룹 skip + 1회 toast"
  - "UI-SPEC line 327 — aria-live polite 박스 선택 + 정렬/분포 한국어 알림 (체커 warning fix)"
metrics:
  duration_seconds: 480
  completed: 2026-05-11
  tasks: 3
  files_changed: 3
---

# Phase 1 Plan 07: UX-05 박스 선택 + 정렬/분포 Summary

Shift+drag 박스 선택 (intersect-mode) + 6 정렬 + 2 분포 단축키 (Alt+A/H/D/W/V/S, Alt+Shift+H/V) 구현 — 8 한국어 액션 이름 aria-live 알림 + 박스 선택 결과 N개 알림 (UI-SPEC line 327).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | BoxSelectOverlay + findNodesInBox + page.tsx mousedown 분기 + global mousemove/mouseup + aria-live region | `8912300` | apps/web/src/app/box-select-overlay.tsx (신규), apps/web/src/app/page.tsx |
| 2 | useAlignDistribute hook — 6 정렬 + 2 분포 + 8 단축키 + onAnnounce 한국어 액션 이름 | `8cbfadd` | apps/web/src/app/use-align-distribute.ts (신규) |
| 3 | page.tsx useAlignDistribute wiring + useQuickAddShortcuts !boxSelect.active 가드 | `a895e00` | apps/web/src/app/page.tsx |

## Key Implementation Details

### BoxSelectOverlay (Task 1, 114 lines)

- 시각: `pointer-events-none absolute z-200`, border `rgba(99,102,241,0.5)`, bg `rgba(99,102,241,0.1)` (D-13)
- 2px 미만 width/height 면 미렌더 — 클릭만 한 경우 화면 깜빡임 회피
- `findNodesInBox(boxClientRect, excludeIds)` — `[data-dworks-node-id]` 전부 순회 + intersect 검사
- SSR safety: `typeof document === 'undefined'` 가드 + 중복 id `seen` Set

### page.tsx 박스 선택 통합 (Task 1)

- `boxSelect` state: `{ active, startX, startY, endX, endY }` (logical px)
- `boxSelectAnnouncement` state — aria-live polite 한국어 알림 source
- onMouseDown 분기: `event.shiftKey && event.button === 0 && event.target === event.currentTarget` 만 트리거 (panning/middle-button 분기 보존)
- 좌표 변환: `(clientX - rect.left + scrollLeft) / canvasZoom` (logical px)
- 글로벌 mousemove/mouseup capture useEffect:
  - mousemove → endX/endY 업데이트 (state 보존 if active)
  - mouseup → start logical → client 역변환 → `findNodesInBox(rect, [tree.root.id])` → 첫 노드 primary + 나머지 additional (queueMicrotask 로 순서 보장 — selectedNodeId 변경이 additional reset 하므로)
  - 4px 미만 박스 → selection 변경 없이 종료 (클릭 동등)
  - cleanup 에서 `document.body.style.cursor` / `userSelect` 복원
- aria-live region: `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">` — main 마지막에 마운트 (ToastHost 옆)

### useAlignDistribute (Task 2, 397 lines)

- 헬퍼 4종:
  - `findNodeById(root, id)`, `findParent(root, childId)` — DFS
  - `groupByParent(tree, ids)` — 같은 부모 자식 그룹화 Map (D-16)
  - `measureNodeRect(id, wrapper, zoom)` — DOM getBoundingClientRect → logical 좌표
  - `setNodeInsetPatch(tree, id, patch)` — `updateNodeMeta` wrapper, 기존 inset merge
- 공통 `performAlign(actionKey, axis, anchor)` 핸들러 — 6 정렬 1개 helper 로 통일:
  - `axis='x'|'y'`, `anchor='min'|'center'|'max'`
  - 그룹별 anchor 좌표 계산 (min/center/max of children rects)
  - 각 자식 새 inset = newAxisLogical - parent 기준 좌표
- `performDistribute(actionKey, axis)` — sort by axis → first/last 고정 → 중간 균등 step 배치
- 8 useCallback: alignLeft/CenterH/Right/Top/CenterV/Bottom + distributeH/V
- keydown handler:
  - INPUT/TEXTAREA/SELECT/contentEditable 가드
  - `event.metaKey || event.ctrlKey` 차단 (⌘H hide / ⌘S save 충돌 회피)
  - `event.altKey` 필수
  - `event.shiftKey` 분기 → 분포 H/V
  - switch case 6: a/h/d/w/v/s → 정렬
- onAnnounce 호출은 `anyApplied && focusId` 일 때만 — 검증 실패/no-op 시 호출 안 함

### page.tsx 통합 (Task 3)

- import: `useAlignDistribute` from './use-align-distribute'
- 호출 인자:
  - `enabled`: `!commandPaletteOpen && !briefDrawerOpen && !inspectorDrawerOpen && !shortcutHelpOpen && !boxSelect.active`
  - `tree`, `selectedIds: allSelectedNodeIds`, `canvasScrollRef`, `canvasZoom`
  - `onCommit: commitTreeEdit`
  - `onWarn: (msg) => showToast(msg, 'warn')` — Plan 01 toast 재사용
  - `onAnnounce: setBoxSelectAnnouncement` — 박스 선택과 동일 aria-live region 공유 (체커 warning fix)
- `useQuickAddShortcuts.enabled` 에 `!boxSelect.active` 추가 — drag 중 quick-add 충돌 회피

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Box select destructure undefined when noUncheckedIndexedAccess**

- **Found during:** Task 1 typecheck
- **Issue:** `const [first, ...rest] = found` 에서 TS strict + noUncheckedIndexedAccess 조합으로 `first: string | undefined` 추론 → `setSelectedNodeId(first)` 가 `SetStateAction<string>` 에 대입 거부
- **Fix:** `const first = found[0]; if (first !== undefined) { const rest = found.slice(1); ... }` 패턴으로 변경 — undefined 가드 후 `first: string` 좁힘
- **Commit:** `8912300`

**2. [Rule 3 - Blocking] grep acceptance criterion 일치 위해 multi-line 조건을 single-line 으로 통합**

- **Found during:** Task 1 acceptance check
- **Issue:** 플랜 grep `"event.shiftKey && event.button === 0"` 가 multi-line `&&` chain 에서 매칭 안 됨
- **Fix:** `const isShiftLeftEmpty = event.shiftKey && event.button === 0 && event.target === event.currentTarget` 으로 통합 — 가독성 + grep 통과 양립
- **Commit:** `8912300`

**3. [Rule 2 - Critical] Plan 인터페이스 누락 인자 `canvasZoom` 추가**

- **Found during:** Task 2 설계
- **Issue:** Plan 의 `UseAlignDistributeArgs` 가 `canvasScrollRef` 만 명시했으나 측정 헬퍼가 canvas zoom 보정 필요 — wrapper 만으로는 logical 좌표 계산 불가
- **Fix:** `canvasZoom: number` 인자 추가, page.tsx 에서 `canvasZoom` state 전달
- **Commit:** `8cbfadd` (hook) + `a895e00` (wiring)
- **Rationale:** zoom 적용된 client rect 로부터 logical 좌표 역산하려면 zoom 값 필요. Plan PATTERNS.md 의 측정 헬퍼 시그니처도 `canvasZoom` 받음 (line 320). 인터페이스 충실성보다 정확성 우선.

**4. [Rule 1 - Bug] useAlignDistribute 의 selectedIds size < 2 검증 도중 root 만 단독 선택된 경우 처리**

- **Found during:** Task 2 설계
- **Issue:** `selectedIds` 에 root 가 포함되면 size 가 1 임에도 groupByParent 에서 root 제외 후 0 그룹 → toast 없이 silent return
- **Fix:** `groupByParent` 가 root 자체를 정렬 대상에서 제외 + 상위 size 가드는 그대로 유지 (size < 2 → toast). root 만 단독 선택 시 size = 1 → 정상적으로 toast 노출
- **Commit:** `8cbfadd`

### Architectural Decisions

- `performAlign(actionKey, axis, anchor)` 공통 헬퍼로 6 정렬 통합 — Plan 의 개별 callback 6 분리 대비 LOC 감소 + 동작 일관성 + bug fix 시 단일 지점 수정. useCallback 8개는 외부 API 만 유지.
- `boxSelectAnnouncement` 단일 state 가 박스 선택 + 정렬/분포 알림 _공유_ — 별도 aria-live 분리 시 동시 알림 race condition 우려. polite + atomic 으로 마지막 메시지 announce.

## Verification

| Item | Status |
|------|--------|
| pnpm --filter web typecheck | PASS (clean) |
| box-select-overlay.tsx ≥100 lines (114 actual) | PASS |
| use-align-distribute.ts ≥200 lines (397 actual) | PASS |
| 'use client' 첫 줄 (2 신규 파일) | PASS |
| BoxSelectOverlay + findNodesInBox export | PASS |
| useAlignDistribute export | PASS |
| accent rgba(99,102,241,..) ≥2 매칭 (border + bg) | PASS |
| page.tsx onMouseDown: event.shiftKey && event.button === 0 single-line | PASS |
| page.tsx <BoxSelectOverlay> 마운트 | PASS |
| page.tsx aria-live="polite" sr-only 신규 region | PASS |
| page.tsx "N개 노드 선택" 한국어 알림 | PASS |
| use-align-distribute: 6 정렬 callback + 2 분포 callback | PASS |
| use-align-distribute: 8 한국어 액션 이름 ('좌측 정렬' .. '세로 균등 분포') 각 1+ 매칭 | PASS |
| use-align-distribute: 한국어 경고 toast 3종 (≥2 / ≥3 / absolute) | PASS |
| use-align-distribute: keydown case a/h/d/w/v/s (6) + shiftKey 분기 + altKey 필수 + meta/ctrl 가드 | PASS |
| use-align-distribute: addEventListener/removeEventListener keydown | PASS |
| page.tsx: import useAlignDistribute + 호출 + onCommit/onWarn/onAnnounce wiring | PASS |
| page.tsx: useQuickAddShortcuts enabled 에 !boxSelect.active 추가 | PASS |

## Self-Check: PASSED

**Files verified to exist:**
- /Users/johyeonchang/dworks/apps/web/src/app/box-select-overlay.tsx ✓
- /Users/johyeonchang/dworks/apps/web/src/app/use-align-distribute.ts ✓
- /Users/johyeonchang/dworks/apps/web/src/app/page.tsx (modified) ✓

**Commits verified in git log:**
- 8912300 feat(01-07): UX-05 Shift+drag 박스 선택 overlay + intersect 검출 ✓
- 8cbfadd feat(01-07): UX-05 useAlignDistribute hook — 6 정렬 + 2 분포 + 8 단축키 ✓
- a895e00 feat(01-07): UX-05 page.tsx useAlignDistribute wiring + quick-add 충돌 가드 ✓

## Threat Flags

(없음 — T-01-10 mitigate: setNodeInsetPatch 이 spread 로 새 inset 객체 생성, updateNodeMeta 가 immutable tree 반환. T-01-11 accept: global mousemove 가 boxSelect.active 시에만 등록, 매 move 마다 setState 1회 — React batching 처리.)

## Known Stubs

(없음.)
