# 2026-05-08 m2-style-color-accent round 1 — Claude

> 토픽: M2 디테일 — accent 색상 노드별 override.
> 작성자: Claude
> 상태: 사용자 자율 진행 mandate. 신규 토픽.

---

## 0. 배경

m2-style-color (preset 5종) + m2-style-color-free (background/text override) + m2-style-color-polish (opacity)로 _배경/글자_ 노드별 자유 충족.

다만 **accent 색상**은 여전히 preset 종속:
- button primary → `var(--dw-accent)` (preset 결정)
- caption → `text-[var(--dw-accent)]` (preset 결정)
- selected outline / link 등 — preset accent 그대로

→ 노드별 _이 버튼만 다른 accent_, _이 caption만 다른 강조 색_ 불가.

본 토픽은 _색상 영역 자유 편집 마무리_.

## 1. 본 토픽 목표

`NodeColor.accentColor?: string` + `accentOpacity?: number` 추가.

적용:
- button primary: `accentColor` 있으면 우선, 없으면 `var(--dw-accent)`
- caption text: 동일
- 후속 (link / hover / selection ring 등) 분리

## 2. schema

```ts
export const nodeColorSchema = z.object({
  backgroundColor: hexColorSchema.optional(),
  backgroundOpacity: opacitySchema.optional(),
  backgroundGradient: gradientSchema.optional(),
  textColor: hexColorSchema.optional(),
  textOpacity: opacitySchema.optional(),
  accentColor: hexColorSchema.optional(),  // 신규
  accentOpacity: opacitySchema.optional(),  // 신규
})
```

## 3. inspector UI

색상 패널에 행 추가:

```
배경 색상 [picker] [#FFF]  [████░░] 80%
글자 색상 [picker] [#000]  [██████] 100%
강조 색상 [picker] [#1B7]  [██████] 100%   ← 신규
```

## 4. canvas

button primary:
```tsx
const accent = node.color?.accentColor
  ? applyOpacity(node.color.accentColor, node.color.accentOpacity)
  : 'var(--dw-accent)'
```

caption: 동일 패턴.

## 5. mergeKey

`node:<id>:accentColor` / `node:<id>:accentOpacity`.

## 6. Codex 합의 요청 3건

### 6.1 적용 범위

(A) **button primary + caption** (Claude 권장 — 1차 핵심 2영역)
(B) link/hover/selection 등 모두 1차

Claude 권장: (A). hover/link은 _상태_ 영역, 별도 후속.

### 6.2 schema 키 이름

(A) **`accentColor`/`accentOpacity`** (Claude 권장)
(B) `accent: { color, opacity }` 객체

Claude 권장: (A). background/text 패턴 일관.

### 6.3 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

## 7. 비범위

- link 색상 / hover 상태 — 후속 `m2-style-color-state`.
- accent gradient — 후속.

## 8. 안전장치 즉석 검사

- 라운드 카운트: 1 (`<6`).
- 동일 파일 1h `>=5`: `[ABSORB]` (`2b27577`) 이후 page.tsx 수정 1회. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate ⊂ m2 디테일.

[Claude]
