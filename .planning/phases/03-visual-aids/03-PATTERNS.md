# Phase 3: 시각 보조 도구 - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 4 (2 new + 2 modified)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/web/src/app/grid-overlay.tsx` (NEW) | overlay component | zoom-aware visual | `apps/web/src/app/spacing-overlay.tsx` | exact |
| `apps/web/src/app/minimap.tsx` (NEW) | fixed-position panel | request-response (click→scroll) | `apps/web/src/app/spacing-overlay.tsx` + `component-library-panel.tsx` | role-match (split) |
| `apps/web/src/app/page.tsx` (modify, toolbar +/- zoom) | state + keyboard handler | event-driven | page.tsx:3340-3398 wheel zoom anchor | exact (in-file) |
| `apps/web/src/app/page.tsx` (modify, grid/minimap toggle) | state + keyboard handler | event-driven | page.tsx:776 `componentPanelOpen` + 3205-3210 `[` keydown | exact (in-file) |
| `apps/web/src/app/command-palette.tsx` (modify) | data registration | declarative | page.tsx:3496+ `commandItems` entries | exact |

---

## Pattern Assignments

### `apps/web/src/app/grid-overlay.tsx` (NEW — overlay, zoom-aware)

**Analog:** `apps/web/src/app/spacing-overlay.tsx` (382 lines, full overlay 표준)

**상단 주석 헤더 패턴** (spacing-overlay.tsx:1-9):
```typescript
'use client'
// UX-02 spacing overlay — 선택된 노드와 hover 노드 사이의 px 거리 + 정렬 가이드를 표시.
// modifier 키 없는 _기본 동작_(D-01)으로 spacing 측정선 + 라벨 4방향 노출,
// Alt 누른 채 hover 시 정렬되는 edge 점선(#FF8FAB) 추가 표시(D-03).
// DOM 측정 source: selectable-node.tsx 가 박은 `data-dworks-node-id` 속성.
// 좌표는 canvas wrapper rect 기준 — canvas zoom 은 wrapper 의 CSS `zoom`(page.tsx:4811)
// 으로 처리되므로 getBoundingClientRect() 차이만 그대로 사용해도 시각이 일치.
// 단 wrapper 안 스크롤은 wrapperEl.scrollLeft/Top 으로 보정.
```
→ grid-overlay.tsx 도 동일 한국어 헤더 + D-01..D-05 참조 필수.

**Props + Ref 패턴** (spacing-overlay.tsx:32-37):
```typescript
import { type RefObject } from 'react'

export interface SpacingOverlayProps {
  selectedNodeId: string | null
  altKeyPressed: boolean
  // 측정 좌표 기준점(canvasScrollRef). 라벨/측정선이 이 wrapper 의 내부 absolute 자식으로 배치.
  canvasWrapperRef: RefObject<HTMLElement | null>
}
```
→ grid-overlay.tsx Props:
```typescript
export interface GridOverlayProps {
  enabled: boolean                    // D-01 토글 state
  columnCount: number                 // 기본 12 (D-02 잠금)
  gutterPx: number                    // 기본 16 (D-02 잠금)
  containerWidth: number              // selectedViewportPreset.width — viewport-aware
  canvasZoom: number                  // page.tsx canvasZoom — column 폭 px 계산용
  canvasWrapperRef: RefObject<HTMLElement | null>
}
```

**Wrapper Style + 좌표계 주석** (spacing-overlay.tsx:91-112, 302-313):
```typescript
// DOM rect 를 wrapper 기준 logical 좌표로 변환.
// canvasZoom 처리 노트: page.tsx:4811 에서 캔버스 viewport 가 CSS `zoom: canvasZoom`
// 으로 scale 되므로 getBoundingClientRect() 가 이미 _zoom 적용 후_ scaled px 를 반환한다.
// wrapper(canvasScrollRef) 도 동일 좌표계 안에 있으므로 두 rect 의 차이만 사용하면
// canvasZoom 보정 없이 시각이 일치한다. wrapper 좌표계 안 absolute 자식으로 라벨/선을
// 배치하면 zoom 이 변해도 자동으로 따라감.
//   ↳ grid-overlay 도 동일 — wrapper 내부 absolute child 로 배치하면 zoom 자동 추종.

const wrapperStyle: CSSProperties = {
  zIndex: 100,
  animation: 'dw-fade-in var(--dw-motion-fast) var(--dw-motion-ease) both',
}

return (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0"
    style={wrapperStyle}
  >
```
→ grid-overlay z-index ~50 (D-03: 노드 위 / NodeContextMenu 아래). 동일 `pointer-events-none absolute inset-0`.

