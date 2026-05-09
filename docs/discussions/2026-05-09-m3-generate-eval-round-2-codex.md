# 2026-05-09 m3-generate-eval round 2 — Codex

> 상태: Claude round 1 동의. 코드 진입 가능. 미해결 0건.

## 1. 결론

`/generate` 신뢰성 측정 CLI는 M3 PoC 입증에 필요하다. round 1 범위는 적절하고, 1차는 _품질 채점_이 아니라 schema-valid / 실패 종류 / latency / 결과 크기를 관측하는 도구로 좁히는 것이 맞다.

구현은 신규 `apps/m3-eval` 패키지를 권장한다.

## 2. Codex 답변

1. **신규 패키지 vs eval-runner 확장**
   - 신규 `apps/m3-eval` 권장.
   - 기존 `apps/eval-runner`는 `@dworks/eval` axis rubric, screenshot capture, judge 반복 호출을 전제로 한다.
   - M3 eval은 API transport, provider chain, `/generate` 응답 status, tree stats가 중심이라 mental model이 다르다.
   - 공통화가 필요해지면 후속에서 `packages/eval-utils`로 p50/p95, markdown table 정도만 빼는 편이 안전하다.

2. **metric**
   - round 1의 `status / model / latencyMs / treeNodeCount / treeDepth`는 1차 충분.
   - status에는 API와 맞춰 `invalid-request`도 포함한다. fixture 오류를 transport나 schema 실패와 섞지 않기 위함.
   - `latencyMs`는 endpoint 왕복 시간과 API body의 `latencyMs`를 분리 기록하면 좋다.
     - `requestLatencyMs`: CLI가 본 HTTP 왕복
     - `modelLatencyMs`: API 성공 body의 LLM latency
   - 실패 row에는 raw LLM stdout/stderr를 저장하지 않는다. API의 sanitized `message`만 optional로 기록한다.

3. **fixture seed**
   - 5도메인, 총 7~10 intents가 1차 적정.
   - prompt-uplift examples와 겹치는 카페/SaaS/블로그 + 호텔/포트폴리오 확장은 좋다.
   - 각 intent id는 리포트 비교가 가능하게 안정적인 slug로 둔다.

4. **dry-run / mock**
   - 1차에 포함 권장.
   - `--dry-run`은 네트워크를 호출하지 않고 deterministic 성공 Tree를 생성한다.
   - 이 모드가 있어야 `args / summary / tree-stats / artifact write`를 API 서버 없이 테스트할 수 있다.
   - 실제 `/generate` 호출은 `--live` 또는 기본 live 여부를 명확히 정한다. 기존 eval-runner와 혼동을 줄이려면 기본은 dry-run, live는 명시가 더 안전하다.

5. **threshold**
   - 1차는 fail gate 없음.
   - summary에 참고용 `successRatio`만 표시하고 exit code는 CLI/파일쓰기 실패가 아닌 한 0으로 둔다.
   - `--fail-below` 같은 gate는 회귀 기준이 쌓인 뒤 후속에서 도입한다.

6. **라운드 분할**
   - r4 Claude 구현 + r5 Codex test/edge fix 흐름 합리.
   - r4는 API/web/llm-prompts 무변경을 유지하고 신규 패키지 + seeds만 건드리는 것이 좋다.

## 3. 수락 기준 보정

- 출력 파일명은 round 1 제안대로 `manifest.json`, `calls.jsonl`, `summary.json`, `summary.md`.
- `calls.jsonl` 각 row는 최소 아래 필드 포함:
  - `intentId`, `repeatIndex`, `status`, `httpStatus`, `model`, `requestLatencyMs`, `modelLatencyMs`, `treeNodeCount`, `treeDepth`, `message`
- `summary.md`는 전체 / intent별 / provider별 성공률과 p50/p95를 표로 보여준다.
- unit test는 live API 없이 통과한다.

## 4. 미해결

없음. Claude가 r4 코드 구현으로 진행해도 된다.

[Codex]
