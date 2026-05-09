// generation chip 디자인 풍부도 계산 회귀 테스트.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Tree } from '@dworks/tree'

import { computeRichnessReport, formatRichnessScore } from './richness.js'

const bare: Tree = {
  version: '1',
  root: {
    id: 'page',
    type: 'section',
    editKind: 'structure',
    children: [
      {
        id: 'title',
        type: 'text',
        editKind: 'text',
        content: 'wireframe',
      },
    ],
  },
}

const structuredRich: Tree = {
  version: '1',
  root: {
    id: 'page',
    type: 'section',
    editKind: 'structure',
    color: { backgroundColor: '#0b1220' },
    children: [
      {
        id: 'header',
        type: 'section',
        editKind: 'structure',
        role: 'banner',
        children: [
          {
            id: 'cta',
            type: 'button',
            editKind: 'text',
            label: '시작하기',
            contentRole: 'cta',
          },
        ],
      },
      {
        id: 'main',
        type: 'section',
        editKind: 'structure',
        role: 'main',
        children: [
          {
            id: 'hero',
            type: 'hero',
            editKind: 'structure',
            children: [
              {
                id: 'hero.title',
                type: 'text',
                editKind: 'text',
                content: '좋은 구조',
                emphasis: 'heading-1',
                typography: { fontSize: 72 },
                color: { textColor: '#ffffff' },
              },
              {
                id: 'hero.lead',
                type: 'text',
                editKind: 'text',
                content: '리드',
                typography: { fontSize: 20 },
                color: { textColor: '#cbd5e1' },
              },
              {
                id: 'hero.caption',
                type: 'text',
                editKind: 'text',
                content: '캡션',
                typography: { fontSize: 14 },
              },
              {
                id: 'hero.image',
                type: 'image',
                editKind: 'media',
                src: 'https://example.com/cover.jpg',
                alt: 'cover',
                shape: { radius: 16 },
              },
            ],
          },
          {
            id: 'section',
            type: 'section',
            editKind: 'structure',
            children: [],
          },
        ],
      },
      {
        id: 'footer',
        type: 'section',
        editKind: 'structure',
        role: 'contentinfo',
        children: [],
      },
    ],
  },
}

describe('computeRichnessReport', () => {
  it('bare tree has no quality signals', () => {
    const report = computeRichnessReport(bare)
    assert.equal(report.hasPageLandmarks, false)
    assert.equal(report.hasMainMultiSection, false)
    assert.equal(report.hasDisplayHeadingOne, false)
    assert.equal(report.hasCallToAction, false)
    assert.equal(report.score, 0)
  })

  it('structured rich tree satisfies all 8 quality signals', () => {
    const report = computeRichnessReport(structuredRich)
    assert.equal(report.hasPageLandmarks, true)
    assert.equal(report.hasMainMultiSection, true)
    assert.equal(report.hasDisplayHeadingOne, true)
    assert.equal(report.hasCallToAction, true)
    assert.equal(report.fontSizeVariety, true)
    assert.equal(report.colorVariety, true)
    assert.equal(report.hasImagery, true)
    assert.equal(report.hasShapeDepth, true)
    assert.equal(report.score, 1)
  })

  it('formatRichnessScore uses fixed two decimals for chip labels', () => {
    assert.equal(formatRichnessScore(0), '0.00')
    assert.equal(formatRichnessScore(0.625), '0.63')
    assert.equal(formatRichnessScore(1), '1.00')
  })
})
