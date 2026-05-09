# Design Works (dworks) — 합의된 결정 사항

> **상태**: 1차 정리 (2026-05-07). krds-studio 라운드 1~4의 합의 결과를 dworks 컨텍스트로 흡수.
> **출처 의논**: `~/krds-studio/docs/10-FRAME-REVIEW-2026-05-07.md` §10–§13 (라운드 1~4).
> **본 문서의 위계**: dworks의 모든 결정은 본 문서에 박힌 합의 위에서만 이뤄진다. 본 문서를 거스르려면 새 라운드 의논이 필요하다.

---

## D1. 프로젝트 정체성

**Design Works는 디자인툴이지 HTML 생성기가 아니다.**

- 제품의 산출물은 캔버스 위의 디자인이고, HTML은 그 디자인을 렌더하고 익스포트하기 위한 매체다.
- 사용자는 디자이너이며 HTML 시맨틱·접근성 룰을 직접 마주하지 않는다.
- jabworks / infoUX / KRDS 같은 "기준"은 디자인 단계의 강제가 아니라 **익스포트 프로파일**이다.

근거: krds-studio 라운드 2 §2, 라운드 3 §10.

## D2. 모델 표현 — E (Hybrid)

**제품 방향 확정**: JSON 의도 트리가 source of truth, HTML은 LLM I/O + 캔버스 렌더 + 익스포트 매체.
**흡수 전략은 PoC**(M4)에서 검증한다 — M4 실패 시는 트리 채택을 폐기하지 않고 흡수 방식만 변경한다 (PLAN.md M4 실패 분기 참조).

```
LLM (Codex)
  ↓ HTML/Tailwind 출력 (LLM 강점 유지)
HTML→트리 흡수기
  ↓ 즉시 트리로 흡수
트리 모델 (source of truth)
  - 의미 역할 (hero/card/section/button/list/form)
  - 콘텐츠
  - 스타일 토큰 참조
  - 레이아웃 의도 + 반응형 의도
  - 편집 단위 메타
  ↓
캔버스 렌더: 트리→HTML→iframe
편집: 트리 속성 변경
LLM 재호출: 트리 일부 + 자연어 → 부분 HTML → 부분 트리 흡수
익스포트: 트리→{plain, jabworks, infoUX, KRDS, …}
```

**원칙 두 개**:
1. HTML은 LLM의 출력 언어이지 시스템의 내부 모델이 아니다.
2. 익스포트는 트리에서 분기되는 다중 변환기다.

근거: krds-studio 라운드 1 §4 옵션 비교, 라운드 1 §6 v4와의 관계 매핑.

## D3. 우선순위 — P0 → P0.5 → P1 → P2

| 단계 | 내용 | 비고 |
|------|------|------|
| **P0** | 디자인 품질 eval 1차 구현 | 7개 평가 축 |
| **P0.5** | 편집 기능 + 편집 품질 측정 | 6개 범위 + 5개 평가 축 |
| **P1** | 디자인 고도화 루프 | eval 결과를 사용자 리포트 아닌 고도화 입력으로 |
| **P2** | HTML→트리 흡수 PoC | R&D, M1 완료가 시작 트리거 |

근거: krds-studio 라운드 3 §12, 라운드 4 §13.1.

## D4. eval 입력의 본질

**디자인 품질 평가의 입력은 DOM 구조가 아니라 다음이다**:

- brief (사용자 의도)
- 캔버스 스크린샷
- 업로드 자산 / 브랜드 컨텍스트
- viewport별 렌더 결과 (모바일/태블릿/데스크톱)

코드를 읽어서 판단하는 게 아니라 사람이 보는 것을 보고 판단한다 = vision LLM judge 경로.

근거: krds-studio 라운드 3 §12.

## D5. P0 평가 축 7개

| 축 | 정의 | 점수 |
|----|------|------|
| `non-wireframe` | 박스/placeholder/균일 카드 반복에 머물지 않는가 | 0–5 |
| `first viewport richness` | 첫 화면에서 브랜드/핵심 메시지/CTA/시각 초점이 보이는가 | 0–5 |
| `emotional-fit` | 감성 프리셋이 색/타이포/이미지/카피/CTA에 반영됐는가 | 0–5 |
| `visual-variety` | 섹션 간 레이아웃/리듬/밀도 변화가 있는가 | 0–5 |
| `brand/reference fidelity` | 로고/레퍼런스/브랜드 자산의 오판/중복/색감 왜곡 여부 | 0–5 |
| `responsive design intent preservation` | 모바일/태블릿/데스크톱에서 정보 구조와 시각 의도 유지 | 0–5 |
| `editability` | 편집 가능한 디자인 단위가 적절히 잡히는가 (P0.5 detail로 확장) | 0–5 |

근거: krds-studio 라운드 3 §12.3, 라운드 4 §13.1.

## D6. P0.5 편집 평가 축 5개

| 축 | 정의 |
|----|------|
| `selection-accuracy` | 사용자가 의도한 디자인 단위가 정확히 선택되는가 |
| `edit-control-fit` | 선택 단위에 맞는 편집 컨트롤이 나오는가 |
| `layout-preservation-after-edit` | 편집 후 레이아웃과 반응형이 깨지지 않는가 |
| `user-intent-preservation` | 디자인 고도화가 사용자 수정을 덮어쓰지 않는가 |
| `output-tidiness` | 여러 번 편집 후에도 시각적 일관성·간격 리듬·위계가 보존되는가 (3회 편집 시퀀스 스크린샷 입력) |

근거: krds-studio 라운드 3 §12.6, 라운드 4 §13.2.2.

## D7. P0.5 편집 기능 6개 범위

1. **콘텐츠**: 텍스트/버튼 라벨/링크 라벨/alt/마이크로카피
2. **미디어**: 이미지 교체/crop/focal point/overlay, 로고 워드마크-심볼-콤비네이션 구분
3. **구조**: 섹션 순서, 카드/리스트 추가·삭제·복제, 폼 필드, 표 행/열
4. **스타일**: color preset, 배경 톤, 타이포 강도, 섹션 밀도, radius, shadow (raw class 입력보다 control 중심)
5. **반응형**: 모바일/태블릿/데스크톱에서 디자인 의도 유지 즉시 확인
6. **고도화 연결**: 선택 영역 polish, 전체 polish, 사용자 편집 lock/preserve

근거: krds-studio 라운드 3 §12.5.

## D8. 측정 도구 — vision LLM judge

- 0–5 루브릭 + 표준 brief fixture 12개
- 축별 평균 + **축별 최저점 brief 추적** (평균에 묻히지 않게)
- 2점 이하 자동 `design-polish-needed` 표시
- 반복 실패하는 축은 prompt/eval fixture로 승격
- **재현성 체크**: 같은 fixture 3회 실행 시 분산 ≤ 0.5. 분산 크면 `unstable` 표시 후 PoC 판단에서 제외.
- **사람 grading 보정**: 12개 중 3개는 사람 5점 척도, judge와의 Pearson 상관계수 ≥ 0.6. 미만이면 사람 grading 우선 fallback.

