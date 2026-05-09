# 핸드오버 — 2026-05-09 밤 (M3 디자인 풍부도 사이클 + history 관리)

> 다음 Claude/Codex 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-evening.md` 후속.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **본 파일** — 본 세션 누적 + 다음 우선순위
2. `docs/AUTONOMOUS.md` — mandate + §6 가속 흐름
3. `docs/DECISIONS.md` 부록 A — ABSORB 25까지 토픽 누적
4. 직전 핸드오버 `docs/HANDOVER-2026-05-09-evening.md` — schema-resilience 핸드오프 시점

---

## 현재 상태 (2026-05-09 밤 KST)

### 자율 모드: Claude 단독 (Codex 제외)

- 사용자 신호 (밤): "코덱스를 일단 이 프로젝트에서 제외시켰으니 너 혼자 프로젝트 빠르게 구현 하고 마무리해... 나중에 검증하고 보완하는 과정에 재소환할게"
- 본 세션 후반부터 Codex 호출 없이 Claude 단독 진행
- 가속 §6은 보존 — 단독 모드에서도 큰 덩어리 commit 직후 즉시 다음 진입, ABSORB 시점은 묶음
- 직전 신호: "검증은 나중에 시간내서" / "커밋 할때 파일들 빠짐없게 해라"

### Mandate

- **M3 AI 생성 파이프라인** — 본 세션에 13+ 토픽 추가 입증 (직전 schema-resilience 마무리 후)
- 사용자 정정 흐름 직접 흡수: 휘발 방지 / SaaS-매거진 시각 / 풍부도 측정-시각화-정정 사이클 / 이미지 ref / export-import / 히스토리 보호 / fixture 등록

### 마지막 ABSORB

`9de88b5` (스물다섯번째 — 본 세션 두번째 ABSORB).
이후 `1cb2192` m3-generate-fixture-from-active은 _아직 ABSORB 안 됨_.

---

## 본 세션 누적 (HANDOVER-evening 이후 23 commits)

### ABSORB 23 (`9aba09a`) — 7 토픽 흡수

- m3-generate-persist (`bae7c89` Claude / `5566cc1` Codex r5 hydration ref→state)
- m3-generate-responsive-rendering / mobile-nav-collapse / prompt-visual-richness (3 commits) / schema-retry / prompt-strict-schema / schema-resilience (Codex 주도)
- 부수 fix: page-shell padding 정리, LLM timeout 90s, DWORKS_DEBUG_SCHEMA env

### ABSORB 24 (`4cf6578`) — 8 토픽 흡수

- m3-generate-prompt-saas-magazine-sections (`cd509f0`) — SaaS hero/features + 매거진 related
- m3-generate-eval-ai-slop (`833e3e5` Claude 5신호 / `ef4e558` Codex 8신호)
- m3-generate-richness-badge (`4b8c506` Claude / `5f77c11` Codex test)
- m3-generate-richness-warnings (`4b20052`)
- m3-generate-image-ref (`b500a53`) — vision 없이 색 hex 시드 LLM에 텍스트 전달
- m3-generate-image-ref-persist (`728bb39`)
- m3-generate-export-import (`c55825a`)
- m3-generate-richness-retry (`89a0dc3`)

### ABSORB 25 (`9de88b5`) — 5 토픽 흡수

- m3-generate-richness-auto-retry (`4e4f064`) — 토글 기반 자동 retry
- m3-generate-prompt-richness-checklist (`c09357b`) — system prompt 8 신호 자체 점검
- m3-generate-eval-richness-min (`19c583c`) — m3-eval --min-richness flag
- m3-generate-history-pin (`c67ca2d` Claude / `574ddc8` Codex r5 storage QuotaExceeded)
- m3-generate-multi-import (`d2faaa8`)

### ABSORB 26 — 2 토픽 흡수 (Codex 제외 후 Claude 단독)

- m3-generate-fixture-from-active (`1cb2192`) — 사용자 fixture catalog
- m3-generate-history-rename (`9ee5992`) — chip 더블클릭 사용자 라벨

---

## 사용자 검증 영역 (검증 시 보아야 할 흐름)

### 1. 휘발 방지 (m3-generate-persist + image-ref-persist)

- 페이지 새로고침 → generations + brief + clarify + autoRichnessRetry 토글 + 참고 이미지 모두 보존
- localStorage key: `dworks:m3-generate:v1`. 손상 / version mismatch / Tree schema 위반 시 조용히 무시 후 default 시작
- QuotaExceeded fallback: immutable + pinned generation만 남기고 active 정합 (Codex r5)

### 2. 풍부도 사이클 (8 신호 — ai-slop / richness)

- 신호: 랜드마크 / main 다중 섹션 / display H1(≥48) / CTA / fontSize 다양성(≥3) / 색 다양성(≥3) / 이미지 / shape 깊이
- chip에 0.00~1.00 점수 표시, 부족 신호 한국어 라벨 카드 표시
- "이 신호로 다시 시도" 명시 retry + "낮은 풍부도(<0.6) 시 자동 재시도" 토글 (default OFF)
- system prompt에 8 신호 자체 점검 섹션 추가 — LLM이 _첫 호출에서_ 자체 보강하도록
- m3-eval `--min-richness 0.6` 옵션으로 정량 측정

### 3. 히스토리 관리

- chip ★ 토글로 좋은 generation 보호 (max-6 trim에서 immutable과 함께)
- "내보내기"/"불러오기" .json (multi-import 지원)
- "fixture로 등록" 사용자 fixture catalog에 추가 → dropdown "내 fixture" optgroup

### 4. SaaS / 매거진 시각

- SaaS main: hero(다크 + 청록 accent + screenshot) + features(3-card grid) + pricing 풀세트
- 매거진 main: article + related grid(3 카드)
- system prompt examples block 약 800+라인

### 5. 참고 이미지 (m3-generate-image-ref)

- 좌측 패널 file input(점선 dashed, 5MB cap)
- web canvas dominant color 추출(quantize bucket) + aspectRatio
- brief.imageReference로 LLM에 텍스트 시그널 전달, raw hex 강제 X
- vision-LLM 의존 없음(기존 CLI provider chain 그대로)

---

## 다음 우선순위 (자율 진행 시)

### 즉시 가능 (작은~중간)

1. **fixture-from-active ABSORB** — `1cb2192` 한 토픽만 짧게 ABSORB 26으로 묶거나 다음 토픽들과 함께 묶음
2. **m3-generate-history-rename** — chip 라벨 사용자 정의(GenerationEntry.userLabel?, 더블클릭 인라인 input 또는 ⭐ 옆 ✏️)
3. **m3-generate-fixture-export-import** — 사용자 fixture를 .json으로 내보내기 / 가져오기 (별도 형식 또는 generation-export 재사용)

### 큰 토픽

1. **m3-generate-stream** — 스트리밍 응답. CLI batch 한계라 vendor-specific (Claude `--output-format stream-json` 등). 어려움
2. **m3-generate-eval-page-shell** — vision LLM judge로 페이지 골격 정량 측정. vision 의존
3. **m3-generate-fixture-export-format** — fixture catalog seeds/trees와 user fixtures 통합 export 형식

---

## 컨벤션 주의

### `[Claude]` / `[Codex]` footer 필수

- 모든 commit 마지막에 작성자 마커. 자율 모드 watcher가 이로 작성자 식별
- ABSORB commit은 마지막 줄에 `[ABSORB]` (작성자 마커 추가 X)

### 가속 §6 병렬 흐름 (2026-05-09 신규)

- Claude는 round 4 commit 후 즉시 다음 덩어리 진입. Codex r5 fix는 watcher 알리면 그때 흡수
- Codex는 fix/test/refactor commit으로 자유 보강 — r5 docs 없이 commit만 OK
- 한 토픽이 여러 commit으로 나뉘어도 OK. ABSORB 시점은 묶어서

### 사용자 신호 (본 세션)

- "쭉쭉 해 멈추지 말고" / "검증은 나중에 시간내서" — 자율 진행 가속
- "커밋 할때 파일들 빠짐없게 해라" — Codex 검증은 commit 시점 git tree 기준이므로 워크트리에 미커밋 변경 없게

### 환경 변수 (api 측)

- `DWORKS_DEBUG_SCHEMA=1` — schema-failure 시 server console에 issues + raw + sanitized json head
- `DWORKS_LLM_TIMEOUT_MS` — LLM CLI timeout (default 90s)
- `DWORKS_GENERATE_RETRIES` — schema/parse 422 자동 재시도 횟수 (default 1, NODE_ENV=test=0)
- `DWORKS_LLM_PROVIDERS` — provider chain (default claude,codex,gemini)

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -30` — 본 세션 + Codex 추가 커밋 확인
2. `git status` — worktree clean 확인 (Codex 검증 시 미커밋 변경 없게)
3. `cat docs/HANDOVER-2026-05-09-night.md` (본 파일)
4. `cat docs/AUTONOMOUS.md` — §6 정책 확인
5. `tail -20 .git/feed.log` — Codex 최근 활동
6. `lsof -i :3000 -i :3001` — dev process 살아있는지. 죽었으면 재시작:
   - `pnpm --filter @dworks/web dev`
   - `DWORKS_DEBUG_SCHEMA=1 pnpm --filter @dworks/api dev`
