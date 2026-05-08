// @dworks/tree 스키마 단위 테스트.
// node:test + tsx로 실행 (pnpm --filter @dworks/tree test).

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  COLOR_PRESET_IDS,
  COLOR_PRESETS,
  CONTENT_ROLES,
  BUILT_IN_FONT_FAMILY_IDS,
  FONT_FAMILY_IDS,
  FONT_WEIGHT_IDS,
  IMAGE_ASPECT_RATIOS,
  IMAGE_FIT_IDS,
  LAYOUT_ALIGN_IDS,
  LAYOUT_DIRECTION_IDS,
  LAYOUT_JUSTIFY_IDS,
  LAYOUT_INTENTS,
  LAYOUT_WRAP_IDS,
  TEXT_ALIGN_IDS,
  TREE_NODE_TYPES,
  treeNodeSchema,
  treeSchema,
} from './schema.js'

describe('tree schema', () => {
  it('exposes 8 node types after the M2 image node expansion', () => {
    assert.equal(TREE_NODE_TYPES.length, 8)
    assert.ok(TREE_NODE_TYPES.includes('image'))
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

  it('parses text-node typography overrides', () => {
    const parsed = treeNodeSchema.parse({
      id: 'hero.title',
      type: 'text',
      editKind: 'text',
      content: 'Dworks',
      emphasis: 'heading-1',
      typography: {
        fontSize: 56,
        fontWeight: '700',
        lineHeight: 1.08,
        letterSpacing: -0.02,
        textAlign: 'center',
        fontFamily: 'serif',
      },
    })

    assert.equal(parsed.type, 'text')
    if (parsed.type === 'text') {
      assert.equal(parsed.typography?.fontSize, 56)
      assert.equal(parsed.typography?.fontWeight, '700')
      assert.equal(parsed.typography?.lineHeight, 1.08)
      assert.equal(parsed.typography?.letterSpacing, -0.02)
      assert.equal(parsed.typography?.textAlign, 'center')
      assert.equal(parsed.typography?.fontFamily, 'serif')
    }
  })

  it('parses node spacing overrides', () => {
    const parsed = treeNodeSchema.parse({
      id: 'landing.card',
      type: 'card',
      editKind: 'structure',
      spacing: {
        paddingTop: 24,
        paddingRight: 32,
        paddingBottom: 24,
        paddingLeft: 32,
        marginTop: -12,
        marginRight: 0,
        marginBottom: 20,
        marginLeft: 0,
        gap: 16,
      },
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.equal(parsed.spacing?.paddingTop, 24)
      assert.equal(parsed.spacing?.marginTop, -12)
      assert.equal(parsed.spacing?.gap, 16)
    }
  })

  it('parses node shape overrides', () => {
    const parsed = treeNodeSchema.parse({
      id: 'landing.card',
      type: 'card',
      editKind: 'structure',
      shape: {
        radius: 18,
        borderWidth: 2,
        borderColor: '#aabbcc',
        borderStyle: 'dashed',
        shadow: 'lg',
      },
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.equal(parsed.shape?.radius, 18)
      assert.equal(parsed.shape?.borderWidth, 2)
      assert.equal(parsed.shape?.borderColor, '#aabbcc')
      assert.equal(parsed.shape?.borderStyle, 'dashed')
      assert.equal(parsed.shape?.shadow, 'lg')
    }
  })

  it('parses node color overrides', () => {
    const parsed = treeNodeSchema.parse({
      id: 'landing.card',
      type: 'card',
      editKind: 'structure',
      color: {
        backgroundColor: '#f8fafc',
        textColor: '#123',
      },
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.equal(parsed.color?.backgroundColor, '#f8fafc')
      assert.equal(parsed.color?.textColor, '#123')
    }
  })

  it('rejects invalid node color values', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        color: {
          backgroundColor: 'white',
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        color: {
          textColor: '#abcd',
        },
        children: [],
      }),
    )
  })

  it('parses node layout overrides', () => {
    const parsed = treeNodeSchema.parse({
      id: 'landing.card',
      type: 'card',
      editKind: 'structure',
      layout: {
        direction: 'row',
        align: 'center',
        justify: 'evenly',
        wrap: 'wrap',
      },
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.equal(parsed.layout?.direction, 'row')
      assert.equal(parsed.layout?.align, 'center')
      assert.equal(parsed.layout?.justify, 'evenly')
      assert.equal(parsed.layout?.wrap, 'wrap')
    }
  })

  it('rejects invalid node layout values', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        layout: {
          direction: 'row-reverse',
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        layout: {
          justify: 'around',
        },
        children: [],
      }),
    )
  })

  it('rejects invalid shape values', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        shape: {
          radius: 121,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        shape: {
          borderColor: 'red',
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        shape: {
          shadow: 'xxl',
        },
        children: [],
      }),
    )
  })

  it('rejects spacing values outside bounds', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        spacing: {
          paddingTop: -1,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        spacing: {
          marginTop: -201,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        spacing: {
          gap: 201,
        },
        children: [],
      }),
    )
  })

  it('accepts custom font-family ids for future TTF registration', () => {
    const parsed = treeNodeSchema.parse({
      id: 'hero.title',
      type: 'text',
      editKind: 'text',
      content: 'Dworks',
      typography: {
        fontFamily: 'brand-title-ttf',
      },
    })

    assert.equal(parsed.type, 'text')
    if (parsed.type === 'text') {
      assert.equal(parsed.typography?.fontFamily, 'brand-title-ttf')
    }
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

  it('parses an image node with decorative alt and media metadata', () => {
    const parsed = treeNodeSchema.parse({
      id: 'hero.visual',
      type: 'image',
      editKind: 'media',
      src: '',
      alt: '',
      aspectRatio: 'wide',
      focalPoint: { x: 0.45, y: 0.35 },
      presentation: {
        fit: 'contain',
        overlayColor: '#123456',
        overlayOpacity: 0.42,
      },
    })

    assert.equal(parsed.type, 'image')
    if (parsed.type === 'image') {
      assert.equal(parsed.alt, '')
      assert.equal(parsed.aspectRatio, 'wide')
      assert.deepEqual(parsed.focalPoint, { x: 0.45, y: 0.35 })
      assert.deepEqual(parsed.presentation, {
        fit: 'contain',
        overlayColor: '#123456',
        overlayOpacity: 0.42,
      })
    }
  })

  it('rejects invalid image presentation values', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-image-fit',
        type: 'image',
        editKind: 'media',
        src: '',
        alt: '',
        presentation: { fit: 'stretch' },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-image-overlay-color',
        type: 'image',
        editKind: 'media',
        src: '',
        alt: '',
        presentation: { overlayColor: 'black' },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-image-overlay-opacity',
        type: 'image',
        editKind: 'media',
        src: '',
        alt: '',
        presentation: { overlayOpacity: 1.2 },
      }),
    )
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

  it('parses root style tokens with a color preset', () => {
    const tree = {
      version: '1',
      styleTokens: {
        colorPreset: 'plum',
      },
      root: {
        id: 'r',
        type: 'section',
        editKind: 'structure',
        children: [],
      },
    }

    const parsed = treeSchema.parse(tree)
    assert.equal(parsed.styleTokens?.colorPreset, 'plum')
  })

  it('rejects invalid root color presets', () => {
    assert.throws(() =>
      treeSchema.parse({
        version: '1',
        styleTokens: {
          colorPreset: 'neon',
        },
        root: {
          id: 'r',
          type: 'section',
          editKind: 'structure',
          children: [],
        },
      }),
    )
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

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-typography-size',
        type: 'text',
        editKind: 'text',
        content: 'Bad size',
        typography: { fontSize: 4 },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-typography-weight',
        type: 'text',
        editKind: 'text',
        content: 'Bad weight',
        typography: { fontWeight: '900' },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-typography-font',
        type: 'text',
        editKind: 'text',
        content: 'Bad font',
        typography: { fontFamily: '' },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-aspect',
        type: 'image',
        editKind: 'media',
        src: '',
        alt: '',
        aspectRatio: 'panorama',
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-focal',
        type: 'image',
        editKind: 'media',
        src: '',
        alt: '',
        focalPoint: { x: 1.4, y: 0.5 },
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
    assert.deepEqual(IMAGE_ASPECT_RATIOS, [
      'square',
      'landscape',
      'portrait',
      'wide',
    ])
    assert.deepEqual(IMAGE_FIT_IDS, ['cover', 'contain'])
    assert.deepEqual(FONT_WEIGHT_IDS, ['400', '500', '600', '700'])
    assert.deepEqual(TEXT_ALIGN_IDS, ['left', 'center', 'right'])
    assert.deepEqual(BUILT_IN_FONT_FAMILY_IDS, ['sans', 'serif', 'mono'])
    assert.deepEqual(FONT_FAMILY_IDS, ['sans', 'serif', 'mono'])
    assert.deepEqual(LAYOUT_DIRECTION_IDS, ['row', 'column'])
    assert.deepEqual(LAYOUT_ALIGN_IDS, ['start', 'center', 'end', 'stretch'])
    assert.deepEqual(LAYOUT_JUSTIFY_IDS, [
      'start',
      'center',
      'end',
      'between',
      'evenly',
    ])
    assert.deepEqual(LAYOUT_WRAP_IDS, ['nowrap', 'wrap'])
    assert.deepEqual(COLOR_PRESET_IDS, [
      'mint',
      'navy',
      'sand',
      'plum',
      'graphite',
    ])
    assert.equal(COLOR_PRESETS.mint.accent, '#1b7f72')
    assert.equal(COLOR_PRESETS.graphite.accentText, '#0f1b1d')
  })
})
