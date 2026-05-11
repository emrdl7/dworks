---
phase: 05-design-system
plan: 03
subsystem: exporters
tags: [design-tokens, tailwind, css-variables, export, exporters, web-adapter]

requires:
  - phase: 04-export-depth
    provides: html.ts 어댑터 패턴 (exportTreeToHtml + Blob + anchor.click()) — tokens.ts 와 token-export.ts 가 동일 구조 차용
provides:
  - "extractDesignTokens(tree) — 트리 순회 후 colors/spacing/radius/fontSize/fontFamily 추출 (Set 기반 dedup + 정렬)"
  - "exportDesignTokens(tree, 'tailwind') — Tailwind config .ts 문자열 (theme.extend.{colors,spacing,borderRadius,fontSize,fontFamily})"
  - "exportDesignTokens(tree, 'css') — CSS variables .css 문자열 (:root { --dw-token-* })"
  - "ExtractedTokens + TokenExportFormat type"
  - "downloadTokens(input, format, exportedAt) — apps/web 어댑터, Blob + anchor.click() 다운로드"
  - "buildTokensFilename — dworks-tokens-{ISO stamp}-{safe label}.{css|ts}"
  - "page.tsx generation 패널 '토큰 (CSS)' / '토큰 (Tailwind)' 버튼 + Korean toast"
affects: [v3+ 사용자 정의 theme export, v3+ 토큰 import 양방향, v3+ Figma plugin 동기]

tech-stack:
  added: []
  patterns:
    - "트리 순회 (visit recursive on children 필드만, html.ts:detectFeatures 동일)"
    - "Set 기반 dedup + 정렬 (colors lowercase 정규화, 숫자 ascending sort)"
    - "schema-aligned 필드 매핑 — NodeColor 11 hex 키, Shape radius 5 변형 + borderColor, Spacing 9 키 (paddingTop/Right/Bottom/Left + marginTop/Right/Bottom/Left + gap), Typography.fontSize/fontFamily, ImagePresentation.overlayColor"
    - "Tailwind config .ts payload — 빈 카테고리는 블록 생략 (theme.extend 완전 비어있을 수 있음)"
    - "CSS variables payload — 카테고리 헤더 없이 :root 한 블록에 모든 토큰"
    - "apps/web 어댑터 = html-export.ts (Phase 4 EXP-03) 패턴 그대로 — payload 생성기/MIME/확장자만 분기"

key-files:
  created:
    - "packages/exporters/src/tokens.ts (extractDesignTokens + exportDesignTokens + formatTailwind + formatCss + ExtractedTokens/TokenExportFormat)"
    - "packages/exporters/src/tokens.test.ts (node:test, 5 신규 테스트)"
    - "apps/web/src/app/token-export.ts (downloadTokens + buildTokensFilename)"
  modified:
    - "packages/exporters/src/index.ts (extractDesignTokens/exportDesignTokens/ExtractedTokens/TokenExportFormat re-export)"
    - "apps/web/src/app/page.tsx (import downloadTokens, 2 handler 추가, 2 버튼 추가)"

key-decisions:
  - "schema 실 필드명 정렬 — plan 의 'padding/paddingX/paddingY/gap' 가정은 schema 와 불일치. spacingSchema 는 paddingTop/Right/Bottom/Left + marginTop/Right/Bottom/Left + gap 9 키만 valid (Rule 1 정정)"
  - "color 추출 범위 확장 — plan 의 5 색 키 (backgroundColor/textColor/borderColor/accentColor/overlayColor) 만으로는 hover/active/focus/disabled 상태 hex 누락. NodeColor 11 키 + Shape.borderColor + ImagePresentation.overlayColor 까지 통합 (Rule 2 — 완전성)"
  - "radius 추출 5 변형 — plan 의 shape.radius 만으로는 corner-specific radius 토큰 누락. radiusTopLeft/Right + radiusBottomLeft/Right 4 키 추가 (Rule 2)"
  - "hex 정규화 lowercase + dedup — '#FF0000' / '#ff0000' 동일 토큰. schema regex 는 3 또는 6 자리만 valid (8 자리 alpha 미지원)"
  - "빈 카테고리 블록 생략 (Tailwind) — colors 없으면 'colors: {}' 블록 자체 생략. CSS 도 동일 — 카테고리 라인 없음. 빈 트리 → 골격 (import/export default config + :root {}) 만"
  - "파일명: dworks-tokens-{stamp}-{label}.{css|ts} — html-export.ts:buildHtmlFilename (dworks-generation-...) 와 prefix 만 다른 일관 패턴"
  - "MIME: tailwind → text/typescript;charset=utf-8 (IANA 표준 아니지만 브라우저 다운로드 충분), css → text/css;charset=utf-8"

