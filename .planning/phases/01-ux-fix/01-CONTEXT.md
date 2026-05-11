# Phase 1: UX 핵심 fix + 측정 도구 - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** Auto (--auto, autonomous milestone)

<domain>
## Phase Boundary

사용자가 v1 말 명시한 5대 UX 비판을 처리해 _기성 디자인툴 자연스러움_의 기반 확보. UX-01(컨텍스트 메뉴 boundary auto-flip)은 commit `679bfb6`에서 완료됨. 남은 5건:

- **UX-02** Alt+hover 두 노드 사이 spacing(px) overlay + 정렬 가이드
- **UX-03** 노드 타입 변환 확대 (text↔button, section↔hero↔card, list↔accordion, image↔carousel)
- **UX-04** 좌측 컴포넌트 라이브러리 패널 (12 노드 type + ≥10 패턴 카드 드래그)
- **UX-05** Shift+drag 박스 선택 + 정렬/분포 단축키
- **UX-06** T/B/I/R/C 등 노드 quick-add 단축키

**제외 (다른 phase)**: AI 생성 품질(Phase 2), grid/zoom/minimap(Phase 3), export(Phase 4), theme(Phase 5).

</domain>

<decisions>
## Implementation Decisions

### UX-02 — Spacing 측정 overlay

- **D-01**: 트리거는 _기본 동작_ — 노드 선택 상태에서 다른 노드에 hover 시 자동 spacing 표시. modifier 키 불필요 (Figma 동등). Alt 토글은 추가로 _정렬 가이드 라인_까지 강제 표시.
- **D-02**: 렌더는 _캔버스 위 absolute-positioned overlay_ DOM 레이어 (SVG 아닌 div + border). px 숫자는 작은 라벨 박스. 캔버스의 zoom 적용 후 좌표 계산.
- **D-03**: 측정 방향: hover 노드와 선택 노드가 _겹치지 않으면_ 수평/수직 gap 양쪽 표시. 겹치면 inset 4방향 표시. 정렬되는 edge가 있으면 점선 가이드 라인 추가.
- **D-04**: 단위는 _px만_ (rem/em 추후). 소수점 둘째 자리에서 반올림.

### UX-03 — 노드 타입 변환

- **D-05**: 변환 진입은 _컨텍스트 메뉴_ 서브메뉴 "노드 타입 변경 →" + _인스펙터 상단 type dropdown_ 양쪽. 명령 팔레트(⌘K)에도 "Convert to: [type]" 액션 추가.
- **D-06**: 호환 매트릭스:
  - **text ↔ button** (props 매핑: text.content → button.label)
  - **section ↔ hero ↔ card** (children + spacing 유지)
  - **list ↔ accordion** (items → accordion entries)
  - **image ↔ carousel** (image → carousel.slides[0])
  - 비호환 (예: form → image) 시 _경고 toast + 메뉴 항목 비활성_.
- **D-07**: 변환 후 _프로퍼티 손실 발생 시 toast_ 로 표시 (예: button → text 변환 시 onClick 사라짐 안내).

### UX-04 — 컴포넌트 라이브러리 패널

- **D-08**: 좌측 _접이식 패널_ (기본 펼침). 위치는 캔버스 좌측, 폭 240px. 토글 단축키 `[` (대괄호).
- **D-09**: 카테고리 분할:
  - **Basic** — 12 노드 타입 (text/button/image/section/hero/card/list/form/carousel/tabs/accordion/modal)
  - **Patterns** — ≥10 사전 정의 fixture 조각 (CTA 카드 / 3-column features / pricing tier / hero with image / signup form 등)
- **D-10**: 드래그는 HTML5 native drag-and-drop. 드롭 위치: 캔버스 위라면 _드롭한 위치의 가장 가까운 컨테이너 노드 안에_ 추가. 컨테이너 아니면 root에 append.
- **D-11**: 카드는 _작은 미리보기 SVG/이미지_ + 노드 타입 라벨. Patterns은 fixture 트리 일부를 mini 렌더.

### UX-05 — 박스 선택 + 정렬/분포

- **D-12**: 박스 선택 트리거: 캔버스 빈 공간에서 _Shift+drag_ (Cmd+drag은 OS 시스템 동작과 충돌 회피). 박스 안에 일부라도 들어간 노드 모두 selected.
- **D-13**: 박스 시각화: 반투명 파란 사각형 (border-blue-400/50, bg-blue-400/10).
- **D-14**: 정렬 단축키 (≥2 선택 시):
  - **좌/중/우** — `Alt+A` / `Alt+H` / `Alt+D` (Figma는 Cmd+Alt+L/H/R인데 충돌 회피)
  - **상/중/하** — `Alt+W` / `Alt+V` / `Alt+S`
- **D-15**: 분포 단축키 (≥3 선택 시):
  - **가로 균등** — `Alt+Shift+H`
  - **세로 균등** — `Alt+Shift+V`
- **D-16**: 정렬/분포는 selected 노드의 _공통 부모 안에서_ inset/position 값을 조정. 자식 노드의 layout이 absolute가 아니면 _경고 toast_ 후 동작 skip.

### UX-06 — Quick-add 단축키

- **D-17**: 단축키 (캔버스 포커스 + 텍스트 입력 외 모달/팔레트 안 닫혀있을 때만):
  - **T** = text / **B** = button / **I** = image / **R** = section (rectangle 연상) / **C** = card / **H** = hero / **L** = list / **F** = form / **A** = accordion / **M** = modal
  - carousel은 _Shift+C_ (C가 card와 충돌)
  - tabs는 _Shift+T_ (T가 text와 충돌)
