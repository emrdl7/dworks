// LLM CLI 어댑터 (m3-generate-mvp + m3-generate-fallback + m3-generate-codex-adapter).
// D12 LLM 정책 — 1순위 Claude → 2순위 Codex → 3순위 Gemini fallback chain.
// spawn 함수는 주입 가능하게 분리해 unit test mock.

import { spawn as defaultSpawn, type SpawnOptions } from 'node:child_process'
import { mkdtemp, readFile as fsReadFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface SpawnLike {
  (
    command: string,
    args: readonly string[],
    options?: SpawnOptions,
  ): import('node:child_process').ChildProcess
}

export const LLM_PROVIDER_IDS = ['claude', 'codex', 'gemini'] as const
export type LlmProvider = (typeof LLM_PROVIDER_IDS)[number]
const LLM_PROVIDER_SET = new Set<string>(LLM_PROVIDER_IDS)
const DEFAULT_LLM_CHAIN: readonly LlmProvider[] = LLM_PROVIDER_IDS

/**
 * env DWORKS_LLM_PROVIDERS (콤마 구분) 또는 기본 chain을 정렬.
 * - unknown 값 무시
 * - 공백 trim
 * - 중복 제거 (첫 번째 유지)
 * - 결과 빈 배열이면 빈 배열 반환 (호출자가 502로 처리)
 */
export function resolveProviderChain(
  raw: string | undefined = process.env.DWORKS_LLM_PROVIDERS,
): LlmProvider[] {
  if (raw === undefined) {
    return [...DEFAULT_LLM_CHAIN]
  }
  const seen = new Set<string>()
  const chain: LlmProvider[] = []
  for (const part of raw.split(',')) {
    const trimmed = part.trim()
    if (trimmed.length === 0) continue
    if (!LLM_PROVIDER_SET.has(trimmed)) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    chain.push(trimmed as LlmProvider)
  }
  return chain
}

interface ProviderInvocation {
  command: string
  args: readonly string[]
  /** Codex가 마지막 assistant message를 쓰는 임시 파일. 정의되면 stdout 대신 파일 내용을 결과로 사용. */
  outputFile?: string
}

/**
 * provider별 CLI 명령/인자 매핑.
 * - Claude: `claude -p <user> --system-prompt <system>` headless. stdout primary.
 * - Codex: `codex exec --json --ephemeral -o <tempfile> <combined>` — 마지막 메시지를 파일로 회수
 *   (Codex r2 권장, judge.ts callCodex 패턴과 동일).
 * - Gemini: `gemini -p ...` stdout. envelope 정밀 매핑은 m3-generate-gemini-adapter 후속.
 */
function getProviderInvocation(
  provider: LlmProvider,
  systemPrompt: string,
  userPrompt: string,
  outputFile?: string,
): ProviderInvocation {
  switch (provider) {
    case 'claude':
      return {
        command: 'claude',
        args: ['-p', userPrompt, '--system-prompt', systemPrompt],
      }
    case 'codex': {
      const combined = `${systemPrompt}\n\n---\n\n${userPrompt}`
      const args: string[] = ['exec', '--json', '--ephemeral']
      if (outputFile !== undefined) {
        args.push('-o', outputFile)
      }
      args.push(combined)
      return { command: 'codex', args, outputFile }
    }
    case 'gemini':
      return {
        command: 'gemini',
        args: ['-p', `${systemPrompt}\n\n---\n\n${userPrompt}`],
      }
  }
}

export type ClaudeCliFailureKind =
  | 'spawn-error'
  | 'non-zero-exit'
  | 'timeout'
  | 'empty-output'
  /** Codex tempfile 누락 / empty / read 실패. transport-adapter 실패 — chain에서 다음 provider 시도 (Codex r2 권장). */
  | 'extract-failure'

export interface ClaudeCliSuccess {
  ok: true
  stdout: string
  latencyMs: number
}

export interface ClaudeCliFailure {
  ok: false
  kind: ClaudeCliFailureKind
  message: string
  latencyMs: number
}

export type ClaudeCliResult = ClaudeCliSuccess | ClaudeCliFailure

export interface ClaudeCliOptions {
  systemPrompt: string
  userPrompt: string
  timeoutMs?: number
  spawnImpl?: SpawnLike
  command?: string
}

export interface LlmCliOptions {
  provider: LlmProvider
  systemPrompt: string
  userPrompt: string
  timeoutMs?: number
  spawnImpl?: SpawnLike
  /** 테스트 / env override용. 미지정 시 provider 기본 명령. */
  command?: string
  /** Codex outputFile 읽기 주입 (테스트). 미지정 시 fs/promises.readFile. */
  readOutputFileImpl?: (path: string) => Promise<string>
  /** Codex tempfile 생성 주입 (테스트). 미지정 시 mkdtemp + rm in tmpdir. */
  prepareOutputFileImpl?: () => Promise<{
    path: string
    cleanup: () => Promise<void>
  }>
}

const DEFAULT_TIMEOUT_MS = 30_000

/**
 * provider별 LLM CLI에 system + user prompt를 보내고 stdout을 회수한다.
 *
 * 실패 분류:
 * - spawn-error: 실행 자체 실패 (CLI 미설치 등)
 * - non-zero-exit: CLI 종료 코드 ≠ 0
 * - timeout: timeoutMs 초과
 * - empty-output: stdout 비어있음
 *
 * 호출자는 stdout을 받은 뒤 별도로 JSON parse + schema 검증을 수행한다.
 */
export function callLlmCli(options: LlmCliOptions): Promise<ClaudeCliResult> {
  const {
    provider,
    systemPrompt,
    userPrompt,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    spawnImpl = defaultSpawn as SpawnLike,
    command,
    readOutputFileImpl,
    prepareOutputFileImpl,
  } = options
  return runProvider({
    provider,
    systemPrompt,
    userPrompt,
    timeoutMs,
    spawnImpl,
    command,
    readOutputFileImpl,
    prepareOutputFileImpl,
  })
}

interface RunProviderInput {
  provider: LlmProvider
  systemPrompt: string
  userPrompt: string
  timeoutMs: number
  spawnImpl: SpawnLike
  command?: string
  readOutputFileImpl?: (path: string) => Promise<string>
  prepareOutputFileImpl?: () => Promise<{
    path: string
    cleanup: () => Promise<void>
  }>
}

async function defaultPrepareOutputFile(): Promise<{
  path: string
  cleanup: () => Promise<void>
}> {
  const dir = await mkdtemp(join(tmpdir(), 'dworks-codex-'))
  return {
    path: join(dir, 'last-message.txt'),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  }
}

async function runProvider(input: RunProviderInput): Promise<ClaudeCliResult> {
  const startedAt = Date.now()
  const usesOutputFile = input.provider === 'codex'
  let outputFilePath: string | undefined
  let cleanupOutputFile: (() => Promise<void>) | undefined
  if (usesOutputFile) {
    try {
      const prepared = await (input.prepareOutputFileImpl ?? defaultPrepareOutputFile)()
      outputFilePath = prepared.path
      cleanupOutputFile = prepared.cleanup
    } catch (err) {
      return {
        ok: false,
        kind: 'extract-failure',
        message: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - startedAt,
      }
    }
  }

  const invocation = getProviderInvocation(
    input.provider,
    input.systemPrompt,
    input.userPrompt,
    outputFilePath,
  )
  const resolvedCommand = input.command ?? invocation.command

  try {
    const spawnResult = await runSpawnedProcess({
      command: resolvedCommand,
      args: invocation.args,
      provider: input.provider,
      timeoutMs: input.timeoutMs,
      spawnImpl: input.spawnImpl,
      startedAt,
      allowEmptyStdout: outputFilePath !== undefined,
    })
    if (!spawnResult.ok) {
      return spawnResult
    }
    if (outputFilePath !== undefined) {
      const reader = input.readOutputFileImpl ?? ((p) => fsReadFile(p, 'utf8'))
      try {
        const fileContent = await reader(outputFilePath)
        const trimmed = fileContent.trim()
        if (trimmed.length === 0) {
          return {
            ok: false,
            kind: 'extract-failure',
            message: `${input.provider} 출력 파일이 비어 있음`,
            latencyMs: Date.now() - startedAt,
          }
        }
        return { ok: true, stdout: trimmed, latencyMs: spawnResult.latencyMs }
      } catch (err) {
        return {
          ok: false,
          kind: 'extract-failure',
          message: err instanceof Error ? err.message : String(err),
          latencyMs: Date.now() - startedAt,
        }
      }
    }
    return spawnResult
  } finally {
    if (cleanupOutputFile !== undefined) {
      try {
        await cleanupOutputFile()
      } catch {
        // best effort
      }
    }
  }
}

interface RunSpawnedProcessInput {
  command: string
  args: readonly string[]
  provider: LlmProvider
  timeoutMs: number
  spawnImpl: SpawnLike
  startedAt: number
  /** true면 stdout 비어있어도 'empty-output'로 처리하지 않고 success 반환 (codex outputFile 등). */
  allowEmptyStdout?: boolean
}

function runSpawnedProcess(
  input: RunSpawnedProcessInput,
): Promise<ClaudeCliResult> {
  return new Promise((resolve) => {
    let child: ReturnType<SpawnLike>
    try {
      child = input.spawnImpl(input.command, input.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (err) {
      resolve({
        ok: false,
        kind: 'spawn-error',
        message: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - input.startedAt,
      })
      return
    }

    let stdout = ''
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try {
        child.kill('SIGTERM')
      } catch {
        // ignore
      }
      resolve({
        ok: false,
        kind: 'timeout',
        message: `${input.provider} CLI 응답이 ${input.timeoutMs}ms 안에 도착하지 않음`,
        latencyMs: Date.now() - input.startedAt,
      })
    }, input.timeoutMs)

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    })

    child.on('error', (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({
        ok: false,
        kind: 'spawn-error',
        message: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - input.startedAt,
      })
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const latencyMs = Date.now() - input.startedAt
      if (code !== 0) {
        resolve({
          ok: false,
          kind: 'non-zero-exit',
          message: `${input.provider} CLI 종료 코드 ${code}`,
          latencyMs,
        })
        return
      }
      const trimmed = stdout.trim()
      if (trimmed.length === 0 && input.allowEmptyStdout !== true) {
        resolve({
          ok: false,
          kind: 'empty-output',
          message: `${input.provider} CLI 응답이 비어 있음`,
          latencyMs,
        })
        return
      }
      resolve({ ok: true, stdout: trimmed, latencyMs })
    })
  })
}

