---
phase: 03-visual-aids
verified: 2026-05-11T00:00:00Z
status: human_needed
score: 3/3 success criteria verified (with VIS-01 snap deferred caveat)
overrides_applied: 1
overrides:
  - must_have: "snap-to-column 드래그 commit site 통합"
    reason: "현행 codebase 에 자유위치(absolute) 노드 드래그 기능 자체가 부재 — PositionControls(line 10976) 는 인스펙터 number field 입력 only. snap helper(computeColumnEdges/snapToColumnEdge) + state(snapGuideX) + 가이드 div 인프라는 모두 export/렌더 완료. 자유 드래그 기능 구현 시 1-line 통합 가능. Plan 03-01 SUMMARY Rule 3 Scope Boundary deviation 으로 명시 — 검증 시점 의도된 scope-deferral."
    accepted_by: "context-note (verification harness pre-approved)"
    accepted_at: "2026-05-11T00:00:00Z"
re_verification:
  previous_status: none
  previous_score: 0/0
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "G 키로 12-col 그리드 토글 + viewport box 위에 column α=0.06 / gutter α=0.10 시각 확인"
    expected: "G 누르면 즉시 12 column + 11 × 16px gutter 그리드가 viewport 위에 표시됨. 토글 OFF 시 사라짐."
    why_human: "시각 확인 — α 값과 viewport 매칭은 grep 으로 검증 불가"
  - test: "toolbar Grid3x3 아이콘 버튼 클릭 → 동일 토글 + aria-pressed 시각 상태 (accent border on/off)"
    expected: "버튼 클릭 시 G 단축키와 동일 동작. ON 상태에서 accent border + soft bg 표시."
    why_human: "버튼 시각 상태 변화 확인 필요"
  - test: "선택 노드 width 가 1/2/3/4/6/12 col 과 ±4px 일치 시 toolbar '{N} cols' 라벨 표시"
    expected: "노드 폭이 column span 과 일치하면 '6 cols' 등 라벨이 toolbar 에 인접 표시"
    why_human: "동적 노드 폭 측정 + 라벨 표시 — 런타임 동작"
  - test: "⌘+/⌘=/⌘- 키보드 줌 → viewport 중앙 pivot 유지"
    expected: "캔버스 중앙에 마커 두고 ⌘+ → 같은 위치 유지 / ⌘- → 동일 / ⌘0 → 100% 리셋"
    why_human: "줌 동작은 시각으로만 confirm 가능 (anchor 좌표 logic 은 setZoomWithCenterPivot helper 에서 verified)"
  - test: "toolbar +/- 버튼 클릭 → viewport 중앙 pivot"
    expected: "ZoomControl 의 + 버튼 클릭 시 viewport 중앙 anchor 로 줌인"
    why_human: "동일 시각 확인"
  - test: "wheel ⌘+scroll → cursor 위치 anchor 유지 (변경 없음 확인)"
    expected: "마우스 커서 아래 점이 그대로 유지되는 cursor-pivot 동작 — 기존 동작 보존"
    why_human: "회귀 테스트 — onWheel handler 변경 없음을 시각으로도 확인"
  - test: "Shift+M 으로 좌하단 미니맵 토글 + close 버튼 X 닫기"
    expected: "Shift+M 누르면 좌하단에 200×~120px 미니맵 표시. X 클릭하면 닫힘."
    why_human: "토글 + 패널 시각 확인"
  - test: "캔버스 스크롤 시 미니맵 viewport rect 실시간 추종 (rAF throttle 부드러움)"
    expected: "캔버스 스크롤할 때 미니맵의 보라색 반투명 rect 가 부드럽게 따라 움직임"
    why_human: "실시간 동작 + rAF throttle 의 시각적 부드러움"
  - test: "미니맵 클릭 → 캔버스 navigate (zoom 변경 없음)"
    expected: "미니맵에서 한 지점 클릭 시 캔버스 viewport 가 해당 위치 중앙으로 scroll, zoom 은 그대로"
    why_human: "navigate 동작 + zoom 보존 확인"
  - test: "미니맵 Enter/Space (키보드 활성화) → 콘텐츠 중앙 navigate (WCAG)"
    expected: "tab focus 후 Enter/Space → 콘텐츠 중앙으로 scroll"
    why_human: "키보드 접근성 — 시각 + 키보드 입력 필요"
  - test: "페이지 reload 후 gridOverlayEnabled + minimapEnabled localStorage 영속화 확인"
    expected: "토글 ON 상태로 reload 시 토글 ON 상태 복원"
    why_human: "localStorage 영속화 — reload 후 시각 확인"
  - test: "⌘K 명령 팔레트 → '12-col 그리드 켜기/끄기' + '미니맵 켜기/끄기' 검색/실행"
    expected: "명령 팔레트에 두 엔트리 표시 + 실행 시 토글"
    why_human: "검색 + 실행 흐름 확인"
