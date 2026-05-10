import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { REPO_ROOT, runEdit, type EditRunnerManifest } from './run.js'

const NOW = new Date('2026-05-07T00:00:00.000Z')

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

interface AnyNode {
  id?: string
  type?: string
  content?: string
  label?: string
  children?: AnyNode[]
}

function findNodeById(node: AnyNode | undefined, id: string): AnyNode | null {
  if (!node) return null
  if (node.id === id) return node
  for (const child of node.children ?? []) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

async function tempOut(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'dworks-edit-runner-'))
}

describe('runEdit', () => {
  it('runs a bundled sequence id and writes before/after artifacts', async () => {
    const out = await tempOut()
    const result = await runEdit(
      {
        sequence: 'simple-hero-content',
        runId: 'test-run',
        outDir: out,
      },
      { now: NOW },
    )

    assert.equal(result.manifest.status, 'ok')
    assert.equal(result.manifest.sequenceId, 'simple-hero-content')
    assert.equal(result.manifest.operationsCount, 2)
    assert.deepEqual(result.manifest.operationNodeIds, ['hero.title', 'hero.cta.primary'])

    const manifest = await readJson<EditRunnerManifest>(
      join(out, 'simple-hero-content', 'manifest.json'),
    )
    assert.equal(manifest.status, 'ok')

    const after = await readJson<{ root: AnyNode }>(
      join(out, 'simple-hero-content', 'after.json'),
    )
    // 새 simple-hero는 풀페이지 구조 (root=section, banner/main/footer 자식).
    // findNodeById로 깊이 탐색.
    assert.equal(
      findNodeById(after.root, 'hero.title')?.content,
      'Dworks Studio — 디자인의 시작',
    )
    assert.equal(
      findNodeById(after.root, 'hero.cta.primary')?.label,
      '바로 시작하기',
    )
  })

  it('runs an explicit sequence path', async () => {
    const out = await tempOut()
    const result = await runEdit(
      {
        sequence: join(REPO_ROOT, 'seeds/evals/edit-sequences/card-grid-content.json'),
        runId: 'path-run',
        outDir: out,
      },
      { now: NOW },
    )

    assert.equal(result.manifest.status, 'ok')
    assert.equal(result.manifest.sequenceId, 'card-grid-content')
    assert.equal(result.manifest.operationsCount, 4)
  })

  it('writes manifest for missing sequence', async () => {
    const out = await tempOut()
    const result = await runEdit(
      {
        sequence: 'missing-sequence',
        runId: 'missing-run',
        outDir: out,
      },
      { now: NOW },
    )

    assert.equal(result.manifest.status, 'sequence-resolve-error')
    assert.equal(result.manifest.sequenceId, 'missing-sequence')
    assert.match(result.manifest.errorMessage ?? '', /ENOENT/)
    const manifest = await readJson<EditRunnerManifest>(
      join(out, 'missing-sequence', 'manifest.json'),
    )
    assert.equal(manifest.status, 'sequence-resolve-error')
  })

  it('classifies tree edit failures as apply-error', async () => {
    const out = await tempOut()
    const sequencePath = join(out, 'bad-node.json')
    await writeFile(
      sequencePath,
      `${JSON.stringify(
        {
          id: 'bad-node',
          tree: '../../repo-does-not-matter.json',
          intent: 'bad node',
          operations: [
            {
              type: 'updateText',
              nodeId: 'missing',
              content: 'x',
            },
          ],
        },
        null,
        2,
      )}\n`,
      'utf8',
    )

    const treePath = join(out, 'tree.json')
    await writeFile(
      treePath,
      `${JSON.stringify({
        version: '1',
        root: {
          id: 'root',
          type: 'section',
          editKind: 'structure',
          children: [],
        },
      })}\n`,
      'utf8',
    )
    const fixedSequencePath = join(out, 'bad-node-fixed.json')
    await writeFile(
      fixedSequencePath,
      `${JSON.stringify({
        id: 'bad-node-fixed',
        tree: './tree.json',
        intent: 'bad node',
        operations: [
          {
            type: 'updateText',
            nodeId: 'missing',
            content: 'x',
          },
        ],
      })}\n`,
      'utf8',
    )

    const result = await runEdit(
      {
        sequence: fixedSequencePath,
        runId: 'apply-error-run',
        outDir: out,
      },
      { now: NOW },
    )

    assert.equal(result.manifest.status, 'apply-error')
    assert.match(result.manifest.errorMessage ?? '', /node not found: missing/)
  })
})
