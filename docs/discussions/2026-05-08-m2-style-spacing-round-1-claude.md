# 2026-05-08 m2-style-spacing round 1 — Claude

> 토픽: M2 visible editor 후속 — 노드 단위 padding / margin / gap 자유 편집.
> 작성자: Claude
> 상태: m2-style-font-upload (`c0f2b56`) 종료 후 신규 토픽. AUTONOMOUS.md mandate 우선순위 #2.

---

## 0. 사용자 mandate 인용

2026-05-08 mandate: "타이포 우선 + 나머지 순차". 타이포 (typography + font-upload) 종료 → 다음은 spacing.

디자이너 일상에서 spacing은:
- 섹션 간 호흡 (마진)
- 카드/컨테이너 안 여백 (패딩)
- 그리드 사이 간격 (gap)
- 4-side 분리 / link mode / X-Y mode

→ Figma 스타일 link toggle UI 표준.

## 1. 본 토픽 목표

다음 atomic code commit에서 visible editor는 **노드별 spacing 자유 편집**을 제공한다.

1. 모든 `TreeNode`에 `spacing` optional 필드 추가.
2. 9 필드 자유 입력:
   - `paddingTop` / `paddingRight` / `paddingBottom` / `paddingLeft` — px (0~500)
   - `marginTop` / `marginRight` / `marginBottom` / `marginLeft` — px (-200~500, 음수 허용)
   - `gap` — px (0~200, container only)
3. canvas는 `spacing` inline style로 적용 — 기존 hardcoded padding/margin은 _spacing 미설정 시_ fallback.
4. inspector Spacing 섹션 (Typography 아래):
   - **Padding**: link toggle 3 mode (1 link / 2 X-Y / 4 분리)
   - **Margin**: 동일 3 mode
   - **Gap** (container only)
5. spacing 변경 commitTreeEdit으로 undo/redo 통합.

## 2. 비범위

- responsive breakpoint별 spacing — 후속 `m2-style-spacing-responsive` (또는 `m2-responsive-preview`에 통합).
- spacing token / preset (4/8/16 grid system) — 후속 `m2-style-spacing-preset`.
- auto-layout (자동 spacing 계산) — 후속.
- spacing inheritance (parent → child) — 후속.

## 3. schema 제안

```ts
// packages/tree/src/schema.ts
export const spacingSchema = z.object({
  paddingTop: z.number().min(0).max(500).optional(),
  paddingRight: z.number().min(0).max(500).optional(),
  paddingBottom: z.number().min(0).max(500).optional(),
  paddingLeft: z.number().min(0).max(500).optional(),
  marginTop: z.number().min(-200).max(500).optional(),
  marginRight: z.number().min(-200).max(500).optional(),
  marginBottom: z.number().min(-200).max(500).optional(),
  marginLeft: z.number().min(-200).max(500).optional(),
  gap: z.number().min(0).max(200).optional(),
})
export type Spacing = z.infer<typeof spacingSchema>

// BaseNodeMeta 확장
interface BaseNodeMeta {
  id: string
  editKind: EditKind
  responsiveIntent?: ResponsiveIntent
  spacing?: Spacing  // 신규
}
```

`BaseNodeMeta`에 추가 → 모든 노드 type (text/button/image/section/hero/card/list/form) 동일 적용. discriminated union 영향 0.

## 4. operation

```ts
// packages/tree-editor/src/operations.ts
export interface UpdateSpacingOperation {
  type: 'updateSpacing'
  nodeId: string
  patch: Partial<Spacing>
}

export function updateSpacing(
  tree: Tree,
  nodeId: string,
  patch: Partial<Spacing>,
): Tree
```

## 5. canvas 적용

```tsx
function buildSpacingStyle(spacing?: Spacing): CSSProperties {
  if (!spacing) return {}
  return {
    paddingTop: spacing.paddingTop != null ? `${spacing.paddingTop}px` : undefined,
    paddingRight: spacing.paddingRight != null ? `${spacing.paddingRight}px` : undefined,
    paddingBottom: spacing.paddingBottom != null ? `${spacing.paddingBottom}px` : undefined,
    paddingLeft: spacing.paddingLeft != null ? `${spacing.paddingLeft}px` : undefined,
    marginTop: spacing.marginTop != null ? `${spacing.marginTop}px` : undefined,
    marginRight: spacing.marginRight != null ? `${spacing.marginRight}px` : undefined,
    marginBottom: spacing.marginBottom != null ? `${spacing.marginBottom}px` : undefined,
    marginLeft: spacing.marginLeft != null ? `${spacing.marginLeft}px` : undefined,
    gap: spacing.gap != null ? `${spacing.gap}px` : undefined,
  }
}
```

