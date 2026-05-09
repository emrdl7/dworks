// m3-eval CLI 진입점.

import { M3EvalArgsError, parseM3EvalArgs } from './args.js'
import { defaultLoadFixtures, runM3Eval } from './run.js'

async function main() {
  let args
  try {
    args = parseM3EvalArgs(process.argv.slice(2))
  } catch (err) {
    if (err instanceof M3EvalArgsError) {
      console.error(err.message)
      process.exit(2)
    }
    throw err
  }
  if (args.providers !== null) {
    process.env.DWORKS_LLM_PROVIDERS = args.providers.join(',')
  }
  const result = await runM3Eval(args, { loadFixtures: defaultLoadFixtures })
  console.log(`m3-eval done — ${result.calls.length} calls → ${result.outDir}`)
  console.log(result.summaryMarkdown.split('\n').slice(0, 20).join('\n'))
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : String(err))
  process.exit(1)
})