patterns-established:
  - "schema-aligned token extractor — 트리 순회 + Set dedup + 정렬 (visit recursive on children 만, sibling item field descend X)"
  - "exporters 어댑터 분리: packages/exporters (순수 string 생성) + apps/web/*-export.ts (Blob + anchor.click()) — Phase 4 html.ts + html-export.ts 와 동일 구조"
  - "format 분기 export: exportDesignTokens(tree, format) 한 진입점 + formatTailwind/formatCss 내부 분기 — 호출자가 같은 API 로 두 출력 모두 처리"
  - "compareMode disabled — 활성 generation 단일 보장 (HTML 내보내기 패턴과 정렬)"

threat-flags: []

requirements-completed: [DS-03]

duration: 8min
completed: 2026-05-11
---

# Phase 5 Plan 03: DS-03 Design Token Export Summary

**활성 generation 트리에서 사용된 hex/spacing/radius/fontSize/fontFamily 를 Tailwind config (.ts) 또는 CSS variables (.css) 로 export — Phase 5 디자인 시스템 깊이 마무리.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-11T09:40Z
- **Completed:** 2026-05-11T09:46Z
- **Tasks:** 3
- **Files modified:** 5 (3 신규 + 2 수정)

## Accomplishments

- `extractDesignTokens(tree)` — 트리 순회 (children recursive only) + Set dedup + 정렬. NodeColor 11 hex 키 + Shape.borderColor/radius 5 변형 + Spacing 9 키 + Typography fontSize/fontFamily + ImagePresentation.overlayColor 통합 매핑.
- `exportDesignTokens(tree, 'tailwind')` — Tailwind config .ts 문자열 (`import type { Config }` + `theme.extend.{colors,spacing,borderRadius,fontSize,fontFamily}` + `export default config`). 빈 카테고리 블록은 생략.
- `exportDesignTokens(tree, 'css')` — `:root { --dw-token-color-N / --dw-token-space-Npx / --dw-token-radius-Npx / --dw-token-fontsize-Npx / --dw-token-font-N }`.
- `downloadTokens` (apps/web 어댑터) — Blob + anchor.click() 다운로드. `dworks-tokens-{ISO stamp}-{safe label}.{css|ts}` 파일명.
- page.tsx generation 패널 — 'HTML 내보내기' 옆 '토큰 (CSS)' / '토큰 (Tailwind)' 두 버튼 추가. Korean toast 성공/실패. compareMode 시 disabled.
- 5 신규 테스트 + 9 기존 테스트 = 14 tests pass (exporters). 376 tests pass (apps/web).

## Task Commits

Each task committed atomically:

1. **Task 1: tokens.ts + index.ts re-export** — `6f1d4e8` (feat)
2. **Task 2: tokens.test.ts (5 신규 테스트)** — `e580eac` (test)
3. **Task 3: apps/web token-export.ts + page.tsx (2 핸들러 + 2 버튼)** — `2c36f46` (feat)

## Files Created/Modified

