// m3-generate-responsive-rendering — viewport별 layout/spacing 자동 적응 helper.
//
// page.tsx는 Next App Router 페이지라 default export 외 named export 제한이
// 있어 helper는 본 파일로 분리한다. CanvasNode 렌더에서 useContext로 viewport를
// 받아 본 helper에 전달.

import type { NodeLayout, Spacing } from '@dworks/tree'

export const responsiveViewportPresets = {
  mobile: { label: '모바일', width: 375 },
  tablet: { label: '태블릿', width: 768 },
  desktop: { label: '데스크톱', width: 1200 },
} as const

export type ResponsiveViewport = keyof typeof responsiveViewportPresets

export function resolveResponsiveSpacing(
  spacing: Spacing | undefined,
  viewport: ResponsiveViewport,
): Spacing | undefined {
  if (!spacing) return undefined
  if (viewport === 'desktop') return spacing
  const result: Spacing = { ...spacing }
  if (viewport === 'mobile') {
    if (result.paddingLeft !== undefined && result.paddingLeft >= 32)
      result.paddingLeft = 24
    if (result.paddingRight !== undefined && result.paddingRight >= 32)
      result.paddingRight = 24
    if (result.paddingTop !== undefined && result.paddingTop >= 80)
      result.paddingTop = 60
    if (result.paddingBottom !== undefined && result.paddingBottom >= 80)
      result.paddingBottom = 60
    if (result.gap !== undefined && result.gap >= 32) result.gap = 20
  } else if (viewport === 'tablet') {
    if (result.paddingLeft !== undefined && result.paddingLeft >= 32)
      result.paddingLeft = 28
    if (result.paddingRight !== undefined && result.paddingRight >= 32)
      result.paddingRight = 28
  }
  return result
}

export function resolveResponsiveLayout(
  layout: NodeLayout | undefined,
  viewport: ResponsiveViewport,
): NodeLayout | undefined {
  if (!layout) return undefined
  if (viewport !== 'mobile') return layout
  if (layout.direction === 'row' || layout.direction === undefined) {
    return { ...layout, direction: 'column' }
  }
  return layout
}
