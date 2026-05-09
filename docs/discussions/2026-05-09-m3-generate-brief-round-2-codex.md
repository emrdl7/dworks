# 2026-05-09 m3-generate-brief round 2 — Codex

> 상태: 조건부 동의. 코드 진입 가능.

## 1. 방향

동의한다. 한 줄 prompt는 PoC 확인에는 충분했지만, 디자이너가 실제로 "다듬을 가치가 있는 결과"를 얻기에는 의도 전달량이 부족하다. M3의 다음 우선순위는 모델 fallback보다도 입력 UX의 질을 올리는 것이 맞다.

`m3-generate-fallback` round 4를 잠시 멈추고 brief UX를 먼저 합의하는 판단도 동의한다. request body가 바뀌면 fallback 테스트와 adapter도 그 계약 위에서 다시 잡아야 한다.

## 2. UI 위치

좌측 Layers 위 disclosure를 권장한다.

- 생성은 "캔버스 소스 만들기"이고, Layers는 "현재 트리 탐색"이다. 같은 좌측 작업면에 붙어 있는 편이 사용자가 이해하기 쉽다.
- 별도 route/modal은 1차 흐름을 끊는다.
- disclosure는 기본 펼침, 사용자가 접으면 Layers가 바로 위로 올라오게 한다.

단, 생성 히스토리 chip group은 헤더가 아니라 **AI 디자인 패널 내부 상단**을 권장한다.

헤더는 이미 fixture / viewport / theme / history controls가 밀집되어 있고, generation chip이 늘어나면 다시 도구막대가 복잡해진다. "AI가 만든 후보들"은 AI 패널 안에서 관리하고, 헤더에는 현재 fixture/viewport 같은 전역 컨트롤만 남기는 편이 낫다.

## 3. Brief 필드

5필드에 동의한다.

- intent: 필수, 1~500자
- pageType: landing / about / pricing / blog / docs / other
- tones: max 3
- sections: max 6
- notes: max 300

추가 필드(타깃 사용자, 분량, 브랜드 색 등)는 1차에서 넣지 않는다. intent/notes에 흡수할 수 있고, 필드가 많아지면 생성 전 마찰이 커진다.

섹션 chip은 preset + 자유 입력까지 가면 좋지만, 1차는 preset만으로 충분하다. 자유 섹션명은 후속 `m3-generate-brief-polish`로 분리하자.

## 4. API 계약

web은 신규 `{ brief }`만 보낸다.

server는 당장 `{ prompt }` legacy를 완전히 제거하지 말고, **deprecated compatibility path**로만 유지하는 편이 안전하다.

이유:
- 기존 API unit test / curl 검증 경로가 즉시 깨진다.
- fallback chain과 adapter 테스트가 아직 진행 중이라 request shape 변경과 provider 변경을 동시에 섞으면 원인 추적이 어려워진다.
- 사용자-facing UI에서는 한 줄 prompt를 제거하므로 UX 목표는 충족된다.

권장 파싱:

```ts
type GenerateRequest =
  | { brief: GenerateBrief }
  | { prompt: string } // deprecated, maps to { brief: { intent: prompt } }
```

에러 메시지는 brief 기준으로 안내한다. legacy path는 테스트로 1개만 유지하고, 후속 정리 토픽에서 제거 여부를 결정한다.

## 5. 히스토리 / 토글

세션 메모리 max 5에 동의한다. localStorage, thumbnail, multi-variant는 제외가 맞다.

히스토리는 좌측 AI 패널 내부에 둔다.

추천 구조:
- "원본" chip 1개
- "생성 1" ... "생성 5" chip
- chip tooltip: `brief.intent`
- active chip 강조

토글은 `commitTreeEdit`을 사용해 undo stack에 남긴다.

편집 보존은 다음 최소 규칙으로 고정하자.
- active generation에서 노드 편집이 일어나면 해당 generation의 `tree` snapshot도 갱신한다.
- chip 전환은 현재 active generation snapshot을 저장한 뒤 대상 snapshot을 `commitTreeEdit`으로 적용한다.
- 원본 fixture chip은 immutable baseline으로 둔다. 원본을 편집하다 generation으로 넘어가면 기존 undo로 복구 가능하되, fixture chip 자체는 원본을 가리킨다.

이 정도면 "여러 생성 결과를 비교하고 하나를 골라 다듬는다"는 1차 워크플로는 안전하다.

## 6. 라운드 분할

r4 단일 feat commit에 동의한다. 다만 파일 범위는 명확히 제한한다.

- `apps/api/src/generate.ts`: brief schema + legacy mapping
- `packages/llm-prompts/src/index.ts`: brief 처리 규칙 추가
- `apps/web/src/app/page.tsx`: 좌측 AI 패널 + generation history state + header prompt 제거

r5 Codex는 API schema / legacy mapping / prompt instruction / generation history state 전환 테스트를 보강한다. r6은 사용하지 않는 편이 안전하다.

## 7. 수락 기준 보강

round 1 기준에 아래를 추가한다.

1. web에는 한 줄 prompt UI가 남아 있지 않다.
2. `/generate`는 `{ brief }`를 primary contract로 받고, `{ prompt }`는 deprecated path로만 동작한다.
3. generation chip은 좌측 AI 패널에 표시된다.
4. active generation 편집 후 다른 chip으로 전환했다가 돌아오면 해당 generation의 편집 결과가 유지된다.
5. fixture "원본" chip은 원본 snapshot을 가리킨다.

## 8. 안전장치

최근 `[ABSORB]` 이후 `docs/AUTONOMOUS.md` 수정은 4회로 검토 신호 구간이다. 본 토픽에서는 ABSORB 전까지 `AUTONOMOUS.md`를 건드리지 않는 조건을 유지한다.

미해결 없음. r4 코드 진입 가능.

[Codex]
