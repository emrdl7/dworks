// LLM CLI 어댑터 (m3-generate-mvp + m3-generate-fallback).
// D12 LLM 정책 — 1순위 Claude → 2순위 Codex → 3순위 Gemini fallback chain.
// spawn 함수는 주입 가능하게 분리해 unit test mock.

import { spawn as defaultSpawn, type SpawnOptions } from 'node:child_process'

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
}

/**
 * provider별 CLI 명령/인자 매핑. 1차는 Claude만 정밀, Codex/Gemini는 stub.
 * - Codex: `codex exec --json --ephemeral` + system+user를 단일 prompt로 결합
 *   (실제 envelope 매핑은 후속 m3-generate-codex-adapter)
 * - Gemini: `gemini -p ...` (실제 호출 검증은 후속 m3-generate-gemini-adapter)
 */
function getProviderInvocation(
  provider: LlmProvider,
  systemPrompt: string,
  userPrompt: string,
): ProviderInvocation {
  switch (provider) {
    case 'claude':
      return {
        command: 'claude',
        args: ['-p', userPrompt, '--system-prompt', systemPrompt],
      }
    case 'codex':
      return {
        command: 'codex',
        args: [
          'exec',
          '--json',
          '--ephemeral',
          `${systemPrompt}\n\n---\n\n${userPrompt}`,
        ],
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
    spawnImpl = defaultSpawn,
    command,
  } = options
  const invocation = getProviderInvocation(provider, systemPrompt, userPrompt)
  const resolvedCommand = command ?? invocation.command
  const startedAt = Date.now()

  return new Promise((resolve) => {
    let child: ReturnType<SpawnLike>
    try {
      child = spawnImpl(resolvedCommand, invocation.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (err) {
      resolve({
        ok: false,
        kind: 'spawn-error',
        message: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - startedAt,
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
        // ignore — child may already be gone
      }
      resolve({
        ok: false,
        kind: 'timeout',
        message: `${provider} CLI 응답이 ${timeoutMs}ms 안에 도착하지 않음`,
        latencyMs: Date.now() - startedAt,
      })
    }, timeoutMs)

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
        latencyMs: Date.now() - startedAt,
      })
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const latencyMs = Date.now() - startedAt
      if (code !== 0) {
        resolve({
          ok: false,
          kind: 'non-zero-exit',
          message: `${provider} CLI 종료 코드 ${code}`,
          latencyMs,
        })
        return
      }
      const trimmed = stdout.trim()
      if (trimmed.length === 0) {
        resolve({
          ok: false,
          kind: 'empty-output',
          message: `${provider} CLI 응답이 비어 있음`,
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
