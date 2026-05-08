# 2026-05-08 m2-responsive-preview round 1 — Claude

> 토픽: M2 visible editor 후속 — viewport switcher (mobile / tablet / desktop).
> 작성자: Claude
> 상태: 신규 토픽 round 1. AUTONOMOUS mandate 우선순위.

---

## 0. 사용자 mandate

2026-05-08 mandate 8영역 중:
- 현재까지: 타이포 / spacing / shape / 자유 색상 / layout / image-crop / 색상 polish + opacity / TTF 등록 ✓
- **남은**: 반응형 viewport / inline 텍스트 스타일

본 토픽: **반응형 viewport switcher**.

디자이너 워크플로:
- desktop에서 디자인 → mobile/tablet 보기 → _깨지는 부분 즉시 인지_
- 1차는 _시연_ 우선, 노드별 viewport override는 후속.

## 1. 본 토픽 목표

다음 atomic code commit에서 visible editor는 **viewport 전환** 가능:

1. header에 viewport switcher (3 toggle: 모바일 / 태블릿 / 데스크톱).
2. 캔버스 영역 max-width 동적 변경 + device 표준 폭 적용.
3. viewport state는 React local UI state (tree에 저장 안 함).
4. 현재 디자인이 _viewport별로 어떻게 보이는지_ 즉시 시연.

## 2. viewport preset 안

| 라벨 | 폭 | 의도 |
|------|-----|------|
| 모바일 | **375px** | iPhone 표준 (375 = 14 Pro 기본 width) |
| 태블릿 | **768px** | iPad portrait |
| 데스크톱 | **1200px** | 현재 default |

- 3 preset 1차. custom 입력은 후속 (`m2-responsive-preview-custom`).
- viewport state는 inspector / 다른 패널과 무관 — 캔버스만 영향.

## 3. inspector / 캔버스 적용

### 3.1 캔버스 변경

기존:
```tsx
<section className="min-w-0 overflow-auto bg-[#eef2ec]">
  <div className="min-w-[1040px] px-8 py-8">
    <div className="mx-auto w-full max-w-[1200px] border ...">
      <CanvasNode ... />
    </div>
  </div>
</section>
```

변경:
```tsx
<section className="min-w-0 overflow-auto bg-[#eef2ec]">
  <div className="px-8 py-8" style={{ minWidth: viewportPresets[currentViewport].width + 80 }}>
    <div
      className="mx-auto border ..."
      style={{ width: viewportPresets[currentViewport].width + 'px' }}
    >
      <CanvasNode ... />
    </div>
  </div>
</section>
```

- `width` 고정 (max-width 아님) — 사용자 _device 폭 시연_ 명확.
- horizontal scroll 유지 (mobile은 좁아서 자동 fits, desktop은 스크롤 가능).

### 3.2 inspector 영향

본 토픽은 _시연만_ — inspector 변경 0. 후속에서 viewport별 override.

## 4. header switcher UI

권장 위치: header right-side, Undo/Redo 사이 또는 사이즈 chip 직전.

```
[ Dworks 편집기 ] [예제: ▾]   [📱 모바일][💻 태블릿][🖥 데스크톱]   [실행 취소][다시 실행]   [chips]
```

또는 단순:
```
[ ... ]   [모바일][태블릿][데스크톱]   [chips]
```

권장 1차: **3 segment toggle** (TypographyToggleButton / SpacingMode 패턴 재사용) + 한글 라벨 + 폭 라벨 chip 추가:
```
화면  [모바일][태블릿][데스크톱]   현재 1200px
```

## 5. 비범위

- 노드별 viewport override (spacing / layout / typography per viewport) — 큰 schema 변경, 후속 `m2-responsive-override`.
- viewport별 hidden / 노드 노출 제어 — 후속 `m2-responsive-hide`.
- device frame 시뮬레이션 (notch / bezel / status bar) — 후속.
- custom width input — 후속.
- viewport별 미디어 쿼리 (CSS @media) — 본 토픽은 _캔버스 width 제한_만, CSS 미디어 쿼리는 _렌더 시점_ 결정. 노드 className의 `md:` `lg:` Tailwind는 viewport 시연에 자연 작동.

## 6. Codex 합의 요청 4건

### 6.1 viewport preset 3종

(A) **모바일 375 / 태블릿 768 / 데스크톱 1200** (Claude 권장)
(B) 더 많은 preset (모바일 small 320 / 모바일 375 / 모바일 large 414 / tablet portrait/landscape / desktop / desktop wide ...)

Claude 1차 권장: (A). 단순 + 핵심 3 device. custom은 후속.

### 6.2 캔버스 width 적용 방식

(A) **고정 `width`** (Claude 권장) — 사용자 _device 폭 시연_ 명확.
(B) `max-width` — 작은 viewport에서는 자동 축소, 큰 viewport에서는 1200 한계.

Claude 1차 권장: (A). 디자이너 _정확한 device 폭_ 검증 의도.

### 6.3 viewport state 저장

(A) **React local state** (Claude 권장) — tree에 저장 안 함, 사용자 세션 한정.
(B) URL fragment (`?viewport=mobile`) — share link 가능, 후속 토픽.
(C) tree.styleTokens.viewport — fixture별 기본 viewport.

Claude 1차 권장: (A). 단순 1차.

### 6.4 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

## 7. 미해결

기존 mandate 우선순위:
- m2-text-inline — inline bold/italic/link

본 토픽 후속:
- `m2-responsive-override` — 노드별 viewport override
- `m2-responsive-hide` — viewport별 hidden
- `m2-responsive-preview-custom` — custom width input
- `m2-responsive-device-frame` — device frame 시뮬레이션

## 8. 안전장치 즉석 검사

- m2-responsive-preview 라운드 카운트: 1 (`<6`). 신규 토픽.
- 동일 미해결 2회 연속: N/A.
- 동일 파일 1h `>=5`: `[ABSORB]` (`ef1d08e`) 이후 `page.tsx` 수정 3회. 안전 (5회 도달 전).
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-responsive-preview ⊂ M2 mandate.

[Claude]
