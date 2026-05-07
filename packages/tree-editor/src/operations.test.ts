import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { Tree } from '@dworks/tree'

import {
  applyEditSequence,
  replaceTextById,
  updateButtonLabel,
  updateImage,
  updateText,
} from './operations.js'

function fixtureTree(): Tree {
  return {
    version: '1',
    root: {
      id: 'landing',
      type: 'section',
      editKind: 'structure',
      children: [
        {
          id: 'landing.title',
          type: 'text',
          editKind: 'text',
          emphasis: 'heading-1',
          content: 'Dworks',
        },
        {
          id: 'landing.cta',
          type: 'button',
          editKind: 'text',
          label: '시작하기',
          variant: 'primary',
        },
        {
          id: 'landing.visual',
          type: 'image',
          editKind: 'media',
          src: '',
          alt: '',
          aspectRatio: 'wide',
        },
      ],
    },
  }
}

describe('tree editor operations', () => {
  it('updates a text node without mutating the original tree', () => {
    const tree = fixtureTree()
    const updated = updateText(tree, 'landing.title', 'Dworks Studio')

    assert.notEqual(updated, tree)
    assert.equal(tree.root.type, 'section')
    assert.equal(updated.root.type, 'section')
    if (tree.root.type === 'section' && updated.root.type === 'section') {
      const originalTitle = tree.root.children[0]
      const updatedTitle = updated.root.children[0]
      assert.equal(originalTitle?.type, 'text')
      assert.equal(updatedTitle?.type, 'text')
      if (originalTitle?.type === 'text' && updatedTitle?.type === 'text') {
        assert.equal(originalTitle.content, 'Dworks')
        assert.equal(updatedTitle.content, 'Dworks Studio')
      }
    }
  })

  it('updates a button label', () => {
    const tree = fixtureTree()
    const updated = updateButtonLabel(tree, 'landing.cta', '시안 만들기')

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const cta = updated.root.children[1]
      assert.equal(cta?.type, 'button')
      if (cta?.type === 'button') {
        assert.equal(cta.label, '시안 만들기')
      }
    }
  })

  it('updates an image source and alt text', () => {
    const tree = fixtureTree()
    const updated = updateImage(tree, 'landing.visual', {
      src: 'https://example.com/hero.jpg',
      alt: '작업 중인 디자인 캔버스',
    })

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const visual = updated.root.children[2]
      assert.equal(visual?.type, 'image')
      if (visual?.type === 'image') {
        assert.equal(visual.src, 'https://example.com/hero.jpg')
        assert.equal(visual.alt, '작업 중인 디자인 캔버스')
        assert.equal(visual.aspectRatio, 'wide')
      }
    }
  })

  it('replaces text by id through the compatibility helper', () => {
    const updated = replaceTextById(fixtureTree(), 'landing.title', '새 이름')

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const title = updated.root.children[0]
      assert.equal(title?.type, 'text')
      if (title?.type === 'text') {
        assert.equal(title.content, '새 이름')
      }
    }
  })

  it('applies edit operations in order', () => {
    const updated = applyEditSequence(fixtureTree(), [
      {
        type: 'updateText',
        nodeId: 'landing.title',
        content: '새 제목',
      },
      {
        type: 'updateButtonLabel',
        nodeId: 'landing.cta',
        label: '바로 시작',
      },
      {
        type: 'updateImage',
        nodeId: 'landing.visual',
        alt: '새 이미지 설명',
      },
    ])

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const title = updated.root.children[0]
      const cta = updated.root.children[1]
      const visual = updated.root.children[2]
      assert.equal(title?.type, 'text')
      assert.equal(cta?.type, 'button')
      assert.equal(visual?.type, 'image')
      if (
        title?.type === 'text' &&
        cta?.type === 'button' &&
        visual?.type === 'image'
      ) {
        assert.equal(title.content, '새 제목')
        assert.equal(cta.label, '바로 시작')
        assert.equal(visual.alt, '새 이미지 설명')
      }
    }
  })

  it('throws when the node id does not exist', () => {
    assert.throws(
      () => updateText(fixtureTree(), 'missing', 'x'),
      /node not found: missing/,
    )
  })

  it('throws when the operation targets the wrong node type', () => {
    assert.throws(
      () => updateText(fixtureTree(), 'landing.cta', 'x'),
      /updateText requires text node, got button/,
    )

    assert.throws(
      () => updateImage(fixtureTree(), 'landing.title', { alt: 'x' }),
      /updateImage requires image node, got text/,
    )
  })
})
