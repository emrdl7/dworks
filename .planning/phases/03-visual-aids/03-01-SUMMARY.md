---
phase: 03-visual-aids
plan: 01
subsystem: visual-aids
tags: [grid, overlay, snap, column-span, shortcut, localStorage]
requires:
  - apps/web/src/app/spacing-overlay.tsx (overlay 표준 analog)
  - apps/web/src/app/page.tsx (canvasZoom, canvasScrollRef, selectedViewportPreset, uiPrefs)
  - apps/web/src/app/command-palette.tsx (SHORTCUT_GROUPS, CommandPaletteItem)
provides:
  - GridOverlay component (12-col + 11-gutter absolute child, zoom-aware via parent CSS zoom)
  - computeColumnEdges / snapToColumnEdge / computeColumnSpan helpers (tested)
  - G 단축키 + toolbar Grid3x3 버튼 + ⌘K '시각 보조' group + ShortcutHelpModal '시각 보조' category
  - selectedColumnSpan label (1/2/3/4/6/12 cols, ±4px tolerance)
  - dw:uiPrefs:v1 의 gridOverlayEnabled 필드(영속화)
affects:
  - apps/web/src/app/page.tsx (5 edit sites: import, state, uiPrefs hydrate/persist, keydown, toolbar+mount, commandItems)
  - apps/web/src/app/command-palette.tsx (1 site: SHORTCUT_GROUPS append)
tech-stack:
  added:
    - lucide-react Grid3x3 icon (page.tsx + command-palette 모두 시각화 사용 없음)
  patterns:
    - 'pointer-events-none absolute inset-0' wrapper (spacing-overlay 동일)
    - viewport box(CSS zoom: canvasZoom) 내부 absolute child → zoom 자동 추종
    - rgba(99,102,241,α) accent 변형 — column α=0.06 / gutter α=0.10
    - 빈 group → 후속 plan(VIS-02/03)에서 같은 group 에 엔트리 추가 예정
key-files:
  created:
    - apps/web/src/app/grid-overlay.tsx (153 lines)
    - apps/web/src/app/grid-overlay.test.ts (110 lines, 14 tests / 3 suites)
  modified:
    - apps/web/src/app/page.tsx
    - apps/web/src/app/command-palette.tsx
decisions:
  - 'GridOverlay 를 canvasScrollRef 가 아닌 viewport box 내부에 mount — 부모 CSS zoom 자동 추종 + containerWidth=selectedViewportPreset.width 자연 매칭'
  - 'viewport box 에 position:relative 추가(absolute child 가 좌표계 anchor 해야 함)'
  - 'snapGuideX 가이드 렌더 + state 인프라는 박았지만 컴퓨트 호출 site 부재(자유위치 드래그 미구현) — helper export 만 노출, 통합은 후속 plan/feature 에서'
metrics:
  duration: ~25 min
  completed: 2026-05-11
---

# Phase 3 Plan 01: VIS-01 12-col Grid Overlay + Snap + Column Count Label Summary

12-col grid overlay (12 column + 11 × 16px gutter, accent rgba) + G/⌘K/toolbar 토글 3-route + dw:uiPrefs:v1 영속화 + selectedColumnSpan(1/2/3/4/6/12) toolbar 라벨을 캔버스에 추가했다. snap-to-column helper 와 #FF8FAB 가이드 인프라는 export/렌더 박았지만, 현행 codebase 에 자유위치 노드 드래그 site 가 없어 컴퓨트 호출은 후속 통합으로 deferred.

## 결과물

### grid-overlay.tsx (신규 — 153줄)

| Export | Signature | 역할 |
|---|---|---|
| `GridOverlay` | `(props: GridOverlayProps): ReactElement \| null` | enabled=false 면 null. else `pointer-events-none absolute inset-0` wrapper 안 12 column + 11 gutter 박스 렌더. |
| `computeColumnEdges` | `(containerWidth, columnCount=12, gutterPx=16): number[]` | column 시작점 + 끝점 정렬 배열 (24 edge). |
| `snapToColumnEdge` | `(value, edges, threshold=4): { value, snapped, edge }` | 가장 가까운 edge 와 ≤4px 면 스냅. |
| `computeColumnSpan` | `(widthLogical, containerWidth, columnCount=12, gutterPx=16, tolerance=4): number \| null` | 1/2/3/4/6/12 후보 중 ±4px 일치하는 span 반환. |

색상: `rgba(99, 102, 241, 0.06)` (column) / `rgba(99, 102, 241, 0.10)` (gutter) — `--dw-ui-accent` 변형 (D-02 잠금). zIndex 50 (D-03).

### page.tsx 수정 위치 (5+ site)

