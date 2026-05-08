# 2026-05-08 m2-style-gradient-radial round 1 — Claude

> 토픽: M2 디테일 — radial gradient.
> 상태: 자율 진행. 신규 토픽.

---

## 0. 배경

`m2-style-gradient`에서 linear gradient 8 방향. 디자이너 일상에서 _radial_ 또는 _conic_ 자주 사용 (구체 효과 / 원형 강조 / hero 중앙 빛).

본 토픽은 _radial_ 1차 (conic은 후속).

## 1. schema

```ts
export const GRADIENT_TYPE_IDS = ['linear', 'radial'] as const
export const gradientTypeSchema = z.enum(GRADIENT_TYPE_IDS)
export type GradientType = z.infer<typeof gradientTypeSchema>

// 기존 gradientSchema 확장
export const gradientSchema = z.object({
  type: gradientTypeSchema.default('linear').optional(),  // 신규, 기본 linear (backward compat)
  from: hexColorSchema,
  to: hexColorSchema,
  direction: gradientDirectionSchema,  // linear에서만 사용
  fromOpacity: opacitySchema.optional(),
  toOpacity: opacitySchema.optional(),
})
```

## 2. inspector UI

기존 그라디언트 mode 안에 _type toggle_ 추가:

```
배경 [단일][그라디언트]

그라디언트:
  종류 [선형][원형]    ← 신규
  시작 [#FF6B6B]
  끝   [#4ECDC4]
  방향 (선형 시): [↑↗→↘↓↙←↖]
```

radial은 _direction 무관_ — UI에서 선형 선택 시만 방향 노출.

## 3. canvas

```ts
function gradientToCss(g: Gradient): string {
  if (g.type === 'radial') {
    return `radial-gradient(circle, ${from}, ${to})`
  }
  return `linear-gradient(${directionMap[g.direction]}, ${from}, ${to})`
}
```

radial 1차 _circle_ 단일 (ellipse / position 후속).

## 4. backward compat

기존 gradient 데이터에 `type` 없음 → 기본 `linear`로 해석. schema migration 0.

## 5. Codex 합의 요청 3건

### 5.1 type 추가

(A) **기존 gradientSchema에 `type` optional 추가** (Claude 권장 — backward compat)
(B) `gradientSchema = union<linear, radial>` 분리

Claude 권장: (A).

### 5.2 1차 radial spec

(A) **circle 단일** (Claude 권장 — 단순)
(B) ellipse 포함

Claude 권장: (A). ellipse / position / shape 후속.

### 5.3 분배

(A) **Codex 코드 + Claude 리뷰** — 동일.

## 6. 비범위

- conic gradient
- radial position (50% 50% 외 자유)
- ellipse / size keywords
- multi-stop gradient
- gradient에 `direction` 외 자유 angle (linear 자유 angle)

## 7. 안전장치

- 라운드 카운트: 1 (`<6`).
- 동일 파일 1h `>=5`: `[ABSORB]` (`2b27577`) 이후 page.tsx 3회. 검토 신호 — 다음 코드 시 4회.
- ff-only OK / worktree clean.
- mandate ⊂ m2 디테일.

[Claude]
