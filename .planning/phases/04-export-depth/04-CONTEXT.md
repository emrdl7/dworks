# Phase 4: export 깊이 (라이브러리 wrap) - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** Auto (YOLO milestone)

<domain>
## Phase Boundary

carousel/tabs/accordion/modal/entranceAnimation이 _실제 작동하는_ HTML 로 export. 현재는 `packages/tree-renderer` 가 정적 HTML + `data-dworks-*` 속성만 출력.

**현재 상태:**
- `packages/tree-renderer/src/render.ts` — 정적 HTML 출력 (renderNode + renderTree). 모든 interactive 노드는 data-attr 박혀있고 base markup 존재
  - carousel: previewIndex 이미지만 렌더 (slides[] 무시)
  - tabs: activeIndex panel 만 렌더 (다른 tab UI 미작동)
  - accordion: `<details>/<summary>` 네이티브 disclosure (작동하나 _라이브러리 동작_ 부재)
  - modal: `<dialog open>` 네이티브 dialog (trigger 버튼/close 동작 부재)
  - entranceAnimation: `data-entrance-animation` attr 만 박힘 (실제 effect 없음)
- `packages/exporters/src/index.ts` — placeholder 6 line. 신규 HTML exporter 추가 위치.
- HTML download UI 없음 — 현재는 JSON 만 download.

**Phase 4 scope:**
- EXP-01 — carousel 실제 작동 export — Embla Carousel CDN script + init JS 자동 주입
- EXP-02 — tabs/accordion/modal 실제 작동 export — vanilla JS wrap (라이브러리 의존 회피)
- EXP-03 — entranceAnimation 실제 작동 export — IntersectionObserver vanilla JS + reduced-motion 존중

**Out of scope:** code export (React/Vue 컴포넌트) — v3.0+

</domain>

<decisions>
## Implementation Decisions

### Pipeline 구조

- **D-01**: 신규 `packages/exporters/src/html.ts` — `exportTreeToHtml(tree, options): string` 가 _완성된_ `<!DOCTYPE html>` 문서 반환. `packages/tree-renderer` 의 `renderTree` 를 호출해 body content 생성 + head/script wrap.
- **D-02**: 검출 phase — `detectFeatures(tree)` 가 트리 순회하며 `{ hasCarousel, hasTabs, hasAccordion, hasModal, hasEntranceAnimation }` 반환. 검출된 기능만 해당 script 주입.
- **D-03**: `apps/web/src/app/html-export.ts` (apps/web 측 어댑터) — fonts/tokens/globals.css 일부를 inline `<style>` 으로 emit (export 결과가 _독립 실행_ 되어야 함). lite 버전: 기본 reset CSS + Pretendard CDN.
- **D-04**: download UI — 기존 export 버튼 옆 "HTML 내보내기" 버튼 추가. 같은 generation, `.html` 확장자. Korean toast 안내.

### EXP-01 — Carousel (Embla CDN)

- **D-05**: Embla Carousel CDN `https://unpkg.com/embla-carousel@8.5.0/embla-carousel.umd.js` (stable). 단일 file load.
- **D-06**: 트리에 carousel 노드 있으면 `<head>` 에 script tag + body 끝에 init script. carousel 각 노드마다 `data-dworks-node-id` 로 식별, init 시 `EmblaCarousel(rootEl, { loop: true, slidesToScroll: 1 })`.
- **D-07**: tree-renderer 의 carousel 렌더가 _slides 모두_ 렌더하도록 수정. 현재는 previewIndex 만. flex container + slide wrapper 구조 (Embla 요구).
- **D-08**: 이전/다음 버튼 — 자동 주입 (`Embla.canScrollPrev/Next`). 한국어 aria-label `"이전 슬라이드"` / `"다음 슬라이드"`.

### EXP-02 — Tabs/Accordion/Modal (Vanilla JS)

- **D-09**: vanilla JS 라이브러리 의존 회피 — 직접 작성 (~100-200 lines). `apps/web/src/app/html-export-scripts.ts` 가 string template 으로 vanilla JS 저장.
- **D-10**: Tabs vanilla — `[data-dworks-tabs]` 안 `[data-dworks-tab-trigger]` 클릭 시 활성 panel 전환. `aria-selected`/`aria-controls`/`tabindex` 전환. 키보드 ←/→ 화살표 지원.
- **D-11**: Accordion vanilla — `<details>/<summary>` 네이티브 사용. _multiple vs single_ 모드는 트리의 `expandMode` prop 으로 분기 — single 이면 다른 details 자동 닫기.
- **D-12**: Modal vanilla — `[data-dworks-modal-trigger]` 클릭 → `dialog.showModal()`, `[data-dworks-modal-close]` 클릭 → `dialog.close()`. backdrop 클릭 close. ESC 키 자동 (네이티브 dialog).
- **D-13**: tree-renderer 의 tabs/modal 렌더가 _data-attr_ 박도록 수정 (trigger/close/panel identifiers).

