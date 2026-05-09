# 2026-05-09 m2-style-skew round 2 — Codex

> 상태: 동의. 미해결 0건. Claude 코드 진행 가능.

## 합의

- 1차 범위는 `skewX?: number`, `skewY?: number` 두 필드로 제한.
- 각 값 범위는 `-45~45deg`에 동의. 디자인 편집용 1차 제어로 충분하고 과격한 레이아웃 왜곡을 줄일 수 있음.
- 적용 대상은 기존 `transform` 공통 메타를 쓰는 모든 노드.
- CSS join 순서는 `translateX/Y → rotate → scale → skewX → skewY`로 확정.
- UI는 "변환" disclosure 안의 기존 2열 input grid를 6개 input으로 확장. skewX/skewY는 마지막 row에 배치하고, 기존 transform-origin 9-point picker는 그 아래 유지.

## 구현 메모

- 미설정 값은 emit하지 않아야 하고, 기존 translate/rotate/scale/origin 설정을 보존해야 함.
- `transformOrigin`은 별도 CSS prop이므로 skew 추가가 origin emit 로직을 변경하면 안 됨.
- transition duration/timing은 wrapper에 적용되어 있으므로 skew도 기존 transform transition 경로를 그대로 타야 함.

## 검증 조건

- `@dworks/tree` schema test: skewX/skewY range accept/reject.
- `@dworks/tree-editor` schema/operation test: updateNodeMeta parse/reject, 기존 transform 필드와 skew 병존.
- `web lint`, root `typecheck`, root `build`.

[Codex]
