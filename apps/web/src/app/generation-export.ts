// 단일 generation 파일 내보내기/가져오기 — m3-generate-export-import.
//
// 활성 generation을 .json 파일로 download해 외부 백업/공유, 또는 .json 파일을
// 업로드해 새 generation entry로 import한다. format key + version으로 손상 데이터
// 거부.
//
// localStorage(persist)와는 독립 — 사용자가 명시적으로 export/import를 선택했을
// 때만 동작한다.

import { treeSchema, type Tree } from '@dworks/tree'

import { RICHNESS_SIGNAL_KEYS, type RichnessReport } from './richness'

export const EXPORT_FORMAT_KEY = 'dworks-generation'
export const EXPORT_FORMAT_VERSION = 1

export interface ExportedBriefAnswer {
  questionId: string
  questionLabel: string
  answer: string | string[]
}

export interface ExportedClarifyQuestion {
  id: string
  label: string
  type: 'single' | 'multi' | 'text'
  options?: string[]
  hint?: string
}

export interface ExportedClarifyTurn {
  questions: ExportedClarifyQuestion[]
  answers: ExportedBriefAnswer[]
}

export interface ExportedImageReference {
  colors: string[]
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
}

export interface ExportedBrief {
  intent: string
  answers?: ExportedBriefAnswer[]
  notes?: string
  imageReference?: ExportedImageReference
}

export interface ExportedGeneration {
  format: typeof EXPORT_FORMAT_KEY
  version: typeof EXPORT_FORMAT_VERSION
  exportedAt: string
  tree: Tree
  label: string
  brief: ExportedBrief | null
  questions: ExportedClarifyQuestion[]
  clarifyTurns: ExportedClarifyTurn[]
  model: 'claude' | 'codex' | 'gemini' | null
  latencyMs: number | null
  richness?: RichnessReport
}

export interface ExportableGeneration {
  tree: Tree
  label: string
  brief: ExportedBrief | null
  questions: ExportedClarifyQuestion[]
  clarifyTurns: ExportedClarifyTurn[]
  model: 'claude' | 'codex' | 'gemini' | null
  latencyMs: number | null
  richness?: RichnessReport
}

export function buildExportPayload(
  source: ExportableGeneration,
  exportedAt: Date,
): ExportedGeneration {
  return {
    format: EXPORT_FORMAT_KEY,
    version: EXPORT_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    tree: source.tree,
    label: source.label,
    brief: source.brief,
    questions: source.questions,
    clarifyTurns: source.clarifyTurns,
    model: source.model,
    latencyMs: source.latencyMs,
    ...(source.richness !== undefined ? { richness: source.richness } : {}),
  }
}

