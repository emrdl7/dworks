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

type SpawnStep =
  | { kind: 'throw'; error: Error }
  | { kind: 'close'; stdout?: string; code?: number }
  | { kind: 'hang' }

function createSequencedSpawn(steps: SpawnStep[]): {
  calls: SpawnCall[]
  killedSignals: Array<NodeJS.Signals | number | undefined>
  spawn: SpawnLike
} {
  const calls: SpawnCall[] = []
  const killedSignals: Array<NodeJS.Signals | number | undefined> = []
  let index = 0
  const spawn: SpawnLike = (command, args, options) => {
    calls.push({ command, args, options })
    const step = steps[index++] ?? { kind: 'close', code: 1 }
    if (step.kind === 'throw') {
      throw step.error
    }
    const child = createFakeChild()
    child.kill = (signal?: NodeJS.Signals | number) => {
      killedSignals.push(signal)
      return true
    }
    if (step.kind === 'hang') {
      return child
    }
    queueMicrotask(() => {
      if (step.stdout !== undefined) {
        child.stdout.emit('data', step.stdout)
      }
      child.emit('close', step.code ?? 0)
    })
    return child
  }
  return { calls, killedSignals, spawn }
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
    assert.match(calls[0]?.args[1] ?? '', /감귤 카페 랜딩 페이지를 만들어줘/)
    assert.equal(calls[0]?.args[2], '--system-prompt')
    assert.equal(calls[0]?.options?.stdio?.[0], 'ignore')
  })

  it('formats adaptive brief answers into the CLI user prompt', async () => {
    const { calls, spawn } = createClosingSpawn(JSON.stringify(validTree))

    const result = await handleGenerate(
      {
        brief: {
          intent: '  제주 감귤 카페 랜딩 페이지  ',
          answers: [
            {
              questionId: 'q1',
              questionLabel: '대표 CTA는 무엇인가요?',
              answer: '예약하기',
            },
            {
              questionId: 'q2',
              questionLabel: '강조할 콘텐츠는 무엇인가요?',
              answer: ['시그니처 메뉴', '방문 후기'],
            },
          ],
          notes: '  Pretendard 기반의 차분한 톤  ',
        },
      },
      { spawnImpl: spawn, command: 'test-claude', timeoutMs: 500 },
    )

    assert.equal(result.status, 200)
    assert.equal(calls.length, 1)
    const userPrompt = calls[0]?.args[1] ?? ''
    assert.match(userPrompt, /### 의도\n제주 감귤 카페 랜딩 페이지/)
    assert.match(userPrompt, /- 대표 CTA는 무엇인가요\?: 예약하기/)
    assert.match(userPrompt, /- 강조할 콘텐츠는 무엇인가요\?: 시그니처 메뉴, 방문 후기/)
    assert.match(userPrompt, /### 브랜드 \/ 참조 메모\nPretendard 기반의 차분한 톤/)
  })

  it('rejects invalid request payloads before calling the CLI', async () => {
    const { calls, spawn } = createClosingSpawn(JSON.stringify(validTree))

    const result = await handleGenerate({ prompt: '' }, { spawnImpl: spawn })

    assert.equal(result.status, 400)
    assert.equal(result.body.error, 'invalid-request')
    assert.equal(calls.length, 0)
  })

  it('rejects invalid request-level provider overrides before calling the CLI', async () => {
    const { calls, spawn } = createClosingSpawn(JSON.stringify(validTree))

    const result = await handleGenerate(
      { brief: { intent: 'provider 오류' }, providers: ['unknown'] },
      { spawnImpl: spawn },
    )

    assert.equal(result.status, 400)
    assert.equal(result.body.error, 'invalid-request')
    assert.equal(calls.length, 0)
  })

  it('uses request-level providers before dependency defaults', async () => {
    const { calls, spawn } = createClosingSpawn('')

    const result = await handleGenerate(
      { brief: { intent: 'Codex만 사용' }, providers: ['codex'] },
      {
        spawnImpl: spawn,
        providerChain: ['claude'],
        prepareOutputFileImpl: async () => ({
          path: '/tmp/test-codex-output',
          cleanup: async () => {},
        }),
        readOutputFileImpl: async () => JSON.stringify(validTree),
      },
    )

    assert.equal(result.status, 200)
    if (result.status === 200) {
      assert.equal(result.body.model, 'codex')
    }
    assert.deepEqual(
      calls.map((call) => call.command),
      ['codex'],
    )
  })

  it('maps invalid CLI JSON to a parse failure without exposing raw output', async () => {
    const { calls, spawn } = createClosingSpawn('not-json-output')

    const result = await handleGenerate(
      { prompt: '히어로 생성' },
      { spawnImpl: spawn, providerChain: ['claude', 'codex'] },
    )

    assert.equal(result.status, 422)
    assert.equal(result.body.error, 'parse-failure')
    assert.equal(result.body.message.includes('not-json-output'), false)
    assert.equal(calls.length, 1)
  })

  it('maps schema-invalid JSON to a schema failure', async () => {
    const { calls, spawn } = createClosingSpawn(
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

    const result = await handleGenerate(
      { prompt: '빈 히어로 생성' },
      { spawnImpl: spawn, providerChain: ['claude', 'codex'] },
    )

    assert.equal(result.status, 422)
    assert.equal(result.body.error, 'schema-failure')
    assert.equal(calls.length, 1)
  })

  it('sanitizes recoverable schema drift before returning a generated tree', async () => {
    const { calls, spawn } = createClosingSpawn(
      JSON.stringify({
        version: '1',
        root: {
          id: 'generated.page',
          type: 'section',
          editKind: 'structure',
          role: 'header',
          layout: {
            justify: 'space-between',
          },
          color: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          },
          children: [
            {
              id: 'generated.title',
              type: 'text',
              editKind: 'text',
              content: 'Dworks',
              typography: {
                fontWeight: 700,
                letterSpacing: '-0.02em',
              },
            },
          ],
        },
      }),
    )

    const result = await handleGenerate(
      { prompt: 'schema drift가 있는 랜딩 페이지 생성' },
      { spawnImpl: spawn, providerChain: ['claude'] },
    )

    assert.equal(result.status, 200)
    if (result.status === 200) {
      assert.equal(result.body.tree.root.type, 'section')
      if (result.body.tree.root.type === 'section') {
        assert.equal(result.body.tree.root.role, 'banner')
        assert.equal(result.body.tree.root.layout?.justify, 'between')
        assert.equal(result.body.tree.root.color?.backgroundColor, '#ffffff')
        assert.equal(result.body.tree.root.color?.backgroundOpacity, 0.95)
        const title = result.body.tree.root.children[0]
        assert.equal(title?.type, 'text')
        if (title?.type === 'text') {
          assert.equal(title.typography?.fontWeight, '700')
          assert.equal(title.typography?.letterSpacing, -0.02)
        }
      }
    }
    assert.equal(calls.length, 1)
  })

  it('maps CLI timeout to a timeout failure and terminates the child process', async () => {
    const { killedSignals, spawn } = createHangingSpawn()

    const result = await handleGenerate(
      { prompt: '응답이 느린 랜딩 페이지 생성' },
      { spawnImpl: spawn, timeoutMs: 1, providerChain: ['claude'] },
    )

    assert.equal(result.status, 502)
    assert.equal(result.body.error, 'cli-timeout')
    assert.deepEqual(killedSignals, ['SIGTERM'])
  })

  it('falls back from Claude spawn error to Codex and reports the Codex model', async () => {
    const { calls, spawn } = createSequencedSpawn([
      { kind: 'throw', error: new Error('claude missing') },
      { kind: 'close' },
    ])

    const result = await handleGenerate(
      { prompt: 'Codex fallback 랜딩 페이지 생성' },
      {
        spawnImpl: spawn,
        providerChain: ['claude', 'codex', 'gemini'],
        prepareOutputFileImpl: async () => ({
          path: '/tmp/test-codex-output',
          cleanup: async () => {},
        }),
        readOutputFileImpl: async () => JSON.stringify(validTree),
      },
    )

    assert.equal(result.status, 200)
    if (result.status === 200) {
      assert.equal(result.body.model, 'codex')
      assert.deepEqual(result.body.tree, validTree)
    }
    assert.deepEqual(
      calls.map((call) => call.command),
      ['claude', 'codex'],
    )
    assert.deepEqual(calls[1]?.args.slice(0, 3), [
      'exec',
      '--json',
      '--ephemeral',
    ])
  })

  it('falls back through timeout and non-zero exit to Gemini', async () => {
    const { calls, killedSignals, spawn } = createSequencedSpawn([
      { kind: 'hang' },
      { kind: 'close', code: 2 },
      { kind: 'close', stdout: JSON.stringify(validTree) },
    ])

    const result = await handleGenerate(
      { prompt: 'Gemini fallback 랜딩 페이지 생성' },
      {
        spawnImpl: spawn,
        providerChain: ['claude', 'codex', 'gemini'],
        timeoutMs: 1,
      },
    )

    assert.equal(result.status, 200)
    if (result.status === 200) {
      assert.equal(result.body.model, 'gemini')
      assert.deepEqual(result.body.tree, validTree)
    }
    assert.deepEqual(killedSignals, ['SIGTERM'])
    assert.deepEqual(
      calls.map((call) => call.command),
      ['claude', 'codex', 'gemini'],
    )
    assert.equal(calls[2]?.args[0], '-p')
    assert.match(calls[2]?.args[1] ?? '', /Gemini fallback 랜딩 페이지 생성/)
  })

  it('uses the configured provider chain without appending Gemini implicitly', async () => {
    const { calls, spawn } = createSequencedSpawn([
      { kind: 'close', code: 1 },
      { kind: 'close', code: 1 },
    ])

    const result = await handleGenerate(
      { prompt: '두 provider만 사용' },
      { spawnImpl: spawn, providerChain: ['claude', 'codex'] },
    )

    assert.equal(result.status, 502)
    assert.equal(result.body.error, 'cli-failure')
    assert.deepEqual(
      calls.map((call) => call.command),
      ['claude', 'codex'],
    )
  })

  it('returns cli-unavailable when the provider chain is empty', async () => {
    const { calls, spawn } = createClosingSpawn(JSON.stringify(validTree))

    const result = await handleGenerate(
      { prompt: 'provider chain 없음' },
      { spawnImpl: spawn, providerChain: [] },
    )

    assert.equal(result.status, 502)
    assert.equal(result.body.error, 'cli-unavailable')
    assert.equal(calls.length, 0)
  })
})
