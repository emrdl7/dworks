# Dworks — 기성 디자인툴 수준의 완성된 디자인 시안 도구

> **현재 상태**: v2.0 완료 (2026-05-11 ship). v1 의 _기능 풍부도_ + v2.0 의 _사용성/완성도_ 모두 확보. 5 phase / 21 plan / 19 requirement 100% 구현. Tech debt 3건 (v3+ 영역). Human 시각 검증 35건 deferred (autonomous YOLO mandate 후속 spot-check 권장).
> **다음**: v3.0 — 협업 / 백엔드 통합 / 코드 export / 모바일 / 시스템 추출 영역 본격화 (`/gsd-new-milestone` 으로 시작).
> **이전 산출물**: 루트 `PLAN.md`(v1 라운드 1~5), `docs/DECISIONS.md`, `docs/HANDOVER-2026-05-11-late.md`(v1 마지막 사이클), `.planning/milestones/v2.0-*`(v2.0 archive).

## v2.0 Highlights (shipped 2026-05-11)

- **UX 핵심 fix** — context menu auto-flip, spacing overlay (Alt 가이드), type conversion 3-route (메뉴/인스펙터/⌘K), 좌측 컴포넌트 라이브러리 패널 (12 basic + 10 patterns drag), Shift+drag 박스 선택 + 8 align/distribute shortcuts, T/B/I/R/C 등 quick-add (8/12 키 작동)
- **AI 품질 자동 enforce** — 13 신호 validator (`enforceRichness`), 도메인-적합 interactive 자동 추가, entranceAnimation staggered 자동 박기, 6×5 도메인×톤 매트릭스 prompt, image dominant 5색 + layout intent
- **시각 표준** — 12-col grid overlay + snap helper, cursor-pivot zoom (5+ 진입점), 좌하단 미니맵 navigate
- **인터랙티브 export** — Embla carousel CDN + 자동 init, vanilla JS tabs/modal/accordion wrap (라이브러리 의존 없음), IntersectionObserver entrance + reduced-motion 존중
- **디자인 시스템** — 3 theme (dark/light/sepia) 토큰 swap, 사용자 정의 palette 8개 (5-10색 each), Tailwind config + CSS variables 토큰 export



---

## What This Is

Dworks는 자연어 + 레퍼런스로 웹 디자인 시안을 생성하고, 캔버스에서 바로 편집해 납품 가능한 산출물로 정돈하는 디자인툴이다. v1에서 _구조와 기능_을 확보 — JSON 의도 트리 기반 12 노드 타입(text/button/image/carousel/tabs/accordion/modal/section/hero/card/list/form), responsiveStyle viewport-별 override, entranceAnimation, 인터랙티브 컴포넌트 4종, 인스펙터 viewport override 편집 모드. v2.0은 _완성도와 사용성_ 향상이 목표 — 기성 디자인툴의 _자연스러운_ 편집 경험.

## Core Value

**한 줄 의도 → 기성 디자인툴 수준의 시안 1분 안에 + 자연스러운 편집.** v1에서 _기능 풍부도_ 확보. v2.0에서 사용자가 _당연하게_ 기대하는 사용성을 채운다 — 컨텍스트 메뉴가 화면 밖으로 안 나감, 노드 간격이 즉시 보임, 컴포넌트를 드래그해서 추가, AI 출력이 _기성 제품 수준_으로 일관 풍부.

## Requirements

### Validated (v1 — 이미 확보)

- ✓ 12 노드 타입 (text/button/image/carousel/tabs/accordion/modal/section/hero/card/list/form) — schema/렌더/인스펙터/export 모두
- ✓ JSON 의도 트리 source-of-truth — design-resolver 기반 spacing/layout/typography/shape/color
- ✓ responsiveStyle viewport-별 수치 override (mobile/tablet, 부분 머지)
- ✓ entranceAnimation prop + 캔버스 미리보기 재생
- ✓ 인스펙터 viewport override 편집 모드 (mobile/tablet에서 자동 override)
- ✓ position/inset 레이어드 디자인 (sticky/absolute/fixed) + hideOn 반응형 숨김
- ✓ AI 생성 prompt — 풍부도 13 신호 + 톤 매핑 11종 + 도메인 패턴
- ✓ 캔버스 fixture 7종 (simple-hero/card-grid/signup-form/dark-luxury-hero/saas-dashboard/minimal-portfolio/playful-product)
- ✓ ⌘K 명령 팔레트 + 기본 키보드 shortcut

