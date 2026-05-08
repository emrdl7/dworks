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
      { type: 'updateButtonLabel', nodeId: 'cta', label: '시작' },
      { type: 'updateImage', nodeId: 'visual', alt: '대체 텍스트' },
      { type: 'moveNode', nodeId: 'cards.card-a', direction: 'down' },
    ],
  }

  it('parses a valid sequence', () => {
    const seq = editSequenceSchema.parse(validSequence)
    assert.equal(seq.id, 'test')
    assert.equal(seq.operations.length, 4)
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
