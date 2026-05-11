---
phase: 04-export-depth
plan: 03
subsystem: export-html-web-adapter
tags: [exp-01, exp-02, exp-03, exporters, web-adapter, download-ui, toast]
dependency_graph:
  requires:
    - "@dworks/exporters/html.ts (Plan 04-02 산출물 — exportTreeToHtml)"
    - "apps/web/src/app/toast-context.ts (showToast API)"
  provides:
    - "apps/web/src/app/html-export.ts — downloadGenerationAsHtml/buildHtmlFilename"
    - "apps/web/src/app/page.tsx — handleExportGenerationHtml + 'HTML 내보내기' 버튼"
  affects:
    - "사용자가 generation 패널에서 작동하는 HTML 파일 다운로드 가능"
tech_stack:
  added:
    - "@dworks/exporters workspace 의존성 (apps/web)"
  patterns:
    - "기존 JSON export (handleExportActiveGeneration) 의 Blob + anchor.click() 패턴 정렬"
    - "showToast(message, tone) 시그니처 (toast-context.ts API)"
key_files:
  created:
    - "apps/web/src/app/html-export.ts"
  modified:
    - "apps/web/package.json"
    - "apps/web/src/app/page.tsx"
    - "pnpm-lock.yaml"
decisions:
  - "Plan 의 showToast({tone, message}) 객체 시그니처 → 실제 toast-context.ts API (message, tone) 위치 인자로 정정 (Rule 1)"
  - "버튼 disabled 조건: plan 의 activeGenerationId === null → JSON 내보내기와 동일한 compareMode 로 정렬 (Rule 2 일관성). 핸들러 내부에서 active === undefined early-return 으로 안전 가드 유지"
  - "buildHtmlFilename prefix 'dworks-generation-' + label 없을 시 '-export' fallback — generation-export.ts:buildExportFilename 패턴 일치"
  - "exportTreeToHtml 호출 옵션: title=label, lang='ko' (CLAUDE.md 한국어 정책 + 한국어 sr-only/aria 텍스트 일관)"
metrics:
  duration: "6min"
  completed: "2026-05-11"
---

# Phase 4 Plan 03: apps/web HTML 내보내기 어댑터 + download UI Summary

JSON 내보내기 옆에 'HTML 내보내기' 버튼 추가, `@dworks/exporters` 의 `exportTreeToHtml` 을 web 환경에서 호출해 작동하는 HTML 파일을 다운로드한다.

## Tasks Completed

### Task 1 — html-export.ts 어댑터 (commit 97e8cbf)

- `apps/web/package.json` `dependencies` 에 `@dworks/exporters: workspace:*` 추가 (alphabetical 위치 — @dworks/tree 위)
- 신규 `apps/web/src/app/html-export.ts` (53 줄):
  - `DownloadHtmlInput { tree, label }` interface
  - `buildHtmlFilename(exportedAt, label)`: `dworks-generation-{ISO stamp}-{safe label || 'export'}.html` (generation-export.ts:buildExportFilename 패턴 정렬)
  - `downloadGenerationAsHtml(input, exportedAt)`: exportTreeToHtml({ title, lang:'ko' }) → Blob('text/html;charset=utf-8') → anchor.click() → URL.revokeObjectURL (try/finally)
- `pnpm install` (이미 up-to-date), typecheck pass

### Task 2 — page.tsx HTML 내보내기 버튼 + handler (commit b63a208)

- import 추가: `import { downloadGenerationAsHtml } from './html-export'`
- `handleExportGenerationHtml` 핸들러 (handleExportActiveGeneration 직후):
  - `generations.find` → active undefined 시 early return (JSON 핸들러 동일 패턴)
  - try/catch — 성공 시 `showToast(\`${filename} 다운로드\`, 'success')`, 실패 시 `showToast(\`HTML 내보내기 실패: ${error.message}\`, 'error')`
