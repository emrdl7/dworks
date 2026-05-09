// 생성 결과물 휘발 방지 — page reload / 탭 닫기 시 generations + brief + clarify 상태 보존.
// localStorage 기반 단일 키, version-prefixed schema. Tree는 treeSchema로 재검증.
//
// 주의:
// - 'use client' 컴포넌트에서만 사용. SSR 환경에서는 typeof window 가드.
// - QuotaExceeded 시 mutable generation들만 제거하고 immutable + brief는 유지.
// - schema mismatch / corrupt JSON 은 조용히 무시하고 default 상태로 시작.

import { treeSchema, type Tree } from '@dworks/tree'

const STORAGE_KEY = 'dworks:m3-generate:v1'
const STORAGE_VERSION = 1

export type GenerationModelId = 'claude' | 'codex' | 'gemini' | null
export type GenerateStage = 'intent' | 'questions'
export type VariantCount = 1 | 2 | 3

export interface PersistedClarifyQuestion {
  id: string
  label: string
  type: 'single' | 'multi' | 'text'
  options?: string[]
  hint?: string
}

export interface PersistedBriefAnswer {
  questionId: string
  questionLabel: string
  answer: string | string[]
}

export interface PersistedClarifyTurn {
  questions: PersistedClarifyQuestion[]
  answers: PersistedBriefAnswer[]
}

export interface PersistedGenerationEntry {
  id: string
  label: string
  tree: Tree
  immutable: boolean
  brief: {
    intent: string
    answers?: PersistedBriefAnswer[]
    notes?: string
  } | null
  questions: PersistedClarifyQuestion[]
  clarifyTurns: PersistedClarifyTurn[]
  createdAt: number
  latencyMs: number | null
  model: GenerationModelId
}

export interface PersistedGenerationState {
  version: typeof STORAGE_VERSION
  fixtureId: string
  generations: PersistedGenerationEntry[]
  activeGenerationId: string
  brief: {
    intent: string
    notes: string
    variantCount: VariantCount
    answers: Record<string, string | string[]>
    questions: PersistedClarifyQuestion[]
  }
  clarify: {
    turns: PersistedClarifyTurn[]
    complete: boolean
    stage: GenerateStage
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readPersistedGenerationState(): PersistedGenerationState | null {
  if (!isBrowser()) return null

  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null || raw.length === 0) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    clearPersistedGenerationState()
    return null
  }

  const state = validatePersistedState(parsed)
  if (state === null) {
    clearPersistedGenerationState()
    return null
  }
  return state
}

export function writePersistedGenerationState(
  state: PersistedGenerationState,
): void {
  if (!isBrowser()) return

  const payload = JSON.stringify(state)
  try {
    window.localStorage.setItem(STORAGE_KEY, payload)
  } catch {
    // QuotaExceeded 또는 보안 차단 시 mutable generations 줄여 한번 더 시도.
    const trimmed: PersistedGenerationState = {
      ...state,
      generations: state.generations.filter((entry) => entry.immutable),
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // 두 번째 실패는 조용히 포기 — 다음 변경에 다시 시도된다.
    }
  }
}

export function clearPersistedGenerationState(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// -----------------------------------------------------------------------------
// 검증 헬퍼 — 외부 노출 X. 형 검사 + Tree schema 검증.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null
  return value
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asAnswerValue(value: unknown): string | string[] | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.every((part) => typeof part === 'string')) {
    return [...value]
  }
  return null
}

function validateClarifyQuestion(
  raw: unknown,
): PersistedClarifyQuestion | null {
  if (!isPlainObject(raw)) return null
  const id = asNonEmptyString(raw.id)
  const label = asNonEmptyString(raw.label)
  if (id === null || label === null) return null
  const type = raw.type
  if (type !== 'single' && type !== 'multi' && type !== 'text') return null

  const result: PersistedClarifyQuestion = { id, label, type }
  if (Array.isArray(raw.options)) {
    const options = raw.options.filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    )
    if (options.length > 0) result.options = options
  }
  const hint = typeof raw.hint === 'string' ? raw.hint : undefined
  if (hint !== undefined) result.hint = hint
  return result
}

function validateClarifyQuestions(
  raw: unknown,
): PersistedClarifyQuestion[] | null {
  if (!Array.isArray(raw)) return null
  const out: PersistedClarifyQuestion[] = []
  for (const item of raw) {
    const question = validateClarifyQuestion(item)
    if (question === null) return null
    out.push(question)
  }
  return out
}

function validateBriefAnswer(raw: unknown): PersistedBriefAnswer | null {
  if (!isPlainObject(raw)) return null
  const questionId = asNonEmptyString(raw.questionId)
  const questionLabel = asNonEmptyString(raw.questionLabel)
  const answer = asAnswerValue(raw.answer)
  if (questionId === null || questionLabel === null || answer === null) {
    return null
  }
  return { questionId, questionLabel, answer }
}

function validateBriefAnswers(raw: unknown): PersistedBriefAnswer[] | null {
  if (!Array.isArray(raw)) return null
  const out: PersistedBriefAnswer[] = []
  for (const item of raw) {
    const answer = validateBriefAnswer(item)
    if (answer === null) return null
    out.push(answer)
  }
  return out
}

