# Phase 5: 디자인 시스템 깊이 - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** Auto (YOLO milestone — FINAL phase)

<domain>
## Phase Boundary

theme switcher + custom palette + 토큰 export 로 _디자인 시스템 도구_ 의 기본기 확보.

**현재 상태:**
- `apps/web/src/app/globals.css` — 37+ chrome 토큰 박혀있음 (`--dw-ui-bg`, `--dw-ui-panel`, ..., `--dw-ui-accent` 등). `:root` 한 set 만 — light/sepia 토큰 없음.
- `packages/tokens/src/index.ts` — placeholder 4 line. 빌드/export 가능한 토큰 정의 없음.
- 사용자가 캔버스 트리에 박은 hex/spacing/typography 는 노드 prop 으로만 존재 — 별도 시스템 X.
- theme switcher / palette manager UI 없음.

**Phase 5 scope:**
- DS-01 — theme switcher (light/dark/sepia) — globals.css 토큰 swap
- DS-02 — custom palette 저장 (사용자 정의 5-10색 — localStorage)
- DS-03 — 디자인 토큰 export (사용된 hex/spacing/radius/font → Tailwind config 또는 CSS variables)

**Out of scope:** 자동 palette 추출 (Phase 2 AI-05 영역), 다중 theme 사용자 정의 (v3+)

</domain>

<decisions>
## Implementation Decisions

### DS-01 — Theme switcher

- **D-01**: 3 테마 — dark (현재 기본), light, sepia. dark 토큰 set 은 현재 `:root`. light/sepia 는 신규 `[data-theme="light"]` / `[data-theme="sepia"]` selector 로 추가.
- **D-02**: 토큰 매핑 — 모든 `--dw-ui-*` 토큰을 3 테마에서 정의. 한 set 당 37+ 토큰. 일관성은 light=흰 배경+짙은 텍스트+같은 accent, sepia=따뜻한 베이지 톤.
- **D-03**: 전환 UI — toolbar 또는 ⌘K 명령 팔레트에 "테마 변경" 액션. 단축키 `Shift+T` 가 quick-add 충돌 (T=text/Shift+T=tabs) — _Cmd+Shift+T_ 로 변경 (충돌 없음, OS Spotlight/탭재오픈과 일부 OS 충돌하나 acceptable).
- **D-04**: localStorage `dw:theme:v1` — 마지막 선택 테마 저장. hydration effect 가 페이지 시작 시 `data-theme` attr 설정.
- **D-05**: 신규 파일 `apps/web/src/app/theme-context.ts` — `useTheme` hook + Provider. localStorage 영속화.

### DS-02 — Custom palette

- **D-06**: 5-10색 사용자 정의 palette — 이름 + 색 배열. 여러 palette 저장 가능 (기본 + 사용자 정의 N개).
- **D-07**: localStorage `dw:palettes:v1` — palette 배열. 각 entry `{ id, name, colors: string[] }`.
- **D-08**: 인스펙터의 _color picker_ 에 "내 palette" 섹션 추가. palette 정의 UI 는 신규 dialog (`PaletteManagerDialog`).
- **D-09**: 신규 파일 `apps/web/src/app/palette-context.ts` — `usePalettes` hook + helpers (`addPalette`, `removePalette`, `updatePalette`). localStorage 동기.
- **D-10**: 신규 파일 `apps/web/src/app/palette-manager-dialog.tsx` — dialog UI (palette CRUD + 색 picker grid).

### DS-03 — 토큰 export

- **D-11**: 사용 토큰 추출 — `extractDesignTokens(tree)` 가 트리 순회하며 `{ colors: Set<string>, spacing: Set<number>, radius: Set<number>, fontSize: Set<number>, fontFamily: Set<string> }` 반환.
- **D-12**: 두 출력 형식:
  - **Tailwind config** — `.ts` 파일 (`tailwind.config.ts`) 형식. `theme.extend.colors`/`spacing`/`borderRadius`/`fontSize`/`fontFamily` 채움.
  - **CSS variables** — `.css` 파일. `:root { --dw-token-color-1: #xxx; ... }` 형식.
