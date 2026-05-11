'use client'
// VIS-01 12-col grid overlay — CONTEXT.md D-01..D-05 잠금.
// 캔버스 viewport box 안에 12 column + 11 gutter(16px) 박스를 absolute 자식으로 배치한다.
// D-01: enabled=false 면 null 반환(얼리 리턴). 토글 state 는 page.tsx 가 소유.
// D-02: column α=0.06, gutter α=0.10 (--dw-ui-accent = #6366f1 기준 rgba).
// D-03: zIndex 50 — 노드 위 / NodeContextMenu(z-index ~100) 아래.
// canvasZoom 보정 코드 없음 — viewport box 가 CSS `zoom: canvasZoom`(page.tsx:5246) 으로
// scale 되므로 내부 absolute 자식은 zoom 을 자동 추종한다. canvasZoom prop 은 향후 zoom-aware
// 보정이 필요할 경우의 분기 위치 확보용으로만 받는다(시그니처 일관성).
// 좌표계: containerWidth 는 selectedViewportPreset.width(logical px) — viewport-aware.

import { type CSSProperties, type ReactElement, type RefObject } from 'react'

// D-02 column 배경색(--dw-ui-accent #6366f1, α=0.06).
const COLUMN_BG_COLOR = 'rgba(99, 102, 241, 0.06)'
// D-02 gutter 배경색(α=0.10 — column 보다 약간 짙음).
const GUTTER_BG_COLOR = 'rgba(99, 102, 241, 0.10)'

export interface GridOverlayProps {
  // D-01 토글 state. false 면 null 반환.
  enabled: boolean
  // 기본 12 (D-02 잠금) — 임의 column count 는 v3.0 deferred.
  columnCount: number
  // 기본 16 (D-02 잠금).
  gutterPx: number
  // selectedViewportPreset.width — viewport-aware logical px.
  containerWidth: number
  // page.tsx canvasZoom — 시그니처 일관성용 (사용 안 함, 자동 추종).
  canvasZoom: number
  // canvas wrapper(canvasScrollRef). props 일관성 유지 — 본 컴포넌트는 _viewport box_ 내부에
  // 마운트되므로 직접 참조하지 않지만, 추후 wrapper-기준 좌표 계산이 필요할 때 사용.
  canvasWrapperRef: RefObject<HTMLElement | null>
}

export function GridOverlay(props: GridOverlayProps): ReactElement | null {
  const { enabled, columnCount, gutterPx, containerWidth } = props
  if (!enabled) return null
  // column 1개 폭(logical px). containerWidth - (columnCount-1)*gutter 를 columnCount 로 등분.
  const colWidth =
    (containerWidth - (columnCount - 1) * gutterPx) / columnCount
  if (colWidth <= 0) return null

  // wrapper style — viewport box 내부 absolute child (parent 에 relative 필요).
  const wrapperStyle: CSSProperties = {
    zIndex: 50,
  }

  // 12 column + 11 gutter 박스 좌표 계산.
  const blocks: Array<{
    key: string
    kind: 'column' | 'gutter'
    left: number
    width: number
  }> = []
  for (let i = 0; i < columnCount; i += 1) {
    const left = i * (colWidth + gutterPx)
    blocks.push({ key: `col-${i}`, kind: 'column', left, width: colWidth })
    if (i < columnCount - 1) {
      blocks.push({
        key: `gut-${i}`,
        kind: 'gutter',
        left: left + colWidth,
        width: gutterPx,
      })
    }
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={wrapperStyle}
    >
      {blocks.map((b) => (
        <div
          key={b.key}
          className="absolute"
          style={{
            left: b.left,
            top: 0,
            width: b.width,
            height: '100%',
            backgroundColor:
              b.kind === 'column' ? COLUMN_BG_COLOR : GUTTER_BG_COLOR,
          }}
        />
      ))}
    </div>
  )
}

// VIS-01 D-04 — column edges 배열 계산. snap 대상은 column 시작점/끝점 양쪽 + viewport 끝.
// containerWidth, columnCount, gutterPx 입력으로 정렬된 logical px 좌표 배열을 반환한다.
export function computeColumnEdges(
  containerWidth: number,
  columnCount = 12,
  gutterPx = 16,
): number[] {
  const colWidth = (containerWidth - (columnCount - 1) * gutterPx) / columnCount
  if (colWidth <= 0) return []
  const edges = new Set<number>()
  for (let i = 0; i < columnCount; i += 1) {
    const start = i * (colWidth + gutterPx)
    edges.add(start)
    edges.add(start + colWidth)
  }
  return Array.from(edges).sort((a, b) => a - b)
}

// VIS-01 D-04 — value(left/right edge logical px) 를 가장 가까운 column edge 로 스냅.
// 거리 ≤ threshold(기본 4px) 이면 스냅. snapped=false 일 때 value 그대로 반환.
export function snapToColumnEdge(
  value: number,
  edges: readonly number[],
  threshold = 4,
): { value: number; snapped: boolean; edge: number | null } {
  if (edges.length === 0) {
    return { value, snapped: false, edge: null }
  }
  let bestDelta = Infinity
  let bestEdge = 0
  for (const e of edges) {
    const d = Math.abs(value - e)
    if (d < bestDelta) {
      bestDelta = d
      bestEdge = e
    }
  }
  if (bestDelta <= threshold) {
    return { value: bestEdge, snapped: true, edge: bestEdge }
  }
  return { value, snapped: false, edge: null }
}

// VIS-01 D-05 — 노드 width 가 column span 과 일치하는지 검사. 후보 span 은 1/2/3/4/6/12.
// targetWidth = span * colWidth + (span-1) * gutterPx 와 ±tolerance px 안이면 매치.
// 매치 없으면 null.
export function computeColumnSpan(
  widthLogical: number,
  containerWidth: number,
  columnCount = 12,
  gutterPx = 16,
  tolerance = 4,
): number | null {
  const colWidth = (containerWidth - (columnCount - 1) * gutterPx) / columnCount
  if (colWidth <= 0) return null
  const candidates = [1, 2, 3, 4, 6, 12]
  for (const span of candidates) {
    const target = span * colWidth + (span - 1) * gutterPx
    if (Math.abs(widthLogical - target) <= tolerance) return span
  }
  return null
}
