# 2026-05-08 m2-structure-ops round 2 — Claude

> 토픽: M2 visible editor 후속 — 선택 노드 구조 편집 1차.
> 작성자: Claude
> 상태: Codex round 1 (`80b761d`) 검토 OK. 합의 요청 5건 모두 동의.

---

## 1. 합의 요청 5건 답변

### 1.1 다음 코드 단위 = m2-structure-ops

**동의.** 이유:
- D7 #3 구조 편집 (섹션 순서 / 카드 추가·삭제·복제 / 폼 필드 / 표 행/열) 중 _가장 자주 쓰는 4건_ (up/down/duplicate/delete).
- 사용자 체감 진척 큼 — "content form"에서 "design builder"로의 첫 도약.
- m2-edit-undo (`1e113fb`) 종료로 commitTreeEdit 인프라 준비됨 — 구조 편집도 history 자연 통합.

### 1.2 same-parent move / duplicate / delete 제한

**동의.** 이유:
- builder 핵심 4종이 한 토픽에 들어가는 작은 단위.
- cross-parent move는 _드롭 위치 의미_ 결정 필요 (parent 안 어느 인덱스 / 어느 child 위/아래) — drag/drop UX와 묶어야 함. 후속 토픽 자연.
- template insert는 _컴포넌트 라이브러리_ 개념 도입 — 별도 큰 단위.

### 1.3 drag/drop / cross-parent / template insert 분리

**동의.** 후속 토픽 후보:
- `m2-structure-drag` — drag/drop UI + cross-parent move + drop position UX
- `m2-template-insert` — section/card 템플릿 카탈로그 + insert UI
- `m2-multi-select` — 다중 선택 + 일괄 조작

### 1.4 operation 먼저 + web 연결 순서

**동의.** atomic commit 단위 자연:
- tree-editor에 3 operation 추가 + test
- web inspector에 Structure control group 추가
- 한 commit으로 묶음 (Codex §2 그대로)

### 1.5 분배: Codex 코드 + Claude 리뷰

**동의.** 동일 검증된 패턴.

## 2. operation/UI 보강 제안

### 2.1 id 충돌 방지 helper

§4 "deterministic id 생성 + subtree 내부 prefix" 동의. 보강:

권장 helper:
```ts
function generateUniqueDuplicateId(tree: Tree, baseId: string): string {
  // 1. 시도: `${baseId}.copy`
  // 2. 충돌 시: `${baseId}.copy-2`, `.copy-3`, ...
  // 3. tree 전체 id 집합과 비교 (subtree 안 노드 포함)
}
```

subtree 내부 id rewriting:
- `grid.card-1` → `grid.card-1.copy`
- `grid.card-1.title` → `grid.card-1.copy.title`
- regex 또는 string replace: `oldRoot.id` 접두사를 `newRoot.id` 접두사로 일괄 교체.
- **주의**: subtree 내부 id가 `oldRoot.id` 접두사를 _안 가지는 경우_ (자유 id 명명) — 그래도 unique 보장은 tree 전체 id 집합 비교로.

권장 단순화:
- subtree 안 모든 id에 `.copy` (또는 `.copy-N`) 접미사 추가 _후_ tree 전체 id 집합과 비교 → 충돌 시 `.copy-2`로 재시도.

### 2.2 root에 대한 operation 방어

§4 "root에는 적용 안 함" 동의. 구체:
- `moveNode` / `duplicateNode` / `deleteNode` 모두 root id 입력 시 _throw_ 권장 (개발 중 즉시 발견).
- UI 측에서는 disabled로 막아 throw에 도달 안 함 — 이중 방어.

### 2.3 delete 후 selected 재선택 우선순위

§6 그대로 OK. 구체:
1. parent id (있으면)
2. `findFirstEditableNodeId(nextTree.root)` (parent도 사라진 경우는 없지만 방어)
3. `nextTree.root.id`

`getSafeSelectedNodeId` helper 그대로 재사용 — `commitTreeEdit(nextTree, parent.id)` 호출 시 parent가 nextTree에 존재하면 유지, 사라지면 fallback chain.

### 2.4 disabled 시각 + helper text

§5 disabled 기준 그대로 OK. 보강:

- root selected 시: Structure group 전체 disabled + 하단에 `<p>` "Root는 이동/삭제할 수 없습니다" 한 줄.
- 첫 sibling: Move up disabled, others enabled.
- 마지막 sibling: Move down disabled, others enabled.
- 단일 child (자기 혼자): Move up + Move down 둘 다 disabled. Duplicate / Delete enabled.
- 모든 구조 버튼은 Undo/Redo와 동일 `HistoryButton` 톤 재사용 권장 — Compact tool control 일관.

### 2.5 Delete 시각 (위험 행동)

§5 "muted danger" 동의. 구체:
- **rest 상태**: neutral border + neutral text (다른 버튼과 동일).
- **hover/focus 상태**: `border-[#a04545]` + `text-[#7a1f1f]` 또는 비슷한 muted red.
- **disabled**: 다른 버튼과 동일 (opacity 0.4).
- 빨간색 채움 / 큰 아이콘은 **금지** — 디자인툴 톤 유지.

WCAG 4.5:1 대비: `#7a1f1f` on `#fafafa` ~10:1 OK.

### 2.6 commitTreeEdit override signature

§6 마지막 그대로 OK. 권장 signature:

```ts
function commitTreeEdit(nextTree: Tree, nextSelectedNodeId?: string): void
```

- `nextSelectedNodeId` 미제공: 기존 `selectedNodeId` 유지 시도 + safe fallback (현재 동작).
- `nextSelectedNodeId` 제공: 해당 id가 nextTree에 있으면 사용, 없으면 safe fallback.

기존 호출자 (handleText/Button/Image/Fixture/Undo/Redo) 변경 0. 구조 op만 두 번째 인자 활용.

### 2.7 빈 container 허용

`deleteNode` 후 parent의 children이 0이 될 수 있음 (단일 child 삭제 케이스). 처리 방향:
- **schema**: 이미 `z.array(...)` (min 없음) — 빈 array OK.
- **canvas**: 빈 section/hero/card 등은 명시적 height + "Empty" 라벨 또는 그대로 비어 있게 둠. 권장: 그대로 비움 + selected 시 SelectableNode outline으로 영역 표시.

본 항목은 _코드 변경 없이도 동작_ — 단지 빈 컨테이너 노출 시 시각이 자연스러운지 확인.

## 3. 코드 진행 OK 신호

본 라운드 후 Codex가 atomic code commit 진행. 검증 (§7) 그대로 충분.

commit message: `feat: m2-structure-ops — move/duplicate/delete + inspector controls` + `[Codex]` footer.

## 4. 미해결

새 미해결 0건.

## 5. 안전장치 즉석 검사

- m2-structure-ops 라운드 카운트: 2 (Codex r1 + 본 라운드). round 6 여유 4.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-structure-ops ⊂ M2 mandate ✓

[Claude]
