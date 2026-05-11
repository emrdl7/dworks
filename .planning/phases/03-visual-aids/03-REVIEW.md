---
phase: 03-visual-aids
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - apps/web/src/app/grid-overlay.tsx
  - apps/web/src/app/grid-overlay.test.ts
  - apps/web/src/app/minimap.tsx
  - apps/web/src/app/page.tsx
  - apps/web/src/app/command-palette.tsx
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 3 (시각 보조 — VIS-01 12-col grid overlay, VIS-02 zoom pivot, VIS-03 좌하단 미니맵)의 신규 컴포넌트 2개(`grid-overlay.tsx`, `minimap.tsx`)와 `page.tsx`/`command-palette.tsx` 통합부를 검토했다. 전반적으로 한국어 주석, BEM/Tailwind v4 컨벤션, React 19 hook rule, `RefObject<T | null>` 타입 약속이 일관되게 지켜졌고, `aria-pressed`/`aria-label`/role/tabIndex/Enter+Space 키보드 핸들러 같은 WCAG 2.1 AA 기본 요건도 충족됐다. `useEffect` cleanup, rAF cancel, passive scroll listener 도 올바르게 처리됐다.

다만 **Minimap 컴포넌트에서 stale-closure 경고 1건 (WR-01)**, **rAF deps drift 1건 (WR-02)**, **scroll-driven 재측정 후 React state 와 DOM 의 일시적 불일치 1건 (WR-03)**, **`treeRevision` 카운터 overflow / 의미 약화 1건 (WR-04)** 이 식별됐다. 모두 안전망 영역에서 실제 사용자에게 노출될 가능성은 낮지만, 큰 트리 + 빠른 viewport 전환 / 장기 세션 시나리오에서 미세 jitter / stale measure 를 유발할 수 있어 Phase 4 진입 전 의식적 결정이 필요하다.

Critical 0건. Phase 3 의 핵심 success criteria(D-01~D-12)는 모두 구현 측에서 검증 가능하다.

## Warnings

### WR-01: Minimap `handleBodyClick` 및 `handleBodyKeyDown` 이 closure 로 캡처한 `scale` / `safeContent` 가 빠른 tree 변경 직후 stale 가능

**File:** `apps/web/src/app/minimap.tsx:188-225`
**Issue:**
`scale`, `safeContent` 는 함수 body 내 매 render 계산값으로, `handleBodyClick`/`handleBodyKeyDown` 함수 선언 시점의 값을 캡처한다. 동일 render 안에서는 안전하지만, click handler 가 `wrapper.scrollLeft/Top` 을 직접 변경하면서 `measureViewport()` 를 즉시 호출(L206)하기 때문에 — `setViewport` 의 batched update 가 적용되기 _전_ scroll DOM 은 이미 바뀐 상태가 된다. 이 자체는 render path 가 곧 따라잡지만, 동일 frame 내에 또 한번 click 이 들어오면(예: 빠른 drag 시뮬레이션) 두번째 click 은 _DOM scroll 은 1차 click 결과_ + _state viewport 는 0차 viewport_ 로 한 frame 짜리 misalignment 를 그릴 수 있다.
또한 `bodyHeight`/`aspectH` 계산이 `safeContent` 변화에만 의존하므로 minimap 첫 render 직후 measure 한 `contentSize` 가 들어오면 _height jump_ 가 1 frame 발생한다.

**Fix:**
- `handleBodyClick` 안에서 `scale`/`safeContent` 를 직접 캡처 대신 함수 호출 시점에 _wrapper 실측값_ 으로 재계산하면 frame race 가 사라진다:

```tsx
function handleBodyClick(event: ReactMouseEvent<HTMLDivElement>): void {
  const wrapper = canvasScrollRef.current
  if (!wrapper) return
  const z = canvasZoom > 0 ? canvasZoom : 1
  const liveContentW = Math.max(wrapper.scrollWidth / z, containerWidth)
  const liveContentH = Math.max(wrapper.scrollHeight / z, 1)
  const liveScale = bodyWidth / liveContentW
  if (liveScale <= 0) return
  const rect = event.currentTarget.getBoundingClientRect()
  const logicalX = (event.clientX - rect.left) / liveScale
  const logicalY = (event.clientY - rect.top) / liveScale
  wrapper.scrollLeft = Math.max(0, logicalX * z - wrapper.clientWidth / 2)
  wrapper.scrollTop = Math.max(0, logicalY * z - wrapper.clientHeight / 2)
  // measureViewport 는 scroll listener 의 rAF 가 어차피 잡으니 직접 호출 생략 가능.
}
```

