# 핸드오버 — 자율 밤샘 mandate (2026-05-10 새벽)

> 직전 핸드오버 `HANDOVER-2026-05-09-figma-mandate-1.md` 이후 _하나의 긴 세션_으로
> 70+ commit 누적. 사용자 _아침까지 자율 + 절대 멈추지 마라 + 압축 걱정 X_ mandate.

---

## 즉시 읽어야 할 파일

1. **본 파일** — 이 세션 누적 + 다음 시작점
2. `docs/HANDOVER-2026-05-09-figma-mandate-1.md` — 직전 인계 (이번 세션 시작점)
3. `docs/HANDOVER-1.0.0-codex-response.md` — Figma/Stitch mandate 원안

---

## 사용자 mandate (이번 세션 누적)

**시간 순:**

1. (시작) "기성 제품들 수준으로 ui ux 올라올때까지 나한테 물어보지 말고 계속 개선해"
2. "다음 큰작업이라도 그냥 팍팍 진행해... 그리고 다크모드를 기본으로 하는걸 고려하고"
3. "다크모드로 하니까 스크롤바가 눈에 띈다... 스크롤바좀 꾸며라"
4. "내가 자러가더라도 너는 계속 ui 개선해라... ui ux 더이상 할게 없다면... 디자인 품질 개선해라... 디자인 편집 기준때문에 llm 생성 품질이 낮아진다면... 절충안을 찾던지... 디자인 편집 기능을 고도화 하던지 해서... llm의 생성 제약을 풀어주고 좀... 다양한 방법을 찾아서 계속 일해 밤을 새서 한다는 심정으로... 컨텍스트 쌓이는건 걱정말고... 너무 쌓이면 압축 하겠거니 하고 계속 가라"
5. (반복) "큰 변경도 미루지 말고 계속 해라... 내일아침에 와서 보겠다... 절대 중단하지 마라"
6. (반복) "아침까지 계속 해라... UI 피그마나 스티치, 클로드디자인 수준으로 끌어올려놔라... 절대 멈추지 마라"
7. "인수인계 문서 작성해 클리어하게"

→ 명확한 _기성 디자인 툴 수준_ + _다크 기본_ + _LLM 제약 풀기_ + _자율 밤샘_.

`/Users/johyeonchang/.claude/projects/-Users-johyeonchang-dworks/memory/feedback_keep_going.md`에
이 mandate 메모 저장됨.

---

## 이번 세션 누적 변경 (큰 영역 위주)

### 1. 다크 모드 기본 (chrome 전체)

`apps/web/src/app/page.tsx` + `globals.css`:

- **48 매핑 일괄 적용** (Python 스크립트로): bg #f5f7f4 → #0d0e10, panel #fbfcfa/white → #16181c, canvas #eef2ec → #0d0e10, elevated #eef3ed/#f8faf9/#f1f5f3 → #1d2025, selected #dff1ee/#eef0ff/#eef2ff/#eef8f6 → #1e1f3a, text #18211d/#1f2a25 → #ebecef, body #26312b → #c5c8cf, muted #4f5e56/#647067 → #898d97, faint #9aa49d → #5b6069, accent text #073d37/#4f46e5(text) → #a5b4fc, amber #fff8df/#6b4b00/#d5b56c → #3a2e0a/#fbbf24/#a3741f, danger #fff1f1/#7a1f1f/#fecaca → #3a1717/#fca5a5/#7f1d1d, border #cbd6cf/#c9d4cd/#d7ddd2/#e0e5de → #2a2e35.
- 잔여 light hex (bg-[#647067/#dde3df/#e0e5de/#fff1ed], border-[#eef1ec/#f0c4c4/#f2f4f1], text-[#7a3b31/#9b3030/#b42318/#7f1d1d]) 정리.
- accent indigo: 600(#4f46e5) → 500(#6366f1)으로 일관 (다크에서 약간 밝게). hover:bg-[#4338ca]는 active hover로 유지.
- 캔버스 viewport(generation 결과물)는 _light surface_ 그대로 — Figma·Sketch 표준 (chrome만 다크).
- 그림자 강화: rgba(15,23,21,0.04/0.18) → rgba(0,0,0,0.4/0.6). 다크 배경에서 카드 입체감.
- grid pattern 색: rgba(255,255,255,0.06) → 0.08 (가시성).
- backdrop opacity 30/40 → 60 (다크 분리감).
- popover/menu/toolbar bg #16181c → #1d2025 (elevated tone).
- ViewportSwitcher segmented control 톤 반전: active bg #16181c → #2a2e35 (밝게).
- ZoomControl text/percent muted → primary, hover bg #1d2025 → #2a2e35.
- canvas/context menu hover bg #1e1f3a(accent soft) → #2a2e35(neutral elevated) — selected와 hover 구분.
- 다크 친화 스크롤바: width 10 → 8px, transparent track + #2a2e35 thumb (hover #3a3f48).
- native form accent: #4f46e5 → #6366f1.
- accent-[#4f46e5] (range slider 5곳) → #6366f1.

`globals.css :root` 변수 정의:
- `--dw-ui-bg / panel / elevated / soft / strong`
- `--dw-ui-text-primary / body / muted / faint / disabled`
- `--dw-ui-border`, `--dw-ui-accent / accent-hover / accent-soft / accent-text / accent-text-strong / accent-border`
- `--dw-ui-warn-bg/text/border`, `--dw-ui-danger-bg/bg-strong/text/border`
- (현재 hex 직접 사용. 점진적 var() 마이그레이션 가능 — 이번 사이클은 _토큰 정의만_)

### 2. 자유 편집 도구 (LLM 의존 줄이기)

**`packages/tree-editor/src/operations.ts`** — 새 export:

- `addLeafChild(tree, parentId, childType: 'text'|'button'|'image', newId)` — 컨테이너 자식으로 leaf 추가. default content: '새 텍스트' / '버튼' / src=''+alt='이미지'.
- `addContainerChild(tree, parentId, containerType, newId, initialTextChildId)` — 컨테이너 그룹 추가 (children 비어있으면 schema 위반이라 default 텍스트 자식 1개 동시 생성).
- `changeContainerNodeType(tree, nodeId, nextType)` — section/hero/card/list/form 사이 변환. children + 공통 props 보존, 특수 props(section.role 등) drop.
- `ContainerNodeType` 타입 export.

**`apps/web/src/app/page.tsx`** — 컨텍스트 메뉴:

- 컨테이너 노드: 텍스트 / 버튼 / 이미지 leaf 추가 + 섹션 / 카드 / 목록 / 히어로 / 폼 그룹 추가 + 섹션으로 / 카드로 / 목록으로 변환.
- 핸들러: `handleAddLeafChild`, `handleAddContainerChild`, `handleChangeContainerType`.
- 레이어 row hover 시 + 버튼(컨테이너만): 클릭으로 텍스트 자식 즉시 추가.

### 3. multi-select (캔버스 + 레이어 양쪽)

`apps/web/src/app/page.tsx`:

- state: `selectedNodeId` (primary) + `additionalSelectedNodeIds: Set<string>`.
- `useEffect`로 selectedNodeId 변경 시 additional 자동 clear.
- `allSelectedNodeIds = useMemo(new Set([selectedNodeId, ...additional]), ...)`.
- `CanvasSelectionContext` 도입 — primarySelectedId / allSelectedIds / toggleAdditional. main wrap.
- `SelectableNode`: useContext(CanvasSelectionContext), shift/cmd/ctrl+click → toggleAdditional, 일반 click → 단일.
- 레이어 row main button: 동일 패턴.
- 시각: primary는 strong ring + 라벨 + indicator bar + CanvasNodeToolbar / additional은 medium ring (캔버스) / bg-[#1e1f3a]/70 (레이어) — bar 없음.
- multi-target ops:
  - `handleDeleteSelected`: try-catch 순회 (자손이 부모와 같이 사라지면 silent skip), 마지막 살아있는 부모로 selection.
  - `handleDuplicateSelected`: 각 노드 individually 복제, 마지막 복제로 selection.
- Esc 우선순위: 도움말 popover → drawer → multi-select clear → root selection.
- inspector 헤더 위 배너: `+N개 다중 선택됨 (primary 속성만 표시)` + 우측 _해제_ 버튼.

### 4. LLM 다양성 + 제약 풀기

**`packages/llm-prompts/src/index.ts`**:

- `DesignBrief.variantSeed?: { index, targetTone? }` 필드 — formatBriefAsUserPrompt에서 index>=2 시 _대조적 톤_ 명시.
- 2026 트렌드 가이드에 5 톤 옵션 추가: 다크/럭셔리/스타일리시, GenZ/playful, B2B/SaaS/전문, 미니멀/선禪, 빈티지/클래식, 퓨처리스틱/사이버, 에디토리얼/매거진, 놀이적/GenZ — 총 11 톤 매핑.
- `예시 (도메인 다양화)` 섹션 위에 14+ 도메인 가이드 (랜딩/SaaS dashboard/포트폴리오/갤러리/매거진/컨퍼런스/이벤트/강의/e-commerce/건강·웰빙/부동산/금융/교육/여행).
- 피할 패턴 4개 추가: 다크 bg에 어두운 text(대비 위반), 흰 bg에 옅은 회색 text(가독 위반), 모든 섹션 동일 backgroundColor(위계 부재), nav만 있고 hero 부재.
- 마지막 instruction 강화: 자체 점검 영역 8개 명시 + 와이어프레임 / 단순 텍스트 박스 / 회색 캔버스 / 동일 padding 거부.

**`apps/web/src/app/generation-history.ts`**:

- `VARIANT_DIVERSITY_HINTS` 3톤 명시화: 균형형 / 임팩트형(bold typography 64~88, vivid accent, 강한 shadow, radius 16~28) / 다크럭셔리형(bg deep, bright text, vivid accent).
- 테스트 regex `/변형 2:/` → `/변형 2/` 완화 (라벨 포맷 변경).

### 5. 키보드 / UX 폴리시

`apps/web/src/app/page.tsx`:

- 글로벌 단축키: ⌘Z / ⌘⇧Z / ⌘Y / ⌘D (복제) / ⌘↑·⌘↓ (형제 reorder) / Delete·Backspace (삭제) / Esc (도움말→drawer→multi clear→deselect) / ? (단축키 도움말) — 모두 input/textarea/select/contenteditable 가드.
- brief textarea: ⌘Enter → 질문 받기 / ⌘⇧Enter → 바로 생성 / placeholder hint.
- 레이어 검색 input Esc → 검색어 clear.
- 레이어 트리: ↑/↓ keyboard nav (data-layer-row-main + data-layer-node-id 부여, nav onKeyDown).
- 캔버스 viewport drop shadow + 16px grid 토글 (off/8/16/24 px cycle, localStorage 저장).
- 단축키 도움말 popover (?): role=dialog + 카테고리 분리 (편집 / 노드 이동 / 브리프 입력 / 다중 선택 / 선택·도움말). 진입 fade-up animation. close 버튼 ref focus.
- drawer slide animation (좌·우 패널 200ms ease-out). md/xl 이상은 transition-none.
- 좌/우 drawer toggle 버튼 (좁은 화면 좌측 PanelLeft / 우측 PanelRight).
- 좌측 패널: 브리프 / 레이어 탭 분리 + 카운트 + ←/→ keyboard nav.
- inspector: 9 disclosure → 디자인/레이아웃/콘텐츠 3 탭 + ←/→ keyboard nav + 탭 전환 fade-in animation.
- 캔버스 toolbar: viewport switcher + zoom control + grid 사이즈 cycle.
- 레이어 트리 expand/collapse (chevron 토글, collapsedIds Set, flattenTree(node, collapsedIds, depth)).
- 레이어↔캔버스 hover cross-highlight (CanvasHoverContext).
- 레이어 검색: 노드 ID 부분 일치 + amber mark highlight.
- 선택 노드 자동 reveal: 조상 collapse 해제 + scrollIntoView smooth.
- 캔버스 빈 영역 클릭 → root selection.
- 노드 type별 lucide 아이콘 일관 (Type/MousePointer/Image/PanelTop/SquareStack/Square/List/FormInput) — 레이어 row, inspector 헤더, 캔버스 selection 라벨, 컨텍스트 메뉴 헤더.
- 레이어 state 토글 (Eye/Lock/EyeOff/Unlock) — hover 시 ghost button, hidden/locked는 amber chip.
- 대비 chip: 통과 시 hide(signal-only), 미통과 시 클릭 → 첫 미통과 노드 선택.
- ID 클립보드 복사 (inspector 헤더 노드 ID button) + 1.2초 inline 피드백 (`ID 복사됨 ✓`).
- localStorage UI prefs (canvasGridSize / canvasZoom / responsiveViewport / leftPanelTab) 저장 + legacy canvasGridVisible 마이그레이션.

### 6. 헤더 / 툴바 정리

`apps/web/src/app/page.tsx`:

- 예제 fixture select: 헤더 → 좌측 브리프 탭의 _AI 디자인_ 헤더 영역으로 이전 (자주 안 쓰임 + 헤더 폭 압박).
- viewport switcher + zoom control: 헤더 → 캔버스 toolbar로 이전 (캔버스 컨트롤은 캔버스 영역).
- DworksLogo description "디자인 편집기": lg 이상에서만 표시 (좁은 화면 압박).
- 대비 chip 시각 폴리시: rounded-full → rounded-md + 아이콘(CheckCircle2/AlertTriangle) + 신호 전용(통과 시 hide).
- generation chip group rounded-full → rounded-md + Pin 아이콘.
- 변형 비교 button rounded-full → rounded-md (헤더 chip들과 통일).
- 컨텍스트 메뉴 헤더 + 노드 type 아이콘 + 진입 fade-up animation.
- Inspector 헤더에 노드 type accent badge (#1e1f3a bg + #a5b4fc icon).

### 7. release 안정성 (Codex P0)

- **P0 #1 해결**: 루트 `eslint.config.mjs` (typescript-eslint flat config) + `packages/eval/src/judge.ts`의 prefer-const 위반 수정. `pnpm lint` 14/14 통과.
- **P0 #3 해결**: `apps/web/scripts/preflight.mjs` chunk integrity 검사. BUILD_ID/static 매칭 + server/webpack-runtime.js + server/app/**/*.js의 require("./X.js") 상대 경로 reference 무결성. node_modules 경로(next/dist/...)는 정규식 의도적 제외.

---

## 검증 (현재 시점)

- ✓ `pnpm lint` 14/14
- ✓ `pnpm typecheck` 17/17
- ✓ `pnpm test` 13/13
- ✓ `pnpm --filter @dworks/web build`
- ✓ dev 서버 정상 (단 _.next stale_ 주의 — 큰 변경 후 재시작 필요할 수 있음, `dev:fresh` 명령으로 강제 정리 후 시작)

---

## 핵심 코드 위치 (갱신)

`apps/web/src/app/page.tsx`:
- main bg: 2659~ (`<CanvasSelectionContext.Provider>` → `<CanvasHoverContext.Provider>` → `<main bg-[#0d0e10] text-[#ebecef]>`)
- 헤더: 2700+ (logo + brief drawer toggle / undo redo / 대비 chip 클릭 / ? help / inspector drawer toggle)
- 좌측 aside: 2640+ (drawer animation + 브리프/레이어 탭 + 카운트 + ←→ keyboard nav)
- 캔버스 section: 3460+ (toolbar viewport+zoom+grid 사이즈 cycle / inner scroll div / 빈 영역 click deselect / grid pattern background / drop shadow viewport)
- 우측 aside: 3895+ (drawer animation + multi-select 배너 + NodeInspector)
- 레이어 트리: 3540+ (검색 + Esc clear + 빈 결과 안내 + 레이어 row main button shift/cmd+click multi + state toggle Eye/Lock/EyeOff/Unlock + chevron expand/collapse + indicator bar + hover Plus + drag-drop)
- 컨텍스트 메뉴: 4080+ (NodeContextMenu — 위/아래 이동 ⌘↑↓ + 복제 ⌘D + 삭제 Del + visibility/selection toggle + leaf type 변경 + 컨테이너 5종 추가 + 컨테이너 type 변환)
- 캔버스 SelectableNode: 5180+ (multi-select context + shift/cmd+click + primary vs additional 시각 + 라벨 chip + toolbar)
- NodeInspector: 6378+ (3 탭 디자인/레이아웃/콘텐츠 + 노드 type accent badge 헤더 + ID 클립보드 복사 + ←→ keyboard nav)
- 단축키 도움말 popover: 3895+ (4 카테고리 + role=dialog + close ref focus + fade-up)

`apps/web/src/app/globals.css`: 다크 토큰 :root + scrollbar + animation keyframes + form accent

`packages/tree-editor/src/operations.ts`: addLeafChild, addContainerChild, changeContainerNodeType + walkAndAddChild, walkAndConvertContainer, collectNodeIdsLocal helpers

`packages/llm-prompts/src/index.ts`: DesignBrief.variantSeed, GENERATE_TREE_SYSTEM_PROMPT의 _2026 트렌드 가이드_ + _톤 매핑 11종_ + _도메인 다양화 14+_ + _AI 슬롭 negative pattern 8개_

`apps/web/src/app/generation-history.ts`: VARIANT_DIVERSITY_HINTS 3톤 강화

`apps/web/scripts/preflight.mjs`: chunk integrity 검사 강화

`/Users/johyeonchang/.claude/projects/-Users-johyeonchang-dworks/memory/feedback_keep_going.md`: 사용자 mandate 메모

---

## 다음 세션 시작 체크리스트

1. `git log --oneline 78e1d2f..HEAD | head -80` — 이번 세션 약 70+ commit 확인
2. `git status` — clean 확인
3. `cat docs/HANDOVER-2026-05-10-overnight.md` (본 파일)
4. dev 서버: 정상이면 그대로, 500 에러 시:
   ```sh
   for pid in $(lsof -tiTCP:3000 -sTCP:LISTEN); do kill "$pid"; done
   rm -rf apps/web/.next
   pnpm --filter @dworks/web dev
   ```
5. **사용자가 직접 시각 확인 후 다음 시그널 받기** — multi-select / 다크 / 자유 편집 / LLM 다양성을 _Figma·Stitch·Claude Design 수준_ 비교.

---

## 미해결 큰 영역 (다음 mandate 후보)

1. **CSS 변수로 hex 마이그레이션** — `--dw-ui-*` 토큰 정의됨, page.tsx의 hex를 var()로 점진 교체. 시각 효과 X, 가독성 + 다크/라이트 토글 가능성.
2. **multi-target reorder** — ⌘↑↓이 현재 primary만. multi 시 모든 노드 동시 이동. 복잡(부모 다른 경우).
3. **캔버스 자유 transform** — drag-to-move. layout-driven 아키텍처라 _free position_ 충돌 가능.
4. **LLM 후처리 자동 보강** — 8 신호 미달 시 _코드_가 자동 fix. 큰 알고리즘.
5. **toast 시스템** — 인프라 도입 + 기존 inline error 마이그레이션.
6. **노드 sibling 추가** — 현재는 _컨테이너 자식 추가_ + _노드 type 변환_만. _다음에 추가_ (선택 노드 옆) 가능.
7. **컨테이너 type 변환에 hero/form 포함** — 현재 section/card/list만 (hero/form은 추가만 가능, 변환 없음).
8. **multi-select range** — Shift+click 두 노드 사이 _순차 선택_.
9. **inspector control 깊은 폴리시** — color picker / slider / typography input 디자인 일관화.
10. **다크 fixture 추가** — 사용자가 시작 시 _다크 결과물_ 즉시 사용 가능한 fixture.

---

## 운영 학습 (재확인)

### feedback_keep_going.md 메모

- 장기 mandate에서 _계속 진행_ vs _세션 인계_: 사용자가 _묻지 말고 가라_/_절대 멈추지 마라_라고 한 경우 _자율 무한 진행_ — 핸드오버 작성은 _명시적 요구_ 시만.
- 컨텍스트 80%+ 도달 시 _큰 새 작업_ 자제 + 작은 polish 누적. 압축 가까우면 _안전 commit_ 후 자연 정지 수용.
- 가치 명확치 않은 자율 변경은 _노이즈_. 사용자 시각 검증 후 다음 시그널 받기.

### 자율 사이클 cleanup 학습 (계속 유효)

1. 사용자 직접 요구한 mandate 영역인가
2. 디자이너 _직접 사용하는 툴_ 가치인가
3. 메트릭/통계/시각화 등 메타 정보는 사용자 요구 없으면 추가 X
4. UI 요소 추가 전 _제거 가능_한지 먼저 검토
5. _일 벌리기보단 정리/마감_ 우선

---

[Claude]
