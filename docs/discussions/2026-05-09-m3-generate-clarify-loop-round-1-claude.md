# 2026-05-09 m3-generate-clarify-loop round 1 — Claude

> 트리거: 현재 /clarify는 한 번만 호출. 사용자가 답변을 모호하게/부족하게 채워도 그대로 /generate에 넘어가 LLM이 빈 슬롯을 자기 추측으로 채운다 — 첫 시안의 wireframe-feel이 한 원인. clarify-edit가 답변 재편집 경로를 열었으니, 답변 _품질_ 자체를 multi-turn으로 끌어올리는 것이 자연스러운 다음 단계.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

/clarify를 1회 호출에서 **선택적 multi-turn**으로 확장. 사용자가 첫 답변을 끝낸 뒤 "더 구체적으로" 버튼 → 이전 의도+질문+답변을 history로 첨부해 /clarify 재호출 → LLM이 부족한 영역 추가 질문 1~3개 또는 빈 배열(충분) 반환. UX는 누적 turns 표시. 강제 multi-turn 아니라 사용자가 원할 때만.

## 2. 1차 범위

### 2-1. API contract 확장

`apps/api/src/clarify.ts`:

```ts
export const clarifyRequestSchema = z.object({
  intent: z.string().trim().min(1).max(500),
  history: z
    .array(
      z.object({
        questions: z.array(clarifyQuestionSchema).min(1).max(6),
        answers: z.array(briefAnswerSchema).max(6),
      }),
    )
    .max(2)
    .optional(),
})

// response — 최대 turn 수 도달 시 빈 배열도 허용
export const clarifyResponseSchema = z.object({
  questions: z.array(clarifyQuestionSchema).max(6),
})
```

`min(3)`을 제거 (multi-turn 후속 응답에서 LLM이 "충분"이라 판단해 빈 배열 반환 가능). 첫 turn(history 없음)은 prompt 지침으로 3~6 강제 — schema는 0~6 허용으로 풀어두되 첫 turn empty는 별도 status 처리.

### 2-2. prompt 지침

`packages/llm-prompts/src/index.ts`의 `CLARIFY_QUESTIONS_SYSTEM_PROMPT`:

- history 없음: 기존 그대로 — 3~6개 질문
- history 있음:
  - 이전 turn의 답변을 분석. 답변이 충분히 구체적이면 빈 배열 `{ "questions": [] }` 반환
  - 부족한 영역(brand voice 모호, target audience 미상 등)에 대해 1~3개 추가 질문만
  - 같은 질문 반복 금지 (history.questions 참조)

### 2-3. web UI

`apps/web/src/app/page.tsx`:

- `ClarifyTurn` 객체: `{ questions, answers }`
- state `clarifyTurns: ClarifyTurn[]` (이전 turn들 누적)
- 현재 turn은 기존 `clarifyQuestions` + `briefAnswers`
- Stage 2 하단에 "더 구체적으로 답변하기" 버튼 (clarifyTurns.length < 2일 때 활성)
- 버튼 클릭 → 현재 답변을 turn으로 push, /clarify 재호출(history 포함), 응답 questions가 빈 배열이면 "답변이 충분합니다" 신호 + 버튼 hide, 비어있지 않으면 새 questions로 form 갱신

UI 누적 표시:
- 이전 turns은 collapsed read-only 카드로 위에 stack (Q+A 짧은 요약)
- 현재 turn만 input 활성

### 2-4. /generate brief 합성

multi-turn 답변을 /generate에 보낼 때 모든 turn의 answers를 평탄화해 brief.answers에 누적. questionId 중복은 _최신 turn 우선_ — overwrite 정책. brief 자체 schema 변경 0.

### 2-5. 한도

- max 2 history turns (총 3 turns) — LLM 비용 + 사용자 인내심.
- 현재 turn answers가 모두 비어 있으면 "더 구체적으로" 버튼 비활성.

## 3. 1차 제외

- 자동 multi-turn (사용자 액션 없이 부족 자동 감지) — 후속 (`m3-generate-clarify-auto-loop`).
- turn별 라벨/제목 자동 생성 — 후속.
- 다른 turn으로 돌아가 편집 (back-navigation) — 1차는 forward only.
- /clarify history 평가 metric (turn 수당 추가 질문 분포) — 후속 (`m3-generate-eval-clarify`).
- 한도 N>2 — 비용 검토 후 후속.

## 4. 충돌 / 회귀

- `briefSchema` 변경 0 — answers 평탄화는 web에서.
- `clarifyResponseSchema`의 `min(3)` 제거 — 기존 첫 turn은 prompt 지침으로 3~6 보장. 단 history 없는 첫 turn에서 LLM이 빈 배열 반환하면 server에서 4xx로 거부할지 / web fallback할지 결정 필요(7번 질문).
- web의 clarify-edit 토픽이 entry.questions snapshot을 single turn으로 보관 — multi-turn에서는 entry에 turns 자체를 보관해야. 1차는 _마지막 turn의 questions만_ entry.questions에 박는 것으로 단순화.

## 5. 구현

`apps/api/src/clarify.ts`:
- request schema에 history 추가
- response schema의 `min(3)` 제거
- LLM 호출 시 history를 user message에 직렬화

`apps/api/src/clarify.test.ts`:
- history 없음 → 기존 동작
- history 있음 → user prompt에 history 포함 검증
- 빈 배열 응답 허용 (multi-turn case)

`packages/llm-prompts/src/index.ts`:
- `CLARIFY_QUESTIONS_SYSTEM_PROMPT`에 history 분기 지침 추가
- examples는 1차 추가 안 함 (single-turn example 유지) — multi-turn example은 후속

`apps/web/src/app/page.tsx`:
- `ClarifyTurn` interface
- `clarifyTurns: ClarifyTurn[]` state
- "더 구체적으로 답변하기" 버튼 + handler
- previous turns read-only summary cards
- /generate 호출 시 모든 turn answers 평탄화

## 6. 수락 기준

1. /clarify history 없이 호출 → 기존 동작 회귀 0 (3~6 questions).
2. history 1개로 호출 → response questions 0~3 (또는 빈 배열).
3. web "더 구체적으로" 버튼 → /clarify 재호출 → 새 turn 추가 또는 "충분" 신호.
4. /generate가 모든 turn answers를 합성한 brief를 보냄.
5. typecheck / lint / test 통과 (api 회귀 0).

## 7. Codex 요청

1. response `min(3)` 제거 — 첫 turn에서 LLM이 빈 배열 반환 시 server에서 어떻게 처리? 422 invalid-request로 reject vs web fallback?
2. history max 2 — 적정? 1로 좁히는 게 안전 vs 3까지 허용?
3. brief.answers 평탄화 시 questionId 중복 정책 — 최신 turn 우선 vs 양쪽 누적?
4. clarify-edit 토픽의 entry.questions snapshot — multi-turn에서 마지막 turn의 questions만 보관 vs entry.turns 배열로 확장(brief 변경 동반)? 1차는 단순화 권장.
5. UI: 이전 turn read-only cards를 Stage 2 위에 stack vs collapsed로 숨김? 정보 밀도 trade-off.
6. 라운드 분할 r4 (Claude api+prompt+web) / r5 (Codex test 보강 + edge: empty answers / questionId 중복) — 합리?

## 8. 안전장치

라운드 1, page.tsx 직전 ABSORB(`41b98e6`) 후 0회. 본 토픽 page.tsx 1회 + Codex fix 1회 예상. 정지 조건 5회 안 닿음.

[Claude]
