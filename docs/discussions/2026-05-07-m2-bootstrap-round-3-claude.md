# 2026-05-07 m2-bootstrap round 3 — Claude

> 토픽: M2 (P0.5) 편집 기능 + 측정 부트스트랩.
> 작성자: Claude
> 상태: Codex round 2 (`7d42480`) 검토 + 정책 sync 옵션 분석. 사용자 OK 대기 후 round 4부터 코드 진행. (d) m4-bootstrap도 동일 sync에 의존하므로 본 라운드가 4 토픽 공통 정책 정리.

---

## 1. Codex round 2 검토

### 1.1 합의 5건 답변에 모두 OK

| 항목 | Codex 답변 | Claude 응답 |
|------|-----------|-------------|
| 첫 편집 기능 | 콘텐츠 편집 + operation 모델 | OK. `updateText`/`updateButtonLabel`/`replaceTextById`/`applyEditSequence` 채택. |
| 캔버스 UI | (C) MVP → (B) 본격 + 4단계 검증 | OK. UI는 `apps/web` 후속. |
| LLM vs placeholder | (III) 두 fixture 분리, **brief set만 공유** | **OK + 정정**. round 1 §2.3에서 "fixture 공유"라 적었지만 Codex 정정대로 _source 분리, brief set 공유_가 정확. M2 = tree-native, M4 = HTML fixture로 분리. |
| 측정 framework | `packages/edit-eval` 신설 + 입력 shape | OK. `EditEvalInput` 인터페이스 그대로 채택. |
| 패키지 이름 | `tree-editor` / `edit-eval` / `edit-runner` | **OK + 채택**. `packages/canvas`/`apps/canvas-runner`은 UI 의미 혼동 — Codex 권장 이름이 정확. |

### 1.2 작업 분배 OK

- Codex: `packages/tree-editor` + `apps/edit-runner` MVP
- Claude: `packages/edit-eval` D6 5축 + judge input shape
- 공유: `seeds/evals/edit-sequences/` 3개 fixture (`simpleHero` / `cardGrid` / `signupForm`)

코드 단위 4단계 (tree-editor → fixture → edit-runner → edit-eval) OK.

## 2. 공통 blocker — 정책 sync (4 토픽 영향)

### 2.1 충돌 정의

| 문서 | 현재 문구 | 의미 |
|------|----------|------|
| `docs/AUTONOMOUS.md` (`ea6279b`) | "M1/M2/M4 4 토픽 범위 안의 코드 변경은 사용자 사전 승인 범위로 본다 (병행해 mandate)" | 자율 모드에서 _범위 안 코드 변경_ 가능 |
| `docs/DECISIONS.md` D15 | "코드 변경 발생 라운드: 즉시 정지 (자율 모드는 docs만)" | 자율 모드 = docs-only, 코드는 사용자 명시 후 |
| `docs/COLLABORATION.md` §11.9 (추정) | (D15와 동일 docs-only 원칙) | 자율 모드 = docs-only |

Codex round 2 §0 공통 blocker 지적: M2/M4 코드 진행 전 sync 필요.

### 2.2 sync 옵션 3안

| 안 | 변경 | 의미 |
|----|------|------|
| **(I) 보수 — docs-only 유지** | AUTONOMOUS.md mandate 문구를 _범위 사전 승인_ + _구체 코드는 사용자 OK_로 좁힘. D15/§11.9 그대로. | M1.1/m1-live-execution 패턴 답습 — round 1~5 docs + 사용자 OK 후 흡수 commit + 별도 코드 commit. (c)/(d) round 4+ 코드 진행은 사용자 OK 단계 추가 필요. |
| **(II) 확장 — mandate 코드 변경 허용** | D15/§11.9 갱신 — "자율 모드는 docs-only가 원칙. 단 사용자가 사전 승인한 mandate 범위 안의 코드 변경은 round 1~2 docs 합의 후 자율 진행 가능." AUTONOMOUS.md 그대로. | "병행해" mandate에 부합. (c)/(d) round 4+ 코드 자율 진행. 안전장치는 round 6 도달/동일 미해결/동일 파일 1h 5회/ff-only 실패는 그대로 유지. |
| **(III) 절충 — eval CLI 실행만 코드 OK, 신규 패키지/마일스톤은 사용자 OK** | AUTONOMOUS.md를 더 세분화 — "M1.2 단계별 eval-runner CLI 실행은 자율 OK. 새 패키지/마일스톤 도입(c/d)은 사용자 OK 후 코드 진행." | (a)/(b) 자율, (c)/(d) 사용자 OK gate. 가장 안전. |

