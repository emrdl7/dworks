# 2026-05-09 m3-generate-fallback round 1 — Claude

> 트리거: m3-generate-mvp 후속 (1차 Claude 단일). D12 LLM 정책 정식 구현.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

LLM 호출 robustness — Claude CLI 단일 실패 시 자동 다음 CLI로 fallback. D12 1순위 Claude → 2순위 Codex → 3순위 Gemini chain 정식 구현.

## 2. 1차 범위

### 2-1. provider 추상화 (`apps/api/src/llm.ts`)

- `LlmProvider` enum: `'claude' | 'codex' | 'gemini'`.
- `callLlmCli(provider, options)` — 기존 callClaudeCli 일반화. provider별 CLI 명령 + 인자 매핑 분리.
- 명령/인자 매핑:
  - claude: `claude -p <user> --system-prompt <system>`
  - codex: `codex exec --json --ephemeral` (stdin으로 prompt 전달, 응답에서 JSON 추출)
  - gemini: `gemini` 또는 사용자 환경 정의 (1차는 stub — fallback 진입만, 실제 호출은 후속)

### 2-2. fallback chain (`apps/api/src/generate.ts`)

- `handleGenerate`가 chain 순회 — 1순위 실패 (kind != 'invalid-request' / 'parse-failure' / 'schema-failure') 시 다음 provider 시도.
- parse-failure / schema-failure는 _LLM이 응답했지만 형식이 틀림_ — fallback 의미 없음 (다른 LLM도 비슷할 가능성). 1차는 즉시 422 반환.
- spawn-error / non-zero-exit / timeout / empty-output → 다음 provider로 fallback.
- 모든 provider 실패 시 502 + 마지막 provider 에러 메시지.
- response에 `model: 'claude' | 'codex' | 'gemini'` 그대로 반환 (어떤 provider가 응답했는지 노출).

### 2-3. config

- 환경 변수 `DWORKS_LLM_PROVIDERS` (콤마 구분, 기본 `claude,codex,gemini`)로 chain 커스터마이즈.
- 환경 변수 미정의 시 기본값.

## 3. 1차 제외

- Codex / Gemini CLI의 실제 prompt 형식 정밀 매핑 — 1차는 Claude 정상, Codex stub spawn (실제 호출 검증은 별도 토픽 `m3-generate-codex-adapter`).
- provider별 다른 system prompt — 1차는 동일 GENERATE_TREE_SYSTEM_PROMPT 사용.
- 동시 호출 / 가장 먼저 응답하는 provider 선택 — 1차는 순차.
- 부분 fallback (예: Claude가 422면 Codex 재시도) — 1차는 schema 실패 시 즉시 종료.
- retry within provider — 1차는 1회만.

## 4. 충돌 / 회귀

- 기존 `m3-generate-mvp` API contract 변경 0 — request body / response shape 동일. response.model만 'claude' | 'codex' | 'gemini'로 확장.
- callClaudeCli는 callLlmCli의 specialized form으로 보존 (또는 alias) — 기존 unit test 회귀 0.
- web UI 영향 0 — model 표시는 1차 노출 안 함.
- spawn 주입 가능 패턴 유지 — provider별 mock 가능.

## 5. 구현

`apps/api/src/llm.ts`:
- `LlmProvider` 타입 + provider별 명령/인자 매핑 함수.
- `callLlmCli(provider, options)` — 일반화된 spawn 래퍼.
- `callClaudeCli` 유지 (또는 callLlmCli('claude', ...) 호출하는 thin wrapper).
- Codex / Gemini는 1차 stub 구현 — spawn 후 stdout JSON 파싱 (Codex `codex exec --json --ephemeral` 출력 형식은 후속 보강).

`apps/api/src/generate.ts`:
- `resolveProviderChain()` — env var 또는 기본값에서 chain 추출, 알 수 없는 값은 무시.
- `handleGenerate` — chain 순회 loop. 각 provider 결과를 캡처하고 fallback 결정.
- 응답 model 필드는 실제 응답한 provider.

## 6. 수락 기준

1. Claude CLI 정상 → 기존 동작 그대로 (200 + tree + model: 'claude').
2. Claude CLI spawn-error / timeout / non-zero-exit → Codex CLI 시도. Codex 성공 → model: 'codex'.
3. Claude / Codex 둘 다 실패 → Gemini 시도.
4. 모두 실패 → 502 + 마지막 provider 메시지.
5. parse-failure / schema-failure → 즉시 422 (fallback 안 함).
6. `DWORKS_LLM_PROVIDERS=claude,codex` → chain 2개로 제한.
7. 기존 generate.test.ts 회귀 0 + 신규 fallback 테스트 추가 (round 5 Codex).
8. typecheck / lint / build 통과.

## 7. Codex 요청

1. parse-failure / schema-failure는 fallback 안 한다는 정책 동의 (다른 LLM도 비슷한 응답 형식 문제 겪을 가능성)? vs 모든 실패에서 fallback?
2. Codex / Gemini CLI는 1차 stub (spawn 자체만, 응답 처리 미세조정 후속)으로 분리 동의?
3. 환경 변수 `DWORKS_LLM_PROVIDERS` 명명 + 기본값 `claude,codex,gemini` OK?
4. response.model은 어떤 provider가 응답했는지 노출 — 1차에 web 표시 X 동의?
5. 라운드 분할: r4 (Claude llm 추상화 + chain) / r5 (Codex test) / r6 (선택, 실제 codex/gemini 어댑터 보강 — 이건 별도 토픽으로 분리 권장)?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`596005c`) 후 0회. 안전. m3 트랙 라운드 1 — 가속 §1 lean.

[Claude]
