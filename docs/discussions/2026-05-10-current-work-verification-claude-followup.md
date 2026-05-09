# 2026-05-10 코덱스 P1+P2 후속 검증 — Claude

검증 시각: 2026-05-10 (코덱스 87ee5a2 검증 후 후속 사이클)

대상 HEAD: `d83317a fix: panelsHidden 상태에서 헤더 토글 버튼이 panels 복귀 동작`

## 결론

코덱스가 지적한 P1 + P2 두 건 모두 **Playwright 다중 viewport 검증 통과**.
대용량 검증으로 1.0 완성 신뢰도 상승.

## P1 — 모바일 프리뷰 이미지 노드 overflow

**전 (코덱스 87ee5a2 시점)**:
- 모바일 viewport에서 `hero.visual` 부모 ~275px / 자식 figure scrollWidth 569~619px
- 이미지가 아트보드 밖으로 빠짐

**후 (6f20f9e fix 적용)**:
- `min-h-[320px]` 제거 + `w-full min-w-0 max-w-full` 추가
- 부모 grid 컨테이너 `min-h-[320px]` → `min-w-0`

**Playwright 검증 (1680 / 768 / 440 브라우저 폭 × 모바일 viewport 선택)**:
```
width 1680 + 모바일 viewport → vWidth:273 parentWidth:275 overflows:false
width 768  + 모바일 viewport → vWidth:273 parentWidth:275 overflows:false
width 440  + 모바일 viewport → vWidth:273 parentWidth:275 overflows:false
```
✓ 273 < 275 — 더 이상 overflow 없음.

## P2 — 모바일 드로어 토글 가림

**전**: drawer aside `inset-y-0` z-50가 헤더(z-auto) 토글 버튼 위 덮음 → 토글로 닫기 실패.

**후 (44753fa fix 적용)**:
- drawer aside `top-14 bottom-0` (헤더 h-14 아래에서 시작)
- backdrop도 `top-14 inset-x-0 bottom-0`
- z-50 → z-40 (헤더와 안 겹침)

**Playwright 검증 (440px viewport, 브리프 패널 열고 토글 위치 확인)**:
```
brief toggle (after open): btnRight=48 isCovered=false atPoint=SVG(button 내부)
```
✓ elementFromPoint(button 중심) = button 자식 SVG → 토글 클릭 가능.

## P2 — 440px 캔버스 toolbar overflow

**전**: 그리드 버튼 x=456 (viewport 440 밖). 사용자 접근 불가.

**후 (049bf09 fix 적용)**:
- toolbar에 `overflow-x-auto whitespace-nowrap` (가로 스크롤 가능)
- 자식에 `shrink-0` (squish 방지)
- ViewportSwitcher: `min-w-16 px-3` → `px-2 sm:px-3` (라벨 폭 자연 fit)
- width badge: `inline-flex` → `hidden sm:inline-flex` (좁은 화면 숨김)
- ViewportSwitcher / CanvasZoomControl h-9 → h-8 (toolbar h-10 fit)

**Playwright 검증 (440px viewport)**:
```
grid btn: x:359.34 right:427.48 viewportW:440
```
✓ right=427 < 440 — viewport 내부에 들어옴. 사용자 클릭 가능.

## 추가 사이클 (mandate "절대 멈추지 마라")

코덱스 P1+P2 fix 외에 사용자가 명시한 _드래그 / 트랙패드 확대축소 / UI 여백 간격_
요청에 응답해 21 commit 누적:

### 드래그 (Figma/Sketch 표준)
- **Space + 드래그 캔버스 panning** (또는 마우스 가운데 버튼)
- **좌/우 패널 resize drag** (220~420 / 280~520 clamp + localStorage)
- 패닝 모드 cursor 일관 (`[&_*]:!cursor-grab(bing)` 자손 강제 override)
- 패닝 시 노드 click 무시 — selection 안 바뀌게 (CanvasSelectionContext.isPanActive)

### 트랙패드 확대축소
- **트랙패드 pinch / ⌘+wheel** 줌 (ctrl/metaKey 감지, exp 부드러운 보정)
- **Cursor anchor** 줌 — 커서 아래 점이 화면 동일 위치 유지 (Figma 표준)
- **⌘0 / ⌘+ / ⌘- / ⌘1 / ⌘2** 줌 단축키
  - ⌘0 = 100% reset
  - ⌘+ / ⌘- = step 10%
  - ⌘1 = fit-to-screen (viewport가 화면 fit)
  - ⌘2 = zoom-to-selection (선택 노드 화면 중앙 fit)
- 줌 toolbar에 `fit` 버튼 노출

### UI 여백 / 간격 / 배치
- **padding 일관화** — 헤더/인스펙터/배너 px-5 → px-4 (좌측 브리프와 통일)
- **캔버스 하단 status bar** (h-7) — zoom% / viewport / grid / Space hint /
  hover node ID / selected node ID / 선택 노드 logical W×H
- **viewport width transition 200ms** — viewport switcher 전환 부드러움
- **overscroll-contain** — 캔버스/패널 모두 (트랙패드 가로 스왑 페이지 navigation 차단)
- **드로어 토글 active 시각** — 열린 상태일 때 indigo accent
- **Shift+click 범위 선택** — primary~target (파일 탐색기 표준)
- **⌘\\ 패널 hide** (집중 모드) — 데스크톱에서 양쪽 패널 토글
- panelsHidden 시 헤더 토글이 데스크톱에서도 노출 + 클릭 시 panels 복귀

## 검증 stack

- ✓ `pnpm lint` 14/14
- ✓ `pnpm typecheck` 17/17
- ✓ `pnpm test` 13/13 (suite 19, tests 112)
- ✓ `pnpm --filter @dworks/web build` 통과
- ✓ `http://localhost:3000/` 200 (clean .next 후 fresh dev)
- ✓ Playwright 1680 / 768 / 440 → docOverflow false, hero.visual no overflow,
  toolbar 그리드 button in viewport, drawer toggle clickable.

## 다음 액션

코덱스 추가 검증 또는 사용자 시각 피드백 받기.

[Claude]
