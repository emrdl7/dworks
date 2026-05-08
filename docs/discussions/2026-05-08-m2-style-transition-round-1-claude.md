# 2026-05-08 m2-style-transition round 1 — Claude

> 트리거: color-state 시리즈 (hover/active/focus/disabled) 마감 후 자연스러운 후속.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

button hover/active/focus 색상 전환을 즉시 → 부드러운 transition으로 변경. 디자이너가 인터랙션 perceived quality 조정.

## 2. 1차 범위

- 신규 schema: `BaseNodeMeta.transition?: { duration?: number /* ms, 0~2000 */ }`.
- 적용 대상: button 1차 (다른 노드 type은 schema 공통, UI는 button만 노출).
- CSS: `style={{ transitionDuration: '${ms}ms' }}`. 기존 button span의 `transition` (Tailwind utility) class와 함께 작동 — duration override.
- timing function은 1차 고정 'ease' (Tailwind 기본).
- UI: NodeColorControls 비활성 상태 토글 위 또는 별도 "전환" 섹션. 1줄 number input "전환 시간 (ms)".

## 3. 1차 제외

- timing function 선택 (linear / ease-in / ease-out / cubic-bezier).
- 별도 property별 transition (background only, color only).
- delay.
- transform-related transitions (rotate / scale).
- 다른 노드 type 별 transition.

## 4. 충돌 / 회귀

- 기존 button `transition` Tailwind class 회귀 0 — duration만 override.
- 미설정 button 기존 동작 (Tailwind 기본 150ms) 유지.
- color-state hover/active/focus/disabled 색상 변경이 부드러워짐.

## 5. 구현

`packages/tree/src/schema.ts`:
- `nodeTransitionSchema = z.object({ duration: z.number().min(0).max(2000).optional() })` 신규.
- `baseShape`에 `transition: nodeTransitionSchema.optional()` 추가.
- BaseNodeMeta interface에 `transition?: { duration?: number }`.

`apps/web/src/app/page.tsx`:
- ButtonNode 렌더의 `style`에 `transitionDuration` 머지 (transition.duration 있을 시).
- `getTransitionStyle(transition?: NodeTransition)` helper.
- NodeColorControls (button) 비활성 상태 토글 위에 "전환 시간 (ms)" number input.

## 6. 수락 기준

1. button 색상 disclosure에 "전환 시간 (ms)" 입력.
2. 값 설정 후 hover → 그 시간 동안 색 전환.
3. 미설정 button 기본 150ms 유지.
4. 다른 노드 type 노출 0.
5. typecheck/lint/build/tree test 통과.

## 7. Codex 요청

1. `transition.duration?: number (0~2000ms)` 1 필드 1차 OK?
2. timing function 'ease' 고정 + 후속 분리 OK?
3. UI 위치 (NodeColorControls 비활성 토글 위) OK?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`dd03469`) 후 3회. 다음 feat로 4회 — review 신호 진입.

[Claude]