function validateClarifyTurn(raw: unknown): PersistedClarifyTurn | null {
  if (!isPlainObject(raw)) return null
  const questions = validateClarifyQuestions(raw.questions)
  const answers = validateBriefAnswers(raw.answers)
  if (questions === null || answers === null) return null
  return { questions, answers }
}

function validateClarifyTurns(raw: unknown): PersistedClarifyTurn[] | null {
  if (!Array.isArray(raw)) return null
  const out: PersistedClarifyTurn[] = []
  for (const item of raw) {
    const turn = validateClarifyTurn(item)
    if (turn === null) return null
    out.push(turn)
  }
  return out
}

function validateGenerationEntry(
  raw: unknown,
): PersistedGenerationEntry | null {
  if (!isPlainObject(raw)) return null
  const id = asNonEmptyString(raw.id)
  const label = asNonEmptyString(raw.label)
  const immutable = asBoolean(raw.immutable)
  const createdAt = asFiniteNumber(raw.createdAt)
  if (id === null || label === null || immutable === null || createdAt === null) {
    return null
  }
  const treeParse = treeSchema.safeParse(raw.tree)
  if (!treeParse.success) return null
  const questions = validateClarifyQuestions(raw.questions)
  if (questions === null) return null
  const clarifyTurns = validateClarifyTurns(raw.clarifyTurns)
  if (clarifyTurns === null) return null

  let brief: PersistedGenerationEntry['brief'] = null
  if (raw.brief !== null && raw.brief !== undefined) {
    if (!isPlainObject(raw.brief)) return null
    const intent = asNonEmptyString(raw.brief.intent)
    if (intent === null) return null
    const briefAnswers =
      raw.brief.answers === undefined
        ? undefined
        : validateBriefAnswers(raw.brief.answers)
    if (briefAnswers === null) return null
    const notes = typeof raw.brief.notes === 'string' ? raw.brief.notes : undefined
    brief = {
      intent,
      ...(briefAnswers !== undefined ? { answers: briefAnswers } : {}),
      ...(notes !== undefined ? { notes } : {}),
    }
  }

  let latencyMs: number | null = null
  if (raw.latencyMs !== null && raw.latencyMs !== undefined) {
    const value = asFiniteNumber(raw.latencyMs)
    if (value === null) return null
    latencyMs = value
  }

  let model: GenerationModelId = null
  if (raw.model !== null && raw.model !== undefined) {
    if (raw.model !== 'claude' && raw.model !== 'codex' && raw.model !== 'gemini') {
      return null
    }
    model = raw.model
  }

  return {
    id,
    label,
    tree: treeParse.data,
    immutable,
    brief,
    questions,
    clarifyTurns,
    createdAt,
    latencyMs,
    model,
  }
}

function validateAnswerRecord(
  raw: unknown,
): Record<string, string | string[]> | null {
  if (!isPlainObject(raw)) return null
  const out: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(raw)) {
    const answer = asAnswerValue(value)
    if (answer === null) return null
    out[key] = answer
  }
  return out
}

function validatePersistedState(
  raw: unknown,
): PersistedGenerationState | null {
  if (!isPlainObject(raw)) return null
  if (raw.version !== STORAGE_VERSION) return null

  const fixtureId = asNonEmptyString(raw.fixtureId)
  if (fixtureId === null) return null

  if (!Array.isArray(raw.generations)) return null
  const generations: PersistedGenerationEntry[] = []
  for (const item of raw.generations) {
    const entry = validateGenerationEntry(item)
    if (entry === null) return null
    generations.push(entry)
  }
  if (generations.length === 0) return null

  const activeGenerationId = asNonEmptyString(raw.activeGenerationId)
  if (activeGenerationId === null) return null
  if (!generations.some((entry) => entry.id === activeGenerationId)) return null

  if (!isPlainObject(raw.brief)) return null
  const briefIntent = typeof raw.brief.intent === 'string' ? raw.brief.intent : null
  const briefNotes = typeof raw.brief.notes === 'string' ? raw.brief.notes : null
  if (briefIntent === null || briefNotes === null) return null
  const variantCount = raw.brief.variantCount
  if (variantCount !== 1 && variantCount !== 2 && variantCount !== 3) return null
  const briefAnswers = validateAnswerRecord(raw.brief.answers)
  if (briefAnswers === null) return null
  const briefQuestions = validateClarifyQuestions(raw.brief.questions)
  if (briefQuestions === null) return null

  if (!isPlainObject(raw.clarify)) return null
  const clarifyTurns = validateClarifyTurns(raw.clarify.turns)
  if (clarifyTurns === null) return null
  const complete = asBoolean(raw.clarify.complete)
  if (complete === null) return null
  const stage = raw.clarify.stage
  if (stage !== 'intent' && stage !== 'questions') return null

  return {
    version: STORAGE_VERSION,
    fixtureId,
    generations,
    activeGenerationId,
    brief: {
      intent: briefIntent,
      notes: briefNotes,
      variantCount,
      answers: briefAnswers,
      questions: briefQuestions,
    },
    clarify: {
      turns: clarifyTurns,
      complete,
      stage,
    },
  }
}
