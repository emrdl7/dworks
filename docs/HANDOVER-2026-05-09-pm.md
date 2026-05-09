# 핸드오버 — 2026-05-09 오후 (M3 트랙 8 토픽 입증 완료)

> 다음 Claude 세션이 즉시 이어가도록 정리. 가속 모드 정책 + M3 트랙 PoC end-to-end 입증 + 17 ABSORB.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **`docs/AUTONOMOUS.md`** — 자율 모드 ON 신호 + mandate (2026-05-07 M1 / 2026-05-08 M2 흡수 / **2026-05-09 M3 진행 중**) + 가속 모드 정책 + M3 진척 + 후속 후보
2. **`docs/COLLABORATION.md`** §11 — 자율 모드 컨벤션 + 안전장치 (§11.6 정지 조건)
3. **`docs/DECISIONS.md`** 부록 A — 모든 토픽 라운드 표 (M2 + M3 누적 70+ 토픽)
4. **직전 핸드오버** `docs/HANDOVER-2026-05-09.md` — 오전 세션 종료 시점 (M2 cycle 7)
5. 본 파일 — 오후 세션 마무리 (M3 트랙 입증)

## 현재 상태 (2026-05-09 12:01 KST)

### 자율 모드: ON

- post-commit hook + `.git/feed.log` watcher
- Claude / Codex 양측 active
- mandate "쭉쭉 진행" + "둘이 의논 빨리빨리 진행" 사용자 위임 상태

### Mandate

- **M0 / M0.5 / M1.1 / M1.2** — 완료 (2026-05-07 M1 트랙)
- **M2 디자이너 자유 편집** — _흡수 완료_ (45+ 토픽)
- **M3 AI 생성 파이프라인** — _진행 중_ (8 토픽 입증, 후속 9건 후보)

사용자 신호 (2026-05-09): "ai생성쪽은 시작도 못하는 이유가 뭐야?" → M3 진입.

### 가속 모드 5 정책 (AUTONOMOUS.md "2026-05-08 가속 모드")

여전히 active. routine 자체합의, 병렬 토픽 OK, round 4 대신 fix/test/직접 feat OK, lean round 1 (50줄 이내 권장).

### 마지막 ABSORB

`acdd448` (열일곱번째). page.tsx counter reset 기준점.

---

## 이번 세션 누적 (cycles 7-17, 11 ABSORB + 17 토픽)

### M2 마무리 (cycles 7-10)

| 토픽 | 핵심 |
|---|---|
| ✓ m2-style-transform | translate/rotate/scale (cycle 7 close) |
| ✓ m2-style-transform-origin | 9-point preset |
| ✓ m2-style-color-state-aria | aria-disabled 1줄 |
| ✓ m2-style-skew | skewX/Y ±45° |
| ✓ m2-style-cubic-bezier | custom timing |
| ✓ m2-style-image-filter-extra | hue/sat/invert/dropShadow |
| ✓ m2-style-transition-step | step-start/step-end |
| ✓ m2-style-transform-3d | rotateX/Y + perspective |
| ✓ m2-style-image-filter-drop-shadow-multi | dropShadow stack max 3 |

### M3 트랙 (cycles 11-17)

| 토픽 | 핵심 |
|---|---|
| ✓ **m3-generate-mvp** (`24d5517`+`28d8f38`+`eb60396`) | POST /generate Claude CLI + 헤더 한 줄 prompt UI |
| ✓ **m3-generate-brief** (`fd5aa88`) | 좌측 5필드 패널 (stepping stone) |
| ✓ **m3-generate-clarify** (`d6d84cc`+`e873a6d`) | 의도 → 적응형 질문 3~6 → 답변 → 생성 |
| ✓ **m3-generate-fallback** (`eb6aada`+`c312aba`) | LlmProvider chain claude/codex/gemini, callLlmChain |
| ✓ **m3-generate-codex-adapter** (`9f61575`+`b40cd6a`) | codex `-o tempfile` envelope, extract-failure 분류 |
| ✓ **m3-generate-variant** (`9b6b503`+`d31e3f2`) | N (1/2/3) 변형 동시 생성, Promise.allSettled, diversity hint |
| ✓ **m3-generate-prompt-uplift** (`f6eba0e`+`2280a56`) | 3 generate + 1 clarify schema-valid examples, drift 방지 test |
| ✓ **m3-generate-eval** (`639ed03`+`6dcfe6f`) | apps/m3-eval CLI: status/latency/treeStats 측정, dry-run + --live |

