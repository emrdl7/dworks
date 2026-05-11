---
phase: 02-ai-quality
verified: 2026-05-11T07:15:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 1
overrides:
  - must_have: "AI-05 참조 이미지 dominantColors + layoutIntent 추출 + prompt 전달 (multi-ref aggregation)"
    reason: "Plan 02-03 의 single-ref-only <reference_image_analysis> inject (multi-ref aggregation deferred) 는 의도된 축소 — 1차 사용자 시나리오가 단일 ref 이므로 인지된 트레이드오프"
    accepted_by: "user (verification context note)"
    accepted_at: "2026-05-11T06:30:00Z"
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "AI-01/AI-02/AI-03: page.tsx:1904 normalizeDesignTree 호출이 { prompt: submitted.intent } 전달 — enforceRichness branch 도달"
    - "AI-05: page.tsx extractFromDataUrl 가 analyzeDominantColors + extractLayoutIntent 호출, 결과를 ImageReferenceSeed.dominantColors / layoutIntent 로 propagate"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "dev server 띄우고 intent 가 있는 brief 로 LLM 호출 → response tree 에 interactive 컴포넌트 0개일 때 enforceRichness 가 도메인-적합 1개 자동 추가하는지 확인"
    expected: "ecommerce 도메인 intent → carousel / SaaS → tabs / FAQ → accordion 자동 박힘. entranceAnimation 노드 ≥6"
    why_human: "실제 LLM 응답 + tree 구조 + 사용자 화면 렌더링 결과는 단위 테스트 범위 외 (E2E 수준의 통합 동작)"
  - test: "dev server 띄우고 참조 이미지 업로드 후 brief 제출 → network 탭에서 LLM user prompt payload 에 <reference_image_analysis> 블록이 포함되는지 확인"
    expected: "user prompt 문자열에 'dominantColors: [...]' + 'layoutIntent: ...' 라인이 포함됨. 그 결과 LLM 응답 트리의 색 / 정렬이 이미지에 부합"
    why_human: "실제 LLM 송출 payload 는 dev tools network 탭 spot-check 필요 — 단위 테스트는 구조적 호환성만 검증"
---

# Phase 2: AI 생성 품질 자동 검증 Verification Report

**Phase Goal:** prompt에 박힌 13 신호가 _자동 enforce_되도록 — generation 후 validator + 자동 보강 + 도메인×톤 매트릭스 확장 + 참조 이미지 활용 강화.
**Verified:** 2026-05-11T07:15:00Z
**Status:** human_needed
**Re-verification:** Yes — after Plan 02-05 gap closure (initial verification: 2026-05-11T06:30:00Z, score 3/5)

## Re-verification Summary

이전 verification (2026-05-11T06:30) 에서 두 production wiring gap 으로 status: gaps_found / score: 3/5 였음.

Plan 02-05 (2 task, 2 commit, page.tsx 1 파일 수정) 후 _두 gap 모두 closed_ 확인:

1. **Gap 1 closed** — `apps/web/src/app/page.tsx:1904` 이 `normalizeDesignTree(success.tree, { prompt: submitted.intent })` 호출 (이전 `normalizeDesignTree(success.tree)` — prompt 미전달). `submitted` 는 line 1850 의 `buildSubmittedBrief()` 반환값이며 `intent: string` 필드를 가짐 (line 363). generation-normalize.ts:78 의 `if (context.prompt === undefined) return intermediate` early return 우회 → enforceRichness → ensureInteractiveComponent + ensureEntranceAnimations 가 production code path 에 도달.

2. **Gap 2 closed** — `apps/web/src/app/page.tsx:450-451` 이 `analyzeDominantColors(pixelSource, 5)` + `extractLayoutIntent(pixelSource)` 를 호출. `extractFromDataUrl` 반환 객체 (455-456) 에 `dominantColors: analysis.hexes` + `layoutIntent` 포함. `ImageReferenceSeed` 인터페이스 (358-359) 에 두 옵셔널 필드 추가. `newRefs.push` (1543-1544) 가 두 필드 propagate. grep 결과 `analyzeDominantColors` / `extractLayoutIntent` production caller 가 image-color.ts/test 외에 page.tsx 에도 등장 (이전 0건).

