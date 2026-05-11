---
phase: 04-export-depth
plan: 01
subsystem: rendering
tags: [tree-renderer, html-export, accessibility, embla, vanilla-js]

requires:
  - phase: 00-foundation
    provides: "@dworks/tree-renderer renderTree/renderNode 정적 HTML 출력"
  - phase: 02-canvas
    provides: "interactive 노드 schema (CarouselNode/TabsNode/AccordionNode/ModalNode)"

provides:
  - "renderCarousel: viewport/container + 모든 slides + prev/next 버튼 (Embla 호환)"
  - "renderTabs: 모든 trigger + 모든 panel + hidden/aria-selected/aria-controls/tabindex"
  - "renderAccordion: data-expand-mode (single/multiple) + data-dworks-accordion-item"
  - "renderModal: trigger 버튼 + dialog + close 버튼 (vanilla JS hook 가능)"
  - "한국어 aria-label (이전/다음 슬라이드, 닫기)"

affects: [04-02-exporters, 04-03-web-adapter, EXP-01, EXP-02]

tech-stack:
  added: []
  patterns:
    - "data-dworks-* 접두 attr — vanilla JS / Embla hook 지점 (data-dw-* 와 별도 namespace)"
    - "BEM class (dw-carousel__viewport, dw-tabs__trigger, dw-accordion__item, dw-modal__close)"
    - "한국어 aria-label 일관 (이전 슬라이드 / 다음 슬라이드 / 닫기)"

key-files:
  created: []
  modified:
    - "packages/tree-renderer/src/render.ts"
    - "packages/tree-renderer/src/render.test.ts"

key-decisions:
  - "data-dworks-* attr 는 vanilla JS / Embla hook 전용 — 기존 data-dw-* (인스펙터 마커) 와 분리"
  - "renderTabs: hidden attr 로 비활성 panel 표시 — vanilla JS 토글 부담 최소화"
  - "renderAccordion: allowMultiple 을 data-expand-mode='single|multiple' 로 정규화 (plan 의 expandMode 가상 필드 → 실제 schema 매핑)"
  - "renderModal trigger 라벨: 스키마 미정 (triggerLabel 필드 없음) → node.title 사용, fallback '열기'"
  - "renderCarousel slide 는 _이미지_ (CarouselItem schema = {id, src, alt, caption}) — plan 의 TreeNode wrap 가정은 schema 와 어긋남"

patterns-established:
  - "interactive 노드 확장 패턴: 모든 자식 렌더 + 활성 표시는 attr 로만 (vanilla JS 가 visual 분기)"
  - "caption 있는 carousel slide: figure/figcaption 으로 a11y wrap"

requirements-completed: [EXP-01, EXP-02]

duration: 18min
completed: 2026-05-11
---

# Phase 4 Plan 1: tree-renderer 4 interactive 노드 확장 Summary

**Embla / vanilla JS hook 가능한 HTML 출력 — carousel/tabs/accordion/modal 4 노드 전체 slide+item 렌더 + data-dworks-* attr + 한국어 aria**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-05-11T08:45:00Z (approx)
- **Completed:** 2026-05-11T09:03:08Z
- **Tasks:** 2 / 2
- **Files modified:** 2 (render.ts, render.test.ts)

## Accomplishments

- **renderCarousel** — `items[]` 전체 슬라이드를 viewport/container 구조로 렌더 (Embla CDN 호환). prev/next 버튼 + 한국어 aria (`이전 슬라이드` / `다음 슬라이드`). 각 slide 에 `data-dworks-carousel-slide` + `data-slide-index`. caption 있는 slide 는 `<figure>/<figcaption>` 으로 a11y wrap.
- **renderTabs** — `items[]` 전체 trigger + 전체 panel 렌더. 비활성 panel `hidden` attr, 활성은 `tabindex="0"` + `aria-selected="true"`. `aria-controls="panel-{id}"` 로 trigger-panel 연결. vanilla JS 가 click 시 hidden 토글 + aria 전환만 하면 됨.
- **renderAccordion** — `data-expand-mode="single|multiple"` (allowMultiple bool 정규화). 각 `<details>` 에 `data-dworks-accordion-item` + `data-item-id`. expanded item 은 `open` 보존.
- **renderModal** — trigger 버튼 (`<button data-dworks-modal-trigger>`) + dialog + close 버튼 (`<button data-dworks-modal-close aria-label="닫기">`) 풀세트. 기존 primary/secondary action 버튼 보존. dialog 에 `data-dworks-modal` + `id` (trigger 가 `data-modal-id` 로 참조).
- **테스트** — 8 신규 (carousel 2, tabs 2, accordion 2, modal 2), 기존 15 유지. 총 23/23 pass, typecheck exit 0.

