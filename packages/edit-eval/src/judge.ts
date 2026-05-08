// @dworks/edit-eval — 편집 품질 judge MVP.
// 1차는 dry-run 전용이다. live vision judge는 M2 artifact/screenshot 경로가 안정된 뒤 붙인다.

import type { SuggestedAction } from '@dworks/eval'
import type { EditOperation } from '@dworks/tree-editor'

import { EDIT_AXIS_IDS, getEditAxisRubric, type EditAxisRubric } from './axes.js'
import {
  editEvalInputSchema,
  editEvalResultSchema,
  type EditAxisId,
  type EditAxisScore,
  type EditEvalInput,
  type EditEvalResult,
} from './types.js'

export interface EditJudgeInput extends EditEvalInput {
  axis: EditAxisRubric
}

export interface CallEditJudgeOptions {
  dryRun?: boolean
}

export interface EvaluateEditOptions extends CallEditJudgeOptions {
  axes?: EditAxisId[]
  runId?: string
  now?: Date
}

export async function callEditJudge(
  input: EditJudgeInput,
  options: CallEditJudgeOptions = {},
): Promise<EditAxisScore> {
  if (options.dryRun !== true) {
    throw new Error('live edit judge is not implemented; pass dryRun: true')
  }
  return stubEditJudge(input)
}

export async function evaluateEdit(
  input: EditEvalInput,
  options: EvaluateEditOptions = {},
): Promise<EditEvalResult> {
  const parsed = editEvalInputSchema.parse(input)
  const axes = options.axes ?? [...EDIT_AXIS_IDS]
  const scores: EditAxisScore[] = []

  for (const axisId of axes) {
    scores.push(
      await callEditJudge(
        {
          ...parsed,
          axis: getEditAxisRubric(axisId),
        },
        { dryRun: options.dryRun },
      ),
    )
  }

  const result: EditEvalResult = {
    briefId: parsed.briefId,
    runId: options.runId ?? 'edit-eval-dry-run',
    ranAt: (options.now ?? new Date()).toISOString(),
    operationSummary: parsed.operationSummary,
    axes: scores,
    beforeScreenshots: parsed.beforeScreenshots,
    afterScreenshots: parsed.afterScreenshots,
    ...(parsed.editSequence ? { editSequence: parsed.editSequence } : {}),
  }

  return editEvalResultSchema.parse(result)
}

export function summarizeEditOperations(operations: EditOperation[]): string {
  if (operations.length === 0) return 'no edit operations'
  return operations
    .map((operation, index) => {
      switch (operation.type) {
        case 'updateText':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} content="${truncate(operation.content)}"`
        case 'updateTextTypography':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} typography=${JSON.stringify(operation.patch)}`
        case 'updateSpacing':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} spacing=${JSON.stringify(operation.patch)}`
        case 'updateShape':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} shape=${JSON.stringify(operation.patch)}`
        case 'updateColor':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} color=${JSON.stringify(operation.patch)}`
        case 'updateLayout':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} layout=${JSON.stringify(operation.patch)}`
        case 'updateButtonLabel':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} label="${truncate(operation.label)}"`
        case 'updateImage':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} image=${JSON.stringify(getImageOperationSummary(operation))}`
        case 'moveNode':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} direction="${operation.direction}"`
        case 'duplicateNode':
          return `${operationPrefix(
            index,
            operation.type,
            operation.nodeId,
          )} newNodeId="${operation.newNodeId ?? '(auto)'}"`
        case 'deleteNode':
          return operationPrefix(index, operation.type, operation.nodeId)
        case 'updateStyleTokens':
          return `${index + 1}. updateStyleTokens colorPreset="${operation.patch.colorPreset ?? '(unchanged)'}"`
      }
    })
    .join('\n')
}

function operationPrefix(index: number, type: string, nodeId: string): string {
  return `${index + 1}. ${type} ${nodeId}`
}

function getImageOperationSummary(operation: Extract<EditOperation, { type: 'updateImage' }>) {
  return Object.fromEntries(
    Object.entries({
      src: operation.src,
      alt: operation.alt,
      aspectRatio: operation.aspectRatio,
      focalPoint: operation.focalPoint,
      presentation: operation.presentation,
    }).filter(([, value]) => value !== undefined),
  )
}

function stubEditJudge(input: EditJudgeInput): EditAxisScore {
  const operationCount = input.editSequence?.length ?? 0
  const viewportCoverage =
    new Set([...input.beforeScreenshots, ...input.afterScreenshots].map((shot) => shot.viewport)).size
  const seed = hashStr(
    [
      input.briefId,
      input.axis.id,
      input.operationSummary,
      String(operationCount),
      String(viewportCoverage),
    ].join('|'),
  )
  const score = Math.max(1, Math.min(4, (seed % 4) + Math.min(operationCount, 2)))
  const suggestedAction: SuggestedAction =
    score <= input.axis.polishThreshold ? 'design-polish-needed' : 'acceptable'

  return {
    axis: input.axis.id,
    score,
    reason: `[dry-run stub] ${operationCount}개 편집 operation과 ${viewportCoverage}개 viewport 증거 기준 결정론적 점수 ${score}/5.`,
    evidence: [
      `brief: ${input.briefId}`,
      `axis: ${input.axis.id}`,
      `operation count: ${operationCount}`,
      `viewport coverage: ${viewportCoverage}`,
      'NOTE: 실제 vision judge 호출 아님 — edit-eval live judge는 후속 토픽',
    ],
    judgeStatus: 'ok',
    suggestedAction,
    judgeModel: 'claude',
    judgeModelVersion: 'dry-run-stub',
  }
}

function truncate(value: string): string {
  return value.length <= 40 ? value : `${value.slice(0, 37)}...`
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
