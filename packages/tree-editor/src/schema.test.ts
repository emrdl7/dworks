import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { editOperationSchema, editSequenceSchema } from './schema.js'

describe('edit-operation schema', () => {
  it('parses updateText operation', () => {
    const op = editOperationSchema.parse({
      type: 'updateText',
      nodeId: 'foo.bar',
      content: 'hello',
    })
    assert.equal(op.type, 'updateText')
    if (op.type === 'updateText') {
      assert.equal(op.nodeId, 'foo.bar')
      assert.equal(op.content, 'hello')
    }
  })

  it('parses updateTextTypography operation', () => {
    const op = editOperationSchema.parse({
      type: 'updateTextTypography',
      nodeId: 'hero.title',
      patch: {
        fontSize: 52,
        fontWeight: '700',
        lineHeight: 1.1,
        letterSpacing: -0.02,
        textAlign: 'center',
        fontFamily: 'serif',
      },
    })

    assert.equal(op.type, 'updateTextTypography')
    if (op.type === 'updateTextTypography') {
      assert.equal(op.nodeId, 'hero.title')
      assert.equal(op.patch.fontSize, 52)
      assert.equal(op.patch.fontFamily, 'serif')
    }
  })

  it('parses updateSpacing operation', () => {
    const op = editOperationSchema.parse({
      type: 'updateSpacing',
      nodeId: 'hero.card',
      patch: {
        paddingTop: 24,
        paddingRight: 32,
        paddingBottom: 24,
        paddingLeft: 32,
        marginTop: -12,
        gap: 16,
      },
    })

    assert.equal(op.type, 'updateSpacing')
    if (op.type === 'updateSpacing') {
      assert.equal(op.nodeId, 'hero.card')
      assert.equal(op.patch.paddingTop, 24)
      assert.equal(op.patch.marginTop, -12)
      assert.equal(op.patch.gap, 16)
    }
  })

  it('parses updateShape operation', () => {
    const op = editOperationSchema.parse({
      type: 'updateShape',
      nodeId: 'hero.card',
      patch: {
        radius: 18,
        borderWidth: 2,
        borderColor: '#aabbcc',
        borderStyle: 'dashed',
        shadow: 'lg',
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
    })

    assert.equal(op.type, 'updateShape')
    if (op.type === 'updateShape') {
      assert.equal(op.nodeId, 'hero.card')
      assert.equal(op.patch.radius, 18)
      assert.equal(op.patch.borderColor, '#aabbcc')
      assert.equal(op.patch.shadow, 'lg')
      assert.equal(op.patch.customShadows?.[1]?.inset, true)
    }
  })

  it('parses updateColor operation', () => {
    const op = editOperationSchema.parse({
      type: 'updateColor',
      nodeId: 'hero.card',
      patch: {
        backgroundColor: '#f8fafc',
        hoverBackgroundColor: '#0f766e',
        hoverTextColor: '#ffffff',
        activeBackgroundColor: '#0b5f57',
        activeTextColor: '#f8fafc',
        focusBackgroundColor: '#114b5f',
        focusTextColor: '#f0fdfa',
        disabledBackgroundColor: '#64748b',
        disabledTextColor: '#f8fafc',
        textColor: '#123',
      },
    })

    assert.equal(op.type, 'updateColor')
    if (op.type === 'updateColor') {
      assert.equal(op.nodeId, 'hero.card')
      assert.equal(op.patch.backgroundColor, '#f8fafc')
      assert.equal(op.patch.hoverBackgroundColor, '#0f766e')
      assert.equal(op.patch.hoverTextColor, '#ffffff')
      assert.equal(op.patch.activeBackgroundColor, '#0b5f57')
      assert.equal(op.patch.activeTextColor, '#f8fafc')
      assert.equal(op.patch.focusBackgroundColor, '#114b5f')
      assert.equal(op.patch.focusTextColor, '#f0fdfa')
      assert.equal(op.patch.disabledBackgroundColor, '#64748b')
      assert.equal(op.patch.disabledTextColor, '#f8fafc')
      assert.equal(op.patch.textColor, '#123')
    }
  })

  it('parses updateLayout operation', () => {
    const op = editOperationSchema.parse({
      type: 'updateLayout',
      nodeId: 'hero.card',
      patch: {
        direction: 'row',
        align: 'center',
        justify: 'evenly',
        wrap: 'wrap',
      },
    })

    assert.equal(op.type, 'updateLayout')
    if (op.type === 'updateLayout') {
      assert.equal(op.nodeId, 'hero.card')
      assert.equal(op.patch.direction, 'row')
      assert.equal(op.patch.justify, 'evenly')
    }
  })

  it('parses updateNodeMeta operation', () => {
    const op = editOperationSchema.parse({
      type: 'updateNodeMeta',
      nodeId: 'hero.card',
      patch: {
        hidden: true,
        disabled: true,
        opacity: 0.64,
        pointerEvents: 'none',
        cursor: 'pointer',
        transition: {
          duration: 240,
          timing: 'ease-in',
        },
        transform: {
          translateX: 32,
          translateY: -20,
          rotate: -15,
          scale: 0.9,
          originX: 100,
        },
      },
    })

    assert.equal(op.type, 'updateNodeMeta')
    if (op.type === 'updateNodeMeta') {
      assert.equal(op.nodeId, 'hero.card')
      assert.equal(op.patch.hidden, true)
      assert.equal(op.patch.disabled, true)
      assert.equal(op.patch.opacity, 0.64)
      assert.equal(op.patch.pointerEvents, 'none')
      assert.equal(op.patch.cursor, 'pointer')
      assert.equal(op.patch.transition?.duration, 240)
      assert.equal(op.patch.transition?.timing, 'ease-in')
      assert.deepEqual(op.patch.transform, {
        translateX: 32,
        translateY: -20,
        rotate: -15,
        scale: 0.9,
        originX: 100,
      })
    }
  })

  it('parses updateButtonLabel operation', () => {
    const op = editOperationSchema.parse({
      type: 'updateButtonLabel',
      nodeId: 'foo.cta',
      label: '시작',
    })
    assert.equal(op.type, 'updateButtonLabel')
    if (op.type === 'updateButtonLabel') {
      assert.equal(op.label, '시작')
    }
  })

  it('parses updateImage operation with empty decorative alt', () => {
    const op = editOperationSchema.parse({
      type: 'updateImage',
      nodeId: 'hero.visual',
      src: '',
      alt: '',
      aspectRatio: 'wide',
      focalPoint: { x: 0.5, y: 0.25 },
      presentation: {
        fit: 'contain',
        overlayColor: '#123456',
        overlayOpacity: 0.4,
        filter: {
          blur: 6,
          grayscale: 100,
          sepia: 20,
          brightness: 125,
          contrast: 90,
        },
      },
    })

    assert.equal(op.type, 'updateImage')
    if (op.type === 'updateImage') {
      assert.equal(op.nodeId, 'hero.visual')
      assert.equal(op.src, '')
      assert.equal(op.alt, '')
      assert.equal(op.aspectRatio, 'wide')
      assert.deepEqual(op.focalPoint, { x: 0.5, y: 0.25 })
      assert.deepEqual(op.presentation, {
        fit: 'contain',
        overlayColor: '#123456',
        overlayOpacity: 0.4,
        filter: {
          blur: 6,
          grayscale: 100,
          sepia: 20,
          brightness: 125,
          contrast: 90,
        },
      })
    }
  })

  it('parses structure operations', () => {
    const moveOp = editOperationSchema.parse({
      type: 'moveNode',
      nodeId: 'cards.card-a',
      direction: 'down',
    })
    const duplicateOp = editOperationSchema.parse({
      type: 'duplicateNode',
      nodeId: 'cards.card-a',
      newNodeId: 'cards.card-a.copy',
    })
    const deleteOp = editOperationSchema.parse({
      type: 'deleteNode',
      nodeId: 'cards.card-a.copy',
    })

    assert.equal(moveOp.type, 'moveNode')
    if (moveOp.type === 'moveNode') {
      assert.equal(moveOp.direction, 'down')
    }
    assert.equal(duplicateOp.type, 'duplicateNode')
    if (duplicateOp.type === 'duplicateNode') {
      assert.equal(duplicateOp.newNodeId, 'cards.card-a.copy')
    }
    assert.equal(deleteOp.type, 'deleteNode')
  })

  it('parses root style token updates', () => {
    const op = editOperationSchema.parse({
      type: 'updateStyleTokens',
      patch: {
        colorPreset: 'graphite',
      },
    })

    assert.equal(op.type, 'updateStyleTokens')
    if (op.type === 'updateStyleTokens') {
      assert.equal(op.patch.colorPreset, 'graphite')
    }
  })

  it('rejects unknown operation type', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateMedia',
        nodeId: 'foo',
        src: '/x.png',
      }),
    )
  })

  it('rejects invalid move direction', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'moveNode',
        nodeId: 'cards.card-a',
        direction: 'left',
      }),
    )
  })

  it('rejects updateText without content', () => {
    assert.throws(() =>
      editOperationSchema.parse({ type: 'updateText', nodeId: 'foo' }),
    )
  })

  it('rejects invalid updateImage media metadata', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateImage',
        nodeId: 'hero.visual',
        aspectRatio: 'panorama',
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateImage',
        nodeId: 'hero.visual',
        focalPoint: { x: -0.1, y: 0.5 },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateImage',
        nodeId: 'hero.visual',
        presentation: { fit: 'stretch' },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateImage',
        nodeId: 'hero.visual',
        presentation: { overlayColor: 'black' },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateImage',
        nodeId: 'hero.visual',
        presentation: { overlayOpacity: -0.01 },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateImage',
        nodeId: 'hero.visual',
        presentation: { filter: { grayscale: 101 } },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateImage',
        nodeId: 'hero.visual',
        presentation: { filter: { contrast: 151 } },
      }),
    )
  })

  it('rejects invalid style token updates', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateStyleTokens',
        patch: {
          colorPreset: 'neon',
        },
      }),
    )
  })

  it('rejects invalid text typography updates', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateTextTypography',
        nodeId: 'hero.title',
        patch: {
          fontSize: 160,
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateTextTypography',
        nodeId: 'hero.title',
        patch: {
          textAlign: 'justify',
        },
      }),
    )
  })

  it('rejects invalid spacing updates', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateSpacing',
        nodeId: 'hero.card',
        patch: {
          paddingTop: -1,
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateSpacing',
        nodeId: 'hero.card',
        patch: {
          marginBottom: -201,
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateSpacing',
        nodeId: 'hero.card',
        patch: {
          gap: 201,
        },
      }),
    )
  })

  it('rejects invalid shape updates', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateShape',
        nodeId: 'hero.card',
        patch: {
          borderWidth: 21,
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateShape',
        nodeId: 'hero.card',
        patch: {
          borderColor: '#abcd',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateShape',
        nodeId: 'hero.card',
        patch: {
          borderStyle: 'double',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateShape',
        nodeId: 'hero.card',
        patch: {
          customShadow: {
            offsetX: 0,
            offsetY: 4,
            blur: 12,
            spread: 0,
            color: '#000000',
            inset: 'yes',
          },
        },
      }),
    )
  })

  it('rejects invalid color updates', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          backgroundColor: 'white',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          textColor: '#abcd',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          hoverBackgroundColor: 'teal',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          hoverTextColor: 'white',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          activeBackgroundColor: 'teal',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          activeTextColor: 'white',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          focusBackgroundColor: 'navy',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          focusTextColor: 'white',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          disabledBackgroundColor: 'gray',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateColor',
        nodeId: 'hero.card',
        patch: {
          disabledTextColor: 'white',
        },
      }),
    )
  })

  it('rejects invalid layout updates', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateLayout',
        nodeId: 'hero.card',
        patch: {
          direction: 'row-reverse',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateLayout',
        nodeId: 'hero.card',
        patch: {
          justify: 'around',
        },
      }),
    )
  })

  it('rejects invalid node meta updates', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateNodeMeta',
        nodeId: 'hero.card',
        patch: {
          disabled: 'true',
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateNodeMeta',
        nodeId: 'hero.card',
        patch: {
          transform: {
            originX: -1,
          },
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateNodeMeta',
        nodeId: 'hero.card',
        patch: {
          transform: {
            originY: 101,
          },
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateNodeMeta',
        nodeId: 'hero.card',
        patch: {
          transform: {
            rotate: 361,
          },
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateNodeMeta',
        nodeId: 'hero.card',
        patch: {
          transform: {
            scale: 2.01,
          },
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateNodeMeta',
        nodeId: 'hero.card',
        patch: {
          transition: {
            duration: 2001,
          },
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateNodeMeta',
        nodeId: 'hero.card',
        patch: {
          transition: {
            timing: 'spring',
          },
        },
      }),
    )

    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateNodeMeta',
        nodeId: 'hero.card',
        patch: {
          cursor: 'move',
        },
      }),
    )
  })

  it('rejects empty nodeId', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateText',
        nodeId: '',
        content: 'x',
      }),
    )
  })
})

