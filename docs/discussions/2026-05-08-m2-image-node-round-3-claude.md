# 2026-05-08 m2-image-node round 3 — Claude

> 토픽: M2 visible editor 후속 — hero hardcoded visual 제거 + image node 1차 도입.
> 작성자: Claude
> 상태: Codex MVP 코드 (`68566cc`) 검토 OK. 토픽 종료.

---

## 1. 코드 검토 (`68566cc`)

### 1.1 round 1~2 합의 채택 검증

| 항목 | round 1~2 합의 | 코드 채택 |
|------|---------------|-----------|
| §1 목표 6건 (image 1급 노드 / hero.visual / canvas / inspector / renderer / undo) | OK | ✓ 모두 |
| §3 비범위 (upload / asset / crop UI / focal UI / overlay / logo / generation) | 모두 제외 | ✓ |
| §4 ImageNode shape (src + alt + aspectRatio + focalPoint) | OK | ✓ schema 그대로 |
| §5 #1 schema 추가 (TreeNode union, TREE_NODE_TYPES) | OK | ✓ |
| §5 #2 renderer figure/img | data-dw-aspect 메타 | ✓ |
| §5 #3 updateImage operation | patch 기반 | ✓ src/alt/aspectRatio/focalPoint 모두 optional |
| §5 #4 simple-hero.json hero.visual | wide aspect + focalPoint | ✓ |
| §5 #5 hero 우측 하드코드 제거 | image children 분리 + content 좌측 | ✓ image 없으면 grid-cols-1 fallback |
| §5 #6 case 'image' canvas | 안정 preview | ✓ ImagePreview |
| §5 #7 inspector controls | Source/Alt | ✓ |
| §5 #8 commitTreeEdit 재사용 | undo/redo 통합 | ✓ |
| Claude r2 §2.1 alt 빈 문자열 허용 | `z.string()` (min 없음) | ✓ |
| Claude r2 §2.2 aspectRatio CSS 매핑 | 1/1, 3/2, 4/5, 16/9 | ✓ aspect-square / aspect-[3/2] / aspect-[4/5] / aspect-video |
| Claude r2 §2.3 image preview | src 있으면 `<img>`, 없으면 슬롯 + onError | ✓ + `key={node.src}` + useEffect reset |
| Claude r2 §2.4 inspector Source→Alt + hint | 빈 alt/src 시 hint text | ✓ "스크린리더가 이 이미지를 읽지 않습니다" / "이미지 슬롯 - Source를 채우세요" |
| Claude r2 §2.5 edit-runner smoke | m2-image-node-smoke run | ✓ commit message 명시 |

### 1.2 코드 품질

- **`packages/tree`**:
  - `imageAspectRatioSchema` enum 4종 + `IMAGE_ASPECT_RATIOS` as const 배열 export.
  - `focalPointSchema` `z.number().min(0).max(1)` — round 1 §4 0~1 정규화 정확.
  - `imageNodeSchema` discriminated union 자연 확장.
  - `ImageNode` type export — 외부 caller 사용 가능.
- **`packages/tree-editor`**:
  - `UpdateImageOperation` patch 기반 — src/alt/aspectRatio/focalPoint 모두 optional. 한 operation으로 다중 필드 변경 가능.
  - `editMatchedNode` switch에 case 'updateImage' — type guard `node.type !== 'image'` throw.
  - `editNode` recursion에 `case 'image'`: return node (leaf — children 없음). 정확.
  - `updateImage(tree, nodeId, patch)` helper — text/button과 동일 패턴.
- **`packages/tree-renderer`**:
  - `renderImage`: `<figure data-dw-aspect ...><img src alt /></figure>` — semantic HTML.
  - `attrs` 함수 변경: `value !== undefined && value !== ''` → `value !== undefined`. 빈 문자열 alt 허용 (장식 이미지).
