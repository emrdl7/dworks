import type { AxisId, AxisScore, EvalResult } from '@dworks/eval'

export interface AxisSummary {
  mean: number
  min: number
  minBriefId: string
  samples: number
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
  }
}

export function summarizeResults(results: EvalResult[]): EvalSummary {
  const runId = results[0]?.runId ?? 'empty'
  const summary = createEmptySummary(runId, 'dry-run', results.length, results[0]?.axes.length ?? 0)
  const axisAccum = new Map<AxisId, { sum: number; min: number; minBriefId: string; n: number }>()

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
      }
      current.sum += score.score
      current.n += 1
      if (score.score < current.min) {
        current.min = score.score
        current.minBriefId = result.briefId
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
    }
  }

  return summary
}

export function renderMarkdownReport(summary: EvalSummary): string {
  const lines = [
    `# Dworks Eval Report — ${summary.runId}`,
    '',
    `- mode: ${summary.mode}`,
    `- briefs: ${summary.briefs}`,
    `- axes: ${summary.axes}`,
    '',
    '## Axis Summary',
    '',
    '| Axis | Mean | Min | Lowest Brief | Samples |',
    '|---|---:|---:|---|---:|',
  ]

  for (const [axis, item] of Object.entries(summary.perAxis)) {
    if (!item) continue
    lines.push(`| ${axis} | ${item.mean.toFixed(2)} | ${item.min} | ${item.minBriefId} | ${item.samples} |`)
  }

  lines.push('', '## Lowest Briefs', '')
  const weakest = Object.entries(summary.perBrief)
    .sort((a, b) => a[1].mean - b[1].mean)
    .slice(0, 5)

  for (const [briefId, item] of weakest) {
    lines.push(`- ${briefId}: mean ${item.mean.toFixed(2)}, min ${item.min} (${item.minAxis ?? 'n/a'})`)
  }

  lines.push('')
  return lines.join('\n')
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