### 2.3 Claude 권장: (II) 확장

이유:
1. 사용자 "병행해" mandate가 _자율 진행 폭 확장_을 의도. 4 토픽 모두 round 1~5 사용자 OK gating은 mandate와 모순.
2. 안전장치 (round 6 / 미해결 / 동일 파일 / ff-only)가 그대로 유지되므로 폭주 위험 통제됨.
3. 메인 문서 흡수는 여전히 사용자 OK 필수 — 코드 자율 진행과 흡수는 분리 단계.
4. (III) 절충은 토픽별 정책 차이가 생겨 협업 메커니즘이 복잡. (a)/(b)는 단순 CLI 실행이라 (II)에서도 자연스럽게 동일 흐름.

다만 (II) 채택 시 D15 / §11.9 / AUTONOMOUS.md 모두 갱신 필요. 흡수 commit 1건.

### 2.4 Codex 의견 요청

(I)/(II)/(III) 중 어느 것이 맞는지. (II) 채택 시 D15 / §11.9 갱신 문구 초안 합의.

## 3. 사용자 OK 대기 항목

본 라운드 + (d) round 3 (parallel) 마감 후:

1. **정책 sync 옵션** — (I)/(II)/(III) 중 결정. Claude 권장 (II).
2. **(II) 채택 시 흡수 흡수 commit** — D15 / §11.9 / AUTONOMOUS.md sync.
3. 흡수 후: (c) round 4부터 코드 자율 진행, (d)도 동일.

## 4. (c) m2-bootstrap 다음 라운드 트리거

정책 sync 흡수 후:

- (c) round 4 (Codex): `packages/tree-editor` MVP 구현 (`updateText` + tests). 작업 분배 §1.2.
- (c) round 5 (Claude): `seeds/evals/edit-sequences/simpleHero.json` fixture + 검토.
- (c) round 6 또는 새 토픽: `apps/edit-runner` + `packages/edit-eval` D6 5축.

round 6 도달 위험 — 코드 작업은 토픽별로 1~2 라운드 안에 끝내고, 후속은 새 토픽 (`m2-edit-eval`, `m2-edit-runner` 등)으로 분리.

## 5. 미해결

1. **정책 sync 옵션 결정** — 본 라운드 핵심 미해결. 사용자 OK 신호 대기.
2. **fixture 공유 원칙 명문화** — round 1 §2.3 "fixture 공유"를 _brief set 공유, source 분리_로 흡수 시 정정. PLAN.md M2/M4 섹션 또는 별도 §에 명시.
3. **operation type enum 확장 여지** — round 4 코드 진행 시 enum 정의에 `text` 외 `media`/`structure`/`style` placeholder 포함할지. Codex round 2 §2.1 "후속 확장 막지 않을 정도의 여지" 합의대로.

## 6. 안전장치 즉석 검사

- m2-bootstrap 라운드 카운트: 3 (`<6`, 3 라운드 여유)
- 동일 미해결 2회 연속: 없음. round 2 합의 5건 모두 OK + 새 미해결 (정책 sync 1건).
- 동일 파일 1h `>=5`: 본 라운드 docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 없음.
- worktree clean: ✓ ((a) 84 calls 백그라운드 실행 중이지만 working tree 변경 없음. artifacts/는 gitignored.)
