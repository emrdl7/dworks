// @dworks/eval — vision LLM judge 호출 추상.
// DECISIONS D12 (LLM fallback chain: Claude → Codex → Gemini)
//                + D14 (JudgeStatus / SuggestedAction)
//                + D8 (재현성 + 사람 grading 보정).
//
// M1 단계: 1순위 Anthropic SDK 구현 + 2/3순위 명시적 stub.
// API 키는 환경 변수 ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY.

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

import type { AxisRubric, ViewportLabel } from './axes.js'
import {
  axisIdSchema,
  judgeStatusSchema,
  suggestedActionSchema,
  type AxisScore,
  type JudgeRun,
  type JudgeModel,
  judgeModelSchema,
  type ReproducibilityCheck,
} from './types.js'

// ---- 입력 ----

export interface JudgeInput {
  briefId: string
  briefText: string
  axis: AxisRubric
  // viewport label → 이미지 (base64 또는 파일 경로)
  screenshots: Array<{
    viewport: ViewportLabel
    base64Png: string
  }>
  // brand/reference asset 메타 (1차는 placeholder, M1에서 실 자산 연동)
  brandAssets?: Array<{ kind: 'logo' | 'reference'; description: string }>
}

// ---- judge 응답 schema (LLM이 이 모양으로 답하도록 prompt) ----

const judgeResponseSchema = z.object({
  axis: axisIdSchema,
  score: z.number().int().min(0).max(5),
  reason: z.string(),
  evidence: z.array(z.string()),
  suggestedAction: suggestedActionSchema,
})

// ---- prompt 빌더 ----

function buildSystemPrompt(): string {
  return [
    '당신은 디자인 시안의 품질을 0–5 척도로 평가하는 vision judge다.',
    '입력으로 brief 텍스트, 한 평가 축의 정의/루브릭, viewport별 스크린샷이 주어진다.',
    '당신은 디자이너의 시각으로 평가하며, HTML 구조나 코드 품질은 평가하지 않는다.',
    '응답은 반드시 JSON 한 개로만 출력한다. 다른 텍스트는 금지.',
    '점수(score)는 정수 0~5 중 하나, suggestedAction은 acceptable/design-polish-needed/manual-review-needed/export-blocking 중 하나.',
    'evidence에는 점수 근거를 한 문장씩 2~5개 적는다.',
  ].join('\n')
}

function buildUserPrompt(input: JudgeInput): string {
  const lines = [
    `# 평가 축: ${input.axis.id} (${input.axis.title})`,
    input.axis.description,
    '',
    '## 0–5 루브릭',
    ...Object.entries(input.axis.rubric).map(([k, v]) => `- ${k}: ${v}`),
    '',
    `## brief id: ${input.briefId}`,
    input.briefText,
  ]
  if (input.brandAssets && input.brandAssets.length > 0) {
    lines.push('', '## 브랜드/레퍼런스 자산')
    for (const asset of input.brandAssets) {
      lines.push(`- ${asset.kind}: ${asset.description}`)
    }
  }
  lines.push(
    '',
    '## 응답 형식',
    '```json',
    '{',
    `  "axis": "${input.axis.id}",`,
    '  "score": 0,',
    '  "reason": "...",',
    '  "evidence": ["...", "..."],',
    '  "suggestedAction": "acceptable" | "design-polish-needed" | "manual-review-needed" | "export-blocking"',
    '}',
    '```',
  )
  return lines.join('\n')
}

// ---- 1순위: Claude (Anthropic SDK) ----

// 라운드 4 §2.5: 모델 버전은 ANTHROPIC_MODEL env로 override.
// 기본값은 Sonnet 4.5; M1 후반에 Opus 4.7 옵션 검토.
export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-5-20250929'

function resolveClaudeModel(): string {
  return process.env.ANTHROPIC_MODEL ?? DEFAULT_CLAUDE_MODEL
}

