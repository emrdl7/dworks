# 핸드오버 — 디자인 모델 source of truth 마이그레이션 + 대형 파일 분할

작성: 2026-05-10
대상 HEAD: `e171113 docs: 현재 상태 정리 — STATE-2026-05-10-1011.md`

---

## 즉시 읽어야 할 파일

1. **이 파일** — 다음 단계 시작점
2. `docs/discussions/2026-05-10-design-model-source-of-truth-codex.md` — 코덱스 architectural 진단
3. `docs/STATE-2026-05-10-1011.md` — 현재 상태 (46 commit 정리)
4. `docs/HANDOVER-2026-05-10-overnight.md` — 직전 자율 mandate (드래그/트랙패드/UI 여백)

---

## 사용자 mandate (이번 마이그레이션)

> "전체 싹 다 가고 덩치가 커진 파일은 쪼개는것까지 다 인수인계 문서에 넣어"

= **Option C** (코덱스 권장): 전체 resolver 도입 + CanvasNode 마이그레이션 + 대형 파일 분할.

---

## 핵심 아키텍처 문제 (코덱스 진단 요약)

### 현재 (band-aid)

```
TreeNode
  ├─ CanvasNode: TreeNode + JSX/Tailwind className 기본값으로 렌더
  └─ NodeInspector: TreeNode + DOM getComputedStyle 역측정값 표시
```

문제:
- 캔버스 기본값(예: hero `gap-10`, `p-12`)이 className에 _숨어있음_
- 인스펙터는 그 값을 알 수 없어 DOM을 _역측정_
- CSS zoom / className 변경 시 인스펙터 값이 _쉽게 틀어짐_
- AI 생성 / 편집 / 내보내기 / QA가 _서로 다른 값_을 봄

### 목표 (resolved design model)

```
raw TreeNode
  + node type defaults
  + role / layoutIntent defaults
  + theme tokens
  + viewport responsive rules
  + explicit user overrides
  → resolveNodeDesign(node, context) → ResolvedNodeDesign

ResolvedNodeDesign
  ├─ CanvasRenderer (CanvasNode가 이걸 읽어 className/style 생성)
  ├─ InspectorControls (raw node 대신 resolved value 표시)
  ├─ Exporter
  └─ QA / eval
```

핵심 원칙:
- 캔버스와 인스펙터는 _같은_ resolver 결과 읽기
- 인스펙터 값마다 `source: explicit | default | token | responsive | inherited` 표시
- DOM 측정은 _제품 로직 X_ (개발 QA 또는 디버그만)

---

## 즉시 핫픽스 3건 (코덱스 P0)

resolver 도입 _전_에 일단 막아야 할 버그:

### P0-1: Zoom 나누기 버그 (1줄 수정)

`apps/web/src/app/page.tsx` 의 `useEffect(() => { measureEffective }` 안의 `px` helper:

```ts
// 잘못됨
const px = (v: string): number | undefined => {
  const n = parseFloat(v)
  if (!Number.isFinite(n)) return undefined
  return Math.round((n / z) * 10) / 10  // ← / z 제거
}

// 맞음
const px = (v: string): number | undefined => {
  const n = parseFloat(v)
  if (!Number.isFinite(n)) return undefined
  return Math.round(n * 10) / 10
}
```

이유: `getComputedStyle()` 픽셀은 CSS px 기준이지 visual px 아님. zoom 보정 대상 아니다.

200% 줌에서 padding 48 → 인스펙터에 24로 표시되던 버그. lineHeight/letterSpacing 환산은 fontSize도 같이 zoom 비례하므로 영향 없음 (분자/분모 동일).

### P0-2: 더블클릭 콘텐츠 탭 전환

`SelectableNode` 의 `onDoubleClick` (line ~6300):

현재: `requestAnimationFrame` 두 번 후 `aside details[open] textarea, input[type="text"]` 찾음. 이는 사용자가 _이미 콘텐츠 탭에 있을 때_만 동작.

수정: 더블클릭 시 _명시적으로_ `inspector-tab-content` 클릭 후 input 찾기.

