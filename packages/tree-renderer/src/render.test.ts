// tree-renderer 단위 테스트.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { Tree } from '@dworks/tree'
import { renderNode, renderTree } from './render.js'

describe('renderNode', () => {
  it('renders text with heading-1 emphasis as h1', () => {
    const html = renderNode({
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'Hello',
      emphasis: 'heading-1',
    })
    assert.match(html, /^<h1[^>]*>Hello<\/h1>$/)
    assert.match(html, /data-dw-node="t1"/)
    assert.match(html, /data-dw-edit="text"/)
  })

  it('renders default text as paragraph', () => {
    const html = renderNode({
      id: 't2',
      type: 'text',
      editKind: 'text',
      content: 'body text',
    })
    assert.match(html, /^<p[^>]*>body text<\/p>$/)
  })

  it('escapes HTML in content', () => {
    const html = renderNode({
      id: 't3',
      type: 'text',
      editKind: 'text',
      content: '<script>alert(1)</script>',
    })
    assert.ok(!html.includes('<script>'))
    assert.match(html, /&lt;script&gt;/)
  })

  it('renders button without href as button element', () => {
    const html = renderNode({
      id: 'b1',
      type: 'button',
      editKind: 'text',
      label: 'Save',
      variant: 'primary',
    })
    assert.match(html, /^<button[^>]*type="button">Save<\/button>$/)
    assert.match(html, /data-dw-variant="primary"/)
  })

  it('renders button with href as anchor', () => {
    const html = renderNode({
      id: 'b2',
      type: 'button',
      editKind: 'text',
      label: 'Docs',
      href: '/docs',
    })
    assert.match(html, /^<a[^>]*href="\/docs"[^>]*>Docs<\/a>$/)
  })

  it('renders section with role and nested children', () => {
    const html = renderNode({
      id: 's1',
      type: 'section',
      editKind: 'structure',
      role: 'feature',
      children: [
        {
          id: 't1',
          type: 'text',
          editKind: 'text',
          content: 'Title',
          emphasis: 'heading-2',
        },
      ],
    })
    assert.match(html, /<section[^>]*data-dw-role="feature"[^>]*>/)
    assert.match(html, /<h2[^>]*>Title<\/h2>/)
    assert.match(html, /<\/section>$/)
  })

  it('renders hero as header with role hero', () => {
    const html = renderNode({
      id: 'h1',
      type: 'hero',
      editKind: 'structure',
      children: [],
    })
    assert.match(html, /^<header[^>]*data-dw-role="hero"[^>]*><\/header>$/)
  })

  it('renders card as article', () => {
    const html = renderNode({
      id: 'c1',
      type: 'card',
      editKind: 'structure',
      children: [],
    })
    assert.match(html, /^<article[^>]*><\/article>$/)
  })

  it('renders unordered list with li-wrapped children', () => {
    const html = renderNode({
      id: 'l1',
      type: 'list',
      editKind: 'structure',
      variant: 'unordered',
      children: [
        { id: 't1', type: 'text', editKind: 'text', content: 'one' },
        { id: 't2', type: 'text', editKind: 'text', content: 'two' },
      ],
    })
    assert.match(html, /<ul[^>]*>(<li><p[^>]*>one<\/p><\/li>)(<li><p[^>]*>two<\/p><\/li>)<\/ul>/)
  })

  it('renders ordered list as ol', () => {
    const html = renderNode({
      id: 'l2',
      type: 'list',
      editKind: 'structure',
      variant: 'ordered',
      children: [],
    })
    assert.match(html, /^<ol[^>]*><\/ol>$/)
  })

  it('renders form with action and method', () => {
    const html = renderNode({
      id: 'f1',
      type: 'form',
      editKind: 'structure',
      action: '/submit',
      method: 'post',
      children: [],
    })
    assert.match(html, /<form[^>]*action="\/submit"[^>]*method="post"[^>]*>/)
  })

  it('renders style token classes', () => {
    const html = renderNode({
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'styled',
      styleTokens: ['color.primary', 'spacing.md'],
    })
    assert.match(html, /class="t-color-primary t-spacing-md"/)
  })
})

describe('renderTree', () => {
  it('renders a tree root', () => {
    const tree: Tree = {
      version: '1',
      root: {
        id: 'root',
        type: 'section',
        editKind: 'structure',
        children: [
          {
            id: 'h',
            type: 'text',
            editKind: 'text',
            content: 'Dworks',
            emphasis: 'heading-1',
          },
        ],
      },
    }
    const html = renderTree(tree)
    assert.match(html, /^<section[^>]*>/)
    assert.match(html, /<h1[^>]*>Dworks<\/h1>/)
    assert.match(html, /<\/section>$/)
  })
})
