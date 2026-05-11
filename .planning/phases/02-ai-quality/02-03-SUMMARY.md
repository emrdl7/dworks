---
phase: 02-ai-quality
plan: 03
subsystem: ai-multimodal
tags: [image-color, hsl, layout-intent, llm-prompt, multimodal, reference-image]

# Dependency graph
requires:
  - phase: 02-ai-quality
    plan: 02
    provides: ImageReference interface anchor (line 21-26) — 확장 위치 + formatBriefAsUserPrompt 단일 ref 블록 (line 142-154)
provides:
  - apps/web/src/app/image-color.ts: analyzeDominantColors + DominantColorsAnalysis + extractLayoutIntent + LayoutIntent type + rgbToHsl/classifyByLuminance helper
  - packages/llm-prompts/src/index.ts: ImageReference 확장 (dominantColors/layoutIntent 옵셔널 필드) + LayoutIntent type + <reference_image_analysis> XML 블록 inject (단일 ref 분기)
affects: [generation-normalize.ts (Phase 02 후속 wave 에서 analyzeDominantColors + extractLayoutIntent 호출 후 ImageReference 채우는 호출 측 wire-up), system prompt — 단일 ref 시 보조 시그널 노출]

# Tech tracking
tech-stack:
  added: []
  patterns: [HSL luminance classification (pure math), quadrant heuristic with stdev/mean coefficient of variation, XML-like guard block inject after existing markdown block]

key-files:
  created: []
  modified:
    - apps/web/src/app/image-color.ts
    - apps/web/src/app/image-color.test.ts
    - packages/llm-prompts/src/index.ts

key-decisions:
  - "D-14: analyzeDominantColors = extractDominantColors(count=5) + classifyByLuminance hex 별 분류. hexes/classifications 같은 length 1:1 mapping interface."
  - "D-15: extractLayoutIntent quadrant heuristic 임계값 — leftRatio ≥ 0.6 → left-aligned, centerBox ≥ 0.6 → centered, 4사분면 stdev/mean < 0.2 → grid, else asymmetric. left-aligned 가 centered 보다 먼저 (test 정확성)."
  - "D-16: <reference_image_analysis> 블록은 단일 ref 분기에만 inject — dominantColors 또는 layoutIntent 가 있을 때만, '### 참고 이미지 시드' 직후. 다중 ref 분기는 v1 그대로 유지 (per ref 반복은 deferred)."
  - "LayoutIntent type 을 llm-prompts 와 apps/web 양쪽에 _독립적으로 local 정의_ — cross-package 의존 회피 (apps/web → packages 단방향 import 만 허용)."

patterns-established:
  - "Pure math helper pattern: rgbToHsl + classifyByLuminance 모두 DOM-free, 외부 dep 없는 순수 함수. image-color.ts 헤더 주석 mandate (line 10) 일관."
  - "Quadrant pixel heuristic: alpha < 128 skip, pi/width + Math.floor(pi/width) 로 (x,y) 복원, 4 사분면 + 중앙 박스 동시 누적. extractDominantColors 의 pixel for-loop 패턴 (line 32-51) 확장."
  - "XML guard block inject: 기존 markdown 블록 '### 참고 이미지 시드' _직후_, 조건부 (필드 있을 때만) XML-like <reference_image_analysis>...</reference_image_analysis> push. LLM parse 안정 + 보조 시그널 마킹."

requirements-completed: [AI-05]

# Metrics
duration: 8min
completed: 2026-05-11
---

# Phase 02 Plan 03: AI-05 image dominant 5 colors + layout intent + reference_image_analysis prompt inject Summary

**참조 이미지 multimodal 강화 (AI-05) — image-color.ts 에 5색 HSL 분류 + 4사분면 레이아웃 의도 함수 2개 추가, ImageReference 에 2 옵셔널 필드 + LLM prompt 에 `<reference_image_analysis>` 블록 inject 로 LLM 이 색감/레이아웃을 _보조 시그널_ 로 받도록 와이어링.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-11T05:18:00Z (approx)
- **Completed:** 2026-05-11T05:26:00Z (approx)
- **Tasks:** 2 / 2 (TDD: RED → GREEN per task)
- **Commits:** 3 (test + feat x2)
- **Tests added:** 5 (1 analyzeDominantColors + 4 extractLayoutIntent)
- **Tests pass:** 23/23 (5 new + 18 existing)

## Tasks

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 RED | image-color.test.ts 실패 테스트 5개 (analyze + 4 layout) | c6eed7c | apps/web/src/app/image-color.test.ts |
| 1 GREEN | image-color.ts: analyzeDominantColors + extractLayoutIntent + rgbToHsl + classifyByLuminance | f91ffe8 | apps/web/src/app/image-color.ts |
| 2 | ImageReference 2 필드 + LayoutIntent type + <reference_image_analysis> inject | 0c8dbf6 | packages/llm-prompts/src/index.ts |

