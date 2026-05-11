'use client'
// VIS-03 좌하단 미니맵 — CONTEXT.md D-08..D-12 잠금.
// 200px × ~60-120px (canvas aspect ratio 자동). 큰 트리 navigate 용.
// 노드 mini-render 없음 — bounding box outlined rectangle 만 (D-09 성능 회피).
// viewport rect: canvasScrollRef.scrollLeft/Top + clientWidth/Height + canvasZoom 으로 계산.
// 클릭 navigate: zoom 변경 없음 → canvasScrollRef.current 의 scrollLeft/Top 직접 설정 (D-11).
//
// 좌표계:
//   logical px = (clientX - wrapperRect.left + scrollLeft) / canvasZoom
//   logical → minimap px = logical * scale (scale = bodyWidth / canvasContentWidth)
//
// 성능 (T-03-03-01/02 mitigate):
//   - scroll/resize 리스너 → rAF throttle (동일 frame 합치기)
//   - 노드 박스 재측정은 tree 변경 시만 (treeRevision dep)
//   - viewport rect 재측정은 scroll/zoom 시 (가벼움)

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react'

import { X } from 'lucide-react'

// 미니맵 패널 크기 — D-09 잠금 (200×~120, aspect 자동).
const MINIMAP_WIDTH = 200
const MINIMAP_BODY_HEIGHT_MAX = 120
const MINIMAP_BODY_HEIGHT_MIN = 60
const HEADER_HEIGHT = 24
const BODY_PADDING_X = 8
const BODY_PADDING_Y = 4

// viewport rect 색상 — accent (#6366f1) 반투명. D-10 잠금.
const VIEWPORT_RECT_BG = 'rgba(99, 102, 241, 0.18)'
const VIEWPORT_RECT_BORDER = 'rgba(99, 102, 241, 0.6)'
// 노드 박스 outline — 동일 accent 약한 톤.
const NODE_BOX_BORDER = 'rgba(99, 102, 241, 0.35)'

export interface MinimapProps {
  open: boolean
  canvasScrollRef: RefObject<HTMLElement | null>
  canvasZoom: number
  // selectedViewportPreset.width — viewport-aware logical 폭.
  containerWidth: number
  // tree 변경 감지용 — 노드 박스 재측정 trigger.
  treeRevision: number | string
  onClose: () => void
}

// logical px 좌표(canvas wrapper 기준, zoom 적용 전).
interface NodeBox {
  key: string
  x: number
  y: number
  w: number
  h: number
}

interface ViewportBox {
  x: number
  y: number
  w: number
  h: number
}

interface ContentSize {
  w: number
  h: number
}

