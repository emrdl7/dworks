# 2026-05-08 m2-style-controls round 1 — Claude

> 토픽: M2 visible editor 후속 — 스타일 편집 (D7 #4) 1차.
> 작성자: Claude
> 상태: 사용자 2026-05-08 신호 ("디자인툴인 만큼 세세한 디자인 편집이 가능해야 해... 현재 상태로는 뭐 좋다 나쁘다 할 수 없는 상황... 좀더 진행해") 흡수 후 신규 토픽.

---

## 0. 사용자 의도 흡수

사용자 신호: 현재 visible editor는 콘텐츠/미디어/구조 편집까지만 도달. **디자인툴 평가 자체가 불가능한 상태** — 디자인을 바꿀 수 없으니 "디자인이 좋다/나쁘다" 말할 수 없음.

D7 6범위 진척:
1. 콘텐츠 ✓ (m2-visible-editor + m2-edit-undo)
2. 미디어 ✓ 부분 (src/alt만, crop/focal/overlay 미구현)
3. 구조 ✓ (m2-structure-ops)
4. **스타일** ❌ ← 본 토픽 시작
5. 반응형 ❌
6. 고도화 연결 ❌

본 토픽은 D7 #4 스타일 편집의 _첫 단위_. 단계 분할 후 큰 시각 변화부터.

## 1. 스타일 편집 단계 분할

전체 D7 #4 범위 (`color preset / 배경 톤 / 타이포 강도 / 섹션 밀도 / radius / shadow`)를 4 토픽으로 분할:

| 단계 | 토픽 | 내용 |
|------|------|------|
| 1 | **m2-style-color** ← 본 토픽 | colorPreset enum (5종) + 배경 톤 + 캔버스 CSS var 적용 |
| 2 | m2-style-typography | typography scale (display/regular/dense) + 글꼴 강도 |
| 3 | m2-style-shape | cornerRadius (none/soft/pill) + elevation (flat/raised/floating) |
| 4 | m2-style-density | 섹션 spacing 밀도 (compact/regular/loose) |

각 단계는 _atomic 코드 1 commit_. 본 round 1은 단계 1 (color)에 집중.

## 2. 본 토픽 (단계 1) 목표

다음 atomic code commit에서 visible editor는 **색상 프리셋 변경**으로 _전체 디자인 분위기_가 바뀐다.

1. `@dworks/tree` `Tree` (root level) 또는 `SectionNode` (root section)에 `styleTokens` optional field 추가.
2. `styleTokens.colorPreset` enum (5종): `mint` / `navy` / `sand` / `plum` / `graphite`.
3. 각 preset은 4가지 색상 토큰으로 구성: `surface` / `surfaceMuted` / `textPrimary` / `accent`.
4. canvas는 root preset을 CSS variable (`--dw-surface` 등)로 적용 — text/button/section/hero/card 모두 토큰 참조.
5. inspector root section 선택 시 Style group에 colorPreset selector 노출.
6. preset 변경은 commitTreeEdit으로 undo/redo 통합.

## 3. 비범위

- preset 커스텀 색상 (사용자 직접 hex 입력) — 별도 토픽
- 노드 단위 색상 override — 후속
- gradient / overlay
- dark mode
- 색상 검사 / WCAG 대비 자동 측정 — 후속 (`m2-style-a11y`)
- 타이포 / radius / shadow / 밀도 — 단계 2~4

## 4. styleTokens 제안

### 4.1 위치 — Tree root vs SectionNode root

**Claude 1차 권장**: **Tree root** (Tree 인터페이스에 추가). 이유:
- 사용자 mental model: "이 디자인의 톤"은 _문서 단위_, _섹션 단위_ 아님.
- 후속 (`m2-style-typography` 등)도 동일 root에 누적 — schema 일관.
- `Tree.styleTokens?` optional → 기존 fixture backward compatible.

대안: SectionNode (root section만). 이유: tree schema 변경 안 함. 다만 SectionNode 외 root는 schema상 가능 (현재 모든 fixture가 section이지만).

### 4.2 colorPreset 5종

| preset | surface | surfaceMuted | textPrimary | accent | 의도 |
|--------|---------|--------------|-------------|--------|------|
| `mint` | `#f5f7f4` | `#fbfcfa` | `#18211d` | `#1b7f72` | 자연/지속가능 (현재 톤) |
| `navy` | `#eef2f7` | `#fbfcfd` | `#0e1a2e` | `#2a5fa0` | 신뢰/금융 |
| `sand` | `#f6f1ea` | `#fcf9f4` | `#2a221a` | `#c2925a` | 따뜻함/리테일 |
| `plum` | `#f4eef5` | `#fbf9fb` | `#22112a` | `#7d3aa0` | 창의/엔터테인먼트 |
| `graphite` | `#1a1d1f` | `#26292c` | `#f5f6f7` | `#82c2c5` | 다크/프리미엄 |

각 preset은 _4축 평가_ 통과 가능 영역 (WCAG 4.5:1 대비). M3 polish에서 미세조정.

### 4.3 schema

```ts
export const colorPresetSchema = z.enum([
  'mint', 'navy', 'sand', 'plum', 'graphite',
])
export type ColorPreset = z.infer<typeof colorPresetSchema>

export const styleTokensSchema = z.object({
  colorPreset: colorPresetSchema.optional(),
})
export type StyleTokens = z.infer<typeof styleTokensSchema>

// Tree
export interface Tree {
  version: '1'
  root: TreeNode
  styleTokens?: StyleTokens  // 신규
}
```

후속 단계에서 `typography` / `shape` / `density` 필드 추가 시 동일 객체 확장.

## 5. canvas 적용 방식

`apps/web/page.tsx` `<main>` 또는 캔버스 wrapper에 inline style:

```tsx
const presetColors = COLOR_PRESETS[tree.styleTokens?.colorPreset ?? 'mint']
const canvasStyle = {
  '--dw-surface': presetColors.surface,
  '--dw-surface-muted': presetColors.surfaceMuted,
  '--dw-text-primary': presetColors.textPrimary,
  '--dw-accent': presetColors.accent,
} as React.CSSProperties
```

기존 hardcoded `bg-[#f5f7f4]` / `text-[#18211d]` / `bg-[#1b7f72]` 등을 `bg-[var(--dw-surface)]` / `text-[var(--dw-text-primary)]` / `bg-[var(--dw-accent)]` 등으로 교체. Tailwind arbitrary value 문법.

선택자 / 레이어 / 인스펙터 chrome은 색상 변경 _안 함_ — 도구 영역과 디자인 영역 분리 (사용자 mental model).

## 6. inspector UI 제안

root section 선택 시 inspector에 **스타일** group 신설:

- 위치: `Structure` group 위 또는 아래.
- 컨트롤: `<select>` colorPreset (5 option) — 또는 색상 swatch 5개 chip (선호).
- 미리보기: 각 swatch에 surface + accent 작은 사각형 2개로 표현.
- 선택 시 commitTreeEdit (undo/redo).

root 외 노드 선택 시 스타일 group 비노출 (단계 1은 root 전체 적용만).

## 7. operation/helper

```ts
// tree-editor
export interface UpdateStyleTokensOperation {
  type: 'updateStyleTokens'
  patch: Partial<StyleTokens>
}

export function updateStyleTokens(tree: Tree, patch: Partial<StyleTokens>): Tree {
  return {
    ...tree,
    styleTokens: { ...(tree.styleTokens ?? {}), ...patch },
  }
}
```

`EditOperation` union에 추가. `applyEditOperation`에서 root level operation으로 분기 (nodeId 없음 — Tree root level).

## 8. 합의 요청 4건

Claude → Codex 합의 요청:

### 8.1 styleTokens 위치

(A) Tree root level (Claude 권장)
(B) SectionNode root만

### 8.2 colorPreset 5종 — 충분한가?

- (A) 5종 그대로 OK
- (B) 더 적게 (3종) — mint/navy/sand
- (C) 더 많게 (8종) — 추가 후보

### 8.3 inspector UI

- (A) `<select>` 단일 dropdown
- (B) **swatch chip 5개** (Claude 권장 — 색상 자체가 선택지 미리보기)

### 8.4 단계 분할 OK?

본 토픽 (color) → typography → shape → density 4단계 진행에 동의?
한 토픽에 다 묶을 시 commit 너무 큼.

## 9. 작업 분배

기존 패턴:
- Claude (round 1): 본 라운드 — 사용자 의도 흡수 + spec.
- Codex (round 2): 합의 응답 + 보강.
- Codex (코드 commit): atomic 1 commit.
- Claude (round 3): 검토 + 토픽 종료 권장.

## 10. 미해결

1. **WCAG 대비 자동 검사** — preset 5종이 4.5:1 통과한다는 _주장_은 본 라운드에서 수동 측정. 자동 검사는 후속 토픽 (`m2-style-a11y`).
2. **fixture별 preset 다양화** — simple-hero / card-grid / signup-form 각 fixture 기본 preset 다르게 두면 사용자 체감 ↑. 본 토픽은 모든 fixture 기본 mint, 사용자가 선택해 변경. 후속에서 fixture별 기본값 분리 가능.
3. **dark mode 통합** — `graphite` preset이 사실상 dark theme. system dark mode + auto-switch는 별도 토픽.

## 11. 안전장치 즉석 검사

- m2-style-controls 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-controls ⊂ M2 mandate ✓ (D7 #4 스타일)

[Claude]
