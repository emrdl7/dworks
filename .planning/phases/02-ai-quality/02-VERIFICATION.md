---
phase: 02-ai-quality
verified: 2026-05-11T06:30:00Z
status: gaps_found
score: 3/5 must-haves verified
overrides_applied: 1
overrides:
  - must_have: "AI-05 참조 이미지 dominantColors + layoutIntent 추출 + prompt 전달 (multi-ref aggregation)"
    reason: "Plan 02-03 의 single-ref-only <reference_image_analysis> inject (multi-ref aggregation deferred) 는 의도된 축소 — 1차 사용자 시나리오가 단일 ref 이므로 인지된 트레이드오프"
    accepted_by: "user (verification context note)"
    accepted_at: "2026-05-11T06:30:00Z"
gaps:
  - truth: "AI-01/AI-02/AI-03: generation-normalize 의 enforceRichness 가 production 코드 경로에서 호출됨"
    status: failed
    reason: "page.tsx:1878 에서 normalizeDesignTree(success.tree) 가 prompt 옵션 없이 호출됨 — generation-normalize.ts:78 `if (context.prompt === undefined) return intermediate` 로 enforceRichness 가 항상 skip 됨. AI-01 자동 보강, AI-02 interactive 자동 추가, AI-03 entranceAnimation 자동 박기 모두 런타임에 실행되지 않음. 트리는 dedup + root section wrap 만 거침."
    artifacts:
      - path: "apps/web/src/app/page.tsx"
        issue: "line 1878 `normalizeDesignTree(success.tree)` 가 brief.intent (또는 submitted.intent) 를 prompt 로 전달하지 않음"
    missing:
      - "page.tsx 의 normalizeDesignTree 호출에 `{ prompt: submitted.intent }` (또는 brief 전체 text 추출 helper) 전달"
      - "다중 변형 생성 루프에서 각 variant 의 brief.intent 를 사용하도록 wiring"
      - "통합 테스트: 'intent prompt 가 있을 때 LLM 응답이 interactive 0개 → 1개 자동 추가됨' 같은 E2E 시나리오 (optional but recommended)"
  - truth: "AI-05: 참조 이미지에서 dominantColors + layoutIntent 추출 → ImageReference 채움 → prompt 에 전달"
    status: failed
    reason: "image-color.ts 에 analyzeDominantColors / extractLayoutIntent 함수 + llm-prompts 의 <reference_image_analysis> inject 블록은 모두 구현됨. 그러나 page.tsx:432 의 이미지 처리 파이프라인은 기존 extractDominantColors(5색 hex) + pickAspectRatio 만 호출 — 신규 analyzeDominantColors / extractLayoutIntent 는 어디서도 호출되지 않음 (grep 결과 caller 0). 그 결과 ImageReference.dominantColors / layoutIntent 는 항상 undefined → inject 블록 (line 166 if 분기) 진입 안 됨 → prompt 에 절대 도달 안 함. ROADMAP SC#5 '추출해 prompt에 전달' 의 _전달_ 단계가 끊김."
    artifacts:
      - path: "apps/web/src/app/page.tsx"
        issue: "line 432 분기 (canvas → imageData → 색 추출) 가 analyzeDominantColors / extractLayoutIntent 미사용, return 객체에 dominantColors/layoutIntent 미포함"
      - path: "packages/llm-prompts/src/index.ts"
        issue: "line 166 inject 분기는 잘 작성됐으나 입력 데이터가 영원히 undefined 라 dead code"
    missing:
      - "page.tsx 이미지 처리 helper 가 analyzeDominantColors(imageData, 5) + extractLayoutIntent(imageData) 호출"
      - "반환 객체에 dominantColors (또는 hexes + classifications) + layoutIntent 추가"
      - "ImageReferenceSeed → ImageReference 매핑 시 신규 필드 propagate"
      - "통합 테스트: ImageReference 가 dominantColors 가지면 formatBriefAsUserPrompt 가 <reference_image_analysis> 블록을 string 에 포함하는지 assertion"
deferred: []
---

# Phase 2: AI 생성 품질 자동 검증 Verification Report

