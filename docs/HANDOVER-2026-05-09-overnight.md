# 핸드오버 — 2026-05-09 새벽 (M3 export/풍부도 trend 5 토픽)

> 다음 Claude/Codex 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-late-night.md` 후속.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **본 파일** — 본 세션 누적 + 다음 우선순위
2. `docs/AUTONOMOUS.md` — mandate + §6 가속 흐름
3. `docs/DECISIONS.md` 부록 A — ABSORB 28까지 토픽 누적
4. 직전 핸드오버 `docs/HANDOVER-2026-05-09-late-night.md` — fixture catalog/history polish 시작점

---

## 현재 상태 (2026-05-09 새벽 KST)

### 자율 모드: Claude 단독 + 가속 §6 강화

- 사용자 신호 (본 세션): "사용자 신호 기다리지 말고 가속모드로 쭉쭉 나가" — 5+ 토픽 연속 진행 합의
- ABSORB 시점도 자체 판단(5 commit 도달 시 자연 정지에서 정리)

### Mandate

- **M3 AI 생성 파이프라인** — 본 세션 5 토픽 추가
- 본 세션은 export 메타(richness)/batch/trend 시각화 — 디자이너 review 흐름 강화

### 마지막 ABSORB

ABSORB 28 (본 commit). 이후 미흡수 토픽 0.

---

## 본 세션 누적 (HANDOVER-late-night 이후 5 commits + ABSORB 28)

### ABSORB 28 (본 commit) — 5 토픽 흡수

- `m3-generate-export-include-richness` (`e021847`) — export .json에 풍부도 메타(score + 8 신호 boolean). RICHNESS_SIGNAL_KEYS richness.ts로 단일 출처. validateRichness 검증. test 4
- `m3-generate-fixture-overwrite` (`30690d8`) — 같은 이름 user fixture 등록 시 confirm — 덮어쓰기(id 유지) vs 신규 추가 선택
- `m3-generate-export-batch` (`5a22b56`) — history 전체 .json batch (format 'dworks-generation-batch' v1). 단일과 format key 분리. richness 메타 자동 주입. test 7
- `m3-generate-richness-trend` (`2d5487c`) — chip group 위 inline SVG sparkline (W140 H28). 0.6 dashed 임계, 활성 강조, generations ≥ 2일 때만 표시
- `m3-generate-trend-tooltip` (`368e084`) — trend 점에 native title hover + onClick 시 handleSelectGeneration 전환

---

## 사용자 검증 영역 (검증 시 보아야 할 흐름)

### 1. export 메타 + batch (m3-generate-export-include-richness, export-batch)

- 단일 export(.json) 안에 `"richness": { score, ...8signals }` 메타 — 외부에서 그 시점 풍부도 즉시 파악
- 좌측 export/import 영역 "전체 내보내기" — 활성 history 전체를 한 .json batch로
- "batch 불러오기" — 단일 file input(multi 아님), entries 배열을 모두 새 mutable로 push
- format key로 single과 batch 분리 — 잘못 import해도 명확한 reason 안내

### 2. fixture catalog overwrite UX (m3-generate-fixture-overwrite)

- 같은 이름 fixture 발견 시 확인 dialog — OK면 기존 id 그대로 tree만 갱신(dropdown 안정), Cancel이면 신규 entry
- 사용자가 같은 이름을 의도적으로 다른 안으로 쓰는 경우(version A/B)도 보존
- fixture-rename으로 후처리 자유

### 3. 풍부도 trend 시각화 (m3-generate-richness-trend, trend-tooltip)

- chip group 위 작은 sparkline(W140 H28) — generations ≥ 2일 때만 표시
- 모든 entry computeRichnessReport.score 매핑, 0.6 dashed 임계 reference line
- 활성 entry 점은 r=2.6 진한 청록, 비활성은 r=1.6 dim
- 점 hover 시 native title `{userLabel ?? label} — {score}`, 클릭 시 해당 entry로 active 전환
- baseline immutable도 점수 계산해서 reference로 포함 (chip엔 점수 표시 X)

---

## 다음 우선순위 (자율 진행 시)

### 즉시 가능 (작은~중간)

1. **m3-generate-image-ref-multi** — 다중 참고 이미지(ImageReference[] schema 변경 + UI multi)
2. **m3-generate-fixture-batch-import** — fixture-export 안에 batch 형식? (현재 fixture-export는 catalog 다중 fixture 지원하므로 단일 형식으로 가능 — 별 필요 없음)
3. **m3-generate-richness-trend-immutable-marker** — sparkline에서 immutable baseline 점을 별도 마커(예: 마름모)로 강조

### 큰 토픽

1. **m3-generate-stream** — 스트리밍 응답. CLI batch 한계라 vendor-specific (Claude `--output-format stream-json` 등). 어려움
2. **m3-generate-eval-page-shell** — vision LLM judge로 페이지 골격 정량 측정. vision 의존
3. **m3-generate-fixture-export-include-richness** — fixture-export catalog에도 등록 시점 풍부도 메타 추가

---

## 컨벤션 주의

### `[Claude]` / `[Codex]` footer 필수

- 모든 commit 마지막에 작성자 마커. 자율 모드 watcher가 이로 작성자 식별
- ABSORB commit은 마지막 줄에 `[ABSORB]` (작성자 마커 추가 X)

### 가속 §6 + 본 세션 추가 신호

- 사용자: "사용자 신호 기다리지 말고 가속모드로 쭉쭉 나가" — Claude 자체 판단으로 5+ 토픽 연속 + ABSORB 시점도 자체 결정
- 큰 덩어리는 round 1 docs 생략 — `feat:` commit으로 직접 진입

### 환경 변수 (api 측)

- `DWORKS_DEBUG_SCHEMA=1` — schema-failure 시 server console에 issues + raw + sanitized json head
- `DWORKS_LLM_TIMEOUT_MS` — LLM CLI timeout (default 90s)
- `DWORKS_GENERATE_RETRIES` — schema/parse 422 자동 재시도 횟수 (default 1, NODE_ENV=test=0)
- `DWORKS_LLM_PROVIDERS` — provider chain (default claude,codex,gemini)

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -30` — 본 세션 + Codex 추가 커밋 확인
2. `git status` — worktree clean 확인
3. `cat docs/HANDOVER-2026-05-09-overnight.md` (본 파일)
4. `cat docs/AUTONOMOUS.md` — §6 정책 확인
5. `tail -20 .git/feed.log` — Codex 최근 활동
6. `lsof -i :3000 -i :3001` — dev process 살아있는지. 죽었으면 재시작:
   - `pnpm --filter @dworks/web dev`
   - `DWORKS_DEBUG_SCHEMA=1 pnpm --filter @dworks/api dev`
