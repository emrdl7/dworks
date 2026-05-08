# 2026-05-08 m2-style-shadow-custom round 3 amend — Claude

> 토픽: 그림자 자유 입력 + 사용자 추가 mandate 편입.
> 작성자: Claude
> 상태: round 3 (`bf5fcae`) ack 후 사용자 추가 mandate 흡수. text-shadow 편입 + 아이콘화 신규 토픽 분리 권장.

---

## 0. 사용자 추가 mandate

사용자 2026-05-08 직전 메시지:
> "텍스트쉐도우... 그리고 ui상에서 아이콘만으로도 충분히 알아볼 수 있는 버튼들은 아이콘화해서 공간 절약해(툴팁 필요) 다음 니턴에 편입해서 합의하에 진행해"

→ 두 가지 mandate:
1. **text-shadow** — 텍스트 그림자.
2. **아이콘화** — UI 공간 절약 (툴팁 한글 필수).

본 amend는 _합의하에 진행_ 명시 따라 두 mandate 처리 방식 합의 요청.

## 1. mandate 1 — text-shadow 본 토픽 편입

### 1.1 spec 설계

`TextNode.typography.textShadow?: CustomShadow` (또는 별도 `TextShadow` 타입) 추가.

box-shadow와 차이:
- `text-shadow` CSS는 `offsetX offsetY blur color` (4 필드, spread 없음)
- 또는 동일 5 필드 (`spread` 없는 version)

권장:
- 별도 `textShadowSchema` (4 필드: offsetX/offsetY/blur/color + opacity).
- 또는 `customShadowSchema` 재사용 + `spread` 무시 (text-shadow CSS 변환 시).

### 1.2 schema 후보

```ts
// 옵션 (A) 별도 schema (정확)
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
  // 기존
  textShadow: textShadowSchema.optional(),
})

// 옵션 (B) customShadow 재사용
// Typography에 customShadow 추가, CSS 변환 시 spread 무시
```

**Claude 권장**: (A) 별도 schema. 이유:
- text-shadow와 box-shadow는 _다른 CSS 속성_, 별도 schema가 의미 분리.
- spread 없는 4 필드 — 사용자 inspector에 _spread 입력 안 보임_ 자연.
- 범위도 다름 (text는 보통 작음 -50~50, box는 -100~100).

### 1.3 적용 범위

- TextNode만 (text-shadow는 텍스트 전용 CSS).
- inspector "타이포그래피" 패널에 추가? 또는 별도 "텍스트 그림자" 섹션?
- 권장: 타이포 패널 안 _그림자_ 섹션 (mode toggle 포함 — 기본 vs 커스텀).

다만 textNode에 typography가 _이미 있고_ shape (box-shadow)도 별도 → text-shadow는 typography 안에 두면 됨.

### 1.4 본 토픽 편입 vs 후속 분리

(A) **본 토픽 (m2-style-shadow-custom) 편입** (사용자 권장)
(B) 신규 토픽 (m2-style-text-shadow) 분리

사용자 명시 "편입" → (A). 단 코드 commit 크기 ↑ — atomic 단위 영향 검토 필요.

Codex round 4 합의 요청.

## 2. mandate 2 — 아이콘화 (별도 토픽 권장)

### 2.1 사용자 의도 분석

> "ui상에서 아이콘만으로도 충분히 알아볼 수 있는 버튼들은 아이콘화해서 공간 절약해 (툴팁 필요)"

→ inspector 패널 _길이 압축_ + 시각 _Figma 같은 디자인툴 톤_.

### 2.2 적용 후보

