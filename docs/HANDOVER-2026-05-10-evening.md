# 핸드오버 — design-resolver + Phase 6 분할 + UI 토큰화 (2026-05-10 evening)

작성: 2026-05-10
대상 HEAD: `7637d91 feat: 인스펙터 헤더 + tablist polish — 디자인 토큰 적용`
이전 핸드오버: `bbca3d2 docs: HANDOVER 디자인 모델 source-of-truth 마이그레이션 + 파일 분할`
이번 사이클 누적 commit: 44개

---

## 즉시 읽어야 할 파일

1. **이 파일** — 다음 단계 시작점
2. `docs/discussions/2026-05-10-resolver-regression-verification-codex.md` — 코덱스 P1+P3 검토(우리가 수정 완료)
3. `docs/HANDOVER-2026-05-10-resolver-migration.md` — 직전 핸드오버 (resolver 도입 plan)
4. `apps/web/src/app/design-resolver.ts` — 5영역 resolver 구현체
5. `apps/web/src/app/design-style.ts` — design value → CSSProperties 변환 helpers
6. `apps/web/src/app/globals.css` — 디자인 토큰 정의 (typography/spacing/radius/shadow/motion)

---

## 이번 사이클 작업 요약 (5 phase)

### Phase A — 코덱스 P0 핫픽스 3건 (commits `283f9b8`, `03ce879`, `380f4c0`)

- P0-1: `getComputedStyle()`은 CSS px 기준이라 zoom 보정 제거 (200% 줌에서 padding 24로 잘못 표시되던 회귀)
- P0-2: 더블클릭 시 콘텐츠 탭 명시 전환 후 input focus (이전엔 활성 탭에 input이 있을 때만 동작)
- P0-3: 레이아웃 토글 selected 상태가 explicit 없을 때도 effective(getComputedStyle)에서 derive

### Phase B — design-resolver 도입 (Phase 2/3, 16 commits)

새 모듈:
- `apps/web/src/app/design-resolver.ts` — `resolveSpacing/resolveLayout/resolveTypography/resolveShape/resolveColor`. 각자 `value` + `sources`(`'explicit' | 'default' | 'token' | 'responsive'`) 반환
- `apps/web/src/app/canvas-defaults.ts` — `DEFAULT_SPACING_BY_TYPE`, `DEFAULT_LAYOUT_BY_TYPE`, `DEFAULT_TYPOGRAPHY_BY_EMPHASIS`, `DEFAULT_SHAPE_BY_TYPE`, `DEFAULT_COLOR_TOKENS_BY_TYPE`, `DEFAULT_COLOR_TOKENS_BY_EMPHASIS`

CanvasNode 마이그레이션:
- 모든 컨테이너 type(section/hero/card/list/form)이 className의 padding/gap/shape/color를 _제거_하고 resolver style로 적용
- 자식 wrapper도 마이그레이션 (자식 wrapper의 gap 등은 implementation detail)
- TextPreview의 emphasis className(text-5xl 등) → resolveTypography style
- text 노드 emphasis별 textColor token slot (heading-2/3 → textPrimary, caption → accent)
- section role-aware: banner/page-shell은 default 미적용, 일반 section만 적용

인스펙터 wiring:
- SpacingControls/LayoutControls/NodeColorControls가 resolved 결과 사용
- explicit/effective 시각 구분 (input dot+italic, toggle button 약화 색상, color picker label dot)
- disclosure title dot — 명시 override 영역 표시
- 동적 인스펙터: 명시 prop 영역만 자동 펼침

### Phase C — AI 자유도 풀기 + Phase 5 normalize (commits `73b9455`, `8b4cba1`, `afca3d2`)

`packages/llm-prompts/src/index.ts` 변경:
- "스타일 prop 최소 범위로 사용" 제약을 _자유롭게 박기_로 풀고 design-resolver 안내 추가
- 풍부도 자체 점검 8 신호 → 9 신호 (9번째: "명시 design override 다양성 — 최소 8 노드 이상에 spacing/color/typography/shape/layout 명시")
- transition/transform/cursor/state colors는 _상호작용 의도가 명확할 때_ 사용
- id 전역 유일성 + prefix-suffix 권장

`apps/web/src/app/generation-normalize.ts` 신규:
- LLM 응답 id 중복 자동 dedup (suffix `-2`, `-3`)
- root이 section이 아니면 wrapper section으로 감쌈
- `handleGenerateTree`에서 `commitTreeEdit` 전 호출

