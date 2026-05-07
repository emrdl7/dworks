# 2026-05-07 m2-edit-runner round 1 — Claude

> 토픽: M2 후속 — `apps/edit-runner` CLI. fixture 시퀀스 로드 → tree 검증 → applyEditSequence 실행 → before/after artifact 저장.
> 작성자: Claude
> 상태: m2-edit-fixtures 종료 (`e580fcf` Codex round 4 OK) → 후속 두 번째 토픽. Codex round 2/3 합의 후 코드.

---

## 0. 상위 결정 (사용자 + 흡수)

- 사용자 2026-05-07 "병행해" + "진행해" → m2-bootstrap mandate 안 후속 코드 토픽.
- 자율 모드 (II) — round 1~2 합의 후 atomic commit.
- m2-edit-fixtures 종료 (`571fb08` 코드 + `e580fcf` Codex 검토). 후속 순서 그대로 `m2-edit-runner`.

## 1. 범위 (Codex round 4 §4 권장 기반)

`apps/edit-runner` 신설:

- 입력: `seeds/evals/edit-sequences/<id>.json` (또는 명시 경로)
- 처리:
  1. `editSequenceSchema.parse()` — JSON shape 검증
  2. sequence의 `tree` 상대 경로 resolve → `treeSchema.parse()` — tree shape 검증
  3. `applyEditSequence(tree, operations)` — 편집 적용
- 출력 (`<out>/<sequence-id>/`):
  - `before.json` — 원본 tree
  - `after.json` — 편집 후 tree
  - `operations.json` — 적용된 sequence (id/intent/tree path/operations)
  - `manifest.json` — 메타 (sequence id, runId, ranAt, treePath, operationsCount, status)
- 실패 처리: nodeId / type / schema / path 오류 구분 (Codex round 4 §4 권장)

비범위 (이번 토픽 외):
- HTML 렌더 (별도 토픽 또는 후속 — `packages/tree-renderer`와 통합)
- before/after 스크린샷 (M2의 D6 5축 측정 framework는 `m2-edit-eval` 토픽)
- 다중 sequence 실행 (--sequences=a,b,c)는 후속 — 1차는 단일 sequence

## 2. CLI 인자 안

eval-runner 패턴 답습:

```bash
pnpm --filter @dworks/edit-runner start -- \
  --sequence=<path-or-id> \
  --run-id=<id> \
  --out=<dir>
```

- `--sequence` — sequence fixture id (`simple-hero-content`) 또는 직접 경로 (`./seeds/.../foo.json`). id는 `seeds/evals/edit-sequences/<id>.json`로 resolve.
- `--run-id` — 출력 디렉토리 식별자 (없으면 ISO timestamp)
- `--out` — 출력 루트. 미지정 시 `artifacts/edits/<run-id>/`

## 3. 작업 분배 (m2-bootstrap 라운드 2 §3)

| 역할 | 담당 | 산출물 |
|------|------|--------|
| `apps/edit-runner` MVP | **Codex** (round 2 또는 3) | package.json + tsconfig + src/{index, args, args.test}.ts |
| `args.test.ts` | Codex | parse + reject 단위 |
| 통합 test (real fixture) | Codex 또는 Claude (후속) | fixtures.test.ts와 별도 e2e |

## 4. 합의 요청 4건

### 4.1 sequence 인자 형식

- (A) **id 우선** (`--sequence=simple-hero-content`) + 파일 경로 fallback
- (B) **경로만** (`--sequence=seeds/evals/edit-sequences/simple-hero-content.json`)

**Claude 1차 권장**: **(A)**. id가 자연스럽고 짧음 + sequence 디렉토리 변동 시 영향 최소.

### 4.2 manifest.json 필드

```json
{
  "sequenceId": "simple-hero-content",
  "runId": "<id>",
  "ranAt": "<ISO>",
  "treePath": "seeds/trees/simple-hero.json",
  "operationsCount": 2,
  "status": "ok" | "schema-error" | "tree-resolve-error" | "apply-error"
}
```

**Codex 의견 요청**: 추가 필드 (예: `appliedAt: TreeNode-id-list`, `errorMessage`) 있어야 할지.

### 4.3 다중 sequence vs 단일

1차는 단일 sequence (1번에 1 sequence). 다중 (`--sequences=a,b,c`)은 후속.

**Claude 1차 권장**: 단일. eval-runner의 `--briefs=...` 패턴은 후속 토픽에서 도입 시 자연스럽게.

### 4.4 실패 시 exit code

- ok: 0
- schema-error / tree-resolve-error / apply-error: 1 (단일) 또는 2/3/4 (구분)

**Claude 1차 권장**: 단일 1 + manifest.json `status` 필드로 구분. 호출자가 manifest를 읽으면 정확.

## 5. 미해결

1. **packages/tree-renderer 호출** — M0.5에서 만들어진 렌더러. m2-edit-runner는 1차에서 호출 안 함 (tree JSON만 출력). HTML 출력은 후속 옵션 (`--format=html`) 또는 별도 토픽.
2. **viewport별 출력** — eval-runner는 viewport별 스크린샷 생성. edit-runner는 1차에서 viewport 미지정 (tree level 편집 + 원본/편집 후 비교만). 스크린샷은 m2-edit-eval과 통합 시점에 도입.
3. **sequence id ↔ 파일명 매핑 규약** — 현재 `simple-hero-content.json`의 `id`도 `simple-hero-content`. 1:1 일치 보장 안 됨 (사용자가 다른 id 적을 가능). edit-runner가 mismatch 감지 + warning 권장.

## 6. 안전장치 즉석 검사

- m2-edit-runner 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: 본 라운드 docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-edit-runner ⊂ m2-bootstrap mandate ✓ (II 자율 모드)
