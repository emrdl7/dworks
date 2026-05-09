// ai-slop richness 측정 unit.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Tree } from '@dworks/tree'

import { averageSlopRichness, computeSlopReport } from './ai-slop.js'

const skeleton: Tree = {
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

const rich: Tree = {
  version: '1',
  root: {
    id: 'page',
    type: 'section',
    editKind: 'structure',
    color: { backgroundColor: '#0b1220' },
    children: [
      {
        id: 'page.header',
        type: 'section',
        editKind: 'structure',
        role: 'banner',
        children: [
          {
            id: 'page.header.cta',
            type: 'button',
            editKind: 'text',
            label: '시작하기',
            contentRole: 'cta',
          },
        ],
      },
      {
        id: 'page.main',
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
                content: '디자인 풍부도',
                emphasis: 'heading-1',
                typography: { fontSize: 72 },
                color: { textColor: '#ffffff' },
              },
              {
                id: 'hero.lead',
                type: 'text',
                editKind: 'text',
                content: '리드',
                emphasis: 'body',
                typography: { fontSize: 20 },
                color: { textColor: '#cbd5e1' },
              },
              {
                id: 'hero.caption',
                type: 'text',
                editKind: 'text',
                content: '캡션',
                emphasis: 'caption',
                typography: { fontSize: 14 },
              },
              {
                id: 'hero.image',
                type: 'image',
                editKind: 'media',
                src: 'https://example.com/x.jpg',
                alt: 'cover',
                shape: { radius: 16, shadow: 'lg' },
              },
            ],
          },
          {
            id: 'features',
            type: 'section',
            editKind: 'structure',
            children: [
              {
                id: 'features.title',
                type: 'text',
                editKind: 'text',
                content: '기능',
                emphasis: 'heading-2',
                typography: { fontSize: 36 },
              },
            ],
          },
        ],
      },
      {
        id: 'page.footer',
        type: 'section',
        editKind: 'structure',
        role: 'contentinfo',
        children: [],
      },
    ],
  },
}

describe('computeSlopReport', () => {
  it('skeleton tree gets 0/8 richness — 모든 신호 false', () => {
    const report = computeSlopReport(skeleton)
    assert.equal(report.hasPageLandmarks, false)
    assert.equal(report.hasMainMultiSection, false)
    assert.equal(report.hasDisplayHeadingOne, false)
    assert.equal(report.hasCallToAction, false)
    assert.equal(report.fontSizeVariety, false)
    assert.equal(report.colorVariety, false)
    assert.equal(report.hasImagery, false)
    assert.equal(report.hasShapeDepth, false)
    assert.equal(report.richness, 0)
  })

  it('rich tree gets 8/8 richness — 모든 신호 true', () => {
    const report = computeSlopReport(rich)
    assert.equal(report.hasPageLandmarks, true)
    assert.equal(report.hasMainMultiSection, true)
    assert.equal(report.hasDisplayHeadingOne, true)
    assert.equal(report.hasCallToAction, true)
    assert.equal(report.fontSizeVariety, true)
    assert.equal(report.colorVariety, true)
    assert.equal(report.hasImagery, true)
    assert.equal(report.hasShapeDepth, true)
    assert.equal(report.richness, 1)
  })

  it('fontSize variety는 distinct ≥ 3 임계', () => {
    const onlyTwo: Tree = {
      version: '1',
      root: {
        id: 'p',
        type: 'section',
        editKind: 'structure',
        children: [
          {
            id: 't1',
            type: 'text',
            editKind: 'text',
            content: 'a',
            typography: { fontSize: 32 },
          },
          {
            id: 't2',
            type: 'text',
            editKind: 'text',
            content: 'b',
            typography: { fontSize: 18 },
          },
        ],
      },
    }
    assert.equal(computeSlopReport(onlyTwo).fontSizeVariety, false)
  })

  it('heading-1만 있고 display fontSize가 없으면 hasDisplayHeadingOne false', () => {
    const smallHeading: Tree = {
      version: '1',
      root: {
        id: 'p',
        type: 'section',
        editKind: 'structure',
        children: [
          {
            id: 't',
            type: 'text',
            editKind: 'text',
            content: '작은 헤딩',
            emphasis: 'heading-1',
            typography: { fontSize: 32 },
          },
        ],
      },
    }
    assert.equal(computeSlopReport(smallHeading).hasDisplayHeadingOne, false)
  })

  it('banner/main/contentinfo와 main 다중 섹션이 구조 신호를 만든다', () => {
    const report = computeSlopReport(rich)
    assert.equal(report.hasPageLandmarks, true)
    assert.equal(report.hasMainMultiSection, true)
  })

  it('shadow none + radius < 8은 hasShapeDepth false', () => {
    const flat: Tree = {
      version: '1',
      root: {
        id: 'p',
        type: 'section',
        editKind: 'structure',
        shape: { radius: 4, shadow: 'none' },
        children: [
          {
            id: 't',
            type: 'text',
            editKind: 'text',
            content: 'x',
          },
        ],
      },
    }
    assert.equal(computeSlopReport(flat).hasShapeDepth, false)
  })
})

describe('averageSlopRichness', () => {
  it('빈 배열은 null', () => {
    assert.equal(averageSlopRichness([]), null)
  })

  it('skeleton + rich 평균 = 0.5', () => {
    assert.equal(averageSlopRichness([skeleton, rich]), 0.5)
  })

  it('단일 tree는 그 tree의 richness 그대로', () => {
    assert.equal(averageSlopRichness([rich]), 1)
    assert.equal(averageSlopRichness([skeleton]), 0)
  })
})
