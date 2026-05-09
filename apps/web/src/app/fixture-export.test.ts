// fixture-export 빌드/검증/adopt unit.

import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import type { Tree } from '@dworks/tree'

import {
  FIXTURE_EXPORT_FORMAT_KEY,
  FIXTURE_EXPORT_FORMAT_VERSION,
  adoptImportedFixtures,
  buildFixtureExportFilename,
  buildFixtureExportPayload,
  parseFixtureImportPayload,
  type ExportedUserFixture,
} from './fixture-export.js'
import type { UserFixture } from './user-fixtures.js'

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

beforeEach(() => {
  ;(globalThis as Record<string, unknown>).window = {
    localStorage: new MemoryStorage(),
  }
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

const sampleFixtures: UserFixture[] = [
  {
    id: 'user-1',
    name: '내 카페 베이스라인',
    tree: sampleTree,
    createdAt: 1700000000000,
  },
  {
    id: 'user-2',
    name: '내 SaaS 프리미엄',
    tree: sampleTree,
    createdAt: 1700000005000,
  },
]

describe('fixture-export build', () => {
  it('catalog payload에 format/version/exportedAt + fixtures 포함', () => {
    const payload = buildFixtureExportPayload(
      sampleFixtures,
      new Date('2026-05-09T12:34:56.000Z'),
    )
    assert.equal(payload.format, FIXTURE_EXPORT_FORMAT_KEY)
    assert.equal(payload.version, FIXTURE_EXPORT_FORMAT_VERSION)
    assert.equal(payload.exportedAt, '2026-05-09T12:34:56.000Z')
    assert.equal(payload.fixtures.length, 2)
    assert.equal(payload.fixtures[0]?.name, '내 카페 베이스라인')
    assert.deepEqual(payload.fixtures[1]?.tree, sampleTree)
  })

  it('빈 catalog도 valid payload 생성', () => {
    const payload = buildFixtureExportPayload([], new Date())
    assert.equal(payload.fixtures.length, 0)
  })

  it('파일명에 timestamp 포함', () => {
    const name = buildFixtureExportFilename(
      new Date('2026-05-09T12:34:56.000Z'),
    )
    assert.match(name, /^dworks-fixtures-2026-05-09T12-34-56-000Z\.json$/)
  })
})

describe('fixture-export parse', () => {
  it('build → parse 라운드트립 성공', () => {
    const payload = buildFixtureExportPayload(sampleFixtures, new Date())
    const text = JSON.stringify(payload)
    const result = parseFixtureImportPayload(text)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.payload.fixtures.length, 2)
      assert.equal(result.payload.fixtures[0]?.id, 'user-1')
    }
  })

  it('손상 JSON 거부', () => {
    const result = parseFixtureImportPayload('{ broken')
    assert.equal(result.ok, false)
  })

  it('잘못된 format key 거부', () => {
    const text = JSON.stringify({
      format: 'wrong',
      version: 1,
      exportedAt: new Date().toISOString(),
      fixtures: [],
    })
    const result = parseFixtureImportPayload(text)
    assert.equal(result.ok, false)
  })

  it('잘못된 version 거부', () => {
    const text = JSON.stringify({
      format: FIXTURE_EXPORT_FORMAT_KEY,
      version: 99,
      exportedAt: new Date().toISOString(),
      fixtures: [],
    })
    const result = parseFixtureImportPayload(text)
    assert.equal(result.ok, false)
  })

  it('Tree schema 위반 fixture 거부', () => {
    const text = JSON.stringify({
      format: FIXTURE_EXPORT_FORMAT_KEY,
      version: FIXTURE_EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      fixtures: [
        {
          id: 'user-x',
          name: '깨진 fixture',
          tree: { version: '1', root: { id: 'broken' } },
          createdAt: 1700000000000,
        },
      ],
    })
    const result = parseFixtureImportPayload(text)
    assert.equal(result.ok, false)
  })

  it('fixtures가 배열이 아니면 거부', () => {
    const text = JSON.stringify({
      format: FIXTURE_EXPORT_FORMAT_KEY,
      version: FIXTURE_EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      fixtures: { user1: 'oops' },
    })
    const result = parseFixtureImportPayload(text)
    assert.equal(result.ok, false)
  })
})

describe('fixture-export adopt', () => {
  it('import 시 새 id 발급 (충돌 회피)', () => {
    const imported: ExportedUserFixture[] = sampleFixtures.map((f) => ({
      id: f.id,
      name: f.name,
      tree: f.tree,
      createdAt: f.createdAt,
    }))
    const adopted = adoptImportedFixtures(imported)
    assert.equal(adopted.length, 2)
    assert.notEqual(adopted[0]?.id, 'user-1')
    assert.notEqual(adopted[1]?.id, 'user-2')
    assert.notEqual(adopted[0]?.id, adopted[1]?.id)
    assert.equal(adopted[0]?.name, '내 카페 베이스라인')
  })

  it('이름 sanitize — 공백/길이 정리', () => {
    const imported: ExportedUserFixture[] = [
      {
        id: 'x',
        name: '   카페   베이스   ',
        tree: sampleTree,
        createdAt: 1,
      },
    ]
    const adopted = adoptImportedFixtures(imported)
    assert.equal(adopted[0]?.name, '카페 베이스')
  })
})
