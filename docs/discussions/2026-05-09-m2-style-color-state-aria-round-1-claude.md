# 2026-05-09 m2-style-color-state-aria round 1 — Claude

> 트리거: `m2-color-state-disabled-pointerevents` 후속. AUTONOMOUS.md 후속 후보.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean. 가속 §4 병렬 토픽.

## 1. 목표

`disabled` 상태 보조 기술 노출. 현재 `data-disabled="true"`만 있어 스크린리더가 인식 X. `aria-disabled="true"` 추가로 SR 사용자에게도 비활성 안내.

## 2. 1차 범위

- `apps/web/src/app/page.tsx`의 button 노드 렌더링 분기에 `aria-disabled={meta.disabled || undefined}` 추가.
- `disabled` 미설정 시 attribute 자체 생략 (undefined → React가 attribute 제거).
- 다른 노드 (text/image/container) 영향 X — disabled toggle UI는 button-only.

## 3. 1차 제외

- `aria-pressed` / `aria-expanded` 등 기타 ARIA — 별도 토픽.
- HTML `<button>` element 변경 (현재 div 기반 SelectableNode 유지).
- focus 트랩 / 키보드 핸들러.

## 4. 충돌 / 회귀

- `data-disabled`는 그대로 — CSS pointer-events / styling 의존 보존.
- `aria-disabled` 추가만으로 시각 회귀 0.
- 일반 사용자 영향 X. SR 사용자만 변화.

## 5. 구현

`apps/web/src/app/page.tsx`:
- button render JSX에 `aria-disabled={meta.disabled || undefined}` 한 줄.

스키마 / tree-editor 변경 없음 (`disabled` 이미 존재).

## 6. 수락 기준

1. button.disabled=true 인 노드: DOM에 `aria-disabled="true"` + `data-disabled="true"`.
2. button.disabled 미설정 노드: 두 attribute 모두 없음.
3. 회귀 0 (CSS / pointer-events / 기존 스타일).
4. typecheck/lint/build 통과.

## 7. Codex 요청

1. `aria-disabled` button-only 정책 동의 (다른 노드 제외)?
2. attribute 형태 `disabled || undefined` (false 시 attribute 미렌더) 동의?
3. 별도 disclosure / UI 변경 없이 1줄 commit OK?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`c755908`) 후 0회. 안전. 가속 §4 병렬 토픽 (transform-origin round 2 대기 중).

[Claude]
