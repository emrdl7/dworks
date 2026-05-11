---
phase: 01-ux-fix
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - apps/web/src/app/toast-context.ts
  - apps/web/src/app/toast-host.tsx
  - apps/web/src/app/spacing-overlay.tsx
  - apps/web/src/app/node-type-convert.ts
  - apps/web/src/app/use-quick-add.ts
  - apps/web/src/app/component-library-panel.tsx
  - apps/web/src/app/box-select-overlay.tsx
  - apps/web/src/app/use-align-distribute.ts
  - apps/web/src/app/node-meta.ts
  - apps/web/src/app/tree-fixtures.ts
  - apps/web/src/app/inspector-atoms.tsx
  - apps/web/src/app/command-palette.tsx
  - apps/web/src/app/page.tsx
  - seeds/trees/pricing-tier.json
  - seeds/trees/products-carousel.json
  - seeds/trees/faq-accordion.json
findings:
  critical: 0
  high: 2
  medium: 5
  low: 6
  nit: 4
  total: 17
status: findings_found
---

# Phase 1 UX Fix — Code Review Report

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 16
**Status:** findings_found

## Summary

Phase 1 adds 8 new client modules and a substantial wiring patch to `page.tsx` for UX-01..06 (toast system, spacing overlay, node type conversion, quick-add shortcuts, component library, box select, align/distribute). Overall code quality is high — Korean comments are consistent, types are tight, hooks have correct cleanup, and accessibility is taken seriously (aria-live, aria-label, role/option semantics, focus return on ESC).

No critical security issues — pure UI/canvas surface with no user-supplied HTML rendering, no auth/API/DB. The reviewed `JSON.parse` of `dataTransfer.getData('application/x-dworks-node')` is sandboxed by a custom MIME type and validated downstream.

Two HIGH findings stand out: (1) a stale-closure / dependency hazard in `useAlignDistribute` where `selectedIds` is `ReadonlySet<string>` referenced inside an `onAnnounce` re-uses the box-select aria-live region — but actually the more impactful issue is that `allSelectedNodeIds` always contains `selectedNodeId` (which may be `tree.root.id`), so `useAlignDistribute` will operate on a 2-element set that includes root, then silently skip it; and (2) the global `keydown` Alt-tracking listener can desync with the `useAlignDistribute` and `useQuickAdd` hooks when the user holds Alt + presses a quick-add key while focused on a button (Alt+B = aria-label hint, etc.) — guards exist but the modifier-bypass `if (event.metaKey || event.ctrlKey || event.altKey) return` in `use-quick-add.ts` already mitigates this. Five MEDIUM findings concern stale closures, missing cleanups, type narrowing, and accessibility detail.

---

## High

### HR-01: `useAlignDistribute` receives `allSelectedNodeIds` that always contains root id — 2-node alignment silently skipped

**File:** `apps/web/src/app/page.tsx:629-632, 2998` and `apps/web/src/app/use-align-distribute.ts:70-71`

**Issue:**
```ts
// page.tsx
const allSelectedNodeIds = useMemo(
  () => new Set<string>([selectedNodeId, ...additionalSelectedNodeIds]),
  [selectedNodeId, additionalSelectedNodeIds],
)
```
`selectedNodeId` defaults to `findFirstEditableNodeId(...) ?? tree.root.id` and can be the root id after init or after Esc. Then `useAlignDistribute` does:
```ts
ids.forEach((id) => {
  if (id === tree.root.id) return // root 는 정렬 대상 아님
  ...
})
```
So if the user has _exactly one_ non-root node selected plus root id in the set, `selectedIds.size === 2` passes the `< 2` guard at line 172 of `use-align-distribute.ts`, but only 1 child group member remains after the root filter. The group then has `rects.length < 2` and `return`s silently — no toast, no feedback. The user sees nothing happen. Worse, if `selectedNodeId` is `tree.root.id` and there are no additional selections, `selectedIds.size === 1` and the warn "정렬에는 2개 이상의 노드 선택이 필요합니다." fires — slightly misleading because the user may believe they selected something (root highlight).