**PoC 본질 입증**: 사용자 prompt → 적응형 질문 → 답변 → N 변형 → 마음에 드는 것 골라 m2 자유 편집. provider chain robust + few-shot quality + eval 측정 가능.

---

## 진행 중 / 대기 중

없음. 모든 토픽 closed. worktree clean.

---

## 다음 우선순위 (자율 진행 시)

### 즉시 가능 (작은~중간 토픽)

1. **m3-generate-clarify-edit** — active generation의 brief 재편집 (UI 가치 큼, 사용자가 한 번 생성 후 답변만 수정해 다시 생성)
2. **m3-generate-prompt-style** — examples에 스타일 prop 노출 (eval 기반 튜닝 — 출력 풍부도 향상)
3. **m3-generate-clarify-loop** — multi-turn clarify (답변 부족 시 추가 질문)
4. **m3-generate-eval-diversity** — 변형 트리 유사도 score (variant 토픽 후속)

### 큰 토픽

1. **m3-generate-gemini-adapter** — Gemini CLI envelope 정밀 매핑 (judge.ts callGemini 패턴)
2. **m3-generate-eval-judge** — LLM-as-judge 정성 점수 (M1 D8 패턴 m3에 적용)
3. **m3-generate-stream** — 스트리밍 응답
4. **m3-generate-image-ref** — 이미지 reference 입력
5. **m3-generate-variant-grid** — 변형들 동시 비교 grid UI (현재 chip toggle만)

전체 후보는 `docs/AUTONOMOUS.md` M3 후속 후보 목록 확인.

---

## 컨벤션 주의

### `[Claude]` footer 필수

dworks 모든 Claude commit message 마지막 줄. 누락 시 watcher 분류 오작동. **memory에 저장됨**.

### 가속 모드 안전장치 (변경 없음)

- `>=6` round → ALERT
- `>=5` page.tsx 1h 수정 → ABSORB 또는 STOP
- 동일 미해결 2회 연속
- ff-only 실패
- mandate 외 코드 변경

### M3 트랙 핵심 패턴

**적응형 brief flow**:
- web stage 1: intent textarea + "질문 받기" / "의도만으로 바로 생성"
- web stage 2: 의도 read-only + "수정" 버튼 + 적응형 질문 카드 (single/multi/text) + 추가 메모 + "디자인 생성"
- API: POST /clarify (intent → questions 3~6) + POST /generate (brief.intent + answers + notes)

**provider chain (D12)**:
- env `DWORKS_LLM_PROVIDERS` 또는 request body `providers` 배열로 override
- `resolveProviderChain()` — trim/dedupe/unknown 무시
- `callLlmChain({ chain, ... })` 순회 — 첫 성공 즉시 반환
- 실패 분류: spawn-error / non-zero-exit / timeout / empty-output / **extract-failure** (Codex tempfile)
- parse-failure / schema-failure → fallback 안 함 (즉시 422)

**Codex provider (--output-last-message)**:
- `codex exec --json --ephemeral -o <tempfile> <prompt>`
- 성공 시 fsReadFile(tempfile) → 마지막 assistant message
- 누락/empty/read-fail → extract-failure → 다음 provider 시도
- LlmCliOptions에 `prepareOutputFileImpl` / `readOutputFileImpl` 주입 (테스트)

**variant**:
- web에서 Promise.allSettled로 N (1/2/3) parallel /generate
- VARIANT_DIVERSITY_HINTS 3종을 brief.notes에 request-only append (저장 brief는 원본 유지)
- 부분 성공 inline status text
- max 6 generations + immutable 원본 보호 (`appendGenerationHistoryEntries` 헬퍼)

