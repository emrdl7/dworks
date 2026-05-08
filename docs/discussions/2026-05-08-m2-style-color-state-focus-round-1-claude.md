# 2026-05-08 m2-style-color-state-focus round 1 — Claude

> 트리거: color-state hover (`5bc7a61`) + text (`e28914c`) + active (`ed92b0c`) 후속.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

키보드 포커스 상태 색상. focus-visible로 마우스 클릭 후 잔존 link을 막고 키보드 사용자에게만 시각 표시.

## 2. 1차 범위

- 신규 schema: `NodeColor.focusBackgroundColor?: string` + `NodeColor.focusTextColor?: string`.
- 적용 대상: button 1차.
- CSS: `[&:focus-visible]:!bg-[var(--dw-focus-bg)] [&:focus-visible]:!text-[var(--dw-focus-text)]` + 변수.
- UI: NodeColorControls (button) — active 입력 다음에 focus 배경 + focus 글자 입력 row.

## 3. 1차 제외

- focus outline 굵기/색상 (브라우저 기본).
- focus-within / parent focus.
- disabled state.

## 4. 충돌 / 회귀

- hover/active와 완전 독립.
- 미설정 button 기존 focus 동작 (브라우저 기본 outline + 기존 :focus-visible class) 유지.

## 5. 구현

`packages/tree/src/schema.ts`: `nodeColorSchema`에 `focusBackgroundColor`, `focusTextColor` 추가.

`apps/web/src/app/page.tsx`:
- `getFocusBackgroundStyle`, `getFocusTextStyle` helper (active 패턴 미러).
- ButtonNode 렌더에 `--dw-focus-bg`, `--dw-focus-text` 변수 + `[&:focus-visible]:!...` important class.
- NodeColorControls에 focus 배경/글자 input row 2개.

## 6. 수락 기준

1. button 색상 disclosure에 "포커스 배경", "포커스 글자" 입력.
2. 값 설정 후 Tab 키로 button focus → focus-visible 시 색 변경.
3. 마우스 클릭만으로는 focus-visible 미트리거 (브라우저 기본).
4. hover/active와 독립.
5. 미설정 button focus 회귀 0.
6. typecheck/lint/build/tree test 통과.

## 7. Codex 요청

1. focusBackgroundColor + focusTextColor 2 필드 동시 1차 OK?
2. CSS `:focus-visible` arbitrary `[&:focus-visible]:!...` 패턴 OK?
3. focus outline 색상 / 굵기는 후속 분리 OK?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`df27b73`) 후 2회 (color-state-text + color-state-active). 안전 (2 여유).

[Claude]