7. 사용자 지시 없으면 자율 진행 — fixture-from-active ABSORB 26 → 다음 큰 토픽

---

## 코드 스택 위치 빠른 참조

### 본 세션 신규 영역

- `apps/web/src/app/`:
  - `generation-storage.ts` (휘발 방지 — schema v1, 23 위치 누적)
  - `richness.ts` (8 신호 mirror)
  - `image-color.ts` (canvas color extraction)
  - `generation-export.ts` (.json export/import)
  - `user-fixtures.ts` (사용자 fixture catalog)
  - `page.tsx` — 모든 토픽이 합류, 약 11000+ 라인

- `apps/m3-eval/src/`:
  - `ai-slop.ts` (8 신호 pure tree walker, summary 풍부도 컬럼)

- `apps/api/src/`:
  - `sanitize.ts` (Codex 주도 schema-resilience)

- `packages/llm-prompts/src/`:
  - `index.ts` GENERATE_TREE_SYSTEM_PROMPT 약 750+라인 (page-foundations / 트렌드 / mapping / 풍부도 자체 점검 / examples + SaaS hero+features + 매거진 related)

### 미변경 영역 (다음 토픽 후보)

- `apps/api/src/llm.ts` — stream 토픽 시 spawn pipe → SSE adapter 위치
- `apps/web/src/app/responsive.ts` — viewport별 layout helper

[Claude]
