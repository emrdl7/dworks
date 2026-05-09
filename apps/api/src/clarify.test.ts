import assert from 'node:assert/strict'
import type { ChildProcess, SpawnOptions } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, it } from 'node:test'

import { handleClarify } from './clarify.js'
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

const validQuestions = {
  questions: [
    {
      id: 'q1',
      label: '이 페이지에서 가장 먼저 유도할 행동은 무엇인가요?',
      type: 'single',
      options: ['예약하기', '메뉴 보기', '위치 확인'],
      hint: '첫 CTA와 hero 메시지에 반영됩니다.',
    },
    {
      id: 'q2',
      label: '강조할 콘텐츠를 모두 골라주세요.',
      type: 'multi',
      options: ['시그니처 메뉴', '공간 분위기', '방문 후기'],
    },
    {
      id: 'q3',
      label: '브랜드에서 꼭 드러나야 할 문장이 있나요?',
      type: 'text',
    },
  ],
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

describe('handleClarify', () => {
  it('returns schema-valid adaptive questions from Claude CLI stdout', async () => {
    const { calls, spawn } = createClosingSpawn(JSON.stringify(validQuestions))

    const result = await handleClarify(
      { intent: '  제주 감귤 카페 랜딩 페이지  ' },
      { spawnImpl: spawn, command: 'test-claude', timeoutMs: 500 },
    )

    assert.equal(result.status, 200)
    if (result.status === 200) {
      assert.deepEqual(result.body.questions, validQuestions.questions)
      assert.equal(result.body.model, 'claude')
      assert.equal(typeof result.body.latencyMs, 'number')
    }
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.command, 'test-claude')
    assert.equal(calls[0]?.args[0], '-p')
    assert.equal(calls[0]?.args[1], '제주 감귤 카페 랜딩 페이지')
    assert.equal(calls[0]?.args[2], '--system-prompt')
    assert.equal(calls[0]?.options?.stdio?.[0], 'ignore')
  })

  it('rejects invalid clarify request payloads before calling the CLI', async () => {
    const { calls, spawn } = createClosingSpawn(JSON.stringify(validQuestions))

    const result = await handleClarify({ intent: '   ' }, { spawnImpl: spawn })

    assert.equal(result.status, 400)
    assert.equal(result.body.error, 'invalid-request')
    assert.equal(calls.length, 0)
  })

  it('maps invalid CLI JSON to a parse failure without exposing raw output', async () => {
    const { spawn } = createClosingSpawn('not-json-output')

    const result = await handleClarify({ intent: '카페 랜딩' }, { spawnImpl: spawn })

    assert.equal(result.status, 422)
    assert.equal(result.body.error, 'parse-failure')
    assert.equal(result.body.message.includes('not-json-output'), false)
  })

  it('maps schema-invalid question JSON to a schema failure', async () => {
    const { spawn } = createClosingSpawn(
      JSON.stringify({
        questions: [
          { id: 'q1', label: '대표 CTA는?', type: 'single' },
          { id: 'q2', label: '강조 콘텐츠는?', type: 'multi', options: ['메뉴', '후기'] },
          { id: 'q3', label: '브랜드 문장은?', type: 'text' },
        ],
      }),
    )

    const result = await handleClarify({ intent: '카페 랜딩' }, { spawnImpl: spawn })

    assert.equal(result.status, 422)
    assert.equal(result.body.error, 'schema-failure')
  })

  it('maps too-few questions to a schema failure', async () => {
    const { spawn } = createClosingSpawn(
      JSON.stringify({
        questions: [
          { id: 'q1', label: '대표 CTA는?', type: 'single', options: ['예약', '문의'] },
          { id: 'q2', label: '브랜드 문장은?', type: 'text' },
        ],
      }),
    )

    const result = await handleClarify({ intent: '카페 랜딩' }, { spawnImpl: spawn })

    assert.equal(result.status, 422)
    assert.equal(result.body.error, 'schema-failure')
  })

  it('maps CLI timeout to a timeout failure and terminates the child process', async () => {
    const { killedSignals, spawn } = createHangingSpawn()

    const result = await handleClarify(
      { intent: '응답이 느린 질문 생성' },
      { spawnImpl: spawn, timeoutMs: 1, providerChain: ['claude'] },
    )

    assert.equal(result.status, 502)
    assert.equal(result.body.error, 'cli-timeout')
    assert.deepEqual(killedSignals, ['SIGTERM'])
  })
})
