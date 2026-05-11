---
phase: 04-export-depth
plan: 02
subsystem: export
tags: [exporters, html-export, embla, vanilla-js, intersection-observer, accessibility]

requires:
  - phase: 04-export-depth
    plan: 01
    provides: "tree-renderer 4 interactive 노드 (carousel/tabs/accordion/modal) 전체 slide+item + data-dworks-* attr + 한국어 aria"
  - phase: 00-foundation
    provides: "@dworks/tree TreeNode schema + @dworks/tree-renderer renderTree"

provides:
  - "exportTreeToHtml(tree, options): 완성된 <!DOCTYPE html> 문서 (head + body + scripts) string"
  - "detectFeatures(tree): { hasCarousel, hasTabs, hasAccordion, hasModal, hasEntranceAnimation }"
  - "TABS_SCRIPT / MODAL_SCRIPT / ACCORDION_SCRIPT / CAROUSEL_INIT_SCRIPT / ENTRANCE_ANIMATION_SCRIPT — vanilla JS IIFE templates"
  - "BASE_CSS — reset + Pretendard + 인터랙티브 컴포넌트 (.dw-*) 최소 스타일"
  - "Embla Carousel CDN 통합 (8.5.0 UMD, defer load)"
  - "IntersectionObserver + prefers-reduced-motion 존중 entrance animation"

affects: [04-03-web-adapter, EXP-01, EXP-02, EXP-03]

tech-stack:
  added:
    - "@dworks/tree (workspace dep, 신규)"
    - "@dworks/tree-renderer (workspace dep, 신규)"
    - "tsx (devDep, node:test runner)"
  patterns:
    - "feature detect → script injection 분기 — payload 최소화"
    - "vanilla JS IIFE — 글로벌 미오염, ES5 호환 (var/function), 라이브러리 의존 0"
    - "data-dworks-* selector — tree-renderer 의 hook contract 와 1:1"
    - "data-dw-entrance namespace — entranceAnimation 만 별도 (render.ts 가 emit 하는 attr 그대로 활용)"

key-files:
  created:
    - "packages/exporters/src/html.ts (119 lines)"
    - "packages/exporters/src/html-scripts.ts (205 lines)"
    - "packages/exporters/src/html.test.ts (129 lines)"
  modified:
    - "packages/exporters/src/index.ts (re-export 추가)"
    - "packages/exporters/package.json (deps + test 스크립트 추가)"

key-decisions:
  - "detectFeatures 재귀는 children 필드만 — CarouselItem/TabItem/AccordionItem 은 TreeNode 가 아니므로 descend 불필요 (스키마 검증)"
  - "entranceAnimation 검출: BaseNodeMeta 공통 optional 필드 직접 체크 (모든 노드 type 통용)"
  - "entrance vanilla JS 가 읽는 attr 은 data-dw-entrance/data-dw-entrance-trigger/-duration/-delay — tree-renderer render.ts:60-65 가 이미 emit"
  - "Embla UMD 8.5.0 stable + defer — body script 가 readyState 분기로 DOMContentLoaded 대기"
  - "modal backdrop close: getBoundingClientRect 로 content rect 바깥 클릭 감지 (ESC 는 네이티브)"
  - "accordion single 모드만 toggle 핸들러 — multiple 은 네이티브 <details> 그대로"
  - "prefers-reduced-motion: reduce → 즉시 final 상태 + transition 0 (CSS 미디어쿼리 + JS 양쪽 처리)"

patterns-established:
  - "exporter = renderTree wrap + feature detect + script template 주입 패턴"
  - "Korean 주석 + Korean a11y string 일관 (CLAUDE.md 정책 준수)"
  - "node:test + assert/strict + tsx 러너 (다른 packages 와 동일)"

requirements-completed: [EXP-01, EXP-02, EXP-03]

duration: 5min
completed: 2026-05-11
---

# Phase 4 Plan 2: exporters html.ts + html-scripts.ts + html.test.ts Summary

**HTML exporter foundation — 트리 검출 후 Embla CDN + vanilla JS + IntersectionObserver 자동 wrap, 완성된 독립 실행 <!DOCTYPE html> 문서 반환**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-11T09:08:27Z
- **Completed:** 2026-05-11T09:11:26Z
- **Tasks:** 3 / 3
- **Files created:** 3 (html.ts, html-scripts.ts, html.test.ts)
- **Files modified:** 2 (index.ts, package.json)

## Accomplishments

