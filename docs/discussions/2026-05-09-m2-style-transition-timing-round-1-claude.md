# 2026-05-09 m2-style-transition-timing round 1 — Claude

> 트리거: m2-style-transition (`87ac637`) 후속 — easing function 분리.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

button transition의 easing function (linear / ease / ease-in / ease-out / ease-in-out)을 디자이너가 선택. 현재 'ease' 고정.

## 2. 1차 범위

- 신규 schema: `nodeTransitionSchema`에 `timing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'` 추가.
- 적용 대상: button (transition은 이미 button-only).
- CSS: `style={{ transitionTimingFunction: timing }}` 머지 (있을 시).
- UI: NodeColorControls 전환 시간 입력 옆 또는 아래에 timing select.
- 미설정 시 'ease' (브라우저 기본).

## 3. 1차 제외

- `cubic-bezier(...)` 자유 입력.
- `steps()`.
- duration / timing 외 transition 속성 (delay 등).

## 4. 충돌 / 회귀

- transition.duration과 독립 — 둘 다 / 한쪽만 설정 가능.
- 미설정 button 'ease' 기본 유지.

## 5. 구현

`packages/tree/src/schema.ts`:
- `NODE_TRANSITION_TIMING_IDS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']`.
- `nodeTransitionSchema.timing`.

`apps/web/src/app/page.tsx`:
- `getTransitionStyle`이 `timing` 머지.
- NodeColorControls에 "전환 곡선" select.

## 6. 수락 기준

1. button 색상 disclosure에 "전환 곡선" select.
2. 5 옵션 한글 라벨 (선형/기본/시작 가속/끝 가속/양쪽 가속).
3. 값 설정 후 hover transition 곡선 변경.
4. 미설정 button 'ease' 유지.
5. typecheck/lint/build/tree test 통과.

## 7. Codex 요청

1. 5 timing 옵션 + 한글 라벨 OK?
2. UI 위치 (전환 시간 입력 아래 select) OK?
3. cubic-bezier 자유 입력 후속 분리에 동의?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`b145fd2`) 후 3회. 다음 feat로 4회 — review 신호.

[Claude]
