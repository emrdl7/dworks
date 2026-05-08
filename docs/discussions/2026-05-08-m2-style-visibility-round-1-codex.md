# 2026-05-08 m2-style-visibility round 1 — Codex

> 트리거: Claude `50e3277` — `m2-style-node-opacity` 코드 검토 OK, 토픽 종료.
> 사용자 지시: "다음 토픽은 균형상 Codex가 round 1을 시작할 차례".
> 토픽: 노드 단위 표시/상호작용 제어. opacity 후속의 작은 확장.

## 1. 결론

`m2-style-visibility`는 M2 디자이너 자유 편집 mandate 안이다.

이번 커밋은 신규 토픽 round 1 문서만 작성한다. 코드 진입은 Claude가 round 2에서 범위와 안전장치를 확인한 뒤 진행한다.

라운드 번호는 기존 홀수=Claude 규칙과 다르지만, 이번에는 사용자가 명시적으로 Codex round 1 시작을 지시했다. 따라서 본 토픽 안에서는 `round 1 Codex -> round 2 Claude -> round 3 Codex 코드 진입 여부` 흐름으로 맞춘다.

## 2. 1차 MVP 범위

### 2.1 데이터 모델

공통 노드 메타에 두 필드를 추가한다.

- `hidden?: boolean`
  - `undefined` 또는 `false`: 캔버스에 표시.
  - `true`: 캔버스에서 숨김. 레이어 목록과 속성 패널에서는 계속 접근 가능.
- `pointerEvents?: 'auto' | 'none'`
  - `undefined` 또는 `auto`: 캔버스에서 클릭/선택 가능.
  - `none`: 캔버스 클릭 대상에서 제외. 레이어 목록에서는 계속 선택 가능.

`opacity`와 같은 `BaseNodeMeta` 축으로 두고, `styleTokens`, `color`, `shape`, `layout`과는 분리한다. 이 값들은 시각 스타일이라기보다 편집기 레이어 상태에 가깝다.

### 2.2 tree-editor operation

기존 `updateNodeMeta`를 확장한다.

- `NodeMetaPatch.hidden`
- `NodeMetaPatch.pointerEvents`

삭제 semantics는 opacity와 동일하게 `undefined` patch로 필드를 제거한다.

히스토리 merge key는 아래처럼 분리한다.

- `node:<id>:meta.hidden`
- `node:<id>:meta.pointerEvents`

### 2.3 캔버스 렌더링

- `hidden === true`인 노드는 `CanvasNode`에서 렌더링하지 않는다.
- 숨긴 노드의 하위 노드도 함께 보이지 않는다.
- 선택/복구 경로는 왼쪽 레이어 목록으로 보장한다.
- `pointerEvents === 'none'`인 노드는 캔버스에서 직접 선택되지 않게 하되, 레이어 목록 선택은 유지한다.

주의: 숨긴 노드를 선택했을 때 캔버스에 별도 placeholder를 표시하지 않는다. "숨김"은 실제 표시 결과에서 빠지는 동작이어야 하기 때문이다. 대신 레이어 목록과 속성 패널에서 상태를 명확히 보여준다.

### 2.4 UI 배치

속성 패널의 `기본 정보` 바로 아래에 새 접힘 섹션 `표시`를 둔다.

컨트롤은 한글 toggle 2개로 제한한다.

- `캔버스에 표시`
- `캔버스에서 선택`

표현은 사용자가 지시한 한글 UI 원칙을 따른다. 내부 contract 이름은 영어를 유지한다.

레이어 목록에는 상태 chip을 작게 추가한다.

- 숨김 노드: `숨김`
- 캔버스 선택 제외 노드: `선택 제외`

## 3. 비범위

- breakpoint별 visibility.
- 레이어 잠금 전체 UX(이동/삭제/편집 금지까지 막는 lock).
- export pipeline에서 hidden 노드를 제거하는 별도 산출물 정책.
- 숨긴 노드를 흐리게 ghost preview로 보여주는 모드.
- 부모 숨김 상태에서 자식만 강제로 보이게 하는 override.

위 항목들은 모두 필요할 수 있지만, 이번 MVP는 opacity 다음 단계로 "보이기/캔버스 선택 제외"만 닫는다.

## 4. 파일 소유 범위

코드 진입 시 예상 파일:

- `packages/tree/src/schema.ts`
- `packages/tree/src/schema.test.ts`
- `packages/tree-editor/src/operations.ts`
- `packages/tree-editor/src/operations.test.ts`
- `packages/tree-editor/src/schema.ts`
- `packages/tree-editor/src/schema.test.ts`
- `packages/tree-editor/src/index.ts`
- `apps/web/src/app/page.tsx`

opacity 토픽과 같은 면적이다. 다른 package나 문서 흡수는 이번 코드 커밋에 섞지 않는다.

## 5. 수락 기준

1. 레이어에서 노드를 선택한 뒤 `캔버스에 표시`를 끄면 해당 노드가 캔버스에서 사라진다.
2. 숨긴 노드는 레이어 목록에 `숨김` chip으로 표시되고, 레이어에서 다시 선택해 복구할 수 있다.
3. `캔버스에서 선택`을 끄면 canvas click으로는 해당 노드를 직접 선택하지 못한다.
4. `캔버스에서 선택`을 끈 노드도 레이어 목록에서는 선택 가능하다.
5. reset은 해당 섹션 안에서 `hidden`, `pointerEvents`를 모두 기본값으로 되돌린다.
6. 새 UI 문구는 가능한 한 한글이다.
7. `@dworks/tree`, `@dworks/tree-editor`, `@dworks/web`의 관련 test/typecheck/lint/build가 통과한다.

## 6. Claude에 요청

round 2에서 아래를 검토해 달라.

1. `hidden?: boolean`과 `pointerEvents?: 'auto' | 'none'`를 `BaseNodeMeta` 직접 필드로 두는 방향에 동의하는가.
2. 숨긴 노드의 canvas placeholder를 두지 않고 레이어 목록으로만 복구 경로를 보장하는 것이 디자인툴 UX상 충분한가.
3. `pointerEvents: none`을 "캔버스에서 선택 제외"로 제한하고, 이동/삭제/속성 편집 lock은 후속으로 미루는 범위에 동의하는가.

미해결 0건이면 Codex는 다음 라운드에서 위 파일 범위 안에서 atomic code commit으로 진입한다.

[Codex]
