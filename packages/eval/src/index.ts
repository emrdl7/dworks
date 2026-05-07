// @dworks/eval — P0 디자인 품질 eval.

export {
  judgeStatusSchema,
  suggestedActionSchema,
  axisIdSchema,
  judgeModelSchema,
  axisScoreSchema,
  evalResultSchema,
  reproducibilityCheckSchema,
  humanGradingSchema,
  AXIS_IDS,
} from './types.js'
export type {
  JudgeStatus,
  SuggestedAction,
  AxisId,
  JudgeModel,
  AxisScore,
  EvalResult,
  ReproducibilityCheck,
  HumanGrading,
} from './types.js'

export {
  AXIS_RUBRICS,
  listAxes,
  getAxisRubric,
} from './axes.js'
export type { AxisRubric, ViewportLabel } from './axes.js'

export {
  callJudge,
  callJudgeRepeated,
  computeVariance,
  DEFAULT_CLAUDE_MODEL,
  STABLE_VARIANCE_THRESHOLD,
} from './judge.js'
export type {
  JudgeInput,
  CallJudgeOptions,
  RepeatedJudgeResult,
} from './judge.js'

export { briefSchema, loadBriefs, buildPlaceholderTree } from './brief.js'
export type { Brief } from './brief.js'
