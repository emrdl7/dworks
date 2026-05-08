# 2026-05-08 m2-icons-uplift round 1 — Claude

> 토픽: M2 visible editor 디테일 — inspector 텍스트 버튼 아이콘화 + 한글 툴팁.
> 작성자: Claude
> 상태: 신규 토픽 round 1. 사용자 mandate 따라 시작.

---

## 0. 사용자 mandate

사용자 2026-05-08:
> "ui상에서 아이콘만으로도 충분히 알아볼 수 있는 버튼들은 아이콘화해서 공간 절약해(툴팁 필요)"

→ inspector 텍스트 버튼 _시각으로 즉시 명확한 영역_ 아이콘화 + 한글 툴팁 필수.

## 1. 본 토픽 목표

다음 atomic code commit에서 visible editor inspector는 **아이콘 기반 컴팩트 컨트롤** 제공:

1. _시각으로 충분히 명확한_ 텍스트 버튼 → 아이콘.
2. 모든 아이콘 버튼은 한글 툴팁 (`title` + `aria-label`).
3. _텍스트가 의미 명확_한 영역은 텍스트 유지.
4. inspector 패널 길이 압축 (사용자 mandate).

## 2. 적용 후보

### 2.1 아이콘화 적용 영역

| 영역 | 현재 | 아이콘 후보 | 판단 |
|------|------|------------|------|
| Structure (구조) | "Move up" / "Move down" / "Duplicate" / "Delete" | ↑ ↓ ⎘ 🗑 | ✓ 시각 명확 |
| Spacing mode toggle | "전체" / "X-Y" / "4면" | ⊟ ⇔ ⊞ | ✓ 시각 명확 |
| Layout direction | "가로" / "세로" | → ↓ | ✓ 시각 명확 |
| Layout align | "시작" / "가운데" / "끝" / "채움" | ⊢ ⊞ ⊣ ⊟ | △ 일부 모호, 텍스트 병행 가능 |
| Layout justify | "시작" / "가운데" / "끝" / "양끝" / "균등" | ⊢ ⊞ ⊣ ⇔ ⇎ | △ 5종 시각 다양 |
| Text align | "좌" / "중" / "우" | ⊢ ⊏ ⊣ | ✓ 시각 명확 |
| Gradient direction | 8 preset 텍스트 | 8 화살표 | ✓ 시각 명확 |
| Undo / Redo | "실행 취소" / "다시 실행" | ↶ ↷ | ✓ 시각 명확 |
| Padding/Margin mode | "전체" / "X-Y" / "4면" (Spacing 동일) | 동일 | ✓ |

### 2.2 텍스트 유지 영역

| 영역 | 사유 |
|------|------|
| 글꼴 family/weight dropdown | 폰트 이름 텍스트 명확 |
| 색상 hex input | 16진수 텍스트 |
| 색상 picker | swatch 시각 자체 |
| 노드 type chip | "텍스트" / "버튼" 등 텍스트 |
| 패널 제목 ("타이포그래피" / "간격" 등) | 한글 명확 |
| 초기화 link | 텍스트 명확 |
| Border style ("실선" / "점선" / "없음") | 텍스트 명확 |
| Shadow preset ("옅게" / "기본" / "진하게") | 한글 명확 |

## 3. 아이콘 라이브러리

### 3.1 후보

| 라이브러리 | 장점 | 단점 |
|-----------|------|------|
| **lucide-react** | Tailwind/Next.js 표준, 광범위 set, 일관성 | 외부 dep |
| react-icons | 다양한 set | 더 무거움 |
| 자체 SVG inline | 의존성 0 | 작업량 ↑ |

**Claude 권장: `lucide-react`**. 이유:
- 디자인툴 시연에 _다양한 아이콘_ 필요 (이동/방향/정렬 등).
- Tree-shakeable — 사용 아이콘만 번들.
- Next.js 환경 호환 검증.

번들 영향: 사용 아이콘별 ~1KB. 30개 아이콘 = ~30KB. 합리적.

### 3.2 대안 (자체 SVG)

번들 최소화 우선이면 _자체 SVG inline_ — 다만:
- 30+ 아이콘 직접 그리기 (작업량 ↑).
- 일관성 (stroke width / size) 유지 어려움.

권장: **lucide-react** 1차 + 후속 _필요 시 자체로 교체_.

## 4. 컴포넌트 설계

### 4.1 IconButton 신규

