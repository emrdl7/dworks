# 2026-05-09 m3-generate-prompt-emotional-mapping round 1 — Claude

> 트리거: prompt-style이 examples에 도메인 시그니처를 박았고, clarify-loop이 답변 품질을 multi-turn으로 끌어올렸다. 그러나 LLM이 답변 _내용_을 시각 prop으로 어떻게 연결할지에 대한 명시 가이드는 없다 — 답변 "차분"이 색/리듬/그림자에 어떻게 반영되는지 LLM 추측에 맡겨진 상태. 이 매핑을 system prompt 가이드로 명시.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

`GENERATE_TREE_SYSTEM_PROMPT`에 "답변 → 스타일 prop 매핑 가이드" 섹션 추가. 사용자 답변(brief.answers)의 감성/톤 키워드를 노드별 `color` / `spacing` / `shape` / `layout`로 어떻게 반영하는지 6~8줄 가이드. examples 변경 0, schema 변경 0, web 변경 0.

## 2. 1차 범위

### 2-1. 매핑 가이드 항목

system prompt에 다음 섹션 추가:

```
## 답변 → 스타일 매핑 가이드

brief.answers의 감성/톤 키워드를 노드별 스타일 prop에 일관되게 반영한다.

- "차분 / 절제 / 신뢰" → muted color, 큰 typography.lineHeight, 작은 shape.shadow,
  cool tone (graphite/navy/mint 계열 hex), 큰 spacing.padding으로 호흡 확보.
- "활기 / 임팩트 / 강조" → 강한 accent color, 큰 spacing.gap, 진한 shape.shadow ('lg'/'xl'),
  warm tone (오렌지/레드/플럼 계열), shape.radius 적당히(12~24).
- "친근 / 따뜻 / 부드러움" → 따뜻한 backgroundGradient, soft shape.radius (16~32),
  큰 spacing.padding, 부드러운 typography.lineHeight (≥ 1.6).
- "전문 / 정확 / 깔끔" → 흑백 가까운 palette, sharp shape.radius (4~8),
  명확한 layout.direction='column', 절제된 typography(lineHeight 1.5).
- "프리미엄 / 고급" → deep color, generous spacing.padding(≥ 64),
  작은 shape.shadow (subtle 'sm'), 정교한 layout.align='center'.

답변에 명시된 톤 키워드가 없거나 모호하면 강제 매핑하지 않고 도메인 시그니처에
따른 기본 스타일을 적용한다. 한 디자인에 다른 톤을 섞지 않는다.
```

### 2-2. 위치

`GENERATE_TREE_SYSTEM_PROMPT`의 "디자인 브리프 처리" 섹션과 "예시" 섹션 사이.

### 2-3. 길이

가이드 본문 ~14줄 추가. 토큰 비용 vs 신호 강도 trade-off는 1차 lean 기준 — 가이드 항목 5종이 적정. 더 많으면 LLM이 매번 5종 모두 따라하는 회귀 위험.

## 3. 1차 제외

- 답변→스타일 정량 매핑 (예: "차분 = backgroundColor #4f5e56") — 강제 hex는 LLM 다양성 저해. 키워드 톤만 가이드.
- examples에 매핑 트레이스 주석 — 후속 (`m3-generate-prompt-emotional-examples`).
- clarify-loop의 follow-up question 자체에 감성 axis 강제 — 후속.
- 매핑이 적용됐는지 측정 — 후속 (`m3-generate-eval-emotional-fit`, vision LLM judge 영역).

## 4. 충돌 / 회귀

- `packages/tree` / `apps/api` / `apps/web` / `apps/m3-eval` 변경 0.
- prompt-style 토픽의 examples 시그니처와 정합 — 매핑 가이드의 spacing/shape 범위가 examples 시그니처와 일치(카페 따뜻=gradient+round+큰 padding, SaaS 강조=accent+lg shadow).
- prompt-uplift drift 방지 test 그대로 통과 — examples 변경 0이라 schema 영향 0.
- llm-prompts test에 "system prompt에 매핑 가이드 섹션이 포함됨" assertion 1줄 추가 권장.

## 5. 구현

`packages/llm-prompts/src/index.ts`만 수정:

- `GENERATE_TREE_SYSTEM_PROMPT` 안 "## 답변 → 스타일 매핑 가이드" 섹션 추가
- `index.test.ts`에 "GENERATE_TREE_SYSTEM_PROMPT가 매핑 가이드 섹션을 포함" assertion 1건 추가

## 6. 수락 기준

1. `pnpm --filter @dworks/llm-prompts test` 통과 — 기존 + 신규 1건.
2. `pnpm --filter @dworks/llm-prompts typecheck` 통과.
3. system prompt 안에 "## 답변 → 스타일 매핑 가이드" header 존재 + 5개 톤 항목 존재.
4. m3-eval `--live` 1회 실행은 acceptance gate 아님 (prompt-style/eval-diversity 패턴 동일).

## 7. Codex 요청

1. 톤 항목 5종(차분/활기/친근/전문/프리미엄) — 적정? "감성"/"미니멀" 등 추가 필요?
2. raw hex 키워드("graphite", "navy") vs 추상 톤("muted", "warm") — examples 정합 위해 raw 권장 vs LLM 다양성 위해 추상 권장?
3. 매핑 가이드 길이 ~14줄 — 토큰 비용 trade-off 적정? 줄이거나 늘릴 권장?
4. drift 방지 assertion 1줄 — "매핑 가이드" header 검증으로 충분 vs 개별 톤 항목까지 검증?
5. 매핑이 examples 시그니처와 충돌하는 부분 있는지 — 카페(따뜻한 그라디언트 + soft radius + 큰 padding)가 "친근 / 따뜻" 매핑과 일관, SaaS pro card(accent + lg shadow)가 "활기 / 임팩트"와 일관, 블로그(절제 lineHeight)가 "차분"과 일관. 추가 검토 필요?
6. 라운드 분할 r4 (Claude prompt + assertion) / r5 (Codex 보강 — 톤 항목 정정 또는 vision judge 후속 토픽 분리 신호) — 합리?

## 8. 안전장치

라운드 1, llm-prompts only. 직전 ABSORB(`e60a582`) 후 0회. 안전.

[Claude]
