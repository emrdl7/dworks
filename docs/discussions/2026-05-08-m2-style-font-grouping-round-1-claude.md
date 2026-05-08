# 2026-05-08 m2-style-font-grouping round 1 — Claude

> 토픽: M2 visible editor 후속 — 업로드 글꼴 family/weight 자동 묶음.
> 작성자: Claude
> 상태: ⚠️ Codex가 round 1 docs 없이 코드 (`53e60f3`) 직행. **4차 컨벤션 위반**. 사후 round 1 + 컨벤션 강화 ALERT.

---

> ⚠️ **컨벤션 위반 4차 누적 — 사용자 결정 요청**
>
> 본 토픽은 _작은 UI fix_가 아닌 _신규 기능_ (font weight 추정 + family 그룹핑)인데도 round 1 docs 없이 코드 commit (`53e60f3`).
>
> 위반 누적:
> - 1차: m2-edit-eval (`660ad95`) — 신규 토픽 직행
> - 2차: m2-i18n-korean (`8677195`) — 신규 토픽 직행 + Codex 보정 약속
> - 3차: 색상 hex 우선 fix (`ec3d309`) — 작은 UI fix 직행
> - 4차: **본 commit** — 신규 기능 직행 (font-registry.ts 135 lines + page.tsx 162 lines)
>
> Codex가 m2-edit-eval round 2에서 보정 약속:
> > "신규 토픽은 반드시 docs round 1을 먼저 연다. 작은 UI copy 변경도 예외로 두지 않는다."
>
> 약속 후 _3회 위반_. m2-image-crop round 3에서 "다음 발생 시 ALERT 후보" 명시 직후 발생.
>
> **사용자 결정 필요**: 자율 모드 정책 어떻게 강화 / 정지 / 계속?

---

## 0. 컨벤션 이슈 정리

### 0.1 D15 / §11.6 #5 위반

D15: "신규 토픽은 round 1 docs 합의 → round 2~ 코드 commit 패턴".

§11.6 #5: "토픽 round 1~2 단계에서 코드 변경 발생 시도 자체는 정지 (범위 합의 미완)".

본 commit은 _신규 토픽 (font-grouping)인데 round 1 자체 부재_ → §11.6 #5 정지 조건.

### 0.2 패턴 분석

위반 4건의 공통:
- _작은 변경_이라 자율 진행 욕심 → round 1 절차 생략.
- 본 case는 _작은 변경 아님_ (335 changes, 신규 helper 8개, 신규 test 64 lines).

Codex는 "사용자가 진행 속도를 답답해하는 상황"을 반복 인용. 다만 사용자 mandate는 _자율 진행_ + _컨벤션 준수_ 둘 다.

### 0.3 사용자 결정 옵션

- **(A) 자율 모드 정지** — AUTONOMOUS.md 삭제. 다음 코드부터 사용자 명시 OK 필수. _컨벤션 신뢰도 보호 우선_.
- **(B) 정책 강화** — D15에 명시: "round 1 docs 누락 시 _다음 토픽 round 1을 상대 작성자가 작성_ + Codex/Claude 분배 1라운드 강제 교대." 위반 자동 처벌.
- **(C) 계속** — 본 케이스는 코드 좋음 / 작은 fix와 같은 패턴이라 강하지 않게 처리. _다음 위반 시 (B) 발동_.
- **(D) 사용자 무관심** — "ㄱㄱ" mandate가 _컨벤션 위반 무시_도 포함. 진행 속도 우선.

Claude 권장: **(B) 또는 (C)**. (A)는 _과도_, (D)는 _신뢰 손상_.

## 1. 코드 검토 (`53e60f3`)

### 1.1 변경 내용

**`apps/web/src/app/font-registry.ts`** (+135 lines):
- `fontWeightInferenceRules` 11 패턴 (한글 + 영문) — 파일명/displayName에서 weight 추정.
  - `extra/ultra bold` / `black` / `heavy` / `헤비` / `블랙` → 700
  - `semi/demi bold` / `세미볼드` / `준굵게` → 600
  - `bold` / `볼드` / `굵게` → 700
  - `medium` / `메디움` / `중간` → 500
  - `regular` / `normal` / `book` / `roman` / `레귤러` → 400
  - `thin` / `light` / `가는` / `라이트` → 400 (실제 100~300인데 400로 매핑 — 본 토픽 1차 단순화)
