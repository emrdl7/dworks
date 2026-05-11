---
phase: 02-ai-quality
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - apps/web/src/app/richness.ts
  - apps/web/src/app/generation-normalize.ts
  - apps/web/src/app/image-color.ts
  - packages/llm-prompts/src/index.ts
  - apps/web/src/app/page.tsx
  - apps/web/src/app/fixture-export.ts
  - apps/web/src/app/generation-export.ts
findings:
  critical: 0
  high: 2
  medium: 4
  low: 3
  nit: 2
  total: 11
status: findings_found
---

# Phase 02-ai-quality: Code Review Report

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 7
**Status:** findings_found

## Summary

Phase 2 추가/변경된 normalize/풍부도/이미지 분석 로직 7개 파일을 검토했다. 전반적으로
순수 함수 위주 + 명확한 한국어 주석 + immutable spread 사용 패턴이 일관되게 적용돼
있어 **구조적 안전성은 양호**하다. CRITICAL 한 버그/보안 취약점은 없다.

다만 **AI-05 (ImageReference 신규 필드) 의 propagation 이 두 군데에서 끊긴다** — 다중
이미지 prompt 경로와 export/import roundtrip 에서 `dominantColors` / `layoutIntent` 가
조용히 누락된다. 이는 D-16 (reference_image_analysis inject) 의 _전제 기능_ 이므로
HIGH 로 분류했다.

또한 `inferDomain` regex 가 매트릭스의 6개 도메인(ecommerce/saas/portfolio/event/
education/health) 중 4개만 매핑하고 _portfolio_ 같은 흔한 의도를 `default`(accordion)
로 떨어뜨려 매트릭스 카드의 권고와 충돌한다 — MEDIUM.

나머지는 idempotency 미세 갭, 매직 넘버, 노출되지 않는 API 일관성 nit 이다.

---

## HIGH

### HI-01: 다중 이미지 prompt 에서 `dominantColors` / `layoutIntent` 조용히 드롭

**File:** `packages/llm-prompts/src/index.ts:153-202`
**Issue:**
`formatBriefAsUserPrompt` 가 단일 이미지(`refs.length === 1`) 경로에서만
`<reference_image_analysis>` 블록을 emit 한다(166-180줄). 다중 이미지
(`refs.length > 1`) 경로는 색/비율만 직렬화하고 각 ref 의 `dominantColors`/
`layoutIntent` 를 _전혀 사용하지 않는다_(182-202줄).

UI 는 모든 ref 에 대해 `analyzeDominantColors` + `extractLayoutIntent` 결과를
저장하므로(page.tsx:449-451) — 사용자가 2~3장의 참고 이미지를 올리면 AI-05
신호 전체가 LLM 에 도달하지 않는다. D-16 의 핵심 가치(보조 시그널)가 다중 이미지
케이스에서 무효화된다.

**Fix:**
다중 경로에서 ref 별 또는 merge 된 신호를 동일 블록으로 inject. 예:

```ts
} else if (refs.length > 1) {
  // ... 기존 색/비율 줄들 ...
  const mergedAspect = mergeReferenceAspect(refs)
  // AI-05 — 다중 ref 의 dominantColors 는 첫 ref 또는 모든 ref 합산을 노출.
  // layoutIntent 는 최빈값 또는 첫 ref 값 채택.
  const firstWithAnalysis = refs.find(
    (r) => r.dominantColors !== undefined || r.layoutIntent !== undefined,
  )
  if (firstWithAnalysis !== undefined) {
    lines.push('', `<reference_image_analysis>`)
    if (firstWithAnalysis.dominantColors !== undefined) {
      lines.push(`dominantColors: [${firstWithAnalysis.dominantColors.join(', ')}]`)
    }
    if (firstWithAnalysis.layoutIntent !== undefined) {
      lines.push(`layoutIntent: '${firstWithAnalysis.layoutIntent}'`)
    }
    lines.push(`</reference_image_analysis>`)
  }
}
```

대안: 단일/다중 분기를 떠나 `<reference_image_analysis>` emit 을 외부로 추출한 헬퍼
함수로 단일화.

---

### HI-02: export/import 라운드트립에서 `dominantColors` / `layoutIntent` 드롭

