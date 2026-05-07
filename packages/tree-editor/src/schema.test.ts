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

  it('rejects unknown operation type', () => {
    assert.throws(() =>
      editOperationSchema.parse({
        type: 'updateMedia',
        nodeId: 'foo',
        src: '/x.png',
      }),
    )
  })

  it('rejects updateText without content', () => {
    assert.throws(() =>
      editOperationSchema.parse({ type: 'updateText', nodeId: 'foo' }),
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
    ],
  }

  it('parses a valid sequence', () => {
    const seq = editSequenceSchema.parse(validSequence)
    assert.equal(seq.id, 'test')
    assert.equal(seq.operations.length, 2)
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