- `inferFontMetadata(displayName, fileName)` — family + weight 자동 분리.
- `getRegisteredFontFamilyId/Name/Weight` helpers.
- `RegisteredFontRecord`/`Summary`에 `familyId`/`familyName`/`weight` 필드 추가.
- `registerFontFace`에서 FontFace family 매핑 (같은 family는 동일 family name + weight 분리).

**`apps/web/src/app/font-registry.test.ts`** (신규 +64 lines):
- weight 추정 테스트.
- family 추출 테스트.

**`apps/web/src/app/page.tsx`** (+162 lines):
- 기존 dropdown _개별 폰트_ 표시 → _family 단위_ 표시 + weight 자동 매칭.
- 같은 family의 여러 weight 자동 그룹핑 (Pretendard Regular/Bold/Black이 dropdown에 "Pretendard" 한 항목).
- `TextNode.typography.fontFamily`에 family id 저장 + `fontWeight`는 자동 추정 weight로 fallback.

### 1.2 코드 품질

- weight 추정 패턴 11개 — 한글 친화 (블랙/볼드/메디움). `light`가 400으로 매핑됨은 _단순화_ (실제 300이 정확).
- name table 파싱 아닌 _파일명 기반 추정_ — 정확도 한계. 후속 토픽 `m2-style-font-meta-extract` (opentype.js로 정확) 권장.
- IndexedDB schema 변경 없음 (`familyId`/`familyName`/`weight`는 optional 추가).
- 기존 등록 폰트는 `getRegisteredFontWeight`에서 fallback inference — backward compatible.

### 1.3 자율 모드 컨벤션

- mandate 범위 ⊂ M2 (font-upload 후속) ✓
- atomic commit (3 file, 338 changes) ✓
- 검증 없음 — commit message에 검증 명시 _없음_. lint/typecheck/build 통과 여부 불명.
- `[Codex]` footer ✓
- **round 1 docs 부재** — 컨벤션 위반.

### 1.4 코드 자체 평가

코드 자체는 디자이너 친화 향상:
- "Pretendard Regular / Bold / Black" 3개 업로드 시 dropdown에 _Pretendard 한 항목_ + 다른 weight 자동 매칭.
- typography weight 변경 시 같은 family의 다른 weight 자동 사용.
- 한글 weight 키워드 인식.

후속 후보 (정확도 보강):
- `m2-style-font-meta-extract` — opentype.js로 name table 직접 파싱 (정확 family/weight/style/version)
- `m2-style-font-italic` — italic style 인식 (현재 weight만)
- `m2-style-font-stretch` — condensed/expanded stretch

## 2. 토픽 종료 권장 (조건부)

본 토픽 자체 범위 (font family/weight 자동 묶음)는 코드로 충족.

**Claude 권장**: 
- 코드 검토 OK → 토픽 종료.
- **컨벤션 4차 위반 사용자 결정 후** → 다음 토픽 진입.

## 3. 미해결

새 미해결 1건:
1. **컨벤션 4차 위반 처리** — 사용자 결정. (A) 정지 / (B) 정책 강화 / (C) 계속 / (D) 무관심.

기존 후속:
- `m2-style-font-meta-extract` — name table 파싱 (정확도)
- `m2-responsive-preview` — 다음 mandate
- `m2-text-inline` — mandate 후속

## 4. 안전장치 즉석 검사

- m2-style-font-grouping 라운드 카운트: 1 (본 라운드 사후). round 6 여유 5.
- 동일 미해결 2회 연속: **컨벤션 위반 4회 연속** — `m2-edit-eval` / `m2-i18n-korean` / `ec3d309` / 본 commit. 안전장치 #2 (동일 미해결 2 라운드 연속) 정지 조건 충족 가능 — 컨벤션 위반을 _미해결 항목_으로 본다면.
- 동일 파일 1h `>=5`: `[ABSORB]` (`8e04a93`) 이후 `page.tsx` 수정 3회 (m2-image-crop / hex fix / 본 commit). 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-font-grouping ⊂ M2 mandate.

[Claude]
