---
phase: 05-design-system
reviewed: 2026-05-11T09:53:35Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - apps/web/src/app/theme-context.ts
  - apps/web/src/app/palette-context.ts
  - apps/web/src/app/palette-manager-dialog.tsx
  - apps/web/src/app/globals.css
  - packages/exporters/src/tokens.ts
  - packages/exporters/src/tokens.test.ts
  - apps/web/src/app/token-export.ts
  - apps/web/src/app/page.tsx
findings:
  critical: 0
  warning: 4
  info: 7
  total: 11
status: issues_found
---

# Phase 05 (design-system) — Code Review Report

**Reviewed:** 2026-05-11T09:53:35Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

DS-01 theme switcher, DS-02 custom palette CRUD, DS-03 token export 3개 작업 완료. 전반적으로 코드 품질은 좋으며 react hook 규칙 / SSR guard / localStorage 차단 fallback / 한국어 오류 메시지 / 토큰 export 출력 구조 모두 일관성 있게 처리되어 있다. Critical 보안/크래시 이슈는 발견되지 않았다.

주요 우려사항:

- **palette dialog 의 `updatePalette(name)` 호출이 모든 글자 입력마다 localStorage write를 트리거** — IME(한국어) 조합 중 매 keystroke persist (W-1).
- **palette dialog 의 `open`-conditional render 가 컴포넌트 상태(draftName/draftColors)를 매 close 사이에 보존** — 다음 open 시 이전 작업물이 그대로 남는 UX (W-2).
- **dialog 의 `onClick={(e) => e.stopPropagation()}` + `onClick={onClose}` overlay 패턴이 keyboard 사용자 ESC 대응 부재** — focus trap / ESC handler 미구현, WCAG 2.1 키보드 네비게이션 위반 (W-3).
- **palette `updatePalette` 검증 실패 시 silent drop** — 잘못된 colors patch 가 들어와도 toast 노출 없음, 사용자는 왜 안 바뀌는지 모름 (W-4).

Info 항목: hex regex 8자리 alpha 미지원(스키마 일치 의도이나 명시 필요), Korean 일관성, dead button line, fontFamily JSON.stringify 정상이나 한글 폰트명 검증 fixture 없음 등.

## Warnings

### WR-01: palette name inline 편집이 매 keystroke localStorage write 발생

**File:** `apps/web/src/app/palette-manager-dialog.tsx:130-132`
**Issue:**
```tsx
<input
  type="text"
  value={p.name}
  onChange={(e) =>
    updatePalette(p.id, { name: e.target.value })  // ← 매 키 입력마다 persist
  }
  ...
/>
```
`updatePalette` 는 내부적으로 `setPalettes(list); persist(list, activePaletteId)` 를 호출한다 (palette-context.ts:168-169). 한국어 IME 조합 중에도 자모 단위로 매번 `JSON.stringify` + `localStorage.setItem` 가 실행되므로 8개 palette × 평균 10색 데이터 전체를 매 keystroke 마다 write 한다. localStorage 동기 I/O 라 typing latency 가 증가할 수 있고, 다른 탭이 같은 키를 listen 하는 `storage` 이벤트가 폭증할 위험이 있다.

**Fix:** local draft state 도입 + onBlur(또는 debounce) 시점에만 `updatePalette` 호출.
```tsx
const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null)
// ...
<input
  type="text"
  value={editingName?.id === p.id ? editingName.value : p.name}
  onChange={(e) => setEditingName({ id: p.id, value: e.target.value })}
  onBlur={() => {
    if (editingName?.id === p.id && editingName.value !== p.name) {
      updatePalette(p.id, { name: editingName.value || '이름 없음' })
    }
    setEditingName(null)
  }}
  aria-label={`${p.name} 이름 편집`}
/>
```
또는 palette-context.ts 의 `persist` 호출을 debounce (`setTimeout` based, 200ms) 로 wrap.

---

### WR-02: dialog close 시 draft state 가 살아남아 다음 open 에 노출됨

