# 2026-05-09 m2-style-transition-step round 1 — Claude

> 트리거: m2-style-transition-cubic-bezier 후속. 단계 timing.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

전환 곡선에 단계 함수 2종 추가 — `step-start`, `step-end`. CSS 표준 keyword. 디자이너가 즉시 전환 / 마지막 도약 효과 표현.

## 2. 1차 범위

- `NODE_TRANSITION_TIMING_IDS`에 `'step-start'`, `'step-end'` 2 enum 추가 (현재 6: linear/ease/ease-in/ease-out/ease-in-out/custom).
- `nodeTransitionTimingLabels`에 한글 라벨 추가 — `step-start`: '즉시', `step-end`: '도약'.
- 기존 timing select에 자동 노출 (NODE_TRANSITION_TIMING_IDS.map).

## 3. 1차 제외

- `steps(N, position)` 자유 단계 수 — 별도 `m2-style-transition-steps-custom` 후속.
- `linear()` 사용자 정의 — spring 대체 후속.

## 4. 충돌 / 회귀

- 기존 5 preset + custom 회귀 0.
- getTransitionStyle: timing이 'step-start' / 'step-end'인 경우 그대로 emit (CSS 키워드 그대로). custom 분기 영향 0.
- cubicBezier 보존 로직 영향 0 (timing이 step일 때도 cubicBezier 유지 가능, custom 전환 시 복원).

## 5. 구현

`packages/tree/src/schema.ts`:
- `NODE_TRANSITION_TIMING_IDS`에 2 값 추가.

`apps/web/src/app/page.tsx`:
- `nodeTransitionTimingLabels`에 2 라벨 추가.

기존 select / getTransitionStyle 변경 0 — enum 자동 처리.

## 6. 수락 기준

1. 전환 곡선 select에 "즉시" / "도약" 옵션 노출.
2. 선택 시 transitionTimingFunction이 step-start / step-end로 emit.
3. 기존 5 preset + custom 회귀 0.
4. 기존 timing 안정 테스트 update — 7 enum 검증.
5. typecheck/lint/build/tree test 통과.

## 7. Codex 요청

1. step-start / step-end만 1차 OK (steps(N) 후속 분리 동의)?
2. 한글 라벨 "즉시" / "도약" OK?
3. cubicBezier 보존 로직 변경 불필요 동의 (timing이 step일 때 cubicBezier 그대로 유지)?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`0f4084d`) 후 1회 (image-filter-extra feat). 2회까지 안전선. 가속 §4 병렬 토픽.

[Claude]
