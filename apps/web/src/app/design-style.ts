// design-resolver 결과(Spacing/NodeLayout/...)를 React CSSProperties로 변환하는
// 순수 helper 모음. page.tsx 분할(Phase 6)에서 분리 — 캔버스 / 인스펙터가 공유.
//
// 1차 분리 범위: spacing + layout. shape/color는 후속 commit (customShadow / token
// 의존이 추가되어 별도 정리 필요).

import type { CSSProperties } from 'react'

import type {
  CustomShadow,
  LayoutAlign,
  LayoutJustify,
  NodeLayout,
  Shape,
  ShadowPreset,
  Spacing,
} from '@dworks/tree'

import {
  shapeCornerRadiusFields,
  type ShapeRadiusField,
} from './schema-fields'
import { getCssColorWithOpacity, mergeStyles } from './style-utils'

// Tailwind shadow preset → CSS box-shadow value.
export const SHADOW_VALUES: Record<ShadowPreset, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg: '0 12px 32px rgba(0, 0, 0, 0.12)',
  xl: '0 24px 64px rgba(0, 0, 0, 0.16)',
}

export function customShadowToCss(shadow: CustomShadow): string {
  const parts = [
    `${shadow.offsetX}px`,
    `${shadow.offsetY}px`,
    `${shadow.blur}px`,
    `${shadow.spread ?? 0}px`,
    getCssColorWithOpacity(shadow.color, shadow.opacity),
  ]
  return shadow.inset === true ? `inset ${parts.join(' ')}` : parts.join(' ')
}

export function hasCornerRadiusOverride(shape: Partial<Shape>): boolean {
  return shapeCornerRadiusFields.some((field) => shape[field] !== undefined)
}

export function getResolvedCornerRadius(
  shape: Partial<Shape>,
  field: ShapeRadiusField,
): number {
  return shape[field] ?? shape.radius ?? 0
}

function getBorderRadiusValue(shape: Shape): string | undefined {
  if (hasCornerRadiusOverride(shape)) {
    return [
      getResolvedCornerRadius(shape, 'radiusTopLeft'),
      getResolvedCornerRadius(shape, 'radiusTopRight'),
      getResolvedCornerRadius(shape, 'radiusBottomRight'),
      getResolvedCornerRadius(shape, 'radiusBottomLeft'),
    ]
      .map((value) => `${value}px`)
      .join(' ')
  }

  return shape.radius !== undefined ? `${shape.radius}px` : undefined
}

function getShapeBoxShadow(shape: Shape): string | undefined {
  const customShadows = shape.customShadows?.filter(Boolean) ?? []
  if (customShadows.length > 0) {
    return customShadows.map(customShadowToCss).join(', ')
  }

  if (shape.customShadow !== undefined) {
    return customShadowToCss(shape.customShadow)
  }

  return shape.shadow !== undefined ? SHADOW_VALUES[shape.shadow] : undefined
}

export function getShapeStyle(shape?: Shape): CSSProperties | undefined {
  if (!shape) {
    return undefined
  }

  const borderRadius = getBorderRadiusValue(shape)
  const hasBorderDetail =
    shape.borderWidth !== undefined ||
    shape.borderColor !== undefined ||
    shape.borderStyle !== undefined
  const effectiveBorderStyle =
    shape.borderStyle ?? (hasBorderDetail ? 'solid' : undefined)
  const effectiveBorderWidth =
    effectiveBorderStyle === undefined
      ? undefined
      : effectiveBorderStyle === 'none'
        ? 0
        : (shape.borderWidth ?? 1)
  const effectiveBorderColor =
    effectiveBorderStyle === undefined
      ? undefined
      : effectiveBorderStyle === 'none'
        ? 'transparent'
        : getCssColorWithOpacity(
            shape.borderColor ?? 'var(--dw-border)',
            shape.borderOpacity,
          )
  const boxShadow = getShapeBoxShadow(shape)

  const style: CSSProperties = {
    ...(borderRadius !== undefined ? { borderRadius } : {}),
    ...(effectiveBorderStyle !== undefined
      ? { borderStyle: effectiveBorderStyle }
      : {}),
    ...(effectiveBorderWidth !== undefined
      ? { borderWidth: `${effectiveBorderWidth}px` }
      : {}),
    ...(effectiveBorderColor !== undefined
      ? { borderColor: effectiveBorderColor }
      : {}),
    ...(boxShadow !== undefined ? { boxShadow } : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}


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