- 또는 `requestAnimationFrame` 으로 `measureViewport` 를 한 단계 미뤄 batched update 가 들어간 다음 frame 에서 실측하도록 한다.

---

### WR-02: scroll/resize listener `useEffect` 가 `canvasScrollRef.current` 변경 또는 wrapper 재마운트를 감지하지 못함

**File:** `apps/web/src/app/minimap.tsx:153-174`
**Issue:**
`useEffect` deps 가 `[open, canvasScrollRef, measureViewport]` 인데, `canvasScrollRef` 객체 identity 는 절대 안 바뀌므로 — 만약 `canvasScrollRef.current` 가 **null → element** 로 늦게 채워지거나(예: minimap 이 켜진 상태에서 wrapper 가 conditional render 로 unmount → remount) effect 는 한번 더 동기화되지 않는다.

현 page.tsx 에서는 wrapper 가 mount 이후 안 사라지므로 실제 발현은 어려우나, viewport preset 전환 (`responsiveViewport` 변경) 시 GridOverlay 부모 wrapper 가 key 없이 stable 한지 확인이 필요하다. wrapper 재마운트가 생기면 minimap 의 listener 가 _과거 element_ 에 붙은 채 남아 새 element 의 scroll 을 추적하지 못해 viewport rect 가 정지한다.

**Fix:**
- 첫 effect 진입 시 `canvasScrollRef.current === null` 이면 미세 폴링 또는 ref callback 으로 mount 감지:

```tsx
// 옵션 A: open 변할 때마다 1회 rAF 로 재확인
useEffect(() => {
  if (!open) return
  let wrapper = canvasScrollRef.current
  let raf = 0
  if (!wrapper) {
    raf = window.requestAnimationFrame(function tryAttach() {
      wrapper = canvasScrollRef.current
      if (!wrapper) {
        raf = window.requestAnimationFrame(tryAttach)
        return
      }
      // attach listeners ... (refactor 필요)
    })
  }
  // ...
}, [open, canvasScrollRef, measureViewport])
```

- 또는 page.tsx 측에서 wrapper element 자체를 `useState<HTMLDivElement | null>` 로 보관해 Minimap 에 직접 prop drilling 하면 React 가 변경을 감지한다(권장).

---

### WR-03: Minimap `measureNodes` 가 scroll 변경 시 재호출되지 않아 큰 트리 / lazy-rendered 노드에서 outline 누락 가능

**File:** `apps/web/src/app/minimap.tsx:138-149, 153-174`
**Issue:**
`measureNodes` 는 `[open, treeRevision, canvasZoom, containerWidth]` 변경 시에만 호출된다. scroll listener(L153~)는 의도적으로 `measureViewport` 만 호출하고 노드 박스는 건드리지 않는다(주석 L152 의 의도). 이 자체는 성능 측면에서 옳다.

문제는: page.tsx 에서 노드가 **lazy / virtualized** 로 mount 되거나, drag 중 노드가 새로 생성/삭제되는데 `tree` 객체 identity 가 안 바뀌는 mutation 경로(예: in-place layout update)가 있으면 `treeRevision` 이 트리거되지 않아 미니맵 outline 이 _stale_ 인 채 남는다. page.tsx:836 `useEffect(() => { setTreeRevision((r) => r + 1) }, [tree])` 는 tree reference identity 변경만 감지한다.

또한 노드 박스의 **위치/크기는 변하는데 (resize, container 크기 reflow) tree identity 가 안 바뀌면** 노드 outline 이 옛 좌표에 머무른다. WCAG 위험은 없지만 D-09(미니맵 정확도) 약속과 충돌한다.

**Fix:**
- `containerWidth` 변경 시 measureNodes 가 자동 재실행되므로(L142~) viewport preset 전환은 OK.
- ResizeObserver 를 wrapper 에 붙여 scroll content 크기 변동을 detection 한다:

