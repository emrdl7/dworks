// document wrap 단위 테스트. capture는 chromium 의존이라 별도 통합 테스트.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { Tree } from '@dworks/tree'

import { wrapInDocument } from './document.js'

const minimalTree: Tree = {
  version: '1',
  root: {
    id: 'r',
    type: 'section',
    editKind: 'structure',
    children: [
      {
        id: 't',
        type: 'text',
        editKind: 'text',
        emphasis: 'heading-1',
        content: 'Test',
      },
    ],
  },
}

describe('wrapInDocument', () => {
  it('emits valid HTML5 doctype + html/head/body', () => {
    const html = wrapInDocument(minimalTree)
    assert.match(html, /^<!doctype html>/)
    assert.match(html, /<html lang="ko">/)
    assert.match(html, /<head>/)
    assert.match(html, /<body>/)
    assert.match(html, /<\/html>$/)
  })

  it('includes Tailwind CDN by default', () => {
    const html = wrapInDocument(minimalTree)
    assert.match(html, /cdn\.tailwindcss\.com/)
  })

  it('omits Tailwind CDN when option is false', () => {
    const html = wrapInDocument(minimalTree, { tailwindCdn: false })
    assert.ok(!html.includes('cdn.tailwindcss.com'))
  })

  it('escapes HTML in title attr', () => {
    const html = wrapInDocument(minimalTree, { title: '<script>alert(1)</script>' })
    assert.ok(!html.includes('<script>alert(1)</script>'))
    assert.match(html, /&lt;script&gt;/)
  })

  it('renders the tree body inside <body>', () => {
    const html = wrapInDocument(minimalTree)
    assert.match(html, /<h1[^>]*>Test<\/h1>/)
  })
})
