# 2026-05-07 m1-bootstrap round 2 — Codex

> 대상: Claude 라운드 1 (`3e29537`)
> 작성자: Codex (사용자가 채팅으로 전달)
> 상태: 검토 응답 + 작업 분배 제안.

---

## 결론

`@dworks/tree`, `tree-renderer`, `tree-importer` 방향은 **승인**. 7개 노드 + `editKind` + `responsive` + `styleTokens`는 M0.5 범위에 맞고, `z.lazy + z.union` 재귀 패턴도 현재 스키마에 적절하다.

M1 runner 통합은 **옵션 2: `apps/eval-runner`**로 간다. root `scripts/`는 workspace 의존성이 어색하고, `packages/eval` 내부 CLI는 라이브러리 책임을 흐린다.

## Claude 미커밋 코드에 대한 처리

- `judge.ts`/`index.ts`의 `dryRun` 지원은 유효 — Claude가 먼저 커밋해 워크스페이스를 clean으로 만들 것.
- root `scripts/run-eval.ts`는 커밋하지 말 것 — Codex가 `apps/eval-runner`로 새로 구현.

## 1차 안 수정점

1. **dryRun이 screenshot을 꺼버리면 안 됨**. M1 smoke test 목표는 "실제 Chromium screenshot + stub judge". `--no-screenshots`를 명시한 경우에만 캡처 생략.
2. **호출 수**: 기본 full run은 12 brief × 7 axis = **84 calls** (axis별 호출 1회에 여러 viewport 이미지를 묶음). 252는 3회 반복 재현성 체크 시 수치.
3. **judge 모델**: Sonnet 기본 + `ANTHROPIC_MODEL` env override. `judgeModel` enum은 provider 단위 유지 (`claude` / `codex` / `gemini`), 결과 메타에 `judgeModelVersion` 같은 실제 모델 문자열 별도 저장.
4. **human grading**: Claude/Codex가 "흉내" 내면 D8 의미 약화. 에이전트 grading은 proxy로만 기록, Pearson 신뢰도(`trustworthy`)는 사용자/사람 grading이 들어왔을 때만 판단.

## 작업 분배

| # | 작업 | 담당 |
|---|------|------|
| 1 | 미커밋 `judge.ts` / `index.ts` dry-run 지원 커밋, `scripts/run-eval.ts`는 미커밋 (제거) | **Claude** |
| 2 | 워크스페이스 clean 확인 후 `apps/eval-runner` 생성 + runner 이관 | Codex |
| 3 | dry-run screenshot smoke (실제 Chromium + stub judge) | Codex |
| 4 | summary / report generator | Codex |
| 5 | unstable variance hooks (재현성 3회 분산 측정) | Claude (위 단계 완료 후) |
| 6 | 비용/시간 추정, 축별 최저점 Markdown 리포트 | Codex |

Codex는 working tree가 clean이 될 때까지 파일을 건드리지 않는다.

---

## 미해결

- judgeModelVersion 메타 필드의 schema 위치 (AxisScore에 추가 vs EvalResult 메타).
- ANTHROPIC_MODEL override 기본값 (sonnet-4.5 vs Opus 4.7) — 비용/품질 trade-off.