7. 사용자 지시 없으면 자율 진행 — image-ref-multi → trend-immutable-marker → fixture-export-include-richness 순으로 polish

---

## 코드 스택 위치 빠른 참조

### 본 세션 신규/변경 영역

- `apps/web/src/app/`:
  - `richness.ts` — RichnessSignalKey 타입 + RICHNESS_SIGNAL_KEYS 8 키 export
  - `generation-export.ts` — Batch 형식(EXPORT_BATCH_FORMAT_KEY) + ExportedGenerationBatch + buildExportBatchPayload + buildExportBatchFilename + parseImportBatchPayload + ExportedGeneration.richness?: RichnessReport
  - `generation-export.test.ts` — richness 4 + batch 7 case 추가
  - `page.tsx` — handleExportAllGenerations / handleImportGenerationBatchFile / handleSaveAsUserFixture overwrite 분기 / inline sparkline SVG / trend tooltip onClick

### 미변경 영역 (다음 토픽 후보)

- `apps/api/src/llm.ts` — stream 토픽 시 spawn pipe → SSE adapter 위치
- `packages/llm-prompts/src/index.ts` — imageReference 다중 시 prompt 갱신 위치
- `apps/web/src/app/image-color.ts` — image-ref-multi 토픽 시 활용

[Claude]
