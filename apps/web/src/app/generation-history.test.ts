import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  appendGenerationHistoryEntries,
  buildVariantRequestBrief,
  relabelGenerationHistory,
} from './generation-history.js'

interface TestEntry {
  id: string
  immutable: boolean
  label: string
}

function entry(id: string, immutable = false): TestEntry {
  return { id, immutable, label: id }
}

describe('generation history', () => {
  it('keeps the immutable baseline when variant inserts exceed the max history', () => {
    const entries = [
      entry('original', true),
      entry('old-1'),
      entry('old-2'),
      entry('old-3'),
      entry('old-4'),
      entry('old-5'),
    ]
    const next = appendGenerationHistoryEntries(
      entries,
      [entry('new-1'), entry('new-2'), entry('new-3')],
      6,
    )

    assert.deepEqual(
      next.map((item) => item.id),
      ['original', 'old-4', 'old-5', 'new-1', 'new-2', 'new-3'],
    )
  })

  it('relabels mutable generations by their final visible index', () => {
    const next = relabelGenerationHistory([
      entry('original', true),
      entry('first'),
      entry('second'),
    ])

    assert.equal(next[0]?.label, 'original')
    assert.equal(next[1]?.label, '생성 1')
    assert.equal(next[2]?.label, '생성 2')
  })

  it('adds diversity hints only to request briefs for multi-variant generation', () => {
    const submitted = {
      intent: '관광 코스 랜딩',
      notes: '제주 사진 중심',
    }
    const request = buildVariantRequestBrief(submitted, 1, 3)

    assert.equal(submitted.notes, '제주 사진 중심')
    assert.match(request.notes ?? '', /제주 사진 중심/)
    assert.match(request.notes ?? '', /변형 2:/)
  })

  it('returns the original brief object for single generation', () => {
    const submitted = { intent: '관광 코스 랜딩' }

    assert.equal(buildVariantRequestBrief(submitted, 0, 1), submitted)
  })
})
