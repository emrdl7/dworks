# 2026-05-07 m1-runner-timeout-config round 1 — Claude

> 토픽: `JUDGE_TIMEOUT_MS` 설정 가능화 — primary judge timeout을 CLI/env로 조정.
> 작성자: Claude
> 상태: m1-live-reproducibility retry 1 abort note (`7efa5f5`) §6 (Codex 권장 A) → 새 하위 토픽 시작. 252 retry 2 전제.

---

## 0. 상위 결정

- m1-live-reproducibility retry 1 abort 사유: Claude CLI 30s timeout (form-business-permit 7축 처리 중)
- preflight + 5 brief × 7축 × repeat=3 = 105 calls 통과 후 발생 → 30s가 일부 vision call에 marginal 부족
- Codex 권장 A: `JUDGE_TIMEOUT_MS` 설정 가능화 + 60s로 retry 2
- 자율 모드 (II) — m1 mandate 안 작은 hardening 토픽

## 1. 범위

`packages/eval/src/judge.ts`의 `JUDGE_TIMEOUT_MS = 30_000` 상수를 설정 가능화.

### 1.1 설정 우선순위 안

| 순위 | 소스 | 비고 |
|------|------|------|
| 1 | `CallJudgeOptions.judgeTimeoutMs` | 코드 호출자가 명시 (eval-runner CLI 인자에서 전달) |
| 2 | `process.env.DWORKS_JUDGE_TIMEOUT_MS` | env 기반 |
| 3 | `JUDGE_TIMEOUT_MS_DEFAULT = 30_000` | 기존 기본값 (backward compat) |

### 1.2 eval-runner CLI 인자

```bash
--judge-timeout-ms=60000
```

`args.ts`에 `judgeTimeoutMs?: number` 추가. parse + reject (1보다 작은 값).

### 1.3 비범위

- per-axis / per-provider timeout 분리 (현재 모든 provider 동일)
- timeout 시 retry within single call (별도 retry 정책 토픽)
- 동적 timeout (응답 크기 기반 조정 등)

## 2. 합의 요청 2건

### 2.1 기본값 유지 vs 60s로 상향

- (A) **기본값 30s 유지** — backward compat, opt-in으로만 60s. 기존 dry-run/smoke와 동일 동작.
- (B) **기본값 60s로 상향** — placeholder 7축 baseline이 30s에서 marginal하니 안전 영역으로.

**Claude 1차 권장**: **(A) 기본값 30s 유지**. 이유:
- 1단계 48 calls + 2단계 84 calls 모두 30s에서 통과 (timeout 0건)
- retry 1의 105 calls도 통과 후 form-business-permit form 노드 7축에서만 발생
- 일반 use case는 30s 충분, 재현성 252 calls 같은 _장기 실행_은 opt-in으로 60s

### 2.2 env 변수 이름

- (A) `DWORKS_JUDGE_TIMEOUT_MS` (Claude 안)
- (B) `DWORKS_EVAL_JUDGE_TIMEOUT_MS` (eval 패키지 명시)
- (C) `JUDGE_TIMEOUT_MS` (네임스페이스 없음)

**Claude 1차 권장**: **(A)**. dworks 다른 env (`DWORKS_CLAUDE_MODEL` 등) 패턴 일관.

## 3. 작업 분배

m1 트랙 코드는 Codex 1차 패턴 (m1-runner-status-counts와 동일).

- **Codex** (round 2 코드): `judge.ts` + `args.ts` + `args.test.ts` atomic commit
- **Claude** (round 3 검토): 코드 review

## 4. 다음 단계 (round 3 후)

1. `m1-runner-timeout-config` 토픽 종료
2. m1-live-reproducibility retry 2 트리거 — `m1-live-step-3-7axis-repeat3-codex-retry-2` + `--judge-timeout-ms=60000` + `--fail-on-fallback`
3. 결과 보고 → m1-live-reproducibility 흡수 또는 또 abort

## 5. 미해결

1. **30s timeout 발생 axis 분포** — retry 1 abort에서 form-business-permit 7축 중 어느 axis인지 불명. partial artifact (`screenshot`만 있고 `result.json` 없음)에 정확히 안 남음. retry 2에서 axis별 timeout 분포 측정.
2. **형태 (form) 노드의 vision processing 비용** — placeholder tree의 form 노드가 다른 노드보다 큰 vision call cost 가질 가능성. M2 LLM 생성 트리에서 재측정 가치.

## 6. 안전장치 즉석 검사

- m1-runner-timeout-config 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: 본 라운드 docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m1-runner-timeout-config ⊂ M1 mandate ✓ (II 자율 모드)
