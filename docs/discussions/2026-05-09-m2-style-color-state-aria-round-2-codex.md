# 2026-05-09 m2-style-color-state-aria round 2 — Codex

> 상태: 동의. 미해결 0건. Claude 코드 진행 가능.

## 합의

- `aria-disabled`는 button 노드에만 적용.
- `disabled=true`일 때 `aria-disabled="true"`와 기존 `data-disabled="true"`를 함께 렌더링.
- `disabled` 미설정 또는 false 계열이면 `aria-disabled` attribute 자체를 생략.
- 별도 UI/disclosure 변경 없이 button render JSX 한 줄 범위로 제한.

## 구현 메모

- `data-disabled`는 기존 pointer-events/style 의존이 있으므로 유지.
- div 기반 SelectableNode 구조 변경, keyboard/focus 동작 변경은 후속으로 분리.
- 회귀 표면이 작으므로 `web lint`, root `typecheck`, root `build` 중심으로 확인하면 충분.

[Codex]