### EXP-03 — entranceAnimation (IntersectionObserver)

- **D-14**: `data-entrance-animation="slide-up|fade-in|slide-left|..."` + `data-entrance-duration` + `data-entrance-delay` + `data-entrance-trigger="load|scroll"` 가 박혀 있다고 가정 (tree-renderer 현재 출력). vanilla JS 가 이를 읽고 적용.
- **D-15**: IntersectionObserver — `trigger === 'scroll'` 노드는 viewport 진입 시 transition 적용. `trigger === 'load'` 는 페이지 load 후 즉시 적용.
- **D-16**: 애니메이션 타입 매핑 (transform/opacity transition):
  - `slide-up` → `transform: translateY(20px) → translateY(0)`
  - `slide-left` → `translateX(20px) → translateX(0)`
  - `fade-in` → opacity 0 → 1
  - (외 6종은 v1 fallback `fade-in`)
- **D-17**: `prefers-reduced-motion: reduce` 미디어 쿼리 — true 면 모든 entrance 즉시 final state 적용 (duration 0). vanilla JS 가 `window.matchMedia` 로 체크.

### Claude's Discretion

- Embla CDN 정확한 URL 버전 (8.5.0 기본, 최신 stable 확인).
- vanilla JS 코드 minify 여부 (export 시 readability vs size 트레이드오프 — readability 우선).
- HTML head 안 inline CSS 의 토큰 범위 (full vs lite).
- Pretendard CDN URL.

</decisions>

<canonical_refs>
## Canonical References

### Project-level
- `.planning/PROJECT.md` — EXP-01..EXP-03 정의
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md` §Phase 4

### Code anchors
- `packages/tree-renderer/src/render.ts` — `renderTree`/`renderNode` + 4 interactive 노드 렌더 (수정 대상)
- `packages/tree-renderer/src/render.ts:169` renderModal — 정적 dialog
- `packages/tree-renderer/src/render.ts:186` renderAccordion — details/summary
- `packages/tree-renderer/src/render.ts:199` renderTabs — activeIndex 만
- `packages/tree-renderer/src/render.ts:219` renderCarousel — previewIndex 만
- `packages/exporters/src/index.ts` — 신규 html.ts 위치
- `apps/web/src/app/page.tsx:1670` — 현재 JSON download UI (HTML 버튼 추가 위치)
- `packages/tree/src` — schema (Embla wrap 시 노드 type/props 확인)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **renderTree/renderNode** — 정적 HTML 출력 작동. 신규 exporter 가 wrap 만.
- **data-dworks-node-id** — 모든 노드에 박혀있음 (selectable-node.tsx). vanilla JS 가 식별자로 사용.
- **JSON export 패턴** (page.tsx:1670) — Blob + anchor download. HTML도 동일 패턴.
- **Korean toast** — useToast hook (Phase 1).

### Established Patterns
- Korean comments + Korean strings
- pnpm + turborepo monorepo
- TypeScript strict
- node:test 테스트 runner (packages 동일)

### Integration Points
- packages/exporters/src — 신규 html.ts + html-scripts.ts (vanilla JS templates)
- packages/tree-renderer/src/render.ts — interactive 노드 렌더 4건 확장 (data-attr + 모든 slide/tab/item 렌더)
- apps/web/src/app/page.tsx:1670 — HTML download 핸들러 추가
- apps/web/src/app/html-export.ts — 신규 어댑터 (web 측, fonts/tokens 결정)

</code_context>

<specifics>
## Specific Ideas

- Embla 단일 CDN script (UMD), `init()` 호출 후 cleanup 자동
- vanilla JS 는 `(function(){...})()` IIFE — 글로벌 오염 회피
- entrance CSS class `dw-entrance` + `dw-entrance-active` 토글 패턴
- `prefers-reduced-motion: reduce` 우선

</specifics>

<deferred>
## Deferred Ideas

- 자체 carousel vanilla 구현 (Embla 의존 회피) — 비용 큼 (v3)
- Tailwind class export (현재는 inline style) — v3
- React/Vue 컴포넌트 export — v3.0+
- favicon/og 메타 자동 생성 — v3
- 다중 페이지 export (현재는 single page) — v3

</deferred>

---

*Phase: 04-export-depth*
*Context gathered: 2026-05-11*
