---
phase: 04-export-depth
verified: 2026-05-11T10:00:00Z
status: human_needed
score: 3/3 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Embla carousel 실제 슬라이드 작동 (브라우저)"
    expected: "carousel 노드가 있는 트리를 HTML 내보내기 후 .html 파일을 브라우저로 열면, ‹/› 버튼 클릭 시 슬라이드가 transform 으로 좌우 이동하고 loop:true 로 끝에서 처음으로 순환한다. aria-label '이전 슬라이드'/'다음 슬라이드' 가 스크린리더에 읽힌다."
    why_human: "Embla CDN UMD 가 unpkg 에서 로드되어 EmblaCarousel 전역이 노출되어야 하고, 실제 viewport DOM 측정 + transform 계산은 브라우저 런타임에서만 검증 가능. CAROUSEL_INIT_SCRIPT 의 readyState 분기 + scrollPrev/scrollNext 연결은 grep 으로 코드만 확인됨."
  - test: "Tabs 클릭/키보드 토글 (브라우저)"
    expected: "tabs trigger 클릭 시 activate(tabId) 가 해당 panel 의 hidden 제거 + 나머지 panel hidden 부여. 활성 trigger 의 aria-selected='true' + tabindex='0' 로 전환. ←/→ 화살표 키로 trigger 순환 + 활성 panel 동기 전환."
    why_human: "TABS_SCRIPT 의 클릭/keydown 핸들러는 코드상 올바르지만 실제 DOM 이벤트 흐름 + 포커스 이동 + 스크린리더의 aria-selected 인식은 사용자 환경에서만 확인 가능."
  - test: "Accordion single/multiple 모드 동작 (브라우저)"
    expected: "data-expand-mode='single' 인 accordion 에서 한 details 를 열면 다른 details 가 자동으로 닫힌다. data-expand-mode='multiple' 이면 여러 details 가 독립적으로 열림. 네이티브 <details>/<summary> 클릭/Enter/Space 모두 정상."
    why_human: "ACCORDION_SCRIPT 의 toggle 이벤트 핸들러는 코드상 올바르나 브라우저의 <details> 네이티브 이벤트 timing + 다중 open attr 제거 시 reflow 정상 동작은 런타임 검증 필요."
  - test: "Modal 트리거/닫기/backdrop/ESC (브라우저)"
    expected: "trigger 버튼 클릭 시 해당 dialog.showModal() 호출되어 모달 표시 + ::backdrop 어둡게. data-dworks-modal-close 버튼 클릭 시 dialog.close(). dialog content 영역 바깥 (backdrop) 클릭 시 close. ESC 키로 close (<dialog> 네이티브). aria-label='닫기' 가 스크린리더에 읽힘."
    why_human: "MODAL_SCRIPT 의 showModal/close/getBoundingClientRect 로직은 코드상 올바르나 backdrop 클릭 좌표 계산 + <dialog> 네이티브 ESC 동작은 브라우저에서만 작동."
  - test: "entranceAnimation IntersectionObserver + reduced-motion (브라우저)"
    expected: "data-dw-entrance='slide-up' (또는 fade-in/slide-left/slide-right/slide-down) + data-dw-entrance-trigger='scroll' 노드가 viewport 진입 시 opacity 0→1 + transform translateY(20px)→none 으로 부드럽게 진입. duration/delay attr 가 transition 에 반영. OS 설정 '동작 줄이기 (prefers-reduced-motion: reduce)' 시 즉시 final 상태 (transition 0) 적용."
    why_human: "ENTRANCE_ANIMATION_SCRIPT 의 IntersectionObserver + matchMedia 코드는 정확하나, 실제 진입 effect/CSS transition 부드러움 + reduced-motion 사용자 설정 반영은 시각적 검증 필요."
  - test: "HTML 내보내기 버튼 → 파일 다운로드 → 열기 end-to-end (브라우저)"
    expected: "apps/web 의 generation 패널에서 'HTML 내보내기' 버튼 클릭 시 (compareMode 가 아닐 때) dworks-generation-{ISO}-{label}.html 파일이 다운로드된다. Korean toast '{filename} 다운로드' 가 success 톤으로 표시. 다운로드된 .html 을 브라우저에서 열면 위 5 항목 모두 작동."
    why_human: "Blob + anchor.click() 다운로드 흐름은 jsdom 으로 단위 테스트 가능하나 실제 사용자 다운로드 경험 + toast 표시 + .html 파일 독립 실행 확인은 사용자 환경에서만 검증 가능."
