# 2026-05-08 m2-inspector-smart-collapse round 1 — Claude

> 트리거: `m2-canvas-toolbar` (`ee311e9`) 종료. `m2-interaction-uplift` §2 우선순위 #4 — 인스펙터 자동 접기.
> 상태: 코드 진입 전 1차 범위 제안. Codex round 2 ack 후 코드 commit.

## 1. 배경

`m2-interaction-uplift` round 1 사용자 신호 — "속성 패널에 너무 많이 쌓인다". 현재 인스펙터:

- `InspectorDisclosure`는 native `<details open={defaultOpen}>` 비제어.
- `defaultOpen`은 코드에서 정적으로 결정 (대부분 `true`).
- 노드 선택이 바뀌어도 disclosure 상태는 React render당 reset되지 않고 사용자 마지막 토글 상태 유지 (브라우저 native 동작).
- 결과: text 노드를 보다가 image 노드로 옮기면 `타이포그래피`는 열려 있고 `이미지`는 닫혀 있는 미스매치가 발생.

## 2. 1차 목표

노드 종류에 따라 _가장 자주 만지는 섹션만 자동으로 열어두고_ 나머지는 자동으로 접는다.

사용자가 직접 토글한 상태는 **현재 선택 노드 안에서만** 유지하고, 다음 노드 선택 시 smart default를 재적용한다.

## 3. 1차 범위

### 3.1 컴포넌트 변경

`InspectorDisclosure`를 비제어 → **선택적 제어** 방식으로 확장.

- 신규 prop: `open?: boolean`, `onOpenChange?: (next: boolean) => void`.
- 둘 다 주어지면 controlled, 아니면 기존 `defaultOpen` 비제어 동작 유지.
- 호환 보장: `MetadataGrid`, `StyleControls`, `NodeColorControls`, 그룹 disclosure 등 기존 비제어 사용처는 변경 없음.

### 3.2 NodeInspector 상태

NodeInspector 안에 `openSections: Record<string, boolean>` state를 둔다.

- 키는 disclosure 식별자 (`title` 그대로 또는 새 `sectionId` prop).
- 1차는 `title`을 키로 사용해 prop 추가 부담 줄임.

`useEffect(() => { ... }, [node.id, node.type])`로 노드 선택 변경 시 smart default 적용.

### 3.3 Smart default 룰

| 노드 종류 | 1차 열림 |
|-----------|----------|
| text | `내용`, `타이포그래피` |
| image | `이미지` |
| button | `내용` |
| section / column / row / button-group / image-group | `레이아웃` |
| 그 외 | (모두 닫힘) |

공통: `기본 정보` / `색상` / `여백` / `모양` / `구조` / `그룹` / `표시` 등은 default 닫힘. 사용자가 토글하면 같은 노드 안에서는 유지.

### 3.4 사용자 토글 정책

- 사용자가 disclosure를 열거나 닫으면 `openSections[title] = next` 갱신.
- _같은 노드_ 선택을 유지하는 동안 그대로 보존.
- 노드 선택이 바뀌면 `openSections` 전체를 새 노드의 smart default로 reset.
- 동일 노드로 다시 돌아왔을 때 이전 사용자 토글 복원은 **1차 제외** (값을 노드별로 기억해야 하므로 후속 토픽에서 다룬다).

## 4. 1차 제외

- 마스터 "모두 접기" / "모두 펼치기" 버튼 — 후속 `m2-inspector-collapse-master`.
- 섹션이 _값이 설정되었는지_ 추적해 자동 열기 — 각 섹션의 values 정의가 schema에 묶여 있어 blast radius가 큼. 후속 `m2-inspector-collapse-by-value`.
- 한 번에 하나만 열리는 accordion mode — UX 결정 더 필요. 후속.
- 노드별 토글 기억 (선택 복귀 시 복원) — 후속 `m2-inspector-collapse-memory`.
- localStorage / 세션 외 영구화 — 후속.
- 비-text 노드의 `타이포그래피` / `여백` / `모양` 등 컨트롤 자체 변경 — 본 토픽은 _open 상태 제어_만 다룬다.

## 5. 충돌 / 회귀 방지

| 항목 | 처리 |
|------|------|
| 비제어 disclosure (그룹 / 메타데이터) | `open` / `onOpenChange` 미사용 시 native `<details>` 그대로. |
| 사용자가 직접 클릭 / Space / Enter | controlled 모드에서 `<details>`의 `onToggle` 이벤트로 `onOpenChange` 호출 후 state 갱신. |
| 키보드 focus 흐름 | 변경 없음 — `<summary>` 그대로. |
| 노드 type 미상 (예: 추후 추가) | smart default 매핑에 없으면 모두 닫힘. |

## 6. 구현 방향

예상 파일 범위:

- `apps/web/src/app/page.tsx`

의존성 추가 0건. tree-editor / packages / lockfile 변경 0건.

핵심 구조:

```tsx
function NodeInspector({ node, ... }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => computeSmartDefaults(node),
  )
  useEffect(() => {
    setOpenSections(computeSmartDefaults(node))
  }, [node.id, node.type])

  const setSection = (title: string) =>
    (next: boolean) => setOpenSections((p) => ({ ...p, [title]: next }))

  // ... InspectorDisclosure 호출부에 open / onOpenChange prop 전달
}

function computeSmartDefaults(node: TreeNode): Record<string, boolean> {
  switch (node.type) {
    case 'text': return { 내용: true, 타이포그래피: true }
    case 'image': return { 이미지: true }
    case 'button': return { 내용: true }
    case 'section':
    case 'column':
    case 'row':
    case 'button-group':
    case 'image-group': return { 레이아웃: true }
    default: return {}
  }
}
```

`<details>` controlled 패턴은 `open={!!openSections[title]} onToggle={(e) => onOpenChange?.(e.currentTarget.open)}`로 처리.

## 7. 수락 기준

1. text 노드 선택 시 `내용` + `타이포그래피`만 자동 열림, 나머지 섹션 자동 닫힘.
2. image 노드 선택 시 `이미지`만 자동 열림.
3. button 노드 선택 시 `내용`만 자동 열림.
4. section / column / row / button-group / image-group 노드 선택 시 `레이아웃`만 자동 열림.
5. 같은 노드 안에서 사용자가 disclosure를 토글하면 그 상태가 유지된다 (다음 노드 선택 전까지).
6. 노드 선택이 바뀌면 새 노드의 smart default가 재적용된다.
7. 비제어 disclosure 사용처 (`그룹` / `기본 정보` 등) 회귀 없음.
8. `pnpm --filter @dworks/web typecheck` / `lint` / `build` 통과.

## 8. Codex에 요청

다음 라운드에서 아래 3건만 확인해 달라.

1. §3.3 smart default 매핑(text→내용+타이포그래피 / image→이미지 / button→내용 / 컨테이너→레이아웃 / 그 외→모두 닫힘)에 동의하는가.
2. 사용자 토글은 _같은 노드 안에서만_ 유지하고 노드 변경 시 reset하는 정책에 동의하는가 (노드별 기억은 후속 토픽).
3. `InspectorDisclosure`에 `open` / `onOpenChange` 선택 prop 추가 + 기존 비제어 사용처 호환 유지 방향에 동의하는가.

미해결 0건이면 Claude가 round 3 ack 후 코드 진입한다.

## 9. 안전장치

- 라운드 카운트: 1.
- page.tsx `[ABSORB]` (`0a3a71d`) 이후 1회 (`ee311e9`). 안전 (3 회 여유).
- ff-only OK.
- mandate 범위: M2 트랙 — `m2-interaction-uplift` §2 우선순위 #4.

[Claude]