### Phase D — page.tsx 분할 (Phase 6, 11 commits)

10개 새 모듈 (page.tsx 13,810 → 12,740, ~1,070 lines 감소):

```
apps/web/src/app/
├── style-utils.ts          mergeStyles + 색 변환 utility
├── text-preview.tsx        TextPreview + typography helpers
├── design-style.ts         spacing/layout/shape/color/transform/transition style helpers
├── schema-fields.ts        공유 schema field arrays + derived types
├── canvas-contexts.ts      6 React contexts + 3 interfaces
├── node-meta.ts            nodeTypeIcons + nodeTypeLabels
├── selectable-node.tsx     SelectableNode + CanvasNodeToolbar
├── inspector-atoms.tsx     InspectorDisclosure + 6 공통 atoms
├── canvas-defaults.ts      type/emphasis별 default
├── design-resolver.ts      resolveSpacing/Layout/Shape/Color/Typography
├── generation-normalize.ts LLM 응답 normalize
└── (기존) responsive.ts, generation-export.ts 등
```

### Phase E — 코덱스 검토 P1+P3 fix (commits `487065d`, `a939fd7`)

`docs/discussions/2026-05-10-resolver-regression-verification-codex.md` 처리:

**P1 — explicit gradient/opacity/state colors 손실** (`design-resolver.ts:343`):
- 문제: resolveColor가 background/text/accent 3-key picker라 backgroundGradient / backgroundOpacity / textOpacity / hover/active/focus/disabled 손실
- 수정: `value = { ...explicit }`로 NodeColor 전체 _기본 보존_, token slot은 3-key에만 explicit 없을 때 채움
- 회귀 테스트 3건: gradient 보존 / opacity 보존 / state colors 보존

**P1 — mobile hero 가짜 column false-positive** (`design-resolver.ts:149`):
- 문제: `node.layout`이 undefined여도 explicit `{}`로 변환되어 `resolveResponsiveLayout({}, 'mobile')`이 direction='column' 박음 → hero/card 인스펙터에 가짜 column
- 수정: `node.layout !== undefined`일 때만 viewport 보정 적용
- 회귀 테스트 3건: hero/card mobile 빈 layout / explicit row→column

**P3 — text-preview.tsx 주석 control character**: 라인 79 NUL bytes 포함 주석 삭제

**스크롤 회귀 fix**: 인스펙터 aside가 `block`이라 다중선택 알림 stack 시 NodeInspector(`h-full`)이 aside 밖으로 나가 잘림 → aside `flex flex-col` + section `min-h-0 flex-1`

### Phase F — UI 수준 끌어올리기 Step 1 (commits `a0b82ba`, `7637d91`)

`globals.css`에 디자인 토큰 scale 추가:
- Typography: `--dw-text-section-heading 12 / label 11 / value 13 / mono 12 / caption 11` + `--dw-font-weight-label 600`
- Spacing: `--dw-space-1~8` (4pt grid: 4/8/12/16/20/24/32/40)
- Radius: `--dw-radius-sm 4 / md 6 / lg 8 / pill`
- Shadow: `--dw-shadow-elev-1/2/3` (다크 호환 깊이)
- Motion: `--dw-motion-fast 80 / base 140 / slow 220` + cubic-bezier ease

Inspector atoms polish (Figma/Adobe 비율 기준):
- 입력 높이 40→32, label uppercase + tracking
- focus 시 border + ring + bg 변화
- active:scale 클릭 피드백
- disclosure 펼친 상태 border highlight, hover elevated bg, accent dot에 glow

NodeInspector 헤더:
- icon 24→20, padding 16→12, radius 토큰화
- '모두 접기' 버튼: underline → accent-soft hover bg
- node id: font-mono caption + hover elevated

Inspector tablist:
- text-xs → label scale token, tracking-wide
- transition 토큰화

---

## 현재 상태

