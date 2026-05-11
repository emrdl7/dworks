import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  formatBriefForSelector,
  parseSelectorResponse,
  SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT,
} from './index.js'

test('parseSelectorResponse — 유효한 JSON', () => {
  const r = parseSelectorResponse('{"chosenSystem":"linear-app","rationale":"SaaS"}')
  assert.notEqual(r, null)
  assert.equal(r?.chosenSystem, 'linear-app')
  assert.equal(r?.rationale, 'SaaS')
})

test('parseSelectorResponse — code fence 가 와도 견고', () => {
  const r = parseSelectorResponse('```json\n{"chosenSystem":"stripe","rationale":"fin"}\n```')
  assert.notEqual(r, null)
  assert.equal(r?.chosenSystem, 'stripe')
})

test('parseSelectorResponse — invalid id 거부', () => {
  assert.equal(parseSelectorResponse('{"chosenSystem":"../bad","rationale":"x"}'), null)
  assert.equal(parseSelectorResponse('{"chosenSystem":"","rationale":"x"}'), null)
  assert.equal(parseSelectorResponse('{"chosenSystem":"UPPER","rationale":"x"}'), null)
})

test('parseSelectorResponse — malformed JSON', () => {
  assert.equal(parseSelectorResponse('not json'), null)
  assert.equal(parseSelectorResponse(''), null)
  assert.equal(parseSelectorResponse('{}'), null)
})

test('parseSelectorResponse — rationale 누락시 fallback', () => {
  const r = parseSelectorResponse('{"chosenSystem":"apple"}')
  assert.notEqual(r, null)
  assert.equal(r?.chosenSystem, 'apple')
  assert.ok(r?.rationale && r.rationale.length > 0)
})

test('formatBriefForSelector — intent + answers 직렬화', () => {
  const out = formatBriefForSelector({
    intent: 'SaaS 대시보드',
    answers: [
      { questionId: 'q1', questionLabel: '톤', answer: '미니멀' },
      { questionId: 'q2', questionLabel: '대상', answer: '엔지니어' },
    ],
  })
  assert.ok(out.includes('SaaS 대시보드'))
  assert.ok(out.includes('톤: 미니멀'))
  assert.ok(out.includes('엔지니어'))
})

test('SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT — 카탈로그 inject', () => {
  assert.ok(SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT.length > 10000)
  assert.ok(SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT.includes('linear-app'))
  assert.ok(SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT.includes('JSON'))
  assert.ok(SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT.includes('chosenSystem'))
  assert.ok(SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT.includes('rationale'))
})
