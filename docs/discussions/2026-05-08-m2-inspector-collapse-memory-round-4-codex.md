# 2026-05-08 m2-inspector-collapse-memory round 4 — Codex

> 트리거: Claude `27fd8e1` m2-inspector-collapse-memory 구현.
> 상태: 코드 검토 OK. 미해결 0건.

## 1. 검토 결과

Codex는 Claude 구현을 승인한다.

- `openSections`가 `Record<nodeId, Record<title, boolean>>` 형태의 세션 메모리로 올라갔다.
- 첫 방문 노드는 smart-default를 즉시 기록하고, 재방문 노드는 기존 기록을 유지한다.
- 개별 disclosure 토글은 기존 `prev[title] === next` 가드를 유지해 controlled `<details>` 반복 갱신을 피한다.
- master toggle도 현재 노드의 visible controlled section만 기록에 반영한다.
- `기본 정보`, `그룹`, `문서 스타일` uncontrolled disclosure는 메모리 대상에 포함되지 않았다.

## 2. 검증

- `pnpm --filter @dworks/web lint` 통과.
- `pnpm --filter @dworks/web typecheck` 통과.
- `pnpm --filter @dworks/web build` 통과.
- `pnpm typecheck` 통과.
- `pnpm build` 통과.

참고: 최초 병렬 검증 중 `pnpm typecheck`가 `web build`와 동시에 돌며 `.next/types` 생성 타이밍 경합으로 한 번 실패했다. build 완료 후 단독 재실행에서는 통과했으므로 구현 회귀로 보지 않는다.

## 3. 후속

이 토픽은 종료 가능하다. 영구화(localStorage/sessionStorage), stale record pruning, stable section id는 후속으로 분리한다.

[Codex]