| 영역 | 현재 | 아이콘 후보 |
|------|------|------------|
| Structure (구조) | "Move up / Move down / Duplicate / Delete" 텍스트 버튼 | ↑↓⎘🗑️ |
| Spacing mode toggle | "전체/X-Y/4면" 텍스트 | □ ⇔ ⊞ (square / horizontal / 4-side icons) |
| Layout direction | "가로/세로" 텍스트 | → ↓ |
| Layout align | "시작/가운데/끝/채움" 텍스트 | ⊢ ⊣ ⊞ icons |
| Layout justify | 텍스트 | 분배 icons |
| Text align | "좌/중/우" 텍스트 | ⊢ ⊏ ⊣ |
| Gradient direction | 8 preset 텍스트 | 8 화살표 (이미 round 1 §4.3 권장) |
| Undo/Redo | "실행 취소 / 다시 실행" | ↶ ↷ |
| 글꼴 family/weight | 텍스트 | 그대로 (텍스트 명확) |
| 색상 picker / hex / opacity | 텍스트 + picker | 그대로 |

Inspector 텍스트가 _명확한 의미_인 영역은 텍스트 유지 (color hex / 색상 라벨), _시각으로 더 명확_한 영역만 아이콘.

### 2.3 본 토픽 편입 vs 별도 토픽

(A) **본 토픽 편입** — shadow + text-shadow + 아이콘화 한 commit
(B) **별도 토픽 (m2-icons-uplift) 분리** — 아이콘화는 _전체 inspector_ 영역, 다른 작업 영역

**Claude 권장: (B) 별도 토픽**. 이유:
- 영역 다름 — shadow는 schema + 일부 inspector, 아이콘화는 _전체 inspector chrome_ (Structure / Spacing / Layout / Gradient / Undo+Redo / Text align 등 8+ 컴포넌트).
- atomic 단위 명확 — shadow commit + icons commit 분리.
- 의존성: 아이콘 라이브러리 (lucide-react 등) 추가 검토 필요 → 별도 토픽이 의존성 결정 분리.

본 amend 후 Codex round 4 응답:
- text-shadow 본 토픽 편입 OK
- 아이콘화 별도 토픽 시작 — 본 토픽 종료 후 신규 round 1 작성

### 2.4 의존성 후보

- **lucide-react** (Tailwind / Next.js 표준, 이미 indirect 의존성 가능)
- **react-icons** (다양한 아이콘 set, lucide도 포함)
- **자체 SVG inline** (의존성 0, 작은 set)

권장 1차: **lucide-react** — 디자인툴 표준, 일관성, lightweight.

또는 자체 SVG inline 1차 시작 + 라이브러리 도입은 후속? 디자이너 본 디자인툴 일상에 _다양한 아이콘 필요_ → lucide-react 시작이 효율.

## 3. Codex round 4 합의 요청 4건

### 3.1 text-shadow schema

(A) **별도 `textShadowSchema`** (Claude 권장 — 4 필드, 의미 분리)
(B) `customShadowSchema` 재사용 + spread 무시

### 3.2 text-shadow 편입 위치

(A) **`TextNode.typography.textShadow`** (Claude 권장 — typography 패널 안 그림자 섹션)
(B) `TextNode` 직접 추가 (typography 외)
(C) shape 패턴처럼 `TextNode.shape` 신규 (현재 `BaseNodeMeta.shape`인데 box-shadow만 — text-shadow는 별 키)

Claude 1차 권장: (A). typography 자연 (text-shadow는 텍스트 표현).

### 3.3 본 토픽 편입 vs 분리

(A) **shadow + text-shadow 한 토픽 편입** (사용자 권장 + Claude 동의)
(B) text-shadow 분리

Claude 1차 권장: (A). 사용자 명시.

### 3.4 아이콘화는 별도 토픽?

(A) **별도 토픽 m2-icons-uplift** (Claude 강추)
(B) 본 토픽 함께 편입

Claude 1차 권장: (A). atomic 단위.

## 4. 미해결

amend 미해결:
1. text-shadow 편입 합의 (Codex round 4).
2. 아이콘화 별도 토픽 합의 (Codex round 4).
3. 아이콘 라이브러리 결정 (별도 토픽에서).

## 5. 안전장치 즉석 검사

- m2-style-shadow-custom 라운드 카운트: 3 (amend는 round 카운트 외). round 6 여유 3.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: `[ABSORB]` (`438eb26`) 이후 page.tsx 수정 1회. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-shadow-custom + m2-icons-uplift ⊂ m2 디테일 mandate (사용자 직접 지시).

[Claude]
