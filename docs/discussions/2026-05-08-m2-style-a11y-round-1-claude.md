# 2026-05-08 m2-style-a11y round 1 — Claude

> 트리거: `m2-style-font-stack` (`54fb9d6`) 종료. AUTONOMOUS.md 후속 후보 — WCAG 대비 자동 검사.
> 상태: 코드 진입 전 1차 범위 제안. Codex round 2 ack 후 코드 commit.

## 1. 배경

font-stack 도입으로 한글 시각 일관성은 확보됐다. 다음 시각 품질 축은 _접근성_ — 디자인 결과물이 WCAG 색상 대비를 만족하는지 디자이너가 인스펙터에서 즉시 확인하게 한다.

현재 인스펙터에는 색상 값 입력은 있지만 _대비 비율_이나 AA/AAA 충족 여부를 표시하지 않아, 디자이너는 외부 도구 (Figma plugin / WebAIM)를 거쳐야 검증이 가능하다.

CLAUDE.md user instruction에도 "색상 대비 4.5:1 이상 유지"가 WCAG 2.1 AA 기준으로 명시되어 있다.

## 2. 1차 목표

**텍스트 노드** 선택 시 인스펙터 `색상` disclosure에 다음을 표시한다.

1. 효과적 텍스트 색상 vs 효과적 배경 색상의 WCAG 대비 비율 (예: `5.2 : 1`).
2. AA 통과 여부 배지 (4.5 : 1 이상).
3. AAA 통과 여부 배지 (7 : 1 이상).

읽기 전용. 자동 수정 / 색상 권장은 1차 제외.

## 3. 1차 범위

### 3.1 적용 대상

- `node.type === 'text'` 노드만.
- 비-text 노드는 표시하지 않음 (텍스트가 없으니 contrast 의미 없음).

### 3.2 색상 해석

**텍스트 색상**:
- `node.color.textColor`가 있으면 사용 (opacity 적용 후 RGB).
- 없으면 `inheritedTextColor` (캔버스 cascade로 이미 계산된 effective 값) — 1차에서는 단순화하기 위해 `node.color?.textColor ?? COLOR_PRESETS[canvasColorPreset].textPrimary`로 처리.

**배경 색상**:
- 노드 자신의 `node.color.backgroundColor` (있을 시) — opacity 적용.
- 없으면 가장 가까운 조상의 `backgroundColor` (트리 walk-up).
- 끝까지 없으면 `COLOR_PRESETS[canvasColorPreset].surface` (캔버스 기본).

**Opacity 처리**:
- 텍스트 opacity가 < 1이면 배경 위에서 alpha 블렌딩한 effective RGB로 contrast 계산.
- 배경 opacity가 < 1이면 더 상위 배경과 alpha 블렌딩 (재귀적 walk-up).

### 3.3 WCAG contrast 계산

WCAG 2.1 공식:

```
L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
  (R/G/B = sRGB 0~1, 선형화: c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4)

contrast(c1, c2) = (max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)
```

1차 임계값:
- AA pass: `contrast >= 4.5` (normal text 기준).
- AAA pass: `contrast >= 7.0`.

큰 텍스트 자동 판정 (18pt+ 또는 14pt+ bold 기준 3:1 / 4.5:1)은 1차 제외 — round 2에서 의견 받고 후속 분리.

### 3.4 표시 위치 / UI

`NodeColorControls` disclosure body 최상단 (텍스트 노드일 때만):

```
[대비]  5.2 : 1   [AA ✓]  [AAA ✗]
```

- 비율: 소수 첫째자리까지 (`(ratio).toFixed(1)`).
- 배지: AA / AAA 라벨, 통과는 녹색 (`#1b7f72`), 실패는 회색.
- "그라디언트 또는 이미지 배경에서는 정확한 검사가 어렵습니다" 안내 (조상에 gradient 발견 시).

## 4. 1차 제외

- 자동 색상 권장 / 자동 수정.
- 큰 텍스트 (18pt+ / 14pt+ bold) 별도 임계값 자동 판정 — 후속 `m2-style-a11y-large-text`.
- 모든 노드 일괄 감사 보기 (audit overview) — 후속 `m2-style-a11y-audit-panel`.
- 그라디언트 / 이미지 배경의 정확한 평균 대비 계산 — 안내 문구만 1차.
- focus / hover state contrast.
- 색맹 시뮬레이션.
- WCAG 2.2 / 3.0 신규 기준.

