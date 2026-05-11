---
phase: 03-visual-aids
plan: 03
subsystem: web/canvas/visual-aids
tags: [minimap, navigate, viewport-rect, fixed-panel, localStorage, command-palette, wcag-aa]
requires: [tree, canvasScrollRef, canvasZoom, selectedViewportPreset, dw:uiPrefs:v1, data-dworks-node-id]
provides: [좌하단 fixed 미니맵, viewport rect 실시간 추종, 클릭 navigate, Shift+M 토글]
affects: [apps/web/src/app/minimap.tsx, apps/web/src/app/page.tsx, apps/web/src/app/command-palette.tsx]
tech-stack:
  added: []
  patterns: [rAF throttle, useState trigger 카운터, MapIcon alias, fixed panel z-60]
key-files:
  created:
    - apps/web/src/app/minimap.tsx
  modified:
    - apps/web/src/app/page.tsx
    - apps/web/src/app/command-palette.tsx
decisions:
  - D-08 좌하단 fixed bottom-4 left-4 z-60
  - D-09 200×60-120px aspect-ratio, 노드 outlined rectangle only (mini-render 없음)
  - D-10 viewport rect 보라색 반투명 (α=0.18 + border α=0.6)
  - D-11 클릭 navigate — zoom 변경 없음, scrollLeft/Top 직접 설정
  - D-12 Shift+M 토글 (M 단독은 modal quick-add 충돌 회피)
metrics:
  duration: ~25min
  tasks-completed: 3
  files-changed: 3
  lines-added: ~380
  commits: 3
completed: 2026-05-11
requirements: [VIS-03]
---

# Phase 3 Plan 3: VIS-03 미니맵 (좌하단 navigate 패널) Summary

좌하단 fixed 200×~60-120px 미니맵 패널 — 모든 노드 outlined rectangle + 실시간 viewport rect 추종 + 클릭 navigate + Shift+M 단축키 + ⌘K 커맨드 팔레트 + localStorage 영속화. 큰 트리/긴 페이지 편집 시 _현재 위치 인지_ + _빠른 navigate_ 표준 달성.

## Tasks Executed

| Task | Description | Files | Commit |
|------|-------------|-------|--------|
| 1 | minimap.tsx 신규 — 노드 박스 + viewport rect + 클릭 navigate | apps/web/src/app/minimap.tsx | b945001 |
| 2 | page.tsx 통합 — state + Shift+M + toolbar + Minimap mount + uiPrefs + commandItems | apps/web/src/app/page.tsx | 6d4780e |
| 3 | command-palette SHORTCUT_GROUPS '시각 보조' 에 미니맵 행 추가 | apps/web/src/app/command-palette.tsx | 6c030cf |

## Implementation Details

### minimap.tsx (311 lines)

**Props 시그니처:**
```typescript
interface MinimapProps {
  open: boolean
  canvasScrollRef: RefObject<HTMLElement | null>
  canvasZoom: number
  containerWidth: number       // selectedViewportPreset.width
  treeRevision: number | string  // tree 변경 trigger
  onClose: () => void
}
```

**핵심 패턴:**
- **노드 박스 수집** — `document.querySelectorAll('[data-dworks-node-id]')` → 각 element 의 `getBoundingClientRect()` 를 wrapper 기준 logical 좌표로 변환 (`(r.left - wrapperRect.left + scrollLeft) / canvasZoom`).
- **콘텐츠 사이즈** — `wrapper.scrollWidth/Height / zoom`, `containerWidth` floor 보장.
- **viewport rect** — `wrapper.scrollLeft/Top / canvasZoom` + `wrapper.clientWidth/Height / canvasZoom`.
- **클릭 navigate** — 미니맵 px → logical px (`/scale`) → DOM scroll (`*zoom`, viewport 중앙 정렬, `Math.max(0, …)` clamp).
- **키보드 활성화** — Enter/Space → 콘텐츠 중앙 navigate (WCAG 2.1 키보드 접근성).

### rAF Throttle Site

```typescript
function onScrollOrResize(): void {
  if (rafRef.current !== null) return
  rafRef.current = window.requestAnimationFrame(() => {
    rafRef.current = null
    measureViewport()
  })
}
```
- `wrapper.scroll` + `window.resize` 양쪽 throttle.
- 노드 박스는 재측정 안 함 — viewport rect 만 갱신 (T-03-03-01/02 mitigate).

### treeRevision Trigger 패턴

```typescript
// page.tsx
const [treeRevision, setTreeRevision] = useState(0)
useEffect(() => { setTreeRevision((r) => r + 1) }, [tree])
```
- `useRef + .current++` 으로는 re-render 가 안 일어나므로 `useState + effect` 패턴.
- `tree` 의 React identity 비교만으로 충분 — 깊은 비교 불필요.

### page.tsx 수정 위치 6곳

1. **lucide-react import** (line ~30) — `Map as MapIcon` alias 추가 (global `Map` constructor 와 shadowing 회피).
2. **Minimap import** (line 227) — `import { Minimap } from './minimap'`.
3. **state 선언** (line ~791-796) — `minimapEnabled`, `treeRevision` + tree dep effect (line ~841-844).
4. **uiPrefs hydrate + persist** (line ~1034-1037 type, ~1086-1089 hydrate, ~1108 persist body, ~1124 dep array).
5. **Shift+M keydown** (line ~3273-3284) — modifier 검사 `shift=true, meta/alt=false`.
6. **Toolbar 버튼** (line ~5179-5198) — Grid3x3 버튼 우측, `MapIcon` + 한국어 라벨 + aria-pressed.
7. **commandItems entry** (line ~3793-3802) — `'시각 보조'` group, shortcut `⇧M`.
8. **Minimap mount** (line ~5705-5712) — `<main>` 직속, ShortcutHelpModal/CommandPalette 형제.

