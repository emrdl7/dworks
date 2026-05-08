// @dworks/tree — JSON 의도 트리의 source-of-truth 스키마.
// DECISIONS D2 (E Hybrid 제품 방향) + M0.5 범위 동결 (PLAN.md §4 M0.5).
//
// M0.5 최소 스키마에서 시작했고, M2에서 image 노드까지 확장했다.
// 본격 스키마는 M4 PoC에서 확장.

import { z } from 'zod'

// ---- 메타 enum ----

export const editKindSchema = z.enum(['text', 'media', 'structure', 'style'])
export type EditKind = z.infer<typeof editKindSchema>

export const responsiveIntentSchema = z
  .object({
    mobile: z.string().optional(),
    tablet: z.string().optional(),
    desktop: z.string().optional(),
  })
  .optional()
export type ResponsiveIntent = z.infer<typeof responsiveIntentSchema>

export const emphasisSchema = z.enum([
  'heading-1',
  'heading-2',
  'heading-3',
  'body',
  'caption',
])
export type Emphasis = z.infer<typeof emphasisSchema>

export const layoutIntentSchema = z.enum([
  'stack',
  'grid',
  'inline',
  'split',
  'dashboard-grid',
])
export type LayoutIntent = z.infer<typeof layoutIntentSchema>

export const LAYOUT_DIRECTION_IDS = ['row', 'column'] as const
export const layoutDirectionSchema = z.enum(LAYOUT_DIRECTION_IDS)
export type LayoutDirection = z.infer<typeof layoutDirectionSchema>

export const LAYOUT_ALIGN_IDS = ['start', 'center', 'end', 'stretch'] as const
export const layoutAlignSchema = z.enum(LAYOUT_ALIGN_IDS)
export type LayoutAlign = z.infer<typeof layoutAlignSchema>

export const LAYOUT_JUSTIFY_IDS = [
  'start',
  'center',
  'end',
  'between',
  'evenly',
] as const
export const layoutJustifySchema = z.enum(LAYOUT_JUSTIFY_IDS)
export type LayoutJustify = z.infer<typeof layoutJustifySchema>

export const LAYOUT_WRAP_IDS = ['nowrap', 'wrap'] as const
export const layoutWrapSchema = z.enum(LAYOUT_WRAP_IDS)
export type LayoutWrap = z.infer<typeof layoutWrapSchema>

export const nodeLayoutSchema = z.object({
  direction: layoutDirectionSchema.optional(),
  align: layoutAlignSchema.optional(),
  justify: layoutJustifySchema.optional(),
  wrap: layoutWrapSchema.optional(),
})
export type NodeLayout = z.infer<typeof nodeLayoutSchema>

export const contentRoleSchema = z.enum([
  'heading',
  'body',
  'caption',
  'cta',
  'label',
  'value',
])
export type ContentRole = z.infer<typeof contentRoleSchema>

