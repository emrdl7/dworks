#!/usr/bin/env tsx
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  AXIS_IDS,
  buildPlaceholderTree,
  callJudgeRepeated,
  evalResultSchema,
  getAxisRubric,
  loadBriefs,
  type AxisId,
  type AxisScore,
  type Brief,
  type EvalResult,
  type ReproducibilityCheck,
} from '@dworks/eval'
import { captureTree, type CaptureResult } from '@dworks/screenshot'

import { parseArgs } from './args.js'
import { renderMarkdownReport, summarizeResults } from './summary.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')
const DEFAULT_BRIEFS_DIR = join(ROOT, 'seeds/evals/briefs')
const DEFAULT_ARTIFACTS_ROOT = join(ROOT, 'artifacts/evals')

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const runId = args.runId ?? new Date().toISOString().replace(/[:.]/g, '-')
  const runDir = args.outDir
    ? resolve(ROOT, args.outDir)
    : join(DEFAULT_ARTIFACTS_ROOT, runId)
  const mode = args.dryRun ? 'dry-run' : 'live'

  console.log(`[eval-runner] runId=${runId}`)
  console.log(`[eval-runner] mode=${mode}`)
  if (args.dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.log('[eval-runner] ANTHROPIC_API_KEY is missing; dry-run stub judge is active')
  }

  const allBriefs = await loadBriefs(DEFAULT_BRIEFS_DIR)
  const briefs = filterBriefs(allBriefs, args.briefIds)
  const axes = args.axes ?? [...AXIS_IDS]
  console.log(`[eval-runner] briefs=${briefs.length}/${allBriefs.length}, axes=${axes.length}/${AXIS_IDS.length}`)

  const results: EvalResult[] = []
  for (const brief of briefs) {
    results.push(
      await runBrief({
        brief,
        axes,
        runId,
        runDir,
        dryRun: args.dryRun,
        noScreenshots: args.noScreenshots,
        repeat: args.repeat,
      }),
    )
  }

  const summary = summarizeResults(results, { mode, repeat: args.repeat })
  summary.axes = axes.length
  summary.briefs = briefs.length

  await mkdir(runDir, { recursive: true })
  await writeFile(join(runDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  await writeFile(join(runDir, 'report.md'), renderMarkdownReport(summary), 'utf8')

  console.log('\n=== Summary ===')
  console.log(`artifacts: ${runDir}`)
  console.log(
    `judge calls=${summary.estimate.judgeCalls}, estimate=${summary.estimate.estimatedSeconds}s / $${summary.estimate.estimatedCostUsd.toFixed(4)}`,
  )
  for (const [axis, item] of Object.entries(summary.perAxis)) {
    if (!item) continue
    console.log(`  ${axis.padEnd(45)} mean=${item.mean.toFixed(2)} min=${item.min} (${item.minBriefId})`)
  }
}

interface RunBriefInput {
  brief: Brief
  axes: AxisId[]
  runId: string
  runDir: string
  dryRun: boolean
  noScreenshots: boolean
  repeat: number
}

async function runBrief(input: RunBriefInput): Promise<EvalResult> {
  const { brief, axes, runId, runDir, dryRun, noScreenshots, repeat } = input
  const repeatTag = repeat > 1 ? ` repeat=${repeat}` : ''
  console.log(`[eval-runner] brief=${brief.id} category=${brief.category}${repeatTag}`)
  const tree = buildPlaceholderTree(brief)
  const briefDir = join(runDir, 'briefs', brief.id)
  await mkdir(briefDir, { recursive: true })

  const captures = noScreenshots
    ? []
    : await captureTree(tree, {
        pathPrefix: join(briefDir, 'shot'),
      })

  const axisScores: AxisScore[] = []
  const reproducibility: ReproducibilityCheck[] = []
  for (const axisId of axes) {
    const axis = getAxisRubric(axisId)
    const screenshots = captures
      .filter((capture) => axis.inputViewports.includes(capture.viewport))
      .map((capture) => ({
        viewport: capture.viewport,
        base64Png: capture.base64Png,
      }))
    const repeated = await callJudgeRepeated(
      {
        briefId: brief.id,
        briefText: briefToText(brief),
        axis,
        screenshots,
      },
      repeat,
      { dryRun },
    )
    axisScores.push(repeated.representative)
    if (repeated.reproducibility) {
      reproducibility.push(repeated.reproducibility)
    }
  }

  const result: EvalResult = {
    briefId: brief.id,
    treeRootId: tree.root.id,
    runId,
    ranAt: new Date().toISOString(),
    axes: axisScores,
    viewports: captures.map((capture) => ({
      width: capture.width,
      label: capture.viewport,
      screenshotPath: capture.filePath ?? '',
    })),
    ...(reproducibility.length > 0 ? { reproducibility } : {}),
  }
  const parsed = evalResultSchema.parse(result)
  await writeFile(join(briefDir, 'result.json'), `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')
  await writeCaptureManifest(briefDir, captures)
  return parsed
}

async function writeCaptureManifest(briefDir: string, captures: CaptureResult[]): Promise<void> {
  const manifest = captures.map((capture) => ({
    viewport: capture.viewport,
    width: capture.width,
    height: capture.height,
    filePath: capture.filePath ?? null,
  }))
  await writeFile(join(briefDir, 'screenshots.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

function filterBriefs(briefs: Brief[], ids: string[] | undefined): Brief[] {
  if (!ids || ids.length === 0) return briefs
  const wanted = new Set(ids)
  const filtered = briefs.filter((brief) => wanted.has(brief.id))
  const missing = [...wanted].filter((id) => !briefs.some((brief) => brief.id === id))
  if (missing.length > 0) throw new Error(`unknown brief id(s): ${missing.join(', ')}`)
  return filtered
}

function briefToText(brief: Brief): string {
  const lines = [
    `id: ${brief.id}`,
    `category: ${brief.category}`,
    `intent: ${brief.intent}`,
  ]
  for (const [key, value] of Object.entries(brief.answers)) {
    lines.push(`${key}: ${value}`)
  }
  return lines.join('\n')
}

main().catch((error) => {
  console.error('[eval-runner] failed:', error)
  process.exit(1)
})
