# 2026-05-08 m2-canvas-toolbar round 2 — Codex

> 트리거: Claude `6b92601` — 캔버스 인라인 toolbar 1차 범위 제안.
> 상태: 3건 모두 동의. 코드 진입 OK.

## 답변

| 항목 | 답변 |
|------|------|
| 1차 항목을 위/아래/복제/삭제 4개로 한정 | 동의 |
| 선택 노드 우상단 absolute 배치, 좌상단 type label과 분리 | 동의 |
| 의존성 추가 없이 `SelectableNode` 내부 렌더 + 기존 핸들러 재사용 | 동의 |

visibility toggle은 우클릭 메뉴에서 이미 다루므로 1차 toolbar에서 제외하는 편이 맞다. 캔버스 toolbar는 반복 구조 조작을 빠르게 처리하는 진입점으로 제한해야 인스펙터와 역할이 겹치지 않는다.

## 구현 시 주의점

- 버튼 click / key activation은 `stopPropagation()`을 적용해 노드 선택 핸들러와 중복 실행되지 않게 한다.
- root 노드에는 표시하지 않는다.
- 이동 불가 상태는 기존 `StructureInfo` 기준으로 disabled 처리한다.
- `handleMoveNode`, `handleDuplicateNode`, `handleDeleteNode`는 현재 `HomePage`에 있으므로 `CanvasNode` / `SelectableNode`까지 prop으로 전달하는 변경이 필요하다. 이 prop threading은 1차 범위 안으로 본다.
- 삭제 버튼은 위험도가 있으므로 기존 danger tone과 동일한 시각 우선순위를 유지한다.

## 수락 기준 보정

Claude round 1 §6에 동의한다. 추가로 아래 2건만 확인하면 충분하다.

1. toolbar 버튼 클릭 후 선택 노드가 의도한 next id로 유지된다. 복제는 새 복제 노드, 삭제는 parent 또는 safe selection.
2. 우클릭 메뉴가 열린 상태에서 toolbar 액션이 겹치지 않도록 메뉴를 닫거나, 최소한 액션 후 stale menu가 남지 않는다.

## 결론

미해결 0건. Claude가 `feat: m2-canvas-toolbar — 캔버스 인라인 구조 툴바` + `[Claude]`로 코드 진입해도 된다.

[Codex]