### command-palette.tsx 추가

`SHORTCUT_GROUPS` 의 `'시각 보조'` 카테고리 items 배열에 `{ keys: ['⇧', 'M'], label: '미니맵 토글' }` 1행 추가.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Map import shadowing global Map constructor**
- **Found during:** Task 2 typecheck
- **Issue:** `import { Map } from 'lucide-react'` 가 5곳의 `new Map<string, …>()` 호출과 충돌해 TS7009/TS2558 에러 발생. lucide-react 의 Map 컴포넌트가 generic 을 받지 않으므로 generic 호출이 깨짐.
- **Fix:** `Map as MapIcon` alias 로 import. 사용처 2곳(toolbar 버튼, commandItems icon)도 `MapIcon` 으로 갱신.
- **Files modified:** apps/web/src/app/page.tsx
- **Commit:** 6d4780e (Task 2 와 동일 commit)

**2. [Rule 1 - Bug] JSX.Element 명시 반환 타입 namespace 미발견**
- **Found during:** Task 1 typecheck (`error TS2503: Cannot find namespace 'JSX'`)
- **Issue:** 본 프로젝트 tsconfig 가 global JSX namespace 를 노출 안 함 (React 17+ automatic runtime).
- **Fix:** 함수 반환 타입 annotation 제거 — inferred type 으로도 동일하게 동작 (spacing-overlay/grid-overlay 와 일치하는 패턴).
- **Files modified:** apps/web/src/app/minimap.tsx
- **Commit:** b945001 (Task 1 와 동일 commit)

## Verification

### Automated
- `pnpm --filter web typecheck` — 통과 (0 errors)

### must_haves.truths 11항목 매핑

| # | Truth | 충족 evidence |
|---|-------|---------------|
| 1 | Shift+M 토글 + modal `M` 충돌 회피 | page.tsx Shift+M handler — `event.shiftKey && !meta && !alt` |
| 2 | toolbar Map 버튼 + aria-pressed | toolbar 버튼 line 5179-5198, aria-pressed={minimapEnabled} |
| 3 | ⌘K 미니맵 엔트리 | commandItems id='toggle-minimap', group='시각 보조' |
| 4 | 좌하단 fixed 200×120 z-60 | minimap.tsx `className="fixed bottom-4 left-4"`, style width=200, zIndex=60 |
| 5 | 노드 outlined rectangle (mini-render 없음) | nodeBoxes.map → `<div style={{ border: 1px solid }}/>` |
| 6 | viewport rect 반투명 accent | VIEWPORT_RECT_BG `rgba(99, 102, 241, 0.18)` + border 0.6 |
| 7 | scroll 시 실시간 추종 (rAF throttle) | wrapper.addEventListener('scroll') + rAF |
| 8 | zoom 변경 시 viewport+노드 재계산 | useEffect dep `[open, treeRevision, canvasZoom, containerWidth]` |
| 9 | 클릭 → 클릭 위치 중앙 navigate | handleBodyClick — scrollLeft = logicalX * z - clientWidth/2 |
| 10 | dw:uiPrefs:v1 영속화 | minimapEnabled JSON 본문 + hydrate effect |
| 11 | close 버튼 X aria-label "미니맵 닫기" | header `<button aria-label="미니맵 닫기"><X/></button>` |

## Manual Verification Pending

다음 항목은 개발 서버 실행 후 시각 확인 필요:
- Shift+M 토글 → 미니맵 표시/숨김
- toolbar Map 버튼 클릭 동일 토글
- ⌘K → "미니맵" 검색 → 엔트리 실행
- 캔버스 스크롤 시 viewport rect 추종
- ⌘+/- 줌 시 노드 박스 + viewport rect 재계산
- 미니맵 클릭 → 캔버스 navigate (zoom 변경 없음)
- 미니맵 Enter/Space → 콘텐츠 중앙 navigate
- close 버튼 X 클릭 → 미니맵 닫힘
- 페이지 reload 후 토글 상태 유지

## Threat Surface — Confirmed Mitigations

| Threat ID | Mitigation | Site |
|-----------|------------|------|
| T-03-03-01 (DoS scroll listener) | rAF throttle | minimap.tsx onScrollOrResize |
| T-03-03-02 (DoS large tree querySelectorAll) | tree 변경 시만 measureNodes (treeRevision dep) | useEffect `[open, treeRevision, ...]` |
| T-03-03-03 (Tampering selector) | 동일 origin DOM only — accept | querySelectorAll 결과만 사용 |
| T-03-03-04 (Info disclosure) | 사용자 자신 캔버스 — accept | 외부 노출 없음 |

## Phase 3 완료 권고

본 plan 으로 VIS-01 (grid overlay) + VIS-02 (viewport 중앙 pivot zoom) + VIS-03 (minimap) 모두 완료. ROADMAP.md Phase 3 status → "completed" 갱신, REQUIREMENTS.md VIS-01/02/03 모두 체크.

## Self-Check: PASSED

- minimap.tsx 파일: FOUND (311 lines)
- page.tsx 수정 6위치: FOUND (15 minimapEnabled 출현)
- command-palette.tsx 미니맵 행: FOUND
- 모든 commit 존재: b945001, 6d4780e, 6c030cf
- typecheck 통과: 0 errors