**File:** `apps/web/src/app/palette-manager-dialog.tsx:39-42`
**Issue:**
```tsx
const [draftName, setDraftName] = useState('새 팔레트')
const [draftColors, setDraftColors] = useState<string[]>(DEFAULT_COLORS)

if (!open) return null  // ← unmount 가 아니라 단순 null 반환
```
`open=false` 일 때 `null` 을 반환하지만 컴포넌트 자체는 부모 트리에 마운트되어 있으므로 `useState` 값은 보존된다. 사용자가 색을 7개로 늘려놓고 닫은 뒤 다시 열면 이전 draft 가 그대로 보인다. `handleAdd` 의 마지막 줄 (62-63 행) 에서만 reset 되는데, 사용자가 추가하지 않고 그냥 닫으면 reset 되지 않는다.

**Fix:** open prop transition 에 reset 효과 추가.
```tsx
useEffect(() => {
  if (!open) {
    setDraftName('새 팔레트')
    setDraftColors(DEFAULT_COLORS)
  }
}, [open])
```
또는 부모(page.tsx)에서 `open` 이 false 일 때 dialog 자체를 mount 하지 않도록 변경:
```tsx
{paletteDialogOpen && (
  <PaletteManagerDialog open onClose={...} />
)}
```

---

### WR-03: dialog 에 ESC 키 / focus trap / 초점 복원 미구현 (WCAG 2.1 키보드 위반)

**File:** `apps/web/src/app/palette-manager-dialog.tsx:86-93`
**Issue:**
```tsx
<div
  className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
  onClick={onClose}
  role="dialog"
  aria-modal="true"
  aria-label="팔레트 관리"
>
```
`role="dialog"` + `aria-modal="true"` 가 선언되어 있으나 다음 키보드 기본 동작이 누락됨:
1. **ESC 키로 닫기** — keydown listener 없음.
2. **focus trap** — Tab 키가 dialog 밖 background 요소로 이동 가능.
3. **초점 복원** — dialog 열기 전 활성 element 로 닫을 때 focus 복귀 안됨.
4. **초기 focus** — 열 때 첫 가능한 element 또는 close 버튼으로 focus 이동 안됨.

WCAG 2.1 AA (Guideline 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order) 위반 가능성. 사용자 글로벌 instruction "키보드 네비게이션 지원 필수" 와 충돌.

**Fix:** ESC handler 우선 추가 + focus trap 은 후속 작업 가능.
```tsx
useEffect(() => {
  if (!open) return
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }
  window.addEventListener('keydown', handleKey)
  return () => window.removeEventListener('keydown', handleKey)
}, [open, onClose])
```
focus trap 은 `headlessui/react` Dialog 또는 직접 구현 ([first focusable element 찾기 + Tab/Shift+Tab cycle]) 권장.

---

### WR-04: palette `updatePalette` 검증 실패가 silent — 사용자 피드백 없음

**File:** `apps/web/src/app/palette-context.ts:151-172`
**Issue:**
```ts
const updatePalette = useCallback(
  (id: string, patch: Partial<Omit<Palette, 'id'>>) => {
    const list = palettes.map((p) => {
      if (p.id !== id) return p
      const next: Palette = { ...p, ...patch }
      if (patch.colors !== undefined) {
        if (
          next.colors.length < MIN_COLORS_PER_PALETTE ||
          next.colors.length > MAX_COLORS_PER_PALETTE
        ) {
          return p  // ← patch 무시, 반환 없음
        }
        if (!next.colors.every(isValidHex)) return p
      }
      return next
    })
    ...
  },
)
```
`addPalette` 는 `null` 을 반환해 dialog 에서 toast 노출 (palette-manager-dialog.tsx:57-60) 하지만 `updatePalette` 는 `void` 반환이고 invalid patch 가 들어와도 silently drop. 향후 색 편집 UI 가 colors patch 를 보낼 때 사용자는 왜 변경이 반영 안 되는지 알 수 없다. 현재 dialog 는 colors patch 를 안 보내므로 즉시 문제는 없으나, API 계약 일관성에서 risk.

