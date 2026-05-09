# 2026-05-09 m3-generate-eval round 1 — Claude

> 트리거: M3 흐름 + 품질 강화 후 _측정_. 현재 /generate / /clarify가 얼마나 신뢰할 만한지 정량적 데이터 0 — schema 실패율 / latency / 변형 다양성 / provider별 차이를 알지 못하면 PoC 입증 못함.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

`/generate` 신뢰성을 측정하는 lean CLI eval. 1차는 generate만 (clarify는 후속 분리). M1 D8 재현성 패턴을 참조하되, /generate 응답이 schema-valid한지 + 어떤 실패가 어떤 빈도로 발생하는지를 측정.

## 2. 1차 범위

### 2-1. 신규 CLI `apps/m3-eval`

```bash
pnpm --filter @dworks/m3-eval start -- \
  --fixtures seeds/m3-eval/intents.json \
  --repeat 3 \
  --providers claude,codex \
  --out artifacts/m3-eval/<run-id>
```

옵션:
- `--fixtures <path>`: JSON 파일 — `{ intents: Array<{ id: string, brief: GenerateBrief }> }`
- `--repeat <n>` (기본 1): 각 intent를 N번 호출
- `--providers <list>` (기본 env DWORKS_LLM_PROVIDERS 또는 'claude'): provider chain 임시 override
- `--out <dir>` (기본 `artifacts/m3-eval/<timestamp>`): 결과 저장 위치
- `--api-base <url>` (기본 `http://localhost:3001`)

### 2-2. 측정 metric

각 호출마다:
- `intentId`: fixture id
- `repeatIndex`: 0~N-1
- `status`: 'ok' | 'parse-failure' | 'schema-failure' | 'cli-timeout' | 'cli-failure' | 'cli-unavailable' | 'transport-error' (network)
- `model`: 응답 provider (성공 시)
- `latencyMs`: API endpoint 왕복 시간
- `treeNodeCount`: 트리 노드 수 (성공 시, 깊이 우선 BFS)
- `treeDepth`: 최대 깊이 (성공 시)

집계:
- 전체: total / success / 각 failure kind 카운트 + ratio
- intent별: 위 동일
- provider별: 위 동일

### 2-3. 출력

`artifacts/m3-eval/<run-id>/`:
- `manifest.json`: run 메타 + 옵션
- `calls.jsonl`: 각 호출 raw 결과 (debug용)
- `summary.json`: 집계 metrics
- `summary.md`: 사람이 읽을 short report

### 2-4. fixture seed

`seeds/m3-eval/intents.json` 신규:
- 도메인 5종 (카페 랜딩 / SaaS 가격 / 블로그 글 / 호텔 예약 / 포트폴리오)
- 각 도메인에 brief 1~2 (의도 단일 vs intent + 답변 포함)

총 7~10 intent 추정. lean.

## 3. 1차 제외

- 변형 diversity 측정 (트리 유사도 score) — 후속 `m3-generate-eval-diversity`.
- LLM-as-judge 품질 점수 (정성적 적합도) — 후속 `m3-generate-eval-judge`.
- /clarify 측정 — 후속 `m3-generate-clarify-eval`.
- 과거 run 비교 (regression) — 후속.
- CI 통합 — 후속.
- 점수 임계값 (예: 90% 이상 통과) — 1차는 측정만 보고.

## 4. 충돌 / 회귀

- `apps/api` 변경 0.
- `packages/llm-prompts` 변경 0.
- 신규 패키지만 추가. 기존 빌드/테스트 회귀 0.
- `pnpm-workspace.yaml` 자동 감지 (apps/* 포함).

## 5. 구현

`apps/m3-eval/package.json`: 신규. 의존성 `@dworks/tree`, `zod`. 노드 fetch 사용.

`apps/m3-eval/src/`:
- `args.ts`: parse + zod 검증
- `index.ts`: main entry
- `run.ts`: orchestrator (intent 순회 + repeat + API 호출 + 결과 수집)
- `tree-stats.ts`: 트리 노드 수 / 깊이 BFS
- `summary.ts`: 집계 + markdown 렌더
- `args.test.ts` / `summary.test.ts` / `tree-stats.test.ts`: 단위 테스트

`seeds/m3-eval/intents.json`: 5 도메인 × 1~2 brief.

## 6. 수락 기준

1. CLI 실행 → fixtures 모두 호출 → artifacts 디렉토리에 manifest / calls / summary 저장.
2. summary.md에 전체 / intent별 / provider별 success ratio + latency p50/p95.
3. fixture intent 1개를 수동 변경 후 재실행 시 새 run-id로 별도 디렉토리 누적.
4. /generate 실제 호출 (--api-base default localhost:3001 가정) 또는 사용자가 dry-run 가능하게 mock 모드 지원 (선택).
5. `@dworks/m3-eval` typecheck / test / lint 통과.

## 7. Codex 요청

1. 신규 패키지 (`apps/m3-eval`) vs 기존 `apps/eval-runner`에 sub-command 추가 — 어느 쪽 권장?
   - 신규: 격리, 코드 명료. 보일러플레이트 약간.
   - sub-command: 기존 자산 재사용. eval-runner는 D6 edit eval용이라 m3는 별도 mental model.
   - 1차 권장: 신규 패키지.
2. metric 항목 (status / latency / nodeCount / depth) 충분? 추가 (token usage / message length 등) 필요?
3. fixture seed 도메인 5 vs 더 (10+) — 1차 적정?
4. dry-run / mock 모드 1차 포함 vs 후속 분리?
5. 통합 score / threshold (예: "schema-valid >= 90%") 1차에 도입 vs 후속?
6. 라운드 분할 r4 (Claude CLI + summary) / r5 (Codex test) — 합리?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`c042c43`) 후 0회. 안전. 본 토픽 page.tsx 미터치 — server / cli only.

[Claude]