describe('edit-sequence schema', () => {
  const validSequence = {
    id: 'test',
    tree: '../../trees/x.json',
    intent: '테스트 의도',
    operations: [
      { type: 'updateText', nodeId: 'foo', content: 'bar' },
      {
        type: 'updateTextTypography',
        nodeId: 'foo',
        patch: { fontSize: 44, fontWeight: '600' },
      },
      {
        type: 'updateSpacing',
        nodeId: 'foo',
        patch: { paddingTop: 24, marginBottom: 12, gap: 16 },
      },
      {
        type: 'updateShape',
        nodeId: 'foo',
        patch: { radius: 18, borderStyle: 'solid', shadow: 'md' },
      },
      {
        type: 'updateColor',
        nodeId: 'foo',
        patch: { backgroundColor: '#f8fafc', textColor: '#123456' },
      },
      {
        type: 'updateLayout',
        nodeId: 'foo',
        patch: { direction: 'row', align: 'center', justify: 'evenly' },
      },
      { type: 'updateButtonLabel', nodeId: 'cta', label: '시작' },
      {
        type: 'updateImage',
        nodeId: 'visual',
        alt: '대체 텍스트',
        presentation: { fit: 'contain', overlayOpacity: 0.25 },
      },
      { type: 'moveNode', nodeId: 'cards.card-a', direction: 'down' },
      { type: 'updateStyleTokens', patch: { colorPreset: 'navy' } },
    ],
  }

  it('parses a valid sequence', () => {
    const seq = editSequenceSchema.parse(validSequence)
    assert.equal(seq.id, 'test')
    assert.equal(seq.operations.length, 10)
    assert.equal(seq.tree, '../../trees/x.json')
  })

  it('rejects empty operations array', () => {
    assert.throws(() =>
      editSequenceSchema.parse({ ...validSequence, operations: [] }),
    )
  })

  it('rejects empty intent', () => {
    assert.throws(() =>
      editSequenceSchema.parse({ ...validSequence, intent: '' }),
    )
  })

  it('rejects missing tree path', () => {
    assert.throws(() =>
      editSequenceSchema.parse({
        id: validSequence.id,
        intent: validSequence.intent,
        operations: validSequence.operations,
      }),
    )
  })
})
