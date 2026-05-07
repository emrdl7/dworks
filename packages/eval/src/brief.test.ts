// brief loader + placeholder tree builder 검증.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { treeSchema } from '@dworks/tree'

import { briefSchema, buildPlaceholderTree, loadBriefs } from './brief.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BRIEFS_DIR = resolve(__dirname, '../../../seeds/evals/briefs')

describe('brief loader', () => {
  it('loads 12 briefs from seeds/evals/briefs', async () => {
    const briefs = await loadBriefs(BRIEFS_DIR)
    assert.equal(briefs.length, 12)
  })

  it('every brief parses through schema', async () => {
    const briefs = await loadBriefs(BRIEFS_DIR)
    for (const b of briefs) {
      const parsed = briefSchema.parse(b)
      assert.equal(parsed.id, b.id)
    }
  })

  it('briefs cover all 5 categories', async () => {
    const briefs = await loadBriefs(BRIEFS_DIR)
    const cats = new Set(briefs.map((b) => b.category))
    assert.deepEqual(
      cats,
      new Set([
        'public-landing',
        'brand-campaign',
        'dashboard',
        'application-form',
        'list-detail',
      ]),
    )
  })
})

describe('buildPlaceholderTree', () => {
  it('builds a renderable tree for every brief', async () => {
    const briefs = await loadBriefs(BRIEFS_DIR)
    for (const b of briefs) {
      const tree = buildPlaceholderTree(b)
      const parsed = treeSchema.parse(tree)
      assert.equal(parsed.version, '1')
      // root id가 brief id를 prefix로 가져야 추적 가능.
      assert.ok(parsed.root.id.startsWith(b.id), `root id 가 brief id 를 prefix 로 가져야: ${parsed.root.id}`)
    }
  })

  it('landing builds hero + cards + list', async () => {
    const briefs = await loadBriefs(BRIEFS_DIR)
    const landing = briefs.find((b) => b.category === 'public-landing')
    assert.ok(landing)
    const tree = buildPlaceholderTree(landing)
    if (tree.root.type !== 'section') throw new Error('expected section root')
    const heroChild = tree.root.children.find((c) => c.type === 'hero')
    assert.ok(heroChild, 'hero 자식 있어야')
  })

  it('application-form category builds a form node', async () => {
    const briefs = await loadBriefs(BRIEFS_DIR)
    const form = briefs.find((b) => b.category === 'application-form')
    assert.ok(form)
    const tree = buildPlaceholderTree(form)
    if (tree.root.type !== 'section') throw new Error('expected section root')
    const formChild = tree.root.children.find((c) => c.type === 'form')
    assert.ok(formChild, 'form 자식 있어야')
  })

  it('list-detail category builds a list node', async () => {
    const briefs = await loadBriefs(BRIEFS_DIR)
    const list = briefs.find((b) => b.category === 'list-detail')
    assert.ok(list)
    const tree = buildPlaceholderTree(list)
    if (tree.root.type !== 'section') throw new Error('expected section root')
    const hasList = JSON.stringify(tree).includes('"type":"list"')
    assert.ok(hasList)
  })
})