**Phase Goal:** prompt에 박힌 13 신호가 _자동 enforce_되도록 — generation 후 validator + 자동 보강 + 도메인×톤 매트릭스 확장 + 참조 이미지 활용 강화.
**Verified:** 2026-05-11T06:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP Success Criterion) | Status | Evidence |
|---|---|---|---|
| 1 | generation-normalize 에 13 신호 검증 모듈 — 미달 신호 발견 시 사용자에게 표시 + 자동 보강 trigger (AI-01) | PARTIAL | richness.ts:263 `validateTreeRichness` export + missing[] 반환 / generation-normalize.ts:88 `enforceRichness` orchestrator 구현. 그러나 page.tsx:1878 의 호출이 prompt 인자 미전달로 enforceRichness 항상 skip — 자동 보강이 production 에서 동작 안 함. |
| 2 | 인터랙티브 컴포넌트 0개 출력 — 자동으로 도메인-적합 1개 추가 (e-commerce → carousel, SaaS → tabs 등) (AI-02) | PARTIAL | generation-normalize.ts:252 `ensureInteractiveComponent` + DOMAIN_TO_INTERACTIVE 5종 매핑 (ecommerce→carousel, saas→tabs, faq→accordion, auth→modal, default→accordion) + inferDomain regex 정확. 테스트 3 pass. 그러나 truth #1 과 동일하게 prompt 미전달로 production 미실행. |
| 3 | entranceAnimation 가진 노드 < 6개 — hero.title slide-up + features cards staggered 자동 박기 (AI-03) | PARTIAL | generation-normalize.ts:356 `ensureEntranceAnimations` D-09 3단계 우선순위 (hero.title slide-up 700 load → cards staggered slide-up 600 scroll → final fade-in 500), MAX_ANIMATIONS=8, STAGGER_DELAY_MS=150, D-10 idempotent guard. 테스트 3 pass. 그러나 truth #1 과 동일하게 prompt 미전달로 production 미실행. |
| 4 | prompt 에 도메인×톤 매트릭스 표 추가 (AI-04) | VERIFIED | llm-prompts/src/index.ts:1668 `## 도메인 × 톤 매트릭스` 섹션 + 6×5=30 셀 markdown table, 13 신호 자체 점검(1650) ⟶ 매트릭스(1668) ⟶ 답변 매핑(1685) 순서 정확. 각 셀에 color/radius/fontWeight/entranceAnimation/권장 인터랙티브 5요소 일관 포함. |
| 5 | 참조 이미지에서 dominant color 5색 + 레이아웃 의도 추출해 prompt 에 전달 (AI-05) | PARTIAL | image-color.ts:116 `analyzeDominantColors` + image-color.ts:160 `extractLayoutIntent` 두 신규 함수 + 5 tests pass. llm-prompts ImageReference 에 dominantColors/layoutIntent 옵셔널 필드 + <reference_image_analysis> inject 블록 구현. 그러나 page.tsx 이미지 처리 (line 432) 가 신규 함수를 _호출하지 않음_ → ImageReference 신규 필드 영원히 undefined → inject 블록 dead code. (multi-ref aggregation 부분만 override 로 수용; upstream 호출 누락은 별개 gap.) |

