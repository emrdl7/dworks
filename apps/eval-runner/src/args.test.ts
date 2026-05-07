import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { parseArgs } from './args.js'

describe('parseArgs', () => {
  it('defaults to dry-run without ANTHROPIC_API_KEY', () => {
    const args = parseArgs([], {})
    assert.equal(args.dryRun, true)
  })

  it('uses live mode when API key exists', () => {
    const args = parseArgs([], { ANTHROPIC_API_KEY: 'x' })
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
})
