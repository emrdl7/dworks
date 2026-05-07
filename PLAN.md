# Dworks — 진행 플랜

> **상태**: 결정 (2026-05-07, dworks 라운드 1~5 합의 흡수). 변경은 새 라운드 의논을 거친다.
> **출발점**: `~/krds-studio` v3→v4 의논 결과를 처음부터 반영하는 새 시작.
> **의논 history**: `~/krds-studio/docs/10-FRAME-REVIEW-2026-05-07.md` + 본 저장소 `docs/discussions/2026-05-07-plan-round-{1..5}-{author}.md`.

---

## 0. 본 프로젝트 정체성

- **이름**: **Dworks** (저장소: `dworks`)
- **어원**: 디자인 + jabworks = Dworks
- **한 줄 정의** (krds-studio 라운드 3 §12.7 합의 후보 + 이름 정정):
  > Dworks — 자연어와 레퍼런스로 웹 디자인 시안을 생성하고, 사용자가 캔버스에서 바로 편집·고도화해 납품 가능한 디자인 산출물로 정돈하는 디자인툴.
- **보조 문장**: HTML은 캔버스 렌더링과 export를 위한 매체일 뿐, 제품의 중심 모델은 디자인 산출물과 편집 경험이다.
- **krds-studio와의 관계**: krds-studio는 v4 의논 비용을 치른 학습 자산. **참조 용도로만 활용하고 적절한 시점에 삭제한다**. 삭제 전에 필요한 자산(seeds, references 등)은 dworks로 이전.
- **원격 저장소**: `https://github.com/emrdl7/dworks` (퍼블릭).

---

## 1. 의논 합의 결과 요약 (krds-studio 라운드 1~4 + dworks 라운드 1~5)

자세한 내용은 [`docs/DECISIONS.md`](./docs/DECISIONS.md). 핵심만 추리면:

1. **프레임**: 디자인툴이지 HTML 생성기가 아니다.
2. **모델 표현**: E (Hybrid) — **제품 방향 확정**: JSON 의도 트리가 source of truth, HTML은 LLM I/O + 캔버스 렌더 + 익스포트 매체. **흡수 전략은 PoC**(M4)에서 검증.
3. **우선순위**: P0 디자인 품질 eval → P0.5 편집 기능 + 측정 → P1 디자인 고도화 루프 → P2 HTML→트리 흡수 전략 PoC.
4. **eval 입력 본질**: brief + 캔버스 스크린샷 + 자산 + viewport별 렌더 (DOM 구조 아님).
5. **익스포트 = 트리에서 분기되는 다중 변환기** (plain / jabworks / infoUX / KRDS). v4의 "Compliance Align" 단계는 익스포트 변환기로 흡수.
6. **검증의 위계**: 사용자에게 노출되는 검증은 사실상 "익스포트 가능 여부" 한 가지. 디자인 단계엔 도구 내부 안전성(렌더/보안/편집 노드 손실)만.
7. **평가 결과 모델**: `JudgeStatus`(점수 신뢰도)와 `SuggestedAction`(제품 다음 행동)을 분리한다 (D14).
8. **자율 협업 모드**: 카운터 없는 즉석 git 검사 기반 안전장치 (D15).
9. **live judge baseline 해석**: placeholder tree에 대한 점수는 "Dworks 디자인 품질"이 아닌 "placeholder renderer 한계의 계측값"이며, 사용자 노출은 baseline 대비 Δ(개선량)로 표기한다 (D16).

---

## 2. krds-studio 자산 인벤토리

### 2.1 가져올 것 (보존하되 dworks 컨텍스트로 재포지셔닝)

