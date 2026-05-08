# 2026-05-08 m2-style-color-state-disabled round 1 — Claude

> 트리거: color-state hover/text/active/focus 후속 — 마지막 상태.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

비활성(disabled) 상태 색상. 인터랙션이 막힌 button을 시각적으로 명확히 표현.

## 2. 1차 범위

- 신규 schema:
  - `NodeColor.disabledBackgroundColor?: string`
  - `NodeColor.disabledTextColor?: string`
  - `BaseNodeMeta.disabled?: boolean` (button 노드 토글 가능, 캔버스 인터랙션은 1차에서 _시각만_ 적용 — pointerEvents 제어는 후속).
- 적용 대상: button 1차 (button만 disabled UI 노출).
- CSS: `data-disabled` attribute + Tailwind `data-[disabled=true]:!bg-/!text-[var(--dw-disabled-*)]`.
- UI:
  - NodeColorControls (button) — focus 입력 다음에 disabled 배경/글자 input row.
  - 별도 "비활성 토글" 입력은 1차 제외 (시각만 데모 — 디자이너가 상태별 색을 보려면 임시로 schema의 `disabled: true`를 직접 넣거나, _후속에서 토글 UI 분리_).

## 3. 1차 제외

- `pointerEvents: 'none'` 자동 적용 (디자이너가 직접 visibility/pointerEvents 제어 가능).
- disabled 토글 UI (별도 후속 `m2-color-state-disabled-toggle`).
- aria-disabled / role 변경.
- 로딩 / pending state.

## 4. 충돌 / 회귀

- hover/active/focus와 독립.
- 미설정 button 회귀 0.
- `disabled` schema 필드는 BaseNodeMeta에 추가하되 1차에서는 button 한정으로만 시각 적용.

## 5. 구현

`packages/tree/src/schema.ts`:
- `nodeColorSchema`에 `disabledBackgroundColor`, `disabledTextColor` 추가.
- `baseNodeMetaSchema`에 `disabled?: boolean` 추가.

`apps/web/src/app/page.tsx`:
- `getDisabledBackgroundStyle`, `getDisabledTextStyle` helper.
- ButtonNode 렌더에 `data-disabled` attribute + `--dw-disabled-bg/text` 변수 + `data-[disabled=true]:!...` important class.
- NodeColorControls에 disabled 배경/글자 input row.

## 6. 수락 기준

1. button 색상 disclosure에 "비활성 배경", "비활성 글자" 입력.
2. button schema에 `disabled: true` 설정 시 (수동) 시각 변경.
3. hover/active/focus 독립.
4. 미설정 button 회귀 0.
5. typecheck/lint/build/tree test 통과.

## 7. Codex 요청

1. disabledBackgroundColor + disabledTextColor 1차 OK?
2. `disabled?: boolean` BaseNodeMeta 추가 OK? (다른 노드 type엔 영향 없음)
3. 1차에서 disabled 토글 UI 제외, schema field만 + 시각 적용에 동의?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`df27b73`) 후 3회 (color-state-text + color-state-active + color-state-focus). 다음 feat로 4회 — review 신호. ABSORB 자율 판단.

[Claude]
