---
phase: 01-ux-fix
fixed_at: 2026-05-11T00:00:00Z
review_path: .planning/phases/01-ux-fix/01-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 8
skipped: 1
status: partial
---

# Phase 1 UX Fix — Code Review Fix Report

**Fixed at:** 2026-05-11
**Source review:** `.planning/phases/01-ux-fix/01-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (HIGH + MEDIUM + safe LOW): 9
- Fixed: 8
- Skipped: 1 (MR-05 — explicitly NIT-level per review)

**Verification:**
- `apps/web` `tsc --noEmit` : clean (0 errors)
- `apps/web` `eslint .` : 2 pre-existing warnings unrelated to fixes (unused vars `onChangeContainerType`/`onChangeLeafType` in page.tsx)
- `apps/web` `npm test` : 343/343 pass

## Fixed Issues

### HR-01: `useAlignDistribute` — filter root id BEFORE size guard

**Files modified:** `apps/web/src/app/use-align-distribute.ts`
**Commit:** `7d91c7b`
**Applied fix:**
- Both `performAlign` and `performDistribute` now build `effectiveIds = selectedIds \ {tree.root.id}` _before_ the `< 2` / `< 3` size guard.
- Root id can no longer pass the guard and then silently filter out inside `groupByParent` (which used to produce no-feedback no-ops).
- Warn toast now fires correctly when only root + one node was selected.

### HR-02: Box-select mouseup race — synchronous batch instead of `queueMicrotask`

**Files modified:** `apps/web/src/app/page.tsx`
**Commit:** `d28e1a5`
**Applied fix:**
- Introduced `batchSelectionRef` ref. The `selectedNodeId` reset `useEffect` checks it and skips reset once when batch-selection is in flight.
- Box-select mouseup sets `batchSelectionRef.current = true`, then calls `setSelectedNodeId(first)` + `setAdditionalSelectedNodeIds(new Set(rest))` synchronously in the same handler (React 19 will batch into a single commit).
- Removed `queueMicrotask` indirection — no longer depends on microtask vs commit ordering.

### MR-01: Box-select effect deps — `tree` instead of `tree.root.id`

**Files modified:** `apps/web/src/app/page.tsx`
**Commit:** `d28e1a5` (atomic with HR-02 since same file + related)
**Applied fix:**
- Changed `useEffect` deps `[..., tree.root.id]` → `[..., tree]`. Fixture swap mid-drag will now re-bind the listeners with the fresh `tree.root.id`.
- Cost is minimal since `boxSelect.active` is rarely `true`.

### MR-02: `spacing-overlay.tsx` — wrap querySelector ids in `CSS.escape()`

**Files modified:** `apps/web/src/app/spacing-overlay.tsx`
**Commit:** `27ddf30`
**Applied fix:**
- Lines 261 and 264: `[data-dworks-node-id="${selectedNodeId}"]` → `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]` (same for `hoveredNodeId`).
- Defense-in-depth: aligns with `use-align-distribute.ts:98` which already escapes.

### MR-03: `useAlignDistribute` — `treeRef` to avoid stale closure

**Files modified:** `apps/web/src/app/use-align-distribute.ts`
**Commits:** `7d91c7b` (initial), `831f9fb` (deps cleanup)
**Applied fix:**
- Added `treeRef = useRef(tree)` synced via `useEffect`.
- Both `performAlign` and `performDistribute` now read `liveTree = treeRef.current` at the top, so chained alt+key calls within one tick see the latest commit.
- Removed `tree` from useCallback deps (ESLint react-hooks/exhaustive-deps cleared).

### MR-04: `NodeTypeConvertDropdown` — ESC scoped to dropdown root

**Files modified:** `apps/web/src/app/inspector-atoms.tsx`
**Commit:** `963f3a7`
**Applied fix:**
- Replaced `document.addEventListener('keydown', ...)` with `onKeyDown={handleRootKeyDown}` on the dropdown root `<div>`.
- ESC handler now only fires for keystrokes that bubble through this component subtree → cannot react to ESC inside other modals / palettes.
- Added `event.stopPropagation()` so the ESC doesn't propagate further (e.g., to global ESC handlers in `page.tsx`).
- Imported `KeyboardEvent as ReactKeyboardEvent` from react for explicit typing under React 19 automatic JSX runtime.

### LR-02: `dismissToast` clears `lastToastRef`

**Files modified:** `apps/web/src/app/toast-context.ts`
**Commit:** `5ccc0c5`
**Applied fix:**
- `dismissToast` now nulls `lastToastRef.current` when its `id` matches the dismissed toast.
- Prevents the dedupe path from re-scheduling `setTimeout` against an already-dismissed id (which leaked entries into `timersRef`).

### LR-04: `ComponentLibraryPanel` — aria-disabled for unsupported Basic types

**Files modified:** `apps/web/src/app/component-library-panel.tsx`
**Commit:** `70bfc3b`
**Applied fix:**
- Added `BASIC_UNSUPPORTED_TYPES = new Set(['carousel', 'tabs', 'accordion', 'modal'])`.
- `ComponentCard` now accepts `ariaDisabled` and `ariaLabelOverride` props.
- For the 4 types, the basic card renders `aria-disabled="true"` and an aria-label like `"캐러셀 카드 (패턴 카드 또는 ⌘K 사용)"` so SRs convey both the unsupported state and the workaround.
- Drag/click handlers are intentionally kept active — they still fire the existing warn toast, which is the visual feedback for sighted users.

### LR-05: `handleAddFromLibrary` — validate `payload.type` against `nodeTypeLabels`

**Files modified:** `apps/web/src/app/page.tsx`
**Commit:** `5727f07`
**Applied fix:**
- In `handleAddFromLibrary`, added `if (!(t in nodeTypeLabels)) { showToast('알 수 없는 노드 타입입니다', 'error'); return }` before the leaf/container branching.
- Covers both onDrop and onAddByKeyboard paths since both route through this function.
- Prevents `nodeTypeLabels[t]` from leaking `undefined` into the warn toast.

## Skipped Issues

### MR-05: `node-type-convert.ts` depth-limit on `findNode`/`replaceNode`

**File:** `apps/web/src/app/node-type-convert.ts:83-123`
**Reason:** Fix scope itself marks this as "NIT-level, optional". The REVIEW.md body for MR-05 also states "None required at this scale. If trees ever grow beyond ~5000 deep, convert to iterative DFS with explicit stack." Realistic trees are 10-20 levels — no defensive guard added.
**Original issue:** Recursive findNode/replaceNode could theoretically stack-overflow on pathological (1000+ deep) trees. No cycles possible (Zod-validated DAG schema).

## Out-of-Scope (not attempted, per fix instructions)

- **LR-01** — Intentional design; documented as known tree-editor limitation in SUMMARY.
- **LR-03** — Cosmetic rename suggestion.
- **LR-06** — Map key style, no behavior impact.
- **NIT-01 .. NR-04** — Style / future-proofing.

---

_Fixed: 2026-05-11_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
