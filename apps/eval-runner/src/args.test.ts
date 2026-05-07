import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { parseArgs } from './args.js'

describe('parseArgs', () => {
  it('defaults to dry-run without explicit live mode', () => {
    const args = parseArgs([], {})
    assert.equal(args.dryRun, true)
  })

  it('uses live mode when DWORKS_JUDGE_MODE=live', () => {
    const args = parseArgs([], { DWORKS_JUDGE_MODE: 'live' })
    assert.equal(args.dryRun, false)
  })

  it('parses brief and axis filters', () => {
    const args = parseArgs([
      '--dry-run',
      '--briefs=a,b',
      '--axes=non-wireframe,emotional-fit',
      '--no-screenshots',
    ])
    assert.deepEqual(args.briefIds, ['a', 'b'])
    assert.deepEqual(args.axes, ['non-wireframe', 'emotional-fit'])
    assert.equal(args.noScreenshots, true)
  })

  it('repeat defaults to 1', () => {
    const args = parseArgs(['--dry-run'])
    assert.equal(args.repeat, 1)
  })

  it('parses --repeat=3', () => {
    const args = parseArgs(['--dry-run', '--repeat=3'])
    assert.equal(args.repeat, 3)
  })

  it('rejects --repeat=0', () => {
    assert.throws(() => parseArgs(['--repeat=0']))
  })

  it('rejects non-integer --repeat', () => {
    assert.throws(() => parseArgs(['--repeat=2.5']))
    assert.throws(() => parseArgs(['--repeat=abc']))
  })
})