| 자산 | krds-studio 위치 | dworks에서의 역할 |
|------|------------------|-------------------|
| monorepo 골격 (pnpm workspace + turbo) | `package.json`, `pnpm-workspace.yaml` | 그대로 채택 |
| Next.js 15 + React 19 + Tailwind v4 | `apps/web` | 캔버스 렌더 매체 (트리→HTML 출력처) |
| Hono + Drizzle + PG | `apps/api` | API + 트리 저장소 |
| Codex CLI 기반 LLM 런타임 | `apps/api/src/llm-generator.ts` 등 | LLM의 출력 언어는 여전히 HTML, 단 즉시 트리로 흡수 |
| 토큰 시스템 | `packages/tokens` | 트리 노드의 1급 시민으로 재배치 |
| 시스템 프롬프트 베이스 | `packages/llm-prompts/system.md` | "디자인 산출물" 중심으로 재작성 |
| references 자산 | `references/claude-design-system-prompt`, `references/emotional-design-norman` | 그대로 가져옴 |
| seeds (briefs, components, examples, tokens) | `seeds/` | 그대로 가져옴 — eval 표준 fixture가 P0의 입력 |
| 캔버스 편집 코드 | `apps/web/src/app/CanvasPanel.tsx`, `html-editor.ts` | P0.5 편집 기능 골격으로 재작성 시 참조 |

### 2.2 새로 짤 것 (E Hybrid 골격의 핵심)

- **JSON 의도 트리 스키마** — 노드 타입(section/hero/card/button/list/form 등), 콘텐츠, 토큰 참조, 레이아웃 의도, 반응형 의도, 편집 단위 메타.
- **HTML→트리 흡수기** — Codex CLI 출력 HTML을 즉시 트리로 흡수. krds-studio P2(M4)의 PoC 대상.
- **트리→HTML 렌더러** — 캔버스 표시용. iframe + Tailwind v4 활용.
- **트리 기반 편집 모델** — `data-dw-node` DOM 조작에서 트리 속성 변경으로 전환.
- **익스포트 변환기 골격** — plain HTML 변환기부터. jabworks/infoUX/KRDS는 후속.
- **vision LLM judge + 0–5 루브릭** — P0/P0.5 측정 도구.
- **viewport별 스크린샷 도구** — Playwright/Puppeteer로 모바일/태블릿/데스크톱 캡처. P0의 `responsive design intent preservation` 입력.

### 2.3 버릴 것 / 재해석할 것

- **HTML이 source of truth** — 단일 표현 구조 폐기.
- **v4 5단계 파이프라인 사용자 노출** — 사용자에겐 "그린다 / 익스포트한다" 둘. 단계는 시스템 내부.
- **`Generation.complianceTarget` / `stage` 필드** — 익스포트 호출 인자로 흡수.
- **catalog-only 강제** — 이미 v3에서 폐기됨, 그대로 유지.
- **검증을 사용자 리포트로 노출** — "디자인 품질 review"는 어시스트 기능이지 검증 패널이 아니다.

---

## 3. 기술 스택

### 현행 그대로 채택

- pnpm 9 + turbo 2 + Node 20+
- TypeScript 5.6, ESLint 9
- apps/web: Next.js 15 + React 19 + Tailwind v4
- apps/api: Hono 4 + Drizzle 0.36 + PostgreSQL
- LLM: CLI fallback chain (`claude -p` → `codex exec --json --ephemeral` → `gemini -p`)
- 테스트: tsx 기반 단위 테스트 (krds-studio 패턴)

### 신규 도입 (확정)

- **vision LLM judge** — 1순위 Claude Code CLI → 2순위 Codex CLI → 3순위 Gemini CLI fallback (D12). 한 fixture 안에서 모델 섞이면 `judgeStatus: 'mixed-model'` 표기 (D14).
- **Playwright** — viewport별 스크린샷. M0 부트스트랩에 패키지 설치, M0.5에서 첫 사용, M1부터 본격 활용. 정규 viewport: **440 / 768 / 1440**. 1280은 디버그/QA 보조 폭으로만 허용.
- **Zod** — 트리 스키마 검증 + 흡수기 안전망 (D13). TypeScript-first 생태계와 LLM 친화도 우위로 결정.
- **이미지 diff 도구** — pixelmatch 또는 odiff. M4 PoC의 디자인 보존 측정에 도입.

### artifacts 경로

- 평가 산출물: `artifacts/evals/<brief-id>/<run-id>/`
- 편집 fixture: `seeds/evals/edit-sequences/`

### 변경 없음

핵심 골격은 그대로. dworks의 차별점은 **프레임(디자인툴)과 모델(JSON 트리)** 이지 기술 스택 교체가 아니다.

---

## 4. 마일스톤

### M0. 프로젝트 부트스트랩 (1주 추정)

