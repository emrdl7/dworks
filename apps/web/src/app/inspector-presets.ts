// page.tsx 분할 (Phase 6) — Inspector form의 preset 상수와 enum-like 매핑.
// label / icon / option 배열들. NodeColorControls / TypographyControls /
// LayoutControls / SpacingControls / ShapeControls 등이 공유.
//
// 모두 lookup table이라 회귀 위험 적음. 다른 모듈에서 참조 0건.

import type { LucideIcon } from 'lucide-react'

import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceAround,
  AlignHorizontalSpaceBetween,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Columns2,
  Move,
  PanelTop,
  Rows2,
  Square,
  StretchHorizontal,
  StretchVertical,
  WrapText,
} from 'lucide-react'

import type {
  BorderStyle,
  BuiltInFontFamily,
  FontWeight,
  GradientDirection,
  GradientType,
  ImageAspectRatio,
  ImageFit,
  LayoutAlign,
  LayoutDirection,
  LayoutJustify,
  LayoutWrap,
  NodeTransitionTiming,
  ShadowPreset,
  TextAlign,
  Typography,
} from '@dworks/tree'
import {
  BUILT_IN_FONT_FAMILY_IDS,
  GRADIENT_DIRECTION_IDS,
  GRADIENT_TYPE_IDS,
} from '@dworks/tree'

import type { ResponsiveViewport } from './responsive.js'
import type { ShapeRadiusField, SpacingField } from './schema-fields.js'

// ---- inspector mode types ----

export type SpacingMode = 'all' | 'axis' | 'sides'
export type ShapeRadiusMode = 'all' | 'corners'
export type GradientColorStopField = 'from' | 'to'
export type GradientOpacityStopField = 'fromOpacity' | 'toOpacity'
export type ColorMode = 'solid' | 'gradient'
export type TextShadowNumberField = 'offsetX' | 'offsetY' | 'blur'

// ---- image ----

export const imageAspectRatioLabels = {
  square: '정사각형',
  landscape: '가로형',
  portrait: '세로형',
  wide: '와이드',
} as const

export const imageFitLabels: Record<ImageFit, string> = {
  cover: '채우기',
  contain: '맞춤',
}

export const imageAspectRatioOptions: ImageAspectRatio[] = [
  'square',
  'landscape',
  'portrait',
  'wide',
]
export const imageFitOptions: ImageFit[] = ['cover', 'contain']

// ---- layout intent (page-level container) ----

export const layoutIntentLabels = {
  stack: '세로 쌓기',
  grid: '그리드',
  inline: '가로 배치',
  split: '분할',
  'dashboard-grid': '대시보드 그리드',
} as const

// ---- typography ----

export const fontWeightLabels: Record<FontWeight, string> = {
  '100': '씬',
  '200': '엑스트라 라이트',
  '300': '라이트',
  '400': '보통',
  '500': '중간',
  '600': '세미볼드',
  '700': '볼드',
  '800': '엑스트라볼드',
  '900': '블랙',
}

export const textAlignTitles: Record<TextAlign, string> = {
  left: '왼쪽 정렬',
  center: '가운데 정렬',
  right: '오른쪽 정렬',
}
export const textAlignIcons: Record<TextAlign, LucideIcon> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
}

export const builtInFontFamilyLabels: Record<BuiltInFontFamily, string> = {
  sans: '산세리프',
  serif: '세리프',
  mono: '고정폭',
}
export const builtInFontFamilyOptions = [...BUILT_IN_FONT_FAMILY_IDS]

export const fontWeightOptions: FontWeight[] = [
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
]
export const textAlignOptions: TextAlign[] = ['left', 'center', 'right']

// ---- shape ----

export const borderStyleLabels: Record<BorderStyle, string> = {
  solid: '실선',
  dashed: '점선',
  none: '없음',
}
export const borderStyleOptions: BorderStyle[] = ['solid', 'dashed', 'none']

export const shadowPresetLabels: Record<ShadowPreset, string> = {
  none: '없음',
  sm: '옅게',
  md: '기본',
  lg: '진하게',
  xl: '매우 진하게',
}

// swatch grid 아래 짧은 레이블 — 5개 그리드 폭 안에 들어가도록 단어 단축.
export const shadowPresetShortLabels: Record<ShadowPreset, string> = {
  none: '없음',
  sm: 'S',
  md: 'M',
  lg: 'L',
  xl: 'XL',
}
export const shadowPresetOptions: ShadowPreset[] = ['none', 'sm', 'md', 'lg', 'xl']

export const shapeCornerRadiusLabels: Record<ShapeRadiusField, string> = {
  radiusTopLeft: '좌상',
  radiusTopRight: '우상',
  radiusBottomLeft: '좌하',
  radiusBottomRight: '우하',
}

// ---- transition ----

export const nodeTransitionTimingLabels: Record<NodeTransitionTiming, string> = {
  linear: '선형',
  ease: '기본',
  'ease-in': '시작 가속',
  'ease-out': '끝 가속',
  'ease-in-out': '양쪽 가속',
  custom: '사용자 지정',
  'step-start': '즉시',
  'step-end': '도약',
}

// ---- layout (flex) ----

export const layoutDirectionLabels: Record<LayoutDirection, string> = {
  row: '가로',
  column: '세로',
}
export const layoutDirectionIcons: Record<LayoutDirection, LucideIcon> = {
  row: Columns2,
  column: Rows2,
}

export const layoutAlignLabels: Record<LayoutAlign, string> = {
  start: '시작',
  center: '가운데',
  end: '끝',
  stretch: '채움',
}
export const layoutAlignIcons: Record<LayoutAlign, LucideIcon> = {
  start: AlignVerticalJustifyStart,
  center: AlignVerticalJustifyCenter,
  end: AlignVerticalJustifyEnd,
  stretch: StretchVertical,
}

