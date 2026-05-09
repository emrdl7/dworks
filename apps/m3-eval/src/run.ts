// m3-eval orchestrator — fixtures × repeat × providers 호출 + 결과 수집.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import { treeSchema, type Tree } from '@dworks/tree'

import type { M3EvalArgs } from './args.js'
import { computeTreeStats } from './tree-stats.js'
import { computeDiversity } from './diversity.js'
import { renderSummaryMarkdown, summarizeCalls } from './summary.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../..')

export type CallStatus =
  | 'ok'
  | 'invalid-request'
  | 'parse-failure'
  | 'schema-failure'
  | 'cli-timeout'
  | 'cli-failure'
  | 'cli-unavailable'
  | 'transport-error'

export interface CallResult {
  intentId: string
  repeatIndex: number
  status: CallStatus
  httpStatus: number | null
  model: string | null
  requestLatencyMs: number
  modelLatencyMs: number | null
  treeNodeCount: number | null
  treeDepth: number | null
  message: string | null
}

const briefAnswerSchema = z.object({
  questionId: z.string().min(1).max(40),
  questionLabel: z.string().min(1).max(120),
  answer: z.union([z.string(), z.array(z.string())]),
})

const briefSchema = z.object({
  intent: z.string().min(1).max(500),
  answers: z.array(briefAnswerSchema).max(6).optional(),
  notes: z.string().max(300).optional(),
})

export const fixtureSchema = z.object({
  intents: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        domain: z.string().min(1).max(40).optional(),
        brief: briefSchema,
      }),
    )
    .min(1)
    .max(50),
})
export type FixturePayload = z.infer<typeof fixtureSchema>
export type FixtureIntent = FixturePayload['intents'][number]

interface CallOnceInput {
  apiBase: string
  brief: FixtureIntent['brief']
  providers: string[] | null
  live: boolean
  fetchImpl?: typeof fetch
  /** dry-run 모드에서 사용할 deterministic Tree. 미지정 시 default. */
  dryRunTree?: Tree
}

const DEFAULT_DRY_RUN_TREE: Tree = {
  version: '1',
  root: {
    id: 'eval.dry.hero',
    editKind: 'structure',
    type: 'hero',
    responsive: undefined,
    children: [
      {
        id: 'eval.dry.title',
        editKind: 'text',
        type: 'text',
        responsive: undefined,
        content: 'm3-eval dry-run',
        emphasis: 'heading-1',
      },
    ],
  },
}

interface ApiSuccessBody {
  tree: Tree
  model?: string
  latencyMs?: number
}
interface ApiErrorBody {
  error?: string
  message?: string
}

const callStatusByApiError: Record<string, CallStatus> = {
  'invalid-request': 'invalid-request',
  'cli-unavailable': 'cli-unavailable',
  'cli-failure': 'cli-failure',
  'cli-timeout': 'cli-timeout',
  'parse-failure': 'parse-failure',
  'schema-failure': 'schema-failure',
}

