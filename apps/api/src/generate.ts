// POST /generate 핸들러 — m3-generate-brief.
// 사용자 brief → Claude CLI → JSON → treeSchema 검증 → full Tree 반환.

import { z } from 'zod'

import {
  GENERATE_TREE_SYSTEM_PROMPT,
  formatBriefAsUserPrompt,
} from '@dworks/llm-prompts'
import { treeSchema, type Tree } from '@dworks/tree'

import {
  callLlmChain,
  resolveProviderChain,
  type LlmProvider,
  type SpawnLike,
} from './llm.js'

export const briefAnswerSchema = z.object({
  questionId: z.string().min(1).max(40),
  questionLabel: z.string().min(1).max(120),
  answer: z.union([z.string().max(500), z.array(z.string().max(40)).max(6)]),
})
export type BriefAnswer = z.infer<typeof briefAnswerSchema>

export const briefSchema = z.object({
  intent: z.string().trim().min(1).max(500),
  answers: z.array(briefAnswerSchema).max(6).optional(),
  notes: z.string().trim().max(300).optional(),
})
export type GenerateBrief = z.infer<typeof briefSchema>

const briefRequestSchema = z.object({ brief: briefSchema })
const legacyPromptRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
})

/**
 * Codex r2: { brief } primary, { prompt } deprecated → brief.intent로 매핑.
 * 후속 정리 토픽에서 legacy 제거 결정.
 */
function resolveBrief(rawBody: unknown):
  | { ok: true; brief: GenerateBrief }
  | { ok: false } {
  const briefParse = briefRequestSchema.safeParse(rawBody)
  if (briefParse.success) {
    return { ok: true, brief: briefParse.data.brief }
  }
  const legacy = legacyPromptRequestSchema.safeParse(rawBody)
  if (legacy.success) {
    return { ok: true, brief: { intent: legacy.data.prompt } }
  }
  return { ok: false }
}

export interface GenerateSuccess {
  status: 200
  body: {
    tree: Tree
    model: LlmProvider
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
  providerChain?: readonly LlmProvider[]
}

/**
 * POST /generate 처리. Framework-agnostic.
 *
 * 에러 코드:
 * - 400: brief / legacy prompt 검증 실패
 * - 502: Claude CLI 실행 실패 / 종료 코드 ≠ 0 / timeout / empty stdout
 * - 422: JSON parse 실패 또는 treeSchema 검증 실패
 *
 * raw CLI stdout/stderr는 응답에 노출하지 않는다.
 */
export async function handleGenerate(
  rawBody: unknown,
  deps: GenerateDeps = {},
): Promise<GenerateResponse> {
  const resolved = resolveBrief(rawBody)
  if (!resolved.ok) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message:
          '브리프(intent 1~500자)가 필요합니다. 선택 필드는 pageType / tones (max 3) / sections (max 6) / notes (max 300).',
      },
    }
  }

  const chain = deps.providerChain ?? resolveProviderChain()
  if (chain.length === 0) {
    return {
      status: 502,
      body: {
        error: 'cli-unavailable',
        message: 'LLM provider chain이 비어 있습니다.',
      },
    }
  }

  const { final } = await callLlmChain({
    chain,
    systemPrompt: GENERATE_TREE_SYSTEM_PROMPT,
    userPrompt: formatBriefAsUserPrompt(resolved.brief),
    spawnImpl: deps.spawnImpl,
    command: deps.command,
    timeoutMs: deps.timeoutMs,
  })

  if (final === null || !final.result.ok) {
    const lastKind = final?.result.ok === false ? final.result.kind : undefined
    if (lastKind === 'timeout') {
      return {
        status: 502,
        body: {
          error: 'cli-timeout',
          message: 'LLM 응답이 시간 안에 도착하지 않았습니다.',
        },
      }
    }
    if (lastKind === 'spawn-error') {
      return {
        status: 502,
        body: {
          error: 'cli-unavailable',
          message: 'LLM CLI를 실행할 수 없습니다.',
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
    json = JSON.parse(final.result.stdout)
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
      model: final.provider,
      latencyMs: final.result.latencyMs,
    },
  }
}
