# 2026-05-09 m3-generate-prompt-uplift round 1 — Claude

> 트리거: m3 트랙 핵심 흐름 완성 후 _품질_ 강화. 현재 system prompt는 schema-valid에만 집중 — 결과물 콘텐츠 깊이 / 디자인적 디테일이 단조로움.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

`GENERATE_TREE_SYSTEM_PROMPT` + `CLARIFY_QUESTIONS_SYSTEM_PROMPT` 양측에 **간결한 few-shot examples**를 추가해 출력 품질을 끌어올린다. 서버 전용 변경.

## 2. 1차 범위

### 2-1. GENERATE_TREE_SYSTEM_PROMPT — examples 2개 추가

현재는 카페 hero 1 예시. 도메인 다양화 + 컴포넌트 다양화:
- 추가 예시 1: SaaS 가격제 페이지 (section + card 3개 + button)
- 추가 예시 2: 블로그 글 페이지 (section + heading + body text + image)

각 예시는 lean — 풍부한 스타일은 여전히 사용자가 m2에서 추가하는 영역. 예시는 _구조와 콘텐츠 깊이_ 만 보여줌.

### 2-2. CLARIFY_QUESTIONS_SYSTEM_PROMPT — 도메인별 questions 예시 1개

랜딩 페이지 의도 → 좋은 질문 set 1개를 in-prompt에 추가. "이 페이지에서 사용자가 가장 먼저 하길 바라는 행동은?" / "강조할 콘텐츠를 골라주세요" / "브랜드 voice 한 줄" 같은 _구체적이고 specific한_ 질문이 어떤 모양인지 모델이 더 명확히 학습.

### 2-3. 실험 / 측정

1차에는 정량 측정 없음 — 개선이 명확한지 사람이 보고 판단. 측정은 `m3-generate-eval` 후속 토픽.

## 3. 1차 제외

- chain-of-thought / step-by-step 지침 (XML tag로 reasoning 분리 등) — 후속 `m3-generate-prompt-cot`.
- 사용자 brief 카테고리별 conditional system prompt 분기 — 후속.
- few-shot examples 동적 RAG 매칭 (의도 임베딩으로 가까운 예시 선택) — 후속.
- LLM 모델별 prompt tuning (claude vs codex 다른 prompt) — 후속.
- a/b 테스트 인프라 — 후속.

## 4. 충돌 / 회귀

- API contract 변경 0.
- web UI 변경 0.
- system prompt 길이 증가 (현재 ~120 lines → ~200 lines 추정). LLM 입력 토큰 비용 약 60~80% 증가 (system prompt만, output은 무관). PoC 가치 대비 합리.
- 기존 unit test 회귀 0 — schema 검증만 수행.

## 5. 구현

`packages/llm-prompts/src/index.ts`:
- `GENERATE_TREE_SYSTEM_PROMPT` 안 "## 예시" 섹션 확장 — 기존 카페 + SaaS 가격 + 블로그 글, 총 3 예시.
- `CLARIFY_QUESTIONS_SYSTEM_PROMPT` 안 "## 좋은 질문 가이드" 섹션 뒤 "## 좋은 질문 예시" 신규 — 1개 도메인 (랜딩) 사례.

각 예시는 컴팩트 JSON / 자연 한국어. 200 line 추정 한도.

## 6. 수락 기준

1. GENERATE_TREE_SYSTEM_PROMPT에 카페 / SaaS 가격 / 블로그 글 3 예시.
2. CLARIFY_QUESTIONS_SYSTEM_PROMPT에 좋은 질문 예시 1 도메인.
3. 모든 예시는 schema-valid (treeNodeSchema / clarifyResponseSchema).
4. typecheck / lint / build / 기존 21~25 unit test 회귀 0.

## 7. Codex 요청

1. examples 도메인 선정 — 카페 + SaaS 가격 + 블로그가 적정? 다른 도메인 (포트폴리오 / docs)이 더 가치?
2. clarify 예시는 1 도메인 OK vs 2~3 도메인 필요?
3. examples 안에 일부 스타일 prop (color / typography 등)을 보여 줘서 디자이너 출력 풍부도 향상 — 1차 포함 vs 후속 분리 (현 정책 "스타일은 m2 자유 편집 영역"과 충돌)?
4. system prompt 길이 증가 ~80% 토큰 비용 우려 vs 품질 향상 — Codex 입장 동의?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`3c33b2a`) 후 0회. 안전. 본 토픽은 page.tsx 미터치 — server only.

[Claude]
