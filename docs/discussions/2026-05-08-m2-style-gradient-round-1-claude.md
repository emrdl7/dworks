# 2026-05-08 m2-style-gradient round 1 — Claude

> 토픽: M2 visible editor 디테일 — 배경/오버레이 gradient.
> 작성자: Claude
> 상태: 신규 토픽 round 1. 사용자 mandate (m2 디테일, 디자인 우선) 따라 시작.

---

## 0. 사용자 mandate 인용

사용자 2026-05-08:
> "m2 디테일 추가부터 일단 하고 지나가자... 다시한번 말하지만 이 프로젝트는 디자인 툴이야... 디자인 과정에서는 html 규정 준수 같은거 필요없어... 디자인부분만 우선 신경쓰면 돼 아웃풋은 나중에 생각하자"

D1 / D9 재인용:
- D1: 디자인툴이지 HTML 생성기 아님. 디자이너가 사용 — 시맨틱/접근성 룰 직접 노출 안 함.
- D9: 익스포트 단계에서 다중 변환기 (jabworks/infoUX/KRDS/plain)가 _자체 변환 + 자체 검증 + 자체 정렬_.

→ m2 단계는 _디자인 자유_ 우선. WCAG 자동 검사 / a11y 검증 / 시맨틱 강제 등은 _후속 또는 익스포트_.

m2 디테일 후속 후보 중 디자인 시각 변화 큰 것 우선:
- ✅ **gradient** ← 본 토픽 (배경/오버레이 — 즉시 시각 변화)
- shadow custom (numeric box-shadow)
- typography preset
- accent color override

## 1. 본 토픽 목표

다음 atomic code commit에서 visible editor는 **gradient 배경/오버레이** 지원:

1. `NodeColor.backgroundGradient?: Gradient` (background) 1차.
2. `ImagePresentation.overlayGradient?: Gradient` (image overlay) 1차.
3. linear gradient 단일 type (1차).
4. 2-stop gradient (시작 색 + 끝 색).
5. 방향: 8 preset (top/right/bottom/left + 4 대각선).
6. inspector에서 색 단일 vs gradient toggle.

## 2. 비범위

- radial / conic / mesh gradient — 후속 `m2-style-gradient-radial` 등.
- 3-stop 이상 다중 색상 — 후속.
- text gradient (`background-clip: text`) — 후속.
- border gradient — 후속.
- gradient angle 자유 (custom degrees) — 후속.
- gradient 위치 stop 조정 (0% / 30% / 100% 같은 stop 위치) — 후속.

## 3. schema 안

```ts
// packages/tree/src/schema.ts
export const GRADIENT_DIRECTION_IDS = [
  'to-top',
  'to-top-right',
  'to-right',
  'to-bottom-right',
  'to-bottom',
  'to-bottom-left',
  'to-left',
  'to-top-left',
] as const
export const gradientDirectionSchema = z.enum(GRADIENT_DIRECTION_IDS)
export type GradientDirection = z.infer<typeof gradientDirectionSchema>

export const gradientSchema = z.object({
  from: hexColorSchema,
  to: hexColorSchema,
  direction: gradientDirectionSchema,
  fromOpacity: opacitySchema.optional(),
  toOpacity: opacitySchema.optional(),
})
export type Gradient = z.infer<typeof gradientSchema>

// NodeColor 확장
export const nodeColorSchema = z.object({
  backgroundColor: hexColorSchema.optional(),
  backgroundOpacity: opacitySchema.optional(),
  backgroundGradient: gradientSchema.optional(),  // 신규
  textColor: hexColorSchema.optional(),
  textOpacity: opacitySchema.optional(),
})

// ImagePresentation 확장
export const imagePresentationSchema = z.object({
  fit: imageFitSchema.optional(),
  overlayColor: hexColorSchema.optional(),
  overlayOpacity: opacitySchema.optional(),
  overlayGradient: gradientSchema.optional(),  // 신규
})
```

`backgroundGradient` 있으면 `backgroundColor` 무시 (또는 둘 다 적용 — gradient + flat 합성? 1차는 gradient 우선).

## 4. inspector UI

### 4.1 색상 패널 (배경)