**Regressions:** None. 45 unit tests (richness 11 + generation-normalize 11 + image-color 23) 모두 pass. tsc strict (web + llm-prompts) 두 패키지 모두 exit 0.

**Score 변화:** 3/5 → 5/5 (all observable truths verified). Status 변경: `gaps_found` → `human_needed` (자동 enforce 동작 + 이미지 분석 데이터의 LLM payload 도달은 dev server + network 탭 spot-check 가 필요한 통합 동작이므로).

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP Success Criterion) | Status (이전) | Status (이번) | Evidence |
|---|---|---|---|---|
| 1 | generation-normalize 에 13 신호 검증 모듈 — 미달 신호 발견 시 사용자에게 표시 + 자동 보강 trigger (AI-01) | PARTIAL | VERIFIED | richness.ts:263 `validateTreeRichness` + generation-normalize.ts:88 `enforceRichness` orchestrator. **production wiring 활성화:** page.tsx:1904 `normalizeDesignTree(success.tree, { prompt: submitted.intent })` 가 prompt 전달 → enforceRichness branch 진입. |
| 2 | 인터랙티브 컴포넌트 0개 출력 — 자동으로 도메인-적합 1개 추가 (AI-02) | PARTIAL | VERIFIED | generation-normalize.ts:252 `ensureInteractiveComponent` + DOMAIN_TO_INTERACTIVE 5종 매핑. truth #1 의 prompt 전달로 production path 도달. |
| 3 | entranceAnimation 가진 노드 < 6개 — hero.title slide-up + features cards staggered 자동 박기 (AI-03) | PARTIAL | VERIFIED | generation-normalize.ts:356 `ensureEntranceAnimations` D-09 3단계 우선순위. truth #1 의 prompt 전달로 production path 도달. |
| 4 | prompt 에 도메인×톤 매트릭스 표 추가 (AI-04) | VERIFIED | VERIFIED | llm-prompts/src/index.ts:1668 6×5=30 셀 markdown 매트릭스. system prompt 정적 텍스트 — 매 LLM 호출 자동 송출. |
| 5 | 참조 이미지에서 dominant color 5색 + 레이아웃 의도 추출해 prompt 에 전달 (AI-05) | PARTIAL | VERIFIED | image-color.ts:116/160 신규 2 함수 + llm-prompts ImageReference 옵셔널 필드 + `<reference_image_analysis>` inject 블록 (line 164-180). **production wiring 활성화:** page.tsx:450-451 가 두 함수 호출, 결과를 ImageReferenceSeed (358-359) → newRefs.push (1543-1544) 로 propagate → DesignBrief.imageReferences → llm-prompts inject 조건 활성. multi-ref aggregation 부분만 override 로 수용. |

**Score:** 5/5 fully verified (이전 1/5). 1 override applied (multi-ref aggregation deferred).

### Required Artifacts

| Artifact | Expected | Status (이전) | Status (이번) | Details |
|---|---|---|---|---|
| `apps/web/src/app/richness.ts` | 13 신호 + validateTreeRichness | VERIFIED | VERIFIED | 13 signal keys, SIGNAL_COUNT=13, validateTreeRichness export |
| `apps/web/src/app/richness.test.ts` | 5 신호 테스트 + validateTreeRichness 테스트 | VERIFIED | VERIFIED | 11 tests pass |
| `apps/web/src/app/generation-normalize.ts` | enforceRichness orchestrator + sub-routines | VERIFIED (L1-3) / HOLLOW (L4) | VERIFIED (L1-4) | 모든 export 존재 + 테스트 pass. **page.tsx:1904 호출이 prompt 인자 전달 → L4 data flow 복구.** |
| `apps/web/src/app/generation-normalize.test.ts` | 6 신규 it | VERIFIED | VERIFIED | 11/11 pass |
| `apps/web/src/app/image-color.ts` | analyzeDominantColors + extractLayoutIntent | VERIFIED (L1-3) / HOLLOW (L4) | VERIFIED (L1-4) | **page.tsx:450-451 production caller 활성화 — grep 결과 image-color.ts/test 외 page.tsx 에도 등장 (이전 0건).** |
| `apps/web/src/app/image-color.test.ts` | analyze + 4 layout intent 테스트 | VERIFIED | VERIFIED | 23/23 pass |
| `packages/llm-prompts/src/index.ts` | 매트릭스 + ImageReference 필드 + inject 블록 | VERIFIED (L1-3) / PARTIAL (L4) | VERIFIED (L1-4) | **inject 블록 (line 164-180) 의 `if (ref.dominantColors !== undefined || ref.layoutIntent !== undefined)` 분기가 production 에서 활성화될 수 있게 됨 — ImageReferenceSeed 가 두 필드를 propagate.** |
| `apps/web/src/app/page.tsx` | wiring (production caller) | — | VERIFIED | line 166-170 import (analyzeDominantColors / extractLayoutIntent / LayoutIntent), 358-359 ImageReferenceSeed 확장, 450-451 분석 함수 호출, 455-456 return 객체에 신규 필드, 1543-1544 push propagation, 1904 normalizeDesignTree({ prompt }) |