**Column 박스 렌더 패턴** (spacing-overlay.tsx:315-327 라인 div 와 동일):
```typescript
{overlay.lines.map((line) => (
  <div
    key={line.key}
    className="absolute"
    style={{
      left: line.x,
      top: line.y,
      width: Math.max(line.width, 1),
      height: Math.max(line.height, 1),
      backgroundColor: MEASURE_LINE_COLOR,
    }}
  />
))}
```
→ grid-overlay 의 12 column 박스도 동일 absolute + `var(--dw-ui-accent)` α=0.06 (gutter α=0.10, D-02).

**Snap 가이드 색상 재사용** (spacing-overlay.tsx:22-23):
```typescript
// 정렬 가이드 점선 색상 — Figma 파스텔 핑크(#FF8FAB), D-03 + Claude discretion.
const ALIGN_GUIDE_COLOR = '#FF8FAB'
```
→ D-04 snap-to-column 가이드 라인도 `#FF8FAB` 동일 핑크 재사용 (CONTEXT.md specifics).

---

### `apps/web/src/app/minimap.tsx` (NEW — fixed-position panel, click navigate)

**Analog A (좌표/줌 계산):** `apps/web/src/app/spacing-overlay.tsx`
**Analog B (패널 chrome):** `apps/web/src/app/component-library-panel.tsx`

**Fixed-position aside 패턴** (component-library-panel.tsx:121-126):
```typescript
<aside
  role="region"
  aria-label="컴포넌트 라이브러리"
  className="relative flex shrink-0 flex-col overflow-hidden border-r border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] transition-[width] duration-[var(--dw-motion-base)] ease-[var(--dw-motion-ease)]"
  style={{ width: open ? 240 : 32 }}
>
```
→ minimap 은 _fixed_ (D-08: `bottom-4 left-4`, z-index 60+):
```typescript
<aside
  role="region"
  aria-label="미니맵"
  className="fixed bottom-4 left-4 overflow-hidden rounded-[var(--dw-radius-sm)] border border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] shadow-[var(--dw-shadow-elev-2)]"
  style={{ width: 200, height: 120, zIndex: 60 }}
>
```

**Toggle 헤더 + aria-pressed** (component-library-panel.tsx:128-147):
```typescript
<div className="flex shrink-0 items-center justify-between border-b border-[var(--dw-ui-border)] px-2 py-2">
  <button
    type="button"
    aria-label="컴포넌트 패널 토글"
    aria-pressed={open}
    onClick={onToggle}
    className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--dw-radius-sm)] text-[var(--dw-ui-text-muted)] transition-colors hover:bg-[var(--dw-ui-elevated)] hover:text-[var(--dw-ui-text-body)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dw-ui-accent)]"
  >
```
→ 미니맵은 close 버튼만 필요 (X 아이콘, lucide-react).

**노드 bounding box 수집 패턴** (spacing-overlay.tsx:262-286):
```typescript
// MR-02 — id 에 CSS selector 특수문자(", \, ]) 가 섞일 경우 querySelector 가 throw
// 한다. CSS.escape 로 attribute selector 안전화 (use-align-distribute.ts 와 동일 패턴).
const selEl = document.querySelector<HTMLElement>(
  `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
)
// ...
const wrapperRect = wrapperEl.getBoundingClientRect()
const scrollLeft = wrapperEl.scrollLeft
const scrollTop = wrapperEl.scrollTop
const a = toLogicalRect(
  selEl.getBoundingClientRect(),
  wrapperRect,
  scrollLeft,
  scrollTop,
)
```
→ 미니맵은 `querySelectorAll<HTMLElement>('[data-dworks-node-id]')` 로 전체 노드 수집 후 동일 `toLogicalRect` 패턴 + canvasZoom 으로 나눠 _logical px → minimap scale_ 변환.

**Viewport rect 계산 — canvasScrollRef scroll + zoom 사용** (page.tsx:2982-2988 zoom-to-selection 동일):
```typescript
// 현재 zoom 기준 logical 크기·위치
const nodeLogicalWidth = nodeRect.width / canvasZoom
const nodeLogicalHeight = nodeRect.height / canvasZoom
const nodeLogicalLeft =
  (nodeRect.left - containerRect.left + el.scrollLeft) / canvasZoom
