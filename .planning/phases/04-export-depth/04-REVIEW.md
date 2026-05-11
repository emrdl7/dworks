---
phase: 04-export-depth
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - packages/tree-renderer/src/render.ts
  - packages/exporters/src/html.ts
  - packages/exporters/src/html-scripts.ts
  - packages/exporters/src/html.test.ts
  - apps/web/src/app/html-export.ts
  - apps/web/src/app/page.tsx
findings:
  critical: 2
  warning: 4
  info: 4
  total: 10
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 04 export-depth는 인터랙티브 5종(carousel/tabs/accordion/modal/entranceAnimation)을 vanilla JS + Embla CDN으로 wrap하여 작동하는 HTML 문서로 내보내는 파이프라인을 구현. XSS 방어선(`escapeHtml`)은 견고하며, 트리 순회 기반 feature detection으로 payload 최소화도 적절. IIFE/ES5 호환 패턴도 일관적. 다만 **WAI-ARIA tabs 패턴의 `aria-labelledby` 참조 끊김**과 **`<dialog>` 요소에 CSS 클래스 미부착으로 BASE_CSS 전체 무력화** 등 export 결과물의 접근성·시각 정합성에 영향을 주는 정합성 결함 2건을 Critical로 분류. 나머지는 견고화 권고.

XSS·Script 인젝션 측면에서 vanilla JS 템플릿 내부에 사용자 데이터를 interpolate하는 경로는 없음 — 모든 사용자 입력은 `escapeHtml`을 통과한 후 attr/text로만 들어가고, 스크립트 본체는 정적 문자열. 안전.

## Critical Issues

### CR-01: tabs aria-labelledby 참조가 존재하지 않는 id를 가리킴 — 스크린 리더에서 panel 라벨 손실 (WCAG 2.1 AA 위반)

**File:** `packages/tree-renderer/src/render.ts:241`
**Issue:** `renderTabs`에서 panel은 `aria-labelledby="tab-${it.id}"`를 지정하지만 (line 241), trigger 버튼에는 대응하는 `id="tab-${it.id}"` attr이 박히지 않는다 (line 218-227 trigger attrs 목록 확인). 결과적으로 export된 HTML의 panel은 *존재하지 않는 element*를 labelledby로 가리키게 되어, 스크린 리더가 panel의 "이름"을 결정할 수 없다. WAI-ARIA Authoring Practices의 tabs 패턴 필수 요구사항을 위반하며, CLAUDE.md WCAG 2.1 AA 정책("인터랙티브 요소에 aria-label 또는 텍스트 레이블 필수")에도 어긋난다.
**Fix:** trigger 버튼 attrs에 `id: 'tab-${it.id}'`를 추가:
```ts
return `<button${attrs([
  ['type', 'button'],
  ['class', 'dw-tabs__trigger'],
  ['role', 'tab'],
  ['id', `tab-${it.id}`],            // 추가
  ['data-dworks-tab-trigger', ''],
  ['data-tab-id', it.id],
  ['aria-controls', `panel-${it.id}`],
  ['aria-selected', isActive ? 'true' : 'false'],
  ['tabindex', isActive ? '0' : '-1'],
])}>${escapeHtml(it.label)}</button>`
```

### CR-02: `<dialog>` 에 `dw-modal` 클래스 미부착 — BASE_CSS의 modal 스타일(.dw-modal, .dw-modal[open] 애니메이션, ::backdrop) 전체 무력

**File:** `packages/tree-renderer/src/render.ts:187`
**Issue:** `renderModal`이 `<dialog>` 를 렌더할 때 `commonAttrs(node)`만 호출하므로 `class`는 `node.styleTokens`에서 파생된 `t-*` 클래스뿐이고, BASE_CSS가 의존하는 `dw-modal` 클래스는 박히지 않는다. 그 결과 `packages/exporters/src/html-scripts.ts:187-190` 의 다음 CSS 규칙이 모두 적용되지 않음:
```css
.dw-modal{border:0;padding:0;background:transparent}
.dw-modal[open]{animation:dwModalIn 200ms ease both}
.dw-modal::backdrop{background:rgba(0,0,0,0.5)}
```
브라우저 기본값(흰 border, 검은 background, 반투명 backdrop 없음)이 적용되어 의도된 모달 시각이 무너지며, modal entrance animation도 동작하지 않는다. accordion(`class="dw-accordion__item"`), carousel(`class="dw-carousel"`), tabs(`class="dw-tabs"`)은 모두 클래스를 직접 박지만 modal만 누락. 일관성 결함이자 시각 회귀.
**Fix:** `<dialog>` 태그에 `class="dw-modal"` 명시(`commonAttrs`의 styleTokens 기반 class와 병합 필요):
```ts
// renderModal 마지막 return 부분
return `${triggerButton}<dialog${commonAttrs(node)}${open} class="dw-modal" data-dworks-modal${attrs([['id', node.id], ['data-dw-modal-size', node.size ?? 'md']])}>${titleHtml}${contentHtml}${actionsHtml}${closeButton}</dialog>`
```
다만 `commonAttrs`가 이미 `class` attr을 생성할 수 있으므로(`styleTokens`이 있을 때), HTML에 `class` 가 중복 출력되지 않도록 `commonAttrs` 내부에서 styleTokens class 와 컴포넌트 class를 함께 받아 단일 `class` attr로 합치는 보다 견고한 구조를 권장. 예시:
```ts
function commonAttrs(node: TreeNode, extraClasses?: string[]): string {
  const tokenCls = classFromTokens(node.styleTokens)
  const merged = [tokenCls, ...(extraClasses ?? [])].filter(Boolean).join(' ') || undefined
  // attrs([...['class', merged], ...])
}
```
또는 임시로 `class="dw-modal ${classFromTokens(...) ?? ''}"` 직접 박기.

