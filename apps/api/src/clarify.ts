// POST /clarify 핸들러 — m3-generate-clarify.
// 사용자 초기 의도 → LLM → 적응형 질문 3~6개 (single / multi / text).

import { z } from 'zod'

import { CLARIFY_QUESTIONS_SYSTEM_PROMPT } from '@dworks/llm-prompts'

import {
  callLlmChain,
  resolveProviderChain,
  type LlmProvider,
  type SpawnLike,
} from './llm.js'

export const clarifyRequestSchema = z.object({
  intent: z.string().trim().min(1).max(500),
})
export type ClarifyRequest = z.infer<typeof clarifyRequestSchema>

export const clarifyQuestionSchema = z
  .object({
    id: z.string().min(1).max(40),
    label: z.string().min(1).max(120),
    type: z.enum(['single', 'multi', 'text']),
    options: z.array(z.string().min(1).max(40)).min(2).max(6).optional(),
    hint: z.string().max(120).optional(),
  })
  .refine(
    (question) =>
      question.type === 'text'
        ? question.options === undefined
        : question.options !== undefined,
    {
      message: 'single/multi 질문에는 options 2~6개가 필수입니다.',
    },
  )
export type ClarifyQuestion = z.infer<typeof clarifyQuestionSchema>

export const clarifyResponseSchema = z.object({
  questions: z.array(clarifyQuestionSchema).min(3).max(6),
})
export type ClarifyResponse = z.infer<typeof clarifyResponseSchema>

export type ClarifyErrorKind =
  | 'invalid-request'
  | 'cli-unavailable'
  | 'cli-failure'
  | 'cli-timeout'
  | 'parse-failure'
  | 'schema-failure'

export interface ClarifySuccess {
  status: 200
  body: {
    questions: ClarifyQuestion[]
    model: LlmProvider
    latencyMs: number
  }
}

export interface ClarifyError {
  status: 400 | 422 | 502
  body: {
    error: ClarifyErrorKind
    message: string
  }
}

export type ClarifyResult = ClarifySuccess | ClarifyError

export interface ClarifyDeps {
  spawnImpl?: SpawnLike
  command?: string
  timeoutMs?: number
  providerChain?: readonly LlmProvider[]
}

/**
 * POST /clarify 처리. Framework-agnostic.
 */
export async function handleClarify(
  rawBody: unknown,
  deps: ClarifyDeps = {},
): Promise<ClarifyResult> {
  const parsed = clarifyRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: '의도(intent 1~500자)가 필요합니다.',
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
    systemPrompt: CLARIFY_QUESTIONS_SYSTEM_PROMPT,
    userPrompt: parsed.data.intent,
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
          message: '질문 생성이 시간 안에 도착하지 않았습니다.',
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
        message: '질문 생성 호출에 실패했습니다.',
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

  const responseParse = clarifyResponseSchema.safeParse(json)
  if (!responseParse.success) {
    return {
      status: 422,
      body: {
        error: 'schema-failure',
        message: 'LLM 응답이 질문 스키마를 만족하지 않습니다.',
      },
    }
  }

  return {
    status: 200,
    body: {
      questions: responseParse.data.questions,
      model: final.provider,
      latencyMs: final.result.latencyMs,
    },
  }
}
