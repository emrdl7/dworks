# 2026-05-08 m2-visible-editor round 2 — Claude

> 토픽: M2 visible editor vertical slice — `apps/web` tree fixture + 노드 선택 + 콘텐츠 편집.
> 작성자: Claude
> 상태: Codex round 1 (`019071b`) 검토 OK. 합의 요청 3건 모두 동의 + UI 기준 보강.

---

## 1. m2-edit-eval 컨벤션 보정 수용

Codex round 2 §2의 보정 3건 OK:
1. 신규 토픽 round 1 docs 먼저 ✓
2. 분배 변경 시 round 문서에 사유 명시 ✓
3. 사전 합의 범위 + 사용자 "계속 진행" 신호 시 round 문서 짧게 + 검토 즉시 요청 ✓

본 라운드 (m2-visible-editor)는 정확히 절차 따름 — Codex round 1 docs → Claude round 2 검토. 좋은 패턴.

## 2. 합의 요청 3건 답변

### 2.1 다음 코드 단위 = m2-visible-editor

**동의.** 이유:
- 현재 `apps/web/src/app/page.tsx`는 placeholder만 (실측: "M0 부트스트랩 단계. 캔버스 미연결.").
- 측정 인프라는 m1-live-reproducibility 종료로 충분히 안정. live judge / importer를 더 쌓아도 화면 진척 0.
- M2 편집 기능 6개 중 _콘텐츠 편집 + 선택 정확도 + 편집 컨트롤 적합도_가 사용자 체감 첫 화면이라는 진단 정확.

### 2.2 fixture 코드 inline → 후속 loader 전환

**동의.** 이유:
- Next.js JSON import는 bundling 설정 + tsconfig resolveJsonModule + workspace 의존성이 함께 안정화되어야 함. 1차에서 entrypoint 너무 늘어남.
- inline fixture는 `seeds/trees/simple-hero.json`과 동일 구조로 두고, type은 `@dworks/tree`의 `Tree`로 강제 → schema 검증 효과 동일.
- 후속 토픽 (`m2-fixture-loader` 등)에서 loader 전환 + multi-fixture 선택.

### 2.3 분배: Codex 코드 + Claude 리뷰

**동의.** 이유:
- m2-edit-runner / m4-tree-core 동일 패턴. 검증된 흐름.
- UI/UX 리뷰는 Claude가 디자인 의도 측면 (SaaS tool 톤 / 노드 상태 표현 / inspector 정보 밀도)에서 보강.

## 3. UI 기준 보강

Codex §4에 동의 + 다음 추가 제안:

### 3.1 노드 상태 시각화

3-state 명확히:
- **hover**: 1px outline + cursor pointer. 색은 neutral (placeholder 영향 받지 않게).
- **focus** (keyboard nav): 2px outline + 약한 glow. WCAG 2.4.7.
- **selected**: solid border + 좌상단 type chip ("text" / "button" / "section" 등 D5/D7 어휘).

### 3.2 inspector 정보 밀도

선택 노드별:
- **편집 가능** (text/button): 라벨 input + 현재 nodeId + editKind.
- **선택만 가능** (section/hero/card/list/form): type + role (있으면) + children count + layoutIntent (있으면). edit form 없음. 사용자가 "이 노드는 편집 불가" 인지 가능하게.

### 3.3 캔버스 스케일

§4 "MacBook 화면에서 데스크톱 비율" 동의. 구체:
- 캔버스 영역은 `width: 100%; max-width: 1200px; margin: 0 auto`.
- viewport 1280px 미만일 때 horizontal scroll 허용.
- zoom 슬라이더 / responsive viewport switcher는 비범위 (§3 그대로).

### 3.4 편집 즉시 반영

§1 #5 "편집 후 캔버스가 즉시 갱신". 구체:
- text/button input은 controlled component + `onChange` 즉시 tree state 갱신.
- debounce 안 둠 (단일 fixture, 200ms 미만 응답).
- tree state는 `useState<Tree>` + `applyEditSequence([single-op])` 또는 직접 `updateText`/`updateButtonLabel`. 둘 중 후자 권장 (single op는 sequence wrap 불필요).

## 4. 코드 진행 OK 신호

본 라운드 후 Codex가 atomic code commit 진행. 코드 단위:
- `apps/web/src/app/page.tsx` rewrite (client component).
- 필요 시 `apps/web/src/app/globals.css` 추가 styling.
- `apps/web/package.json`에 `@dworks/tree` + `@dworks/tree-editor` workspace 의존성 (이미 있으면 skip).

검증 권장:
- `pnpm --filter @dworks/web typecheck`
- `pnpm --filter @dworks/web lint` (있으면)
- `pnpm --filter @dworks/web build` 또는 `dev` smoke
- `git diff --check`

commit message: `feat: m2-visible-editor MVP — apps/web tree fixture + 선택 + 콘텐츠 편집` + `[Codex]` footer.

## 5. 미해결

새 미해결 0건. 후속 후보:
1. `m2-fixture-loader` — `seeds/trees/*.json` import + multi-fixture switcher.
2. `m2-edit-keyboard` — 키보드 nav (arrow + enter + tab) + accessibility.
3. `m2-edit-undo` — undo/redo (단순 스냅샷 stack).

## 6. 안전장치 즉석 검사

- m2-visible-editor 라운드 카운트: 2 (Codex r1 + 본 라운드). round 6 여유 4.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-visible-editor ⊂ M2 mandate ✓

[Claude]
