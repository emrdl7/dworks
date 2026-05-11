// POST /generate 핸들러 — m3-generate-brief.
// 사용자 brief → Claude CLI → JSON → treeSchema 검증 → full Tree 반환.

import { z } from 'zod'

import {
  GENERATE_TREE_SYSTEM_PROMPT,
  SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT,
  availableDesignSystems,
  formatBriefAsUserPrompt,
  formatBriefForSelector,
  parseSelectorResponse,
} from '@dworks/llm-prompts'
import { treeSchema, type Tree } from '@dworks/tree'

import {
  callLlmChain,
  LLM_PROVIDER_IDS,
  resolveProviderChain,
  type LlmProvider,
  type SpawnLike,
} from './llm.js'
import { sanitizeGeneratedTreeJson } from './sanitize.js'

export const briefAnswerSchema = z.object({
  questionId: z.string().min(1).max(40),
  questionLabel: z.string().min(1).max(120),
  answer: z.union([z.string().max(500), z.array(z.string().max(40)).max(6)]),
})
export type BriefAnswer = z.infer<typeof briefAnswerSchema>

const hex6Schema = z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const imageReferenceSchema = z.object({
  colors: z.array(hex6Schema).min(1).max(5),
  aspectRatio: z.enum(['square', 'landscape', 'portrait', 'wide']).optional(),
})
export type ImageReference = z.infer<typeof imageReferenceSchema>

export const briefSchema = z.object({
  intent: z.string().trim().min(1).max(500),
  answers: z.array(briefAnswerSchema).max(6).optional(),
  notes: z.string().trim().max(300).optional(),
  imageReference: imageReferenceSchema.optional(),
  imageReferences: z.array(imageReferenceSchema).min(1).max(3).optional(),
  // Open Design 흡수 — 활성 design system id (예: 'linear-app', 'stripe', 'apple-hig').
  // 미지정시 기존 톤 매핑만 사용. 지정시 design-systems/{id}/DESIGN.md 가 prompt 에 inject.
  // 형식 가드: 소문자 영문/숫자/하이픈/언더스코어만.
  activeDesignSystem: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9][a-z0-9_-]*$/)
    .optional(),
})
export type GenerateBrief = z.infer<typeof briefSchema>

const providerChainSchema = z
  .array(z.enum(LLM_PROVIDER_IDS))
  .min(1)
  .max(3)
  .transform((providers) => [...new Set(providers)] as LlmProvider[])

const briefRequestSchema = z.object({
  brief: briefSchema,
  providers: providerChainSchema.optional(),
})
const legacyPromptRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
})

/**
 * Codex r2: { brief } primary, { prompt } deprecated → brief.intent로 매핑.
 * 후속 정리 토픽에서 legacy 제거 결정.
 */