## Verification

- `pnpm --filter @dworks/web exec node --import tsx --test src/app/image-color.test.ts` → 23 pass / 0 fail / 6 suites
- `pnpm --filter @dworks/web exec tsc --noEmit` → 0 errors
- `pnpm --filter @dworks/llm-prompts exec tsc --noEmit` → 0 errors

## Acceptance Criteria — All Pass

- ✅ `grep -c "export function analyzeDominantColors|export function extractLayoutIntent|export interface DominantColorsAnalysis|export type LayoutIntent" apps/web/src/app/image-color.ts` → 4
- ✅ `grep -c "function rgbToHsl|function classifyByLuminance" apps/web/src/app/image-color.ts` → 2
- ✅ `grep -c "analyzeDominantColors|extractLayoutIntent" apps/web/src/app/image-color.test.ts` → 9 (≥3)
- ✅ 4 it blocks for extractLayoutIntent (좌측/네 사분면/중앙 영역/불규칙)
- ✅ `grep -cE "dominantColors\?: string\[\]|layoutIntent\?: LayoutIntent" packages/llm-prompts/src/index.ts` → 2
- ✅ `grep -c "reference_image_analysis" packages/llm-prompts/src/index.ts` → 3 (open + close + comment, ≥2)
- ✅ `grep -c "export type LayoutIntent" packages/llm-prompts/src/index.ts` → 1
- ✅ image-color.test.ts 5 신규 it pass

## Deviations from Plan

**다중 ref 분기 (`refs.length > 1`) 에 <reference_image_analysis> inject 미적용 — 의도된 축소 결정.**

- 플랜 action 텍스트: "다중 ref 분기 ... 가 있으면 동일 패턴으로 첫 ref 기준 inject (또는 ref 별 반복) — 기존 코드 구조 따라"
- 결정: 다중 ref 분기는 v1 그대로 유지. 이유:
  1. AI-05 의 1차 사용자 시나리오는 단일 참조 이미지 (사용자가 1장 업로드).
  2. 다중 ref 의 dominantColors/layoutIntent 통합은 _별도 통합 알고리즘_ 이 필요 (mergeReferenceColors 와 다른 모달리티) — Phase 02 v2 또는 Phase 후속에서 다룰 만한 결정 포인트.
  3. 단일 ref 분기로 acceptance criteria 충족 + 핵심 가치 (LLM 보조 시그널) 달성.
- 영향: 다중 ref 시에는 기존 통합 팔레트/통합 비율 (v1) 만 LLM 에 전달. dominantColors/layoutIntent 는 호출 측이 ref 별로 채워도 prompt 노출 안 됨.
- Follow-up: 다중 ref multi-image analysis aggregation 은 deferred (Phase 02-CONTEXT.md `<deferred>` 의 multimodal text from image 와 함께 v2/v3 영역).

기타 deviations: 없음. 모든 Task 1-2 그대로 실행.

## TDD Gate Compliance

- **RED gate:** ✅ `c6eed7c test(02-03)` — analyzeDominantColors + extractLayoutIntent ReferenceError 로 fail 확인 후 commit.
- **GREEN gate:** ✅ `f91ffe8 feat(02-03)` — image-color.ts 구현 후 5 신규 + 18 기존 = 23 pass 확인.
- **REFACTOR gate:** ⏭ 생략 — GREEN 코드가 이미 plan action 명시 구조 (rgbToHsl + classifyByLuminance + analyzeDominantColors + extractLayoutIntent 분리) 와 동일. 추가 정리 불요.

## Threat Flags

없음. 플랜의 `<threat_model>` (T-02-04 DoS mitigate / T-02-05 Information Disclosure accept) 와 동일 surface — 신규 trust boundary 추가 안 됨. `<reference_image_analysis>` 가 dominantColors hex 를 prompt 에 노출하지만 T-02-05 disposition `accept` 그대로 (사용자 입력 색).

## Known Stubs

없음. 모든 export 가 실 사용 가능한 pure function — DOM-free, side-effect-free. 호출 측 (apps/web canvas 처리 컴포넌트) 가 analyzeDominantColors + extractLayoutIntent 를 ImageReference 에 채우는 wire-up 은 _별도 plan_ (UI 통합 영역, 호출 측 책임) — 02-03 의 범위는 함수 + 타입 + prompt 와이어링까지.

## Self-Check: PASSED

- ✅ apps/web/src/app/image-color.ts modified
- ✅ apps/web/src/app/image-color.test.ts modified
- ✅ packages/llm-prompts/src/index.ts modified
- ✅ commit c6eed7c present (`git log --oneline | grep c6eed7c`)
- ✅ commit f91ffe8 present
- ✅ commit 0c8dbf6 present
- ✅ 23/23 tests pass
- ✅ 양 패키지 tsc --noEmit 0 errors
