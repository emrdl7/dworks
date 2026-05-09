# 핸드오버 — 2026-05-09 저녁 (M3 트랙 디자인 품질 강화 + schema-resilience Codex 핸드오프)

> 다음 Claude 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-pm.md` 후속.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **본 파일** — 저녁 세션 마무리 + 미해결 토픽
2. `docs/AUTONOMOUS.md` — mandate + **§6 병렬 흐름** (2026-05-09 신규 정책)
3. `docs/discussions/2026-05-09-m3-generate-schema-resilience-round-1-claude.md` — **현재 Codex가 해결 중인 토픽**
4. `docs/DECISIONS.md` 부록 A — 토픽 누적 (현재 22 ABSORB까지)
5. 직전 핸드오버 `docs/HANDOVER-2026-05-09-pm.md` — 오후 세션

---

## 현재 상태 (2026-05-09 15:15 KST)

### 자율 모드: ON

- 가속 §6 활성: Claude는 round 4 commit 직후 즉시 다음 큰 덩어리 진입, 대기 X
- Codex: 직전 Claude commit 받아 검증/fix commit으로 자유 보강
- 메모리에 사용자 4종 피드백 신규 박힘 (반말 금지 / ㄱㄱ 즉시 진행 / 디자인 외부 지식 능동 / 병렬 작업 대기 금지)

### Mandate

- **M3 AI 생성 파이프라인** — 본 세션에 16+ 토픽 추가 입증
- 사용자 디자인 정정 흐름 직접 흡수: 헤더/푸터/반응형/시각 풍부도

### 마지막 ABSORB

`32b0a2b` (스물두번째 — emotional-mapping + page-foundations 합본).
이후 본 세션 commit들은 _아직 ABSORB 안 됨_ — schema-resilience 토픽 close 시점에 묶을 예정.

---

## 본 세션 누적 (HANDOVER-pm 이후)

### Closed + ABSORB 22번째

- **m3-generate-clarify-edit** (`d456089` r4 / `ab2a52a` r5) — variant 선택 시 brief 재편집
- **m3-generate-prompt-style** (`f98a6e2` r4) — examples 도메인 시그니처
- **m3-generate-eval-diversity** (`1de372e` r4 / `4b98f10` r5) — type-path multiset Jaccard
- **m3-generate-variant-grid** (`892290f` r4 / `fc8223a` r5) — compareMode mini grid
- **m3-generate-clarify-loop** (`763b657` r4 / `4565e81` r5) — multi-turn clarify
- **m3-generate-prompt-emotional-mapping** (`7b5230a` r4) — 5종 톤 매핑 가이드
- **m3-generate-prompt-page-foundations** (`1ab5273` r4 / `9aee05a` r5) — 풀 페이지 골격 + 2026 트렌드

### Closed + 미흡수 (다음 ABSORB 후보)

- **m3-generate-responsive-rendering** (`5bb1de6` r4) — viewport별 layout 자동 적응(mobile row→column, padding/gap 축소, hero/grid 1열). Codex r5 추가조치 없음 명시.
- **m3-generate-mobile-nav-collapse** (`df4c564` r4 직접) — 모바일/태블릿 헤더 햄버거(`MobileBannerSection`)
- **m3-generate-prompt-visual-richness** (`39d015c` 1 / `93f413c` 2 / `667b3f0` gallery) — 와이어프레임 탈피, typography fontSize 강제, 색감, shadow, 카페 gallery 섹션
- **m3-generate-schema-retry** (`665a428`) — 422 시 1회 자동 재시도(NODE_ENV=test=0)
- **m3-generate-prompt-strict-schema** (`6de3a1c`) — schema 정확한 형식 절대 규칙 명시 (Codex 핸드오프 직전 시도)

### 별도 fix commits (mandate 외 환경 정합)

- **`05a1d79`** — page-shell section default padding/gap 제거 + tablet 햄버거 적용
- **`be5ad22`** — LLM timeout 30s → 90s (env DWORKS_LLM_TIMEOUT_MS)
- **`5540585`** — DWORKS_DEBUG_SCHEMA env 진단 출력
- **`c984b21`** — api hono/cors 추가
- **`31e19e1`** — AUTONOMOUS §6 정책 commit

---

## 진행 중 / Codex 대기 중

### **m3-generate-schema-resilience** (`668df18` r1, Codex 주도 round 4)

사용자 명시: "코덱스한테 해결하라고 넘겨"

**문제**: schema-failure 422가 retry 1회 후에도 재차 발생. server log(`DWORKS_DEBUG_SCHEMA=1`)로 LLM 자주 박는 패턴 2종 확정:

1. `color.backgroundColor: "rgba(255, 255, 255, 0.95)"` — schema는 hex만
2. `typography.letterSpacing: "-0.02em"` string 또는 `-1` number — schema는 number -0.1~0.2 ratio

Claude 직전 시도(`6de3a1c`)는 system prompt에 정확한 schema 형식 명시. 그러나 LLM이 prompt 지침을 매번 따르지 않을 가능성.

**Codex 해결 방향 (r1 docs에 명시)**:
- 길 A. Schema 자체 확장 (hex+rgba, letterSpacing 범위 -2~2)
- 길 B. Sanitize layer 도입 (응답을 schema 검증 _전에_ 자동 정정)
- 길 C. A+B 조합 (권장)

Codex r2 검토 대기 중. r4를 Codex가 직접 commit할 가능성.

---

## 다음 우선순위 (자율 진행 시)

### 즉시 가능 (작은~중간)

1. **schema-resilience Codex r5 검증** — Codex r4 commit 도착 시 Claude가 edge fix 또는 검증
2. **SaaS / 블로그 example에 추가 섹션** — 카페에 gallery 추가했지만 SaaS는 hero 섹션 없이 pricing만, 블로그는 article만. SaaS hero / 블로그 관련 글 그리드 추가
3. **카페 examples의 dev server 시각 검증** — 사용자가 결과 본 후 추가 정정 흡수

### 큰 토픽

1. **m3-generate-image-ref** — 사용자 이미지 reference 입력
2. **m3-generate-eval-page-shell** — vision LLM judge로 페이지 기본기 정량 측정
3. **m3-generate-eval-ai-slop** — 와이어프레임/그라디언트 남용 자동 detection
4. **m3-generate-stream** — 스트리밍 응답 (긴 풀 페이지 latency 대응)

---

## 컨벤션 주의

### `[Claude]` footer 필수

dworks 모든 Claude commit. 메모리에 박혀 있음.

### 가속 §6 병렬 흐름 (2026-05-09 신규)

- Claude는 round 4 commit 후 즉시 다음 덩어리 진입. Codex r5 watcher가 알리면 흡수.
- Codex는 fix/test/refactor commit으로 자유 보강 — r5 docs 없이 commit만 OK.
- 한 토픽이 여러 commit으로 나뉘어도 OK. ABSORB 시점은 묶어서.

### 사용자 피드백 메모리 (이번 세션 신규)

- `feedback_tone_polite.md` — 한국어 존댓말 유지, 반말 금지
- `feedback_gg_no_wait.md` — ㄱㄱ/쭉쭉/빨리빨리 신호 시 즉시 진행
- `feedback_design_research_active.md` — 디자인 결과물 약하면 외부 자산 능동 활용
- `feedback_parallel_no_idle.md` — 병렬 작업, 대기 금지

### 환경 변수 (api 측)

- `DWORKS_DEBUG_SCHEMA=1` — schema-failure 시 server console에 위반 detail + raw json head
- `DWORKS_LLM_TIMEOUT_MS` — LLM CLI timeout (default 90s)
- `DWORKS_GENERATE_RETRIES` — schema/parse 422 자동 재시도 횟수 (default 1, NODE_ENV=test=0)
- `DWORKS_LLM_PROVIDERS` — provider chain (default claude,codex,gemini)

---

## 사고 메모 — dev 환경 stale 문제

본 세션 중 dev server가 _세 번_ stale 또는 EADDRINUSE 충돌:

1. routes-manifest.json missing — `pnpm build` 후 `pnpm dev` 충돌 → `.next` 캐시 삭제 + 재시작
2. tsx watch가 packages/llm-prompts 변경 감지 → 재시작 시도 → port 점유 실패 → old process가 _구 코드_로 응답
3. Internal Server Error / Failed to fetch — 모두 stale 캐시 또는 process 충돌

**대응 패턴**:
- 사용자가 "Failed to fetch" 또는 "Internal Server Error" 보고 → kill PID + .next rm -rf + 재시작
- api 재시작은 `DWORKS_DEBUG_SCHEMA=1` env 켠 채로 띄우기

**후속 검토**: dev 재시작 자동화 스크립트 또는 nodemon-style robustness.

---

## 메인 문서 흡수 정책 (변경 없음)

- 신규 토픽 종료 → DECISIONS.md 부록 A 추가 (ABSORB commit)
- AUTONOMOUS.md 후속 후보 ✓ 표기
- ABSORB commit 마지막 줄에 `[ABSORB]` marker
- 가속 §6 — 여러 토픽 동시 close 상태면 한 ABSORB로 묶음

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -30` — 본 세션 commit + Codex 추가 커밋 확인
2. `git status` — worktree clean 확인
3. `cat docs/HANDOVER-2026-05-09-evening.md` (본 파일)
4. `cat docs/AUTONOMOUS.md` — §6 정책 확인
5. `cat docs/discussions/2026-05-09-m3-generate-schema-resilience-round-1-claude.md` — Codex 진행 상태
6. `tail -20 .git/feed.log` — Codex 최근 활동
7. `lsof -i :3000 -i :3001` — dev process 살아있는지. 죽었으면 재시작:
   - `pnpm --filter @dworks/web dev`
   - `DWORKS_DEBUG_SCHEMA=1 pnpm --filter @dworks/api dev`
