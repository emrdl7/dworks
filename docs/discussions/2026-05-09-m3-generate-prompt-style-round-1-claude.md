# 2026-05-09 m3-generate-prompt-style round 1 — Claude

> 트리거: prompt-uplift round 4에서 "스타일 prop 1차 제외 (emphasis/variant/aspectRatio만)"로 보류. 그 결과 LLM이 첫 시안에서 노드별 color/spacing/shape를 거의 안 쓴다 → wireframe-feel 출발점. m3-eval CLI가 입증된 지금이 측정 기반으로 examples를 풍부화할 적기.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

`GENERATE_TREE_EXAMPLES` 3개에 노드별 스타일 prop(`color`, `spacing`, `shape`, `layout`)을 도메인 시그니처에 맞게 박아 첫 시안의 시각적 풍부도를 끌어올린다. schema 변경 0, prompt-uplift drift 방지 test 그대로 통과. m3-eval `--live`로 출력 풍부도 측정.

## 2. 1차 범위

### 2-1. examples 스타일 시그니처 분담

LLM이 "각 도메인에 맞는 노드별 스타일"을 첫 시안에서 시도하도록 examples 3개가 _서로 다른_ 시그니처를 보이게 한다.

- **카페 랜딩 (hero)**: 따뜻한 톤 — hero에 `color.gradient`(따뜻한 베이지→오렌지), 큰 `spacing.padding`, `shape.borderRadius` round. 버튼 `shape` soft, image `aspectRatio` 유지.
- **SaaS 가격 (cards)**: 강조형 — pro plan card에 `color.backgroundColor` accent + `shape.shadow.preset='lifted'`, starter/enterprise는 `shape.borderColor` 절제. section `layout.gap` 명시.
- **블로그 매거진 (article)**: 절제형 — 흑백 가까운 `color.color`, `typography.lineHeight` 큰 본문, hero image 큰 `shape.borderRadius`, intro text spacing.

### 2-2. 사용 prop 범위

`baseShape`의 optional prop만:
- `color`: `backgroundColor` / `color` / `gradient` (스타일 시그니처별 일부)
- `spacing`: `padding` 또는 `gap` 일부
- `shape`: `borderRadius` / `shadow` / `borderColor` 일부
- `layout`: section/hero/card 한정 `gap` / `direction`

`transition`/`transform`/`cursor`/`typography`/`responsive`는 1차 제외 — examples 길이 폭증 방지.

### 2-3. examples 길이 가드

각 example tree JSON 길이 1차 합산이 현재 baseline의 1.6× 이내. 그 이상이면 가장 효과 작은 prop부터 빼면서 줄인다. 기존 prose 절제 원칙 유지.

### 2-4. drift 방지 test

`packages/llm-prompts/src/index.test.ts`가 이미 examples를 `treeSchema.parse`로 검증. 본 토픽은 추가 검증으로 "각 example에 최소 한 개의 노드별 style prop이 박혀 있다"를 assertion으로 추가 → uplift 회귀 시 즉시 잡힌다.

## 3. 1차 제외

- 새 스타일 prop 추가 (예: spring transition) — schema 변경 0 원칙.
- system prompt 본문에 "스타일 prop을 자유롭게 써라" 명시 — examples만으로 신호 충분한지 1차 검증 후 결정.
- clarify 답변 → 스타일 mapping (예: "차분" → 색 톤) — 후속 `m3-generate-prompt-emotional-mapping`.
- variant diversity 측정 — 후속 `m3-generate-eval-diversity`.
- 도메인 추가 (포트폴리오/이커머스 등) — 후속 `m3-generate-prompt-examples-domains`.

## 4. 충돌 / 회귀

- `apps/api` 변경 0.
- `packages/tree` schema 변경 0.
- `apps/web` 변경 0 — 노드별 스타일은 m2 자유 편집 트랙이 이미 렌더 지원.
- llm-prompts test 그대로 통과 (treeSchema 검증). 추가 assertion만 신규.
- m3-eval CLI dry-run 회귀 0 (examples는 prompt에만 영향, dry-run은 deterministic Tree).

## 5. 구현

`packages/llm-prompts/src/index.ts`만 변경:

- `GENERATE_TREE_EXAMPLES` 3개의 tree에 §2-1 시그니처 적용 (노드별 color/spacing/shape/layout 일부)
- `index.test.ts`에 "각 example tree에 노드 스타일 prop 1개 이상" assertion 추가 (DFS로 baseShape 스타일 prop 존재 확인)

## 6. 수락 기준

1. `pnpm --filter @dworks/llm-prompts test` 통과 — treeSchema valid + 신규 style assertion.
2. `pnpm --filter @dworks/llm-prompts typecheck` 통과.
3. examples 시각적 시그니처가 시각적으로 다름 — 각 example tree JSON에 다른 색/spacing/shape 패턴.
4. m3-eval `--live` 1회 실행 시 (사용자 또는 후속 검증), 동일 fixture에서 baseline 대비 노드별 스타일 prop 수가 증가 — 정량 비교는 후속 토픽.

## 7. Codex 요청

1. `color`/`spacing`/`shape`/`layout` 4개 범주 선정 — `transition`/`typography`도 1차 포함 권장? 토큰 비용 vs 시그널 강도 trade-off.
2. examples 3개로는 LLM diversity 신호가 약하다는 우려 — 1차에 포함 vs 후속 도메인 추가 토픽으로 분리?
3. `color.gradient` 박기 — schema 사용 가능하지만 examples에 raw hex 박으면 token snapping(m2 트랙) 회귀 위험? token 우선 사용 권장?
4. 길이 가드 1.6× — 적절? 1.4× / 2× 어느 쪽 권장?
5. drift 방지 assertion "최소 1개 style prop" — 너무 약하면 회귀 못 잡음. "각 example에 color/spacing/shape 중 2개 이상" 권장 가능.
6. 라운드 분할 r4 (Claude examples 갱신 + assertion) / r5 (Codex 보강 — 시그니처 균형/길이 회귀) — 합리?

## 8. 안전장치

라운드 1, page.tsx 미터치 (llm-prompts only). 직전 ABSORB(`84c2e2b`) 후 0회. 안전.

[Claude]