const nodeLogicalTop =
  (nodeRect.top - containerRect.top + el.scrollTop) / canvasZoom
```
→ 미니맵 viewport rect:
- `viewportLogicalLeft = el.scrollLeft / canvasZoom`
- `viewportLogicalTop = el.scrollTop / canvasZoom`
- `viewportLogicalWidth = el.clientWidth / canvasZoom`
- `viewportLogicalHeight = el.clientHeight / canvasZoom`
→ minimap scale = `200 / canvasContentWidth` (selectedViewportPreset.width 기준).

**클릭 navigate — pendingDirectScrollRef 재사용** (page.tsx:3348, 2999-3007):
```typescript
const pendingDirectScrollRef = useRef<{ left: number; top: number } | null>(null)
// ...
pendingDirectScrollRef.current = {
  left:
    newZoom * (nodeLogicalLeft + nodeLogicalWidth / 2) -
    containerRect.width / 2,
  top:
    newZoom * (nodeLogicalTop + nodeLogicalHeight / 2) -
    containerRect.height / 2,
}
setCanvasZoom(newZoom)  // ↑ canvasZoom 변경 effect 가 scroll 적용 (page.tsx:3390-3407)
```
→ 미니맵 클릭 시 zoom 유지인 경우 page.tsx 에서 직접 `el.scrollLeft = ... ; el.scrollTop = ...` 호출 (zoom unchanged 시 pendingDirectScrollRef 가 발화 안 됨에 주의 — D-11 은 zoom 변경 없는 navigate 라 직접 scroll 권장).

**Listener — rAF throttle 패턴** (spacing-overlay.tsx:249-298 useEffect 안 setOverlay 호출 동일하게 useEffect 측정):
```typescript
// selectedNodeId/hoveredNodeId 변경 시점에만 DOM 측정 — mousemove 폭주 회피(T-01-04 mitigate).
useEffect(() => {
  if (!isActive) {
    setOverlay(null)
    return
  }
  // ... DOM 측정 + setOverlay
}, [isActive, selectedNodeId, hoveredNodeId, altKeyPressed, canvasWrapperRef])
```
→ 미니맵은 _scroll/zoom_ 시 viewport rect 재계산 필요 → canvasScrollRef 의 `scroll` 이벤트 + canvasZoom dep 으로 rAF throttle. 노드 박스는 _tree_ 변경 시만 재계산 (deps: tree.root).

---

### `apps/web/src/app/page.tsx` — Toolbar +/- 버튼 cursor-pivot zoom (D-06)

**Analog:** page.tsx:3340-3407 (wheel zoom + scroll 보정)

**기존 wheel zoom anchor 패턴** (page.tsx:3340-3398):
```typescript
// 줌 변경 시 cursor anchor 위치 보정 — Figma처럼 커서 아래 점이 그대로
const pendingZoomAnchorRef = useRef<{
  cursorX: number
  cursorY: number
  oldScrollLeft: number
  oldScrollTop: number
  oldZoom: number
} | null>(null)
// zoom-to-selection 같은 직접 scroll 지정용
const pendingDirectScrollRef = useRef<{ left: number; top: number } | null>(null)

// 캔버스 트랙패드/⌘+wheel 줌 — passive:false로 native attach (preventDefault 위해)
useEffect(() => {
  const el = canvasScrollRef.current
  if (!el) return
  function onWheel(event: WheelEvent) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    const target = canvasScrollRef.current
    if (!target) return
    const rect = target.getBoundingClientRect()
    const factor = Math.exp(-event.deltaY * 0.005)
    setCanvasZoom((prev) => {
      const next = Math.max(
        0.25,
        Math.min(2, Math.round(prev * factor * 100) / 100),
      )
      if (next === prev) return prev
      // cursor anchor 저장 — 다음 effect에서 scroll 보정
      pendingZoomAnchorRef.current = {
        cursorX: event.clientX - rect.left,
        cursorY: event.clientY - rect.top,
        oldScrollLeft: target.scrollLeft,
        oldScrollTop: target.scrollTop,
        oldZoom: prev,
      }
      return next
    })
  }
  el.addEventListener('wheel', onWheel, { passive: false })
  return () => {
    el.removeEventListener('wheel', onWheel)
  }
}, [])

