# 2026-05-07 m1-live-reproducibility retry 1 abort — Codex

> 토픽: M1.2 3단계 repeat=3 재현성 측정.
> 작성자: Codex
> 상태: `--fail-on-fallback` 적용 후 252 calls 재실행 중단 기록. round 카운트 밖의 실행 노트.

---

## 1. Preflight

사전 합의한 1 call smoke를 먼저 실행했다.

```bash
pnpm --filter @dworks/eval-runner start -- \
  --live \
  --briefs=brand-campaign-carbon \
  --axes=non-wireframe \
  --fail-on-fallback \
  --run-id=m1-live-repro-preflight-codex-20260507-1745 \
  --out=artifacts/evals/m1-live-repro-preflight-codex-20260507-1745
```

결과:

- `judgeStatus`: `ok`
- `judgeModel`: `claude`
- `judgeModelVersion`: `claude-cli`
- `score`: 0

해석: live primary Claude path 자체는 정상. `--fail-on-fallback` 때문에 fallback이 발생하지 않음.

## 2. Retry 1 실행

```bash
pnpm --filter @dworks/eval-runner start -- \
  --live \
  --repeat=3 \
  --fail-on-fallback \
  --run-id=m1-live-step-3-7axis-repeat3-codex-retry-1 \
  --out=artifacts/evals/m1-live-step-3-7axis-repeat3-codex-retry-1
```

## 3. 중단 지점

실행은 `form-business-permit` 처리 중 중단됐다.

에러:

```text
primary judge failed with --fail-on-fallback:
Error: /Users/johyeonchang/.claude/local/claude judge timed out after 30000ms
```

중요한 점:

- 이번에는 codex/gemini fallback으로 넘어가지 않았다.
- 따라서 mixed-model artifact는 생기지 않았다.
- `--fail-on-fallback` 옵션은 의도대로 작동했다.

## 4. Partial artifact 상태

완료된 result:

| brief | axes | status | max variance |
|-------|------|--------|--------------|
| brand-campaign-carbon | 7 | ok 7 | 0.2222 |
| brand-campaign-startup | 7 | ok 7 | 0 |
| dashboard-customer-support | 7 | ok 7 | 0 |
| dashboard-energy-monitoring | 7 | ok 7 | 0 |
| dashboard-project-status | 7 | ok 7 | 0 |

`form-business-permit`는 screenshot만 생성됐고 `result.json`은 없다.

## 5. 해석

이번 retry는 baseline으로 흡수하면 안 된다. 다만 다음 사실은 확인됐다.

1. `--fail-on-fallback`이 mixed-model 오염을 방지한다.
2. 5개 brief × 7축 × repeat=3 = 105 judge calls까지는 모두 `ok`.
3. 현재 실패 원인은 fallback chain이 아니라 Claude CLI 30초 timeout.

## 6. 다음 권장

선택지는 둘이다.

- **A. timeout 상향 후 retry 2**: `JUDGE_TIMEOUT_MS`를 설정 가능하게 만들고 60초로 retry. 권장.
- **B. 현재 30초 유지 + 다시 retry**: 같은 지점에서 재실패 가능성이 높음.

Codex 권장: A. `--judge-timeout-ms=60000` 또는 env 기반 timeout 설정을 작은 atomic change로 추가한 뒤, 같은 run-id가 아닌 `m1-live-step-3-7axis-repeat3-codex-retry-2`로 재실행한다.

## 7. 안전장치

- 본 파일은 round 카운트 밖의 실행 중단 노트다.
- `m1-live-reproducibility` 공식 라운드 파일은 round 5까지 존재한다.
- 다음 논의 응답을 round 6으로 작성하면 `COLLABORATION.md` §11.6 #1에 걸린다.
- 따라서 다음은 Claude가 이 abort note를 검토하고, 필요하면 ALERT 또는 새 하위 토픽(`m1-runner-timeout-config`)으로 분리하는 편이 맞다.
