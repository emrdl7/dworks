// tree-stats unit tests.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { TreeNode } from '@dworks/tree'

import { computeTreeStats } from './tree-stats.js'

const sampleRoot: TreeNode = {
  id: 'r',
  editKind: 'structure',
  type: 'hero',
  responsive: undefined,
  children: [
    {
      id: 'r.t',
      editKind: 'text',
      type: 'text',
      responsive: undefined,
      content: 'hi',
    },
    {
      id: 'r.s',
      editKind: 'structure',
      type: 'section',
      responsive: undefined,
      children: [
        {
          id: 'r.s.t',
          editKind: 'text',
          type: 'text',
          responsive: undefined,
          content: 'nested',
        },
      ],
    },
  ],
}

describe('computeTreeStats', () => {
  it('counts all nodes including root', () => {
    const { nodeCount } = computeTreeStats(sampleRoot)
    assert.equal(nodeCount, 4)
  })

  it('reports max depth from root=0', () => {
    const { depth } = computeTreeStats(sampleRoot)
    assert.equal(depth, 2)
  })

  it('returns depth=0 and nodeCount=1 for leaf root', () => {
    const leaf: TreeNode = {
      id: 'leaf',
      editKind: 'text',
      type: 'text',
      responsive: undefined,
      content: 'x',
    }
    const { nodeCount, depth } = computeTreeStats(leaf)
    assert.equal(nodeCount, 1)
    assert.equal(depth, 0)
  })
})
