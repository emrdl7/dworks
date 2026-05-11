---
phase: 05-design-system
verified: 2026-05-11T12:00:00Z
status: human_needed
score: 9/9 must-haves verified (automated); 3 visual/UX behaviors require human spot-check
overrides_applied: 0
human_verification:
  - test: "테마 전환 즉시 색깔 swap (시각 확인)"
    expected: "⌘K → '테마: 라이트' 선택 시 인스펙터/패널/배경 모두 즉시 흰 배경+짙은 텍스트로 전환. '세피아' 는 베이지+오렌지 accent. 트리/캔버스 콘텐츠 영역은 영향 없음 (chrome only)."
    why_human: "Visual rendering — DOM mutation은 확인했으나 실제 픽셀 색이 토큰 매핑대로 표시되는지는 시각 확인 필요"
  - test: "Palette manager dialog UX (열기/입력/저장)"
    expected: "⌘K → '팔레트 관리' 선택 시 dialog 모달 열림. 색 picker 5개 표시, 추가/제거 가능 (5-10 범위). '팔레트 추가' 클릭 → toast 노출 + 새로고침 후 유지 (localStorage 'dw:palettes:v1' 영속)."
    why_human: "Dialog UI 작동 + native <input type='color'> 브라우저 picker 호환성 + 새로고침 hydration 시 영속성 확인 필요"
  - test: "토큰 export 다운로드 + 파일 내용 (CSS/Tailwind)"
    expected: "AI 생성 후 generation 패널의 '토큰 (CSS)' / '토큰 (Tailwind)' 버튼 클릭 → 파일 다운로드. 파일 내용에 :root { --dw-token-color-* } (CSS) 또는 export default config (Tailwind) 형식 + 트리에서 실제로 사용된 hex/spacing 값이 들어있음. Korean toast '{filename} 다운로드' 노출."
    why_human: "Blob + anchor.click() 브라우저 다운로드 실제 작동 + 파일 내용이 활성 트리 기반으로 채워지는지 확인 필요 (compareMode 일 때 disabled)"
---

# Phase 5: 디자인 시스템 깊이 Verification Report

**Phase Goal:** theme switcher + custom palette + 토큰 export 로 _디자인 시스템 도구_ 의 기본기 확보.
**Verified:** 2026-05-11
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | chrome 영역 theme switcher (light/dark/sepia) — globals.css 토큰 swap | ✓ VERIFIED | globals.css L87 `[data-theme='light']` + L117 `[data-theme='sepia']` 각 25 토큰. theme-context.ts L58/63 `setAttribute('data-theme', saved)`. page.tsx L3903-3923 ⌘K 3 액션 |
| 2 | custom palette 저장 — 사용자 정의 5-10색 (DS-02) | ✓ VERIFIED | palette-context.ts L29-31 MIN=5/MAX=10/MAX_PALETTES=8 + addPalette 유효성 검사 L126-129. localStorage 'dw:palettes:v1' 영속 L91-94 |
| 3 | 트리 hex/spacing/radius/font → Tailwind config 또는 CSS variables export | ✓ VERIFIED | tokens.ts extractDesignTokens (L72) + exportDesignTokens(format) (L142). format='tailwind' → Tailwind .ts 골격. format='css' → :root { --dw-token-* }. 5/5 test pass + index.ts L16-17 re-export |
| 4 | useTheme hook 이 (theme, setTheme) 반환 — localStorage dw:theme:v1 동기 | ✓ VERIFIED | theme-context.ts L25-28 ThemeContextValue 인터페이스 + L81-87 useTheme 구현 + L22 STORAGE_KEY |
| 5 | usePalettes hook 이 palettes + addPalette/removePalette/updatePalette/setActivePaletteId 반환 | ✓ VERIFIED | palette-context.ts L33-42 PaletteContextValue + L206-212 usePalettes 구현 |
| 6 | PaletteManagerDialog 가 palette CRUD + 색 picker grid 노출 | ✓ VERIFIED | palette-manager-dialog.tsx L33 export + L175 `<input type="color">` 색 picker + L102/147 close/remove + L207 추가 버튼 |
| 7 | ⌘K '테마 변경' + '팔레트 관리' 액션 작동 | ✓ VERIFIED | page.tsx L3903-3931 commandItems 4 entries (theme-dark/light/sepia + palette-manager). setTheme/setPaletteDialogOpen action wiring 확인 |
| 8 | 사용자가 generation 패널 '토큰 (CSS)' / '토큰 (Tailwind)' 버튼 클릭 시 다운로드 + Korean toast | ✓ VERIFIED | page.tsx L4433/4443 버튼 + L1741/1761 handler 2개 + downloadTokens 호출 + showToast Korean message |
| 9 | extractDesignTokens(tree) → colors/spacing/radius/fontSize/fontFamily Set 반환 + 정렬 + dedup | ✓ VERIFIED | tokens.ts L72-136. Set 기반 + Array.sort. NodeColor 11 키 + Shape.borderColor + Shape.radius 5 변형 + Spacing 9 키 + Typography fontSize/fontFamily + ImagePresentation.overlayColor 통합 |

