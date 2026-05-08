import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { treeSchema, type Tree } from '@dworks/tree'
import {
  applyEditSequence,
  editSequenceSchema,
  type EditSequence,
} from '@dworks/tree-editor'

import type { EditRunnerArgs } from './args.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(__dirname, '../../..')
const DEFAULT_SEQUENCE_DIR = join(REPO_ROOT, 'seeds/evals/edit-sequences')
const DEFAULT_OUT_ROOT = join(REPO_ROOT, 'artifacts/edits')

export type EditRunnerStatus =
  | 'ok'
  | 'sequence-resolve-error'
  | 'sequence-schema-error'
  | 'tree-resolve-error'
  | 'tree-schema-error'
  | 'apply-error'

export interface EditRunnerManifest {
  sequenceId: string | null
  sequencePath: string | null
  runId: string
  ranAt: string
  treePath: string | null
  operationsCount: number
  operationNodeIds: string[]
  status: EditRunnerStatus
  errorMessage: string | null
}

export interface EditRunnerResult {
  manifest: EditRunnerManifest
  outDir: string
}

interface RunOptions {
  now?: Date
}

export async function runEdit(
  args: EditRunnerArgs,
  options: RunOptions = {},
): Promise<EditRunnerResult> {
  const ranAt = (options.now ?? new Date()).toISOString()
  const runId = args.runId ?? ranAt.replace(/[:.]/g, '-')
  const outRoot = args.outDir ? resolve(REPO_ROOT, args.outDir) : join(DEFAULT_OUT_ROOT, runId)
  const initialSequenceId = inferSequenceId(args.sequence)
  let sequenceDir = join(outRoot, initialSequenceId ?? '_failed')

  const sequencePath = resolveSequencePath(args.sequence)
  let sequenceRaw: unknown
  try {
    sequenceRaw = await readJson(sequencePath)
  } catch (error) {
    const manifest = buildManifest({
      sequenceId: initialSequenceId,
      sequencePath,
      runId,
      ranAt,
      status: 'sequence-resolve-error',
      errorMessage: errorMessage(error),
    })
    await writeManifest(sequenceDir, manifest)
    return { manifest, outDir: sequenceDir }
  }

  let sequence: EditSequence
  try {
    sequence = editSequenceSchema.parse(sequenceRaw)
  } catch (error) {
    const sequenceId = rawSequenceId(sequenceRaw) ?? initialSequenceId
    sequenceDir = join(outRoot, sequenceId ?? '_failed')
    const manifest = buildManifest({
      sequenceId,
      sequencePath,
      runId,
      ranAt,
      status: 'sequence-schema-error',
      errorMessage: errorMessage(error),
    })
    await writeManifest(sequenceDir, manifest)
    return { manifest, outDir: sequenceDir }
  }

  sequenceDir = join(outRoot, sequence.id)
  await mkdir(sequenceDir, { recursive: true })
  await writeJson(join(sequenceDir, 'operations.json'), sequence.operations)

  const treePath = resolve(dirname(sequencePath), sequence.tree)
  let treeRaw: unknown
  try {
    treeRaw = await readJson(treePath)
  } catch (error) {
    const manifest = buildManifest({
      sequenceId: sequence.id,
      sequencePath,
      runId,
      ranAt,
      treePath,
      operations: sequence.operations,
      status: 'tree-resolve-error',
      errorMessage: errorMessage(error),
    })
    await writeManifest(sequenceDir, manifest)
    return { manifest, outDir: sequenceDir }
  }

  let tree: Tree
  try {
    tree = treeSchema.parse(treeRaw)
  } catch (error) {
    const manifest = buildManifest({
      sequenceId: sequence.id,
      sequencePath,
      runId,
      ranAt,
      treePath,
      operations: sequence.operations,
      status: 'tree-schema-error',
      errorMessage: errorMessage(error),
    })
    await writeManifest(sequenceDir, manifest)
    return { manifest, outDir: sequenceDir }
  }

  await writeJson(join(sequenceDir, 'before.json'), tree)

  let after: Tree
  try {
    after = applyEditSequence(tree, sequence.operations)
  } catch (error) {
    const manifest = buildManifest({
      sequenceId: sequence.id,
      sequencePath,
      runId,
      ranAt,
      treePath,
      operations: sequence.operations,
      status: 'apply-error',
      errorMessage: errorMessage(error),
    })
    await writeManifest(sequenceDir, manifest)
    return { manifest, outDir: sequenceDir }
  }

  await writeJson(join(sequenceDir, 'after.json'), after)
  const manifest = buildManifest({
    sequenceId: sequence.id,
    sequencePath,
    runId,
    ranAt,
    treePath,
    operations: sequence.operations,
    status: 'ok',
  })
  await writeManifest(sequenceDir, manifest)
  return { manifest, outDir: sequenceDir }
}

function resolveSequencePath(input: string): string {
  if (isExplicitPath(input)) {
    return isAbsolute(input) ? input : resolve(process.cwd(), input)
  }
  return join(DEFAULT_SEQUENCE_DIR, `${input}.json`)
}

function isExplicitPath(input: string): boolean {
  return input.includes('.json') || input.includes('/') || input.startsWith('./') || input.startsWith('../')
}

function inferSequenceId(input: string): string | null {
  if (!isExplicitPath(input)) return input
  const name = basename(input)
  if (!name) return null
  return name.endsWith('.json') ? name.slice(0, -'.json'.length) : name
}

function rawSequenceId(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('id' in value)) return null
  const id = (value as { id?: unknown }).id
  return typeof id === 'string' && id.trim().length > 0 ? id : null
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function writeManifest(outDir: string, manifest: EditRunnerManifest): Promise<void> {
  await mkdir(outDir, { recursive: true })
  await writeJson(join(outDir, 'manifest.json'), manifest)
}

function buildManifest(input: {
  sequenceId: string | null
  sequencePath: string | null
  runId: string
  ranAt: string
  treePath?: string | null
  operations?: EditSequence['operations']
  status: EditRunnerStatus
  errorMessage?: string | null
}): EditRunnerManifest {
  const operations = input.operations ?? []
  return {
    sequenceId: input.sequenceId,
    sequencePath: input.sequencePath ? repoRelative(input.sequencePath) : null,
    runId: input.runId,
    ranAt: input.ranAt,
    treePath: input.treePath ? repoRelative(input.treePath) : null,
    operationsCount: operations.length,
    operationNodeIds: operations.flatMap((operation) =>
      'nodeId' in operation ? [operation.nodeId] : [],
    ),
    status: input.status,
    errorMessage: input.errorMessage ?? null,
  }
}

function repoRelative(path: string): string {
  const rel = relative(REPO_ROOT, path)
  return rel.split(sep).join('/')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