- **html.ts (119 lines)** — `exportTreeToHtml(tree, options)` 가 완성된 `<!DOCTYPE html>` 문서 반환. `detectFeatures(tree)` 가 트리 순회하며 5종 기능 (carousel/tabs/accordion/modal/entranceAnimation) 검출. `buildHead` 가 meta + Pretendard CDN + BASE_CSS inline + (검출 시) Embla CDN script 주입. `buildScripts` 가 검출된 기능별로만 vanilla JS 주입.
- **html-scripts.ts (205 lines)** — 5개 vanilla JS IIFE 템플릿 + BASE_CSS. 모두 ES5 호환 (`var`/`function`) — 모든 브라우저 작동. 외부 의존 0 (Embla 는 CDN). TABS 는 click + ←/→ 키 네비, MODAL 은 showModal/close + backdrop, ACCORDION 은 single 모드 자동 닫기, CAROUSEL_INIT 는 readyState 분기 Embla init, ENTRANCE 는 IntersectionObserver + prefers-reduced-motion 존중.
- **html.test.ts (129 lines, 9 tests)** — detectFeatures 3건 (4종+entrance, 빈 트리, 중첩 children) + exportTreeToHtml 6건 (DOCTYPE/lang/meta/Pretendard, options override, carousel inject, no-interactive 미주입, entrance IntersectionObserver, tabs-only selective inject). 모두 pass.
- **index.ts** — `exportTreeToHtml`, `detectFeatures`, `ExportFeatures`, `ExportHtmlOptions` re-export.
- **package.json** — `@dworks/tree`, `@dworks/tree-renderer` workspace deps + `tsx` devDep + `test` 스크립트 추가.
- **typecheck pass** (패키지 단독 + 모노레포 전체 `pnpm -r typecheck` 모두 통과).

## Task Commits

1. **Task 1: html.ts foundation (exportTreeToHtml + detectFeatures + buildHead/Scripts + index re-export + deps)** — `43e6b66` (feat)
2. **Task 2: html-scripts.ts (5 vanilla JS templates + BASE_CSS)** — `ffd4955` (feat)
3. **Task 3: html.test.ts (9 tests — feature detect + script injection 검증)** — `fdf3743` (test)

## Files Created/Modified

- `packages/exporters/src/html.ts` — 신규 (119 lines). exportTreeToHtml + detectFeatures + buildHead + buildScripts + escapeHtml.
- `packages/exporters/src/html-scripts.ts` — 신규 (205 lines). TABS_SCRIPT, MODAL_SCRIPT, ACCORDION_SCRIPT, CAROUSEL_INIT_SCRIPT, ENTRANCE_ANIMATION_SCRIPT, BASE_CSS.
- `packages/exporters/src/html.test.ts` — 신규 (129 lines). 9 tests.
- `packages/exporters/src/index.ts` — re-export 추가.
- `packages/exporters/package.json` — `@dworks/tree`, `@dworks/tree-renderer` workspace deps + tsx devDep + test 스크립트.

## Decisions Made

- **D-01:** `detectFeatures` 트리 순회는 `children` 필드만 재귀. `CarouselItem`/`TabItem`/`AccordionItem` 은 TreeNode 가 아니므로 (각각 `{id,src,alt,caption?}`, `{id,label,content}`, `{id,title,content,expanded?}` — markdown string content) descend 불필요. 04-01 SUMMARY 의 D-05 와 일관. ModalNode 도 `children` 없이 `title`/`content` 만 가짐.
- **D-02:** `entranceAnimation` 검출은 `node.entranceAnimation !== undefined` — BaseNodeMeta 공통 optional 필드라 모든 TreeNode type 통용 (cast 불필요).
- **D-03:** entrance vanilla JS 가 읽는 attr 은 **`data-dw-entrance`** namespace (NOT `data-entrance-*`). 이유: tree-renderer `render.ts:60-65` 의 `commonAttrs` 가 이미 `data-dw-entrance` / `data-dw-entrance-trigger` / `-duration` / `-delay` 를 emit 함. plan 의 sample 코드는 `data-entrance-animation` 가정이었으나 실제 emit attr 명에 맞추는 게 옳음 (deviation 항목).
- **D-04:** Embla CDN 은 head 에 `defer` script tag, init 은 body 끝 script. `readyState === 'loading'` 분기로 defer 가 DOMContentLoaded 전에 로드되었어도 안전.
- **D-05:** modal backdrop close 는 `getBoundingClientRect` 로 content rect 바깥 클릭 감지. ESC 는 `<dialog>` 네이티브 동작 (별도 핸들러 없음).
- **D-06:** accordion `single` 모드만 toggle 이벤트 핸들러 부착. `multiple` 모드는 네이티브 `<details>` 동작 그대로 (handler 0).
- **D-07:** prefers-reduced-motion 처리 이중화 — JS 가 즉시 final 상태 적용 + CSS `@media (prefers-reduced-motion:reduce)` 가 transition-duration:0.01ms 강제 (방어).
- **D-08:** script 주입 순서: Tabs → Modal → Accordion → Carousel init → Entrance. 가벼운(데이터 attr 토글) 것 → 무거운(애니메이션) 것 순. 모두 IIFE 라 순서 의존 없으나 가독성 차원.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] entranceAnimation vanilla JS 의 selector / attr 명 — plan vs 실제 renderer emit 불일치**

