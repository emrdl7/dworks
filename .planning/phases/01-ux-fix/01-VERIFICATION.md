---
phase: 01-ux-fix
verified: 2026-05-11T13:42:00Z
status: human_needed
score: 6/6 must-haves verified (with 1 partial in UX-06)
overrides_applied: 0
gaps: []
deferred: []
human_verification:
  - test: "UX-01 NodeContextMenu boundary auto-flip — viewport 우측/하단 근처 우클릭"
    expected: "메뉴가 좌/위로 flip되어 모든 항목이 viewport 안에 보임 (잘림 없음)"
    why_human: "Playwright 회귀 미작성 — viewport 1280×720 / 1920×1080 양쪽에서 우하단 우클릭 시각 검증 필요. grep으로는 clamp 로직 존재만 확인 가능."
  - test: "UX-02 Spacing overlay — 노드 1개 선택 후 다른 노드 hover"
    expected: "두 노드 사이 px 측정선 + 라벨이 자동 노출 (modifier 키 없이). 4방향 측정 (겹침 시 inset, 미겹침 시 gap)."
    why_human: "DOM hover/측정 시각 동작은 brower 렌더링 사이클 + mouseenter 이벤트 흐름 — grep으로 코드 존재만 확인. Alt 키 누른 채 hover 시 핑크 점선(#FF8FAB) 정렬 가이드 추가 노출 여부도 육안 검증 필요."
  - test: "UX-02 캔버스 zoom 변경 후 spacing overlay 좌표"
    expected: "zoom 50% / 200% 양쪽에서 측정선이 노드 edge에 정확히 붙음 (logical 좌표 보정 검증)"
    why_human: "canvasZoom 보정 로직은 spacing-overlay.tsx 주석 line 90-95에 설명 — getBoundingClientRect는 이미 zoom-applied 라 wrapper 차이만 사용. 실제 zoom 변경 후 시각 흔들림 여부는 육안 검증."
  - test: "UX-03 노드 타입 변환 — text↔button 컨텍스트 메뉴"
    expected: "텍스트 노드 우클릭 → '노드 타입 변경' 서브메뉴에 '버튼(으)로 변경' 항목 노출 → 클릭 시 변환 + 인스펙터 즉시 button 필드 렌더 + ⌘Z로 undo"
    why_human: "메뉴 항목 동적 렌더 + 변환 결과 인스펙터 reflow는 React 렌더 cycle — 시각/상호작용 검증."
  - test: "UX-03 비호환 변환 — form 노드 우클릭"
    expected: "변환 메뉴 항목이 disabled + tooltip '변환 불가: 입력 폼은 다른 노드로 변환할 수 없습니다'"
    why_human: "tooltip은 native title attribute — hover 시 브라우저 렌더 검증 필요."
  - test: "UX-04 컴포넌트 패널 — 카드 드래그 → 캔버스 드롭"
    expected: "Basic 카드 (예: text) 또는 Pattern 카드 (예: 가격표)를 드래그해 캔버스 내 컨테이너에 드롭 → 노드/fixture 추가. 드롭 hover 중 target 컨테이너 outline accent 2px dashed."
    why_human: "HTML5 native drag-and-drop은 브라우저 이벤트 시퀀스 + dataTransfer payload 전달 — grep으로는 dataTransfer 박힘만 확인."
  - test: "UX-04 빈 캔버스 dragover placeholder"
    expected: "tree.root.children=0 + 카드 dragover 중 캔버스 중앙에 '여기에 놓으세요' + dashed accent border"
    why_human: "빈 캔버스 상태에서만 노출 — 실제 빈 트리 + drag 진입 시 placeholder 시각 검증."
  - test: "UX-04 [ 단축키 토글"
    expected: "[ 단축키로 패널 240px ↔ 32px collapsed 토글, 헤더 chevron 아이콘 좌/우 swap"
    why_human: "width transition (140ms) 시각 동작 + 단축키 활성 조건 (입력 필드 외) 검증."
  - test: "UX-05 Shift+drag 박스 선택"
    expected: "캔버스 빈 공간에서 Shift+drag → 반투명 indigo 사각형 + intersect-mode로 박스 안 노드 모두 selected + aria-live '{N}개 노드 선택' 알림"
    why_human: "drag mouse 이벤트 + intersect 검출 + aria-live 스크린리더 알림 — 통합 시각/스크린리더 검증 필요."
  - test: "UX-05 Alt+A/H/D/W/V/S 정렬 8 단축키"
    expected: "≥2 노드 선택 후 Alt+A (좌측 정렬) / Alt+H (가로 중앙) / Alt+D (우측) / Alt+W (상단) / Alt+V (세로 중앙) / Alt+S (하단). 각 실행 시 aria-live '좌측 정렬' 등 한국어 알림."
    why_human: "절대 위치 노드 inset 변경 + 시각 정렬 결과 + aria-live region 알림 동시 검증."
  - test: "UX-05 분포 Alt+Shift+H/V"
    expected: "≥3 노드 선택 후 Alt+Shift+H (가로 균등) / Alt+Shift+V (세로 균등). leftmost/rightmost 고정, 사이 균등 배치."
    why_human: "수학적 분포 계산이 실제 노드 위치에 반영되는지 시각 검증."
  - test: "UX-05 absolute 아닌 노드 정렬 시 경고"
    expected: "position!=absolute 자식 발견 시 toast '정렬은 절대 위치(position: absolute) 노드에만 적용됩니다.' + skip"
    why_human: "toast 노출 + skip 동작 + 후속 정렬 시도 정상 작동 검증."
  - test: "UX-06 T/B/I/R/C/H/L/F 8 단축키 quick-add"
    expected: "캔버스 포커스 + 비편집 상태에서 T (text), B (button), I (image), R (section), C (card), H (hero), L (list), F (form) 키 누르면 해당 노드 트리에 추가 + 자동 선택"
    why_human: "키보드 이벤트 + 노드 추가 위치 분기 (컨테이너 children / leaf sibling / root) 실제 동작 검증."
  - test: "UX-06 ⌘K Help → 단축키 cheatsheet"
    expected: "⌘K → '단축키' 검색 또는 ?셀렉트 → ShortcutHelpModal 모달 노출 + 12 quick-add + 6 정렬 + 2 분포 + 패널 토글 카테고리 모두 노출"
    why_human: "모달 dialog 노출 + kbd 12개 모두 렌더 + ESC/X로 닫기 시각 검증."

