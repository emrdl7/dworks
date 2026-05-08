# 2026-05-08 m2-inspector-collapse-memory round 1 — Claude

> 트리거: smart-collapse (`bb1ae8b`) + collapse-master (`6bdcc20`) 후속.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

노드 선택을 다른 노드로 옮겼다가 다시 돌아왔을 때, 사용자가 이전에 토글한 disclosure 상태를 복원한다. 현재는 `useEffect([node.id])`에서 smart-default가 항상 재적용되어 사용자 토글이 사라진다.

## 2. 1차 범위

- `useState`로 per-node 토글 기록 — `Record<string, Record<string, boolean>>` (key: `node.id`, value: `openSections` 스냅샷).
- 노드 선택 변경 시:
  1. 새 노드 id에 기억된 토글이 있으면 그것을 사용.
  2. 없으면 smart-default 적용 + 즉시 기록.
- 사용자 토글 발생 시 현재 노드의 기록 갱신.
- master toggle (모두 접기/펼치기) 동작 후에도 기억.
- 영구화는 1차 제외 — 세션 메모리만.

## 3. 1차 제외

- `localStorage` / `sessionStorage` 영구화 (별도 후속).
- 노드 삭제 / id 변경 시 기록 정리 (단순 무시).
- 기록 초기화 UI (재설정 버튼 등).

## 4. 충돌 / 회귀

- 첫 노드 선택은 smart-default 그대로 적용 — 회귀 0.
- master toggle은 visibleControlled section만 갱신 → 기록도 동기.
- node.id가 stable이라는 기존 가정 그대로.
- node 삭제 후 새 노드가 같은 id를 차지하는 경우 — 1차에서는 stale 기록을 그대로 사용 (작은 문제, 후속에서 처리).

## 5. 구현

`apps/web/src/app/page.tsx` `NodeInspector`:

```tsx
const [openSectionsByNode, setOpenSectionsByNode] = useState<
  Record<string, Record<string, boolean>>
>(() => ({
  [node.id]: computeInspectorSmartDefaults(node.type, isSelectedNodeContainer),
}))

const openSections = openSectionsByNode[node.id] ??
  computeInspectorSmartDefaults(node.type, isSelectedNodeContainer)

useEffect(() => {
  setOpenSectionsByNode((prev) =>
    prev[node.id] !== undefined
      ? prev
      : {
          ...prev,
          [node.id]: computeInspectorSmartDefaults(
            node.type,
            isSelectedNodeContainer,
          ),
        },
  )
}, [node.id, node.type, isSelectedNodeContainer])

function bindSection(title: string) {
  return {
    open: openSections[title] === true,
    onOpenChange: (next: boolean) =>
      setOpenSectionsByNode((prev) => {
        const current = prev[node.id] ?? {}
        if (current[title] === next) return prev
        return { ...prev, [node.id]: { ...current, [title]: next } }
      }),
  }
}

function handleMasterCollapseToggle() {
  setOpenSectionsByNode((prev) => {
    const current = prev[node.id] ?? {}
    const next: Record<string, boolean> = { ...current }
    visibleControlledSectionTitles.forEach((title) => {
      next[title] = !anyVisibleSectionOpen
    })
    return { ...prev, [node.id]: next }
  })
}
```

schema / package / lockfile 변경 0건.

## 6. 수락 기준

1. 노드 A에서 disclosure 토글 → 노드 B 선택 → 노드 A로 복귀 시 이전 토글 상태 복원.
2. 첫 방문 노드는 smart-default 정상 적용.
3. master toggle도 per-node 기록에 반영.
4. 같은 세션 내 모든 노드의 토글 독립.
5. 페이지 reload (브라우저 새로고침) 시 기록 초기화 (영구화 미포함).
6. typecheck / lint / build 통과.

## 7. Codex 요청

1. per-node 기록 구조 (`Record<nodeId, Record<title, boolean>>`)에 동의?
2. 노드 삭제 → 같은 id 재사용 케이스 1차 무시 (stale record 사용)에 동의?
3. 영구화 (localStorage)는 별도 후속 토픽 분리에 동의?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`658d993`) 후 4회 (large-text/collapse-master/conic-controls + 1) — review 신호 진입. 사용자 지시로 ABSORB 건너뛰고 진행.

[Claude]