// canvasZoom 변경 후 scroll 보정 — DOM 갱신 후 적용
// 1) cursor anchor (트랙패드 pinch): 커서 아래 점이 그대로
// 2) direct scroll (zoom-to-selection): 절대 좌표 지정
useEffect(() => {
  const el = canvasScrollRef.current
  if (!el) return
  const anchor = pendingZoomAnchorRef.current
  if (anchor) {
    const ratio = canvasZoom / anchor.oldZoom
    el.scrollLeft = (anchor.oldScrollLeft + anchor.cursorX) * ratio - anchor.cursorX
    el.scrollTop = (anchor.oldScrollTop + anchor.cursorY) * ratio - anchor.cursorY
    pendingZoomAnchorRef.current = null
    return
  }
  const direct = pendingDirectScrollRef.current
  if (direct) {
    el.scrollLeft = direct.left
    el.scrollTop = direct.top
    pendingDirectScrollRef.current = null
  }
}, [canvasZoom])
```

**D-06 적용 — toolbar +/- 버튼 cursor pivot (viewport 중앙)**:
- CanvasZoomControl 의 `step(direction)` 호출 직전 _viewport 중앙_ 을 cursorX/Y 로 저장:
```typescript
// D-06 — toolbar +/- 버튼은 cursor 위치 불명 → viewport 중앙 pivot.
function setZoomWithCenterPivot(next: number): void {
  const target = canvasScrollRef.current
  if (!target) {
    setCanvasZoom(next)
    return
  }
  const rect = target.getBoundingClientRect()
  setCanvasZoom((prev) => {
    if (next === prev) return prev
    pendingZoomAnchorRef.current = {
      cursorX: rect.width / 2,   // viewport 중앙 X (rect 안 좌표)
      cursorY: rect.height / 2,
      oldScrollLeft: target.scrollLeft,
      oldScrollTop: target.scrollTop,
      oldZoom: prev,
    }
    return next
  })
}
```
- CanvasZoomControl 의 `onChange` prop 을 `setZoomWithCenterPivot` 로 교체.
- ⌘+/⌘- 키보드 handler (page.tsx:3190-3204) 도 동일 헬퍼 호출 (D-07).
- ⌘0 (100% 리셋, line 3174) 도 동일.

**기존 ⌘+/⌘- handler** (page.tsx:3189-3204) — 교체 대상:
```typescript
// ⌘+ / ⌘= — 줌 인 (= 키도 받음, shift 없는 + 입력 호환)
if (meta && (event.key === '+' || event.key === '=')) {
  event.preventDefault()
  setCanvasZoom((z) =>
    Math.min(2, Math.round((z + 0.1) * 100) / 100),
  )
  return
}
// ⌘- — 줌 아웃
if (meta && event.key === '-') {
  event.preventDefault()
  setCanvasZoom((z) =>
    Math.max(0.25, Math.round((z - 0.1) * 100) / 100),
  )
  return
}
```
→ `setCanvasZoom` 직접 호출을 `setZoomWithCenterPivot(next)` 로 교체 (next 값은 동일 clamp 로직).

---

### `apps/web/src/app/page.tsx` — Grid / Minimap 토글 state + 단축키 (D-01, D-12)

**Analog:** page.tsx:776 (`componentPanelOpen` state) + 3205-3210 (`[` 단축키)

**State 선언 패턴** (page.tsx:774-784):
```typescript
// UX-04 — 좌측 컴포넌트 라이브러리 패널 열림 여부. 기본 펼침 (D-08).
// 토글 단축키: [ (대괄호) — global keydown handler 에 등록.
const [componentPanelOpen, setComponentPanelOpen] = useState(true)
// ...
// 캔버스 grid — 디자인 정밀도용 격자 (off / 8 / 16 / 24 px cycle)
const [canvasGridSize, setCanvasGridSize] = useState<0 | 8 | 16 | 24>(0)
```
→ Phase 3 새 state (Korean 주석 + Phase 3 anchor 표기 mandate):
```typescript
// VIS-01 — 12-col grid overlay 토글. localStorage 저장 (D-01).
const [gridOverlayEnabled, setGridOverlayEnabled] = useState(false)
// VIS-03 — 좌하단 미니맵 토글. localStorage 저장 (D-08, D-12).
const [minimapEnabled, setMinimapEnabled] = useState(false)
```

**localStorage 저장 패턴** (page.tsx:1015-1098):
```typescript
canvasGridVisible?: boolean
canvasGridSize?: number
canvasZoom?: number
responsiveViewport?: ResponsiveViewport
leftPanelTab?: 'brief' | 'layers'
// ...
// 신규(canvasGridSize) 우선, 없으면 legacy boolean 마이그레이션
if (
  saved.canvasGridSize === 8 ||
  saved.canvasGridSize === 16 ||
  saved.canvasGridSize === 24
) {
  setCanvasGridSize(saved.canvasGridSize)
}
// ...
useEffect(() => {
  if (!isUIPrefsHydrated) return
  try {
    window.localStorage.setItem(
      'dw:uiPrefs:v1',
      JSON.stringify({
        canvasGridSize,
        canvasZoom,
        responsiveViewport,
        leftPanelTab,
        leftPanelWidth,
        rightPanelWidth,
      }),
    )
  } catch {}
}, [isUIPrefsHydrated, canvasGridSize, canvasZoom, ...])
```
→ `gridOverlayEnabled` + `minimapEnabled` 도 동일 `dw:uiPrefs:v1` JSON 에 필드 추가.

**단축키 G / Shift+M 등록 패턴** (page.tsx:3205-3210):
```typescript
// UX-04 — [ 컴포넌트 라이브러리 패널 토글 (modifier 없는 단일 키, D-08).
if (event.key === '[' && !meta && !event.altKey && !event.shiftKey) {
  event.preventDefault()
  setComponentPanelOpen((v) => !v)
  return
}
```
→ G / Shift+M 추가 (input/contentEditable 검사는 page.tsx 의 onKeyDown 진입 시 이미 함):
```typescript
// VIS-01 — G 키로 12-col grid overlay 토글 (modifier 없음, D-01).
if (event.key.toLowerCase() === 'g' && !meta && !event.altKey && !event.shiftKey) {
  event.preventDefault()
  setGridOverlayEnabled((v) => !v)
  return
}
// VIS-03 — Shift+M 으로 미니맵 토글 (M 단독은 modal 추가 — D-12 충돌 회피).
if (event.key.toLowerCase() === 'm' && !meta && !event.altKey && event.shiftKey) {
  event.preventDefault()
  setMinimapEnabled((v) => !v)
  return
}
```

**Toolbar 버튼 추가 패턴** (page.tsx:4996-5023 canvasGridSize 버튼):
```typescript
<button
  type="button"
  aria-label={
    canvasGridSize === 0
      ? '그리드 8px로 켜기'
      : `그리드 ${canvasGridSize}px → 다음 사이즈`
  }
  aria-pressed={canvasGridSize > 0}
  title="그리드 사이즈 cycle (off / 8 / 16 / 24 px)"
  onClick={() =>
    setCanvasGridSize((s) => {
      if (s === 0) return 8
      // ...
    })
  }
  className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-ui-accent)] ${
    canvasGridSize > 0
      ? 'border-[var(--dw-ui-accent)] bg-[var(--dw-ui-accent-soft)] text-[var(--dw-ui-accent-text)]'
      : 'border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] text-[var(--dw-ui-text-muted)] hover:border-[var(--dw-ui-accent)] hover:text-[var(--dw-ui-accent-text-strong)]'
  }`}
>
  <LayoutGrid size={13} aria-hidden="true" />
  <span className="tabular-nums">
    {canvasGridSize === 0 ? '그리드' : `${canvasGridSize}px`}
  </span>
</button>
```
→ 새 버튼 2개 추가 (`canvasGridSize` 버튼 우측에 배치, separator 사이에 둠):
- 12-col grid 토글 — lucide `Grid3x3` 아이콘, aria-label "12-col 그리드 토글"
- 미니맵 토글 — lucide `Map` 아이콘, aria-label "미니맵 토글"
- 동일 `aria-pressed` + accent border on/off + h-7 + shortcut title (`G`, `Shift+M`)

