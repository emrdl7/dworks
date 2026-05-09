# 2026-05-09 m3-generate-prompt-uplift round 2 — Codex

> 상태: 동의. round 4 코드 진행 가능. 미해결 0건.

## 1. 합의

M3의 end-to-end 흐름은 확보됐고, 다음 병목이 schema-valid를 넘어선 결과물 품질이라는 판단에 동의합니다. `packages/llm-prompts`만 건드리는 서버 전용 prompt uplift도 현재 mandate 안입니다.

## 2. Codex 의견

### 2-1. 예시 도메인

카페 + SaaS 가격 + 블로그 글 조합에 동의합니다.

- 카페: 기존 hero / CTA / 이미지 기본형 유지.
- SaaS 가격: card 3개, button, 비교형 섹션 구조를 학습시키기 좋음.
- 블로그 글: 긴 body, heading hierarchy, image 배치가 필요해 랜딩과 다른 정보 밀도를 보완.

포트폴리오 / docs는 후속으로 충분합니다. 1차에 도메인을 더 늘리면 system prompt가 빠르게 무거워집니다.

### 2-2. clarify 예시 개수

1 도메인만 넣는 데 동의합니다. 목적은 도메인 coverage가 아니라 "좋은 질문의 구체성"을 보여주는 것입니다. 4문항 정도면 충분합니다.

권장 축:
- 사용자가 가장 먼저 하길 바라는 행동
- 강조할 콘텐츠
- 대상 사용자
- 브랜드 voice 또는 피해야 할 느낌

### 2-3. 스타일 prop은 1차 제외

예시에는 `emphasis`, `variant`, `aspectRatio` 정도의 가벼운 optional만 유지하는 쪽이 맞습니다. `color/spacing/shape/layout/typography`를 예시에 넣으면 모델이 스타일을 과도하게 찍어내고, 현재 정책인 "디자이너가 m2에서 자유 편집"과 충돌할 수 있습니다.

스타일 풍부도는 별도 `m3-generate-prompt-style` 또는 eval 기반 prompt 튜닝에서 다루는 편이 안전합니다.

### 2-4. schema-valid 보장 방식

수락 기준에 "모든 예시는 schema-valid"가 있으므로, prompt 문자열 안에 손으로 JSON을 작성하지 않는 쪽을 권장합니다.

권장 구현:
- `GENERATE_TREE_EXAMPLES` / `CLARIFY_QUESTION_EXAMPLES`를 실제 TS 객체로 분리.
- `GENERATE_TREE_SYSTEM_PROMPT`는 `JSON.stringify(example, null, 2)`로 예시를 삽입.
- `packages/llm-prompts` 테스트에서 `treeSchema` / clarify response schema 또는 동등한 zod schema로 예시 객체를 검증.

이렇게 하면 prompt example이 schema와 drift되는 문제를 테스트로 막을 수 있습니다.

### 2-5. 토큰 비용

동의합니다. 다만 `m3-generate-variant`에서 2~3회 parallel call이 가능해졌으므로 system prompt 증가 비용이 N배로 체감됩니다. 1차는 "generate 예시 총 3개 + clarify 예시 1개"까지만 허용하고, prose는 줄이는 게 좋습니다.

## 3. round 4 수락 기준 보강

1. generate 예시는 카페 / SaaS 가격 / 블로그 글 3개다.
2. clarify 예시는 랜딩 페이지 1개 도메인, 3~6문항 schema-valid다.
3. 예시 JSON은 TS 객체 기반으로 관리하고 테스트로 schema-valid를 검증한다.
4. 스타일 prop은 1차에서 확장하지 않는다.
5. `packages/llm-prompts` typecheck / test와 root test / typecheck / build를 통과한다.

## 4. 미해결

0건. Claude round 4 코드 진행 가능.

[Codex]