## Warnings

### WR-01: tabs/modal id 접두사(`panel-`, `tab-`)와 사용자 정의 `node.id` 결합 시 DOM id 중복/충돌 위험

**File:** `packages/tree-renderer/src/render.ts:240, 224`
**Issue:** `id="panel-${it.id}"` / `aria-controls="panel-${it.id}"` / `id="tab-${it.id}"` 모두 사용자가 생성한 item id를 단순 prepend. 하나의 export 문서 안에 여러 tabs 노드가 있고 그 items에 충돌하는 id 가 있을 경우 DOM id 중복 발생(HTML 스펙 위반, 스크린 리더 라벨 혼선). 또한 item id가 HTML id로 부적합한 문자(공백, `<`, `&` 등)를 포함할 가능성을 막는 가드가 없음. CR-01 fix 시 `id` attr이 추가되면 위험도 증가.
**Fix:** `panel-` / `tab-` 접두사에 tabs 노드 자체의 `node.id`도 끼워 globally-unique 보장:
```ts
const prefix = node.id
// triggers
['id', `${prefix}-tab-${it.id}`],
['aria-controls', `${prefix}-panel-${it.id}`],
// panels
['id', `${prefix}-panel-${it.id}`],
['aria-labelledby', `${prefix}-tab-${it.id}`],
```
추가로 item id sanitize(`replace(/[^a-zA-Z0-9_-]/g, '-')`)도 권장 — 스키마 검증이 영문/숫자/하이픈만 허용한다면 생략 가능.

### WR-02: modal backdrop click 판정이 transform 적용 dialog에서 오작동 — 진입 애니메이션 중 클릭 시 false positive

**File:** `packages/exporters/src/html-scripts.ts:67-72`
**Issue:** `MODAL_SCRIPT`의 backdrop click 핸들러가 `dialog.getBoundingClientRect()` 와 클릭 좌표를 비교해 inside/outside를 판단하는데, `dwModalIn` keyframe(`from{opacity:0;transform:scale(0.95)}to{transform:scale(1)}`)이 진행 중인 200ms 동안 rect 가 축소되어 사용자가 "안쪽"이라고 인식한 픽셀이 outside 판정될 수 있다. 또한 dialog 내부 텍스트 selection 후 outside drag-release 시 click 이벤트가 dialog 에 발생하면 의도와 다른 close가 발생한다(원본 이벤트 e.target 검사 누락). CR-02 fix 시 애니메이션이 활성화되면 더 두드러짐.
**Fix:** `e.target === dialog` 검사로 단순화 — `<dialog>` 의 backdrop click 은 target 이 dialog 자기 자신으로 잡힌다:
```js
dialog.addEventListener('click', function(e){
  if (e.target === dialog) dialog.close();
});
```
이 패턴이 modern 브라우저(`<dialog>` 지원 = backdrop click target 동작 일관)에서 표준이며 rect 계산 불필요. ESC 키 닫기는 네이티브 동작으로 유지됨.

### WR-03: Embla CDN script에 SRI(Subresource Integrity) 해시 미부착 — 공급망 위협에 무방비

**File:** `packages/exporters/src/html.ts:35, 105`
**Issue:** `EMBLA_CDN = 'https://unpkg.com/embla-carousel@8.5.0/embla-carousel.umd.js'` 를 `<script src="..." defer>` 로 직접 로드. unpkg 또는 패키지 owner 가 침해될 경우 export 된 HTML 사용자는 임의 JS 를 실행하게 됨. SRI 해시 부착 시 변조된 응답을 브라우저가 거부. Pretendard CDN(html.ts:38)도 동일 문제.
**Fix:** Embla 8.5.0 의 SRI 해시를 빌드 시 생성/캐싱해 `integrity` + `crossorigin="anonymous"` 부착:
```ts
parts.push(`<script src="${EMBLA_CDN}" integrity="sha384-..." crossorigin="anonymous" defer></script>`)
```
또는 export 옵션으로 `useCdn: false` 선택지를 제공해 Embla 코드를 inline bundle 하는 경로도 고려(payload 증가 trade-off). Phase 5+ TODO 로 분리 가능하나, Critical 까진 아니어도 export 결과물 신뢰성에 직결되므로 우선 처리 권장.

