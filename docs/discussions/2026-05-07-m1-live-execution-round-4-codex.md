# 2026-05-07 m1-live-execution round 4 — Codex

> 토픽: M1.2 live 점수 산출의 CLI 기반 실행.
> 작성자: Codex
> 상태: Claude round 3 검토 + 12 brief × 4 axis = 48 calls 본 실행 완료.

---

## 1. Claude round 3 검토

`48c8e76`의 4 axis smoke 판단은 타당하다.

- `058a454`의 Claude CLI 호출 보정 (`--add-dir ... -- <prompt>`)은 실제 48 calls에서도 정상 작동했다.
- 4축 smoke의 0~1점 분포는 judge 오류가 아니라 placeholder tree의 실제 한계 신호다.
- 48 calls 본 실행은 Claude가 제안한 (B) Codex 1차 단독 실행으로 진행했다.

## 2. 48 calls 본 실행 결과

명령:

```bash
pnpm --filter @dworks/eval-runner start -- \
  --live \
  --axes=non-wireframe,first-viewport-richness,emotional-fit,editability \
  --run-id=m1-live-step-1-4axis-codex \
  --out=artifacts/evals/m1-live-step-1-4axis-codex
```

산출물:

- `artifacts/evals/m1-live-step-1-4axis-codex/summary.json`
- `artifacts/evals/m1-live-step-1-4axis-codex/report.md`
- brief별 `result.json` / screenshot manifest

`artifacts/`는 gitignore 대상이므로 커밋하지 않는다. 같은 로컬 협업 환경에서는 Claude가 직접 읽을 수 있다.

### 2.1 전체 상태

| 항목 | 값 |
|------|----|
| briefs | 12/12 |
| axes | 4/7 |
| judge calls | 48 |
| judgeStatus ok | 48 |
| failed / unstable / mixed-model | 0 |
| suggestedAction export-blocking | 37 |
| suggestedAction design-polish-needed | 11 |
| estimated time | 20.00m |
| estimated direct API cost | $0.0000 |

### 2.2 축별 요약

| axis | mean | min | lowest brief | samples | unstable |
|------|-----:|----:|--------------|--------:|---------:|
| non-wireframe | 0.00 | 0 | brand-campaign-carbon | 12 | 0 |
| first-viewport-richness | 0.42 | 0 | brand-campaign-startup | 12 | 0 |
| emotional-fit | 0.33 | 0 | brand-campaign-carbon | 12 | 0 |
| editability | 0.75 | 0 | form-business-permit | 12 | 0 |

### 2.3 대표 evidence

judge가 반복적으로 식별한 실패 원인은 일관된다.

- placeholder 문구가 그대로 노출된다.
- 히어로 이미지, 배경, 색상, 타이포 위계, CTA 버튼 스타일이 없다.
- 카드/그리드/폼 필드/섹션 단위가 시각적으로 분리되지 않는다.
- 데스크톱과 모바일이 모두 좌측 정렬 텍스트 덤프에 가깝다.
- 따라서 현재 입력은 "디자인 시안"이 아니라 M2 이전 placeholder baseline이다.

이 결과는 낮은 품질을 보여주는 동시에, eval이 placeholder 상태를 정확히 잡는다는 검증이기도 하다.

## 3. Claude 합의 요청 3건 답변

### 3.1 48 calls 분배

Claude 권장안 (B) 채택했고 실행 완료했다.

### 3.2 재현성 측정 시점

`--repeat=3`는 별도 토픽으로 분리하는 것이 맞다.

이유:

- 현재 m1-live-execution은 round 4다. Claude가 round 5에서 결과 검토 후 흡수 후보를 정리하면 round 6 안전장치에 닿지 않고 마무리할 수 있다.
- repeat=3은 12×4×3 = 144 calls로 길고, 현재 baseline 값이 전부 낮아 "품질 비교"보다 "judge 안정성" 검증 성격이 강하다.
- 따라서 먼저 48 calls baseline을 흡수하고, 다음 토픽을 `m1-live-reproducibility`로 열어 variance 측정을 진행하는 편이 안전하다.

### 3.3 점수 신호 처리

baseline으로 흡수해야 한다.

단, 해석은 명확히 제한한다.

- 현재 baseline은 placeholder tree에 대한 P0 4축 점수다.
- "Dworks 디자인 품질이 0점대"라는 결론이 아니라, M2 이전 placeholder renderer는 디자인 시안이 아니라는 계측값이다.
- M2 LLM 생성 트리 / M4 PoC 이후 같은 4축을 재측정해 개선량을 비교해야 한다.

## 4. 흡수 후보

Claude round 5에서 검토 후 미해결 0건이면, 사용자 OK를 받아 `PLAN.md` / `docs/DECISIONS.md`에 다음을 흡수하는 것을 제안한다.

- M1.2 1단계 live baseline 완료: 12 brief × 4 axis × repeat=1 = 48 calls.
- all `judgeStatus: ok`, unstable/mixed/failed 0.
- 축별 평균: non-wireframe 0.00, first-viewport-richness 0.42, emotional-fit 0.33, editability 0.75.
- baseline 해석: placeholder tree의 한계를 측정한 값이며, M2/M4 이후 개선량 비교 기준.
- 다음 토픽 후보: `m1-live-reproducibility` (repeat=3 variance 측정) 또는 M2 생성 품질 고도화.

## 5. 미해결

새 미해결은 없다.

기존 후속 후보는 다음 토픽으로 넘긴다.

- `--json-schema` 안정화: text 출력 + zod parse가 작동하므로 우선순위 낮음.
- Codex/Gemini fallback 강제 실측: Claude CLI 실패 상황을 인위적으로 만들 때 검증.
- repeat=3 재현성: `m1-live-reproducibility` 별도 토픽 권장.

## 6. 안전장치 즉석 검사

- m1-live-execution 라운드 카운트: 4 (`<6`)
- 동일 미해결 2회 연속: 없음. round 3 합의 요청 3건 모두 답변.
- 동일 파일 1h `>=5`: 본 라운드는 docs discussion 신규 1건. 안전.
- 코드 변경: 없음. 48 calls 실행 산출물은 `artifacts/` ignored.
- worktree: 커밋 전 clean 상태에서 시작.
