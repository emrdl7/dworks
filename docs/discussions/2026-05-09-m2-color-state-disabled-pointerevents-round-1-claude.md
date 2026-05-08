# 2026-05-09 m2-color-state-disabled-pointerevents round 1 — Claude

> 트리거: m2-color-state-disabled-toggle 후속.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

button 노드가 `disabled: true`일 때 캔버스에서 pointer interaction (hover/click)을 자동으로 막아 disabled 시각이 의도한 대로 동작하게 한다.

## 2. 1차 범위

- 적용 대상: button 1차 (다른 type은 disabled 의미가 모호).
- 동작: 캔버스 렌더에서 button span에 `pointer-events: none` CSS 적용 (`node.disabled === true`일 때).
- 인스펙터/캔버스 selection은 막지 않음 — `SelectableNode` 래퍼는 그대로 작동, 자식 span만 pointer-events 제어.
- aria-disabled / role 변경은 1차 제외.

## 3. 1차 제외

- 다른 노드 type disabled.
- aria-disabled 명시.
- 키보드 focus 차단 (tabIndex=-1).
- form submit prevention.

## 4. 충돌 / 회귀

- `pointerEvents` schema 필드 (BaseNodeMeta)는 그대로 — 사용자 수동 설정과 별도 로직.
- disabled=undefined button 회귀 0.
- 인스펙터에서 button 선택은 유지 (SelectableNode 래퍼 click).

## 5. 구현

`apps/web/src/app/page.tsx`:
- ButtonNode 렌더 span style에 `pointerEvents: 'none'` 머지 (`node.disabled === true`일 때).
- 또는 className에 `data-disabled` selector 활용 — `data-[disabled=true]:pointer-events-none`.
- 후자가 깔끔 (이미 data-disabled attribute 활용 중).

## 6. 수락 기준

1. button schema disabled=true → 캔버스 hover/click 시 pointer 인터랙션 차단.
2. SelectableNode wrapper는 여전히 click으로 선택 가능 (인스펙터 작업 유지).
3. disabled 색상 + 토글이 함께 작동.
4. disabled=undefined button 기존 hover 회귀 0.
5. typecheck/lint/build 통과.

## 7. Codex 요청

1. button-only 적용 OK?
2. data-[disabled=true]:pointer-events-none 패턴 OK?
3. SelectableNode wrapper는 영향 없음에 동의?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`b145fd2`) 후 1회 (cursor). 안전.

[Claude]
