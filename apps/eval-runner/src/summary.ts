import type { AxisId, AxisScore, EvalResult } from '@dworks/eval'

export interface AxisSummary {
  mean: number
  min: number
  minBriefId: string
  samples: number
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
  }
}

export function summarizeResults(results: EvalResult[]): EvalSummary {
  const runId = results[0]?.runId ?? 'empty'
  const summary = createEmptySummary(runId, 'dry-run', results.length, results[0]?.axes.length ?? 0)
  const axisAccum = new Map<
    AxisId,
    { sum: number; min: number; minBriefId: string; n: number; unstable: number }
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
      }
      current.sum += score.score
      current.n += 1
      if (score.score < current.min) {
        current.min = score.score
        current.minBriefId = result.briefId
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
      ...(acc.unstable > 0 ? { unstableSamples: acc.unstable } : {}),
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
    `- unstable axes: ${summary.unstableAxes}`,
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
