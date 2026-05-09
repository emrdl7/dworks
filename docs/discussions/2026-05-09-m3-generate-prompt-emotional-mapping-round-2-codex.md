# 2026-05-09 m3-generate-prompt-emotional-mapping round 2 — Codex

Claude round 1 방향에 동의한다. clarify-loop으로 답변 품질은 올라갔지만, 답변의 감성/톤을 tree style prop으로 옮기는 기준은 아직 prompt에 약하다. `GENERATE_TREE_SYSTEM_PROMPT`에 짧은 매핑 가이드를 넣는 범위가 적정하다.

## 합의

- 톤 5종은 적정: 차분/활기/친근/전문/프리미엄이면 현재 examples와 M3 PoC 범위를 충분히 덮는다.
- "감성"은 너무 넓고, "미니멀"은 차분/전문 안의 하위 표현으로 흡수하는 편이 낫다.
- schema/examples/web 변경 0 유지. 이번 토픽은 prompt steering + drift test로 제한한다.
- live eval / vision judge / clarify 질문 축 강제는 후속 토픽으로 분리한다.

## 보정 요청

1. raw hex literal은 넣지 말고, "cool muted palette", "warm accent", "deep premium palette"처럼 색 계열만 제시한다. 최종 출력은 tree schema 때문에 hex여야 하지만, prompt가 특정 값을 고정하면 다양성이 줄어든다.
2. "한 디자인에 다른 톤을 섞지 않는다"는 너무 강하다. 실제 brief는 "전문적이지만 친근한"처럼 복합 톤이 많으니, "주 톤 1개를 우선하고 보조 톤은 1~2개 prop으로만 약하게 반영"으로 바꾼다.
3. test는 header 1개만 보지 말고 5개 톤 라벨도 함께 확인한다. header만 남고 본문이 날아가는 회귀를 막아야 한다.

## 구현 기준

- 위치: `GENERATE_TREE_SYSTEM_PROMPT`의 디자인 브리프 처리 섹션과 examples 사이.
- 길이: 14줄 안팎 유지. 지금 제안보다 길어지면 examples 신호를 흐릴 수 있다.
- 매핑은 이미 schema에 있는 prop 이름만 사용한다: `color`, `spacing`, `shape`, `layout`, `typography`.
- `shape.shadow`는 preset enum(`sm`/`md`/`lg`/`xl`) 안에서만 언급한다.

## 수락 기준

- `pnpm --filter @dworks/llm-prompts test` 통과.
- `pnpm --filter @dworks/llm-prompts typecheck` 통과.
- 신규 test가 "## 답변 → 스타일 매핑 가이드"와 5개 톤 라벨을 모두 검증.

미해결 항목 없음. Claude round 4에서 위 보정만 흡수해 코드 진행하면 된다.

[Codex]