function resolveBrief(rawBody: unknown):
  | { ok: true; brief: GenerateBrief; providerChain?: LlmProvider[] }
  | { ok: false } {
  const briefParse = briefRequestSchema.safeParse(rawBody)
  if (briefParse.success) {
    return {
      ok: true,
      brief: briefParse.data.brief,
      ...(briefParse.data.providers !== undefined
        ? { providerChain: briefParse.data.providers }
        : {}),
    }
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
    /** Open Design generation pattern — LLM 이 선택한 design system + rationale. user override 시 user picked, rationale 은 "user-override". */
    chosenDesignSystem?: {
      id: string
      rationale: string
      source: 'llm-picked' | 'user-override'
    }
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
  readOutputFileImpl?: (path: string) => Promise<string>
  prepareOutputFileImpl?: () => Promise<{
    path: string
    cleanup: () => Promise<void>
  }>
  /**
   * Open Design pattern — LLM 자동 design system 선택 활성화.
   * 기본 true. 테스트에서 deterministic mock 으로 단일 LLM 호출만 검증할 때 false.
   * brief.activeDesignSystem 이 set 되어 있으면 이 플래그와 무관하게 user-override 가 우선.
   */
  enableDesignSystemSelector?: boolean
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

  const chain = resolved.providerChain ?? deps.providerChain ?? resolveProviderChain()
  if (chain.length === 0) {
    return {
      status: 502,
      body: {
        error: 'cli-unavailable',
        message: 'LLM provider chain이 비어 있습니다.',
      },
    }
  }

  // Open Design pattern — design system 자동 선택 (brief.activeDesignSystem 미지정시).
  // user 가 override 한 경우 (PaletteManager / 디버그) source: 'user-override'.
  // 테스트 환경 / 명시적 비활성화 시 selector skip (mock LLM 이 단일 호출 가정).
  const selectorEnabled =
    deps.enableDesignSystemSelector ?? process.env.NODE_ENV !== 'test'
  let chosenDesignSystem: GenerateSuccess['body']['chosenDesignSystem']
  if (
    resolved.brief.activeDesignSystem !== undefined &&
    resolved.brief.activeDesignSystem.length > 0
  ) {
    chosenDesignSystem = {
      id: resolved.brief.activeDesignSystem,
      rationale: '사용자가 직접 지정',
      source: 'user-override',
    }
  } else if (selectorEnabled) {
    const selected = await selectDesignSystemViaLlm(resolved.brief, chain, deps)
    if (selected !== null) {
      // brief 에 자동 inject — formatBriefAsUserPrompt 가 DESIGN.md 를 prompt 에 추가
      resolved.brief.activeDesignSystem = selected.chosenSystem
      chosenDesignSystem = {
        id: selected.chosenSystem,
        rationale: selected.rationale,
        source: 'llm-picked',
      }
    }
    // selector 실패시 chosenDesignSystem 은 undefined — 기존 톤 매핑으로 fallback
  }

  const userPrompt = formatBriefAsUserPrompt(resolved.brief)

  async function runOnce(): Promise<GenerateResponse> {
    const { final } = await callLlmChain({
      chain,
      systemPrompt: GENERATE_TREE_SYSTEM_PROMPT,
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

    const sanitizedJson = sanitizeGeneratedTreeJson(json)
    const treeParse = treeSchema.safeParse(sanitizedJson)
    if (!treeParse.success) {
      if (process.env.DWORKS_DEBUG_SCHEMA === '1') {
        console.error(
          '[dworks-api] schema-failure issues:',
          JSON.stringify(treeParse.error.issues.slice(0, 8), null, 2),
        )
        const rawHead = JSON.stringify(json).slice(0, 1500)
        const sanitizedHead = JSON.stringify(sanitizedJson).slice(0, 1500)
        console.error('[dworks-api] schema-failure raw json (head):', rawHead)
        console.error(
          '[dworks-api] schema-failure sanitized json (head):',
          sanitizedHead,
        )
      }
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
        ...(chosenDesignSystem !== undefined
          ? { chosenDesignSystem }
          : {}),
      },
    }
  }

  const defaultRetries = process.env.NODE_ENV === 'test' ? '0' : '1'
  const rawRetries = Number(
    process.env.DWORKS_GENERATE_RETRIES ?? defaultRetries,
  )
  const maxRetries =
    Number.isFinite(rawRetries) && rawRetries >= 0 ? rawRetries : 1

  let result = await runOnce()
  let attempts = 0
  while (
    result.status === 422 &&
    (result.body.error === 'parse-failure' ||
      result.body.error === 'schema-failure') &&
    attempts < maxRetries
  ) {
    attempts += 1
    if (process.env.DWORKS_DEBUG_SCHEMA === '1') {
      console.error(
        `[dworks-api] retry ${attempts}/${maxRetries} after ${result.body.error}`,
      )
    }
    result = await runOnce()
  }
  return result
}

/**
 * Selector LLM 호출 — brief + clarify 답변 → catalog 에서 시스템 1개 선택.
 *
 * 실패시 null 반환 (selector 가 죽어도 generation 은 진행). 기존 톤 매핑 fallback.
 * - LLM 응답 JSON parse 실패 → null
 * - chosenSystem 이 catalog 에 없는 id → null
 * - LLM call 자체 실패 → null
 *
 * Catalog 은 SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT 안에 _system prompt_ 로 inject 되어
 * 매 호출마다 user message 가 작아 cache 친화적. 한국어 mandate.
 */
async function selectDesignSystemViaLlm(
  brief: GenerateBrief,
  chain: readonly LlmProvider[],
  deps: GenerateDeps,
): Promise<{ chosenSystem: string; rationale: string } | null> {
  try {
    const selectorUserPrompt = formatBriefForSelector({
      intent: brief.intent,
      answers: brief.answers,
      notes: brief.notes,
    })
    const { final } = await callLlmChain({
      chain,
      systemPrompt: SELECT_DESIGN_SYSTEM_SYSTEM_PROMPT,
      userPrompt: selectorUserPrompt,
      spawnImpl: deps.spawnImpl,
      command: deps.command,
      timeoutMs: deps.timeoutMs,
      readOutputFileImpl: deps.readOutputFileImpl,
      prepareOutputFileImpl: deps.prepareOutputFileImpl,
    })
    if (final === null || !final.result.ok) {
      if (process.env.DWORKS_DEBUG_SCHEMA === '1') {
        console.error('[dworks-api] selector call failed')
      }
      return null
    }
    const parsed = parseSelectorResponse(final.result.stdout)
    if (parsed === null) {
      if (process.env.DWORKS_DEBUG_SCHEMA === '1') {
        console.error(
          '[dworks-api] selector JSON parse failed:',
          final.result.stdout.slice(0, 200),
        )
      }
      return null
    }
    // catalog 에 실제로 존재하는 id 인지 검증 (LLM hallucination 방어)
    const validIds = new Set(availableDesignSystems())
    if (!validIds.has(parsed.chosenSystem)) {
      if (process.env.DWORKS_DEBUG_SCHEMA === '1') {
        console.error(
          '[dworks-api] selector returned unknown system:',
          parsed.chosenSystem,
        )
      }
      return null
    }
    return parsed
  } catch (error) {
    if (process.env.DWORKS_DEBUG_SCHEMA === '1') {
      console.error('[dworks-api] selector exception:', error)
    }
    return null
  }
}