### Key Link Verification

| From | To | Via | Status (이전) | Status (이번) | Details |
|---|---|---|---|---|---|
| richness.ts | generation-normalize.ts enforceRichness | import + 호출 | WIRED | WIRED | 변동 없음 |
| generation-normalize.ts normalizeDesignTree | page.tsx (production caller) | import + 호출 | PARTIAL | WIRED | page.tsx:172 import, 1904 호출에 `{ prompt: submitted.intent }` 전달. enforceRichness branch (generation-normalize.ts:79) 도달. |
| image-color.ts analyzeDominantColors | page.tsx (canvas 처리) | import + 호출 | NOT_WIRED | WIRED | page.tsx:166 import, 450 호출. |
| image-color.ts extractLayoutIntent | page.tsx (canvas 처리) | import + 호출 | NOT_WIRED | WIRED | page.tsx:168 import, 451 호출. |
| extractFromDataUrl 반환 객체 | ImageReferenceSeed (page.tsx:354) | 구조적 매핑 | NEW | WIRED | 455-456 `dominantColors: analysis.hexes` + `layoutIntent` 반환, 1533-1534 destructure, 1543-1544 push. |
| ImageReferenceSeed.dominantColors/layoutIntent | DesignBrief.imageReferences (buildSubmittedBrief) | spread/copy | NEW | WIRED | spread 만 — 신규 필드 자동 propagate (구조적 호환). |
| ImageReference.dominantColors/layoutIntent | formatBriefAsUserPrompt <reference_image_analysis> inject | line 164-180 if 분기 | PARTIAL | WIRED | upstream 이 필드를 채우므로 if 분기 truthy 가능 — production 활성. |
| 매트릭스 30 셀 | LLM system prompt | template literal | WIRED | WIRED | 변동 없음 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data (이전) | Produces Real Data (이번) | Status |
|---|---|---|---|---|---|
| `enforceRichness` | `context.prompt` | page.tsx:1904 호출 인자 | NO (옵션 미전달) | YES (`submitted.intent`) | FLOWING |
| `<reference_image_analysis>` inject | `ref.dominantColors`, `ref.layoutIntent` | page.tsx extractFromDataUrl → newRefs.push | NO (필드 채워지지 않음) | YES (analyzeDominantColors.hexes + extractLayoutIntent) | FLOWING |
| 매트릭스 30 셀 | (정적 텍스트) | template literal 자체 | YES | YES | FLOWING |
| validateTreeRichness | tree | enforceRichness 가 generation-normalize 안에서 호출 | FLOWING in test, HOLLOW in production | FLOWING in both | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| richness.test.ts 통과 | `pnpm --filter @dworks/web exec node --import tsx --test src/app/richness.test.ts` | 11/11 pass | PASS |
| generation-normalize.test.ts 통과 | `pnpm --filter @dworks/web exec node --import tsx --test src/app/generation-normalize.test.ts` | 11/11 pass | PASS |
| image-color.test.ts 통과 | `pnpm --filter @dworks/web exec node --import tsx --test src/app/image-color.test.ts` | 23/23 pass | PASS |
| 3 파일 통합 실행 | `pnpm --filter @dworks/web exec node --import tsx --test src/app/{richness,generation-normalize,image-color}.test.ts` | 45/45 pass | PASS |
| web 패키지 tsc | `pnpm --filter @dworks/web exec tsc --noEmit` | exit 0 | PASS |
| llm-prompts 패키지 tsc | `pnpm --filter @dworks/llm-prompts exec tsc --noEmit` | exit 0 | PASS |
| normalizeDesignTree 호출이 prompt 전달 | `grep -n "normalizeDesignTree" page.tsx` | line 1904 `{ prompt: submitted.intent }` 매치 | PASS |
| analyzeDominantColors 호출 | `grep -n "analyzeDominantColors" page.tsx` | line 166 import + 450 호출 매치 | PASS |
| extractLayoutIntent 호출 | `grep -n "extractLayoutIntent" page.tsx` | line 168 import + 451 호출 매치 | PASS |
| ImageReferenceSeed 두 신규 필드 | `grep -n "dominantColors\|layoutIntent" page.tsx` | 358-359 (interface) + 420-421 (return type) + 455-456 (return value) + 1533 (destructure) + 1543-1544 (push) 매치 | PASS |
| Commit 9cb2818 (Task 1) | `git log --oneline 9cb2818 -1` | `feat(02-05): normalizeDesignTree에 submitted.intent 전달` | PASS |
| Commit 1518289 (Task 2) | `git log --oneline 1518289 -1` | `feat(02-05): extractFromDataUrl에 dominantColors + layoutIntent 추출 wiring` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status (이전) | Status (이번) | Evidence |
|---|---|---|---|---|---|
| AI-01 | 02-01, 02-04, 02-05 | 13 신호 자동 enforce — validator + 자동 보강 | BLOCKED | SATISFIED | page.tsx:1904 의 normalizeDesignTree({ prompt }) → enforceRichness branch 활성 |
| AI-02 | 02-04, 02-05 | 인터랙티브 컴포넌트 자동 추가 | BLOCKED | SATISFIED | ensureInteractiveComponent + 5 도메인 매핑이 truth #1 wiring 으로 production 도달 |
| AI-03 | 02-04, 02-05 | entranceAnimation 자동 박기 | BLOCKED | SATISFIED | ensureEntranceAnimations + D-09 우선순위 3단계가 truth #1 wiring 으로 production 도달 |
| AI-04 | 02-02 | 도메인×톤 매트릭스 | SATISFIED | SATISFIED | system prompt 정적 섹션 — 매 LLM 호출 자동 송출 |
| AI-05 | 02-03, 02-05 | 참조 이미지 5색 + 레이아웃 의도 → prompt | BLOCKED | SATISFIED | page.tsx:450-451 가 신규 함수 호출, 1543-1544 가 ImageReferenceSeed 로 propagate, llm-prompts inject 블록 (line 164-180) 활성. multi-ref aggregation override 유지. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact | Status |
|---|---|---|---|---|---|
| `apps/web/src/app/page.tsx` | 1878 (이전) | `normalizeDesignTree(success.tree)` 가 prompt 옵션 미전달 | Blocker | AI-01/02/03 자동 보강 production 미실행 | **RESOLVED** — 현재 line 1904 가 `{ prompt: submitted.intent }` 전달 |
| `apps/web/src/app/page.tsx` | 432 (이전) | canvas 처리 helper 가 신규 분석 함수 미호출 | Blocker | AI-05 dominantColors/layoutIntent 파이프라인 끊김 | **RESOLVED** — 현재 line 450-451 가 두 함수 호출, 455-456 가 결과 반환, 1543-1544 가 propagate |

