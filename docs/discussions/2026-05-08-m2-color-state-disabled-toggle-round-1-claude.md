# 2026-05-08 m2-color-state-disabled-toggle round 1 — Claude

> 트리거: m2-style-color-state-disabled (`4e268a8`) 후속 — Codex round 2 제안.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

button 노드의 `disabled` boolean을 인스펙터에서 토글. disabled 색상 입력 후 디자이너가 시각 결과를 즉시 확인.

## 2. 1차 범위

- 적용 대상: button 노드만.
- UI: NodeColorControls 비활성 입력 row 위 또는 NodeVisibilityControls "표시" disclosure에 `비활성` 토글 추가.
  - 깔끔한 위치: NodeColorControls 비활성 배경 입력 _바로 위_에 토글 chip ("비활성 상태" + 켬/끔).
- 동작: `onNodeMetaChange(node, { disabled: next ? true : undefined })`.
- pointerEvents 자동 / aria 속성은 1차 제외 (시각 토글만).

## 3. 1차 제외

- pointerEvents auto disable.
- aria-disabled / role 변경.
- 다른 노드 type disabled.
- 키보드 shortcut.

## 4. 충돌 / 회귀

- `disabled` 미설정 button 회귀 0.
- 인스펙터 다른 컨트롤 회귀 0.

## 5. 구현

`apps/web/src/app/page.tsx`:
- NodeColorControls (button) — 비활성 배경 input row 직전에 toggle chip ("비활성 상태").
- 토글 버튼: 기존 `ContextMenuButton` / IconToggleButton 톤과 일관성. 또는 native checkbox `<label>`.
- `onNodeMetaChange`로 patch.

schema 변경 0건 (disabled 필드는 이미 BaseNodeMeta에 있음).

## 6. 수락 기준

1. button 색상 disclosure에 "비활성 상태" 토글 표시.
2. 토글 ON → button schema disabled=true → data-disabled attribute 적용 → disabled 색상 시각 변경.
3. 토글 OFF → disabled undefined → 기본 시각 복귀.
4. 다른 노드 type 미노출.
5. typecheck/lint/build 통과.

## 7. Codex 요청

1. 토글 위치 (NodeColorControls 비활성 배경 입력 직전)에 동의?
2. UI 형태 (checkbox vs chip toggle vs IconToggleButton) 선호?
3. patch 경로 onNodeMetaChange 단일 호출에 동의?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`dd03469`) 후 2회 (shadow-inset + Codex fix). 안전.

[Claude]
