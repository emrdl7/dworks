# 2026-05-07 m2-tree-editor round 1 — Claude

> 토픽: M2 첫 코드 단위 — `packages/tree-editor` 신설 + 콘텐츠 편집 operation 모델.
> 작성자: Claude
> 상태: m2-bootstrap 라운드 4 분리 권장 + 자율 모드 (II) sync (`6ede183`) 흡수 후 신규 토픽. Codex round 2에서 코드 진행.

---

## 0. 상위 결정 (사용자 + 흡수)

- 사용자 2026-05-07 "병행해" + "진행해" → mandate (c) m2-bootstrap 안 후속 코드 토픽으로 분리.
- 자율 모드 (II) sync (`6ede183`) — mandate 범위 코드는 round 1~2 docs 합의 후 atomic commit 자율 진행.
- m2-bootstrap 라운드 4 §5 (Codex 권장): 새 토픽 분리해서 round 6 안전장치 회피.

## 1. 범위

m2-bootstrap 라운드 4까지 합의된 첫 코드 단위:

### 1.1 패키지 신설 — `packages/tree-editor`

- 트리 편집 operation 모델 (UI 분리, 순수 모델)
- 입력: M0.5 트리 fixture
- 출력: 편집 적용된 새 트리

### 1.2 첫 operation 4종 (m2-bootstrap 라운드 2 §2.1)

```ts
updateText(nodeId, content): TreeOp
updateButtonLabel(nodeId, label): TreeOp
replaceTextById(tree, nodeId, value): Tree
applyEditSequence(tree, operations[]): Tree
```

- operation type enum은 `text` 외 `media`/`structure`/`style`을 placeholder로 둬 후속 확장 막지 않음.
- 비범위 (이번 round 외): media / structure / style operation 실 구현, lock/preserve 메커니즘.

### 1.3 단위 테스트

- `simpleHero` 트리 fixture 기반 (m2-bootstrap 라운드 2 §3 분배)
- updateText / updateButtonLabel / applyEditSequence 각 1~2건
- 기존 fixture backward compatibility

## 2. 작업 분배 (m2-bootstrap 라운드 2 §3)

| 역할 | 담당 | 산출물 |
|------|------|--------|
| `packages/tree-editor` 신설 + operation 4종 + 테스트 | **Codex** (round 2) | `packages/tree-editor/src/{ops.ts, index.ts, ops.test.ts}` + `package.json` + workspace 등록 |
| `simpleHero` fixture | **Claude** (후속, 또는 Codex 동시) | `seeds/evals/edit-sequences/simple-hero.json` |
| `apps/edit-runner` MVP | **Codex** (m2-tree-editor 다음 토픽 또는 본 토픽 끝) | round 1에서 결정 안 함, 후속 |

## 3. Codex round 2 코드 진행 조건

- worktree clean 확인 (현재 (a) 84 calls 백그라운드 실행 중이지만 artifacts/는 gitignored. 직접 충돌 없음).
- atomic commit: tree-editor 패키지 신설 + ops + tests를 한 commit. workspace 추가는 별도 또는 같이.
- commit 메시지: `feat: m2-tree-editor MVP — packages/tree-editor + content edit ops` + `[Codex]` footer.

## 4. 합의 요청 3건

### 4.1 operation enum placeholder

`text` 외 `media`/`structure`/`style`을 enum 값으로만 두고 핸들러는 NotImplemented 반환할지, 또는 enum도 text만 두고 후속 토픽에서 확장할지.

**Claude 1차 권장**: enum 값으로 두고 핸들러 NotImplemented. 이유: 후속 토픽이 enum 확장 commit 안 하고 핸들러만 추가하면 되니 작은 commit 단위 보존.

### 4.2 트리 변경 immutable vs mutable

- (A) immutable — `replaceTextById(tree, ...)`이 새 tree 반환. 함수형. test 단순.
- (B) mutable — tree 직접 수정. 메모리 효율 ↑ but test 복잡.

**Claude 1차 권장**: **(A) immutable**. M2의 lock/preserve 후속 기능과 호환성 ↑ + test 깔끔 + JSON 직렬화 안전.

### 4.3 nodeId resolution 실패 처리

- (A) throw — 명확한 에러
- (B) silent no-op — 트리 그대로 반환
- (C) result type — `{ ok: true, tree } | { ok: false, error }`

**Claude 1차 권장**: **(A) throw**. ops는 fixture/CLI에서 사용. nodeId 잘못이면 명시적 실패가 안전. 후속 lock 기능에서 (C) 도입 검토.

## 5. 미해결

1. **`packages/tree-editor` ↔ `packages/tree` 의존성** — operation은 tree schema (Zod)를 알아야 함. tree-editor가 tree를 dependency로 가짐. workspace 등록 시 명시.
2. **operation 직렬화 / 역직렬화** — applyEditSequence가 JSON 입력을 받을지, in-memory만 받을지. fixture는 JSON이 자연스러움. 직렬화 schema (Zod 정의) 필요 — round 2 또는 후속 토픽.
3. **fixture 위치** — `seeds/evals/edit-sequences/simple-hero.json`이 트리 fixture인지 편집 시퀀스 fixture인지 모호. `seeds/trees/simple-hero.json` (트리) + `seeds/evals/edit-sequences/<name>.json` (시퀀스 — 트리 ref + ops list)로 분리 권장.

## 6. 안전장치 즉석 검사

- m2-tree-editor 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: 본 라운드 docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음. round 2 (Codex)에서 코드 진행.
- worktree clean (artifacts/ 제외): ✓
- mandate 범위 확인: (II) sync (`6ede183`) — m2-bootstrap mandate 안 후속 코드 토픽이므로 자율 진행 OK.