- **Found during:** Task 2 작성 중 (cross-check with tree-renderer/src/render.ts)
- **Issue:** Plan 의 ENTRANCE_ANIMATION_SCRIPT 샘플은 `data-entrance-animation`, `data-entrance-trigger`, `data-entrance-duration`, `data-entrance-delay` 를 querySelectorAll/getAttribute. 그러나 실제 tree-renderer `render.ts:60-65` (`commonAttrs`) 가 emit 하는 attr 은 **`data-dw-entrance`**, **`data-dw-entrance-trigger`**, **`data-dw-entrance-duration`**, **`data-dw-entrance-delay`**. plan 그대로 작성 시 vanilla JS 가 어떤 노드도 매치하지 못해 entrance 동작 0건.
- **Fix:** ENTRANCE_ANIMATION_SCRIPT 의 모든 attr 명을 `data-dw-entrance*` 로 변경.
- **Files modified:** packages/exporters/src/html-scripts.ts (ENTRANCE_ANIMATION_SCRIPT)
- **Verification:** acceptance criteria `prefers-reduced-motion` ≥1 (4건), `IntersectionObserver` ≥1 (5건) 모두 충족. exportTreeToHtml entrance 테스트 (Task 3 test 8) pass.
- **Committed in:** ffd4955

**2. [Rule 1 - Bug] detectFeatures 트리 순회 — 비-TreeNode 필드 descend 시도 제거**

- **Found during:** Task 1 작성 중 (cross-check with packages/tree/src/schema.ts)
- **Issue:** Plan 의 detectFeatures 샘플은 `slides`, `tabs[].content`, `items[].content` 까지 재귀 순회. 그러나 실제 스키마 (schema.ts:578-672) 상 carousel.items 는 `CarouselItem[]` (image data, TreeNode 아님), tabs.items 는 `TabItem[]` (markdown content string), accordion.items 는 `AccordionItem[]` (markdown content string), modal 은 `children` 자체 없음 (title/content string). 따라서 plan 의 재귀 분기는 모두 무용.
- **Fix:** `children` (section/hero/card/list/form 만 보유) 필드만 재귀. visit 시그니처 단순화.
- **Files modified:** packages/exporters/src/html.ts (detectFeatures)
- **Verification:** Task 3 test 1 (4종+entrance 검출) + test 3 (중첩 children 재귀) 모두 pass.
- **Committed in:** 43e6b66

**3. [Rule 3 - Blocking] aria-selected bool → string 변환**

- **Found during:** Task 2 작성 중
- **Issue:** Plan 샘플은 `t.setAttribute('aria-selected', active)` (boolean 직접 전달). DOM API 는 string 만 받으므로 `"true"`/`"false"` 명시 필요 — 일부 브라우저는 boolean 을 빈 문자열로 강제 변환 가능.
- **Fix:** `active ? 'true' : 'false'` 명시.
- **Files modified:** packages/exporters/src/html-scripts.ts (TABS_SCRIPT)
- **Verification:** Task 3 test (tabs-only) pass.
- **Committed in:** ffd4955

**4. [Rule 2 - Critical] entrance load trigger 도 readyState 분기 추가**

- **Found during:** Task 2 작성 중 (resilience check)
- **Issue:** Plan 샘플은 `window.addEventListener('DOMContentLoaded', ...)` 만. 그러나 defer script 가 이미 DOMContentLoaded 이후 실행될 수 있으므로 이벤트가 발화하지 않아 load trigger 노드가 영원히 초기 상태 stuck.
- **Fix:** `readyState === 'loading'` 일 때만 addEventListener, 그 외엔 즉시 `runLoad()` 호출.
- **Files modified:** packages/exporters/src/html-scripts.ts (ENTRANCE_ANIMATION_SCRIPT)
- **Verification:** Task 3 entrance 테스트 pass.
- **Committed in:** ffd4955

**5. [Rule 2 - Critical] options.lang 인자가 buildHead 시그니처에 있으나 미사용 처리**

- **Found during:** Task 1 작성 중 (typecheck noUnusedParameters)
- **Issue:** Plan 의 `buildHead(title, lang, features)` 가 lang 을 받지만 함수 본문에서 사용 안 함 (lang 은 html 태그에 박힘). tsc strict noUnusedParameters 잠재 에러.
- **Fix:** `void lang` 명시 + 향후 lang 별 분기 가능성 주석.
- **Files modified:** packages/exporters/src/html.ts (buildHead)
- **Verification:** typecheck exit 0.
- **Committed in:** 43e6b66

---

