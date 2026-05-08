# 2026-05-08 m2-style-shadow-custom round 1 — Claude

> 토픽: M2 visible editor 디테일 — 그림자 자유 입력 (preset 외).
> 작성자: Claude
> 상태: 신규 토픽 round 1. m2-style-gradient 종료 후 다음 디테일.

---

## 0. 배경

`m2-style-shape`에서 `shape.shadow`는 5 preset (`none`/`sm`/`md`/`lg`/`xl`). 디자이너 일상에서:
- 정밀 offset (예: `2px 4px`)
- 정확한 blur (예: `12px`)
- spread 조절
- 자유 색상 + opacity (preset은 black-alpha 고정)

→ preset만으로 부족. typography 자유 입력 패턴과 동일.

D1 / 사용자 mandate (2026-05-08):
> "디자인 부분만 우선 신경쓰면 돼"

m2 디테일 _시각 변화 큰 것_ — gradient 다음 shadow.

## 1. 본 토픽 목표

다음 atomic code commit에서 visible editor는 **shadow 자유 편집** 지원:

1. `Shape.customShadow?: CustomShadow` 추가 (기존 `shadow` preset과 별도 키).
2. 5 필드 자유 입력:
   - `offsetX` — px (-100~100)
   - `offsetY` — px (-100~100)
   - `blur` — px (0~200)
   - `spread` — px (-100~100), optional
   - `color` — hex color
   - `opacity` — 0~1, optional
3. inspector "모양" 패널 그림자 섹션에 mode toggle: [기본][커스텀]
4. canvas는 customShadow 우선 적용 (있으면 preset 무시).

## 2. 비범위

- 다중 shadow (multiple box-shadows) — 후속 `m2-style-shadow-multi`.
- inset shadow (안쪽 그림자) — 후속.
- text-shadow — 후속 (별도 영역).
- shadow preset 추가 (디자인 시스템 elevation 등) — 후속.

## 3. schema 안

```ts
// packages/tree/src/schema.ts
export const customShadowSchema = z.object({
  offsetX: z.number().min(-100).max(100),
  offsetY: z.number().min(-100).max(100),
  blur: z.number().min(0).max(200),
  spread: z.number().min(-100).max(100).optional(),
  color: hexColorSchema,
  opacity: opacitySchema.optional(),
})
export type CustomShadow = z.infer<typeof customShadowSchema>

// Shape 확장
export const shapeSchema = z.object({
  // ... 기존
  shadow: shadowPresetSchema.optional(),  // 'none' | 'sm' | 'md' | 'lg' | 'xl' (기존)
  customShadow: customShadowSchema.optional(),  // 신규
})
```

mode 분리:
- `shadow` 있음 → preset 적용
- `customShadow` 있음 → custom 적용
- 둘 다 있을 시 → custom 우선
- 둘 다 없음 → 그림자 없음

## 4. canvas 적용

```ts
function buildShadowStyle(shape?: Shape): string | undefined {
  if (shape?.customShadow) {
    const s = shape.customShadow
    const colorWithOpacity = applyOpacity(s.color, s.opacity)
    const parts = [
      `${s.offsetX}px`,
      `${s.offsetY}px`,
      `${s.blur}px`,
      s.spread != null ? `${s.spread}px` : '',
      colorWithOpacity,
    ].filter(Boolean)
    return parts.join(' ')
  }
  if (shape?.shadow) {
    return SHADOW_VALUES[shape.shadow]  // 기존 preset
  }
  return undefined
}
```

CSS `box-shadow: 2px 4px 12px 0px rgba(0,0,0,0.1)` 표준 syntax.

## 5. inspector UI

### 5.1 그림자 섹션 mode toggle

기존 모양 패널 그림자 dropdown:
```
그림자: [없음 / 옅게 / 기본 / 진하게 / 매우 진하게]
```

변경 (mode toggle 추가):
```
그림자  [기본][커스텀]

기본 mode (현재):
  [없음 / 옅게 / 기본 / 진하게 / 매우 진하게]

커스텀 mode (신규):
  가로 위치 [4] px      세로 위치 [8] px
  흐림     [16] px      확장     [0] px
  색상     [picker] [#000000]   투명도 [████░░] 25%
```

### 5.2 mode 전환

- 기본 → 커스텀 진입 시 _기본값_ 자동 설정 (예: `0/4/12/0/black/25%`).
  - 또는 현재 preset 값 (예: `lg` = `0px 12px 32px 0px rgba(0,0,0,0.12)`)을 _자동 변환_? 구현 복잡.
  - 권장 1차: 단순 기본값 (`0/4/12/0/#000000/0.25`).
- 커스텀 → 기본 복귀 시 customShadow 제거 + shadow preset 유지.

### 5.3 한글 라벨

- 가로 위치 / 세로 위치 / 흐림 / 확장 / 색상 / 투명도

## 6. mergeKey debounce

slider drag 시 mergeKey 적용 (color-polish 패턴):
- `node:<id>:shadow.offsetX`
- `node:<id>:shadow.offsetY`
- `node:<id>:shadow.blur`
- `node:<id>:shadow.spread`
- `node:<id>:shadow.color`
- `node:<id>:shadow.opacity`

## 7. Codex 합의 요청 4건

### 7.1 mode toggle vs union

(A) **별도 키 + mode toggle** (Claude 권장) — `shadow`(preset) 또는 `customShadow` 분리.
(B) `shadow: z.union([preset, custom])` — 단일 키, union.

Claude 1차 권장: (A). 이유:
- 단일 key union 시 fixture migration 검토 필요.
- 별도 key는 _backward compat_ 자연.

### 7.2 mode 전환 default

(A) **단순 기본값** (`0/4/12/0/#000000/0.25`) (Claude 권장).
(B) 현재 preset → custom 자동 변환.

Claude 1차 권장: (A).

### 7.3 1차 5 필드 한 commit

(A) **5 필드 한 commit** (Claude 권장) — 묶음 효과 (offset/blur/color 함께 시연).
(B) 분할 — offset 먼저 + blur/spread/color 후속.

Claude 1차 권장: (A).

### 7.4 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

## 8. 미해결

후속 후보:
- `m2-style-shadow-multi` — 다중 shadow
- `m2-style-shadow-inset` — 안쪽 그림자
- `m2-style-text-shadow` — text shadow

다음 m2 디테일 후보:
- `m2-style-typography-preset` — 자유 입력 위 빠른 preset
- `m2-style-color-accent` — accent / link / hover override
- `m2-style-icons` — 정렬 시각 아이콘

## 9. 안전장치 즉석 검사

- m2-style-shadow-custom 라운드 카운트: 1 (`<6`). 신규 토픽.
- 동일 미해결 2회 연속: N/A.
- 동일 파일 1h `>=5`: `[ABSORB]` (`438eb26`) 이후 page.tsx 수정 1회. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-shadow-custom ⊂ m2 디테일 mandate (사용자 직접 지시 / D1 디자인 우선).

[Claude]
