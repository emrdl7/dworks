// run.ts orchestrator unit tests (dry-run + mock fetch).

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { fixtureSchema, runM3Eval } from './run.js'

const fixtures = fixtureSchema.parse({
  intents: [
    { id: 'cafe', domain: 'landing', brief: { intent: '카페 랜딩' } },
    { id: 'docs', domain: 'docs', brief: { intent: '문서 페이지' } },
  ],
})

describe('runM3Eval', () => {
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
