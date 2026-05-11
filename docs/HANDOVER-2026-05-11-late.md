# 핸드오버 — 2026-05-11 후반

작성: 2026-05-11
대상 HEAD: `e88dc55 feat: prompt 풍부도 신호 #12, #13 추가 — 인터랙티브 컴포넌트 + entranceAnimation 강제`
이전 핸드오버: `ff76187 docs: 핸드오버 2026-05-11 — 19 commit + 5대 사용자 비판 응답`
사이클 누적 commit: 16개

---

## 즉시 읽어야 할 파일

1. **이 파일** — 다음 단계 시작점
2. `packages/tree/src/schema.ts` — 새 노드 type 4개 (carousel/tabs/accordion/modal) + responsiveStyle + entranceAnimation
3. `packages/llm-prompts/src/index.ts` — 풍부도 13 신호 + 모든 새 컴포넌트 가이드
4. `apps/web/src/app/page.tsx` — 인스펙터 viewport override 모드 + 4개 컴포넌트 Controls/Preview + EntranceAnimationControls
5. `seeds/trees/saas-dashboard.json` — DEVELOPER FLOW (tabs) + FAQ (accordion) + features 카드 staggered animation

---

## 사이클 16 commit 요약 (5 phase)

### Phase A — 사용자 비판 #4 잔여 처리: viewport-별 수치 override (commits 1~9, 9 commits)

이전 핸드오버에서 _hideOn만 됐고 fontSize/padding/radius 같은 수치 override 미구현_.

- **`a6a4d58`** 인스펙터 position/hideOn GUI 노출 — schema는 있었고 GUI만 누락. NodeMetaPatch에 position/inset/hideOn 추가, layout 탭에 두 disclosure 신규.
- **`c1a4dab`** fixture 3종 sticky/overlay 패턴 — simple-hero/saas-dashboard banner sticky, playful-product hero에 absolute SALE 배지 + page level fixed FAB.
- **`ae6b714`** **responsiveStyle data layer** — schema에 `responsiveStyle?: { mobile?, tablet? }` (typography/spacing/shape/color/layout/transform 부분 override). resolver 5개에 user override merge (자동 보정 위에). 사용자 override가 자동 보정을 _이긴다_.
- **`8ef6fed`** fixture viewport override 시연 — simple/saas/playful hero.title을 viewport별 fontSize 차등.
- **`8f03316`** **인스펙터 viewport override 편집 모드** — viewport switcher가 mobile/tablet일 때 인스펙터 입력이 자동으로 `responsiveStyle.{viewport}.{prop}`로 박힘. 보라색 banner로 모드 안내. handleX 5개 모두 viewport-aware.
- **`943c4f5`** transform viewport override — selectable-node에서 `resolveTransform(node, viewport)` 사용.
- **`66f57f4`** reset functions viewport-aware — mobile에서 reset은 그 viewport override만 제거.
- **`fa1a7f8`** disclosure header hasExplicit viewport-aware — mobile에서 override만 있는 노드의 reset 버튼이 disabled로 잘못 표시되던 것 fix. 5개 Controls 패치.

### Phase B — 사용자 비판 #5: 인터랙티브 컴포넌트 4종 (commits 5, 10~12, 14)

- **`0829b52`** **carousel** 노드 type — items[≥1]/auto/intervalMs/showDots/showArrows/previewIndex. 캔버스는 정적 미리보기 (previewIndex 슬라이드 + 좌/우 화살표 + dot indicator + N/M 카운트).
- **`f12e928`** carousel items 편집 UI — 슬라이드 추가/삭제/순서/src/alt/caption 편집.
- **`5226e6e`** **tabs** 노드 type — items (id/label/content) + activeIndex + variant (underline/pill/enclosed). 캔버스는 활성 panel만 정적.
- **`52f0ae1`** **accordion** 노드 type — items (id/title/content/expanded?) + allowMultiple + variant (bordered/minimal). 캔버스는 expanded item만 펼친 상태.
- **`51a2e1b`** **modal** 노드 type — title/content/primaryActionLabel?/secondaryActionLabel?/size (sm/md/lg/xl)/open. 캔버스는 _inline_ 카드 미리보기 (fixed/backdrop 없이) — 디자이너가 컨텐츠 본 채 편집.

### Phase C — 사용자 mandate 'animation 깊이' (commits 13, 15)

- **`76137d5`** **entranceAnimation** prop — 모든 노드에 진입 효과 (fade-in / slide-up/down/left/right / scale-up / zoom-in). duration (100~3000) + delay (0~3000) + trigger (scroll | load). 캔버스는 정적, export 시 IntersectionObserver + CSS animation으로 wrap (data-dw-entrance attr). 인스펙터 EntranceAnimationControls disclosure (반응형 숨김 다음).
- **`cf3ca1b`** 캔버스 미리보기 재생 — 노드 선택 시 entranceAnimation을 transient하게 한 번 재생. globals.css에 7가지 keyframes 정의. SelectableNode가 useEffect로 timer 관리.

### Phase D — prompt 풍부도 신호 #12/#13 (commit 16)

- **`e88dc55`** prompt 11 → 13 신호 — 인터랙티브 컴포넌트 (carousel/tabs/accordion/modal 1개 이상) + entranceAnimation (6-12 노드 staggered) 강제. AI가 새 노드 type 활용하도록.

### Phase E — fixture 시연 분포 (commits 사이사이)

