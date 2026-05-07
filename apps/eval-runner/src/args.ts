import { AXIS_IDS, type AxisId } from '@dworks/eval'

export interface RunnerArgs {
  dryRun: boolean
  noScreenshots: boolean
  briefIds?: string[]
  axes?: AxisId[]
  runId?: string
  outDir?: string
  // 라운드 4 §1: --repeat=N. 기본 1, 2 이상이면 같은 axis × N회 호출 후 variance 측정.
  // 1 미만은 reject.
  repeat: number
  // live judge primary 실패 시 codex/gemini fallback 없이 즉시 실패.
  failOnFallback: boolean
  judgeTimeoutMs?: number
}

export function parseArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): RunnerArgs {
  const args: RunnerArgs = {
    dryRun: env.DWORKS_JUDGE_MODE !== 'live',
    noScreenshots: false,
    repeat: 1,
    failOnFallback: false,
  }

  for (const raw of argv) {
    if (raw === '--') {
      continue
    } else if (raw === '--dry-run') {
      args.dryRun = true
    } else if (raw === '--live') {
      args.dryRun = false
    } else if (raw === '--no-screenshots') {
      args.noScreenshots = true
    } else if (raw === '--fail-on-fallback') {
      args.failOnFallback = true
    } else if (raw.startsWith('--briefs=')) {
      args.briefIds = splitCsv(raw.slice('--briefs='.length))
    } else if (raw.startsWith('--axes=')) {
      args.axes = parseAxes(raw.slice('--axes='.length))
    } else if (raw.startsWith('--run-id=')) {
      args.runId = raw.slice('--run-id='.length).trim()
    } else if (raw.startsWith('--out=')) {
      args.outDir = raw.slice('--out='.length).trim()
    } else if (raw.startsWith('--repeat=')) {
      args.repeat = parseRepeat(raw.slice('--repeat='.length))
    } else if (raw.startsWith('--judge-timeout-ms=')) {
      args.judgeTimeoutMs = parsePositiveInteger(
        raw.slice('--judge-timeout-ms='.length),
        '--judge-timeout-ms',
      )
    } else {
      throw new Error(`unknown argument: ${raw}`)
    }
  }

  return args
}

function parseRepeat(value: string): number {
  return parsePositiveInteger(value, '--repeat')
}

function parsePositiveInteger(value: string, flagName: string): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`${flagName} must be integer >= 1, got: ${value}`)
  }
  return n
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseAxes(value: string): AxisId[] {
  return splitCsv(value).map((id) => {
    if ((AXIS_IDS as readonly string[]).includes(id)) return id as AxisId
    throw new Error(`unknown axis: ${id}`)
  })
}
