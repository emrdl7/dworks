---
phase: 01-ux-fix
plan: 05
subsystem: ui
tags: [react19, tailwind4, typescript-strict, tree-editor, conversion-matrix, context-menu, command-palette, inspector]

requires:
  - phase: 01-ux-fix/01
    provides: nodeTypeConversionMatrix, nodeTypeConversionDisabledReason, canConvertNodeType, nodeTypeLabels, nodeTypeIcons
  - phase: 01-ux-fix/01
    provides: ToastProvider, useToast, ToastHost
provides:
  - convertNodeType(tree, nodeId, nextType): ConversionResult utility (app-level)
  - CONVERSION_LOSS_MESSAGES (한국어 손실 toast 문구 4종)
  - handleConvertNodeType handler (page.tsx) — 3-route 공용
  - NodeContextMenu 동적 변환 서브메뉴 (호환 type 만 enable, 비호환 disabled + tooltip)
  - ⌘K 명령 팔레트 '노드 변환' group (12 type x 호환 매트릭스)
  - NodeTypeConvertDropdown (inspector-atoms) — 인스펙터 상단 type dropdown
  - HomePage → HomePageInner 분리 (ToastProvider 외부 wrap 패턴)
  - ContextMenuButton title prop 추가
affects: [01-ux-fix/06, 01-ux-fix/07, 차후 quick conversion 작업]

tech-stack:
  added: []
  patterns:
    - "3-route 통합: 컨텍스트 메뉴 + 인스펙터 dropdown + ⌘K — 동일 핸들러(handleConvertNodeType) 호출로 회귀 없는 동기화"
    - "ConversionResult { tree, changedNodeId, lossWarnings } — caller 가 result.tree === tree no-op 판정 + warn toast 호출"
    - "ToastProvider wrap 패턴: 컴포넌트 함수 body 에서 useToast() 호출 가능하도록 inner 함수 분리"

key-files:
  created:
    - apps/web/src/app/node-type-convert.ts
  modified:
    - apps/web/src/app/page.tsx
    - apps/web/src/app/inspector-atoms.tsx

key-decisions:
  - "schema 와 plan 의 필드 명 불일치 발견 (carousel.items[] vs slides[], accordion.items[] vs entries[], list.children[] vs items[]) → 실제 schema 기준으로 매핑, UI-SPEC 한국어 toast 문자열 4종은 plan 명세 그대로 유지"
  - "section/hero/card 변환은 schema 상 모두 children[] + layoutIntent 만 있어 단순 type 교체로 처리 (title/subtitle/image 필드 없음)"
  - "button → text 변환의 'onClick 손실' 메시지는 schema 의 button.href 가 있을 때만 표시 (button 노드에 onClick 필드 없음)"
  - "card → section 변환 시 card.image 손실 메시지는 children 안에 image 노드가 있을 때만 표시 (의미상 일치)"
  - "기존 NodeContextMenu 의 flat 'X로 변경' 항목 (텍스트/이미지/버튼/섹션/카드/목록) 완전 제거 → 동적 매트릭스 submenu 로 일원화 — CONTEXT.md D-06 매트릭스 외 변환 (text↔image, button↔image 등) 은 의도적으로 제거"

patterns-established:
  - "Conversion 3-route pattern: D-05 잠금 결정 그대로 — 동일 utility(convertNodeType) + 동일 handler(handleConvertNodeType) 로 컨텍스트 메뉴/인스펙터 dropdown/⌘K 모두 wiring → 변환 로직 1개 source-of-truth"
  - "Loss warning toast pattern: result.lossWarnings 배열을 forEach 로 warn toast — ToastProvider 가 500ms 내 중복 메시지 자동 dedupe"
  - "Conversion utility immutability: convertNodeType 함수 pure, input tree 비-mutation. replaceNode/findNode 헬퍼도 pure (immutable map)"

requirements-completed: [UX-03]

duration: 26min
completed: 2026-05-11
---

# Phase 01 Plan 05: UX-03 노드 타입 변환 (3-route) Summary

**12 호환 매트릭스 기반 노드 타입 변환 — 컨텍스트 메뉴 동적 서브메뉴 + 인스펙터 상단 dropdown + ⌘K 명령 팔레트 액션. 모두 단일 handleConvertNodeType 핸들러로 wiring.**

## Performance

- **Duration:** ~26 min
- **Started:** 2026-05-11T03:52:00Z
- **Completed:** 2026-05-11T04:18:13Z
- **Tasks:** 4
- **Files modified:** 3 (1 created + 2 modified)

## Accomplishments

- 12 호환 변환 쌍 (text↔button, section↔hero↔card 양방향, list↔accordion, image↔carousel) utility + UI 통합
- 3-route D-05 완성: 컨텍스트 메뉴 / 인스펙터 dropdown / ⌘K 명령 팔레트 모두 동일 handler 호출
- 변환 손실 자동 안내: UI-SPEC 한국어 toast 4종 (onClick / carousel slides / accordion body / card image) — ToastProvider 가 dedupe + auto-dismiss
- HomePage → HomePageInner 분리로 useToast() 컴포넌트 body 호출 가능 패턴 확립
- ContextMenuButton 컴포넌트에 title prop 추가 (비호환 항목 native browser tooltip)

## Task Commits

1. **Task 1: convertNodeType utility** — `f353bef` (feat)
2. **Task 2: handleConvertNodeType + NodeContextMenu 동적 서브메뉴** — `78ad59e` (feat)
3. **Task 3: ⌘K 명령 팔레트 변환 액션** — `5e51676` (feat)
4. **Task 4: NodeTypeConvertDropdown — 인스펙터 dropdown** — `1da9a41` (feat)

## Files Created/Modified