**File:** `apps/web/src/app/generation-export.ts:42-45, 482-511`
**Issue:**
`ExportedImageReference` 인터페이스(42-45줄)와 `validateImageReference`
검증기(482-511줄)가 `dominantColors`/`layoutIntent` 필드를 모르고 있다.
buildExportPayload 는 `source.brief` 를 그대로 spread 하지 않고 type 좁힘이 일어나
`brief: source.brief` 로 통과하지만, **import 단계에서 ImageReference 유효성 검증을
거치면 추가 필드가 제거되어 raw 가 그대로 복원되지 않는다**.

결과: 사용자가 generation 을 .json 으로 export 했다가 import 하면 AI-05 신호가
사라진 채 brief 가 재구성된다. 다음 변형 시도(variantSeed) 에서 prompt 가 약해진다.

같은 문제가 `fixture-export.ts` 에는 적용되지 않는다(fixture 는 brief 를 저장하지 않음).

**Fix:**
```ts
// generation-export.ts
export interface ExportedImageReference {
  colors: string[]
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
  dominantColors?: string[]
  layoutIntent?: 'centered' | 'left-aligned' | 'grid' | 'asymmetric'
}

function validateImageReference(raw: unknown): ExportedImageReference | null {
  // ... 기존 validation ...
  let dominantColors: string[] | undefined
  if (Array.isArray(raw.dominantColors)) {
    const dc: string[] = []
    for (const item of raw.dominantColors) {
      if (typeof item !== 'string') return null
      const lower = item.toLowerCase()
      if (!HEX6_RE.test(lower)) return null
      dc.push(lower)
    }
    if (dc.length > 0) dominantColors = dc
  }
  let layoutIntent: ExportedImageReference['layoutIntent']
  if (raw.layoutIntent !== undefined) {
    if (
      raw.layoutIntent !== 'centered' &&
      raw.layoutIntent !== 'left-aligned' &&
      raw.layoutIntent !== 'grid' &&
      raw.layoutIntent !== 'asymmetric'
    ) {
      return null
    }
    layoutIntent = raw.layoutIntent
  }
  return {
    colors,
    ...(aspectRatio !== undefined ? { aspectRatio } : {}),
    ...(dominantColors !== undefined ? { dominantColors } : {}),
    ...(layoutIntent !== undefined ? { layoutIntent } : {}),
  }
}
```

version 을 bump 할 필요는 없다 — 추가 optional 필드는 forward-compat. 기존 v1 파일은
신규 필드 없이 그대로 통과.

---

## MEDIUM

### ME-01: `inferDomain` 매핑이 매트릭스 6 도메인 중 4 도메인만 커버

**File:** `apps/web/src/app/generation-normalize.ts:104-111`
**Issue:**
`inferDomain` 은 `ecommerce | saas | faq | auth | default` 5개만 반환한다. 그런데
prompt 매트릭스(packages/llm-prompts:1674-1681)는 **e-commerce / SaaS / portfolio /
event / education / health** 6 도메인을 가이드한다.

결과:
- "포트폴리오 사이트", "전시 작품 갤러리" → `default` → accordion (매트릭스는 carousel 권고)
- "컨퍼런스/이벤트" → 'faq' 분기에 "컨퍼런스", "일정" 키워드가 있어 우연히 accordion 맞음 (의도 매핑이 아닌 키워드 운)
- "온라인 강의/교육" → `default` → accordion (매트릭스는 tabs 권고)
- "헬스/웰빙" → `default` → accordion (매트릭스는 accordion+modal 권고 — 우연히 정합)

매트릭스 가이드와 자동 보강 사이의 정합이 깨지면 사용자가 AI-02 보강 결과를
받았을 때 _프롬프트 가이드와 다른 컴포넌트_ 가 들어가 의도와 어긋난다.

**Fix:**
DomainKey 를 매트릭스와 동기화하거나, 최소한 portfolio 매핑 추가:
```ts
export type DomainKey =
  | 'ecommerce' | 'saas' | 'portfolio' | 'event' | 'education' | 'health'
  | 'faq' | 'auth' | 'default'

export function inferDomain(prompt: string): DomainKey {
  const p = prompt.toLowerCase()
  if (/e-?commerce|쇼핑|제품|카탈로그/.test(p)) return 'ecommerce'
  if (/포트폴리오|portfolio|갤러리|작품/.test(p)) return 'portfolio' // → carousel
  if (/컨퍼런스|이벤트|event|스케줄|연사/.test(p)) return 'event' // → accordion
  if (/saas|b2b|dashboard|pricing/.test(p)) return 'saas'
  if (/교육|강의|class|course|커리큘럼/.test(p)) return 'education' // → tabs
  if (/헬스|건강|wellness|health/.test(p)) return 'health' // → accordion
  if (/faq|일정|specs/.test(p)) return 'faq'
  if (/가입|회원|약관/.test(p)) return 'auth'
  return 'default'
}

const DOMAIN_TO_INTERACTIVE: Record<DomainKey, ...> = {
  ecommerce: 'carousel',
  portfolio: 'carousel',
  event: 'accordion',
  saas: 'tabs',
  education: 'tabs',
  health: 'accordion',
  faq: 'accordion',
  auth: 'modal',
  default: 'accordion',
}
```