---

# Phase 4: export 깊이 (라이브러리 wrap) Verification Report

**Phase Goal:** carousel/tabs/accordion/modal/animation이 _실제 작동하는_ HTML 로 export.

**Verified:** 2026-05-11T10:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                       | Status     | Evidence                                                                                                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | export 결과에 carousel 노드 있으면 Embla Carousel CDN script + init JS 자동 주입 — 실제 슬라이드 작동 (EXP-01)               | ✓ VERIFIED (code) / ? human-needed (browser) | `packages/exporters/src/html.ts:104-106` features.hasCarousel 분기 head 에 `<script src="https://unpkg.com/embla-carousel@8.5.0/embla-carousel.umd.js" defer>` 주입. `html-scripts.ts:97-117` CAROUSEL_INIT_SCRIPT IIFE 가 `EmblaCarousel(viewport, {loop:true,slidesToScroll:1})` init + prev/next 연결 + readyState 분기. `render.ts:248-269` renderCarousel 이 viewport/container/모든 slides + ‹/› 버튼 + 한국어 aria 박힘. 테스트 9/9 pass. |
| 2   | tabs/accordion/modal 노드 있으면 vanilla JS wrap — 실제 토글/펼침/dialog 작동 (EXP-02)                                       | ✓ VERIFIED (code) / ? human-needed (browser) | `html-scripts.ts:14-46` TABS_SCRIPT click + ←/→ 키 네비 + hidden/aria-selected 토글. `html-scripts.ts:50-75` MODAL_SCRIPT showModal/close + backdrop 좌표 계산. `html-scripts.ts:79-93` ACCORDION_SCRIPT single 모드 자동 닫기 + multiple 네이티브 위임. `render.ts:169-202` renderModal/renderAccordion/renderTabs 가 data-dworks-* selector + 한국어 aria 출력. 모두 ES5 IIFE — 외부 의존 0. 테스트 23/23 pass.   |
| 3   | entranceAnimation 가진 노드 있으면 IntersectionObserver vanilla JS — 실제 진입 효과 + reduced-motion 존중 (EXP-03)           | ✓ VERIFIED (code) / ? human-needed (browser) | `html-scripts.ts:123-176` ENTRANCE_ANIMATION_SCRIPT 가 `window.matchMedia('(prefers-reduced-motion: reduce)')` 체크 + 즉시 final 분기 + IntersectionObserver(threshold:0.1) + scroll/load trigger 분리 + readyState 분기 + transition 0.01ms CSS 미디어쿼리(BASE_CSS:204) 이중 방어. `render.ts:53-66` commonAttrs 이 data-dw-entrance/-trigger/-duration/-delay emit. |

**Score:** 3/3 truths verified (code-level)

### Required Artifacts

