---
phase: 01-ux-fix
plan: 06
subsystem: ui/canvas
tags: [ux, component-library, drag-drop, panel, fixture]
requires:
  - 01-05  # NodeTypeConvert handler (handleAddFromLibrary 와 같은 commitTreeEdit 흐름 재사용)
provides:
  - ComponentLibraryPanel  # 좌측 240/32px 패널
  - ComponentLibraryDragPayload  # dataTransfer JSON 인터페이스
  - appendFixtureToTarget  # 패턴 fixture import (deep clone + id prefix)
  - DropTargetOutline  # 드래그 hover 컨테이너 강조
affects:
  - apps/web/src/app/page.tsx  # 최상위 layout + global keydown + canvas drop
  - apps/web/src/app/tree-fixtures.ts  # icon 필드 + 3 신규 fixture
tech-stack:
  added:
    - lucide-react (Tag, GalleryHorizontal, HelpCircle, LayoutDashboard, Sparkles 등 패턴 thumbnail)
  patterns:
    - HTML5 native drag (effectAllowed='copy' + 커스텀 MIME)
    - elementsFromPoint 컨테이너 매칭
    - immutable tree mutate (appendChildrenToContainer recurse)
key-files:
  created:
    - apps/web/src/app/component-library-panel.tsx
    - seeds/trees/pricing-tier.json
    - seeds/trees/products-carousel.json
    - seeds/trees/faq-accordion.json
  modified:
    - apps/web/src/app/tree-fixtures.ts
    - apps/web/src/app/page.tsx
decisions:
  - "D-08 240/32px 토글 + [ 단축키"
  - "D-09 12 Basic + 10 Pattern 카테고리"
  - "D-10 drop fallback to root.id when target is not container"
  - "D-11 패턴 카드 상단 32×32 lucide thumbnail"
metrics:
  duration_seconds: 347
  completed: 2026-05-11
  tasks: 3
  files_changed: 6
---

# Phase 1 Plan 06: UX-04 컴포넌트 라이브러리 패널 Summary