---

### ME-02: `makeInteractiveNode` 자동 id 가 같은 ms 에서 충돌 가능

**File:** `apps/web/src/app/generation-normalize.ts:174-201`
**Issue:**
```ts
const id = `auto-${type}-${Date.now().toString(36)}`
```
같은 ms tick 에서 두 트리가 normalize 되면(예: 변형 4개 병렬 생성 — page.tsx 의
`successes.map(...)` 1901) 두 노드가 동일 id `auto-tabs-<ms36>` 를 얻을 수 있다.
deduplicateIds 가 동일 _트리_ 내 충돌은 처리하지만, normalize 는 트리 별로 독립
호출되므로 **다른 트리 간 충돌은 dedup 되지 않는다** — 추후 같은 페이지 안에
두 generation 을 merge 하거나, 같은 트리에 enforceRichness 두 번 적용 시(예:
edit 후 재-normalize) 문제 가능.

또한 같은 트리에 enforceRichness 가 두 번 호출돼도(hasAnyInteractive guard 가
있어 실제로는 두 번째 호출에서 추가 안 됨) 안전하지만, 만약 누군가 guard 를 우회한
경로를 추가하면 id 가 같아진다.

**Fix:**
같은 트리 내 unique 카운터 또는 random suffix:
```ts
let counter = 0
function makeInteractiveNode(type: ...): TreeNode {
  counter += 1
  const id = `auto-${type}-${Date.now().toString(36)}-${counter}`
  // ...
}
```
또는 deduplicateIds 를 enforceRichness 후에도 한번 더 호출(단순/안전):
```ts
export function enforceRichness(tree: Tree, prompt: string): Tree {
  // ... 보강 ...
  // 보강된 노드 id 가 기존 트리와 충돌하지 않게 한 번 더 dedup.
  return { ...next, root: deduplicateIds(next.root, new Set<string>()) }
}
```

---

### ME-03: `extractLayoutIntent` 의 cv 계산이 leftRatio/centerRatio early-return 후 도달 — heuristic 순서 의존

**File:** `apps/web/src/app/image-color.ts:160-204`
**Issue:**
heuristic 순서가 `left-aligned (≥ 0.6)` → `centered (≥ 0.6)` → `grid (cv < 0.2)`
순이라 두 조건이 동시 성립하는 이미지에서 left-aligned 가 우선한다. 이건 명확한
설계 의도지만, 다음 두 문제가 있다:

1. **`left-aligned` 가 가장 흔한 분류가 된다**: 4사분면 중 좌측 절반은 픽셀의 50% 를
   차지하는 _기본값_ 이라 colored content 가 약간만 좌측에 쏠려도 0.6 임계를 넘기
   쉽다. (균일 분포 자체가 50% 이므로 임계 0.6 은 비교적 낮다.)
2. **`grid` 임계 cv < 0.2 가 너무 엄격**: 4사분면 평균 = total/4, stdev/mean < 0.2 는
   사분면 차이가 ±20% 이내여야 한다. 실 사진에서 이 정도로 정확히 grid 인 경우는 드물어
   대부분 'asymmetric' 으로 떨어진다.

**Fix:**
임계 조정 또는 분류기 변경. 현재 heuristic 은 의도된 v1 PoC 라 acceptable 하지만,
LLM 신호로 쓰이므로 _대부분 left-aligned_ 라는 편향이 prompt 품질을 떨어뜨릴 수 있다.
권고:

```ts
// 좌측 비율 임계를 더 엄격하게 (true left-aligned 만 잡도록):
if (leftRatio >= 0.7) return 'left-aligned'
// grid 임계 완화:
if (cv < 0.3) return 'grid'
```

