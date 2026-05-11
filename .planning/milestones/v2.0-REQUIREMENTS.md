# Dworks v2.0 Requirements

> v1에서 12 노드 type + 인스펙터 viewport override + animation까지 확보. v2.0은 _기성 디자인툴 수준의 완성도_가 목표.
> Phase 매핑은 ROADMAP.md 참조.

---

## v2.0 Requirements

### A. AI 생성 품질 (5)

- [x] **AI-01
**: generation-normalize 또는 별도 validator가 풍부도 13 신호를 자체 점검 — 미달 신호 발견 시 (1) prompt에 _재시도 요청_ 추가하거나 (2) 자동 보강 (예: entranceAnimation 0개면 hero.title/cards에 자동 박기). 신호별 통과/미달 표시 + 사용자에게 표시.
- [x] **AI-02
**: prompt에 _도메인별 인터랙티브 컴포넌트 매트릭스_ 명시 (e-commerce → carousel + accordion, SaaS → tabs + accordion, 포트폴리오 → carousel, 가입 페이지 → modal). 후처리 검증으로 _최소 1개_ 강제.
- [x] **AI-03
**: 후처리 — entranceAnimation 가진 노드 < 6개일 때 자동 박기 (hero.title slide-up, features cards staggered slide-up). 사용자 명시 없는 한 트리거 'scroll', 처음 hero는 'load'.
- [x] **AI-04**: 톤 매핑 11종을 _도메인_ × _톤_ 매트릭스로 확장 (예: dark+luxury+ecommerce, playful+SaaS, minimal+portfolio 등). prompt에 매트릭스 표 추가 + fixture로 시연.
- [x] **AI-05
**: 멀티모달 참조 이미지 활용 — 이미지에서 dominant color + 레이아웃 패턴 추출해 prompt에 _hex 팔레트_ + _layout 의도_로 전달. 기존 image-color 모듈 강화.

### B. 인스펙터/캔버스 UX (사용자 핵심 요구)

- [x] **UX-01
**: 우클릭 컨텍스트 메뉴 (NodeContextMenu) viewport boundary 검사 — 화면 우측/하단 가까우면 _좌측/위로 자동 flip_. 모든 메뉴 항목 항상 보이도록.
- [x] **UX-02
**: 노드 간격 측정 _Figma 스타일_ — 선택 노드와 hover 다른 노드 사이 spacing(px) overlay 표시. 정렬 가이드 라인(빨간 선) + 스냅. Alt 키로 hover 시 거리 측정.
- [x] **UX-03**: 노드 타입 변경 확대 — 현재 일부 type만 변환 가능. 모든 호환 type 간 변환 (text↔button, section↔hero↔card, list ↔ accordion, image↔carousel, 등). 비호환 변환 시 명확한 경고.
- [x] **UX-04
**: 좌측 컴포넌트 라이브러리 패널 — 12 노드 타입 + 사전 정의 패턴 카드 (hero/feature-grid/cta/footer 등 ≥10) + 드래그로 캔버스에 추가 + 드래그 중 placeholder/스냅.
- [x] **UX-05
**: 다중 선택 — Shift+drag로 박스 선택. 선택 후 정렬(좌/중/우, 상/중/하) + 분포(가로/세로 균등) 단축키.
- [x] **UX-06**: 키보드 shortcut 확대 — T(text), B(button), I(image), R(rect/section), C(carousel), S(scale 모드), H(hand 모드) 등 Figma 스타일.

### C. 시각 보조 (3)

- [x] **VIS-01**: 캔버스 그리드 — viewport별 12-column grid overlay 토글. snap to column. (2026-05-11, Plan 03-01. snap 컴퓨트 site 는 자유위치 드래그 기능 미존재로 deferred — helper export + state + 가이드 div 인프라 준비됨)
- [x] **VIS-02
**: 줌 컨트롤 — pinch zoom + 마우스 위치 기준 줌 (현재 중심 기준). ⌘+/⌘- shortcut도.
- [x] **VIS-03**: 미니맵 — 좌하단 작은 미니맵으로 큰 트리 navigate. (2026-05-11, Plan 03-03. minimap.tsx 신규 — 200×~60-120px fixed, 노드 outlined rectangle + viewport rect + 클릭 navigate + Shift+M 토글 + ⌘K 엔트리 + dw:uiPrefs:v1 영속화)

### D. export 깊이 (3)

- [x] **EXP-01**: carousel export 작동 — Embla Carousel CDN script + 자동 init JS 주입. (2026-05-11, Plan 04-01 renderer + Plan 04-02 exporters/html.ts CAROUSEL_INIT + Plan 04-03 web 'HTML 내보내기' 버튼)
- [x] **EXP-02**: tabs/accordion/modal export 작동 — vanilla JS (Radix dependencies 회피) + a11y(role/aria) 보강. (2026-05-11, Plan 04-01 renderer + Plan 04-02 exporters TABS/MODAL/ACCORDION 템플릿 + Plan 04-03 web download UI)
- [x] **EXP-03**: entranceAnimation export 작동 — IntersectionObserver vanilla JS 자동 주입 + reduced-motion 존중. (2026-05-11, Plan 04-02 exporters ENTRANCE 템플릿 + Plan 04-03 web download UI)

### E. 디자인 시스템 (3)

- [x] **DS-01**: theme switcher — chrome 영역 light/dark/sepia 토글. globals.css 토큰 swap. 캔버스 콘텐츠는 별도 (별 영향 없음).
- [x] **DS-02
**: custom palette 저장/관리 — userFixtures와 비슷한 구조로 사용자 정의 palette 저장.
- [x] **DS-03
**: 디자인 토큰 export — 현재 트리에서 사용된 hex/spacing/radius/font를 Tailwind config 또는 CSS variables 형태로 export.

---

## Out of Scope (v2.0 명시 제외 — v3.0+로)

- 협업 (multi-user, comment, presence)
- 백엔드 통합 (CMS, API data binding)
- React/Vue 컴포넌트 코드 export
- 모바일 네이티브 앱 캔버스
- 자동 design system 추출 (PDF style guide 등)
- 실시간 collab cursor

---

## Traceability (filled by ROADMAP.md)

자세한 phase 매핑은 ROADMAP.md를 참조. 각 REQ-ID는 정확히 1개 phase에 매핑된다.