async function callClaude(input: JudgeInput): Promise<AxisScore> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const client = new Anthropic({ apiKey })
  const userContent: Anthropic.Messages.ContentBlockParam[] = []

  // 이미지 먼저 (vision judge), 그 다음 텍스트 prompt.
  for (const shot of input.screenshots) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: shot.base64Png,
      },
    })
    userContent.push({
      type: 'text',
      text: `위 이미지: viewport=${shot.viewport}.`,
    })
  }
  userContent.push({ type: 'text', text: buildUserPrompt(input) })

  const model = resolveClaudeModel()
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: userContent }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude judge: no text content')
  }
  const parsed = parseJudgeResponse(textBlock.text)
  return {
    axis: parsed.axis,
    score: parsed.score,
    reason: parsed.reason,
    evidence: parsed.evidence,
    judgeStatus: 'ok',
    suggestedAction: parsed.suggestedAction,
    judgeModel: 'claude',
    judgeModelVersion: model,
  }
}

// ---- 2/3순위 stub ----

async function callCodex(_input: JudgeInput): Promise<AxisScore> {
  // M1 1차 미구현. D12 fallback chain의 자리 표시.
  throw new Error('codex judge not yet implemented (M1 후반 또는 사용자 요청 시)')
}

async function callGemini(_input: JudgeInput): Promise<AxisScore> {
  throw new Error('gemini judge not yet implemented (M1 후반 또는 사용자 요청 시)')
}

// ---- fallback chain ----

const FALLBACK_ORDER: JudgeModel[] = ['claude', 'codex', 'gemini']

export interface CallJudgeOptions {
  // dry-run 모드: 실제 LLM 호출 대신 결정론적 stub 응답.
  // 1차 파이프라인 검증/CI 용. 실제 점수가 아님.
  dryRun?: boolean
}

export async function callJudge(
  input: JudgeInput,
  options: CallJudgeOptions = {},
): Promise<AxisScore> {
  if (options.dryRun) {
    return stubJudge(input)
  }
  let lastError: unknown = null
  for (const model of FALLBACK_ORDER) {
    try {
      switch (model) {
        case 'claude':
          return await callClaude(input)
        case 'codex':
          return await callCodex(input)
        case 'gemini':
          return await callGemini(input)
      }
    } catch (err) {
      lastError = err
      // 정책 D12: "불능" 판정 후 다음 모델로. 단 명시적 모델 미구현 stub은 skip이지 fail이 아니다.
      continue
    }
  }
  return {
    axis: input.axis.id,
    score: 0,
    reason: `judge fallback chain 전체 실패: ${String(lastError)}`,
    evidence: [],
    judgeStatus: 'failed',
    suggestedAction: 'manual-review-needed',
    judgeModel: 'claude',
  }
}