근거: krds-studio 라운드 3 §12.3, 라운드 4 §13.2.1.

## D9. 익스포트 = 트리에서 분기되는 다중 변환기

- 변환기 후보: `plain`, `jabworks`, `infoUX`, `KRDS`
- 각 변환기가 **자체 변환 + 자체 검증 + 자체 정렬**을 책임
- v4의 "Compliance Align" 단계는 익스포트 변환기로 흡수
- 사용자 화면에는 "어떤 형식으로 익스포트?" 옵션 한 줄로만 노출
- 사용자가 마주하는 검증은 사실상 "익스포트 가능 여부" 한 가지뿐

근거: krds-studio 라운드 1 §6, 라운드 2 §2.

## D10. P2 PoC 시작 트리거 + 통과 조건

**시작 트리거** (P0의 일부):
- P0 평가 축 7개 중 **최소 4개 이상**이 측정 가능한 상태
- 그 **구현 완료된 축 전체**에 대해 표준 brief 12개 결과 1차 점수 산출
- 점수 산출 결과에 축별 평균/최저점 brief/대표 실패 사유 기록
- 미구현 축은 `not-measured`로 명시 (PoC 판단 근거에서 제외)

**보고 양식 의무 항목**:
- P0.5 5개 축 점수
- P0 측정 완료된 축 점수

**통과 조건**:
- 의미 역할 추출률 ≥ 80%
- 트리→HTML 재렌더 후 `layout-preservation-after-edit`, `output-tidiness` 점수 평균 -0.5 이내

**실패 시 분기**:
- HTML→트리 흡수 어려움 → 옵션 C(JSON 트리 LLM 직접 출력) vs 옵션 A(현행 유지) 재검토
- 트리는 만들 수 있으나 익스포트 디자인 훼손 심함 → 다중 익스포트 자체 재검토, 단일 plain HTML로 축소 옵션

근거: krds-studio 라운드 3 §12.2, 라운드 4 §13.2.3.

## D11. PRD 한 줄 정의

> Dworks — 자연어와 레퍼런스로 웹 디자인 시안을 생성하고, 사용자가 캔버스에서 바로 편집·고도화해 납품 가능한 디자인 산출물로 정돈하는 디자인툴.

보조 문장:
> HTML은 캔버스 렌더링과 export를 위한 매체일 뿐, 제품의 중심 모델은 디자인 산출물과 편집 경험이다.

이름의 어원: 디자인 + jabworks = Dworks.

근거: krds-studio 라운드 3 §12.7 후보 + 사용자 2026-05-07 결정 (이름 정정).

## D12. LLM 호출 정책 — CLI 기반 fallback chain

**SDK/API 호출 폐기** — 사용자 2026-05-07 결정 ("api 없어. 모두 cli로 처리"). 모든 LLM 호출은 로컬에 인증된 LLM CLI를 spawn해서 처리한다.

1. **1순위: Claude Code CLI** — `claude -p ...` headless. 사용자 셸에 이미 인증된 CLI 사용.
2. **2순위: Codex CLI** — `codex exec --json --ephemeral`. krds-studio에서 검증된 패턴.
3. **3순위: Gemini CLI** — gemini 또는 동등 도구.

**구현 원칙**:
- 추상화 레이어는 단일 `callJudge(input)` 인터페이스를 유지하되, 내부 구현은 CLI spawn (`child_process.spawn` 또는 `execa`).
- 이미지 입력: 파일 경로 첨부 (각 CLI 지원 방식 차이 있음 — 첫 번째 어댑터로 검증).
- 응답: JSON 본문만 stdout으로 받고 zod schema 검증.
- "불능" 판정: CLI 종료 코드 ≠ 0, 30초 timeout, JSON 파싱 실패, schema 미통과.
- 모델 메타: `judgeModel` (provider enum: claude/codex/gemini) + `judgeModelVersion` (CLI 응답에서 추출한 모델 문자열). 자세한 구현은 D14.

**판단의 본질**:
- CLI 기반은 SDK보다 latency 큼 (대화 프로토콜 + 인증 부담). `EvalEstimate.LIVE_SECONDS_PER_JUDGE_CALL` 상수는 첫 실측 후 재보정.
- API key 환경 의존이 사라짐 — 사용자 셸에 인증된 CLI가 있으면 충분.
- M1 후반 또는 별도 결정에서 SDK 옵션 부활 가능 (`USE_SDK=true` env override 등). m1-live-execution 단계에서는 CLI 1차만.

**근거**: 사용자 2026-05-07 결정 (api 없음 → CLI). m1-live 라운드 1~5 합의 흡수.

## D13. 트리 스키마 라이브러리 — Zod

JSON 의도 트리 정의/검증/흡수기 안전망에 **Zod** (`zod` v3 또는 v4)를 채택.

**선택 근거**:
- TypeScript-first 생태계 1위. Hono, Drizzle, Next.js 등 dworks의 모든 핵심 의존성과 동일 패턴.
- **Discriminated union 지원**이 본 프로젝트에 결정적. 트리 노드 타입(section/hero/card/button/list/form/table/...)이 깊은 union이라 분기 추론이 강해야 한다.
- 타입 추론(`z.infer<typeof schema>`)이 강력해 트리 노드와 TypeScript 타입을 단일 정의로 유지 가능.
- LLM(Claude/Codex/Gemini 모두)이 Zod 스키마 생성에 가장 익숙. 시스템 프롬프트에서 트리 스키마 묘사 시 토큰 효율 우위.
- 광범위한 생태계: `drizzle-zod`, `hono/zod-validator`, `@anatine/zod-mock` 등 dworks가 쓸 도구가 즉시 호환.

**거부된 후보**:
- **ArkType**: 런타임 성능은 더 빠르지만 생태계 점유와 LLM 친화도가 떨어짐. 트리 검증 자체가 hot path가 아니라 ROI가 약함.
- **Yup**: TypeScript 추론이 약함. 추론 강도가 본 프로젝트의 핵심 요건.
- **자체 정의**: 안전망/생태계 도구 손실 비용이 큼.

**적용 범위**:
- `packages/tree`(가칭) — 트리 노드 스키마 정의
- `apps/api` 라우트 입출력 검증
- HTML→트리 흡수기의 출력 검증
- 익스포트 변환기 입력 검증

**근거**: 사용자가 "가장 강점 많은 걸로 알아서" 위임 → Claude 선택 2026-05-07.

## D14. 평가 결과 모델 — JudgeStatus / SuggestedAction 분리

평가 결과는 **점수 신뢰도**와 **제품 다음 행동**을 별도 enum으로 표현한다. 둘을 한 enum에 섞으면 후속 자동화의 분기 조건이 잘못 잡힌다.

