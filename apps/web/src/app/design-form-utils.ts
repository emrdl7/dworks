// page.tsx 분할 (Phase 6) — Inspector form helper들과 default 상수.
// NodeColorControls / ShapeControls / TypographyControls / ImageCompositionControls
// 가 공유. 모두 pure function이라 다른 모듈에서 자유롭게 import 가능.

import type {
  CustomShadow,
  Gradient,
  GradientDirection,
  GradientType,
  Shape,
  TextShadow,
} from '@dworks/tree'

// ---- default 상수 ----

export const DEFAULT_SHAPE_COLOR = '#d7ddd2'
export const DEFAULT_COLOR_PICKER_COLOR = '#ffffff'
export const DEFAULT_TEXT_PICKER_COLOR = '#18211d'
export const DEFAULT_ACCENT_PICKER_COLOR = '#4f46e5'
export const DEFAULT_IMAGE_OVERLAY_COLOR = '#000000'
export const DEFAULT_GRADIENT_TO_COLOR = '#000000'
export const DEFAULT_GRADIENT_DIRECTION: GradientDirection = 'to-bottom-right'
export const DEFAULT_GRADIENT_TYPE: GradientType = 'linear'

export const DEFAULT_CUSTOM_SHADOW: CustomShadow = {
  offsetX: 0,
  offsetY: 4,
  blur: 12,
  spread: 0,
  color: '#000000',
  opacity: 0.25,
}

export const DEFAULT_TEXT_SHADOW: TextShadow = {
  offsetX: 0,
  offsetY: 2,
  blur: 4,
  color: '#000000',
  opacity: 0.25,
}

export const EMPTY_SHAPE: Shape = {}
export const MAX_CUSTOM_SHADOWS = 3

// ---- hex color helpers ----

export const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value)
}

export function normalizeHexColor(value: string): string {
  return value.trim().toLowerCase()
}

// 입력 박스(hex)와 native color picker 사이 변환 — color picker는 6자리만 받음.
export function toColorInputValue(
  value: string,
  fallback = DEFAULT_SHAPE_COLOR,
): string {
  const normalizedValue = normalizeHexColor(value)
  if (!isValidHexColor(normalizedValue)) {
    return fallback
  }

  if (normalizedValue.length === 4) {
    const red = normalizedValue.slice(1, 2)
    const green = normalizedValue.slice(2, 3)
    const blue = normalizedValue.slice(3, 4)
    return `#${red}${red}${green}${green}${blue}${blue}`
  }

  return normalizedValue
}

// ---- 숫자 input 파싱 ----

export function parseOptionalNumber(
  value: string,
  min: number,
  max: number,
): number | undefined {
  if (value.trim() === '') {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }

  return Math.min(max, Math.max(min, parsed))
}

// 0~100% 입력을 0~1 opacity로. 100%는 undefined로 (default와 구분).
export function parseOptionalOpacity(value: string): number | undefined {
  const percent = parseOptionalNumber(value, 0, 100)
  if (percent === undefined || percent === 100) {
    return undefined
  }

  return Math.round((percent / 100) * 100) / 100
}

// 0~1 focal coordinate를 0.001 단위로 round (소수점 3자리).
export function roundFocalCoordinate(value: number): number {
  const clampedValue = Math.min(1, Math.max(0, value))
  return Math.round(clampedValue * 1000) / 1000
}

// ---- merge key (history coalesce 단위) ----

export function getNodeColorMergeKey(nodeId: string, field: string): string {
  return `node:${nodeId}:${field}`
}

// ---- gradient ----

export function getResolvedGradient(
  gradient: Gradient | undefined,
  fallbackFrom: string,
  fallbackFromOpacity?: number,
): Gradient {
  return {
    type: gradient?.type ?? DEFAULT_GRADIENT_TYPE,
    from: gradient?.from ?? normalizeHexColor(fallbackFrom),
    to: gradient?.to ?? DEFAULT_GRADIENT_TO_COLOR,
    direction: gradient?.direction ?? DEFAULT_GRADIENT_DIRECTION,
    ...(gradient?.fromOpacity !== undefined
      ? { fromOpacity: gradient.fromOpacity }
      : fallbackFromOpacity !== undefined
        ? { fromOpacity: fallbackFromOpacity }
        : {}),
    ...(gradient?.toOpacity !== undefined ? { toOpacity: gradient.toOpacity } : {}),
    ...(gradient?.conicFromAngle !== undefined
      ? { conicFromAngle: gradient.conicFromAngle }
      : {}),
    ...(gradient?.conicCenterX !== undefined
      ? { conicCenterX: gradient.conicCenterX }
      : {}),
    ...(gradient?.conicCenterY !== undefined
      ? { conicCenterY: gradient.conicCenterY }
      : {}),
  }
}

