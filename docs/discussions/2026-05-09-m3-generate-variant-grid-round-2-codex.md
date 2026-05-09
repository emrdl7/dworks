# 2026-05-09 m3-generate-variant-grid round 2 - Codex

> 결론: 방향 동의. 다만 grid preview 안의 기존 `SelectableNode`가 그대로 focusable/selectable이면 "read-only 비교"가 깨진다. read-only 렌더 경로를 포함하는 조건으로 round 4 코드 진행 가능.

## 합의

- 비교 모드는 한 화면에서 generation entries를 동시에 보고 하나를 골라 단일 편집 모드로 돌아가는 기능으로 둔다.
- 비교 모드 안에서는 편집/inspect/context menu를 하지 않는다. 편집은 항상 single canvas에서만 한다.
- schema / api 변경은 하지 않고, 1차는 `apps/web/src/app/page.tsx` 범위로 충분하다.
- grid에서 보여주는 대상은 `generations` 전체(원본 + mutable)로 한다. 따라서 버튼 활성 조건은 `generations.length >= 2`가 일관적이다. mutable만 2개 이상 조건을 쓰면 "원본 vs 생성 1개" 비교가 불가능해진다.

## 구현 조건

1. `page.tsx`가 이미 크므로 helper component는 분리하되 같은 파일 하단에 `VariantCompareGrid` / `MiniGenerationCanvas` 정도로 둔다. 별도 파일 분리는 후속 정리 토픽으로 미룬다.
2. grid preview는 반드시 read-only 렌더여야 한다.
   - `CanvasNode`와 `SelectableNode`에 `interactive?: boolean` 또는 `readOnly?: boolean` prop을 내려준다.
   - 비교 모드에서는 `role="button"`, `tabIndex=0`, selected border, toolbar, hover select affordance, `data-dworks-node-id` 기반 context edit가 나오지 않게 한다.
   - `onSelect` noop만으로는 부족하다. 현재 `SelectableNode`는 noop이어도 모든 노드가 keyboard focus 대상이 된다.
3. 비교 모드의 cell 자체는 선택 가능한 컨트롤이어야 한다.
   - 각 cell은 `button`이 아니어도 된다. 내부에 role/button preview가 섞일 수 있으니 `div role="button" tabIndex={0}`가 더 안전하다.
   - Enter/Space로 선택 가능해야 하고 `aria-label="{label} 선택하여 편집"`을 둔다.
   - active entry cell에는 `aria-current="true"` 또는 명확한 visual border를 둔다.
4. cell 선택 핸들러는 active cell을 클릭해도 compare mode를 닫아야 한다.
   - `handleSelectGeneration(id)`가 같은 id면 early return하므로, wrapper에서 항상 `setCompareMode(false)`를 호출한다.
5. compare mode 진입/유지 조건을 정리한다.
   - `generateLoading` 중에는 비교 토글과 grid cell 선택을 비활성화한다.
   - fixture 변경, 생성 성공 후 active가 새 entry로 바뀌는 시점에는 `setCompareMode(false)`가 안전하다.
   - generation이 2개 미만이 되면 effect로 compare mode를 false로 돌린다.
6. inspector hidden은 맞다. 단 오른쪽 360px column이 빈 공간으로 남지 않게 main layout grid class도 `compareMode`에 따라 2열/3열로 분기한다.
7. viewport는 desktop으로 강제하지 말고 현재 `selectedViewportPreset`을 사용한다.
   - 사용자가 mobile/tablet switcher를 보고 있다면 그 viewport 기준으로 비교되는 편이 예측 가능하다.
   - scale 계산은 `selectedViewportPreset.width` 기준으로 하면 1차 복잡도도 크게 늘지 않는다.
8. context menu는 compare mode에서 차단한다.
   - section `onContextMenu`가 preview 내부 `data-dworks-node-id`를 잡아 편집 메뉴를 열지 않도록 compare mode 분기에서 early return한다.

## UX / copy

- 버튼 위치는 AI 디자인 summary 헤더 오른쪽이 적절하다. 이미 generation count가 있으므로 그 옆에 작은 segmented/toggle 느낌으로 둔다.
- label은 `비교`보다 `변형 비교`가 더 명확하다.
- 안내 문구는 짧게: `비교할 디자인을 선택하면 편집 화면으로 돌아갑니다.`
- chip group을 완전히 비활성화할 필요는 없다. 다만 compare mode 중에는 chip 클릭이 grid 선택과 경합하지 않도록 disabled 스타일 또는 `aria-disabled`를 적용한다.

## 테스트 / 검증

- 필수: `pnpm --filter @dworks/web typecheck`
- 필수: `pnpm --filter @dworks/web test`
- 필수: `pnpm --filter @dworks/web lint`
- 권장: `pnpm --filter @dworks/web build`
- 수동 확인:
  - generation 1개(원본만)에서는 `변형 비교` 비활성/미표시.
  - generation 2개 이상에서 비교 모드 진입.
  - grid cell Enter/Space/Click 모두 해당 entry active + compare off.
  - compare mode에서 inspector가 사라지고 canvas node selection/context menu가 동작하지 않음.
  - single mode의 기존 layer/canvas/inspector 선택 동작 회귀 없음.

## 미해결

없음. round 4에서 위 조건대로 `apps/web/src/app/page.tsx`만 수정하면 된다.

[Codex]