**Overlay 마운트 위치** (page.tsx:5274-5293 SpacingOverlay/BoxSelectOverlay/DropTargetOutline):
```typescript
{/* UX-02 spacing overlay — 노드 선택 + 다른 노드 hover 시 px 측정선 자동 표시.
    canvasScrollRef 내부 absolute 자식 (parent에 relative 적용됨) — scroll 따라감. */}
<SpacingOverlay
  selectedNodeId={selectedNodeId}
  altKeyPressed={altKeyPressed}
  canvasWrapperRef={canvasScrollRef}
/>
{/* UX-05 박스 선택 시각 — Shift+drag 동안 accent 50% border + 10% bg 사각형 (D-13). */}
<BoxSelectOverlay
  active={boxSelect.active}
  startX={boxSelect.startX}
  startY={boxSelect.startY}
  endX={boxSelect.endX}
  endY={boxSelect.endY}
/>
```
→ `<GridOverlay />` 도 같은 위치 (canvasScrollRef 내부, SpacingOverlay 와 같은 형제 absolute) — `compareMode ? null` 분기는 page.tsx 의 viewport-aware 영역 안에 마운트 (line 5228-5270 의 `<div className="px-8 py-8">` 안쪽).
→ `<Minimap />` 은 _fixed_ 라 page.tsx 의 최상위 `<main>` 직속 (CommandPalette / ShortcutHelpModal 와 같은 레벨, line 5500 근처).