### Active (v2.0)

#### A. AI 생성 품질 고도화 (사용자 핵심 요구 #1)

- [ ] **AI-01**: 풍부도 13 신호 자동 enforce — generation 후 검증 통과 못하면 재생성 또는 fallback 보강
- [ ] **AI-02**: 인터랙티브 컴포넌트 (carousel/tabs/accordion/modal) _도메인-적합_ 자동 활용 — 출력 트리에 항상 1개 이상
- [ ] **AI-03**: entranceAnimation 6-12 노드 staggered 자동 박기 — prompt 가이드 + 자동 후처리
- [ ] **AI-04**: domain-specific prompt 패턴 강화 — 11 톤 매핑 → 도메인×톤 매트릭스로 확장 (e-commerce dark / SaaS playful 등 조합)
- [ ] **AI-05**: 참조 이미지 multimodal 활용 강화 — 색감/레이아웃 추출 정밀도 향상

#### B. 인스펙터/캔버스 UX (사용자 핵심 요구 #2~#5)

- [ ] **UX-01**: 컨텍스트 메뉴 (우클릭) 위치 화면 밖 overflow fix — viewport boundary 검사 + auto-flip
- [ ] **UX-02**: 노드 간격 측정 즉시 표시 — Figma 스타일 (선택 노드 + hover 노드 사이 px 거리 + 정렬 가이드)
- [ ] **UX-03**: 노드 타입 변경 기능 확대 — 모든 호환 type 간 변환 (현재 부분만, container↔leaf 전환 / interactive type 간 전환 등)
- [ ] **UX-04**: 컴포넌트 라이브러리 패널 + 드래그로 캔버스에 추가 — 좌측 패널에 12 노드 타입 + 사전 정의 패턴 카드
- [ ] **UX-05**: 다중 선택 개선 — Shift/Cmd 클릭 외에 박스 선택, 정렬/분포 단축키
- [ ] **UX-06**: 키보드 shortcut 확대 — 노드 타입별 quick-add (T=text/B=button/I=image 등 Figma 패턴)

#### C. 시각 보조 (기성 툴 표준)

- [ ] **VIS-01**: 캔버스 그리드/스냅 — viewport별 column grid (12-col) + snap to guide
- [ ] **VIS-02**: 줌 컨트롤 개선 — pinch zoom + 마우스 위치 기준 (현재 중심 기준)
- [ ] **VIS-03**: 미니맵 — 큰 트리 navigate

#### D. export 깊이

- [ ] **EXP-01**: carousel 실제 작동 export — Embla Carousel script 자동 wrap
- [ ] **EXP-02**: tabs/accordion/modal 실제 작동 export — Radix UI 또는 vanilla JS wrap
- [ ] **EXP-03**: entranceAnimation 작동 export — IntersectionObserver vanilla 자동 주입

#### E. 디자인 시스템 깊이

- [ ] **DS-01**: theme switcher (light/dark/sepia/custom) — globals.css 토큰 swap
- [ ] **DS-02**: custom palette 정의/저장
- [ ] **DS-03**: 디자인 토큰 export (Tailwind/CSS variables)

### Out of Scope (v2.0 명시 제외)

- 협업 기능 (multi-user, comment) — v3.0+
- 백엔드 통합 (CMS, API binding) — v3.0+
- 코드 export (React/Vue 컴포넌트) — v3.0+ (현재 HTML export만)
- 모바일 앱 캔버스 — v3.0+
- 풀 design system 자동 추출 (style guide pdf 등) — v3.0+

## Constraints

- v1 스키마 호환 유지 (트리 JSON 구조 변경 금지 — 추가만)
- 캔버스 single-tab editor (multi-doc 미지원)
- TypeScript strict mode 유지
- 모든 UI 한국어 (사용자 mandate)
- pnpm + turborepo monorepo 구조 유지

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v2.0 milestone 분리 | v1에서 _기능_ 풍부도 확보, v2.0은 _사용성/완성도_에 집중 | — Pending |
| Coarse granularity (3-5 phase) | 사용자 자율 진행 mandate — 빠른 phase 회전 우선 | — Pending |
| Auto/YOLO mode | 사용자 자리 비움, 인터랙티브 질문 금지 | — Pending |
| Inherit model | 현재 세션 model (Opus 4.7 1M) 사용 — quality+context 모두 확보 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-11 after v2.0 initialization*