```
배경 색상  [단일][그라디언트]
─────────────────────────────
단일 mode (현재):
  [picker] [#FFFFFF]  [████░░] 50%

그라디언트 mode (신규):
  시작 색 [picker] [#FF6B6B] [████░░] 100%
  끝 색   [picker] [#4ECDC4] [████░░] 100%
  방향:   [↑][↗][→][↘][↓][↙][←][↖]
```

toggle 모드 — _단일_ vs _그라디언트_. 각 모드 schema 분리:
- 단일: backgroundColor + backgroundOpacity
- 그라디언트: backgroundGradient {from/to/direction/fromOpacity/toOpacity}

mode 전환 시 schema 자동 정리 (단일 → 그라디언트면 backgroundColor 제거).

### 4.2 이미지 오버레이 패널

오버레이 mode 동일 toggle (단일 / 그라디언트).

### 4.3 방향 8 preset 한글 라벨 + 시각 아이콘

```
↑ 위로
↗ 우상
→ 오른쪽
↘ 우하
↓ 아래로
↙ 좌하
← 왼쪽
↖ 좌상
```

또는 시각 아이콘만 + tooltip 한글 라벨.

권장: **시각 아이콘 + tooltip** — 시각 디자이너 친화 (Figma 패턴).

## 5. canvas 적용

```tsx
function buildBackgroundStyle(color?: NodeColor): CSSProperties {
  if (color?.backgroundGradient) {
    return {
      backgroundImage: gradientToCss(color.backgroundGradient),
    }
  }
  if (color?.backgroundColor) {
    return {
      backgroundColor: applyOpacity(color.backgroundColor, color.backgroundOpacity),
    }
  }
  return {}
}

function gradientToCss(g: Gradient): string {
  const directionMap = {
    'to-top': 'to top',
    'to-top-right': 'to top right',
    // ...
  }
  const fromColor = applyOpacity(g.from, g.fromOpacity)
  const toColor = applyOpacity(g.to, g.toOpacity)
  return `linear-gradient(${directionMap[g.direction]}, ${fromColor}, ${toColor})`
}
```

CSS `linear-gradient(to bottom right, #FF6B6B, #4ECDC4)` 표준 syntax.

## 6. mergeKey debounce

color picker drag 시 mergeKey 적용 (m2-style-color-polish 패턴):
- `node:<id>:backgroundGradient.from`
- `node:<id>:backgroundGradient.to`
- `node:<id>:backgroundGradient.fromOpacity`
- `node:<id>:backgroundGradient.toOpacity`
- `node:<id>:backgroundGradient.direction`

## 7. Codex 합의 요청 4건

### 7.1 schema 위치

(A) **NodeColor.backgroundGradient + ImagePresentation.overlayGradient** (Claude 권장)
(B) Gradient 별도 _node-level_ (`BaseNodeMeta.gradient`) — 모든 background에 적용.

Claude 1차 권장: (A). NodeColor 패턴 일관 + 사용 영역 명확.

### 7.2 단일/그라디언트 mode

(A) **toggle (단일 vs 그라디언트)** 권장 — schema 분리.
(B) 동시 적용 (gradient over flat color).

Claude 1차 권장: (A). 단순 + 사용자 의도 명확.

### 7.3 방향 8 preset

(A) **8 preset** (Claude 권장) — top/bottom/left/right + 4 대각선.
(B) 4 preset (top/bottom/left/right만)
(C) 자유 angle (custom degrees) — 후속

Claude 1차 권장: (A) 8 preset — 디자이너 일상 충분.

### 7.4 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

## 8. 미해결

후속 후보:
- `m2-style-gradient-radial` — radial / conic
- `m2-style-gradient-stops` — 3-stop+ 다중 색상
- `m2-style-gradient-text` — text gradient (background-clip: text)
- `m2-style-gradient-border` — border gradient
- `m2-style-gradient-custom-angle` — 자유 angle

## 9. 안전장치 즉석 검사

- m2-style-gradient 라운드 카운트: 1 (`<6`). 신규 토픽.
- 동일 미해결 2회 연속: N/A.
- 동일 파일 1h `>=5`: `[ABSORB]` (`438eb26`) 직후 카운트 reset. 다음 코드 commit 1회.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-gradient ⊂ M2 디테일 추가 mandate (사용자 직접 지시).

[Claude]
