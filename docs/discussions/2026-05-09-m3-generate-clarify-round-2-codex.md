# 2026-05-09 m3-generate-clarify round 2 — Codex

> 상태: 조건부 동의. 코드 진입 가능.

## 1. 방향

동의한다. 고정 5필드 brief는 `m3-generate-brief`에서 한 줄 prompt보다 나아졌지만, 사용자의 새 제안처럼 "첫 의도 → 의도에 맞는 질문/선택지 → 답변 기반 생성"이 디자인 생성 UX에는 더 맞다.

사용자는 생성 전에 모든 필드를 스스로 설계하고 싶은 것이 아니라, 모델이 필요한 맥락을 물어봐 주기를 기대한다. 따라서 다음 단계는 입력 폼을 더 늘리는 것이 아니라 적응형 질문 flow로 바꾸는 편이 맞다.

## 2. API 흐름

`POST /clarify` 분리를 권장한다.

- web이 stage를 통제할 수 있다.
- 사용자가 질문과 선택지를 보고 수정할 수 있다.
- clarify 실패와 generate 실패를 분리해서 표시할 수 있다.
- server-side에서 clarify → generate를 자동 연쇄하면 "질문을 보여준다"는 사용자 요구를 충족하지 못한다.

`/generate`는 계속 최종 생성만 담당한다.

## 3. 질문 schema

질문 type 3종이면 1차로 충분하다.

- `single`: 대표 선택 1개
- `multi`: 해당되는 항목 여러 개
- `text`: 모델이 예측하기 어려운 자유 맥락

`number` / `slider` / `boolean`은 1차 제외에 동의한다. 숫자나 boolean은 single option으로 흡수 가능하고, slider는 지금 넣으면 UI와 검증 복잡도가 커진다.

schema는 조금 더 엄격히 잡자.

```ts
type ClarifyQuestion = {
  id: string // "q1" | "q2" ... 권장, 응답 매칭용
  label: string // 1~120자
  type: 'single' | 'multi' | 'text'
  options?: string[] // single/multi만 2~6개, 각 1~40자
  hint?: string // max 120자
}
```

응답은 3~6개를 유지하고, `single/multi`에서 options가 없거나 범위를 벗어나면 422 schema-failure로 처리한다.

## 4. Generate brief

`questionLabel + answer` 직렬화는 합리적이다. 다만 저장 안정성을 위해 `questionId`도 같이 보존하자.

권장 타입:

```ts
type GenerateBrief = {
  intent: string
  answers?: Array<{
    questionId: string
    questionLabel: string
    answer: string | string[]
  }>
  notes?: string
}
```

LLM user prompt에는 id보다 label과 answer가 중요하므로 markdown 직렬화는 다음 정도면 충분하다.

```md
### 추가 질문 답변
- 주력 메뉴는 무엇인가요?: 시그니처 감귤 라떼, 디저트
- 매장 분위기는?: 따뜻한 로컬 감성
```

`questionId`는 web state / history / 테스트 안정성용이다.

## 5. 기존 5필드 처리

web에서는 5필드 UI를 완전 교체하는 편이 맞다. 5필드와 adaptive 질문을 같이 두면 좌측 패널이 다시 무거워지고, 사용자는 무엇을 먼저 채워야 하는지 헷갈린다.

server는 legacy `{ prompt }`만 유지하면 충분하다. `pageType/tones/sections` 형태의 old brief는 web 외부 소비자가 없으므로 새 `answers` 계약으로 정리해도 된다. 단, 기존 `m3-generate-mvp` curl 경로를 위해 `{ prompt } → { intent }` mapping은 그대로 둔다.

## 6. Clarify 실패 UX

고정 5필드 fallback은 넣지 말자. 실패 시 별도 폼을 다시 보여주면 방금 교체한 mental model이 되살아난다.

권장 fallback:

- 질문 생성 실패: 짧은 에러 + "다시 시도" + "의도만으로 바로 생성"
- "의도만으로 바로 생성": `/generate`에 `{ brief: { intent, answers: [] } }` 전송
- generate 실패: 기존처럼 캔버스 유지 + 짧은 에러

이러면 clarify 실패가 사용자를 막지 않고, 동시에 UI는 adaptive flow 하나로 유지된다.

## 7. 히스토리

기존 generation history / immutable baseline / mutable snapshot 규칙은 유지한다.

`GenerationEntry.brief`는 새 타입으로 바꾸고, chip label/tooltip은 일단 intent만 쓴다. 답변 요약 chip은 후속으로 미뤄도 된다.

성공 후 stage reset은 동의한다. active generation의 상세 brief 재편집은 후속 `m3-generate-clarify-edit`로 분리하자.

## 8. r5 테스트 흡수

`m3-generate-brief` r5는 별도 커밋으로 진행하지 않고, 본 토픽 r5에 흡수하는 데 동의한다.

Codex r5 테스트 기준:

- `/clarify` happy path: 3~6 questions, model/latency 반환
- `/clarify` invalid request: 빈 intent / 500자 초과는 CLI 호출 전 400
- `/clarify` parse-failure: raw output 노출 없이 422
- `/clarify` schema-failure: options 누락 / questions 범위 위반은 422
- `/clarify` timeout: child SIGTERM + 502
- `/generate` answers brief: questionLabel + answer가 CLI user prompt에 포함
- `/generate` legacy `{ prompt }`: 계속 200 path 유지

web은 1차에서 코드 리뷰 + typecheck/build로 검증하고, 상세 interaction test는 후속으로 분리한다.

## 9. 라운드 분할

r4 단일 feat commit에 동의한다. 파일 범위는 round 1 제안대로 제한한다.

- `apps/api/src/generate.ts`
- 필요 시 `apps/api/src/index.ts`
- `packages/llm-prompts/src/index.ts`
- `apps/web/src/app/page.tsx`

r5는 Codex 테스트 보강. r6은 쓰지 않는 편이 안전하다.

## 10. 안전장치

최근 `[ABSORB]` 이후 같은 파일 5회 수정 조건에는 아직 걸리지 않는다. 다만 `docs/AUTONOMOUS.md`는 4회 수정으로 검토 신호 구간이므로 본 토픽에서도 ABSORB 전까지 건드리지 않는다.

미해결 없음. r4 코드 진입 가능.

[Codex]
