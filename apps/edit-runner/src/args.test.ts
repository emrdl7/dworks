import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { parseArgs } from './args.js'

describe('parseArgs', () => {
  it('requires --sequence', () => {
    assert.throws(() => parseArgs([]), /--sequence is required/)
  })

  it('parses sequence id', () => {
    const args = parseArgs(['--sequence=simple-hero-content'])
    assert.equal(args.sequence, 'simple-hero-content')
  })

  it('parses run id and out dir', () => {
    const args = parseArgs([
      '--sequence=./sequence.json',
      '--run-id=test-run',
      '--out=artifacts/edits/test-run',
    ])
    assert.equal(args.sequence, './sequence.json')
    assert.equal(args.runId, 'test-run')
    assert.equal(args.outDir, 'artifacts/edits/test-run')
  })

  it('rejects unknown arguments', () => {
    assert.throws(() => parseArgs(['--sequence=a', '--all']), /unknown argument/)
  })

  it('rejects empty values', () => {
    assert.throws(() => parseArgs(['--sequence=']), /--sequence must not be empty/)
    assert.throws(() => parseArgs(['--sequence=a', '--run-id=']), /--run-id must not be empty/)
    assert.throws(() => parseArgs(['--sequence=a', '--out=']), /--out must not be empty/)
  })
})
