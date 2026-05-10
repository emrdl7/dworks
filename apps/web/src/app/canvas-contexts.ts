// 캔버스 렌더 컨텍스트 모음 — page.tsx 분할(Phase 6)에서 분리.
// SelectableNode/CanvasNode/CanvasNodeToolbar 등이 useContext로 소비.

import { createContext } from 'react'

import type { ColorPreset } from '@dworks/tree'

import type { ResponsiveViewport } from './responsive'

export const CanvasReadOnlyContext = createContext(false)

export const CanvasViewportContext =
  createContext<ResponsiveViewport>('desktop')

// design-resolver가 token slot → hex 변환에 필요. 'mint'는 globals.css의 default fallback.
export const CanvasColorPresetContext = createContext<ColorPreset>('mint')

export interface CanvasHoverContextValue {
  hoveredNodeId: string | null
  setHoveredNodeId: (id: string | null) => void
}

export const CanvasHoverContext = createContext<CanvasHoverContextValue>({
  hoveredNodeId: null,
  setHoveredNodeId: () => {},
})

export interface CanvasSelectionContextValue {
  primarySelectedId: string
  allSelectedIds: ReadonlySet<string>
  toggleAdditional: (id: string) => void
  // Shift+click 범위 선택: primary부터 target까지 (트리 flat 순서 기준)
  selectRange: (id: string) => void
  // 캔버스 panning 활성 시 노드 click을 무시 (Space drag 시 selection 변경 방지)
  isPanActive: boolean
}

export const CanvasSelectionContext =
  createContext<CanvasSelectionContextValue>({
    primarySelectedId: '',
    allSelectedIds: new Set(),
    toggleAdditional: () => {},
    selectRange: () => {},
    isPanActive: false,
  })

export interface CanvasToolbarStructureInfo {
  isRoot: boolean
  parentId?: string
  index?: number
  siblingCount?: number
}

export interface CanvasToolbarContextValue {
  selectedNodeId: string
  selectedStructureInfo: CanvasToolbarStructureInfo
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export const CanvasToolbarContext =
  createContext<CanvasToolbarContextValue | null>(null)
