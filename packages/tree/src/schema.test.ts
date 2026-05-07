// @dworks/tree 스키마 단위 테스트.
// node:test + tsx로 실행 (pnpm --filter @dworks/tree test).

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
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
})