또는 분류 우선순위를 centered → grid → left-aligned → asymmetric 으로 바꿔 _중앙
정렬_ 을 먼저 잡는 게 더 자연스럽다 (대부분 hero 이미지는 centered).

---

### ME-04: `enforceRichness` 가 _보강 후 재검증_ 없이 잔여 missing 을 호출 측에 노출하지 않음

**File:** `apps/web/src/app/generation-normalize.ts:88-98`
**Issue:**
`enforceRichness` 가 missing[] 기반 분기 후 단순히 `next` 를 반환한다. 보강 후에도
잔여 missing 이 있을 수 있는데(예: main 컨테이너 자체가 없어 interactive 추가 실패,
section 0 개라 entranceAnimation 0 개) 호출 측 page.tsx:1904 는 잔여 신호를 확인할
수 없다. README/주석에는 _toast 로 사용자에게 안내_ 한다고 적혀 있지만(86줄) 실제
return shape 이 그걸 지원하지 않는다.

**Fix:**
보강 후 재검증 결과를 반환 옵션으로 노출:
```ts
export interface EnforceRichnessResult {
  tree: Tree
  residualMissing: RichnessSignalKey[]
}

export function enforceRichness(
  tree: Tree, prompt: string,
): EnforceRichnessResult {
  // ... 기존 보강 ...
  const after = validateTreeRichness(next)
  return { tree: next, residualMissing: after.missing }
}
```

또는 단순히 normalizeDesignTree return 옆에 보조 정보 hook 을 추가. v1 에선 toast
미구현이지만 API shape 은 잡아 두는 게 안전.

현재 동작에는 버그가 없으므로 MEDIUM — 다음 phase 에서 toast 연결 시 수정해야 함.

---

## LOW

### LO-01: `Math.max(...scores)` 가 큰 fixture 배열에서 stack 한도 초과 가능

**File:** `apps/web/src/app/fixture-export.ts:69-70`, `apps/web/src/app/generation-export.ts:142-145`
**Issue:**
```ts
maxRichness: scores.length > 0 ? Math.max(...scores) : null,
minRichness: scores.length > 0 ? Math.min(...scores) : null,
```
JavaScript `Math.max(...arr)` 는 큰 배열(~10만 이상)에서 V8 stack overflow 가능.
fixture 갯수가 보통 수십개라 실제로는 무해하지만 generation batch export 가 한계
없이 늘어날 가능성이 있으면 `reduce` 가 안전:

**Fix:**
```ts
maxRichness: scores.length > 0 ? scores.reduce((a, b) => Math.max(a, b), -Infinity) : null,
minRichness: scores.length > 0 ? scores.reduce((a, b) => Math.min(a, b), Infinity) : null,
```

v1 규모에선 무해 — LOW.

---

### LO-02: `entranceAnimationSpread` 임계 `6~12` 가 두 곳에서 다르게 정의됨

**File:** `apps/web/src/app/richness.ts:250`, `apps/web/src/app/generation-normalize.ts:284`
**Issue:**
- richness 신호 #13: `animatedCount >= 6 && animatedCount <= 12` (250줄)
- enforce 의 `MAX_ANIMATIONS = 8` (284줄)

8 은 6~12 범위 안에 있어 자동 보강이 _최소 6_ 도달 + _최대 12 미만_ 을 보장하긴
한다. 그러나 보강 _시작_ 트리가 이미 animationcount=11 이면 추가가 없을 때 정상이지만,
누군가 enforce 호출 전에 13개를 박은 트리를 넘기면 _보강 후에도 12 초과_ 라 신호가
여전히 false. enforce 가 _초과분 제거_ 는 하지 않는다.

또한 6 은 임계 _하한_ 인데 enforce 가 최대 8 만 박으므로, 기존 트리에 0 개면 enforce 가
정확히 8개 박아서 통과. 1~5개면 enforce 가 추가로 박을 때 합산이 6~13 사이라 운
좋게 통과/실패가 갈린다.

**Fix:**
의도 명확화:
- `MAX_ANIMATIONS` 를 `TARGET_ANIMATION_MAX` 같은 이름으로
- 기존 animationCount 를 _빼서_ 보강할 양을 동적으로 계산:
  ```ts
  const existing = countExistingAnimations(tree.root)
  const need = Math.max(0, 6 - existing) // 최소 6개 확보
  const cap = Math.min(8, 12 - existing) // 최대 12 미만 유지
  ```

