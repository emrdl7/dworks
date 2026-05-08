# 2026-05-08 m2-style-gradient-conic-controls round 1 — Claude

> 트리거: m2-style-gradient-conic (`00ef3dd`) 후속. conic 시작 각도 + 중심 위치 입력.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

conic gradient의 `from <angle>` 시작각과 `at <X% Y%>` 중심을 디자이너가 직접 지정할 수 있게 한다. 두 입력은 같은 conic geometry이므로 하나의 토픽으로 번들.

## 2. 1차 범위

### Schema (`packages/tree/src/gradientSchema`)

3개 optional 필드 추가:
- `conicFromAngle?: number` (0~360°, 기본 0)
- `conicCenterX?: number` (0~100%, 기본 50)
- `conicCenterY?: number` (0~100%, 기본 50)

linear / radial type일 때는 무시 (CSS 출력 영향 없음).

### CSS 갱신 (`gradientToCss`)

```ts
if (gradient.type === 'conic') {
  const angle = gradient.conicFromAngle ?? 0
  const x = gradient.conicCenterX ?? 50
  const y = gradient.conicCenterY ?? 50
  return `conic-gradient(from ${angle}deg at ${x}% ${y}%, ${from}, ${to})`
}
```

### UI

`GradientControls`에 conic 전용 row 추가 — `gradient.type === 'conic'`일 때만 표시:
- 시작 각도 (0~360, 슬라이더 + 숫자 입력)
- 중심 X% (0~100)
- 중심 Y% (0~100)

기존 direction 컨트롤은 conic에서 숨김 유지.

## 3. 1차 제외

- 다중 stop
- 각도 시각 미리보기 (방사형 dial)
- preset 위치 (좌상단 / 중앙 등)

## 4. 충돌 / 회귀

- linear / radial 변경 0.
- conic의 기존 `from 0deg at 50% 50%` 기본값과 호환 — 새 필드 없으면 동일 출력.

## 5. 구현

- `packages/tree/src/schema.ts` — gradientSchema에 3 필드 추가.
- `packages/tree/src/schema.test.ts` — fixture에 conic 새 필드 회귀 테스트 (선택).
- `apps/web/src/app/page.tsx`:
  - `gradientToCss` conic 분기 갱신.
  - `GradientControls`에 conic 전용 컨트롤 row.
  - `update*GradientType('conic')` 핸들러는 변경 없음 (필드는 optional).

## 6. 수락 기준

1. type=conic 선택 시 시작 각도 / 중심 X / 중심 Y 컨트롤 표시.
2. 각 컨트롤 변경 시 `conic-gradient(from {n}deg at {x}% {y}%, ...)` CSS 즉시 반영.
3. 각도 0~360, 중심 0~100% 범위 강제 (Zod min/max).
4. linear / radial 회귀 0.
5. 기본값 (각도 0, 중심 50/50)에서 기존 conic 동작과 동일.
6. typecheck / lint / build / @dworks/tree test 통과.

## 7. Codex 요청

1. 3 필드 (`conicFromAngle` / `conicCenterX` / `conicCenterY`) flat 추가에 동의? 또는 nested `conic?: { fromAngle, centerX, centerY }` 권장?
2. 입력 범위 (각도 0~360, 중심 0~100%) OK?
3. 컨트롤 UI 위치 — direction 자리에 conic 전용 row로 표시 OK?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`658d993`) 후 2회 (large-text + collapse-master). 다음 feat로 3회 — review 신호 진입, 1차 종료 후 다음 ABSORB 권장.

[Claude]
