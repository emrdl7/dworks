import { test } from 'node:test'
import assert from 'node:assert/strict'

import { formatBriefAsUserPrompt } from '../index.js'
import {
  availableDesignSystems,
  describeDesignSystem,
  describeDesignSystemExtended,
  listDesignSystemsExtended,
  loadDesignSystem,
} from './loader.js'

test('availableDesignSystems lists linear-app', () => {
  const list = availableDesignSystems()
  assert.ok(
    list.includes('linear-app'),
    `expected linear-app in [${list.join(', ')}]`,
  )
})

test('describeDesignSystem(linear-app) returns title + category', () => {
  const meta = describeDesignSystem('linear-app')
  assert.notEqual(meta, null)
  assert.ok(meta && meta.title.includes('Linear'))
  assert.ok(meta && meta.category && meta.category.includes('SaaS'))
})

test('loadDesignSystem blocks path traversal', () => {
  assert.equal(loadDesignSystem('../etc/passwd'), null)
  assert.equal(loadDesignSystem('foo/bar'), null)
  assert.equal(loadDesignSystem('..'), null)
})

test('loadDesignSystem returns null for unknown id', () => {
  assert.equal(loadDesignSystem('nonexistent-system-zz'), null)
})

test('loadDesignSystem(linear-app) returns DESIGN.md content', () => {
  const md = loadDesignSystem('linear-app')
  assert.notEqual(md, null)
  if (md === null) return
  assert.ok(md.length > 10000, `expected >10KB DESIGN.md, got ${md.length}`)
  assert.ok(md.includes('Linear'))
  assert.ok(md.includes('#5e6ad2'))
  assert.ok(md.includes('Inter Variable'))
})

test('formatBriefAsUserPrompt inlines linear-app DESIGN.md', () => {
  const prompt = formatBriefAsUserPrompt({
    intent: '프로젝트 관리 SaaS 랜딩 페이지',
    activeDesignSystem: 'linear-app',
  })
  assert.ok(prompt.includes('### 활성 디자인 시스템: linear-app'))
  assert.ok(prompt.includes('Linear'))
  assert.ok(prompt.includes('#5e6ad2'))
  assert.ok(prompt.includes('Inter Variable'))
})

test('formatBriefAsUserPrompt without activeDesignSystem keeps legacy behavior', () => {
  const prompt = formatBriefAsUserPrompt({ intent: 'plain' })
  assert.ok(!prompt.includes('활성 디자인 시스템'))
})

test('formatBriefAsUserPrompt with unknown system silently skips inject', () => {
  const prompt = formatBriefAsUserPrompt({
    intent: 'plain',
    activeDesignSystem: 'nonexistent-system-zz',
  })
  assert.ok(!prompt.includes('활성 디자인 시스템'))
})

test('availableDesignSystems imports all 149 from Open Design', () => {
  const list = availableDesignSystems()
  assert.ok(
    list.length >= 100,
    `expected >=100 design systems, got ${list.length}`,
  )
  // 대표 시스템들이 모두 존재해야 함
  for (const id of ['linear-app', 'stripe', 'vercel', 'apple', 'anthropic', 'notion']) {
    assert.ok(list.includes(id), `missing ${id} in catalog`)
  }
})

test('describeDesignSystemExtended extracts accent + bg + blurb for linear-app', () => {
  const meta = describeDesignSystemExtended('linear-app')
  assert.notEqual(meta, null)
  if (meta === null) return
  assert.equal(meta.id, 'linear-app')
  assert.ok(meta.accent !== null, 'accent should be present for linear-app')
  assert.ok(meta.accent && /^#[0-9a-f]{3,8}$/i.test(meta.accent))
  assert.ok(meta.blurb !== null && meta.blurb.length > 10)
})

test('listDesignSystemsExtended returns all valid metadata entries', () => {
  const list = listDesignSystemsExtended()
  assert.ok(list.length >= 100)
  // 모든 entry 가 id + title 보유
  for (const entry of list) {
    assert.ok(entry.id.length > 0)
    assert.ok(entry.title.length > 0)
  }
})
