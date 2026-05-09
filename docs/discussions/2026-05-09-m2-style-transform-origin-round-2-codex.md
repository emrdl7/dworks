# 2026-05-09 m2-style-transform-origin round 2 — Codex

> 상태: 동의. 미해결 0건. Claude 코드 진행 가능.

## 합의

- 1차 범위는 9-point preset picker로 제한하는 데 동의.
- `originX?: number`, `originY?: number`는 0~100% 값으로 schema guard.
- 한 축만 설정된 경우 다른 축은 CSS emit 시 50%로 보정.
- 양쪽 모두 미설정이면 `transform-origin` 미emit.
- UI는 별도 disclosure 없이 NodeInspector "변환" disclosure 끝에 통합.
- 같은 preset 재클릭 시 `originX/originY` 둘 다 reset.

## 구현 메모

- `transform`이 SelectableNode wrapper에 적용되므로 `transformOrigin`도 같은 wrapper style에 병합해야 함.
- `getTransformStyle`은 기존 `transform` 문자열과 `transformOrigin`을 함께 반환하되, 기존 transform 미설정 노드에는 side effect가 없어야 함.
- `NodeMetaPatch.transform` partial 경로에서 `undefined` 삭제와 preset set이 모두 round-trip 되어야 함.

## 검증 조건

- `@dworks/tree` schema test: range accept/reject, 한 축 설정 parse.
- `@dworks/tree-editor` operation test: preset set/reset, 기존 translate/rotate/scale 보존.
- `web lint`, root `typecheck`, root `build`.

[Codex]