1. **lucide-react import** (line 17-40) — `Grid3x3` 알파벳 위치(`GripVertical` 위)에 추가.
2. **GridOverlay/computeColumnSpan import** (line 224) — `SpacingOverlay` import 직후.
3. **State 추가** (line 786-795) — `canvasGridSize` 직후:
   - `gridOverlayEnabled: boolean` (default false, D-01)
   - `snapGuideX: number | null` (default null, D-04 — setter 는 deferred 사용 site 대비)
4. **uiPrefs hydrate/persist** (line 1015-1118):
   - 타입에 `gridOverlayEnabled?: boolean` 추가
   - hydrate 분기: `typeof saved.gridOverlayEnabled === 'boolean'`
   - persist body + deps array 에 `gridOverlayEnabled,` 추가
5. **selectedColumnSpan useMemo** (line 1315-1335) — `selectedViewportPreset` 직후. `data-dworks-node-id` selector + CSS.escape + canvasZoom logical 환산 + `computeColumnSpan`.
6. **G 단축키** (line 3253-3263) — `[` 단축키 직후. `event.key.toLowerCase() === 'g' && !meta && !alt && !shift` → `setGridOverlayEnabled((v) => !v)`.
7. **commandItems entry** (line 3725-3735) — `'시각 보조'` group 의 `toggle-grid-overlay` (shortcut 'G', icon Grid3x3, keywords grid/그리드/column/layout/12).
8. **Toolbar 버튼 + cols 라벨** (line 5083-5114) — `canvasGridSize` 버튼 우측. Grid3x3 아이콘 + `aria-pressed` + accent border on/off + `12-col` 텍스트. `selectedColumnSpan !== null` 일 때 `'{N} cols'` `aria-live="polite"` 라벨 인접 표시.
9. **Viewport box + GridOverlay mount + snap guide** (line 5348-5384):
   - viewport box `<div>` 에 `relative` 추가 (absolute child anchor 용)
   - `<GridOverlay enabled gridOverlayEnabled columnCount=12 gutterPx=16 containerWidth=selectedViewportPreset.width canvasZoom=canvasZoom canvasWrapperRef=canvasScrollRef />`
   - 조건부 `<div>` (snapGuideX !== null + gridOverlayEnabled) — `#FF8FAB` 1px 수직선, zIndex 51

### command-palette.tsx 수정

- **SHORTCUT_GROUPS** (line 354-360) — `'캔버스 패닝 / 줌'` group 직후에 `'시각 보조'` 카테고리 추가, `{ keys: ['G'], label: '12-col 그리드 토글' }` 1행.

### grid-overlay.test.ts (신규 — 110줄, 14 tests / 3 suites)

- `computeColumnEdges` × 3: 1440px 24 edge, 좁은 containerWidth 빈 배열, sorted ascending.
- `snapToColumnEdge` × 5: snap 임계 inside/outside, 0 edge, 빈 배열, ±4 경계.
- `computeColumnSpan` × 6: 1/6/12 col 매치, non-match span 5, 후보 외 width, ±tolerance, 작은 container.

`node:test` 14/14 pass.

## Verification

- `npx tsc --noEmit -p apps/web` — 0 errors.
- `npx eslint apps/web/src/app/page.tsx grid-overlay.tsx command-palette.tsx grid-overlay.test.ts` — 0 errors (2 pre-existing warnings unrelated: `onChangeContainerType`, `onChangeLeafType` line 5891-5892).
- `npx tsx --test apps/web/src/app/grid-overlay.test.ts` — 14 pass / 0 fail.
- Grep: `toggle-grid-overlay\|selectedColumnSpan\|gridOverlayEnabled\|GridOverlay` in page.tsx → 24 matches.
- Grep: `12-col\|시각 보조` in command-palette.tsx → 3 matches.

## Must-Haves Verification

| # | Truth | Status |
|---|---|---|
| 1 | G 단축키 토글 즉시 작동 | ✓ (line 3253-3263) |
| 2 | toolbar Grid3x3 버튼 aria-pressed 토글 | ✓ (line 5085-5104) |
| 3 | ⌘K "12-col 그리드 켜기/끄기" 엔트리 | ✓ (commandItems line 3725-3735 + command-palette SHORTCUT_GROUPS line 354) |
| 4 | 12 column + 11 gutter(16px) viewport-aware, α=0.06/0.10 | ✓ (grid-overlay.tsx + viewport box mount) |
| 5 | 드래그 시 column edge 스냅 + #FF8FAB 가이드 | △ helper + 가이드 렌더 인프라 박음. **드래그 통합 site 미존재(deferred)** — 자유위치 노드 드래그 기능 자체가 codebase 에 없음. |
| 6 | 선택 노드 width ↔ 1/2/3/4/6/12 col span 라벨 | ✓ (selectedColumnSpan useMemo + toolbar 라벨) |
| 7 | dw:uiPrefs:v1 영속화 | ✓ (hydrate + persist + dep 배열 갱신) |
| 8 | canvasZoom 자동 추종 (보정 없음) | ✓ (viewport box CSS zoom → absolute child 자동 추종) |