export function buildExportFilename(
  exportedAt: Date,
  label: string,
): string {
  const stamp = exportedAt.toISOString().replace(/[:.]/g, '-')
  const safeLabel = label
    .replace(/[^a-zA-Z0-9가-힣\-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
  const labelPart = safeLabel.length > 0 ? `-${safeLabel}` : ''
  return `dworks-generation-${stamp}${labelPart}.json`
}

export type ImportResult =
  | { ok: true; payload: ExportedGeneration }
  | { ok: false; reason: string }

export function parseImportPayload(rawText: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return { ok: false, reason: '유효한 JSON 파일이 아닙니다.' }
  }
  return validatePayload(parsed)
}

function validatePayload(raw: unknown): ImportResult {
  if (!isPlainObject(raw)) {
    return { ok: false, reason: '최상위가 객체가 아닙니다.' }
  }
  if (raw.format !== EXPORT_FORMAT_KEY) {
    return {
      ok: false,
      reason: `format 키가 "${EXPORT_FORMAT_KEY}"가 아닙니다.`,
    }
  }
  if (raw.version !== EXPORT_FORMAT_VERSION) {
    return {
      ok: false,
      reason: `version ${EXPORT_FORMAT_VERSION}만 지원합니다.`,
    }
  }
  const treeParse = treeSchema.safeParse(raw.tree)
  if (!treeParse.success) {
    return { ok: false, reason: 'tree가 schema를 통과하지 않습니다.' }
  }
  if (typeof raw.label !== 'string' || raw.label.length === 0) {
    return { ok: false, reason: 'label이 비어 있습니다.' }
  }
  const exportedAt = typeof raw.exportedAt === 'string' ? raw.exportedAt : ''
  if (exportedAt.length === 0 || Number.isNaN(Date.parse(exportedAt))) {
    return { ok: false, reason: 'exportedAt 타임스탬프가 유효하지 않습니다.' }
  }

  const questionsResult = validateQuestionList(raw.questions)
  if (!questionsResult.ok) return questionsResult
  const clarifyTurnsResult = validateClarifyTurns(raw.clarifyTurns)
  if (!clarifyTurnsResult.ok) return clarifyTurnsResult

  let brief: ExportedBrief | null = null
  if (raw.brief !== null && raw.brief !== undefined) {
    const briefResult = validateBrief(raw.brief)
    if (!briefResult.ok) return briefResult
    brief = briefResult.value
  }

  const model = validateModel(raw.model)
  if (!model.ok) return model
  const latencyMs = validateLatency(raw.latencyMs)
  if (!latencyMs.ok) return latencyMs

  const richnessResult = validateRichness(raw.richness)
  if (!richnessResult.ok) return richnessResult

  return {
    ok: true,
    payload: {
      format: EXPORT_FORMAT_KEY,
      version: EXPORT_FORMAT_VERSION,
      exportedAt,
      tree: treeParse.data,
      label: raw.label,
      brief,
      questions: questionsResult.value,
      clarifyTurns: clarifyTurnsResult.value,
      model: model.value,
      latencyMs: latencyMs.value,
      ...(richnessResult.value !== undefined
        ? { richness: richnessResult.value }
        : {}),
    },
  }
}

function validateRichness(
  raw: unknown,
):
  | { ok: true; value: RichnessReport | undefined }
  | { ok: false; reason: string } {
  if (raw === undefined || raw === null) return { ok: true, value: undefined }
  if (!isPlainObject(raw)) {
    return { ok: false, reason: 'richness가 객체가 아닙니다.' }
  }
  if (typeof raw.score !== 'number' || !Number.isFinite(raw.score)) {
    return { ok: false, reason: 'richness.score가 숫자가 아닙니다.' }
  }
  if (raw.score < 0 || raw.score > 1) {
    return { ok: false, reason: 'richness.score는 0~1 범위여야 합니다.' }
  }
  for (const key of RICHNESS_SIGNAL_KEYS) {
    if (typeof raw[key] !== 'boolean') {
      return { ok: false, reason: `richness.${key}가 boolean이 아닙니다.` }
    }
  }
  return {
    ok: true,
    value: {
      score: raw.score,
      hasPageLandmarks: raw.hasPageLandmarks as boolean,
      hasMainMultiSection: raw.hasMainMultiSection as boolean,
      hasDisplayHeadingOne: raw.hasDisplayHeadingOne as boolean,
      hasCallToAction: raw.hasCallToAction as boolean,
      fontSizeVariety: raw.fontSizeVariety as boolean,
      colorVariety: raw.colorVariety as boolean,
      hasImagery: raw.hasImagery as boolean,
      hasShapeDepth: raw.hasShapeDepth as boolean,
    },
  }
}

// ----- 내부 helpers -----

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const HEX6_RE = /^#[0-9a-f]{6}$/

function validateQuestion(raw: unknown): ExportedClarifyQuestion | null {
  if (!isPlainObject(raw)) return null
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null
  if (typeof raw.label !== 'string' || raw.label.length === 0) return null
  if (raw.type !== 'single' && raw.type !== 'multi' && raw.type !== 'text') {
    return null
  }
  const out: ExportedClarifyQuestion = {
    id: raw.id,
    label: raw.label,
    type: raw.type,
  }
  if (Array.isArray(raw.options)) {
    const options = raw.options.filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    )
    if (options.length > 0) out.options = options
  }
  if (typeof raw.hint === 'string') out.hint = raw.hint
  return out
}

function validateQuestionList(
  raw: unknown,
): { ok: true; value: ExportedClarifyQuestion[] } | { ok: false; reason: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, reason: 'questions가 배열이 아닙니다.' }
  }
  const out: ExportedClarifyQuestion[] = []
  for (const item of raw) {
    const q = validateQuestion(item)
    if (q === null) {
      return { ok: false, reason: 'questions 항목 형식이 올바르지 않습니다.' }
    }
    out.push(q)
  }
  return { ok: true, value: out }
}

function validateAnswer(raw: unknown): ExportedBriefAnswer | null {
  if (!isPlainObject(raw)) return null
  if (typeof raw.questionId !== 'string' || raw.questionId.length === 0) {
    return null
  }
  if (typeof raw.questionLabel !== 'string' || raw.questionLabel.length === 0) {
    return null
  }
  if (typeof raw.answer === 'string') {
    return {
      questionId: raw.questionId,
      questionLabel: raw.questionLabel,
      answer: raw.answer,
    }
  }
  if (
    Array.isArray(raw.answer) &&
    raw.answer.every((part) => typeof part === 'string')
  ) {
    return {
      questionId: raw.questionId,
      questionLabel: raw.questionLabel,
      answer: [...raw.answer],
    }
  }
  return null
}

