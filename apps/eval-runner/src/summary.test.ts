import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { EvalResult } from '@dworks/eval'

import { renderMarkdownReport, summarizeResults } from './summary.js'

const resultA: EvalResult = {
  briefId: 'brief-a',
  treeRootId: 'brief-a.root',
  runId: 'run-test',
  ranAt: '2026-05-07T10:40:00Z',
  axes: [
    {
      axis: 'non-wireframe',
      score: 2,
      reason: 'wireframe',
      evidence: ['boxy'],
      judgeStatus: 'ok',
      suggestedAction: 'design-polish-needed',
      judgeModel: 'claude',
    },
    {
      axis: 'emotional-fit',
      score: 4,
      reason: 'fit',
      evidence: ['tone'],
      judgeStatus: 'ok',
      suggestedAction: 'acceptable',
      judgeModel: 'claude',
    },
  ],
  viewports: [],
}

const resultB: EvalResult = {
  ...resultA,
  briefId: 'brief-b',
  treeRootId: 'brief-b.root',
  axes: [
    { ...resultA.axes[0]!, score: 3 },
    { ...resultA.axes[1]!, score: 1, suggestedAction: 'design-polish-needed' },
  ],
}

describe('eval summary', () => {
  it('summarizes per axis and per brief', () => {
    const summary = summarizeResults([resultA, resultB])
    assert.equal(summary.briefs, 2)
    assert.equal(summary.axes, 2)
    assert.equal(summary.perAxis['non-wireframe']?.mean, 2.5)
    assert.equal(summary.perAxis['emotional-fit']?.minBriefId, 'brief-b')
    assert.equal(summary.perBrief['brief-a']?.mean, 3)
    assert.equal(summary.perBrief['brief-b']?.minAxis, 'emotional-fit')
  })

  it('renders markdown report', () => {
    const report = renderMarkdownReport(summarizeResults([resultA, resultB]))
    assert.match(report, /^# Dworks Eval Report/)
    assert.match(report, /Axis Summary/)
    assert.match(report, /brief-b/)
  })
})
