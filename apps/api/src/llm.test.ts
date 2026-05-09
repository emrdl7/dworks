import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveProviderChain } from './llm.js'

describe('resolveProviderChain', () => {
  it('uses Claude, Codex, and Gemini by default', () => {
    assert.deepEqual(resolveProviderChain(undefined), ['claude', 'codex', 'gemini'])
  })

  it('trims, deduplicates, and preserves valid provider order', () => {
    assert.deepEqual(
      resolveProviderChain(' gemini, claude, unknown, codex, claude, , gemini '),
      ['gemini', 'claude', 'codex'],
    )
  })

  it('returns an empty chain instead of falling back to defaults', () => {
    assert.deepEqual(resolveProviderChain('unknown, ,missing'), [])
  })
})
