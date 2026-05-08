import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { Tree } from '@dworks/tree'

import {
  applyEditSequence,
  deleteNode,
  duplicateNode,
  moveNode,
  replaceTextById,
  updateButtonLabel,
  updateImage,
  updateStyleTokens,
  updateText,
  updateTextTypography,
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
        {
          id: 'landing.card',
          type: 'card',
          editKind: 'structure',
          children: [
            {
              id: 'landing.card.title',
              type: 'text',
              editKind: 'text',
              emphasis: 'heading-3',
              content: '카드 제목',
            },
          ],
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
        type: 'updateTextTypography',
        nodeId: 'landing.title',
        patch: { fontSize: 56, fontWeight: '700', textAlign: 'center' },
      },
      {
        type: 'updateImage',
        nodeId: 'landing.visual',
        alt: '새 이미지 설명',
      },
      {
        type: 'moveNode',
        nodeId: 'landing.visual',
        direction: 'up',
      },
      {
        type: 'updateStyleTokens',
        patch: { colorPreset: 'navy' },
      },
    ])

    assert.equal(updated.styleTokens?.colorPreset, 'navy')
    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const title = updated.root.children[0]
      const visual = updated.root.children[1]
      const cta = updated.root.children[2]
      assert.equal(title?.type, 'text')
      assert.equal(cta?.type, 'button')
      assert.equal(visual?.type, 'image')
      if (
        title?.type === 'text' &&
        cta?.type === 'button' &&
        visual?.type === 'image'
      ) {
        assert.equal(title.content, '새 제목')
        assert.equal(title.typography?.fontSize, 56)
        assert.equal(title.typography?.fontWeight, '700')
        assert.equal(title.typography?.textAlign, 'center')
        assert.equal(cta.label, '바로 시작')
        assert.equal(visual.alt, '새 이미지 설명')
      }
    }
  })

  it('moves a node within the same parent without mutating siblings', () => {
    const tree = fixtureTree()
    const movedUp = moveNode(tree, 'landing.visual', 'up')

    assert.equal(movedUp.root.type, 'section')
    if (movedUp.root.type === 'section') {
      assert.deepEqual(
        movedUp.root.children.map((child) => child.id),
        ['landing.title', 'landing.visual', 'landing.cta', 'landing.card'],
      )
    }

    const movedDown = moveNode(movedUp, 'landing.visual', 'down')
    assert.equal(movedDown.root.type, 'section')
    if (movedDown.root.type === 'section') {
      assert.deepEqual(
        movedDown.root.children.map((child) => child.id),
        ['landing.title', 'landing.cta', 'landing.visual', 'landing.card'],
      )
    }
  })

  it('duplicates a node subtree with deterministic ids', () => {
    const duplicated = duplicateNode(fixtureTree(), 'landing.card')

    assert.equal(duplicated.root.type, 'section')
    if (duplicated.root.type === 'section') {
      const card = duplicated.root.children[4]
      assert.equal(card?.type, 'card')
      if (card?.type === 'card') {
        assert.equal(card.id, 'landing.card.copy')
        assert.equal(card.children[0]?.id, 'landing.card.copy.title')
      }
    }
  })

  it('increments duplicated root ids when a copy already exists', () => {
    const once = duplicateNode(fixtureTree(), 'landing.card')
    const twice = duplicateNode(once, 'landing.card')

    assert.equal(twice.root.type, 'section')
    if (twice.root.type === 'section') {
      assert.deepEqual(
        twice.root.children.map((child) => child.id),
        [
          'landing.title',
          'landing.cta',
          'landing.visual',
          'landing.card',
          'landing.card.copy-2',
          'landing.card.copy',
        ],
      )
    }
  })

  it('deletes a node from its parent', () => {
    const updated = deleteNode(fixtureTree(), 'landing.cta')

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      assert.deepEqual(
        updated.root.children.map((child) => child.id),
        ['landing.title', 'landing.visual', 'landing.card'],
      )
    }
  })

  it('updates root style tokens without mutating the original tree', () => {
    const tree = fixtureTree()
    const updated = updateStyleTokens(tree, { colorPreset: 'plum' })

    assert.notEqual(updated, tree)
    assert.equal(tree.styleTokens, undefined)
    assert.equal(updated.styleTokens?.colorPreset, 'plum')
    assert.equal(updated.root, tree.root)
  })

  it('merges root style token patches', () => {
    const tree: Tree = {
      ...fixtureTree(),
      styleTokens: { colorPreset: 'mint' },
    }

    const updated = updateStyleTokens(tree, { colorPreset: 'graphite' })

    assert.equal(updated.styleTokens?.colorPreset, 'graphite')
  })

  it('updates text typography overrides without changing content', () => {
    const tree = fixtureTree()
    const updated = updateTextTypography(tree, 'landing.title', {
      fontSize: 48,
      fontWeight: '700',
      lineHeight: 1.1,
      letterSpacing: -0.02,
      textAlign: 'center',
      fontFamily: 'serif',
    })

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const title = updated.root.children[0]
      assert.equal(title?.type, 'text')
      if (title?.type === 'text') {
        assert.equal(title.content, 'Dworks')
        assert.deepEqual(title.typography, {
          fontSize: 48,
          fontWeight: '700',
          lineHeight: 1.1,
          letterSpacing: -0.02,
          textAlign: 'center',
          fontFamily: 'serif',
        })
      }
    }
  })

  it('removes text typography fields when patch values are undefined', () => {
    const styled = updateTextTypography(fixtureTree(), 'landing.title', {
      fontSize: 48,
      fontWeight: '700',
    })
    const reset = updateTextTypography(styled, 'landing.title', {
      fontSize: undefined,
      fontWeight: undefined,
    })

    assert.equal(reset.root.type, 'section')
    if (reset.root.type === 'section') {
      const title = reset.root.children[0]
      assert.equal(title?.type, 'text')
      if (title?.type === 'text') {
        assert.equal(title.typography, undefined)
      }
    }
  })

  it('throws when structure operations target the root', () => {
    assert.throws(
      () => moveNode(fixtureTree(), 'landing', 'down'),
      /moveNode cannot target root node: landing/,
    )
    assert.throws(
      () => duplicateNode(fixtureTree(), 'landing'),
      /duplicateNode cannot target root node: landing/,
    )
    assert.throws(
      () => deleteNode(fixtureTree(), 'landing'),
      /deleteNode cannot target root node: landing/,
    )
  })

  it('throws when a node cannot move beyond sibling bounds', () => {
    assert.throws(
      () => moveNode(fixtureTree(), 'landing.title', 'up'),
      /cannot move up: landing.title/,
    )
    assert.throws(
      () => moveNode(fixtureTree(), 'landing.card', 'down'),
      /cannot move down: landing.card/,
    )
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

    assert.throws(
      () => updateTextTypography(fixtureTree(), 'landing.cta', { fontSize: 18 }),
      /updateTextTypography requires text node, got button/,
    )
  })
})