## Task Commits

1. **Task 1: renderCarousel/Tabs/Accordion/Modal 확장** — `b46259d` (feat)
2. **Task 2: render.test.ts 4 interactive 테스트 보강** — `7fa6ad9` (test)

## Files Created/Modified

- `packages/tree-renderer/src/render.ts` — 4 interactive 노드 함수 (renderCarousel/renderTabs/renderAccordion/renderModal) 전체 재작성 (+68/-26)
- `packages/tree-renderer/src/render.test.ts` — describe('renderCarousel'/'renderTabs'/'renderAccordion'/'renderModal') 8 case 추가 (+157)

## Decisions Made

- **D-01 (이 plan):** `data-dworks-*` namespace 신설 — 기존 `data-dw-*` (인스펙터 편집 마커) 와 충돌 회피. vanilla JS 코드가 `[data-dworks-tabs]` 등 _interactive 전용_ selector 만 잡도록.
- **D-02:** tabs 비활성 panel 은 `hidden` HTML attr 사용 — CSS `display:none` 강제, vanilla JS 가 attr 토글만 하면 visual 자동.
- **D-03:** accordion `expandMode` (plan 가상 필드) → 실제 schema `allowMultiple: boolean` 정규화 → `data-expand-mode="single|multiple"`.
- **D-04:** modal trigger 라벨은 schema 에 `triggerLabel` 없으므로 `node.title || '열기'` fallback. 추후 Phase 4 EXP-02 에서 별도 필드 추가 가능 (deferred).
- **D-05:** carousel slide 내부는 `<img>` 직접 — plan 의 `renderNode(slide as TreeNode)` 는 schema 와 불일치 (CarouselItem 은 TreeNode 가 아님).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Schema 불일치] CarouselNode field 이름**
- **Found during:** Task 1
- **Issue:** Plan 은 `node.slides` 사용. 실제 schema 는 `node.items: CarouselItem[]` 이고 CarouselItem 은 `{id, src, alt, caption?, focalPoint?}` (TreeNode 가 아닌 이미지 데이터).
- **Fix:** `node.items` 로 변경, 각 slide 를 `<img>` (caption 있으면 `<figure>/<figcaption>`) 로 렌더. plan 의 `renderNode(slide as TreeNode)` 는 schema 와 불일치로 폐기.
- **Files modified:** packages/tree-renderer/src/render.ts (renderCarousel)
- **Verification:** typecheck pass, renderCarousel 테스트 2건 pass
- **Committed in:** b46259d

**2. [Rule 3 - Schema 불일치] TabsNode field 이름 및 content 형식**
- **Found during:** Task 1
- **Issue:** Plan 은 `node.tabs` + `tab.content: TreeNode[]` 가정. 실제 schema 는 `node.items: TabItem[]` 이고 `TabItem.content: string` (inline markdown).
- **Fix:** `node.items` 로 변경. content 를 `escapeHtml + \n→<br/>` (기존 패턴 일관) 로 렌더. `renderChildren(tab.content as TreeNode[])` 은 폐기.
- **Files modified:** packages/tree-renderer/src/render.ts (renderTabs)
- **Verification:** typecheck pass, renderTabs 테스트 2건 pass
- **Committed in:** b46259d

**3. [Rule 3 - Schema 불일치] AccordionNode expandMode → allowMultiple**
- **Found during:** Task 1
- **Issue:** Plan 은 `node.expandMode: 'single' | 'multiple'` 가정. 실제 schema 는 `allowMultiple?: boolean`. AccordionItem 의 content 도 markdown string (TreeNode[] 아님).
- **Fix:** `allowMultiple === true ? 'multiple' : 'single'` 로 정규화하여 `data-expand-mode` 박음. item content 는 escapeHtml + br 처리.
- **Files modified:** packages/tree-renderer/src/render.ts (renderAccordion)
- **Verification:** typecheck pass, renderAccordion 테스트 2건 (single/multiple 분기) pass
- **Committed in:** b46259d

