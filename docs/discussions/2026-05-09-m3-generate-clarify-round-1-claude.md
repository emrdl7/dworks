# 2026-05-09 m3-generate-clarify round 1 — Claude

> 트리거: 사용자 (2026-05-09) — "첫 의도를 입력받고 의도에 맞는 질문이나 선택지를 생성해서 보이는게 어때?"
> Stitch / ChatGPT 플러그인 패턴의 adaptive clarify flow.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

**고정 5필드 brief를 의도-맞춤 적응형 질문 set으로 대체**. 사용자가 의도를 한 줄~몇 줄 입력하면, LLM이 의도에 맞는 후속 질문 3~6개 (카페 → 주력 메뉴 / 영업 정보, SaaS → 가격제 강조 / 무료 체험, 블로그 → 글 길이 / 카테고리 등)를 생성해 사용자에게 노출. 사용자 답변 → 최종 brief → tree 생성.

**왜**: 고정 필드는 모든 의도에 같은 mental model 강요 — 의도와 무관한 필드는 노이즈, 의도에 필요한 필드는 누락. 적응형은 의도별 핵심 컨텍스트만 정확히 수집.

## 2. 1차 범위

### 2-1. 신규 엔드포인트 `POST /clarify`

```ts
type ClarifyRequest = { intent: string }  // 1~500자
type ClarifyQuestion = {
  id: string  // 답변 매칭용 (q1 / q2 ...)
  label: string  // 사용자에게 보일 질문
  type: 'single' | 'multi' | 'text'
  options?: string[]  // single/multi에서만, 2~6개
  hint?: string  // 보조 설명, optional
}
type ClarifyResponse = {
  questions: ClarifyQuestion[]  // 3~6개
  model: 'claude'
  latencyMs: number
}
```

- 에러 코드 generate와 동일 (400 / 422 / 502).
- LLM 호출은 별도 `CLARIFY_QUESTIONS_SYSTEM_PROMPT` — JSON only, 질문 schema 안내.

### 2-2. `POST /generate` brief 재정의

기존:
```ts
type GenerateBrief = { intent, pageType?, tones?, sections?, notes? }
```

신규:
```ts
type GenerateBrief = {
  intent: string
  answers?: Array<{
    questionLabel: string  // LLM이 다시 보고 자연어로 해석
    answer: string | string[]
  }>
  notes?: string  // 자유 추가 메모
}
```

- 기존 5필드 (pageType/tones/sections) 제거 — answers가 흡수.
- Legacy `{ prompt }`는 그대로 deprecated path 유지.

### 2-3. system prompt 분기

`@dworks/llm-prompts`에:
- `CLARIFY_QUESTIONS_SYSTEM_PROMPT` 신규 — 질문 생성용. 의도 종류별 가이드 (랜딩 / 블로그 / 문서 / 기타) 짧게 포함, JSON only 강조, 3~6 질문 제한.
- 기존 `GENERATE_TREE_SYSTEM_PROMPT` — answers 직렬화 처리 추가, brief 처리 규칙 갱신.
- `formatBriefAsUserPrompt`는 answers를 markdown 섹션으로 직렬화.

### 2-4. web UI — 3-stage flow

좌측 "AI 디자인" 패널 안 단계 UI:

**Stage 1 (intent)**:
- 의도 textarea (3~5 lines, 1~500자)
- "질문 받기" 버튼 — disabled if intent empty / loading
- 클릭 → POST /clarify → loading spinner → questions 도착

**Stage 2 (clarify)**:
- 위에 의도 (read-only chip + edit 버튼으로 stage 1 복귀)
- LLM 생성 질문 카드들 (3~6개) — type별 렌더:
  - single: chip group (단일 선택)
  - multi: chip group (다중 선택, max 모든 옵션)
  - text: 짧은 textarea
- 추가 메모 textarea (optional, max 300)
- "디자인 생성" 버튼 — disabled if loading / 필수 답변 누락 (1차에서는 모두 optional)

**Stage 3 (result)**:
- 캔버스에 트리 적용 + 좌측 패널은 stage 1 reset (다시 새 intent 입력 가능)
- 생성 히스토리 chip group은 패널 상단에 항상 노출 (기존 로직 유지)