```tsx
interface IconButtonProps {
  icon: React.ComponentType<{ size?: number }>  // lucide-react 컴포넌트
  ariaLabel: string  // 한글
  isSelected?: boolean
  disabled?: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}

function IconButton({ icon: Icon, ariaLabel, isSelected, disabled, onClick, size = 'md' }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      disabled={disabled}
      title={ariaLabel}  // 한글 tooltip
      className={...}
      onClick={onClick}
    >
      <Icon size={size === 'sm' ? 14 : 16} />
    </button>
  )
}
```

### 4.2 IconToggleGroup

multiple IconButton을 묶는 group (Layout align 등).

```tsx
<IconToggleGroup
  options={[
    { value: 'start', icon: AlignLeft, label: '시작' },
    { value: 'center', icon: AlignCenter, label: '가운데' },
    // ...
  ]}
  value={current}
  onChange={(v) => ...}
/>
```

## 5. 한글 툴팁 매핑

각 아이콘 → 한글 툴팁:

| 영역 | 아이콘 | 툴팁 |
|------|-------|------|
| Structure Move up | ChevronUp | 위로 이동 |
| Structure Move down | ChevronDown | 아래로 이동 |
| Structure Duplicate | Copy | 복제 |
| Structure Delete | Trash2 | 삭제 |
| Spacing 전체 | Square | 전체 균등 |
| Spacing X-Y | Columns / Move | 가로 세로 분리 |
| Spacing 4면 | Maximize2 | 4방향 분리 |
| Layout direction 가로 | ArrowRight | 가로 배치 |
| Layout direction 세로 | ArrowDown | 세로 배치 |
| Layout align start | AlignStart | 시작 정렬 |
| Layout align center | AlignCenterHorizontal | 가운데 정렬 |
| Layout align end | AlignEnd | 끝 정렬 |
| Layout align stretch | StretchHorizontal | 채움 |
| Text align left | AlignLeft | 왼쪽 정렬 |
| Text align center | AlignCenter | 가운데 정렬 |
| Text align right | AlignRight | 오른쪽 정렬 |
| Gradient direction 8개 | ArrowUp/UpRight/Right/.../UpLeft | 위 / 우상 / 오른쪽 / ... |
| Undo | Undo2 | 실행 취소 |
| Redo | Redo2 | 다시 실행 |

라벨은 _수정 가능_ — 정확한 라벨 Codex 결정 위임.

## 6. UI 디테일

### 6.1 아이콘 크기

- toggle 그룹: 16px
- 단일 아이콘 버튼: 16px
- inspector 작은 컨트롤: 14px

### 6.2 disabled 시각

기존 `disabled:opacity-40 disabled:cursor-not-allowed` 패턴 유지.

### 6.3 hover/focus

기존 `hover:bg-[#eef3ed]` + `focus-visible:outline` 패턴.

### 6.4 selected 시각

`aria-pressed="true"` + `bg-[#dff1ee]` + `text-[#073d37]` 등 (TypographyToggleButton 패턴).

## 7. Codex 합의 요청 4건

### 7.1 라이브러리

(A) **lucide-react** (Claude 권장)
(B) react-icons
(C) 자체 SVG inline

### 7.2 적용 범위

(A) **§2.1 표 그대로 (8 영역)** (Claude 권장)
(B) 일부 영역만 1차 + 단계 분할 (예: Structure / Text align / Undo/Redo만 1차)
(C) 전체 inspector + dropdown 일부 도 (확장)

Claude 1차 권장: (A).

### 7.3 IconButton 컴포넌트 분리

(A) **`IconButton` 컴포넌트 + `IconToggleGroup`** (Claude 권장 — 재사용)
(B) 각자 inline

Claude 1차 권장: (A).

### 7.4 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

## 8. 미해결

후속:
- m2-icons-extended — 더 많은 영역 (예: dropdown options 아이콘화)
- m2-icons-custom-svg — lucide 외 자체 SVG (브랜드 아이콘 등)

## 9. 안전장치 즉석 검사

- m2-icons-uplift 라운드 카운트: 1 (`<6`). 신규 토픽.
- 동일 미해결 2회 연속: N/A.
- 동일 파일 1h `>=5`: `[ABSORB]` (`438eb26`) 이후 page.tsx 수정 2회. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-icons-uplift ⊂ m2 디테일 + 사용자 직접 지시.

[Claude]
