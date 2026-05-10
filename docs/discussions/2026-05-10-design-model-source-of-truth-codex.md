# 디자인 모델 source of truth 점검 — Codex

작성일: 2026-05-10
대상: `apps/web/src/app/page.tsx` 최신 작업분 (`0d74ede` 기준)

## 결론

현재 Claude의 후속 작업은 "인스펙터에 캔버스 렌더값을 보여주기 위한 DOM 역측정 레이어"를 추가한 방향이다. 이 접근은 단기 보정으로는 이해할 수 있지만, 디자인툴 구조로는 맞지 않다.

정답은 인스펙터가 캔버스를 측정해서 따라가는 것이 아니라, **AI 생성 / 캔버스 / 인스펙터 / 내보내기가 같은 resolved design model을 바라보게 하는 것**이다.

## 현재 구조 문제

현재 데이터 흐름은 다음처럼 갈라져 있다.

```text
TreeNode
  ├─ CanvasNode: TreeNode + JSX/Tailwind className 내부 기본값으로 렌더
  └─ NodeInspector: TreeNode + DOM getComputedStyle 역측정값으로 표시
```

대표 사례:

- hero 기본 `gap`, `padding`, `background`, `textColor`는 `CanvasNode`의 className 안에 숨어 있다.
- 인스펙터는 `node.layout`, `node.spacing`, `node.color`만으로 그 값을 알 수 없다.
- 이 차이를 메우려고 `EffectiveCanvasStyle`이 DOM computed style을 읽어 인스펙터에 전달한다.

이 구조에서는 다음 문제가 반복된다.

- CSS zoom / viewport / className 변경에 따라 인스펙터 값이 쉽게 틀어진다.
- 캔버스 기본값이 코드 여러 곳에 흩어져 AI 생성/편집/내보내기와 동기화되지 않는다.
- grid, split, dashboard 같은 웹 구조가 `NodeLayout`의 flex 중심 스키마로 충분히 표현되지 않는다.
- 사용자 입장에서는 "인스펙터 값 = 실제 디자인 값"이라는 기본 신뢰가 깨진다.

## 이번 리뷰에서 확인한 결함

1. `getComputedStyle()` 값에 `canvasZoom`을 나눠 비 100% 줌에서 값이 틀어진다.
   - 200% 줌에서 실제 `gap: 40px`, `padding: 48px`, `font-size: 48px`가 인스펙터에는 `20`, `24`, `24`로 표시된다.
   - computed style px 값은 이미 CSS px 기준이므로 zoom 보정 대상이 아니다.

2. layout resolved state가 여전히 불완전하다.
   - `effectiveStyle.display`, `flexDirection`, `justifyContent`, `alignItems`를 수집하지만 `LayoutControls` 선택 상태는 여전히 `node.layout`만 본다.
   - hero처럼 실제 캔버스가 grid로 렌더되는 기본 상태는 layout control에 제대로 표현되지 않는다.

3. 더블클릭 콘텐츠 포커스는 현재 탭에 의존한다.
   - 콘텐츠 탭으로 전환하지 않고 현재 열린 disclosure의 input/textarea를 찾는다.
   - 디자인/레이아웃 탭에 있으면 콘텐츠 필드가 아니라 다른 input이 잡히거나 실패한다.

## 바람직한 구조

raw tree를 그대로 캔버스와 인스펙터가 각각 해석하면 안 된다. 중간에 단일 resolver가 있어야 한다.

```text
raw TreeNode
  + node type defaults
  + role / layoutIntent defaults
  + theme tokens
  + viewport responsive rules
  + explicit user overrides
  = ResolvedNodeDesign

ResolvedNodeDesign
  ├─ CanvasRenderer
  ├─ InspectorControls
  ├─ Exporter
  └─ QA / eval
```

핵심 원칙:

- 캔버스와 인스펙터는 같은 `ResolvedNodeDesign`을 읽는다.
- 인스펙터는 값마다 `source: explicit | default | token | responsive | inherited` 같은 출처만 함께 표시한다.
- DOM 측정은 제품 로직이 아니라 개발용 QA 또는 예외적 디버그 용도로만 둔다.

## 권장 구현 순서

### 1. 즉시 핫픽스

