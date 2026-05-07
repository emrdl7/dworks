// @dworks/tree-editor — JSON 입력용 Zod schema.
// m2-edit-fixtures round 2 합의: schema.ts는 외부 JSON 입력 검증 전용,
// operations.ts는 실행 로직. 관심사 분리.

import { z } from 'zod'

import type {
  EditOperation,
  UpdateButtonLabelOperation,
  UpdateTextOperation,
} from './operations.js'

export const updateTextOperationSchema: z.ZodType<UpdateTextOperation> = z.object({
  type: z.literal('updateText'),
  nodeId: z.string().min(1),
  content: z.string(),
})

export const updateButtonLabelOperationSchema: z.ZodType<UpdateButtonLabelOperation> =
  z.object({
    type: z.literal('updateButtonLabel'),
    nodeId: z.string().min(1),
    label: z.string(),
  })

// discriminatedUnion으로 type 리터럴 분기 — exhaustiveness check 강제.
export const editOperationSchema = z.discriminatedUnion('type', [
  updateTextOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateText'>
    nodeId: z.ZodString
    content: z.ZodString
  }>,
  updateButtonLabelOperationSchema as z.ZodObject<{
    type: z.ZodLiteral<'updateButtonLabel'>
    nodeId: z.ZodString
    label: z.ZodString
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
