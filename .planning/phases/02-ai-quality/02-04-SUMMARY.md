---
phase: 02-ai-quality
plan: 04
subsystem: ai-quality
tags: [ai-01, ai-02, ai-03, enforce-richness, interactive, entrance-animation]
requires:
  - 02-01 # validateTreeRichness API
provides:
  - enforceRichness(tree, prompt) — 13 신호 자동 보강 orchestrator
  - inferDomain(prompt) — 5종 도메인 추론
  - ensureInteractiveComponent — 도메인-적합 interactive 1개 자동 삽입
  - ensureEntranceAnimations — D-09 우선순위 3단계 staggered animation
  - EntranceAnimation 타입 export
affects:
  - apps/web/src/app/generation-normalize.ts
tech_stack:
  added: []
  patterns:
    - validateTreeRichness missing[] 기반 sub-routine 분기
    - immutable spread + transformNode 재귀
    - hasAnyInteractive / hasEntranceAnimation idempotent guards
    - findMainContainer / findMainDirectSections 트리 탐색
key_files:
  created:
    - .planning/phases/02-ai-quality/02-04-SUMMARY.md
  modified:
    - apps/web/src/app/generation-normalize.ts
    - apps/web/src/app/generation-normalize.test.ts
decisions:
  - D-04 enforceRichness server-side 자동 보강 hook — prompt 있을 때만 활성화 (backward compat)
  - D-05 도메인 5종 매핑 — ecommerce→carousel/saas→tabs/faq→accordion/auth→modal/default→accordion
  - D-06 삽입 위치 — main 직계 마지막 section/hero 직전 (위계상 중간/하단)
  - D-07 D-10 idempotent — 이미 interactive 있으면 skip, 이미 entranceAnimation 있으면 덮어쓰지 않음
  - D-09 entranceAnimation 3단 우선순위 (hero.title 700ms load → cards 600ms staggered scroll → final 500ms fade scroll), MAX_ANIMATIONS=8 STAGGER_DELAY_MS=150
metrics:
  duration_minutes: 4
  duration_seconds: 252
  task_count: 3
  test_count: 11
  new_test_count: 6
  file_count: 2
  completed: "2026-05-11"
requirements_completed: [AI-01, AI-02, AI-03]
---

# Phase 2 Plan 04: enforceRichness hook + interactive auto-add + entranceAnimation auto-stagger

LLM 생성 트리의 풍부도 13 신호 미달 시 server-side 가 자동 보강 — Plan 02-01 의 `validateTreeRichness` missing[] 기반으로 interactive 컴포넌트 1개 자동 삽입 + entranceAnimation 3단 우선순위 staggered 박힘, 모두 idempotent + safe 변환.

## Tasks Executed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | enforceRichness orchestrator + inferDomain + pipeline | 99e2e02 | apps/web/src/app/generation-normalize.ts |
| 2 RED | ensureInteractiveComponent 시나리오 3개 (test) | af4f68d | apps/web/src/app/generation-normalize.test.ts |
| 2 GREEN | ensureInteractiveComponent 구현 (D-05/06/07) | 005610f | apps/web/src/app/generation-normalize.ts |
| 3 RED | ensureEntranceAnimations 시나리오 3개 (test) | f58575f | apps/web/src/app/generation-normalize.test.ts |
| 3 GREEN | ensureEntranceAnimations 구현 (D-09/10) | 8a20010 | apps/web/src/app/generation-normalize.ts |

## Implementation Highlights

### 1) Pipeline 통합 (D-04 backward compat)

`NormalizeContext` 에 `prompt?: string` 추가. `prompt === undefined` 면 기존 동작 그대로 (id dedupe + root section wrap 만), `prompt` 있을 때만 `enforceRichness` 활성화 — Phase 1 호출자 backward compat 보장.

```typescript
if (context.prompt === undefined) return intermediate
return enforceRichness(intermediate, context.prompt)
```

### 2) inferDomain — 5종 도메인 추론 (D-05)

Pure regex match — no external lib, no async. 키워드 우선순위 ecommerce → saas → faq → auth → default.

| Domain | Keywords | → Interactive |
|--------|----------|---------------|
| ecommerce | e-commerce, 쇼핑, 제품, 카탈로그 | carousel |
| saas | SaaS, B2B, dashboard, 기능, pricing | tabs |
| faq | FAQ, 컨퍼런스, 일정, specs | accordion |
| auth | 가입, 회원, 약관 | modal |
| default | (no match) | accordion |

### 3) ensureInteractiveComponent (D-05/06/07)

- `findMainContainer`: 재귀로 `role === 'main'` 컨테이너 탐색
- `hasAnyInteractive`: D-07 idempotent guard — 이미 1개 이상이면 skip
- `insertBeforeLastSection`: D-06 위치 — main 직계 마지막 section/hero 직전 (위계상 중간/하단)
- `makeInteractiveNode`: 한국어 placeholder "인터랙티브 요소 — 도메인에 맞게 편집하세요" — 사용자 편집 anchor
- `replaceNode`: immutable spread 재귀 트리 교체

### 4) ensureEntranceAnimations (D-09/10)

