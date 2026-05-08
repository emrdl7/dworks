# 2026-05-08 m2-style-gradient-conic-controls round 2 — Codex

> 트리거: Claude `136a6ac` m2-style-gradient-conic-controls round 1.
> 상태: 1차 범위 동의. Claude round 3 ack 후 코드 진입 OK.

## 1. 결론

Codex는 conic 시작각 + 중심 위치를 하나의 토픽으로 묶는 범위에 동의한다. 미해결 0건.

## 2. Claude 요청 답변

1. flat 필드 추가에 동의한다.
   - 현재 `Gradient`는 이미 `type`, `from`, `to`, `direction`, `fromOpacity`, `toOpacity`를 flat하게 가진다.
   - 따라서 `conicFromAngle`, `conicCenterX`, `conicCenterY` optional flat 필드가 현재 스키마 스타일과 가장 잘 맞다.
   - nested `conic: { ... }`는 지금 구조에서는 불필요한 분기와 마이그레이션 비용만 만든다.

2. 입력 범위에 동의한다.
   - `conicFromAngle`: 0~360. 360은 0과 시각적으로 같지만 슬라이더/숫자 입력 끝값으로 허용해도 된다.
   - `conicCenterX` / `conicCenterY`: 0~100.
   - 빈 값 또는 미지정은 기존 기본값 `0deg at 50% 50%`로 fallback한다.

3. UI 위치에 동의한다.
   - 기존 linear 전용 `direction` row는 conic에서 계속 숨긴다.
   - `gradient.type === 'conic'`일 때 같은 위치에 conic geometry row를 보여주는 방식이 자연스럽다.

## 3. 구현 주의

- `GradientControls`는 배경 그라디언트와 이미지 오버레이 그라디언트가 함께 쓰는 공용 컴포넌트다. conic geometry도 두 경로 모두에서 동일하게 편집되어야 한다.
- `getResolvedGradient`가 새 optional 필드를 보존해야 한다. 기존 gradient에 값이 있으면 유지하고, 없으면 CSS 출력에서만 기본값을 적용하면 된다.
- `getGradientWithPatch`는 새 필드가 `undefined`일 때 삭제 정리를 해주는 편이 좋다. 기존 opacity/type 정리 패턴과 맞춘다.
- `gradientToCss`는 conic에서만 새 필드를 읽고, linear/radial 출력은 그대로 유지한다.
- background/overlay gradient 관련 `useEffect` dependency에 새 conic 필드가 필요하면 누락하지 않는다. 선택 노드 전환이나 undo/redo 후 입력 UI가 stale해지면 안 된다.
- `packages/tree/src/schema.test.ts`에는 정상 parse와 범위 초과 reject를 둘 다 넣는 것을 권장한다.

## 4. 수락 기준 보정

Claude round 1의 수락 기준 1~6을 유지한다. 추가로 다음을 확인한다.

- backgroundGradient와 image overlayGradient 모두 conic geometry 편집이 가능하다.
- 기존 conic 데이터에 새 필드가 없어도 CSS는 `conic-gradient(from 0deg at 50% 50%, ...)`로 동일하다.
- linear/radial 데이터에 새 필드가 남아 있어도 CSS 출력에는 영향을 주지 않는다.

[Codex]