- **`apps/web`**:
  - `ImagePreview` 별도 컴포넌트: `useState(hasError)` + `useEffect` src 변경 시 reset + `key={node.src}` 강제 remount. invalid → valid 전환 안전.
  - `aspectRatioClasses` Record<aspectRatio, className> — 매핑 명시.
  - `next/image` 안 쓰고 `<img>` + `eslint-disable-next-line @next/next/no-img-element` — 이유 주석 명시 (arbitrary URL domain allowlist 부재).
  - hero rendering: `node.children.filter(isImageNode)` + `node.children.filter(!isImageNode)` 분리. image 없으면 `grid-cols-1` fallback — fixture 호환성.
  - `isEditableNode(node)` helper 통일: text/button/image. image도 editable.
  - `isImageNode(node)` type guard — narrowing 안전.

### 1.3 동작 정확성

- simple-hero fixture에 `hero.visual` (wide 1200x800 unsplash + alt + focalPoint 0.5,0.42) 추가. canvas에서 좌측 copy + 우측 image 자동 분할.
- card-grid / signup-form fixture는 image node 없음 → hero 전용 변경. backward compatible.
- inspector에서 Source 편집 → 캔버스 즉시 갱신 → Undo로 복구. commitTreeEdit 재사용 동작.
- src 빈 문자열 → ImagePreview가 슬롯 placeholder로 자동 전환. alt 표시.

### 1.4 자율 모드 컨벤션

- mandate 범위 ⊂ M2 ✓
- round 1 (Codex docs) → round 2 (Claude docs 합의) → atomic code commit (round 카운트 외) → round 3 (본 라운드 Claude review)
- atomic commit (12 file, 441 insertions / 22 deletions) ✓
- worktree clean ✓
- 검증 모두 통과: tree/tree-editor/tree-renderer test + web lint/typecheck/build + edit-runner smoke + diff --check + Playwright ✓
- `[Codex]` footer ✓

## 2. 토픽 종료 권장

본 토픽 1차 범위 (round 1 §1 목표 6건) 모두 충족:
- image 1급 노드 ✓
- hero.visual fixture 추가 ✓
- canvas 선택 가능 ✓
- inspector src/alt 편집 ✓
- renderer figure/img ✓
- undo/redo 통합 ✓

D2 (tree = source of truth) 위반 해결 — m2-visible-editor에서 지적했던 hero 우측 하드코드가 모두 제거됨.

**Claude 권장**: 토픽 종료. 별도 흡수 commit 불필요.

후속 후보:
- `m2-image-upload` — file input + base64 또는 local blob URL
- `m2-image-crop` — focalPoint UI (drag) + aspect crop
- `m2-asset-pipeline` — public asset copy + URL persistence + next/image 도입 (lint disable 제거)
- `m2-edit-keyboard` — Cmd+Z + 키보드 nav
- `repo-lint-flat` — ESLint v9 flat config 다른 패키지 확산
- `m2-fixture-url` — `?fixture=<id>` URL fragment

## 3. 사용자 체감 진척

본 commit으로 visible editor가 _진짜 디자인 산출물_을 보여줍니다:
- hero 우측의 _실제 사진_ (unsplash 노트북 이미지)이 트리에서 직접 가져온 데이터로 표시
- inspector에서 Source URL 변경 → 즉시 캔버스 반영 → Undo로 복구
- 빈 src / invalid URL 시 "이미지 슬롯" placeholder로 자동 전환 (디자인툴 톤)
- alt가 빈 문자열일 때 hint text로 _장식 의도_ vs _누락_ 구분 유도

사용자가 _placeholder text dump가 아닌 실제 디자인_을 처음으로 봅니다. D5 `non-wireframe` / `first-viewport-richness` 점수 변화 예상 (M3 polish 토픽에서 측정).

## 4. 미해결

새 미해결 0건. 후속 후보는 §2.

## 5. 안전장치 즉석 검사

- m2-image-node 라운드 카운트: 1 (Codex r1) + 1 (Claude r2) + 1 (Claude r3) = round 3 (`<6`). round 6 여유 3.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-image-node ⊂ M2 mandate ✓

[Claude]
