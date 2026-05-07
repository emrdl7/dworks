# 2026-05-07 m1-live-reproducibility run abort — Codex

> 토픽: M1.2 3단계 repeat=3 재현성 측정.
> 작성자: Codex
> 상태: 252 calls 실행 중 Claude 사용 한도 도달로 중단. 코드 변경 없음.

---

## 1. 실행 시도

Codex가 round 2 합의에 따라 아래 실행을 시작했다.

```bash
pnpm --filter @dworks/eval-runner start -- \
  --live \
  --repeat=3 \
  --axes=non-wireframe,first-viewport-richness,emotional-fit,editability,visual-variety,brand-reference-fidelity,responsive-design-intent-preservation \
  --run-id=m1-live-step-3-7axis-repeat3-codex \
  --out=artifacts/evals/m1-live-step-3-7axis-repeat3-codex
```

목표는 12 brief × 7 axis × repeat=3 = 252 calls.

## 2. 중단 사유

사용자가 "클로드 사용한도에 도달했다"라고 알렸고, 실행 중 실제 fallback이 발생했다.

- `form-business-permit`에서 `failed:2`, `mixed-model:1`, `ok:4`가 기록됐다.
- 이후 `form-event-registration`에서도 Gemini fallback process가 반복 발생했다.
- 이 상태로 계속 실행하면 D8 재현성 측정이 "동일 judge model/version 반복"이 아니라 mixed-model 장기 실행이 되어 baseline으로 쓰기 어렵다.

따라서 Codex가 실행 중인 `eval-runner` / fallback process를 종료했다.

## 3. partial artifact 상태

artifact는 gitignore 하위에만 남아 있다.

경로:

- `artifacts/evals/m1-live-step-3-7axis-repeat3-codex/`

완료된 result:

| brief | status | stable | max variance |
|-------|--------|--------|-------------:|
| brand-campaign-carbon | ok:7 | true:7 | 0 |
| brand-campaign-startup | ok:7 | true:7 | 0.2222 |
| dashboard-customer-support | ok:7 | true:7 | 0.2222 |
| dashboard-energy-monitoring | ok:7 | true:7 | 0.2222 |
| dashboard-project-status | ok:7 | true:7 | 0.2222 |
| form-business-permit | failed:2, mixed-model:1, ok:4 | true:7 | 0.2222 |

`form-event-registration`은 screenshot까지만 있고 result는 완성되지 않은 상태에서 중단됐다.

## 4. 판단

이 run은 **baseline으로 흡수하지 않는다**.

부분 결과는 다음 판단에만 참고한다.

- statusCounts 보강은 효과가 있었다. fallback/failed가 summary 전에 result 단위에서도 명확히 드러났다.
- 점수 variance는 완료된 항목 기준 모두 D8 0.5 이하였지만, model failure가 먼저 blocking signal이다.
- 252 calls 전체 재실행은 Claude 사용 한도가 회복된 뒤 해야 한다.

## 5. 다음 권장

1. Claude quota 회복 후 같은 run-id가 아니라 새 run-id로 전체 252 calls를 처음부터 다시 실행한다.
2. 재실행 전 가능하면 짧은 preflight를 둔다.
   - 예: 1 brief × 1 axis × repeat=1 live 호출.
   - fallback이 발생하면 252 calls를 시작하지 않는다.
3. 장기적으로 `eval-runner`에 `--judge-policy=primary-only` 또는 `--fail-on-fallback` 옵션을 추가하는 토픽을 검토한다.
   - 재현성 측정은 mixed-model fallback보다 hard fail이 더 해석 가능하다.

## 6. 안전장치 즉석 검사

- m1-live-reproducibility는 중단 상태. 완료/흡수 없음.
- tracked worktree는 clean 상태에서 docs note만 추가.
- partial artifacts는 gitignore 하위.
- 다음 실행은 Claude quota 회복 후 새 run-id로 재시작.
