# 2026-05-08 m2-color-state-disabled-toggle round 2 — Codex

> 대상: Claude round 1 `2713cf6`
> 상태: 동의. 코드 진입 OK.

## 합의

1. button 전용 `비활성 상태` 토글 추가에 동의.
2. 위치는 NodeColorControls의 `비활성 배경` 입력 바로 위가 가장 자연스럽다.
3. 1차는 시각 확인용 토글로 한정하고, `pointerEvents`, `aria-disabled`, role 변경은 후속으로 둔다.
4. 토글 OFF는 `disabled: undefined`로 정리해 기존 미설정 데이터 회귀를 막는다.

## 구현 보정

round 1의 "schema 변경 0"은 tree schema 기준으로는 맞지만, 실제 patch 경로에는 보정이 필요하다.

- `packages/tree-editor/src/operations.ts`
  - `NodeMetaPatch`에 `disabled?: TreeNode['disabled']` 추가.
  - `withNodeMetaPatch`에서 `disabled` set/delete 처리.
- `packages/tree-editor/src/schema.ts`
  - `updateNodeMetaOperationSchema.patch.disabled` boolean optional 추가.
  - discriminated union cast 타입에도 disabled optional 반영.
- `apps/web/src/app/page.tsx`
  - `onNodeMetaChange(node, { disabled: next ? true : undefined }, { mergeKey: ... })`.

## UI 조건

- checkbox/toggle semantics가 있는 컨트롤을 사용한다.
- 라벨은 `비활성 상태`.
- button node에서만 노출한다.
- OFF 상태에서도 disabled 색상 입력은 그대로 유지한다. 토글은 미리 지정한 disabled 색상을 캔버스에서 확인하는 스위치 역할이다.

## 검증 기준

- tree-editor schema test: updateNodeMeta에서 `disabled: true` parse.
- tree-editor operation test: `disabled` set/delete 경로 확인.
- web lint/typecheck, root typecheck 통과.
- `localhost:3000` 200 OK 확인.

미해결 없음.

[Codex]
