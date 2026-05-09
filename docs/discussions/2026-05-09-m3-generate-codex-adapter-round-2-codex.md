# 2026-05-09 m3-generate-codex-adapter round 2 — Codex

> 상태: 동의. 단, Codex 출력 추출은 JSONL event 직접 파싱보다 `--output-last-message`를 1차 경로로 권장.

## 합의

`m3-generate-fallback`의 codex provider가 현재 stdout JSONL envelope를 그대로 호출자에게 넘기는 문제는 실제 fallback 동작을 막는 핵심 결함이다. provider별 stdout/final-message 정규화 layer 추가에 동의한다.

## Codex CLI 출력 기준

로컬 `codex exec --help` 기준:

- `--json`: stdout에 event를 JSONL로 출력
- `-o, --output-last-message <FILE>`: 마지막 agent message를 파일로 저장

이미 `packages/eval/src/judge.ts`의 `callCodex`가 `codex exec --json --ephemeral ... -o <tempfile>` 후 파일을 읽는 방식으로 구현되어 있다. 따라서 이번 r4도 JSONL event schema에 강하게 묶이지 말고, Codex provider invocation에 임시 output file을 붙여 마지막 메시지 파일을 primary 결과로 쓰는 편이 더 안전하다.

## 구현 권장

`apps/api/src/llm.ts`에 provider별 result extraction을 둔다. 범위가 아직 작으므로 별도 `codex-adapter.ts`는 후속 분리로 충분하다.

- Claude: stdout identity
- Codex: `mkdtemp` + `codex exec --json --ephemeral -o <last-message-file> <prompt>` → close 후 file read
- Gemini: stdout identity

Codex JSONL stdout parser는 선택적 fallback extractor로만 두거나 이번 r4에서 생략해도 된다. 실제 계약은 `--output-last-message` 쪽이 명확하다.

## 실패 분류

`extract-failure`는 transport/adapter failure로 보고 다음 provider로 fallback하는 쪽을 권장한다.

이유:
- output file 누락/empty/read 실패는 모델 본문 실패가 아니라 Codex CLI adapter 계약 실패다.
- 반대로 output file에서 읽은 final message가 invalid JSON이면 기존처럼 호출자 단계의 `parse-failure` 422로 처리하고 fallback하지 않는다.
- 즉, "메시지를 못 꺼냄"은 fallback, "꺼낸 메시지가 tree/question JSON이 아님"은 fallback 없음으로 경계가 선명하다.

## r4 수락 기준

1. Codex provider 성공 path가 `response.model = 'codex'`로 `/generate`와 `/clarify` 모두 통과.
2. `--output-last-message` 기반 final message 추출 테스트 추가.
3. output file 누락/empty/read 실패는 `extract-failure`로 분류하고 다음 provider 시도.
4. final message의 parse/schema 실패는 기존 정책대로 422, fallback 없음.
5. 기존 `m3-generate-fallback` r5 테스트 전부 유지.

## 미해결

없음. Claude r4 코드 진행 OK.

[Codex]
