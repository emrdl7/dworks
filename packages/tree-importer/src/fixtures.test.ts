// fixture × renderer × schema 통합 검증.
// M0.5 완료 기준 (PLAN §4):
//  - 트리 fixture 3~5개로 tree → HTML 렌더 정상
//  - 단위 테스트 통과

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { treeSchema } from '@dworks/tree'
import { renderTree } from '@dworks/tree-renderer'

import { FIXTURES } from './fixtures.js'

describe('fixtures × schema', () => {
  for (const [name, tree] of Object.entries(FIXTURES)) {
    it(`${name} parses through treeSchema`, () => {
      const parsed = treeSchema.parse(tree)
      assert.equal(parsed.version, '1')
    })
  }

  it('exports exactly 5 fixtures (M0.5 범위)', () => {
    assert.equal(Object.keys(FIXTURES).length, 5)
  })
})

describe('fixtures × renderer', () => {
  for (const [name, tree] of Object.entries(FIXTURES)) {
    it(`${name} renders to non-empty HTML containing root data-dw-node`, () => {
      const html = renderTree(tree)
      assert.ok(html.length > 0, 'HTML 출력이 비어있음')
      assert.ok(
        html.includes(`data-dw-node="${tree.root.id}"`),
        `root data-dw-node="${tree.root.id}" 가 HTML에 없음`,
      )
    })
  }

  it('simple-hero renders h1 + button', () => {
    const html = renderTree(FIXTURES['simple-hero'])
    assert.match(html, /<h1[^>]*>디자인을 자연어로\.<\/h1>/)
    assert.match(html, /<button[^>]*>시안 만들기<\/button>/)
  })

  it('card-grid renders 3 article cards', () => {
    const html = renderTree(FIXTURES['card-grid'])
    const articleCount = (html.match(/<article/g) ?? []).length
    assert.equal(articleCount, 3)
  })

  it('notice-list renders ol with 3 li', () => {
    const html = renderTree(FIXTURES['notice-list'])
    assert.match(html, /<ol[^>]*>/)
    const liCount = (html.match(/<li>/g) ?? []).length
    assert.equal(liCount, 3)
  })

  it('signup-form renders form with action and method', () => {
    const html = renderTree(FIXTURES['signup-form'])
    assert.match(html, /<form[^>]*action="\/api\/subscribe"[^>]*method="post"/)
  })

  it('landing-composite renders nested hero+section+button', () => {
    const html = renderTree(FIXTURES['landing-composite'])
    assert.match(html, /<header[^>]*data-dw-role="hero"/)
    assert.match(html, /<a[^>]*href="\/start"[^>]*>시작하기<\/a>/)
  })
})