export const FONT_WEIGHT_IDS = [
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const
export const fontWeightSchema = z.enum(FONT_WEIGHT_IDS)
export type FontWeight = z.infer<typeof fontWeightSchema>

export const TEXT_ALIGN_IDS = ['left', 'center', 'right'] as const
export const textAlignSchema = z.enum(TEXT_ALIGN_IDS)
export type TextAlign = z.infer<typeof textAlignSchema>

export const BUILT_IN_FONT_FAMILY_IDS = ['sans', 'serif', 'mono'] as const
export const FONT_FAMILY_IDS = BUILT_IN_FONT_FAMILY_IDS
export type BuiltInFontFamily = (typeof BUILT_IN_FONT_FAMILY_IDS)[number]
export const fontFamilySchema = z.string().min(1)
export type FontFamily = z.infer<typeof fontFamilySchema>

export const typographySchema = z.object({
  fontSize: z.number().min(8).max(120).optional(),
  fontWeight: fontWeightSchema.optional(),
  lineHeight: z.number().min(0.8).max(3).optional(),
  letterSpacing: z.number().min(-0.1).max(0.2).optional(),
  textAlign: textAlignSchema.optional(),
  fontFamily: fontFamilySchema.optional(),
})
export type Typography = z.infer<typeof typographySchema>

export const spacingSchema = z.object({
  paddingTop: z.number().min(0).max(500).optional(),
  paddingRight: z.number().min(0).max(500).optional(),
  paddingBottom: z.number().min(0).max(500).optional(),
  paddingLeft: z.number().min(0).max(500).optional(),
  marginTop: z.number().min(-200).max(500).optional(),
  marginRight: z.number().min(-200).max(500).optional(),
  marginBottom: z.number().min(-200).max(500).optional(),
  marginLeft: z.number().min(-200).max(500).optional(),
  gap: z.number().min(0).max(200).optional(),
})
export type Spacing = z.infer<typeof spacingSchema>

export const BORDER_STYLE_IDS = ['solid', 'dashed', 'none'] as const
export const borderStyleSchema = z.enum(BORDER_STYLE_IDS)
export type BorderStyle = z.infer<typeof borderStyleSchema>

export const SHADOW_PRESET_IDS = ['none', 'sm', 'md', 'lg', 'xl'] as const
export const shadowPresetSchema = z.enum(SHADOW_PRESET_IDS)
export type ShadowPreset = z.infer<typeof shadowPresetSchema>

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
export const shapeSchema = z.object({
  radius: z.number().min(0).max(120).optional(),
  borderWidth: z.number().min(0).max(20).optional(),
  borderColor: hexColorSchema.optional(),
  borderStyle: borderStyleSchema.optional(),
  shadow: shadowPresetSchema.optional(),
})
export type Shape = z.infer<typeof shapeSchema>

export const nodeColorSchema = z.object({
  backgroundColor: hexColorSchema.optional(),
  textColor: hexColorSchema.optional(),
})
export type NodeColor = z.infer<typeof nodeColorSchema>

export const IMAGE_FIT_IDS = ['cover', 'contain'] as const
export const imageFitSchema = z.enum(IMAGE_FIT_IDS)
export type ImageFit = z.infer<typeof imageFitSchema>

export const imageAspectRatioSchema = z.enum([
  'square',
  'landscape',
  'portrait',
  'wide',
])
export type ImageAspectRatio = z.infer<typeof imageAspectRatioSchema>

export const focalPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
})
export type FocalPoint = z.infer<typeof focalPointSchema>

export const imagePresentationSchema = z.object({
  fit: imageFitSchema.optional(),
  overlayColor: hexColorSchema.optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
})
export type ImagePresentation = z.infer<typeof imagePresentationSchema>

export const COLOR_PRESET_IDS = [
  'mint',
  'navy',
  'sand',
  'plum',
  'graphite',
] as const
export const colorPresetSchema = z.enum(COLOR_PRESET_IDS)
export type ColorPreset = z.infer<typeof colorPresetSchema>

export interface ColorPresetTokens {
  surface: string
  surfaceMuted: string
  textPrimary: string
  textMuted: string
  accent: string
  accentText: string
  heroSurface: string
  heroText: string
  border: string
  imageSurface: string
  imageAccent: string
}

