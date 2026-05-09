// args parser unit tests.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { M3EvalArgsError, parseM3EvalArgs } from './args.js'

describe('parseM3EvalArgs', () => {
  it('parses minimal fixtures path with default repeat=1, dry-run', () => {
    const args = parseM3EvalArgs(['--fixtures', 'seeds/m3-eval/intents.json'])
    assert.equal(args.fixturesPath, 'seeds/m3-eval/intents.json')
    assert.equal(args.repeat, 1)
    assert.equal(args.live, false)
    assert.equal(args.providers, null)
    assert.equal(args.outDir, null)
  })

  it('parses repeat / providers / api-base / out / live', () => {
    const args = parseM3EvalArgs([
      '--fixtures',
      'fixt.json',
      '--repeat',
      '5',
      '--providers',
      'claude, codex ',
      '--api-base',
      'http://localhost:4000',
      '--out',
      'artifacts/run-1',
      '--live',
    ])
    assert.equal(args.repeat, 5)
    assert.deepEqual(args.providers, ['claude', 'codex'])
    assert.equal(args.apiBase, 'http://localhost:4000')
    assert.equal(args.outDir, 'artifacts/run-1')
    assert.equal(args.live, true)
  })

  it('rejects missing fixtures', () => {
    assert.throws(
      () => parseM3EvalArgs([]),
      (err: unknown) => err instanceof M3EvalArgsError,
    )
  })

  it('rejects repeat outside 1..50', () => {
    assert.throws(
      () => parseM3EvalArgs(['--fixtures', 'f.json', '--repeat', '0']),
      (err: unknown) => err instanceof M3EvalArgsError,
    )
    assert.throws(
      () => parseM3EvalArgs(['--fixtures', 'f.json', '--repeat', '999']),
      (err: unknown) => err instanceof M3EvalArgsError,
    )
  })

  it('rejects unknown providers', () => {
    assert.throws(
      () =>
        parseM3EvalArgs([
          '--fixtures',
          'f.json',
          '--providers',
          'claude,unknown',
        ]),
      (err: unknown) => err instanceof M3EvalArgsError,
    )
  })
})