- **D-18**: 추가 위치: 현재 _선택된 노드가 컨테이너이면 그 children에_ append. 컨테이너 아니면 _selected 노드의 부모에_ sibling으로 추가. 선택 없으면 root에 append.
- **D-19**: 단축키 cheatsheet는 ⌘K 명령 팔레트의 "Help / 단축키" 항목에서 확인.

### Claude's Discretion

- 정렬 가이드 라인 색상/굵기 (D-03 보강): Claude 기본 — Figma 파스텔 핑크 (#FF8FAB) 점선.
- 박스 선택 박스 z-index / pointer-events 처리 (D-13).
- 컴포넌트 패널 카드 hover 미리보기 확대 여부 (D-11).
- 단축키 충돌 감지/사용자 경고 — Claude 판단.
- 변환 시 매핑 손실 toast 문구 — Claude 자율.

### Folded Todos

(없음 — 별도 todo 없음)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level
- `.planning/PROJECT.md` — v2.0 vision, validated v1 산출물, UX-01..UX-06 정의
- `.planning/REQUIREMENTS.md` — 19 requirements 정의
- `.planning/ROADMAP.md` §Phase 1 — UX 핵심 fix Success Criteria
- `PLAN.md` (루트) — v1 라운드 1~5 합의 (참고용)
- `docs/HANDOVER-2026-05-11-late.md` — v1 마지막 사이클 상태
- `docs/DECISIONS.md` — v1 디자인 결정 로그

### Code anchors
- `apps/web/src/app/page.tsx` — 메인 canvas (≈14000 lines). NodeContextMenu line 5356, global keydown line 2862, Shift/Cmd 추가 선택 line 587
- `apps/web/src/app/selectable-node.tsx` — 노드 단위 렌더/선택 wrapper
- `apps/web/src/app/command-palette.tsx` — ⌘K 명령 팔레트 (단축키 등록 패턴)
- `apps/web/src/app/canvas-contexts.ts` — 캔버스 좌표/zoom state
- `apps/web/src/app/node-meta.ts` — 12 노드 타입 메타데이터 (변환 호환성 source)
- `apps/web/src/app/tree-fixtures.ts` — 7종 fixture (Patterns 카드 source)

### Schema/타입
- `packages/tree/src` — 노드 schema (변환 매핑은 여기 type 정의 기준)
- `packages/components/src` — 노드별 렌더러
- `packages/validators/src` — 호환성 검사용

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **NodeContextMenu** (page.tsx:5375) — 이미 화면 boundary auto-flip 처리됨 (UX-01). 서브메뉴 패턴은 신규 추가 필요 (현재는 flat list).
- **Global keydown handler** (page.tsx:2862) — 단축키 등록 hub. quick-add 단축키 D-17은 여기에 추가.
- **Command palette** (command-palette.tsx) — shortcut 라벨 표시 패턴 (line 228, `item.shortcut`). UX-03 변환 액션도 여기 등록.
- **추가 선택 state** (page.tsx:587) — primary selectedNodeId + array. Shift+drag 박스 선택은 이 state 확장.
- **Inspector dropdown 패턴** (inspector-atoms.tsx) — type dropdown D-05는 기존 dropdown 컴포넌트 재사용.

### Established Patterns
- **Korean UI mandate** — 모든 라벨/toast/메뉴 한국어.
- **Tailwind + CSS Modules** — 캔버스 overlay는 Tailwind utility로.
- **Canvas zoom/pan** — `canvas-contexts.ts`의 transform state. overlay는 이 transform 곱해서 위치 계산.
- **node-meta.ts** — 노드 타입별 compatibility/category 메타데이터. UX-03 매트릭스 정의 위치로 적합.

### Integration Points
- **page.tsx 메인 canvas** — 박스 선택 overlay, spacing overlay 추가 위치
- **NodeContextMenu** — 변환 서브메뉴 추가
- **좌측 패널 신규** — 현재 좌측 패널 없음 → 신규 컴포넌트 생성 (좌측 viewport 240px 차지)
- **selectable-node.tsx** — onMouseEnter hover로 UX-02 spacing 측정 트리거

</code_context>

<specifics>
## Specific Ideas

- _Figma 패턴_ 우선 참고 (spacing overlay 시각화, 박스 선택 색상, 변환 dropdown).
- Webflow의 좌측 컴포넌트 패널 UX 참고 (Patterns 카드 미리보기 방식).
- 단축키 _Figma와 가능한 한 호환_ — 단, OS/브라우저 충돌 시 Alt+ 조합 우선.

</specifics>

<deferred>
## Deferred Ideas

- **AI 자동 변환** — text → 어울리는 button 라벨 생성 등 AI 보강 (Phase 2 영역).
- **컴포넌트 패널에서 _AI 생성_ 패턴 카드** — fixture 외 동적 카드 (Phase 2).
- **align to canvas guide / grid** — VIS-01 grid 도구 의존 (Phase 3 영역).
- **자유 키 customize** — 사용자가 단축키 재할당 (v3.0+).
- **Multi-monitor 컨텍스트 메뉴** — UX-01 follow-up (현재 viewport 기준만).

</deferred>

---

*Phase: 01-ux-fix*
*Context gathered: 2026-05-11*
