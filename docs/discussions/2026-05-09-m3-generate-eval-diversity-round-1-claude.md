# 2026-05-09 m3-generate-eval-diversity round 1 — Claude

> 트리거: m3-generate-variant 토픽이 같은 brief로 N 변형 동시 생성을 입증했지만, 그게 실제로 _다른_ 트리인지 정량 0. m3-eval CLI는 nodeCount/Depth만 본다. variant + eval 두 자산이 갖춰진 지금 다양성 정량 시작.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

m3-eval에 같은 intent의 repeat 호출 결과들 사이의 pairwise 트리 유사도 score를 추가. summary에 intent별 평균 similarity (낮을수록 다양). 측정만 1차, threshold/회귀 차단 후속.

## 2. 1차 범위

### 2-1. similarity metric

```ts
similarity(treeA, treeB): number  // 0~1, 1=동일
```

1차 정의: **노드 type-path bag 자카드**.

- DFS로 각 노드의 root→node `type` 경로를 문자열로 만들고 (예: `section/card/text`) bag 생성
- 두 트리의 bag 사이 자카드 = `|A∩B| / |A∪B|`
- 0=완전 다른 구조, 1=동일 구조

stochastic 한계 — content/style은 자카드에 영향 없고 구조만 측정. 1차는 "변형이 _구조적으로_ 다른가"만 본다. content/style 다양성은 후속.

### 2-2. m3-eval 변경

`apps/m3-eval/src/run.ts`:
- 같은 intentId의 repeat 결과를 모아서 pairwise similarity 평균 계산 (성공한 것만, 2개 미만이면 `null`)
- `CallResult`에는 추가하지 않고, intent 단위 `IntentDiversity`로 분리

`apps/m3-eval/src/diversity.ts` 신규:
- `computeBag(tree): string[]` — type-path bag
- `jaccard(a, b): number`
- `pairwiseSimilarity(trees): number | null` — 평균

`apps/m3-eval/src/summary.ts`:
- `IntentSummary`에 `diversityScore: number | null` 추가 (`1 - avgSimilarity`)
- markdown 표에 `다양성` 컬럼 추가

### 2-3. 입력 — 트리 자체 보관

CallResult가 현재 tree를 보관하지 않는다. similarity 계산을 위해 tree 객체를 run.ts 내부에서 in-memory로 모아 intent별 묶기. `calls.jsonl`에는 추가 저장 안 함 (파일 크기 폭증 방지). 1차는 process 안에서만.

### 2-4. dry-run 처리

dry-run은 deterministic Tree라 pairwise = 1.0 = diversity 0.0. 그대로 정상. summary에 dry-run임이 명시되어 있어 사용자 오해 없음.

## 3. 1차 제외

- content/style 다양성 — 후속 (`m3-generate-eval-diversity-content`).
- vision LLM judge 정성 점수 — 후속 (`m3-generate-eval-judge`).
- variant 토픽의 diversity hint 효과 측정 (request brief별 비교) — 후속.
- threshold/회귀 차단 ("diversity ≥ 0.3 미달 시 fail") — 1차는 측정만.
- structural edit distance (Levenshtein on tree) — 토큰/계산 비용 큼.

## 4. 충돌 / 회귀

- `apps/api` 변경 0.
- `packages/tree` / `packages/llm-prompts` 변경 0.
- 기존 m3-eval test 그대로 통과 (CallResult 변경 없음).
- `summary.json` 스키마에 `diversityScore` 추가 — 기존 사용자 없음, 회귀 0.
- dry-run 결과는 diversity = 0 (deterministic) — summary md에 명시.

## 5. 구현

`apps/m3-eval/src/`:
- `diversity.ts` 신규: `computeBag` / `jaccard` / `pairwiseSimilarity`
- `diversity.test.ts` 신규: 동일 트리 = 1.0 / 완전 다른 = 0 / repeat 1개면 null / 노드 1개 트리 edge
- `run.ts`: tree in-memory 보관 → intentId별 그룹 → similarity 계산 → IntentDiversity map → summarizeCalls에 전달
- `summary.ts`: IntentSummary에 `diversityScore` + markdown 컬럼

## 6. 수락 기준

1. `pnpm --filter @dworks/m3-eval test` 통과 — diversity.test.ts + 기존 test 회귀 0.
2. `pnpm --filter @dworks/m3-eval typecheck` 통과.
3. `--repeat 3` dry-run 실행 시 summary.md에 `다양성` 컬럼 표시, deterministic이라 0.
4. `--repeat 1`이면 summary에 `다양성: -` 표시 (계산 불가).

## 7. Codex 요청

1. similarity metric "type-path bag 자카드"가 1차 적정? 더 단순한 "type bag 자카드" / 더 풍부한 "type+contentRole+emphasis bag" 중 권장?
2. CallResult에 tree 자체를 보관하지 않고 in-memory만 — calls.jsonl에 tree 추가가 후속 회귀 분석에 도움될지? 1차 비용 vs 가치?
3. summary 컬럼명 "다양성" — 사용자에게 직관? "변형 차이도" / "diversity score" 영어 표기 고려?
4. dry-run에서 diversity=0이 항상 노출되는데, dry-run summary에 별도 라벨 (예: "(dry-run)")로 신호 줄지?
5. pairwise similarity 평균 vs 최소 — 평균은 1쌍이 매우 비슷해도 다른 쌍이 다르면 가려짐. 두 값 모두 보여줄지?
6. 라운드 분할 r4 (Claude diversity + summary 컬럼) / r5 (Codex test 보강 — edge: tree depth 1 / repeat 0 / mixed 성공/실패) — 합리?

## 8. 안전장치

라운드 1, m3-eval 만 터치. page.tsx 미터치. 직전 ABSORB(`84c2e2b`) 후 0회. 안전.

[Claude]