- saas-dashboard:
  - banner sticky (Phase A)
  - hero.title fontSize responsiveStyle (Phase A)
  - hero.title slide-up entranceAnimation (Phase C)
  - features.cards 3개 slide-up + delay 0/150/300 staggered (Phase C)
  - DEVELOPER FLOW _tabs_ 섹션 (Phase B)
  - FAQ _accordion_ 섹션 (Phase B)
- playful-product:
  - hero.image → hero.gallery (carousel 4 슬라이드, auto 4000ms) (Phase B)
  - hero.badge absolute SALE 배지 (Phase A)
  - page.fab fixed Buy now FAB (Phase A)
  - hero.title fontSize responsiveStyle
- simple-hero / minimal-portfolio / dark-luxury-hero / signup-form / card-grid: 기존

---

## 현재 상태

- HEAD: `e88dc55`
- TREE_NODE_TYPES: 8 → 12 (carousel + tabs + accordion + modal 추가)
- 풍부도 신호: 11 → 13 (인터랙티브 + entranceAnimation 추가)
- 인스펙터 disclosures: 위치 / 반응형 숨김 / 진입 애니메이션 / Carousel / Tabs / Accordion / Modal 신규 7개
- 검증: typecheck/lint/test 모두 turborepo full 통과 (web: 343/343)
- page.tsx: 12,521 → 13,500+ lines (4개 type별 Preview/Controls + EntranceAnimationControls 추가)

---

## 다음 사이클 우선순위 권고

### 1. AI 생성 검증 — 신호 #12/#13 자동 enforce (중대)

prompt에 신호를 박았지만 _generation 파이프라인이 자동 검증_하지는 않음. richness.ts (있다면) 또는 generation-normalize.ts에 신호 자체 점검 추가.

- 신호 #12: `tree.root` 어딘가에 carousel/tabs/accordion/modal 1개 이상 → 없으면 fallback 보강 또는 경고
- 신호 #13: `entranceAnimation` 가진 노드 6-12개 → 너무 적거나 많으면 경고

### 2. video 노드 type (인터랙티브 #5)

`type: 'video'` + src + poster + autoplay/loop/muted/controls + aspectRatio. carousel/tabs 패턴 그대로.

### 3. export pipeline 강화 (큰 작업)

현재 renderer는 carousel/tabs/accordion/modal 정적 HTML만 생성 (data-attr 박음). 실제 _작동하는_ HTML로 export 하려면 라이브러리 wrap 코드 추가:

- carousel: Embla Carousel script 주입
- tabs/accordion/modal: Radix UI script 또는 자체 vanilla JS
- entranceAnimation: IntersectionObserver vanilla 스크립트 자동 주입

### 4. 사용성 (작은 작업 묶음)

- 키보드 shortcut 더 추가 (현재 ⌘K 명령 팔레트 + Esc 외)
- multi-select 개선
- canvas grid/guide
- AnimationControls 미리보기 _재생_ 버튼 (현재는 자동 — 명시 재생 버튼도 유용)

### 5. 디자인 토큰 시스템 깊이

theme switcher (light/dark/sepia 등 풀 palette 전환), custom palette 정의, token export.

---

## 검증 권장 (다음 사이클 시작 시)

1. dev server: `lsof -nP -iTCP:3000`으로 stale kill → `pnpm --filter @dworks/web dev`
2. saas-dashboard fixture: DEVELOPER FLOW (tabs) + FAQ (accordion) 시각 확인
3. playful-product fixture: hero carousel 4 슬라이드 + 우상단 SALE 배지 + 우하단 Buy now FAB
4. 인스펙터 viewport switcher 모바일/태블릿 → 보라색 override mode banner 노출 확인
5. 노드 선택 시 entranceAnimation 자동 재생 확인 (saas-dashboard hero.title slide-up)
6. AI 새 응답 — 신호 #12/#13 만족 여부 (carousel/tabs/accordion/modal 중 1개 + entranceAnimation 6-12 노드)

---

## 운영 메모

- 사용자 mandate: "전체 다 안정화될 때까지 자유의지대로 끝까지 진행" (이전 사이클과 동일)
- 사용자 톤: 존댓말
- 사용자 mandate: "Claude Design / Stitch / Figma / Adobe 수준 UI"
- 메모리 가이드: 컨텍스트 임박 시점에만 핸드오버 작성. 이번은 16 commit + 큰 schema 변경으로 _안전 차원_에서 작성.
- 다음 사이클 시작 시 본 핸드오버 + 이전 핸드오버 (HANDOVER-2026-05-11.md) 모두 읽기

---

## 사이클 인터랙티브 컴포넌트 매트릭스

| type | schema | renderer | inspector | fixture 시연 | 캔버스 |
|---|---|---|---|---|---|
| carousel | ✓ items[≥1] + auto/interval/dots/arrows/preview | ✓ first item | ✓ items 편집 + 표시 옵션 | playful-product hero.gallery | dot+arrow+count |
| tabs | ✓ items[≥1] + active + variant | ✓ active panel | ✓ items 편집 + variant | saas-dashboard guide.tabs | tab list + panel |
| accordion | ✓ items[≥1] + allowMultiple + variant | ✓ details/summary | ✓ items 편집 + 펼침 | saas-dashboard faq.list | bordered/minimal |
| modal | ✓ title/content/actions/size/open | ✓ dialog | ✓ title/content/actions/size/open | (없음 — section 마지막) | inline 카드 |

다음에 추가할 후보:
- video (HTML5 + youtube/vimeo)
- code block (syntax highlight)
- table (데이터 표)
- map (지도 embed)
- chart (간단 데이터 시각화)

---

[Claude]
