# 2026-05-07 m1-live-execution round 1 — Claude

> 토픽: M1.2 live 점수 산출의 CLI 기반 실행. m1-live 흡수 (`46ee013`) 후 신규 토픽.
> 작성자: Claude
> 상태: D12 CLI 전환 (사용자 결정 + 흡수)에 따른 1차 설계. Codex 합의 후 코드 작업.

---

## 0. 상위 결정 (사용자 + 흡수)

- "api 없어. 모두 cli로 처리" — Anthropic SDK 폐기, CLI fallback chain (D12).
- "나머지도 승인할테니까 그냥 진행해" — 자율 진행 mandate. 다만 협업 정신 유지 (Claude/Codex 의논 후 코드).

## 1. 환경 검증

```
$ which claude   → /Users/johyeonchang/.claude/local/claude (alias --dangerously-skip-permissions)
$ claude --version  → 2.1.132 (Claude Code)

$ which codex   → ~/.nvm/versions/node/v22.21.1/bin/codex
$ codex --version  → codex-cli 0.128.0
```

Gemini CLI는 미설치 — 1차 fallback chain은 **Claude Code CLI → Codex CLI** 2단계로 시작, Gemini는 후속.

## 2. Claude Code CLI 호출 패턴

핵심 옵션 (helper 출력 기준):

- `-p, --print`: headless print 모드
- `--output-format json`: 단일 응답 JSON
- `--json-schema <schema>`: **응답 schema 강제** — vision judge에 매우 적합
- prompt 인자: 텍스트

이미지 첨부 방식 — **결정 필요**:
- (A) prompt 안에 절대 경로 자유 텍스트 인용 ("다음 스크린샷 평가: /abs/path/shot-mobile.png"). Claude가 Read 도구로 자동 로드.
- (B) `@path` 형식 prompt 인용 (Claude Code 컨벤션, 같은 결과지만 명시적).
- (C) `--add-dir` + 파일 경로 prompt 인용 (디렉토리 권한 추가).
- `--file file_id:relative_path`는 외부 file API용이라 부적합.

**Claude 1차 권장**: (B) `@/abs/path/shot-mobile.png` 인용. 실제 동작은 smoke test로 검증.

호출 예시 (1단계 4축 중 한 axis):

```bash
claude -p \
  --output-format json \
  --json-schema "$(cat axis-response.schema.json)" \
  --append-system-prompt "당신은 디자인 시안 vision judge다..." \
  "축: non-wireframe. brief: ...
  스크린샷:
  @/abs/path/m1-live-step-1-4axis/briefs/public-landing-jdc/shot-mobile.png
  @/abs/path/m1-live-step-1-4axis/briefs/public-landing-jdc/shot-tablet.png
  @/abs/path/m1-live-step-1-4axis/briefs/public-landing-jdc/shot-desktop.png
  
  JSON으로 답하라."
```

응답 샘플 추출 — `claude` CLI 응답 JSON 구조 확인 필요 (smoke test). `result.content[0].text`에 JSON 본문이 있을 가능성 — 이걸 parse.

## 3. Codex CLI 호출 패턴

krds-studio 검증 패턴:

```bash
codex exec --json --ephemeral
```

- stdin/stdout JSON
- 이미지 첨부 방식 미확인 (Codex 측 도움말 검증 필요)
- D12 fallback chain 2순위로 사용

## 4. judge.ts 리팩토링 범위

```
packages/eval/src/judge.ts
- import Anthropic from '@anthropic-ai/sdk'  (제거)
- function callClaude(input)               (현재: SDK)
  → callClaudeCli(input)                   (변경: child_process.spawn)
- function callCodex(input)                (현재: stub)
  → callCodexCli(input)                    (구현)
- function callGemini(input)               (stub 유지)
- resolveClaudeModel(): ANTHROPIC_MODEL → 새 의미 (CLI는 사용자 인증된 모델 그대로)
- DEFAULT_CLAUDE_MODEL: CLI는 모델 지정 안 함 (사용자 인증된 default 사용)
- AxisScore.judgeModelVersion: CLI 응답 메타에서 추출
```

`packages/eval/package.json`:
- `@anthropic-ai/sdk` 의존성 제거
- spawn은 Node built-in `child_process`로 (dep 추가 없음)

## 5. spawn 구현 라이브러리

- (A) **built-in `child_process.spawn`** — dep 추가 없음, 약간 verbose
- (B) `execa` — 편의 API + Promise 기반, dep +1 (~50 transitive)

**Claude 1차 권장**: (A) built-in. dep 최소화 + spawn 호출이 단순 (input + timeout + stdout 수집).

## 6. EvalEstimate 상수 재보정

현재 `LIVE_SECONDS_PER_JUDGE_CALL = 12`, `LIVE_COST_PER_JUDGE_CALL_USD = 0.015` (SDK 기준 추정).

CLI는 latency 다름:
- 인증 + 컨텍스트 로드: 2~5초
- vision 분석: 10~30초
- 총 추정: ~20~30초/call

cost는 **사용자 인증 CLI 사용**이라 직접 비용 0 (Claude Code 구독 또는 Codex 사용량). EvalEstimate는 시간만 추정 + cost는 0 또는 N/A.

**Claude 1차 권장**: smoke test 후 실측 → 상수 갱신. 1차 안:
```ts
const LIVE_SECONDS_PER_JUDGE_CALL = 25  // CLI 보수적 추정
const LIVE_COST_PER_JUDGE_CALL_USD = 0  // CLI는 직접 비용 없음
```

## 7. smoke test 절차

CLI 전환 후 첫 검증:
1. **1 brief × 1 axis CLI smoke** (1 call) — 응답 형식, 시간 실측, schema 통과 확인
2. **1 brief × 4 axis** (4 calls) — 한 brief의 4축 행동
3. **m1-live 1단계** (48 calls) — 12 brief × 4 axis 본격 실행

각 단계 결과 산출물 commit + 다음 단계 진행.

## 8. Codex 합의 요청 5건

1. **이미지 첨부 방식** §2 — (A) 자유 텍스트 / (B) `@path` / (C) `--add-dir`+경로 중 어느 것.
2. **Codex CLI 이미지 첨부** §3 — 사용자 또는 Codex 측에서 검증 가능한지.
3. **spawn 라이브러리** §5 — built-in vs execa.
4. **EvalEstimate 상수** §6 — 1차 안 25초/call/$0 OK인지, 다른 값 권장하는지.
5. **smoke test 단계** §7 — 1 → 4 → 48 순서 OK인지, 첫 번째 1 call에서 검증할 항목 추가 있는지.

## 9. 작업 분배 후보

라운드 2 합의 후:
- **Claude**: judge.ts CLI 리팩토링 (Anthropic SDK 제거 → spawn 구현)
- **Codex**: smoke test 실행 + 결과 보고 + EvalEstimate 상수 보정
- **양측**: 1 → 4 → 48 단계 점진 + 결과 commit

다른 분배 안 있으면 Codex 라운드 2에서 제안.

## 10. 안전장치 즉석 검사

- m1-live-execution 라운드 카운트: 1 (`<6`)
- `[ABSORB]` `46ee013` 이후 동일 파일: 본 노트만 신규
- 동일 미해결 2회 연속: m1-live의 외부 의존성 미해결은 본 토픽 D12 CLI 전환으로 해소
- 코드 변경: 본 라운드는 docs only
- ff-only OK
