// Claude Code CLI 어댑터 (m3-generate-mvp).
// D12 LLM 정책 — 1순위 Claude CLI. spawn 함수는 주입 가능하게 분리해 unit test mock.

import { spawn as defaultSpawn, type SpawnOptions } from 'node:child_process'

export interface SpawnLike {
  (
    command: string,
    args: readonly string[],
    options?: SpawnOptions,
  ): import('node:child_process').ChildProcess
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

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_COMMAND = 'claude'

/**
 * Claude Code CLI에 system + user prompt를 보내고 stdout을 회수한다.
 * `claude -p "<user>"` headless 모드 + `--system-prompt` 플래그.
 *
 * 실패 분류:
 * - spawn-error: 실행 자체 실패 (CLI 미설치 등)
 * - non-zero-exit: CLI 종료 코드 ≠ 0
 * - timeout: timeoutMs 초과
 * - empty-output: stdout 비어있음
 *
 * 호출자는 stdout을 받은 뒤 별도로 JSON parse + schema 검증을 수행한다.
 */
export function callClaudeCli(options: ClaudeCliOptions): Promise<ClaudeCliResult> {
  const {
    systemPrompt,
    userPrompt,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    spawnImpl = defaultSpawn,
    command = DEFAULT_COMMAND,
  } = options
  const startedAt = Date.now()

  return new Promise((resolve) => {
    let child: ReturnType<SpawnLike>
    try {
      child = spawnImpl(
        command,
        ['-p', userPrompt, '--system-prompt', systemPrompt],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      )
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
        message: `Claude CLI 응답이 ${timeoutMs}ms 안에 도착하지 않음`,
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
          message: `Claude CLI 종료 코드 ${code}`,
          latencyMs,
        })
        return
      }
      const trimmed = stdout.trim()
      if (trimmed.length === 0) {
        resolve({
          ok: false,
          kind: 'empty-output',
          message: 'Claude CLI 응답이 비어 있음',
          latencyMs,
        })
        return
      }
      resolve({ ok: true, stdout: trimmed, latencyMs })
    })
  })
}