**Fix:** 반환값을 `boolean` 으로 변경하거나(`true`=success, `false`=invalid drop) 또는 throw 방식으로 통일.
```ts
const updatePalette = useCallback(
  (id: string, patch: Partial<Omit<Palette, 'id'>>): boolean => {
    let success = true
    const list = palettes.map((p) => {
      if (p.id !== id) return p
      const next: Palette = { ...p, ...patch }
      if (patch.colors !== undefined) {
        if (next.colors.length < MIN_COLORS_PER_PALETTE || ...) {
          success = false
          return p
        }
        ...
      }
      return next
    })
    if (success) {
      setPalettes(list)
      persist(list, activePaletteId)
    }
    return success
  },
)
```
또는 최소한 console.warn 으로 dev 단계 가시화.

## Info

### IN-01: hex regex 가 8자리 alpha (RGBA) 미지원 — 의도 명시 필요

**File:** `apps/web/src/app/palette-context.ts:48`
**Issue:**
```ts
function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value)
}
```
주석은 "사용자가 '#000', '#abcdef' 모두 입력 가능"으로 의도를 명시하나, 4자리 (`#RGBA`) 및 8자리 (`#RRGGBBAA`) alpha hex 는 거부된다. native `<input type="color">` 자체가 alpha 미지원이라 dialog 현재 흐름에서는 문제 없으나 향후 HSL/alpha picker(v3) 도입 시 변경 필요. 또한 `tokens.ts:64` 의 `HEX_REGEX` 와 정확히 동일한 패턴이 있어 schema 와의 일관성은 OK.

**Fix:** 의도 주석에 alpha 미지원 명시.
```ts
// #RGB 또는 #RRGGBB 만 허용. #RGBA/#RRGGBBAA (alpha) 는 input[type=color] 미지원에 맞춰 거부.
// 추후 alpha picker 도입 시 regex 와 schema (packages/tree/src/schema.ts hexColorSchema) 동시 갱신 필요.
```

---

### IN-02: theme 의 `setTheme` 이 invalid 값 검증 없음

**File:** `apps/web/src/app/theme-context.ts:61-69`
**Issue:**
```ts
const setTheme = useCallback((next: Theme) => {
  setThemeState(next)
  document.documentElement.setAttribute('data-theme', next)
  ...
}, [])
```
타입은 `Theme` (`'dark'|'light'|'sepia'`) 로 제한되나 런타임 호출 측이 cast 로 우회 가능 (`setTheme('blue' as Theme)`). `readSavedTheme` 은 `VALID_THEMES.includes` 로 보호되는데 setter 는 없음. v1 에서는 호출처가 commandPalette 의 3 액션 (`page.tsx:3908,3915,3922`) 으로 한정되어 risk 낮음.

**Fix:** defensive check 추가.
```ts
const setTheme = useCallback((next: Theme) => {
  if (!VALID_THEMES.includes(next)) return
  ...
}, [])
```

---

### IN-03: `generateId` collision 확률 매우 낮으나 비-cryptographic

**File:** `apps/web/src/app/palette-context.ts:100-103`
**Issue:**
```ts
function generateId(): string {
  return `pal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
```
`Math.random()` 은 cryptographically secure 가 아니지만 palette id 는 보안 영역이 아니므로 적절. 다만 동일 ms 에 2개 생성 시 `Math.random()` 5자리(36^5≈6천만) collision 확률이 사실상 0 에 가깝지만, 모던 브라우저는 `crypto.randomUUID()` 거의 모두 지원 — 통일성에 fallback 으로 사용 권장.

**Fix:** crypto.randomUUID 우선 시도.
```ts
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pal-${crypto.randomUUID()}`
  }
  return `pal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