**Fix:**
In `use-align-distribute.ts`, filter root **before** the size guard:
```ts
const effectiveIds = new Set<string>()
selectedIds.forEach((id) => { if (id !== tree.root.id) effectiveIds.add(id) })
if (effectiveIds.size < 2) {
  onWarn(WARN_NEED_2_NODES)
  return
}
const groups = groupByParent(tree, effectiveIds)
```
Same treatment for the `performDistribute` < 3 check. Mirror the change in `useQuickAdd` if needed (currently quick-add explicitly handles `selectedNode.id === rootId` so it's fine).

---

### HR-02: `additionalSelectedNodeIds` reset useEffect races with box-select `queueMicrotask` — selection may be lost

**File:** `apps/web/src/app/page.tsx:626-628, 3418-3424`

**Issue:**
```ts
// reset on every selectedNodeId change
useEffect(() => {
  setAdditionalSelectedNodeIds(new Set())
}, [selectedNodeId])

// box-select mouseup
setSelectedNodeId(first)
queueMicrotask(() => {
  setAdditionalSelectedNodeIds(new Set(rest))
})
```
The order React applies state updates is: `setSelectedNodeId` schedules a re-render. The `useEffect` reset runs **after commit**, not before microtasks resolve. `queueMicrotask` runs before paint/commit (microtask queue drains before tasks). The intended ordering (set primary → reset effect fires → set additionals via microtask after the reset) is fragile: React 19's concurrent rendering and batching may flush the useEffect before or after the microtask depending on whether the event handler completes within the same task. In practice it appears to work, but this is order-of-execution-dependent.

The comment says "selectedNodeId 변경 시 additionalSelectedNodeIds 가 reset 되는 useEffect 가 있으므로 next microtask 로 additional 적용 — 순서 보장" — but microtask order does **not** guarantee it runs after the React commit phase. Under React 19 automatic batching, both `setSelectedNodeId` and the `queueMicrotask` callback's `setAdditionalSelectedNodeIds` may be batched together, then the post-commit effect fires once and wipes additionals.

**Fix:** Use a single coordinated update. Either:
- (Preferred) Replace the reset-effect with a manual reset at every explicit single-selection site, and call `setSelectedNodeId(first)` + `setAdditionalSelectedNodeIds(new Set(rest))` together in the same handler.
- Or use `flushSync` around `setSelectedNodeId(first)` then immediately call `setAdditionalSelectedNodeIds(new Set(rest))` — but `flushSync` in a mouseup is heavy.
- Or short-circuit the reset effect when a "batch select in progress" ref flag is set:
```ts
const batchSelectionRef = useRef(false)
useEffect(() => {
  if (batchSelectionRef.current) { batchSelectionRef.current = false; return }
  setAdditionalSelectedNodeIds(new Set())
}, [selectedNodeId])

// in mouseup:
batchSelectionRef.current = true
setSelectedNodeId(first)
setAdditionalSelectedNodeIds(new Set(rest))
```

This bug will manifest as the user Shift-dragging a box around 5 nodes, seeing the "5개 노드 선택" announcement, but the inspector shows only the first node (additionals wiped). The aria-live announcement count would then mislead.

---

## Medium

### MR-01: `boxSelect` mouseup uses snapshot of `tree.root.id` from useEffect deps — stale tree.root after fixture swap

**File:** `apps/web/src/app/page.tsx:3414, 3441`

**Issue:** The box-select effect depends on `[boxSelect.active, boxSelect.startX, boxSelect.startY, canvasZoom, tree.root.id]`. If the user starts a drag, then `setSelectedFixtureId` swaps the tree (different `tree.root.id`) mid-drag, `onUp` retains the **old** `tree.root.id` in `new Set([tree.root.id])` until the effect re-binds. Likelihood very low (fixture swap mid-drag), but `tree` itself is not in deps, only `tree.root.id`. If any tree mutation changes `root.id` (it doesn't normally), the listeners would reference the previous tree's root. Defensive: also depend on `tree`.

**Fix:** Use a `treeRef` updated each render and read it in `onUp`, or include `tree` in deps (will re-bind every commit — acceptable since active is rarely true).

---

### MR-02: Spacing overlay `useEffect` references DOM via `document.querySelector` synchronously after state changes — measurement may run before DOM update

**File:** `apps/web/src/app/spacing-overlay.tsx:249-296`

**Issue:** The effect runs after commit, then queries `[data-dworks-node-id="${selectedNodeId}"]`. If `selectedNodeId` changes simultaneously with a tree commit that adds/removes the matching DOM node (e.g., quick-add T while hovering a recently-deleted region), `selEl` or `hovEl` could be `null` and overlay clears — this is handled with `setOverlay(null)`. Fine for happy path. However, the `selectedNodeId` query does NOT escape the id — if any node id contained CSS selector special characters (`"`, `\`, `]`), the selector would throw. `use-align-distribute.ts:98` uses `CSS.escape(nodeId)` correctly; `spacing-overlay.tsx:261, 264` does not.

**Fix:**
```ts
const selEl = document.querySelector<HTMLElement>(
  `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
)
const hovEl = document.querySelector<HTMLElement>(
  `[data-dworks-node-id="${CSS.escape(hoveredNodeId)}"]`,
)
```
Currently node ids look like `pasted-1.simple-hero.title` (dots are fine in attribute selectors with quotes) but fixture imports user-controlled names later could break — defense-in-depth recommended.

---

### MR-03: `useAlignDistribute` `performAlign` mutates `nextTree` in closure but `tree` is the live React state — within-batch concurrent calls would race

**File:** `apps/web/src/app/use-align-distribute.ts:179-241`

**Issue:** `let nextTree = tree` then iteratively calls `setNodeInsetPatch(nextTree, ...)`. If the user mashes `Alt+A` twice within one tick (preventDefault on keydown), each call sees the **previous render's** `tree`, not the chained commit. `onCommit` calls `commitTreeEdit` which calls `setTree` — but the second `Alt+A` runs `performAlign` with the same closure `tree` reference (still the snapshot from when `useCallback` was memoized). Second run repeats the same alignment, no-op visually but pushes a duplicate history entry. Minor.

**Fix:** Either accept the no-op as benign, or read tree via a ref:
```ts
const treeRef = useRef(tree)
useEffect(() => { treeRef.current = tree }, [tree])
// inside performAlign:
let nextTree = treeRef.current
```

Same pattern in `performDistribute`.

---

### MR-04: `NodeTypeConvertDropdown` `KeyboardEvent` import conflicts with global `KeyboardEvent` type — `event.key` typed as DOM `KeyboardEvent`

**File:** `apps/web/src/app/inspector-atoms.tsx:78`

**Issue:**
```ts
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') { ... }
}
document.addEventListener('keydown', onKey)
```
`KeyboardEvent` here is the **DOM** `KeyboardEvent` (TypeScript lib.dom.d.ts), not the React synthetic one. That's correct since `document.addEventListener` dispatches DOM events. Currently `KeyboardEvent` is not imported from `react` in this file — checking the import at line 13: `import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'`. Good, no shadowing. But `command-palette.tsx:7` imports `type KeyboardEvent` from `react` — that file uses the React KeyboardEvent, so no conflict. Fine. Downgrading to LOW.

Actually leaving this as MEDIUM because: the `onKey` listener registers on `document`, but the `ESC` listener in the dropdown will fire for **every keydown anywhere in the document** while `open === true`. Esc inside ⌘K palette or other modals also triggers this — which is harmless (sets dropdown closed) but the listener is unnecessarily global. If multiple `NodeTypeConvertDropdown` instances were mounted (they aren't), each would register a listener.

**Fix:** Lower-priority. Could attach to the dropdown root via `onKeyDown` instead of `document` — keeps focus management scoped. Currently fine.

---

### MR-05: `componentPanelOpen` `[` shortcut has no INPUT/TEXTAREA guard at registration site

**File:** `apps/web/src/app/page.tsx:3160-3164`

**Issue:** The `[` toggle in the global keydown handler:
```ts
if (event.key === '[' && !meta && !event.altKey && !event.shiftKey) {
  event.preventDefault()
  setComponentPanelOpen((v) => !v)
  return
}
```
This sits inside the existing global handler (in the same `useEffect` as ⌘K, etc.). The outer handler already starts with `if (isEditableTarget(event.target)) return` (line ~2750-ish in page.tsx based on the diff context). Verified — yes, the wrapping `useEffect` checks `isEditableTarget` early. So typing `[` in a text input won't toggle the panel. Marking as informational confirm-pass.

Actually checking the diff more carefully (line 3160), the `[` handler is at the **end** of the keydown handler, after all other branches. The early-out `isEditableTarget` check is at the top. Good.

Downgrade: not an issue. Removing from MEDIUM.

Replacement MR-05:

### MR-05 (replaced): `convertNodeType` deep recursion can stack-overflow on pathological trees + no cycle detection

**File:** `apps/web/src/app/node-type-convert.ts:83-123`

**Issue:** `findNode` and `replaceNode` are recursive without depth limit. Trees are produced by Zod-validated fixtures so cycles aren't possible (tree schema is DAG), but `appendFixtureToTarget` in page.tsx clones fixture nodes and there's no cycle guard. With deeply nested user-built trees (e.g., 1000-deep nested sections via repeated insert), this would overflow. Realistic depth in this app is ~10-20 levels — fine in practice. NOTE only.

**Fix:** None required at this scale. If trees ever grow beyond ~5000 deep, convert to iterative DFS with explicit stack.

---

## Low

### LR-01: `useQuickAdd` falls through silently for `accordion`/`modal` when leaf parent is selected

**File:** `apps/web/src/app/use-quick-add.ts:148-154`

**Issue:** Pressing `A` (accordion) or `M` (modal) when a leaf is selected: `isLeaf` is false (these aren't in LEAF_TYPES), and `EDITABLE_CONTAINER_TYPES.has(...)` is false (these aren't editable containers). The user gets no feedback — no toast, no console hint. The comment at top acknowledges this ("tree-editor 에 add 연산이 없어 현재는 no-op"), but UI-SPEC line 231-243 advertises these keys.

**Fix:** Either fire a `showToast('아코디언/모달 추가는 패턴 카드를 사용하세요', 'warn')` from page.tsx wiring, or remove these keys from `QUICK_ADD_KEYS` until tree-editor supports them. The cheatsheet at `command-palette.tsx:51-56` already lists them as available — user expectation mismatch.

---

### LR-02: Toast dedupe `lastToastRef.current` not reset when the deduped toast is manually dismissed

**File:** `apps/web/src/app/toast-context.ts:66-100`

**Issue:** If user clicks the X to dismiss a toast within the 500ms dedupe window, `lastToastRef.current` still points at it with the old `id`. Next `showToast` within window reuses that id via `existingTimer = timersRef.current.get(last.id)` (returns undefined since dismiss deleted it) → falls through to scheduling `setTimeout(() => dismissToast(last.id), durationMs)` for a toast that's gone. The setTimeout calls dismissToast on an absent id (no-op via `prev.filter`), but `timersRef.current.set(last.id, refreshed)` re-introduces an entry that won't be cleaned up on real next-toast unless dismissed. Tiny memory leak (1 entry per dismissed-then-re-fired duplicate).

**Fix:** In `dismissToast`, also clear `lastToastRef` if `last.id === id`:
```ts
const dismissToast = useCallback((id: string) => {
  setToasts((prev) => prev.filter((t) => t.id !== id))
  const timer = timersRef.current.get(id)
  if (timer) {
    clearTimeout(timer)
    timersRef.current.delete(id)
  }
  if (lastToastRef.current?.id === id) lastToastRef.current = null
}, [])
```

---

### LR-03: `aria-atomic="true"` on `boxSelectAnnouncement` polite region but message is _replaced_, not _appended_

**File:** `apps/web/src/app/page.tsx:5468-5474` (post-modal markup)

**Issue:** The sr-only region:
```jsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {boxSelectAnnouncement}
</div>
```
Since this region is reused for BOTH box-select results AND align/distribute action names (`useAlignDistribute` passes `onAnnounce: setBoxSelectAnnouncement`), rapid successive actions (e.g., Alt+A then Alt+H within 100ms) may replace the message before screen readers finish announcing the first one. `aria-atomic="true"` is correct for "read the whole region as one update" but screen readers typically debounce. Also the variable name `boxSelectAnnouncement` is misleading after the reuse.

**Fix:**
- Rename state to `liveAnnouncement` or `politeAnnouncement` for clarity.
- Optional: append-only with timestamp suffix to force SR re-reading, or split into separate `<div>`s for selection vs action.

---

### LR-04: `ComponentLibraryPanel` cards use `role="button"` with `tabIndex={0}` but no `aria-disabled` state for unsupported types

**File:** `apps/web/src/app/component-library-panel.tsx:225-237`

**Issue:** Basic cards for `carousel`/`tabs`/`accordion`/`modal` are draggable + Enter/Space activatable, but `handleAddFromLibrary` (page.tsx:148) shows a warn toast: "carousel 노드는 패턴 카드에서 추가하세요". From a screen reader's standpoint, this is invisible — no `aria-disabled`, no contextual hint. WCAG 4.1.2 (Name, Role, Value) prefers state communicated to AT.

**Fix:** Mark those 4 types with `aria-disabled="true"` and adjust the label: `aria-label={`${label} (패턴 카드 또는 ⌘K 사용)`}`. Or filter them out from the basic grid entirely.

---

### LR-05: `JSON.parse` of `dataTransfer` payload trusted shape after try/catch — `payload.type` not validated against `TreeNode['type']`

**File:** `apps/web/src/app/page.tsx:531-538` (onDrop diff)

**Issue:**
```ts
let payload: ComponentLibraryDragPayload
try {
  payload = JSON.parse(raw) as ComponentLibraryDragPayload
} catch { ... }
handleAddFromLibrary(payload, target)
```
The MIME `application/x-dworks-node` is a soft custom string; another tab/extension could write something to `dataTransfer` if they happen to use the same MIME (very unlikely cross-origin). `payload.type` is cast but never validated to be one of the 12 node types. `handleAddFromLibrary` then does `nodeTypeLabels[t]` with an arbitrary string → `undefined` label leaks in the toast.

**Fix:** Validate `payload.type` against `nodeTypeLabels`:
```ts
if (payload.type && !(payload.type in nodeTypeLabels)) {
  showToast('알 수 없는 노드 타입입니다', 'error')
  return
}
```
Low priority — same-origin drag only in practice.

---

### LR-06: `useAlignDistribute` `groupByParent` returns map keyed by `TreeNode` reference — keys may change identity each commit

**File:** `apps/web/src/app/use-align-distribute.ts:65-81`

**Issue:** `groups.forEach((children, parent) => ...)` uses the parent node object as the Map key. The parent is the result of `findParent(tree.root, id)` which returns a reference from the **current** `tree.root`. Each commit produces a new tree (immutable), so within a single `performAlign` call the references are consistent. Fine. NIT — could just key by `parent.id` for clarity.

---

## NIT

### NR-01: `node-type-convert.ts` `extractBaseProps` enumerates 17 optional fields manually — drift risk vs `BaseNodeMeta` schema

**File:** `apps/web/src/app/node-type-convert.ts:50-81`

**Issue:** Every time `BaseNodeMeta` adds a field, this function must be updated, otherwise the field is silently dropped on type conversion. There's no compile-time guarantee.

**Fix:** Use a key list derived from the schema, or `{...node, type: nextType, ...overrides}` spread + delete type-specific fields. The current explicit list is safest but document the drift risk in a comment.

---

### NR-02: `spacing-overlay.tsx` `LABEL_FONT_FAMILY` is a JS constant string; could be a CSS custom property

**File:** `apps/web/src/app/spacing-overlay.tsx:27-28`

**Issue:** Other fonts in this codebase use `--dw-font-*` tokens via Tailwind. Hardcoding a monospace stack here means it won't track design-token changes.

**Fix:** Add `--dw-font-mono` to globals.css and reference via `fontFamily: 'var(--dw-font-mono)'`. Optional.

---

### NR-03: `use-quick-add.ts` `QUICK_ADD_KEYS` uses `Record<string, TreeNode['type']>` — typo-prone

**File:** `apps/web/src/app/use-quick-add.ts:17-28`

**Issue:** Object key type is `string`. Typo like `q: 'text'` would compile. Restrict to a literal union:
```ts
type QuickKey = 't' | 'b' | 'i' | 'r' | 'c' | 'h' | 'l' | 'f' | 'a' | 'm'
const QUICK_ADD_KEYS: Readonly<Record<QuickKey, TreeNode['type']>> = { ... }
```

---

### NR-04: Box-select min-size threshold mismatch — overlay uses 2px, mouseup commits use 4px

**File:** `apps/web/src/app/box-select-overlay.tsx:56` vs `apps/web/src/app/page.tsx:3406-3408`

**Issue:** `BoxSelectOverlay` hides itself when `width < 2 && height < 2`, but `onUp` early-returns when `boxRect.right - boxRect.left < 4 && bottom - top < 4`. Means dragging 3×3 px shows a rectangle briefly but commits no selection — minor UX inconsistency. Align to a shared constant.

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
