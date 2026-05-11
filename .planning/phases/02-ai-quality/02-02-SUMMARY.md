---
phase: 02-ai-quality
plan: 02
subsystem: ai-prompts
tags: [llm-prompt, markdown, domain-tone-matrix, system-prompt]

# Dependency graph
requires:
  - phase: 01-ux-core-and-measurement
    provides: 13 풍부도 신호 자체 점검 섹션 (line 1622-1638) — 매트릭스 anchor
provides:
  - 도메인 × 톤 6×5 markdown 매트릭스 30 셀 — LLM 가이드용 시드
  - 풍부도 13 신호 자체 점검 직후 / 답변→스타일 매핑 직전 위치 anchor 확정
affects: [02-03-AI-05 reference image multimodal, 02-04 generation-normalize enforceRichness — 매트릭스 직접 참조 안 함 (D-12)]

# Tech tracking
tech-stack:
  added: []
  patterns: [markdown table inside JS template literal, LLM-only guide (no runtime wiring)]

key-files:
  created: []
  modified:
    - packages/llm-prompts/src/index.ts

key-decisions:
  - "D-11/D-12/D-13 그대로 적용: LLM-only guide, 6×5=30 셀, 각 셀 색감+radius+fontWeight+entranceAnimation+권장 인터랙티브 5요소"
  - "테이블 헤더 row 의 백슬래시 escape: 템플릿 리터럴 내 \\\\\\\\ → 런타임 \\\\ → 사용자에게는 단일 백슬래시로 렌더 (markdown pipe 보호 X — 단순 표기)"

patterns-established:
  - "Markdown table inside JS template literal: 인접 섹션과 빈 줄 1개로 분리, 헤더 행에서 `\\\\` escape 단일 백슬래시 사용"
  - "LLM-only guide pattern: 코드/normalize 가 해당 섹션을 직접 parse 안 함 — prompt 토큰만 증가, runtime 영향 0"

requirements-completed: [AI-04]

# Metrics
duration: 2min
completed: 2026-05-11
---

# Phase 02 Plan 02: AI-04 도메인×톤 6×5 매트릭스 markdown 표 Summary

**LLM system prompt 에 도메인(행) × 톤(열) 6×5 markdown 매트릭스 30 셀 추가 — 색감/radius/fontWeight/entranceAnimation/권장 인터랙티브 5요소 일관 시드 가이드**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-11T05:11:08Z
- **Completed:** 2026-05-11T05:12:59Z
- **Tasks:** 1 / 1
- **Files modified:** 1

## Accomplishments

- `packages/llm-prompts/src/index.ts` 의 풍부도 13 신호 자체 점검 섹션(line 1622-1638) 과 답변→스타일 매핑 가이드(기존 line 1640) 사이에 신규 `## 도메인 × 톤 매트릭스` 섹션 삽입
- 6 도메인(e-commerce / SaaS / portfolio / event / education / health) × 5 톤(dark/luxury / playful/GenZ / minimal/zen / professional / warm/friendly) = 30 셀 markdown table
- 각 셀: color palette(raw hex 시드) + shape.radius 범위 + typography.fontWeight 범위 + entranceAnimation 패턴(예: hero.title slide-up 700ms, cards staggered 150ms) + 권장 인터랙티브 컴포넌트(carousel / tabs / accordion / modal)
- 매트릭스 closing 문장: 매트릭스 외 조합은 도메인 시그니처 + 톤 매핑 자유 조합 — 매트릭스는 빈도 높은 30 조합의 시드일 뿐 (빈티지/사이버 등은 기존 11 톤 매핑 사용)
- D-12 준수: generation-normalize 자동 보강이 매트릭스 cell 을 직접 참조하지 않음 — LLM 가이드용 prompt 텍스트만 증가, runtime 영향 0

## Task Commits

Each task was committed atomically:

1. **Task 1: 도메인×톤 6×5 매트릭스 markdown 섹션 삽입** — `e6ab61f` (feat)

## Files Created/Modified

