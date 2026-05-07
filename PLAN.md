# Design Works (dworks) — 진행 플랜

> **상태**: 1차 안 (2026-05-07). Claude가 작성. 사용자 + Codex 합의 후 결정으로 굳힌다.
> **출발점**: `~/krds-studio` 프로젝트의 v3→v4 의논 결과(라운드 1~4)를 처음부터 반영하는 새 시작.
> **이전 의논 노트**: `~/krds-studio/docs/10-FRAME-REVIEW-2026-05-07.md` (참조 자산으로 보존).

---

## 0. 본 프로젝트 정체성

- **이름**: Design Works (저장소: `dworks`)
- **한 줄 정의 후보** (krds-studio 라운드 3 §12.7 합의 후보 그대로):
  > 자연어와 레퍼런스로 웹 디자인 시안을 생성하고, 사용자가 캔버스에서 바로 편집·고도화해 납품 가능한 디자인 산출물로 정돈하는 도구.
- **보조 문장**: HTML은 캔버스 렌더링과 export를 위한 매체일 뿐, 제품의 중심 모델은 디자인 산출물과 편집 경험이다.
- **krds-studio와의 관계**: krds-studio는 v4 의논 비용을 치른 학습 자산. dworks는 그 결론에서 시작하는 v2. krds-studio는 참조 자산으로 보존하되 메인 개발은 dworks로 이전.

---

## 1. 의논 합의 결과 요약 (라운드 1~4)

자세한 내용은 [`docs/DECISIONS.md`](./docs/DECISIONS.md). 핵심만 추리면:

1. **프레임**: 디자인툴이지 HTML 생성기가 아니다.
2. **모델 표현**: E (Hybrid) — JSON 의도 트리가 source of truth, HTML은 LLM I/O + 캔버스 렌더 + 익스포트 매체.
3. **우선순위**: P0 디자인 품질 eval → P0.5 편집 기능 + 측정 → P1 디자인 고도화 루프 → P2 HTML→트리 흡수 PoC.
4. **eval 입력 본질**: brief + 캔버스 스크린샷 + 자산 + viewport별 렌더 (DOM 구조 아님).
5. **익스포트 = 트리에서 분기되는 다중 변환기** (plain / jabworks / infoUX / KRDS). v4의 "Compliance Align" 단계는 익스포트 변환기로 흡수.
6. **검증의 위계**: 사용자에게 노출되는 검증은 사실상 "익스포트 가능 여부" 한 가지. 디자인 단계엔 도구 내부 안전성(렌더/보안/편집 노드 손실)만.

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
- LLM: Codex CLI (`codex exec --json --ephemeral`)
- 테스트: tsx 기반 단위 테스트 (krds-studio 패턴)

### 신규 도입 검토

- **vision LLM judge** — 후보: Claude vision API (Sonnet/Opus). P0/P0.5의 모든 평가 축이 의존.
- **Playwright 또는 Puppeteer** — viewport별 스크린샷. krds-studio는 미도입, dworks는 P0부터 필요.
- **트리 스키마 검증 라이브러리** — Zod 또는 ArkType. JSON 트리 노드 검증 + 흡수기 안전망.
- **이미지 diff 도구** — pixelmatch 또는 odiff. P2 PoC의 디자인 보존 측정.

### 변경 없음

핵심 골격은 그대로. dworks의 차별점은 **프레임(디자인툴)과 모델(JSON 트리)** 이지 기술 스택 교체가 아니다.

---

## 4. 마일스톤

### M0. 프로젝트 부트스트랩 (1주 추정)