```ts
onDoubleClick={(event) => {
  event.stopPropagation()
  if (selectionCtx.isPanActive) return
  if (node.type !== 'text' && node.type !== 'button' && node.type !== 'image') return
  onSelect(node.id)
  // 콘텐츠 탭으로 명시 전환
  requestAnimationFrame(() => {
    const tabBtn = document.getElementById('inspector-tab-content')
    tabBtn?.click()
    requestAnimationFrame(() => {
      const aside = document.querySelector<HTMLElement>('aside[aria-label="속성 패널"]')
      // 이제 콘텐츠 탭이 active이고 textarea가 mounted
      const target = aside?.querySelector<HTMLTextAreaElement | HTMLInputElement>(
        'textarea, input[type="text"]',
      )
      target?.focus()
      if (target instanceof HTMLTextAreaElement) target.select()
      else if (target instanceof HTMLInputElement) target.select()
    })
  })
}}
```

### P0-3: Layout 토글이 effective 무시

`LayoutControls.renderToggleGroup` 은 `layout[field] === option`만 본다. `effectiveStyle.flexDirection` 등 수집해놓고 토글 selected 상태에는 반영 안 함.

수정 방향:

```ts
function renderToggleGroup({ field, ... }) {
  // direction toggle: tree value || effective
  const effectiveDirection = layout.direction ?? (() => {
    const eff = effectiveStyle?.flexDirection
    if (eff === 'row' || eff === 'row-reverse') return 'row'
    if (eff === 'column' || eff === 'column-reverse') return 'column'
    return undefined
  })()
  // similar for justify/align/wrap
  ...
  isSelected={layoutWithEffective[field] === option}
}
```

display: grid는 NodeLayout 스키마에 없음. 별도 처리 필요 (resolver에서 layoutIntent로 표현).

---

## 마이그레이션 계획 (phase별)

### Phase 1: P0 핫픽스 (즉시 — 1~2 commit)

위 3건. resolver _없이도_ 가능. 안전망.

### Phase 2: design-resolver 패키지 도입 (3~5 commit)

새 파일: `apps/web/src/app/design-resolver.ts` (또는 `packages/design-model/src/index.ts`)

```ts
export interface ResolvedNodeDesign {
  layout: ResolvedLayout
  spacing: ResolvedSpacing
  color: ResolvedColor
  typography?: ResolvedTypography
  shape: ResolvedShape
  sources: Record<string, NodeDesignSource>
}

export type NodeDesignSource =
  | 'explicit'      // 트리에 명시
  | 'default'       // 노드 type default
  | 'role'          // role(banner/main/contentinfo)별 default
  | 'token'         // theme token (colorPreset 등)
  | 'responsive'    // viewport별 override
  | 'inherited'     // 부모로부터 상속

export interface ResolveContext {
  parent?: TreeNode
  ancestors: TreeNode[]
  viewport: ResponsiveViewport
  colorPreset: ColorPreset
  theme: ThemeTokens
}

export function resolveNodeDesign(
  node: TreeNode,
  context: ResolveContext,
): ResolvedNodeDesign
```

초기 범위 (코덱스 권장 + 시각 임팩트 큰 순):

1. **spacing**: padding / margin / gap (DOM 역측정 즉시 대체 가능)
2. **color**: background / text / accent / border / inherited text
3. **layout**: display / direction / justify / align / wrap / gap
4. **typography**: fontSize / fontWeight / lineHeight / letterSpacing / textAlign
5. **shape**: radius / shadow / border

각 영역 별도 `resolveSpacing(node, ctx)` / `resolveColor(node, ctx)` 등 내부 함수.

### Phase 3: CanvasNode 마이그레이션 (5~10 commit)

CanvasNode의 className 기반 default를 resolver default로 추출:

```ts
// 이전: className에 'gap-10 p-12' 하드코딩
case 'hero':
  return (
    <SelectableNode>
      <section className="grid min-h-[420px] gap-10 bg-[var(--dw-hero-surface)] p-12">
        ...
      </section>
    </SelectableNode>
  )

// 이후: resolver 결과로 className/style 생성
case 'hero':
  const resolved = resolveNodeDesign(node, ctx)
  return (
    <SelectableNode>
      <section
        style={resolvedToStyle(resolved)}
        className={resolvedToClassName(resolved)}
      >
        ...
      </section>
    </SelectableNode>
  )
```