- `packages/llm-prompts/src/index.ts` — 풍부도 13 신호 섹션 직후 + 답변→스타일 매핑 직전에 17 라인 매트릭스 markdown 섹션 추가 (1738 → 1755 라인)

## Decisions Made

- **셀 wording source — 11 톤 매핑(line 1644-1654) + 4 도메인 예시(line 1662-1664) 재활용 + 도메인×톤 응용 (D-13 Claude 자율 영역).** 색감/radius/fontWeight/entranceAnimation 5요소를 _모든_ 30 셀에 일관 표현하여 LLM 이 missing cell 도 패턴 유추 가능.
- **테이블 헤더 row backslash escape — 템플릿 리터럴 안에서 `\\\\` 로 작성, 런타임 string 에서는 `\\` (두 백슬래시), markdown 렌더 시 단일 `\\` 표시.** 초기 작성 시 `\\\\\\\\` (4 백슬래시) 로 작성하여 런타임 `\\\\` (2 백슬래시) 가 됨을 발견 — 인지 시점 fix 로 `\\\\` (2 → 런타임 1 → 렌더 1) 로 정정. acceptance 테스트는 단일 escape 만 검증.
- **LLM-only guide — D-12 그대로.** Plan 04(enforceRichness) 가 매트릭스 cell 을 parse 하지 않으므로 _격리된_ markdown 섹션. prompt 토큰 ~3000 증가 (12% — 감내 범위, D-13).

## Deviations from Plan

None - plan executed exactly as written.

(처음 매트릭스 헤더 backslash 를 `\\\\\\\\` 로 작성한 후 즉시 자체 검토에서 `\\\\` 로 수정 — 동일 task 내 수정, 별도 commit 없음, Rule 1/2/3 deviation 아님. acceptance grep 은 첫 작성/수정 모두 통과.)

---

**Total deviations:** 0
**Impact on plan:** 계획과 동일. D-11/D-12/D-13 그대로 적용.

## Issues Encountered

None.

## User Setup Required

None - 빌드 / 배포 / 환경 변수 / 외부 서비스 영향 0. 다음 LLM 호출부터 system prompt 에 자동 포함.

## Verification Performed

- `grep -c "## 도메인 × 톤 매트릭스" packages/llm-prompts/src/index.ts` → 1 (pass)
- `grep -c "| dark/luxury | playful/GenZ | minimal/zen | professional | warm/friendly |"` → 1 (pass)
- `grep -cE "^\\| (e-commerce|SaaS|portfolio|event|education|health) "` → 6 (pass)
- `awk` 섹션 순서: 풍부도 13 신호 < 도메인×톤 매트릭스 < 답변→스타일 매핑 → true (pass)
- 셀 수: 6 행 × 5 톤 셀 = 30 셀 (pass)
- `pnpm --filter @dworks/llm-prompts exec tsc --noEmit` → exit 0 (pass)

## Next Phase Readiness

- AI-04 완료 — 02-03 (AI-05 reference image multimodal 강화) / 02-04 (generation-normalize enforceRichness hook) 진행 가능.
- 매트릭스는 _독립_ 섹션 — Plan 04 enforceRichness 의 인터랙티브 컴포넌트 자동 추가(D-05/D-06/D-07) 와 충돌 없음. inferDomain regex(D-05) 의 도메인 5종(ecommerce/saas/faq/auth/default) 은 매트릭스 6 도메인(+ portfolio/event/education/health) 의 _부분집합_ — Plan 04 에서 inferDomain 확장 여부는 Plan 04 자율 (현재는 빈도 기준 5종으로 충분).

## Self-Check: PASSED

- FOUND: packages/llm-prompts/src/index.ts modification (1738 → 1755 라인, +17 라인)
- FOUND: commit e6ab61f in git log
- FOUND: matrix section between line 1640-1656 (between 13 signal section at 1622 and 답변→스타일 매핑 at 1657)
- FOUND: 6 domain rows × 5 tone columns × cell content with 5요소
- TypeScript typecheck pass (exit 0)

---
*Phase: 02-ai-quality*
*Completed: 2026-05-11*