- `apps/web/src/app/node-type-convert.ts` (NEW, 348 lines) — convertNodeType + 12 호환 매핑 + CONVERSION_LOSS_MESSAGES + pure helpers (findNode, replaceNode, extractBaseProps)
- `apps/web/src/app/page.tsx` (MODIFIED) — HomePage/HomePageInner 분리, handleConvertNodeType 핸들러, NodeContextMenu 동적 서브메뉴, ⌘K commandItems 변환 액션, NodeInspector 헤더 dropdown wiring, ContextMenuButton title prop
- `apps/web/src/app/inspector-atoms.tsx` (MODIFIED) — NodeTypeConvertDropdown 컴포넌트 추가 (aria-haspopup + ESC/outside close + 호환 매트릭스 기반 enable/disable)

## Decisions Made

- **Schema 불일치 발견 시 schema 우선**: plan 의 예시 코드에 `carousel.slides[]`/`accordion.entries[]` 등 schema 와 다른 필드 명이 있어 schema 실제 정의 (`items[]`) 기준으로 매핑. UI-SPEC 의 한국어 toast 문자열 4종은 그대로 유지.
- **section/hero/card 의 title/subtitle/image 처리**: schema 상 이들 컨테이너 노드에는 children[] + layoutIntent 만 있어 자식 노드로 표현됨. 변환은 단순 type 교체 + children 보존.
- **card → section 의 cardImageLost 메시지**: card 노드 자체에 image 필드는 없지만 첫 자식이 image 노드일 때 의미적 손실로 안내 (false-positive 방지).
- **legacy flat 항목 완전 제거**: NodeContextMenu 기존 6항목 (텍스트/이미지/버튼/섹션/카드/목록으로 변경) 완전 제거 — D-06 매트릭스 외 변환 (text↔image 등) 은 의도적으로 제거.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] HomePage 함수 구조 분리 (ToastProvider wrap)**
- **Found during:** Task 2 (handleConvertNodeType 정의)
- **Issue:** 기존 `<ToastProvider>` 는 HomePage 컴포넌트 JSX 안에 위치 → 컴포넌트 함수 body 에서 `useToast()` 호출 불가 (Hook 이 Provider 보다 위에서 호출됨)
- **Fix:** `HomePage` 를 `<ToastProvider><HomePageInner/></ToastProvider>` 로 분리. 기존 함수 body 전체를 `HomePageInner` 로 이름 변경. 내부 JSX 의 `<ToastProvider>` wrap 제거.
- **Files modified:** apps/web/src/app/page.tsx
- **Verification:** tsc --noEmit 통과
- **Committed in:** 78ad59e (Task 2 commit)

**2. [Rule 1 - Bug] noUncheckedIndexedAccess: result.lossWarnings[0] 가 string | undefined**
- **Found during:** Task 2 typecheck
- **Issue:** TS strict mode (noUncheckedIndexedAccess) 로 `result.lossWarnings[0]` 가 `string | undefined`, showToast 첫 인자 `string` 과 불일치
- **Fix:** `const firstWarning = result.lossWarnings[0]; if (firstWarning) showToast(firstWarning, 'warn')` 패턴으로 narrow
- **Files modified:** apps/web/src/app/page.tsx
- **Verification:** tsc --noEmit 통과
- **Committed in:** 78ad59e (Task 2 commit)

**3. [Rule 1 - Bug] node-type-convert.ts: editKind 값 enum 위반**
- **Found during:** Task 1 typecheck
- **Issue:** accordion → list 변환 시 새 text 자식 노드의 `editKind: 'text-block'` 사용 — schema enum 은 `'text' | 'media' | 'structure' | 'style'`
- **Fix:** `editKind: 'text'` 로 변경
- **Files modified:** apps/web/src/app/node-type-convert.ts
- **Verification:** tsc --noEmit 통과
- **Committed in:** f353bef (Task 1 commit, fix 적용 후 단일 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** 모두 correctness/typecheck 필수. HomePage 구조 분리는 useToast 호출 가능 조건이라 architectural 같지만 단순 함수 분리 + JSX wrap 위치 이동으로 끝나는 minimal refactor (Rule 4 미해당). 회귀 없음.

## Issues Encountered

- Schema 와 plan 의 필드 명 불일치 (carousel/accordion/list 등) — schema 기준으로 매핑. plan 의 UI-SPEC 한국어 toast 문구는 보존.
- 기존 NodeContextMenu 의 flat 변환 항목 6종 제거 — D-06 매트릭스 외 변환(text↔image, button↔image 등)도 함께 제거됨. 사용자 워크플로우 영향 가능성 있으나 D-06 잠금 결정이므로 그대로 진행.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UX-03 완전 해결 — Phase 1 Success Criterion #3 ("text↔button, section↔hero↔card, list↔accordion, image↔carousel 변환 작동 + 비호환 변환 시 경고") 달성
- handleConvertNodeType 핸들러 + convertNodeType utility 가 향후 Plan 06/07 의 quick-add / multi-select 작업과 협업 가능 (호환 매트릭스 source-of-truth 가 node-meta 에 박혀있음)
- 잔여 Phase 1 작업: Plan 06 (UX-04 컴포넌트 라이브러리 패널), Plan 07 (UX-05 박스 선택 + 정렬/분포)

## Self-Check: PASSED

- node-type-convert.ts created (348 lines)
- convertNodeType used in page.tsx
- NodeTypeConvertDropdown exported from inspector-atoms.tsx
- '노드 변환' group present in page.tsx commandItems
- Commits f353bef, 78ad59e, 5e51676, 1da9a41 all present in git log
- tsc --noEmit clean (full apps/web typecheck)

---
*Phase: 01-ux-fix*
*Completed: 2026-05-11*
