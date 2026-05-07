import type { AxisId, AxisScore, EvalResult } from '@dworks/eval'

const LIVE_SECONDS_PER_JUDGE_CALL = 25
const DRY_RUN_SECONDS_PER_JUDGE_CALL = 0.05
const LIVE_COST_PER_JUDGE_CALL_USD = 0

export interface AxisLowestDetail {
  briefId: string
  score: number
  reason: string
  evidence: string[]
  suggestedAction: AxisScore['suggestedAction']
  judgeStatus: AxisScore['judgeStatus']
  judgeModel: AxisScore['judgeModel']
  judgeModelVersion?: string
}

export interface AxisSummary {
  mean: number
  min: number
  minBriefId: string
  samples: number
  lowest: AxisLowestDetail
  // 라운드 4 §2.4: perAxis에 unstable 표본 수 누적.
  unstableSamples?: number
}

export interface BriefSummary {
  mean: number
  min: number
  minAxis: AxisId | null
}

export interface EvalSummary {
  runId: string
  mode: 'dry-run' | 'live'
  briefs: number
  axes: number
  perAxis: Partial<Record<AxisId, AxisSummary>>
  perBrief: Record<string, BriefSummary>
  // 라운드 4 §2.4: 전체 unstable axis 카운트. 빠르게 경고 신호 잡기 위함.
  unstableAxes: number
  estimate: EvalEstimate
}

export interface EvalEstimate {
  judgeCalls: number
  repeat: number
  estimatedSeconds: number
  estimatedMinutes: number
  estimatedCostUsd: number
  assumptions: string[]
}

export interface SummarizeOptions {
  mode?: EvalSummary['mode']
  repeat?: number
}

export function createEmptySummary(
  runId: string,
  mode: EvalSummary['mode'],
  briefCount: number,
  axisCount: number,
): EvalSummary {
  return {
    runId,
    mode,
    briefs: briefCount,
    axes: axisCount,
    perAxis: {},
    perBrief: {},
    unstableAxes: 0,
    estimate: createEstimate(0, mode, 1),
  }
}

export function summarizeResults(results: EvalResult[], options: SummarizeOptions = {}): EvalSummary {
  const runId = results[0]?.runId ?? 'empty'
  const mode = options.mode ?? 'dry-run'
  const repeat = options.repeat ?? inferRepeat(results)
  const summary = createEmptySummary(runId, mode, results.length, results[0]?.axes.length ?? 0)
  const axisAccum = new Map<
    AxisId,
    { sum: number; min: number; minBriefId: string; n: number; unstable: number; lowest: AxisLowestDetail | null }
  >()

  for (const result of results) {
    const scores = result.axes
    const briefMean = mean(scores.map((score) => score.score))
    const minScore = minAxisScore(scores)
    summary.perBrief[result.briefId] = {
      mean: round2(briefMean),
      min: minScore?.score ?? 0,
      minAxis: minScore?.axis ?? null,
    }

    for (const score of scores) {
      const current = axisAccum.get(score.axis) ?? {
        sum: 0,
        min: 6,
        minBriefId: '',
        n: 0,
        unstable: 0,
        lowest: null,
      }
      current.sum += score.score
      current.n += 1
      if (score.score < current.min) {
        current.min = score.score
        current.minBriefId = result.briefId
        current.lowest = toLowestDetail(result.briefId, score)
      }
      if (score.judgeStatus === 'unstable') {
        current.unstable += 1
        summary.unstableAxes += 1
      }
      axisAccum.set(score.axis, current)
    }
  }

  for (const [axis, acc] of axisAccum) {
    summary.perAxis[axis] = {
      mean: acc.n === 0 ? 0 : round2(acc.sum / acc.n),
      min: acc.min === 6 ? 0 : acc.min,
      minBriefId: acc.minBriefId,
      samples: acc.n,
      lowest: acc.lowest ?? createEmptyLowest(),
      ...(acc.unstable > 0 ? { unstableSamples: acc.unstable } : {}),
    }
  }
  summary.estimate = createEstimate(countAxisSamples(results), mode, repeat)

  return summary
}

