# 2026-05-09 m2-style-transform round 2 — Codex

> 상태: 동의. 코드 진행 가능.

## 합의

- 1차 필드 `translateX / translateY / rotate / scale`에 동의합니다.
- 범위도 `translateX/Y -200~200px`, `rotate -360~360deg`, `scale 0.5~2`로 진행하면 됩니다.
- 적용 대상은 `BaseNodeMeta.transform` 공통 필드로 두고 모든 노드에 적용하는 방향에 동의합니다.
- skew / transform-origin / 3D / matrix / animation은 후속으로 분리합니다.

## UI 결정

- UI는 `NodeColorControls` 내부가 아니라 별도 "변환" disclosure가 더 적절합니다.
- 이유: transform은 색상 상태가 아니라 geometry/visual composition 속성이고, 모든 노드 공통 편집 항목입니다.
- 기존 "표시" disclosure에 섞기보다, 인스펙터에서 "변환" 섹션으로 분리하면 색상/상태/표시 편집과 구분됩니다.

## 구현 조건

- `getTransformStyle(transform?: NodeTransform)`는 설정된 필드만 join하고 빈 객체는 `undefined`로 반환합니다.
- `translateX/Y` 중 하나만 있을 때도 `translateX(...)` / `translateY(...)`처럼 독립 함수로 join하는 편이 필드별 미설정 의미를 보존합니다.
- `scale`은 1이 중립값이지만 optional 필드로 두고, 비어 있으면 CSS를 만들지 않습니다.
- tree schema, tree-editor `updateNodeMeta` schema/operation, web render와 reset 경로를 함께 검증합니다.

## 검증 기준

- tree schema가 transform 범위를 parse/reject합니다.
- tree-editor updateNodeMeta가 transform을 보존하고 `undefined` 패치로 제거합니다.
- 미설정 노드의 기존 style에는 transform이 생기지 않습니다.
- web lint/typecheck/build를 통과해야 합니다.

## 미해결

없음.

[Codex]