- **D-13**: 신규 파일 `packages/exporters/src/tokens.ts` — `exportDesignTokens(tree, format)` 어댑터. format = `'tailwind'` | `'css'`.
- **D-14**: download UI — 기존 generation 패널 "HTML 내보내기" 옆에 "토큰 (CSS)" / "토큰 (Tailwind)" 버튼 추가. Korean toast.
- **D-15**: 신규 파일 `apps/web/src/app/token-export.ts` — apps/web 어댑터 (export + download + toast).

### Claude's Discretion

- light/sepia 토큰 색상 정확한 hex 값 (Claude 자율, 사용자 mandate "기성 디자인툴 수준" 우선).
- palette dialog UI layout (Webflow/Figma 패턴 참고).
- 토큰 export 파일명 패턴 (`tokens-{label}.css` 등).
- palette 색 picker — native `<input type="color">` (단순) vs HSL picker (복잡, v3 deferred).

</decisions>

<canonical_refs>
## Canonical References

### Project-level
- `.planning/PROJECT.md` — DS-01..DS-03 정의
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md` §Phase 5

### Code anchors
- `apps/web/src/app/globals.css` (37+ chrome 토큰)
- `apps/web/src/app/layout.tsx` (`<html lang="ko">` — `data-theme` attr 위치)
- `apps/web/src/app/page.tsx` (toast 사용 패턴, generation 패널)
- `apps/web/src/app/inspector-atoms.tsx` (color picker 패턴)
- `apps/web/src/app/toast-context.ts` (useToast)
- `packages/tokens/src/index.ts` (placeholder, 신규 작업)
- `packages/exporters/src/html.ts` (Phase 4 — 어댑터 패턴 참고)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **localStorage uiPrefs:v1 패턴** — theme/palette 영속화 패턴 (Phase 1, 3 동일)
- **toast-context useToast** — Korean toast 노출 (Phase 1)
- **dialog/modal 패턴** — `<dialog>` 네이티브 (Phase 4 modal vanilla JS)
- **Blob + a.click() download** — token export 동일 (generation-export.ts)
- **packages/exporters/src/html.ts** — `exportTreeToHtml` 어댑터 패턴 — `exportDesignTokens` 동일 구조

### Established Patterns
- Korean comments + Korean strings
- TypeScript strict
- node:test 테스트 runner (packages)
- chrome 토큰만 사용 (직접 hex 회피)

### Integration Points
- globals.css — light/sepia 토큰 set 추가
- layout.tsx — `<html data-theme>` 초기 hydration (없으면 dark 기본)
- page.tsx — theme/palette context Provider mount, 토큰 export 버튼
- inspector-atoms.tsx — color picker 의 "내 palette" 섹션
- command-palette.tsx — 테마 변경 액션 + 토큰 export 액션

</code_context>

<specifics>
## Specific Ideas

- light 토큰: bg #ffffff, panel #f8f9fb, text #1a1d22, accent 동일 #6366f1 유지 (브랜드 일관성)
- sepia 토큰: bg #f5e6d3 (warm cream), panel #ede0c8, text #3d2a1f (deep brown), accent #c2410c (orange)
- palette dialog: 5-column grid swatch + add/remove/rename
- 토큰 export 파일명: `{stamp}-{label}-tokens.{css|ts}` (HTML export 패턴과 일관)

</specifics>

<deferred>
## Deferred Ideas

- 사용자 정의 theme (light/dark 외) — v3
- palette 공유/마켓플레이스 — v3
- 토큰 import (다른 프로젝트 토큰 적용) — v3
- 자동 contrast 검증 (WCAG AA/AAA) — v3
- Figma plugin 동기 — v3

</deferred>

---

*Phase: 05-design-system*
*Context gathered: 2026-05-11 (FINAL phase of v2.0)*
