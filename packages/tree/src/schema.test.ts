// @dworks/tree 스키마 단위 테스트.
// node:test + tsx로 실행 (pnpm --filter @dworks/tree test).

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CONTENT_ROLES,
  LAYOUT_INTENTS,
  TREE_NODE_TYPES,
  treeNodeSchema,
  treeSchema,
} from './schema.js'

describe('tree schema', () => {
  it('exposes 7 node types per M0.5 plan', () => {
    assert.equal(TREE_NODE_TYPES.length, 7)
  })

  it('parses a minimal text node', () => {
    const node = {
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'hello',
    }
    const parsed = treeNodeSchema.parse(node)
    assert.equal(parsed.type, 'text')
    assert.equal(parsed.id, 't1')
  })

  it('parses a section with nested children', () => {
    const node = {
      id: 's1',
      type: 'section',
      editKind: 'structure',
      role: 'hero',
      children: [
        {
          id: 'h1',
          type: 'text',
          editKind: 'text',
          emphasis: 'heading-1',
          content: 'Dworks',
        },
        {
          id: 'b1',
          type: 'button',
          editKind: 'text',
          label: 'Start',
          variant: 'primary',
        },
      ],
    }
    const parsed = treeNodeSchema.parse(node)
    assert.equal(parsed.type, 'section')
    if (parsed.type === 'section') {
      assert.equal(parsed.children.length, 2)
    }
  })

  it('rejects unknown node type', () => {
    const bad = { id: 'x', type: 'unknown', editKind: 'text' }
    assert.throws(() => treeNodeSchema.parse(bad))
  })

  it('rejects missing required fields', () => {
    const bad = { id: 'x', type: 'text', editKind: 'text' }
    assert.throws(() => treeNodeSchema.parse(bad))
  })

  it('parses tree root with version 1', () => {
    const tree = {
      version: '1',
      root: {
        id: 'r',
        type: 'section',
        editKind: 'structure',
        children: [],
      },
    }
    const parsed = treeSchema.parse(tree)
    assert.equal(parsed.version, '1')
    assert.equal(parsed.root.type, 'section')
  })

  it('keeps M0.5 fixtures backward compatible without semantic fields', () => {
    const tree = {
      version: '1',
      root: {
        id: 'legacy',
        type: 'section',
        editKind: 'structure',
        children: [
          {
            id: 'legacy.title',
            type: 'text',
            editKind: 'text',
            content: 'Legacy title',
          },
          {
            id: 'legacy.cta',
            type: 'button',
            editKind: 'text',
            label: 'Start',
          },
        ],
      },
    }

    assert.doesNotThrow(() => treeSchema.parse(tree))
  })

  it('parses optional layoutIntent and contentRole semantic fields', () => {
    const tree = {
      version: '1',
      root: {
        id: 'landing',
        type: 'section',
        editKind: 'structure',
        layoutIntent: 'split',
        children: [
          {
            id: 'landing.title',
            type: 'text',
            editKind: 'text',
            content: 'Designed page',
            emphasis: 'heading-1',
            contentRole: 'heading',
          },
          {
            id: 'landing.cta',
            type: 'button',
            editKind: 'text',
            label: 'Start',
            contentRole: 'cta',
          },
        ],
      },
    }

    const parsed = treeSchema.parse(tree)
    assert.equal(parsed.root.type, 'section')
    if (parsed.root.type === 'section') {
      assert.equal(parsed.root.layoutIntent, 'split')
      const title = parsed.root.children[0]
      assert.equal(title?.type, 'text')
      if (title?.type === 'text') {
        assert.equal(title.contentRole, 'heading')
      }
    }
  })

  it('rejects invalid semantic enum values', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-layout',
        type: 'section',
        editKind: 'structure',
        layoutIntent: 'masonry',
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-role',
        type: 'text',
        editKind: 'text',
        content: 'Bad role',
        contentRole: 'timestamp',
      }),
    )
  })

  it('exports stable semantic enum value lists', () => {
    assert.deepEqual(LAYOUT_INTENTS, [
      'stack',
      'grid',
      'inline',
      'split',
      'dashboard-grid',
    ])
    assert.deepEqual(CONTENT_ROLES, [
      'heading',
      'body',
      'caption',
      'cta',
      'label',
      'value',
    ])
  })
})
