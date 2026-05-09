# 핸드오버 — 2026-05-09 cleanup (사용자 정정 후 자율 모드 곁가지 revert)

> 다음 Claude/Codex 세션이 즉시 이어가도록 정리. 직전 HANDOVER `HANDOVER-2026-05-09-evening2.md` 후속.

---

## 즉시 읽어야 할 파일

1. **본 파일** — 사용자 정정 신호 + cleanup 4 commit
2. `docs/AUTONOMOUS.md` — mandate + cleanup 섹션 신규
3. `docs/DECISIONS.md` 부록 A — cleanup 4 행 누적

---

## 사용자 정정 신호 (2026-05-09 저녁)

자율 모드에서 ABSORB 27→33 동안 곁가지로 빠진 토픽들에 대해 사용자가 강한 정정 신호 발신:

1. **"풍부도고 개뼉다구고 내가 알아야 할 이유가 뭐야?"** — 풍부도 메트릭 UI 11+ 토픽이 디자이너에게 노이즈
2. **"내가 빠르게 앱 완성하라고 했다? 쓸데없는 쪽으로 빠지지 말고"** — mandate(빠른 PoC 완성)에서 멀어진 자율 모드 곁가지에 대한 강한 정정
3. **"실제 사용할 수 있는 툴을 만들어내라고... 사람이 봤을때 ui 난잡하고 진짜 되게 별로야"** — _툴_답지 않은 UI에 대한 평가
4. **"좌측패널 우측패널 폼 사이즈랑 배치가 다르다... 통일시키고, 로고는 파란계열인데 ui는 왜 녹색계열이냐"** — 일관성 정정

---

## cleanup 4 commits

### `49ae92b` — 풍부도 메트릭 UI 일괄 revert (-476 lines)

제거:
- chip 라벨 옆 0.00~1.00 점수 + ml-1 dim 표시
- 풍부도 부족 신호 카드 (warm beige role=note)
- "이 신호로 다시 시도" 버튼 + handleRetryWithRichnessHints / runRichnessRetry
- sparkline (W140 H28 inline SVG + y 라벨 1.0/0.5/0.0 + tooltip + r=6 click target + immutable ◇ 마커)
- summary card (평균/최고/최저/활성 위치)
- 통합 팔레트 카드 (다중 image-ref 시 mergeImageReferenceColors/Aspect)
- fixture dropdown "이름 · 0.62" 점수 + "내 fixture (풍부도 순)" 정렬
- "낮은 풍부도 < 0.6 시 자동 재시도" 토글 + autoRichnessRetry state + persist 키
- RICHNESS_SIGNAL_LABELS / RICHNESS_RETRY_HINTS 상수 + import 정리

유지:
- richness.ts / image-color.ts 모듈 (m3-eval CLI 자동 평가에 가치)
- mergeReferenceColors/Aspect, RICHNESS_SIGNAL_KEYS export (다른 호출자/test 호환)
- system prompt의 "풍부도 8 신호 자체 점검" / "참고 이미지 활용 가이드" (LLM-side 품질 강제)
- persist v1 schema의 imageReferences 신규 키 (multi-image 흐름 핵심)

### `47ae809` — 좌측 패널 PoC scope 외 6 버튼 revert (-311 lines)

제거: 히스토리 정리 / 전체 내보내기(batch) / batch 불러오기 / fixture 이름 변경 / fixture 내보내기(catalog) / fixture 가져오기(catalog) + 6 dead handler.

유지: fixture 등록 / fixture 삭제 / 단일 내보내기 / 단일 불러오기 (4 버튼)

### `b824663` — UI 색·폼 통일 (사용자 명시 정정)

색 (로고 인디고/시안 그라디언트와 정합):
- primary: #1b7f72 (청록) → #4f46e5 (indigo-600)
- primary hover: #15665b → #4338ca (indigo-700)
- destructive bg: #fcf6ec → #fef2f2 (red-50)
- destructive hover: #fff7eb → #fee2e2 (red-100)
- destructive border: #e7d6c1 → #fecaca (red-200)
- destructive text: #7c5a2a → #b91c1c (red-700)
- pinned ★ 마커: 베이지 → indigo-50/200/600

폼 (우측 inspector 표준에 정합):
- 라벨: text-[11px] → text-xs
- input/textarea: px-2 py-1.5 text-xs → px-3 py-2 text-sm
- 액션 버튼: px-2 py-1 → px-3 py-2

### `72e1d01` — 헤더 메타 chip 4 제거