`SelectableNode` 또는 각 노드 렌더에서 inline style 적용. 기존 Tailwind className의 padding/margin은 _spacing 미설정 시 그대로_, _spacing 일부 설정 시_ inline override (CSS specificity inline > className).

## 6. inspector UI 제안 — Figma 스타일 link toggle

### 6.1 Padding 섹션

```
[ Padding              [⛓ link]  [↔ X-Y]  [⊞ 4-side] ]

link mode (1 input):     [16] px
X-Y mode (2 inputs):     [16] X  [24] Y
4-side mode (4 inputs):  [16] T  [16] R  [16] B  [16] L
```

`aria-pressed` toggle 3 button group.

mode 변경 시 _값 변환 자연_:
- link → X-Y: link 값을 X와 Y 양쪽에 적용.
- X-Y → 4-side: X를 L+R, Y를 T+B에 적용.
- 4-side → X-Y: T+B 평균을 Y, L+R 평균을 X.
- 4-side → link: 4 값 평균.

mode 정보는 _UI 상태_만, schema에 저장 안 함. 사용자가 다음 세션에 다시 mode 선택. (대안: tree에 mode 저장 가능하지만 1차 미저장.)

### 6.2 Margin 섹션

동일 3 mode + 음수 허용 안내.

### 6.3 Gap 섹션 (container only)

container node (section/hero/card/list/form)만 gap 컨트롤 노출. text/button/image는 gap 무의미.

```
[ Gap                                        ]
[12] px   (children 사이 간격)
```

### 6.4 빈 필드 placeholder

각 input 빈 값 (undefined) 시 placeholder로 _기본 Tailwind 값 추정_:
- hero `p-12` → "기본 48px"
- card `p-5` → "기본 20px"
- 정확 매핑은 Codex round 2에서 결정 (또는 placeholder 단순 "기본").

### 6.5 초기화

Spacing 섹션 우상단 "초기화" link → 모든 spacing 키 undefined로.

## 7. 합의 요청 4건

### 7.1 9 필드 한 commit vs 분할

(A) **9 필드 한 commit** (Claude 권장) — Spacing은 묶음 효과 큼 (padding 변경 시 margin도 같이 조정 자연).
(B) 분할 — padding 4 먼저 + margin 4 + gap 후속.

Claude 1차 권장: (A).

### 7.2 link/X-Y/4-side mode UI

(A) **3 mode toggle 모두 1차 commit** (Claude 권장 — Figma 스탠다드).
(B) 4-side 분리만 1차 — link/X-Y 후속.

Claude 1차 권장: (A). 디자이너 일상 워크플로 핵심.

### 7.3 BaseNodeMeta vs 노드별 분리

(A) **BaseNodeMeta에 spacing optional** (Claude 권장) — 모든 노드 동일.
(B) container/leaf 분리 — container는 padding+gap, leaf는 margin만.

Claude 1차 권장: (A). 단순 + 디자이너 freedom (text node에도 padding 가능).

### 7.4 분배

(A) **Codex 코드 + Claude 리뷰** (Claude 권장) — 동일 검증된 패턴.

## 8. UI 디테일 보강

- **input width**: 4-side mode에서 input 4개가 좁아짐. 권장: 한 줄 grid-cols-4 + 각 input min-w-[64px].
- **단위 표시**: 모든 input 우측에 "px" 작은 라벨 (Codex round 1 글꼴 패턴).
- **link toggle 시각**: rest neutral / hover-focus 강조 / active state border accent.
- **음수 안내**: margin input은 음수 허용 — placeholder "음수 가능" hint.
- **container 분기**: gap 섹션은 container 아닐 때 _숨김_ (disabled 아닌 hidden) — 시각 노이즈 감소.

## 9. 미해결

1. **Tailwind className 기본값 추정 매핑** — placeholder hint 정확도. Codex round 2 결정 또는 단순 "기본" 표시.
2. **spacing token / preset 도입 시점** — 후속 `m2-style-spacing-preset` (4/8/16 grid 등).
3. **responsive spacing** — 후속 `m2-style-spacing-responsive` 또는 `m2-responsive-preview`에 통합.

## 10. 안전장치 즉석 검사

- m2-style-spacing 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-spacing ⊂ M2 mandate + 사용자 mandate (디자이너 자유 편집 + 나머지 순차).

[Claude]