**Total deviations:** 5 auto-fixed (Rule 1×2, Rule 2×2, Rule 3×1)
**Impact on plan:** 모든 산출물 의도 100% 달성. 5건 모두 plan 코드 sample 의 실제 코드베이스 미검증 (renderer attr 명 / schema 필드 명 / DOM API 타입) — 04-01 SUMMARY 의 같은 문제(가상 schema 필드)와 동일 카테고리. acceptance criteria + tests + typecheck 전부 통과.

## Issues Encountered

- **READ-BEFORE-EDIT hook** — index.ts / package.json 편집 시 동일 세션 Read 후에도 매번 알림. 작업 흐름에 minor 영향 (실질적으로는 모두 정상 진행).
- **plan 의 Task 1 ↔ Task 2 의존**: html.ts 가 html-scripts.ts 의 export 를 import 하므로 Task 1 단독 typecheck 는 fail. 두 task 사이는 atomic 하게 분리되지 않음 — 실제로는 두 파일 모두 작성 후 Task 1 commit (html.ts) → Task 2 commit (html-scripts.ts) 으로 분할. typecheck 는 Task 2 commit 후에 비로소 통과. plan 작성 시 의존 순서 인지 권장.

## User Setup Required

None - 외부 서비스 설정 없음.

## Known Stubs

없음. 모든 기능 (detectFeatures, exportTreeToHtml, 5개 vanilla JS 템플릿, BASE_CSS) 가 fully wired — 어디서 호출하든 _실제로_ 작동하는 HTML 반환. UI 통합은 04-03 (web adapter) 작업.

## Threat Flags

없음. exporter 는 _server-side static string 생성_ 만 — 사용자 입력 처리 / 네트워크 endpoint / 인증 / DB 접근 없음. `escapeHtml` 로 title/lang/콘텐츠 모두 XSS 방어 적용.

## Next Phase Readiness

- **04-03 (web adapter)** 즉시 시작 가능 — `import { exportTreeToHtml } from '@dworks/exporters'` 가 작동. apps/web 의 download 버튼 핸들러가 Blob + anchor 패턴으로 `.html` 다운로드 가능.
- **EXP-01 / EXP-02 / EXP-03 요구사항 충족**:
  - EXP-01: carousel 노드 검출 시 Embla CDN script + init 자동 주입 + 모든 slide 렌더 (04-01 + 04-02 합작).
  - EXP-02: tabs/accordion/modal 검출 시 vanilla JS wrap 주입 (라이브러리 의존 0).
  - EXP-03: entranceAnimation 노드 검출 시 IntersectionObserver vanilla JS + prefers-reduced-motion 존중 주입.
- 04-03 가 추가로 결정할 것: Pretendard CDN URL 확정, 토큰 시스템 inline CSS 확장 범위 (lite vs full), download 버튼 UX + Korean toast.

## Self-Check: PASSED

**Files:**
- FOUND: packages/exporters/src/html.ts
- FOUND: packages/exporters/src/html-scripts.ts
- FOUND: packages/exporters/src/html.test.ts
- FOUND: packages/exporters/src/index.ts (modified)
- FOUND: packages/exporters/package.json (modified)
- FOUND: .planning/phases/04-export-depth/04-02-SUMMARY.md (이 파일)

**Commits:**
- FOUND: 43e6b66 (feat — Task 1)
- FOUND: ffd4955 (feat — Task 2)
- FOUND: fdf3743 (test — Task 3)

**Acceptance criteria (Task 1):**
- export function exportTreeToHtml: 1 (=1) PASS
- export function detectFeatures: 1 (=1) PASS
- embla-carousel@8.5.0: 1 (=1) PASS
- pretendardvariable: 1 (=1) PASS
- lang ko: 1 (≥1) PASS
- typecheck exit 0 PASS

**Acceptance criteria (Task 2):**
- export const TABS_SCRIPT: 1 (=1) PASS
- export const MODAL_SCRIPT: 1 (=1) PASS
- export const ACCORDION_SCRIPT: 1 (=1) PASS
- export const CAROUSEL_INIT_SCRIPT: 1 (=1) PASS
- export const ENTRANCE_ANIMATION_SCRIPT: 1 (=1) PASS
- export const BASE_CSS: 1 (=1) PASS
- prefers-reduced-motion: 4 (≥1) PASS
- IntersectionObserver: 5 (≥1) PASS
- EmblaCarousel: 2 (≥1) PASS
- typecheck exit 0 PASS

**Acceptance criteria (Task 3):**
- ≥5 tests pass: 9 tests pass PASS
- pnpm --filter @dworks/exporters test exit 0 PASS

**Repo-wide:**
- pnpm -r typecheck exit 0 PASS (18 workspace 모두 통과)

---

*Phase: 04-export-depth*
*Completed: 2026-05-11*