- `packages/exporters/src/tokens.ts` — extractDesignTokens + exportDesignTokens + formatTailwind + formatCss + ExtractedTokens/TokenExportFormat type (신규)
- `packages/exporters/src/tokens.test.ts` — 5 신규 테스트 (hex 추출 / spacing-radius-fontSize-fontFamily dedup / Tailwind 형식 / CSS 형식 / 빈 트리) (신규)
- `packages/exporters/src/index.ts` — extractDesignTokens/exportDesignTokens/ExtractedTokens/TokenExportFormat re-export (수정)
- `apps/web/src/app/token-export.ts` — downloadTokens + buildTokensFilename (Blob + anchor.click() 어댑터) (신규)
- `apps/web/src/app/page.tsx` — import downloadTokens, handleExportGenerationTokensCss + handleExportGenerationTokensTailwind 2 handler, '토큰 (CSS)' + '토큰 (Tailwind)' 2 버튼 (수정)

## Decisions Made

- **schema 실 필드명 정렬 (Rule 1)** — plan 의 `spacing: { padding, paddingX, paddingY, gap, margin, marginX, marginY }` 가정은 schema 와 불일치. spacingSchema 는 `paddingTop/Right/Bottom/Left` + `marginTop/Right/Bottom/Left` + `gap` 9 키만 valid. extractor 의 SPACING_KEYS 를 schema 기준으로 재정의.
- **color 추출 범위 확장 (Rule 2)** — plan 의 `HEX_KEYS = ['backgroundColor', 'textColor', 'borderColor', 'accentColor', 'overlayColor']` 5 키만으로는 NodeColor 의 hover/active/focus/disabled state hex 11 키 중 5+ 누락. 추출 완전성을 위해 11 키 전체 + shape.borderColor (Shape 안에 있음) + imagePresentation.overlayColor 까지 확장. plan 이 '추출 성공 = colors.size > 0' 만 명시했으므로 키 확장은 backward compat.
- **radius 추출 5 변형 (Rule 2)** — plan 의 `shape.radius` 단일 키만으로는 corner-specific radius (`radiusTopLeft/Right/BottomLeft/Right`) 토큰 누락. Shape schema 가 5 키 모두 valid 이므로 동시 추출. 토큰 키는 px 값 기반이므로 dedup 자연 수렴.
- **hex 정규화 lowercase + dedup** — '#FF0000' / '#ff0000' 동일 토큰으로 처리. schema 의 hexColorSchema regex `/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/` 와 정확히 일치 (8 자리 alpha 채널은 schema 미지원 — 추출 시도 시에도 정규식 reject).
- **빈 카테고리 블록 생략** — 트리에 색이 없으면 `colors: {}` 블록 자체 미출력. Tailwind config 는 `theme.extend: {}` 비어있을 수 있고 valid. CSS 도 `:root {}` 만 출력. 빈 트리 export 도 안전한 골격 유지.
- **파일명 dworks-tokens-{stamp}-{label}.{css|ts}** — html-export.ts 의 `dworks-generation-{stamp}-{label}.html` 와 prefix 만 다른 패턴 정렬. 사용자가 두 export 결과를 같은 폴더에서 정렬 시 prefix 로 grouping.
- **MIME `text/typescript`** — IANA 표준 아니지만 브라우저 다운로드 anchor 에서는 type 힌트로 충분 (실제 다운로드는 .ts 확장자로 처리).

## Deviations from Plan

### Auto-fixed Issues (Rule 1 + Rule 2)

**1. [Rule 1 - Bug] spacing 필드명 schema 불일치 정정**
- **Found during:** Task 1 (tokens.ts 작성 중 packages/tree/src/schema.ts 읽기)
- **Issue:** Plan 은 `spacing: { padding, paddingX, paddingY, gap, margin, marginX, marginY }` 7 키 가정. 실제 spacingSchema 는 `paddingTop/Right/Bottom/Left` + `marginTop/Right/Bottom/Left` + `gap` 9 키 (방향 별 분리, X/Y 단축 키 없음). plan 의 키로 추출 시도 시 _모든 spacing 값이 누락_ — 트리 어디에도 'padding' 단일 키가 없어서.
- **Fix:** SPACING_KEYS 상수를 schema 기준 9 키로 재정의. 테스트 fixture 도 schema 키 (`paddingTop`, `paddingLeft`, `gap`) 사용.
- **Files modified:** packages/exporters/src/tokens.ts, packages/exporters/src/tokens.test.ts
- **Commit:** 6f1d4e8 (tokens.ts) + e580eac (test)

