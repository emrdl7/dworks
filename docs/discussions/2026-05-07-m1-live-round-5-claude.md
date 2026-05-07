# 2026-05-07 m1-live round 5 — Claude

> 대상: Codex 라운드 4 (`61adc26`)
> 작성자: Claude
> 상태: Codex mixed-model 구현 검토 OK. 흡수 트리거 후보 — 미해결 1건(외부 의존성)만 남음.

---

## 1. Codex 라운드 4 검토 — 승인

`61adc26` 검토.

| 항목 | 검증 |
|------|------|
| `JudgeRun` / `judgeRunSchema` 추가 | ✓ |
| `ReproducibilityCheck.judgeRuns?` 추가 | ✓ |
| `RepeatedJudgeResult.judgeRuns` 누적 | ✓ |
| `hasMixedJudgeRuns()` (provider OR version 비교) | ✓ |
| `callJudgeRepeated`에서 mixed-model 우선 마킹 (variance unstable보다 우선) | ✓ — 정확한 우선순위 |
| 테스트 (mixed by version, mixed by provider, dry-run judgeRuns 기록) | ✓ |
| typecheck 13/13 cached, test eval 19/19 | ✓ |

설계 디테일에 추가 의견 없음. 라운드 1 §1.2 "judgeModelVersions: string[]" 1차 안 대신 `JudgeRun` 객체 배열로 간 게 더 깔끔하다 — provider/version을 한 객체에 묶음으로써 schema 검증과 누적이 일관.

## 2. 흡수 트리거 정리

m1-live 토픽이 라운드 1~5에 걸쳐 합의 8건 + 코드 1건 진행. 미해결 1건 남음.

### 2.1 합의된 항목 (흡수 후보)

라운드 2:
1. live 산출 단계화 (48 → 84 → 252 calls)
2. 1단계 4축 (`non-wireframe` / `first-viewport-richness` / `emotional-fit` / `editability`)
3. mixed-model 검출 — `judgeRuns` 배열 + provider/version 비교
4. repeat=2 정책 (reproducibility 미생성, judgeStatus만 갱신)
5. 사람 grading 후보 3 brief
6. 1단계 실행 주체: Claude 또는 사용자 (Codex 키 부재)

라운드 4 코드:
7. `JudgeRun` 객체 (provider+version 한 묶음)
8. mixed-model 마킹 우선순위 > variance unstable

### 2.2 미해결 1건 (외부 의존성)

**1단계 live 산출 실행** — Claude/Codex 양측 `ANTHROPIC_API_KEY` 부재. 의논으로 풀 수 없는 외부 의존성. 사용자 결정:
- 사용자 직접 실행
- Claude 또는 Codex 환경에 키 주입
- 다른 LLM provider 구현 (M1.3 또는 별도 토픽)

이 미해결은 합의의 *결과*로 등장한 것이라 안전장치 #2 (동일 미해결 2회 연속) 트리거 아님. 라운드 3 §2부터 라운드 5 §2.2까지 같은 미해결이 있지만 합의로 해결할 수 있는 종류가 아님.

## 3. 흡수 제안

### 3.1 메인 문서 흡수 대상

**DECISIONS.md D14**:
- `judgeRuns: Array<{ judgeModel, judgeModelVersion }>` 메타 추가 (mixed-model 검출 입력)
- `hasMixedJudgeRuns(judgeRuns)` 정책 — provider 또는 version 차이 시 mixed
- mixed-model 마킹 우선순위 > unstable

**PLAN.md §4 M1.2**:
- 단계화 (48 → 84 → 252) 명시
- 1단계 4축 + 사람 grading 3 brief 명시
- 외부 의존성: ANTHROPIC_API_KEY 사용자 보유

**부록 A**: m1-live 라운드 1~5 추가

### 3.2 흡수 후 새 토픽

흡수 [ABSORB] 커밋 후 다음 토픽:
- **m1-live-execution**: 1단계 live 실행 (사용자 키 주입 후 Claude/Codex 또는 사용자 직접). 토픽 라운드 1 = 실행 결과 보고.
- 또는 사용자가 흡수 OK 안 하고 m1-live 토픽 자체에서 라운드 6으로 진행 (단 안전장치 #1 자동 정지 트리거).

**Claude 1차 권장**: 흡수 → m1-live-execution 새 토픽. 깨끗한 사이클 유지.

## 4. 사용자 결정 요청

1. **흡수 OK 신호** — `COLLABORATION.md` §7에 따라 메인 문서 흡수는 사용자 OK 필수.
2. **1단계 실행 방안 결정** — 직접 실행 / 키 주입 / 보류 / 다른 provider 구현.

## 5. 안전장치 즉석 검사

- m1-live 라운드 카운트: 5 (`<6`, 1 라운드 여유). 라운드 6 도달 시 안전장치 #1 자동 정지.
- `[ABSORB]` `6d16c44` 이후 동일 파일 반복: max 1회 — 미달
- 동일 미해결 2회 연속: 외부 의존성(API 키 부재)은 의논으로 해소 불가 — 안전장치 #2 적용 외
- 코드 변경: 본 라운드는 docs only
- ff-only OK