export const layoutJustifyLabels: Record<LayoutJustify, string> = {
  start: '시작',
  center: '가운데',
  end: '끝',
  between: '양끝',
  evenly: '균등',
}
export const layoutJustifyIcons: Record<LayoutJustify, LucideIcon> = {
  start: AlignHorizontalJustifyStart,
  center: AlignHorizontalJustifyCenter,
  end: AlignHorizontalJustifyEnd,
  between: AlignHorizontalSpaceBetween,
  evenly: AlignHorizontalSpaceAround,
}

export const layoutWrapLabels: Record<LayoutWrap, string> = {
  nowrap: '고정',
  wrap: '줄바꿈',
}
export const layoutWrapIcons: Record<LayoutWrap, LucideIcon> = {
  nowrap: StretchHorizontal,
  wrap: WrapText,
}

export const layoutDirectionOptions: LayoutDirection[] = ['row', 'column']
export const layoutAlignOptions: LayoutAlign[] = [
  'start',
  'center',
  'end',
  'stretch',
]
export const layoutJustifyOptions: LayoutJustify[] = [
  'start',
  'center',
  'end',
  'between',
  'evenly',
]
export const layoutWrapOptions: LayoutWrap[] = ['nowrap', 'wrap']

// ---- gradient ----

export const gradientDirectionLabels: Record<GradientDirection, string> = {
  'to-top': '위로',
  'to-top-right': '우상',
  'to-right': '오른쪽',
  'to-bottom-right': '우하',
  'to-bottom': '아래로',
  'to-bottom-left': '좌하',
  'to-left': '왼쪽',
  'to-top-left': '좌상',
}
export const gradientDirectionIcons: Record<GradientDirection, LucideIcon> = {
  'to-top': ArrowUp,
  'to-top-right': ArrowUpRight,
  'to-right': ArrowRight,
  'to-bottom-right': ArrowDownRight,
  'to-bottom': ArrowDown,
  'to-bottom-left': ArrowDownLeft,
  'to-left': ArrowLeft,
  'to-top-left': ArrowUpLeft,
}
export const gradientTypeLabels: Record<GradientType, string> = {
  linear: '선형',
  radial: '원형',
  conic: '원뿔형',
}

export const gradientDirectionOptions: GradientDirection[] = [
  ...GRADIENT_DIRECTION_IDS,
]
export const gradientTypeOptions: GradientType[] = [...GRADIENT_TYPE_IDS]

// ---- font ----

export const REGISTERED_FONT_FAMILY_OPTION_PREFIX = 'registered-family:'
export const MAX_FONT_UPLOAD_FILES = 20

// ---- spacing ----

export const spacingModes: SpacingMode[] = ['all', 'axis', 'sides']
export const spacingModeLabels: Record<SpacingMode, string> = {
  all: '전체',
  axis: 'X-Y',
  sides: '4면',
}
export const spacingModeIcons: Record<SpacingMode, LucideIcon> = {
  all: Square,
  axis: Move,
  sides: PanelTop,
}

export const paddingSpacingFields: readonly SpacingField[] = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
]
export const marginSpacingFields: readonly SpacingField[] = [
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
]
export const paddingHorizontalFields: readonly SpacingField[] = [
  'paddingLeft',
  'paddingRight',
]
export const paddingVerticalFields: readonly SpacingField[] = [
  'paddingTop',
  'paddingBottom',
]
export const marginHorizontalFields: readonly SpacingField[] = [
  'marginLeft',
  'marginRight',
]
export const marginVerticalFields: readonly SpacingField[] = [
  'marginTop',
  'marginBottom',
]

// ---- responsive ----

export const responsiveViewportOptions: ResponsiveViewport[] = [
  'mobile',
  'tablet',
  'desktop',
]

// ---- transform origin (3x3 grid presets) ----

export interface TransformOriginPreset {
  id: string
  label: string
  x: number
  y: number
}

export const TRANSFORM_ORIGIN_PRESETS: ReadonlyArray<TransformOriginPreset> = [
  { id: 'top-left', label: '좌상', x: 0, y: 0 },
  { id: 'top', label: '상', x: 50, y: 0 },
  { id: 'top-right', label: '우상', x: 100, y: 0 },
  { id: 'left', label: '좌', x: 0, y: 50 },
  { id: 'center', label: '중앙', x: 50, y: 50 },
  { id: 'right', label: '우', x: 100, y: 50 },
  { id: 'bottom-left', label: '좌하', x: 0, y: 100 },
  { id: 'bottom', label: '하', x: 50, y: 100 },
  { id: 'bottom-right', label: '우하', x: 100, y: 100 },
]

// ---- typography presets (chip 형태로 인스펙터에서 표시) ----

export interface TypographyPreset {
  id: string
  label: string
  typography: Partial<Typography>
}

export const TYPOGRAPHY_PRESETS = [
  {
    id: 'caption',
    label: '캡션',
    typography: { fontSize: 13, fontWeight: '400', lineHeight: 1.4, letterSpacing: 0 },
  },
  {
    id: 'body',
    label: '본문',
    typography: { fontSize: 16, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0 },
  },
  {
    id: 'subtitle',
    label: '소제목',
    typography: { fontSize: 18, fontWeight: '600', lineHeight: 1.4, letterSpacing: 0 },
  },
  {
    id: 'heading',
    label: '제목',
    typography: { fontSize: 24, fontWeight: '700', lineHeight: 1.3, letterSpacing: 0 },
  },
  {
    id: 'display',
    label: '큰 제목',
    typography: { fontSize: 36, fontWeight: '700', lineHeight: 1.2, letterSpacing: 0 },
  },
] as const satisfies readonly TypographyPreset[]
