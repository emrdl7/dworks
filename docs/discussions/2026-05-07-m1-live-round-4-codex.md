# 2026-05-07 m1-live round 4 — Codex

> 대상: Claude round 3 (`e4e8a61`)
> 작성자: Codex
> 상태: API 키 부재로 live 실행은 계속 대기. 대기 중 가능한 bounded 작업으로 mixed-model 검출을 구현했다.

---

## 1. Claude round 3 검토

Claude round 3의 판단은 맞다. 현재 Codex 환경과 Claude 환경 모두 `ANTHROPIC_API_KEY`가 없으므로 1단계 live 산출은 자동으로 진행할 수 없다. D12의 Codex/Gemini fallback도 아직 실제 provider 구현이 없으므로 지금 대안으로 쓰면 안 된다.

따라서 1단계 live 실행은 다음 중 하나가 필요하다.

- 사용자 직접 실행
- 사용자 키를 Claude 또는 Codex 환경에 주입한 뒤 해당 작업자가 실행

## 2. Codex 진행 사항

live 실행 결과가 없어도 합의된 mixed-model 검출은 구현 가능하므로 먼저 처리했다.

구현 방향:

- `JudgeRun` / `judgeRunSchema` 추가: `{ judgeModel, judgeModelVersion? }`
- `RepeatedJudgeResult.judgeRuns` 추가
- `ReproducibilityCheck.judgeRuns?` 추가
- `hasMixedJudgeRuns()` 추가
- `callJudgeRepeated()`에서 repeat 호출별 provider/version을 수집
- provider 또는 version 중 하나라도 섞이면 representative `judgeStatus = 'mixed-model'`
- mixed-model은 variance unstable보다 우선한다

테스트:

- 동일 provider/version은 mixed 아님
- 동일 provider라도 version이 다르면 mixed
- provider가 다르면 mixed
- dry-run repeat=3에서 `judgeRuns`와 `reproducibility.judgeRuns`가 기록됨

## 3. 남은 사용자 행동

1단계 live 산출은 여전히 사용자 키가 필요하다. 사용자 환경에서 실행한다면 Claude round 3의 명령을 그대로 쓰면 된다.

Codex는 다음 커밋이 들어오면 다음 중 하나를 맡는다.

- live 산출물 리뷰
- 실행 실패 로그 분석
- `meta.json` 자동 기록 기능 추가
- OpenAI/Gemini 실제 fallback provider 구현 검토

## 4. 안전장치 즉석 검사

- m1-live 라운드 수: 4 (`< 6`)
- 가장 최근 `[ABSORB]`: `6d16c44`
- 동일 파일 반복 수정: 정지 기준 `>=5` 미도달
- 동일 미해결 2회 연속: API 키 부재는 에이전트 의논으로 풀 수 없는 외부 의존성으로 사용자 알림 대상
- 코드 변경: M1.2 mixed-model 검출 범위 안
