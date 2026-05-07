// @dworks/tree — JSON 의도 트리의 source-of-truth 스키마.
// DECISIONS D2 (E Hybrid 제품 방향) + M0.5 범위 동결 (PLAN.md §4 M0.5).
//
// M0.5 단계: 5~7개 노드 타입 + 최소 메타. 본격 스키마는 M4 PoC에서 확장.

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

export const contentRoleSchema = z.enum([
  'heading',
  'body',
  'caption',
  'cta',
  'label',
  'value',
])
export type ContentRole = z.infer<typeof contentRoleSchema>

// ---- 명시적 타입 선언 (재귀 union의 안정 추론 위해 먼저 선언) ----

interface BaseNodeMeta {
  id: string
  editKind: EditKind
  responsive?: ResponsiveIntent
  styleTokens?: string[]
}

export interface TextNode extends BaseNodeMeta {
  type: 'text'
  content: string
  emphasis?: Emphasis
  contentRole?: ContentRole
}

export interface ButtonNode extends BaseNodeMeta {
  type: 'button'
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  href?: string
  contentRole?: ContentRole
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
}

export const textNodeSchema: z.ZodType<TextNode> = z.object({
  ...baseShape,
  type: z.literal('text'),
  content: z.string(),
  emphasis: emphasisSchema.optional(),
  contentRole: contentRoleSchema.optional(),
})

export const buttonNodeSchema: z.ZodType<ButtonNode> = z.object({
  ...baseShape,
  type: z.literal('button'),
  label: z.string(),
  variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
  href: z.string().optional(),
  contentRole: contentRoleSchema.optional(),
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
})
export type Tree = z.infer<typeof treeSchema>

export const TREE_NODE_TYPES = [
  'text',
  'button',
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
