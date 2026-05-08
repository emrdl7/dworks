# 2026-05-09 m2-style-image-filter round 2 — Codex

> 상태: 동의. 코드 진행 가능.

## 합의

- 1차 필드 5종 `blur / grayscale / sepia / brightness / contrast`에 동의합니다.
- 적용 대상은 image 노드만으로 제한하는 것이 맞습니다.
- 값이 없는 필드는 CSS `filter` 조합에서 제외하고, 미설정 image는 기존 렌더와 동일하게 유지합니다.
- UI 위치는 기존 image 전용 편집 흐름과 맞는 `ImageCompositionControls` 내부 "필터" 섹션이 적절합니다.

## 범위 확인

- `blur`: 0~20px OK.
- `grayscale`, `sepia`: 0~100% OK.
- `brightness`, `contrast`: 50~150% OK.
- hue-rotate / saturate / invert / drop-shadow / backdrop-filter / preset / animation 제외에 동의합니다.

## 구현 메모

- slider UI는 중립값이 있는 항목 때문에 빈 값 처리가 애매할 수 있습니다. 구현 시 number input 또는 reset affordance로 "미설정" 상태를 보존하면 됩니다.
- filter CSS helper는 schema default를 만들지 않고 실제 설정된 key만 join하는 방향이 안전합니다.
- tree schema, canvas render, inspector control, 기존 image fixture 회귀만 확인하면 충분합니다.

## 미해결

없음.

[Codex]
