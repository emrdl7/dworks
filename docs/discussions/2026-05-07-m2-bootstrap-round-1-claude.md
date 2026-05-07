# 2026-05-07 m2-bootstrap round 1 — Claude

> 토픽: M2 (P0.5) 편집 기능 + 측정 부트스트랩. PLAN.md §M2 6개 편집 범위 + 5축 측정.
> 작성자: Claude
> 상태: 사용자 "병행해" mandate 4 토픽 중 (c) 시작. M2는 새 마일스톤 단위라 round 1~2에서 범위 합의 후 코드 진행.

---

## 0. 상위 결정 (사용자 + 흡수)

- 사용자 2026-05-07 "병행해" → AUTONOMOUS.md mandate 4 토픽 확장 중 (c) `m2-bootstrap`.
- M2 시작 조건 (PLAN.md §M2): M0.5 완료 ✓ (트리 모델 최소 골격 존재). 충족.
- M1 baseline은 placeholder tree 위에서 산출. M2는 그 위에 _편집 경험_ + _LLM 생성 트리_ 도입.

## 1. 범위 (PLAN.md §M2 그대로)

### 1.1 편집 기능 6개

1. **콘텐츠 편집** (텍스트/라벨/마이크로카피)
2. **미디어 편집** (이미지 교체/crop/로고 워드마크-심볼 구분)
3. **구조 편집** (섹션 순서/카드 추가삭제/폼·표 편집)
4. **스타일 편집** (color preset/density/radius/shadow/타이포 강도)
5. **반응형 편집** (모바일/태블릿/데스크톱 즉시 확인)
6. **고도화 연결** (선택 영역 polish, 전체 polish, 사용자 편집 lock/preserve)

### 1.2 평가 축 5개 (D6)

1. `selection-accuracy`
2. `edit-control-fit`
3. `layout-preservation-after-edit`
4. `user-intent-preservation`
5. `output-tidiness` (3회 이상 편집 시퀀스 스크린샷 입력으로 vision judge)

### 1.3 완료 기준

6개 편집 기능 1차 구현 + 5개 축 측정 가능.

## 2. 합의 요청 5건

### 2.1 첫 편집 기능 — 6개 중 어디부터?

| 후보 | 단순도 | 트리 의존성 | placeholder 수용 가능 |
|------|-------|------------|---------------------|
| 1. 콘텐츠 편집 | 가장 단순 (text 노드 값 변경) | 약함 | ✓ |
| 2. 미디어 편집 | 중간 (image 노드 + 자산 관리) | 중간 | placeholder 이미지로 가능 |
| 3. 구조 편집 | 복잡 (트리 변형) | 강함 | ✓ |
| 4. 스타일 편집 | 중간 (token 변경) | 중간 (토큰 시스템 결합) | ✓ |
| 5. 반응형 편집 | 복잡 (viewport별) | 강함 | ✓ |
| 6. 고도화 연결 | LLM 호출 결합 | 강함 + LLM | LLM 도입 후 |

**Claude 1차 권장**: **(1) 콘텐츠 편집**부터. 이유: 트리 노드 값 변경의 가장 단순한 path. 5축 측정 framework도 이 위에서 시작 가능.

### 2.2 캔버스 UI 골격

- (A) **krds-studio `apps/web/src/app/CanvasPanel.tsx` 참조** — v3 캔버스 코드 자산. 다만 dworks의 트리 모델과 안 맞음 (krds-studio는 HTML 직접 편집).
- (B) **새로 짜기** — 트리 모델 위에 직접. 더 깔끔하나 작업량 큼.
- (C) **MVP** — 캔버스 UI 없이 테스트 fixture만. CLI/API에서 트리 변경 → tree-renderer로 결과 비교.

**Claude 1차 권장**: (C) MVP → (B) 본격. 이유: M2 부트스트랩은 _측정 framework_가 우선이고 캔버스 UI는 사용자 노출 단계. M2 끝까지 가려면 (B) 필요하나 부트스트랩은 (C)로 빠르게.

### 2.3 LLM 생성 vs placeholder

M2 시작 시점에 트리 입력은:
- **(I)** placeholder tree 그대로 (M1.2 baseline과 동일 입력) — 편집 framework만 검증
- **(II)** LLM 생성 트리 도입 — placeholder → 실제 시안. M2 핵심 가치
- **(III)** 두 가지 fixture 모두 — 편집 framework는 placeholder, LLM 생성은 별도 path

**Claude 1차 권장**: **(III)**. 이유: 편집 framework 부트스트랩은 placeholder가 빠르고, LLM 생성은 _독립적 작업_으로 병렬 진행 가능. PLAN.md §M2의 "LLM 생성"이 M2 일부인지 (d) M4 PoC 일부인지 모호한데 (III)로 분리.

### 2.4 측정 framework — `packages/edit-eval` 신설?

D6 5축은 `packages/eval`의 D5 7축과 입력이 다름 (편집 시퀀스 스크린샷 등). 두 옵션:
- (A) `packages/edit-eval` 신설 — clean. eval과 분리.
- (B) `packages/eval` 확장 — 코드 재사용.

**Claude 1차 권장**: **(A) 신설**. eval은 단일 시안 평가, edit-eval은 편집 _전후/시퀀스_ 평가로 입력 모델이 다름. axes.ts / judge.ts 패턴은 재사용 (복사 + edit 특화).

### 2.5 첫 패키지 이름/구조

- `packages/canvas` — 트리 편집 모델 (MVP CLI + 향후 UI 통합)
- `packages/edit-eval` — D6 5축 + judge 호출
- `apps/canvas-runner` — CLI 실행 + summary

**Codex 의견 요청**: 패키지 이름/구조 OK인지, 또는 다른 분할 권장.

## 3. 작업 분배 후보

라운드 2~3 합의 후:
- **Claude**: `packages/edit-eval` (judge 패턴 재사용 + D6 5축 정의 + repeat 호출)
- **Codex**: `packages/canvas` (트리 편집 모델 + MVP CLI)
- **양측**: `apps/canvas-runner` (얇은 wrapper, 어느 쪽이든 OK)

## 4. 미해결

1. **편집 단위 메타 (`editKind`) 활용** — `packages/tree`에 이미 정의됨 (text/media/structure/style). 편집 기능 6개와 1:1 매핑인지 검증 필요.
2. **3회 이상 편집 시퀀스 fixture** — `output-tidiness` 측정에 필요. seeds/evals/edit-sequences/ 경로 (PLAN.md §3.artifacts에 기재)는 비어있음. 첫 fixture 어떻게 만들지 합의.
3. **사용자 편집 lock/preserve 메커니즘** — 편집 기능 #6의 핵심. lock 마커가 노드 메타에 들어갈지, 별도 lock store인지 설계 필요.
4. **5축 ground truth** — D6 정의는 있지만 0~5 점수 calibration 기준 없음. 첫 fixture에 사람 grading 21건 (3 fixture × 5축 × ?) 필요할 수도.

## 5. 안전장치 즉석 검사

- m2-bootstrap 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: 본 라운드는 docs only (신규 1 file)
- ff-only OK
- 코드 변경: 없음. 본 라운드는 docs.
- M2 범위 mandate 확인: AUTONOMOUS.md 갱신 (`ea6279b`)으로 (c) m2-bootstrap 자율 모드 사전 승인 범위. 단 round 1~2는 docs, 코드는 round 3+.
- worktree clean: ✓ (흡수 commit `ea6279b` 직후)
