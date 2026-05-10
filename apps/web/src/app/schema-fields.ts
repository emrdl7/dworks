// 공유 schema field arrays + derived types — design-resolver 결과를 다루는 모듈들이
// 같은 키 목록을 사용해야 하므로 _단일 source_로 분리.

export const typographyFields = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'fontFamily',
  'textShadow',
] as const

export const spacingFields = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'gap',
] as const

export const shapeFields = [
  'radius',
  'radiusTopLeft',
  'radiusTopRight',
  'radiusBottomRight',
  'radiusBottomLeft',
  'borderWidth',
  'borderColor',
  'borderOpacity',
  'borderStyle',
  'shadow',
  'customShadow',
] as const

export const colorFields = [
  'backgroundColor',
  'backgroundOpacity',
  'backgroundGradient',
  'hoverBackgroundColor',
  'hoverTextColor',
  'activeBackgroundColor',
  'activeTextColor',
  'focusBackgroundColor',
  'focusTextColor',
  'disabledBackgroundColor',
  'disabledTextColor',
  'textColor',
  'textOpacity',
  'accentColor',
  'accentOpacity',
] as const

export const layoutFields = ['direction', 'align', 'justify', 'wrap'] as const

export const imagePresentationFields = [
  'fit',
  'overlayColor',
  'overlayOpacity',
  'overlayGradient',
  'filter',
] as const

export type SpacingField = (typeof spacingFields)[number]
export type ColorField = Extract<
  (typeof colorFields)[number],
  'backgroundColor' | 'textColor' | 'accentColor'
>
export type ColorOpacityField = Extract<
  (typeof colorFields)[number],
  'backgroundOpacity' | 'textOpacity' | 'accentOpacity'
>
export type ShapeRadiusField = Extract<
  (typeof shapeFields)[number],
  'radiusTopLeft' | 'radiusTopRight' | 'radiusBottomRight' | 'radiusBottomLeft'
>
export type CustomShadowNumberField = 'offsetX' | 'offsetY' | 'blur' | 'spread'
export type ImagePresentationField = (typeof imagePresentationFields)[number]

export const shapeCornerRadiusFields: readonly ShapeRadiusField[] = [
  'radiusTopLeft',
  'radiusTopRight',
  'radiusBottomLeft',
  'radiusBottomRight',
]