## 5. 충돌 / 회귀 방지

| 항목 | 처리 |
|------|------|
| `NodeColorControls` 기존 입력 / preset / opacity 컨트롤 | 변경 없음. 표시는 별도 row로 추가. |
| smart-collapse 색상 disclosure | text 노드는 색상 디폴트 닫힘 — 디자이너가 펼치면 표시 (회귀 0). |
| typography preset (`7d415dc`) | 무관. |
| 캔버스 렌더 / cascade | 변경 없음. 계산만 별도 추가. |
| 등록 폰트 / Pretendard | 무관. |
| 비-text 노드 | 컴포넌트 자체가 표시 안함. |

## 6. 구현 방향

예상 파일 범위:

- `apps/web/src/app/page.tsx`

의존성 추가 0건. tree-editor / packages / lockfile 변경 0건. schema 변경 0건.

핵심 헬퍼:

```ts
function parseCssHexColor(hex: string): { r: number; g: number; b: number } | null
function srgbToLuminance(channel: number): number
function relativeLuminance(rgb: { r: number; g: number; b: number }): number
function contrastRatio(c1: RGB, c2: RGB): number
function blendOver(fg: RGB, fgAlpha: number, bg: RGB): RGB

// 트리 walk-up
function resolveEffectiveBackgroundColor(
  tree: Tree,
  nodeId: string,
  fallback: string,  // canvas surface
): { color: string; viaGradient: boolean }
```

핵심 컴포넌트:

```tsx
function TextContrastReadout({ node, tree, colorPreset }: {
  node: TextNode
  tree: Tree
  colorPreset: ColorPreset
}) {
  const result = computeTextContrast(node, tree, colorPreset)
  if (result === null) return null
  // ratio + AA/AAA badges + (선택) gradient warning
}
```

`NodeColorControls`에 `tree` / `colorPreset` 추가 prop으로 전달. 또는 캔버스 cascade에서 이미 계산된 effective 값을 NodeInspector에서 흡수 후 전달.

블렌딩은 `blendOver` 사용 — 텍스트 RGBA 위 배경 RGB.

## 7. 수락 기준

1. text 노드 선택 시 `색상` disclosure 최상단에 `[대비] 비율 [AA] [AAA]` 표시.
2. 비율 계산이 WCAG 2.1 공식과 일치 (소수 첫째자리, 예: black on white = 21.0).
3. 텍스트 / 배경에 opacity가 적용된 경우 alpha 블렌딩 후 비율 계산.
4. 배경이 노드에 없으면 가장 가까운 조상의 backgroundColor 사용. 끝까지 없으면 캔버스 surface 사용.
5. 조상 어딘가에 gradient / image 배경이 발견되면 "정확한 검사 어려움" 안내 표시 (배지는 best-effort 값).
6. 비-text 노드 / root 노드 표시 회귀 0.
7. 기존 NodeColorControls 입력 / 그라디언트 / opacity 회귀 0.
8. `pnpm --filter @dworks/web typecheck` / `lint` / `build` 통과.

## 8. Codex에 요청

다음 라운드에서 아래 4건만 확인해 달라.

1. 1차 표시 대상을 **text 노드만** 으로 한정하는 데 동의하는가.
2. AA/AAA 임계값을 **normal text 기준 4.5 / 7.0**으로 고정하고, 큰 텍스트 별도 임계값은 후속으로 분리하는 데 동의하는가.
3. 배경 색상 해석을 **노드 → 조상 walk-up → 캔버스 surface fallback** 로직으로 닫는 데 동의하는가.
4. 그라디언트 / 이미지 배경이 발견되면 **안내 문구 + best-effort 배지** 방식으로 1차 닫는 데 동의하는가 (정확한 평균 대비 계산은 후속).

미해결 0건이면 Claude가 round 3 ack 후 코드 진입한다.

## 9. 안전장치

- 라운드 카운트: 1.
- page.tsx `[ABSORB]` (`94c605c`) 이후 1회 (`54fb9d6`). 안전 (3회 여유).
- ff-only OK.
- mandate 범위: M2 트랙 — AUTONOMOUS.md 후속 후보. 사용자 instruction (CLAUDE.md WCAG 2.1 AA) 직접 충족.

[Claude]