```tsx
useEffect(() => {
  if (!open) return
  const wrapper = canvasScrollRef.current
  if (!wrapper) return
  const ro = new ResizeObserver(() => measureNodes())
  ro.observe(wrapper)
  return () => ro.disconnect()
}, [open, canvasScrollRef, measureNodes])
```

- 또는 tree mutation 이 항상 새 reference 를 만든다는 invariant 를 page.tsx 측에서 명시적으로 보장(현재 historyPast/Future + immer 패턴이라면 이미 충족 가능 — Phase 3 verification 에서 cross-check 필요).

---

### WR-04: `treeRevision` 카운터가 number — 장기 세션에서 Number.MAX_SAFE_INTEGER 도달 (이론적) + dep 비교에 변경 신호로만 쓰임

**File:** `apps/web/src/app/page.tsx:796, 836-838`
**Issue:**
```tsx
const [treeRevision, setTreeRevision] = useState(0)
useEffect(() => {
  setTreeRevision((r) => r + 1)
}, [tree])
```
`tree` reference 가 바뀔 때마다 `treeRevision` 을 무한 증가시킨다. 실용적으로 overflow 위험은 무시 가능(초당 100회 mutation 이어도 28만년)이지만 — 더 중요한 문제는:

1. tree 변경 → page rerender → treeRevision +1 → 또 rerender → Minimap rerender (의도). 이중 render path.
2. `useEffect` dep 로만 비교되는 값을 number 로 유지하는 건 정상이지만, `tree` 자체를 그대로 Minimap 에 prop 으로 넘기지 않고 별도 revision 카운터를 도입한 이유의 주석이 약하다(주석 L795: "useRef 카운터로는 re-render 가 안 일어남" — 맞지만 `tree` 를 prop 으로 직접 넘기지 못하는 이유 설명 부재).

**Fix:**
- `tree` 객체 자체를 minimap 에 넘기지 않는 이유는 _노드 박스 측정이 DOM 기반이라 tree 구조 detail 이 불필요_ 하기 때문이라는 점을 주석에 명시.
- 단순화 옵션: `Minimap` props 에 `treeRevision` 대신 `tree` 의 root id + node count 같은 light identity 를 넘긴다. 또는 그대로 두되 주석 보강:

```tsx
// VIS-03 — tree 객체 자체는 Minimap 에 불필요(노드 박스는 DOM querySelector 기반).
// re-measure trigger 로만 사용하므로 number identity 로 충분. overflow 위험은
// 실용상 무시 가능(2^53 ≈ 9e15).
const [treeRevision, setTreeRevision] = useState(0)
```

- 또는 `treeRevision` 을 prop 으로 받지 말고 Minimap 내부에서 `tree` 를 context 로 받아 사용. (변경 비용 큼 — 비추.)

## Info

### IN-01: GridOverlay column 박스 88개의 inline style 매 render 재생성 — 큰 트리 + 다중 reflow 시 미세 GC pressure

**File:** `apps/web/src/app/grid-overlay.tsx:48-87`
**Issue:**
`columnCount=12` 기준 column 12개 + gutter 11개 = 23개의 `<div>` 가 매 render `style={{...}}` 으로 새 객체를 만든다. React 19 + Tailwind v4 환경에서 23개 객체 / render 는 negligible 이지만, 향후 `columnCount` 를 24 / 48 로 늘리는 v3.0 deferred 시 패턴이 굳어지면 jank 원인이 될 수 있다.

**Fix:** 현재는 무시 가능. v3.0 에서 column count 확장 시 `blocks` 와 stylesheet 를 `useMemo` 로 묶고 CSS variable 활용 권장.

---

### IN-02: `computeColumnEdges` Set 사용으로 부동소수점 중복 제거 시 정밀도 의존

**File:** `apps/web/src/app/grid-overlay.tsx:101-107`
**Issue:**
`edges.add(start + colWidth)` 와 다음 iteration 의 `edges.add(start)` 사이에 부동소수점 누적이 발생할 수 있다. `colWidth = (1440 - 11*16) / 12 = 105.333...` 같은 무리수가 Set 에서 별개 key 로 들어가면 중복 제거 실패. 테스트(L19) 가 정확히 24 edge 를 통과한다는 사실은 1440px 케이스에서 우연히 누적이 정렬되는 운에 의존한다.