- monorepo 골격 복제 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`)
- `apps/web`, `apps/api`, `packages/{tokens, llm-prompts, components, validators, exporters}` 빈 골격
- `references/`, `seeds/` 가져옴
- Playwright 패키지 설치 (실 사용은 M0.5 이후)
- 첫 협업 라운드 합의 흡수는 본 라운드(라운드 1~5) 시점에 완료

**완료 기준**: `pnpm install && pnpm typecheck` 통과, 빈 Next.js 앱과 빈 Hono API 가동.

### M0.5. Tree Foundation (1주 추정 — 범위 동결)

E Hybrid 제품 방향이 확정됐으므로 M2 편집 기능이 시작되기 전에 트리 모델의 최소 골격이 있어야 한다. **범위 초과 = M4 PoC로 변질**이므로 다음 표를 엄수.

**범위 (포함)**

- `packages/tree`: Zod 기반 최소 트리 스키마 (5~7개 노드 타입: section / hero / card / button / list / form / text)
- `packages/tree-renderer`: tree → HTML 최소 렌더러
- `packages/tree-importer`: fixture 3~5개 대상 최소 HTML → tree 흡수기 또는 수동 tree fixture
- 노드 메타: `id`, `editKind` enum (text/media/structure/style), 반응형 의도 최소 필드
- 단위 테스트

**비범위 (제외 — 넘기면 M0.5가 깨진다)**

- 실제 LLM 생성 연동
- 완성형 캔버스 UI
- 전체 krds-studio HTML 호환
- 모든 Tailwind class 역추론
- jabworks / infoUX / KRDS export 변환기

**완료 기준**: 트리 fixture 3~5개로 tree → HTML 렌더 정상 + 단위 테스트 통과.

### M1 (P0). 디자인 품질 eval 1차 구현 (2~3주 추정)

#### M1.1 부트스트랩 — **완료** (m1-bootstrap 토픽 라운드 1~5)

- `packages/eval` (D5 7축 루브릭 + D14 JudgeStatus/SuggestedAction + judge fallback chain `Claude→Codex→Gemini`)
- `packages/screenshot` (Playwright viewport 440/768/1440)
- `apps/eval-runner` (CLI + `summarizeResults` + `renderMarkdownReport` + `EvalEstimate`)
- `callJudgeRepeated(input, repeat, options)` + `reproducibility[]` 누적 (D8)
- `judgeModelVersion` 메타 + CLI provider/version 기록
- 안전장치 #3 `>=5`로 완화 (lockfile/빌드 산출물 제외)

부트스트랩 검증: typecheck 13/13, test 6 패키지, smoke `--repeat=3` 통과.

#### M1.2 live 점수 산출 — 1단계 완료 (m1-live-execution 토픽 라운드 1~5, `997cec0`~`f03df7c`)

vision judge는 **CLI fallback chain** (Claude Code CLI → Codex CLI → Gemini CLI). API key 의존 없음 (D12 갱신, 사용자 2026-05-07 결정).

**단계화** (m1-live 라운드 2 §1.1 합의):
- **1단계** ✓ — 4축 × 12 brief × repeat=1 = **48 calls** (M4 PoC 트리거 충족 최소). judgeStatus ok 48/48, unstable/failed/mixed 0. 평균 non-wireframe 0.00 / first-viewport-richness 0.42 / emotional-fit 0.33 / editability 0.75 (baseline, D16 해석 적용).
- **2단계** ✓ — 7축 × 12 brief × repeat=1 = **84 calls** (전체 축 측정). judgeStatus ok 84/84, unstable/failed/mixed 0. 추가 3축 평균: visual-variety 0.00 / brand-reference-fidelity 0.17 / responsive-design-intent-preservation 0.08 (D16 baseline). 토픽: `m1-live-7axis` 라운드 1~5 (`0fab116`~본 흡수).
- **3단계** — 7축 × 12 brief × repeat=3 = **252 calls** (재현성 분산 측정). 토픽: `m1-live-reproducibility`.

각 단계 후 `summary.json` + `report.md` 검토 → 다음 단계 진행.

**1단계 4축**: `non-wireframe` / `first-viewport-richness` / `emotional-fit` / `editability` (placeholder 트리에서 측정 가능 신호 강한 축).

**남은 3축**: `visual-variety` / `brand-reference-fidelity` / `responsive-design-intent-preservation` (placeholder 단계에선 약함 — M2 LLM 생성 트리에서 본격 검증).

**사람 grading 3 brief**: `public-landing-jdc` / `dashboard-customer-support` / `brand-campaign-startup` (공공/B2B/스타트업 대표성). 1단계 report 후 사용자에게 21건 평가 요청 → judge와 Pearson r 계측.

**mixed-model 우선순위**: 같은 fixture × repeat 안에서 `judgeModel` 또는 `judgeModelVersion`이 섞이면 `judgeStatus: 'mixed-model'` (D14, m1-live 라운드 4).

**완료 기준**: 7개 축 중 4개 이상이 측정 가능 + 12개 brief 1차 점수 산출 (= P2 PoC 시작 트리거).

### M2 (P0.5). 편집 기능 + 측정 (3~4주 추정)

**시작 조건**: M0.5 완료 (트리 모델 최소 골격 존재).

편집 기능 6개 범위:
1. 콘텐츠 편집 (텍스트/라벨/마이크로카피)
2. 미디어 편집 (이미지 교체/crop/로고 워드마크-심볼 구분)
3. 구조 편집 (섹션 순서/카드 추가삭제/폼·표 편집)
4. 스타일 편집 (color preset/density/radius/shadow/타이포 강도)
5. 반응형 편집 (모바일/태블릿/데스크톱 즉시 확인)
6. 고도화 연결 (선택 영역 polish, 전체 polish, 사용자 편집 lock/preserve)

편집 평가 축 5개 측정:
- `selection-accuracy`, `edit-control-fit`, `layout-preservation-after-edit`, `user-intent-preservation`, `output-tidiness`
- `output-tidiness`는 3회 이상 편집 시퀀스 스크린샷을 입력으로 vision judge

**완료 기준**: 6개 범위 1차 구현 + 5개 축 측정 가능.

### M3 (P1). 디자인 고도화 루프 (2주 추정)

- M1 eval 결과를 사용자 리포트가 아니라 "고도화 액션" 입력으로 사용
- 고도화 전후 P0 점수 비교
- 사용자 편집을 덮어쓰지 않는 lock 메커니즘 검증

**완료 기준**: 표준 brief 12개에 대해 고도화 후 P0 평균 점수 +1.0 이상 향상.

### M4 (P2). HTML→트리 흡수 전략 검증 (R&D)

> **주**: E Hybrid 자체는 D2에서 제품 방향으로 확정됐다. 본 마일스톤은 "트리 채택 여부"가 아니라 **"흡수 방식이 디자인 의도/편집성/고도화 가능성을 보존하는가"** 를 검증한다.

- 시작 트리거: M1의 P0 7축 중 4축 측정 가능 + 표준 brief 12개 1차 점수 산출
- 본격 트리 스키마 설계 (M0.5 최소형 → 풀 스펙)
- HTML→트리 흡수기 본격 구현 + 다중 fixture 검증
- 보고 양식 의무 항목: P0.5 5개 축 점수 + P0 측정 완료 축 점수
- 통과 조건:
  - 의미 역할 추출률 ≥ 80%
  - 트리→HTML 재렌더 후 `layout-preservation-after-edit`, `output-tidiness` 점수 평균 -0.5 이내

**완료 기준**: 통과 조건 만족 시 → M5로. **실패 시는 트리 채택을 폐기하지 않고 흡수 방식을 변경**한다 — 옵션: ① LLM이 트리를 직접 출력 (제품 방향 유지, 흡수 단계 제거), ② 흡수기에 더 많은 fixture/보정 룰 추가 후 재시도, ③ 단일 plain HTML export로 jabworks/infoUX/KRDS 다중 export 야망 축소.

### M5. 익스포트 변환기 (jabworks 1차) (M4 통과 후)

- 트리→jabworks HTML 변환기
- 변환기 자체 검증 + 자체 정렬
- 디자인 보존 측정

**완료 기준**: 표준 brief 12개에 대해 jabworks 익스포트 후 디자인 보존 점수 (visual diff) 평균 0.5 이상.

### M6. infoUX / KRDS 익스포트 (M5 검증 후)

- 동일 패턴으로 infoUX, KRDS 변환기 추가

---

## 5. 협업 컨벤션

자세한 내용은 [`docs/COLLABORATION.md`](./docs/COLLABORATION.md). 핵심:

- **양측(Claude, Codex)이 같은 로컬, 같은 git repo에서 작업**.
- **상대방 커밋이 다음 행동 트리거**. 한쪽이 커밋 → 다른 쪽이 받아서 응답 커밋 → 반복.
- **의논 라운드는 `docs/discussions/` 안에 누적**. 라운드 번호 일관 (**홀수 Claude, 짝수 Codex** — dworks 라운드 1=Claude로 시작).
- **결정은 합의 후 메인 문서로 흡수**. 의논 노트는 history로 보존.
- **코드 변경 vs 문서 변경 분리**. 의논 중에는 문서, 합의 후 코드.
- **커밋 메시지에 작성자 명시** (`[Claude]` / `[Codex]` 접두 또는 footer).

---

## 6. 다음 작업

M0 / M0.5 / M1.1 / M1.2 1단계 완료. **다음은 4 토픽 병행** (사용자 2026-05-07 "병행해" mandate).

1. ✓ M0 부트스트랩 (`507d47d`~`d263eef`)
2. ✓ M0.5 Tree Foundation (`87aab64`~`66f2473`)
3. ✓ M1.1 eval 부트스트랩 (m1-bootstrap 토픽 라운드 1~5, `3e29537`~`cd2d3cd`)
4. ✓ M1.2 1단계 live baseline (m1-live-execution 토픽 라운드 1~5, `997cec0`~`f03df7c`) — 12 brief × 4 axis = 48 calls baseline 산출, D16 해석 적용
5. **다음 (병행 4 토픽)**:
   - **(a) m1-live-7axis** — M1.2 2단계 7축 확장 (12 brief × 7 axis = 84 calls)
   - **(b) m1-live-reproducibility** — M1.2 3단계 repeat=3 재현성 (12 brief × 7 axis × 3 = 252 calls, D8 variance threshold 검증)
   - **(c) M2 시작** — placeholder → LLM 생성 트리. 시작 조건 (M0.5 완료 + M1.2 baseline) 충족
   - **(d) M4 PoC 시작** — HTML→트리 흡수기 검증. 시작 트리거 (M1의 4축 측정 완료) 충족

---

## 7. 사용자 결정 사항 (2026-05-07 확정)

| 항목 | 결정 |
|------|------|
| 프로젝트 이름 | **Dworks** (디자인 + jabworks) |
| PRD 한 줄 정의 | §0 본문대로 채택 (이름만 "Design Works" → "Dworks") |
| krds-studio 처리 | 참조 용도, **적절한 시점에 삭제** |
| 원격 git 저장소 | **`github.com/emrdl7/dworks` 퍼블릭** |
| LLM 정책 | **1순위 Claude Code CLI → 2순위 Codex CLI → 3순위 Gemini CLI**. SDK/API 호출 없이 로컬 인증 CLI를 사용한다. 자세한 내용은 `docs/DECISIONS.md` D12. |
| 트리 스키마 라이브러리 | **Zod**. 근거: TypeScript-first 생태계 1위, Drizzle/Hono와 동일 패턴, discriminated union 지원, LLM이 가장 익숙. 자세한 내용은 `docs/DECISIONS.md` D13. |

---

## 8. 참조

- `~/krds-studio/docs/10-FRAME-REVIEW-2026-05-07.md` — krds-studio 라운드 1~4 의논 노트
- `~/krds-studio/docs/01-PRD.md` ~ `09-EDITOR-UX-PLAN.md` — 자산 검토 시 참조
- `~/krds-studio/seeds/evals/briefs/` — P0 표준 fixture (M0에서 dworks로 이전)
- `~/krds-studio/references/` — Codex 시스템 프롬프트 베이스, emotional design 자료 (M0에서 이전)
- dworks 라운드 1: 1차 안 커밋 4건 (`74be743` / `ddf1616` / `b449f3d` / `30d4697`). 별도 노트 없음.
- `docs/discussions/2026-05-07-plan-round-{2..5}-*.md` — dworks 라운드 2~5 의논 history.
- `docs/discussions/ALERT-2026-05-07.md` — 흡수 직후 안전장치 #3 발동 정지 기록.
