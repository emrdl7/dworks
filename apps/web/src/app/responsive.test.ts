// m3-generate-responsive-rendering helper unit tests.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveResponsiveLayout, resolveResponsiveSpacing } from './responsive.js'

describe('resolveResponsiveSpacing', () => {
  it('returns undefined when spacing is undefined', () => {
    assert.equal(resolveResponsiveSpacing(undefined, 'mobile'), undefined)
  })

  it('passes through unchanged on desktop', () => {
    const spacing = { paddingTop: 96, paddingLeft: 32, gap: 32 }
    const out = resolveResponsiveSpacing(spacing, 'desktop')
    assert.deepEqual(out, spacing)
  })

  it('mobile shrinks padding/gap above thresholds', () => {
    const out = resolveResponsiveSpacing(
      {
        paddingTop: 96,
        paddingBottom: 96,
        paddingLeft: 32,
        paddingRight: 32,
        gap: 48,
      },
      'mobile',
    )
    assert.equal(out?.paddingTop, 60)
    assert.equal(out?.paddingBottom, 60)
    assert.equal(out?.paddingLeft, 24)
    assert.equal(out?.paddingRight, 24)
    assert.equal(out?.gap, 20)
  })

  it('mobile leaves below-threshold values intact', () => {
    const out = resolveResponsiveSpacing(
      { paddingTop: 40, paddingLeft: 16, gap: 16 },
      'mobile',
    )
    assert.equal(out?.paddingTop, 40)
    assert.equal(out?.paddingLeft, 16)
    assert.equal(out?.gap, 16)
  })

  it('tablet only adjusts horizontal padding', () => {
    const out = resolveResponsiveSpacing(
      {
        paddingTop: 96,
        paddingLeft: 32,
        paddingRight: 64,
        gap: 48,
      },
      'tablet',
    )
    assert.equal(out?.paddingTop, 96)
    assert.equal(out?.paddingLeft, 28)
    assert.equal(out?.paddingRight, 28)
    assert.equal(out?.gap, 48)
  })
})

describe('resolveResponsiveLayout', () => {
  it('returns undefined when layout is undefined', () => {
    assert.equal(resolveResponsiveLayout(undefined, 'mobile'), undefined)
  })

  it('passes through unchanged on desktop', () => {
    const layout = { direction: 'row' as const, align: 'center' as const }
    assert.deepEqual(resolveResponsiveLayout(layout, 'desktop'), layout)
  })

  it('passes through unchanged on tablet', () => {
    const layout = { direction: 'row' as const }
    assert.deepEqual(resolveResponsiveLayout(layout, 'tablet'), layout)
  })

  it('mobile flips explicit row to column', () => {
    const out = resolveResponsiveLayout({ direction: 'row' }, 'mobile')
    assert.equal(out?.direction, 'column')
  })

  it('mobile sets column when layout has overrides without direction', () => {
    const out = resolveResponsiveLayout({ align: 'center' }, 'mobile')
    assert.equal(out?.direction, 'column')
    assert.equal(out?.align, 'center')
  })

  it('mobile leaves explicit column intact', () => {
    const out = resolveResponsiveLayout({ direction: 'column' }, 'mobile')
    assert.equal(out?.direction, 'column')
  })
})
