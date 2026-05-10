// design-resolver 결과(Spacing/NodeLayout/...)를 React CSSProperties로 변환하는
// 순수 helper 모음. page.tsx 분할(Phase 6)에서 분리 — 캔버스 / 인스펙터가 공유.
//
// 1차 분리 범위: spacing + layout. shape/color는 후속 commit (customShadow / token
// 의존이 추가되어 별도 정리 필요).

import type { CSSProperties } from 'react'

import type {
  LayoutAlign,
  LayoutJustify,
  NodeLayout,
  Spacing,
} from '@dworks/tree'

import { mergeStyles } from './style-utils'

/**
 * Spacing의 padding/margin 키만 style로 변환. gap은 getGapSpacingStyle.
 * 결과가 빈 객체면 undefined 반환.
 */
export function getBoxSpacingStyle(
  spacing?: Spacing,
): CSSProperties | undefined {
  if (!spacing) {
    return undefined
  }

  const style: CSSProperties = {
    ...(spacing.paddingTop !== undefined
      ? { paddingTop: `${spacing.paddingTop}px` }
      : {}),
    ...(spacing.paddingRight !== undefined
      ? { paddingRight: `${spacing.paddingRight}px` }
      : {}),
    ...(spacing.paddingBottom !== undefined
      ? { paddingBottom: `${spacing.paddingBottom}px` }
      : {}),
    ...(spacing.paddingLeft !== undefined
      ? { paddingLeft: `${spacing.paddingLeft}px` }
      : {}),
    ...(spacing.marginTop !== undefined
      ? { marginTop: `${spacing.marginTop}px` }
      : {}),
    ...(spacing.marginRight !== undefined
      ? { marginRight: `${spacing.marginRight}px` }
      : {}),
    ...(spacing.marginBottom !== undefined
      ? { marginBottom: `${spacing.marginBottom}px` }
      : {}),
    ...(spacing.marginLeft !== undefined
      ? { marginLeft: `${spacing.marginLeft}px` }
      : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}

export function getGapSpacingStyle(
  spacing?: Spacing,
): CSSProperties | undefined {
  if (spacing?.gap === undefined) {
    return undefined
  }

  return { gap: `${spacing.gap}px` }
}

export function getContainerSpacingStyle(
  spacing?: Spacing,
): CSSProperties | undefined {
  return mergeStyles(getBoxSpacingStyle(spacing), getGapSpacingStyle(spacing))
}

export function hasLayoutOverride(layout?: NodeLayout): boolean {
  return layout !== undefined && Object.keys(layout).length > 0
}

export function toFlexAlignment(
  value: LayoutAlign,
): CSSProperties['alignItems'] {
  if (value === 'start') return 'flex-start'
  if (value === 'end') return 'flex-end'
  return value
}

export function toFlexJustify(
  value: LayoutJustify,
): CSSProperties['justifyContent'] {
  if (value === 'start') return 'flex-start'
  if (value === 'end') return 'flex-end'
  if (value === 'between') return 'space-between'
  if (value === 'evenly') return 'space-evenly'
  return value
}

export function getLayoutStyle(
  layout?: NodeLayout,
): CSSProperties | undefined {
  if (!hasLayoutOverride(layout)) {
    return undefined
  }

  const style: CSSProperties = {
    display: 'flex',
    ...(layout?.direction !== undefined
      ? { flexDirection: layout.direction }
      : {}),
    ...(layout?.align !== undefined
      ? { alignItems: toFlexAlignment(layout.align) }
      : {}),
    ...(layout?.justify !== undefined
      ? { justifyContent: toFlexJustify(layout.justify) }
      : {}),
    ...(layout?.wrap !== undefined ? { flexWrap: layout.wrap } : {}),
  }

  return style
}