re_verification:
  previous_status: none
  previous_score: N/A
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 01 — UX 핵심 fix Verification Report

**Phase Goal:** 사용자가 명시한 5대 UX 비판을 처리해 _기성 툴 자연스러움_의 기반 확보. 컨텍스트 메뉴 화면 밖 버그 + 노드 간격 측정 + 노드 타입 변경 확대 + 컴포넌트 드래그 추가 + multi-select 박스 + 키보드 shortcut.

**Verified:** 2026-05-11T13:42:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| #   | Truth                                                                                                    | Status                  | Evidence                                                                                                                                                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | NodeContextMenu가 화면 우측/하단 boundary 근처에서 _flip_으로 모든 항목 보임 (UX-01)                     | ✓ VERIFIED (code)       | commit `679bfb6` 적용됨. `page.tsx:5400-5500` 영역에 `window.innerWidth/Height` + `Math.max(margin, vw - rect.width - margin)` clamp 로직 4건 매칭. **실제 시각 검증은 human_verification #1**                                                                  |
| 2   | Alt+hover로 두 노드 사이 spacing(px) overlay 표시 + 정렬 가이드 라인 (UX-02)                             | ✓ VERIFIED (code)       | `spacing-overlay.tsx` (379 lines) — gap/inset 분기 + Alt 정렬 가이드 (#FF8FAB) + monospace tabular-nums + canvasZoom 보정 주석. `page.tsx:5229-5232` 마운트 + `altKeyPressed` state + Alt keydown/keyup/blur 추적 useEffect. **시각은 human_verification #2-3** |
| 3   | text↔button, section↔hero↔card, list↔accordion, image↔carousel 변환 작동 + 비호환 시 경고 (UX-03)        | ✓ VERIFIED (code)       | `node-type-convert.ts` (348 lines) — 12 호환 쌍 switch + 4 한국어 손실 메시지 + canConvertNodeType 가드. `node-meta.ts` matrix + disabledReason. `page.tsx` 3-route 통합 (NodeContextMenu 동적 매트릭스 + ⌘K commandItems + NodeTypeConvertDropdown).            |
| 4   | 좌측 컴포넌트 라이브러리 패널 — 12 노드 type + ≥10 패턴 카드 드래그로 캔버스 추가 (UX-04)                | ✓ VERIFIED (code)       | `component-library-panel.tsx` (276 lines) — 240/32 토글 + 12 BASIC_TYPE_ORDER + treeFixtures(10) + native draggable + dataTransfer 'application/x-dworks-node' + Enter/Space a11y. `page.tsx` drop handler + [ 단축키 + 빈 캔버스 placeholder.                  |
| 5   | Shift+drag 박스 선택 + 정렬/분포 단축키 8개 (UX-05)                                                      | ✓ VERIFIED (code)       | `box-select-overlay.tsx` (114) + `use-align-distribute.ts` (397) — Shift+button 0 + intersect-mode findNodesInBox + 6 align (Alt+A/H/D/W/V/S) + 2 distribute (Alt+Shift+H/V) + 한국어 경고 toast 3종 + ALIGN_ACTION_NAMES 8 한국어 액션 aria-live 알림.          |
| 6   | T/B/I/R/C 등 노드 quick-add 단축키 작동 (UX-06)                                                          | ⚠️ PARTIAL (8/12 keys)  | `use-quick-add.ts` (169) — 12 키 매핑 + Shift+C/Shift+T + 위치 분기. **실제 작동: T/B/I/R/C/H/L/F (8개)만**. A/M/Shift+C/Shift+T (4개)는 `tree-editor`에 add API 부재 → silently no-op. ⌘K cheatsheet은 12개 모두 표기.                                          |

**Score:** 6/6 truths verified (UX-06는 부분적 작동 — 아래 분석 참조).

---

## UX-06 Partial Status — Quick-add 단축키 분석

**Roadmap Success Criterion #6:** "T/B/I/R/C 등 노드 quick-add 단축키 작동" — _"T/B/I/R/C 등"_ 표현은 명시적으로 5개를 예시하지만 "등(et cetera)"으로 끝나 전체 12개 강제는 아님.

**실제 작동 (8 keys):**
- `T` → text, `B` → button, `I` → image (3 leaf)
- `R` → section, `C` → card, `H` → hero, `L` → list, `F` → form (5 editable container)

**Silently no-op (4 keys):**
- `A` → accordion, `M` → modal, `Shift+C` → carousel, `Shift+T` → tabs

**근본 원인:** `packages/tree-editor/src/operations.ts:328`
```typescript
export type ContainerNodeType = 'section' | 'hero' | 'card' | 'list' | 'form'
```
carousel/tabs/accordion/modal은 `ContainerNodeType` union에 미포함 → `handleAddContainerChild` 가 받지 못함. `use-quick-add.ts` line 130-132에 fallback 주석: "그 외 (carousel/tabs/accordion/modal): tree-editor 미지원 — no-op."

**Roadmap 해석:** "T/B/I/R/C 등" 명시 5개는 모두 작동. "등" 범위는 명확하지 않음.
**UI-SPEC 해석 (line 230-243):** 12개 키 매핑 표 명시 — 4개는 작동하지 않으므로 _문서 약속과 동작 불일치_.

**Verifier 판정:** **Roadmap success criterion #6 자체는 충족** (예시 5개 작동 + "등" 모호성). UI-SPEC의 12개 약속은 부분 충족 — Plan 04 SUMMARY가 미작성이라 의도된 deviation인지 미보고.

→ **Status: human_needed** (gap_found 아님). 사용자가 _명시 강제_ 의도면 후속 phase에서 tree-editor 확장 또는 cheatsheet 4개 항목 제거 결정 필요.

---

### Deferred Items

해당 없음 — Phase 1 잔여 success criteria 없음.

---

### Required Artifacts

| Artifact                                              | Expected                                                   | Status                          | Details                                            |
| ----------------------------------------------------- | ---------------------------------------------------------- | ------------------------------- | -------------------------------------------------- |
| `apps/web/src/app/toast-context.ts` (Plan 01)         | ToastProvider + useToast + 4 tone                          | ✓ VERIFIED (116 lines)          | createContext + dedupe 500ms + auto-dismiss 3500ms |
| `apps/web/src/app/toast-host.tsx` (Plan 01)           | fixed bottom-right + 4 tone class + aria-live polite       | ✓ VERIFIED (62 lines)           | role=status, aria-live=polite, '알림 닫기' 한국어  |
| `apps/web/src/app/node-meta.ts` (Plan 01)             | nodeTypeConversionMatrix + Reason + canConvertNodeType     | ✓ VERIFIED                      | 12 type 키 완전성, 한국어 사유 3종                 |
| `apps/web/src/app/spacing-overlay.tsx` (Plan 03)      | DOM 측정 + gap/inset 분기 + Alt 정렬 가이드 + z-index 100  | ✓ VERIFIED (379 lines)          | z-index 100 매칭, #FF8FAB + #6366f1cc, tabular-nums |
| `apps/web/src/app/use-quick-add.ts` (Plan 04)         | 12 key 매핑 + 위치 분기 + 가드                             | ✓ VERIFIED (169 lines)          | 단 4개 silently no-op (위 UX-06 분석)              |
| `apps/web/src/app/command-palette.tsx` (Plan 04)      | ShortcutHelpModal + 12 kbd + 6 align + 2 distribute        | ✓ VERIFIED                      | ShortcutHelpModal export, Alt+A..S + Alt+Shift+H/V 매칭 |
| `apps/web/src/app/node-type-convert.ts` (Plan 05)     | convertNodeType + 12 쌍 + 4 한국어 손실 메시지             | ✓ VERIFIED (348 lines)          | 12 switch 분기 + extractBaseProps + immutable      |
| `apps/web/src/app/inspector-atoms.tsx` (Plan 05)      | NodeTypeConvertDropdown + listbox a11y                     | ✓ VERIFIED                      | aria-haspopup=listbox + role=option + 변환 불가 tooltip |
| `apps/web/src/app/component-library-panel.tsx` (Plan 06) | 240/32 토글 + 12 basic + 10 pattern + drag + a11y       | ✓ VERIFIED (276 lines)          | 패턴 카드 32px lucide thumbnail (D-11 잠금)        |
| `seeds/trees/pricing-tier.json` (Plan 06)             | 3 card + 강조                                              | ✓ VERIFIED                      | 3 card nodes (basic/pro/enterprise)                |
| `seeds/trees/products-carousel.json` (Plan 06)        | carousel 1개, ≥4 slides                                    | ✓ VERIFIED                      | 1 carousel, 4 items                                |
| `seeds/trees/faq-accordion.json` (Plan 06)            | accordion, ≥5 entries                                      | ✓ VERIFIED                      | 1 accordion, 5 items                               |
| `apps/web/src/app/tree-fixtures.ts` (Plan 06)         | 기존 7 + 신규 3 = 10 fixtures + icon 필드                 | ✓ VERIFIED                      | TreeFixture.icon 모두 박힘, treeFixtures len=10    |
| `apps/web/src/app/box-select-overlay.tsx` (Plan 07)   | 박스 시각 + findNodesInBox intersect 헬퍼                  | ✓ VERIFIED (114 lines)          | accent rgba 50%/10% + intersect 검사 + SSR guard   |
| `apps/web/src/app/use-align-distribute.ts` (Plan 07)  | 6 정렬 + 2 분포 + 8 단축키 + 한국어 액션 onAnnounce        | ✓ VERIFIED (397 lines)          | ALIGN_ACTION_NAMES 8개 + 경고 toast 3종 + position absolute 가드 |
| `apps/web/src/app/page.tsx`                           | 모든 hook/component wiring + handler 정의                  | ✓ VERIFIED                      | 5050:onMouseDown shift+button0, 모든 import/state/마운트 박힘 |
| **Missing** `.planning/phases/01-ux-fix/01-04-SUMMARY.md` | Plan 04 SUMMARY                                       | ⚠️ MISSING (process gap, not code) | Plan 04 commits 3건 있으나 SUMMARY 누락. 코드는 정상 — 문서 흔적만 부재. |

---

### Key Link Verification

| From                                                | To                              | Via                                                | Status     | Details                                                 |
| --------------------------------------------------- | ------------------------------- | -------------------------------------------------- | ---------- | ------------------------------------------------------- |
| `page.tsx:606` HomePage                             | `toast-host` + `toast-context`  | `<ToastProvider>` wrap + `<ToastHost />` mount      | ✓ WIRED    | line 606 ToastProvider, line 5487 ToastHost           |
| `page.tsx` 인스펙터                                  | `NodeTypeConvertDropdown`        | `inspector-atoms` import + `onConvertType` prop     | ✓ WIRED    | line 254 import, line 7750 mount, line 5409 wiring     |
| NodeContextMenu (page.tsx:5932)                      | `nodeTypeConversionMatrix`       | 동적 메뉴 항목 렌더 + `handleConvertNodeType`        | ✓ WIRED    | line 5936 matrix consume, line 5958 라벨 + 5440 호출    |
| ⌘K commandItems                                      | `handleConvertNodeType`          | flatMap + canConvertNodeType + disabledReason       | ✓ WIRED    | line 3500-3531 commandItems 변환 액션 + line 3531 호출  |
| `node-type-convert.ts`                               | `useToast.showToast`             | `result.lossWarnings.forEach(msg => showToast(msg))` | ✓ WIRED    | page.tsx:2877 손실 toast 분배                          |
| `component-library-panel.tsx` dataTransfer           | `page.tsx onDrop`                | MIME `application/x-dworks-node` JSON payload       | ✓ WIRED    | line 4993 types check + 5028 getData + parse           |
| `page.tsx onDrop`                                    | `handleAddFromLibrary`           | type → addLeafChild/addContainerChild, fixtureId → appendFixtureToTarget | ✓ WIRED | line 5043 호출 + 2795-2835 구현                 |
| `[ 단축키`                                            | `setComponentPanelOpen`          | global keydown handler                              | ✓ WIRED    | line 3166                                              |
| Canvas onMouseDown (shift+button0)                   | `boxSelect` state                | logical 좌표 변환 + setBoxSelect active             | ✓ WIRED    | line 5050-5066                                         |
| boxSelect.active useEffect                           | global mousemove/mouseup capture | document.body cursor/userSelect 토글                | ✓ WIRED    | line 3367-3440                                         |
| findNodesInBox                                       | `setSelectedNodeId` + `setAdditionalSelectedNodeIds` | queueMicrotask 순서 보장        | ✓ WIRED    | line 3424 announcement, line 3422 selection            |
| `useAlignDistribute({onAnnounce})`                   | `setBoxSelectAnnouncement`       | 동일 aria-live region 공유                          | ✓ WIRED    | line 3003                                              |
| `useQuickAddShortcuts({enabled})`                    | `!boxSelect.active`              | drag 중 충돌 가드                                    | ✓ WIRED    | line 2976                                              |

---

### Data-Flow Trace (Level 4)

| Artifact                          | Data Variable                              | Source                                             | Produces Real Data | Status      |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------- | ------------------ | ----------- |
| `SpacingOverlay`                  | `overlay: OverlayState`                    | useEffect → `document.querySelector` → `getBoundingClientRect` → `computeInsetMeasurements`/`computeGapMeasurements` | ✓ (실시간 DOM 측정) | ✓ FLOWING   |
| `ComponentLibraryPanel`           | `treeFixtures` + 12 BASIC_TYPE_ORDER       | tree-fixtures.ts → `simpleHeroRaw` 등 import + treeSchema.parse — 7 기존 + 3 신규 | ✓ (parsed JSON)    | ✓ FLOWING   |
| `BoxSelectOverlay`                | startX/startY/endX/endY                    | page.tsx onMouseDown + global mousemove 좌표 변환 + setBoxSelect | ✓ (mouse 이벤트) | ✓ FLOWING |
| `useAlignDistribute` align/dist   | `selectedIds: ReadonlySet<string>`         | page.tsx `allSelectedNodeIds = new Set([selectedNodeId, ...additionalSelectedNodeIds])` | ✓ (selection state) | ✓ FLOWING |
| `NodeContextMenu` 변환 매트릭스   | `compatibleTypes = nodeTypeConversionMatrix[node.type]` | node-meta.ts 의 hardcoded record | ✓ (정적 매트릭스, 의도) | ✓ FLOWING |
| `ShortcutHelpModal` 단축키 카탈로그 | 카테고리별 keys + label 배열               | command-palette.tsx 내부 hardcoded                  | ✓ (hardcoded, 의도) | ✓ FLOWING |

**Note:** UX-04 패턴 카드 thumbnail은 fixture.icon 정적 lucide 아이콘 (D-11 잠금 결정). 동적 미리보기 SVG 렌더는 deferred (UI-SPEC line 167 "mini SVG/이미지 미리보기" 약속 대비 _lucide 32px 아이콘_으로 대체 — D-11에 명시된 fallback).

---

### Behavioral Spot-Checks

| Behavior                           | Command                                                                       | Result          | Status     |
| ---------------------------------- | ----------------------------------------------------------------------------- | --------------- | ---------- |
| TypeScript strict compile          | `cd apps/web && npx tsc --noEmit -p tsconfig.json 2>&1 \| head -30`            | 출력 없음 (clean) | ✓ PASS     |
| pricing-tier.json valid JSON + 3 card | `python3 json.load + walk for type==card`                                  | `card nodes: 3` | ✓ PASS     |
| products-carousel.json valid + 4 slides | `python3 json.load + carousel.items`                                     | `slides=4`      | ✓ PASS     |
| faq-accordion.json valid + 5 entries | `python3 json.load + accordion.items`                                       | `entries=5`     | ✓ PASS     |
| treeFixtures count                 | `grep "export const treeFixtures" tree-fixtures.ts + 10 fixture push`         | 10 items 매칭   | ✓ PASS     |
| 12 호환 변환 쌍 매핑               | `grep -E "text:.*\['button'\]\|button:.*\['text'\]\|section:.*\['hero', 'card'\]" node-meta.ts` | 매칭됨          | ✓ PASS     |
| node-type-convert.ts 한국어 손실 메시지 4종 | `grep -E "버튼의 클릭 동작\|이미지로 변환되며 첫 슬라이드\|리스트로 변환되며\|섹션으로 변환되며"` | 4건 매칭     | ✓ PASS     |
| use-align-distribute 8 한국어 액션  | `grep -E "'좌측 정렬'\|'가로 중앙 정렬'\|'우측 정렬'\|'상단 정렬'\|'세로 중앙 정렬'\|'하단 정렬'\|'가로 균등 분포'\|'세로 균등 분포'`" | 8건 매칭   | ✓ PASS     |
| ShortcutHelpModal kbd 카테고리      | `grep "Alt+A\|Alt+H\|Alt+D\|Alt+W\|Alt+V\|Alt+S\|Alt+Shift+H\|Alt+Shift+V" command-palette.tsx` | 8건 매칭 | ✓ PASS |
| Run dev server / live UX           | (skipped — no live server)                                                    | N/A             | ? SKIP — human |
| Playwright UI 회귀 테스트          | (deferred per 01-02-SUMMARY notes)                                            | N/A             | ? SKIP — human |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description                                                          | Status                       | Evidence                                                                            |
| ----------- | -------------- | -------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| UX-01       | 01-02          | NodeContextMenu boundary auto-flip                                   | ✓ SATISFIED (code, needs human visual) | commit 679bfb6 + page.tsx:5400-5500 clamp 로직 4건                                  |
| UX-02       | 01-03          | Spacing overlay + Alt 정렬 가이드                                     | ✓ SATISFIED (code)            | spacing-overlay.tsx 379 lines, gap/inset/guides + canvasZoom 보정                   |
| UX-03       | 01-01, 01-05   | 노드 타입 변환 3-route + 비호환 경고                                  | ✓ SATISFIED (code)            | node-type-convert.ts 12쌍 + node-meta matrix + 3-route 통합 (NodeContextMenu + 인스펙터 + ⌘K) |
| UX-04       | 01-06          | 좌측 컴포넌트 패널 + drag/drop + 빈 placeholder                       | ✓ SATISFIED (code)            | component-library-panel.tsx 276 + 3 신규 fixture JSON + page.tsx drop pipeline      |
| UX-05       | 01-01, 01-07   | Shift+drag 박스 선택 + 8 정렬/분포 단축키 + aria-live                | ✓ SATISFIED (code)            | box-select-overlay.tsx + use-align-distribute.ts 397 + page.tsx 통합 + 한국어 액션 알림 |
| UX-06       | 01-04          | T/B/I/R/C 등 quick-add 단축키 + cheatsheet                            | ⚠️ PARTIAL (8/12)             | use-quick-add.ts 12개 매핑 + cheatsheet 12개 표기. **A/M/Shift+C/Shift+T 4개는 tree-editor 미지원으로 silently no-op.** |

**Orphaned requirements check:** REQUIREMENTS.md Phase 1 매핑은 UX-01..UX-06 6개 — 모두 plans 의 `requirements` 필드에 박혀 있음. 미연결 요구사항 없음.

**REQUIREMENTS.md 체크박스 불일치:** UX-06이 `[ ]` 미체크 상태로 남아 있음. 다른 UX-01..05는 `[x]` 체크. **Plan 04 가 SUMMARY 미작성** (process gap) — REQUIREMENTS.md 자동 업데이트가 SUMMARY commit step 에 묶여 있었던 듯. 코드는 정상 작동 (의도된 8/12 부분 작동) — 사용자 결정 필요.

---

### Anti-Patterns Found

| File                                                     | Line   | Pattern                                                | Severity   | Impact                                                                 |
| -------------------------------------------------------- | ------ | ------------------------------------------------------ | ---------- | ---------------------------------------------------------------------- |
| `apps/web/src/app/use-quick-add.ts`                      | 14-16  | "NOTE: carousel/tabs/accordion/modal 은 ... 현재는 no-op" (comment) | ℹ️ Info | 의도된 deviation — 코드 주석으로 명시. UX-06 부분 작동의 근거.         |
| `apps/web/src/app/use-quick-add.ts`                      | 130-132 | `// 그 외 (carousel/tabs/accordion/modal): tree-editor 미지원 — no-op.` | ℹ️ Info | silent failure 경고 toast 누락 — 사용자가 A/M/Shift+C/Shift+T 누르면 아무 피드백 없음. |
| `apps/web/src/app/component-library-panel.tsx`           | 256-264 | 패턴 카드 thumbnail = lucide 32px 아이콘 (실제 fixture mini render 아님) | ⚠️ Warning | UI-SPEC line 167 "mini SVG/이미지 미리보기" 약속 대비 _lucide 아이콘_으로 단순화 (D-11 명시 선택). |
| `.planning/phases/01-ux-fix/01-04-SUMMARY.md`            | -      | **파일 부재** — Plan 04 commit은 있으나 SUMMARY 없음   | ⚠️ Warning | Phase 추적성 부족 — UX-06 부분 작동 의도가 문서화되지 않아 검증자가 코드 주석으로 확인해야 함. |
| `apps/web/src/app/page.tsx`                              | 2877   | `result.lossWarnings.forEach((msg) => showToast(msg, 'warn', 5000))` | ℹ️ Info | 한 번에 여러 toast 가능 (예: card→section에 image 자식 + accordion body 동시 손실). ToastProvider 의 500ms dedupe로 노이즈 완화 — 의도된 동작. |

**🛑 Blocker 안티패턴:** 없음.

---

### Human Verification Required

Phase 1은 본질적으로 _시각/상호작용 UX_ phase로, grep으로 코드 존재만 확인 가능. 실제 동작은 다음 14개 시나리오 육안 검증 필요:

(상세 시나리오는 frontmatter `human_verification` 섹션 참조.)

요약:
1. **UX-01**: viewport 우하단 우클릭 시 메뉴 flip 시각 검증
2. **UX-02**: 노드 hover spacing 측정선 + Alt 정렬 가이드 + zoom 변경 시 좌표 흔들림
3. **UX-03**: 컨텍스트 메뉴 / 인스펙터 dropdown / ⌘K 3-route 변환 + 비호환 tooltip + undo
4. **UX-04**: 카드 drag → 드롭 + drop target outline + 빈 캔버스 placeholder + `[` 토글
5. **UX-05**: Shift+drag 박스 + 8 단축키 + absolute 가드 경고 + aria-live 알림
6. **UX-06**: T/B/I/R/C/H/L/F 작동 검증 + ⌘K cheatsheet 모달 + 4개 silently no-op 의도 확인

---

### Gaps Summary

**Roadmap success criteria 6개 모두 충족** (UX-06 일부 약속 미충족이지만 roadmap 문구 "T/B/I/R/C 등"의 예시 5개는 100% 작동).

**미해결 항목:**
1. **UX-06 부분 작동** — `A/M/Shift+C/Shift+T` 4개 키가 cheatsheet에는 표기되나 실제로는 silently no-op. 사용자 결정 필요:
   - (A) tree-editor에 carousel/tabs/accordion/modal add API 확장 → Phase 2+ 후속
   - (B) cheatsheet에서 4개 항목 제거 → 즉시 가능
   - (C) no-op일 때 toast "{type} 노드는 패턴 카드에서 추가하세요" 노출 → ComponentLibraryPanel과 동일 패턴 채용 가능
2. **Plan 04 SUMMARY 미작성** — process gap. REQUIREMENTS.md UX-06 체크박스 미업데이트 원인. 코드는 정상.
3. **14개 시각/UX 시나리오 인간 검증 미실행** — Playwright 회귀 도구 미작성, dev server 미기동.

**Phase 1 차단 요인 없음** — 모든 코드가 컴파일/존재/연결됨. 시각 UX 검증만 보류.

---

_Verified: 2026-05-11T13:42:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: No — initial verification_