| Artifact                                                  | Expected                                              | Status     | Details                                                                                                                                  |
| --------------------------------------------------------- | ----------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/tree-renderer/src/render.ts`                    | 4 interactive 노드 (carousel/tabs/accordion/modal) 전체 slide/item 렌더 + data-dworks-* attr + 한국어 aria | ✓ VERIFIED | 273 lines. renderCarousel/Tabs/Accordion/Modal 모두 data-dworks-* + 한국어 aria-label 출력. 테스트 23/23 pass. |
| `packages/exporters/src/html.ts`                          | exportTreeToHtml + detectFeatures + buildHead/Scripts | ✓ VERIFIED | 119 lines. detectFeatures 5종 검출 (carousel/tabs/accordion/modal/entranceAnimation). Embla CDN + Pretendard + BASE_CSS + 조건부 script 주입. |
| `packages/exporters/src/html-scripts.ts`                  | 5 vanilla JS IIFE 템플릿 (TABS/MODAL/ACCORDION/CAROUSEL_INIT/ENTRANCE) + BASE_CSS | ✓ VERIFIED | 205 lines. 모두 ES5 IIFE. ENTRANCE 가 data-dw-entrance namespace (renderer 와 일치) 사용 — Plan 02 deviation #1 에서 수정. prefers-reduced-motion 4건, IntersectionObserver 5건.    |
| `packages/exporters/src/html.test.ts`                     | detectFeatures + exportTreeToHtml 검증                | ✓ VERIFIED | 130 lines, 9 tests pass. carousel/tabs/entrance selective injection 모두 검증.                                                          |
| `packages/exporters/src/index.ts`                         | exportTreeToHtml / detectFeatures re-export          | ✓ VERIFIED | 15 lines. exportTreeToHtml, detectFeatures, ExportFeatures, ExportHtmlOptions re-export.                                                |
| `apps/web/src/app/html-export.ts`                         | downloadGenerationAsHtml + buildHtmlFilename 어댑터  | ✓ VERIFIED | 55 lines. Blob('text/html;charset=utf-8') + anchor.click() + URL.revokeObjectURL try/finally. ISO timestamp + safe label sanitize.   |
| `apps/web/src/app/page.tsx` (HTML 버튼 + 핸들러)         | handleExportGenerationHtml + 'HTML 내보내기' 버튼     | ✓ VERIFIED | import line 161, handler line 1706-1722 (try/catch + Korean toast), 버튼 line 4329-4338 (JSON 내보내기 옆, disabled={compareMode}, aria-label='HTML 내보내기').                                  |
| `apps/web/package.json`                                  | `@dworks/exporters: workspace:*` dependency           | ✓ VERIFIED | line 18.                                                                                                                                 |

### Key Link Verification

| From                                | To                                       | Via                                                                          | Status | Details                                                                                                          |
| ----------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `html.ts:exportTreeToHtml`          | `tree-renderer:renderTree`               | `import { renderTree } from '@dworks/tree-renderer'` + `renderTree(tree)` 호출 | ✓ WIRED | html.ts:8 import + html.ts:86 호출. body content 생성.                                                            |
| `html.ts:exportTreeToHtml`          | `html-scripts.ts:*_SCRIPT/BASE_CSS`      | 6 named import + buildHead/buildScripts 안 inline 주입                       | ✓ WIRED | html.ts:11-18 import + buildHead/buildScripts 안 `<script>${X}</script>` template literal.                       |
| `html.ts:detectFeatures`            | feature flags → script injection         | `if (features.hasCarousel) ... if (features.hasTabs) ...` 분기              | ✓ WIRED | buildHead:104 (Embla CDN), buildScripts:113-117 (5 분기). 테스트 7 (인터랙티브 없으면 미주입) 검증.            |
| `tree-renderer:render.ts:commonAttrs` | entrance 노드 → `data-dw-entrance*` attrs | render.ts:56-65 entranceAnimation 의 type/trigger/duration/delay 직접 emit  | ✓ WIRED | ENTRANCE_ANIMATION_SCRIPT 가 동일 attr 명 (`data-dw-entrance` 등) 사용. Plan 02 deviation #1 으로 검증.        |
| `apps/web:html-export.ts`           | `@dworks/exporters:exportTreeToHtml`     | `import { exportTreeToHtml } from '@dworks/exporters'` + 직접 호출           | ✓ WIRED | html-export.ts:9 import + html-export.ts:36 호출.                                                                |
| `apps/web:page.tsx`                 | `html-export:downloadGenerationAsHtml`   | `import { downloadGenerationAsHtml } from './html-export'` + 핸들러 직접 호출 | ✓ WIRED | page.tsx:161 import + page.tsx:1711 호출 (handleExportGenerationHtml 안). 버튼 onClick 으로 연결.              |
| `page.tsx:HTML 내보내기 버튼`        | `handleExportGenerationHtml`             | `onClick={handleExportGenerationHtml}`                                       | ✓ WIRED | line 4332.                                                                                                       |
| `handleExportGenerationHtml`        | `showToast` (성공/실패)                   | `showToast(\`${filename} 다운로드\`, 'success')` + 에러 핸들러               | ✓ WIRED | line 1715, 1717.                                                                                                 |
| renderCarousel `<div data-dworks-carousel>` | CAROUSEL_INIT_SCRIPT `querySelectorAll('[data-dworks-carousel]')` | selector contract                                                            | ✓ WIRED | render.ts:268 attr emit ↔ html-scripts.ts:101 selector.                                                          |
| renderTabs `<div data-dworks-tabs>` | TABS_SCRIPT `querySelectorAll('[data-dworks-tabs]')`              | selector contract                                                            | ✓ WIRED | render.ts:245 ↔ html-scripts.ts:16.                                                                              |
| renderAccordion `[data-expand-mode]` | ACCORDION_SCRIPT `getAttribute('data-expand-mode')`               | selector contract                                                            | ✓ WIRED | render.ts:201 ↔ html-scripts.ts:82.                                                                              |
| renderModal `[data-dworks-modal-trigger][data-modal-id]` | MODAL_SCRIPT `getElementById(id)` + showModal              | selector + dialog id 연결                                                    | ✓ WIRED | render.ts:186-187 (trigger data-modal-id + dialog id) ↔ html-scripts.ts:54-55.                                  |

### Data-Flow Trace (Level 4)

| Artifact                            | Data Variable                | Source                                                          | Produces Real Data                                                                                          | Status     |
| ----------------------------------- | ---------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| html.ts `exportTreeToHtml`          | tree (param) → body, features | renderTree(tree) + detectFeatures(tree)                         | Yes — body 는 renderTree 출력, features 는 트리 순회 실제 결과. 정적 분석으로 false-positive 없음.        | ✓ FLOWING |
| html-export.ts `downloadGenerationAsHtml` | input.tree, input.label    | 호출자가 active generation 의 tree/label 전달 (page.tsx:1712)   | Yes — page.tsx 가 `generations.find((entry) => entry.id === activeGenerationId)` 실제 active tree 전달. | ✓ FLOWING |
| page.tsx `handleExportGenerationHtml` | active.tree, active.label  | generations[].tree 는 Phase 1/2 의 generation creation flow 산물 | Yes — 트리 생성 flow 가 별도 검증된 phase 산물. 본 phase 가 의존만 함.                                  | ✓ FLOWING |
| BASE_CSS `dw-tabs__panel[hidden]{display:none}` | hidden attr           | tabs 토글이 attr 직접 조작                                       | Yes — TABS_SCRIPT 가 setAttribute/removeAttribute('hidden') 호출, CSS 가 즉시 반영.                       | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior                                              | Command                                              | Result                                                                       | Status |
| ----------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| @dworks/exporters 테스트 통과                          | `pnpm --filter @dworks/exporters test`               | 9 tests pass / 0 fail (detectFeatures 3 + exportTreeToHtml 6).             | ✓ PASS |
| @dworks/tree-renderer 테스트 통과 (4 interactive 노드) | `pnpm --filter @dworks/tree-renderer test`           | 23 tests pass / 0 fail (renderCarousel/Tabs/Accordion/Modal 각 2 + 기존).   | ✓ PASS |
| exportTreeToHtml 모듈 export 확인                       | (코드 검증: index.ts re-export)                      | exportTreeToHtml, detectFeatures, ExportFeatures, ExportHtmlOptions 4개 re-export. | ✓ PASS |
| Embla CDN URL 정확                                     | grep `embla-carousel@8.5.0` html.ts                  | `https://unpkg.com/embla-carousel@8.5.0/embla-carousel.umd.js` 정확 일치.   | ✓ PASS |
| 실제 브라우저 렌더링 + 인터랙션                          | (브라우저 실행 필요)                                  | grep 으로 검증 불가 — 인간 검증 필요.                                       | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                                                | Status      | Evidence                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXP-01      | 04-01, 04-02, 04-03 | carousel export 작동 — Embla Carousel CDN script + 자동 init JS 주입                                                       | ✓ SATISFIED | render.ts:248-269 (viewport/container/모든 slides + ‹/› + 한국어 aria), html.ts:104-106 (Embla CDN 분기), html-scripts.ts:97-117 (CAROUSEL_INIT_SCRIPT), html-export.ts (download), page.tsx (UI 버튼). 브라우저 슬라이드 실제 작동은 human verification 1.                                                                                       |
| EXP-02      | 04-01, 04-02, 04-03 | tabs/accordion/modal export 작동 — vanilla JS (Radix 회피) wrap + a11y(role/aria) 보강                                     | ✓ SATISFIED | render.ts:169-246 (3 interactive 노드 data-dworks-* + 한국어 aria), html-scripts.ts:14-93 (TABS/MODAL/ACCORDION_SCRIPT 외부 의존 0). 브라우저 토글 작동은 human verification 2-4.                                                                                                                                                                |
| EXP-03      | 04-02, 04-03      | entranceAnimation export 작동 — IntersectionObserver vanilla JS 자동 주입 + reduced-motion 존중                            | ✓ SATISFIED | render.ts:53-66 (data-dw-entrance* attrs emit), html-scripts.ts:123-176 (ENTRANCE_ANIMATION_SCRIPT — IntersectionObserver + matchMedia + readyState 분기 + CSS @media 이중 방어). 브라우저 진입 효과는 human verification 5.                                                                                                                  |

### Anti-Patterns Found

| File                                       | Line | Pattern                                                       | Severity | Impact                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ---- | ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —                                          | —    | TODO/FIXME/HACK/placeholder                                   | —        | grep 0 hits — phase 4 modify 대상 4개 파일 모두 clean (`html.ts`, `html-scripts.ts`, `render.ts`, `html-export.ts`).                                                                                                                                  |
| —                                          | —    | 빈 return / 빈 람다                                            | —        | grep 0 hits — `return null/{}/[] / => {}` 패턴 무 (TABS_SCRIPT/MODAL_SCRIPT 의 IIFE `(function(){...})()` 는 의도된 패턴).                                                                                                                              |
| `packages/exporters/src/index.ts:4`         | 4    | "M0 단계 placeholder" 주석                                     | ℹ️ Info | 기존 (Phase 0) 코멘트 — 바로 다음 줄에서 Phase 4 export 가 실체로 채워졌으므로 코멘트 갱신 권장. 동작 영향 없음 (export 작동 정상 — 9 tests pass).                                                                                                       |
| `render.ts:172` (renderModal)              | 172  | `data-dw-modal-action="secondary/primary"` 버튼이 vanilla JS 핸들러 미연결 | ℹ️ Info | primary/secondary action 버튼은 표시되지만 클릭 시 dismiss 외 동작 없음 — MODAL_SCRIPT 가 close 버튼만 핸들. 사용자 정의 action 은 Phase 4 scope 밖 (deferred — modal action 콜백). 동작상으로는 사용자가 close 로 닫을 수 있어 trap 아님. |

### Human Verification Required

자세한 6개 항목은 frontmatter `human_verification` 참조. 요약:

1. **Embla carousel 실제 슬라이드 작동** — ‹/› 버튼/loop + 한국어 aria
2. **Tabs 클릭/키보드 토글** — hidden/aria-selected/tabindex 전환 + ←/→ 화살표
3. **Accordion single/multiple 모드 동작** — single 자동 닫기 + multiple 독립
4. **Modal 트리거/닫기/backdrop/ESC** — showModal/close/backdrop 좌표/네이티브 ESC
5. **entranceAnimation IntersectionObserver + reduced-motion** — 스크롤 진입 effect + 시스템 설정 존중
6. **HTML 내보내기 버튼 → 파일 다운로드 → 열기 end-to-end** — 통합 사용자 흐름

### Gaps Summary

없음. 코드 레벨에서 3/3 success criteria 모두 충족 — renderer가 vanilla JS hook 가능한 HTML 출력 + exporter 가 feature detect 후 조건부 script 주입 + web 어댑터가 download UI 통합. 23 + 9 + 376 = 408 자동 테스트 통과.

Phase 의 본질 (carousel/tabs/accordion/modal/animation 이 _실제로 작동_) 는 브라우저 런타임 검증 단계로 넘어감. 코드 구조 + selector contract + 의존성 그래프 + 테스트가 모두 정렬되어 있어, 사용자가 'HTML 내보내기' 버튼을 눌러 .html 파일을 열면 모든 인터랙티브 컴포넌트가 작동할 _높은 확률_ 이 있으나, 실제 브라우저 동작 (Embla CDN 로드, transform 계산, IntersectionObserver entry, <details> 네이티브 timing, <dialog> ESC) 은 브라우저 런타임에서만 검증 가능.

특이사항: Plan 04-02 SUMMARY 의 Deviation #1 (entranceAnimation attr 명을 `data-entrance-*` → `data-dw-entrance-*` 로 정정) 은 _critical_ — plan 그대로 작성했다면 어떤 노드도 IntersectionObserver 가 매치하지 못해 EXP-03 가 silent fail 할 뻔했음. 코드 cross-check 가 정확히 작동한 사례.

---

_Verified: 2026-05-11T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
