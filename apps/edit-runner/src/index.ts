#!/usr/bin/env tsx
import { parseArgs } from './args.js'
import { runEdit } from './run.js'

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const result = await runEdit(args)

  console.log(`[edit-runner] runId=${result.manifest.runId}`)
  console.log(`[edit-runner] sequence=${result.manifest.sequenceId ?? '(unknown)'}`)
  console.log(`[edit-runner] status=${result.manifest.status}`)
  console.log(`[edit-runner] artifacts=${result.outDir}`)

  if (result.manifest.status !== 'ok') {
    if (result.manifest.errorMessage) {
      console.error(`[edit-runner] ${result.manifest.errorMessage}`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('[edit-runner] failed:', error)
  process.exit(1)
})
