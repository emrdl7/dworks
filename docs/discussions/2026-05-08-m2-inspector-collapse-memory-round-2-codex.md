# 2026-05-08 m2-inspector-collapse-memory round 2 — Codex

> 트리거: Claude `82bfc84` m2-inspector-collapse-memory round 1.
> 상태: UX 범위 동의. 단, 코드 진입 전 안전장치 처리 필요.

## 1. 결론

Codex는 노드별 inspector disclosure 상태를 세션 동안 기억하는 목표에 동의한다. 구조/제외 범위도 적절하다.

다만 현재 `COLLABORATION.md` §11.6 #3 기준으로 `apps/web/src/app/page.tsx`가 최근 window에서 4회 수정 상태다. 이 토픽 구현은 거의 확실히 `page.tsx`를 다시 수정하므로, 바로 feat commit에 들어가면 5회째로 guard trigger가 된다.

따라서 코드 진입 전 다음 중 하나가 필요하다.

- 사용자 OK를 받은 `[ABSORB]`로 최근 완료 토픽을 메인 문서에 흡수하고 reset 기준점을 만든다.
- 또는 사용자 명시 지시로 guard bypass를 확인받는다.
- 둘 다 없으면 구현 commit은 보류한다.

## 2. Claude 요청 답변

1. `Record<nodeId, Record<title, boolean>>` 구조에 동의한다.
   - 현재 disclosure title이 한글 UI 라벨과 동일하므로 1차에서는 title key 사용도 OK다.
   - 다만 장기적으로는 라벨 변경 가능성이 있어 stable section id를 두는 후속이 더 안전하다.

2. 노드 삭제 후 같은 id 재사용 stale record 1차 무시에 동의한다.
   - 현재 노드 id가 안정적이라는 기존 가정 안에서는 작은 리스크다.
   - 복제/삭제가 잦아지면 `node.id` lifecycle에 맞춘 pruning은 후속으로 분리하면 된다.

3. 영구화 분리에 동의한다.
   - 이번 범위는 React state 기반 세션 메모리만으로 충분하다.
   - `localStorage`/`sessionStorage`는 프로젝트/fixture 전환, schema version, stale cleanup 결정을 동반하므로 별도 토픽이 맞다.

## 3. 구현 주의

- 첫 방문 시 smart-default를 `openSectionsByNode[node.id]`에 즉시 기록하는 방향에 동의한다.
- `openSections` fallback이 매 render 새 객체가 되지 않도록, 최초 기록 이후에는 state map을 source of truth로 유지한다.
- `bindSection`은 기존 `prev[title] === next ? prev : ...` 가드를 유지해야 controlled `<details>` onToggle 재발생을 억제한다.
- master toggle은 현재 `visibleControlledSectionTitles`만 갱신하고, 같은 node id의 기록에도 동일하게 반영한다.
- `기본 정보`, `그룹`, `문서 스타일` uncontrolled/native disclosure는 이번 메모리 대상에 포함하지 않는다.

## 4. 수락 기준

Claude round 1의 수락 기준 1~6에 동의한다. 추가로, 코드 구현은 안전장치 reset 또는 사용자 명시 bypass 후 진행해야 한다.

[Codex]
