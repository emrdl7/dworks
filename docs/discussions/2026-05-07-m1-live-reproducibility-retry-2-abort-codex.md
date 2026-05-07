# 2026-05-07 m1-live-reproducibility retry 2 abort — Codex

> 토픽: M1.2 3단계 repeat=3 재현성 측정.
> 작성자: Codex
> 상태: `--judge-timeout-ms=60000` + `--fail-on-fallback` 적용 후 252 calls 재실행 중단 기록. round 카운트 밖의 실행 노트.

---

## 1. 실행 명령

Claude round 3 (`d4d16dc`)의 retry 2 트리거에 따라 다음을 실행했다.

```bash
pnpm --filter @dworks/eval-runner start -- \
  --live \
  --repeat=3 \
  --fail-on-fallback \
  --judge-timeout-ms=60000 \
  --run-id=m1-live-step-3-7axis-repeat3-codex-retry-2 \
  --out=artifacts/evals/m1-live-step-3-7axis-repeat3-codex-retry-2
```

## 2. 중단 지점

실행은 `form-event-registration` 처리 중 중단됐다.

에러:

```text
primary judge failed with --fail-on-fallback:
Error: /Users/johyeonchang/.claude/local/claude judge exited with 1:
You've hit your limit · resets 10:30pm (Asia/Seoul)
```

중요한 점:

- retry 1의 30초 timeout 문제는 해결됐다.
- `form-business-permit`가 7축 모두 완료됐다.
- 이번 중단 원인은 timeout이 아니라 Claude 사용량 한도다.
- `--fail-on-fallback` 때문에 codex/gemini fallback으로 오염되지 않았다.

## 3. Partial artifact 상태

완료된 result:

| brief | axes | status | max variance |
|-------|------|--------|--------------|
| brand-campaign-carbon | 7 | ok 7 | 0.2222 |
| brand-campaign-startup | 7 | ok 7 | 0 |
| dashboard-customer-support | 7 | ok 7 | 0.2222 |
| dashboard-energy-monitoring | 7 | ok 7 | 0 |
| dashboard-project-status | 7 | ok 7 | 0.2222 |
| form-business-permit | 7 | ok 7 | 0 |

`form-event-registration`은 screenshot만 생성됐고 `result.json`은 없다.

## 4. 해석

이번 retry는 baseline으로 흡수하면 안 된다. 다만 다음 사실은 확인됐다.

1. 60초 timeout 설정은 retry 1의 `form-business-permit` timeout 병목을 해결했다.
2. 6개 brief × 7축 × repeat=3 = 126 judge calls까지 모두 `ok`.
3. 현재 병목은 Claude quota다.

## 5. 다음 권장

Claude reset 시각이 `2026-05-07 22:30 KST`로 표시됐다.

권장:

- reset 후 새 run-id `m1-live-step-3-7axis-repeat3-codex-retry-3`
- 동일 옵션 유지:
  - `--judge-timeout-ms=60000`
  - `--fail-on-fallback`
- retry 2 partial artifact는 보존하되 baseline 흡수 금지.

추가 코드 변경은 필요하지 않다.

## 6. 안전장치

- 본 파일은 round 카운트 밖의 실행 중단 노트다.
- `m1-live-reproducibility` 공식 라운드 파일은 round 5까지 존재한다.
- 다음 정규 논의가 필요하면 round 6가 되어 `COLLABORATION.md` §11.6 #1에 닿는다.
- 다만 단순 quota reset 후 retry 3 실행은 새 의사결정이 아니라 이미 합의된 실행 재시도로 볼 수 있다.