export const COLOR_PRESETS: Record<ColorPreset, ColorPresetTokens> = {
  mint: {
    surface: '#f5f7f4',
    surfaceMuted: '#fbfcfa',
    textPrimary: '#18211d',
    textMuted: '#5d6962',
    accent: '#1b7f72',
    accentText: '#ffffff',
    heroSurface: '#102822',
    heroText: '#ffffff',
    border: '#d7ddd2',
    imageSurface: '#d9e4df',
    imageAccent: '#86b4aa',
  },
  navy: {
    surface: '#eef2f7',
    surfaceMuted: '#fbfcfd',
    textPrimary: '#0e1a2e',
    textMuted: '#53627a',
    accent: '#2a5fa0',
    accentText: '#ffffff',
    heroSurface: '#0e1a2e',
    heroText: '#ffffff',
    border: '#d2dae6',
    imageSurface: '#dbe5f2',
    imageAccent: '#8aa8c8',
  },
  sand: {
    surface: '#f6f1ea',
    surfaceMuted: '#fcf9f4',
    textPrimary: '#2a221a',
    textMuted: '#6d5b48',
    accent: '#96672f',
    accentText: '#ffffff',
    heroSurface: '#3c2b1d',
    heroText: '#ffffff',
    border: '#e0d5c6',
    imageSurface: '#eadfce',
    imageAccent: '#c49a68',
  },
  plum: {
    surface: '#f4eef5',
    surfaceMuted: '#fbf9fb',
    textPrimary: '#22112a',
    textMuted: '#68556f',
    accent: '#7d3aa0',
    accentText: '#ffffff',
    heroSurface: '#25112c',
    heroText: '#ffffff',
    border: '#ded1e2',
    imageSurface: '#eaddea',
    imageAccent: '#b289c1',
  },
  graphite: {
    surface: '#1a1d1f',
    surfaceMuted: '#26292c',
    textPrimary: '#f5f6f7',
    textMuted: '#b9c0c4',
    accent: '#82c2c5',
    accentText: '#0f1b1d',
    heroSurface: '#0f1113',
    heroText: '#ffffff',
    border: '#383d40',
    imageSurface: '#2d3336',
    imageAccent: '#5f777b',
  },
}

export const styleTokensSchema = z.object({
  colorPreset: colorPresetSchema.optional(),
})
export type StyleTokens = z.infer<typeof styleTokensSchema>

// ---- 명시적 타입 선언 (재귀 union의 안정 추론 위해 먼저 선언) ----

interface BaseNodeMeta {
  id: string
  editKind: EditKind
  responsive?: ResponsiveIntent
  styleTokens?: string[]
  spacing?: Spacing
  shape?: Shape
  color?: NodeColor
  layout?: NodeLayout
}

export interface TextNode extends BaseNodeMeta {
  type: 'text'
  content: string
  emphasis?: Emphasis
  contentRole?: ContentRole
  typography?: Typography
}

export interface ButtonNode extends BaseNodeMeta {
  type: 'button'
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  href?: string
  contentRole?: ContentRole
}

export interface ImageNode extends BaseNodeMeta {
  type: 'image'
  src: string
  alt: string
  aspectRatio?: ImageAspectRatio
  focalPoint?: FocalPoint
  presentation?: ImagePresentation
}

export interface SectionNode extends BaseNodeMeta {
  type: 'section'
  role?: string
  layoutIntent?: LayoutIntent
  children: TreeNode[]
}

export interface HeroNode extends BaseNodeMeta {
  type: 'hero'
  layoutIntent?: LayoutIntent
  children: TreeNode[]
}

export interface CardNode extends BaseNodeMeta {
  type: 'card'
  layoutIntent?: LayoutIntent
  children: TreeNode[]
}

export interface ListNode extends BaseNodeMeta {
  type: 'list'
  variant?: 'ordered' | 'unordered' | 'description'
  layoutIntent?: LayoutIntent
  children: TreeNode[]
}

export interface FormNode extends BaseNodeMeta {
  type: 'form'
  action?: string
  method?: 'get' | 'post'
  layoutIntent?: LayoutIntent
  children: TreeNode[]
}

export type TreeNode =
  | TextNode
  | ButtonNode
  | ImageNode
  | SectionNode
  | HeroNode
  | CardNode
  | ListNode
  | FormNode

// ---- Zod 스키마 (재귀는 z.lazy + 명시적 ZodType<TreeNode>) ----

const baseShape = {
  id: z.string().min(1),
  editKind: editKindSchema,
  responsive: responsiveIntentSchema,
  styleTokens: z.array(z.string()).optional(),
  spacing: spacingSchema.optional(),
  shape: shapeSchema.optional(),
  color: nodeColorSchema.optional(),
  layout: nodeLayoutSchema.optional(),
}

