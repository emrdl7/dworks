# 2026-05-09 m3-generate-mvp round 1 — Claude

> 트리거: 2026-05-09 mandate (AI 생성 파이프라인 — M3 트랙). m3 트랙 첫 토픽.
> 상태: 1차 범위. **Mandate change** — 가속 §3 routine 자체합의 밖. Codex round 2 정식 검토 + 사용자 ack 필요.

## 1. 목표

PoC 본질을 입증하는 **end-to-end 1차 사이클**: 사용자 prompt → LLM → tree JSON → 캔버스 즉시 적용 → m2 자유 편집으로 다듬기.

현재 stub 상태:
- `apps/api/src/index.ts` = 14줄 health check만
- `packages/llm-prompts/src/index.ts` = `PACKAGE_NAME` export만
- web에 prompt → tree 호출 경로 없음

## 2. 1차 범위

### 2-1. API 엔드포인트 (`apps/api`)

- POST `/generate` 추가
- body: `{ prompt: string }` (zod 검증, prompt 1~500자)
- 처리:
  1. system prompt + user prompt → Claude Code CLI 1순위 호출 (`claude -p` headless)
  2. stdout JSON 파싱
  3. `treeNodeSchema.safeParse` 검증
  4. 성공 → `{ tree, model: 'claude', latencyMs }`, 실패 → 4xx + 명시 사유
- 1차는 **Claude CLI 단일 어댑터**만. Codex / Gemini fallback은 후속 토픽.
- 30초 timeout, CLI 종료 코드 ≠ 0 → 502.

### 2-2. system prompt (`packages/llm-prompts`)

- `generateTreeSystemPrompt` 신규 export
- 내용: TreeNode 8 종류 enum / id 형식 / editKind / 필수 prop / 예시 트리 1개
- 1차는 lean (200~300줄 이내). 풍부한 prop 옵션 (style/typography 등)은 후속.

### 2-3. web UI (`apps/web`)

- 헤더에 "새 디자인 생성" 입력 + 버튼 (기존 fixture switcher 옆)
- 버튼 클릭 → POST `/generate` → 응답 트리 → 기존 fixture-loader 적용 경로 재사용
- 로딩 / 에러 상태 표시 (간단 toast 또는 status text)
- 생성 결과는 undo stack에 push (기존 m2-edit-undo 활용 — 디자이너가 즉시 m2 자유 편집 가능)

### 2-4. 검증

- `apps/api` test: mock CLI spawn으로 happy-path + parse 실패 / timeout 분기 unit test
- web 통합은 코드 리뷰 + 수동 (`pnpm dev`로 확인)
- `@dworks/tree test`, `@dworks/tree-editor test`, `@dworks/api test`, `web lint`, root `typecheck`, root `build` 통과

## 3. 1차 제외

- Codex / Gemini fallback (`m3-generate-fallback` 후속)
- 프롬프트 최적화 / few-shot examples / chain-of-thought (`m3-generate-prompt-uplift`)
- 재현성 평가 / D8 baseline 비교 (`m3-generate-eval`)
- 스트리밍 응답 (CLI는 batch return)
- 이미지 reference 입력
- 트리 재생성 / 변형 (`m3-generate-variant`)
- 인증 / rate limit (PoC stage)

## 4. 충돌 / 회귀

- 기존 fixture-loader 적용 경로 영향 0 — 동일 entry point에 LLM 결과 push.
- m2 편집 / undo / responsive-preview 모두 _생성된 트리에도 동작_ — 검증 대상.
- API 신규 endpoint — 기존 `/health` 영향 0.
- `treeNodeSchema` 변경 0 — LLM이 schema에 맞추지 못할 시 4xx (실패는 사용자에게 노출).

## 5. 구현 단계

라운드 4 / 5 / 6 으로 분할 (가속 §1 lean):
- 라운드 4 (Claude feat): API endpoint + llm-prompts + Claude CLI 어댑터
- 라운드 5 (Codex test 또는 직접 feat): unit test (CLI mock)
- 라운드 6 (Claude feat): web UI

각 라운드는 별도 commit. 너무 커지면 추가 round 분할.

## 6. 수락 기준

1. `curl -X POST localhost:3001/generate -d '{"prompt":"히어로 섹션이 있는 카페 랜딩 페이지"}'` → 유효 tree JSON 반환.
2. 응답 트리가 `treeNodeSchema.safeParse` 통과.
3. web 헤더에 "새 디자인 생성" 입력 + 버튼.
4. 버튼 클릭 → 캔버스에 트리 적용 → 디자이너가 m2 자유 편집 가능.
5. CLI 실패 / parse 실패 / timeout 시 명시 에러 노출 (사용자가 원인 파악 가능).
6. typecheck / lint / build / 신규 unit test 통과.

## 7. Codex 요청

**Mandate change 검토**:
1. M2 트랙 mandate 충분 도달 평가 동의 (8 영역 100% + 35+ 후속)? 추가 m2 polish는 m3 진척 후 재평가하는 정책 OK?
2. M3 트랙 진입 — `m3-generate-mvp` 첫 토픽 spec 동의?

**구현 spec 검토**:
3. POST `/generate` body / response 형태 OK? `latencyMs` / `model` 메타 포함이 1차에 필요?
4. Claude CLI 단일 어댑터 1차, Codex / Gemini fallback 후속 분리 — 동의?
5. system prompt 200~300줄 제약 합리? 더 긴 게 안전?
6. web UI 위치 — 헤더 입력 + 버튼 (기존 fixture switcher 옆) vs 별도 modal — 어느 쪽 선호?
7. 라운드 4/5/6 분할 — 합리?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`39cd726`) 후 0회. 안전. **Mandate change**라 Codex round 2 후 사용자 ack 필요.

[Claude]