**4. [Rule 3 - Schema 불일치] ModalNode field 차이**
- **Found during:** Task 1
- **Issue:** Plan 은 `node.triggerLabel` + `node.children` 가정. 실제 schema 는 `title`, `content` (string), `primaryActionLabel`, `secondaryActionLabel`, `size`, `open`. `triggerLabel` / `children` 없음.
- **Fix:** trigger 버튼 라벨로 `node.title || '열기'` 사용. 본문은 기존 (title h2 + content div + actions footer) 보존하면서 close 버튼만 추가. children-rendering 부재 가정 제거.
- **Files modified:** packages/tree-renderer/src/render.ts (renderModal)
- **Verification:** typecheck pass, renderModal 테스트 2건 pass
- **Committed in:** b46259d

---

**Total deviations:** 4 auto-fixed (모두 Rule 3 — plan 의 가상 schema 필드 vs 실제 schema 불일치)
**Impact on plan:** 산출물 의도 (vanilla JS hook 가능한 HTML) 100% 달성. plan 코드 sample 은 schema 검증 부재로 모두 가상 필드를 가리켰음 — acceptance criteria (grep + 테스트) 는 모두 통과. plan 가독성 향상을 위해 향후 plan 작성 시 schema 사전 확인 필요 (관찰 노트).

## Issues Encountered

- `attrs` helper 가 빈 문자열 값을 `attr=""` 로 emit — grep `data-dworks-tab-trigger` 매치 OK, HTML 표준상 valid. minor 미관 이슈 외 동작에 무영향.
- Hook (PreToolUse:Edit) READ-BEFORE-EDIT 가 Edit 직후마다 발동 — 동일 세션 Read 후에도 매 Edit 마다 재-Read 요구. 작업 흐름 영향 minor.
- **EXP-01/EXP-02 마킹 caveat**: plan frontmatter `requirements: [EXP-01, EXP-02]` 에 따라 SDK 가 두 requirement 를 complete 로 마크함. 그러나 **REQUIREMENTS.md 본문 텍스트** ("Embla Carousel CDN script + 자동 init JS 주입" / "vanilla JS … wrap") 는 Plan 04-02 (스크립트 주입) + 04-03 (어댑터) 완료 시점에 비로소 충족됨. 04-01 은 _renderer hook contract_ (data-dworks-* attr + 전체 slide/item 렌더) 만 제공. 다음 plan executor 는 EXP-01/02 가 이미 체크된 상태 (재마킹 불필요) 임을 인지하고 04-02/04-03 진행하면 됨.

## User Setup Required

None - 외부 서비스 설정 없음.

## Next Phase Readiness

- **04-02 (exporters html.ts)** 즉시 시작 가능 — tree-renderer 가 vanilla JS hook 가능한 출력 보장.
- **04-03 (web 어댑터)** 의 detectFeatures(tree) 가 carousel/tabs/accordion/modal 노드 존재로 스크립트 주입 분기 가능.
- vanilla JS 작성 시 다음 selector 안전:
  - `[data-dworks-carousel]` + `[data-dworks-carousel-slide]` + `[data-dworks-carousel-prev/next]`
  - `[data-dworks-tabs]` + `[data-dworks-tab-trigger][data-tab-id]` + `[data-dworks-tab-panel][data-tab-id]`
  - `[data-dworks-accordion][data-expand-mode]` + `[data-dworks-accordion-item]`
  - `[data-dworks-modal-trigger][data-modal-id]` + `[data-dworks-modal][id]` + `[data-dworks-modal-close]`

## Self-Check: PASSED

**Files:**
- FOUND: packages/tree-renderer/src/render.ts (수정)
- FOUND: packages/tree-renderer/src/render.test.ts (수정)
- FOUND: .planning/phases/04-export-depth/04-01-SUMMARY.md (이 파일)

**Commits:**
- FOUND: b46259d (feat — Task 1)
- FOUND: 7fa6ad9 (test — Task 2)

**Acceptance criteria (Task 1):**
- data-dworks-carousel-slide: 1 (≥1) PASS
- data-dworks-tab-trigger: 1 (≥1) PASS
- data-dworks-tab-panel: 1 (≥1) PASS
- data-dworks-modal-trigger: 1 (≥1) PASS
- data-dworks-modal-close: 1 (≥1) PASS
- data-dworks-accordion: 3 (≥1) PASS
- data-expand-mode: 2 (≥1) PASS
- "이전 슬라이드": 1 (≥1) PASS
- "다음 슬라이드": 1 (≥1) PASS
- typecheck exit 0 PASS

**Acceptance criteria (Task 2):**
- renderCarousel|renderTabs|renderAccordion|renderModal 등장: 12 (≥4) PASS
- 모든 테스트 pass: 23/23 PASS

---

*Phase: 04-export-depth*
*Completed: 2026-05-11*
