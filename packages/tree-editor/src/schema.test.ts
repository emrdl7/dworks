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
    })

    assert.equal(op.type, 'updateImage')
    if (op.type === 'updateImage') {
      assert.equal(op.nodeId, 'hero.visual')
      assert.equal(op.src, '')
      assert.equal(op.alt, '')
      assert.equal(op.aspectRatio, 'wide')
      assert.deepEqual(op.focalPoint, { x: 0.5, y: 0.25 })
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
      { type: 'updateButtonLabel', nodeId: 'cta', label: '시작' },
      { type: 'updateImage', nodeId: 'visual', alt: '대체 텍스트' },
      { type: 'moveNode', nodeId: 'cards.card-a', direction: 'down' },
      { type: 'updateStyleTokens', patch: { colorPreset: 'navy' } },
    ],
  }

  it('parses a valid sequence', () => {
    const seq = editSequenceSchema.parse(validSequence)
    assert.equal(seq.id, 'test')
    assert.equal(seq.operations.length, 7)
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
