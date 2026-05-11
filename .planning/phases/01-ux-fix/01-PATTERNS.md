# Phase 1: UX 핵심 fix + 측정 도구 — Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 10 (4 modify + 6 create)
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/web/src/app/page.tsx` (modify) | container/page | event-driven (keydown/mousedown) | _self_ (line 2862 global keydown / line 4673 canvas mousedown) | exact (in-place 확장) |
| `apps/web/src/app/selectable-node.tsx` (modify) | component | request-response (hover/click) | _self_ (line 270 onMouseEnter) | exact (in-place 확장) |
| `apps/web/src/app/command-palette.tsx` (modify) | component | request-response (action 실행) | _self_ + page.tsx line 3195 (commandItems 등록) | exact |
| `apps/web/src/app/node-meta.ts` (modify) | data/config | static map | _self_ (line 23 nodeTypeLabels) | exact |
| `apps/web/src/app/component-library-panel.tsx` (CREATE) | component | event-driven (drag-and-drop) | `selectable-node.tsx` + page.tsx layer panel (line 4380) | role-match |
| `apps/web/src/app/spacing-overlay.tsx` (CREATE) | component | request-response (DOM 측정 → 렌더) | `selectable-node.tsx` (CanvasNodeToolbar) | role-match |
| `apps/web/src/app/box-select-overlay.tsx` (CREATE) | component | event-driven (mousedown/move/up) | page.tsx line 3081 resize handler + line 4673 onMouseDown | role-match |
| `apps/web/src/app/node-type-convert.ts` (CREATE) | utility/data | transform (node → node) | `packages/tree-editor/src/operations.ts` line 688 `convertLeafNode` | exact |
| `apps/web/src/app/use-align-distribute.ts` (CREATE) | hook | transform (selected[] → tree patch) | `tree-editor` operations + `commitTreeEdit` 호출 패턴 | role-match |
| `apps/web/src/app/use-quick-add.ts` (CREATE) | hook | event-driven (keydown) | page.tsx line 2862 global keydown handler | role-match |

---

## Pattern Assignments

### `apps/web/src/app/page.tsx` (modify — container/page)

**Analog:** _self_ (다양한 기존 섹션을 확장)

**1. Global keydown 등록 패턴** (`page.tsx:2854-3015`):
```tsx
useEffect(() => {
  function isEditableTarget(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false
    const tag = el.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (el.isContentEditable) return true
    return false
  }
  function onKeyDown(event: globalThis.KeyboardEvent) {
    if (isEditableTarget(event.target)) return
    const meta = event.metaKey || event.ctrlKey
    // ⌘D — duplicate
    if (meta && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      handleDuplicateSelected()
      return
    }
    // … 더 많은 단축키 분기
  }
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [historyPast, historyFuture, selectedNodeId, tree, /* … */])
```
→ **UX-06 quick-add (`T/B/I/R/C/H/L/F/A/M`, `Shift+C`, `Shift+T`)**, **UX-05 정렬 (`Alt+A/H/D/W/V/S`) + 분포 (`Alt+Shift+H/V`)**, **UX-04 좌측 패널 토글 (`[`)** 모두 이 분기 체인에 동일 패턴으로 추가. `isEditableTarget` + `commandPaletteOpen` + `shortcutHelpOpen` 가드 그대로 사용 (UI-SPEC D-17 활성 조건).

**2. 캔버스 onMouseDown 패턴** (`page.tsx:4673-4699`):
```tsx
onMouseDown={(event) => {
  // 스페이스+드래그 또는 가운데 버튼 → 패닝
  const isMiddleButton = event.button === 1
  if (!isSpacePressed && !isMiddleButton) return
  event.preventDefault()
  const el = canvasScrollRef.current
  if (!el) return
  setIsPanning(true)
  panStateRef.current = { startX: event.clientX, startY: event.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
}}
onMouseMove={(event) => {
  const rect = el.getBoundingClientRect()
  const z = canvasZoom > 0 ? canvasZoom : 1
  setCanvasCursor({
    x: Math.round((event.clientX - rect.left + el.scrollLeft) / z),
    y: Math.round((event.clientY - rect.top + el.scrollTop) / z),
  })
}}
```
→ **UX-05 박스 선택** mousedown 분기는 `event.shiftKey && event.button === 0 && event.target === currentTarget` (빈 캔버스) 조건으로 동일 위치에 추가. logical 좌표 변환 공식 `(clientX - rect.left + scrollLeft) / canvasZoom` 그대로 재사용.

**3. NodeContextMenu 서브메뉴 확장** (`page.tsx:5580-5655`):
```tsx
{node.type === 'text' || node.type === 'button' || node.type === 'image' ? (
  <>
    <div className="my-1 h-px bg-[var(--dw-ui-soft)]" role="separator" />
    <ContextMenuButton disabled={node.type === 'text'} onClick={() => onChangeLeafType('text')}>
      텍스트로 변경
    </ContextMenuButton>
    {/* … */}
  </>
) : null}
```
→ **UX-03 컨텍스트 메뉴 "노드 타입 변경 →"**: 현재는 flat 항목 (`텍스트로 변경` / `이미지로 변경` 등). 그대로 두되 **호환 매트릭스 (UI-SPEC line 137-148)** 기반으로 항목 enable/disable + `title` (tooltip) 추가. 비호환은 `disabled={true} title="변환 불가: …"` 표시. 신규 호환 쌍 (list↔accordion, image↔carousel, hero↔section/card) 항목도 추가.

**4. 추가 선택 state** (`page.tsx:583-598`):
```tsx
const [selectedNodeId, setSelectedNodeId] = useState(/* … */)
const [additionalSelectedNodeIds, setAdditionalSelectedNodeIds] = useState<Set<string>>(new Set())
useEffect(() => { setAdditionalSelectedNodeIds(new Set()) }, [selectedNodeId])
const allSelectedNodeIds = useMemo(
  () => new Set<string>([selectedNodeId, ...additionalSelectedNodeIds]),
  [selectedNodeId, additionalSelectedNodeIds],
)
```
→ **UX-05 박스 선택 결과**: `setAdditionalSelectedNodeIds` 로 모든 intersected 노드 set. 박스 안에 떨어진 노드 중 _첫 번째를 primary_ 로 `setSelectedNodeId`, 나머지를 additional 로 push. `selectedNodeId` 변경 시 additional 자동 reset 되므로 _primary 먼저 set 후 next-tick에 additional set_ (또는 batch state).

**5. 커밋 패턴** (`page.tsx:2677-2702`):
```tsx
const nextTree = addLeafChild(tree, parentId, childType, newId)
commitTreeEdit(nextTree, newId)
```
→ **UX-03 변환, UX-04 패턴 카드 drop, UX-05 정렬/분포, UX-06 quick-add** 모두 _tree 변환 → `commitTreeEdit(nextTree, focusNodeId)`_ 호출. history stack 자동 처리.

---

### `apps/web/src/app/selectable-node.tsx` (modify — component)

**Analog:** _self_ (line 270 onMouseEnter)

**핵심 hover 패턴** (`selectable-node.tsx:270-277`):
```tsx
onMouseEnter={() => {
  if (isCanvasSelectable) setHoveredNodeId(node.id)
}}
onMouseLeave={() => {
  if (isCanvasSelectable && hoveredNodeId === node.id) {
    setHoveredNodeId(null)
  }
}}
```
→ **UX-02 spacing overlay 트리거**: `hoveredNodeId` 가 `CanvasHoverContext` 로 이미 전파됨. spacing-overlay.tsx 는 `useContext(CanvasHoverContext)` + `selectedNodeId` 두 ID로 _자동 측정_. _selectable-node.tsx 수정은 최소화_ — 기존 hoveredNodeId 흐름 그대로 사용. 단 DOM 측정용 `data-dworks-node-id` 속성 (line 259) 이 이미 있으므로 `document.querySelector('[data-dworks-node-id="…"]')` 로 boundingRect 측정.

**(선택적) data-attribute 보강** (line 256-269):
```tsx
<div
  role="button"
  tabIndex={isCanvasSelectable ? 0 : -1}
  data-dworks-node-id={node.id}
  className={`group/dwnode relative border …`}
  style={nodeMetaStyle}
>
```
→ 변경 불필요. 이미 `data-dworks-node-id` 로 외부에서 DOM 식별 가능.

---

### `apps/web/src/app/command-palette.tsx` (modify — component)

**Analog:** _self_ + `page.tsx:3195` (commandItems 등록)

**shortcut 표시 패턴** (`command-palette.tsx:228-238`):
```tsx
{item.shortcut ? (
  <span
    className={`shrink-0 rounded-[var(--dw-radius-sm)] border px-1.5 py-0.5 font-mono text-[length:var(--dw-text-caption)] ${
      isActive
        ? 'border-[var(--dw-ui-accent-border)] text-[var(--dw-ui-accent-text)]'
        : 'border-[var(--dw-ui-border)] text-[var(--dw-ui-text-muted)]'
    }`}
  >
    {item.shortcut}
  </span>
) : null}
```
→ **UX-06 단축키 cheatsheet (D-19)**: `commandItems` 배열에 quick-add (T/B/I/…) + 정렬/분포 항목 추가. 각 항목에 `shortcut: 'T'` 형식 표기. 변경 없이 기존 표시 로직 그대로.

**page.tsx commandItems 확장 위치** (`page.tsx:3195-3234`):
```tsx
const commandItems: CommandPaletteItem[] = [
  ...(['text', 'button', 'image'] as const).map<CommandPaletteItem>(
    (childType) => ({
      id: `add-leaf-${childType}`,
      label: `${nodeTypeLabels[childType]} 추가`,
      group: '노드 추가',
      icon: nodeTypeIcons[childType],
      keywords: [childType, 'add', '새', '생성'],
      disabled: selectedCommandIsMissing,
      disabledReason: '선택된 노드가 없음',
      action: () => { /* … */ },
    }),
  ),
  // …
]
```
→ **UX-03 변환 액션** (`변환: 버튼으로` 등), **UX-04 패널 토글** (`컴포넌트 패널 토글`), **UX-06 단축키 도움말** 모두 이 배열에 동일 객체 형태로 push. `disabled` + `disabledReason` 으로 호환 매트릭스의 비호환 안내 표시.

---

### `apps/web/src/app/node-meta.ts` (modify — data/config)

**Analog:** _self_ (line 23)

**기존 패턴** (`node-meta.ts:23-51`):
```tsx
import type { TreeNode } from '@dworks/tree'

export const nodeTypeLabels: Record<TreeNode['type'], string> = {
  text: '텍스트',
  button: '버튼',
  image: '이미지',
  // …
}
export const nodeTypeIcons: Record<TreeNode['type'], LucideIcon> = {
  text: Type,
  button: MousePointer,
  // …
}
```
→ **UX-03 호환 매트릭스 추가**: 동일 모듈에 `nodeTypeConversionMatrix: Partial<Record<TreeNode['type'], readonly TreeNode['type'][]>>` 추가. 한국어 라벨/아이콘과 _병행_ 위치 (단일 source of truth). 매트릭스는 UI-SPEC line 137-148 그대로 (text↔button, section↔hero↔card, list↔accordion, image↔carousel). 비호환 사유 `nodeTypeConversionDisabledReason: Partial<Record<TreeNode['type'], string>>` 도 같이 정의.

```tsx
// 추가 패턴 (executor)
export const nodeTypeConversionMatrix: Record<TreeNode['type'], readonly TreeNode['type'][]> = {
  text: ['button'],
  button: ['text'],
  section: ['hero', 'card'],
  hero: ['section', 'card'],
  card: ['section', 'hero'],
  list: ['accordion'],
  accordion: ['list'],
  image: ['carousel'],
  carousel: ['image'],
  form: [],
  tabs: [],
  modal: [],
}
```

---

### `apps/web/src/app/component-library-panel.tsx` (CREATE — component)

**Analog:** `selectable-node.tsx` (drag start) + `page.tsx:4380` (layer drag UX) + `command-palette.tsx` (modal Tailwind class style)

**1. Drag start 패턴** (`page.tsx:2505-2521`):
```tsx
function handleLayerDragStart(
  nodeId: string,
  event: ReactDragEvent<HTMLButtonElement>,
) {
  const structureInfo = getStructureInfo(tree, nodeId)
  if (structureInfo.isRoot) {
    event.preventDefault()
    return
  }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', nodeId)
  setSelectedNodeId(nodeId)
  setLayerDrag({ nodeId })
}
```
→ Component card `onDragStart` 도 동일 형태. UI-SPEC line 169:
```tsx
event.dataTransfer.effectAllowed = 'copy'
event.dataTransfer.setData(
  'application/x-dworks-node',
  JSON.stringify({ type: 'text' /* or fixtureId */ }),
)
```

**2. 카드 hover 패턴** (`command-palette.tsx:206-211`):
```tsx
className={`flex w-full items-center justify-between gap-3 rounded-[var(--dw-radius-sm)] px-3 py-2 text-left text-[length:var(--dw-text-value)] transition-colors duration-[var(--dw-motion-fast)] disabled:cursor-not-allowed disabled:opacity-40 ${
  isActive
    ? 'bg-[var(--dw-ui-accent-soft)] text-[var(--dw-ui-accent-text-strong)]'
    : 'text-[var(--dw-ui-text-body)] hover:bg-[var(--dw-ui-elevated)]'
}`}
```
→ Component card hover ring + scale: `hover:ring-1 hover:ring-[var(--dw-ui-accent)] hover:scale-[1.02] transition-all duration-[var(--dw-motion-base)]`.

**3. 패널 surface Tailwind 패턴** (`page.tsx:3528-3556` 기존 좌측 패널):
```tsx
className={`fixed inset-x-0 bottom-0 top-14 z-40 cursor-default bg-black/60 transition-opacity duration-200 ease-out md:hidden ${
  briefDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
}`}
// 좌측 panel surface (인근)
className="… bg-[var(--dw-ui-panel)] border-r border-[var(--dw-ui-border)] …"
```
→ Component panel 폭은 UI-SPEC D-08 으로 잠금: `style={{ width: 240 }}` (펼침), `style={{ width: 32 }}` (collapsed). 토글 transition `transition-[width] duration-[var(--dw-motion-base)]`.

**4. node-meta 아이콘 활용** (`selectable-node.tsx:328-334`):
```tsx
{(() => {
  const Icon = nodeTypeIcons[node.type]
  return <Icon aria-hidden="true" size={11} />
})()}
{nodeTypeLabels[node.type]}
```
→ Basic 카드 12종은 `nodeTypeIcons[nodeType]` + `nodeTypeLabels[nodeType]` 그대로 활용. card / hero / modal 아이콘은 UI-SPEC line 174-187 lucide 매핑 (`Type`, `MousePointerClick`, `Image` 등) 적용 — _현재 node-meta.ts 와 충돌 시 새 아이콘 매핑은 component-library-panel 내부 const 로 정의_ (전역 변경 금지).

**5. Patterns 카드 source** (`tree-fixtures.ts:1-65`):
```tsx
import cardGridRaw from '../../../../seeds/trees/card-grid.json'
import simpleHeroRaw from '../../../../seeds/trees/simple-hero.json'
// …
export const treeFixtures = [simpleHeroFixture, cardGridFixture, /* … */]
```
→ Patterns 카테고리는 `treeFixtures` 7종 + UI-SPEC line 196-201 신규 fixture 3개 (pricing-tier, products-carousel, faq-accordion) JSON 추가 → `treeFixtures` 배열에 push. 드롭 시 fixture.tree.root.children 을 컨테이너 노드에 append.

---

### `apps/web/src/app/spacing-overlay.tsx` (CREATE — component)

**Analog:** `selectable-node.tsx` (CanvasNodeToolbar `position: absolute` overlay, line 105-141)

**1. Absolute overlay 패턴** (`selectable-node.tsx:105-110`):
```tsx
<div
  role="toolbar"
  aria-label="선택 노드 툴바"
  className="pointer-events-auto absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-md border border-[var(--dw-ui-border)] bg-[var(--dw-ui-elevated)] px-1 py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
>
```
→ Spacing overlay 는 _캔버스 wrapper 안 absolute_ 가 아니라 _최상위 fixed_ (혹은 canvasScrollRef 안 absolute) 로 grouping. UI-SPEC line 117: `position: absolute` DOM 레이어 `z-index: 100`, `pointer-events: none` (라벨 위치 클릭 가능하게 하려면 라벨만 `pointer-events: auto`).

**2. 캔버스 좌표 변환** (`page.tsx:4694-4698`):
```tsx
const rect = el.getBoundingClientRect()
const z = canvasZoom > 0 ? canvasZoom : 1
setCanvasCursor({
  x: Math.round((event.clientX - rect.left + el.scrollLeft) / z),
  y: Math.round((event.clientY - rect.top + el.scrollTop) / z),
})
```
→ Spacing overlay 가 `data-dworks-node-id` 로 DOM 노드 두 개 (selected + hovered) `getBoundingClientRect()` 측정 → canvas wrapper rect 빼서 logical 좌표 변환 → `/ canvasZoom`. **render 좌표는 zoom 곱한 픽셀** (overlay 가 canvas wrapper 안 absolute 라면 zoom transform 이 이미 적용되므로 raw client rect 차이만 사용).

**3. px 라벨 박스 (UI-SPEC line 91)**:
```tsx
<span
  className="absolute rounded-[var(--dw-radius-sm)] bg-[var(--dw-ui-accent)] px-1 py-0.5 text-[length:var(--dw-text-caption)] font-semibold text-white"
  style={{
    left: midX,
    top: midY - 22,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
    minWidth: 24,
  }}
>
  {Math.round(gap * 100) / 100}
</span>
```
→ 측정선 자체는 `<div>` border 또는 `<svg><line>` — UI-SPEC D-02 `div + border` 추천. 정렬 가이드는 `border-dashed` + `borderColor: '#FF8FAB'`.

**4. fade-out 패턴 (UI-SPEC line 114)**:
```tsx
style={{
  animation: 'dw-fade-in var(--dw-motion-fast) var(--dw-motion-ease) both',
}}
// `command-palette.tsx:148` 의 fade-in 패턴 그대로
```

---

### `apps/web/src/app/box-select-overlay.tsx` (CREATE — component)

**Analog:** `page.tsx:3081-3114` (resize handle global mouse capture) + `page.tsx:4673-4699` (canvas onMouseDown)

**1. Global mouse capture 패턴** (`page.tsx:3081-3114`):
```tsx
useEffect(() => {
  if (resizingPanel === null) return
  function onMove(event: MouseEvent) {
    if (resizingPanel === 'left') {
      const next = Math.max(LEFT_PANEL_MIN, Math.min(LEFT_PANEL_MAX, event.clientX))
      setLeftPanelWidth(next)
    }
  }
  function onUp() {
    setResizingPanel(null)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  return () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
}, [resizingPanel])
```
→ **박스 선택 drag 동안 글로벌 mousemove/mouseup capture**. state 는 `boxSelectStart: { x, y } | null` + `boxSelectEnd: { x, y } | null`. 시작은 캔버스 onMouseDown 의 `event.shiftKey && event.target === currentTarget` 분기에서.

**2. 박스 시각화 (UI-SPEC line 211)**:
```tsx
<div
  aria-hidden="true"
  className="pointer-events-none absolute z-[200] border border-[var(--dw-ui-accent)]/50 bg-[var(--dw-ui-accent)]/10"
  style={{
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }}
/>
```
→ canvas scroll wrapper 안 `absolute` 로 mount. 좌표는 logical px (canvasZoom 적용 전). 부모가 zoom transform 이면 그대로 시각 일치.

**3. intersect-mode 노드 검출 (UI-SPEC line 213)**:
```tsx
// 모든 selectable 노드의 boundingClientRect 와 박스 rect intersect 검사
const nodes = document.querySelectorAll<HTMLElement>('[data-dworks-node-id]')
const selected: string[] = []
nodes.forEach((el) => {
  const rect = el.getBoundingClientRect()
  if (rectsIntersect(boxRectClient, rect)) {
    selected.push(el.dataset.dworksNodeId!)
  }
})
```
→ `data-dworks-node-id` 는 `selectable-node.tsx:259` 에서 이미 박혀있음. mouseup 시 selected[0] 을 primary, 나머지를 additional 로 commit.

---

### `apps/web/src/app/node-type-convert.ts` (CREATE — utility/data)

**Analog:** `packages/tree-editor/src/operations.ts:688-728` (`convertLeafNode`)

**1. 변환 함수 패턴** (`operations.ts:688-728`):
```ts
function convertLeafNode(
  node: Extract<TreeNode, { type: 'text' | 'button' | 'image' }>,
  nextType: LeafNodeType,
): TreeNode {
  if (node.type === nextType) return node
  // base props 추출 — 모든 leaf 노드 공통.
  const { id, editKind, hidden, disabled, opacity, /* … */ } = node
  const base = {
    id,
    editKind,
    ...(hidden !== undefined ? { hidden } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
    // …
  }
  // nextType 별 specific props 추가
  if (nextType === 'text') return { ...base, type: 'text', content: '…' }
  // …
}
```
→ **UX-03 확장 매트릭스**: 동일 시그니처 (in/out `TreeNode`) 함수를 _신규 매트릭스_ (text↔button, section↔hero↔card, list↔accordion, image↔carousel) 별로 작성. 손실 정보는 별도 반환:

```ts
export interface ConversionResult {
  tree: Tree
  lossWarnings: readonly string[]  // 한국어 toast 문자열 (UI-SPEC line 269-272)
}

export function convertNodeType(
  tree: Tree,
  nodeId: string,
  nextType: TreeNode['type'],
): ConversionResult { /* … */ }
```

**2. 호환 검사 (`node-meta.ts` 의 `nodeTypeConversionMatrix` 사용)**:
```ts
import { nodeTypeConversionMatrix } from './node-meta'

export function canConvertNodeType(
  fromType: TreeNode['type'],
  toType: TreeNode['type'],
): boolean {
  return nodeTypeConversionMatrix[fromType]?.includes(toType) ?? false
}
```
→ NodeContextMenu 와 commandItems 양쪽이 동일 함수 사용 (DRY).

**3. 손실 toast 문자열 (UI-SPEC line 269-272)**:
```ts
// 한국어 문자열은 단일 상수 모듈에서 export — i18n 미래 대비
export const CONVERSION_LOSS_MESSAGES = {
  onClickLost: '버튼의 클릭 동작이 텍스트로 변환되며 사라졌습니다.',
  carouselSlidesLost: (remaining: number) =>
    `이미지로 변환되며 첫 슬라이드만 유지되었습니다 (남은 ${remaining}개 슬라이드 제거).`,
  accordionBodyLost: '리스트로 변환되며 각 항목의 본문은 제거되었습니다.',
  cardImageLost: '섹션으로 변환되며 이미지가 제거되었습니다.',
} as const
```

---

### `apps/web/src/app/use-align-distribute.ts` (CREATE — hook)

**Analog:** page.tsx 의 add/delete handler 들 (`page.tsx:2669-2742`) — 동일한 _tree 변환 → commitTreeEdit_ 패턴

**1. handler 패턴** (`page.tsx:2669-2680`):
```tsx
function handleAddLeafChild(parentId: string, childType: LeafNodeType) {
  const existingIds = collectNodeIds(tree.root)
  const base = `${parentId}.${childType}`
  let suffix = 1
  while (existingIds.has(`${base}-${suffix}`)) { suffix += 1 }
  const newId = `${base}-${suffix}`
  const nextTree = addLeafChild(tree, parentId, childType, newId)
  commitTreeEdit(nextTree, newId)
  closeContextMenu()
}
```
→ **정렬/분포 함수**: 동일하게 _selected ids → tree 변환 → commitTreeEdit_ 흐름. 단 변환은 inset/position 값을 _순수 함수_ 로 계산 후 적용.

**2. hook 시그니처**:
```ts
export interface UseAlignDistribute {
  alignLeft: () => void
  alignCenterH: () => void
  alignRight: () => void
  alignTop: () => void
  alignCenterV: () => void
  alignBottom: () => void
  distributeH: () => void
  distributeV: () => void
}

export function useAlignDistribute(args: {
  tree: Tree
  selectedIds: ReadonlySet<string>
  commitTreeEdit: (nextTree: Tree, focusId: string) => void
  showToast: (msg: string, tone: 'warn' | 'error') => void
}): UseAlignDistribute { /* … */ }
```

**3. 경고 toast 패턴 (UI-SPEC line 222-226)**:
```ts
// 자식 layout 이 absolute 아니면
if (!isAbsolute(node)) {
  showToast('정렬은 절대 위치(position: absolute) 노드에만 적용됩니다.', 'warn')
  return  // skip
}
if (selectedIds.size < 2) {
  showToast('정렬에는 2개 이상의 노드 선택이 필요합니다.', 'warn')
  return
}
```
→ `showToast` 는 page.tsx 의 신규 toast state. 현재 page.tsx 에는 toast 시스템이 _없음_ (확인: grep `setToast` no match, `role="alert"` 만 단발 사용 line 3923) — **신규 toast 시스템 추가 필요**. 패턴은 `command-palette.tsx:141-149` 의 fixed overlay 패턴 재사용 (`fixed bottom-6 right-6 z-50` — page.tsx:5060 fixed toast 영역과 동일).

---

### `apps/web/src/app/use-quick-add.ts` (CREATE — hook)

**Analog:** `page.tsx:2862-3010` (global keydown handler) — 내부에 quick-add 로직 직접 추가도 가능, _별도 hook 분리는 testability + page.tsx 비대화 방지_ 측면.

**1. hook 시그니처**:
```ts
export function useQuickAddShortcuts(args: {
  enabled: boolean  // !commandPaletteOpen && !shortcutHelpOpen && !briefDrawerOpen
  tree: Tree
  selectedNodeId: string
  onAddLeafChild: (parentId: string, type: LeafNodeType) => void
  onAddLeafSibling: (siblingId: string, type: LeafNodeType) => void
  onAddContainerChild: (parentId: string, type: ContainerNodeType) => void
  onAddContainerSibling: (siblingId: string, type: ContainerNodeType) => void
}): void { /* useEffect(() => addEventListener('keydown', …)) */ }
```

**2. 키 매핑 (UI-SPEC line 231-243)**:
```ts
const QUICK_ADD_KEYS: Record<string, TreeNode['type']> = {
  T: 'text', B: 'button', I: 'image',
  R: 'section', C: 'card', H: 'hero',
  L: 'list', F: 'form', A: 'accordion', M: 'modal',
}
const QUICK_ADD_SHIFT_KEYS: Record<string, TreeNode['type']> = {
  C: 'carousel',  // Shift+C
  T: 'tabs',      // Shift+T
}
```

**3. 가드 패턴** (`page.tsx:2855-2863`):
```ts
function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}
// 핸들러 안:
if (isEditableTarget(event.target)) return
if (event.metaKey || event.ctrlKey || event.altKey) return  // modifier 충돌 회피
```
→ Alt 누를 때는 정렬/분포 단축키와 충돌하므로 `!event.altKey` 가드 필수.

**4. 추가 위치 분기 (UI-SPEC line 247-250)**:
```ts
const node = findNodeById(tree.root, selectedNodeId)
const isContainer = node && CONTAINER_TYPES.has(node.type)
if (!node) {
  // root 에 추가
  onAddLeafChild(tree.root.id, type)
} else if (isContainer) {
  onAddLeafChild(node.id, type)
} else {
  onAddLeafSibling(node.id, type)  // root 가 부모면 무시되도록
}
```

---

## Shared Patterns

### 1. Tailwind chrome 토큰 사용

**Source:** `globals.css` 의 `--dw-*` 변수, 사용 예 `command-palette.tsx`, `selectable-node.tsx`

**Apply to:** 모든 신규 컴포넌트 (component-library-panel / spacing-overlay / box-select-overlay 등)

```tsx
// 좋은 예 (재사용)
className="bg-[var(--dw-ui-panel)] border border-[var(--dw-ui-border)] text-[var(--dw-ui-text-body)] rounded-[var(--dw-radius-md)]"

// accent (Phase 1 전용 element만)
className="border-[var(--dw-ui-accent)] bg-[var(--dw-ui-accent-soft)]"

// 금지 예 (직접 hex 박지 말 것 — 단, spacing overlay 핑크 가이드 #FF8FAB 만 예외)
```

### 2. 한국어 라벨 + aria-label 의무

**Source:** `selectable-node.tsx:107` `aria-label="선택 노드 툴바"`, `command-palette.tsx:145` `aria-label="명령 팔레트"`

**Apply to:** 모든 새 컴포넌트의 컨테이너 + icon-only 버튼

```tsx
<div role="region" aria-label="컴포넌트 라이브러리">
<button type="button" aria-label="컴포넌트 패널 토글">
<div role="status" aria-live="polite">  {/* 박스 선택 결과 알림 */}
```

### 3. useEffect cleanup 패턴

**Source:** `page.tsx:3081-3114`, `page.tsx:3011-3012`

**Apply to:** box-select-overlay (global mousemove/mouseup), spacing-overlay (관찰 정리), use-quick-add (keydown), node-context-menu boundary check (이미 line 5448-5456 적용됨)

```tsx
useEffect(() => {
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [/* deps */])
```

### 4. Tree 변경 → commitTreeEdit 통일

**Source:** `page.tsx:2677-2680, 2701, 2716, 2740`

**Apply to:** UX-03 변환 / UX-04 패턴 drop / UX-05 정렬·분포 / UX-06 quick-add 모두

```tsx
const nextTree = /* pure transform */
commitTreeEdit(nextTree, focusNodeId)
// history stack 자동 처리됨 (page.tsx 내부 useEffect)
```

### 5. lucide-react 아이콘 크기/stroke

**Source:** `command-palette.tsx:216`, `selectable-node.tsx:78`, UI-SPEC line 292-300

**Apply to:** 모든 새 아이콘 사용처

```tsx
<Icon aria-hidden="true" size={16} />  // 기본
<Icon aria-hidden="true" size={20} />  // 패널 토글 버튼
<Icon aria-hidden="true" size={12} />  // dropdown prefix / shortcut badge
// stroke-width는 lucide-react v1.14 기본값 사용 (1.75 권장 — 컴포넌트 panel 카드 한정)
```

### 6. data-dworks-node-id 외부 식별자

**Source:** `selectable-node.tsx:259`

**Apply to:** UX-02 spacing-overlay (DOM 측정), UX-05 box-select-overlay (intersect 검사)

```tsx
// 측정/검출 시
const nodes = document.querySelectorAll<HTMLElement>('[data-dworks-node-id]')
const targetEl = document.querySelector<HTMLElement>(`[data-dworks-node-id="${id}"]`)
```

### 7. Korean filename label convention

**Apply to:** 신규 파일 모두

- 한국어 주석 (project mandate)
- 파일 상단에 _용도 1-2줄 한국어 주석_ (참고: `selectable-node.tsx:1-3`, `command-palette.tsx:1-2`)
- 변수명/함수명은 영어, 사용자 노출 문자열만 한국어

---

## No Analog Found

해당 없음 — 모든 신규 파일이 기존 `apps/web/src/app/` 패턴에서 강하게 파생됨.

**주의 — Toast 시스템 부재:**
- page.tsx 현재 _Toast 시스템 없음_ (검색 결과 0건). UX-03/UX-05 모두 toast 필요.
- **신규 toast UI** 는 `command-palette.tsx` 의 modal Tailwind 패턴 + page.tsx:5060 의 `fixed bottom-6 right-6` 패턴을 조합해 _별도 컴포넌트_ (e.g. `toast-host.tsx`) 생성 권장 — _이 파일은 planner 가 추가 plan 으로 분리할지 결정_. 본 PATTERNS.md 에서는 시스템 부재만 명시.

---

## Metadata

**Analog search scope:**
- `apps/web/src/app/` — 모든 .tsx / .ts 파일
- `packages/tree/src/` — 노드 schema
- `packages/tree-editor/src/` — operations (변환 함수)
- `packages/components/src/` — 노드 렌더러 (간접 참조)

**Files scanned:**
- page.tsx (14,460 lines — Read targeted ranges only)
- selectable-node.tsx (340 lines — 전체)
- command-palette.tsx (249 lines — 전체)
- node-meta.ts (51 lines — 전체)
- canvas-contexts.ts (64 lines — 전체)
- tree-fixtures.ts (85 lines — 전체)
- inspector-atoms.tsx (334 lines — 초반 120 lines)
- packages/tree-editor/src/operations.ts (line 644-728 only)
- packages/tree-editor/src/index.ts (80 lines)

**Pattern extraction date:** 2026-05-11