export function Minimap(props: MinimapProps) {
  const {
    open,
    canvasScrollRef,
    canvasZoom,
    containerWidth,
    treeRevision,
    onClose,
  } = props
  const [nodeBoxes, setNodeBoxes] = useState<readonly NodeBox[]>([])
  const [viewport, setViewport] = useState<ViewportBox | null>(null)
  const [contentSize, setContentSize] = useState<ContentSize | null>(null)
  const rafRef = useRef<number | null>(null)

  // 노드 박스 + 콘텐츠 사이즈 측정 — tree 변경 시점.
  // querySelectorAll([data-dworks-node-id]) → 각 element 의 logical 좌표 변환.
  const measureNodes = useCallback((): void => {
    const wrapper = canvasScrollRef.current
    if (!wrapper) return
    const z = canvasZoom > 0 ? canvasZoom : 1
    const wrapperRect = wrapper.getBoundingClientRect()
    const scrollLeft = wrapper.scrollLeft
    const scrollTop = wrapper.scrollTop
    const all = Array.from(
      document.querySelectorAll<HTMLElement>('[data-dworks-node-id]'),
    )
    const boxes: NodeBox[] = all.map((el, idx) => {
      const r = el.getBoundingClientRect()
      return {
        key: el.dataset.dworksNodeId ?? `idx-${idx}`,
        x: (r.left - wrapperRect.left + scrollLeft) / z,
        y: (r.top - wrapperRect.top + scrollTop) / z,
        w: r.width / z,
        h: r.height / z,
      }
    })
    setNodeBoxes(boxes)
    // 콘텐츠 사이즈 — wrapper.scrollWidth/Height / zoom.
    // 빈 트리 대비 containerWidth/1 floor 보장.
    const cw = wrapper.scrollWidth / z
    const ch = wrapper.scrollHeight / z
    setContentSize({
      w: Math.max(cw, containerWidth),
      h: Math.max(ch, 1),
    })
  }, [canvasScrollRef, canvasZoom, containerWidth])

  // viewport rect 측정 — scroll/resize/zoom 시.
  // logical 좌표계 — scrollLeft/Top / clientWidth/Height 를 zoom 으로 나눔.
  const measureViewport = useCallback((): void => {
    const wrapper = canvasScrollRef.current
    if (!wrapper) return
    const z = canvasZoom > 0 ? canvasZoom : 1
    setViewport({
      x: wrapper.scrollLeft / z,
      y: wrapper.scrollTop / z,
      w: wrapper.clientWidth / z,
      h: wrapper.clientHeight / z,
    })
  }, [canvasScrollRef, canvasZoom])

  // open 시 + tree/zoom/containerWidth 변경 시 초기 측정.
  useEffect(() => {
    if (!open) return
    measureNodes()
    measureViewport()
  }, [
    open,
    treeRevision,
    canvasZoom,
    containerWidth,
    measureNodes,
    measureViewport,
  ])

  // scroll/resize listener — rAF throttle (T-03-03-01 mitigate).
  // 노드 박스는 재측정 안 함 — viewport rect 만 갱신.
  useEffect(() => {
    if (!open) return
    const wrapper = canvasScrollRef.current
    if (!wrapper) return
    function onScrollOrResize(): void {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        measureViewport()
      })
    }
    wrapper.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    return () => {
      wrapper.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [open, canvasScrollRef, measureViewport])

  if (!open) return null

  // contentSize 가 아직 없을 때(첫 frame) 의 fallback — containerWidth 정사각형.
  const safeContent: ContentSize =
    contentSize ?? { w: containerWidth, h: containerWidth }
  const bodyWidth = MINIMAP_WIDTH - BODY_PADDING_X * 2
  const aspectH = bodyWidth * (safeContent.h / safeContent.w)
  const bodyHeight = Math.max(
    MINIMAP_BODY_HEIGHT_MIN,
    Math.min(MINIMAP_BODY_HEIGHT_MAX, aspectH),
  )
  // logical → minimap px scale.
  const scale = bodyWidth / safeContent.w

  // 미니맵 body 클릭 — 클릭 위치를 캔버스 viewport 중앙으로 navigate (D-11).
  // zoom 변경 없으므로 canvasScrollRef 의 scrollLeft/Top 직접 설정.
  function handleBodyClick(event: ReactMouseEvent<HTMLDivElement>): void {
    const wrapper = canvasScrollRef.current
    if (!wrapper) return
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const minimapX = event.clientX - rect.left
    const minimapY = event.clientY - rect.top
    if (scale <= 0) return
    const logicalX = minimapX / scale
    const logicalY = minimapY / scale
    const z = canvasZoom > 0 ? canvasZoom : 1
    // logical → DOM scroll px (zoom 곱), viewport 절반 빼서 중앙 정렬.
    wrapper.scrollLeft = Math.max(0, logicalX * z - wrapper.clientWidth / 2)
    wrapper.scrollTop = Math.max(0, logicalY * z - wrapper.clientHeight / 2)
    measureViewport()
  }

  // 키보드 활성화 (Enter/Space) — 콘텐츠 중앙으로 navigate (WCAG 2.1 키보드 접근성).
  function handleBodyKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    const wrapper = canvasScrollRef.current
    if (!wrapper) return
    const z = canvasZoom > 0 ? canvasZoom : 1
    wrapper.scrollLeft = Math.max(
      0,
      (safeContent.w / 2) * z - wrapper.clientWidth / 2,
    )
    wrapper.scrollTop = Math.max(
      0,
      (safeContent.h / 2) * z - wrapper.clientHeight / 2,
    )
    measureViewport()
  }

  const panelStyle: CSSProperties = {
    width: MINIMAP_WIDTH,
    zIndex: 60,
  }
  const bodyContainerStyle: CSSProperties = {
    width: MINIMAP_WIDTH,
    height: bodyHeight + BODY_PADDING_Y * 2,
    padding: `${BODY_PADDING_Y}px ${BODY_PADDING_X}px`,
  }
  const bodyInnerStyle: CSSProperties = {
    width: bodyWidth,
    height: bodyHeight,
  }
  const headerStyle: CSSProperties = {
    height: HEADER_HEIGHT,
  }

  return (
    <aside
      role="region"
      aria-label="미니맵"
      className="fixed bottom-4 left-4 overflow-hidden rounded-md border border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] shadow-[var(--dw-shadow-elev-2)]"
      style={panelStyle}
    >
      {/* 헤더 — 라벨 + close 버튼 */}
      <div
        className="flex items-center justify-between border-b border-[var(--dw-ui-border)] px-2 py-1 text-[11px] font-semibold text-[var(--dw-ui-text-muted)]"
        style={headerStyle}
      >
        <span>미니맵</span>
        <button
          type="button"
          aria-label="미니맵 닫기"
          onClick={onClose}
          className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--dw-ui-text-muted)] transition-colors hover:bg-[var(--dw-ui-elevated)] hover:text-[var(--dw-ui-text-body)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dw-ui-accent)]"
        >
          <X size={11} aria-hidden="true" />
        </button>
      </div>
      {/* 본문 — 노드 박스 + viewport rect. 클릭 시 navigate. */}
      <div
        role="button"
        aria-label="미니맵에서 캔버스 위치 이동"
        tabIndex={0}
        onClick={handleBodyClick}
        onKeyDown={handleBodyKeyDown}
        className="relative cursor-crosshair bg-[var(--dw-ui-canvas-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dw-ui-accent)]"
        style={bodyContainerStyle}
      >
        <div className="relative" style={bodyInnerStyle}>
          {/* 노드 박스 outlined rectangles — D-09 */}
          {nodeBoxes.map((b) => (
            <div
              key={b.key}
              className="absolute"
              style={{
                left: b.x * scale,
                top: b.y * scale,
                width: Math.max(b.w * scale, 1),
                height: Math.max(b.h * scale, 1),
                border: `1px solid ${NODE_BOX_BORDER}`,
                pointerEvents: 'none',
              }}
            />
          ))}
          {/* viewport rect — accent α=0.18 + border α=0.6 (D-10) */}
          {viewport && (
            <div
              className="absolute"
              style={{
                left: viewport.x * scale,
                top: viewport.y * scale,
                width: Math.max(viewport.w * scale, 4),
                height: Math.max(viewport.h * scale, 4),
                backgroundColor: VIEWPORT_RECT_BG,
                border: `1px solid ${VIEWPORT_RECT_BORDER}`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </aside>
  )
}
