# Phase 3: 시각 보조 도구 - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** Auto (YOLO milestone)

<domain>
## Phase Boundary

기성 디자인툴의 _시각 표준_ — 12-column grid + 마우스 위치 줌 + 미니맵.

**현재 상태 (v1+Phase1):**
- ⌘+wheel/trackpad pinch zoom — `apps/web/src/app/page.tsx:3354 onWheel` 이미 cursor-anchor pivot 구현 (line 3393-3398). 따라서 **VIS-02 핵심 기능은 이미 구현됨**. Phase 3 에서는 _toolbar +/- 버튼_ 도 cursor-pivot 으로 통일.
- 그리드/스냅 없음 — neu 구현
- 미니맵 없음 — 신규 구현

**Phase 3 scope (3 features):**
- VIS-01 — 12-col grid overlay + snap-to-column
- VIS-02 — cursor-pivot zoom for `+/-` buttons (wheel 이미 동작)
- VIS-03 — 좌하단 미니맵 (viewport rect + 클릭 navigate)

</domain>

<decisions>
## Implementation Decisions

### VIS-01 — 12-col grid overlay + snap

- **D-01**: 그리드 토글 — 캔버스 상단 toolbar 에 grid 버튼 + 단축키 `G` (캔버스 포커스 시). 토글 state localStorage 저장.
- **D-02**: 그리드 시각화 — 12-col `grid-template-columns: repeat(12, 1fr)`, gutter 16px. 각 column 반투명 인디고 (`--dw-ui-accent` α=0.06), gutter 약간 짙음 (α=0.10). 캔버스 _container width_ 기준 (viewport-aware, responsiveViewport preset 폭에 맞춤).
- **D-03**: 시각 layer — `apps/web/src/app/grid-overlay.tsx` 신규. absolute pointer-events:none, z-index 보통 노드 위 / NodeContextMenu 아래 (z-index ~50).
- **D-04**: snap-to-column — 노드 드래그/이동 시 가까운 column edge (≤4px) 에 snap. 토글 OFF 시 snap 도 OFF. snap 발생 시 가이드 라인 강조 (Phase 1 spacing-overlay 핑크 가이드 재활용).
- **D-05**: 노드 폭 비교 anchor — _selected node_ 의 width 가 column count (1/3/6/12 col 등) 와 일치하면 toolbar 에 라벨 표시 (e.g. "6 cols").

### VIS-02 — cursor-pivot zoom (toolbar +/-)

- **D-06**: ⌘+/⌘- (line 3192, 3200) 와 toolbar `+/-` 버튼 (page.tsx:4992 ZoomControl) 도 cursor pivot 적용. wheel 의 `pendingZoomAnchorRef.current` 패턴 재사용 — 단, _버튼 클릭은 cursor 위치 불명_ 이므로 **canvas viewport 중앙** 을 pivot 으로 사용.
- **D-07**: 키보드 ⌘+/⌘- 도 viewport 중앙 pivot. 사용자 expectation: 클릭/키보드는 중앙, wheel 은 cursor.

### VIS-03 — 미니맵

- **D-08**: 위치 — 좌하단 `bottom-4 left-4` fixed. 좌측 컴포넌트 라이브러리 패널 위에 떠 있음 (z-index 60+).
- **D-09**: 크기 — 200px × ~120px (canvas aspect ratio 자동). 1:1 비율 미니어처. 캔버스 트리 노드별 _bounding box_ 만 outlined rectangle 로 표시 (콘텐츠 미니렌더 X — 성능/복잡도 회피).
- **D-10**: viewport rect — 미니맵 위에 _현재 viewport_ 영역 표시 (반투명 박스 + border). canvasScrollRef 의 scrollLeft/Top + clientWidth/Height + canvasZoom 으로 계산.
- **D-11**: 클릭 navigate — 미니맵 클릭 시 해당 위치로 캔버스 scroll (pendingDirectScrollRef 패턴 재사용).
- **D-12**: 토글 — 토글 버튼 (캔버스 toolbar) + 단축키 `M` (캔버스 포커스 시, modal `M` 충돌 회피로 사용자 mandate "M=modal" 은 quick-add 영역; 미니맵 토글은 Shift+M 으로 변경).

### Claude's Discretion

- 그리드 column 색상 정확한 알파 값 (Figma 와 시각 일치 목표).
- snap-to-column 임계 (4px 기본, 조정 가능).
- 미니맵 viewport rect 색상 (`--dw-ui-accent` 반투명).
- toolbar 버튼 아이콘 (lucide-react `Grid3x3`, `Map`, `ZoomIn`, `ZoomOut`).

</decisions>

<canonical_refs>
## Canonical References

### Project-level
- `.planning/PROJECT.md` — VIS-01..VIS-03 정의
- `.planning/REQUIREMENTS.md` — 19 requirements
- `.planning/ROADMAP.md` §Phase 3

### Code anchors
- `apps/web/src/app/page.tsx:672` — `canvasZoom` state
- `apps/web/src/app/page.tsx:703` — `canvasScrollRef`
- `apps/web/src/app/page.tsx:3340-3398` — wheel zoom + cursor anchor (VIS-02 reference impl)
- `apps/web/src/app/page.tsx:2960-3010` — handleCanvasFit + handleZoomToSelection (zoom 패턴)
- `apps/web/src/app/page.tsx:4992` — ZoomControl 컴포넌트 (toolbar +/- 버튼)
- `apps/web/src/app/spacing-overlay.tsx` — overlay 렌더 패턴 (grid/minimap 참고)
- `apps/web/src/app/component-library-panel.tsx` — 좌측 패널 (minimap z-index 충돌 확인)
- `apps/web/src/app/canvas-contexts.ts` — canvas state hub

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **wheel zoom cursor pivot** (page.tsx:3393-3398) — VIS-02 toolbar 버튼 적용 시 동일 패턴 (viewport 중앙 anchor).
- **pendingDirectScrollRef** (line 830) — 미니맵 클릭 navigate 시 재사용.
- **spacing-overlay zoom-aware coord 계산** — grid overlay 동일 패턴.
- **commandItems** (command-palette.tsx) — 그리드 토글 / 미니맵 토글 액션 등록.
- **node bounding box query** (selectable-node.tsx의 `data-dworks-node-id`) — 미니맵 노드 박스 source.

### Established Patterns
- Korean UI mandate
- localStorage state persistence (canvasZoom 패턴)
- Tailwind v4 utility + chrome 토큰 (`--dw-ui-*`)
- absolute overlay with pointer-events:none / z-index 계층

### Integration Points
- 캔버스 toolbar (page.tsx 어딘가) — grid/minimap 토글 버튼 추가
- 글로벌 keydown handler (line 2862) — G / Shift+M 단축키
- canvasScrollRef container — grid overlay + minimap 위치 anchor

</code_context>

<specifics>
## Specific Ideas

- 12-col gutter 16px — Figma 표준 (편집 환경).
- 미니맵 background `--dw-ui-panel` 약간 어둡게.
- snap 시 spacing-overlay 의 핑크 가이드 라인 재사용.

</specifics>

<deferred>
## Deferred Ideas

- 임의 column count (8/16/24) — v3.0+ 사용자 설정
- 그리드 baseline (horizontal lines) — typography 정렬용 (v3)
- 미니맵 thumbnail (실제 캔버스 mini-render) — 성능 비용 큼 (v3)
- ruler (눈금자) — Figma 의 ruler 기능 (v3)

</deferred>

---

*Phase: 03-visual-aids*
*Context gathered: 2026-05-11*