- monorepo 골격 복제 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`)
- `apps/web`, `apps/api`, `packages/{tokens, llm-prompts, components, validators, exporters}` 빈 골격
- `references/`, `seeds/` 가져옴
- `docs/DECISIONS.md`, `docs/COLLABORATION.md` 본 라운드에서 작성
- 첫 협업 라운드 시작 (본 PLAN.md 합의)

**완료 기준**: `pnpm install && pnpm typecheck` 통과, 빈 Next.js 앱과 빈 Hono API 가동.

### M1 (P0). 디자인 품질 eval 1차 구현 (2~3주 추정)

- 평가 축 7개:
  - `non-wireframe`, `first viewport richness`, `emotional-fit`, `visual-variety`, `brand/reference fidelity`, `responsive design intent preservation`, `editability`
- 각 축 0–5 루브릭 정의 + vision LLM judge 호출 + 점수 산출
- 표준 brief 12개에 대한 1차 점수 산출
- judge 재현성 체크 (분산 ≤ 0.5)
- 사람 grading 보정 (12개 중 3개 사람 grading, Pearson 상관계수 ≥ 0.6)
- 축별 평균/최저점 brief/대표 실패 사유 리포트

**완료 기준**: 7개 축 중 4개 이상이 측정 가능 + 12개 brief 1차 점수 산출 (= P2 PoC 시작 트리거).

### M2 (P0.5). 편집 기능 + 측정 (3~4주 추정)

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

### M4 (P2). HTML→트리 흡수 PoC (R&D)

- 트리거: M1의 P0 7축 중 4축 측정 가능 + 표준 brief 12개 1차 점수 산출 (= M1 완료 기준)
- 트리 스키마 1차 설계
- HTML→트리 흡수기 시뮬레이션
- 보고 양식 의무 항목: P0.5 5개 축 점수 + P0 측정 완료 축 점수
- 통과 조건:
  - 의미 역할 추출률 ≥ 80%
  - 트리→HTML 재렌더 후 `layout-preservation-after-edit`, `output-tidiness` 점수 평균 -0.5 이내

**완료 기준**: 통과 조건 만족 시 E 채택 확정 → M5로. 실패 시 옵션 A(현행 유지) / 옵션 C(JSON 트리 LLM 직접 출력) 재검토.

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
- **의논 라운드는 `docs/discussions/` 안에 누적**. 라운드 번호 일관 (Codex 홀수, Claude 짝수).
- **결정은 합의 후 메인 문서로 흡수**. 의논 노트는 history로 보존.
- **코드 변경 vs 문서 변경 분리**. 의논 중에는 문서, 합의 후 코드.
- **커밋 메시지에 작성자 명시** (`[Claude]` / `[Codex]` 접두 또는 footer).

---

## 6. 다음 작업 (라운드 1 시작점)

1. **사용자 본 PLAN.md 검토** → OK 또는 수정 지시.
2. **Codex 본 PLAN.md 검토 커밋** → 합의/이견 기록 (`docs/discussions/2026-05-07-plan-review-codex.md` 같은 형식).
3. **Claude 응답 커밋** → 합의/이견 기록.
4. 의논 미해결 0건 도달 시 → M0 부트스트랩 시작.

---

## 7. 미결 항목 (사용자/Codex 확인 필요)

- **PRD 한 줄 정의 후보 (§0)** — krds-studio 라운드 3에서 합의 후보 단계까지 갔으니 dworks에서 그대로 채택할지, 다시 다듬을지.
- **krds-studio 처리** — 참조 자산으로 동결할지, archive 태그를 붙일지, 그대로 둘지.
- **원격 git 저장소** — dworks를 GitHub 등 원격에 push할지, 로컬만 유지할지. 협업이 같은 로컬이라 필수는 아니지만 백업 관점에서 권장.
- **vision judge 모델 선택** — Claude Sonnet/Opus vs 다른 후보. 비용/품질/일관성 trade-off.
- **트리 스키마 라이브러리** — Zod vs ArkType vs 자체 정의.

---

## 8. 참조

- `~/krds-studio/docs/10-FRAME-REVIEW-2026-05-07.md` — 라운드 1~4 의논 노트
- `~/krds-studio/docs/01-PRD.md` ~ `09-EDITOR-UX-PLAN.md` — 자산 검토 시 참조
- `~/krds-studio/seeds/evals/briefs/` — P0 표준 fixture
- `~/krds-studio/references/` — Codex 시스템 프롬프트 베이스, emotional design 자료