---

# Phase 3: 시각 보조 도구 Verification Report

**Phase Goal:** 기성 디자인툴 시각 표준 — 12-column grid overlay + 마우스 위치 기준 줌 + 미니맵
**Verified:** 2026-05-11
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 캔버스 상단 컨트롤에 grid 토글 — 12-col + gutter 시각화 + snap to column (VIS-01) | ✓ VERIFIED (with deferred snap, override accepted) | grid-overlay.tsx (153 lines) + page.tsx 토글 3-route (G 키 line 3274-3283 / toolbar Grid3x3 line 5160-5178 / commandItems line 3791-3797). 12 column + 11 × 16px gutter, α=0.06/0.10. snap helper 인프라 export, drag commit site deferred per override. |
| 2 | 줌이 마우스 포인터 위치 기준으로 동작 (focal point) (VIS-02) | ✓ VERIFIED | wheel cursor-pivot 보존 (page.tsx:3463-3490). toolbar +/- + ⌘0/⌘+/⌘- + 명령 팔레트 + GlobalContextMenu reset 5+ 진입점은 viewport 중앙 pivot helper setZoomWithCenterPivot 통일 (line 3439-3461). |
| 3 | 좌하단 미니맵 — viewport 위치 표시 + 클릭 navigate (VIS-03) | ✓ VERIFIED | minimap.tsx (311 lines, fixed bottom-4 left-4, z-60). 노드 outlined rectangle + viewport rect (rgba 0.18 + border 0.6) + 클릭 navigate (D-11 zoom 불변) + Shift+M 토글 (page.tsx:3284-3295) + close 버튼 aria-label. |

