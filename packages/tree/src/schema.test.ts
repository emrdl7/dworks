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
  GRADIENT_DIRECTION_IDS,
  GRADIENT_TYPE_IDS,
  IMAGE_ASPECT_RATIOS,
  IMAGE_FIT_IDS,
  LAYOUT_ALIGN_IDS,
  LAYOUT_DIRECTION_IDS,
  LAYOUT_JUSTIFY_IDS,
  LAYOUT_INTENTS,
  LAYOUT_WRAP_IDS,
  NODE_TRANSITION_TIMING_IDS,
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

  it('parses common node opacity metadata', () => {
    const parsed = treeNodeSchema.parse({
      id: 'landing.card',
      type: 'card',
      editKind: 'structure',
      opacity: 0.72,
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.equal(parsed.opacity, 0.72)
    }
  })

  it('rejects invalid common node opacity metadata', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        opacity: 1.2,
        children: [],
      }),
    )
  })

  it('parses common node visibility metadata', () => {
    const parsed = treeNodeSchema.parse({
      id: 'landing.card',
      type: 'card',
      editKind: 'structure',
      hidden: true,
      pointerEvents: 'none',
      cursor: 'help',
      transition: {
        duration: 240,
        timing: 'ease-out',
      },
      transform: {
        translateX: 24,
        translateY: -12,
        rotate: 8,
        scale: 1.1,
        skewX: -12,
        skewY: 6,
        originX: 0,
        originY: 100,
      },
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.equal(parsed.hidden, true)
      assert.equal(parsed.pointerEvents, 'none')
      assert.equal(parsed.cursor, 'help')
      assert.equal(parsed.transition?.duration, 240)
      assert.equal(parsed.transition?.timing, 'ease-out')
      assert.deepEqual(parsed.transform, {
        translateX: 24,
        translateY: -12,
        rotate: 8,
        scale: 1.1,
        skewX: -12,
        skewY: 6,
        originX: 0,
        originY: 100,
      })
    }
  })

  it('rejects invalid common node pointer event metadata', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        pointerEvents: 'visible',
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transform: {
          skewX: -46,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transform: {
          skewY: 46,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transition: {
          duration: 2001,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transition: {
          duration: -1,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        cursor: 'move',
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transform: {
          originX: -1,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transform: {
          originY: 101,
        },
        children: [],
      }),
    )
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
        textShadow: {
          offsetX: 1,
          offsetY: 2,
          blur: 6,
          color: '#112233',
          opacity: 0.25,
        },
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
      assert.equal(parsed.typography?.textShadow?.offsetX, 1)
      assert.equal(parsed.typography?.textShadow?.offsetY, 2)
      assert.equal(parsed.typography?.textShadow?.blur, 6)
      assert.equal(parsed.typography?.textShadow?.color, '#112233')
      assert.equal(parsed.typography?.textShadow?.opacity, 0.25)
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
        radiusTopLeft: 24,
        radiusTopRight: 12,
        radiusBottomRight: 4,
        radiusBottomLeft: 16,
        borderWidth: 2,
        borderColor: '#aabbcc',
        borderOpacity: 0.45,
        borderStyle: 'dashed',
        shadow: 'lg',
        customShadow: {
          offsetX: 2,
          offsetY: 8,
          blur: 24,
          spread: 1,
          color: '#112233',
          opacity: 0.32,
          inset: true,
        },
        customShadows: [
          {
            offsetX: 0,
            offsetY: 8,
            blur: 24,
            spread: 0,
            color: '#000000',
            opacity: 0.2,
          },
          {
            offsetX: 0,
            offsetY: 0,
            blur: 16,
            spread: 4,
            color: '#ffffff',
            opacity: 0.4,
            inset: true,
          },
        ],
      },
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.equal(parsed.shape?.radius, 18)
      assert.equal(parsed.shape?.radiusTopLeft, 24)
      assert.equal(parsed.shape?.radiusTopRight, 12)
      assert.equal(parsed.shape?.radiusBottomRight, 4)
      assert.equal(parsed.shape?.radiusBottomLeft, 16)
      assert.equal(parsed.shape?.borderWidth, 2)
      assert.equal(parsed.shape?.borderColor, '#aabbcc')
      assert.equal(parsed.shape?.borderOpacity, 0.45)
      assert.equal(parsed.shape?.borderStyle, 'dashed')
      assert.equal(parsed.shape?.shadow, 'lg')
      assert.equal(parsed.shape?.customShadow?.offsetX, 2)
      assert.equal(parsed.shape?.customShadow?.offsetY, 8)
      assert.equal(parsed.shape?.customShadow?.blur, 24)
      assert.equal(parsed.shape?.customShadow?.spread, 1)
      assert.equal(parsed.shape?.customShadow?.color, '#112233')
      assert.equal(parsed.shape?.customShadow?.opacity, 0.32)
      assert.equal(parsed.shape?.customShadow?.inset, true)
      assert.equal(parsed.shape?.customShadows?.length, 2)
      assert.equal(parsed.shape?.customShadows?.[0]?.offsetY, 8)
      assert.equal(parsed.shape?.customShadows?.[1]?.spread, 4)
      assert.equal(parsed.shape?.customShadows?.[1]?.inset, true)
    }
  })

  it('parses node color overrides', () => {
    const parsed = treeNodeSchema.parse({
      id: 'landing.card',
      type: 'card',
      editKind: 'structure',
      disabled: true,
      color: {
        backgroundColor: '#f8fafc',
        backgroundOpacity: 0.72,
        backgroundGradient: {
          type: 'radial',
          from: '#ff6b6b',
          to: '#4ecdc4',
          direction: 'to-bottom-right',
          fromOpacity: 0.84,
          toOpacity: 0.56,
        },
        textColor: '#123',
        textOpacity: 0.64,
        accentColor: '#1b7f72',
        accentOpacity: 0.8,
        hoverBackgroundColor: '#0f766e',
        hoverTextColor: '#ffffff',
        activeBackgroundColor: '#0b5f57',
        activeTextColor: '#f8fafc',
        focusBackgroundColor: '#114b5f',
        focusTextColor: '#f0fdfa',
        disabledBackgroundColor: '#64748b',
        disabledTextColor: '#f8fafc',
      },
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.equal(parsed.disabled, true)
      assert.equal(parsed.color?.backgroundColor, '#f8fafc')
      assert.equal(parsed.color?.backgroundOpacity, 0.72)
      assert.deepEqual(parsed.color?.backgroundGradient, {
        type: 'radial',
        from: '#ff6b6b',
        to: '#4ecdc4',
        direction: 'to-bottom-right',
        fromOpacity: 0.84,
        toOpacity: 0.56,
      })
      assert.equal(parsed.color?.textColor, '#123')
      assert.equal(parsed.color?.textOpacity, 0.64)
      assert.equal(parsed.color?.accentColor, '#1b7f72')
      assert.equal(parsed.color?.accentOpacity, 0.8)
      assert.equal(parsed.color?.hoverBackgroundColor, '#0f766e')
      assert.equal(parsed.color?.hoverTextColor, '#ffffff')
      assert.equal(parsed.color?.activeBackgroundColor, '#0b5f57')
      assert.equal(parsed.color?.activeTextColor, '#f8fafc')
      assert.equal(parsed.color?.focusBackgroundColor, '#114b5f')
      assert.equal(parsed.color?.focusTextColor, '#f0fdfa')
      assert.equal(parsed.color?.disabledBackgroundColor, '#64748b')
      assert.equal(parsed.color?.disabledTextColor, '#f8fafc')
    }
  })

  it('parses conic gradient geometry overrides', () => {
    const parsed = treeNodeSchema.parse({
      id: 'landing.card',
      type: 'card',
      editKind: 'structure',
      color: {
        backgroundGradient: {
          type: 'conic',
          from: '#ff6b6b',
          to: '#4ecdc4',
          direction: 'to-bottom-right',
          conicFromAngle: 135,
          conicCenterX: 20,
          conicCenterY: 80,
        },
      },
      children: [],
    })

    assert.equal(parsed.type, 'card')
    if (parsed.type === 'card') {
      assert.deepEqual(parsed.color?.backgroundGradient, {
        type: 'conic',
        from: '#ff6b6b',
        to: '#4ecdc4',
        direction: 'to-bottom-right',
        conicFromAngle: 135,
        conicCenterX: 20,
        conicCenterY: 80,
      })
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
        shape: {
          customShadow: {
            offsetX: 0,
            offsetY: 4,
            blur: 12,
            spread: 0,
            color: '#000000',
            inset: 'yes',
          },
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
          disabledBackgroundColor: 'gray',
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
          disabledTextColor: 'white',
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
          focusBackgroundColor: 'navy',
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
          focusTextColor: 'white',
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
          activeBackgroundColor: 'teal',
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
          activeTextColor: 'white',
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
          hoverTextColor: 'white',
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
          radiusTopLeft: -1,
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
          radiusBottomRight: 121,
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

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        color: {
          backgroundOpacity: 1.2,
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
          accentColor: 'teal',
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
          hoverBackgroundColor: 'teal',
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
          accentOpacity: -0.1,
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
          backgroundGradient: {
            from: '#ffffff',
            to: '#000000',
            direction: 'diagonal',
          },
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
          backgroundGradient: {
            from: 'white',
            to: '#000000',
            direction: 'to-bottom',
          },
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
          customShadow: {
            offsetX: 101,
            offsetY: 0,
            blur: 12,
            spread: 0,
            color: '#000000',
            opacity: 0.25,
          },
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
          customShadow: {
            offsetX: 0,
            offsetY: 0,
            blur: 201,
            spread: 0,
            color: '#000000',
            opacity: 0.25,
          },
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
          customShadow: {
            offsetX: 0,
            offsetY: 0,
            blur: 12,
            spread: 0,
            color: 'black',
            opacity: 0.25,
          },
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
          customShadow: {
            offsetX: 0,
            offsetY: 0,
            blur: 12,
            spread: 0,
            color: '#000000',
            opacity: 1.2,
          },
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transform: {
          translateX: 201,
        },
        children: [],
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transform: {
          scale: 0.49,
        },
        children: [],
      }),
    )
  })

  it('rejects invalid conic gradient geometry values', () => {
    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        color: {
          backgroundGradient: {
            type: 'conic',
            from: '#ffffff',
            to: '#000000',
            direction: 'to-bottom',
            conicFromAngle: 361,
          },
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
          backgroundGradient: {
            type: 'conic',
            from: '#ffffff',
            to: '#000000',
            direction: 'to-bottom',
            conicCenterX: -1,
          },
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
          backgroundGradient: {
            type: 'conic',
            from: '#ffffff',
            to: '#000000',
            direction: 'to-bottom',
            conicCenterY: 101,
          },
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
          borderOpacity: -0.1,
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

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        shape: {
          customShadows: Array.from({ length: 4 }, (_, index) => ({
            offsetX: index,
            offsetY: index,
            blur: 12,
            spread: 0,
            color: '#000000',
            opacity: 0.25,
          })),
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
        filter: {
          blur: 12,
          grayscale: 80,
          sepia: 35,
          brightness: 120,
          contrast: 140,
        },
        overlayGradient: {
          type: 'radial',
          from: '#123456',
          to: '#abcdef',
          direction: 'to-top-left',
        },
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
        filter: {
          blur: 12,
          grayscale: 80,
          sepia: 35,
          brightness: 120,
          contrast: 140,
        },
        overlayGradient: {
          type: 'radial',
          from: '#123456',
          to: '#abcdef',
          direction: 'to-top-left',
        },
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

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-image-overlay-gradient',
        type: 'image',
        editKind: 'media',
        src: '',
        alt: '',
        presentation: {
          overlayGradient: {
            from: '#000000',
            to: '#ffffff',
            direction: 'around',
          },
        },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-image-filter-blur',
        type: 'image',
        editKind: 'media',
        src: '',
        alt: '',
        presentation: { filter: { blur: 21 } },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-image-filter-brightness',
        type: 'image',
        editKind: 'media',
        src: '',
        alt: '',
        presentation: { filter: { brightness: 49 } },
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

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'landing.card',
        type: 'card',
        editKind: 'structure',
        transition: {
          timing: 'spring',
        },
        children: [],
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
        typography: { fontWeight: '950' },
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
        id: 'bad-text-shadow-offset',
        type: 'text',
        editKind: 'text',
        content: 'Bad shadow',
        typography: {
          textShadow: {
            offsetX: 51,
            offsetY: 0,
            blur: 4,
            color: '#000000',
            opacity: 0.25,
          },
        },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-text-shadow-blur',
        type: 'text',
        editKind: 'text',
        content: 'Bad shadow',
        typography: {
          textShadow: {
            offsetX: 0,
            offsetY: 0,
            blur: 101,
            color: '#000000',
            opacity: 0.25,
          },
        },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-text-shadow-color',
        type: 'text',
        editKind: 'text',
        content: 'Bad shadow',
        typography: {
          textShadow: {
            offsetX: 0,
            offsetY: 0,
            blur: 4,
            color: 'black',
            opacity: 0.25,
          },
        },
      }),
    )

    assert.throws(() =>
      treeNodeSchema.parse({
        id: 'bad-text-shadow-opacity',
        type: 'text',
        editKind: 'text',
        content: 'Bad shadow',
        typography: {
          textShadow: {
            offsetX: 0,
            offsetY: 0,
            blur: 4,
            color: '#000000',
            opacity: -0.1,
          },
        },
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
    assert.deepEqual(FONT_WEIGHT_IDS, [
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
    ])
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
    assert.deepEqual(GRADIENT_DIRECTION_IDS, [
      'to-top',
      'to-top-right',
      'to-right',
      'to-bottom-right',
      'to-bottom',
      'to-bottom-left',
      'to-left',
      'to-top-left',
    ])
    assert.deepEqual(GRADIENT_TYPE_IDS, ['linear', 'radial', 'conic'])
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

  it('exports stable transition timing values', () => {
    assert.deepEqual(NODE_TRANSITION_TIMING_IDS, [
      'linear',
      'ease',
      'ease-in',
      'ease-out',
      'ease-in-out',
      'custom',
    ])
  })
})