```

---

### IN-04: palette-manager-dialog `key={idx}` array index 사용 — 색 reorder 미구현 정당화

**File:** `apps/web/src/app/palette-manager-dialog.tsx:174,139`
**Issue:**
색 picker 행에 `key={idx}` (line 174), 기존 palette swatch 에 `key={`${p.id}-${i}`}` (line 139). 둘 다 reorder 기능이 없으므로 안전하나, 향후 색 reorder 도입 시 array index key 는 React 가 input 컴포넌트를 잘못 재사용해 native color picker 의 내부 상태 (open palette popover) 가 섞이는 버그를 유발 가능.

**Fix:** v3 reorder 도입 시 색 자체에 stable id 부여 (`{ id: string; value: string }`) 권장. 현재 단계에선 OK.

---

### IN-05: token 토큰 키 collision 가능성 — 색 hex 가 spacing px 와 같은 숫자일 때 (Tailwind 만)

**File:** `packages/exporters/src/tokens.ts:160-188`
**Issue:**
Tailwind config 의 color 키는 인덱스 기반 (`'dw-1': '#ff6600'`), spacing/radius/fontSize 키는 px 값 기반 (`'dw-24': '24px'`). spacing 과 fontSize 가 동시에 px=24 를 가지면 Tailwind 의 다른 namespace (spacing, fontSize) 에 들어가므로 collision 없음. fontFamily 만 인덱스 기반 (`'dw-1': ['Pretendard']`). **color('dw-1') 과 fontFamily('dw-1') 가 다른 namespace 라 collision 없음.** 즉 현재 출력은 안전하나, 향후 색도 px 기반(or px 가 색으로) 통합 시 위험.

또한 사용자가 Tailwind project 에 import 할 때 `bg-dw-1` 은 `colors.dw-1` 을 쓰고 `text-dw-1` 도 `colors.dw-1` 을 쓴다 — fontFamily 의 `dw-1` 은 `font-dw-1` 으로 분리. 직관 OK.

**Fix:** 변경 없음 — 의도 일치. 다만 추후 prefix 통일 (`'dw-color-1'`, `'dw-space-24'`) 권장.

---

### IN-06: token-export 의 file extension `.ts` 가 Tailwind config 으로 무조건 가정

**File:** `apps/web/src/app/token-export.ts:29`
**Issue:**
```ts
const ext = format === 'tailwind' ? 'ts' : 'css'
```
Tailwind v4 는 CSS 우선 (`@theme {}` block in CSS) 이라 `.ts` config 은 v3 호환. 사용자 프로젝트가 v4 라면 출력된 `.ts` 가 그대로 사용되지 않을 수 있다. 다만 globals.css 가 `@import 'tailwindcss'` 라 v4 사용 중인 dworks 자체 프로젝트에도 출력 형식은 v3 호환 config. README/도움말에 명시 권장.

**Fix:** 단기 — 변경 없음 (Tailwind v3 호환). 장기 — `@theme {}` CSS 형식 추가하거나 README 에 "Tailwind v3 config 형식, v4 는 CSS export 사용" 명시.

---

### IN-07: tokens.test.ts — 한국어/유니코드 fontFamily 검증 fixture 부재

**File:** `packages/exporters/src/tokens.test.ts:57,66`
**Issue:**
fixture 가 `'Pretendard'` (ASCII) 만 사용. `JSON.stringify('나눔고딕')` 은 표준 동작이지만 한글 폰트명을 사용하는 시나리오 (dworks 한국어 UX 중심) 회귀 방지에 도움.

**Fix:** 한 케이스 추가.
```ts
test('exportDesignTokens tailwind — 한글 fontFamily JSON 직렬화', () => {
  const tree = makeTree([
    {
      id: 't1', type: 'text', editKind: 'text', content: 'a',
      typography: { fontFamily: '나눔고딕' },
    },
  ])
  const out = exportDesignTokens(tree as never, 'tailwind')
  assert.ok(out.includes(`'dw-1': [${JSON.stringify('나눔고딕')}]`))
})
```

---

_Reviewed: 2026-05-11T09:53:35Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