function validateAnswerList(
  raw: unknown,
): { ok: true; value: ExportedBriefAnswer[] } | { ok: false; reason: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, reason: 'answers가 배열이 아닙니다.' }
  }
  const out: ExportedBriefAnswer[] = []
  for (const item of raw) {
    const a = validateAnswer(item)
    if (a === null) {
      return { ok: false, reason: 'answers 항목 형식이 올바르지 않습니다.' }
    }
    out.push(a)
  }
  return { ok: true, value: out }
}

function validateClarifyTurns(
  raw: unknown,
):
  | { ok: true; value: ExportedClarifyTurn[] }
  | { ok: false; reason: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, reason: 'clarifyTurns가 배열이 아닙니다.' }
  }
  const out: ExportedClarifyTurn[] = []
  for (const item of raw) {
    if (!isPlainObject(item)) {
      return { ok: false, reason: 'clarifyTurns 항목이 객체가 아닙니다.' }
    }
    const questions = validateQuestionList(item.questions)
    if (!questions.ok) return questions
    const answers = validateAnswerList(item.answers)
    if (!answers.ok) return answers
    out.push({ questions: questions.value, answers: answers.value })
  }
  return { ok: true, value: out }
}

function validateImageReference(
  raw: unknown,
): ExportedImageReference | null {
  if (!isPlainObject(raw)) return null
  if (!Array.isArray(raw.colors)) return null
  if (raw.colors.length === 0 || raw.colors.length > 5) return null
  const colors: string[] = []
  for (const item of raw.colors) {
    if (typeof item !== 'string') return null
    const lower = item.toLowerCase()
    if (!HEX6_RE.test(lower)) return null
    colors.push(lower)
  }
  let aspectRatio: ExportedImageReference['aspectRatio']
  if (raw.aspectRatio !== undefined) {
    if (
      raw.aspectRatio !== 'square' &&
      raw.aspectRatio !== 'landscape' &&
      raw.aspectRatio !== 'portrait' &&
      raw.aspectRatio !== 'wide'
    ) {
      return null
    }
    aspectRatio = raw.aspectRatio
  }
  return {
    colors,
    ...(aspectRatio !== undefined ? { aspectRatio } : {}),
  }
}

function validateBrief(
  raw: unknown,
): { ok: true; value: ExportedBrief } | { ok: false; reason: string } {
  if (!isPlainObject(raw)) {
    return { ok: false, reason: 'brief가 객체가 아닙니다.' }
  }
  if (typeof raw.intent !== 'string' || raw.intent.length === 0) {
    return { ok: false, reason: 'brief.intent가 비어 있습니다.' }
  }
  const out: ExportedBrief = { intent: raw.intent }
  if (raw.answers !== undefined) {
    const answers = validateAnswerList(raw.answers)
    if (!answers.ok) return answers
    if (answers.value.length > 0) out.answers = answers.value
  }
  if (raw.notes !== undefined) {
    if (typeof raw.notes !== 'string') {
      return { ok: false, reason: 'brief.notes가 문자열이 아닙니다.' }
    }
    if (raw.notes.length > 0) out.notes = raw.notes
  }
  if (raw.imageReference !== undefined && raw.imageReference !== null) {
    const validated = validateImageReference(raw.imageReference)
    if (validated === null) {
      return { ok: false, reason: 'brief.imageReference 형식이 올바르지 않습니다.' }
    }
    out.imageReference = validated
  }
  return { ok: true, value: out }
}

function validateModel(
  raw: unknown,
):
  | { ok: true; value: ExportedGeneration['model'] }
  | { ok: false; reason: string } {
  if (raw === null || raw === undefined) return { ok: true, value: null }
  if (raw === 'claude' || raw === 'codex' || raw === 'gemini') {
    return { ok: true, value: raw }
  }
  return { ok: false, reason: 'model이 알 수 없는 값입니다.' }
}

function validateLatency(
  raw: unknown,
):
  | { ok: true; value: number | null }
  | { ok: false; reason: string } {
  if (raw === null || raw === undefined) return { ok: true, value: null }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { ok: true, value: raw }
  }
  return { ok: false, reason: 'latencyMs가 숫자가 아닙니다.' }
}
