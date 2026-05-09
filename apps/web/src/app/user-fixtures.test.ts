// user-fixtures persist round-trip + invalid 거부.

import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import type { Tree } from '@dworks/tree'

import {
  clearUserFixtures,
  readUserFixtures,
  renameUserFixture,
  sanitizeUserFixtureName,
  writeUserFixtures,
  type UserFixture,
} from './user-fixtures.js'

const STORAGE_KEY = 'dworks:user-fixtures:v1'

class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  ;(globalThis as Record<string, unknown>).window = { localStorage: storage }
})

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window
})

const sampleTree: Tree = {
  version: '1',
  root: {
    id: 'page',
    type: 'section',
    editKind: 'structure',
    children: [
      {
        id: 'title',
        type: 'text',
        editKind: 'text',
        content: '카페 시안',
      },
    ],
  },
}

const sampleFixture: UserFixture = {
  id: 'user-1',
  name: '내 카페 베이스라인',
  tree: sampleTree,
  createdAt: 1700000000000,
}

describe('user-fixtures', () => {
  it('write 후 read 라운드트립', () => {
    writeUserFixtures([sampleFixture])
    assert.deepEqual(readUserFixtures(), [sampleFixture])
  })

  it('빈 storage는 빈 배열', () => {
    assert.deepEqual(readUserFixtures(), [])
  })

  it('JSON 파싱 실패 시 빈 배열 + 손상 키 제거', () => {
    storage.setItem(STORAGE_KEY, '{ broken')
    assert.deepEqual(readUserFixtures(), [])
    assert.equal(storage.getItem(STORAGE_KEY), null)
  })

  it('version mismatch 시 빈 배열', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, fixtures: [sampleFixture] }),
    )
    assert.deepEqual(readUserFixtures(), [])
  })

  it('Tree schema 위반 fixture는 거부', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        fixtures: [{ ...sampleFixture, tree: { version: '1', root: { id: 'x' } } }],
      }),
    )
    assert.deepEqual(readUserFixtures(), [])
  })

  it('clear는 키를 제거', () => {
    writeUserFixtures([sampleFixture])
    clearUserFixtures()
    assert.deepEqual(readUserFixtures(), [])
  })

  it('SSR 환경(window 미정의)에서 read는 빈 배열, write는 no-op', () => {
    delete (globalThis as Record<string, unknown>).window
    assert.deepEqual(readUserFixtures(), [])
    writeUserFixtures([sampleFixture])
  })

  it('sanitizeUserFixtureName trims + collapses spaces + clips length', () => {
    assert.equal(sanitizeUserFixtureName('   카페   베이스   '), '카페 베이스')
    const long = 'a'.repeat(80)
    assert.equal(sanitizeUserFixtureName(long).length, 40)
  })

  it('renameUserFixture는 일치 id의 name만 교체한 새 배열 반환', () => {
    const other: UserFixture = { ...sampleFixture, id: 'user-2', name: '다른 fixture' }
    const list = [sampleFixture, other]
    const next = renameUserFixture(list, 'user-1', '카페 시즌2')
    assert.notEqual(next, list)
    assert.equal(next[0]?.name, '카페 시즌2')
    assert.equal(next[1], other)
  })

  it('renameUserFixture는 빈 이름이면 원본 그대로', () => {
    const list = [sampleFixture]
    const next = renameUserFixture(list, 'user-1', '')
    assert.equal(next, list)
  })

  it('renameUserFixture는 id 미일치면 원본 그대로 (참조 동일)', () => {
    const list = [sampleFixture]
    const next = renameUserFixture(list, 'user-missing', '새 이름')
    assert.equal(next, list)
  })

  it('renameUserFixture는 같은 이름이면 원본 그대로', () => {
    const list = [sampleFixture]
    const next = renameUserFixture(list, 'user-1', sampleFixture.name)
    assert.equal(next, list)
  })
})
