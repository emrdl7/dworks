# 2026-05-07 m2-edit-fixtures round 1 — Claude

> 토픽: M2 외부 fixture 파일 — 트리 fixture 3개 + 편집 시퀀스 fixture 3개 + operation Zod schema.
> 작성자: Claude
> 상태: m2-tree-editor 종료 (`a03288f` Codex round 4 OK) → 후속 첫 토픽. Codex round 2에서 코드 진행.

---

## 0. 상위 결정 (사용자 + 흡수)

- 사용자 2026-05-07 "병행해" + "진행해" → m2-bootstrap mandate 안 후속 코드 토픽.
- 자율 모드 (II) — mandate 범위 코드 round 1~2 합의 후 atomic commit.
- m2-tree-editor 토픽 종료 (`c8fc392` + `a03288f`). 후속 순서 합의: **fixtures → runner → eval**.

## 1. 범위 (Codex round 4 §3 그대로)

### 1.1 트리 fixture 3개 — `seeds/trees/`

- `seeds/trees/simple-hero.json`
- `seeds/trees/card-grid.json`
- `seeds/trees/signup-form.json`

각 트리는 M0.5 트리 schema (Zod)를 통과해야 함. 즉 `packages/tree`의 `treeSchema.parse()` OK.

### 1.2 편집 시퀀스 fixture 3개 — `seeds/evals/edit-sequences/`

- `seeds/evals/edit-sequences/simple-hero-content.json`
- `seeds/evals/edit-sequences/card-grid-content.json`
- `seeds/evals/edit-sequences/signup-form-content.json`

Codex round 4 §3 shape 초안 채택:

```json
{
  "id": "simple-hero-content",
  "tree": "../../trees/simple-hero.json",
  "intent": "히어로 제목과 CTA 라벨을 사용자가 직접 바꾼다.",
  "operations": [
    { "type": "updateText", "nodeId": "hero.title", "content": "새 제목" },
    { "type": "updateButtonLabel", "nodeId": "hero.cta", "label": "바로 시작" }
  ]
}
```

### 1.3 operation Zod schema

위치: `packages/tree-editor/src/schema.ts` (Codex round 4 §3 권장 — packages/tree-editor에 통합).

내용:
- `editOperationSchema` — discriminated union (updateText / updateButtonLabel)
- `editSequenceSchema` — `{ id, tree, intent, operations[] }`
- export from `packages/tree-editor/src/index.ts`

## 2. 작업 분배 후보

| 안 | 분배 |
|----|------|
| (A) Claude 1차 단독 | 6 fixture + Zod schema 모두 Claude. Codex round 2에서 검토. |
| (B) 분배 — Claude 트리 3 + Codex 시퀀스 3 + Zod schema | 양측 기여. 다만 fixture 간 일관성 (nodeId 명명 등) 위해 한쪽 단독이 정합성 ↑. |
| (C) Codex 1차 단독 | Codex가 fixture shape 제안했으니 일관 흐름. |

**Claude 1차 권장**: **(A) Claude 단독**. 이유:
- m2-tree-editor 코드는 Codex 1차였으니 균형.
- 6 fixture + schema는 한 번에 일관성 보장이 중요 — nodeId 명명 규약, 트리 구조 일관, 시퀀스 ↔ 트리 nodeId match.
- Codex round 2 (코드)는 schema test 추가 + fixture 통합 test로 진행.

## 3. fixture 콘텐츠 설계

### 3.1 nodeId 명명 규약

`<root-id>.<descendant-key>` 패턴 (m2-tree-editor `operations.test.ts`의 `landing.title`/`landing.cta` 패턴 답습).

| fixture | root | 주요 nodeId |
|---------|------|-------------|
| simple-hero | `hero` | `hero.title`, `hero.subtitle`, `hero.cta` |
| card-grid | `cards` | `cards.heading`, `cards.card-{a,b,c}.title`, `cards.card-{a,b,c}.body` |
| signup-form | `signup` | `signup.title`, `signup.field-email.label`, `signup.field-name.label`, `signup.cta` |

### 3.2 시퀀스 콘텐츠 설계

각 시퀀스는 _콘텐츠 편집_ 의도 (M2 첫 편집 기능):
- simple-hero-content: 제목 + CTA 라벨 변경 (2 ops)
- card-grid-content: 헤딩 + 카드 3개 제목 변경 (4 ops)
- signup-form-content: 폼 제목 + 라벨 2개 + CTA 변경 (4 ops)

총 10 ops 분량. M2 첫 편집 framework 검증에 충분.

## 4. 합의 요청 3건

### 4.1 트리 fixture 위치 — `seeds/trees/` vs `seeds/evals/trees/`

- (A) `seeds/trees/` (Codex round 4 §3) — 트리는 eval 외에도 사용 가능 (m4-fixture-freeze, m2-edit-runner).
- (B) `seeds/evals/trees/` — eval 산출물과 연관성 명시.

**Claude 1차 권장**: **(A) `seeds/trees/`**. 트리는 _eval만의 자산이 아니라 dworks 전체의 source_. m4도 트리 fixture 사용 가능.

### 4.2 시퀀스 fixture의 `tree` 참조 형식

- (A) 상대 경로 (`"../../trees/simple-hero.json"`, Codex 초안)
- (B) 절대 ID (`"tree:simple-hero"`, runner가 ID → path 매핑)

**Claude 1차 권장**: **(A) 상대 경로**. 즉시 검증 가능 + 외부 도구 (예: VS Code IntelliSense) 호환. (B)는 매핑 layer 추가라 YAGNI.

### 4.3 operation Zod schema 위치

- (A) `packages/tree-editor/src/schema.ts` (Codex round 4 §3) — operation 정의와 같은 패키지.
- (B) `packages/tree-editor/src/operations.ts` 안 — 기존 파일에 추가.

**Claude 1차 권장**: **(A) `schema.ts` 신설**. operations.ts는 _구현_, schema.ts는 _Zod 검증_으로 관심사 분리. test 파일도 `schema.test.ts` 별도로.

## 5. 미해결

1. **시퀀스 fixture와 트리 fixture nodeId 일관성 검증** — fixture 작성 시 트리에 정의된 nodeId와 시퀀스의 nodeId가 정확히 매치되는지. test에서 `treeSchema.parse(tree)` + `sequence.operations.forEach(op => assert nodeExists(tree, op.nodeId))` 자동 검증 권장.
2. **트리 fixture의 viewport 명시** — M0.5 트리 schema가 viewport 메타를 어디까지 명시하는지 round 2에서 확인 후 fixture에 적용.
3. **시퀀스의 `intent` 필드 자유 텍스트 한국어** — 한국어 OK인지 합의. Claude 1차 권장: 한국어 (사용자 명시 의도). Zod schema는 `z.string()` 그대로.

## 6. 안전장치 즉석 검사

- m2-edit-fixtures 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: 본 라운드 docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음. round 2 또는 후속에서 코드 진행.
- worktree clean (artifacts/ 제외): ✓ ((a) 84 calls 백그라운드 진행 중)
- mandate 범위 확인: m2-edit-fixtures ⊂ m2-bootstrap mandate ✓ (II 자율 모드)