## Deviations from Plan

### [Rule 3 - Scope Boundary] snap-to-column 드래그 통합 site 부재

- **Found during:** Task 3 — drag/move handler 검색
- **Issue:** 플랜은 "노드 드래그/이동 중 column edge ≤4px snap" + "드래그 종료 직전 마지막 좌표 commit 직전 단일 site 에서 보정" 을 명시. 그러나 현행 codebase 검색(`grep "free position\|drag.*free\|nextLeft\|onPointerUp"` 등) 결과 자유위치(absolute) 노드의 _드래그 기반 좌표 조정_ 기능이 없음. `PositionControls` (page.tsx:10876) 의 inset.left/top 은 인스펙터 number field 입력 only.
- **Fix:** snap 인프라(state `snapGuideX` + 가이드 div 렌더 + `computeColumnEdges`/`snapToColumnEdge` helper export + tests) 박아두고, 컴퓨트 호출 site 는 자유위치 드래그가 구현되는 후속 plan/feature 로 deferred. `setSnapGuideX` 는 eslint-disable 코멘트로 통합 대기 표시.
- **Files modified:** apps/web/src/app/grid-overlay.tsx (helper export), apps/web/src/app/page.tsx (state + 가이드 렌더만)
- **Commit:** 3dc8405 + 99122d6
- **Rationale:** 드래그 기능을 새로 구현하는 것은 본 plan VIS-01 범위 밖. 인프라 export 로 후속 통합은 1-line 작업.

### [Rule 2 - Critical functionality] viewport box `position: relative` 추가

- **Found during:** Task 2 — GridOverlay mount 위치 결정
- **Issue:** 플랜은 GridOverlay 를 viewport box(`<div className="mx-auto..." style={{ width: selectedViewportPreset.width, zoom: canvasZoom }}>`) _내부_ 에 mount 해서 containerWidth 매칭 + canvasZoom 자동 추종을 의도. 그러나 해당 viewport box 에 `position: relative` 가 없어 `absolute inset-0` child 가 정상 anchor 되지 않음.
- **Fix:** viewport box 의 className 에 `relative` 추가. 다른 absolute child 가 없으므로 layout 영향 없음.
- **Files modified:** apps/web/src/app/page.tsx (line 5341 변경 — `mx-auto border...` → `relative mx-auto border...`)
- **Commit:** 99122d6

### [Documented adjustment] commandItems 단일 엔트리 (group 만 신규)

- **Found during:** Task 3 — `'시각 보조'` group 만 만들고 VIS-01 1개 엔트리만 추가.
- **Plan note:** 플랜 line 337 명시 — "Map / minimap 엔트리는 Plan 03 에서 같은 group 에 추가될 예정 — 빈 group 으로도 OK."
- **상태:** Plan 따름. 후속 VIS-02 / VIS-03 plan 에서 같은 group 에 엔트리 append 예정.

## TDD Gate Compliance

본 plan 은 `type: execute` (TDD 아님). 그러나 helper 함수(`computeColumnEdges`, `snapToColumnEdge`, `computeColumnSpan`) 에 대해 14건 단위 테스트를 함께 박았다 — node:test runner, `tsx --test` 실행, 모두 pass.

## Commits

| Hash | Type | Message |
|---|---|---|
| 3dc8405 | feat | VIS-01 grid-overlay 컴포넌트 + 헬퍼 추가 |
| 99122d6 | feat | VIS-01 12-col 그리드 page.tsx + command-palette 통합 |

## Known Stubs

없음 — UI 표시 데이터는 모두 실시간 DOM 측정 + state 기반.

## Threat Flags

없음 — 본 plan 은 read-only DOM 측정 + UI 토글. 외부 endpoint, auth, file I/O, schema 변경 없음. localStorage 사용은 기존 `dw:uiPrefs:v1` 키 confined.

## Self-Check: PASSED

- FOUND: /Users/johyeonchang/dworks/apps/web/src/app/grid-overlay.tsx
- FOUND: /Users/johyeonchang/dworks/apps/web/src/app/grid-overlay.test.ts
- FOUND: commit 3dc8405 (`feat(03-01): VIS-01 grid-overlay 컴포넌트 + 헬퍼 추가`)
- FOUND: commit 99122d6 (`feat(03-01): VIS-01 12-col 그리드 page.tsx + command-palette 통합`)
- typecheck PASS, eslint clean (0 errors, only pre-existing warnings), 14/14 tests pass
