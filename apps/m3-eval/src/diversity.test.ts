// diversity unit tests.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Tree } from '@dworks/tree'

import { computeBag, computeDiversity, jaccard, pairwiseSimilarity } from './diversity.js'

const baseHero: Tree = {
  version: '1',
  root: {
    id: 'a',
    editKind: 'structure',
    type: 'hero',
    responsive: undefined,
    children: [
      {
        id: 'b',
        editKind: 'text',
        type: 'text',
        responsive: undefined,
        content: 'x',
      },
      {
        id: 'c',
        editKind: 'text',
        type: 'text',
        responsive: undefined,
        content: 'y',
      },
    ],
  },
}

const sectionWithCard: Tree = {
  version: '1',
  root: {
    id: 'r',
    editKind: 'structure',
    type: 'section',
    responsive: undefined,
    children: [
      {
        id: 'card',
        editKind: 'structure',
        type: 'card',
        responsive: undefined,
        children: [],
      },
    ],
  },
}

const heroOneText: Tree = {
  version: '1',
  root: {
    id: 'h2',
    editKind: 'structure',
    type: 'hero',
    responsive: undefined,
    children: [
      {
        id: 't1',
        editKind: 'text',
        type: 'text',
        responsive: undefined,
        content: 'x',
      },
    ],
  },
}

function clone<T>(t: T): T {
  return JSON.parse(JSON.stringify(t)) as T
}

describe('m3-eval diversity', () => {
  it('computeBag returns root-prefixed type paths', () => {
    const bag = computeBag(baseHero)
    assert.deepEqual(bag.sort(), ['hero', 'hero/text', 'hero/text'].sort())
  })

  it('jaccard of identical bags is 1', () => {
    const a = computeBag(baseHero)
    const b = computeBag(clone(baseHero))
    assert.equal(jaccard(a, b), 1)
  })

  it('jaccard of disjoint bags is 0', () => {
    const a = computeBag(baseHero)
    const b = computeBag(sectionWithCard)
    assert.equal(jaccard(a, b), 0)
  })

  it('jaccard of empty bags is 1', () => {
    assert.equal(jaccard([], []), 1)
  })

  it('multiset jaccard differs from set jaccard for repeated paths', () => {
    // baseHero: bag = [hero, hero/text, hero/text] → counts hero=1, hero/text=2
    // heroOneText: bag = [hero, hero/text] → counts hero=1, hero/text=1
    // multiset: inter = min(1,1) + min(2,1) = 2, union = max(1,1) + max(2,1) = 3, = 2/3
    // set jaccard would be |{hero, hero/text}| / |{hero, hero/text}| = 1
    const a = computeBag(baseHero)
    const b = computeBag(heroOneText)
    assert.equal(jaccard(a, b), 2 / 3)
  })

  it('pairwiseSimilarity is null for fewer than 2 trees', () => {
    assert.equal(pairwiseSimilarity([]), null)
    assert.equal(pairwiseSimilarity([baseHero]), null)
  })

  it('pairwiseSimilarity averages all pairs', () => {
    // 3 identical trees → all pairs = 1, avg = 1
    const trees = [clone(baseHero), clone(baseHero), clone(baseHero)]
    assert.equal(pairwiseSimilarity(trees), 1)
  })

  it('computeDiversity = 1 - avgPairwiseSimilarity', () => {
    const sameTrees = [clone(baseHero), clone(baseHero)]
    assert.equal(computeDiversity(sameTrees), 0)
    const mixedTrees = [clone(baseHero), clone(sectionWithCard)]
    assert.equal(computeDiversity(mixedTrees), 1)
  })

  it('computeDiversity returns null for fewer than 2 trees', () => {
    assert.equal(computeDiversity([]), null)
    assert.equal(computeDiversity([baseHero]), null)
  })
})