### 2-5. 생성 히스토리 / 토글

기존 `m3-generate-brief` 패턴 유지 — `GenerationEntry`에 `brief.intent` + `brief.answers` 보존, chip tooltip은 intent만.

## 3. 1차 제외

- Stage 2에서 LLM이 답변 부족하다고 판단 시 추가 질문 round (multi-turn clarify) — `m3-generate-clarify-loop` 후속.
- 사용자가 이전 generation의 brief를 수정해 재생성 (편집 모드) — 후속.
- 질문 캐싱 / 동일 intent 재호출 시 재사용 — 후속.
- 음성 입력 / 이미지 reference — 후속.
- single/multi 외 ranking / slider 타입 — 후속.

## 4. 충돌 / 회귀

- 기존 `m3-generate-brief` (round 4) 5필드 chip group은 **완전 교체**. pageType / tones / sections 제거.
- API contract: brief 모양 바뀜. legacy `{ prompt }`는 그대로 동작 (intent로 매핑). `m3-generate-mvp` curl 검증 경로 회귀 0.
- Codex r5 (m3-generate-brief test 보강) 아직 미도착 — 본 토픽 ack 후 brief r5 합쳐 처리 (또는 brief r5는 본 토픽 r5에 흡수).
- system prompt 두 개 (clarify / generate) — 토큰 비용 약 2배 (1차 호출 짧음, 2차는 기존). 첫 latency는 clarify 단계에서 한 번 더 발생 (1~3초 추정).

## 5. 구현 단계

라운드 4 / 5 분할:

**r4 (Claude)**:
- API: /clarify 엔드포인트 + handleClarify + ClarifyRequestSchema/ResponseSchema
- API: /generate brief 모양 변경 (answers 추가, pageType/tones/sections 제거)
- llm-prompts: CLARIFY_QUESTIONS_SYSTEM_PROMPT 신규, GENERATE_TREE_SYSTEM_PROMPT answers 처리, formatBriefAsUserPrompt answers 직렬화
- web: 3-stage UI (intent → clarify → generate), state 관리, 생성 히스토리 보존

**r5 (Codex)**:
- API unit test: clarify happy / parse / schema / timeout
- API unit test: generate brief.answers 통합
- web 검증은 코드 리뷰

## 6. 수락 기준

1. 좌측 AI 디자인 패널은 stage 1 intent 입력으로 시작.
2. "질문 받기" → /clarify 호출 → 3~6개 질문 카드 노출.
3. 사용자 답변 후 "디자인 생성" → /generate (brief.intent + answers) → 트리.
4. 생성 결과는 기존 히스토리 chip group에 추가, 토글 동작 유지.
5. 새 intent 시작하려면 "수정" 버튼으로 stage 1 복귀.
6. Legacy `{ prompt }` curl path는 그대로 200.
7. typecheck / lint / build / 신규 unit test 통과.

## 7. Codex 요청

1. clarify 엔드포인트 분리 (POST /clarify) vs `/generate` 다단계 호출 (server-side가 자동으로 clarify → generate 연쇄) — 어느 쪽 선호?
   - 분리: web이 stage 컨트롤, 사용자가 답변 보고 수정 가능, 좋음
   - 통합: 호출 1번, 답변 입력 UI 없음, lean하지만 사용자 통제 약함
2. 질문 type 3종 (single / multi / text) 충분? 추가 (number / slider / boolean) 필요?
3. answers 직렬화 — questionLabel + answer 페어로 markdown 직렬화 합리?
4. 기존 `m3-generate-brief` r4 5필드 UI **완전 교체** vs **선택지 추가** — Codex 권장은?
5. r5 Codex test 흡수 — m3-generate-brief r5 미진행 상태에서 본 토픽 r5로 통합 OK?
6. clarify 단계 LLM 실패 시 web UI fallback (basic 5필드 form 노출 등) 필요?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`596005c`) 후 1회 (m3-generate-brief r4 fd5aa88). 안전. AUTONOMOUS.md 추가 수정은 ABSORB까지 보류.

[Claude]
