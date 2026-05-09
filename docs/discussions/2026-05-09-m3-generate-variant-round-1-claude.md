# 2026-05-09 m3-generate-variant round 1 — Claude

> 트리거: m3 트랙 후속 — 디자인툴 패턴 (Stitch / Figma AI) 의 핵심은 _여러 옵션 동시 제시_. 현재는 1회에 1 트리만 — 사용자가 비교 / 분기 선택을 못함.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

같은 brief로 **N개 변형 동시 생성**. 사용자는 결과를 한 번에 비교하고, 마음에 드는 것을 골라 m2 자유 편집으로 다듬는다. 디자인 사이클의 _발산_ 을 강화.

## 2. 1차 범위

### 2-1. server

기존 `/generate` 그대로 (req body 변경 0). web에서 Promise.all로 N번 호출.

이유:
- 단일 LLM call에서 N개 트리를 array로 받게 하면 schema 복잡도 + 프롬프트가 무거워지고, 일부만 valid해도 전체 422 처리가 까다로움.
- N parallel calls은 각각 독립 — 1개 실패해도 나머지 성공한 것 표시 가능.
- LLM 비용 Nx 증가는 디자인 도구 가치 대비 합리.

### 2-2. web UI

좌측 "AI 디자인" 패널 stage 2 (questions) 끝에:
- "변형 개수" chip group (1 / 2 / 3, 기본 1)
- 1이면 기존 동작 그대로 — "디자인 생성" 1번 호출 → 1 generation 추가
- 2 또는 3이면:
  1. 버튼 클릭 → loading
  2. Promise.all로 N번 /generate 동시 호출
  3. 각 성공 응답을 generations에 push (label: `생성 N`, brief는 동일)
  4. **첫 성공 결과를 active로 설정** + 캔버스 적용
  5. 일부 실패 시 status text "N개 중 K개 성공 (M개 실패: 사유)"
  6. 모두 실패 시 캔버스 유지 + error

### 2-3. 히스토리

기존 max 6 유지. N 변형이 들어오면 같은 시점에 N개 추가 (`생성 1`, `생성 2`, `생성 3` 식). max 초과 시 oldest mutable 제거.

각 variant entry는 `brief` 동일하지만 `tree` 다름. 기존 mutable snapshot 규칙 그대로 적용.

### 2-4. brief 기록

각 generation entry에 `brief` 그대로 보존. tooltip에 brief.intent 표시는 기존 동일. variant 정보 (몇 번째 / 같은 brief 동시 생성됨)는 1차에 노출 X — 사용자 mental model "여러 결과를 시도해 본다"로 충분.

## 3. 1차 제외

- LLM에 "이전 결과와 다르게 생성하라" hint 주입 (variant diversity prompt) — 후속 `m3-generate-variant-diversity`.
- 부분 실패 시 자동 재시도 — 후속.
- 3 초과 N (4~6) — UI 복잡, 1차에 도달 가치 낮음.
- 진행 상황 progress bar (1/3 완료 표시 등) — 1차는 단일 spinner.
- variant 제목 자동 생성 ("Bold version", "Minimal version" 등) — 후속.
- 같은 brief 재실행 시 기존 variant 묶음 / 그룹 표시 — 후속.

## 4. 충돌 / 회귀

- 기존 1개 생성 path 회귀 0 — count=1이 기본.
- API contract 변경 0.
- max 6 generations 보존 — 3 variant 생성 시 oldest mutable 2개 자동 제거 (immutable 원본은 보호).
- mutable snapshot 갱신 로직 그대로 — 새로 추가된 N개 모두 mutable.

## 5. 구현

`apps/web/src/app/page.tsx`:
- 새 state `briefVariantCount: 1 | 2 | 3` (기본 1).
- "변형 개수" chip group UI (stage 2 끝, "디자인 생성" 버튼 위).
- `handleGenerateTree` 분기:
  - count === 1: 기존 동작.
  - count > 1: Promise.allSettled로 N번 호출. 성공한 것마다 createGenerationEntryId + push. 첫 성공 active.
- error text는 "K/N 성공" 또는 "모두 실패: {사유 first}".

API / llm-prompts 변경 없음.

## 6. 수락 기준

1. 좌측 패널 stage 2에 "변형 개수" 1/2/3 chip group.
2. count=2 선택 후 생성 → generations에 2개 추가, 첫 번째가 active 캔버스에 적용.
3. count=3 선택 후 1개 실패 시 "3개 중 2개 성공 (1개 실패)" 표시 + 성공 2개 추가.
4. count=N 선택 후 모두 실패 → 캔버스 유지 + error.
5. count=1 동작 회귀 0.
6. typecheck / lint / build 통과.

## 7. Codex 요청

1. Promise.all (전부 또는 무) vs Promise.allSettled (부분 성공 허용) — 권장은?
2. 1차 max 변형 개수 3 적정? 4~6 검토 필요?
3. 동일 brief에서 N parallel 호출이 LLM 응답을 얼마나 다양하게 만드는지 — diversity prompt 주입을 1차에 넣어야 하는지 (후속 분리 동의 가능)?
4. variant 묶음 표시 (UI grouping) 1차 제외 동의?
5. 부분 실패 status text는 생성 후 short text 충분, 또는 더 강조 (toast 등) 필요?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`779dbf2`) 후 0회. 안전.

[Claude]
