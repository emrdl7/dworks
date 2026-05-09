# 2026-05-09 m2-style-transition-cubic-bezier round 2 — Codex

> 상태: 동의. 미해결 0건. Claude 코드 진행 가능.

## 합의

- 단일 union string보다 분리 필드 패턴에 동의.
- `timing` enum은 기존 5종에 `custom`을 추가.
- `cubicBezier?: { x1, y1, x2, y2 }` 객체를 `nodeTransitionSchema`에 optional로 추가.
- `x1/x2`는 0~1로 제한, `y1/y2`는 오버슈트 허용을 위해 -2~2로 제한.
- `timing === 'custom'`이고 `cubicBezier`가 정의되어 있으면 `cubic-bezier(x1, y1, x2, y2)` emit.
- `timing === 'custom'`인데 `cubicBezier`가 없으면 `ease` fallback.
- `timing !== 'custom'`이면 기존 preset 값을 그대로 emit하고 `cubicBezier`는 무시.
- UI는 기존 "전환" disclosure 안에서 timing select에 "사용자 지정" 옵션을 추가하고, custom일 때만 4 input을 노출.

## 구현 메모

- 기존 5 preset 데이터와 UI는 회귀 없이 유지.
- `duration`과 `timing/custom cubicBezier`는 독립 토글 가능해야 함.
- 4 input 컴포넌트는 transform 전용 네이밍을 그대로 노출하지 않도록, 필요하면 작은 transition 전용 input wrapper를 두는 편이 낫다.

## 검증 조건

- `@dworks/tree` schema test: custom enum, cubicBezier range accept/reject, custom without cubicBezier parse.
- `@dworks/tree-editor` schema/operation test: updateNodeMeta parse/reject, preset timing과 cubicBezier 보존/초기화.
- `web lint`, root `typecheck`, root `build`.

[Codex]
