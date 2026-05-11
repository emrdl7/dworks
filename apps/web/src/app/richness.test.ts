// generation chip 디자인 풍부도 계산 회귀 테스트.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Tree, TreeNode } from '@dworks/tree'

import {
  computeRichnessReport,
  formatRichnessScore,
  validateTreeRichness,
  RICHNESS_SIGNAL_KEYS,
} from './richness.js'

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

  it('structured rich tree satisfies original 8 quality signals', () => {
    // 13-신호 모델로 확장된 후에도 기존 8 신호는 동일하게 통과해야 한다.
    // (구 score === 1 단언은 13-신호 모델에서 신호 #9~#13 의 별도 fixture 가 필요하므로
    //  여기서는 8 신호 boolean 만 검증 — score 는 structuredFullRich 테스트에서 1 단언.)
    const report = computeRichnessReport(structuredRich)
    assert.equal(report.hasPageLandmarks, true)
    assert.equal(report.hasMainMultiSection, true)
    assert.equal(report.hasDisplayHeadingOne, true)
    assert.equal(report.hasCallToAction, true)
    assert.equal(report.fontSizeVariety, true)
    assert.equal(report.colorVariety, true)
    assert.equal(report.hasImagery, true)
    assert.equal(report.hasShapeDepth, true)
  })

  it('formatRichnessScore uses fixed two decimals for chip labels', () => {
    assert.equal(formatRichnessScore(0), '0.00')
    assert.equal(formatRichnessScore(0.625), '0.63')
    assert.equal(formatRichnessScore(1), '1.00')
  })
})

// 13 신호 fixture — 모든 신호 (signals #1~#13) 를 만족하도록 설계.
// schema validate 는 우회 (richness.ts 는 pure 트리 워크 — schema strictness 와 독립).
const structuredFullRich: Tree = {
  version: '1',
  root: {
    id: 'page',
    type: 'section',
    editKind: 'structure',
    color: { backgroundColor: '#0b1220' }, // override (color)
    spacing: { padding: { top: 24, right: 24, bottom: 24, left: 24 } } as never, // override (spacing)
    children: [
      {
        // 신호 #1 banner.
        id: 'header',
        type: 'section',
        editKind: 'structure',
        role: 'banner',
        color: { backgroundColor: '#ffffff' }, // override
        children: [
          {
            id: 'header.cta',
            type: 'button',
            editKind: 'text',
            label: '시작하기', // 신호 #4 CTA
            contentRole: 'cta',
            color: { backgroundColor: '#2563eb', textColor: '#ffffff' }, // override
            shape: { radius: 12 }, // override + 신호 #8 (radius >= 8)
            entranceAnimation: {
              type: 'fade-in',
              duration: 500,
              trigger: 'load',
            }, // anim #1
          } as TreeNode,
        ],
      },
      {
        // 신호 #1 main + #2 mainMultiSection (직계 section/hero ≥ 2).
        id: 'main',
        type: 'section',
        editKind: 'structure',
        role: 'main',
        children: [
          {
            // hero — bg #111111
            id: 'hero',
            type: 'hero',
            editKind: 'structure',
            color: { backgroundColor: '#111111' }, // 신호 #10 bg 1종
            children: [
              {
                id: 'hero.title',
                type: 'text',
                editKind: 'text',
                content: '좋은 구조', // 신호 #3 heading-1 fontSize 72
                emphasis: 'heading-1',
                typography: { fontSize: 72, fontWeight: '800' },
                color: { textColor: '#ffffff' },
                entranceAnimation: {
                  type: 'slide-up',
                  duration: 700,
                  trigger: 'load',
                }, // anim #2
              },
              {
                id: 'hero.lead',
                type: 'text',
                editKind: 'text',
                content: '리드 텍스트',
                typography: { fontSize: 20 },
                color: { textColor: '#cbd5e1' },
                entranceAnimation: {
                  type: 'slide-up',
                  duration: 600,
                  trigger: 'scroll',
                  delay: 150,
                } as never, // anim #3
              } as TreeNode,
              {
                id: 'hero.caption',
                type: 'text',
                editKind: 'text',
                content: '캡션',
                typography: { fontSize: 14 },
                color: { textColor: '#94a3b8' },
              },
              {
                id: 'hero.image',
                type: 'image',
                editKind: 'media',
                src: 'https://example.com/cover.jpg',
                alt: '커버 이미지', // 신호 #7 imagery
                shape: { radius: 16 }, // 신호 #8 + override
                entranceAnimation: {
                  type: 'fade-in',
                  duration: 500,
                  trigger: 'scroll',
                } as never, // anim #4
              } as TreeNode,
            ],
          },
          {
            // section A — bg #22223b (#10 — 두 번째 bg 종)
            id: 'section.a',
            type: 'section',
            editKind: 'structure',
            color: { backgroundColor: '#22223b' },
            children: [
              {
                id: 'section.a.title',
                type: 'text',
                editKind: 'text',
                content: '섹션 A',
                typography: { fontSize: 32 },
                color: { textColor: '#ffffff' },
                entranceAnimation: {
                  type: 'slide-up',
                  duration: 600,
                  trigger: 'scroll',
                } as never, // anim #5
              } as TreeNode,
              {
                id: 'section.a.body',
                type: 'text',
                editKind: 'text',
                content: '본문',
                typography: { fontSize: 16 },
                color: { textColor: '#e2e8f0' },
              },
            ],
          },
          {
            // 신호 #11 — card (container type 3종째: section, hero, card)
            id: 'card',
            type: 'card',
            editKind: 'structure',
            color: { backgroundColor: '#1e293b' },
            shape: { radius: 12 },
            children: [
              {
                id: 'card.title',
                type: 'text',
                editKind: 'text',
                content: '카드 제목',
                typography: { fontSize: 24 },
                color: { textColor: '#f8fafc' },
                entranceAnimation: {
                  type: 'fade-in',
                  duration: 500,
                  trigger: 'scroll',
                  delay: 300,
                } as never, // anim #6
              } as TreeNode,
            ],
          },
          {
            // 신호 #12 — accordion (interactive component)
            id: 'faq',
            type: 'accordion',
            editKind: 'structure',
            color: { backgroundColor: '#0f172a' },
            items: [
              { id: 'faq.q1', title: '질문 1', content: '답변 1' },
              { id: 'faq.q2', title: '질문 2', content: '답변 2' },
            ],
            entranceAnimation: {
              type: 'fade-in',
              duration: 500,
              trigger: 'scroll',
            } as never, // anim #7
          } as unknown as TreeNode,
        ],
      },
      {
        // 신호 #1 contentinfo.
        id: 'footer',
        type: 'section',
        editKind: 'structure',
        role: 'contentinfo',
        color: { backgroundColor: '#020617' },
        children: [
          {
            id: 'footer.copy',
            type: 'text',
            editKind: 'text',
            content: '© 2026',
            typography: { fontSize: 12 },
            color: { textColor: '#64748b' },
          },
        ],
      },
    ],
  },
}

