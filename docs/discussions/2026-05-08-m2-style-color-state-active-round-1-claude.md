# 2026-05-08 m2-style-color-state-active round 1 — Claude

> 트리거: color-state (`5bc7a61`) + color-state-text (`e28914c`) 후속.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

button 노드의 active 상태 (mouse down / Enter 키 다운) 색상을 디자이너가 지정. hover 짝 완성.

## 2. 1차 범위

- 신규 schema: `NodeColor.activeBackgroundColor?: string` + `NodeColor.activeTextColor?: string`.
- 적용 대상: button 1차.
- CSS: `style {'--dw-active-bg', '--dw-active-text'}` + Tailwind `[&:active]:!bg-[var(--dw-active-bg)] [&:active]:!text-[var(--dw-active-text)]`.
- UI: NodeColorControls (button) — hover 입력 다음에 active 배경 + active 글자 입력 row 추가.
- 미설정 시 기존 :active 동작 유지.

## 3. 1차 제외

- focus / focus-visible state.
- disabled state.
- hover와 active 동시 시각 우선순위 명시 (CSS cascade에 위임).
- transition.

## 4. 충돌 / 회귀

- hover와 독립 (둘 다 / 한쪽만 / 없음 모두 허용).
- hover 미설정 + active 설정 가능.

## 5. 구현

`packages/tree/src/schema.ts`: `nodeColorSchema`에 `activeBackgroundColor`, `activeTextColor` 추가.

`apps/web/src/app/page.tsx`:
- `getActiveBackgroundStyle`, `getActiveTextStyle` 헬퍼 추가 (hover 패턴 미러).
- ButtonNode 렌더에 `--dw-active-bg`, `--dw-active-text` CSS 변수 + active important class.
- NodeColorControls에 active 배경/글자 input row 2개.

## 6. 수락 기준

1. button 색상 disclosure에 "활성 배경", "활성 글자" 입력 노출.
2. 값 설정 후 click hold (mouse down) 시 색 변경.
3. hover와 독립 토글.
4. 미설정 button :active 회귀 0.
5. typecheck/lint/build/tree test 통과.

## 7. Codex 요청

1. activeBackgroundColor + activeTextColor 2 필드 동시 1차 OK?
2. CSS `:active` Tailwind arbitrary `[&:active]:!bg-...` 패턴 OK?
3. focus / disabled은 후속 분리 OK?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`df27b73`) 후 1회 (color-state-text). 안전.

[Claude]
