# Dworks v2.0 Roadmap

> 5 phases | 19 requirements | Coarse granularity (1-3 plans/phase) | YOLO/auto mode
> 사용자 mandate: 자율 진행, 질문/피드백 X.

---

## Phase 매트릭스

| # | Phase | Goal | Requirements | UI hint |
|---|-------|------|--------------|---------|
| 1 | UX 핵심 fix + 측정 | 7/7 | Complete    | 2026-05-11 |
| 2 | AI 생성 품질 자동 검증 | 5/5 | Complete    | 2026-05-11 |
| 3 | 시각 보조 도구 (그리드/줌/미니맵) | 3/3 | Complete    | 2026-05-11 |
| 4 | export 깊이 — 인터랙티브 작동 | 2/3 plans (04-01, 04-02 done) | EXP-01..EXP-03 | 2026-05-11 |
| 5 | 디자인 시스템 (theme/palette/token export) | theme switcher + custom palette + 토큰 export | DS-01..DS-03 | yes |

---

## Phase 1: UX 핵심 fix + 측정 도구

**Goal**: 사용자가 명시한 5대 UX 비판을 처리해 _기성 툴 자연스러움_의 기반 확보. 컨텍스트 메뉴 화면 밖 버그 + 노드 간격 측정 + 노드 타입 변경 확대 + 컴포넌트 드래그 추가 + multi-select 박스 + 키보드 shortcut.

**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05, UX-06

**Success criteria**:
1. NodeContextMenu가 화면 우측/하단 boundary 근처에서 _flip_으로 모든 항목 보임 (Playwright 스크린샷 검증)
2. Alt+hover로 두 노드 사이 spacing(px) overlay 표시 + 정렬 가이드 라인
3. text↔button, section↔hero↔card, list↔accordion, image↔carousel 변환 작동 + 비호환 변환 시 경고
4. 좌측 컴포넌트 라이브러리 패널 노출 — 12 노드 type + ≥10 패턴 카드 드래그로 캔버스 추가
5. Shift+drag 박스 선택 + 정렬/분포 단축키 (정렬 좌/중/우/상/중/하 + 분포 가로/세로 균등)
6. T/B/I/R/C 등 노드 quick-add 단축키 작동

**Plans:** 7/7 plans complete

```
Plans:
- [x] 01-01-PLAN.md — Toast host + 변환 매트릭스 (Wave 1, foundation)
- [x] 01-02-PLAN.md — UX-01 boundary auto-flip 검증 stub (Wave 1, doc-only)
- [x] 01-03-PLAN.md — UX-02 Spacing overlay + 정렬 가이드 (Wave 2)
- [x] 01-04-PLAN.md — UX-06 Quick-add 단축키 + cheatsheet (Wave 3)
- [x] 01-05-PLAN.md — UX-03 노드 타입 변환 (컨텍스트 + 인스펙터 dropdown + ⌘K) (Wave 4)
- [x] 01-06-PLAN.md — UX-04 좌측 컴포넌트 라이브러리 패널 + drag/drop (Wave 5)
- [x] 01-07-PLAN.md — UX-05 박스 선택 + 정렬/분포 8 단축키 (Wave 6)
```

---

## Phase 2: AI 생성 품질 자동 검증

**Goal**: prompt에 박힌 13 신호가 _자동 enforce_되도록 — generation 후 validator + 자동 보강 + 도메인×톤 매트릭스 확장 + 참조 이미지 활용 강화.

**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05

**Success criteria**:
1. generation-normalize에 _13 신호 검증_ 모듈 — 미달 신호 발견 시 사용자에게 표시 + 자동 보강 trigger
2. 인터랙티브 컴포넌트 0개 출력 — 자동으로 도메인-적합 1개 추가 (e-commerce → carousel, SaaS → tabs 등)
3. entranceAnimation 가진 노드 < 6개 — hero.title slide-up + features cards staggered slide-up 자동 박기
4. prompt에 _도메인×톤 매트릭스_ 표 추가 (e-commerce dark / SaaS playful 등 조합 + fixture 표본)
5. 참조 이미지에서 dominant color 5색 + 레이아웃 의도 (centered/left-aligned/grid) 추출해 prompt에 전달

**Plans:** 5/5 plans complete

