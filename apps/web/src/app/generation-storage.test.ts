// generation-storage 휘발 방지 검증 — read/write/clear 사이클, schema invalid 거부, fallback.

import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  clearPersistedGenerationState,
  readPersistedGenerationState,
  writePersistedGenerationState,
  type PersistedGenerationState,
} from './generation-storage.js'

const STORAGE_KEY = 'dworks:m3-generate:v1'

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
  clear(): void {
    this.store.clear()
  }
  get size(): number {
    return this.store.size
  }
}

beforeEach(() => {
  const storage = new MemoryStorage()
  ;(globalThis as Record<string, unknown>).window = {
    localStorage: storage,
  }
})

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window
})

function buildSampleState(
  overrides: Partial<PersistedGenerationState> = {},
): PersistedGenerationState {
  const tree = {
    version: '1' as const,
    root: {
      id: 'page',
      type: 'section' as const,
      editKind: 'structure' as const,
      children: [
        {
          id: 'title',
          type: 'text' as const,
          editKind: 'text' as const,
          content: '안녕',
        },
      ],
    },
  }
  return {
    version: 1,
    fixtureId: 'simple-hero',
    generations: [
      {
        id: 'gen-original',
        label: '원본',
        tree,
        immutable: true,
        brief: null,
        questions: [],
        clarifyTurns: [],
        createdAt: 1234567890,
        latencyMs: null,
        model: null,
      },
    ],
    activeGenerationId: 'gen-original',
    brief: {
      intent: '카페 랜딩 페이지',
      notes: '',
      variantCount: 1,
      answers: {},
      questions: [],
    },
    clarify: {
      turns: [],
      complete: false,
      stage: 'intent',
    },
    ...overrides,
  }
}

describe('generation-storage', () => {
  it('write 후 read하면 동일 state를 복원한다', () => {
    const state = buildSampleState()
    writePersistedGenerationState(state)
    const loaded = readPersistedGenerationState()
    assert.deepEqual(loaded, state)
  })

  it('localStorage에 아무것도 없으면 null을 반환한다', () => {
    const loaded = readPersistedGenerationState()
    assert.equal(loaded, null)
  })

  it('JSON 파싱 실패 시 null + 손상된 키 삭제', () => {
    const win = (globalThis as { window: { localStorage: MemoryStorage } }).window
    win.localStorage.setItem(STORAGE_KEY, '{ invalid json')
    const loaded = readPersistedGenerationState()
    assert.equal(loaded, null)
    assert.equal(win.localStorage.getItem(STORAGE_KEY), null)
  })

  it('version 불일치 시 null', () => {
    const win = (globalThis as { window: { localStorage: MemoryStorage } }).window
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999 }))
    const loaded = readPersistedGenerationState()
    assert.equal(loaded, null)
  })

  it('Tree schema 위반 generation은 거부한다', () => {
    const win = (globalThis as { window: { localStorage: MemoryStorage } }).window
    const broken = buildSampleState()
    const corrupt = JSON.parse(JSON.stringify(broken)) as Record<string, unknown>
    const generations = (corrupt.generations as Array<Record<string, unknown>>)
    if (generations[0]) {
      generations[0].tree = { version: '1', root: { id: 'x' } }
    }
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(corrupt))
    const loaded = readPersistedGenerationState()
    assert.equal(loaded, null)
  })

  it('activeGenerationId가 generations에 없으면 거부한다', () => {
    const state = buildSampleState({ activeGenerationId: 'gen-nonexistent' })
    writePersistedGenerationState(state)
    const loaded = readPersistedGenerationState()
    assert.equal(loaded, null)
  })

  it('clear는 키를 제거한다', () => {
    const state = buildSampleState()
    writePersistedGenerationState(state)
    clearPersistedGenerationState()
    assert.equal(readPersistedGenerationState(), null)
  })

  it('SSR 환경(window 미정의)에서 read는 null + write는 no-op', () => {
    delete (globalThis as Record<string, unknown>).window
    assert.equal(readPersistedGenerationState(), null)
    writePersistedGenerationState(buildSampleState()) // 던지지 않는다
  })

  it('brief.answers / clarifyTurns 비-string 값을 거부한다', () => {
    const win = (globalThis as { window: { localStorage: MemoryStorage } }).window
    const state = buildSampleState()
    const corrupt = JSON.parse(JSON.stringify(state)) as Record<string, unknown>
    ;(corrupt.brief as Record<string, unknown>).answers = { q1: 42 }
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(corrupt))
    assert.equal(readPersistedGenerationState(), null)
  })

  it('clarifyTurn 답변 + 질문 조합 복원 round-trip', () => {
    const state = buildSampleState({
      brief: {
        intent: '블로그',
        notes: '주간 회고',
        variantCount: 2,
        answers: { tone: '차분', readers: ['엔지니어', '디자이너'] },
        questions: [
          {
            id: 'tone',
            label: '톤',
            type: 'single',
            options: ['차분', '활기'],
          },
          {
            id: 'readers',
            label: '독자',
            type: 'multi',
            options: ['엔지니어', '디자이너'],
          },
        ],
      },
      clarify: {
        turns: [
          {
            questions: [
              {
                id: 'tone',
                label: '톤',
                type: 'single',
                options: ['차분', '활기'],
              },
            ],
            answers: [
              {
                questionId: 'tone',
                questionLabel: '톤',
                answer: '차분',
              },
            ],
          },
        ],
        complete: false,
        stage: 'questions',
      },
    })
    writePersistedGenerationState(state)
    const loaded = readPersistedGenerationState()
    assert.deepEqual(loaded, state)
  })
})
