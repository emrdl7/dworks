# 2026-05-09 m2-style-image-filter-drop-shadow-multi round 1 — Claude

> 트리거: m2-style-image-filter-extra 후속 (1차 단일 dropShadow). m2-style-shadow-multi 패턴 추적.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

이미지에 다중 drop-shadow. 현재 단일 `dropShadow`만 — 디자이너가 컬러 그림자 / 입체감 / 글로우 합성 표현 위해 최대 3개 stack.

## 2. 1차 범위

- `imageFilterSchema`에 `dropShadows?: ImageDropShadow[]` 추가 — max 3 entries (`.max(3)`).
- 기존 `dropShadow?: ImageDropShadow` 유지 (primary). 둘 다 정의 시 emit 순서: `dropShadow → dropShadows[0] → [1] → [2]`.
- `getImageFilterCss`: 현재 `drop-shadow(...)` 단일 emit을 chain으로 확장 (각 항목 `drop-shadow(X Y blur color)` 별개 함수).
- UI: ImageCompositionControls "그림자" 활성 체크박스 아래 sub-group 안에 list pattern (m2-style-shadow-multi 참조) — 추가 / 삭제 / ↑↓ 정렬.
  - primary `dropShadow`는 sub-group 첫 entry로 표시 (이미 활성 체크박스가 켜져 있으면).
  - "추가" 버튼으로 dropShadows에 entry append (max 3 reached 시 disabled).

## 3. 1차 제외

- spread (CSS drop-shadow는 spread 미지원).
- inset shadow (CSS drop-shadow는 inset 미지원).
- 그림자별 opacity 분리 — color hex만 사용.

## 4. 충돌 / 회귀

- 기존 단일 dropShadow 사용 노드 회귀 0 — primary 위치 보존.
- dropShadows 미설정 노드 회귀 0 — 미emit.
- 기존 imageFilter 4 추가 필드와 결합 — emit 순서 끝에 기존 dropShadow + 신규 dropShadows append.
- imageFilter object의 size 증가 — tree-editor patch round-trip 정상 (배열 replace 패턴).

## 5. 구현

`packages/tree/src/schema.ts`:
- `imageFilterSchema.dropShadows = z.array(imageDropShadowSchema).max(3).optional()`.

`apps/web/src/app/page.tsx`:
- `getImageFilterCss`에서 dropShadow 처리 후 dropShadows 항목별 `drop-shadow(...)` push.
- ImageCompositionControls에 dropShadows list UI 추가:
  - 헬퍼: `addImageDropShadow()`, `removeImageDropShadow(index)`, `moveImageDropShadow(index, dir)`, `updateImageDropShadowsField(index, field, value)`.
  - 활성 체크박스가 켜져 있고 (= dropShadow 정의됨) 아래에 list 표시.
  - "추가" 버튼 (max 3 도달 시 disabled), 항목별 "↑↓ 삭제" 버튼.
  - 각 항목 4 input (X / Y / 흐림 / 색상) — 기존 ImageFilterInput 재사용.

## 6. 수락 기준

1. 그림자 활성 시 primary + "추가" 버튼 노출.
2. "추가" 버튼 클릭 시 sub-group에 새 entry append (default 값 IMAGE_DROP_SHADOW_DEFAULT).
3. 항목별 4 input 즉시 캔버스 반영 — chain CSS 합성.
4. 삭제 / ↑↓ 정렬 정상 동작.
5. max 3 도달 시 "추가" 버튼 disabled.
6. 미설정 노드 회귀 0 (primary 단일 사용 노드 포함).
7. typecheck/lint/build/tree test/tree-editor test 통과.

## 7. Codex 요청

1. 단일 `dropShadow` 보존 + 신규 `dropShadows` 배열 패턴 동의 (vs `dropShadows: [...]` 단일 array migration)?
2. max 3 (1 primary + 2 extras) 동의?
3. UI: 활성 체크박스 sub-group 안 list 패턴 (m2-style-shadow-multi 참조) 동의?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`3dc4d67`) 후 1회 (transform-3d feat). 2회까지 안전선.

[Claude]
