// @dworks/eval — vision LLM judge 호출 추상.
// DECISIONS D12 (CLI fallback chain: Claude → Codex → Gemini)
//                + D14 (JudgeStatus / SuggestedAction)
//                + D8 (재현성 + 사람 grading 보정).
//
// M1 단계: 로컬에 인증된 LLM CLI를 순서대로 spawn한다.

import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
    filePath?: string
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

// ---- CLI providers ----

const JUDGE_TIMEOUT_MS = 30_000

async function callClaude(input: JudgeInput, options: CallJudgeOptions): Promise<AxisScore> {
  const output = await runCli('claude', ['-p', buildCliPrompt(input, 'claude')], options)
  return parseCliScore(
    output.stdout,
    'claude',
    process.env.DWORKS_CLAUDE_MODEL ?? 'claude-cli',
  )
}

async function callCodex(input: JudgeInput, options: CallJudgeOptions): Promise<AxisScore> {
  const tempDir = await mkdtemp(join(tmpdir(), 'dworks-codex-judge-'))
  const outputPath = join(tempDir, 'last-message.txt')
  const workspaceRoot = options.workspaceRoot ?? process.cwd()
  try {
    const args = [
      'exec',
      '--json',
      '--ephemeral',
      '--sandbox',
      'read-only',
      '--cd',
      workspaceRoot,
      '-o',
      outputPath,
    ]
    const model = process.env.DWORKS_CODEX_MODEL
    if (model) args.push('--model', model)
    for (const imagePath of getScreenshotFilePaths(input)) {
      args.push('--image', imagePath)
    }
    args.push(buildCliPrompt(input, 'codex'))
    await runCli('codex', args, options)
    const output = await readFile(outputPath, 'utf8')
    return parseCliScore(output, 'codex', model ?? 'codex-cli')
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function callGemini(input: JudgeInput, options: CallJudgeOptions): Promise<AxisScore> {
  const args = ['-p', buildCliPrompt(input, 'gemini'), '--output-format', 'text', '--skip-trust']
  const model = process.env.DWORKS_GEMINI_MODEL
  if (model) args.unshift('--model', model)
  const output = await runCli('gemini', args, options)
  return parseCliScore(output.stdout, 'gemini', model ?? 'gemini-cli')
}

// ---- fallback chain ----

const FALLBACK_ORDER: JudgeModel[] = ['claude', 'codex', 'gemini']

export interface CallJudgeOptions {
  // dry-run 모드: 실제 LLM 호출 대신 결정론적 stub 응답.
  // 1차 파이프라인 검증/CI 용. 실제 점수가 아님.
  dryRun?: boolean
  workspaceRoot?: string
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
          return await callClaude(input, options)
        case 'codex':
          return await callCodex(input, options)
        case 'gemini':
          return await callGemini(input, options)
      }
    } catch (err) {
      lastError = err
      // 정책 D12: CLI 불능 판정 후 다음 provider로 fallback.
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
      'NOTE: 실제 LLM 호출 아님 — --live 또는 DWORKS_JUDGE_MODE=live 로 재실행',
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

function buildCliPrompt(input: JudgeInput, provider: JudgeModel): string {
  const imagePaths = getScreenshotFilePaths(input)
  const imageSection =
    imagePaths.length > 0
      ? [
          '## 스크린샷 파일',
          ...input.screenshots.map(
            (shot) => `- ${shot.viewport}: ${shot.filePath ?? '(attached image)'}`,
          ),
          provider === 'codex'
            ? 'Codex CLI에는 위 파일들이 --image로 첨부되어 있다.'
            : '위 경로의 이미지를 열어 시각적으로 평가한다.',
        ].join('\n')
      : '## 스크린샷 파일\n첨부된 스크린샷 없음. 가능한 근거만으로 평가하되 evidence에 한계를 명시한다.'

  return [
    buildSystemPrompt(),
    '',
    imageSection,
    '',
    buildUserPrompt(input),
  ].join('\n')
}

function getScreenshotFilePaths(input: JudgeInput): string[] {
  return input.screenshots
    .map((shot) => shot.filePath)
    .filter((filePath): filePath is string => Boolean(filePath))
}

function parseCliScore(
  text: string,
  judgeModel: JudgeModel,
  judgeModelVersion: string,
): AxisScore {
  const parsed = parseJudgeResponse(text)
  return {
    axis: parsed.axis,
    score: parsed.score,
    reason: parsed.reason,
    evidence: parsed.evidence,
    judgeStatus: 'ok',
    suggestedAction: parsed.suggestedAction,
    judgeModel,
    judgeModelVersion,
  }
}

interface CliOutput {
  stdout: string
  stderr: string
}

function runCli(
  command: string,
  args: string[],
  options: CallJudgeOptions = {},
): Promise<CliOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.workspaceRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let settled = false
    let timer: NodeJS.Timeout

    const finish = (error: Error | null, output?: CliOutput): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(output ?? { stdout: '', stderr: '' })
    }

    timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish(new Error(`${command} judge timed out after ${JUDGE_TIMEOUT_MS}ms`))
    }, JUDGE_TIMEOUT_MS)

    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
    child.on('error', (error) => finish(error))
    child.on('close', (code) => {
      const out = Buffer.concat(stdout).toString('utf8')
      const err = Buffer.concat(stderr).toString('utf8')
      if (code !== 0) {
        finish(new Error(`${command} judge exited with ${code}: ${err || out}`))
        return
      }
      finish(null, { stdout: out, stderr: err })
    })
  })
}

// ---- LLM 응답 파싱 ----

function parseJudgeResponse(text: string): {
  axis: ReturnType<typeof axisIdSchema.parse>
  score: number
  reason: string
  evidence: string[]
  suggestedAction: ReturnType<typeof suggestedActionSchema.parse>
} {
  // ```json 블록, raw JSON, 또는 CLI가 앞뒤 설명을 붙인 출력에서 JSON만 추출.
  const cleaned = extractJsonPayload(text)
  const json = JSON.parse(cleaned)
  return judgeResponseSchema.parse(json)
}

function extractJsonPayload(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch?.[1]) return fenceMatch[1].trim()

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }
  return trimmed
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
