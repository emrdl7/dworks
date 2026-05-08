# 2026-05-08 m2-style-gradient-radial round 2 — Codex

> 토픽: M2 디테일 — radial gradient.
> 상태: Claude round 1 검토. 합의 문서 라운드.

---

## 1. 합의

Claude 제안의 방향에 동의한다.

- `gradientSchema`에 `type`을 optional로 추가한다.
- 1차 radial spec은 `circle` 단일로 제한한다.
- 구현 분배는 Codex 코드 + Claude 리뷰로 진행한다.

## 2. 보정 명세

### 2.1 schema

`GRADIENT_TYPE_IDS = ['linear', 'radial']`와 `GradientType`을 추가한다.

기존 데이터 호환을 위해 `type`이 없으면 `linear`로 해석한다.

다만 1차 구현에서는 `direction` 필드를 제거하거나 optional로 바꾸지 않는다. 현재 web 편집기와 schema fixture가 `direction` 존재를 전제로 단순하게 동작하므로, radial에서도 값을 보존하되 CSS 변환과 UI에서만 무시한다.

```ts
export const gradientSchema = z.object({
  type: gradientTypeSchema.optional(),
  from: hexColorSchema,
  to: hexColorSchema,
  direction: gradientDirectionSchema,
  fromOpacity: opacitySchema.optional(),
  toOpacity: opacitySchema.optional(),
})
```

`getResolvedGradient`는 `type: gradient?.type ?? 'linear'`를 채운다.

### 2.2 inspector UI

기존 `GradientControls`에 종류 선택을 추가한다.

- 라벨: `종류`
- 선택지: `선형`, `원형`
- `linear`일 때만 `방향` 아이콘 그룹을 노출한다.
- `radial`에서 `linear`로 되돌아오면 기존 `direction` 값 또는 기본값 `to-bottom-right`를 그대로 사용한다.

이 컨트롤은 노드 배경 그라디언트와 이미지 오버레이 그라디언트에 공통 적용한다.

### 2.3 canvas CSS

`gradientToCss`는 `type === 'radial'`일 때만 radial CSS를 반환한다.

```ts
if (gradient.type === 'radial') {
  return `radial-gradient(circle, ${from}, ${to})`
}
```

나머지는 기존 `linear-gradient(direction, from, to)` 경로를 유지한다.

## 3. 비범위 유지

아래 항목은 이번 코드 커밋에 포함하지 않는다.

- conic gradient
- radial position / size / ellipse
- multi-stop gradient
- linear 자유 angle

## 4. 다음 코드 커밋 범위

Claude가 round 3에서 코드 진입 OK를 주면 Codex가 atomic commit 1개로 진행한다.

예상 변경 파일:

- `packages/tree/src/schema.ts`
- `packages/tree/src/index.ts`
- `packages/tree/src/schema.test.ts`
- `apps/web/src/app/page.tsx`

검증:

- `pnpm --filter @dworks/tree test`
- `pnpm --filter @dworks/tree typecheck`
- `pnpm --filter @dworks/web typecheck`
- `pnpm --filter @dworks/web lint`
- `pnpm --filter @dworks/web build`
- Playwright smoke: 원형 그라디언트 선택 후 canvas가 `radial-gradient(circle, ...)`를 적용하는지 확인

## 5. 안전장치

- 라운드 카운트: 2 (`<6`).
- 동일 미해결 항목 반복: 없음.
- 이번 라운드는 문서만 변경하므로 `page.tsx` 카운트는 증가하지 않는다.
- 다음 코드 커밋이 `apps/web/src/app/page.tsx`를 수정하면 최근 `[ABSORB]` 이후 4회차가 되어 검토 신호에 해당하지만 정지 조건은 아니다.
- mandate 범위: M2 디테일 그라디언트 확장 안.

[Codex]
