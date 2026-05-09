# 핸드오버 — 2026-05-09 정오 (m3 큰 토픽 image-ref-multi 4 분할 완성)

> 다음 Claude/Codex 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-morning.md` 후속.

---

## 즉시 읽어야 할 파일 (우선순위 순)

1. **본 파일** — 본 세션 누적 + 다음 우선순위
2. `docs/AUTONOMOUS.md` — mandate + §6 가속 흐름
3. `docs/DECISIONS.md` 부록 A — ABSORB 31까지 토픽 누적
4. 직전 핸드오버 `docs/HANDOVER-2026-05-09-morning.md` — catalog summary 시작점

---

## 현재 상태

### 자율 모드: Claude 단독 + 가속 §6 강화

- 사용자 신호: "이어가" — 큰 토픽 진입 위임
- 본 세션은 m3 mandate 큰 토픽 `image-ref-multi`를 4 분할로 안전하게 진입 (schema → UI → export-import → prompt)

### Mandate

- **M3 AI 생성 파이프라인** — 본 세션 4 토픽 추가 (image-ref-multi 분할)
- 큰 schema breaking 변경을 4 commit으로 분할해 단계별 검증 가능

### 마지막 ABSORB

ABSORB 31 (본 commit). 이후 미흡수 토픽 0.

---

## 본 세션 누적 (HANDOVER-morning 이후 4 commits + ABSORB 31)

### ABSORB 31 (본 commit) — image-ref-multi 4 분할

- `m3-generate-image-ref-multi-schema` (`e3ed0f5`) — llm-prompts + api + web persist 모두 ImageReference[] 지원. legacy single 호환. test 6
- `m3-generate-image-ref-multi-ui` (`5fe82eb`) — 좌측 패널 다중 슬롯 UI(MAX_IMAGE_REFS=3, 썸네일 grid + ✕ + multiple input). legacy single state 동기화 + persist 자동 마이그레이션
- `m3-generate-image-ref-multi-export-import` (`26d8127`) — export .json에 imageReferences 보존(1~3장). test 2
- `m3-generate-image-ref-multi-prompt-rich` (`ef05d8a`) — system prompt에 "## 참고 이미지 활용 가이드" 5 규칙. drift test 1

---

## 사용자 검증 영역 (검증 시 보아야 할 흐름)

### 다중 참고 이미지 end-to-end

1. 좌측 패널 "참고 이미지 (선택, 0/3)" — file input은 multiple 허용
2. 여러 이미지 선택 → 썸네일 grid 카드 (최대 3장), 각 카드에 색 chip + 비율 + ✕ 제거
3. "모두 지우기" 버튼 — 양쪽 state(legacy single + array) 비우기
4. /generate 호출 시 imageReferences[] 직렬화 (legacy imageReference 단일 fallback도 호환)
5. system prompt가 "참고 이미지 활용 가이드" 5 규칙으로 LLM에 다중 시드 종합 활용 지시
6. 응답 후 brief.imageReferences가 GenerationEntry에 저장 → export .json에 그대로 보존
7. 페이지 새로고침 시 persist v1 schema에서 imageReferences/Thumbnails array 키 우선, 없으면 legacy 단일 → array[0] 자동 마이그레이션

### legacy 호환

- 기존 v1 데이터(imageReference 단일 키만 있는 .json)도 완전 호환 — hydrate 시 array[0]로 변환
- 단일 사용자도 동작 동일 — multi 슬롯 UI에서 1장만 추가하면 기존과 같은 형식 직렬화

---

## 다음 우선순위 (자율 진행 시)

### 큰 토픽

1. **m3-generate-stream** — 스트리밍 응답 (vendor-specific, 어려움)
2. **m3-generate-eval-page-shell** — vision LLM judge (vision 의존)

### 작은~중간 polish

1. **m3-generate-image-ref-multi-color-merge** — 다중 image의 색을 가중 평균/병합해 단일 통합 팔레트 표시
2. **m3-generate-richness-trend-y-labels** — sparkline y축 0/0.5/1 작은 라벨
3. **m3-generate-prompt-fixture-as-baseline** — 사용자 fixture 트리를 reference로 prompt에 추가
4. **m3-generate-batch-import-summary-validate** — import 시 entries 재계산 vs payload summary 비교
5. **m3-generate-image-ref-multi-prompt-explicit-aspect** — aspectRatio 다른 다중 이미지의 우선순위 가이드

---

## 컨벤션 주의

### `[Claude]` / `[Codex]` footer 필수

### 가속 §6 흐름

- 큰 토픽은 4 분할(schema/UI/export/prompt)로 안전 진입 — 각 commit 검증 후 다음 단계
- ABSORB 시점은 큰 토픽 분할 완료 후 한 번에 정리

### 환경 변수 (api 측)

- `DWORKS_DEBUG_SCHEMA=1` / `DWORKS_LLM_TIMEOUT_MS` / `DWORKS_GENERATE_RETRIES` / `DWORKS_LLM_PROVIDERS`

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -30`
2. `git status` — worktree clean 확인
3. `cat docs/HANDOVER-2026-05-09-noon.md` (본 파일)
4. `cat docs/AUTONOMOUS.md`
5. `tail -20 .git/feed.log`
6. `lsof -i :3000 -i :3001`
7. 사용자 지시 없으면 polish 리스트 진행 — color-merge가 image-ref-multi 흐름의 자연스러운 후속

---

## 코드 스택 위치 빠른 참조

### 본 세션 변경

- `packages/llm-prompts/src/index.ts` — DesignBrief.imageReferences? + resolveImageReferences + formatBriefAsUserPrompt 다중 처리 + system prompt 활용 가이드 섹션
- `packages/llm-prompts/src/index.test.ts` — 5 case 신규
- `apps/api/src/generate.ts` — briefSchema.imageReferences? array(min1, max3)
- `apps/api/src/generate.test.ts` — 2 case 신규
- `apps/web/src/app/generation-storage.ts` — Persisted brief에 imageReferences/Thumbnails array + 검증
- `apps/web/src/app/generation-export.ts` — ExportedBrief.imageReferences? + validateBrief 검증
- `apps/web/src/app/generation-export.test.ts` — 2 case 신규
- `apps/web/src/app/page.tsx` — briefImageRefs/Thumbnails 배열 state, handleImageRefAddFiles/RemoveAt, multi 슬롯 UI grid, persist hydrate 마이그레이션, buildSubmittedBrief array 우선

[Claude]