**Score:** 1/5 fully verified, 4/5 partially verified (코드 자체는 존재 + 테스트 pass — 통합 wiring 결락). 1 override applied (multi-ref aggregation 의 deferred 결정).

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `apps/web/src/app/richness.ts` | 13 신호 + validateTreeRichness | VERIFIED | 13 signal keys (line 45-59), SIGNAL_COUNT=13 (line 61), validateTreeRichness export (line 263) returns {signals, score, missing[]} |
| `apps/web/src/app/richness.test.ts` | 5 신호 테스트 + validateTreeRichness 테스트 | VERIFIED | 11 tests pass, includes #9-#13 + bare(missing=13) + full(missing=0) |
| `apps/web/src/app/generation-normalize.ts` | enforceRichness orchestrator + inferDomain + ensureInteractive + ensureEntranceAnimations | VERIFIED (level 1-3) / HOLLOW (level 4) | 모든 export 존재 + 테스트 pass + tsc 통과. page.tsx 가 import 하지만 prompt 옵션 미전달 → enforceRichness 코드 경로 unreachable in production. |
| `apps/web/src/app/generation-normalize.test.ts` | 6 신규 it (3 interactive + 3 animation) | VERIFIED | 11/11 pass — interactive 3 + animation 3 + 기존 5 |
| `apps/web/src/app/image-color.ts` | analyzeDominantColors + extractLayoutIntent + LayoutIntent + DominantColorsAnalysis | VERIFIED (level 1-3) / HOLLOW (level 4) | 4 export 존재 (line 105-204) + tests pass. 그러나 production caller 0 — page.tsx 의 이미지 처리는 신규 함수 미사용. |
| `apps/web/src/app/image-color.test.ts` | analyze + 4 layout intent 테스트 | VERIFIED | 23/23 pass (5 신규 + 18 기존) |
| `packages/llm-prompts/src/index.ts` | 도메인×톤 6×5 매트릭스 + ImageReference 2 옵셔널 필드 + <reference_image_analysis> inject + LayoutIntent type | VERIFIED (level 1-3) / PARTIAL (level 4) | 매트릭스 30 셀 (line 1668-1681), ImageReference 확장 (line 28-37), LayoutIntent type (line 17-22), inject 블록 (line 164-180). 매트릭스 는 LLM 가이드 (시스템 prompt 정적 텍스트 — 항상 활성). 그러나 inject 블록은 dominantColors/layoutIntent 가 production 에서 영원히 undefined 라 dead. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| richness.ts | generation-normalize.ts enforceRichness | import + validateTreeRichness 호출 | WIRED | generation-normalize.ts:17 import, line 89 호출 |
| generation-normalize.ts normalizeDesignTree | page.tsx (production caller) | import + 호출 | PARTIAL | import 존재 (page.tsx:166), 호출 존재 (line 1878), 그러나 `{ prompt }` 인자 미전달 → enforceRichness branch (line 78) 즉시 early return. truth #1-3 의 production wiring 끊김. |
| image-color.ts analyzeDominantColors | page.tsx (canvas 처리) | (예상) processImageReference helper 안에서 호출 | NOT_WIRED | grep -rn analyzeDominantColors apps/web/src 결과 image-color.ts/test 외 0건. page.tsx:432 가 여전히 구버전 extractDominantColors만 사용. |
| image-color.ts extractLayoutIntent | page.tsx (canvas 처리) | (예상) processImageReference helper 안에서 호출 | NOT_WIRED | grep 결과 image-color.ts/test 외 0건. |
| ImageReference.dominantColors/layoutIntent | formatBriefAsUserPrompt <reference_image_analysis> inject | line 164-180 if 분기 | PARTIAL | 코드는 정확. 그러나 upstream 에서 필드를 채우지 않으므로 if 분기 항상 false → 출력에 inject 블록 영원히 없음. |
| 매트릭스 30 셀 | LLM system prompt | template literal 정적 텍스트 | WIRED | line 1668-1681 system prompt 일부 — 매 호출 LLM 에 송출. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `enforceRichness` | `context.prompt` | page.tsx:1878 호출 인자 | NO — 호출 측이 prompt 옵션 미전달 | HOLLOW (도달 불가) |
| `<reference_image_analysis>` inject | `ref.dominantColors`, `ref.layoutIntent` | page.tsx canvas 처리 helper (line ~420-436) | NO — analyzeDominantColors/extractLayoutIntent 미호출, return 객체에 신규 필드 없음 | HOLLOW (값 없음) |
| 매트릭스 30 셀 | (정적 텍스트) | template literal 자체 | YES — 매 LLM 호출 자동 포함 | FLOWING |
| validateTreeRichness | tree | enforceRichness 가 generation-normalize 안에서 호출 (test 경로) | YES (테스트) / NO (production은 enforceRichness 미실행) | FLOWING in test, HOLLOW in production |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| richness.test.ts 통과 | `pnpm --filter @dworks/web exec node --import tsx --test src/app/richness.test.ts` | 11/11 pass | PASS |
| generation-normalize.test.ts 통과 | `pnpm --filter @dworks/web exec node --import tsx --test src/app/generation-normalize.test.ts` | 11/11 pass | PASS |
| image-color.test.ts 통과 | `pnpm --filter @dworks/web exec node --import tsx --test src/app/image-color.test.ts` | 23/23 pass | PASS |
| web 패키지 tsc | `pnpm --filter @dworks/web exec tsc --noEmit` | exit 0 | PASS |
| llm-prompts 패키지 tsc | `pnpm --filter @dworks/llm-prompts exec tsc --noEmit` | exit 0 | PASS |
| 매트릭스 셀 30개 grep | `grep -cE "^\| (e-commerce\|SaaS\|portfolio\|event\|education\|health) " index.ts` | 6 (도메인 행) | PASS |
| 매트릭스 섹션 순서 | `awk` 13신호(1650) < 매트릭스(1668) < 스타일매핑(1685) | true | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| AI-01 | 02-01, 02-04 | 13 신호 자동 enforce — validator + 자동 보강 | BLOCKED | validator (richness.ts) + 자동 보강 hook (generation-normalize.ts enforceRichness) 둘 다 구현. production wiring 결락 (page.tsx 의 호출이 prompt 인자 안 줌) — 사용자 화면에서 보강 일어나지 않음. |
| AI-02 | 02-04 | 인터랙티브 컴포넌트 자동 추가 | BLOCKED | ensureInteractiveComponent + 5 도메인 매핑 구현. 위와 동일 — production 진입 없음. |
| AI-03 | 02-04 | entranceAnimation 자동 박기 | BLOCKED | ensureEntranceAnimations + D-09 우선순위 3단계 구현. 위와 동일 — production 진입 없음. |
| AI-04 | 02-02 | 도메인×톤 매트릭스 | SATISFIED | system prompt 정적 섹션 — 매 LLM 호출 자동 송출. 매트릭스 30 셀 완성. |
| AI-05 | 02-03 | 참조 이미지 5색 + 레이아웃 의도 → prompt | BLOCKED | image-color 함수 + ImageReference 필드 + prompt inject 블록 모두 구현. 그러나 page.tsx 이미지 처리 helper 가 신규 함수 미호출 — 데이터 파이프라인 끊김. (multi-ref aggregation 의 deferred 결정은 override 로 수용.) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `apps/web/src/app/page.tsx` | 1878 | `normalizeDesignTree(success.tree)` 가 prompt 옵션 미전달 → enforceRichness skip | Blocker | AI-01/AI-02/AI-03 의 자동 보강이 production 에서 미실행 |
| `apps/web/src/app/page.tsx` | 432 | canvas 처리 helper 가 신규 analyzeDominantColors/extractLayoutIntent 미호출 | Blocker | AI-05 의 dominantColors/layoutIntent 데이터 파이프라인 끊김 |

