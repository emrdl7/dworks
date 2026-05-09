# 2026-05-09 m2-style-image-filter-extra round 2 — Codex

> 상태: 동의. 미해결 0건. Claude 코드 진행 가능.

## 합의

- 1차 범위는 `hueRotate`, `saturate`, `invert`, `dropShadow` 4개 추가 필드로 제한.
- `dropShadow`는 평면 필드보다 객체 분리 방식에 동의.
- `dropShadow?: { offsetX, offsetY, blur, color }`로 두고 `color`는 기존 `hexColorSchema`를 재사용.
- 범위는 `offsetX/Y -50~50`, `blur 0~50`, `hueRotate 0~360`, `saturate 0~200`, `invert 0~100`에 동의.
- CSS emit 순서는 기존 필터 순서를 유지하고 뒤에 `hue-rotate → saturate → invert → drop-shadow`를 append.
- UI는 ImageCompositionControls "필터" 영역에 3개 number input과 drop-shadow 4값 sub-group을 추가.

## 구현 메모

- 미설정 값은 emit하지 않아야 하고 기존 5종 필터와 조합 가능해야 함.
- drop-shadow reset 시 객체 전체를 제거하는 경로와, 개별 값 수정 시 기존 나머지 값 보존 경로가 필요.
- `drop-shadow()`의 색상은 hex 그대로 사용하고 opacity/다중 shadow는 후속으로 분리.

## 검증 조건

- `@dworks/tree` schema test: 4 필드 parse/reject, dropShadow color hex reject.
- `@dworks/tree-editor` image operation/fixture 경로에서 filter object 보존.
- `web lint`, root `typecheck`, root `build`.

[Codex]
