// summary aggregation unit tests.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { renderSummaryMarkdown, summarizeCalls } from './summary.js'
import type { CallResult, FixtureIntent } from './run.js'

const intents: FixtureIntent[] = [
  { id: 'cafe', brief: { intent: '카페 랜딩' } },
  { id: 'saas', brief: { intent: 'SaaS 가격' } },
]

const calls: CallResult[] = [
  {
    intentId: 'cafe',
    repeatIndex: 0,
    status: 'ok',
    httpStatus: 200,
    model: 'claude',
    requestLatencyMs: 100,
    modelLatencyMs: 80,
    treeNodeCount: 4,
    treeDepth: 2,
    message: null,
  },
  {
    intentId: 'cafe',
    repeatIndex: 1,
    status: 'schema-failure',
    httpStatus: 422,
    model: null,
    requestLatencyMs: 200,
    modelLatencyMs: null,
    treeNodeCount: null,
    treeDepth: null,
    message: 'schema 실패',
  },
  {
    intentId: 'saas',
    repeatIndex: 0,
    status: 'ok',
    httpStatus: 200,
    model: 'codex',
    requestLatencyMs: 300,
    modelLatencyMs: 250,
    treeNodeCount: 9,
    treeDepth: 3,
    message: null,
  },
]

describe('summarizeCalls', () => {
  it('aggregates overall counts and ratios', () => {
    const summary = summarizeCalls(calls, intents)
    assert.equal(summary.overall.total, 3)
    assert.equal(summary.overall.success, 2)
    assert.ok(Math.abs(summary.overall.successRatio - 2 / 3) < 0.0001)
    assert.equal(summary.overall.byStatus.ok, 2)
    assert.equal(summary.overall.byStatus['schema-failure'], 1)
  })

  it('groups by intent', () => {
    const summary = summarizeCalls(calls, intents)
    const cafe = summary.byIntent.find((b) => b.intentId === 'cafe')
    assert.equal(cafe?.bucket.total, 2)
    assert.equal(cafe?.bucket.success, 1)
  })

  it('groups by provider only counting successful calls', () => {
    const summary = summarizeCalls(calls, intents)
    const claude = summary.byProvider.find((b) => b.provider === 'claude')
    assert.equal(claude?.bucket.total, 1)
    assert.equal(claude?.bucket.success, 1)
  })

  it('renderSummaryMarkdown contains overall and intent sections', () => {
    const summary = summarizeCalls(calls, intents)
    const md = renderSummaryMarkdown(summary, {
      runId: 'run-x',
      ranAt: '2026-05-09T00:00:00.000Z',
      args: { fixturesPath: 'f.json', live: false, repeat: 1 },
    })
    assert.ok(md.includes('# m3-eval run run-x'))
    assert.ok(md.includes('## 전체'))
    assert.ok(md.includes('## intent별'))
    assert.ok(md.includes('cafe'))
    assert.ok(md.includes('claude'))
  })

  it('diversityScore is null when no diversityByIntent is provided', () => {
    const summary = summarizeCalls(calls, intents)
    for (const row of summary.byIntent) {
      assert.equal(row.diversityScore, null)
    }
  })

  it('diversityScore is propagated from diversityByIntent', () => {
    const diversity = new Map<string, number | null>([
      ['cafe', 0],
      ['saas', null],
    ])
    const summary = summarizeCalls(calls, intents, diversity)
    const cafe = summary.byIntent.find((b) => b.intentId === 'cafe')
    const saas = summary.byIntent.find((b) => b.intentId === 'saas')
    assert.equal(cafe?.diversityScore, 0)
    assert.equal(saas?.diversityScore, null)
  })

  it('intent table markdown shows 구조 다양성 header and 0.00/- formatting', () => {
    const diversity = new Map<string, number | null>([
      ['cafe', 0],
      ['saas', null],
    ])
    const summary = summarizeCalls(calls, intents, diversity)
    const md = renderSummaryMarkdown(summary, {
      runId: 'r',
      ranAt: '2026-05-09T00:00:00.000Z',
      args: { fixturesPath: 'f.json', live: false, repeat: 2 },
    })
    assert.ok(md.includes('구조 다양성'))
    // 0 → "0.00", null → "-"
    assert.ok(md.includes('| 0.00 |'))
    assert.ok(md.includes('| - |'))
  })

  it('slopRichness is null when no slopRichnessByIntent is provided', () => {
    const summary = summarizeCalls(calls, intents)
    for (const row of summary.byIntent) {
      assert.equal(row.slopRichness, null)
    }
  })

  it('slopRichness is propagated and rendered with 풍부도 column', () => {
    const richness = new Map<string, number | null>([
      ['cafe', 0.6],
      ['saas', null],
    ])
    const summary = summarizeCalls(calls, intents, undefined, richness)
    const cafe = summary.byIntent.find((b) => b.intentId === 'cafe')
    const saas = summary.byIntent.find((b) => b.intentId === 'saas')
    assert.equal(cafe?.slopRichness, 0.6)
    assert.equal(saas?.slopRichness, null)

    const md = renderSummaryMarkdown(summary, {
      runId: 'r',
      ranAt: '2026-05-09T00:00:00.000Z',
      args: { fixturesPath: 'f.json', live: true, repeat: 1 },
    })
    assert.ok(md.includes('풍부도'))
    assert.ok(md.includes('| 0.60 |'))
  })

  it('dry-run markdown includes deterministic note', () => {
    const summary = summarizeCalls(calls, intents)
    const md = renderSummaryMarkdown(summary, {
      runId: 'r',
      ranAt: '2026-05-09T00:00:00.000Z',
      args: { fixturesPath: 'f.json', live: false, repeat: 2 },
    })
    assert.ok(md.includes('dry-run은 deterministic'))
  })

  it('dry-run repeat 1 markdown does not include deterministic 0.00 note', () => {
    const summary = summarizeCalls(calls, intents)
    const md = renderSummaryMarkdown(summary, {
      runId: 'r',
      ranAt: '2026-05-09T00:00:00.000Z',
      args: { fixturesPath: 'f.json', live: false, repeat: 1 },
    })
    assert.ok(!md.includes('dry-run은 deterministic'))
  })

  it('live markdown does not include dry-run note', () => {
    const summary = summarizeCalls(calls, intents)
    const md = renderSummaryMarkdown(summary, {
      runId: 'r',
      ranAt: '2026-05-09T00:00:00.000Z',
      args: { fixturesPath: 'f.json', live: true, repeat: 2 },
    })
    assert.ok(!md.includes('dry-run은 deterministic'))
  })
})
