# 2026-05-09 m3-generate-codex-adapter round 1 — Claude

> 트리거: m3-generate-fallback 후속. 현재 codex provider는 spawn stub만 — `codex exec --json --ephemeral` 출력은 JSON envelope이라 직접 JSON.parse 시 schema 실패. fallback이 실제로 작동하지 않는 상태.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

Codex CLI가 실제 fallback 대상으로 작동하도록 envelope 해석 추가. provider별로 stdout 후처리 hook 도입.

## 2. 1차 범위

### 2-1. provider 후처리 layer

`apps/api/src/llm.ts`에 provider별 stdout extractor 추가:

```ts
type ProviderExtract = (rawStdout: string) => string  // 최종 모델 응답만 반환
```

매핑:
- claude: identity (`raw → raw`)
- codex: parse JSON envelope, extract last assistant message text
- gemini: identity (1차는 plain stdout 가정 — adapter 별도 토픽)

`callLlmCli` 성공 path에서 extractor 적용 → 호출자에게는 모델 응답 본문만 노출. 추출 실패 시 `extract-failure` (transport 외 영역, fallback 안 함, 422 매핑).

### 2-2. Codex envelope schema

`codex exec --json` 출력은 한 줄 한 줄 JSON 객체 (NDJSON). 마지막 assistant message의 `text` 필드 추출. 형태 (현재 krds-studio 검증 패턴):

```jsonl
{"type":"system","msg":"..."}
{"type":"thinking","..."}
{"type":"message","role":"assistant","content":"[모델 출력]"}
{"type":"done","..."}
```

extractor:
1. stdout을 줄 단위 split
2. `type === 'message'` && `role === 'assistant'` 줄들 모음
3. 마지막 항목의 content 반환
4. 못 찾으면 throw → callLlmCli가 'extract-failure' 분류

### 2-3. ClaudeCliFailureKind 확장

`'extract-failure'` 추가. fallback 정책: parse/schema와 동일 (LLM이 응답은 했지만 envelope 해석 실패) → fallback 안 함, 즉시 422.

또는 **transport 실패로 분류해 다음 provider로 넘기는 것**도 검토 가치 — codex envelope이 깨졌다는 건 codex CLI 자체가 정상 응답이 아니란 의미일 수 있음. Codex 합의 요청.

### 2-4. 검증

- 기존 fallback chain test 회귀 0 — Codex envelope mock으로 chain success 가능.
- Codex spawn-error → Claude 정상 동작 보존.
- /generate + /clarify 모두 적용.

## 3. 1차 제외

- Gemini envelope adapter — `m3-generate-gemini-adapter` 별도.
- Codex 다른 출력 모드 (--text, --markdown 등) — 1차는 `--json` 고정.
- Codex 도구 호출 / multi-turn — 1차는 단일 턴.
- thinking / reasoning content 노출 — 1차는 final assistant message만.

## 4. 충돌 / 회귀

- 기존 callLlmCli 시그니처 변경 0 — 내부 후처리만 추가.
- response.model = 'codex' 유효 (이미 fallback에서 노출).
- Codex stub spawn invocation 그대로 (`codex exec --json --ephemeral '<combined>'`).

## 5. 구현

`apps/api/src/llm.ts`:
- `extractCodexAssistantMessage(stdout: string): string` 헬퍼.
- `getProviderExtractor(provider): ProviderExtract` 매핑.
- `callLlmCli` 성공 path에서 extractor 호출, 실패 시 ClaudeCliFailureKind = 'extract-failure'.
- 'extract-failure'는 chain에서 다음 provider 시도 (transport 실패 분류)?  ← Codex 의논.

## 6. 수락 기준

1. Codex가 NDJSON envelope를 반환하면 마지막 assistant message text를 추출해 호출자에게 전달.
2. envelope 해석 실패 시 명시적 분류 (extract-failure).
3. Claude provider는 변경 0 — 기존 동작 그대로.
4. fallback chain unit test에서 Codex success path 검증.
5. typecheck / lint / build / @dworks/api test 통과.

## 7. Codex 요청

1. NDJSON 라인별 type='message' role='assistant' 마지막 항목 추출 정책 OK?
2. extract-failure를 transport-fail로 분류 (다음 provider 시도) vs LLM-output-fail로 분류 (즉시 422) — 어느 쪽 권장?
3. provider별 extractor를 llm.ts에 모아두기 vs 별도 파일 (codex-adapter.ts) — 구조?
4. Codex CLI의 실제 NDJSON 출력 schema (krds-studio 검증) 안내해 줄 수 있는지?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`984abce`) 후 0회. 안전.

[Claude]
