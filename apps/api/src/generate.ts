// POST /generate 핸들러 — m3-generate-mvp.
// 사용자 prompt → Claude CLI → JSON → treeSchema 검증 → full Tree 반환.

import { z } from 'zod'

import { GENERATE_TREE_SYSTEM_PROMPT } from '@dworks/llm-prompts'
import { treeSchema, type Tree } from '@dworks/tree'

import { callClaudeCli, type SpawnLike } from './llm.js'

export const generateRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
})
export type GenerateRequest = z.infer<typeof generateRequestSchema>

export interface GenerateSuccess {
  status: 200
  body: {
    tree: Tree
    model: 'claude'
    latencyMs: number
  }
}

export type GenerateErrorKind =
  | 'invalid-request'
  | 'cli-unavailable'
  | 'cli-failure'
  | 'cli-timeout'
  | 'parse-failure'
  | 'schema-failure'

export interface GenerateError {
  status: 400 | 422 | 502
  body: {
    error: GenerateErrorKind
    message: string
  }
}

export type GenerateResponse = GenerateSuccess | GenerateError

export interface GenerateDeps {
  spawnImpl?: SpawnLike
  command?: string
  timeoutMs?: number
}

/**
 * POST /generate 처리.
 * Hono / Express / 테스트 모두에서 호출 가능하게 framework-agnostic.
 *
 * 에러 코드 매핑:
 * - 400: prompt 검증 실패 (zod)
 * - 502: Claude CLI 실행 실패 / 종료 코드 ≠ 0 / timeout / empty stdout
 * - 422: JSON parse 실패 또는 treeSchema 검증 실패
 *
 * raw CLI stdout/stderr는 응답에 노출하지 않는다 (Codex round 2 안전 권장).
 */
export async function handleGenerate(
  rawBody: unknown,
  deps: GenerateDeps = {},
): Promise<GenerateResponse> {
  const parsed = generateRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'prompt는 1~500자 문자열이어야 합니다.',
      },
    }
  }

  const cliResult = await callClaudeCli({
    systemPrompt: GENERATE_TREE_SYSTEM_PROMPT,
    userPrompt: parsed.data.prompt,
    spawnImpl: deps.spawnImpl,
    command: deps.command,
    timeoutMs: deps.timeoutMs,
  })

  if (!cliResult.ok) {
    if (cliResult.kind === 'timeout') {
      return {
        status: 502,
        body: {
          error: 'cli-timeout',
          message: 'LLM 응답이 시간 안에 도착하지 않았습니다.',
        },
      }
    }
    if (cliResult.kind === 'spawn-error') {
      return {
        status: 502,
        body: {
          error: 'cli-unavailable',
          message: 'Claude CLI를 실행할 수 없습니다.',
        },
      }
    }
    return {
      status: 502,
      body: {
        error: 'cli-failure',
        message: 'LLM 호출에 실패했습니다.',
      },
    }
  }

  let json: unknown
  try {
    json = JSON.parse(cliResult.stdout)
  } catch {
    return {
      status: 422,
      body: {
        error: 'parse-failure',
        message: 'LLM 응답이 유효한 JSON이 아닙니다.',
      },
    }
  }

  const treeParse = treeSchema.safeParse(json)
  if (!treeParse.success) {
    return {
      status: 422,
      body: {
        error: 'schema-failure',
        message: 'LLM 응답이 트리 스키마를 만족하지 않습니다.',
      },
    }
  }

  return {
    status: 200,
    body: {
      tree: treeParse.data,
      model: 'claude',
      latencyMs: cliResult.latencyMs,
    },
  }
}
