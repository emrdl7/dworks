export interface EditRunnerArgs {
  sequence: string
  runId?: string
  outDir?: string
}

export function parseArgs(argv: string[]): EditRunnerArgs {
  const args: Partial<EditRunnerArgs> = {}

  for (const raw of argv) {
    if (raw === '--') {
      continue
    } else if (raw.startsWith('--sequence=')) {
      args.sequence = requireValue(raw.slice('--sequence='.length), '--sequence')
    } else if (raw.startsWith('--run-id=')) {
      args.runId = requireValue(raw.slice('--run-id='.length), '--run-id')
    } else if (raw.startsWith('--out=')) {
      args.outDir = requireValue(raw.slice('--out='.length), '--out')
    } else {
      throw new Error(`unknown argument: ${raw}`)
    }
  }

  if (!args.sequence) {
    throw new Error('--sequence is required')
  }

  return {
    sequence: args.sequence,
    ...(args.runId ? { runId: args.runId } : {}),
    ...(args.outDir ? { outDir: args.outDir } : {}),
  }
}

function requireValue(value: string, flagName: string): string {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new Error(`${flagName} must not be empty`)
  }
  return trimmed
}
