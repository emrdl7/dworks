# 2026-05-07 m1-live-reproducibility retry 3 result — Codex

> 토픽: M1.2 3단계 repeat=3 재현성 측정.
> 작성자: Codex
> 상태: 완료. round 카운트 밖의 실행 결과 노트.

---

## 1. 실행 명령

Claude quota reset 이후, retry 2 중단 노트의 권장대로 동일 옵션을 유지해 재실행했다.

```bash
pnpm --filter @dworks/eval-runner start -- \
  --live \
  --repeat=3 \
  --fail-on-fallback \
  --judge-timeout-ms=60000 \
  --run-id=m1-live-step-3-7axis-repeat3-codex-retry-3 \
  --out=artifacts/evals/m1-live-step-3-7axis-repeat3-codex-retry-3
```

## 2. 실행 결과

artifact:

```text
artifacts/evals/m1-live-step-3-7axis-repeat3-codex-retry-3
```

요약:

| 항목 | 값 |
|------|----|
| mode | live |
| briefs | 12 |
| axes | 7 |
| repeat | 3 |
| judge calls | 252 |
| judge status | ok 84, unstable 0, mixed-model 0, failed 0 |
| unstable axes | 0 |

retry 1의 timeout 지점인 `form-business-permit`와 retry 2의 quota 중단 지점인
`form-event-registration`을 모두 통과했다.

## 3. 재현성 판정

D8의 repeat=3 variance 관점에서는 통과로 본다.

- 12개 brief 모두 `result.json` 생성 완료.
- 모든 axis status가 `ok`.
- `mixed-model` 0건: `--fail-on-fallback`이 의도대로 오염을 막았다.
- `unstable` 0건.
- brief별 최대 variance는 0 또는 0.2222 수준으로, 현재 재현성 기준에서는 안정적이다.

## 4. 디자인 품질 판정

재현성은 안정적이지만, 디자인 산출물 품질은 baseline으로 통과시키면 안 된다.

axis 평균:

| Axis | Mean | Min | Lowest brief |
|------|-----:|----:|--------------|
| non-wireframe | 0.17 | 0 | brand-campaign-carbon |
| first-viewport-richness | 0.67 | 0 | brand-campaign-startup |
| emotional-fit | 0.25 | 0 | brand-campaign-carbon |
| visual-variety | 0.08 | 0 | brand-campaign-carbon |
| brand-reference-fidelity | 0.58 | 0 | brand-campaign-carbon |
| responsive-design-intent-preservation | 0.25 | 0 | brand-campaign-carbon |
| editability | 0.50 | 0 | dashboard-project-status |

핵심 해석:

- evaluator는 정상 작동한다.
- 현재 산출물은 대부분 `placeholder 본문 — M2 이후 LLM 생성으로 교체`가 노출되는 raw text 상태다.
- 따라서 낮은 점수는 evaluator 실패가 아니라 현재 generator placeholder 상태를 정확히 잡은 결과다.
- 본 결과는 "현재 디자인 품질이 낮다"는 근거로 삼아야 하며, "eval 축이 과도하다"는 근거로 보면 안 된다.

## 5. 다음 조치 제안

1. `m1-live-reproducibility`는 실행/재현성 측면에서 완료로 보고, 새 코드 변경 없이 결과를 보존한다.
2. 다음 구현 우선순위는 M2/M4보다 **M2-tree-editor / LLM 생성 트리** 쪽이 맞다.
   - 현재 품질 병목은 평가기가 아니라 placeholder 생성물이다.
   - 사용자가 우선순위로 둔 "1차 생성물 디자인 고도화"와 "편집 역할 확장"에 직접 연결된다.
3. M2 구현 전제는 "HTML 구조 검증"이 아니라 "디자인 결과물 검증"이어야 한다.
   - screenshots + vision judge 기반의 non-wireframe / emotional-fit / first-viewport-richness 등 P0 axis를 계속 기준으로 둔다.
   - HTML→tree PoC는 연구 트랙으로 두되, 현재 품질 병목 해결의 선행 조건은 아니다.
4. 후속 Claude 라운드는 retry 3 결과 검토 후, M2 code topic의 첫 atomic implementation 단위를 확정하는 쪽이 좋다.

## 6. 검증

실행 완료 후 확인:

```bash
find artifacts/evals/m1-live-step-3-7axis-repeat3-codex-retry-3 -name result.json | wc -l
# 12
```

`artifacts/evals/.../report.md` 기준:

```text
judge status: ok 84, unstable 0, mixed-model 0, failed 0
unstable axes: 0
```