**Score:** 3/3 ROADMAP success criteria verified (VIS-01 snap drag-commit subtask accepted via override — pre-approved by context note).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/app/grid-overlay.tsx` | GridOverlay + computeColumnEdges/snapToColumnEdge/computeColumnSpan | ✓ VERIFIED | 153 lines. 4 exports verified. α=0.06/0.10 색상 D-02 잠금 일치. zIndex 50. |
| `apps/web/src/app/grid-overlay.test.ts` | 14 tests / 3 suites helper coverage | ✓ VERIFIED | 110 lines. 14/14 pass. |
| `apps/web/src/app/minimap.tsx` | Minimap (open/canvasScrollRef/canvasZoom/containerWidth/treeRevision/onClose) | ✓ VERIFIED | 311 lines. rAF throttle scroll/resize. 노드 박스 + viewport rect + 클릭/키보드 navigate + close 버튼. |
| `page.tsx` GridOverlay mount | viewport box 내부 absolute child | ✓ VERIFIED | line 5450-5457. enabled prop + 12/16/containerWidth/canvasZoom/canvasWrapperRef 6 props 모두 전달. |
| `page.tsx` Minimap mount | main 직속 fixed panel | ✓ VERIFIED | line 5738-5745. open/canvasScrollRef/canvasZoom/containerWidth/treeRevision/onClose 6 props 모두 전달. |
| `page.tsx` setZoomWithCenterPivot helper | useCallback number \| ((prev) => number) | ✓ VERIFIED | line 3439-3461. clamp 0.25~2.0 + prev===next noop + pendingZoomAnchorRef 저장. |
| `page.tsx` G 단축키 handler | meta=false / alt=false / shift=false 분기 | ✓ VERIFIED | line 3273-3283. |
| `page.tsx` Shift+M 단축키 handler | meta=false / alt=false / shift=true 분기 | ✓ VERIFIED | line 3284-3295. |
| `page.tsx` toolbar Grid3x3 버튼 | aria-pressed + 토글 + accent border | ✓ VERIFIED | line 5160-5178. |
| `page.tsx` toolbar MapIcon 버튼 | aria-pressed + 토글 + accent border | ✓ VERIFIED | line 5179-5194. |
| `page.tsx` selectedColumnSpan label | 1/2/3/4/6/12 ±4px tolerance | ✓ VERIFIED | useMemo line 1339-1354 + 라벨 line 5195-5202. aria-live="polite". |
| `page.tsx` uiPrefs hydrate/persist | gridOverlayEnabled + minimapEnabled | ✓ VERIFIED | type 1046/1048, hydrate 1094-1099, persist body 1121/1123, dep array 1137-1138. |
| `page.tsx` treeRevision trigger | useState + useEffect dep [tree] | ✓ VERIFIED | line 796 state + 837-838 setTreeRevision on tree change. |
| `command-palette.tsx` SHORTCUT_GROUPS '시각 보조' | G + ⇧M 두 행 | ✓ VERIFIED | line 354-360. |
| `page.tsx` commandItems 시각 보조 group | toggle-grid-overlay + toggle-minimap | ✓ VERIFIED | line 3791-3807. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| page.tsx | grid-overlay.tsx | named import GridOverlay, computeColumnSpan | ✓ WIRED | line 226 |
| page.tsx | minimap.tsx | named import Minimap | ✓ WIRED | line 227 |
| GridOverlay | viewport box (CSS zoom: canvasZoom) | absolute child + parent relative | ✓ WIRED | viewport box position:relative 추가 (plan 03-01 deviation Rule 2), canvasZoom 자동 추종 |
| Minimap | canvasScrollRef DOM | scrollLeft/scrollTop 직접 설정 + rAF scroll listener | ✓ WIRED | minimap.tsx handleBodyClick (line 192-207) + onScrollOrResize useEffect (line 153-174) |
| Minimap | 노드 DOM | document.querySelectorAll([data-dworks-node-id]) | ✓ WIRED | measureNodes line 92-121 |
| setZoomWithCenterPivot | pendingZoomAnchorRef | rect.width/2, rect.height/2 cursorX/Y | ✓ WIRED | line 3449-3455. 기존 보정 effect (line 3470-3487 wheel) 재사용. |
| G 단축키 | setGridOverlayEnabled | window keydown handler | ✓ WIRED | line 3281 |
| Shift+M 단축키 | setMinimapEnabled | window keydown handler | ✓ WIRED | line 3293 |
| toolbar +/- 버튼 | setZoomWithCenterPivot | CanvasZoomControl onChange prop | ✓ WIRED | line 5127 |
| ⌘0/⌘+/⌘- | setZoomWithCenterPivot | keydown branches | ✓ WIRED | line 3238, 3257, 3264 |
| GlobalContextMenu onZoomReset | setZoomWithCenterPivot | () => setZoomWithCenterPivot(1) | ✓ WIRED | line 5716 |
| commandItems zoom-100 | setZoomWithCenterPivot | action callback | ✓ WIRED | line 3744 |
| uiPrefs persist | localStorage dw:uiPrefs:v1 | useEffect body + dep array | ✓ WIRED | gridOverlayEnabled + minimapEnabled 모두 persist body + dep 포함 |
| treeRevision | Minimap measureNodes | useEffect dep [treeRevision] | ✓ WIRED | minimap.tsx line 142-149 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| GridOverlay | blocks (12 column + 11 gutter) | containerWidth prop (selectedViewportPreset.width) + columnCount + gutterPx | ✓ Yes — selectedViewportPreset.width 는 page.tsx 의 viewport preset 실제 값 | ✓ FLOWING |
| GridOverlay snap 가이드 | snapGuideX state | setSnapGuideX 호출 site — **부재** (drag commit site 미존재) | ⚠️ STATIC (정의됨, 호출 site 부재) | ⚠️ STATIC (override accepted) |
| selectedColumnSpan 라벨 | useMemo value | data-dworks-node-id 셀렉터로 DOM 측정 + computeColumnSpan(widthLogical, …) | ✓ Yes — 실제 선택 노드 DOM 측정 (line 1339-1354) | ✓ FLOWING |
| Minimap nodeBoxes | useState(nodeBoxes) | querySelectorAll([data-dworks-node-id]).map(el.getBoundingClientRect()) | ✓ Yes — 실제 DOM 측정 | ✓ FLOWING |
| Minimap viewport | useState(viewport) | wrapper.scrollLeft/Top/clientWidth/Height / canvasZoom | ✓ Yes — 실시간 measureViewport 호출 (rAF) | ✓ FLOWING |
| Minimap contentSize | useState(contentSize) | wrapper.scrollWidth/Height / canvasZoom | ✓ Yes — DOM 실측 | ✓ FLOWING |
| setZoomWithCenterPivot pivot | pendingZoomAnchorRef.current | target.getBoundingClientRect() + rect.width/2,height/2 + target.scrollLeft/Top + prev zoom | ✓ Yes — 실측 좌표 | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| grid-overlay helper unit tests pass | `apps/web/node_modules/.bin/tsx --test apps/web/src/app/grid-overlay.test.ts` | 14 pass / 0 fail / 14 total / 3 suites | ✓ PASS |
| typecheck clean | `tsc --noEmit` (apps/web) | 0 errors | ✓ PASS |
| GridOverlay export 확인 | `grep -c "export function GridOverlay" grid-overlay.tsx` | 1 | ✓ PASS |
| computeColumnEdges/snapToColumnEdge/computeColumnSpan export | grep count | 3 | ✓ PASS |
| Minimap export 확인 | `grep -c "export function Minimap" minimap.tsx` | 1 | ✓ PASS |
| page.tsx GridOverlay/Minimap mount + import | grep tally | 24+15 hits | ✓ PASS |
| 통합 토글 surface 3-route | G 키 / toolbar 버튼 / commandItems | all present | ✓ PASS |
| 미니맵 토글 surface 3-route | Shift+M / toolbar / commandItems | all present | ✓ PASS |
| 줌 진입점 5+ surface viewport-center pivot 통일 | grep setZoomWithCenterPivot | 7 hits (1 def + 6 consumers) | ✓ PASS |
| wheel cursor-pivot 회귀 없음 | line 3463-3490 onWheel handler 보존 | unchanged | ✓ PASS |
| 실제 캔버스 동작 (시각/실시간) | dev server 실행 + 수동 토글/줌/scroll | not run | ? SKIP (인간 검증 단계로) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| VIS-01 | 03-01 | 12-col 그리드 overlay + snap to column + column span 라벨 | ✓ SATISFIED (with override) | grid-overlay.tsx 153 lines + page.tsx 8+ wiring site + tests 14/14. snap drag-commit deferred via override (codebase 에 자유위치 드래그 부재). |
| VIS-02 | 03-02 | 마우스 포인터 / viewport 중앙 pivot 줌 통일 | ✓ SATISFIED | setZoomWithCenterPivot helper + 5+ 진입점 (keyboard ⌘0/⌘+/⌘- + toolbar +/- + 명령 팔레트 + context menu). wheel cursor-pivot 보존. |
| VIS-03 | 03-03 | 좌하단 미니맵 — viewport rect + 클릭 navigate + Shift+M | ✓ SATISFIED | minimap.tsx 311 lines + 통합 7+ site (state + Shift+M + toolbar + Minimap mount + uiPrefs + commandItems + treeRevision trigger). |

REQUIREMENTS.md 의 Phase 3 매핑은 정확히 VIS-01/02/03 3개로 plans 와 1:1 매칭. ORPHANED 없음.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| grid-overlay.tsx | — | TODO/FIXME/placeholder 없음 | — | ✓ clean |
| minimap.tsx | — | TODO/FIXME/placeholder 없음 | — | ✓ clean |
| page.tsx | 798-801 | `snapGuideX` state + setSnapGuideX 호출 site 부재 (자유위치 드래그 미구현) | ℹ️ Info | 인프라 prepared, drag commit 통합 1-line 작업 — override accepted, plan 03-01 Rule 3 deviation 으로 명시 |

### Human Verification Required

12 items needing human visual/interactive testing (see frontmatter `human_verification`). 모든 자동 검증 PASS (typecheck/tests/grep/wiring). 시각 동작 (grid α 색상, viewport rect 추종, 클릭 navigate, 줌 anchor 시각, localStorage 영속화 reload) 는 dev server 띄워서 수동 확인 필요.

### Gaps Summary

자동 검증 단계에서 발견된 _gap 없음_. 모든 ROADMAP success criteria (3/3) 가 실제 코드에서 wired + data flowing 확인됨. VIS-01 snap-to-column 의 drag-commit site 만 자유위치 드래그 기능 부재로 deferred — context note 에서 pre-approved 된 override 로 accepted, helper/state/가이드 인프라 모두 export 되어 drag 기능 추가 시 1-line 통합 가능.

12개 항목은 _시각/실시간/접근성_ 동작이라 human verification 필요. 자동 stage 통과, 인간 stage 대기.

---

*Verified: 2026-05-11*
*Verifier: Claude (gsd-verifier)*
