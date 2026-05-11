---
phase: 02-ai-quality
plan: 01
subsystem: ai-quality-validator
tags: [richness, signals, validator, typescript, node-test, tdd]

# Dependency graph
requires:
  - phase: 01-ux-fix
    provides: 기존 richness.ts 8 신호 측정 인프라 + RichnessReport interface 패턴
provides:
  - richness.ts 13 신호 (#1~#13) 측정 + SIGNAL_COUNT 13
  - validateTreeRichness(tree) API → { signals, score, missing: RichnessSignalKey[] }
  - structuredFullRich 13-신호 fixture (다음 plan 들에서 재사용 가능)
  - fixture-export / generation-export validator 가 13 신호 자동 수용 (RICHNESS_SIGNAL_KEYS 기반 동적 구성)
affects:
  - 02-02 (AI-01 enforceRichness hook — missing[] 기반 자동 보강)
  - 02-03 (AI-02 인터랙티브 컴포넌트 자동 추가)
  - 02-04 (AI-03 entranceAnimation 자동 박기)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "validator wrap (computeRichnessReport → validateTreeRichness)으로 missing[] derive"
    - "RICHNESS_SIGNAL_KEYS 기반 동적 객체 구성 — 신호 추가 시 validator 자동 동기"

key-files:
  created: []
  modified:
    - "apps/web/src/app/richness.ts (8 신호 → 13 신호 + validateTreeRichness export)"
    - "apps/web/src/app/richness.test.ts (5 신호 + validateTreeRichness 테스트 + structuredFullRich fixture)"
    - "apps/web/src/app/fixture-export.ts (validator RICHNESS_SIGNAL_KEYS 동적 구성)"
    - "apps/web/src/app/generation-export.ts (validator RICHNESS_SIGNAL_KEYS 동적 구성)"
    - "apps/web/src/app/generation-export.test.ts (3 fixture 에 신호 #9~#13 필드 추가)"

key-decisions:
  - "Override 카운트는 노드별 OR 집계 — spacing/color/typography/shape/layout 중 하나라도 객체이면 +1 (D-01)"
  - "Section visual variety bg 키 — solid 는 색 hex 그대로, gradient 는 JSON 직렬화 prefix 로 종 비교"
  - "Validator 객체 구성은 RICHNESS_SIGNAL_KEYS 순회 동적 — 향후 14, 15 신호 추가 시 validator 자동 통과"
  - "기존 'structured rich tree' 테스트의 score === 1 단언 제거 — 13 신호 모델에서는 8 신호만으로 점수 1 불가 (boolean 만 검증)"

patterns-established:
  - "13 신호 fixture 패턴: 17 노드 (8 boolean + 7 entranceAnimation + 16 override + 2 main 직계 bg + 3 container type + 1 accordion)"
  - "RICHNESS_SIGNAL_KEYS 13 키 — 신호 추가 시 array 끝에 append (기존 순서 보존)"

requirements-completed:
  - AI-01

# Metrics
duration: 5min
completed: 2026-05-11
---

# Phase 02 Plan 01: richness 13 신호 + validateTreeRichness API Summary

**richness.ts 8 신호 → 13 신호 확장 + missing[] 반환 API export — enforceRichness hook (02-02) 의 foundation.**

## Performance

- **Duration:** 5min
- **Started:** 2026-05-11T05:11:00Z
- **Completed:** 2026-05-11T05:15:45Z
- **Tasks:** 2/2 (Task 1 source, Task 2 tests)
- **Files modified:** 5

## Accomplishments

### Task 1 — richness.ts 13 신호 확장 (commit 75ea025)

- **신호 #9 designOverrideVariety** — 노드별 spacing/color/typography/shape/layout 중 하나라도 객체이면 +1, overrideCount ≥ 12
- **신호 #10 sectionVisualVariety** — main 직계 section/hero 의 backgroundColor/Gradient 종 ≥ 2 (gradient 는 JSON 직렬화 prefix 로 종 비교)
- **신호 #11 nodeTypeVariety** — container type ∈ {section, hero, card, list, form} 중 ≥ 3 종
- **신호 #12 interactiveComponent** — type ∈ {carousel, tabs, accordion, modal} ≥ 1
- **신호 #13 entranceAnimationSpread** — entranceAnimation 명시 노드 6 ≤ n ≤ 12
- `SIGNAL_COUNT 8 → 13`, `RICHNESS_SIGNAL_KEYS` 끝에 5 키 append (기존 순서 보존)
- `validateTreeRichness(tree)` 신규 export — `{ signals, score, missing: RichnessSignalKey[] }` 반환
- fixture-export / generation-export validator 가 RICHNESS_SIGNAL_KEYS 기반 동적 객체 구성 으로 변경 (Rule 3 auto-fix — 신호 추가 시 자동 동기)

### Task 2 — richness.test.ts 5 신호 + validateTreeRichness 테스트 (commit d264ebc)

- **structuredFullRich fixture** — 17 노드, 13 신호 모두 만족 (banner + main with 4 직계 (hero + section.a + card + accordion) + contentinfo, 7 entranceAnimation)
- 5 it 블록 — `#9 designOverrideVariety`, `#10 sectionVisualVariety`, `#11 nodeTypeVariety`, `#12 interactiveComponent`, `#13 entranceAnimationSpread`
- structuredFullRich 13 신호 score === 1 단언 (RICHNESS_SIGNAL_KEYS 순회 assert)
- 2 validateTreeRichness it 블록 — bare → missing.length === 13, structuredFullRich → missing === []

## Verification

- `pnpm --filter @dworks/web exec tsc --noEmit` → 0 errors
- `tsx --test src/app/richness.test.ts` → 11/11 pass (3 suites: original computeRichnessReport, 13 신호 #9~#13, validateTreeRichness)
- 전체 web 테스트: 351/351 pass (회귀 0)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] fixture-export.ts + generation-export.ts validator 가 8 필드 하드코딩**

- **Found during:** Task 1 typecheck 직후 (5개 TS2739 에러 — RichnessReport 5 필드 누락)
- **Issue:** 기존 validator 들이 `{ hasPageLandmarks: ..., ..., hasShapeDepth: ... }` 형태로 8 필드만 명시 구성. 13 필드 인터페이스로 확장 후 누락 컴파일 에러.
- **Fix:** RICHNESS_SIGNAL_KEYS 가 이미 boolean 검증 루프에 사용되므로 → 반환 객체도 `Object.fromEntries(RICHNESS_SIGNAL_KEYS.map(...))` 동적 구성으로 변경. 신호 추가 시 자동 동기.
- **Files modified:** `apps/web/src/app/fixture-export.ts` (lines 230-243), `apps/web/src/app/generation-export.ts` (lines 350-368)
- **Commit:** 75ea025

**2. [Rule 3 - Blocking] generation-export.test.ts 3 fixture 가 8 필드 객체 리터럴**

- **Found during:** Task 1 typecheck (TS2345 / TS2322 — ExportableGeneration 인자/할당 타입 불일치)
- **Issue:** 3 테스트 fixture 가 8 필드 richness object literal — 5 신호 누락.
- **Fix:** 각 fixture 에 5 신호 필드 추가 (boolean — 기존 score 보존 위해 모두 false, fullRich 케이스는 boolean 의미를 살려 추가).
- **Files modified:** `apps/web/src/app/generation-export.test.ts` (3 fixture: lines ~237, ~395, ~410, ~651)
- **Commit:** 75ea025

**3. [Rule 3 - Blocking] 기존 'structured rich tree satisfies all 8 quality signals' 테스트의 score === 1 단언**

- **Found during:** Task 2 — 기존 fixture 가 신호 #9~#13 미만족 (overrideCount ~5, sectionBgs 1종, accordion 0개, animations 0개) → score = 8/13 ≈ 0.615
- **Issue:** 단언 `report.score, 1` 실패.
- **Fix:** 단언 본문에서 `assert.equal(report.score, 1)` 제거. 8 boolean 단언 그대로 유지. 주석에 13-신호 모델 전환 사유 명시. 신규 structuredFullRich 테스트가 score === 1 를 검증.
- **Files modified:** `apps/web/src/app/richness.test.ts` (line ~129-142)
- **Commit:** d264ebc

**4. [Rule 3 - Blocking] structuredFullRich fixture 의 fontWeight 타입 위반**

- **Found during:** Task 2 typecheck (TS2322 — fontWeight 숫자 800 은 string union 만 허용)
- **Issue:** typography.fontWeight 가 `'100'|...|'900'` literal union. 숫자 800 거부.
- **Fix:** `fontWeight: '800'` (string literal).
- **Files modified:** `apps/web/src/app/richness.test.ts` (line 206)
- **Commit:** d264ebc

## TDD Gate Compliance

플랜 frontmatter 는 `tdd="true"` 표기되어 있으나 Task 1/Task 2 가 source/test 로 명시 분할되어 있어 정확한 RED/GREEN 분리 commit 시퀀스는 적용하지 않았다. Task 1 (feat) → Task 2 (test) 순서이며, Task 1 commit 시점에 신규 신호 #9~#13 의 회귀 테스트 없이 implementation 만 들어간 _임시 갭_ 이 존재 (Task 2 직후 회복). 향후 단일 TDD task 로 재구성 가능.

## Threat Flags

해당 없음 — richness.ts 는 pure validator (no IO, no network, no auth boundary). T-02-01 / T-02-02 모두 plan 의 threat_model 에 등록된 accept 결정대로.

## Self-Check: PASSED

- richness.ts 경로 존재 ✓
- richness.test.ts 경로 존재 ✓
- commit 75ea025 (Task 1) git log 확인 ✓
- commit d264ebc (Task 2) git log 확인 ✓
- 13 신호 모두 export ✓
- validateTreeRichness 1 export ✓
- pnpm typecheck 0 errors ✓
- richness.test.ts 11/11 pass ✓
- 전체 web 테스트 351/351 pass ✓
