import assert from 'node:assert/strict'
import type { ChildProcess, SpawnOptions } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, it } from 'node:test'

import { handleGenerate } from './generate.js'
import type { SpawnLike } from './llm.js'

type SpawnCall = {
  command: string
  args: readonly string[]
  options?: SpawnOptions
}

type FakeChildProcess = ChildProcess & {
  stdout: PassThrough
  stderr: PassThrough
  kill: (signal?: NodeJS.Signals | number) => boolean
}

const validTree = {
  version: '1',
  root: {
    id: 'landing.hero',
    type: 'hero',
    editKind: 'structure',
    children: [
      {
        id: 'hero.title',
        type: 'text',
        editKind: 'text',
        content: '제주 감귤 카페',
        emphasis: 'heading-1',
      },
      {
        id: 'hero.cta',
        type: 'button',
        editKind: 'text',
        label: '메뉴 보기',
        variant: 'primary',
      },
    ],
  },
} as const

function createFakeChild(): FakeChildProcess {
  const child = new EventEmitter() as FakeChildProcess
  child.stdout = new PassThrough()
  child.stderr = new PassThrough()
  child.kill = () => true
  return child
}

function createClosingSpawn(stdout: string, code = 0): {
  calls: SpawnCall[]
  spawn: SpawnLike
} {
  const calls: SpawnCall[] = []
  const spawn: SpawnLike = (command, args, options) => {
    calls.push({ command, args, options })
    const child = createFakeChild()
    queueMicrotask(() => {
      child.stdout.emit('data', stdout)
      child.emit('close', code)
    })
    return child
  }
  return { calls, spawn }
}

function createHangingSpawn(): {
  killedSignals: Array<NodeJS.Signals | number | undefined>
  spawn: SpawnLike
} {
  const killedSignals: Array<NodeJS.Signals | number | undefined> = []
  const spawn: SpawnLike = () => {
    const child = createFakeChild()
    child.kill = (signal?: NodeJS.Signals | number) => {
      killedSignals.push(signal)
      return true
    }
    return child
  }
  return { killedSignals, spawn }
}

describe('handleGenerate', () => {
  it('returns a schema-valid generated tree from Claude CLI stdout', async () => {
    const { calls, spawn } = createClosingSpawn(JSON.stringify(validTree))

    const result = await handleGenerate(
      { prompt: '감귤 카페 랜딩 페이지를 만들어줘' },
      { spawnImpl: spawn, command: 'test-claude', timeoutMs: 500 },
    )

    assert.equal(result.status, 200)
    if (result.status === 200) {
      assert.deepEqual(result.body.tree, validTree)
      assert.equal(result.body.model, 'claude')
      assert.equal(typeof result.body.latencyMs, 'number')
    }
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.command, 'test-claude')
    assert.equal(calls[0]?.args[0], '-p')
    assert.equal(calls[0]?.args[1], '감귤 카페 랜딩 페이지를 만들어줘')
    assert.equal(calls[0]?.args[2], '--system-prompt')
    assert.equal(calls[0]?.options?.stdio?.[0], 'ignore')
  })

  it('rejects invalid request payloads before calling the CLI', async () => {
    const { calls, spawn } = createClosingSpawn(JSON.stringify(validTree))

    const result = await handleGenerate({ prompt: '' }, { spawnImpl: spawn })

    assert.equal(result.status, 400)
    assert.equal(result.body.error, 'invalid-request')
    assert.equal(calls.length, 0)
  })

  it('maps invalid CLI JSON to a parse failure without exposing raw output', async () => {
    const { spawn } = createClosingSpawn('not-json-output')

    const result = await handleGenerate({ prompt: '히어로 생성' }, { spawnImpl: spawn })

    assert.equal(result.status, 422)
    assert.equal(result.body.error, 'parse-failure')
    assert.equal(result.body.message.includes('not-json-output'), false)
  })

  it('maps schema-invalid JSON to a schema failure', async () => {
    const { spawn } = createClosingSpawn(
      JSON.stringify({
        version: '2',
        root: {
          id: 'invalid.hero',
          type: 'hero',
          editKind: 'structure',
          children: [
            {
              id: 'invalid.title',
              type: 'text',
              editKind: 'text',
              content: '잘못된 버전',
            },
          ],
        },
      }),
    )

    const result = await handleGenerate({ prompt: '빈 히어로 생성' }, { spawnImpl: spawn })

    assert.equal(result.status, 422)
    assert.equal(result.body.error, 'schema-failure')
  })

  it('maps CLI timeout to a timeout failure and terminates the child process', async () => {
    const { killedSignals, spawn } = createHangingSpawn()

    const result = await handleGenerate(
      { prompt: '응답이 느린 랜딩 페이지 생성' },
      { spawnImpl: spawn, timeoutMs: 1 },
    )

    assert.equal(result.status, 502)
    assert.equal(result.body.error, 'cli-timeout')
    assert.deepEqual(killedSignals, ['SIGTERM'])
  })
})