export function getGradientWithPatch(
  gradient: Gradient,
  patch: Partial<Gradient>,
): Gradient {
  const next: Gradient = { ...gradient, ...patch }

  if (next.fromOpacity === undefined) {
    delete next.fromOpacity
  }

  if (next.toOpacity === undefined) {
    delete next.toOpacity
  }

  if (next.type === undefined) {
    delete next.type
  }

  if (next.conicFromAngle === undefined) {
    delete next.conicFromAngle
  }

  if (next.conicCenterX === undefined) {
    delete next.conicCenterX
  }

  if (next.conicCenterY === undefined) {
    delete next.conicCenterY
  }

  return next
}

// ---- shape border ----

// border 색/두께/스타일 명시 시 _보이는 상태_ 보장 — 입력 시 borderStyle:none이거나
// width:0이면 사용자 의도가 안 보임. 적절한 기본 (solid/1px)으로 보정.
export function getVisibleBorderPatch(shape: Partial<Shape>): Partial<Shape> {
  return {
    borderStyle:
      shape.borderStyle === undefined || shape.borderStyle === 'none'
        ? 'solid'
        : shape.borderStyle,
    borderWidth:
      shape.borderWidth === undefined || shape.borderWidth === 0
        ? 1
        : shape.borderWidth,
  }
}

// ---- custom shadow ----

export function getResolvedCustomShadow(
  shadow: CustomShadow | undefined,
): CustomShadow {
  return shadow ?? DEFAULT_CUSTOM_SHADOW
}

export function hasShapeCustomShadow(shape: Partial<Shape>): boolean {
  return (
    shape.customShadow !== undefined ||
    (shape.customShadows !== undefined && shape.customShadows.length > 0)
  )
}

// 단일 customShadow 또는 customShadows 배열을 정규화한 list로.
// MAX_CUSTOM_SHADOWS(3)으로 clamp.
export function getResolvedCustomShadowList(shape: Partial<Shape>): CustomShadow[] {
  if (shape.customShadows !== undefined && shape.customShadows.length > 0) {
    return shape.customShadows
      .slice(0, MAX_CUSTOM_SHADOWS)
      .map((shadow) => getResolvedCustomShadow(shadow))
  }

  if (shape.customShadow !== undefined) {
    return [getResolvedCustomShadow(shape.customShadow)]
  }

  return [DEFAULT_CUSTOM_SHADOW]
}

export function getCustomShadowWithPatch(
  shadow: CustomShadow,
  patch: Partial<CustomShadow>,
): CustomShadow {
  const hasOpacityPatch = Object.prototype.hasOwnProperty.call(patch, 'opacity')
  const hasInsetPatch = Object.prototype.hasOwnProperty.call(patch, 'inset')

  return {
    offsetX: patch.offsetX ?? shadow.offsetX,
    offsetY: patch.offsetY ?? shadow.offsetY,
    blur: patch.blur ?? shadow.blur,
    spread: patch.spread ?? shadow.spread ?? 0,
    color: patch.color ?? shadow.color,
    ...(!hasOpacityPatch && shadow.opacity !== undefined
      ? { opacity: shadow.opacity }
      : patch.opacity !== undefined
        ? { opacity: patch.opacity }
        : {}),
    ...(!hasInsetPatch && shadow.inset !== undefined
      ? { inset: shadow.inset }
      : patch.inset !== undefined
        ? { inset: patch.inset }
        : {}),
  }
}

// ---- text shadow ----

export function getResolvedTextShadow(
  shadow: TextShadow | undefined,
): TextShadow {
  return shadow ?? DEFAULT_TEXT_SHADOW
}

export function getTextShadowWithPatch(
  shadow: TextShadow,
  patch: Partial<TextShadow>,
): TextShadow {
  const hasOpacityPatch = Object.prototype.hasOwnProperty.call(patch, 'opacity')

  return {
    offsetX: patch.offsetX ?? shadow.offsetX,
    offsetY: patch.offsetY ?? shadow.offsetY,
    blur: patch.blur ?? shadow.blur,
    color: patch.color ?? shadow.color,
    ...(!hasOpacityPatch && shadow.opacity !== undefined
      ? { opacity: shadow.opacity }
      : patch.opacity !== undefined
        ? { opacity: patch.opacity }
        : {}),
  }
}
