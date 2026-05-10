// generation-normalize unit tests — Phase 5 첫 안전망.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Tree, TreeNode } from '@dworks/tree'

import { normalizeDesignTree } from './generation-normalize.js'

function makeTree(root: TreeNode): Tree {
  return { version: '1', root } as Tree
}

function makeSection(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'n-section',
    type: 'section',
    editKind: 'structure',
    responsive: undefined,
    children: [],
    ...overrides,
  } as TreeNode
}

function makeText(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'n-text',
    type: 'text',
    editKind: 'text',
    responsive: undefined,
    content: 'hi',
    ...overrides,
  } as TreeNode
}

describe('normalizeDesignTree', () => {
  it('root이 section이면 그대로 통과', () => {
    const tree = makeTree(makeSection())
    const out = normalizeDesignTree(tree)
    assert.equal(out.root.id, 'n-section')
    assert.equal(out.root.type, 'section')
  })

  it('root이 hero이면 section wrapper로 감싼다', () => {
    const hero = makeSection({ type: 'hero', id: 'n-hero' } as Partial<TreeNode>)
    const tree = makeTree(hero)
    const out = normalizeDesignTree(tree)
    assert.equal(out.root.type, 'section')
    assert.equal(out.root.id, 'auto-root-section')
    assert.equal((out.root as { children: TreeNode[] }).children.length, 1)
    assert.equal((out.root as { children: TreeNode[] }).children[0]?.id, 'n-hero')
  })

  it('id 충돌은 suffix로 자동 rename', () => {
    const tree = makeTree(
      makeSection({
        children: [
          makeText({ id: 'dup' }),
          makeText({ id: 'dup' }),
          makeText({ id: 'dup' }),
        ],
      }),
    )
    const out = normalizeDesignTree(tree)
    const children = (out.root as { children: TreeNode[] }).children
    assert.equal(children[0]?.id, 'dup')
    assert.equal(children[1]?.id, 'dup-2')
    assert.equal(children[2]?.id, 'dup-3')
  })

  it('depth가 깊은 충돌도 처리', () => {
    const tree = makeTree(
      makeSection({
        children: [
          makeSection({
            id: 'inner',
            children: [makeText({ id: 'x' })],
          }),
          makeSection({
            id: 'inner',
            children: [makeText({ id: 'x' })],
          }),
        ],
      }),
    )
    const out = normalizeDesignTree(tree)
    const top = out.root as { children: TreeNode[] }
    assert.equal(top.children[0]?.id, 'inner')
    assert.equal(top.children[1]?.id, 'inner-2')
    const innerA = top.children[0] as { children: TreeNode[] }
    const innerB = top.children[1] as { children: TreeNode[] }
    assert.equal(innerA.children[0]?.id, 'x')
    assert.equal(innerB.children[0]?.id, 'x-2')
  })

  it('정상 트리는 변경 없음 (id 충돌 없고 root section)', () => {
    const tree = makeTree(
      makeSection({
        children: [
          makeText({ id: 't1' }),
          makeText({ id: 't2' }),
        ],
      }),
    )
    const out = normalizeDesignTree(tree)
    const children = (out.root as { children: TreeNode[] }).children
    assert.equal(children[0]?.id, 't1')
    assert.equal(children[1]?.id, 't2')
  })
})