/**
 * 후방 호환 — 기존 호출자가 callClaudeCli({ ... }) 형태로 사용. provider 'claude' 고정.
 */
export function callClaudeCli(options: ClaudeCliOptions): Promise<ClaudeCliResult> {
  return callLlmCli({ provider: 'claude', ...options })
}

export interface ChainAttempt {
  provider: LlmProvider
  result: ClaudeCliResult
}

/**
 * resolveProviderChain()으로 얻은 chain을 순서대로 시도. 첫 성공 시 반환,
 * 모두 실패 시 마지막 실패와 시도 목록 반환.
 *
 * spawn-error / non-zero-exit / timeout / empty-output → 다음 provider.
 * (parse / schema 실패는 호출자가 stdout 받은 뒤 별도 판정 — 이 함수는 transport만.)
 */
export async function callLlmChain(
  options: Omit<LlmCliOptions, 'provider'> & { chain: readonly LlmProvider[] },
): Promise<{
  attempts: ChainAttempt[]
  final: ChainAttempt | null
}> {
  const attempts: ChainAttempt[] = []
  for (const provider of options.chain) {
    const result = await callLlmCli({ ...options, provider })
    attempts.push({ provider, result })
    if (result.ok) {
      return { attempts, final: { provider, result } }
    }
  }
  const last = attempts[attempts.length - 1] ?? null
  return { attempts, final: last }
}
