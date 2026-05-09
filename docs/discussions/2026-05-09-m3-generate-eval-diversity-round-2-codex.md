# 2026-05-09 m3-generate-eval-diversity round 2 - Codex

> 결론: 1차 metric으로 적정. 다만 "bag 자카드"라면 set이 아니라 multiset 자카드로 구현해야 하고, markdown에는 "구조 다양성"이라고 명확히 표시하는 편이 안전하다. 아래 보정 조건으로 round 4 코드 진행 가능.

## 합의

- m3-eval에 같은 intent repeat 성공 결과들 사이의 구조 다양성 score를 추가한다.
- 1차 metric은 `type-path` multiset Jaccard로 충분하다.
- `CallResult`와 `calls.jsonl`에는 tree를 넣지 않는다. run 중 in-memory로만 성공 tree를 모은다.
- content/style 다양성, vision judge, threshold 기반 fail은 후속 토픽으로 분리한다.

## 구현 보정

1. `computeBag(tree)`는 path 문자열 배열을 반환하되, Jaccard는 set이 아니라 multiset 기준으로 계산한다.
   - intersection = 각 path별 `min(countA, countB)` 합
   - union = 각 path별 `max(countA, countB)` 합
   - 이렇게 해야 같은 type-path가 반복되는 card/list 구조 차이를 일부라도 반영한다.
2. empty bag은 실제 Tree에서는 나오지 않지만 helper 단위 테스트를 위해 `jaccard([], [])`는 `1`로 정의해도 된다. `pairwiseSimilarity`는 tree 2개 미만이면 `null`.
3. `run.ts`는 `calls`와 별도로 `successfulTreesByIntent`를 유지한다. `status === 'ok'`이고 schema를 통과한 tree만 넣는다.
4. `summary.ts`는 intent 테이블만 별도 header를 쓰는 편이 낫다.
   - 전체/provider table은 기존 latency 중심 header 유지
   - intent table에는 마지막 열 `구조 다양성` 추가
   - `null`은 `-`, 값은 `0.00`처럼 고정 소수 2자리 권장
5. `summary.json`에는 `byIntent` row에 `diversityScore: number | null`만 추가하면 충분하다. 평균 similarity와 pair count는 내부 계산값으로 유지해도 된다.

## 질문 답변

- type bag보다 type-path bag이 낫다. root부터의 맥락을 잃지 않아 hero/card/text와 section/card/text를 구분한다.
- `type+contentRole+emphasis`는 1차에서는 과하다. content/schema 사용 습관 차이를 metric이 과도하게 반영할 수 있다.
- 컬럼명은 `다양성`보다 `구조 다양성` 권장. 이 score가 콘텐츠나 스타일 차이를 보장하지 않는다는 점을 UI/문서가 숨기면 안 된다.
- dry-run은 이미 mode가 표시되지만, markdown 하단에 "dry-run은 deterministic이라 구조 다양성 0.00이 정상" 한 줄을 추가하면 오해가 줄어든다.
- 평균 similarity 기반 `diversityScore = 1 - avgSimilarity`만 1차에 표시한다. minimum/maximum pair는 후속 분석 필요가 생길 때 추가한다.

## 테스트 기준

- `diversity.test.ts`
  - 동일 tree pair similarity = `1`
  - root/type-path가 다른 tree pair similarity = `0`
  - 반복 node가 있는 multiset case에서 set Jaccard와 다른 값이 나오는지 검증
  - tree 1개는 `null`
- `summary.test.ts`
  - `diversityScore`가 intent row에 포함된다.
  - markdown intent table에 `구조 다양성` header와 `-` null 표기가 나온다.
- `run.test.ts`
  - dry-run `repeat: 2` 이상에서 summary markdown 또는 summary.json에 `0.00` 다양성이 기록된다.
  - live mock에서 성공/실패가 섞이면 성공 tree만 계산한다.

## 수락 기준

- `pnpm --filter @dworks/m3-eval test`
- `pnpm --filter @dworks/m3-eval typecheck`
- dry-run `--repeat 3` 수동 실행은 가능하면 evidence로 남긴다. 필수 gate는 test/typecheck로 충분하다.

## 미해결

없음. round 4에서 `apps/m3-eval` 범위로 구현하면 된다.

[Codex]
