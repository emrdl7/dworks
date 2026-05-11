---
phase: 03-visual-aids
fixed_at: 2026-05-11T08:54:59Z
review_path: .planning/phases/03-visual-aids/03-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 5
status: all_fixed
---

# Phase 3: Code Review Fix Report

**Fixed at:** 2026-05-11T08:54:59Z
**Source review:** `.planning/phases/03-visual-aids/03-REVIEW.md`
**Iteration:** 1
**Mode:** `--auto` (Warnings only; Info skipped as cosmetic per orchestrator config)

**Summary:**
- Findings in scope: 4 (Warnings)
- Fixed: 4
- Skipped (out-of-scope Info): 5
- Verification: `pnpm --filter web typecheck` clean, `pnpm --filter web test` 376/376 pass.

## Fixed Issues

### WR-01: Minimap `handleBodyClick` / `handleBodyKeyDown` stale closure

**Files modified:** `apps/web/src/app/minimap.tsx`
**Commit:** `2563206`
**Applied fix:** 두 핸들러가 render 시점 캡처한 `scale` / `safeContent` 대신 호출 시점에 `wrapper.scrollWidth/Height` 로 직접 재계산하도록 변경. 빠른 연속 클릭 시 batched `setViewport` 와 DOM scroll 간 한 frame race 제거. 또한 `measureViewport()` 직접 호출을 제거 — scroll listener 의 rAF 가 어차피 잡으므로 중복 측정 불필요.

### WR-02: scroll/resize listener `useEffect` wrapper re-mount 미감지

**Files modified:** `apps/web/src/app/minimap.tsx`
**Commit:** `160cf5f`
**Applied fix:** scroll/resize `useEffect` 의 deps 에 `treeRevision` 추가. `canvasScrollRef` 객체 identity 는 안 바뀌므로 단독으로는 wrapper conditional remount 감지가 불가능 — tree 변경과 wrapper remount 가 통상 동시에 발생하는 점을 이용해 listener 가 새 element 에 재부착되도록 보장. (prop drilling 방식은 page.tsx 의 wrapper ownership 을 크게 흔드므로 채택 안 함.)

### WR-03: `measureNodes` scroll/reflow 시 미재호출 → outline stale

**Files modified:** `apps/web/src/app/minimap.tsx`
**Commit:** `bc7eb13`
**Applied fix:** `wrapper` 에 `ResizeObserver` 1개 부착하는 새 `useEffect` 추가. observer callback 은 `requestAnimationFrame` 으로 디바운스해 burst 변화를 한 frame 으로 합친다. tree identity 가 안 바뀌는 in-place mutation(lazy mount, 자식 reflow, 컨테이너 크기 변동)에서 outline 이 stale 한 채 남던 문제 해결. cleanup 에서 `ro.disconnect()` + pending rAF cancel.

### WR-04: `treeRevision` 카운터 의미 약화 — JSDoc 보강

**Files modified:** `apps/web/src/app/page.tsx`
**Commit:** `bb62f56`
**Applied fix:** `treeRevision` 선언 위 한 줄 주석을 JSDoc 블록으로 확장. 명시한 항목:
- **목적**: `tree` 를 Minimap 에 직접 prop 으로 넘기지 않는 이유 (Minimap 측정이 DOM 기반이라 tree 구조 detail 불필요 + tree shape 결합 회피).
- **사용 패턴**: `useEffect` deps 에 들어가 mutation 시 effect 재실행을 강제하는 force-remount-effect-deps 용도. `useRef` 카운터는 re-render 가 안 일어나므로 `useState` 필요.
- **Overflow**: safe-integer 2^53 ≈ 9e15 — 초당 100 mutation 기준 ~28만년, 실용상 무시 가능.

## Skipped Issues (Out-of-scope — Info findings, `--auto` mode)

다음 5건은 `--auto` 모드 정책상 Info 등급 cosmetic / 향후 deferred 사항으로 분류되어 본 iteration 에서는 건드리지 않는다. 차후 `--full` 모드 또는 Phase 4 진입 전 일괄 처리 권장.

### IN-01: GridOverlay column 박스 inline style 매 render 재생성

**File:** `apps/web/src/app/grid-overlay.tsx:48-87`
**Reason:** skipped (out-of-scope: Info, cosmetic — v3.0 deferred)
**Original issue:** 23개 inline style 객체/render — React 19 + Tailwind v4 에서 negligible. column count 확장 시 `useMemo` + CSS variable 권장.

### IN-02: `computeColumnEdges` Set 부동소수점 정밀도 의존

**File:** `apps/web/src/app/grid-overlay.tsx:101-107`
**Reason:** skipped (out-of-scope: Info, cosmetic — 회귀 방지용 정규화)
**Original issue:** non-integer gutter / container width 에서 edge 중복 제거 실패 가능. `Math.round(x * 1000) / 1000` 정규화 권장.

### IN-03: `snapToColumnEdge` `bestEdge = 0` 초기값 의미적 혼란

**File:** `apps/web/src/app/grid-overlay.tsx:120-128`
**Reason:** skipped (out-of-scope: Info, cosmetic — readability)
**Original issue:** `bestEdge = edges[0]` 초기화가 더 명확. 동작 동일.

### IN-04: `snapGuideX` setter 미사용 — eslint-disable

**File:** `apps/web/src/app/page.tsx:797-801`
**Reason:** skipped (out-of-scope: Info, cosmetic — Phase 4 통합 전 marker 보강)
**Original issue:** `TODO(VIS-01-D04)` grep-able marker 추가 권장. Phase 4 진입 시 즉시 처리 예정.

### IN-05: Command palette `시각 보조` group 순서 검증

**File:** `apps/web/src/app/command-palette.tsx:356-362`, `apps/web/src/app/page.tsx:3789-3808`
**Reason:** skipped (out-of-scope: Info, informational — 별도 fix 불필요)
**Original issue:** 현재 도움말 그룹 직전에 모여 있어 OK. Phase 4 신규 항목 추가 시 의식적 review 필요.

---

## Verification Summary

| Check | Result |
|-------|--------|
| `pnpm --filter web typecheck` | pass (0 errors) |
| `pnpm --filter web test` | pass (376/376, 0 fail) |
| Per-fix Tier-1 read-back | pass (4/4 — diff confirmed) |
| Per-fix Tier-2 syntax check | pass (4/4 — `tsc --noEmit` scoped to touched files) |

## Commit Log (this iteration)

| Finding | Commit | Files |
|---------|--------|-------|
| WR-01 | `2563206` | `apps/web/src/app/minimap.tsx` |
| WR-02 | `160cf5f` | `apps/web/src/app/minimap.tsx` |
| WR-03 | `bc7eb13` | `apps/web/src/app/minimap.tsx` |
| WR-04 | `bb62f56` | `apps/web/src/app/page.tsx` |

---

_Fixed: 2026-05-11T08:54:59Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