**Score:** 9/9 truths verified (programmatic). 3 추가 항목은 사용자 visual/UX 확인 필요.

### Roadmap Success Criteria Coverage

| # | Success Criterion | Status | Evidence |
|---|------------------|--------|----------|
| SC1 | chrome 영역 theme switcher (light/dark/sepia) — globals.css 토큰 swap, 인스펙터/패널 색깔 즉시 변경 | ✓ VERIFIED + human spot-check | globals.css 3 theme set + theme-context.ts setAttribute + ⌘K 3 액션. _시각 swap 확인은 사람 검증 필요_ |
| SC2 | custom palette 저장 — 5-10색 palette localStorage 관리 | ✓ VERIFIED + human spot-check | palette-context.ts 5-10/MAX_PALETTES=8 + 'dw:palettes:v1' 영속 + PaletteManagerDialog CRUD UI. _dialog UX 확인은 사람 검증 필요_ |
| SC3 | 트리 hex/spacing/radius/font → Tailwind config (.ts) 또는 CSS variables (.css) export | ✓ VERIFIED + human spot-check | tokens.ts + token-export.ts + page.tsx 2 버튼. 5/5 단위 test pass. _브라우저 다운로드 + 파일 내용 확인은 사람 검증 필요_ |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/app/globals.css` | light/sepia 토큰 set 추가 | ✓ VERIFIED | L87-113 light 25 토큰, L117-143 sepia 25 토큰, DS-01 주석 2개 |
| `apps/web/src/app/theme-context.ts` | ThemeProvider + useTheme + Theme type | ✓ VERIFIED | 87 lines, createElement 패턴 (.ts), localStorage 동기, hydration useEffect |
| `apps/web/src/app/palette-context.ts` | PaletteProvider + usePalettes + Palette type + CRUD | ✓ VERIFIED | 214 lines, hex 검증 + 색 개수 범위 + MAX_PALETTES 8 + localStorage 'dw:palettes:v1' |
| `apps/web/src/app/palette-manager-dialog.tsx` | PaletteManagerDialog (CRUD UI + 색 picker grid) | ✓ VERIFIED | 217 lines, role=dialog + aria-modal + aria-label 명시, native `<input type="color">` |
| `packages/exporters/src/tokens.ts` | extractDesignTokens + exportDesignTokens(tree, format) + types | ✓ VERIFIED | 231 lines, 트리 순회 (children only) + Set dedup + 정렬, COLOR_KEYS 11/RADIUS_KEYS 5/SPACING_KEYS 9 |
| `packages/exporters/src/tokens.test.ts` | 5+ tests for extract + tailwind + css | ✓ VERIFIED | 14/14 tests pass (5 신규 + 9 기존 html) |
| `apps/web/src/app/token-export.ts` | downloadTokens + buildTokensFilename | ✓ VERIFIED | 58 lines, Blob + anchor.click() 패턴 (html-export.ts 동일 구조), MIME 분기 |
| `apps/web/src/app/page.tsx` | Provider wrap + handler + 버튼 + ⌘K 액션 | ✓ VERIFIED | L640-646 ThemeProvider > PaletteProvider > ToastProvider wrap, L654 useTheme, L836 paletteDialogOpen state, L1741/1761 handlers, L4433/4443 버튼, L3903-3931 4 commandItems, L5891 dialog mount |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `useTheme()` | DOM | `document.documentElement.setAttribute('data-theme', next)` | ✓ WIRED | theme-context.ts L58/L63 — hydration + setTheme 양쪽 |
| `setTheme()` | localStorage | `window.localStorage.setItem(THEME_STORAGE_KEY, next)` | ✓ WIRED | theme-context.ts L65 |
| `usePalettes()` | localStorage | `persist(palettes, activeId)` → setItem('dw:palettes:v1', JSON) | ✓ WIRED | palette-context.ts L91-94 persist 호출 위치: addPalette L133/removePalette L146/updatePalette L169/setActivePaletteId L177 |
| `PaletteManagerDialog` | `usePalettes()` | `const { palettes, addPalette, removePalette, updatePalette } = usePalettes()` | ✓ WIRED | palette-manager-dialog.tsx L37 |
| `page.tsx ⌘K` | `setTheme()` | commandItems action: `() => setTheme('dark'/'light'/'sepia')` | ✓ WIRED | page.tsx L3908/3915/3922 |
| `page.tsx ⌘K` | `setPaletteDialogOpen()` | commandItems action: `() => setPaletteDialogOpen(true)` | ✓ WIRED | page.tsx L3930 |
| `handleExportGenerationTokensCss/Tailwind` | `downloadTokens()` | `downloadTokens({tree, label}, format, new Date())` | ✓ WIRED | page.tsx L1745/L1765, active = generations.find(...) |
| `downloadTokens()` | `exportDesignTokens()` | `const content = exportDesignTokens(tree, format)` + Blob.click() | ✓ WIRED | token-export.ts L40-54 |
| `exportDesignTokens()` | `extractDesignTokens()` | `const tokens = extractDesignTokens(tree)` | ✓ WIRED | tokens.ts L143 |
| `Button` | `handler` | onClick={handleExportGenerationTokensCss/Tailwind} | ✓ WIRED | page.tsx L4428/L4438 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `PaletteManagerDialog` | `palettes` | `usePalettes()` → readSaved() (localStorage 'dw:palettes:v1') | Yes (사용자 입력 + hydration 양쪽) | ✓ FLOWING |
| `theme-context` `theme` | `useState<Theme>('dark')` | readSavedTheme() + setTheme | Yes (localStorage + 사용자 ⌘K 액션) | ✓ FLOWING |
| `handleExportGenerationTokensCss/Tailwind` | `active.tree` | `generations.find(entry.id === activeGenerationId)` | Yes (Phase 2 AI 생성 트리, restoredGenerations hydration 포함) | ✓ FLOWING |
| `extractDesignTokens` | `tree.root` 순회 결과 | TreeNode `color`/`shape`/`spacing`/`typography`/`presentation` 필드 | Yes (실제 노드 prop, 5 hex 키 + 9 spacing 키 + 5 radius 변형 + fontSize/Family) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| exporters 단위 test (token extract + format) | `pnpm --filter @dworks/exporters test` | 14/14 pass (5 token + 9 html) | ✓ PASS |
| apps/web typecheck | `pnpm --filter @dworks/web typecheck` | exit 0 (no errors) | ✓ PASS |
| globals.css 3 theme set 토큰 개수 정렬 | `awk` 블록별 grep `--dw-ui-` | :root=25, light=25, sepia=25 | ✓ PASS |
| 시각 swap (DOM mutation → 픽셀) | _브라우저 필요_ | — | ? SKIP (human verification) |
| Dialog 모달 UX (열기/입력) | _브라우저 필요_ | — | ? SKIP (human verification) |
| Blob 파일 다운로드 + 파일 내용 | _브라우저 필요_ | — | ? SKIP (human verification) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DS-01 | 05-01 | theme switcher — chrome 영역 light/dark/sepia 토글. globals.css 토큰 swap. | ✓ SATISFIED | globals.css 3 theme + theme-context.ts + page.tsx 3 액션 ⌘K. _주의:_ REQUIREMENTS.md L50 에서 DS-01 이 아직 `[ ]` 체크박스 (docs lag) |
| DS-02 | 05-02 | custom palette 저장/관리 — userFixtures와 비슷한 구조로 사용자 정의 palette 저장. | ✓ SATISFIED | palette-context.ts CRUD + localStorage + PaletteManagerDialog CRUD UI. REQUIREMENTS.md L51-52 `[x]` 처리 |
| DS-03 | 05-03 | 디자인 토큰 export — 트리 hex/spacing/radius/font → Tailwind config 또는 CSS variables. | ✓ SATISFIED | packages/exporters/src/tokens.ts + apps/web/src/app/token-export.ts + page.tsx 2 버튼. REQUIREMENTS.md L53-54 `[x]` 처리 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none in Phase 5 artifacts) | — | TODO/FIXME/placeholder 0 hits | — | — |
| REQUIREMENTS.md | L50 | DS-01 `[ ]` 미체크 (실제로는 구현됨) | ℹ️ Info | Docs hygiene — 다음 commit 시 동기화 |

### Human Verification Required

1. **테마 전환 즉시 색깔 swap (시각 확인)**
   - Test: ⌘K → '테마: 라이트' 선택, 인스펙터/패널/배경 색 변경 시각 확인. '세피아' 도 동일.
   - Expected: light = 흰 배경 + 짙은 텍스트 + indigo accent, sepia = 베이지 + 오렌지 accent. 트리/캔버스 콘텐츠는 영향 없음.
   - Why human: DOM mutation 코드는 확인했으나 실제 픽셀 색이 토큰 매핑대로 표시되는지는 시각 확인 필요.

2. **Palette manager dialog UX (열기/입력/저장)**
   - Test: ⌘K → '팔레트 관리' → dialog 모달 열림. 5색 picker 노출, 색 변경 후 '팔레트 추가' 클릭 → toast + 목록에 추가. 새로고침 후에도 유지 확인.
   - Expected: dialog 정상 토글, native color picker 작동, localStorage 영속, max 8 도달 시 disabled.
   - Why human: dialog UI + native input type=color 브라우저 호환성 + 새로고침 hydration 시 영속성 확인 필요.

3. **토큰 export 다운로드 + 파일 내용 (CSS/Tailwind)**
   - Test: AI 생성 후 generation 패널 '토큰 (CSS)' 클릭 → .css 파일 다운로드 → 내용에 `:root { --dw-token-color-N: #...; }` 존재 확인. '토큰 (Tailwind)' 도 동일 (.ts 파일 + `export default config`).
   - Expected: 파일명 `dworks-tokens-{stamp}-{label}.{css|ts}`, 내용에 활성 트리 hex/spacing 들어있음, Korean toast '{filename} 다운로드'.
   - Why human: 브라우저 다운로드 + 파일 내용이 활성 트리 기반인지 확인 필요. compareMode 일 때 disabled 확인.

### Gaps Summary

자동 검증 (코드/wiring/test) 측면에서는 9/9 must-haves 모두 통과. Phase 5 의 _기반 인프라_ — 3 theme 토큰 set, palette CRUD context + dialog, 토큰 추출 + export 함수 + 다운로드 UI — 가 모두 존재 + 연결 + 데이터 흐름 확인됨.

다만 Phase 5 의 산출물은 _시각/UX/브라우저 다운로드_ 의존 비중이 크기 때문에 (theme swap 의 시각 확인, dialog UX, 파일 실제 다운로드 + 내용 검증) 사용자의 brief 실사용 spot-check 가 합리적이다.

**비-차단성 docs 항목:** REQUIREMENTS.md L50 에서 DS-01 이 `[ ]` 로 표기 (구현은 완료). docs 동기화는 다음 commit 시 처리 가능 — Phase 5 PASS 판정에 영향 없음.

**Deferred (v3+ 명시):** 인스펙터 color picker 의 '내 palette' 섹션 wiring (D-08 CONTEXT 에서 v3+ 으로 deferred), 사용자 정의 theme (light/dark 외), palette 공유/마켓플레이스, 토큰 import, 자동 contrast 검증, Figma plugin 동기.

---

_Verified: 2026-05-11_
_Verifier: Claude (gsd-verifier)_
