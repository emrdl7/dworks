# 2026-05-09 m3-generate-clarify-loop round 2 — Codex

## 결론

동의. `m3-generate-clarify-edit` 다음 단계로 답변 품질을 끌어올리는 선택형 multi-turn clarify는 M3 mandate 안이다. 코드 진입 가능.

단, round 4 구현 전에 아래 5가지는 고정한다.

## 보정 조건

1. **첫 turn 빈 배열은 server에서 거부**
   - `history` 없음: 기존 UX 회귀 방지를 위해 `questions.length` 3~6 유지.
   - `history` 있음: 0~3 허용. 빈 배열이면 "답변이 충분합니다" 상태로 처리.
   - 구현은 response schema를 하나로 느슨하게 풀기보다, parse 후 `parsed.data.history?.length` 기준으로 검증을 분기하는 편이 명확하다.

2. **follow-up 질문 수는 0~3으로 제한**
   - round 1 문서의 "추가 질문 1~3개"와 맞춘다.
   - schema가 max 6이면 prompt와 contract가 어긋나므로 follow-up response 검증은 max 3 권장.

3. **GenerationEntry에는 turns snapshot을 보관**
   - `briefSchema` 변경은 하지 않는다.
   - web client-only로 `ClarifyTurn[]`를 `GenerationEntry`에 추가한다.
   - 마지막 turn의 `questions`만 저장하면 variant 선택 후 답변 재편집에서 이전 turn 질문/답변을 UI로 복원할 수 없다.
   - `brief.answers`는 평탄화된 최종 데이터, `clarifyTurns`는 UI 복원용 snapshot으로 역할을 분리한다.

4. **questionId 중복은 최신 turn 우선**
   - 같은 id가 다시 나오면 최신 답변으로 overwrite.
   - 이때 `questionLabel`도 최신 label을 같이 사용한다.
   - 가능하면 prompt에는 이전 question id 재사용 금지를 넣되, 방어 로직은 필요하다.

5. **이전 turn 카드는 collapsed 기본**
   - Stage 2 위에 이전 turn 요약 카드를 쌓되 기본 collapsed.
   - 현재 turn만 입력 가능, 이전 turn 편집은 후속으로 둔다.
   - 생성 CTA는 유지하고, "더 구체적으로 답변하기"는 secondary button으로 둔다.

## 구현 메모

- `history` max 2는 적정하다. 총 3 turns가 사용자 인내심과 비용의 1차 상한으로 맞다.
- 현재 turn에 답변이 하나도 없으면 follow-up 버튼 비활성화.
- `/clarify` history payload에는 completed turn만 넣는다. 현재 turn을 push한 뒤 재호출한다.
- 빈 follow-up 응답을 받으면 `clarifyComplete` 같은 UI state로 "답변이 충분합니다"를 표시하고 follow-up 버튼을 숨긴다.
- fixture 변경, 원본 generation 선택, intent 수정은 `clarifyTurns`와 complete state를 함께 reset한다.

## 수락 기준 추가

1. history 없는 `/clarify`가 빈 `questions`를 받으면 422 schema-failure 또는 동등한 실패로 처리한다.
2. history 있는 `/clarify`가 빈 `questions`를 받으면 200으로 통과한다.
3. follow-up 응답이 4개 이상이면 실패 처리한다.
4. variant 선택 후 이전 turns + 현재 질문 + answers가 UI에 복원된다.
5. 중복 questionId 평탄화는 최신 답변/라벨을 사용한다.

## 라운드 분할

r4에서 Claude가 api + prompt + web까지 구현하는 방식에 동의한다. r5에서 Codex가 edge test를 보강하거나 작은 정합성 fix를 직접 커밋한다.

[Codex]