**Fix:** edges 정밀도를 명시 — `edges.add(Math.round(start * 1000) / 1000)` 또는 `Math.fround` 로 정규화:

```ts
const QUANT = 1000
const round = (x: number) => Math.round(x * QUANT) / QUANT
for (let i = 0; i < columnCount; i += 1) {
  const start = round(i * (colWidth + gutterPx))
  edges.add(start)
  edges.add(round(start + colWidth))
}
```

snapToColumnEdge 의 threshold 4px 이라 1e-9 오차는 무해하지만, 다른 컨테이너 폭 + non-integer gutter 에서 edge count 가 +1 되는 회귀를 막을 수 있다.

---

### IN-03: `snapToColumnEdge` 에서 `bestEdge = 0` 초기값이 edges 첫 원소가 0이 아닐 때 의미적 혼란

**File:** `apps/web/src/app/grid-overlay.tsx:120-128`
**Issue:**
`bestEdge = 0` 으로 초기화하지만 빈 배열은 L117~119 에서 이미 조기 반환되므로 항상 첫 iteration 에서 `bestEdge` 가 갱신된다. 그래도 reader 입장에서는 "왜 0?" 이 의문이다. `edges[0]` 으로 초기화하거나 `let bestEdge: number | null = null` 후 갱신 시 narrow.

**Fix:**
```ts
let bestEdge = edges[0]!
let bestDelta = Math.abs(value - bestEdge)
for (let i = 1; i < edges.length; i += 1) {
  const d = Math.abs(value - edges[i]!)
  if (d < bestDelta) { bestDelta = d; bestEdge = edges[i]! }
}
```

---

### IN-04: `snapGuideX` state declared but `setSnapGuideX` 미사용 — eslint-disable 주석으로 무력화

**File:** `apps/web/src/app/page.tsx:797-801`
**Issue:**
```tsx
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [snapGuideX, setSnapGuideX] = useState<number | null>(null)
```
인프라(D-04 snap 가이드 렌더 site)만 박아두고 호출 site 는 Phase 4 (또는 자유 위치 드래그 통합) 로 deferred. 의도는 주석에 명확하지만, eslint-disable 은 — 향후 호출 사이트가 추가될 때 _setter 자체 누락_ 을 막아주지 못한다. (예: 누가 `snapGuideX` 만 read 하고 setter 를 호출 안 하는 dead-state 가 생길 수 있음.)

**Fix:** Phase 4 진입 시 즉시 호출 site 추가 또는 — 그 전이라도 — `// TODO(VIS-01-D04): Phase 4 자유 드래그 통합에서 setSnapGuideX(...) 호출 site 추가` 코멘트 강화. 현 주석은 의도는 충분하나 grep-able marker(`TODO`) 가 없어 누락 위험.

---

### IN-05: Command palette `시각 보조` group label 일관성 — shortcut help modal 카테고리와 동일하지만 ⌘K palette 와의 group 순서 정렬은 검증 필요

**File:** `apps/web/src/app/command-palette.tsx:356-362`, `apps/web/src/app/page.tsx:3789-3808`
**Issue:**
command-palette 의 shortcut-help-modal 카테고리는 `시각 보조` (line 357) 이고, page.tsx 의 `commandItems` 에 등록되는 `group: '시각 보조'` 항목 2개도 동일 라벨. command-palette.tsx:131~ 의 `groupedItems` 는 "첫 등장 순서" 로 그룹을 정렬하므로 — `commandItems` 배열 안에서 `toggle-grid-overlay` 가 다른 그룹 아이템 사이에 끼면 `시각 보조` 그룹이 의도와 다른 위치에 표시될 수 있다. 현재는 다행히 도움말 그룹 직전에 모여 있어 가시성 OK.

**Fix:** 정보성. `commandItems` 배열의 group 별 묶음 순서를 ESLint custom rule 이 아니라 — Phase 4 에서 새 항목 추가 시 의식적 review. 별도 fix 불필요.

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
