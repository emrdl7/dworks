// design-resolver unit tests — Phase 2 첫 안전망.
// 회귀 방지 핵심: canvas-defaults 값이 _캔버스 className_과 어긋나면 즉시 깨져야 한다.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { TreeNode } from '@dworks/tree'

import { DEFAULT_SPACING_BY_TYPE } from './canvas-defaults.js'
import { resolveSpacing } from './design-resolver.js'

function makeSection(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'n-section',
    type: 'section',
    editKind: 'structure',
    responsive: undefined,
    children: [],
    ...overrides,
  } as TreeNode
}

function makeText(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'n-text',
    type: 'text',
    editKind: 'text',
    responsive: undefined,
    content: 'hi',
    ...overrides,
  } as TreeNode
}

describe('resolveSpacing', () => {
  it('leaf 노드는 default가 비어있어 value가 비어있다', () => {
    const out = resolveSpacing(makeText(), { viewport: 'desktop' })
    assert.deepEqual(out.value, {})
    assert.deepEqual(out.sources, {})
  })

  it('section은 type default(p-10 gap-8)을 채운다', () => {
    const out = resolveSpacing(makeSection(), { viewport: 'desktop' })
    assert.equal(out.value.paddingTop, 40)
    assert.equal(out.value.paddingRight, 40)
    assert.equal(out.value.paddingBottom, 40)
    assert.equal(out.value.paddingLeft, 40)
    assert.equal(out.value.gap, 32)
    assert.equal(out.sources.paddingTop, 'default')
    assert.equal(out.sources.gap, 'default')
  })

  it('explicit override는 default를 덮고 source가 explicit', () => {
    const node = makeSection({ spacing: { paddingTop: 100, gap: 16 } })
    const out = resolveSpacing(node, { viewport: 'desktop' })
    assert.equal(out.value.paddingTop, 100)
    assert.equal(out.value.gap, 16)
    assert.equal(out.sources.paddingTop, 'explicit')
    assert.equal(out.sources.gap, 'explicit')
    // 명시 안 한 키는 default로 채워짐
    assert.equal(out.value.paddingLeft, 40)
    assert.equal(out.sources.paddingLeft, 'default')
  })

  it('mobile에서 큰 explicit padding은 responsive 보정되며 source가 responsive', () => {
    const node = makeSection({ spacing: { paddingTop: 96, paddingLeft: 32 } })
    const out = resolveSpacing(node, { viewport: 'mobile' })
    assert.equal(out.value.paddingTop, 60)
    assert.equal(out.value.paddingLeft, 24)
    assert.equal(out.sources.paddingTop, 'responsive')
    assert.equal(out.sources.paddingLeft, 'responsive')
  })

  it('mobile에서 작은 explicit padding은 보정 안 되고 source가 explicit 유지', () => {
    const node = makeSection({ spacing: { paddingTop: 16 } })
    const out = resolveSpacing(node, { viewport: 'mobile' })
    assert.equal(out.value.paddingTop, 16)
    assert.equal(out.sources.paddingTop, 'explicit')
  })

  it('default는 viewport 보정 없이 그대로 (회귀 방지 — 작은 화면에서 default 말없이 줄어들면 시각 회귀)', () => {
    // section default paddingTop=40. mobile threshold(≥80)보다 작으므로 변동 없음
    const out = resolveSpacing(makeSection(), { viewport: 'mobile' })
    assert.equal(out.value.paddingTop, 40)
    assert.equal(out.sources.paddingTop, 'default')
  })

  it('canvas-defaults는 모든 TreeNodeType을 커버해야 한다 — 누락 시 사용자가 type 추가 후 resolver가 빠진 default 반환', () => {
    const types: Array<keyof typeof DEFAULT_SPACING_BY_TYPE> = [
      'text',
      'button',
      'image',
      'section',
      'hero',
      'card',
      'list',
      'form',
    ]
    for (const t of types) {
      assert.ok(
        DEFAULT_SPACING_BY_TYPE[t] !== undefined,
        `DEFAULT_SPACING_BY_TYPE missing ${t}`,
      )
    }
  })
})
