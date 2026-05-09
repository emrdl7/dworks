# 핸드오버 — 2026-05-09 저녁 (sparkline UX + image-ref 비율 통합 5 토픽)

> 다음 Claude/Codex 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-afternoon.md` 후속.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **본 파일** — 본 세션 누적 + 다음 우선순위
2. `docs/AUTONOMOUS.md` — mandate + §6 가속 흐름
3. `docs/DECISIONS.md` 부록 A — ABSORB 33까지 토픽 누적
4. 직전 핸드오버 `docs/HANDOVER-2026-05-09-afternoon.md` — color merge 시작점

---

## 현재 상태

### 자율 모드: Claude 단독 + 가속 §6

- 사용자 신호: "계속 가라고" — 큰 토픽 마무리 후 polish 연속 위임
- 본 세션은 sparkline UX 마감(click target / y labels / empty state) + image-ref 비율 통합 + fixture dropdown 정렬

### Mandate

- **M3 AI 생성 파이프라인** — 본 세션 5 토픽 추가
- 직전 ABSORB 32 후 5 commit (image-ref-multi 후속 polish 4 + sparkline UX polish 1) → ABSORB 33

### 마지막 ABSORB

ABSORB 33 (본 commit). 이후 미흡수 토픽 0.

---

## 본 세션 누적 (ABSORB 32 이후 5 commits + ABSORB 33)

### ABSORB 33 (본 commit) — 5 토픽

- `m3-generate-trend-click-target` (`f59d840`) — sparkline 점 클릭 영역 r=6 invisible hit area
- `m3-generate-image-ref-multi-aspect-merge` (`90dbc88`) — 다중 비율 통합 추론(가장 흔한 + ASPECT_PRIORITY) + UI/prompt 출력. test 6
- `m3-generate-richness-trend-empty-state` (`6f3d613`) — 단일 entry 시 sparkline 자리 안내
- `m3-generate-fixture-dropdown-richness-sort` (`24e671b`) — "내 fixture" 풍부도 desc 정렬

(주: 직전 ABSORB 32에 이미 흡수된 토픽 4개와 본 ABSORB 33에 흡수된 4개를 합쳐 본 세션 8 토픽 — 본 핸드오버는 본 ABSORB 33만 다룸)

---

## 사용자 검증 영역

### sparkline UX (trend-click-target / y-labels / empty-state)

- 단일 entry: 점선 dashed 카드 "생성을 추가하면 풍부도 추이를 표시합니다." 안내
- 2개 이상: sparkline + 좌측 1.0/0.5/0.0 라벨 + r=6 invisible hit area
- 점 hover: native title `{label} — {score} (원본/★ 고정)`, 클릭 시 active 전환

### image-ref-multi 비율 통합 (aspect-merge)

- 다중 image-ref의 비율 분포에서 가장 흔한 것 추출, 동수면 wide > landscape > portrait > square
- UI: 통합 팔레트 카드 헤더 우측에 "비율 wide" 같은 라벨 (mergedAspect 있을 때만)
- LLM prompt에 "- 통합 비율(빈도 가중): wide" line 자동 출력 — system prompt 가이드 "다중 비율 다르면 첫 번째 hero" 규칙과 결합

### fixture catalog UX (dropdown-richness-sort)

- header "내 fixture (풍부도 순)" optgroup — 풍부도 점수 desc로 정렬 표시
- 등록 순서는 localStorage에 보존, dropdown 표시 정렬만 변경

---

## 다음 우선순위 (자율 진행 시)

### 큰 토픽

1. **m3-generate-stream** — 스트리밍 응답 (vendor-specific, 어려움)
2. **m3-generate-eval-page-shell** — vision LLM judge (vision 의존)
3. **m3-generate-prompt-fixture-as-baseline** — 사용자 fixture 트리(가장 풍부도 높은 것)를 reference snippet으로 prompt에 추가 — prompt size 폭증 위험, 신중

### 작은~중간 polish

1. **m3-generate-batch-import-rich-summary-display** — handleImportGenerationBatchFile에서 평균 풍부도 success info 표시
2. **m3-generate-prompt-image-ref-aspect-detail** — system prompt에 비율별 권장 layout(wide hero / portrait card grid 등) 더 상세
3. **m3-generate-richness-summary-card-cluster-distribution** — summary card에 위/평균/아래 entry 개수 분포 마이크로 표시
4. **m3-generate-image-ref-color-distance-merge** — RGB 거리 기반 클러스터링으로 색 통합 더 정밀

---

## 컨벤션 주의

### `[Claude]` / `[Codex]` footer 필수

### 가속 §6 흐름

- 사용자 명시 신호 후 5+ 토픽 연속 + ABSORB 자체 결정
- round 1 docs 생략, `feat:` commit 직접 진입

### 환경 변수 (api 측)

- `DWORKS_DEBUG_SCHEMA=1` / `DWORKS_LLM_TIMEOUT_MS` / `DWORKS_GENERATE_RETRIES` / `DWORKS_LLM_PROVIDERS`

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -30`
2. `git status` — worktree clean
3. `cat docs/HANDOVER-2026-05-09-evening2.md` (본 파일)
4. `cat docs/AUTONOMOUS.md`
5. `tail -20 .git/feed.log`
6. `lsof -i :3000 -i :3001`
7. polish 연속 또는 큰 토픽 stream / prompt-fixture-as-baseline 진입

---

## 코드 스택 위치 빠른 참조

### 본 ABSORB 33 변경

- `apps/web/src/app/`:
  - `page.tsx` — sparkline empty state + click target g wrapper + dropdown 정렬
  - `image-color.ts` — mergeImageReferenceAspect helper
  - `image-color.test.ts` — 4 case 추가
- `packages/llm-prompts/src/`:
  - `index.ts` — mergeReferenceAspect mirror + formatBriefAsUserPrompt 비율 line
  - `index.test.ts` — 2 case 추가

[Claude]
