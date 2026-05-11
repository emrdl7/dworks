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

// enforceRichness 테스트 helper — main role container + hero + footer section.
function makeMain(children: TreeNode[] = []): TreeNode {
  return {
    id: 'n-main',
    type: 'section',
    role: 'main',
    editKind: 'structure',
    children,
  } as unknown as TreeNode
}

function makeHero(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'n-hero',
    type: 'hero',
    editKind: 'structure',
    children: [],
    ...overrides,
  } as unknown as TreeNode
}

function makeFooterSection(): TreeNode {
  return {
    id: 'n-footer-section',
    type: 'section',
    editKind: 'structure',
    children: [],
  } as unknown as TreeNode
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

describe('enforceRichness — interactive', () => {
  it('enforceRichness — interactiveComponent 부재 + SaaS prompt → tabs 자동 추가 (D-05)', () => {
    const main = makeMain([makeHero(), makeFooterSection()])
    const root = makeSection({ children: [main] })
    const tree = makeTree(root)
    const out = normalizeDesignTree(tree, { prompt: 'SaaS dashboard 페이지' })
    // root.children[0] 이 main, main.children 안에 tabs 노드 존재
    const outMain = (out.root as unknown as { children: TreeNode[] }).children[0]
    assert.ok(outMain !== undefined)
    const mainChildren = (outMain as unknown as { children: TreeNode[] }).children
    const tabsNode = mainChildren.find((c) => c.type === 'tabs')
    assert.ok(tabsNode !== undefined, 'tabs 노드 자동 추가 안 됨')
    // 마지막 section/hero 직전 위치 — [hero, tabs, section]
    const childTypes = mainChildren.map((c) => c.type)
    assert.deepEqual(childTypes, ['hero', 'tabs', 'section'])
  })

  it('enforceRichness — interactiveComponent 부재 + e-commerce prompt → carousel 자동 추가', () => {
    const main = makeMain([makeHero(), makeFooterSection()])
    const tree = makeTree(makeSection({ children: [main] }))
    const out = normalizeDesignTree(tree, { prompt: 'e-commerce 제품 카탈로그' })
    const outMain = (out.root as unknown as { children: TreeNode[] }).children[0]
    const carouselNode = (outMain as unknown as { children: TreeNode[] }).children.find(
      (c) => c.type === 'carousel',
    )
    assert.ok(carouselNode !== undefined)
  })

  it('enforceRichness — 이미 interactive 1개 이상이면 추가 안 함 (D-07)', () => {
    const main = makeMain([
      makeHero(),
      {
        id: 'existing-accordion',
        type: 'accordion',
        editKind: 'structure',
        items: [],
      } as unknown as TreeNode,
      makeFooterSection(),
    ])
    const tree = makeTree(makeSection({ children: [main] }))
    const out = normalizeDesignTree(tree, { prompt: 'SaaS' })
    const outMain = (out.root as unknown as { children: TreeNode[] }).children[0]
    const interactiveCount = (outMain as unknown as { children: TreeNode[] }).children.filter(
      (c) =>
        c.type === 'carousel' ||
        c.type === 'tabs' ||
        c.type === 'accordion' ||
        c.type === 'modal',
    ).length
    assert.equal(interactiveCount, 1) // 기존 accordion 만, tabs 추가 안 됨
  })
})