async function callOnce(
  input: CallOnceInput,
): Promise<{
  status: CallStatus
  httpStatus: number | null
  model: string | null
  modelLatencyMs: number | null
  tree: Tree | null
  message: string | null
  requestLatencyMs: number
}> {
  const startedAt = Date.now()
  if (!input.live) {
    return {
      status: 'ok',
      httpStatus: 200,
      model: 'dry-run',
      modelLatencyMs: 0,
      tree: input.dryRunTree ?? DEFAULT_DRY_RUN_TREE,
      message: null,
      requestLatencyMs: Date.now() - startedAt,
    }
  }
  const fetchFn = input.fetchImpl ?? fetch
  try {
    const response = await fetchFn(`${input.apiBase}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief: input.brief,
        ...(input.providers !== null ? { providers: input.providers } : {}),
      }),
    })
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      return {
        status: 'transport-error',
        httpStatus: response.status,
        model: null,
        modelLatencyMs: null,
        tree: null,
        message: '응답이 유효한 JSON이 아닙니다.',
        requestLatencyMs: Date.now() - startedAt,
      }
    }
    if (!response.ok) {
      const errorBody = payload as ApiErrorBody
      const mapped =
        callStatusByApiError[errorBody.error ?? ''] ?? 'transport-error'
      return {
        status: mapped,
        httpStatus: response.status,
        model: null,
        modelLatencyMs: null,
        tree: null,
        message: errorBody.message ?? null,
        requestLatencyMs: Date.now() - startedAt,
      }
    }
    const successBody = payload as ApiSuccessBody
    if (successBody.tree === undefined) {
      return {
        status: 'schema-failure',
        httpStatus: response.status,
        model: successBody.model ?? null,
        modelLatencyMs: successBody.latencyMs ?? null,
        tree: null,
        message: 'API 응답에 tree가 없습니다.',
        requestLatencyMs: Date.now() - startedAt,
      }
    }
    const treeParse = treeSchema.safeParse(successBody.tree)
    if (!treeParse.success) {
      return {
        status: 'schema-failure',
        httpStatus: response.status,
        model: successBody.model ?? null,
        modelLatencyMs: successBody.latencyMs ?? null,
        tree: null,
        message: 'tree가 schema를 통과하지 못했습니다.',
        requestLatencyMs: Date.now() - startedAt,
      }
    }
    return {
      status: 'ok',
      httpStatus: response.status,
      model: successBody.model ?? null,
      modelLatencyMs: successBody.latencyMs ?? null,
      tree: treeParse.data,
      message: null,
      requestLatencyMs: Date.now() - startedAt,
    }
  } catch (err) {
    return {
      status: 'transport-error',
      httpStatus: null,
      model: null,
      modelLatencyMs: null,
      tree: null,
      message: err instanceof Error ? err.message : String(err),
      requestLatencyMs: Date.now() - startedAt,
    }
  }
}

export interface RunM3EvalDeps {
  fetchImpl?: typeof fetch
  loadFixtures: (path: string) => Promise<FixturePayload>
  ensureDir?: (path: string) => Promise<void>
  writeFileImpl?: typeof writeFile
  now?: () => Date
}

export interface RunM3EvalResult {
  outDir: string
  calls: CallResult[]
  summaryMarkdown: string
}

/**
 * Eval main orchestration.
 */
export async function runM3Eval(
  args: M3EvalArgs,
  deps: RunM3EvalDeps,
): Promise<RunM3EvalResult> {
  const fixtures = await deps.loadFixtures(args.fixturesPath)
  const now = (deps.now ?? (() => new Date()))()
  const runId = now.toISOString().replace(/[:.]/g, '-')
  const outDir =
    args.outDir !== null
      ? resolve(REPO_ROOT, args.outDir)
      : resolve(REPO_ROOT, 'artifacts/m3-eval', runId)

  const ensureDir = deps.ensureDir ?? ((path) => mkdir(path, { recursive: true }))
  const writeFileImpl = deps.writeFileImpl ?? writeFile

  const calls: CallResult[] = []
  const successfulTreesByIntent = new Map<string, Tree[]>()
  for (const intent of fixtures.intents) {
    for (let r = 0; r < args.repeat; r++) {
      const result = await callOnce({
        apiBase: args.apiBase,
        brief: intent.brief,
        providers: args.providers,
        live: args.live,
        fetchImpl: deps.fetchImpl,
      })
      const stats =
        result.tree !== null ? computeTreeStats(result.tree.root) : null
      calls.push({
        intentId: intent.id,
        repeatIndex: r,
        status: result.status,
        httpStatus: result.httpStatus,
        model: result.model,
        requestLatencyMs: result.requestLatencyMs,
        modelLatencyMs: result.modelLatencyMs,
        treeNodeCount: stats?.nodeCount ?? null,
        treeDepth: stats?.depth ?? null,
        message: result.message,
      })
      if (result.status === 'ok' && result.tree !== null) {
        const list = successfulTreesByIntent.get(intent.id) ?? []
        list.push(result.tree)
        successfulTreesByIntent.set(intent.id, list)
      }
    }
  }

  const diversityByIntent = new Map<string, number | null>()
  for (const intent of fixtures.intents) {
    const trees = successfulTreesByIntent.get(intent.id) ?? []
    diversityByIntent.set(intent.id, computeDiversity(trees))
  }

  await ensureDir(outDir)

  const manifest = {
    runId,
    ranAt: now.toISOString(),
    args: {
      fixturesPath: args.fixturesPath,
      apiBase: args.apiBase,
      repeat: args.repeat,
      providers: args.providers,
      live: args.live,
    },
    fixtureCount: fixtures.intents.length,
    callCount: calls.length,
  }
  await writeFileImpl(
    join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  )

  const callsJsonl = calls.map((c) => JSON.stringify(c)).join('\n') + '\n'
  await writeFileImpl(join(outDir, 'calls.jsonl'), callsJsonl, 'utf8')

  const summary = summarizeCalls(calls, fixtures.intents, diversityByIntent)
  await writeFileImpl(
    join(outDir, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8',
  )
  const markdown = renderSummaryMarkdown(summary, manifest)
  await writeFileImpl(join(outDir, 'summary.md'), markdown, 'utf8')

  return { outDir, calls, summaryMarkdown: markdown }
}

export async function defaultLoadFixtures(
  path: string,
): Promise<FixturePayload> {
  const { readFile } = await import('node:fs/promises')
  const raw = await readFile(resolve(REPO_ROOT, path), 'utf8')
  const json = JSON.parse(raw) as unknown
  return fixtureSchema.parse(json)
}