// dry-run stub — brief id × axis id의 hash 기반 결정론적 점수.
// placeholder 트리는 와이어프레임 성격이라 1~3점 범위가 자연스럽다.
// 라운드 4 §2.3: dry-run은 결정론 유지. repeat 호출해도 같은 점수.
function stubJudge(input: JudgeInput): AxisScore {
  const seed = hashStr(`${input.briefId}|${input.axis.id}`)
  const score = (seed % 4) + 1 // 1..4
  return {
    axis: input.axis.id,
    score,
    reason: `[dry-run stub] placeholder 트리 기반 결정론적 점수 ${score}/5.`,
    evidence: [
      `brief: ${input.briefId}`,
      `axis: ${input.axis.id}`,
      'NOTE: 실제 LLM 호출 아님 — ANTHROPIC_API_KEY 설정 후 dryRun=false 로 재실행',
    ],
    judgeStatus: 'ok',
    suggestedAction:
      score <= input.axis.polishThreshold
        ? 'design-polish-needed'
        : 'acceptable',
    judgeModel: 'claude',
    judgeModelVersion: 'dry-run-stub',
  }
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// ---- LLM 응답 파싱 ----

function parseJudgeResponse(text: string): {
  axis: ReturnType<typeof axisIdSchema.parse>
  score: number
  reason: string
  evidence: string[]
  suggestedAction: ReturnType<typeof suggestedActionSchema.parse>
} {
  // ```json 블록 또는 raw JSON.
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  const json = JSON.parse(cleaned)
  return judgeResponseSchema.parse(json)
}

// ---- 재현성 체크 (D8) ----

export function computeVariance(scores: number[]): number {
  if (scores.length === 0) return 0
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  return scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length
}

// D8 stable 임계값. variance ≤ 0.5 → stable.
export const STABLE_VARIANCE_THRESHOLD = 0.5

// repeat ≥ 2 호출의 결과 묶음.
// representative는 첫 호출 점수 기반 + variance > 0.5면 judgeStatus 'unstable'로 갱신.
// repeat 안에서 provider/version이 섞이면 'mixed-model'이 unstable보다 우선한다.
// reproducibility는 ReproducibilityCheck — root level EvalResult에 누적.
export type JudgeRunMetadata = JudgeRun

export interface RepeatedJudgeResult {
  representative: AxisScore
  scores: AxisScore[]
  judgeRuns: JudgeRunMetadata[]
  reproducibility?: ReproducibilityCheck
}

export function hasMixedJudgeRuns(judgeRuns: readonly JudgeRunMetadata[]): boolean {
  const keys = new Set(
    judgeRuns.map((run) => `${run.judgeModel}:${run.judgeModelVersion ?? 'unknown-version'}`),
  )
  return keys.size > 1
}

/**
 * 같은 input을 N회 호출하고 variance 기반 안정성 판단.
 * repeat=1: 단일 호출, reproducibility 없음.
 * repeat≥2: N회 호출 후 variance 계산 → stable false면 unstable 마킹.
 *
 * 라운드 4 §2.2: AxisScore는 단일 호출 결과 그대로 유지하고,
 *               집계는 result-level metadata(reproducibility)로 둔다.
 */
export async function callJudgeRepeated(
  input: JudgeInput,
  repeat: number,
  options: CallJudgeOptions = {},
): Promise<RepeatedJudgeResult> {
  if (!Number.isInteger(repeat) || repeat < 1) {
    throw new Error(`callJudgeRepeated: repeat must be integer ≥ 1, got ${repeat}`)
  }

  const scores: AxisScore[] = []
  for (let i = 0; i < repeat; i++) {
    scores.push(await callJudge(input, options))
  }
  const judgeRuns = scores.map(toJudgeRun)

  if (repeat < 2) {
    return { representative: scores[0]!, scores, judgeRuns }
  }

  // ReproducibilityCheck schema는 scores ≥ 3 요구. 다만 helper는 repeat=2도 허용
  // (smoke 검증). schema 통과를 위해 실제 누적 시점은 호출자가 판단.
  const numericScores = scores.map((s) => s.score)
  const variance = computeVariance(numericScores)
  const stable = variance <= STABLE_VARIANCE_THRESHOLD
  const mixedModel = hasMixedJudgeRuns(judgeRuns)

  const representative: AxisScore = mixedModel
    ? { ...scores[0]!, judgeStatus: 'mixed-model', suggestedAction: 'manual-review-needed' }
    : stable
      ? scores[0]!
      : { ...scores[0]!, judgeStatus: 'unstable' }

  // schema는 ≥3 요구하지만 helper는 less-strict — repeat>=3일 때만 reproducibility 산출.
  // repeat 2는 stable/unstable 판단만 (representative에 반영) reproducibility 객체 없음.
  if (repeat < 3) {
    return { representative, scores, judgeRuns }
  }

  const reproducibility: ReproducibilityCheck = {
    axis: input.axis.id,
    scores: numericScores,
    variance,
    stable,
    judgeRuns,
  }

  return { representative, scores, judgeRuns, reproducibility }
}

function toJudgeRun(score: AxisScore): JudgeRunMetadata {
  return {
    judgeModel: score.judgeModel,
    ...(score.judgeModelVersion ? { judgeModelVersion: score.judgeModelVersion } : {}),
  }
}

// 명시적 export — fallback chain 외부 사용.
export { judgeModelSchema, judgeStatusSchema }