---

### `apps/web/src/app/command-palette.tsx` (modify — 그리드/미니맵 토글 액션 등록)

**Analog:** page.tsx:3496+ `commandItems` 배열 entries (특히 line 3624-3656 줌/패널 group)

**기존 줌 group 엔트리 패턴** (page.tsx:3624-3656):
```typescript
// 줌
{
  id: 'zoom-100',
  label: '줌 100% 리셋',
  group: '줌',
  shortcut: '⌘0',
  keywords: ['zoom', 'reset', '100'],
  action: () => setCanvasZoom(1),
},
{
  id: 'zoom-fit',
  label: '화면에 맞춤 (fit to screen)',
  group: '줌',
  shortcut: '⌘1',
  keywords: ['fit', 'screen'],
  action: handleCanvasFit,
},
// ...
// 패널
{
  id: 'toggle-panels',
  label: panelsHidden ? '좌/우 패널 보이기' : '좌/우 패널 숨기기 (집중 모드)',
  group: '패널',
  shortcut: '⌘\\',
  keywords: ['hide', 'panels', 'focus'],
  action: () => setPanelsHidden((v) => !v),
},
```

→ 추가 엔트리 (page.tsx commandItems 배열 내 `// 패널` group 뒤에 새 `// 시각 보조` group 으로 삽입):
```typescript
// VIS-01..VIS-03 — Phase 3 시각 보조 토글.
{
  id: 'toggle-grid-overlay',
  label: gridOverlayEnabled ? '12-col 그리드 끄기' : '12-col 그리드 켜기',
  group: '시각 보조',
  shortcut: 'G',
  keywords: ['grid', '그리드', 'column', 'layout', '12'],
  icon: Grid3x3,
  action: () => setGridOverlayEnabled((v) => !v),
},
{
  id: 'toggle-minimap',
  label: minimapEnabled ? '미니맵 끄기' : '미니맵 켜기',
  group: '시각 보조',
  shortcut: '⇧M',
  keywords: ['minimap', '미니맵', 'navigator', 'overview'],
  icon: Map,
  action: () => setMinimapEnabled((v) => !v),
},
```

**ShortcutHelpModal SHORTCUT_GROUPS 추가** (command-palette.tsx:343-354 캔버스 패닝/줌 그룹 직후):
```typescript
{
  category: '캔버스 패닝 / 줌',
  items: [
    { keys: ['Space', '+ drag'], label: '캔버스 panning' },
    // ...
  ],
},
```
→ 새 group 추가:
```typescript
{
  category: '시각 보조',
  items: [
    { keys: ['G'], label: '12-col 그리드 토글' },
    { keys: ['⇧', 'M'], label: '미니맵 토글' },
  ],
},
```

---

## Shared Patterns

### Korean Comment Mandate
**Source:** 모든 컴포넌트 헤더 — spacing-overlay.tsx:2-9, component-library-panel.tsx:3-13
**Apply to:** grid-overlay.tsx + minimap.tsx 헤더, 모든 새 주석, commandItems Korean label
```typescript
// VIS-01 12-col 그리드 오버레이 — CONTEXT.md D-01..D-05 잠금.
// 색상: column α=0.06, gutter α=0.10 (--dw-ui-accent). z-index 50.
// 좌표는 canvas wrapper rect 기준 — canvas zoom 은 wrapper 의 CSS `zoom`(page.tsx:5246)
// 으로 처리되므로 wrapper 내부 absolute 자식으로 배치하면 zoom 자동 추종.
```

