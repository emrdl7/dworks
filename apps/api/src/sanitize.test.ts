import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { treeSchema } from '@dworks/tree'

import { sanitizeGeneratedTreeJson } from './sanitize.js'

describe('sanitizeGeneratedTreeJson', () => {
  it('normalizes common LLM color and typography drift before schema parse', () => {
    const sanitized = sanitizeGeneratedTreeJson({
      version: '1',
      root: {
        id: 'page',
        type: 'section',
        editKind: 'structure',
        role: 'header',
        layout: {
          justify: 'space-between',
        },
        color: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        },
        children: [
          {
            id: 'title',
            type: 'text',
            editKind: 'text',
            content: 'Dworks',
            typography: {
              fontWeight: 700,
              letterSpacing: '-0.02em',
            },
            color: {
              textColor: 'rgb(15, 23, 42)',
            },
          },
          {
            id: 'hero.image',
            type: 'image',
            editKind: 'media',
            src: 'https://example.com/image.jpg',
            alt: 'hero',
            presentation: {
              overlayColor: 'hsla(210, 40%, 96%, 0.5)',
            },
          },
        ],
      },
    })

    const parsed = treeSchema.parse(sanitized)

    assert.equal(parsed.root.type, 'section')
    if (parsed.root.type !== 'section') {
      return
    }
    assert.equal(parsed.root.role, 'banner')
    assert.equal(parsed.root.layout?.justify, 'between')
    assert.equal(parsed.root.color?.backgroundColor, '#ffffff')
    assert.equal(parsed.root.color?.backgroundOpacity, 0.95)

    const [title, image] = parsed.root.children
    assert.equal(title?.type, 'text')
    if (title?.type === 'text') {
      assert.equal(title.typography?.fontWeight, '700')
      assert.equal(title.typography?.letterSpacing, -0.02)
      assert.equal(title.color?.textColor, '#0f172a')
    }
    assert.equal(image?.type, 'image')
    if (image?.type === 'image') {
      assert.equal(image.presentation?.overlayColor, '#f1f5f9')
      assert.equal(image.presentation?.overlayOpacity, 0.5)
    }
  })

  it('clamps unsafe numeric drift instead of accepting broken CSS semantics', () => {
    const sanitized = sanitizeGeneratedTreeJson({
      version: '1',
      root: {
        id: 'page',
        type: 'section',
        editKind: 'structure',
        color: {
          backgroundOpacity: '120%',
        },
        children: [
          {
            id: 'title',
            type: 'text',
            editKind: 'text',
            content: 'Dworks',
            typography: {
              fontWeight: 950,
              letterSpacing: -1,
            },
          },
        ],
      },
    })

    const parsed = treeSchema.parse(sanitized)

    assert.equal(parsed.root.type, 'section')
    if (parsed.root.type !== 'section') {
      return
    }
    assert.equal(parsed.root.color?.backgroundOpacity, 1)
    const title = parsed.root.children[0]
    assert.equal(title?.type, 'text')
    if (title?.type === 'text') {
      assert.equal(title.typography?.fontWeight, '900')
      assert.equal(title.typography?.letterSpacing, -0.1)
    }
  })
})
