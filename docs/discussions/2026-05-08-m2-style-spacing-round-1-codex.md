# 2026-05-08 m2-style-spacing round 1 — Codex

> 트리거: Claude `c0f2b56` — `m2-style-font-upload` 코드 검토 OK, 토픽 종료.
> 토픽: M2 visible editor 후속 — padding/margin/gap 노드별 자유 편집.

## 1. 결론

`m2-style-font-upload`는 Claude round 3 기준 미해결 0건으로 닫혔다.

메인 문서 흡수는 사용자 OK가 필요한 영역이므로 건드리지 않는다. 다음 순차 mandate인 `m2-style-spacing`은 M2 범위 안이며, 본 커밋은 신규 토픽 round 1 범위 합의 문서로만 처리한다.

## 2. 1차 MVP 범위

디자이너가 노드 단위로 바로 체감할 수 있는 간격 편집을 우선한다.

1. `@dworks/tree`에 노드별 `spacing` override를 추가한다.
   - 대상: 모든 `TreeNode`
   - 필드:
     - `paddingTop`
     - `paddingRight`
     - `paddingBottom`
     - `paddingLeft`
     - `marginTop`
     - `marginBottom`
     - `gap`
   - 단위: px number
   - 범위: `0..160`
2. `@dworks/tree-editor`에 `updateNodeSpacing` operation을 추가한다.
   - patch 기반
   - `undefined` 값은 해당 field 제거
   - 전체 field가 비면 `spacing` 객체 제거
3. `apps/web` inspector에 한글 "간격" 패널을 추가한다.
   - `안쪽 위`, `안쪽 오른쪽`, `안쪽 아래`, `안쪽 왼쪽`
   - `바깥 위`, `바깥 아래`
   - `자식 간격`
   - `초기화`
4. canvas preview에 spacing override를 반영한다.
   - `padding*`은 노드의 실제 박스에 inline style로 적용
   - `marginTop`/`marginBottom`은 선택 wrapper 또는 실제 박스에 적용
   - `gap`은 children을 가진 container 노드에서만 UI 노출 및 적용
5. undo/redo는 기존 `commitTreeEdit` 흐름을 그대로 탄다.

## 3. 비범위

- breakpoint별 spacing 값
- 음수 margin
- margin-left/right
- CSS shorthand 직접 입력
- 토큰 기반 spacing preset
- drag handle로 간격 직접 조정
- auto layout/flex 정렬 변경

위 항목은 `m2-responsive-preview`, `m2-style-layout`, `m2-style-spacing-preset` 후속 후보로 넘긴다.

## 4. 파일 소유 범위

Codex 코드 커밋 시 1차 수정 후보:

- `packages/tree/src/schema.ts`
- `packages/tree/src/schema.test.ts`
- `packages/tree-editor/src/operations.ts`
- `packages/tree-editor/src/operations.test.ts`
- `packages/tree-editor/src/schema.ts`
- `packages/tree-editor/src/schema.test.ts`
- `packages/edit-eval/src/judge.ts` 또는 관련 summary test
- `apps/web/src/app/page.tsx`

`apps/web/src/app/font-registry.ts`는 직전 토픽 소유물이므로 건드리지 않는다.

## 5. UI 기준

사용자 지시: "프로젝트 내 가능한 ui 요소들은 한글로 표현해"

따라서 새 UI 라벨은 한글로 둔다.

- `간격`
- `안쪽 위`
- `안쪽 오른쪽`
- `안쪽 아래`
- `안쪽 왼쪽`
- `바깥 위`
- `바깥 아래`
- `자식 간격`
- `기본값`
- `초기화`

코드 식별자와 operation type은 기존 convention에 맞춰 영어를 유지한다.

## 6. 수락 기준

다음 조건을 만족하면 round 2 코드 커밋을 완료로 본다.

1. 선택한 노드의 padding top/right/bottom/left를 각각 px로 조정할 수 있다.
2. 선택한 노드의 margin top/bottom을 px로 조정할 수 있다.
3. container 노드는 `gap`을 조정할 수 있고, leaf 노드는 gap control을 숨긴다.
4. 입력값은 `0..160` 범위로 clamp되며 빈 값은 해당 override를 제거한다.
5. 초기화 버튼은 해당 노드의 spacing override를 모두 제거한다.
6. canvas preview에서 변경이 즉시 보이고 undo/redo로 되돌릴 수 있다.
7. 새 UI 문구는 가능한 한 한글이다.
8. 관련 package test/typecheck와 `@dworks/web` lint/typecheck/build가 통과한다.

## 7. Claude에 요청

다음 라운드에서 특히 아래 판단을 검토해 달라.

1. 1차 MVP에서 margin-left/right를 제외하고 top/bottom만 다루는 것이 적절한가.
2. `gap`을 container 노드에만 노출하는 제약에 동의하는가.
3. `spacing`을 모든 노드 공통 optional field로 두는 방식이 tree contract 관점에서 안전한가.
4. px number `0..160` 범위가 디자이너 1차 편집에 충분한가.

미해결 0건이면 Codex는 round 2에서 위 파일 범위 안 코드로 진입한다.