현재 case 에선 실용적 영향이 작아 LOW.

---

### LO-03: 동일 알고리즘이 `apps/web/image-color.ts` 와 `packages/llm-prompts/src/index.ts` 에 _중복 정의_

**File:** `apps/web/src/app/image-color.ts:219-272`, `packages/llm-prompts/src/index.ts:75-128`
**Issue:**
`mergeImageReferenceColors` ≡ `mergeReferenceColors`, `mergeImageReferenceAspect` ≡
`mergeReferenceAspect` 가 알고리즘 동일하게 두 곳에 있다. 주석으로는 의도된 동기화
(llm-prompts side reference) 라 명시했지만, 한 쪽이 수정되면 다른 쪽도 잊지 않고
수정해야 하는 _double-source-of-truth_ 부담이 있다.

**Fix:**
둘 중 하나를 _공통 패키지_(예: `@dworks/llm-prompts`)에서 export 하고 다른 쪽이
import 하도록 단일화. 또는 최소한 _test 가 둘 다 같은 결과를 내는지_ 보장하는
property-test 추가.

v1 에선 의도된 trade-off — LOW.

---

## NIT

### NI-01: `validateExportedFixture` 의 richness 분기가 명시적이지 않음

**File:** `apps/web/src/app/fixture-export.ts:212-215`
**Issue:**
```ts
const richness = validateExportedRichness(raw.richness)
if (richness === null && raw.richness !== undefined && raw.richness !== null) {
  return null
}
```
`raw.richness` 가 `undefined`/`null` 이면 `validateExportedRichness` 가 `null` 을
반환(225-226줄)하지만, 그 null 은 _정상_ 케이스다. 그래서 다시 raw.richness 를 검사해
구분한다. 이 이중 null 의미가 헷갈리고 같은 패턴이 `generation-export.ts:335-344`
에선 `{ ok, value }` shape 으로 풀려 있다. 두 파일 간 패턴 일관성 부족.

**Fix:**
`validateExportedRichness` 도 `{ ok: true; value: RichnessReport | undefined } |
{ ok: false; reason: string }` 로 통일하면 호출 측이 단순해진다.

---

### NI-02: SIGNAL_COUNT 상수가 RICHNESS_SIGNAL_KEYS.length 와 동기화 안 됨

**File:** `apps/web/src/app/richness.ts:45-61`
**Issue:**
```ts
export const RICHNESS_SIGNAL_KEYS: RichnessSignalKey[] = [ ...13개... ]
const SIGNAL_COUNT = 13
```
배열 길이 13 과 상수 13 이 _수기로_ 동기화돼 있다. 누군가 신호 14번을 추가하면 둘 다
바꿔야 한다. RICHNESS_SIGNAL_KEYS.length 를 그대로 쓰는 게 안전.

**Fix:**
```ts
const SIGNAL_COUNT = RICHNESS_SIGNAL_KEYS.length
```
또는 SIGNAL_COUNT 자체를 제거하고 `RICHNESS_SIGNAL_KEYS.length` 를 직접 사용.

---

## 검토 외 양호 사항 (참고)

- `richness.ts` 의 `visit` 트리 traversal 은 O(n) 으로 acceptable. 누적 변수 패턴이
  깔끔.
- `generation-normalize.ts` 의 `deduplicateIds`, `transformNode`, `replaceNode` 가
  모두 immutable spread 로 작성돼 입력 트리 mutation 없음 확인.
- `image-color.ts` 의 RGBA bucket 양자화 `QUANTIZE_STEP = 32` 가 적절. alpha < 128
  스킵 처리가 일관됨(40, 177줄).
- prompt 매트릭스 한국어 문자열에 typo 없고 5요소(색감 + radius + fontWeight +
  entranceAnimation + 권장 인터랙티브) 가 모든 셀에 일관되게 포함.
- `<reference_image_analysis>` 블록 emit 조건 (`refs[0] !== undefined` + 단일
  ref) 자체는 nullable safe.
- `inferDomain` regex 는 한국어/영어 혼합을 잘 처리 — case-insensitive 변환(`p =
  prompt.toLowerCase()`) 후 매칭 (단, 한국어는 대소문자 영향 없음).
- ImageReference 의 `dominantColors`/`layoutIntent` 는 optional 로 잘 분리돼 있어
  legacy persist/import 와 forward-compat.

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
