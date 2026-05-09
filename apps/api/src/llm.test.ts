import assert from 'node:assert/strict'
import type { ChildProcess, SpawnOptions } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, it } from 'node:test'

import {
  callLlmChain,
  callLlmCli,
  resolveProviderChain,
  type SpawnLike,
} from './llm.js'

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

type SpawnStep = {
  stdout?: string
  code?: number
}

function createFakeChild(): FakeChildProcess {
  const child = new EventEmitter() as FakeChildProcess
  child.stdout = new PassThrough()
  child.stderr = new PassThrough()
  child.kill = () => true
  return child
}

function createSequencedSpawn(steps: SpawnStep[]): {
  calls: SpawnCall[]
  spawn: SpawnLike
} {
  const calls: SpawnCall[] = []
  let index = 0
  const spawn: SpawnLike = (command, args, options) => {
    calls.push({ command, args, options })
    const step = steps[index++] ?? { code: 0 }
    const child = createFakeChild()
    queueMicrotask(() => {
      if (step.stdout !== undefined) {
        child.stdout.emit('data', step.stdout)
      }
      child.emit('close', step.code ?? 0)
    })
    return child
  }
  return { calls, spawn }
}

describe('resolveProviderChain', () => {
  it('uses Claude, Codex, and Gemini by default', () => {
    assert.deepEqual(resolveProviderChain(undefined), ['claude', 'codex', 'gemini'])
  })

  it('trims, deduplicates, and preserves valid provider order', () => {
    assert.deepEqual(
      resolveProviderChain(' gemini, claude, unknown, codex, claude, , gemini '),
      ['gemini', 'claude', 'codex'],
    )
  })

  it('returns an empty chain instead of falling back to defaults', () => {
    assert.deepEqual(resolveProviderChain('unknown, ,missing'), [])
  })
})

describe('callLlmCli Codex output file extraction', () => {
  it('uses the Codex output file as the model response and cleans it up', async () => {
    const { calls, spawn } = createSequencedSpawn([{ stdout: '{"type":"done"}\n' }])
    let cleaned = false

    const result = await callLlmCli({
      provider: 'codex',
      systemPrompt: 'system',
      userPrompt: 'user',
      spawnImpl: spawn,
      prepareOutputFileImpl: async () => ({
        path: '/tmp/dworks-last-message.txt',
        cleanup: async () => {
          cleaned = true
        },
      }),
      readOutputFileImpl: async () => '  {"version":"1"}  ',
    })

    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.stdout, '{"version":"1"}')
    }
    assert.equal(cleaned, true)
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.command, 'codex')
    assert.deepEqual(calls[0]?.args.slice(0, 3), [
      'exec',
      '--json',
      '--ephemeral',
    ])
    assert.equal(calls[0]?.args[3], '-o')
    assert.equal(calls[0]?.args[4], '/tmp/dworks-last-message.txt')
  })

  it('classifies an empty Codex output file as extract-failure', async () => {
    const { spawn } = createSequencedSpawn([{}])
    let cleaned = false

    const result = await callLlmCli({
      provider: 'codex',
      systemPrompt: 'system',
      userPrompt: 'user',
      spawnImpl: spawn,
      prepareOutputFileImpl: async () => ({
        path: '/tmp/empty-last-message.txt',
        cleanup: async () => {
          cleaned = true
        },
      }),
      readOutputFileImpl: async () => '   ',
    })

    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.kind, 'extract-failure')
    }
    assert.equal(cleaned, true)
  })

  it('classifies Codex output file read failures as extract-failure', async () => {
    const { spawn } = createSequencedSpawn([{}])

    const result = await callLlmCli({
      provider: 'codex',
      systemPrompt: 'system',
      userPrompt: 'user',
      spawnImpl: spawn,
      prepareOutputFileImpl: async () => ({
        path: '/tmp/missing-last-message.txt',
        cleanup: async () => {},
      }),
      readOutputFileImpl: async () => {
        throw new Error('missing output file')
      },
    })

    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.kind, 'extract-failure')
      assert.match(result.message, /missing output file/)
    }
  })

  it('falls back to the next provider after Codex extract-failure', async () => {
    const { calls, spawn } = createSequencedSpawn([
      {},
      { stdout: '{"from":"gemini"}' },
    ])

    const result = await callLlmChain({
      chain: ['codex', 'gemini'],
      systemPrompt: 'system',
      userPrompt: 'user',
      spawnImpl: spawn,
      prepareOutputFileImpl: async () => ({
        path: '/tmp/empty-last-message.txt',
        cleanup: async () => {},
      }),
      readOutputFileImpl: async () => '',
    })

    assert.equal(result.attempts.length, 2)
    assert.equal(result.attempts[0]?.provider, 'codex')
    assert.equal(result.attempts[0]?.result.ok, false)
    if (result.attempts[0]?.result.ok === false) {
      assert.equal(result.attempts[0].result.kind, 'extract-failure')
    }
    assert.equal(result.final?.provider, 'gemini')
    assert.equal(result.final?.result.ok, true)
    if (result.final?.result.ok) {
      assert.equal(result.final.result.stdout, '{"from":"gemini"}')
    }
    assert.deepEqual(
      calls.map((call) => call.command),
      ['codex', 'gemini'],
    )
  })
})
