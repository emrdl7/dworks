// m3-eval 집계 + markdown 렌더.

import type { CallResult, CallStatus, FixtureIntent } from './run.js'

export interface BucketSummary {
  total: number
  success: number
  successRatio: number
  byStatus: Record<CallStatus, number>
  requestLatencyP50: number | null
  requestLatencyP95: number | null
  modelLatencyP50: number | null
  modelLatencyP95: number | null
}

export interface IntentSummary {
  intentId: string
  bucket: BucketSummary
  diversityScore: number | null
  slopRichness: number | null
}

export interface EvalSummary {
  overall: BucketSummary
  byIntent: IntentSummary[]
  byProvider: Array<{ provider: string; bucket: BucketSummary }>
}

const ALL_STATUSES: CallStatus[] = [
  'ok',
  'invalid-request',
  'parse-failure',
  'schema-failure',
  'cli-timeout',
  'cli-failure',
  'cli-unavailable',
  'transport-error',
]

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const rank = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[rank] ?? null
}

function bucketize(rows: CallResult[]): BucketSummary {
  const byStatus = ALL_STATUSES.reduce(
    (acc, s) => {
      acc[s] = 0
      return acc
    },
    {} as Record<CallStatus, number>,
  )
  for (const row of rows) {
    byStatus[row.status] += 1
  }
  const success = byStatus.ok
  const total = rows.length
  const requestLatencies = rows
    .map((r) => r.requestLatencyMs)
    .sort((a, b) => a - b)
  const modelLatencies = rows
    .map((r) => r.modelLatencyMs)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  return {
    total,
    success,
    successRatio: total === 0 ? 0 : success / total,
    byStatus,
    requestLatencyP50: percentile(requestLatencies, 50),
    requestLatencyP95: percentile(requestLatencies, 95),
    modelLatencyP50: percentile(modelLatencies, 50),
    modelLatencyP95: percentile(modelLatencies, 95),
  }
}

export function summarizeCalls(
  calls: CallResult[],
  intents: FixtureIntent[],
  diversityByIntent?: ReadonlyMap<string, number | null>,
  slopRichnessByIntent?: ReadonlyMap<string, number | null>,
): EvalSummary {
  const overall = bucketize(calls)
  const byIntent: IntentSummary[] = intents.map((intent) => ({
    intentId: intent.id,
    bucket: bucketize(calls.filter((c) => c.intentId === intent.id)),
    diversityScore: diversityByIntent?.get(intent.id) ?? null,
    slopRichness: slopRichnessByIntent?.get(intent.id) ?? null,
  }))
  const providerKeys = Array.from(
    new Set(calls.map((c) => c.model).filter((m): m is string => m !== null)),
  ).sort()
  const byProvider = providerKeys.map((provider) => ({
    provider,
    bucket: bucketize(calls.filter((c) => c.model === provider)),
  }))
  return { overall, byIntent, byProvider }
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function fmtLatency(n: number | null): string {
  return n === null ? '—' : `${Math.round(n)}ms`
}

function renderBucketRow(label: string, b: BucketSummary): string {
  return `| ${label} | ${b.total} | ${b.success} | ${fmtPct(b.successRatio)} | ${fmtLatency(b.requestLatencyP50)} | ${fmtLatency(b.requestLatencyP95)} | ${fmtLatency(b.modelLatencyP50)} | ${fmtLatency(b.modelLatencyP95)} |`
}

const TABLE_HEADER =
  '| 그룹 | 호출 | 성공 | 성공률 | req p50 | req p95 | model p50 | model p95 |'
const TABLE_DIVIDER = '|---|---|---|---|---|---|---|---|'

const INTENT_TABLE_HEADER =
  '| 그룹 | 호출 | 성공 | 성공률 | req p50 | req p95 | model p50 | model p95 | 구조 다양성 | 풍부도 |'
const INTENT_TABLE_DIVIDER = '|---|---|---|---|---|---|---|---|---|---|'

function fmtDiversity(d: number | null): string {
  return d === null ? '-' : d.toFixed(2)
}

function fmtRichness(r: number | null): string {
  return r === null ? '-' : r.toFixed(2)
}

function renderIntentRow(
  label: string,
  b: BucketSummary,
  diversity: number | null,
  slopRichness: number | null,
): string {
  return `| ${label} | ${b.total} | ${b.success} | ${fmtPct(b.successRatio)} | ${fmtLatency(b.requestLatencyP50)} | ${fmtLatency(b.requestLatencyP95)} | ${fmtLatency(b.modelLatencyP50)} | ${fmtLatency(b.modelLatencyP95)} | ${fmtDiversity(diversity)} | ${fmtRichness(slopRichness)} |`
}

export function renderSummaryMarkdown(
  summary: EvalSummary,
  manifest: { runId: string; ranAt: string; args: { fixturesPath: string; live: boolean; repeat: number } },
): string {
  const lines: string[] = []
  lines.push(`# m3-eval run ${manifest.runId}`, '')
  lines.push(
    `- ranAt: ${manifest.ranAt}`,
    `- fixtures: ${manifest.args.fixturesPath}`,
    `- mode: ${manifest.args.live ? 'live' : 'dry-run'}`,
    `- repeat: ${manifest.args.repeat}`,
    '',
  )
  lines.push('## 전체', '', TABLE_HEADER, TABLE_DIVIDER)
  lines.push(renderBucketRow('all', summary.overall))
  lines.push('')

  if (summary.byIntent.length > 0) {
    lines.push('## intent별', '', INTENT_TABLE_HEADER, INTENT_TABLE_DIVIDER)
    for (const row of summary.byIntent) {
      lines.push(
        renderIntentRow(
          row.intentId,
          row.bucket,
          row.diversityScore,
          row.slopRichness,
        ),
      )
    }
    if (!manifest.args.live && manifest.args.repeat >= 2) {
      lines.push('')
      lines.push('> dry-run은 deterministic이라 구조 다양성 0.00이 정상.')
    }
    lines.push('')
    lines.push(
      '> 풍부도 0.0(슬롭) ~ 1.0(풍부) — heading-1/fontSize 다양성/색 다양성/이미지/shape 깊이 5신호 평균.',
    )
    lines.push('')
  }

  if (summary.byProvider.length > 0) {
    lines.push('## provider별', '', TABLE_HEADER, TABLE_DIVIDER)
    for (const row of summary.byProvider) {
      lines.push(renderBucketRow(row.provider, row.bucket))
    }
    lines.push('')
  }

  lines.push('## 실패 분포 (전체)', '')
  const failureLines: string[] = []
  for (const status of ALL_STATUSES) {
    if (status === 'ok') continue
    const count = summary.overall.byStatus[status]
    if (count > 0) {
      failureLines.push(`- \`${status}\`: ${count}`)
    }
  }
  if (failureLines.length === 0) {
    lines.push('- 실패 없음.')
  } else {
    lines.push(...failureLines)
  }
  lines.push('')
  return lines.join('\n')
}