```ts
type JudgeStatus =
  | 'ok'            // 정상 평가
  | 'unstable'      // 재현성 분산 > 0.5
  | 'mixed-model'   // 한 fixture 안에서 모델 fallback 발생
  | 'failed'        // 평가 자체 실패 (응답 없음, 파싱 실패 등)

type SuggestedAction =
  | 'acceptable'              // 점수 양호, 그대로 진행
  | 'design-polish-needed'    // 점수 2점 이하, 자동 고도화 입력
  | 'manual-review-needed'    // 신뢰도 의심, 사람 판단 필요
  | 'export-blocking'         // 익스포트 단계 hard fail
```

**해석 원칙**:
- `judgeStatus !== 'ok'`이면 `suggestedAction`은 기본 `manual-review-needed`로 강제.
- `acceptable` / `design-polish-needed` / `export-blocking`은 `judgeStatus === 'ok'`일 때만 선택.

**평가 결과 페이로드 구조**:

```json
{
  "axis": "first viewport richness",
  "score": 3,
  "reason": "핵심 CTA는 보이지만 브랜드 맥락과 이미지 초점이 약함",
  "evidence": ["hero copy generic", "primary CTA below fold on mobile"],
  "judgeStatus": "ok",
  "suggestedAction": "design-polish-needed",
  "judgeModel": "claude",
  "judgeModelVersion": "claude-sonnet-4-5-20250929"
}
```

`axis`는 D5/D6의 12개 축 id로 제한 (Zod enum). `evidence`는 다중 근거 배열.

**모델 메타 분리** (m1-bootstrap 라운드 4 §2.5):
- `judgeModel` (provider enum): `claude` / `codex` / `gemini` — D12 CLI fallback chain.
- `judgeModelVersion` (실제 응답 모델 문자열): CLI 응답에서 추출 (`claude-sonnet-4-5-20250929` 등). dry-run stub은 `'dry-run-stub'`.

**mixed-model 검출** (m1-live 라운드 4 §2):
- `JudgeRun = { judgeModel, judgeModelVersion? }`.
- `RepeatedJudgeResult.judgeRuns: JudgeRun[]` 누적 (각 호출별 provider/version).
- `ReproducibilityCheck.judgeRuns?: JudgeRun[]` 재현성 결과에 첨부.
- `hasMixedJudgeRuns(runs)`: provider 또는 version이 둘 이상이면 true.
- 마킹 우선순위: `mixed-model` > variance `unstable`. 즉 한 fixture 안에서 모델 섞이면 unstable 여부와 무관하게 `judgeStatus: 'mixed-model'`.

**재현성 누적** (m1-bootstrap 라운드 5 §1.2):
- `EvalResult.reproducibility?: ReproducibilityCheck[]` — root level optional.
- `callJudgeRepeated(input, repeat, options)` 호출 기준: `repeat<2` → representative만 / `repeat=2` → stable/unstable 판단만 / `repeat≥3` → ReproducibilityCheck 객체 누적.

**근거**: dworks 라운드 4 §2.4 (Codex 분리 제안), 라운드 5 §1.4 (Claude 수용), m1-bootstrap 라운드 4 §2.5 (모델 메타 분리), 라운드 5 §1 (구현 흡수), m1-live 라운드 4 (mixed-model 검출 구현), 라운드 5 (Claude 검토 OK).

## D15. 자율 협업 모드 — 카운터 없는 즉석 검사

Claude / Codex가 사용자 자리 비움에도 의논을 진행하는 모드. 자세한 컨벤션은 `docs/COLLABORATION.md` §11.

**핵심 원칙**:
- 활성/비활성 토글은 `docs/AUTONOMOUS.md` 신호 파일의 존재로만 결정.
- 작동 매개체는 `.git/hooks/post-commit` + `.git/feed.log` + `tail -F` + Monitor 도구.
- 자기 커밋 echo는 `[Claude]` / `[Codex]` 마커로 무시.
- 마커 없는 사용자 직접 커밋은 자율 모드에서 무시 (사용자 명시 지시 우선).

