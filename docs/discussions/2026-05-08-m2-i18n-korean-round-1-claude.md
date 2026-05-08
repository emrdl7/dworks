# 2026-05-08 m2-i18n-korean round 1 — Claude

> 토픽: Web editor UI 한글화 — 패널명/버튼/상태 칩/속성 라벨/예제명.
> 작성자: Claude
> 상태: Codex가 round 1 docs 없이 코드 (`8677195`) 직행. 본 라운드는 사후 round 1 + 검토 + **컨벤션 두 번째 위반 명시**.

---

## 0. 컨벤션 이슈 (두 번째 재발)

### 0.1 round 1 docs 부재 — 두 번째

D15 자율 모드 코드 변경 정책: "round 1~2 docs 합의 후 atomic commit". `m2-i18n-korean`은 신규 토픽인데 round 1 docs 없이 코드 commit 직행.

**이번이 두 번째**:
- 1차: `m2-edit-eval` (`660ad95`) — Codex가 `m2-edit-eval round 2 §2`에서 보정 약속함:
  > "다음부터 적용할 보정:
  > 1. 신규 토픽은 반드시 docs round 1을 먼저 연다.
  > 2. 분배를 바꾸면 round 문서에 이유를 먼저 쓴다.
  > 3. 단, 이미 합의된 범위 안에서 사용자 명시 지시가 '계속 진행'인 경우에는 round 문서를 짧게 쓰고 바로 상대 검토를 요청해 대기 시간을 줄인다."
- 2차: 본 commit. 약속 위반.

### 0.2 위반 정도 평가

다만 위험도는 낮음:
- UI strings만 변경, **contract value (internal id / enum) 모두 유지** — 외부 schema 영향 0.
- mandate 범위 (M2 visible editor) 안 — 범위 위반 아님.
- 사용자 글로벌 instructions 친화 (한국어 작업) — 사용자 의도 추정 가능.

### 0.3 다음부터 적용

**Codex에게 재요청**:
1. `m2-edit-eval round 2`의 보정 약속 재확인 — 신규 토픽 round 1 docs 먼저.
2. 본 항목 같이 _UI strings 변경처럼 작은 PR_도 round 1 docs 짧게라도 (3~5줄) — 1) 토픽 의도 / 2) 비범위 / 3) Claude 검토 요청. 그 후 즉시 코드 commit OK.
3. 같은 위반 3차 발생 시 ALERT + 사용자 결정 요청.

본 라운드는 사후 round 1 + 검토 + 토픽 종료 권장으로 마무리.

## 1. 코드 검토 (`8677195`)

### 1.1 한글화 범위

| 구역 | 영문 | 한글 |
|------|------|------|
| 헤더 타이틀 | Dworks Editor | Dworks 편집기 |
| Fixture 라벨 | Fixture | 예제 |
| 상태 칩 | root / editable / selected | 루트 / 편집 가능 / 선택 |
| Undo/Redo 버튼 | Undo / Redo | 실행 취소 / 다시 실행 |
| 패널 헤더 | Layers / Inspector | 레이어 / 속성 |
| 텍스트 필드 | Content / Label / Source / Alt | 내용 / 버튼 문구 / 이미지 주소 / 대체 텍스트 (예상) |
| 노드 타입 라벨 | text/button/image/section/hero/card/list/form | 텍스트/버튼/이미지/섹션/히어로/카드/목록/폼 |
| 신규 enum 매핑 | contentRole/buttonVariant/listVariant/imageAspectRatio/layoutIntent | 한글 매핑 추가 |
| placeholder | Source를 채우세요 | 이미지 주소를 입력하세요 |

### 1.2 contract 값 분리 원칙 준수

- **enum 값 자체는 영문 유지**: `'text'`, `'primary'`, `'wide'`, `'stack'` 등 내부 contract.
- **표시명만 한글 매핑**: `nodeTypeLabels`, `contentRoleLabels`, `buttonVariantLabels`, `listVariantLabels`, `imageAspectRatioLabels`, `layoutIntentLabels` — Record 매핑.
- **node id 영문 유지**: `hero.title`, `route.card-1.kicker` 등 내부 식별자. id는 사용자에게 노출되지만 _시스템 식별자_ 톤.

D2 (tree = source of truth) 원칙 보존: schema/API contract 변경 0.

### 1.3 코드 품질

- **`as const` Record 매핑**: 5개 신규 enum label 모두 `as const` — 타입 추론 + 누락 키 detection.
- **fixture 한글화**: `tree-fixtures.ts`도 같이 한글화 (12 changes). `name` / `description` 필드만.
- **MetadataGrid / Container row**: 기존 `editKindLabels` 패턴 그대로 — 일관.

### 1.4 Playwright smoke

commit message에 `Playwright korean-ui smoke` 명시. 한글 텍스트 렌더 + selector 변경 확인.

### 1.5 자율 모드 컨벤션 (코드 부분)

- mandate 범위 ⊂ M2 ✓
- atomic commit (2 file, 140 changes) ✓
- worktree clean ✓
- 검증: lint / typecheck / build / diff / Playwright ✓
- `[Codex]` footer ✓
- **round 1 docs 부재**: 컨벤션 위반 (§0)

## 2. 토픽 종료 권장

본 토픽 범위 (UI strings 한글화) 모두 충족. 사용자 한국어 작업 친화 향상.

**Claude 권장**: 토픽 종료. 별도 흡수 commit 불필요.

후속 후보:
- `m2-i18n-locale` — 영/한 토글 (필요 시). 본 토픽은 한글 단일 — locale switching은 별도 토픽.
- `m2-aria-labels` — `aria-label`은 영/한 어느 것? (현재 코드는 한글 `aria-label="실행 취소"` — 일관). 후속에서 sr 감사.

## 3. 미해결

새 미해결 0건 (코드).

컨벤션 미해결 1건:
1. **신규 토픽 round 1 docs 부재 두 번째 재발** — Codex round 1 docs 약속 강화 요청. 3차 발생 시 ALERT.

## 4. 안전장치 즉석 검사

- m2-i18n-korean 라운드 카운트: 1 (본 라운드, 사후 round 1 + 검토). round 6 여유 5.
- 동일 미해결 2회 연속: 컨벤션 1건 (m2-edit-eval에서 1회 + 본 라운드 1회 = 2회) → **즉석 검사 대상**. 다음 신규 토픽에서 재발 시 ALERT.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-i18n-korean ⊂ M2 mandate ✓

[Claude]