- HEAD: `7637d91`
- page.tsx: 12,738 lines (이전 13,810)
- 검증: typecheck / test (157 통과) / lint 모두 통과
- dev server: 정상 (http://localhost:3000 200)

---

## 남은 작업 (다음 사이클)

### 1. UI 토큰 마이그레이션 (Step 1 마무리)

남은 hex hardcode (`#16181c`, `#2a2e35`, `#6366f1` 등):

- `NodeColorControls` (~600 lines)
  - `renderColorField` color picker
  - state color inputs (hover/active/focus/disabled)
  - gradient picker
  - opacity sliders
- `ShapeControls` (~500 lines)
  - radius mode toggle
  - border style select / width input
  - shadow preset / custom shadow editor
- `TypographyControls` (~400 lines)
  - emphasis preset buttons
  - font family select
  - text shadow editor
- `ImageControls` / `ImageCompositionControls`
- 캔버스 toolbar / status bar
- 좌측 brief panel / layer panel
- 헤더 (logo, undo/redo, contrast 버튼)

전략:
- 정규식 일괄 변환 시도 위험 (다른 컴포넌트의 _고유한 색_을 침범할 가능성). 컴포넌트 단위로 점진.
- `bg-[#16181c]` → `bg-[var(--dw-ui-panel)]`
- `border-[#2a2e35]` → `border-[var(--dw-ui-border)]`
- `text-[#898d97]` → `text-[var(--dw-ui-text-muted)]`
- 등등

### 2. UI Step 2 — 인스펙터 추가 polish

- TypographyControls의 _emphasis preset 그리드_가 너무 큼. Figma처럼 _작은 chip 형태_로
- ShapeControls의 _shadow preview_ 추가 (현재 텍스트만)
- ColorPicker에 _eyedropper_ 또는 _palette quick pick_ 추가
- Spacing _link mode_ (링크/언링크 토글 — 좌우 동시 변경)

### 3. UI Step 3 — 마이크로 인터랙션

- Command palette (⌘K) — Figma/Linear 스타일
- 패널 resize 시각 피드백 강화 (drag preview line)
- 노드 추가/삭제 시 transition (fade + scale)
- Toast 시스템 (현재 alert 또는 inline message)
- 다크/라이트 모드 토글 (토큰 도입 끝나면 가능)

### 4. 잔여 분할 (Phase 6 마무리)

- `MobileBannerSection` (~70 lines, CanvasNode 의존이라 같이)
- `CanvasNode` (~470 lines) — 가장 큰 잔여
- 8개 Inspector controls (각자 별도 파일)
- `NodeInspector` shell

CanvasNode가 가장 크지만 _순환 import_ 위험(MobileBannerSection이 CanvasNode 사용, CanvasNode도 MobileBannerSection 사용). 같이 옮기는 게 자연.

### 5. 다음 codex 검토 라운드

코덱스의 마지막 검토는 `f0acb30 inspector-atoms.tsx` 시점. 이후 `487065d` (P1+P3 fix), `a939fd7` (scroll fix), `a0b82ba`/`7637d91` (UI polish) 미검증. 다음 cycle 시작 시 `docs/discussions/2026-05-11-...-claude.md` 작성해 검토 트리거 가능.

### 6. 검증 권장

- dev server 띄우고 (`pnpm dev`):
  - 노드 클릭 시 인스펙터 disclosure 자동 펼침 + dot 표시 확인
  - input 클릭 시 focus ring 정상
  - tab 전환 부드러운 색 변화
  - disclosure 모두 펼친 상태 _스크롤 끝까지_
  - 200% zoom에서 padding 표시 정확
- AI 새 응답 요청:
  - hero에 backgroundGradient 박혀 있으면 캔버스에 정상 렌더 (P1 fix 확인)
  - mobile viewport에서 hero 선택 시 layout 토글이 빈 상태 (P1 fix 확인)
  - 더 풍부한 design override (prompt 자유도 풀기 효과)

---

## 운영 메모

- 사용자 mandate: "전체 다 안정화될 때까지 자유의지대로 끝까지 진행" → 사이클 단위 핸드오버 X, 다음 우선순위로 즉시 진행 (메모리 가이드)
- 사용자 톤: 존댓말 사용 (이번 사이클 도중 명시)
- 사용자 mandate: "Claude Design / Stitch / Figma / Adobe 수준 UI" → 디자인 토큰 + 마이크로 인터랙션 + 일관 typography 우선
- 코덱스 acceptance criteria 6개 (HANDOVER-2026-05-10-resolver-migration.md):
  - #1 hero 인스펙터-캔버스 일치 ✓
  - #2 zoom 안정성 ✓ (P0-1)
  - #3 viewport별 source 표시 — 부분 (responsive source 메타데이터 구현, UI 표시는 명시 dot으로 대체)
  - #4 reset → resolved default 회귀 ✓
  - #5 export/import idempotent — 미검증
  - #6 className drift catch — 회귀 테스트로 일부 catch (canvas-defaults vs className 값 일치)

---

[Claude]
