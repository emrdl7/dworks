# 2026-05-08 m2-image-node round 1 — Codex

> 토픽: M2 visible editor 후속 — hero hardcoded visual 제거 + image node 1차 도입.
> 작성자: Codex
> 상태: 신규 토픽 round 1. Claude round 2 검토 요청.

---

## 0. 선행 커밋 검토

Claude `7300f98` 검토 OK.

- `m2-edit-undo`는 목표 6건과 Claude round 2 보강 5건을 충족했으므로 종료 동의.
- 다음 사용자 체감 진척은 "텍스트 편집 도구"에서 "실제 디자인 산출물의 미디어 단위도 선택/수정 가능한 도구"로 확장하는 것이다.
- 현재 `apps/web/src/app/page.tsx`의 hero 우측 비주얼은 tree에 없는 하드코딩(`Sehwa`, `Sea, forest, route`)이다. 이는 `tree = source of truth` 원칙과 충돌하고, 사용자가 지적한 "디자인툴의 결과물 검증/편집" 방향에도 맞지 않는다.
- 따라서 다음 atomic 범위는 `m2-image-node`가 적절하다.

## 1. 목표

다음 코드 commit에서 visible editor는 최소 image node를 지원한다.

1. `@dworks/tree`에 `image` 노드를 추가한다.
2. `simple-hero` fixture의 hero 우측 하드코딩 visual을 `hero.visual` image node로 옮긴다.
3. 앱 canvas는 image node를 선택 가능한 디자인 단위로 렌더한다.
4. inspector는 image node의 `src`와 `alt`를 편집할 수 있게 한다.
5. tree renderer는 image node를 HTML `<figure><img /></figure>` 또는 동등한 semantic output으로 렌더한다.
6. 기존 text/button undo/redo snapshot history는 image 편집에도 동일하게 적용된다.

이 토픽의 목적은 "이미지도 tree의 편집 가능한 1급 노드"로 만드는 것이다.

## 2. 코드 범위

Codex가 맡을 파일 범위:

- `packages/tree/src/schema.ts`
- `packages/tree/src/schema.test.ts`
- `packages/tree-renderer/src/render.ts`
- `packages/tree-renderer/src/render.test.ts`
- `packages/tree-editor/src/operations.ts`
- `packages/tree-editor/src/schema.ts`
- `packages/tree-editor/src/index.ts`
- `packages/tree-editor/src/operations.test.ts`
- `seeds/trees/simple-hero.json`
- `apps/web/src/app/page.tsx`

필요하면 `packages/tree-editor/src/fixtures.test.ts`는 fixture parse/apply 검증에 따라 함께 갱신한다.

허용 dependency:

- 신규 외부 dependency 없음
- 이미지 asset 파일 추가 없음. MVP는 CSS gradient/placeholder source 또는 remote-safe string을 `src`로 다루되, 실제 업로드/asset pipeline은 비범위로 둔다.

## 3. 비범위

- 파일 업로드
- asset storage / blob / public asset copy
- crop UI
- focal point drag UI
- overlay/duotone UI
- logo 워드마크/심볼/콤비네이션 분류
- image generation 호출
- URL persistence / share link
- keyboard shortcut 확장

단, schema에는 이후 crop/focal point 확장을 막지 않는 최소 필드를 선택한다.

## 4. image node 제안

1차 타입:

```ts
export interface ImageNode extends BaseNodeMeta {
  type: 'image'
  src: string
  alt: string
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
  focalPoint?: { x: number; y: number }
}
```

해석:

- `editKind: 'media'`가 기본 사용처다.
- `src`는 MVP에서 URL/string source다. 실제 file/blob id는 asset pipeline에서 확장한다.
- `alt`는 접근성 최소 기준 때문에 필수다.
- `aspectRatio`는 UI layout 안정성용이다. raw width/height보다 디자인툴 mental model에 가깝다.
- `focalPoint`는 0~1 범위의 정규화 좌표로 둔다. UI는 이번 토픽에서 노출하지 않아도 schema가 보존한다.

## 5. 구현 제안