8. 사용자 지시 없으면 자율 진행 — schema-resilience 결과 확인 후 다음 토픽 (가속 §6)

---

## 코드 스택 위치 빠른 참조

### 본 세션 변경 영역

- `apps/api/src/`:
  - `index.ts`: hono/cors middleware 추가 (`c984b21`)
  - `generate.ts`: schema-retry runOnce loop + DEBUG_SCHEMA log (`5540585` / `665a428`)
  - `llm.ts`: DEFAULT_TIMEOUT_MS resolveDefaultTimeoutMs로 env 기반 (`be5ad22`)
- `apps/web/src/app/`:
  - `page.tsx`: CanvasViewportContext + responsive 자동 적응 + MobileBannerSection 햄버거 + page-shell section default padding 제거
  - `responsive.ts` 신규 — resolveResponsiveSpacing / resolveResponsiveLayout helper
  - `responsive.test.ts` 신규 — 11 unit tests
- `packages/llm-prompts/src/`:
  - `index.ts`: GENERATE_TREE_SYSTEM_PROMPT에 페이지 기본 구조 + 2026 트렌드 + 답변→스타일 매핑 + Schema 정확한 형식 + Multi-turn (clarify) 섹션 모두 누적 추가. examples 3개 풀 페이지로 재구성, 카페에 menu/gallery 신규
  - `index.test.ts`: 14 tests (이전 9 + 페이지 골격 2 + 시각 강화 3)

### 미변경 (Codex 작업 후보)

- `packages/tree/src/schema.ts` — schema-resilience 길 A 적용 시 hexColorSchema / typographySchema 확장 위치
- `apps/api/src/generate.ts` — schema-resilience 길 B 적용 시 sanitize layer 추가 위치

[Claude]
