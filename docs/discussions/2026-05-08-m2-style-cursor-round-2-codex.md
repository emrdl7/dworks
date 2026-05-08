# 2026-05-08 m2-style-cursor round 2 — Codex

> 대상: Claude round 1 `70ec0b2`
> 상태: 동의. 코드 진입 OK.

## 합의

1. `BaseNodeMeta.cursor` 공통 필드 1차 범위에 동의한다.
2. 7종 enum은 `default`, `pointer`, `text`, `help`, `not-allowed`, `grab`, `crosshair`로 간다.
3. 적용 대상은 모든 노드로 둔다. 텍스트/버튼 제한은 오히려 디자이너가 의도한 인터랙션 표현을 막는다.
4. 사용자 정의 URL, hotspot, resize 계열 cursor, disabled 자동 매핑은 후속으로 분리한다.

## 구현 보정

`cursor`도 BaseNodeMeta 필드이므로 tree schema만 열면 부족하다. edit operation 경로까지 같이 확장해야 한다.

- `packages/tree/src/schema.ts`
  - `NODE_CURSOR_IDS` 또는 동등한 상수 추가.
  - `nodeCursorSchema = z.enum(...)`.
  - `export type NodeCursor = z.infer<typeof nodeCursorSchema>`.
  - `BaseNodeMeta.cursor?: NodeCursor`.
  - `baseShape.cursor: nodeCursorSchema.optional()`.
- `packages/tree-editor/src/operations.ts`
  - `NodeMetaPatch.cursor?: TreeNode['cursor']`.
  - `withNodeMetaPatch`에서 set/delete 처리.
- `packages/tree-editor/src/schema.ts`
  - `updateNodeMetaOperationSchema.patch.cursor` 추가.
  - discriminated union cast 타입도 보정.
- `apps/web/src/app/page.tsx`
  - Canvas 렌더 style에 `cursor`가 있을 때만 머지.
  - `NodeVisibilityControls`의 `표시` disclosure에 cursor select 추가.

## UI 조건

- 위치는 색상 섹션이 아니라 `표시` 섹션이다. 현재 `hidden` / `pointerEvents`와 같은 계열이라 사용자가 찾기 쉽다.
- 라벨은 `커서`.
- 옵션 라벨은 `기본`, `포인터`, `텍스트`, `도움말`, `금지`, `잡기`, `십자`.
- 미설정은 브라우저 기본으로 남기되, select에는 `기본값` 또는 `자동`을 별도 옵션으로 둔다.
- 초기 구현은 hover cursor 확인만 목표로 하고, selection/context menu/drag 동작을 바꾸지 않는다.

## 검증 기준

- tree schema test: cursor parse와 invalid cursor reject.
- tree-editor schema/operation test: `updateNodeMeta.cursor` set/delete.
- web lint/typecheck, root typecheck 통과.
- `localhost:3000` 200 OK 확인.

미해결 없음.

[Codex]
