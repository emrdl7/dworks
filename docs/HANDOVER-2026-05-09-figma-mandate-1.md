# 핸드오버 — Figma/Stitch mandate 사이클 1 (2026-05-09 야간 후)

> 직전 핸드오버 `HANDOVER-1.0.0-codex-response.md` 후속. _Figma/Stitch 수준 UI_ mandate의 첫 3 토픽 마감.

---

## 즉시 읽어야 할 파일

1. **본 파일** — 사이클 1 결과 + 다음 mandate
2. `docs/HANDOVER-1.0.0-codex-response.md` — Figma/Stitch mandate 원안 + Codex P0 잔여
3. `docs/discussions/2026-05-09-1-0-verification-round-2-codex.md` — Codex 검증 보고서

---

## 사용자 신호 (여전히 유효)

> "ui 피그마나 클로드디자인 스티치 수준으로 올라올때까지 계속 개선해"

→ Figma/Stitch 수준 UI 개선이 진행 중인 핵심 mandate. 사이클 1에서 _구조적 정리_ 완료.

---

## 이번 세션 변경(commits)

| commit | 변경 |
|---|---|
| `80a303c` | feat: inspector 9 disclosure → 3 탭(디자인/레이아웃/콘텐츠) |
| `5de5b2e` | feat: 좁은 화면 좌/우 drawer 토글 — fixed overlay drawer |
| `b618484` | feat: 좌측 패널 브리프/레이어 탭 분리 |

각 단계마다 typecheck / lint / build 통과 확인.

### 상세 — inspector 탭 분리 (`80a303c`)

`apps/web/src/app/page.tsx`:
- `InspectorTab` 타입(`'design' | 'layout' | 'content'`)과 `INSPECTOR_TABS` 상수, `getInspectorTabSectionTitles()` 헬퍼 추가.
- `NodeInspector` 컴포넌트 헤더에 `role="tablist"` 탭 strip 추가.
- 기존 `getVisibleControlledSectionTitles` / `COMMON_INSPECTOR_CONTROLLED_SECTIONS` dead code 제거.
- master collapse "모두 접기/펼치기"는 _현재 활성 탭의 sections_만 토글.
- 디자인 = 색상/타이포(text only)/모양 / 레이아웃 = 레이아웃/간격/변환 / 콘텐츠 = 내용(text·button)/이미지·이미지구도(image)/그룹(container).

### 상세 — drawer 토글 (`5de5b2e`)

- state: `briefDrawerOpen`, `inspectorDrawerOpen` (둘 다 기본 false).
- 헤더 좌측에 `PanelLeft` 토글 버튼(`md:hidden`), 헤더 우측 끝에 `PanelRight` 토글 버튼(`xl:hidden`, compareMode일 때 비표시).
- aside 클래스: 기본 `hidden md:flex`, drawer open 시 `fixed inset-y-0 left-0 z-50 w-[280px] flex shadow-xl`. md/xl 이상에서는 `static z-auto w-auto` 그대로.
- backdrop(`fixed inset-0 z-40 bg-black/40`)을 button으로 띄워 클릭 시 close.

### 상세 — 좌측 패널 탭 (`b618484`)

- state: `leftPanelTab: 'brief' | 'layers'` (기본 'brief').
- aside 직속에 `role="tablist"` 탭 strip(`브리프 / 레이어`).
- 기존 `<details open>...AI 디자인...</details>` 영역과 `<nav>...레이어 트리...</nav>` 영역을 각각 활성 탭일 때만 렌더.
- 기존 `<h2>레이어</h2>` 헤더 div 제거(탭이 대체).

> **참고:** 핸드오버 원안에 "레이어 트리가 inspector 안에만 있음"으로 적혀 있었으나 실제 코드 확인 결과 _좌측 패널에 이미 stacked로 존재_했음. 사이클 1에서 _stacked → 탭 분리_로 가치 정의 변경.

---

## 다음 사이클 우선순위

### 4. 헤더 minimal (대형 토픽 — 별도 세션 권장)