각 노드 type별 점진 migration. 한 번에 다 X — node type 하나씩 + 시각 회귀 검증.

### Phase 4: Inspector 마이그레이션 (3~5 commit)

NodeInspector / Controls가 `effectiveStyle` 대신 resolver 결과 읽음:

```ts
// resolver 결과를 받음
const resolved = resolveNodeDesign(selectedNode, ctx)

<SpacingControls
  node={node}
  resolved={resolved}
  onSpacingChange={...}
/>

// SpacingControls 안에서:
const value = resolved.spacing.paddingTop  // explicit이면 explicit, 없으면 default
const source = resolved.sources.paddingTop  // 'explicit' | 'default' | ...
// source에 따라 visual indicator
```

`EffectiveCanvasStyle` + `useEffect(measureEffective)` 제거.

### Phase 5: AI 생성 후 normalize (2~3 commit)

LLM tree에 빠진 default를 resolver와 정합:

```ts
// apps/web/src/app/generation-normalize.ts
export function normalizeDesignTree(
  raw: Tree,
  context: NormalizeContext,
): Tree
```

역할:
- 풀 페이지 구조 보강 (root section + banner/main/contentinfo)
- 누락 spacing default 부여
- contrast guard (WCAG AA)
- responsive guard
- layoutIntent ↔ 실제 layout mapping

`handleGenerateTree` 흐름에서 LLM 응답 → schema parse → `normalizeDesignTree` → `commitTreeEdit`.

### Phase 6: page.tsx 파일 분할 (10~15 commit)

13,935 lines를 영역별로 split. 리팩터링 끝난 후 마지막에 진행.

목표 구조:

```
apps/web/src/app/
├── page.tsx                              # ~500 lines: top-level state + layout만
├── components/
│   ├── HeaderBar.tsx                     # 헤더 (logo, undo/redo, contrast, ?, drawer toggles)
│   ├── BriefPanel.tsx                    # 좌측 브리프 탭 (intent/clarify/generate)
│   ├── LayerPanel.tsx                    # 좌측 레이어 탭 (search, tree, drag-drop)
│   ├── CanvasArea.tsx                    # 중앙 캔버스 (toolbar + viewport + status bar)
│   ├── CanvasToolbar.tsx                 # toolbar (viewport switcher, zoom, fit, grid)
│   ├── CanvasStatusBar.tsx               # 하단 status bar
│   ├── CanvasNode.tsx                    # 트리 → JSX (case 별 분기)
│   ├── SelectableNode.tsx                # 캔버스 노드 wrapper
│   ├── NodeInspector.tsx                 # 우측 인스펙터 shell
│   ├── inspector/
│   │   ├── NodeColorControls.tsx
│   │   ├── TypographyControls.tsx
│   │   ├── LayoutControls.tsx
│   │   ├── SpacingControls.tsx
│   │   ├── ShapeControls.tsx
│   │   ├── ImageControls.tsx
│   │   └── shared/                       # 공통 컴포넌트
│   │       ├── TypographyNumberField.tsx
│   │       ├── IconToggleButton.tsx
│   │       ├── ColorField.tsx
│   │       └── InspectorDisclosure.tsx
│   ├── menus/
│   │   ├── NodeContextMenu.tsx
│   │   ├── GlobalContextMenu.tsx
│   │   └── ContextMenuButton.tsx
│   ├── ShortcutHelpPopover.tsx
│   └── DworksLogo.tsx
├── hooks/
│   ├── useCanvasZoom.ts                  # zoom state + cursor anchor
│   ├── useCanvasPanning.ts               # space drag + middle button
│   ├── usePanelResize.ts                 # 좌/우 패널 resize handle
│   ├── useGlobalShortcuts.ts             # ⌘Z/Y/D/0/1/2/A/F/\ 등
│   ├── useEffectiveCanvasStyle.ts        # (Phase 4 제거 예정)
│   └── useUiPrefs.ts                     # localStorage hydrate/persist
├── design-resolver.ts                    # Phase 2 신규
├── design-resolver.test.ts               # 신규 테스트
├── canvas-defaults.ts                    # 신규: type별/role별 default
├── theme-tokens.ts                       # 신규: theme/colorPreset 정의
├── generation-normalize.ts               # Phase 5 신규
├── tree-fixtures.ts                      # 기존
├── responsive.ts                         # 기존
├── richness.ts                           # 기존
├── generation-history.ts                 # 기존
├── generation-export.ts                  # 기존
├── generation-storage.ts                 # 기존
├── font-registry.ts                      # 기존
└── globals.css                           # 기존
```

