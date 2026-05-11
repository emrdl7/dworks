'use client'
// UX-02 spacing overlay — 선택된 노드와 hover 노드 사이의 px 거리 + 정렬 가이드를 표시.
// modifier 키 없는 _기본 동작_(D-01)으로 spacing 측정선 + 라벨 4방향 노출,
// Alt 누른 채 hover 시 정렬되는 edge 점선(#FF8FAB) 추가 표시(D-03).
// DOM 측정 source: selectable-node.tsx 가 박은 `data-dworks-node-id` 속성.
// 좌표는 canvas wrapper rect 기준 — canvas zoom 은 wrapper 의 CSS `zoom`(page.tsx:4811)
// 으로 처리되므로 getBoundingClientRect() 차이만 그대로 사용해도 시각이 일치.
// 단 wrapper 안 스크롤은 wrapperEl.scrollLeft/Top 으로 보정.

import {
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'

import { CanvasHoverContext } from './canvas-contexts'

// 측정선 색상(accent 80% opacity) — UI-SPEC §Color "Spacing overlay 측정 라인" 명시.
const MEASURE_LINE_COLOR = '#6366f1cc'
// 정렬 가이드 점선 색상 — Figma 파스텔 핑크(#FF8FAB), D-03 + Claude discretion.
const ALIGN_GUIDE_COLOR = '#FF8FAB'
// px 라벨 최소 너비(UI-SPEC §Spacing exceptions — 24px).
const LABEL_MIN_WIDTH = 24
// monospace + tabular-nums — UI-SPEC §Typography "Spacing overlay 라벨은 monospace 변형".
const LABEL_FONT_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
// 두 edge 가 정렬됐다고 판정하는 px 허용오차.
const ALIGN_EPSILON = 1

export interface SpacingOverlayProps {
  selectedNodeId: string | null
  altKeyPressed: boolean
  // 측정 좌표 기준점(canvasScrollRef). 라벨/측정선이 이 wrapper 의 내부 absolute 자식으로 배치.
  canvasWrapperRef: RefObject<HTMLElement | null>
}

// logical px 좌표(canvas wrapper 기준).
interface LogicalRect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

// 측정 결과(라벨/선/정렬 가이드 모두 좌표 + 값).
interface OverlayLabel {
  key: string
  x: number
  y: number
  value: number
}

interface OverlayLine {
  key: string
  x: number
  y: number
  width: number
  height: number
}

interface OverlayGuide {
  key: string
  // 수직 가이드면 x 고정 + height 100%, 수평이면 y 고정 + width 100%.
  axis: 'vertical' | 'horizontal'
  position: number
}

interface OverlayState {
  labels: readonly OverlayLabel[]
  lines: readonly OverlayLine[]
  guides: readonly OverlayGuide[]
}

// 둘이 겹치는지 — strict overlap(접점만 닿는 경우는 gap 0 으로 처리).
function rectsOverlap(a: LogicalRect, b: LogicalRect): boolean {
  return (
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  )
}

// px 값 소수점 둘째 자리 반올림 — D-04 "단위 px만, 소수점 둘째 자리".
function roundPx(value: number): number {
  return Math.round(value * 100) / 100
}

// DOM rect 를 wrapper 기준 logical 좌표로 변환.
// canvasZoom 처리 노트: page.tsx:4811 에서 캔버스 viewport 가 CSS `zoom: canvasZoom`
// 으로 scale 되므로 getBoundingClientRect() 가 이미 _zoom 적용 후_ scaled px 를 반환한다.
// wrapper(canvasScrollRef) 도 동일 좌표계 안에 있으므로 두 rect 의 차이만 사용하면
// canvasZoom 보정 없이 시각이 일치한다. wrapper 좌표계 안 absolute 자식으로 라벨/선을
// 배치하면 zoom 이 변해도 자동으로 따라감.
function toLogicalRect(
  domRect: DOMRect,
  wrapperRect: DOMRect,
  scrollLeft: number,
  scrollTop: number,
): LogicalRect {
  const left = domRect.left - wrapperRect.left + scrollLeft
  const top = domRect.top - wrapperRect.top + scrollTop
  return {
    left,
    top,
    right: left + domRect.width,
    bottom: top + domRect.height,
    width: domRect.width,
    height: domRect.height,
  }
}

// 두 rect 의 inset(겹친 영역) 측정 — selected(a) 기준으로 hovered(b) 각 변까지의 차이.
function computeInsetMeasurements(
  a: LogicalRect,
  b: LogicalRect,
): { labels: OverlayLabel[]; lines: OverlayLine[] } {
  const topInset = Math.abs(b.top - a.top)
  const rightInset = Math.abs(a.right - b.right)
  const bottomInset = Math.abs(a.bottom - b.bottom)
  const leftInset = Math.abs(b.left - a.left)

  const centerX = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2
  const centerY = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2

  const labels: OverlayLabel[] = [
    { key: 'inset-top', x: centerX, y: Math.min(a.top, b.top) + 4, value: topInset },
    { key: 'inset-right', x: Math.max(a.right, b.right) - 4, y: centerY, value: rightInset },
    { key: 'inset-bottom', x: centerX, y: Math.max(a.bottom, b.bottom) - 4, value: bottomInset },
    { key: 'inset-left', x: Math.min(a.left, b.left) + 4, y: centerY, value: leftInset },
  ]

  // inset 의 측정선은 각 변 사이 짧은 라인.
  const lines: OverlayLine[] = [
    {
      key: 'inset-top-line',
      x: centerX - 0.5,
      y: Math.min(a.top, b.top),
      width: 1,
      height: Math.abs(b.top - a.top),
    },
    {
      key: 'inset-bottom-line',
      x: centerX - 0.5,
      y: Math.min(a.bottom, b.bottom),
      width: 1,
      height: Math.abs(a.bottom - b.bottom),
    },
    {
      key: 'inset-left-line',
      x: Math.min(a.left, b.left),
      y: centerY - 0.5,
      width: Math.abs(b.left - a.left),
      height: 1,
    },
    {
      key: 'inset-right-line',
      x: Math.min(a.right, b.right),
      y: centerY - 0.5,
      width: Math.abs(a.right - b.right),
      height: 1,
    },
  ]
  return { labels, lines }
}

// 겹치지 않는 경우 gap 측정 — 수평/수직 axis 각각.
function computeGapMeasurements(
  a: LogicalRect,
  b: LogicalRect,
): { labels: OverlayLabel[]; lines: OverlayLine[] } {
  const labels: OverlayLabel[] = []
  const lines: OverlayLine[] = []

  // 수평 gap — 두 rect 가 수평 축에서 떨어진 경우.
  if (a.right <= b.left) {
    const gap = b.left - a.right
    const midX = (a.right + b.left) / 2
    const midY = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2
    labels.push({ key: 'gap-h-right', x: midX, y: midY - 14, value: gap })
    lines.push({ key: 'gap-h-right-line', x: a.right, y: midY - 0.5, width: gap, height: 1 })
  } else if (b.right <= a.left) {
    const gap = a.left - b.right
    const midX = (b.right + a.left) / 2
    const midY = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2
    labels.push({ key: 'gap-h-left', x: midX, y: midY - 14, value: gap })
    lines.push({ key: 'gap-h-left-line', x: b.right, y: midY - 0.5, width: gap, height: 1 })
  }

  // 수직 gap — 두 rect 가 수직 축에서 떨어진 경우.
  if (a.bottom <= b.top) {
    const gap = b.top - a.bottom
    const midX = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2
    const midY = (a.bottom + b.top) / 2
    labels.push({ key: 'gap-v-bottom', x: midX, y: midY, value: gap })
    lines.push({ key: 'gap-v-bottom-line', x: midX - 0.5, y: a.bottom, width: 1, height: gap })
  } else if (b.bottom <= a.top) {
    const gap = a.top - b.bottom
    const midX = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2
    const midY = (b.bottom + a.top) / 2
    labels.push({ key: 'gap-v-top', x: midX, y: midY, value: gap })
    lines.push({ key: 'gap-v-top-line', x: midX - 0.5, y: b.bottom, width: 1, height: gap })
  }

  return { labels, lines }
}

// 정렬 가이드 검출 — 좌/중/우 / 상/중/하 정렬 시 wrapper 전체에 점선 표시.
function computeAlignGuides(a: LogicalRect, b: LogicalRect): OverlayGuide[] {
  const guides: OverlayGuide[] = []
  const aCenterX = (a.left + a.right) / 2
  const bCenterX = (b.left + b.right) / 2
  const aCenterY = (a.top + a.bottom) / 2
  const bCenterY = (b.top + b.bottom) / 2

  if (Math.abs(a.left - b.left) < ALIGN_EPSILON) {
    guides.push({ key: 'align-left', axis: 'vertical', position: a.left })
  }
  if (Math.abs(a.right - b.right) < ALIGN_EPSILON) {
    guides.push({ key: 'align-right', axis: 'vertical', position: a.right })
  }
  if (Math.abs(aCenterX - bCenterX) < ALIGN_EPSILON) {
    guides.push({ key: 'align-center-x', axis: 'vertical', position: aCenterX })
  }
  if (Math.abs(a.top - b.top) < ALIGN_EPSILON) {
    guides.push({ key: 'align-top', axis: 'horizontal', position: a.top })
  }
  if (Math.abs(a.bottom - b.bottom) < ALIGN_EPSILON) {
    guides.push({ key: 'align-bottom', axis: 'horizontal', position: a.bottom })
  }
  if (Math.abs(aCenterY - bCenterY) < ALIGN_EPSILON) {
    guides.push({ key: 'align-center-y', axis: 'horizontal', position: aCenterY })
  }
  return guides
}

export function SpacingOverlay(props: SpacingOverlayProps) {
  const { selectedNodeId, altKeyPressed, canvasWrapperRef } = props
  const { hoveredNodeId } = useContext(CanvasHoverContext)
  const [overlay, setOverlay] = useState<OverlayState | null>(null)

  // hover 가 같은 노드거나 둘 중 하나 없으면 측정 skip — overlay 미렌더.
  const isActive =
    selectedNodeId !== null &&
    hoveredNodeId !== null &&
    selectedNodeId !== hoveredNodeId

  useEffect(() => {
    if (!isActive) {
      setOverlay(null)
      return
    }
    const wrapperEl = canvasWrapperRef.current
    if (!wrapperEl) {
      setOverlay(null)
      return
    }
    // selectedNodeId/hoveredNodeId 변경 시점에만 DOM 측정 — mousemove 폭주 회피(T-01-04 mitigate).
    const selEl = document.querySelector<HTMLElement>(
      `[data-dworks-node-id="${selectedNodeId}"]`,
    )
    const hovEl = document.querySelector<HTMLElement>(
      `[data-dworks-node-id="${hoveredNodeId}"]`,
    )
    if (!selEl || !hovEl) {
      setOverlay(null)
      return
    }
    const wrapperRect = wrapperEl.getBoundingClientRect()
    const scrollLeft = wrapperEl.scrollLeft
    const scrollTop = wrapperEl.scrollTop
    const a = toLogicalRect(
      selEl.getBoundingClientRect(),
      wrapperRect,
      scrollLeft,
      scrollTop,
    )
    const b = toLogicalRect(
      hovEl.getBoundingClientRect(),
      wrapperRect,
      scrollLeft,
      scrollTop,
    )

    // 분기 — 겹치면 inset, 아니면 gap.
    const measurement = rectsOverlap(a, b)
      ? computeInsetMeasurements(a, b)
      : computeGapMeasurements(a, b)
    const guides = altKeyPressed ? computeAlignGuides(a, b) : []
    setOverlay({
      labels: measurement.labels,
      lines: measurement.lines,
      guides,
    })
  }, [isActive, selectedNodeId, hoveredNodeId, altKeyPressed, canvasWrapperRef])

  if (!isActive || !overlay) return null

  // wrapper style — pointer-events 없음(라벨도 시각만), z-index 100(UI-SPEC line 117).
  const wrapperStyle: CSSProperties = {
    zIndex: 100,
    animation: 'dw-fade-in var(--dw-motion-fast) var(--dw-motion-ease) both',
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={wrapperStyle}
    >
      {/* 측정선 — accent 80% opacity */}
      {overlay.lines.map((line) => (
        <div
          key={line.key}
          className="absolute"
          style={{
            left: line.x,
            top: line.y,
            width: Math.max(line.width, 1),
            height: Math.max(line.height, 1),
            backgroundColor: MEASURE_LINE_COLOR,
          }}
        />
      ))}
      {/* 정렬 가이드 점선 — Alt 토글 시만 노출 */}
      {overlay.guides.map((guide) =>
        guide.axis === 'vertical' ? (
          <div
            key={guide.key}
            className="absolute"
            style={{
              left: guide.position,
              top: 0,
              width: 1,
              height: '100%',
              borderLeft: `1px dashed ${ALIGN_GUIDE_COLOR}`,
              opacity: 0.9,
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            key={guide.key}
            className="absolute"
            style={{
              left: 0,
              top: guide.position,
              width: '100%',
              height: 1,
              borderTop: `1px dashed ${ALIGN_GUIDE_COLOR}`,
              opacity: 0.9,
              pointerEvents: 'none',
            }}
          />
        ),
      )}
      {/* px 라벨 — monospace + tabular-nums, white-on-accent */}
      {overlay.labels.map((label) => (
        <span
          key={label.key}
          className="absolute rounded-[var(--dw-radius-sm)] bg-[var(--dw-ui-accent)] px-1 py-0.5 text-[length:var(--dw-text-caption)] font-semibold text-white"
          style={{
            left: label.x,
            top: label.y,
            transform: 'translate(-50%, -100%)',
            fontFamily: LABEL_FONT_FAMILY,
            fontVariantNumeric: 'tabular-nums',
            minWidth: LABEL_MIN_WIDTH,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {roundPx(label.value)}
        </span>
      ))}
    </div>
  )
}
