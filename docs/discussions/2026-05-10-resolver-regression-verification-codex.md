# 2026-05-10 resolver regression verification — Codex

검증 시각: 2026-05-10 16:59 KST

대상 HEAD: `f0acb30 refactor: inspector-atoms.tsx — Inspector 공통 atoms 분리`

기준 문서:

- `docs/discussions/2026-05-10-design-model-source-of-truth-codex.md`
- `docs/HANDOVER-2026-05-10-resolver-migration.md`

## 결론

Claude의 resolver 전환 방향은 맞다. `getComputedStyle()` zoom 보정 제거, 콘텐츠 더블클릭 focus, spacing/layout/typography/shape/color resolver 도입, canvas className default 축소, 파일 분리까지 진행됐다.

하지만 현재 HEAD는 아직 `1.0 완료`로 보기 어렵다. 아래 P1 두 건은 "인스펙터와 캔버스가 같은 resolved design model을 본다"는 핵심 기준을 깨고, 특히 gradient 누락은 AI 웹 디자인툴의 시각 품질을 직접 떨어뜨린다.

## 검증 결과

통과:

- `pnpm build`: 통과
- `pnpm --filter @dworks/web test`: 통과 (`151` tests)
- `http://localhost:3000/`: 200
- HTML에 연결된 CSS/JS fingerprint asset: 200
- Playwright 브라우저 로드:
  - request failure 없음
  - page error 없음
  - console error 없음

확인한 포트 상태:

- `localhost:3000`: Next app 응답 중
- `localhost:3001`: 별도 node process listen 중

## 보완 요구 사항

### P1 — explicit gradient color가 canvas render에서 사라짐

위치:

- `apps/web/src/app/design-resolver.ts:346-362`
- `apps/web/src/app/page.tsx:5697-5702`
- `apps/web/src/app/design-style.ts:269-296`

현재 흐름:

```text
node.color
  -> resolveColor()
  -> backgroundColor / textColor / accentColor만 value에 복사
  -> CanvasNode getColorStyle(resolvedColor)
  -> backgroundGradient / backgroundOpacity / textOpacity 손실
```

재현용 정적 확인:

```ts
resolveColor({
  id: 'h',
  type: 'hero',
  children: [],
  color: {
    backgroundGradient: {
      type: 'linear',
      direction: '135deg',
      from: '#111111',
      to: '#eeeeee',
    },
  },
}, { viewport: 'desktop' })
// 현재 결과: { value: {}, sources: {} }
```

문제:

- schema와 prompt는 `backgroundGradient`를 지원하고 적극 사용하도록 되어 있다.
- `packages/llm-prompts/src/index.ts` 예시 fixture도 hero gradient를 명시한다.
- 그런데 CanvasNode가 resolved color만 렌더하므로 explicit gradient가 캔버스에서 사라진다.
- AI 생성 결과가 색감 없는 화면으로 후퇴할 수 있어 디자인 품질 P1이다.

수용 기준:

- `resolveColor()` 또는 상위 `resolveNodeDesign()`이 explicit `NodeColor`의 모든 렌더 가능 필드를 보존한다.
- token으로 채워지는 값과 explicit 값의 우선순위가 명확해야 한다.
- `backgroundGradient`가 있으면 `getColorStyle()`에 그대로 전달되어 `backgroundImage`가 렌더된다.
- `backgroundOpacity`, `textOpacity`도 explicit이면 최종 style 계산에서 손실되지 않는다.
- 회귀 테스트 추가:
  - gradient-only color를 가진 hero가 resolved color에 gradient를 보존한다.
  - gradient가 backgroundColor token보다 우선 렌더된다.

권장 수정 방향:

- `resolveColor`를 단순 3-key picker로 두지 말고 `NodeColor` 전체를 병합 대상으로 삼는다.
- 기본/token slot은 `backgroundColor`, `textColor`, `accentColor`에만 적용하되, explicit object는 마지막에 병합한다.
- source metadata는 현재 3-key부터 시작해도 되지만, 렌더 가능한 explicit 필드는 버리면 안 된다.

### P1 — layout이 없는 hero도 mobile에서 column으로 resolve됨

위치:

- `apps/web/src/app/design-resolver.ts:149-152`
- `apps/web/src/app/responsive.ts:43-50`
- `apps/web/src/app/canvas-defaults.ts:130-142`
- `apps/web/src/app/page.tsx:9507-9557`

현재 흐름:

```ts
const defaults = DEFAULT_LAYOUT_BY_TYPE[node.type] ?? {}
const explicit = node.layout ?? {}
const responsiveExplicit =
  resolveResponsiveLayout(explicit, context.viewport) ?? explicit
```

`node.layout`이 없어도 `explicit`이 `{}`가 되므로 `resolveResponsiveLayout({}, 'mobile')`이 `direction: 'column'`을 만든다.

재현용 정적 확인:

```ts
resolveLayout(
  { id: 'h', type: 'hero', children: [] },
  { viewport: 'mobile' },
)
// 현재 결과: { value: { direction: 'column' }, sources: { direction: 'responsive' } }
```

문제:

- `DEFAULT_LAYOUT_BY_TYPE.hero = {}`로 hero는 grid 기반이고 NodeLayout flex default가 없다고 명시했다.
- 그런데 모바일에서는 layout이 없는 hero도 column으로 resolved 된다.
- `LayoutControls`가 `rl.direction`을 읽으므로 인스펙터는 column을 보여줄 수 있다.
- 실제 hero 기본 렌더는 grid/className 경로에 남아 있어, 모바일 인스펙터와 캔버스가 다른 구조를 말하게 된다.

수용 기준:

- layout 명시가 없는 hero/card/leaf는 mobile에서도 `direction`이 생기지 않는다.
- mobile row -> column 보정은 명시 layout이 있는 노드 또는 default layout이 실제 flex row인 노드에만 적용한다.
- hero grid 상태를 인스펙터에 표현하려면 `NodeLayout` flex direction으로 가짜 표시하지 말고, 별도 `layoutMode/gridIntent` 등 명시 모델을 추가한다.
- 회귀 테스트 추가:
  - `resolveLayout(makeHero(), { viewport: 'mobile' })`는 빈 layout이어야 한다.
  - `resolveLayout({ type: 'hero', layout: { direction: 'row' } }, mobile)`만 column responsive 보정을 받는다.

권장 수정 방향:

- `node.layout`의 undefined와 `{}`를 구분한다.
- `resolveResponsiveLayout()`에는 `node.layout` 자체를 넘기고, default responsive 보정은 별도 판단한다.
- 빈 explicit object 때문에 responsive source가 생기지 않도록 guard를 둔다.

### P3 — text-preview.tsx에 NUL/control character가 들어감

위치:

- `apps/web/src/app/text-preview.tsx:79`

문제:

- 주석 안에 실제 control character가 포함되어 `git diff --stat`에서 `text-preview.tsx | Bin 0 -> 6481 bytes`로 잡힌다.
- 기능 영향은 작지만, 리뷰/검색/패치 품질을 떨어뜨린다.

수용 기준:

- 실제 제어문자 제거.
- 주석은 escaped text로 표기:

```text
[\u0000-\u001F\u007F]
```

## Claude 작업 우선순위

1. P1 gradient 손실부터 수정한다. 디자인 품질 직접 회귀다.
2. P1 mobile hero layout false-positive를 수정한다. 인스펙터/캔버스 신뢰 문제다.
3. P3 NUL 문자 제거로 diff/tooling 품질을 복구한다.
4. 수정 후 최소 검증:
   - `pnpm --filter @dworks/web test`
   - `pnpm build`
   - `localhost:3000` 브라우저 로드
   - gradient hero fixture 또는 임시 tree에서 실제 gradient 렌더 확인
   - mobile hero 선택 시 layout inspector가 가짜 column을 표시하지 않는지 확인

## 최종 판단

현재 작업은 방향성은 맞지만, resolver가 "캔버스/인스펙터의 단일 source of truth"가 되기 전 단계에서 명시 스타일 일부를 버리고 있다.

Claude는 `EffectiveCanvasStyle`을 더 늘리는 방식이 아니라, resolver가 explicit design data를 손실 없이 보존하고 canvas/inspector가 같은 resolved 값을 읽도록 보완해야 한다.

[Codex]