export function renderMarkdownReport(summary: EvalSummary): string {
  const lines = [
    `# Dworks Eval Report — ${summary.runId}`,
    '',
    `- mode: ${summary.mode}`,
    `- briefs: ${summary.briefs}`,
    `- axes: ${summary.axes}`,
    `- unstable axes: ${summary.unstableAxes}`,
    '',
    '## Run Estimate',
    '',
    '| Judge Calls | Repeat | Est. Time | Est. Cost |',
    '|---:|---:|---:|---:|',
    `| ${summary.estimate.judgeCalls} | ${summary.estimate.repeat} | ${formatDuration(summary.estimate.estimatedSeconds)} | ${formatUsd(summary.estimate.estimatedCostUsd)} |`,
    '',
    ...summary.estimate.assumptions.map((item) => `- ${item}`),
    '',
    '## Axis Summary',
    '',
    '| Axis | Mean | Min | Lowest Brief | Samples | Unstable |',
    '|---|---:|---:|---|---:|---:|',
  ]

  for (const [axis, item] of Object.entries(summary.perAxis)) {
    if (!item) continue
    const unstable = item.unstableSamples ?? 0
    lines.push(
      `| ${axis} | ${item.mean.toFixed(2)} | ${item.min} | ${item.minBriefId} | ${item.samples} | ${unstable} |`,
    )
  }

  lines.push('', '## Axis Lowest Details', '')
  for (const [axis, item] of Object.entries(summary.perAxis)) {
    if (!item) continue
    const lowest = item.lowest
    lines.push(
      `### ${axis}`,
      '',
      `- lowest brief: \`${lowest.briefId}\``,
      `- score/action: ${lowest.score} / \`${lowest.suggestedAction}\``,
      `- judge: \`${lowest.judgeModel}${lowest.judgeModelVersion ? `:${lowest.judgeModelVersion}` : ''}\` (${lowest.judgeStatus})`,
      `- reason: ${lowest.reason}`,
    )
    if (lowest.evidence.length > 0) {
      lines.push('- evidence:')
      for (const evidence of lowest.evidence.slice(0, 3)) {
        lines.push(`  - ${evidence}`)
      }
    }
    lines.push('')
  }

  lines.push('', '## Lowest Briefs', '')
  const weakest = Object.entries(summary.perBrief)
    .sort((a, b) => a[1].mean - b[1].mean)
    .slice(0, 5)

  for (const [briefId, item] of weakest) {
    lines.push(`- ${briefId}: mean ${item.mean.toFixed(2)}, min ${item.min} (${item.minAxis ?? 'n/a'})`)
  }

  if (summary.unstableAxes > 0) {
    lines.push('', '## Unstable Axes', '')
    lines.push(
      `재현성 분산 > ${formatThreshold()}로 \`judgeStatus: 'unstable'\`이 마킹된 axis 표본이 ${summary.unstableAxes}건 발견됐다. 같은 모델 버전에서 재시도 또는 사람 grading 보정 필요.`,
    )
    for (const [axis, item] of Object.entries(summary.perAxis)) {
      if (!item || !item.unstableSamples) continue
      lines.push(`- ${axis}: ${item.unstableSamples}/${item.samples} 표본 unstable`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

function toLowestDetail(briefId: string, score: AxisScore): AxisLowestDetail {
  return {
    briefId,
    score: score.score,
    reason: score.reason,
    evidence: score.evidence,
    suggestedAction: score.suggestedAction,
    judgeStatus: score.judgeStatus,
    judgeModel: score.judgeModel,
    ...(score.judgeModelVersion ? { judgeModelVersion: score.judgeModelVersion } : {}),
  }
}

function createEmptyLowest(): AxisLowestDetail {
  return {
    briefId: '',
    score: 0,
    reason: 'no samples',
    evidence: [],
    suggestedAction: 'manual-review-needed',
    judgeStatus: 'failed',
    judgeModel: 'claude',
  }
}

function inferRepeat(results: EvalResult[]): number {
  return results.find((result) => result.reproducibility?.[0])?.reproducibility?.[0]?.scores.length ?? 1
}

function countAxisSamples(results: EvalResult[]): number {
  return results.reduce((sum, result) => sum + result.axes.length, 0)
}

function createEstimate(axisSamples: number, mode: EvalSummary['mode'], repeat: number): EvalEstimate {
  const safeRepeat = Number.isInteger(repeat) && repeat > 0 ? repeat : 1
  const judgeCalls = axisSamples * safeRepeat
  const secondsPerCall = mode === 'live' ? LIVE_SECONDS_PER_JUDGE_CALL : DRY_RUN_SECONDS_PER_JUDGE_CALL
  const costPerCall = mode === 'live' ? LIVE_COST_PER_JUDGE_CALL_USD : 0
  const estimatedSeconds = round2(judgeCalls * secondsPerCall)
  const estimatedCostUsd = round4(judgeCalls * costPerCall)
  return {
    judgeCalls,
    repeat: safeRepeat,
    estimatedSeconds,
    estimatedMinutes: round2(estimatedSeconds / 60),
    estimatedCostUsd,
    assumptions:
      mode === 'live'
        ? [
            `live estimate uses ${LIVE_SECONDS_PER_JUDGE_CALL}s per CLI judge call until telemetry is calibrated.`,
            `direct API cost estimate is ${formatUsd(LIVE_COST_PER_JUDGE_CALL_USD)} because D12 uses local authenticated CLIs.`,
            'screenshot capture/browser startup overhead is excluded.',
          ]
        : [
            `dry-run estimate uses ${DRY_RUN_SECONDS_PER_JUDGE_CALL}s per stub judge call and no LLM cost.`,
            'screenshot capture/browser startup overhead is excluded.',
          ],
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  return `${(seconds / 60).toFixed(2)}m`
}

function formatUsd(value: number): string {
  return `$${value.toFixed(value < 1 ? 4 : 2)}`
}

function formatThreshold(): string {
  // STABLE_VARIANCE_THRESHOLD는 0.5 (D8). 표시는 그대로.
  return '0.5'
}

function minAxisScore(scores: AxisScore[]): AxisScore | null {
  if (scores.length === 0) return null
  return scores.reduce((min, score) => (score.score < min.score ? score : min), scores[0]!)
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000
}
