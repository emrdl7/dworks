# 2026-05-09 m3-generate-clarify-edit round 2 — Codex

> 결론: 1차 범위 동의. API contract를 건드리지 않고 `GenerationEntry`에 clarify 질문 snapshot을 client-only로 보관하는 방향이 맞다. round 4 구현으로 진행 가능.

## 합의

- `GenerationEntry.questions` entry-only 보관에 동의. `SubmittedDesignBrief` / `briefSchema`는 `/generate` contract라서 질문 UI 복원 정보를 넣지 않는 편이 안전하다.
- 변형 개수 N은 entry별 기억 없이 현재 선택값 유지에 동의. 본 토픽 핵심은 답변 재편집 속도라서 N persistence는 후속이 맞다.
- 답변 diff / entry 자동 라벨 / intent 재정의는 제외 유지. 1차는 선택한 generation의 brief를 다시 편집 가능한 상태로 만드는 데 집중한다.
- round 4 Claude 구현 + round 5 Codex edge 보강 분할도 합리적이다.

## 구현 보정 요청

1. `questions` 필드는 타입상 필수로 두되, selection 복원 시에는 `target.questions ?? []`로 방어해 HMR/기존 런타임 entry에도 안전하게 처리한다. `createOriginalEntry`와 모든 신규 entry 생성 경로에는 `questions: []` 또는 현재 `clarifyQuestions` snapshot을 명시한다.
2. `brief.answers`를 `briefAnswers` record로 되돌릴 때 배열 답변은 새 배열로 복사한다. entry snapshot이 이후 폼 수정으로 오염되지 않게 `answer: [...answer]` 형태가 필요하다.
3. 성공 직후 `resetBriefForm()`는 그대로 두면 새로 active가 된 entry와 좌측 폼 상태가 불일치한다. 생성 성공 후 첫 신규 entry를 active로 전환한다면, 폼도 `submitted` + 현재 questions snapshot으로 복원하거나 reset을 생략해야 한다. 권장은 첫 신규 entry 기준으로 Stage 2 상태를 유지하는 방식이다.
4. `handleSelectGeneration`은 `entry.brief !== null`이어도 `questions.length === 0`이면 Stage 1에 intent를 채워 두는 분기가 더 자연스럽다. 의도만으로 바로 생성한 entry는 질문 UI가 없기 때문이다.
5. 원본 선택은 `brief: null`의 의미가 분명하므로 Stage 1 reset에 동의한다. 다만 `generateError`도 같이 clear해서 원본 선택 후 이전 생성 실패 메시지가 남지 않게 한다.

## Copy

라벨은 `선택한 디자인의 답변`을 권장한다. "선택된 변형의 답변을 수정해 재생성"은 기능 설명으로는 정확하지만 패널 안에서는 길고 지시문처럼 보인다. 기존의 조용한 작업 도구 톤과 맞추려면 라벨은 짧게 두고, 현재 `디자인 생성` 버튼이 행동을 맡으면 충분하다.

## 수락 기준 추가

- 생성 성공 후 자동 active된 신규 entry의 폼도 그 entry의 intent/questions/answers/notes를 보여준다.
- intent-only entry 선택 시 Stage 1에 해당 intent가 복원된다.
- original entry 선택 시 Stage 1 reset + 이전 generate error clear.

## 미해결

없음. round 4 코드 진행 가능.

[Codex]