**안전장치는 카운터 없이 즉석 검사**:
- 라운드 6 도달 (`≥ 6`): `ls docs/discussions/<topic>-round-*-*.md | wc -l`
- 1시간 내 동일 파일 5회 이상 (단 가장 최근의 `[ABSORB]` marker 커밋 이후만 카운트, 자동 생성 파일 제외): 흡수 커밋이 reset 지점이라 의논 흐름의 자연스러운 누적이 false positive를 만들지 않는다. M1처럼 작은 package index와 신호 파일이 자연스럽게 반복 수정되는 구간이 있어 3~4회는 정지 조건이 아니라 검토 신호로만 본다. 의존성 추가/빌드마다 자동 갱신되는 lockfile(`pnpm-lock.yaml` 등)과 빌드 산출물(`.next/`, `.turbo/`, `dist/`, `build/`)은 카운트 제외 (자세한 내용은 COLLABORATION.md §11.6 #3).
- 동일 미해결 2회 연속: 라운드 시작 시 에이전트 문맥 판단
- `git pull --ff-only` 실패: 즉시 정지 + ALERT
- **코드 변경 정책 (II 확장, m2/m4-bootstrap 라운드 4 합의)**: 자율 모드는 docs-only를 기본값으로 한다. 단 사용자가 특정 milestone/topic을 명시적으로 사전 승인한 경우, 해당 mandate 범위 안의 코드 변경은 round 1~2 docs 합의 후 자율 진행할 수 있다. 범위를 벗어나는 코드 변경, 신규 결정이 필요한 코드 변경, 또는 합의 전 코드 변경은 즉시 정지 + ALERT 대상이다.

**메인 문서 흡수는 사용자 OK 신호 필수** (`COLLABORATION.md` §7). 자율 모드가 흡수까지 자동 진행하지 않는다.

**근거**: dworks 라운드 1 §11 (Claude 컨벤션 도입), 라운드 2 §2.5 (Codex 카운터 stale 지적), 라운드 3 §2.3 (Claude 카운터 제거 대안), 라운드 4 §2.1 (Codex 채택), 라운드 5 §1.1 (Claude 합의).

## D16. live judge baseline 해석 규약

placeholder tree (M2 이전 단계)에 대한 P0 vision judge 점수는 "Dworks 디자인 품질"의 절대 측정값이 아니라 **"placeholder renderer 한계의 계측값"** 이다. M2 LLM 생성 트리 / M4 PoC 이후 같은 4축 재측정 결과의 차이값(Δ)이 개선량의 정량 지표다.

**핵심 원칙**:
- 1차 baseline은 평균 점수 0~0.75 범위가 자연스럽다 — placeholder 텍스트 덤프에 대한 정상 신호.
- judge가 "placeholder 본문 — M2 이후 LLM 생성으로 교체." 문구를 evidence에 식별하면 baseline으로 인정.
- 사용자 노출 점수는 절대값이 아니라 **Δ(개선량)** 으로 표기 — 예: "M2 이후 non-wireframe 평균 0.00 → 2.5 (+2.5)"
- baseline 갱신 트리거: M2 LLM 생성 트리 도입 / M4 PoC 트리 흡수기 도입 / D5 7축 정의 변경.

**적용 범위**:
- `apps/eval-runner` summary.json / report.md의 평균 점수는 baseline 값으로 기록.
- 사용자 노출 보고서 (M3 고도화 결과 + M5 익스포트 검증)는 baseline 대비 Δ 형태로 표기.
- M1.2 baseline (2026-05-07 산출, m1-live-execution 1단계 + m1-live-7axis 2단계 통합):
  - **1단계**: 4 axis × 12 brief = 48 calls / judgeStatus ok 48/48 / non-wireframe 0.00 / first-viewport-richness 0.42 / emotional-fit 0.33 / editability 0.75 / suggestedAction 분포 export-blocking 37 + design-polish-needed 11
  - **2단계**: 7 axis × 12 brief = 84 calls / judgeStatus ok 84/84 / 추가 3축 평균: visual-variety 0.00 / brand-reference-fidelity 0.17 / responsive-design-intent-preservation 0.08
  - **3단계 재현성**: 12 brief × 7 axis × repeat=3 = 252 calls / judgeStatus ok 84/unstable 0/mixed-model 0/failed 0 / max variance 0.2222 (D8 threshold 0.5 이하) / `--fail-on-fallback` + `--judge-timeout-ms=60000` 조합으로 오염 0건. D8 stable 확정.
  - 통합 baseline은 M2/M4 이후 Δ 비교 기준값. 7축 모두 placeholder tree 한계의 계측값.

**근거**: m1-live-execution 라운드 4 §2~§3 (Codex 48 calls baseline 보고 + 점수 신호 해석), 라운드 5 §2.4 (Claude D16 신설 제안), 사용자 결정 (2026-05-07 "병행해" — 흡수 + 4 토픽 mandate). m1-live-reproducibility retry 3 result (`a4df2b6`, round 6 흡수 2026-05-08).

---

## 부록 A. 의논 라운드 추적

### krds-studio 라운드 (의논 발단)

| 라운드 | 작성자 | 출처 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Codex (krds-studio §10) | 의논 노트 | 디자인 결과물 vs HTML 검증 분리, P0/P1/P2 우선순위 |
| 2 | Claude (krds-studio §11) | 의논 노트 | P0/P0.5/P1/P2 합의, eval 입력 본질 합의 |
| 3 | Codex (krds-studio §12) | 의논 노트 | 편집 기능 P0.5 격상, PRD 한 줄 정의 후보 |
| 4 | Claude (krds-studio §13) | 의논 노트 | judge 신뢰성 보강, output-tidiness 정의, PoC 회귀 차단 |

### dworks 라운드 (PLAN 합의)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Claude | (별도 노트 없음, 1차 안 커밋 4건: `74be743`/`ddf1616`/`b449f3d`/`30d4697`) | PLAN.md/DECISIONS.md/COLLABORATION.md 1차 안 + 자율 모드 도입 |
| 2 | Codex | `docs/discussions/2026-05-07-plan-round-2-codex.md` | E Hybrid 명확화, M0.5 신설 제안, 라운드 번호 정정, 카운터 stale 지적 |
| 3 | Claude | `docs/discussions/2026-05-07-plan-round-3-claude.md` | 라운드 2 6건 합의, M0.5 범위 + 새 캔버스 + 카운터 제거 대안 |
| 4 | Codex | `docs/discussions/2026-05-07-plan-round-4-codex.md` | 라운드 3 4건 채택 + JudgeStatus/SuggestedAction 분리 제안 |
| 5 | Claude | `docs/discussions/2026-05-07-plan-round-5-claude.md` | 분리안 수용, 미해결 0건, 흡수 트리거 |

### dworks 라운드 (m1-bootstrap 토픽)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Claude | `docs/discussions/2026-05-07-m1-bootstrap-round-1-claude.md` | M0~M1-3 검토 요청 + 작업 분배 6건 제안 (단독 진행 정정) |
| 2 | Codex | `docs/discussions/2026-05-07-m1-bootstrap-round-2-codex.md` | apps/eval-runner 채택, dryRun/screenshot 분리, 84 calls 정정 |
| 3 | Claude | `docs/discussions/2026-05-07-m1-bootstrap-round-3-claude.md` | 분배 #5 unstable variance hooks 설계 + 합의 요청 5건 |
| 4 | Codex | `docs/discussions/2026-05-07-m1-bootstrap-round-4-codex.md` | 합의 5건 결정 + 안전장치 #3 `>=5` 완화 + judgeModelVersion 분리 |
| 5 | Claude | `docs/discussions/2026-05-07-m1-bootstrap-round-5-claude.md` | 분배 #5 구현 완료 (judgeModelVersion + reproducibility + repeat) |
| 코드 #6 | Codex (`cd2d3cd`) | (라운드 노트 없이 코드 작업으로 안전장치 #1 회피) | EvalEstimate + AxisLowestDetail + report 보강 |

### dworks 라운드 (m1-live 토픽)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Claude | `docs/discussions/2026-05-07-m1-live-round-1-claude.md` | 토픽 시작, live 산출 단계화 설계, 합의 요청 6건 |
| 2 | Codex | `docs/discussions/2026-05-07-m1-live-round-2-codex.md` | 합의 6건 결정 + 1단계 실행 지시 + Codex 키 부재 보고 |
| 3 | Claude | `docs/discussions/2026-05-07-m1-live-round-3-claude.md` | 합의 OK 표명 + Claude 환경 키 부재 보고 |
| 4 | Codex | `docs/discussions/2026-05-07-m1-live-round-4-codex.md` (`61adc26`) | mixed-model 검출 구현 (`JudgeRun`+`hasMixedJudgeRuns`+우선순위) |
| 5 | Claude | `docs/discussions/2026-05-07-m1-live-round-5-claude.md` | Codex 코드 검토 OK + 흡수 후보 정리. 외부 의존성(API key)만 미해결 |
| 사용자 결정 | (2026-05-07) | (커밋 메시지) | "api 없어. 모두 cli로 처리" → D12 CLI 전환 + 흡수 OK + 자율 진행 mandate |

### dworks 라운드 (m1-live-execution 토픽)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Claude | `docs/discussions/2026-05-07-m1-live-execution-round-1-claude.md` (`997cec0`) | CLI 전환 1차 설계 + 합의 요청 5건 |
| 2 | Codex | `docs/discussions/2026-05-07-m1-live-execution-round-2-codex.md` (`058a454`) | 합의 5건 답변 + judge.ts 보정 (`--add-dir`/`--` 구분자, process group 종료) + 1 call live smoke 통과 |
| 3 | Claude | `docs/discussions/2026-05-07-m1-live-execution-round-3-claude.md` (`48c8e76`) | 4 axis live smoke cross-validation 통과 + 48 calls 분배 제안 |
| 4 | Codex | `docs/discussions/2026-05-07-m1-live-execution-round-4-codex.md` (`2db3b15`) | 12 brief × 4 axis = 48 calls baseline 통과 + 흡수 후보 |
| 5 | Claude | `docs/discussions/2026-05-07-m1-live-execution-round-5-claude.md` (`f03df7c`) | 흡수 후보 정리 + D16 신설 제안 + 미해결 0건 |
| 사용자 결정 | (2026-05-07) | (커밋 메시지) | "병행해" → 4건 흡수 (PLAN/AUTONOMOUS/COLLABORATION/D16) + 4 토픽 mandate (a 7축 + b repeat=3 + c M2 + d M4) |

### dworks 라운드 (m1-live-7axis 토픽)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Claude | `docs/discussions/2026-05-07-m1-live-7axis-round-1-claude.md` (`0fab116`) | 84 calls 범위 + 4 합의 요청 |
| 2 | Codex | `docs/discussions/2026-05-07-m1-live-7axis-round-2-codex.md` (`7d42480`) | 합의 OK + responsive 점수 정정 + Claude 단독 실행 권장 |
| 3 | Claude | `docs/discussions/2026-05-07-m1-live-7axis-round-3-claude.md` (`860bcf4`) | 84 calls 실측 보고 (judgeStatus ok 84/84) + Codex 예측 cross-check + 흡수 후보 |
| 4 | Codex | `docs/discussions/2026-05-07-m1-live-7axis-round-4-codex.md` (`2c881d9`) | 검산 일치 + 흡수 동의 + summary.json statusCounts 후속 권장 |
| 5 | Claude | `docs/discussions/2026-05-07-m1-live-7axis-round-5-claude.md` (`a11e5d0`) | 흡수 후보 최종 + statusCounts 후속 토픽 분리 |
| 사용자 결정 | (2026-05-07) | (커밋 메시지) | "흡수 ok" → 본 흡수 commit |

### dworks 라운드 (m1-live-reproducibility 토픽)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| abort | Codex | `docs/discussions/2026-05-07-m1-live-reproducibility-run-abort-codex.md` | 252 calls abort (Claude quota + fallback 발생) → fail-on-fallback 후속 토픽 분리 |
| 1 | Claude | `docs/discussions/2026-05-07-m1-live-reproducibility-round-1-claude.md` | 토픽 시작, 252 calls repeat=3 설계, 합의 요청 4건 |
| 2 | Codex | `docs/discussions/2026-05-07-m1-live-reproducibility-round-2-codex.md` | 합의 4건 결정 |
| 3 | Claude | `docs/discussions/2026-05-07-m1-live-reproducibility-round-3-claude.md` | 사용자 quota reset 신호 + 재실행 분배/preflight 합의 |
| 4 | Codex | `docs/discussions/2026-05-07-m1-live-reproducibility-round-4-codex.md` | fail-on-fallback 코드 (`240733f`) + 합의 3건 결정 |
| 5 | Claude | `docs/discussions/2026-05-07-m1-live-reproducibility-round-5-claude.md` | 코드 검토 OK + 252 calls 재실행 OK 신호 + round 6 처리 안 |
| retry 1 abort | Codex | `docs/discussions/2026-05-07-m1-live-reproducibility-retry-1-abort-codex.md` | 30s timeout (form-business-permit) → timeout config 후속 토픽 분리 |
| retry 2 abort | Codex | `docs/discussions/2026-05-07-m1-live-reproducibility-retry-2-abort-codex.md` | 126 calls 후 Claude quota 재도달 (form-event-registration) |
| retry 3 result | Codex | `docs/discussions/2026-05-07-m1-live-reproducibility-retry-3-result-codex.md` (`a4df2b6`) | 252 calls 완주 / ok 84/unstable 0/mixed-model 0/failed 0 / D8 stable |
| 6 | Claude | `docs/discussions/2026-05-07-m1-live-reproducibility-round-6-claude.md` (`c5f25d7`) | retry 3 검토 OK + ALERT + 흡수 후보 정리 |
| 사용자 결정 | (2026-05-08) | (커밋 메시지) | "ㄱㄱ" → 본 흡수 commit (D16 3단계 baseline + 부록 A 추가) |

### dworks 라운드 (m1-runner-fail-on-fallback 토픽)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Claude | (m1-live-reproducibility round 4 §1.3에 통합) | 후속 토픽 분리 권장 |
| 코드 | Codex (`240733f`) | (라운드 노트 없음) | `--fail-on-fallback` 코드 + `args.test.ts` 보강 |

### dworks 라운드 (m1-runner-timeout-config 토픽)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Claude | `docs/discussions/2026-05-07-m1-runner-timeout-config-round-1-claude.md` | timeout 설정 가능화 설계 + 합의 요청 2건 |
| 2 | Codex | `docs/discussions/2026-05-07-m1-runner-timeout-config-round-2-codex.md` | 합의 OK + 코드 (`f443673`) — `resolveJudgeTimeoutMs` + `DWORKS_JUDGE_TIMEOUT_MS` |
| 3 | Claude | `docs/discussions/2026-05-07-m1-runner-timeout-config-round-3-claude.md` | 코드 검토 OK + 토픽 종료 |

### dworks 라운드 (M2 visible editor 트랙 — 2026-05-08)

사용자 mandate (2026-05-08): "디자이너가 만족할 수준 디자인툴" + "타이포 우선" + "TTF 직접 등록" + "나머지 순차". preset toggle은 데모 수준, 노드 단위 자유 편집 mandate.

| 토픽 | 라운드 / 코드 | 핵심 기여 |
|------|--------------|-----------|
| `m2-edit-runner` | r1 (Claude) → r2 (Codex) → 코드 (`8b0216a`) → r3 (Claude) | apps/edit-runner CLI MVP + 단계별 status 분류 |
| `m2-edit-eval` | r1 (Claude 사후) → r2 (Codex) | D6 5축 dry-run + EditEvalInput Zod schema + 컨벤션 위반 1차 |
| `m2-visible-editor` | r1 (Codex) → r2 (Claude) → 코드 (`d2c4a23`) → r3 (Claude) | apps/web 첫 화면 — Layers/Canvas/Inspector 3-column |
| `m2-fixture-loader` | r1 (Codex) → r2 (Claude) → 코드 (`355d906`) → r3 (Claude) | seeds/trees 3종 catalog + header switcher + safe re-select |
| `m2-edit-undo` | r1 (Codex) → r2 (Claude) → 코드 (`1e113fb`) → r3 (Claude) | snapshot stack 100-step + Undo/Redo + history 통합 |
| `m2-image-node` | r1 (Codex) → r2 (Claude) → 코드 (`68566cc`) → r3 (Claude) | image 1급 노드 + hero visual 트리화 + ImagePreview onError fallback |
| `m2-structure-ops` | r1 (Codex) → r2 (Claude) → 코드 (`20876d6`) → r3 (Claude) | move/duplicate/delete + id 충돌 방지 + Delete muted danger |
| `m2-i18n-korean` | r1 (Claude 사후) → r2 (Codex) | UI 한글화 + contract 영문 유지 + 컨벤션 위반 2차 |
| `m2-style-color` | r1 (Claude) → r2 (Codex) → 코드 (`9e27657`) → r3 (Claude) | colorPreset 5종 + 11키 토큰 + canvas CSS variable |
| `m2-style-typography` | r1 (Codex) → r2 (Claude) + amend → r3 (Codex) + amend → 코드 (`f5f6f2a`) → r4 (Claude) → r5 (Codex) → follow-up patch (`7523747`) → r6 (Claude) | typography 자유 6필드 + TTF schema string 확장 + ALERT round 6 |
| 사용자 결정 | (2026-05-08) | "ㄱㄱ" — m2-style-typography 종료 + 자율 모드 재개 + 다음 토픽 `m2-style-font-upload` 진입 OK |
| `m2-style-font-upload` | r1 (Codex) → r2 (Claude) → 코드 (`4ff28bb`) → r3 (Claude) | IndexedDB registry + FontFace API + TTF/OTF magic byte 검증 + 한글 UI |
| `m2-style-spacing` | r1 동시 충돌 (Codex+Claude) → r2 (Claude 통합) → r3 (Codex 수용) → r4 (Claude ack) → 코드 (`1dd22df`) → r5 (Claude) | 9 필드 padding/margin/gap + Figma 3 mode toggle (전체/X-Y/4면) |
| `m2-style-shape` | r1 (Codex) → r2 (Claude) → 코드 (`d87b156`) → r3 (Claude) | radius/borderWidth/borderColor/borderStyle/shadow + hex 검증 + color picker |
| `m2-style-color-free` | r1 (Codex) → r2 (Claude) → 코드 (`4f74d5a`) → r3 (Claude) | NodeColor (background/text) + textColor 상속 prop 전파 + preset override 보존 |
| `m2-style-layout` | r1 (Codex) → r2 (Claude) → 코드 (`57cb809`) → r3 (Claude) | flex direction/align/justify (5종 evenly 포함)/wrap + spacing.gap 단일 source |
| `m2-image-crop` | r1 (Codex) → r2 (Claude) → 코드 (`ee16d93`) + hex fix (`ec3d309`) → r3 (Claude) | 이미지 비율/맞춤/초점 드래그/오버레이 + 4 색상 컨트롤 hex 우선 |
| `m2-style-font-grouping` | Claude r1 사후 → Codex r2 (다중 업로드) → Claude r3 → 코드 (`e6563bb`) → r4 (Claude) → Codex r5 (9 weight 버그) → r6 ALERT (Claude) → 사용자 직접 지시 → 코드 (`b2dce7b`) → r7 (Claude) | 다중 업로드 + family/weight 자동 grouping + FontWeight 9단계 + collapsible 그룹 + 그룹 삭제 + 속성 패널 스크롤/접기 |
| `m2-font-upload-relocation` | Codex 5차 위반 (사용자 _협의 후 진행_ 무시) → 코드 (`8f12f8c`) → Claude r1 사후 → Codex r2 (사과+약속 강화 5/6/7) → Claude r3 종료 | 글꼴 업로드 진입점을 관리 섹션으로 이동 + 컨벤션 신뢰도 회복 |
| `m2-style-color-polish` | Claude r1 (사용자 _협의 후 진행_ 지시) → Codex r2 → Claude r3 → 코드 (`fea7e19`) → r4 (Claude) | color drag 600ms mergeKey history 압축 + 4 컨트롤 opacity (background/text/border/overlay) |
| `m2-responsive-preview` | r1 (Claude) → r2 (Codex) → r3 (Claude ack) → 코드 (`73f747e`) → r4 (Claude) | viewport switcher (모바일 375 / 태블릿 768 / 데스크톱 1200) + 캔버스 폭 chip |
| `m2-text-inline` | r1 (Claude) → r2 (Codex) → r3 (Claude ack) → 코드 (`9e6fc92`) → r4 (Claude) | markdown subset (bold/italic/link) + scheme allowlist (http/https/mailto/#) — **mandate 8영역 100% 충족** |
| 사용자 결정 | (2026-05-08) | "m2 디테일 추가" + 디자인 우선 (D1/D9 재인용) — m2 디테일 mandate 시작 |
| `m2-style-gradient` | r1~r3 → 코드 (`d494430`) → r4 (Claude) | 배경/오버레이 linear gradient 8 방향 + mode toggle |
| `m2-style-shadow-custom` | r1~r3 amend → 코드 (`a48debe`) → r4 (Claude) | 그림자 자유 6 값 (offsetX/Y/blur/spread/color/opacity) + 기본/커스텀 mode |
| `m2-style-text-shadow` | r1~r3 ack → 코드 (`0d91710`) → r4 (Claude) | 텍스트 그림자 자유 5 값 + 없음/커스텀 mode |
| `m2-icons-uplift` | r1~r3 ack → 코드 (`8242a85`) → r4 (Claude) | lucide-react + IconButton/IconToggleGroup + 6 영역 아이콘화 + 한글 툴팁 |
| `m2-brand-logo` | r1~r3 ack → 코드 (`57e1fb1`) → r4 (Claude) | header Dworks 로고 + App Router favicon |
| `m2-font-upload-relocation` | Codex 5차 위반 (사용자 _협의 후_ 지시 무시) → 코드 (`8f12f8c`) → Claude r1 사후 → Codex r2 사과+약속 5/6/7 → Claude r3 종료 | 글꼴 업로드 진입점 관리 섹션 이동 + 컨벤션 신뢰도 회복 |
| `m2-style-color-accent` | r1~r3 ack → 코드 (`d18e359`) → r4 (Claude) | NodeColor.accentColor + button primary/caption 노드별 강조 색상 override |
| `m2-style-shape-per-side` | r1~r3 ack → 코드 (`717af41`) → r4 (Claude) | 코너별 radius 4 키 (TL/TR/BR/BL) + 전체/분리 mode |
| `m2-style-gradient-radial` | r1~r3 ack → 코드 (`a12bb39`) → r4 (Claude) | radial circle gradient + 종류 선택 (선형/원형) |
| `m2-style-node-opacity` | r1~r3 ack → 코드 (`800e653`) → r4 (Claude) | BaseNodeMeta.opacity + updateNodeMeta operation |
| `m2-style-visibility` | r1 (Codex) → r2 (Claude) → 코드 (`70ee7a5`) → r3 (Claude) | hidden + pointerEvents + 레이어 chip |
| `m2-interaction-uplift` | r1 (Claude) → r2 (Codex) → r3 (Claude) | 인터랙션 분산 영역 합의 (context-menu / layer-drag / canvas-toolbar / smart-collapse) |
| `m2-context-menu` | r1 (Codex) → r2 (Claude) → 코드 (`3c4f720`) → r3 (Claude) | 캔버스/레이어 우클릭 메뉴 7 항목 + Shift+F10 + Escape (자체 구현) |
| `m2-layer-drag` | r1 (Codex) → r2 (Claude) → 코드 (`5337b33`) → r3 (사용자 버그) → fix (`8c09a99`) → r4 (Claude) | 레이어 드래그 정렬 + React 이벤트 풀링 fix |
| `m2-canvas-toolbar` | r1 (Claude) → r2 (Codex) → r3 ack (Claude) → 코드 (`ee311e9`) → r4 (Codex) | 선택 노드 우상단 인라인 toolbar 4 버튼 (위/아래/복제/삭제) + CanvasToolbarContext (12 CanvasNode 재귀 prop 회피) |
| `m2-inspector-smart-collapse` | r1 (Claude) → r2 (Codex) → r3 ack (Claude) → 코드 (`bb1ae8b`) → r4 (Codex) | InspectorDisclosure 선택 controlled mode + NodeInspector 노드 종류별 smart default (text→내용+타이포 / image→이미지 / button→내용 / 컨테이너→레이아웃) |
| `m2-style-typography-preset` | r1 (Claude) → r2 (Codex) → r3 ack (Claude) → 코드 (`7d415dc`) → r4 (Codex) | 텍스트 위계 5 preset (캡션/본문/소제목/제목/큰 제목) — fontSize/fontWeight/lineHeight/letterSpacing 4필드 일괄, fontFamily/textShadow/textAlign 보존 |
| `m2-style-font-stack` | r1 (Claude) → r2 (Codex) → r3 ack (Claude) → 코드 (`54fb9d6`) → r4 (Codex) | Pretendard Variable jsdelivr CDN 도입 + sans 한글 fallback chain (Pretendard → -apple-system → Apple SD Gothic Neo → Malgun Gothic → Noto Sans KR) — 의존성 0 |
| `m2-style-a11y` | r1 (Claude) → r2 (Codex) → r3 ack (Claude) → 코드 (`85beb54`) → r4 (Codex) | 텍스트 노드 WCAG 2.1 contrast readout (대비 본문 기준 + AA/AAA 통과/미달 배지), 배경 walk-up + opacity alpha 블렌딩, 그라디언트 안내 |
| `m2-style-gradient-conic` | r1 (Claude) → r2 (Codex) → r3 ack (Claude) → 코드 (`00ef3dd`) → r4 (Codex) | conic gradient 종류 추가 — schema enum 확장 + `conic-gradient(from 0deg at 50% 50%)` 기본값, 라벨 `원뿔형` |
| `m2-style-a11y-large-text` | r1 (Claude) → r2 (Codex) → 코드 (`7956d12`) → r4 (Codex) | 큰 텍스트 (fontSize>=24 OR fontSize>=19+weight>=700) AA 3.0/AAA 4.5 임계값, 본문 4.5/7.0 유지. 가속 §2: round 3 ack 흡수 첫 사례 |
| `m2-inspector-collapse-master` | r1 (Claude) → r2 (Codex) → 코드 (`6bdcc20`) → r4 (Codex) | NodeInspector header에 master toggle (모두 접기/펼치기), visibleControlledSectionTitles 노드 타입별 동적 |
| `m2-style-gradient-conic-controls` | r1 (Claude) → r2 (Codex) → 코드 (`53b7e36`) → fix (`5ffc434`) | conic 시작각/중심 X/Y schema 3 optional 필드 + 슬라이더+숫자 입력. Codex fix: range 슬라이더 보강 + schema 회귀 테스트 (가속 §5 첫 사례) |
| `m2-inspector-collapse-memory` | r1 (Claude) → r2 (Codex) → 코드 (`27fd8e1`) → r4 (Codex) | NodeInspector openSections를 Record<nodeId, ...>로 lift, 노드 복귀 시 토글 상태 복원 (세션 메모리, localStorage 미포함) |
| `m2-style-a11y-audit-panel` | r1 (Claude) → r2 (Codex) → 코드 (`9410711`) → r4 (Codex) | 캔버스 header에 "대비 AA {pass}/{total}" chip, computeContrastAuditSummary로 모든 text 노드 walk + computeTextContrast 재사용 |
| `m2-style-shadow-multi` | r1 (Claude) → Codex 직접 feat (`e33941b`) → r4 (Claude) | shape.customShadows?: CustomShadow[] (max 3), getShapeBoxShadow 우선순위 helper, list UI + 추가/삭제/↑↓. 가속 §5 확장 첫 사례 (Codex round 2/3 생략) |
| `m2-style-font-stack-self-host` | r1 (Claude) → Codex 직접 feat (`8895de8`) → r4 (Claude) | CDN 제거 + 공식 pretendard@1.3.9 npm 패키지 self-host (제 제안 @fontsource는 registry 404). page.tsx 미터치 |
| `m2-style-color-state` | r1 (Claude) → Codex 직접 feat (`5bc7a61`) → r4 (Claude) | NodeColor.hoverBackgroundColor + button-only UI, --dw-hover-bg CSS 변수 + hover important class (inline 배경/그라디언트 위에서도 작동) |
| `m2-style-color-state-text` | r1 (Claude) → r2 (Codex) → 코드 (`e28914c`) → test 보강 (`96d26f4`) | NodeColor.hoverTextColor + button-only UI, --dw-hover-text 변수 + hover:!text-... important class |
| `m2-style-color-state-active` | r1 (Claude) → r2 (Codex) → 코드 (`ed92b0c`) → test 보강 (`dca5cc5`) | NodeColor.activeBackgroundColor + activeTextColor 2 필드, button-only, [&:active]:!... 패턴 |
| `m2-style-color-state-focus` | r1 (Claude) → r2 (Codex) → 코드 (`1ff7047`) → test 보강 (`2bbb319`) | NodeColor.focusBackgroundColor + focusTextColor, SelectableNode 래퍼 group/dwnode + group-focus-visible/dwnode:!... (Codex 보정 — Tab focus는 wrapper에 가므로) |
| `m2-style-color-state-disabled` | r1 (Claude) → r2 (Codex) → 코드 (`4e268a8`) → test 보강 (`dc78dca`) | NodeColor.disabledBackgroundColor + disabledTextColor + BaseNodeMeta.disabled?: boolean, button data-disabled attribute + data-[disabled=true]:!... 패턴. disabled 토글 UI는 후속 |
| `m2-style-shadow-multi-inset` | r1 (Claude) → r2 (Codex) → 코드 (`2d9d624`) → fix (`ff4427e` Codex — getCustomShadowWithPatch가 inset 미보존 버그) | customShadow.inset?: boolean, 'inset ' prefix CSS 분기, 각 shadow item에 "안쪽 그림자" checkbox |
| `m2-color-state-disabled-toggle` | r1 (Claude) → r2 (Codex) → 코드 (`a6483a6`) → test 보강 (`0243442`) | "비활성 상태" 체크박스 + tree-editor NodeMetaPatch/schema에 disabled 추가 (Codex 보정) |
| `m2-style-transition` | r1 (Claude) → r2 (Codex) → 코드 (`87ac637`) → test 보강 (`1949bbc`) | BaseNodeMeta.transition?: { duration: 0~2000ms } + nodeTransitionSchema, button "전환 시간 (ms)" 입력, style transitionDuration 머지 (timing 'ease' 고정 후속) |
| `m2-style-cursor` | r1 (Claude) → r2 (Codex) → 코드 (`ece55cd`) → test 보강 (`f1d6c96`) | BaseNodeMeta.cursor?: NodeCursor enum 7종 (default/pointer/text/help/not-allowed/grab/crosshair), 모든 노드 적용, "표시" disclosure에 select |
| `m2-color-state-disabled-pointerevents` | r1 (Claude) → r2 (Codex) → 코드 (`a6a7e1b`) — 1줄 변경 | data-[disabled=true]:pointer-events-none — disabled button 캔버스 hover/click 차단, SelectableNode wrapper 영향 0 |
| `m2-style-image-filter` | r1 (Claude) → r2 (Codex) → 코드 (`f2458b1`) → test 보강 (`45aac2d`) | ImagePresentation.filter: { blur 0~20, grayscale/sepia 0~100, brightness/contrast 50~150 }, getImageFilterCss helper, ImageCompositionControls "필터" 5 input |
| `m2-style-transition-timing` | r1 (Claude) → r2 (Codex) → 코드 (`7458c6e`) → test 보강 (`8a4eab6`) | nodeTransitionSchema.timing enum 5종 (linear/ease/ease-in/ease-out/ease-in-out), getTransitionStyle 확장, "전환 곡선" select. duration/timing 독립 토글 |
| `m2-style-transform` | r1 (Claude) → r2 (Codex) → 코드 (`eb22afd`) → fix (`fc0cfda` Codex — wrapper transition 결합 + schema/operations test 3종) | BaseNodeMeta.transform?: { translateX/Y ±200, rotate ±360, scale 0.5~2 } + nodeTransformSchema, getTransformStyle helper (필드만 join), 모든 노드 적용, NodeInspector "변환" disclosure 4 input + 초기화. Codex fix: SelectableNode wrapper에 transitionDuration/timing 머지 (transform이 wrapper에 있어 transition과 결합), tree/tree-editor schema + operations test 보강 |
| `m2-style-transform-origin` | r1 (Claude) → r2 (Codex) → 코드 (`52ed785`) → test 보강 (`14e9b68`) | nodeTransformSchema에 originX/originY (0~100 %) 2 필드 + getTransformStyle에 transformOrigin 분리 반환 (한 축 시 50% 보정, 미설정 시 미emit). TRANSFORM_ORIGIN_PRESETS 9개 좌표 + setNodeTransformOrigin 헬퍼 (두 축 atomic) + "변환" disclosure 끝 3×3 chip group, 같은 셀 재클릭 시 reset |
| `m2-style-color-state-aria` | r1 (Claude) → r2 (Codex) → 코드 (`2244398`) — 1줄 변경 | button render JSX에 aria-disabled={node.disabled === true ? true : undefined} 1줄 — 기존 data-disabled 보존, SR 비활성 안내, button-only |
| `m2-style-skew` | r1 (Claude) → r2 (Codex) → 코드 (`c593666`) → test 보강 (`6dd5af3`) | nodeTransformSchema에 skewX/skewY (±45°) 2 필드 + getTransformStyle CSS join (translate→rotate→scale→skewX→skewY). "변환" disclosure 4 input → 6 input 확장, 9-point picker 위치 유지, transform-origin emit 로직 미변경 |
| `m2-style-transition-cubic-bezier` | r1 (Claude) → r2 (Codex) → 코드 (`bf39b08`) → test 보강 (`bf9c5d1`) | NODE_TRANSITION_TIMING_IDS에 'custom' + transitionCubicBezierSchema (x1/x2 0~1, y1/y2 ±2) + nodeTransitionSchema.cubicBezier?. getTransitionStyle: custom + cubicBezier emit, 미정의 시 ease fallback. duration/timing onChange 모두 cubicBezier 보존, "사용자 지정" 선택 시만 4 input 노출 |
| `m2-style-image-filter-extra` | r1 (Claude) → r2 (Codex) → 코드 (`e5f5d33`) → test 보강 (`ccb41d8`) | imageFilterSchema에 hueRotate (0~360°), saturate (0~200%), invert (0~100%) + dropShadow?: { offsetX/Y ±50, blur 0~50, color hex } 4 필드. imageDropShadowSchema 분리 export. getImageFilterCss append 순서 hue-rotate→saturate→invert→drop-shadow. ImageCompositionControls 3 input + 그림자 활성 체크박스 + 4 input sub-group (X/Y/흐림/색상), IMAGE_DROP_SHADOW_DEFAULT toggle |
| `m2-style-transition-step` | r1 (Claude) → r2 (Codex) → 코드 (`1965453`) → test 보강 (`3d7c78c`) | NODE_TRANSITION_TIMING_IDS에 'step-start' / 'step-end' 2 CSS keyword (총 8). 한글 라벨 즉시 / 도약. select 자동 노출, getTransitionStyle 별도 분기 없이 emit, custom/cubicBezier 보존 로직 영향 0 |
| `m2-style-transform-3d` | r1 (Claude) → r2 (Codex) → 코드 (`476ad75`) → test 보강 (`e722688`) | nodeTransformSchema에 rotateX/rotateY (±360°) + perspective (200~2000 px) 3 필드. getTransformStyle CSS chain 앞에 perspective unshift, 끝에 rotateX/rotateY append. NodeInspector "변환" disclosure 안 별도 3D sub-section (점선 박스 X 회전/Y 회전/원근). rotateZ는 기존 rotate 유지, rotate3d/matrix3d/preserve-3d/backface-visibility는 후속 |
| `m2-style-image-filter-drop-shadow-multi` | r1 (Claude) → r2 (Codex 조건부 동의 max 2 권장) → 코드 (`12f41f8`) → test 보강 (`9801e67`) | imageFilterSchema에 dropShadows?: ImageDropShadow[] (max 2) — 기존 dropShadow primary 보존 + extras stack (총 1+2=3). getImageFilterCss CSS chain dropShadow → dropShadows[] append. 활성 체크박스 off 시 primary + extras 함께 제거, "+ 그림자 추가" 버튼 + 카드별 ↑↓/삭제 + 4-input. add/remove/move/updateExtraField 헬퍼 4종 |
