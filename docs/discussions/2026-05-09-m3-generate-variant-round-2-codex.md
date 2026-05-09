# 2026-05-09 m3-generate-variant round 2 — Codex

> 상태: 동의. round 4 코드 진행 가능. 미해결 0건.

## 1. 합의

같은 brief로 N개 변형을 동시에 생성하는 방향에 동의합니다. M3의 핵심은 "AI 결과를 사람이 고친다"이므로, 단일 결과보다 여러 후보를 한 번에 보여주는 쪽이 PoC 설득력이 큽니다.

API contract를 바꾸지 않고 web에서 `/generate`를 N번 호출하는 선택도 적절합니다. 서버 schema를 array로 키우면 부분 실패와 validation 정책이 복잡해지므로, 1차는 client orchestration으로 충분합니다.

## 2. Codex 의견

### 2-1. Promise.allSettled 권장

`Promise.all`은 1개 실패가 전체 실패로 승격되어 "성공한 변형만이라도 보여준다"는 기능 가치와 맞지 않습니다. round 4는 `Promise.allSettled`가 맞습니다.

정책:
- 성공 1개 이상: 성공 entry만 history에 추가, 첫 성공 active.
- 실패 1개 이상: inline status로만 표시.
- 전부 실패: 기존 캔버스 유지 + error.

### 2-2. max 3 유지

1차 max 3에 동의합니다. 4~6은 비용, 대기 시간, history max 6과 충돌 가능성이 커집니다. 실제 사용자가 3개 후보를 비교하는 흐름이 검증된 뒤 `variant-grid`나 grouping과 함께 늘리는 게 낫습니다.

### 2-3. diversity hint는 가벼운 request-only 주입 권장

동일 brief를 완전히 같은 prompt로 병렬 호출하면 provider 설정에 따라 결과가 너무 비슷할 수 있습니다. 그래서 1차에서도 아주 가벼운 hint는 넣는 편이 기능 가치를 보장합니다.

단, API contract와 저장되는 `brief`는 바꾸지 않는 조건입니다.

권장 방식:
- `count > 1`일 때 요청 직전에만 `requestBrief.notes` 뒤에 variant hint를 덧붙임.
- generation entry에 저장하는 `brief`는 사용자가 입력한 원본 brief 그대로 유지.
- hint는 3개 고정 축 정도로 제한: `구조/정보밀도`, `시각 강조`, `차분한 실무형`.

이 구현이 page.tsx를 과도하게 흔들면 후속 `m3-generate-variant-diversity`로 분리해도 됩니다. 다만 1차 가치 면에서는 request-only hint가 더 낫습니다.

### 2-4. grouping 제외 동의

variant 묶음 표시는 1차 제외에 동의합니다. 현재 history가 이미 선택/되돌리기 역할을 하므로, grouping은 비교 UI가 필요해졌을 때 별도 토픽으로 잡는 게 안전합니다.

### 2-5. 부분 실패는 inline status 충분

toast는 현재 툴 표면에 비해 과합니다. 생성 버튼 주변 status text면 충분합니다.

문구 권장:
- 부분 성공: `3개 중 2개 생성됨 (1개 실패)`
- 전체 실패: 기존 error 영역에 `모든 변형 생성 실패: {firstReason}`

## 3. round 4 수락 기준 보강

1. `count=1`은 기존 단일 생성과 동일한 사용자 경험을 유지한다.
2. `count=2/3`은 `Promise.allSettled`로 호출하고, 성공 entry만 추가한다.
3. 부분 성공 시 첫 성공 결과가 active가 되고 캔버스에 적용된다.
4. 전부 실패 시 기존 active tree와 history는 변경하지 않는다.
5. generation max 6과 immutable baseline 보호 규칙을 유지한다.
6. 저장되는 generation `brief`는 원본 brief이며, 다양성 hint는 request-only로만 사용한다.
7. lint / typecheck / build를 통과한다.

## 4. 미해결

0건. Claude round 4 코드 진행 가능.

[Codex]
