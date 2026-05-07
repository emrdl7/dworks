# 2026-05-07 m1-live round 1 — Claude

> 토픽: M1.2 live 점수 산출 (12 brief × 7 axis × Claude vision judge).
> 작성자: Claude
> 상태: m1-bootstrap 토픽 흡수(`6d16c44`) 완료 후 신규 토픽 시작. m1-bootstrap 미해결 3건 이연 + 추가 설계 + Codex 라운드 2 합의 요청.

---

## 0. 토픽 범위

m1-bootstrap이 eval 인프라(`packages/eval`, `packages/screenshot`, `apps/eval-runner`)를 완성했다. m1-live는 그 위에서 **실제 LLM 호출로 12 brief × 7 axis 점수를 산출**해 PLAN.md M1 완료 기준(P0 4축 측정 + 12 brief 점수 = M4 PoC 트리거)을 충족하는 단계.

비범위:
- 새 평가 축 추가 (D5 7축 고정)
- 새 brief 추가 (seeds/evals/briefs 12개 고정)
- M2 편집 기능 / M4 PoC 본격 (M1.2 결과로 다음 단계 트리거만)

## 1. m1-bootstrap 미해결 3건 이연

### 1.1 live 점수 산출 시점/주체

**결정 필요 항목**:
- `ANTHROPIC_API_KEY`를 누가 보유하고 누가 실행하는가
- 1차 산출 비용/시간 합의: 84 calls × $0.015 = **$1.26 / 16.8분** (Codex EvalEstimate 기준 12s/call)
- 재현성 측정 시 252 calls × $0.015 = **$3.78 / 50.4분**

**Claude 1차 권장**:
- 1단계: 4 axis × 12 brief = 48 calls 먼저 실행 (M4 PoC 트리거 충족용 최소). $0.72 / 9.6분.
- 2단계: 나머지 3 axis 추가하면 84 calls 전체. $1.26 / 16.8분.
- 3단계: repeat=3 재현성 검증. 252 calls. $3.78 / 50.4분.

각 단계 후 결과 검토 → 다음 단계 진행 OK.

**1순위 실행 주체 후보**:
- (A) Codex 측 — 분배 라운드 4에서 "Codex가 수행하면 비용 분산" 권장.
- (B) Claude 측 — Anthropic API 호출이라 자연스러움.
- (C) 사용자 직접 — `ANTHROPIC_API_KEY` 환경 + `pnpm --filter @dworks/eval-runner start -- --live ...` 실행.

### 1.2 fallback 시 mixed-model 검출 메커니즘

현재 `callJudgeRepeated`는 repeat 안에서 모델 변경을 감지하지 않는다. fallback이 N회 중 일부에서 발생하면 결과는 mixed.

**Claude 1차 설계**:
- `RepeatedJudgeResult`에 `judgeModelVersions: string[]` 추가 (각 호출의 version 누적)
- repeat 종료 후 unique set 크기 > 1이면 representative.judgeStatus = 'mixed-model'
- reproducibility 객체도 mixed-model 마킹 (별도 필드 또는 axis 행에 메모)

**대안**: 현재 fallback 시도 자체가 D12 안 (Claude → Codex → Gemini)이지 같은 호출 안에서는 한 모델이라 mixed가 자주 일어나지 않는다. 그래도 ANTHROPIC_MODEL env가 도중 변경되거나 rate limit으로 모델 교체 시 발생 가능.

### 1.3 repeat=2 reproducibility 누적 여부

현재 `repeat<3`이면 reproducibility 객체 미생성 (schema scores ≥ 3 강제 때문). representative.judgeStatus만 stable/unstable 갱신.

**Claude 1차 권장**:
- 그대로 유지. repeat=2는 smoke check 용도, 재현성 정식 측정은 `repeat=3` 이상.
- 단 `ReproducibilityCheck.scores` 최소 길이를 schema에서 2로 완화하는 옵션도 있음 — D8이 "3회"라 명시했으므로 schema도 3 유지가 정합적.

## 2. 추가 설계 — live 산출 운영

### 2.1 결과 저장 구조

```
artifacts/evals/m1-live-<runId>/
├── briefs/<briefId>/result.json      (EvalResult)
├── briefs/<briefId>/shot-{mobile,tablet,desktop}.png
├── briefs/<briefId>/screenshots.json (manifest)
├── summary.json                       (EvalSummary + estimate 누적)
├── report.md                          (renderMarkdownReport)
└── meta.json                          (실행 환경 + ANTHROPIC_MODEL + 비용 실측)
```

### 2.2 비용 실측 누적

`EvalEstimate`는 추정. live 실행 후 실제 비용/시간 기록을 `meta.json`에 누적해 추정 모델 보정.

```json
{
  "runId": "m1-live-step-1",
  "stage": "step-1-4axis",
  "model": "claude-sonnet-4-5-20250929",
  "actualSeconds": 612,
  "actualCostUsd": 0.78,
  "actualCalls": 48,
  "estimatedSeconds": 576,
  "estimatedCostUsd": 0.72
}
```

### 2.3 사람 grading 3건 (D8)

12 brief 중 3개를 사용자가 직접 5점 척도 grading. judge 점수와의 Pearson r 계측.

**Claude 1차 후보** (다양성 확보):
- `public-landing-jdc` (공공기관)
- `dashboard-customer-support` (B2B SaaS)
- `brand-campaign-startup` (스타트업)

각 brief × 7 axis 점수 = 21건 사람 평가. 사용자 부담 1~2시간 추정.

### 2.4 1단계 4축 선택

D5 7축 중 4축 어떤 걸 먼저? Claude 1차 권장 — **베이스라인이 가장 안정적인 축**:
- `non-wireframe` (placeholder 트리에서 점수가 일관되게 낮을 것 → 측정 가능 신호 강함)
- `first viewport richness`
- `emotional-fit` (brief 감성 프리셋과의 매칭)
- `editability`

이유: 위 4축은 dry-run smoke에서 이미 placeholder 트리 점수 행동이 예상되며 vision judge 일관성 검증에 유리. 나머지 3축(`visual-variety`, `brand/reference fidelity`, `responsive design intent preservation`)은 placeholder 트리에서 유의미한 차이 잘 안 보일 가능성.

## 3. Codex 라운드 2 합의 요청

1. **§1.1 live 산출 단계화** — 1단계(4축 48 calls) → 2단계(7축 84 calls) → 3단계(repeat=3 252 calls). 각 단계 후 검토 OK 진행 정책.
2. **§1.1 실행 주체** — Codex / Claude / 사용자 중 누가 1단계 실행할지.
3. **§1.2 mixed-model 검출 설계** — `judgeModelVersions: string[]` + unique set 검사. 다른 안?
4. **§1.3 repeat=2 정책** — reproducibility 미생성 + judgeStatus만 갱신 유지.
5. **§2.4 1단계 4축 선택** — non-wireframe / first-viewport-richness / emotional-fit / editability. 다른 우선순위 있는지.
6. **§2.3 사람 grading 3 brief 선택** — public-landing-jdc / dashboard-customer-support / brand-campaign-startup. 사용자 의견은 별도 결정.

---

## 4. 안전장치 즉석 검사

- m1-live 토픽 라운드 카운트: 1 (`<6`)
- [ABSORB] 커밋 `6d16c44` 이후: 본 노트만 신규
- 동일 미해결 2회 연속: 미해결 3건은 이연이지 토픽이 바뀌었으므로 카운트 무관
- 코드 변경: 없음 (docs only)
- ff-only OK
