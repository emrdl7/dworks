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
import { briefAnswerSchema } from './generate.js'

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

export const clarifyTurnSchema = z.object({
  questions: z.array(clarifyQuestionSchema).min(1).max(6),
  answers: z.array(briefAnswerSchema).max(6),
})
export type ClarifyTurn = z.infer<typeof clarifyTurnSchema>

export const clarifyRequestSchema = z.object({
  intent: z.string().trim().min(1).max(500),
  history: z.array(clarifyTurnSchema).max(2).optional(),
})
export type ClarifyRequest = z.infer<typeof clarifyRequestSchema>

export const clarifyResponseFirstSchema = z.object({
  questions: z.array(clarifyQuestionSchema).min(3).max(6),
})

export const clarifyResponseFollowUpSchema = z.object({
  questions: z.array(clarifyQuestionSchema).max(3),
})

export type ClarifyResponse = z.infer<typeof clarifyResponseFirstSchema>

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
  readOutputFileImpl?: (path: string) => Promise<string>
  prepareOutputFileImpl?: () => Promise<{
    path: string
    cleanup: () => Promise<void>
  }>
}

function formatAnswer(answer: string | string[]): string {
  return Array.isArray(answer) ? answer.join(', ') : answer
}

function buildClarifyUserPrompt(
  intent: string,
  history: ClarifyTurn[] | undefined,
): string {
  if (history === undefined || history.length === 0) {
    return intent
  }

  const lines: string[] = []
  lines.push('## 의도', intent, '')
  lines.push('## 이전 turn 답변')
  history.forEach((turn, i) => {
    lines.push(`### turn ${i + 1}`)
    for (const a of turn.answers) {
      lines.push(`- ${a.questionLabel}: ${formatAnswer(a.answer)}`)
    }
    if (turn.answers.length === 0) {
      lines.push('- (답변 없음)')
    }
    lines.push('')
  })
  lines.push(
    '## 지시',
    '위 답변에서 부족한 영역만 1~3개의 추가 질문으로 보강하라.',
    '답변이 충분히 구체적이면 빈 배열 `{ "questions": [] }`를 반환하라.',
    '이전 turn에서 사용한 question id는 재사용 금지.',
  )

  return lines.join('\n')
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

  const isFollowUp =
    parsed.data.history !== undefined && parsed.data.history.length > 0

  const userPrompt = buildClarifyUserPrompt(
    parsed.data.intent,
    parsed.data.history,
  )

  const { final } = await callLlmChain({
    chain,
    systemPrompt: CLARIFY_QUESTIONS_SYSTEM_PROMPT,
    userPrompt,
    spawnImpl: deps.spawnImpl,
    command: deps.command,
    timeoutMs: deps.timeoutMs,
    readOutputFileImpl: deps.readOutputFileImpl,
    prepareOutputFileImpl: deps.prepareOutputFileImpl,
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

  const responseParse = isFollowUp
    ? clarifyResponseFollowUpSchema.safeParse(json)
    : clarifyResponseFirstSchema.safeParse(json)
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
