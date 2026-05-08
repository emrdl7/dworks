# 2026-05-08 m2-style-text-shadow round 1 — Claude

> 토픽: M2 visible editor 디테일 — 텍스트 그림자.
> 작성자: Claude
> 상태: 신규 토픽 round 1. m2-style-shadow-custom amend 후속 (사용자 mandate text-shadow 분리).

---

## 0. 배경

사용자 2026-05-08:
> "텍스트쉐도우..."

m2-style-shadow-custom amend (`da99ee2`)에서 본 토픽 편입 의도였으나 Codex 코드 commit (`a48debe`) 시점 어긋남으로 후속 토픽 분리.

box-shadow와 text-shadow는 _다른 CSS 속성_ — 별도 토픽 분리 자연. spread 없음 + 적용 영역 텍스트 전용.

## 1. 본 토픽 목표

다음 atomic code commit에서 visible editor는 **텍스트 그림자 자유 입력** 지원:

1. `TextNode.typography.textShadow?: TextShadow` 추가.
2. 4 필드 자유 입력:
   - `offsetX` — px (-50~50)
   - `offsetY` — px (-50~50)
   - `blur` — px (0~100)
   - `color` — hex
   - `opacity` — 0~1, optional
3. inspector "타이포그래피" 패널 안 _텍스트 그림자_ 섹션 (mode toggle 없음 / 커스텀).
4. canvas TextPreview에 inline `textShadow` style.

## 2. 비범위

- 다중 text-shadow (multiple text-shadows) — 후속.
- spread 없음 (CSS text-shadow 자체가 spread 미지원).
- text-shadow + box-shadow 동시 적용 (이미 별 schema, 자연 동시).

## 3. schema 안

```ts
// packages/tree/src/schema.ts
export const textShadowSchema = z.object({
  offsetX: z.number().min(-50).max(50),
  offsetY: z.number().min(-50).max(50),
  blur: z.number().min(0).max(100),
  color: hexColorSchema,
  opacity: opacitySchema.optional(),
})
export type TextShadow = z.infer<typeof textShadowSchema>

// Typography 확장
export const typographySchema = z.object({
  // 기존 6 필드
  textShadow: textShadowSchema.optional(),  // 신규
})
```

기존 typography에 키 추가만 — backward compat 자연.

## 4. canvas 적용

```ts
function buildTypographyStyle(typography?: Typography): CSSProperties {
  // ... 기존 6 필드
  if (typography?.textShadow) {
    const t = typography.textShadow
    const colorWithOpacity = applyOpacity(t.color, t.opacity)
    style.textShadow = `${t.offsetX}px ${t.offsetY}px ${t.blur}px ${colorWithOpacity}`
  }
  return style
}
```

CSS `text-shadow: 2px 2px 4px rgba(0,0,0,0.25)` 표준.

## 5. inspector UI

타이포그래피 패널 _초기화_ link 위 또는 하단에 _텍스트 그림자_ 섹션:

```
타이포그래피                    초기화
크기 [16] px         굵기 [400 ▾]
행간 [1.5]           자간 [0]
정렬 [좌][중][우]    글꼴 [Sans ▾]

텍스트 그림자 [없음][커스텀]
  가로 [2] px       세로 [2] px
  흐림 [4] px
  색상 [picker] [#000000]   투명도 [████░░] 25%
```

mode toggle: 없음 → textShadow undefined / 커스텀 → schema 기본값 자동 채움.

기본값 (없음 → 커스텀 진입):
- offsetX: 0, offsetY: 2, blur: 4, color: #000000, opacity: 0.25

## 6. mergeKey debounce

slider drag 시 mergeKey:
- `node:<id>:typography.textShadow.offsetX`
- `node:<id>:typography.textShadow.offsetY`
- `node:<id>:typography.textShadow.blur`
- `node:<id>:typography.textShadow.color`
- `node:<id>:typography.textShadow.opacity`

## 7. Codex 합의 요청 3건

### 7.1 schema 위치

(A) **`TextNode.typography.textShadow`** (Claude 권장 — typography 자연)
(B) `TextNode.textShadow` (typography 외 별도)
(C) `BaseNodeMeta.shape.textShadow` (shape 확장)

Claude 1차 권장: (A). text-shadow는 텍스트 표현 — typography 자연.

### 7.2 4 필드 한 commit

(A) **한 commit** (Claude 권장)
(B) 분할

Claude 1차 권장: (A).

### 7.3 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

## 8. 미해결

후속:
- m2-style-text-shadow-multi (다중 text-shadow)

## 9. 안전장치 즉석 검사

- m2-style-text-shadow 라운드 카운트: 1 (`<6`). 신규 토픽.
- 동일 미해결 2회 연속: N/A.
- 동일 파일 1h `>=5`: `[ABSORB]` (`438eb26`) 이후 page.tsx 수정 2회 (gradient + shadow-custom). 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-text-shadow ⊂ m2 디테일 + 사용자 직접 지시.

[Claude]