describe('computeRichnessReport — 13 신호 (#9~#13)', () => {
  it('#9 designOverrideVariety — 12 노드 이상 override 시 true', () => {
    const report = computeRichnessReport(structuredFullRich)
    assert.equal(report.designOverrideVariety, true)
  })

  it('#10 sectionVisualVariety — main 직계 section bg 2종 이상 시 true', () => {
    const report = computeRichnessReport(structuredFullRich)
    assert.equal(report.sectionVisualVariety, true)
  })

  it('#11 nodeTypeVariety — container type 3종 이상 시 true', () => {
    const report = computeRichnessReport(structuredFullRich)
    assert.equal(report.nodeTypeVariety, true)
  })

  it('#12 interactiveComponent — accordion 노드 1개 이상 시 true', () => {
    const report = computeRichnessReport(structuredFullRich)
    assert.equal(report.interactiveComponent, true)
  })

  it('#13 entranceAnimationSpread — 6~12 노드 entranceAnimation 시 true', () => {
    const report = computeRichnessReport(structuredFullRich)
    assert.equal(report.entranceAnimationSpread, true)
  })

  it('structuredFullRich — 13 신호 모두 만족 score === 1', () => {
    const report = computeRichnessReport(structuredFullRich)
    for (const key of RICHNESS_SIGNAL_KEYS) {
      assert.equal(report[key], true, `${key} 가 true 여야 함`)
    }
    assert.equal(report.score, 1)
  })
})

describe('validateTreeRichness', () => {
  it('bare tree 는 missing 13개', () => {
    const result = validateTreeRichness(bare)
    assert.equal(result.score, 0)
    assert.equal(result.missing.length, 13)
  })

  it('structuredFullRich tree 는 missing 0개 (missing === [])', () => {
    const result = validateTreeRichness(structuredFullRich)
    assert.deepEqual(result.missing, [])
    assert.equal(result.score, 1)
  })
})