- generation 패널 (line ~4306) 의 JSON 내보내기 버튼 _바로 옆_ 에 'HTML 내보내기' 버튼 추가
  - 동일 className 패턴 (border + bg + hover + disabled:opacity-40)
  - `disabled={compareMode}` (JSON 버튼과 정렬)
  - aria-label="HTML 내보내기" + title (한국어 설명)
- typecheck pass + 376 tests pass

## Acceptance Criteria — All Pass

| Criterion | Required | Actual |
| --------- | -------- | ------ |
| `grep -c "@dworks/exporters" apps/web/package.json` | ≥ 1 | 1 |
| `grep -c "export function downloadGenerationAsHtml" .../html-export.ts` | == 1 | 1 |
| `grep -c "buildHtmlFilename" .../html-export.ts` | ≥ 1 | 2 |
| `grep -c "downloadGenerationAsHtml" .../page.tsx` | ≥ 1 | 2 |
| `grep -c "handleExportGenerationHtml" .../page.tsx` | ≥ 2 | 2 |
| `grep -c "HTML 내보내기" .../page.tsx` | ≥ 1 | 3 |
| `pnpm --filter @dworks/web typecheck` | exit 0 | exit 0 |
| `pnpm --filter @dworks/web test` | (선택) | 376 pass / 0 fail |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] showToast 시그니처 정정**
- **Found during:** Task 2
- **Issue:** Plan 의 의사코드는 `showToast({ tone: 'success', message: '...' })` 객체 형태로 호출했으나, 실제 `apps/web/src/app/toast-context.ts:30` 의 시그니처는 `showToast(message: string, tone?: ToastTone, durationMs?: number)` (위치 인자). 객체 호출 시 TS 타입 오류 + 런타임 메시지 깨짐.
- **Fix:** `showToast(\`${filename} 다운로드\`, 'success')` / `showToast(\`HTML 내보내기 실패: ${msg}\`, 'error')` 로 정정.
- **Files modified:** apps/web/src/app/page.tsx
- **Commit:** b63a208

**2. [Rule 2 - Consistency] 버튼 disabled 조건 정렬**
- **Found during:** Task 2
- **Issue:** Plan 은 `disabled={activeGenerationId === null}` 제안. 같은 자리의 JSON 버튼은 `disabled={compareMode}`. 두 버튼이 _같은 자리, 같은 데이터 출처_ 인데 disable 조건이 다르면 사용자 혼란 (compare 모드에서 JSON 만 disable, HTML 은 enable 인 부조화).
- **Fix:** JSON 버튼과 동일한 `disabled={compareMode}` 적용. active 안전성은 핸들러 내부 `active === undefined` early-return 으로 유지.
- **Files modified:** apps/web/src/app/page.tsx
- **Commit:** b63a208

## Authentication Gates

None.

## Key Decisions Made

- **Filename 접두사 통일** — `dworks-generation-` prefix + 동일 timestamp/label sanitize 규칙 → JSON/HTML 사용자 입장에서 같은 generation 의 두 export 가 정렬되어 보임.
- **lang='ko' 옵션 명시** — CLAUDE.md 한국어 우선 정책 + exporters 의 한국어 aria/sr-only 텍스트 (이전 슬라이드/다음 슬라이드/닫기) 와 일관.
- **버튼 텍스트는 'HTML 내보내기' full label** — JSON 버튼의 단순 '내보내기' 와 구분하기 위함. JSON 버튼 텍스트는 user-facing 변경 회피 (backward compat).

## Performance

- Total duration: 6 분
- Commits: 2 (97e8cbf html-export.ts 어댑터, b63a208 page.tsx 버튼 + handler)
- Files: 4 (1 신규 + 3 수정)
- Tests: 376 pass / 0 fail

## Self-Check: PASSED

- FOUND: apps/web/src/app/html-export.ts
- FOUND: apps/web/package.json (modified)
- FOUND: apps/web/src/app/page.tsx (modified)
- FOUND commit 97e8cbf: feat(04-03): html-export.ts 어댑터 + buildHtmlFilename + downloadGenerationAsHtml
- FOUND commit b63a208: feat(04-03): page.tsx HTML 내보내기 버튼 + toast 안내