좌측 240/32px 컴포넌트 라이브러리 패널 + 12 기본 노드 + 10 패턴 카드 + HTML5 drag drop + 빈 캔버스 placeholder 구현 (CONTEXT D-08..D-11 잠금).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | 3 신규 fixture (pricing-tier / products-carousel / faq-accordion) + tree-fixtures.ts D-11 icon 필드 | `d98ac1f` | seeds/trees/*.json (3), apps/web/src/app/tree-fixtures.ts |
| 2 | ComponentLibraryPanel + ComponentCard (basic 16px / pattern 32px thumbnail) | `c534a77` | apps/web/src/app/component-library-panel.tsx |
| 3 | page.tsx 마운트 + drop handler + [ 단축키 + DropTargetOutline + 빈 캔버스 placeholder | `6971e88` | apps/web/src/app/page.tsx |

## Key Implementation Details

### Fixture 신규 3종 (Task 1)

- `pricing-tier.json` — 3 카드 (베이직/프로 강조/엔터프라이즈), Pro 카드는 transform scale 1.04 + accent 배경
- `products-carousel.json` — carousel 노드 1개, `items[]` 4 슬라이드 (운동화/워치/이어폰/백팩)
- `faq-accordion.json` — accordion 노드 1개, `items[]` 5 entries (배송/환불/혜택/결제/교환)
- 기존 7 fixture 도 `icon: LucideIcon` 필드 추가 — D-11 패턴 카드 thumbnail source
- `treeFixtures` 배열 길이 7 → 10

### ComponentLibraryPanel (Task 2)

- 토글 width transition `var(--dw-motion-base) ease var(--dw-motion-ease)`
- Basic 카드: `h-10 flex` + 좌측 16px lucide icon + 우측 한국어 라벨
- Pattern 카드: `flex-col` + 상단 60px 영역 안 32px lucide icon + 하단 가운데 라벨 (D-11)
- HTML5 drag: `dataTransfer.setData('application/x-dworks-node', JSON.stringify({type | fixtureId}))`
- 키보드 a11y: `tabIndex={0}` + Enter/Space → `onAddByKeyboard` (drag 대체 경로)
- `aria-label="컴포넌트 라이브러리"` + `aria-label="컴포넌트 패널 토글"`

### page.tsx 통합 (Task 3)

- `componentPanelOpen` state (default true), `[` 단축키 토글
- `<section>` 을 `flex-row` 로 변경 + 패널 좌측 + 기존 toolbar/canvas/statusBar `flex-col` div 감싸기
- canvasScrollRef 에 `onDragOver / onDragLeave / onDrop` — `elementsFromPoint(clientX, clientY)` 로 가장 가까운 컨테이너 찾기, 아니면 root.id (D-10 fallback)
- `handleAddFromLibrary({type | fixtureId}, targetParentId?)` — leaf/container 분기 + fixture deep clone import
- `appendFixtureToTarget` 헬퍼 — `pasted-{n}.` prefix 로 id 충돌 회피, immutable tree 재귀 변환
- carousel/tabs/accordion/modal 단일 노드 추가는 tree-editor 가 미지원 → 패턴 카드 사용 안내 toast (warn)
- `DropTargetOutline` — drop hover 컨테이너에 accent 2px dashed border (DOM 측정 기반)
- 빈 캔버스 placeholder: `isDraggingOverCanvas && isContainerNode(tree.root) && children.length === 0` → "여기에 놓으세요" 중앙 노출

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Schema field mismatch — carousel.slides / accordion.entries**

- **Found during:** Task 1
- **Issue:** 플랜이 `carousel.slides[]` 와 `accordion.entries[]` (with `body`) 필드를 사용했으나 실제 `@dworks/tree` schema 는 `carousel.items[]` 와 `accordion.items[]` (with `title`/`content`) 사용. plan 그대로 작성하면 `treeSchema.parse()` 실패 → fixture 로드 안 됨.
- **Fix:** carousel 은 `items[]` + `{id, src, alt, caption}`, accordion 은 `items[]` + `{id, title, content, expanded?}` 로 수정.
- **Files modified:** `seeds/trees/products-carousel.json`, `seeds/trees/faq-accordion.json`
- **Commit:** `d98ac1f`

**2. [Rule 2 - Critical] tree-editor 미지원 노드 타입 안내**

- **Found during:** Task 3
- **Issue:** plan 은 `LEAF_TYPES.has(t)` / `CONTAINER_TYPES.has(t)` 분기를 가정했으나, 실제 tree-editor 의 `LeafNodeType` 은 `text|button|image` 3종, `ContainerNodeType` 은 `section|hero|card|list|form` 5종. carousel/tabs/accordion/modal 은 helper 가 없음 → 사용자가 Basic 카드 드래그 시 silent failure.
- **Fix:** 4 특수 타입 추가 시 한국어 안내 toast: "{label} 노드는 패턴 카드에서 추가하세요" (warn tone). drop 자체는 거부.
- **Commit:** `6971e88`

**3. [Rule 1 - Bug] tree.root.children TS access on union**

- **Found during:** Task 3
- **Issue:** `tree.root.children.length === 0` 직접 접근 시 TS strict 가 `TreeNode` union 의 leaf 분기를 거부.
- **Fix:** `isContainerNode(tree.root) && tree.root.children.length === 0` 가드 적용.
- **Commit:** `6971e88`

**4. [Rule 3 - Blocking] Pattern variant Icon 분기 형태 정합**

- **Found during:** Task 2
- **Issue:** 초기 구현은 `isBasic ? ... : ...` 삼항 분기 사용. plan acceptance criteria 가 `variant === 'pattern' && Icon` 명시 패턴을 요구 (체커 fix_hint).
- **Fix:** 두 개의 `{variant === '...' && Icon && (<Icon .../>)}` 분기로 분리. 동작은 동일.
- **Commit:** `c534a77`

### Architectural Decisions

- `componentPanelOpen` 상태는 page.tsx 의 다른 패널 토글들과 같은 위치 (HomePageInner top) 에 배치 — `panelsHidden` / `briefDrawerOpen` 과 동일한 패턴 유지.
- `DropTargetOutline` 은 별도 컴포넌트로 분리 (page.tsx 내부) — DOM 측정 로직 캡슐화. SpacingOverlay 와 같은 패턴.

## Verification

| Item | Status |
|------|--------|
| pnpm --filter web typecheck | PASS |
| 3 신규 JSON 파일 존재 + valid JSON | PASS |
| tree-fixtures.ts 의 treeFixtures 배열 길이 10 | PASS |
| component-library-panel.tsx ≥200 lines (276 actual) | PASS |
| component-library-panel.tsx 'use client' + export ComponentLibraryPanel | PASS |
| panel width: open ? 240 : 32 | PASS |
| application/x-dworks-node MIME (panel ≥2, page ≥2) | PASS |
| draggable + tabIndex={0} + Enter/Space activation | PASS |
| aria-label="컴포넌트 라이브러리" + "컴포넌트 패널 토글" | PASS |
| 카테고리 "기본" + "패턴" 노출 | PASS |
| 패턴 카드 size={32} thumbnail + variant === 'pattern' && Icon 분기 | PASS |
| page.tsx: import ComponentLibraryPanel + JSX mount | PASS |
| page.tsx: componentPanelOpen state + setter | PASS |
| page.tsx: elementsFromPoint container match | PASS |
| page.tsx: [ 단축키 (modifier 없음, isEditableTarget 가드 후) | PASS |
| page.tsx: "여기에 놓으세요" + isDraggingOverCanvas + root.children.length === 0 | PASS |
| page.tsx: drop fail toast "여기에는 추가할 수 없습니다" | PASS |
| page.tsx: drop outline 2px dashed accent | PASS |

## Self-Check: PASSED

**Files verified to exist:**
- /Users/johyeonchang/dworks/seeds/trees/pricing-tier.json ✓
- /Users/johyeonchang/dworks/seeds/trees/products-carousel.json ✓
- /Users/johyeonchang/dworks/seeds/trees/faq-accordion.json ✓
- /Users/johyeonchang/dworks/apps/web/src/app/component-library-panel.tsx ✓
- /Users/johyeonchang/dworks/apps/web/src/app/tree-fixtures.ts (modified) ✓
- /Users/johyeonchang/dworks/apps/web/src/app/page.tsx (modified) ✓

**Commits verified in git log:**
- d98ac1f feat(01-06): UX-04 신규 fixture 3종 추가 + D-11 thumbnail icon ✓
- c534a77 feat(01-06): ComponentLibraryPanel 240/32px 토글 + 12 basic + 10 pattern 카드 ✓
- 6971e88 feat(01-06): UX-04 page.tsx 패널 마운트 + drag drop + [ 토글 단축키 ✓

## Threat Flags

(없음 — 외부 입력 없음. dataTransfer payload 는 try/catch JSON.parse + payload.type / fixtureId 화이트리스트 검증 — T-01-08 mitigate 완료.)

## Known Stubs

(없음.)