```
Plans:
- [x] 02-01-PLAN.md — AI-01 richness.ts 5 신호 추가 + validateTreeRichness API (Wave 1, foundation) — 2026-05-11
- [x] 02-02-PLAN.md — AI-04 도메인×톤 6×5 매트릭스 prompt 섹션 (Wave 1, prompt-only)
- [x] 02-03-PLAN.md — AI-05 image-color analyzeDominantColors + extractLayoutIntent + prompt inject (Wave 2)
- [x] 02-04-PLAN.md — AI-01b/AI-02/AI-03 generation-normalize enforceRichness hook + interactive + animation (Wave 2)
- [x] 02-05-PLAN.md — Gap closure: AI-01/02/03 + AI-05 production wiring in page.tsx (Wave 7, gap_closure) — 2026-05-11
```

---

## Phase 3: 시각 보조 도구

**Goal**: 기성 디자인툴 _시각 표준_ — 12-column grid overlay + 마우스 위치 기준 줌 + 미니맵.

**Requirements**: VIS-01, VIS-02, VIS-03

**Success criteria**:
1. 캔버스 상단 컨트롤에 grid 토글 — 12-col + gutter 시각화 + snap to column
2. 줌이 마우스 포인터 위치 기준으로 동작 (현재 중심 기준 → focal point 기준)
3. 좌하단 미니맵 — 큰 트리에서 viewport 위치 표시 + 클릭으로 navigate

**Plans:** 3/3 plans complete

```
Plans:
- [x] 03-01-PLAN.md — VIS-01 12-col 그리드 overlay + snap helper (Wave 1) — 2026-05-11
- [x] 03-02-PLAN.md — VIS-02 viewport 중앙 pivot 줌 (toolbar +/- + ⌘0/⌘+/⌘-) (Wave 2) — 2026-05-11
- [x] 03-03-PLAN.md — VIS-03 좌하단 미니맵 (Wave 3) — 2026-05-11
```

---

## Phase 4: export 깊이 (라이브러리 wrap)

**Goal**: carousel/tabs/accordion/modal/animation이 _실제 작동하는_ HTML로 export. 현재는 정적 HTML + data-attr만.

**Requirements**: EXP-01, EXP-02, EXP-03

**Success criteria**:
1. export 결과에 carousel 노드 있으면 Embla Carousel CDN script + init JS 자동 주입 — 실제 슬라이드 작동
2. tabs/accordion/modal 노드 있으면 vanilla JS (라이브러리 의존 회피) wrap — 실제 토글/펼침/dialog 작동
3. entranceAnimation 가진 노드 있으면 IntersectionObserver vanilla JS 자동 주입 — 실제 진입 효과 작동 + reduced-motion 존중

**Plans:** 1/3 plans complete

```
Plans:
- [x] 04-01-PLAN.md — tree-renderer 4 interactive 노드 확장 (전체 slide/item + data-dworks-* attr) (Wave 1) — 2026-05-11
- [x] 04-02-PLAN.md — exporters html.ts + Embla/vanilla JS 스크립트 주입 (Wave 2) — 2026-05-11
- [ ] 04-03-PLAN.md — apps/web HTML 내보내기 어댑터 + download UI (Wave 3)
```

---

## Phase 5: 디자인 시스템 깊이

**Goal**: theme switcher + custom palette + 토큰 export로 _디자인 시스템 도구_의 기본기 확보.

**Requirements**: DS-01, DS-02, DS-03

**Success criteria**:
1. chrome 영역 theme switcher (light/dark/sepia) — globals.css 토큰 swap, 인스펙터/패널 색깔 즉시 변경
2. custom palette 저장 — 사용자 정의 5-10색 palette를 localStorage 또는 fixture와 같은 방식으로 관리
3. 트리에서 사용된 hex/spacing/radius/font를 Tailwind config (.ts) 또는 CSS variables(.css)로 export — 다른 프로젝트에서 import 가능

---

## Coverage

| Requirement | Phase |
|-------------|-------|
| AI-01..AI-05 | 2 |
| UX-01..UX-06 | 1 |
| VIS-01..VIS-03 | 3 |
| EXP-01..EXP-03 | 4 |
| DS-01..DS-03 | 5 |

**Total**: 19 requirements, 5 phases. 100% coverage.

---

## 다음 단계

```
/gsd-discuss-phase 1 --auto    # phase 1 context 자동 수집
/gsd-plan-phase 1               # PLAN.md 작성
/gsd-execute-phase 1            # 실행
```

또는 한 번에:
```
/gsd-autonomous                 # 모든 phase 자율 진행 (discuss→plan→execute 반복)
```
