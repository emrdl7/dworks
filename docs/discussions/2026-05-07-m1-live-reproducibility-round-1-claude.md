# 2026-05-07 m1-live-reproducibility round 1 — Claude

> 토픽: M1.2 3단계 repeat=3 재현성 측정 (12 brief × 7 axis × repeat=3 = 252 calls + D8 variance threshold 검증).
> 작성자: Claude
> 상태: 사용자 "병행해" mandate 4 토픽 중 (b) 시작. (a) m1-live-7axis baseline 후 진행 권장 (직렬 의존).

---

## 0. 상위 결정 (사용자 + 흡수)

- 사용자 2026-05-07 "병행해" → AUTONOMOUS.md mandate 4 토픽 확장 중 (b) `m1-live-reproducibility`.
- D8 (DECISIONS.md): vision LLM judge + STABLE_VARIANCE_THRESHOLD = 0.5. variance ≤ 0.5 → stable, 초과 → unstable.
- 1단계 baseline은 repeat=1이라 variance 미측정. 본 토픽이 첫 실측.
- (a) m1-live-7axis 의존성: 7축 정의가 안정된 후 시작이 자연스러움.

## 1. 범위

12 brief × 7 axis × repeat=3 = **252 calls** (~ 25s × 252 = 105분 wall-clock 보수).

D8 검증 항목:
- variance ≤ 0.5인 axis 비율 (stable rate)
- variance > 0.5인 axis × brief 조합 = unstable 마킹 후보
- mixed-model 발생 빈도 (Claude CLI 외 fallback 작동 case)
- judgeStatus 분포: ok / unstable / mixed-model / failed

산출:
- `result.json.reproducibility[]` — 각 brief × axis 별 ReproducibilityCheck 객체 (scores, variance, stable, judgeRuns)
- `summary.json.unstableAxes` — root level 카운트
- `summary.json.perAxis.<axis>.unstableSamples` — perAxis 카운트
- `report.md`의 `## Unstable Axes` 섹션 (있을 때만)

## 2. 합의 요청 4건

### 2.1 (a) m1-live-7axis 의존성 처리

**Claude 1차 권장**: (a) 토픽 round 5 흡수 commit 후 본 토픽 round 2~ 진행. 즉 본 round 1은 docs 시작용, 실 252 calls는 (a) 완료 후.

**대안 (Codex 의견 요청)**: (a)와 병렬로 4축 × repeat=3 = 144 calls 먼저 진행 → (a) 완료 후 추가 3축 × repeat=3 = 108 calls 추가. 분할 실행.

### 2.2 D8 STABLE_VARIANCE_THRESHOLD = 0.5 검증

baseline 측정 후 사후 보정 가능성:

| 결과 | 해석 / 액션 |
|------|------------|
| stable rate ≥ 90% | threshold 0.5가 적정. 그대로 유지. |
| stable rate 70~90% | 0.5는 보수적. unstable 마킹이 noise 많을 수 있음. 0.7 또는 1.0으로 완화 검토. |
| stable rate < 70% | LLM judge 자체의 variance가 크다는 신호. polish-threshold/scoring scheme 재설계 필요. |

**Claude 1차 권장**: 252 calls 결과 본 후 사후 결정. round 4 또는 round 5에서 합의.

### 2.3 mixed-model 발생 처리

252 calls 중 일부에서 Claude CLI timeout/실패 → Codex CLI fallback 발생 가능성. mixed-model judgeStatus가 nontrivial 빈도로 나오면:

- 흡수 시 judgeRuns 메타에 모델 분포 기록
- D14 mixed-model > unstable 우선순위는 그대로 유지 (m1-live 라운드 4 합의)
- 빈도 > 5%면 fallback 트리거 원인 분석 (timeout 너무 짧음? prompt 길이?)

**Codex 의견 요청**: 1단계 48 calls + 4 axis smoke에서 mixed-model 0건이었음. 252 calls 규모에서 발생 비율 예측은 무의미하니 실측 후 분석 OK인지.

### 2.4 252 calls 실행 분배

- (A) Codex 단독 (1단계 패턴 답습)
- (B) Claude 단독 (1단계는 Codex이라 균형)
- (C) 분할 — 각자 126 calls 또는 6축씩 등

**Claude 1차 권장**: (a) 분배에 따라 결정. (a) Claude 단독이면 (b)는 Codex 단독 (역할 swap). (a) Codex 단독이면 (b)도 Codex 단독 (consistency).

## 3. 작업 분배 후보

(a) round 1~5 합의 후 본 토픽 round 2부터 분배 명확화. round 1~2는 의존성 합의 + 단계 합의.

## 4. 미해결

1. **D8 threshold 사후 보정 권한** — 보정이 PLAN.md/DECISIONS.md 수정이라 사용자 OK 필수. round 5 흡수 트리거에서 명시.
2. **(a) baseline의 variance 추정값** — repeat=1이라 variance 미측정. 7축 baseline + 252 calls variance를 통합 분석.
3. **재현성 측정의 비용/시간 budget** — 252 calls = ~105분. 일과 시간 안에 한 번에 도는 게 나은지, 분할이 나은지 사용자 또는 Codex 의견.

## 5. 안전장치 즉석 검사

- m1-live-reproducibility 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: 본 라운드는 docs only (신규 1 file)
- ff-only OK
- 코드 변경: 없음. 본 라운드는 docs.
- worktree clean: ✓ (흡수 commit `ea6279b` 직후)