**D-09 우선순위 3단계 (총 ≤8개)**:
1. 첫 hero 의 heading → `slide-up 700ms trigger:load`
2. main 직계 section/hero 의 직접 자식 → `slide-up 600ms delay:0/150/300... trigger:scroll` (STAGGER_DELAY_MS=150)
3. 마지막 section/hero 의 heading → `fade-in 500ms trigger:scroll`

**D-10 idempotent guard**: `hasEntranceAnimation` 으로 기존 값 보존 — `withEntranceAnimation` 이 박혀 있으면 그대로 반환.

**테스트 검증**:
- D-09 정확한 prop shape (`type`, `duration`, `delay`, `trigger`) 확인
- D-10 기존 `{ type: 'fade-in', duration: 1000 }` 유지 (slide-up 700 덮어쓰지 않음)
- Idempotent — `normalizeDesignTree` 두 번 호출 `assert.deepEqual` pass

## Test Coverage

총 11 테스트 (기존 5 + 신규 6, 모두 pass):

| Suite | Tests | Pass | Fail |
|-------|-------|------|------|
| normalizeDesignTree | 5 | 5 | 0 |
| enforceRichness — interactive | 3 | 3 | 0 |
| enforceRichness — entranceAnimation | 3 | 3 | 0 |

**TDD gate compliance**: Task 2/3 모두 RED commit (af4f68d, f58575f) → GREEN commit (005610f, 8a20010) 순서 준수.

## Acceptance Criteria (Plan)

### Task 1
- [x] `grep -c "export function enforceRichness|export function inferDomain|export type DomainKey"` → 3
- [x] `grep -c "validateTreeRichness"` → 3 (≥2)
- [x] `grep -c "prompt?: string"` → 1
- [x] `grep -c "ensureInteractiveComponent|ensureEntranceAnimations"` → 4 (≥4)
- [x] `grep -cE "(e-?commerce|쇼핑|제품|카탈로그)"` → 2 (≥1)
- [x] tsc --noEmit → 0 errors

### Task 2
- [x] `grep -c "ensureInteractiveComponent|DOMAIN_TO_INTERACTIVE|findMainContainer|hasAnyInteractive|makeInteractiveNode|insertBeforeLastSection"` → 14 (≥6)
- [x] `grep -c "인터랙티브 요소 — 도메인에 맞게 편집하세요"` → 1
- [x] 3 신규 it pass
- [x] tsc --noEmit → 0 errors

### Task 3
- [x] `grep -c "ensureEntranceAnimations|withEntranceAnimation|hasEntranceAnimation|findHeadingChild|findMainDirectSections"` → 15 (≥5)
- [x] `interface EntranceAnimation` → 1
- [x] `MAX_ANIMATIONS = 8|STAGGER_DELAY_MS = 150` → 2
- [x] `duration: 700|duration: 600|duration: 500` → 3
- [x] `trigger: 'load'|trigger: 'scroll'` → 4 (≥2)
- [x] 3 신규 it pass + 기존 it 모두 pass (regression 없음)
- [x] tsc --noEmit → 0 errors

## Deviations from Plan

None — 플랜대로 실행됨. 작은 조정 (코딩 스타일):
- `replaceNode` (Task 2) 와 `transformNode` (Task 3) 분리 유지 — Task 3 의 transform 콜백 형태가 더 일반적이지만 Task 2 의 단순 교체는 그대로 둠 (refactor 범위 외)
- `hasAnyInteractive` 의 type guard 와 `isInteractive` 의 type guard 함수 분리 — readability

## Deferred Issues

- `image-color.test.ts:9` missing export 'extractLayoutIntent' — Plan 02-03 영역 (본 plan scope 외). `deferred-items.md` 로 기록.

## Self-Check: PASSED

- [x] commit 99e2e02 (Task 1 orchestrator) — git log 확인
- [x] commit af4f68d (Task 2 RED)
- [x] commit 005610f (Task 2 GREEN)
- [x] commit f58575f (Task 3 RED)
- [x] commit 8a20010 (Task 3 GREEN)
- [x] `apps/web/src/app/generation-normalize.ts` 존재 (모든 신규 export)
- [x] `apps/web/src/app/generation-normalize.test.ts` 존재 (11 tests)

## TDD Gate Compliance

Plan type: tdd (each task `tdd="true"`). Gate sequence:
- Task 2: af4f68d (test commit, RED) → 005610f (feat commit, GREEN) ✓
- Task 3: f58575f (test commit, RED) → 8a20010 (feat commit, GREEN) ✓
- Task 1: feat-only (orchestrator + stub, no test needed since Tasks 2/3 supply tests for the orchestrator path)

## Backward Compat Verified

- `normalizeDesignTree(tree)` (prompt 없음) — 기존 동작 그대로 (id dedupe + section wrap)
- `normalizeDesignTree(tree, { prompt: '...' })` — enforceRichness 활성화
- 기존 5 테스트 모두 pass (regression 없음)

---

**Phase 2 Plan 04 완료** — Wave 2 의 핵심 ai-quality 보강 hook 안착. 다음 Plan 02-05 (도메인×톤 매트릭스 + 참조 이미지) 와 독립적으로 진행 가능.
