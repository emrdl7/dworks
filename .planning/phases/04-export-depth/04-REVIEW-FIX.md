---
phase: 04-export-depth
fixed_at: 2026-05-11T00:00:00Z
review_path: .planning/phases/04-export-depth/04-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-05-11
**Source review:** `.planning/phases/04-export-depth/04-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 6
- Fixed: 6
- Skipped: 0

**Verification:**
- `pnpm --filter @dworks/tree-renderer test` → 23/23 pass
- `pnpm --filter @dworks/exporters test` → 9/9 pass
- `pnpm --filter @dworks/web typecheck` → clean

Info-level findings(IN-01~04)는 본 사이클 scope 외 — skip.

## Fixed Issues

### CR-01 + WR-01: tabs trigger id 부착 + node.id prefix 로 globally-unique 보장

**Files modified:** `packages/tree-renderer/src/render.ts`, `packages/tree-renderer/src/render.test.ts`
**Commit:** c7f3d54
**Applied fix:** `renderTabs` trigger 버튼에 `id="${node.id}-tab-${it.id}"` 부착(CR-01) + panel/trigger id 양쪽에 tabs `node.id` prefix(WR-01)로 한 문서 내 다중 tabs 인스턴스의 item id 충돌 방지. `aria-controls` / `aria-labelledby` 도 동일 prefix 사용. 테스트는 `panel-a` → `tabs1-panel-a` 패턴으로 갱신하고 trigger id ↔ panel aria-labelledby 매칭 검증 추가.

### CR-02: dialog 에 `dw-modal` class 부착 + commonAttrs extraClasses 통합

**Files modified:** `packages/tree-renderer/src/render.ts`
**Commit:** b23245f
**Applied fix:** `commonAttrs(node, extraClasses?: string[])` 시그니처 확장 — styleTokens 기반 `t-*` class 와 컴포넌트 dw-* class 를 단일 `class` attr 로 병합(HTML class 중복 출력 방지). `renderModal` 의 `<dialog>` 에 `extraClasses: ['dw-modal']` 적용 → BASE_CSS 의 `.dw-modal{...}` / `.dw-modal[open]{animation:dwModalIn ...}` / `.dw-modal::backdrop{...}` 정상 적용. 동일 패턴 일관화로 accordion(`dw-accordion`) / tabs(`dw-tabs`) / carousel(`dw-carousel`) 도 모두 extraClasses 경유로 변경.

### WR-02: modal backdrop click 판정을 `e.target === dialog` 로 단순화

**Files modified:** `packages/exporters/src/html-scripts.ts`
**Commit:** f939de8
**Applied fix:** `MODAL_SCRIPT` 의 backdrop click 핸들러에서 `getBoundingClientRect` 좌표 비교를 제거하고 `e.target === dialog` 단일 검사로 교체. CR-02 이후 활성화된 `dwModalIn` scale 애니메이션 중 rect 축소로 인한 false-positive close 와 dialog 내부 텍스트 selection drag-release 시 의도치 않은 close 가 해소됨. `<dialog>::backdrop` 클릭 시 `event.target` 이 dialog 자기 자신으로 잡히는 표준 동작 활용.

### WR-03: Embla·Pretendard CDN 에 SRI integrity + crossorigin="anonymous" 부착

**Files modified:** `packages/exporters/src/html.ts`
**Commit:** 8cd8adc
**Applied fix:** unpkg/jsdelivr CDN 응답을 사전 다운로드해 sha384 해시 계산:
- Embla 8.5.0 umd.js → `sha384-6PCKgOOLMemlf3VQZ8sQdAgDTKST7gNpHvrRqzGePqboeTtee919uJKZaj3hrY7z`
- Pretendard v1.3.9 variable min.css → `sha384-f9iEnfDmuRSuBrXQjpPibejnfJMrZ2yI+715EjxlzBsPFIpaD1NxMh1MIzthxtCh`

`<link>` / `<script>` 태그에 `integrity="..."` + `crossorigin="anonymous"` 박음 — CDN 변조 시 브라우저가 리소스를 거부하므로 공급망 위협 방어. 버전 업 시 해시 동시 갱신 필요한 점을 코드 주석으로 명시.

### WR-04: entrance 스크립트의 `applyInitial` 이중 역할 제거 — 의미 일관성 확보

**Files modified:** `packages/exporters/src/html-scripts.ts`
**Commit:** 60e2343
**Applied fix:** `ENTRANCE_ANIMATION_SCRIPT` 의 `applyInitial` 본체에서 `prefersReduced` 분기를 제거. `prefersReduced` 사용자는 호출부(전체 nodes 처리 진입)에서 `applyFinal` 을 직접 호출해 최종 상태로 즉시 표시. `applyInitial` 은 이름 그대로 _initial 상태_ 만, `applyFinal` 은 _final 상태_ 만 책임지도록 분리 — 향후 다른 호출부 추가 시 prefersReduced 가드 누락 회귀 위험 제거.

## Skipped Issues

없음 — 모든 Critical + Warning 항목 적용 완료. Info(IN-01 Home/End 키, IN-02 `void lang`, IN-03 hyphen 트리밍, IN-04 IE11 명시) 4건은 `--auto` scope 외로 분류되어 본 사이클에서 처리하지 않음.

---

_Fixed: 2026-05-11_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