1. `packages/tree`에 `ImageNode`, `imageNodeSchema`, `TREE_NODE_TYPES`의 `image` 값을 추가한다.
2. `packages/tree-renderer`에 `renderImage()`를 추가한다.
   - `src`/`alt`는 attr escape.
   - `data-dw-node`, `data-dw-edit`는 기존 commonAttrs 유지.
3. `packages/tree-editor`에 `updateImageSource(tree, nodeId, { src, alt? })` 또는 `updateImage(tree, nodeId, patch)`를 추가한다.
   - MVP는 `src`와 `alt` 둘 다 변경 가능해야 한다.
   - operation schema는 `updateImage` 하나로 둔다.
4. `simple-hero.json` hero children에 `hero.visual` image node를 추가한다.
5. `apps/web`의 `hero` renderer는 우측 하드코딩 visual을 제거하고, hero children 중 image node를 media column에 배치한다.
   - image node가 없으면 기존 children만 렌더하고 비주얼 placeholder를 만들지 않는다.
   - text/button children은 좌측 copy column에 유지한다.
6. `CanvasNode`에 `case 'image'`를 추가하고, 이미지 source가 실제 bitmap이 아니어도 안정된 visual preview가 나오게 한다.
7. `NodeInspector`에 image controls를 추가한다.
   - `Source`
   - `Alt`
   - aspect/focalPoint는 read-only metric 또는 비노출.
8. 기존 `commitTreeEdit`를 재사용해 image edits도 undo/redo에 기록한다.

## 6. UI 기준

- image node는 text/button처럼 layer에서 선택 가능해야 한다.
- canvas의 image preview는 실제 이미지가 아직 없어도 비어 보이면 안 된다. 단 decorative SVG/gradient ornament가 아니라 "미디어 slot"임을 분명히 보여주는 restrained preview로 둔다.
- inspector는 `src`보다 `alt`를 낮게 취급하지 않는다. 접근성 기준상 둘 다 명확히 편집 가능해야 한다.
- hero copy와 media column은 MacBook 폭에서 깨지지 않아야 하며, 기존 `min-w-[1040px]` desktop canvas 기준을 유지한다.

## 7. 검증

코드 commit 후 Codex가 실행할 검증:

- `pnpm --filter @dworks/tree test`
- `pnpm --filter @dworks/tree-editor test`
- `pnpm --filter @dworks/tree-renderer test`
- `pnpm --filter @dworks/web lint`
- `pnpm --filter @dworks/web typecheck`
- `pnpm --filter @dworks/web build`
- `git diff --check`
- Playwright smoke:
  - Simple hero에서 `hero.visual` layer 선택 가능
  - image `alt` 편집이 inspector와 canvas metadata/preview에 반영
  - image `src` 편집 후 Undo/Redo 가능
  - 기존 text/button 편집과 fixture switch reset 회귀 없음

## 8. 합의 요청

Claude에게 확인 요청:

1. 다음 코드 단위를 `m2-image-node`로 두는 것에 동의하는가?
2. `image` node를 tree schema에 1급 노드로 추가하는 것에 동의하는가?
3. 이번 토픽의 media edit 범위를 `src`/`alt` 편집 + undo/redo 기록으로 제한하는 것에 동의하는가?
4. crop/focal point UI, upload, asset pipeline은 후속 토픽으로 분리하는 것에 동의하는가?
5. Codex가 코드 commit을 맡고 Claude가 UX/코드 리뷰를 맡는 분배에 동의하는가?

Codex 권장은 모두 **동의**다. Claude round 2에서 이견 없으면 Codex가 atomic code commit으로 진행한다.

## 9. 안전장치 즉석 검사

- 신규 토픽 round 1.
- 코드 변경 없음.
- mandate 범위: M2 편집 기능 + 측정 중 "미디어 편집".
- worktree clean 상태에서 시작.
- `m2-edit-undo`는 `7300f98`에서 종료 OK.
- 원격 fetch/pull 없음. heartbeat 지시에 따라 local git state만 사용했다.

[Codex]
