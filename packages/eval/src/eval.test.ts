// @dworks/eval 단위 테스트 — schema/axes/variance.
// LLM CLI 호출 자체는 로컬 인증 상태가 필요해 별도 통합 테스트로 분리.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  AXIS_IDS,
  AXIS_RUBRICS,
  axisScoreSchema,
  callJudgeRepeated,
  computeVariance,
  evalResultSchema,
  getAxisRubric,
  hasMixedJudgeRuns,
  listAxes,
  resolveJudgeTimeoutMs,
} from './index.js'

describe('eval types & schema', () => {
  it('exposes 7 axis ids per D5', () => {
    assert.equal(AXIS_IDS.length, 7)
  })

  it('every axis id has a rubric definition', () => {
    for (const id of AXIS_IDS) {
      const r = AXIS_RUBRICS[id]
      assert.equal(r.id, id)
      assert.equal(r.title.length > 0, true)
      assert.equal(r.description.length > 0, true)
      // 0–5 점수 모두 정의돼야.
      for (let s = 0; s <= 5; s++) {
        assert.ok(r.rubric[s as 0 | 1 | 2 | 3 | 4 | 5], `${id} 점수 ${s} 정의 누락`)
      }
    }
  })

  it('listAxes / getAxisRubric 일관', () => {
    const all = listAxes()
    assert.equal(all.length, 7)
    for (const r of all) {
      assert.equal(getAxisRubric(r.id), r)
    }
  })

  it('axisScoreSchema rejects invalid score', () => {
    const bad = {
      axis: 'non-wireframe',
      score: 7, // out of range
      reason: 'r',
      evidence: ['e'],
      judgeStatus: 'ok',
      suggestedAction: 'acceptable',
      judgeModel: 'claude',
    }
    assert.throws(() => axisScoreSchema.parse(bad))
  })

  it('axisScoreSchema accepts valid score', () => {
    const good = {
      axis: 'first-viewport-richness',
      score: 3,
      reason: '핵심 CTA는 보이지만 위계 약함',
      evidence: ['CTA below fold', 'no visual focal point'],
      judgeStatus: 'ok',
      suggestedAction: 'design-polish-needed',
      judgeModel: 'claude',
    }
    const parsed = axisScoreSchema.parse(good)
    assert.equal(parsed.score, 3)
  })

  it('evalResultSchema requires viewport array', () => {
    const result = {
      briefId: 'b1',
      treeRootId: 'r1',
      runId: 'run-1',
      ranAt: '2026-05-07T10:30:00Z',
      axes: [
        {
          axis: 'editability',
          score: 4,
          reason: 'ok',
          evidence: ['unit ok'],
          judgeStatus: 'ok',
          suggestedAction: 'acceptable',
          judgeModel: 'claude',
        },
      ],
      viewports: [
        { width: 1440, label: 'desktop', screenshotPath: '/x.png' },
      ],
    }
    const parsed = evalResultSchema.parse(result)
    assert.equal(parsed.axes.length, 1)
  })
})

describe('reproducibility variance', () => {
  it('zero variance for identical scores', () => {
    assert.equal(computeVariance([3, 3, 3]), 0)
  })

  it('non-zero variance for spread', () => {
    const v = computeVariance([2, 3, 4])
    assert.ok(v > 0)
  })

  it('stable threshold 0.5 is reasonable for 3-3-4 spread', () => {
    // [3,3,4]: mean=3.333..., var ≈ 0.222. stable.
    const v = computeVariance([3, 3, 4])
    assert.ok(v < 0.5, `variance ${v} should be < 0.5`)
  })

  it('unstable for 2-3-5 spread', () => {
    // [2,3,5]: mean=3.333..., var ≈ 1.555. unstable.
    const v = computeVariance([2, 3, 5])
    assert.ok(v > 0.5)
  })

  it('detects mixed judge model runs by provider or version', () => {
    assert.equal(
      hasMixedJudgeRuns([
        { judgeModel: 'claude', judgeModelVersion: 'claude-sonnet-4-5-20250929' },
        { judgeModel: 'claude', judgeModelVersion: 'claude-sonnet-4-5-20250929' },
      ]),
      false,
    )
    assert.equal(
      hasMixedJudgeRuns([
        { judgeModel: 'claude', judgeModelVersion: 'claude-sonnet-4-5-20250929' },
        { judgeModel: 'claude', judgeModelVersion: 'claude-opus-4-7-20260210' },
      ]),
      true,
    )
    assert.equal(
      hasMixedJudgeRuns([
        { judgeModel: 'claude', judgeModelVersion: 'claude-sonnet-4-5-20250929' },
        { judgeModel: 'codex', judgeModelVersion: 'gpt-5.2' },
      ]),
      true,
    )
  })

  it('callJudgeRepeated records judge run metadata in dry-run reproducibility', async () => {
    const repeated = await callJudgeRepeated(
      {
        briefId: 'brief-a',
        briefText: 'intent: public landing',
        axis: getAxisRubric('non-wireframe'),
        screenshots: [],
      },
      3,
      { dryRun: true },
    )
    assert.equal(repeated.judgeRuns.length, 3)
    assert.equal(repeated.representative.judgeStatus, 'ok')
    assert.deepEqual(
      repeated.reproducibility?.judgeRuns?.map((run) => run.judgeModelVersion),
      ['dry-run-stub', 'dry-run-stub', 'dry-run-stub'],
    )
  })
})

describe('judge timeout config', () => {
  it('defaults to 30 seconds', () => {
    assert.equal(resolveJudgeTimeoutMs({}, {}), 30000)
  })

  it('prefers explicit option over env', () => {
    assert.equal(
      resolveJudgeTimeoutMs(
        { judgeTimeoutMs: 60000 },
        { DWORKS_JUDGE_TIMEOUT_MS: '45000' },
      ),
      60000,
    )
  })

  it('uses DWORKS_JUDGE_TIMEOUT_MS env when option is absent', () => {
    assert.equal(resolveJudgeTimeoutMs({}, { DWORKS_JUDGE_TIMEOUT_MS: '45000' }), 45000)
  })

  it('rejects invalid timeout values', () => {
    assert.throws(() => resolveJudgeTimeoutMs({ judgeTimeoutMs: 0 }, {}))
    assert.throws(() => resolveJudgeTimeoutMs({}, { DWORKS_JUDGE_TIMEOUT_MS: 'abc' }))
  })
})
