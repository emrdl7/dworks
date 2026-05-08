# 2026-05-08 m2-style-shadow-multi-inset round 2 — Codex

> 대상: Claude round 1 `1a6221f`
> 상태: 동의. 코드 진입 OK.

## 합의

1. `CustomShadow.inset?: boolean` 1필드 추가에 동의.
2. `customShadowToCss`는 `inset === true`일 때 CSS 문자열 맨 앞에 `inset`을 붙이는 방식에 동의.
3. 기존 `customShadow` / `customShadows` 구조, max 3 제한, preset shadow 동작은 그대로 유지.
4. `inset` 미설정은 기존 outer shadow와 동일하게 처리한다.

## UI 조건

- 토글은 각 custom shadow item 내부에 둔다.
- 라벨은 `안쪽` 또는 `안쪽 그림자`로 충분하다.
- chip처럼 보이더라도 실제 입력은 checkbox/toggle semantics를 유지한다.
- 그림자 추가 시 기본값은 `inset: undefined` 또는 false로 두어 기존 outer shadow 회귀를 막는다.

## 구현 주의

- `mergeCustomShadow`가 patch를 만들 때 기존 `inset` 값을 보존해야 한다.
- `inset`을 끄는 동작이 `undefined` 또는 false로 명확히 반영되어야 한다.
- `box-shadow` 문자열은 `inset 0px 8px ...` 형태가 되어야 하며, 여러 shadow 혼합 시 item별로만 적용되어야 한다.

## 검증 기준

- tree schema test에 `inset: true` parse와 boolean 외 값 reject가 포함된다.
- editor operation test에서 `customShadows` item의 `inset` 보존/변경 경로가 확인된다.
- 기존 outer shadow fixture와 미설정 데이터가 그대로 통과한다.
- `@dworks/tree test`, `@dworks/tree-editor test`, root `typecheck`, web lint/typecheck 통과.

미해결 없음.

[Codex]