export const textNodeSchema: z.ZodType<TextNode> = z.object({
  ...baseShape,
  type: z.literal('text'),
  content: z.string(),
  emphasis: emphasisSchema.optional(),
  contentRole: contentRoleSchema.optional(),
  typography: typographySchema.optional(),
})

export const buttonNodeSchema: z.ZodType<ButtonNode> = z.object({
  ...baseShape,
  type: z.literal('button'),
  label: z.string(),
  variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
  href: z.string().optional(),
  contentRole: contentRoleSchema.optional(),
})

export const imageNodeSchema: z.ZodType<ImageNode> = z.object({
  ...baseShape,
  type: z.literal('image'),
  src: z.string(),
  alt: z.string(),
  aspectRatio: imageAspectRatioSchema.optional(),
  focalPoint: focalPointSchema.optional(),
  presentation: imagePresentationSchema.optional(),
})

// 재귀 union을 위해 children 필드는 z.lazy로 후행 참조.
const childrenLazy = z.lazy((): z.ZodType<TreeNode[]> =>
  z.array(treeNodeSchema),
)

export const sectionNodeSchema: z.ZodType<SectionNode> = z.object({
  ...baseShape,
  type: z.literal('section'),
  role: z.string().optional(),
  layoutIntent: layoutIntentSchema.optional(),
  children: childrenLazy,
})

export const heroNodeSchema: z.ZodType<HeroNode> = z.object({
  ...baseShape,
  type: z.literal('hero'),
  layoutIntent: layoutIntentSchema.optional(),
  children: childrenLazy,
})

export const cardNodeSchema: z.ZodType<CardNode> = z.object({
  ...baseShape,
  type: z.literal('card'),
  layoutIntent: layoutIntentSchema.optional(),
  children: childrenLazy,
})

export const listNodeSchema: z.ZodType<ListNode> = z.object({
  ...baseShape,
  type: z.literal('list'),
  variant: z.enum(['ordered', 'unordered', 'description']).optional(),
  layoutIntent: layoutIntentSchema.optional(),
  children: childrenLazy,
})

export const formNodeSchema: z.ZodType<FormNode> = z.object({
  ...baseShape,
  type: z.literal('form'),
  action: z.string().optional(),
  method: z.enum(['get', 'post']).optional(),
  layoutIntent: layoutIntentSchema.optional(),
  children: childrenLazy,
})

// 재귀 자식 노드 union. discriminatedUnion은 z.lazy + z.ZodType<T> 조합과 호환이
// 약해, type 리터럴 분기는 각 노드 schema의 z.literal('...')로 강제하고
// union 자체는 z.union으로 합친다.
export const treeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.union([
    textNodeSchema,
    buttonNodeSchema,
    imageNodeSchema,
    sectionNodeSchema,
    heroNodeSchema,
    cardNodeSchema,
    listNodeSchema,
    formNodeSchema,
  ]),
)

// ---- 트리 루트 ----

export const treeSchema = z.object({
  version: z.literal('1'),
  root: treeNodeSchema,
  styleTokens: styleTokensSchema.optional(),
})
export type Tree = z.infer<typeof treeSchema>

export const TREE_NODE_TYPES = [
  'text',
  'button',
  'image',
  'section',
  'hero',
  'card',
  'list',
  'form',
] as const
export type TreeNodeType = (typeof TREE_NODE_TYPES)[number]

export const LAYOUT_INTENTS = [
  'stack',
  'grid',
  'inline',
  'split',
  'dashboard-grid',
] as const

export const CONTENT_ROLES = [
  'heading',
  'body',
  'caption',
  'cta',
  'label',
  'value',
] as const

export const IMAGE_ASPECT_RATIOS = [
  'square',
  'landscape',
  'portrait',
  'wide',
] as const
