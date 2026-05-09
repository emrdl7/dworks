# 2026-05-09 m3-generate-prompt-style round 2 - Codex

> 결론: 방향 동의. 다만 현재 schema 이름과 system prompt 정책을 그대로 두면 examples가 유효하지 않거나 LLM에 상충 신호를 준다. 아래 보정 조건으로 round 4 코드 진행 가능.

## 합의

- `GENERATE_TREE_EXAMPLES` 3개에 노드별 스타일 prop을 넣어 첫 시안의 wireframe-feel을 줄인다.
- `packages/tree` / `apps/api` / `apps/web` schema 변경은 하지 않는다.
- 1차 example 수는 3개 유지. 도메인 추가는 후속으로 분리한다.
- `transition` / `transform` / `cursor` / `responsive`는 1차 제외한다.
- `typography`는 블로그 example의 본문 `lineHeight` 정도만 제한적으로 허용한다. round 1에서 제외라고 했지만 같은 문서에 `typography.lineHeight`가 목표로 들어 있어, 이 항목만 명시적으로 포함하는 편이 낫다.

## 구현 보정

1. schema 필드명을 정확히 맞춘다.
   - `color.gradient`가 아니라 `color.backgroundGradient`
   - `color.color`가 아니라 `color.textColor`
   - `spacing.padding` shortcut은 없음. `paddingTop` / `paddingRight` / `paddingBottom` / `paddingLeft`를 쓴다.
   - `layout.gap`은 없음. gap은 `spacing.gap`이다.
   - `shape.borderRadius`가 아니라 `shape.radius`
   - `shape.shadow.preset='lifted'`는 invalid. `shape.shadow: 'lg'` 또는 `'xl'`을 쓴다.
2. 현재 `GENERATE_TREE_SYSTEM_PROMPT`의 "스타일 prop은 사용자가 명시적으로 요청하지 않았다면 생략" 문장은 styled examples와 충돌한다. 이 한 문장은 아래 취지로 완화해야 한다.
   - 브리프나 도메인 시그니처가 명확하면 `color` / `spacing` / `shape` / `layout` / 제한적 `typography`를 최소 범위에서 사용한다.
   - 과한 장식은 피하고 구조와 콘텐츠를 우선한다.
   - 디자이너가 m2에서 자유 편집할 수 있도록 node-level 스타일을 과밀하게 넣지 않는다.
3. raw hex는 허용한다. `treeSchema`는 hex만 받으므로 token 문자열을 invent하면 안 된다. 대신 한 example 안에서 색 수를 2-4개 수준으로 제한한다.
4. 길이 가드는 1.6x로 충분하다. 단 구현 커밋에는 baseline 대비 examples block 길이 변화치를 적어야 한다.

## 테스트 기준

- 기존 `treeSchema.parse`와 prompt embed test는 유지한다.
- 신규 assertion은 "각 example에 style prop 1개 이상"보다 강해야 한다.
  - 각 example은 `color` / `spacing` / `shape` / `layout` / `typography` 중 최소 2개 범주를 가진다.
  - 3개 example 전체로는 `color`, `spacing`, `shape`를 반드시 커버한다.
  - DFS helper로 root와 descendants 전체를 검사한다.
- 가능하면 금지 필드명 회귀도 테스트한다. 예: serialized examples에 `"gradient"` 단독 key나 `"borderRadius"`, `"layout":{"gap"` 패턴이 들어가지 않도록 한다.

## 수락 기준 조정

- 필수: `pnpm --filter @dworks/llm-prompts test`
- 필수: `pnpm --filter @dworks/llm-prompts typecheck`
- 권장: `pnpm --filter @dworks/llm-prompts lint`
- `m3-eval --live`는 외부 provider와 API 상태에 의존하므로 round 4 acceptance gate로 두지 않는다. 실행 가능하면 evidence로만 남긴다.

## 미해결

없음. round 4에서 위 조건대로 `packages/llm-prompts`만 수정하면 된다.

[Codex]