- `getComputedStyle()`로 읽은 px 값에서 `canvasZoom` 나누기 제거.
- 더블클릭 시 콘텐츠 탭으로 전환한 뒤 해당 노드의 콘텐츠 필드에 focus.
- 기존 `effectiveStyle`은 단기적으로 유지하되 "최종 구조"로 보지 않는다.

### 2. resolver 도입

새 파일 후보:

- `apps/web/src/app/design-resolver.ts`
- 장기적으로는 `packages/tree-renderer` 또는 별도 `packages/design-model`

초기 API 예시:

```ts
export interface ResolvedNodeDesign {
  layout: ResolvedLayout
  spacing: ResolvedSpacing
  color: ResolvedColor
  typography?: ResolvedTypography
  shape: ResolvedShape
  sources: Record<string, 'explicit' | 'default' | 'token' | 'responsive' | 'inherited'>
}

export function resolveNodeDesign(
  node: TreeNode,
  context: ResolveContext,
): ResolvedNodeDesign
```

초기 범위는 모든 스타일을 한 번에 옮기지 말고, 이번 문제가 터진 영역부터 시작한다.

- spacing: padding / margin / gap
- layout: display / flex / grid intent / align / justify / wrap
- color: background / text / inherited text
- typography: font size / weight / line height / letter spacing

### 3. CanvasNode와 Inspector를 resolver로 연결

- `CanvasNode`는 className 내부 기본값을 줄이고 resolver 결과로 style/class를 만든다.
- `NodeInspector`는 raw `node.*`가 아니라 resolver 결과를 value로 보여준다.
- 사용자가 값을 수정하면 raw tree에는 explicit override만 기록한다.
- reset은 explicit override를 제거하고 resolver default로 돌아간다.

### 4. AI 생성 후 정규화

LLM이 모든 스타일 값을 완벽히 직접 쓰게 만들면 결과가 불안정하다. 생성 후 코드가 보강하는 단계가 필요하다.

```text
LLM tree
  -> treeSchema / sanitize
  -> normalizeDesignTree
  -> resolved preview
```

`normalizeDesignTree()` 역할:

- 풀 페이지 구조 보강
- 누락된 section spacing 기본값 부여
- hero/card/button의 편집 가능한 기본 스타일 명시 또는 resolver default 연결
- layoutIntent와 실제 layout 표현 정합
- contrast / responsive guard 적용

이렇게 해야 AI 생성 품질과 디자인툴 편집 가능성이 같이 간다.

## 디자인툴 관점의 acceptance criteria

다음 조건을 만족해야 "인스펙터와 캔버스가 같은 데이터를 본다"고 판단할 수 있다.

1. 새로 생성된 hero를 선택하면 인스펙터의 background, text color, padding, gap, layout mode가 캔버스와 일치한다.
2. 100%, 150%, 200% zoom에서 인스펙터 수치가 변하지 않는다.
3. mobile/tablet/desktop preview 전환 시 인스펙터는 현재 viewport의 resolved 값을 보여주고, source가 responsive인지 표시한다.
4. reset을 누르면 값이 비는 것이 아니라 resolved default로 돌아간다.
5. export/import 후 같은 tree가 같은 resolved design을 만든다.
6. DOM className을 바꿔도 resolver test가 깨져서 기본값 drift를 잡는다.

## Claude 후속 작업 가이드

우선순위는 다음 순서가 맞다.

1. P1 핫픽스: zoom 보정 제거, 더블클릭 콘텐츠 탭 전환.
2. `EffectiveCanvasStyle` 확장으로 계속 땜질하지 말고 resolver 설계로 전환.
3. `CanvasNode` className에 숨어 있는 기본 디자인 값을 resolver default로 하나씩 끌어낸다.
4. layout schema는 flex만 전제하지 말고 `layoutIntent='grid'`와 실제 grid 표현 사이의 mapping을 명확히 한다.
5. AI 생성 prompt 강화보다 생성 후 정규화와 resolver 정합을 먼저 잡는다.

이번 이슈는 단순 버그가 아니라 제품 구조 문제다. dworks가 "AI가 만든 웹 디자인을 사람이 고치는 도구"가 되려면, 렌더 결과를 인스펙터가 추적하는 방식이 아니라 **공유 디자인 모델을 중심으로 생성/렌더/편집/검증이 합쳐지는 구조**가 필요하다.
