# 핸드오버 — 2026-05-09 오후 (image-ref-multi 후속 polish 4 토픽)

> 다음 Claude/Codex 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-noon.md` 후속.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **본 파일** — 본 세션 누적 + 다음 우선순위
2. `docs/AUTONOMOUS.md` — mandate + §6 가속 흐름
3. `docs/DECISIONS.md` 부록 A — ABSORB 32까지 토픽 누적
4. 직전 핸드오버 `docs/HANDOVER-2026-05-09-noon.md` — image-ref-multi 4 분할 시작점

---

## 현재 상태

### 자율 모드: Claude 단독 + 가속 §6

- 사용자 신호: "이어가" — 큰 토픽 후속 polish 위임
- 본 세션은 image-ref-multi의 자연스러운 후속 polish (color merge UI/prompt + 비율 우선순위) + sparkline UX 보강

### Mandate

- **M3 AI 생성 파이프라인** — 본 세션 4 토픽 추가 (image-ref-multi 후속 + sparkline polish)

### 마지막 ABSORB

ABSORB 32 (본 commit). 이후 미흡수 토픽 0.

---

## 본 세션 누적 (HANDOVER-noon 이후 4 commits + ABSORB 32)

### ABSORB 32 (본 commit) — 4 토픽

- `m3-generate-image-ref-multi-color-merge` (`685e64a`) — 다중 image 색 통합 팔레트 helper + UI 카드. test 5
- `m3-generate-image-ref-multi-prompt-include-merged` (`60eea35`) — system prompt에 통합 팔레트 hex line 자동 출력 (web와 동일 알고리즘)
- `m3-generate-image-ref-multi-prompt-aspect-priority` (`7305ace`) — 다중 비율/팔레트 우선순위 가이드 (첫 비율 hero / 주조 색 + 강조 1~2색)
- `m3-generate-richness-trend-y-labels` (`581ca62`) — sparkline 좌측 1.0/0.5/0.0 라벨 column

---

## 사용자 검증 영역

### 다중 image color merge (color-merge + prompt-include-merged)

- 좌측 패널 "참고 이미지" 영역 끝에 "통합 팔레트 (N색)" 카드 — refs.length > 1일 때만 표시
- 빈도 가중치(앞쪽 색일수록 높음) + 동일 색 합산 + 대소문자 정규화 → max 5색
- /generate 호출 시 system prompt에 "- 통합 팔레트(빈도 가중): #hex1, #hex2, ..." line 자동 출력 — web 카드와 동일 색

### system prompt 다중 가이드 (prompt-aspect-priority)

- "## 참고 이미지 활용 가이드"에 7 규칙 (5 → 7로 확장):
  1. 시드로만 활용
  2. 다중 시 _넓은 팔레트_ 종합 + 주조 1~2색 위계
  3. 비율은 hero/cover에 반영
  4. **다중 비율 다르면 첫 번째를 hero에 우선 + 나머지는 보조 노드(card/gallery)** ← 신규
  5. **통합 팔레트(빈도 가중)는 주조 색 + 강조 1~2색** ← 신규
  6. raw hex 강제 X
  7. 시드 vs intent 충돌 시 intent 우선

### sparkline UX (trend-y-labels)

- chip group 위 sparkline 좌측에 mono font 1.0 / 0.5 / 0.0 라벨
- 0.6 dashed 임계 line + y 라벨 결합 → 점 위치 정량 판단 강화

---

## 다음 우선순위 (자율 진행 시)

### 큰 토픽

1. **m3-generate-stream** — 스트리밍 응답 (vendor-specific, 어려움)
2. **m3-generate-eval-page-shell** — vision LLM judge (vision 의존)

### 작은~중간 polish

1. **m3-generate-prompt-fixture-as-baseline** — 사용자 fixture 트리(가장 풍부도 높은 것)를 reference snippet으로 prompt에 추가
2. **m3-generate-batch-import-summary-validate** — batch import 시 entries 재계산 vs payload summary 비교
3. **m3-generate-image-ref-multi-aspect-merge-helper** — 다중 비율을 통합 비율로 추론(예: 모두 portrait면 portrait, 섞이면 landscape default)
4. **m3-generate-fixture-export-rich-metadata** — fixture catalog .json에 fixture별 첫 등록 시 brief.intent 같은 메모 보존
5. **m3-generate-trend-click-target** — sparkline 점 클릭 영역 확대(현재 r=2.6은 너무 작음)

---

## 컨벤션 주의

### `[Claude]` / `[Codex]` footer 필수

### 가속 §6 흐름

- 큰 토픽 분할 후 자연스러운 후속 polish 진행
- ABSORB 시점 4 토픽 자체 판단

### 환경 변수 (api 측)

- `DWORKS_DEBUG_SCHEMA=1` / `DWORKS_LLM_TIMEOUT_MS` / `DWORKS_GENERATE_RETRIES` / `DWORKS_LLM_PROVIDERS`

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -30`
2. `git status` — worktree clean 확인
3. `cat docs/HANDOVER-2026-05-09-afternoon.md` (본 파일)
4. `cat docs/AUTONOMOUS.md`
5. `tail -20 .git/feed.log`
6. `lsof -i :3000 -i :3001`
7. polish 진행 — trend-click-target 또는 fixture-as-baseline

---

## 코드 스택 위치 빠른 참조

### 본 세션 변경

- `apps/web/src/app/`:
  - `image-color.ts` — mergeImageReferenceColors helper (pure)
  - `image-color.test.ts` — 5 case 추가
  - `page.tsx` — 통합 팔레트 카드 UI + sparkline y 라벨 column
- `packages/llm-prompts/src/`:
  - `index.ts` — mergeReferenceColors helper(mirror) + formatBriefAsUserPrompt 통합 팔레트 line + system prompt 가이드 7 규칙
  - `index.test.ts` — drift test 강화 + 통합 팔레트 case

[Claude]
