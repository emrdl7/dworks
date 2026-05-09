// @dworks/tree-editor — JSON 입력용 Zod schema.
// m2-edit-fixtures round 2 합의: schema.ts는 외부 JSON 입력 검증 전용,
// operations.ts는 실행 로직. 관심사 분리.

import { z } from 'zod'
import {
  focalPointSchema,
  imageAspectRatioSchema,
  imagePresentationSchema,
  nodeColorSchema,
  nodeCursorSchema,
  nodeLayoutSchema,
  nodePointerEventsSchema,
  nodeTransformSchema,
  nodeTransitionSchema,
  opacitySchema,
  shapeSchema,
  spacingSchema,
  styleTokensSchema,
  typographySchema,
} from '@dworks/tree'

import type {
  DeleteNodeOperation,
  DuplicateNodeOperation,
  EditOperation,
  MoveNodeOperation,
  UpdateButtonLabelOperation,
  UpdateColorOperation,
  UpdateImageOperation,
  UpdateLayoutOperation,
  UpdateNodeMetaOperation,
  UpdateShapeOperation,
  UpdateSpacingOperation,
  UpdateStyleTokensOperation,
  UpdateTextOperation,
  UpdateTextTypographyOperation,
} from './operations.js'

export const updateTextOperationSchema: z.ZodType<UpdateTextOperation> = z.object({
  type: z.literal('updateText'),
  nodeId: z.string().min(1),
  content: z.string(),
})

export const updateTextTypographyOperationSchema: z.ZodType<UpdateTextTypographyOperation> =
  z.object({
    type: z.literal('updateTextTypography'),
    nodeId: z.string().min(1),
    patch: typographySchema,
  })

export const updateSpacingOperationSchema: z.ZodType<UpdateSpacingOperation> =
  z.object({
    type: z.literal('updateSpacing'),
    nodeId: z.string().min(1),
    patch: spacingSchema,
  })

export const updateShapeOperationSchema: z.ZodType<UpdateShapeOperation> =
  z.object({
    type: z.literal('updateShape'),
    nodeId: z.string().min(1),
    patch: shapeSchema,
  })

export const updateColorOperationSchema: z.ZodType<UpdateColorOperation> =
  z.object({
    type: z.literal('updateColor'),
    nodeId: z.string().min(1),
    patch: nodeColorSchema,
  })

export const updateLayoutOperationSchema: z.ZodType<UpdateLayoutOperation> =
  z.object({
    type: z.literal('updateLayout'),
    nodeId: z.string().min(1),
    patch: nodeLayoutSchema,
  })

export const updateNodeMetaOperationSchema: z.ZodType<UpdateNodeMetaOperation> =
  z.object({
    type: z.literal('updateNodeMeta'),
    nodeId: z.string().min(1),
    patch: z.object({
      hidden: z.boolean().optional(),
      disabled: z.boolean().optional(),
      opacity: opacitySchema.optional(),
      pointerEvents: nodePointerEventsSchema.optional(),
      transition: nodeTransitionSchema.optional(),
      transform: nodeTransformSchema.optional(),
      cursor: nodeCursorSchema.optional(),
    }),
  })

export const updateButtonLabelOperationSchema: z.ZodType<UpdateButtonLabelOperation> =
  z.object({
    type: z.literal('updateButtonLabel'),
    nodeId: z.string().min(1),
    label: z.string(),
  })

export const updateImageOperationSchema: z.ZodType<UpdateImageOperation> =
  z.object({
    type: z.literal('updateImage'),
    nodeId: z.string().min(1),
    src: z.string().optional(),
    alt: z.string().optional(),
    aspectRatio: imageAspectRatioSchema.optional(),
    focalPoint: focalPointSchema.optional(),
    presentation: imagePresentationSchema.optional(),
  })

export const moveNodeOperationSchema: z.ZodType<MoveNodeOperation> = z.object({
  type: z.literal('moveNode'),
  nodeId: z.string().min(1),
  direction: z.enum(['up', 'down']),
})

export const duplicateNodeOperationSchema: z.ZodType<DuplicateNodeOperation> =
  z.object({
    type: z.literal('duplicateNode'),
    nodeId: z.string().min(1),
    newNodeId: z.string().min(1).optional(),
  })

export const deleteNodeOperationSchema: z.ZodType<DeleteNodeOperation> = z.object({
  type: z.literal('deleteNode'),
  nodeId: z.string().min(1),
})

export const updateStyleTokensOperationSchema: z.ZodType<UpdateStyleTokensOperation> =
  z.object({
    type: z.literal('updateStyleTokens'),
    patch: styleTokensSchema,
  })

// discriminatedUnion으로 type 리터럴 분기 — exhaustiveness check 강제.
export const editOperationSchema = z.discriminatedUnion('type', [
  updateTextOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateText'>
    nodeId: z.ZodString
    content: z.ZodString
  }>,
  updateTextTypographyOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateTextTypography'>
    nodeId: z.ZodString
    patch: typeof typographySchema
  }>,
  updateSpacingOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateSpacing'>
    nodeId: z.ZodString
    patch: typeof spacingSchema
  }>,
  updateShapeOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateShape'>
    nodeId: z.ZodString
    patch: typeof shapeSchema
  }>,
  updateColorOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateColor'>
    nodeId: z.ZodString
    patch: typeof nodeColorSchema
  }>,
  updateLayoutOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateLayout'>
    nodeId: z.ZodString
    patch: typeof nodeLayoutSchema
  }>,
  updateNodeMetaOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateNodeMeta'>
    nodeId: z.ZodString
    patch: z.ZodObject<{
      hidden: z.ZodOptional<z.ZodBoolean>
      disabled: z.ZodOptional<z.ZodBoolean>
      opacity: z.ZodOptional<typeof opacitySchema>
      pointerEvents: z.ZodOptional<typeof nodePointerEventsSchema>
      transition: z.ZodOptional<typeof nodeTransitionSchema>
      transform: z.ZodOptional<typeof nodeTransformSchema>
      cursor: z.ZodOptional<typeof nodeCursorSchema>
    }>
  }>,
  updateButtonLabelOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateButtonLabel'>
    nodeId: z.ZodString
    label: z.ZodString
  }>,
  updateImageOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateImage'>
    nodeId: z.ZodString
    src: z.ZodOptional<z.ZodString>
    alt: z.ZodOptional<z.ZodString>
    aspectRatio: z.ZodOptional<typeof imageAspectRatioSchema>
    focalPoint: z.ZodOptional<typeof focalPointSchema>
    presentation: z.ZodOptional<typeof imagePresentationSchema>
  }>,
  moveNodeOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'moveNode'>
    nodeId: z.ZodString
    direction: z.ZodEnum<{ up: 'up'; down: 'down' }>
  }>,
  duplicateNodeOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'duplicateNode'>
    nodeId: z.ZodString
    newNodeId: z.ZodOptional<z.ZodString>
  }>,
  deleteNodeOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'deleteNode'>
    nodeId: z.ZodString
  }>,
  updateStyleTokensOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateStyleTokens'>
    patch: typeof styleTokensSchema
  }>,
]) satisfies z.ZodType<EditOperation>

export const editSequenceSchema = z.object({
  id: z.string().min(1),
  // 시퀀스 파일 위치 기준 상대 경로 (Codex round 2 §2.2 합의).
  tree: z.string().min(1),
  intent: z.string().min(1),
  operations: z.array(editOperationSchema).min(1),
})
export type EditSequence = z.infer<typeof editSequenceSchema>