자동 분류된 stub 패턴 검사 결과 — 신규 구현 함수 자체에는 placeholder/TODO/FIXME 없음. 모든 함수가 substantive (실제 측정/변환 로직). Anti-pattern 은 _호출 측의 데이터 전달 누락_ 1종.

### Gaps Summary

Phase 2 의 4 개 Plan 은 모두 _신규 코드를 생산_ 했고 (richness 5 신호, validateTreeRichness, 매트릭스 30 셀, image-color 2 함수, enforceRichness orchestrator + 2 sub-routine, ImageReference 2 필드, <reference_image_analysis> inject 블록), 각 plan 단위 테스트 45+ 개가 모두 pass 한다. tsc strict 도 통과한다.

그러나 _production 데이터 파이프라인_ 측면에서 두 개의 wiring gap 이 있다:

**Gap 1 (AI-01/AI-02/AI-03 통합 wiring):** `enforceRichness` 는 `normalizeDesignTree(tree, { prompt })` 형태로 호출돼야 활성화되도록 backward-compat 설계됐다. 그러나 production 유일 호출 지점인 `apps/web/src/app/page.tsx:1878` 은 prompt 옵션 없이 `normalizeDesignTree(success.tree)` 만 호출한다. `submitted.intent` 가 그 함수 안에서 사용 가능함에도 인자 전달이 누락 — 결과적으로 사용자가 LLM 으로 트리 생성할 때 _보강 hook 이 한 번도 실행되지 않는다_. 자동 interactive 추가 / entranceAnimation 박기는 코드/테스트로만 살아있는 _시연용 기능_ 상태.

**Gap 2 (AI-05 통합 wiring):** `analyzeDominantColors` + `extractLayoutIntent` 는 image-color.ts 에 깔끔하게 구현됐고, llm-prompts 의 `<reference_image_analysis>` inject 블록은 ImageReference.dominantColors / layoutIntent 가 truthy 일 때 prompt 에 추가하도록 잘 짜여있다. 그러나 사용자 업로드 이미지 처리 helper (page.tsx:432) 는 여전히 구버전 `extractDominantColors` 만 호출하고, return 객체에 `dominantColors`/`layoutIntent` 필드를 채우지 않는다. 그 결과 inject 블록의 `if (ref.dominantColors !== undefined || ref.layoutIntent !== undefined)` 분기는 영원히 false — prompt 에 `<reference_image_analysis>` 가 한 번도 송출되지 않는다. ROADMAP SC#5 의 _"추출해 prompt 에 전달"_ 마지막 단계가 끊긴 상태.

두 gap 모두 _2~10 줄 짜리 wiring 수정_ 으로 해소 가능 — 코드 자체는 모두 갖춰져 있음. 별도 Plan 02-05 (또는 hotfix wave) 로 후속 처리 권장.

Phase 2 의 본질적 가치 (LLM 가이드 + validator + 보강 로직 + 매트릭스 + image 분석 함수) 는 모두 코드에 안착했고, 도메인×톤 매트릭스 (AI-04) 는 정적 prompt 텍스트라 _자동으로_ 다음 LLM 호출부터 효과를 낸다. 따라서 Phase 2 의 "AI 품질 도구 기반 구축" 측면은 통과한 것으로 볼 수 있으나, ROADMAP 의 _자동 enforce_ 라는 동작 측면의 약속은 wiring gap 으로 production 에 도달하지 못한 상태다.

---

_Verified: 2026-05-11T06:30:00Z_
_Verifier: Claude (gsd-verifier)_
