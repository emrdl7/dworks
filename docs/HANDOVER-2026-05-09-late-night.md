# 핸드오버 — 2026-05-09 늦은 밤 (M3 catalog/history polish 4 토픽)

> 다음 Claude/Codex 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-night.md` 후속.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **본 파일** — 본 세션 누적 + 다음 우선순위
2. `docs/AUTONOMOUS.md` — mandate + §6 가속 흐름
3. `docs/DECISIONS.md` 부록 A — ABSORB 27까지 토픽 누적
4. 직전 핸드오버 `docs/HANDOVER-2026-05-09-night.md` — Claude 단독 마무리 시작 시점

---

## 현재 상태 (2026-05-09 늦은 밤 KST)

### 자율 모드: Claude 단독

- 직전 사용자 신호 (밤): "코덱스를 일단 이 프로젝트에서 제외시켰으니 너 혼자 프로젝트 빠르게 구현 하고 마무리해... 나중에 검증하고 보완하는 과정에 재소환할게"
- 본 세션 신호: "이어가자" — 마지막 commit `0c8edc6` 이후 다음 큰 덩어리 진입 지시
- 본 세션은 fixture catalog 흐름 마감 + history UX polish + richness 사용성 보강

### Mandate

- **M3 AI 생성 파이프라인** — 세션 4 토픽 추가
- 사용자 정정 흐름 흡수 흐름은 fixture/history 보호 영역으로 자연 확장 (Claude 자체 우선순위 판단 — 사용자 mandate 안 남은 catalog UX 정리)

### 마지막 ABSORB

ABSORB 27 (본 commit). 이후 미흡수 토픽 0.

---

## 본 세션 누적 (HANDOVER-night 이후 4 commits + ABSORB 27)

### ABSORB 27 (본 commit) — 4 토픽 흡수

- `m3-generate-fixture-export-import` (`1fe7ff7`) — fixture catalog .json export/import (format 'dworks-fixtures' v1). adoptImportedFixtures가 import 시 새 id 발급해 catalog 충돌 회피, sanitize 빈 이름은 "가져온 fixture" 폴백. fixture-export.test 11
- `m3-generate-fixture-rename` (`afd6d81`) — user fixture 등록 후 이름 변경. renameUserFixture pure helper(빈 이름/id 미일치/같은 이름 시 원본 참조 유지로 렌더 안정). user-fixtures.test 4 추가
- `m3-generate-richness-detail-hint` (`9e1befb`) — 부족 신호 카드 li에 RICHNESS_RETRY_HINTS의 보강 hint 인라인. brief 없는 fixture 직후에도 디자이너가 m2 자유 편집으로 보강할 근거 제공
- `m3-generate-history-clear-mutable` (`e7ee124`) — mutable 생성 일괄 정리(immutable + pinned 보호). clearMutableEntries helper, "히스토리 정리 (N)" 버튼이 mutable 개수를 표시. generation-history.test 3 추가

---

## 사용자 검증 영역 (검증 시 보아야 할 흐름)

### 1. fixture catalog 단위 .json 휴대 (m3-generate-fixture-export-import)

- 좌측 패널 "fixture 내보내기" 버튼 → 전체 user fixtures 한 .json (format 'dworks-fixtures' v1)
- "fixture 가져오기" file input multiple → adoptImportedFixtures가 새 id 발급해 catalog 정합. 이름은 sanitize 거쳐 catalog 추가
- 잘못된 형식(format key/version/tree schema) 거부, 부분 실패 reason 누적해 generateError로 표시
- 단일 generation export(format 'dworks-generation')와는 별도 format — 두 import에 잘못 주입해도 format 키로 거부

### 2. fixture catalog UX (m3-generate-fixture-rename)

- 사용자 fixture 선택 시 "fixture 이름 변경" 버튼 표시 (삭제 옆)
- 등록 시 default 이름이 부적절하거나 의미 변경 시 즉시 수정
- pure helper로 분리 — 빈 이름/id 미일치/같은 이름 시 원본 참조 그대로 반환해 React 렌더 안정

### 3. 풍부도 액션 가능성 (m3-generate-richness-detail-hint)

- 부족 신호 카드 li에 라벨(굵게) + RICHNESS_RETRY_HINTS의 한국어 보강 hint(10px font-normal opacity-80)
- 자동 retry는 brief 필요(fixture 직후엔 brief null이라 disabled)였지만 hint 표시는 무관하게 동작 — 디자이너가 m2 자유 편집으로 직접 보강할 근거

### 4. 히스토리 정리 (m3-generate-history-clear-mutable)

- chip group 아래 "히스토리 정리 (N)" 버튼 — mutable 개수 표시, 0이면 disabled
- window.confirm 후 immutable + pinned 보호하고 mutable 일괄 제거
- active가 mutable이면 첫 protected entry로 자동 전환(tree/selectedNodeId/history past/future 정리, compareMode false)
- 베이지 destructive 톤(border-[#e7d6c1] bg-white text-[#7c5a2a])으로 의도 시각화

---

## 다음 우선순위 (자율 진행 시)

### 즉시 가능 (작은~중간)

1. **m3-generate-image-ref-clear** — 참고 이미지 제거 버튼. 이미 image-ref state는 있음, clear handler만
2. **m3-generate-fixture-overwrite** — 같은 이름 fixture 등록 시 덮어쓰기 vs 새 entry 선택
3. **m3-generate-export-include-richness** — export payload에 richness score/missing 신호 메타 추가 (디자이너 review 흐름)

### 큰 토픽

1. **m3-generate-stream** — 스트리밍 응답. CLI batch 한계라 vendor-specific (Claude `--output-format stream-json` 등). 어려움
2. **m3-generate-eval-page-shell** — vision LLM judge로 페이지 골격 정량 측정. vision 의존
3. **m3-generate-fixture-export-format-merge** — fixture seeds/trees와 user fixtures 통합 export 형식 (이번 세션의 fixture-export과는 별개 — _기본 fixture까지_ 포함하는 catalog dump)

---

## 컨벤션 주의

### `[Claude]` / `[Codex]` footer 필수

- 모든 commit 마지막에 작성자 마커. 자율 모드 watcher가 이로 작성자 식별
- ABSORB commit은 마지막 줄에 `[ABSORB]` (작성자 마커 추가 X)

### 가속 §6 병렬 흐름

- Claude는 round 4 commit 후 즉시 다음 덩어리 진입 (본 세션 fixture-export → fixture-rename → richness-detail-hint → history-clear-mutable 4 연속)
- Codex 부재 중이라 검증 round 5는 사용자 재소환 시점에 처리

### 환경 변수 (api 측)

- `DWORKS_DEBUG_SCHEMA=1` — schema-failure 시 server console에 issues + raw + sanitized json head
- `DWORKS_LLM_TIMEOUT_MS` — LLM CLI timeout (default 90s)
- `DWORKS_GENERATE_RETRIES` — schema/parse 422 자동 재시도 횟수 (default 1, NODE_ENV=test=0)
- `DWORKS_LLM_PROVIDERS` — provider chain (default claude,codex,gemini)

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -30` — 본 세션 + Codex 추가 커밋 확인
2. `git status` — worktree clean 확인
3. `cat docs/HANDOVER-2026-05-09-late-night.md` (본 파일)
4. `cat docs/AUTONOMOUS.md` — §6 정책 확인
5. `tail -20 .git/feed.log` — Codex 최근 활동
6. `lsof -i :3000 -i :3001` — dev process 살아있는지. 죽었으면 재시작:
   - `pnpm --filter @dworks/web dev`
   - `DWORKS_DEBUG_SCHEMA=1 pnpm --filter @dworks/api dev`
7. 사용자 지시 없으면 자율 진행 — image-ref-clear (작은) → fixture-overwrite → export-include-richness 순으로 polish

---

## 코드 스택 위치 빠른 참조

### 본 세션 신규/변경 영역

- `apps/web/src/app/`:
  - `fixture-export.ts` (신규) — 'dworks-fixtures' v1 catalog format
  - `fixture-export.test.ts` (신규) — build/parse/adopt 11 case
  - `user-fixtures.ts` — renameUserFixture helper 추가
  - `user-fixtures.test.ts` — rename 4 case 추가
  - `generation-history.ts` — clearMutableEntries helper 추가
  - `generation-history.test.ts` — clearMutable 3 case 추가
  - `page.tsx` — handleExport/ImportUserFixtures, handleRenameUserFixture, handleClearMutableHistory + 좌측 패널 UI 4 버튼

### 미변경 영역 (다음 토픽 후보)

- `apps/api/src/llm.ts` — stream 토픽 시 spawn pipe → SSE adapter 위치
- `apps/web/src/app/image-color.ts` — image-ref-clear 토픽 시 활용

[Claude]
