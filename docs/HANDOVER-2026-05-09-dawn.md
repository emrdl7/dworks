# 핸드오버 — 2026-05-09 새벽 (M3 trend/summary/fixture 풍부도 4 토픽)

> 다음 Claude/Codex 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-overnight.md` 후속.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **본 파일** — 본 세션 누적 + 다음 우선순위
2. `docs/AUTONOMOUS.md` — mandate + §6 가속 흐름
3. `docs/DECISIONS.md` 부록 A — ABSORB 29까지 토픽 누적
4. 직전 핸드오버 `docs/HANDOVER-2026-05-09-overnight.md` — export 메타/batch + trend 시작점

---

## 현재 상태

### 자율 모드: Claude 단독 + 가속 §6 강화

- 사용자 신호: "사용자 신호 기다리지 말고 가속모드로 쭉쭉 나가" (지속)
- 본 세션은 fixture catalog 풍부도 메타 + sparkline 마커 구분 + 요약 카드 + dropdown 점수 — 디자이너의 _시안 비교/식별_ UX 보강

### Mandate

- **M3 AI 생성 파이프라인** — 본 세션 4 토픽 추가
- 본 세션 마감 — 큰 토픽(image-ref-multi, stream)은 다음 세션 시작 시점에 진입

### 마지막 ABSORB

ABSORB 29 (본 commit). 이후 미흡수 토픽 0.

---

## 본 세션 누적 (HANDOVER-overnight 이후 4 commits + ABSORB 29)

### ABSORB 29 (본 commit) — 4 토픽 흡수

- `m3-generate-fixture-export-include-richness` (`ebd1ae0`) — fixture catalog .json에 풍부도 메타 자동 주입 (caller 주입 불필요, build 시점 즉시 계산). test 2
- `m3-generate-trend-immutable-marker` (`c1b8212`) — sparkline 마커 구분: ◇ 원본 / ● ★ 고정 / ● mutable. 색 톤 + tooltip + legend
- `m3-generate-richness-summary-card` (`964e1d8`) — sparkline 아래 평균/최고(라벨)/최저(라벨) 요약 카드
- `m3-generate-fixture-dropdown-richness` (`1f7e76b`) — header "내 fixture" optgroup option 라벨에 풍부도 점수 표시 ("이름 · 0.62")

---

## 사용자 검증 영역

### 1. 풍부도 시안 비교 (m3-generate-trend-immutable-marker, summary-card)

- sparkline에서 entry 종류 즉시 식별 — ◇ 원본 / ● ★ 고정(베이지) / ● mutable(default) / 활성(청록)
- 점 hover 시 "(원본)" / "(★ 고정)" 라벨 부착
- summary 카드: 평균 0.X · 최고 0.Y (이름) · 최저 0.Z (이름) — 베스트/워스트 시안 즉시 매핑
- 모든 entry 종류 포함, 베이스라인도 비교 대상

### 2. fixture catalog 풍부도 (m3-generate-fixture-export-include-richness, dropdown-richness)

- header "내 fixture" optgroup에서 dropdown 열면 각 옵션에 "이름 · 0.62" 점수 — 풍부도 높은 시안 한눈에
- fixture catalog .json에도 fixture별 richness 메타 — 외부 review 시 .json 파일만으로 즉시 비교

---

## 다음 우선순위 (자율 진행 시)

### 큰 토픽 (다음 세션 시작 시점)

1. **m3-generate-image-ref-multi** — ImageReference[] schema 변경. llm-prompts(formatBriefAsUserPrompt 다중 처리) + apps/api(zod schema array) + apps/web(persist v1 schema additive 추가, hydrate 시 single→multi 자동 마이그레이션) + UI(file input multiple, 썸네일 grid, 색 chip 통합)
2. **m3-generate-stream** — 스트리밍 응답 (vendor-specific, 어려움)
3. **m3-generate-eval-page-shell** — vision LLM judge (vision 의존)

### 작은~중간 polish

1. **m3-generate-richness-trend-y-labels** — sparkline y축 0/0.5/1 작은 텍스트 라벨
2. **m3-generate-fixture-dropdown-builtin-richness** — 기본 fixture에도 점수 표시(description 옆)
3. **m3-generate-batch-export-richness-summary** — batch .json에 catalog-level 평균/max/min 메타 추가

---

## 컨벤션 주의

### `[Claude]` / `[Codex]` footer 필수

- 모든 commit 마지막에 작성자 마커
- ABSORB commit은 마지막 줄에 `[ABSORB]`

### 가속 §6 흐름

- 사용자 명시 신호 후 5+ 토픽 연속 진행, ABSORB 시점도 자체 결정
- round 1 docs 생략, `feat:` commit으로 직접 진입

### 환경 변수 (api 측)

- `DWORKS_DEBUG_SCHEMA=1` / `DWORKS_LLM_TIMEOUT_MS` / `DWORKS_GENERATE_RETRIES` / `DWORKS_LLM_PROVIDERS`

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -30`
2. `git status` — worktree clean 확인
3. `cat docs/HANDOVER-2026-05-09-dawn.md` (본 파일)
4. `cat docs/AUTONOMOUS.md`
5. `tail -20 .git/feed.log`
6. `lsof -i :3000 -i :3001` — dev process 살아있는지
7. 사용자 지시 없으면 큰 토픽 image-ref-multi 진입 (가장 영향 큼) 또는 작은 polish 연속

---

## 코드 스택 위치 빠른 참조

### 본 세션 변경

- `apps/web/src/app/`:
  - `fixture-export.ts` — ExportedUserFixture.richness?: 추가 + buildFixtureExportPayload 자동 계산 + validateExportedRichness
  - `fixture-export.test.ts` — richness 2 case 추가
  - `page.tsx` — sparkline immutable 마커 분기(◇ path), summary card, fixture dropdown 점수

### 다음 세션 image-ref-multi 진입 시 변경 영역

- `packages/llm-prompts/src/index.ts` — DesignBrief.imageReferences?: ImageReference[] 신규(또는 imageReference 자체를 array로 확장)
- `apps/api/src/index.ts` — briefSchema의 imageReference zod schema 변경
- `apps/web/src/app/page.tsx` — file input multiple, 썸네일 grid, briefImageRefs state(배열), persist v1 schema에 imageReferences 신규 키 + 마이그레이션
- `apps/web/src/app/generation-storage.ts` — validateImageReference array 처리

[Claude]
