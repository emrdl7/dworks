'use client'

// UX-05 Shift+drag 박스 선택 overlay + intersect-mode 노드 검출 헬퍼.
//
// 책임 분리 — 본 모듈은 _순수 시각/검출_ 로직만 담는다.
//   1) <BoxSelectOverlay /> — boxSelect state 받아 사각형 div 만 렌더 (상호작용 없음).
//   2) findNodesInBox(rect, exclude) — DOM 의 data-dworks-node-id 노드들과 박스의 client rect
//      intersect 검사 (Figma 표준 — overlap-mode 아님).
//
// page.tsx 가 다음을 보유 / 관장:
//   - boxSelect state ({ active, startX, startY, endX, endY }) — logical px.
//   - canvas wrapper 의 onMouseDown 에서 Shift+좌클릭+빈 공간 조건 분기.
//   - global mousemove/mouseup capture (useEffect) — drag 중 좌표 업데이트 + mouseup 시
//     intersect 검출 → setSelectedNodeId + setAdditionalSelectedNodeIds 호출.
//   - aria-live polite 영역에 "{N}개 노드 선택" 알림.
//
// 좌표계 주의 — boxSelect.startX/startY/endX/endY 는 _logical px_ (canvas wrapper scroll
// 적용 전 기준, zoom 도 적용 전). 본 컴포넌트는 canvas wrapper 의 바로 안쪽 absolute child
// 로 마운트되어 부모의 transform 영향을 받지 않고 그대로 layout 된다 — 즉 사용자가 보는
// "실제 zoom 된 좌표" 와 자연 일치.
//
// intersect 검사는 _client rect_ (zoom + scroll 모두 적용된 viewport 좌표) 로 수행하므로
// page.tsx 의 mouseup 핸들러에서 boxSelect.startX/startY 를 client 좌표로 역변환한 뒤
// findNodesInBox 에 전달한다.

import type { JSX } from 'react'

export interface BoxSelectOverlayProps {
  /** page.tsx 의 boxSelect.active — drag 진행 중일 때만 사각형 렌더. */
  active: boolean
  /** 박스 시작 X (logical px, canvas wrapper 기준). */
  startX: number
  /** 박스 시작 Y (logical px). */
  startY: number
  /** 박스 현재 끝 X (logical px). drag mousemove 마다 업데이트. */
  endX: number
  /** 박스 현재 끝 Y (logical px). */
  endY: number
}

/**
 * 박스 사각형 시각 렌더 — accent 50% border + 10% bg + z-index 200 (D-13).
 *
 * `pointer-events: none` 으로 박스 위 mouse 이벤트는 통과 — 자식 노드 hover/click 동작과
 * 충돌 없음 (intersect 검출 자체는 page.tsx 의 global mouseup 에서 처리).
 *
 * width/height 가 2px 미만이면 미렌더 — 클릭만 한 경우 화면 깜빡임 회피.
 */
export function BoxSelectOverlay(props: BoxSelectOverlayProps): JSX.Element | null {
  if (!props.active) return null
  const left = Math.min(props.startX, props.endX)
  const top = Math.min(props.startY, props.endY)
  const width = Math.abs(props.endX - props.startX)
  const height = Math.abs(props.endY - props.startY)
  // 최소 크기 미만이면 박스 미렌더 — drag 거리가 1px 도 안 되는 경우 시각 노이즈 회피.
  if (width < 2 && height < 2) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        left,
        top,
        width,
        height,
        zIndex: 200,
        // UI-SPEC line 211 / D-13 — accent (#6366f1) 50% border + 10% fill.
        border: '1px solid rgba(99, 102, 241, 0.5)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
      }}
    />
  )
}

/**
 * intersect-mode 노드 검출 — 박스 client rect 와 모든 `[data-dworks-node-id]` 엘리먼트의
 * `getBoundingClientRect()` 가 _부분적으로라도 겹치는지_ 검사 (Figma/Webflow 표준).
 *
 * intersect 조건 (4가지 모두 true): r.right > box.left, r.left < box.right,
 * r.bottom > box.top, r.top < box.bottom. — 즉 어느 한 축이라도 분리되어 있으면 false.
 *
 * @param boxClientRect - 박스의 viewport 기준 좌표 (client rect, zoom + scroll 적용 후).
 * @param excludeIds - 항상 매칭되므로 제외할 ID 집합 (보통 root 노드 id 1개).
 * @returns 박스 안에 일부라도 들어간 노드의 id 배열 (DOM 트리 순서, 중복 제거).
 */
export function findNodesInBox(
  boxClientRect: { left: number; top: number; right: number; bottom: number },
  excludeIds: ReadonlySet<string> = new Set(),
): string[] {
  // SSR safety — document 없는 환경 (test/server) 에서 안전하게 빈 배열.
  if (typeof document === 'undefined') return []
  const nodes = document.querySelectorAll<HTMLElement>('[data-dworks-node-id]')
  const selected: string[] = []
  // 같은 id 중복 매칭 방지 (만일 동일 노드가 여러 위치에 렌더된 경우 — 이론상 없음).
  const seen = new Set<string>()
  nodes.forEach((el) => {
    const id = el.dataset.dworksNodeId
    if (!id) return
    if (excludeIds.has(id)) return
    if (seen.has(id)) return
    const r = el.getBoundingClientRect()
    // intersect — 두 rect 가 어느 한 축이라도 겹치지 않으면 false.
    if (
      r.right > boxClientRect.left &&
      r.left < boxClientRect.right &&
      r.bottom > boxClientRect.top &&
      r.top < boxClientRect.bottom
    ) {
      selected.push(id)
      seen.add(id)
    }
  })
  return selected
}