### Phase 7: 검증 + 회귀 (지속)

각 phase 후:
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- Playwright 1680/768/440 + 100/150/200% 줌 dom-vs-inspector 비교
- 코덱스 acceptance criteria 6개 (특히 #2 zoom-stable, #5 export idempotent)

---

## 코덱스 acceptance criteria

resolver 마이그레이션 끝났을 때 통과해야 할 조건:

1. 새로 생성한 hero 선택 시 background, text color, padding, gap, layout mode가 인스펙터-캔버스 일치
2. 100/150/200% 줌에서 인스펙터 수치 변하지 않음
3. mobile/tablet/desktop preview 전환 시 viewport별 resolved 값 + source(responsive) 표시
4. reset 버튼 → 빈 값 X, resolved default로 회귀
5. export/import idempotent (같은 tree → 같은 resolved → 같은 export)
6. CanvasNode className 변경 시 resolver test 깨져서 default drift 잡힘

---

## 진행 시 주의사항

### 깨지지 않는 점진 마이그레이션

각 phase 후 _앱이 동작_해야 함. 지금 사용자가 시각 검증 중. 한 번에 다 갈아엎으면 회귀 위험.

전략:
- Phase 2 (resolver 도입)은 _기존 effectiveStyle과 병행_. 작은 영역(spacing)부터.
- Phase 3 (CanvasNode 마이그레이션)은 _node type 하나씩_. hero 먼저, 검증 후 card, list 등.
- Phase 6 (파일 분할)은 마지막. resolver 안정화 후.

### 페이지 분할 시 import 폭증 위험

page.tsx의 13,935줄 분할 시 새 파일들이 page.tsx에서 useState/Context를 받아야 함. props drilling 또는 새 Context 도입 필요.

전략:
- 각 영역별 자체 hook으로 state 관리 (`useCanvasZoom` 등)
- 공유 state는 Context로 (`CanvasSelectionContext` 이미 있음 — 확장)
- 작은 컴포넌트는 props로 받음 OK

### 큰 파일 분할 후 페이지 로딩

현재 page.tsx는 모든 컴포넌트 직접 import. 분할 후에도 같은 동작. Next.js code-splitting은 route 단위지 컴포넌트 단위 X — 한 페이지 안에서는 모두 같은 chunk.

성능 영향 거의 없음. 가독성/유지보수성 ↑.

---

## 현재 상태 (Phase 1 직전)

- 46 commit 누적 (eafd515 → e171113)
- 모든 기본 동작 통과 (lint/typecheck/test/build/dev/Playwright)
- 코덱스 P1+P2 round 1+2 회신 완료
- 코덱스 P0 round 4 (architectural) 진단 도착 — 이번 마이그레이션 대상

---

## 다음 사이클 시작 체크리스트

1. `git log --oneline e171113..HEAD` — 이 핸드오버 이후 진행분
2. `git status` clean 확인
3. Phase 1 (P0 핫픽스 3건) 부터 진행:
   - 3-1: zoom 나누기 제거
   - 3-2: 더블클릭 콘텐츠 탭 전환
   - 3-3: layout 토글 effective 반영
4. 각 fix 별도 commit + Playwright 검증
5. Phase 2 시작 — `apps/web/src/app/design-resolver.ts` 스캐폴드
6. spacing부터 작은 영역으로 시작 (코덱스 권장)

---

## 운영 학습

- 코덱스 architectural 비판은 _장기 빚 신호_. 단기 작업 멈추고 정리 필요.
- 사용자 mandate `_전체 싹 다 가고_`는 _큰 refactor 권한_ 부여. 그래도 점진 진행 (회귀 방지).
- 큰 파일 분할은 코드 변경 _후반_에 — 분할 중에 변경 점이 둘 있으면 conflict 위험.
- 핸드오버 문서는 사용자가 _명시 요청_ 시만. 이번처럼 "_인수인계 문서에 넣어_" 시그널이 그것.

---

[Claude]
