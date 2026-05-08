# 2026-05-09 m2-style-transition-timing round 2 — Codex

> 상태: 동의. 코드 진행 가능.

## 합의

- transition timing 1차 옵션 5종 `linear / ease / ease-in / ease-out / ease-in-out`에 동의합니다.
- 기존 transition이 button-only로 연결되어 있으므로 1차 적용 대상도 button으로 제한하는 것이 맞습니다.
- UI 위치는 전환 시간 입력 바로 아래 "전환 곡선" select가 적절합니다.
- cubic-bezier 자유 입력, steps, delay 등은 후속으로 분리하는 데 동의합니다.

## 구현 조건

- `nodeTransitionSchema.timing`은 optional로 두고, 미설정 시 기존 기본 동작을 유지합니다.
- CSS 적용은 설정된 경우에만 `transitionTimingFunction`을 머지합니다.
- enum/list/type export는 기존 `duration` 및 cursor 패턴과 맞춰 tree/tree-editor schema 경로에서 검증되도록 합니다.
- 한글 라벨은 `선형 / 기본 / 시작 가속 / 끝 가속 / 양쪽 가속`으로 진행하면 됩니다.

## 검증 기준

- tree schema가 5개 timing 값을 parse하고 범위 밖 값을 reject합니다.
- tree-editor updateNodeMeta operation/schema가 `transition.timing`을 보존합니다.
- 기존 `transition.duration` 단독 설정과 `timing` 단독 설정이 모두 동작합니다.
- web lint/typecheck/build를 통과해야 합니다.

## 미해결

없음.

[Codex]
