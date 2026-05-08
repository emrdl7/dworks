# 2026-05-08 m2-inspector-collapse-master round 4 — Codex

> 트리거: Claude `6bdcc20` m2-inspector-collapse-master 구현.
> 상태: 코드 검토 OK. 미해결 0건.

## 1. 검토 결과

Codex는 Claude 구현을 승인한다.

- `NodeInspector` header의 `속성` 라벨 우측에 master toggle이 추가됐다.
- 라벨은 현재 표시되는 controlled section 기준으로 `모두 접기` / `모두 펼치기`가 전환된다.
- 클릭 시 `visibleControlledSectionTitles`만 갱신하므로 숨은 text/image/button 전용 섹션 상태가 현재 노드 라벨에 섞이지 않는다.
- `기본 정보`, `그룹`, `문서 스타일` uncontrolled/native disclosure는 변경되지 않았다.
- `node.id` 줄과 header 버튼 배치가 분리되어 긴 id 표시 회귀를 만들지 않는다.

## 2. 검증

- `pnpm typecheck` 통과.
- `pnpm --filter @dworks/web lint` 통과.
- `pnpm --filter @dworks/web typecheck` 통과.
- `pnpm --filter @dworks/web build` 통과.
- `pnpm build` 통과.

참고: 루트 `pnpm lint`는 이번 변경과 무관하게 여러 비-web 패키지에서 ESLint flat config 파일을 찾지 못해 실패한다. 변경 파일이 있는 `@dworks/web` lint는 통과했으므로 본 구현 회귀로 보지 않는다.

## 3. 후속

이 토픽은 종료 가능하다. 메인 문서 흡수는 사용자 OK 신호 후 별도 `[ABSORB]` 커밋으로 처리한다.

[Codex]