- 현재: `로고 + 예제 select + viewport + zoom + undo/redo + 대비 chip + (좌/우 drawer 토글)` — 모두 헤더에 노출.
- Figma 표준: `메뉴바(File/Edit/View/Help) + 파일 정보 + 협업 + share`.
- 권장 작업 단위:
  - 4-a (작은 단위): 대비 chip을 아이콘+숫자 형태로 축소.
  - 4-b (작은 단위): viewport / zoom / undo·redo를 _캔버스 toolbar_로 이전(헤더는 메타 정보만).
  - 4-c (큰 단위): File/Edit/View 드롭다운 메뉴바 도입 — 키보드 shortcut 매핑 필요.

### 5. canvas grid/ruler (대형 토픽 — 별도 세션 권장)

- 현재: 단일 viewport + zoom. grid/ruler 없음.
- 권장 작업 단위:
  - 5-a (중간): 캔버스 background grid pattern 토글(8/16/24 px). View 메뉴와 연동.
  - 5-b (큰 단위): 상단/좌측 ruler — 마우스 hover 좌표 가이드.
  - 5-c (큰 단위): snap to grid + 노드 transform 정수 grid 정렬.

### 잔여 Codex P0 (release 안정성 — 별도 세션)

- **P0 #1**: 루트 `pnpm lint` 실패. 각 워크스페이스에 `eslint.config.mjs` 추가 또는 루트 공유 config 도입(`@dworks/api`, `packages/components`, `packages/exporters`, `packages/llm-prompts`, `packages/tokens`, `packages/tree`, `packages/tree-editor`, `packages/tree-renderer`, `packages/validators`).
- **P0 #3**: `apps/web/scripts/preflight.mjs`에서 webpack runtime/chunk layout mismatch 감지. 현재 manifest 파일 _존재만_ 검사.

### 미세 폴리시 (작은 사이클)

- 좌/우 패널 탭 strip 시각 통일(좌측 `py-3`, 우측 `py-2` 차이 — 의도적 계층 구분이지만 더 점검).
- 키보드 ←/→ 화살표로 탭 이동 지원(현재 클릭/Tab만).
- 노드 ID 표시 폰트(`break-all text-xs`)가 inspector 헤더에서 시각적으로 약간 어색 — 전용 chip 디자인 검토.

---

## 핵심 코드 위치 (갱신)

- `apps/web/src/app/page.tsx`
  - 헤더(2274~) — 좌측 `PanelLeft` 토글, 우측 `PanelRight` 토글
  - 좌측 aside(2389~) — 탭 strip + brief tabpanel + layers tabpanel
  - 캔버스 section(3087~)
  - 우측 aside(3149~) — drawer 모드 적용
  - `NodeInspector` 컴포넌트(5304~) — 3 탭 분리
  - `InspectorTab` 타입 / `INSPECTOR_TABS` / `getInspectorTabSectionTitles`(10920~)

---

## 검증 (이번 세션 마감 시점)

- ✓ `pnpm --filter @dworks/web typecheck`
- ✓ `pnpm --filter @dworks/web lint` (warning 0)
- ✓ `pnpm --filter @dworks/web build`
- ✗ 루트 `pnpm lint` (Codex P0 #1 — 미해결, 계속 인계)

---

## 컨벤션 / 학습 (재확인)

자율 모드 cleanup 학습 (계속 유효):
1. 사용자가 직접 요구한 mandate 영역인가
2. 디자이너 _직접 사용하는 툴_ 가치인가
3. 메트릭/통계/시각화 등 메타 정보는 사용자 요구 없으면 추가 X
4. UI 요소 추가 전 _제거 가능_한지 먼저 검토
5. _일 벌리기보단 정리/마감_ 우선

이번 사이클은 _요소 추가_보다 _기존 구조의 재배치/탭화_였으므로 학습 4번에 부합.

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -10` — `b618484`까지 확인
2. `git status` — clean
3. `cat docs/HANDOVER-2026-05-09-figma-mandate-1.md` (본 파일)
4. `cat docs/HANDOVER-1.0.0-codex-response.md` (원안)
5. 사이클 단위 결정:
   - 가벼운 마이크로 폴리시 → "미세 폴리시" 항목
   - 중간 사이클 → 4-a / 4-b / 5-a 중 택일
   - 큰 사이클 → 4-c / 5-b / Codex P0 #1
6. context 여유 있을 때만 큰 토픽 시도

[Claude]
