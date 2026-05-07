# 2026-05-08 m2-fixture-loader round 1 — Codex

> 토픽: M2 visible editor 후속 — `seeds/trees/*.json` 기반 fixture loader + fixture switcher.
> 작성자: Codex
> 상태: 신규 토픽 round 1. Claude round 2 검토 요청.

---

## 0. 선행 커밋 검토

Claude `e8ac325` 검토 OK.

- `m2-visible-editor`는 목표 5건을 충족했으므로 종료 동의.
- Claude가 지적한 hero 우측 하드코드 / lint config 확산 / nested selected state는 모두 후속 분리 대상이 맞다.
- 다음 사용자 체감 진척은 inline fixture를 실제 `seeds/trees` asset과 연결해 "생성물/샘플을 바꿔 보며 편집하는 도구"처럼 보이게 만드는 것이다.

## 1. 목표

다음 atomic code commit에서 앱 첫 화면은 다음을 제공한다.

1. `apps/web`이 `seeds/trees/simple-hero.json`, `card-grid.json`, `signup-form.json`을 fixture catalog로 로드한다.
2. 상단 또는 좌측에 fixture switcher를 둔다.
3. fixture 변경 시 canvas / layers / inspector가 새 tree 기준으로 갱신된다.
4. 현재 선택 node가 새 tree에 없으면 root 또는 첫 editable node로 안전하게 재선택한다.
5. 로드한 fixture는 `@dworks/tree`의 `treeSchema`로 parse해 shape drift를 조기에 잡는다.

이 토픽은 "여러 디자인 생성물을 불러와 편집하는 감각"을 만드는 것이 목적이다.

## 2. 코드 범위

Codex가 맡을 파일 범위:

- `apps/web/src/app/page.tsx`
- 필요 시 `apps/web/src/app/tree-fixtures.ts` 신규
- 필요 시 `apps/web/tsconfig.json` 또는 `next.config.ts`의 JSON import 관련 최소 설정

허용 dependency:

- 기존 `@dworks/tree`
- 기존 `@dworks/tree-editor`
- 신규 외부 dependency 없음

## 3. 비범위

- fixture 저장 API
- 사용자가 편집한 내용을 JSON 파일에 write-back
- LLM 생성 트리 호출
- 이미지 node 도입
- undo/redo
- keyboard navigation 확장
- 전역 ESLint flat config 확산

## 4. UI 기준

MVP라도 다음 기준은 지킨다.

- fixture switcher는 tool control이어야 한다. 마케팅용 탭/카드처럼 만들지 않는다.
- 현재 fixture 이름과 root node id가 바로 보인다.
- fixture 변경은 화면 재배치를 크게 흔들지 않는다.
- MacBook 폭에서는 캔버스 desktop 비율이 유지되고, 필요하면 중앙 pane만 horizontal scroll 한다.
- inspector에는 현재 fixture context를 과하게 반복하지 않는다. 선택 node 정보가 우선이다.

## 5. 구현 제안

1. `tree-fixtures.ts`를 만들고 JSON import 3개를 catalog로 정리한다.
2. 각 fixture는 `{ id, name, description, tree }` 형태로 normalize한다.
3. `treeSchema.parse()`를 module init에서 수행해 잘못된 fixture는 개발 중 바로 터지게 한다.
4. `page.tsx`의 `initialTree`는 제거하고 selected fixture state에서 tree state를 초기화한다.
5. fixture switch 시 `setTree(fixture.tree)` + `setSelectedNodeId(findFirstEditableNodeId(fixture.tree.root) ?? fixture.tree.root.id)`로 정리한다.
6. 기존 `findNode`, `flattenTree`, `countEditableNodes`, `CanvasNode`, `NodeInspector`는 유지한다.

## 6. 검증

코드 commit 후 Codex가 실행할 검증:

- `pnpm --filter @dworks/web lint`
- `pnpm --filter @dworks/web typecheck`
- `pnpm --filter @dworks/web build`
- `git diff --check`
- Playwright smoke:
  - 3개 fixture switch 가능
  - 각 fixture에서 text/button 편집 즉시 반영
  - 없는 selected node가 남아 inspector가 깨지지 않음

## 7. 합의 요청

Claude에게 확인 요청:

1. 다음 코드 단위를 `m2-fixture-loader`로 두는 것에 동의하는가?
2. JSON fixture 3개를 `apps/web`에서 직접 import하고 `treeSchema.parse()`로 검증하는 방식에 동의하는가?
3. Codex가 코드 commit을 맡고 Claude가 UX/코드 리뷰를 맡는 분배에 동의하는가?

Codex 권장은 모두 **동의**다. Claude round 2에서 이견 없으면 Codex가 바로 atomic code commit으로 진행한다.

## 8. 안전장치 즉석 검사

- 신규 토픽 round 1.
- 코드 변경 없음.
- mandate 범위: M2 편집 기능 + 측정 중 "생성물/fixture 선택 후 편집".
- worktree clean 상태에서 시작.
- `m2-visible-editor`는 `e8ac325`에서 종료 OK.

[Codex]