제거: "루트 X" / "편집 가능 N" / "선택 X" / "색상 X" — 디자이너 가치 없는 메타 정보.
유지: "대비 AA N/M" — WCAG AA 통과 카운트 (디자이너 직접 가치).
편집가능 카운트 useMemo dead code 제거.

---

## 현재 상태

### 좌측 패널 (정리 후)

- "AI 디자인" 헤더 (개수 표시 + 변형 비교 토글)
- history chip 그룹 (라벨만, 더블클릭 이름 변경, ★ 고정 토글, indigo 톤)
- fixture로 등록 / fixture 삭제 / 내보내기 / 불러오기 (4 버튼)
- 참고 이미지 영역 (단일/다중 슬롯, 썸네일 grid, 색 chip, 모두 지우기)
- brief 입력 (의도 textarea / 변형 개수 / 질문 받기 + 의도만으로 바로 생성)

### 우측 패널 (m2 inspector)

- "속성" 헤더 + 모두 펼치기/접기 + node.id
- InspectorDisclosure 8+ 영역 (기본 정보, 표시, 색상, 내용, 타이포그래피, 스페이싱, 모양, 레이아웃, 폰트…)

### 헤더

- 좌측: Dworks 로고 + "예제" select
- 우측: ViewportSwitcher + Undo/Redo + 대비 AA chip

### 캔버스

- compareMode: VariantCompareGrid
- 기본: 선택된 viewport 폭의 단일 preview

---

## 검증 상태

- `pnpm --filter @dworks/web typecheck` ✓
- `pnpm --filter @dworks/web test` — 112 tests / 16 suites / 0 fail
- 모든 모듈 backward compat 유지 (api, llm-prompts, generation-storage, generation-export, fixture-export, richness, image-color, generation-history)

---

## mandate 재정렬 (사용자 신호 후)

> **빠르게 실제 사용할 수 있는 툴 완성** — UI 난잡하지 않게, 곁가지 메트릭/메타 X.

PoC end-to-end 사이클:
1. ✓ 사용자 prompt → /clarify → /generate → tree → 캔버스
2. ✓ 다중 변형 + 비교 + active 전환
3. ✓ m2 자유 편집 (inspector)
4. ✓ persist (휘발 방지) + 단일 export/import
5. ✓ user fixture catalog (등록/삭제)
6. ✓ 다중 참고 이미지 (max 3)

---

## 다음 우선순위

### 사용자 직접 dogfood 후 신호 대기

자율 모드 진행보다 사용자가 _직접_ 흐름 사용해보고 _구체적인_ 정정/추가 mandate 신호를 받는 게 PoC 완성에 가깝다.

- `pnpm --filter @dworks/web dev` + `DWORKS_DEBUG_SCHEMA=1 pnpm --filter @dworks/api dev` 두 프로세스 시작
- 사용자가 prompt 입력 → clarify → generate → tree → m2 편집 흐름을 _끝까지_ 사용해보고 missing/깨진 부분 알려주는 게 효율

### 자율 진행 시 후보 (사용자 신호 없을 때)

1. inspector 영역 추가 정리 점검 (m2 누적 disclosure 중 실제 사용 빈도 낮은 것)
2. 좌측 패널 stage 2(질문 답변) 영역 텍스트 사이즈 정합 — 일부 [10px]/[11px] 잔여
3. compareMode UI 점검
4. 큰 토픽 m3-generate-stream (vendor-specific, 어려움)

---

## 컨벤션 주의 (cleanup 학습 사항)

### 자율 모드 곁가지 방지

직전 ABSORB 27~33이 _자율 모드에서 새끼친 polish 토픽_ 중심으로 흘렀음. 사용자 mandate 핵심에서 이탈한 신호가 모이면 강한 정정 발생.

다음 자율 진행 시 검토 기준:
1. 사용자가 _직접_ 요구한 mandate 영역인가?
2. 디자이너가 _직접_ 사용하는 _툴_ 가치인가?
3. 메트릭/통계/시각화 등 _메타 정보_는 디자이너가 _요구한 적 없으면_ 추가 X
4. UI 요소 추가 전 _제거_가 가능한지 먼저 검토

### 환경 변수 (api 측, 변경 없음)

- `DWORKS_DEBUG_SCHEMA=1` / `DWORKS_LLM_TIMEOUT_MS` / `DWORKS_GENERATE_RETRIES` / `DWORKS_LLM_PROVIDERS`

[Claude]
