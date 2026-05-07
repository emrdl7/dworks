import { AXIS_IDS, type AxisId } from '@dworks/eval'

export interface RunnerArgs {
  dryRun: boolean
  noScreenshots: boolean
  briefIds?: string[]
  axes?: AxisId[]
  runId?: string
  outDir?: string
}

export function parseArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): RunnerArgs {
  const args: RunnerArgs = {
    dryRun: !env.ANTHROPIC_API_KEY,
    noScreenshots: false,
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
    } else if (raw.startsWith('--briefs=')) {
      args.briefIds = splitCsv(raw.slice('--briefs='.length))
    } else if (raw.startsWith('--axes=')) {
      args.axes = parseAxes(raw.slice('--axes='.length))
    } else if (raw.startsWith('--run-id=')) {
      args.runId = raw.slice('--run-id='.length).trim()
    } else if (raw.startsWith('--out=')) {
      args.outDir = raw.slice('--out='.length).trim()
    } else {
      throw new Error(`unknown argument: ${raw}`)
    }
  }

  return args
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
