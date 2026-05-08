// fixture 검증 — 트리 fixture와 시퀀스 fixture가 실제 편집 가능한 입력인지 보장.
// m2-edit-fixtures round 2 §3.2 합의 범위.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import { treeSchema, type Tree, type TreeNode } from '@dworks/tree'

import { applyEditSequence } from './operations.js'
import { editSequenceSchema, type EditSequence } from './schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '..')
const REPO_ROOT = resolve(PKG_ROOT, '..', '..')

const TREE_FIXTURES: { name: string; path: string }[] = [
  'simple-hero',
  'card-grid',
  'signup-form',
].map((name) => ({
  name,
  path: resolve(REPO_ROOT, `seeds/trees/${name}.json`),
}))

const SEQUENCE_FIXTURES: { name: string; path: string }[] = [
  'simple-hero-content',
  'card-grid-content',
  'signup-form-content',
].map((name) => ({
  name,
  path: resolve(REPO_ROOT, `seeds/evals/edit-sequences/${name}.json`),
}))

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node
  if ('children' in node) {
    for (const child of node.children) {
      const found = findNode(child, id)
      if (found) return found
    }
  }
  return null
}

describe('tree fixtures parse with treeSchema', () => {
  for (const fixture of TREE_FIXTURES) {
    it(`${fixture.name}.json`, () => {
      const data = readJson(fixture.path)
      assert.doesNotThrow(() => treeSchema.parse(data))
    })
  }
})

describe('edit-sequence fixtures', () => {
  for (const fixture of SEQUENCE_FIXTURES) {
    const seq = readJson<EditSequence>(fixture.path)

    it(`${fixture.name} parses with editSequenceSchema`, () => {
      assert.doesNotThrow(() => editSequenceSchema.parse(seq))
    })

    it(`${fixture.name} resolves tree relative path`, () => {
      const treePath = resolve(dirname(fixture.path), seq.tree)
      const tree = readJson<Tree>(treePath)
      assert.doesNotThrow(() => treeSchema.parse(tree))
    })

    it(`${fixture.name} all nodeIds exist in referenced tree`, () => {
      const treePath = resolve(dirname(fixture.path), seq.tree)
      const tree = readJson<Tree>(treePath)
      const parsedTree = treeSchema.parse(tree)
      for (const op of seq.operations) {
        if (!('nodeId' in op)) {
          continue
        }

        const node = findNode(parsedTree.root, op.nodeId)
        assert.ok(
          node,
          `${seq.id}: nodeId ${op.nodeId} not found in tree ${seq.tree}`,
        )
      }
    })

    it(`${fixture.name} applyEditSequence runs without throw`, () => {
      const treePath = resolve(dirname(fixture.path), seq.tree)
      const parsedTree = treeSchema.parse(readJson<Tree>(treePath))
      const parsedSeq = editSequenceSchema.parse(seq)
      assert.doesNotThrow(() =>
        applyEditSequence(parsedTree, parsedSeq.operations),
      )
    })
  }
})