**2. [Rule 2 - Critical] color 추출 범위 확장 — interaction state 11 키 + shape.borderColor + presentation.overlayColor**
- **Found during:** Task 1
- **Issue:** Plan 의 5 키 (`backgroundColor`, `textColor`, `borderColor`, `accentColor`, `overlayColor`) 가정은 NodeColor 스키마 (11 hex 키)와 부분 일치. 그리고 borderColor 는 NodeColor 가 아니라 Shape 의 필드, overlayColor 는 ImagePresentation 의 필드. plan 키로 추출 시 hover/active/focus/disabled state hex 6 키가 모두 누락되어 디자인 토큰의 _완전성_ 위반.
- **Fix:** COLOR_KEYS 11 NodeColor 키 + 별도 분기로 shape.borderColor + presentation.overlayColor 추출. maybeAddHex helper 추가.
- **Files modified:** packages/exporters/src/tokens.ts
- **Commit:** 6f1d4e8

**3. [Rule 2 - Critical] radius corner 변형 4 키 추가**
- **Found during:** Task 1
- **Issue:** Plan 은 `shape.radius` 단일 키만 추출. Shape schema 는 `radius` 외 `radiusTopLeft/Right/BottomLeft/Right` 4 키도 valid — corner-specific radius 사용한 노드의 토큰이 누락.
- **Fix:** RADIUS_KEYS 5 변형 모두 추출.
- **Files modified:** packages/exporters/src/tokens.ts
- **Commit:** 6f1d4e8

**4. [Rule 1 - Bug] tree.root 캐스팅 단순화**
- **Found during:** Task 1
- **Issue:** Plan 의 `visit(tree.root as TreeNode)` 캐스팅은 schema 의 Tree type 이 이미 `root: TreeNode` 로 정의되어 있어 불필요한 cast (typescript 가 정확한 타입 추론).
- **Fix:** `visit(tree.root)` 직접 호출 — TreeNode 타입 자연 매칭.
- **Files modified:** packages/exporters/src/tokens.ts
- **Commit:** 6f1d4e8

이외 plan 텍스트 그대로 실행. 인스펙터 색 사용처 wiring 은 v3+ deferred (DS-03 scope 밖).

## TDD Gate Compliance

본 plan 은 frontmatter `type: execute` (TDD 미요구). 그러나 git log 상 `test(05-03)` 커밋이 `feat(05-03)` 사이에 존재해 사실상 RED-after-GREEN 순서 (코드 → 테스트 → 통합). plan-level TDD gate 비적용이므로 경고 사항 아님.

## Acceptance Criteria Verification

| Criterion | Result |
| --------- | ------ |
| `grep -c "export function extractDesignTokens" packages/exporters/src/tokens.ts == 1` | 1 ✓ |
| `grep -c "export function exportDesignTokens" packages/exporters/src/tokens.ts == 1` | 1 ✓ |
| `grep -c "exportDesignTokens" packages/exporters/src/index.ts >= 1` | 1 ✓ |
| `grep -c "export function downloadTokens" apps/web/src/app/token-export.ts == 1` | 1 ✓ |
| `grep -c "토큰 (CSS)\|토큰 (Tailwind)" apps/web/src/app/page.tsx >= 2` | 6 ✓ |
| `grep -c "handleExportGenerationTokensCss\|handleExportGenerationTokensTailwind" apps/web/src/app/page.tsx >= 4` | 4 ✓ |
| exporters typecheck exit 0 | pass ✓ |
| web typecheck exit 0 | pass ✓ |
| exporters 5+ tests pass | 14/14 pass ✓ |
| web tests pass | 376/376 pass ✓ |

## Self-Check: PASSED

- packages/exporters/src/tokens.ts — FOUND
- packages/exporters/src/tokens.test.ts — FOUND
- packages/exporters/src/index.ts (modified) — FOUND
- apps/web/src/app/token-export.ts — FOUND
- apps/web/src/app/page.tsx (modified) — FOUND
- commit 6f1d4e8 — FOUND
- commit e580eac — FOUND
- commit 2c36f46 — FOUND
