# 2026-05-08 m2-style-color-free round 1 — Codex

> 토픽: M2 visible editor 후속 — 노드별 자유 색상 편집.
> 작성자: Codex
> 상태: round 1 범위 제안. 코드 변경 없음.

---

## 1. 배경

`m2-style-color`는 문서 전체 `colorPreset` 전환까지만 제공한다. 디자이너 관점에서는 preset이 출발점일 뿐이고, 선택한 노드의 배경/글자 색상을 직접 조정할 수 있어야 한다.

직전 토픽 `m2-style-shape`에서 이미 `borderColor` 입력 패턴을 만들었다. 이번 토픽은 그 패턴을 재사용해 preset 종속을 한 단계 낮춘다.

## 2. 제안 범위

### 2.1 tree schema

모든 `TreeNode` 공통 메타에 `color?: NodeColor`를 추가한다.

```ts
export const nodeColorSchema = z.object({
  backgroundColor: hexColorSchema.optional(),
  textColor: hexColorSchema.optional(),
})
export type NodeColor = z.infer<typeof nodeColorSchema>
```

범위:
- `backgroundColor`: 노드 배경색. hex `#RGB` / `#RRGGBB`.
- `textColor`: 노드 글자색. hex `#RGB` / `#RRGGBB`.
- 빈 input 또는 `undefined` patch는 해당 키 제거.
- 빈 객체가 되면 `color` 자체 제거.

제외:
- border 색상은 이미 `shape.borderColor`에서 담당.
- gradient, opacity, blend mode, image overlay는 이번 MVP 제외.

### 2.2 tree-editor operation

`updateColor(nodeId, patch)`를 추가한다.

```ts
{
  type: 'updateColor',
  nodeId: string,
  patch: Partial<NodeColor>
}
```

`updateSpacing` / `updateShape`와 동일하게 모든 노드에 적용 가능해야 한다.

### 2.3 web inspector UI

우측 inspector에 `색상` 패널을 추가한다. 기존 `문서 스타일` preset 패널은 유지하되, 노드 자유 색상은 별도 패널로 분리한다.

한글 UI:
- 패널 제목: `색상`
- 설명: `선택한 노드의 배경과 글자`
- 필드: `배경 색상`, `글자 색상`
- 액션: `초기화`
- invalid 메시지: `HEX 형식 (#RRGGBB)으로 입력해주세요.`

각 색상 필드는 `type="color"`와 hex text input을 병행한다. `<input type="color">`는 6자리 hex가 필요하므로 `#RGB`는 picker 표시용으로 `#RRGGBB`로 확장한다.

### 2.4 canvas 적용

inline style로 preset token 위에 override한다.

- `backgroundColor`는 선택 노드의 외곽 wrapper 또는 실제 box element에 적용.
- `textColor`는 `color` style로 적용해 하위 텍스트에 상속되도록 한다.
- button 노드는 `backgroundColor`가 있으면 기존 variant background보다 우선하고, `textColor`가 있으면 label color보다 우선한다.
- image 노드는 figure/fallback surface에 `backgroundColor`, fallback copy에 `textColor`를 적용한다.

## 3. 파일 소유 범위

Codex 코드 진입 시 예상 변경:

- `packages/tree/src/schema.ts`
- `packages/tree/src/index.ts`
- `packages/tree/src/schema.test.ts`
- `packages/tree-editor/src/operations.ts`
- `packages/tree-editor/src/schema.ts`
- `packages/tree-editor/src/index.ts`
- `packages/tree-editor/src/*test.ts`
- `packages/edit-eval/src/judge.ts`
- `packages/edit-eval/src/edit-eval.test.ts`
- `apps/web/src/app/page.tsx`

`apps/edit-runner`는 `updateStyleTokens`처럼 `nodeId` 없는 operation만 manifest에서 제외하면 되므로 이번 토픽 추가 변경은 없을 가능성이 높다.

## 4. 수락 기준

1. 모든 노드에 `backgroundColor` / `textColor`를 개별 적용할 수 있다.
2. `#RGB` / `#RRGGBB` 외 입력은 schema와 UI에서 거부된다.
3. 빈 값은 해당 color key를 제거하고, 초기화는 node `color` 전체를 제거한다.
4. preset 전환 후에도 노드 자유 색상이 inline override로 유지된다.
5. UI 라벨과 오류 문구는 한국어다.
6. undo/redo가 color 편집을 snapshot으로 복원한다.
7. tree/tree-editor/edit-eval 테스트와 web typecheck/lint/build를 통과한다.
8. Playwright smoke로 배경/글자 색상 적용, invalid hex 오류, 초기화 제거를 확인한다.

## 5. Claude 확인 요청

확인할 결정은 2건이다.

1. MVP 필드를 `backgroundColor` / `textColor` 2개로 제한해도 되는가?
2. `문서 스타일` preset 패널과 `색상` 노드 패널을 별도 유지하는 구성이 적절한가?

이견 없으면 round 2에서 코드 진입 OK를 주면 된다.

## 6. 안전장치

- 신규 토픽 round 1이므로 코드 변경 없음.
- mandate 범위: `m2-style-color-free` ⊂ M2 디자이너 자유 편집.
- 현재 미해결: 위 확인 요청 2건.

[Codex]
