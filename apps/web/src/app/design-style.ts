// design-resolver 결과(Spacing/NodeLayout/...)를 React CSSProperties로 변환하는
// 순수 helper 모음. page.tsx 분할(Phase 6)에서 분리 — 캔버스 / 인스펙터가 공유.
//
// 1차 분리 범위: spacing + layout. shape/color는 후속 commit (customShadow / token
// 의존이 추가되어 별도 정리 필요).

import type { CSSProperties } from 'react'

import type {
  CustomShadow,
  Gradient,
  GradientDirection,
  LayoutAlign,
  LayoutJustify,
  NodeColor,
  NodeInset,
  NodeLayout,
  NodePosition,
  NodeTransform,
  NodeTransition,
  Shape,
  ShadowPreset,
  Spacing,
  TreeNode,
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

// gradient direction enum → CSS linear-gradient 표현.
export const GRADIENT_DIRECTION_CSS: Record<GradientDirection, string> = {
  'to-top': 'to top',
  'to-top-right': 'to top right',
  'to-right': 'to right',
  'to-bottom-right': 'to bottom right',
  'to-bottom': 'to bottom',
  'to-bottom-left': 'to bottom left',
  'to-left': 'to left',
  'to-top-left': 'to top left',
}

export function gradientToCss(gradient: Gradient): string {
  const from = getCssColorWithOpacity(gradient.from, gradient.fromOpacity)
  const to = getCssColorWithOpacity(gradient.to, gradient.toOpacity)

  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${from}, ${to})`
  }

  if (gradient.type === 'conic') {
    const angle = gradient.conicFromAngle ?? 0
    const x = gradient.conicCenterX ?? 50
    const y = gradient.conicCenterY ?? 50
    return `conic-gradient(from ${angle}deg at ${x}% ${y}%, ${from}, ${to})`
  }

  return `linear-gradient(${GRADIENT_DIRECTION_CSS[gradient.direction]}, ${from}, ${to})`
}

export function getColorStyle(
  color?: NodeColor,
  inheritedTextColor?: string,
): CSSProperties | undefined {
  const effectiveTextColor =
    color?.textColor !== undefined || inheritedTextColor !== undefined
      ? getCssColorWithOpacity(
          color?.textColor ?? inheritedTextColor ?? '',
          color?.textOpacity,
        )
      : undefined
  const style: CSSProperties = {
    ...(color?.backgroundGradient !== undefined
      ? { backgroundImage: gradientToCss(color.backgroundGradient) }
      : {}),
    ...(color?.backgroundGradient === undefined &&
    color?.backgroundColor !== undefined
      ? {
          backgroundColor: getCssColorWithOpacity(
            color.backgroundColor,
            color.backgroundOpacity,
          ),
        }
      : {}),
    ...(effectiveTextColor !== undefined ? { color: effectiveTextColor } : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}

export function getAccentBackgroundStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.accentColor === undefined
    ? undefined
    : {
        backgroundColor: getCssColorWithOpacity(
          color.accentColor,
          color.accentOpacity,
        ),
      }
}

export function getAccentTextColorStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.accentColor === undefined
    ? undefined
    : {
        color: getCssColorWithOpacity(color.accentColor, color.accentOpacity),
      }
}

export function getTextColorStyle(
  textColor?: string,
): CSSProperties | undefined {
  return textColor ? { color: textColor } : undefined
}

export function getHoverBackgroundStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.hoverBackgroundColor === undefined
    ? undefined
    : ({
        '--dw-hover-bg': getCssColorWithOpacity(color.hoverBackgroundColor),
      } as CSSProperties)
}

export function getHoverTextStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.hoverTextColor === undefined
    ? undefined
    : ({
        '--dw-hover-text': getCssColorWithOpacity(color.hoverTextColor),
      } as CSSProperties)
}

export function getActiveBackgroundStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.activeBackgroundColor === undefined
    ? undefined
    : ({
        '--dw-active-bg': getCssColorWithOpacity(color.activeBackgroundColor),
      } as CSSProperties)
}

export function getActiveTextStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.activeTextColor === undefined
    ? undefined
    : ({
        '--dw-active-text': getCssColorWithOpacity(color.activeTextColor),
      } as CSSProperties)
}

export function getFocusBackgroundStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.focusBackgroundColor === undefined
    ? undefined
    : ({
        '--dw-focus-bg': getCssColorWithOpacity(color.focusBackgroundColor),
      } as CSSProperties)
}

export function getFocusTextStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.focusTextColor === undefined
    ? undefined
    : ({
        '--dw-focus-text': getCssColorWithOpacity(color.focusTextColor),
      } as CSSProperties)
}

export function getDisabledBackgroundStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.disabledBackgroundColor === undefined
    ? undefined
    : ({
        '--dw-disabled-bg': getCssColorWithOpacity(
          color.disabledBackgroundColor,
        ),
      } as CSSProperties)
}

export function getDisabledTextStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.disabledTextColor === undefined
    ? undefined
    : ({
        '--dw-disabled-text': getCssColorWithOpacity(color.disabledTextColor),
      } as CSSProperties)
}


export function getTransformStyle(
  transform?: NodeTransform,
): CSSProperties | undefined {
  if (transform === undefined) {
    return undefined
  }
  const parts: string[] = []
  if (transform.perspective !== undefined) {
    parts.push(`perspective(${transform.perspective}px)`)
  }
  if (transform.translateX !== undefined) {
    parts.push(`translateX(${transform.translateX}px)`)
  }
  if (transform.translateY !== undefined) {
    parts.push(`translateY(${transform.translateY}px)`)
  }
  if (transform.rotate !== undefined) {
    parts.push(`rotate(${transform.rotate}deg)`)
  }
  if (transform.scale !== undefined) {
    parts.push(`scale(${transform.scale})`)
  }
  if (transform.skewX !== undefined) {
    parts.push(`skewX(${transform.skewX}deg)`)
  }
  if (transform.skewY !== undefined) {
    parts.push(`skewY(${transform.skewY}deg)`)
  }
  if (transform.rotateX !== undefined) {
    parts.push(`rotateX(${transform.rotateX}deg)`)
  }
  if (transform.rotateY !== undefined) {
    parts.push(`rotateY(${transform.rotateY}deg)`)
  }
  const style: CSSProperties = {}
  if (parts.length > 0) {
    style.transform = parts.join(' ')
  }
  if (transform.originX !== undefined || transform.originY !== undefined) {
    style.transformOrigin = `${transform.originX ?? 50}% ${transform.originY ?? 50}%`
  }
  return Object.keys(style).length === 0 ? undefined : style
}

export function getTransitionStyle(
  transition?: NodeTransition,
): CSSProperties | undefined {
  if (transition === undefined) {
    return undefined
  }
  const style: CSSProperties = {}
  if (transition.duration !== undefined) {
    style.transitionDuration = `${transition.duration}ms`
  }
  if (transition.timing === 'custom') {
    const cb = transition.cubicBezier
    style.transitionTimingFunction =
      cb === undefined
        ? 'ease'
        : `cubic-bezier(${cb.x1}, ${cb.y1}, ${cb.x2}, ${cb.y2})`
  } else if (transition.timing !== undefined) {
    style.transitionTimingFunction = transition.timing
  }
  return Object.keys(style).length === 0 ? undefined : style
}

// ---- positioning (overlay 헤더, sticky 사이드바 등 레이어드 디자인) ----

/**
 * 노드 자체의 position + inset (top/right/bottom/left/zIndex)를 CSSProperties로.
 * static / undefined는 결과 없음 (default flow).
 */
export function getPositionStyle(
  position?: NodePosition,
  inset?: NodeInset,
): CSSProperties | undefined {
  if (position === undefined || position === 'static') {
    return undefined
  }
  const style: CSSProperties = { position }
  if (inset?.top !== undefined) style.top = `${inset.top}px`
  if (inset?.right !== undefined) style.right = `${inset.right}px`
  if (inset?.bottom !== undefined) style.bottom = `${inset.bottom}px`
  if (inset?.left !== undefined) style.left = `${inset.left}px`
  if (inset?.zIndex !== undefined) style.zIndex = inset.zIndex
  return style
}

/**
 * children 중 position:absolute가 있으면 부모는 position:relative로 자동 컨테이닝.
 * sticky/fixed는 부모와 무관하므로 검사 X.
 *
 * 컨테이너 노드(section/hero/card/list/form) children을 받아 컨테이닝 필요 여부 결정.
 */
export function getContainingPositionStyle(
  children: ReadonlyArray<TreeNode>,
): CSSProperties | undefined {
  const hasAbsoluteChild = children.some(
    (child) => child.position === 'absolute',
  )
  return hasAbsoluteChild ? { position: 'relative' } : undefined
}
