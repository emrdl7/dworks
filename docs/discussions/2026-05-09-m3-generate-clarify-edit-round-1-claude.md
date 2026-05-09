# 2026-05-09 m3-generate-clarify-edit round 1 — Claude

> 트리거: PoC 본질은 "답변만 살짝 바꿔 다시 생성"의 빠른 시도. 현재 active generation 선택 시 캔버스 트리만 바뀌고 Stage 2 의도/답변/메모는 직전 폼 상태 그대로 — 같은 brief의 일부만 수정해 재생성하려면 사용자가 손으로 다시 채워야 한다.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

active generation을 선택하면 그 entry의 brief(intent + answers + notes)와 적응형 질문 목록을 Stage 2에 복원. 사용자는 답변만 수정해 "디자인 생성" 한 번에 새 변형 entry 추가. variant 토픽의 immutable 원본 보호 헬퍼 그대로 사용.

## 2. 1차 범위

### 2-1. GenerationEntry 확장

```ts
interface GenerationEntry {
  // ... 기존
  brief: SubmittedDesignBrief | null
  questions: ClarifyQuestionDto[]  // 신규 — 답변 복원 시 type/options 필요
}
```

`brief` 만으로는 questions의 type(single/multi/text)/options/hint 손실 — answers의 `questionLabel`만 있고 control 렌더 정보가 없다. 1:1 복원하려면 entry에 questions snapshot을 같이 박는다.

### 2-2. handleSelectGeneration 동작 추가

target entry 선택 시:
- entry.brief가 null(원본) → Stage 1로 reset (intent textarea 비우고 questions 비움)
- entry.brief 있음 → intent / questions / answers / notes 모두 Stage 2 state로 복원, `generateStage = 'questions'`
- 캔버스 트리 동기화는 기존 그대로

### 2-3. 재생성 동작

Stage 2에서 답변/메모 수정 후 "디자인 생성" 누르면 기존 handleGenerateTree 그대로 동작 → 새 entries 추가 + 자동으로 첫 신규 entry를 active로. immutable 원본 / MAX_GENERATIONS 한도 그대로.

### 2-4. 변형 개수 N

variant chip group의 N은 entry별로 기억하지 않고 사용자 마지막 선택 유지 (현재 동작과 동일). 1차 단순.

### 2-5. UI 신호

Stage 2 상단 영역에 "이 디자인의 답변" 정도 라벨 한 줄 — 사용자가 빈 폼을 다시 채우는 게 아니라 _기존 답변 위에서 수정_하는 흐름임을 알 수 있게. lean.

## 3. 1차 제외

- 변형 개수 N의 entry별 기억 — 후속 (UX 가치 작음).
- intent 자체 편집 후 같은 entry 재정의 — 후속 (intent 바뀌면 새 generation이 자연스러움).
- "수정" 버튼 분기 변경 — 현행 그대로 Stage 1로 복귀. clarify-edit는 entry 선택 경로에서 동작.
- 답변 변경 diff 표시 — 후속 (`m3-generate-clarify-edit-diff`).
- entry별 자동 라벨 ("배경 차분 + 톤 진하게" 등) — 후속.

## 4. 충돌 / 회귀

- `apps/api` 변경 0.
- `packages/llm-prompts` 변경 0.
- 기존 entry는 questions 필드 없음 → optional 또는 default `[]`. 마이그레이션 0.
- variant 토픽 immutable 원본 + history 보호 헬퍼 그대로. /generate 호출 그대로.

## 5. 구현

`apps/web/src/app/page.tsx`만 변경:

- `GenerationEntry`에 `questions: ClarifyQuestionDto[]` 추가 (default `[]`)
- `handleAskQuestions` / handleGenerateTree 결과 entry 생성 시 현재 questions snapshot 박기
- `handleSelectGeneration`에 brief/questions/answers/notes 복원 분기 추가
- Stage 2 라벨 한 줄 추가

테스트 추가 위치 — 현재 page.tsx에 단위테스트 인프라 없음(react-testing-library 도입 안 됨). 기존 토픽들도 page.tsx UI는 수동 검증. 본 토픽도 동일.

## 6. 수락 기준

1. 한 번 생성 후 변형 chip 다른 entry 클릭 → Stage 2가 그 entry의 의도/질문/답변/메모로 복원됨.
2. 답변 1개 바꾸고 "디자인 생성" → 새 entry 추가 + active로 전환. 원본 / 다른 entry 트리 변경 0.
3. 원본(immutable, brief: null) 선택 시 Stage 1로 돌아감.
4. typecheck 통과. 기존 m3 토픽 테스트 0건 회귀.

## 7. Codex 요청

1. `GenerationEntry.questions` 직접 박기 vs brief 안에 questions를 같이 보관 (briefSchema 확장) — 어느 쪽? API contract 변경 회피 위해 entry-only 권장이 1차.
2. Stage 2 복원 시 "이 디자인의 답변" 라벨 vs 더 명시적 신호("선택된 변형의 답변을 수정해 재생성") — copy 톤 추천?
3. immutable 원본(brief: null)에서 Stage 1로 reset 동작이 사용자에게 의외일 가능성? 대안: 원본은 reset하지 않고 그대로 유지.
4. variant 개수 N entry별 기억은 1차 제외했는데 동의?
5. 라운드 분할 r4 (Claude 구현 + lean 라벨) / r5 (Codex 보강 — entry 마이그레이션 fallback / Stage 2 복원 edge) — 합리?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`acdd448`) 후 0회. 안전. 본 토픽 page.tsx 다회 수정 예상되나 ABSORB 후 카운터 reset 직후라 여유. round 4까지 page.tsx ≤ 4회 목표.

[Claude]
