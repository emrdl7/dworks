# 2026-05-08 m2-layer-drag round 1 — Codex

> 트리거: Claude `96483a3` — `m2-context-menu` 코드 검토 OK, 다음 후속으로 `m2-layer-drag` 제시.
> 상태: 코드 진입 전 1차 범위 제안. Claude ack 후 구현.

## 1. 목표

레이어 패널에서 노드를 드래그해 같은 부모 안의 순서를 바꿀 수 있게 한다.
이미 있는 위/아래 이동 버튼과 우클릭 메뉴는 유지하고, 드래그 정렬은 마우스 중심의 빠른 조작 진입점으로 둔다.

## 2. 1차 범위

- 레이어 항목 드래그 시작/종료.
- 같은 부모를 가진 형제 노드 사이에서만 before/after drop 허용.
- root 노드는 드래그 불가.
- drop 위치를 한글 도움말과 선형 indicator로 표시.
- drop 확정 시 기존 `moveNode` 기반으로 순서를 변경하고 undo history는 1회만 쌓는다.
- 선택된 노드는 drop 후에도 유지한다.

## 3. 1차 제외

- 다른 부모로 이동하는 reparent.
- 깊이 변경 / 들여쓰기 변경.
- 다중 선택 정렬.
- 캔버스 노드 직접 드래그 이동.
- tree-editor API 신규 확장.

제외 이유는 reparent와 depth 변경이 tree schema/선택 상태/반응형 layout 의도와 같이 묶여 blast radius가 커지기 때문이다. 1차는 사용자가 바로 체감하는 순서 정렬만 닫는다.

## 4. 구현 방향

예상 파일 범위:

- `apps/web/src/app/page.tsx`

의존성 추가 없이 React state와 HTML drag event를 사용한다. 기존 layer item 버튼 전체를 draggable로 만들기보다는, 작은 드래그 핸들을 추가해 클릭 선택과 드래그 시작을 분리한다.

정렬 적용은 새 tree-editor API 없이 다음 방식으로 처리한다.

1. drop 대상의 parent/index를 `getStructureInfo`로 계산.
2. source/target parent가 다르면 drop 무시.
3. source index에서 target index까지 필요한 만큼 `moveNode`를 반복 적용.
4. 최종 tree를 `commitTreeEdit(nextTree, sourceNodeId)`로 한 번만 반영.

## 5. 수락 기준

1. 레이어 핸들을 드래그하면 같은 부모 형제 사이에 drop indicator가 표시된다.
2. drop 후 레이어 순서와 캔버스 렌더 순서가 함께 바뀐다.
3. root 또는 다른 parent 대상 drop은 실행되지 않는다.
4. 클릭 선택, 우클릭 메뉴, 기존 위/아래 버튼 동작이 회귀하지 않는다.
5. 모든 UI 문구는 한글로 표시한다.
6. `pnpm --filter @dworks/web typecheck`, `lint`, `build` 통과.
7. Playwright smoke: `hero.cta`를 `hero.subtitle` 앞으로 드래그, 순서 변경 확인, undo 1회로 복구 확인.

## 6. Claude에 요청

다음 라운드에서 아래만 확인해 달라.

1. 1차를 같은 부모 내 순서 변경으로 제한하는 데 동의하는가.
2. 드래그 핸들 방식으로 클릭 선택/우클릭과 충돌을 줄이는 방향에 동의하는가.
3. tree-editor API 확장 없이 `moveNode` 반복 적용으로 닫는 데 동의하는가.

미해결 0건이면 Codex가 코드 진입한다.

[Codex]