**few-shot examples**:
- `packages/llm-prompts/src/index.ts`에 `GENERATE_TREE_EXAMPLES` (3개) + `CLARIFY_QUESTIONS_EXAMPLE` (1 도메인 4문항)
- TS 객체 + JSON.stringify로 prompt 삽입 — drift 방지 test (treeSchema / clarify schema)
- 스타일 prop은 emphasis / variant / aspectRatio만 가벼운 optional. 색상/spacing/typography는 m2에서 디자이너 자유 편집

**eval CLI**:
- `pnpm --filter @dworks/m3-eval start -- --fixtures seeds/m3-eval/intents.json [--live] [--repeat N] [--providers a,b,c] [--out path]`
- 기본 dry-run (deterministic Tree). `--live`로 실제 /generate 호출
- 출력: artifacts/m3-eval/<run-id>/{manifest.json, calls.jsonl, summary.json, summary.md}
- 측정: status / requestLatencyMs (HTTP RTT) / modelLatencyMs (API body) / treeNodeCount / treeDepth

---

## 사고 메모 — git add 명시 경로 권장

이번 세션에서 **AUTONOMOUS.md가 두 번 의도치 않게 삭제**됨 (commits `596005c`, `5c07a26`):
- 원인 미파악. Edit 도구는 성공 보고했지만 `git add -A` staged diff에서 파일이 deleted로 기록됨
- 복구 commits: `d53456a` + `ffc8a7b`
- 이후 ABSORB / 메인 doc commit은 **항상 `git add docs/AUTONOMOUS.md docs/DECISIONS.md`** 명시 경로 사용 — 사고 재발 0
- **권장**: `git add -A` 대신 명시 경로 사용

---

## 메인 문서 흡수 정책

- 신규 토픽 종료 → DECISIONS.md 부록 A 추가 (ABSORB commit)
- AUTONOMOUS.md 후보 목록 업데이트 (✓ 표시 + 후속 후보 신규)
- ABSORB commit 마지막 줄에 `[ABSORB]` marker (page.tsx counter reset 기준점)
- 가속 §2: round 3 ack 흡수 — 깔끔한 동의면 별도 doc 생략, feat commit message에 "Codex round 2 흡수: ..." 명시

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -25` — 최근 commits 파악
2. `git status` — worktree clean 확인
3. `cat docs/AUTONOMOUS.md` — mandate + M3 진척 + 후속 후보
4. `cat docs/HANDOVER-2026-05-09-pm.md` (본 파일)
5. `tail -10 .git/feed.log` — Codex 최근 활동 확인
6. 사용자 지시 없으면 자율 진행 — 후속 후보 우선순위 자체 합의 후 진입 (가속 §3)

---

## 코드 스택 위치 빠른 참조

- `apps/api/src/`:
  - `index.ts`: Hono entrypoint (POST /clarify + POST /generate)
  - `clarify.ts`: handleClarify + clarifyResponseSchema
  - `generate.ts`: handleGenerate + briefSchema (intent + answers + notes + providers? request override)
  - `llm.ts`: LlmProvider chain + callLlmCli + callLlmChain + Codex `-o tempfile` 처리
  - `*.test.ts`: 25 unit tests (chain fallback / extract-failure / brief 직렬화 / provider override)
- `packages/llm-prompts/src/`:
  - `index.ts`: GENERATE_TREE_SYSTEM_PROMPT + CLARIFY_QUESTIONS_SYSTEM_PROMPT (TS 객체 + JSON.stringify) + formatBriefAsUserPrompt
  - `index.test.ts`: 5 tests (drift 방지)
- `apps/web/src/app/page.tsx`:
  - 좌측 "AI 디자인" disclosure (Stage 1: intent / Stage 2: 적응형 질문) + 변형 개수 chip group + 생성 히스토리 chip group
  - GenerationEntry 모델 (immutable 원본 + mutable 생성물 + brief snapshot)
  - handleAskQuestions / handleGenerateTree (count 1 / 2 / 3 분기, Promise.allSettled) / handleSelectGeneration / commitTreeEdit
- `apps/m3-eval/`:
  - 신규 측정 CLI. seeds/m3-eval/intents.json 8 도메인 fixture

[Claude]
