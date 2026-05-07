import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  EDIT_AXIS_IDS,
  EDIT_AXIS_RUBRICS,
  callEditJudge,
  editAxisScoreSchema,
  editEvalInputSchema,
  evaluateEdit,
  getEditAxisRubric,
  listEditAxes,
  summarizeEditOperations,
} from './index.js'

describe('edit-eval axes', () => {
  it('exposes 5 D6 axis ids', () => {
    assert.deepEqual(EDIT_AXIS_IDS, [
      'selection-accuracy',
      'edit-control-fit',
      'layout-preservation-after-edit',
      'user-intent-preservation',
      'output-tidiness',
    ])
  })

  it('every axis has a 0-5 rubric and viewport input set', () => {
    for (const id of EDIT_AXIS_IDS) {
      const rubric = EDIT_AXIS_RUBRICS[id]
      assert.equal(rubric.id, id)
      assert.ok(rubric.title.length > 0)
      assert.ok(rubric.description.length > 0)
      assert.ok(rubric.inputViewports.length > 0)
      for (let score = 0; score <= 5; score += 1) {
        assert.ok(rubric.rubric[score as 0 | 1 | 2 | 3 | 4 | 5])
      }
    }
  })

  it('listEditAxes / getEditAxisRubric are consistent', () => {
    const axes = listEditAxes()
    assert.equal(axes.length, 5)
    for (const axis of axes) {
      assert.equal(getEditAxisRubric(axis.id), axis)
    }
  })
})

describe('edit-eval schema', () => {
  it('accepts before/after screenshots and edit operations', () => {
    const parsed = editEvalInputSchema.parse({
      briefId: 'public-landing-jdc',
      operationSummary: 'hero title and cta copy edited',
      beforeScreenshots: [
        { viewport: 'desktop', width: 1440, screenshotPath: 'before-desktop.png' },
      ],
      afterScreenshots: [
        { viewport: 'desktop', width: 1440, screenshotPath: 'after-desktop.png' },
      ],
      editSequence: [
        { type: 'updateText', nodeId: 'hero.title', content: '새 제목' },
        { type: 'updateButtonLabel', nodeId: 'hero.cta', label: '바로 시작' },
      ],
    })

    assert.equal(parsed.editSequence?.length, 2)
  })

  it('rejects invalid edit axis scores', () => {
    assert.throws(() =>
      editAxisScoreSchema.parse({
        axis: 'non-wireframe',
        score: 3,
        reason: 'wrong axis family',
        evidence: [],
        judgeStatus: 'ok',
        suggestedAction: 'acceptable',
        judgeModel: 'claude',
      }),
    )

    assert.throws(() =>
      editAxisScoreSchema.parse({
        axis: 'selection-accuracy',
        score: 6,
        reason: 'out of range',
        evidence: [],
        judgeStatus: 'ok',
        suggestedAction: 'acceptable',
        judgeModel: 'claude',
      }),
    )
  })
})

describe('edit-eval dry-run judge', () => {
  const input = {
    briefId: 'public-landing-jdc',
    operationSummary: 'hero title and cta copy edited',
    beforeScreenshots: [{ viewport: 'desktop' as const, screenshotPath: 'before.png' }],
    afterScreenshots: [{ viewport: 'desktop' as const, screenshotPath: 'after.png' }],
    editSequence: [
      { type: 'updateText' as const, nodeId: 'hero.title', content: '새 제목' },
      { type: 'updateButtonLabel' as const, nodeId: 'hero.cta', label: '바로 시작' },
    ],
  }

  it('requires explicit dryRun for now', async () => {
    await assert.rejects(() =>
      callEditJudge({
        ...input,
        axis: getEditAxisRubric('selection-accuracy'),
      }),
    )
  })

  it('returns deterministic dry-run scores', async () => {
    const axis = getEditAxisRubric('selection-accuracy')
    const first = await callEditJudge({ ...input, axis }, { dryRun: true })
    const second = await callEditJudge({ ...input, axis }, { dryRun: true })

    assert.deepEqual(first, second)
    assert.equal(first.judgeStatus, 'ok')
    assert.equal(first.judgeModelVersion, 'dry-run-stub')
  })

  it('evaluates a selected axis set into a result payload', async () => {
    const result = await evaluateEdit(input, {
      dryRun: true,
      axes: ['selection-accuracy', 'output-tidiness'],
      runId: 'edit-eval-test',
      now: new Date('2026-05-08T00:00:00.000Z'),
    })

    assert.equal(result.briefId, 'public-landing-jdc')
    assert.equal(result.axes.length, 2)
    assert.deepEqual(result.axes.map((score) => score.axis), [
      'selection-accuracy',
      'output-tidiness',
    ])
    assert.equal(result.ranAt, '2026-05-08T00:00:00.000Z')
  })

  it('summarizes edit operations for judge input', () => {
    assert.equal(
      summarizeEditOperations(input.editSequence),
      [
        '1. updateText hero.title content="새 제목"',
        '2. updateButtonLabel hero.cta label="바로 시작"',
      ].join('\n'),
    )
  })
})
