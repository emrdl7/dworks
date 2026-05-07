import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { Tree } from '@dworks/tree'

import {
  applyEditSequence,
  updateButtonLabel,
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
    ])

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const title = updated.root.children[0]
      const cta = updated.root.children[1]
      assert.equal(title?.type, 'text')
      assert.equal(cta?.type, 'button')
      if (title?.type === 'text' && cta?.type === 'button') {
        assert.equal(title.content, '새 제목')
        assert.equal(cta.label, '바로 시작')
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
  })
})
