// @dworks/edit-eval — D6 편집 품질 평가 타입.
// P0 디자인 품질 eval과 달리 편집 전후/시퀀스를 입력으로 본다.

import { z } from 'zod'

import {
  judgeModelSchema,
  judgeStatusSchema,
  suggestedActionSchema,
} from '@dworks/eval'
import { editOperationSchema, type EditOperation } from '@dworks/tree-editor'

export const editAxisIdSchema = z.enum([
  'selection-accuracy',
  'edit-control-fit',
  'layout-preservation-after-edit',
  'user-intent-preservation',
  'output-tidiness',
])
export type EditAxisId = z.infer<typeof editAxisIdSchema>

export const editViewportLabelSchema = z.enum(['mobile', 'tablet', 'desktop'])
export type EditViewportLabel = z.infer<typeof editViewportLabelSchema>

export const editViewportScreenshotSchema = z.object({
  viewport: editViewportLabelSchema,
  width: z.number().int().positive().optional(),
  screenshotPath: z.string().optional(),
  base64Png: z.string().optional(),
})
export type EditViewportScreenshot = z.infer<typeof editViewportScreenshotSchema>

export const editEvalInputSchema = z.object({
  briefId: z.string().min(1),
  operationSummary: z.string().min(1),
  beforeScreenshots: z.array(editViewportScreenshotSchema),
  afterScreenshots: z.array(editViewportScreenshotSchema),
  editSequence: z.array(editOperationSchema).optional(),
})
export type EditEvalInput = Omit<
  z.infer<typeof editEvalInputSchema>,
  'editSequence'
> & {
  editSequence?: EditOperation[]
}

export const editAxisScoreSchema = z.object({
  axis: editAxisIdSchema,
  score: z.number().int().min(0).max(5),
  reason: z.string(),
  evidence: z.array(z.string()),
  judgeStatus: judgeStatusSchema,
  suggestedAction: suggestedActionSchema,
  judgeModel: judgeModelSchema,
  judgeModelVersion: z.string().optional(),
})
export type EditAxisScore = z.infer<typeof editAxisScoreSchema>

export const editEvalResultSchema = z.object({
  briefId: z.string(),
  runId: z.string(),
  ranAt: z.string(),
  operationSummary: z.string(),
  axes: z.array(editAxisScoreSchema),
  beforeScreenshots: z.array(editViewportScreenshotSchema),
  afterScreenshots: z.array(editViewportScreenshotSchema),
  editSequence: z.array(editOperationSchema).optional(),
})
export type EditEvalResult = Omit<
  z.infer<typeof editEvalResultSchema>,
  'editSequence'
> & {
  editSequence?: EditOperation[]
}
