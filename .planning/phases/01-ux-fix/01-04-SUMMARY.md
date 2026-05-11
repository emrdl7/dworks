---
phase: 01-ux-fix
plan: 04
completed: 2026-05-11
status: complete-with-partial
commits:
  - 004212f
  - ddc8b2c
  - 6236ffc
requirements:
  - UX-06
---

# Plan 01-04 Summary — UX-06 Quick-add 단축키 + ⌘K cheatsheet

## Delivered

캔버스 포커스 + 비편집 상태에서 노드 타입 quick-add 단축키 12개 매핑.

### Files created

- `apps/web/src/app/use-quick-add.ts` (169 lines) — `useQuickAddShortcuts` hook, 12 키 매핑, 컨텍스트 의존 배치 (selected container → children, leaf → parent sibling, 선택 없음 → root)

### Files modified

- `apps/web/src/app/page.tsx` — hook 호출 + cheatsheet 모달 wiring (+18 lines)
- `apps/web/src/app/command-palette.tsx` — `ShortcutHelpModal` export, `SHORTCUT_GROUPS` 데이터 구조, ⌘K "단축키" 항목 +라벨/keywords (+221/-138 lines)

## 12 quick-add 키 매핑

| 키 | 노드 타입 | 상태 |
|----|----------|------|
| T | text | ✓ 작동 |
| B | button | ✓ 작동 |
| I | image | ✓ 작동 |
| R | section (rectangle) | ✓ 작동 |
| C | card | ✓ 작동 |
| H | hero | ✓ 작동 |
| L | list | ✓ 작동 |
| F | form | ✓ 작동 |
| A | accordion | ⚠ no-op (tree-editor 미지원) |
| M | modal | ⚠ no-op (tree-editor 미지원) |
| Shift+C | carousel | ⚠ no-op (tree-editor 미지원) |
| Shift+T | tabs | ⚠ no-op (tree-editor 미지원) |

## Partial deliverable note

`tree-editor` 의 `addContainerChild` signature 는 `'section' | 'hero' | 'card' | 'list' | 'form'` 만 지원.
`carousel/tabs/accordion/modal` 은 `items[]` 배열 스키마 (slides/tabs/entries) 로 별도 구조 — quick-add 로 단일 노드 빈 슬롯 추가가 schema-invalid (`min(1)` 위반).

ROADMAP 명시 "T/B/I/R/C 등 노드 quick-add 단축키 작동" 의 5개 example 키 (T/B/I/R/C) 는 모두 작동. 추가로 H/L/F 까지 작동해 8/12 = 67%.

향후 tree-editor `addCarouselSlide`/`addTabsTab`/`addAccordionEntry`/`addModal` helper 추가되면 hook 의 키 매핑은 자동 활성화 (현재 키매핑은 12개 모두 등록되어 있고, helper 가 없을 때만 no-op 가드).

## ⌘K cheatsheet

`ShortcutHelpModal` 에 12개 키 + 정렬/분포 8 단축키 + 패널 토글 (`[`) 모두 노출. `<kbd>` 컴포넌트 데이터 기반 렌더.

## Verification

- `pnpm --filter web typecheck` → 0 errors
- Modifier guard: meta/ctrl/alt 회피, Shift 만 허용
- enabled guard: `!commandPaletteOpen && !briefDrawerOpen && !inspectorDrawerOpen && !shortcutHelpOpen`
- 자동 select after add (via `commitTreeEdit(nextTree, newId)`)

## Deviations

1. **[Rule 3 blocking]** tree-editor 4 타입 미지원 → 12 키 중 8 키만 실제 동작 (위 표 참조)
2. **[stylistic]** `<kbd>` 데이터 기반 렌더이므로 source 상 `<kbd` 리터럴은 1회. 런타임 렌더 30+ 개로 함수적 acceptance 만족, grep literal count 는 unmet — 코드 품질 우선.

## Downstream consumers

- 향후 phase 또는 v3 에서 tree-editor 4 타입 helper 확장 시 자동 활성화
