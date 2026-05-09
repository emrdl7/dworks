// run.ts orchestrator unit tests (dry-run + mock fetch).

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { defaultLoadFixtures, fixtureSchema, runM3Eval } from './run.js'

const fixtures = fixtureSchema.parse({
  intents: [
    { id: 'cafe', domain: 'landing', brief: { intent: '카페 랜딩' } },
    { id: 'docs', domain: 'docs', brief: { intent: '문서 페이지' } },
  ],
})

const apiTree = {
  version: '1',
  root: {
    id: 'api.hero',
    editKind: 'structure',
    type: 'hero',
    children: [
      {
        id: 'api.title',
        editKind: 'text',
        type: 'text',
        content: 'API generated tree',
        emphasis: 'heading-1',
      },
    ],
  },
}

describe('runM3Eval', () => {
  it('loads repo-root relative fixture paths under pnpm filter cwd', async () => {
    const loaded = await defaultLoadFixtures('seeds/m3-eval/intents.json')

    assert.ok(loaded.intents.length >= 5)
  })

  it('dry-run records ok statuses without network', async () => {
    const written: Array<{ path: string; content: string }> = []
    const result = await runM3Eval(
      {
        fixturesPath: 'fixtures.json',
        repeat: 2,
        apiBase: 'http://localhost:3001',
        outDir: '/tmp/m3-eval-test',
        providers: null,
        live: false,
      },
      {
        loadFixtures: async () => fixtures,
        ensureDir: async () => {},
        writeFileImpl: (async (path, content) => {
          written.push({ path: String(path), content: String(content) })
        }) as typeof import('node:fs/promises').writeFile,
        now: () => new Date('2026-05-09T00:00:00Z'),
      },
    )
    assert.equal(result.calls.length, 4)
    for (const call of result.calls) {
      assert.equal(call.status, 'ok')
      assert.equal(call.model, 'dry-run')
      assert.ok(call.treeNodeCount !== null && call.treeNodeCount > 0)
    }
    const paths = written.map((w) => w.path)
    assert.ok(paths.some((p) => p.endsWith('manifest.json')))
    assert.ok(paths.some((p) => p.endsWith('calls.jsonl')))
    assert.ok(paths.some((p) => p.endsWith('summary.json')))
    assert.ok(paths.some((p) => p.endsWith('summary.md')))
  })

  it('live mode maps API 422 schema-failure to call status', async () => {
    const fakeFetch = (async () =>
      new Response(
        JSON.stringify({ error: 'schema-failure', message: 'bad tree' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      )) as typeof fetch
    const result = await runM3Eval(
      {
        fixturesPath: 'fixtures.json',
        repeat: 1,
        apiBase: 'http://localhost:3001',
        outDir: '/tmp/m3-eval-test-2',
        providers: null,
        live: true,
      },
      {
        loadFixtures: async () => fixtures,
        ensureDir: async () => {},
        writeFileImpl: (async () => {}) as typeof import('node:fs/promises').writeFile,
        fetchImpl: fakeFetch,
      },
    )
    assert.equal(result.calls.length, 2)
    for (const call of result.calls) {
      assert.equal(call.status, 'schema-failure')
      assert.equal(call.httpStatus, 422)
    }
  })

  it('live mode sends request-level provider overrides', async () => {
    let requestBody: unknown = null
    const fakeFetch = (async (_url, init) => {
      requestBody = JSON.parse(String(init?.body))
      return new Response(
        JSON.stringify({ tree: apiTree, model: 'codex', latencyMs: 42 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }) as typeof fetch
    const result = await runM3Eval(
      {
        fixturesPath: 'fixtures.json',
        repeat: 1,
        apiBase: 'http://localhost:3001',
        outDir: '/tmp/m3-eval-test-providers',
        providers: ['codex'],
        live: true,
      },
      {
        loadFixtures: async () => fixtures,
        ensureDir: async () => {},
        writeFileImpl: (async () => {}) as typeof import('node:fs/promises').writeFile,
        fetchImpl: fakeFetch,
      },
    )
    assert.deepEqual(
      (requestBody as { providers?: string[] } | null)?.providers,
      ['codex'],
    )
    assert.equal(result.calls[0]?.status, 'ok')
    assert.equal(result.calls[0]?.model, 'codex')
    assert.equal(result.calls[0]?.modelLatencyMs, 42)
  })

  it('live mode treats network rejection as transport-error', async () => {
    const fakeFetch = (async () => {
      throw new Error('econnrefused')
    }) as typeof fetch
    const result = await runM3Eval(
      {
        fixturesPath: 'fixtures.json',
        repeat: 1,
        apiBase: 'http://localhost:9999',
        outDir: '/tmp/m3-eval-test-3',
        providers: null,
        live: true,
      },
      {
        loadFixtures: async () => fixtures,
        ensureDir: async () => {},
        writeFileImpl: (async () => {}) as typeof import('node:fs/promises').writeFile,
        fetchImpl: fakeFetch,
      },
    )
    for (const call of result.calls) {
      assert.equal(call.status, 'transport-error')
    }
  })
})