### Design Token Usage (Tailwind v4 + CSS vars)
**Source:** component-library-panel.tsx:124, box-select-overlay.tsx:67-69
**Apply to:** grid-overlay + minimap 색상/border/shadow 전체
```typescript
// Tailwind v4 + chrome token — 인라인 hex 금지 (단 보조 알파 색상은 예외).
className="border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] text-[var(--dw-ui-text-body)]"
backgroundColor: 'rgba(99, 102, 241, 0.1)'   // accent (#6366f1) 변형, D-02 column 색
```

### z-index 계층 표준
**Source:** spacing-overlay.tsx:304 (100) + box-select-overlay.tsx:66 (200) + command-palette.tsx:147 (100)
**Apply to:** GridOverlay (z-50, 노드 위 / NodeContextMenu 아래), Minimap (z-60+, 컴포넌트 라이브러리 위)
```
zIndex: 50   // grid overlay (D-03)
zIndex: 60   // minimap (D-08)
zIndex: 100  // spacing overlay / command palette modal
zIndex: 200  // box select overlay
```

### a11y: aria-label + aria-pressed + focus-visible
**Source:** component-library-panel.tsx:136-139, page.tsx:4998-5017 (canvasGridSize button)
**Apply to:** 모든 새 toolbar 버튼 + minimap close 버튼
```typescript
aria-label={상태별 한국어}
aria-pressed={enabled}
title="단축키 힌트 (G 등)"
className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-ui-accent)]"
```

### CSS.escape for data-dworks-node-id selector
**Source:** spacing-overlay.tsx:261-267, page.tsx:2976, 821, 833
**Apply to:** minimap.tsx 의 노드 박스 수집 시 (단, querySelectorAll 은 attribute 안전하므로 escape 불필요 — 단일 selector lookup 시만 필수)
```typescript
const selEl = document.querySelector<HTMLElement>(
  `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
)
```

### canvasZoom + scroll 좌표 변환 공식
**Source:** page.tsx:2982-2988 (zoom-to-selection), spacing-overlay.tsx:96-112 (toLogicalRect)
**Apply to:** minimap.tsx viewport rect + 노드 박스 scale 계산
```typescript
// DOM rect → logical px (zoom 적용 전)
const z = canvasZoom > 0 ? canvasZoom : 1
const logicalX = (event.clientX - wrapperRect.left + wrapper.scrollLeft) / z
const logicalY = (event.clientY - wrapperRect.top + wrapper.scrollTop) / z
// logical px → minimap px
const minimapX = logicalLeft * minimapScale
```

### localStorage persistence (uiPrefs:v1)
**Source:** page.tsx:1015-1098
**Apply to:** gridOverlayEnabled + minimapEnabled — `dw:uiPrefs:v1` JSON 필드 추가
```typescript
JSON.stringify({
  canvasGridSize,
  canvasZoom,
  responsiveViewport,
  leftPanelTab,
  leftPanelWidth,
  rightPanelWidth,
  gridOverlayEnabled,   // VIS-01 신규
  minimapEnabled,       // VIS-03 신규
})
```

### lucide-react icon import
**Source:** page.tsx:17-39 (LayoutGrid 등 alpha 정렬), component-library-panel.tsx:18-33
**Apply to:** Grid3x3 + Map 추가 (page.tsx import 블록 + command-palette import)
```typescript
import {
  // ... 알파벳 순으로 삽입
  Grid3x3,
  // ...
  Map,
  // ...
} from 'lucide-react'
```

---

## No Analog Found

(없음 — Phase 3 모든 파일이 codebase 내 강한 analog 보유)

---

## Metadata

**Analog search scope:** `apps/web/src/app/` (전체 디렉토리)
**Files scanned:** spacing-overlay.tsx, component-library-panel.tsx, box-select-overlay.tsx, command-palette.tsx, page.tsx (selected ranges: 670-850, 950-1100, 2950-3010, 3088-3220, 3340-3500, 3496-3700, 4970-5320, 5670-5750)
**Pattern extraction date:** 2026-05-11

---

*Phase: 03-visual-aids*
*Patterns mapped: 2026-05-11*