자동 stub 패턴 검사 결과 — 신규 wiring 코드 (page.tsx 1879, 354-360, 446-457, 1533-1544) 에 placeholder/TODO/FIXME 없음. 모든 경로가 substantive (실제 값 흐름). Anti-pattern 0 종.

### Human Verification Required

자동 검증이 모두 통과했으나, 두 항목은 _실제 LLM 응답_ + _실제 사용자 화면_ 측 통합 동작 확인이 필요 (단위 테스트 범위 외 — E2E 스폿체크).

#### 1. enforceRichness 자동 보강이 LLM 응답에 실제로 적용되는지

**Test:** dev server (`pnpm --filter @dworks/web dev`) 띄우고 ecommerce / SaaS / FAQ 도메인 intent (예: "온라인 쇼핑몰 메인 페이지" / "SaaS 대시보드" / "FAQ 페이지") 로 brief 제출. LLM 이 interactive 컴포넌트 0개로 응답할 경우 자동 추가되는지 + entranceAnimation 노드 ≥6 으로 채워지는지 확인.

**Expected:** ecommerce → carousel / SaaS → tabs / FAQ → accordion 자동 박힘. hero.title 에 slide-up 700ms load + features cards staggered slide-up 600ms scroll + final fade-in 500ms 가 D-09 우선순위로 박힘.

