---
phase: 02-ai-quality
fixed_at: 2026-05-11T00:00:00Z
review_path: .planning/phases/02-ai-quality/02-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 02-ai-quality: Code Review Fix Report

**Fixed at:** 2026-05-11
**Source review:** `.planning/phases/02-ai-quality/02-REVIEW.md`
**Iteration:** 1
**Mode:** --auto (HIGH + MEDIUM)

**Summary:**
- Findings in scope: 6 (HIGH 2 + MEDIUM 4)
- Fixed: 6
- Skipped: 0
- LOW 3 + NIT 2 — cosmetic, skipped per --auto mode

검증:
- `pnpm --filter web typecheck` PASS
- `pnpm --filter @dworks/llm-prompts typecheck` PASS
- `pnpm --filter web test` PASS (362/362 tests)

---

## Fixed Issues

### HI-01: 다중 이미지 prompt 에서 dominantColors / layoutIntent 조용히 드롭

**Files modified:** `packages/llm-prompts/src/index.ts`
**Commit:** `a3b0e09`
**Applied fix:**
- `aggregateDominantColors(refs)` 헬퍼 추가 — union (앞 ref 순서 우선, 중복 제거, max 8)
- `aggregateLayoutIntent(refs)` 헬퍼 추가 — 최빈값 (동수면 첫 ref 값)
- `formatBriefAsUserPrompt` 의 `refs.length > 1` 분기에 단일 ref 와 동일한
  `<reference_image_analysis>` 블록 emit

다중 이미지 케이스에서도 D-16 신호 가 LLM 에 전달되도록 복원.

### HI-02: export/import 라운드트립에서 dominantColors / layoutIntent 드롭

**Files modified:** `apps/web/src/app/generation-export.ts`
**Commit:** `7cde4e7`
**Applied fix:**
- `ExportedImageReference` 인터페이스에 `dominantColors?: string[]` +
  `layoutIntent?: 'centered' | 'left-aligned' | 'grid' | 'asymmetric'` 추가
- `validateImageReference` 에 두 필드 optional 검증 추가 (legacy v1 호환 유지)
- version bump 없음 — forward-compat (기존 v1 파일은 두 필드 없이 통과)

### ME-01: inferDomain 매핑이 매트릭스 6 도메인 중 4 도메인만 커버

**Files modified:** `apps/web/src/app/generation-normalize.ts`
**Commit:** `ce8b599`
**Applied fix:**
- `DomainKey` 에 `portfolio`, `education` 추가
- `inferDomain` regex 에 한/영 키워드 매핑 추가:
  - 포트폴리오/portfolio/작업물/works/갤러리/작품 → `portfolio`
  - 교육/강의/educate/course/학습/lesson/커리큘럼 → `education`
- `DOMAIN_TO_INTERACTIVE`: portfolio → carousel, education → accordion

prompt 매트릭스 가이드와 자동 보강 정합 복원.

### ME-02: makeInteractiveNode 자동 id 가 같은 ms 에서 충돌 가능

**Files modified:** `apps/web/src/app/generation-normalize.ts`
**Commit:** `255c0e6`
**Applied fix:**
- 모듈-스코프 `interactiveNodeCounter` 단조 증가 카운터 추가
- id 형식을 `auto-${type}-${Date.now().toString(36)}-${counter}` 로 변경

같은 ms tick 에서도 unique 보장. (page.tsx:1901 의 successes.map 병렬 normalize 케이스 안전.)

### ME-03: extractLayoutIntent leftRatio 임계 0.6 → 0.7 보수화

**Files modified:** `apps/web/src/app/image-color.ts`
**Commit:** `a59296c`
**Applied fix:**
- 좌측 두 사분면 합 임계: `>= 0.6` → `>= 0.7`
- 주석 동기화 (heuristic 설명)

균일 분포가 이미 50% 이라 0.6 은 너무 낮아 'left-aligned' 편향 유발 →
0.7 로 상향해 진짜 좌측 정렬 케이스만 잡도록.

### ME-04: enforceRichness 가 보강 후 잔여 missing 노출 안 함

**Files modified:** `apps/web/src/app/generation-normalize.ts`
**Commit:** `6c2bd3a`
**Applied fix:**
- `EnforceRichnessResult { tree: Tree; residualMissing: RichnessSignalKey[] }` 인터페이스 추가
- `enforceRichness` 반환 형태를 `Tree` → `EnforceRichnessResult` 로 변경
- 보강 후 `validateTreeRichness` 재호출 결과를 `residualMissing` 으로 노출
- `normalizeDesignTree` 는 `.tree` 만 추출해 외부 시그니처(`Tree`) 유지

caller(page.tsx:1904) 는 normalizeDesignTree 경유라 변경 없음. residualMissing 은
다음 phase 의 toast wiring 용 surface.

---

## Skipped Issues (out of --auto scope)

다음 5개는 LOW/NIT 분류로 cosmetic — `--auto` 모드 정책상 스킵.

- LO-01: `Math.max(...scores)` stack overflow 가능 (fixture 규모에서 무해)
- LO-02: `entranceAnimationSpread` 임계 6~12 vs MAX_ANIMATIONS = 8 정합
- LO-03: mergeImageReferenceColors / mergeReferenceColors 알고리즘 중복 정의
- NI-01: validateExportedFixture richness 분기 명시성 (패턴 일관성)
- NI-02: SIGNAL_COUNT 상수 vs RICHNESS_SIGNAL_KEYS.length 수기 동기화

---

_Fixed: 2026-05-11_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