### WR-04: `entrance` 스크립트가 `prefersReduced` 분기에서 `applyInitial` 만 호출 — 의도와 다르게 opacity:1 + transform:none 으로 즉시 표시

**File:** `packages/exporters/src/html-scripts.ts:148`
**Issue:** 코드는 의도대로 동작하지만(`prefersReduced` 분기 안의 `applyInitial`이 `el.style.opacity='1'; el.style.transform='none'`을 박음) 함수 이름이 _initial_ 인데 실제로는 _final 상태_ 를 적용하는 셈이라 가독성·유지보수성 함정. 향후 `applyInitial` 호출부를 다른 곳에 추가할 때 `prefersReduced` 가드 누락으로 회귀 발생 가능.
**Fix:** `applyInitial` 내부의 prefersReduced 분기를 제거하고, prefersReduced 가지에서는 `applyFinal` 을 직접 호출해 의미 일관성 확보:
```js
function applyInitial(el){
  el.style.opacity = '0';
  var t = TYPE_TO_INITIAL[el.getAttribute('data-dw-entrance') || 'fade-in'];
  if (t) el.style.transform = t;
}
// ...
if (prefersReduced) { nodes.forEach(function(el){ applyFinal(el); }); return; }
```
또는 함수명을 `applyEntranceState(el, phase)` 로 변경. CSS의 `prefers-reduced-motion` 미디어 쿼리(line 204)가 transition-duration:0.01ms 로 강제하므로 사실상 즉시 적용되긴 함 — 가독성 위주 권장.

## Info

### IN-01: 키보드 tabs 네비게이션이 Home/End 키 미지원 — WAI-ARIA APG 권장 사항 부분 미충족

**File:** `packages/exporters/src/html-scripts.ts:33-42`
**Issue:** TABS_SCRIPT가 ArrowLeft/ArrowRight 만 처리. WAI-ARIA Authoring Practices의 tabs pattern은 Home(첫 tab)/End(마지막 tab)도 권장(필수는 아님). 한국어 사용자 대상 권장사항.
**Fix:**
```js
if (e.key === 'Home') { var first = triggers[0]; first.focus(); activate(first.getAttribute('data-tab-id')); }
if (e.key === 'End') { var last = triggers[triggers.length-1]; last.focus(); activate(last.getAttribute('data-tab-id')); }
```

### IN-02: `html.ts:buildHead`의 `void lang` 패턴 — 미사용 인자 시그니처 유지 의도가 주석으로 설명되어 있으나 향후 dead code 오해 소지

**File:** `packages/exporters/src/html.ts:96`
**Issue:** `void lang` 으로 unused-vars 경고 우회. 의도는 명확하지만 typescript의 `_lang` prefix convention 또는 옵션 객체로 변경하면 더 안전.
**Fix:**
```ts
function buildHead(title: string, _lang: string, features: ExportFeatures): string {
  // 향후 lang 별 font fallback 가능성에 대비해 시그니처 유지.
```

### IN-03: `html-export.ts:buildHtmlFilename` 의 sanitize 가 빈 label과 sanitize 결과 빈 label 을 다르게 fallback

**File:** `apps/web/src/app/html-export.ts:26`
**Issue:** `safeLabel.length > 0 ? '-${safeLabel}' : '-export'` — sanitize 후 빈 문자열일 때만 '-export' 가 적용되는데, 원본 label이 ' ' 같은 공백문자뿐이면 sanitize 후 비어 '-export'로 잘 fallback 됨. 다만 sanitize 가 hyphen 연속 압축(`/-+/g, '-'`)만 하고 _leading/trailing hyphen_ 은 제거하지 않아 `dworks-generation-{stamp}--export` 같은 이중-하이픈 파일명 가능성. 운영상 문제는 없으나 미관 결함.
**Fix:**
```ts
const safeLabel = label
  .replace(/[^a-zA-Z0-9가-힣\-_]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')   // leading/trailing hyphen 제거
  .slice(0, 40)
```

### IN-04: vanilla JS 템플릿이 IIFE 안에서 `var` 만 사용하지만 `Array.prototype.forEach`/`document.querySelectorAll`/`requestAnimationFrame`/`matchMedia`/`IntersectionObserver` 의존 — 매우 오래된 브라우저(IE11 등) 대응 안 됨

**File:** `packages/exporters/src/html-scripts.ts:14-176`
**Issue:** ES5 syntax(var/function)는 의도적이지만 사용된 API들은 IE11에서 polyfill 없이 동작 안 함(`IntersectionObserver` 자체는 IE 전체 미지원, IE11은 `matchMedia` 제한적). IE11 지원이 명시적 비범위라면 무시 가능. CONTEXT 문서에서 명확화 권장.
**Fix:** 결정 사항이라면 그대로 두고 `04-CONTEXT.md` 또는 README 에 "지원 브라우저: 모던 evergreen 브라우저 (ES5 syntax 준수는 transpile 비용 절감용)" 명시.

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