**Why human:** 실제 LLM 응답 + tree 구조 + 사용자 화면 렌더링 결과는 dev server + visual inspection 필요. 단위 테스트는 enforceRichness 함수 자체의 input/output 만 검증.

#### 2. `<reference_image_analysis>` 블록이 실제 LLM user prompt payload 에 포함되는지

**Test:** dev server 띄우고 참조 이미지 (밝은 톤 / 어두운 톤 / grid 레이아웃 등) 업로드 후 brief 제출. 브라우저 dev tools network 탭에서 LLM API 호출의 request body 안에 `<reference_image_analysis>` 블록이 포함되고 `dominantColors: [#hex1, ...]` + `layoutIntent: 'centered' | 'left-aligned' | 'grid' | 'asymmetric'` 라인이 있는지 확인.

**Expected:** user prompt 문자열에 두 라인이 포함됨. 결과적으로 LLM 이 생성하는 트리의 색 팔레트가 이미지 dominantColors 와 부합하고 정렬/배치가 layoutIntent 와 일관됨.

**Why human:** 실제 LLM 송출 payload + LLM 응답의 색/배치 품질은 dev tools network 탭 + visual inspection 필요. 단위 테스트는 인터페이스 호환성과 inject 블록의 if 분기 조건만 검증.

### Gaps Summary

이번 re-verification 에서 _new gap 없음_. 이전 verification (2026-05-11T06:30) 의 두 production wiring gap 모두 Plan 02-05 의 2 commit (9cb2818, 1518289) 으로 closed. page.tsx 한 파일의 6개 위치 (166-170 import, 354-360 interface, 446-457 return, 1533 destructure, 1543-1544 push, 1904 normalizeDesignTree call) 가 모두 의도대로 wiring 됨.

Phase 2 의 "자동 enforce" 약속이 production 데이터 경로에 도달:
- **AI-01/02/03** — `submitted.intent` 가 `normalizeDesignTree` 의 `context.prompt` 로 전달 → generation-normalize.ts:78 early return 우회 → enforceRichness orchestrator + 2 sub-routine (ensureInteractiveComponent, ensureEntranceAnimations) 가 사용자 화면 렌더링 전 트리에 적용.
- **AI-04** — system prompt 정적 매트릭스 30 셀 (변동 없음, 이미 자동 송출).
- **AI-05** — 사용자 업로드 이미지 → `analyzeDominantColors(pixelSource, 5)` + `extractLayoutIntent(pixelSource)` 동시 추출 (동일 imageData 재사용으로 1회 디코딩) → ImageReferenceSeed.dominantColors / layoutIntent 옵셔널 필드 → DesignBrief.imageReferences spread propagation → llm-prompts formatBriefAsUserPrompt 의 `<reference_image_analysis>` inject 블록 (line 164-180) 의 if 분기 활성 → LLM user prompt 에 도달.

자동 검증 가능한 모든 단계가 PASS. 남은 두 항목 (실제 LLM 응답 품질 + network payload 확인) 은 dev server 기반 사용자 spot-check 영역으로 human_verification 으로 라우팅.

**Override 재확인:** Plan 02-03 의 single-ref-only inject 결정 (multi-ref aggregation deferred) 은 이전 verification 의 override 그대로 유지. Plan 02-05 가 single-ref wiring 만 완성했으므로 override 의 trade-off (1차 사용자 시나리오) 와 일관.

---

_Re-verified: 2026-05-11T07:15:00Z (initial: 2026-05-11T06:30:00Z)_
_Verifier: Claude (gsd-verifier)_
