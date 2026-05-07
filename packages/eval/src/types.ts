// @dworks/eval — 평가 결과 타입.
// DECISIONS D14 (JudgeStatus / SuggestedAction 분리) + D5 (P0 평가 축 7개).

import { z } from 'zod'

// ---- D14: JudgeStatus / SuggestedAction ----

export const judgeStatusSchema = z.enum([
  'ok', // 정상 평가
  'unstable', // 재현성 분산 > 0.5
  'mixed-model', // 한 fixture 안에서 모델 fallback 발생
  'failed', // 평가 자체 실패 (응답 없음, 파싱 실패 등)
])
export type JudgeStatus = z.infer<typeof judgeStatusSchema>

export const suggestedActionSchema = z.enum([
  'acceptable', // 점수 양호, 그대로 진행
  'design-polish-needed', // 점수 2점 이하, 자동 고도화 입력
  'manual-review-needed', // 신뢰도 의심, 사람 판단 필요
  'export-blocking', // 익스포트 단계 hard fail
])
export type SuggestedAction = z.infer<typeof suggestedActionSchema>

// ---- D5: P0 평가 축 7개 ----

export const axisIdSchema = z.enum([
  'non-wireframe',
  'first-viewport-richness',
  'emotional-fit',
  'visual-variety',
  'brand-reference-fidelity',
  'responsive-design-intent-preservation',
  'editability',
])
export type AxisId = z.infer<typeof axisIdSchema>

export const AXIS_IDS: readonly AxisId[] = [
  'non-wireframe',
  'first-viewport-richness',
  'emotional-fit',
  'visual-variety',
  'brand-reference-fidelity',
  'responsive-design-intent-preservation',
  'editability',
] as const

// ---- LLM 모델 식별 (D12 fallback chain) ----

export const judgeModelSchema = z.enum([
  'claude', // 1순위
  'codex', // 2순위 (Claude 불능 시)
  'gemini', // 3순위 (Codex 불능 시)
])
export type JudgeModel = z.infer<typeof judgeModelSchema>

export const judgeRunSchema = z.object({
  judgeModel: judgeModelSchema,
  judgeModelVersion: z.string().optional(),
})
export type JudgeRun = z.infer<typeof judgeRunSchema>

// ---- 단일 축 평가 결과 ----

export const axisScoreSchema = z.object({
  axis: axisIdSchema,
  score: z.number().int().min(0).max(5),
  reason: z.string(),
  evidence: z.array(z.string()),
  judgeStatus: judgeStatusSchema,
  suggestedAction: suggestedActionSchema,
  judgeModel: judgeModelSchema,
  // 실제 호출된 모델 버전 문자열 (예: 'claude-sonnet-4-5-20250929').
  // 라운드 4 §2.5: 재현성 평가는 모델 버전 일관성이 중요하므로 메타로 누적.
  judgeModelVersion: z.string().optional(),
})
export type AxisScore = z.infer<typeof axisScoreSchema>

// ---- 재현성 체크 결과 (D8: 같은 fixture 3회 분산 ≤ 0.5) ----

export const reproducibilityCheckSchema = z.object({
  axis: axisIdSchema,
  scores: z.array(z.number().int().min(0).max(5)).min(3),
  variance: z.number().nonnegative(),
  stable: z.boolean(), // variance <= 0.5
  judgeRuns: z.array(judgeRunSchema).optional(),
})
export type ReproducibilityCheck = z.infer<typeof reproducibilityCheckSchema>

// ---- 한 fixture(brief × 트리)에 대한 종합 결과 ----

export const evalResultSchema = z.object({
  briefId: z.string(),
  treeRootId: z.string(),
  runId: z.string(),
  ranAt: z.string(), // ISO 8601
  axes: z.array(axisScoreSchema),
  // 점수 산출 시 어느 viewport screenshot이 입력으로 쓰였는지.
  viewports: z.array(
    z.object({
      width: z.number().int(),
      label: z.enum(['mobile', 'tablet', 'desktop']),
      screenshotPath: z.string(),
    }),
  ),
  // 라운드 4 §2.2: repeat≥2일 때 axis별 재현성 검사 누적.
  // 결과 root level에 둬서 axisScore는 단일 호출 결과로 깔끔히 유지.
  reproducibility: z.array(reproducibilityCheckSchema).optional(),
})
export type EvalResult = z.infer<typeof evalResultSchema>

// ---- 사람 grading 보정 (D8: 12개 중 3개 사람 grading, Pearson r ≥ 0.6) ----

export const humanGradingSchema = z.object({
  axis: axisIdSchema,
  pairs: z
    .array(
      z.object({
        briefId: z.string(),
        humanScore: z.number().int().min(0).max(5),
        judgeScore: z.number().int().min(0).max(5),
      }),
    )
    .min(3),
  pearsonR: z.number().min(-1).max(1),
  trustworthy: z.boolean(), // pearsonR >= 0.6
})
export type HumanGrading = z.infer<typeof humanGradingSchema>
