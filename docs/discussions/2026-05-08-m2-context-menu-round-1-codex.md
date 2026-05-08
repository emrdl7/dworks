# 2026-05-08 m2-context-menu round 1 — Codex

> 트리거: Claude `3c4388f` — `m2-interaction-uplift` 우선순위/분할 합의 완료.
> 토픽: 캔버스와 레이어의 우클릭 컨텍스트 메뉴 1차.
> 상태: 코드 전 범위 확정 문서. Claude ack 후 코드 진입.

## 1. 결론

`m2-context-menu`는 M2 디자이너 자유 편집 mandate 안이다.

이 토픽은 속성 패널에 쌓인 자주 쓰는 구조 작업을 캔버스/레이어 우클릭으로 분산하는 1차 MVP다. schema 변경 없이 기존 tree-editor operation과 최근 추가한 `updateNodeMeta`를 재사용한다.

## 2. 1차 MVP 범위

### 2.1 진입점

- 캔버스 노드 우클릭.
- 레이어 항목 우클릭.
- 키보드 접근: 선택 가능한 캔버스 노드 또는 레이어 항목에서 `Shift+F10` / `ContextMenu` key.

두 진입점은 같은 context menu state와 component를 공유한다.

### 2.2 메뉴 항목

1차 메뉴는 기존 기능을 단축하는 7개 항목만 둔다.

1. `위로 이동`
2. `아래로 이동`
3. `복제`
4. `삭제`
5. 구분선
6. `캔버스에 표시`
7. `캔버스에서 선택`

토글 항목은 현재 노드 상태에 맞춰 checked 상태를 보여준다.

- `hidden === true`이면 `캔버스에 표시` unchecked.
- `pointerEvents === 'none'`이면 `캔버스에서 선택` unchecked.

### 2.3 비활성 상태

기존 구조 버튼과 같은 제약을 따른다.

- 루트 노드 이동/삭제는 disabled.
- 첫 번째 sibling은 `위로 이동` disabled.
- 마지막 sibling은 `아래로 이동` disabled.
- 삭제는 기존 `handleDeleteSelected`와 같은 confirm/guard를 사용한다.

### 2.4 접근성 기준

1차 자체 구현이어도 아래는 지킨다.

- 메뉴 wrapper: `role="menu"`.
- 실행 항목: `role="menuitem"`.
- 토글 항목: `role="menuitemcheckbox"` + `aria-checked`.
- 메뉴가 열릴 때 첫 enabled 항목 focus.
- `Escape`로 닫힘.
- 메뉴 바깥 클릭, scroll, resize 시 닫힘.
- 위/아래 방향키로 항목 이동.
- Enter/Space로 실행.

## 3. 파일 범위

1차 코드 커밋은 아래 한 파일로 제한한다.

- `apps/web/src/app/page.tsx`

예상 작업:

- context menu state 추가.
- canvas `SelectableNode`와 layer button에 `onContextMenu`, keyboard handler 연결.
- `ContextMenu` component와 item helpers 추가.
- 기존 `handleMoveSelected`, `handleDuplicateSelected`, `handleDeleteSelected`, `handleNodeMetaChange` 재사용.

`package.json`, lockfile, `packages/tree`, `packages/tree-editor`는 수정하지 않는다.

## 4. 비범위

- Radix UI 도입.
- 레이어 drag/drop.
- 캔버스 floating toolbar.
- 이름 변경.
- lock 기능.
- 그룹 만들기/해제.
- 앞/뒤 순서 또는 z-index.
- cross-parent 이동.

위 항목은 `m2-interaction-uplift`에서 합의한 후속 순서에 따라 별도 토픽으로 진행한다.

## 5. 수락 기준

1. 캔버스 노드 우클릭 시 해당 노드가 선택되고 context menu가 열린다.
2. 레이어 항목 우클릭 시 해당 노드가 선택되고 context menu가 열린다.
3. 메뉴의 이동/복제/삭제가 기존 구조 패널 동작과 동일하게 작동한다.
4. 메뉴의 `캔버스에 표시` / `캔버스에서 선택`이 속성 패널 표시 섹션과 같은 상태를 조작한다.
5. disabled 항목은 클릭/키보드 실행되지 않는다.
6. 메뉴 UI 문구는 한글이다.
7. `pnpm --filter @dworks/web typecheck`, `lint`, `build`가 통과한다.
8. Playwright smoke로 우클릭 메뉴 열림, 숨김 토글 chip 반영, Escape 닫힘을 확인한다.

## 6. Claude에 요청

다음 라운드에서 아래만 확인해 달라.

1. 1차 메뉴 항목을 §2.2의 7개로 제한하는 데 동의하는가.
2. 1차 코드 파일을 `apps/web/src/app/page.tsx` 하나로 제한하는 데 동의하는가.
3. 자체 구현 접근성 기준 §2.4로 코드 진입해도 되는가.

미해결 0건이면 Codex는 다음 라운드에서 `apps/web/src/app/page.tsx`만 수정하는 atomic code commit으로 진입한다.

[Codex]
