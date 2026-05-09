// 사용자 fixture catalog 내보내기/가져오기 — m3-generate-fixture-export-import.
//
// 단일 generation export (generation-export.ts)와는 별도 형식. fixture catalog는
// 여러 fixture를 한 .json에 담아 다른 환경/세션으로 옮긴다. format key + version
// 으로 손상 데이터 거부, 각 fixture는 tree schema 검증.
//
// localStorage 'dworks:user-fixtures:v1'와 독립 — 사용자가 명시적으로
// export/import를 클릭했을 때만 동작.

import { treeSchema, type Tree } from '@dworks/tree'

import {
  computeRichnessReport,
  RICHNESS_SIGNAL_KEYS,
  type RichnessReport,
} from './richness'
import {
  createUserFixtureId,
  sanitizeUserFixtureName,
  type UserFixture,
} from './user-fixtures'

export const FIXTURE_EXPORT_FORMAT_KEY = 'dworks-fixtures'
export const FIXTURE_EXPORT_FORMAT_VERSION = 1

export interface ExportedUserFixture {
  id: string
  name: string
  tree: Tree
  createdAt: number
  richness?: RichnessReport
}

export interface ExportedFixtureCatalog {
  format: typeof FIXTURE_EXPORT_FORMAT_KEY
  version: typeof FIXTURE_EXPORT_FORMAT_VERSION
  exportedAt: string
  fixtures: ExportedUserFixture[]
}

export function buildFixtureExportPayload(
  fixtures: UserFixture[],
  exportedAt: Date,
): ExportedFixtureCatalog {
  return {
    format: FIXTURE_EXPORT_FORMAT_KEY,
    version: FIXTURE_EXPORT_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    fixtures: fixtures.map((fixture) => ({
      id: fixture.id,
      name: fixture.name,
      tree: fixture.tree,
      createdAt: fixture.createdAt,
      richness: computeRichnessReport(fixture.tree),
    })),
  }
}

export function buildFixtureExportFilename(exportedAt: Date): string {
  const stamp = exportedAt.toISOString().replace(/[:.]/g, '-')
  return `dworks-fixtures-${stamp}.json`
}

export type FixtureImportResult =
  | { ok: true; payload: ExportedFixtureCatalog }
  | { ok: false; reason: string }

export function parseFixtureImportPayload(rawText: string): FixtureImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return { ok: false, reason: '유효한 JSON 파일이 아닙니다.' }
  }
  return validateCatalog(parsed)
}

// import 시 기존 fixture id와 충돌하지 않게 새 id 발급.
// 이름은 sanitize 후 유지 — 같은 이름 catalog는 사용자가 정리.
export function adoptImportedFixtures(
  imported: ExportedUserFixture[],
): UserFixture[] {
  return imported.map((fixture) => ({
    id: createUserFixtureId(),
    name: sanitizeUserFixtureName(fixture.name) || '가져온 fixture',
    tree: fixture.tree,
    createdAt: fixture.createdAt,
  }))
}

// ----- 내부 helpers -----

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateCatalog(raw: unknown): FixtureImportResult {
  if (!isPlainObject(raw)) {
    return { ok: false, reason: '최상위가 객체가 아닙니다.' }
  }
  if (raw.format !== FIXTURE_EXPORT_FORMAT_KEY) {
    return {
      ok: false,
      reason: `format 키가 "${FIXTURE_EXPORT_FORMAT_KEY}"가 아닙니다.`,
    }
  }
  if (raw.version !== FIXTURE_EXPORT_FORMAT_VERSION) {
    return {
      ok: false,
      reason: `version ${FIXTURE_EXPORT_FORMAT_VERSION}만 지원합니다.`,
    }
  }
  const exportedAt = typeof raw.exportedAt === 'string' ? raw.exportedAt : ''
  if (exportedAt.length === 0 || Number.isNaN(Date.parse(exportedAt))) {
    return { ok: false, reason: 'exportedAt 타임스탬프가 유효하지 않습니다.' }
  }
  if (!Array.isArray(raw.fixtures)) {
    return { ok: false, reason: 'fixtures가 배열이 아닙니다.' }
  }
  const out: ExportedUserFixture[] = []
  for (const item of raw.fixtures) {
    const validated = validateExportedFixture(item)
    if (validated === null) {
      return { ok: false, reason: 'fixtures 항목 형식이 올바르지 않습니다.' }
    }
    out.push(validated)
  }
  return {
    ok: true,
    payload: {
      format: FIXTURE_EXPORT_FORMAT_KEY,
      version: FIXTURE_EXPORT_FORMAT_VERSION,
      exportedAt,
      fixtures: out,
    },
  }
}

function validateExportedFixture(raw: unknown): ExportedUserFixture | null {
  if (!isPlainObject(raw)) return null
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null
  if (typeof raw.name !== 'string' || raw.name.length === 0) return null
  if (typeof raw.createdAt !== 'number' || !Number.isFinite(raw.createdAt)) {
    return null
  }
  const treeParse = treeSchema.safeParse(raw.tree)
  if (!treeParse.success) return null
  const richness = validateExportedRichness(raw.richness)
  if (richness === null && raw.richness !== undefined && raw.richness !== null) {
    return null
  }
  return {
    id: raw.id,
    name: raw.name,
    tree: treeParse.data,
    createdAt: raw.createdAt,
    ...(richness !== null ? { richness } : {}),
  }
}

function validateExportedRichness(raw: unknown): RichnessReport | null {
  if (raw === undefined || raw === null) return null
  if (!isPlainObject(raw)) return null
  if (typeof raw.score !== 'number' || !Number.isFinite(raw.score)) return null
  if (raw.score < 0 || raw.score > 1) return null
  for (const key of RICHNESS_SIGNAL_KEYS) {
    if (typeof raw[key] !== 'boolean') return null
  }
  return {
    score: raw.score,
    hasPageLandmarks: raw.hasPageLandmarks as boolean,
    hasMainMultiSection: raw.hasMainMultiSection as boolean,
    hasDisplayHeadingOne: raw.hasDisplayHeadingOne as boolean,
    hasCallToAction: raw.hasCallToAction as boolean,
    fontSizeVariety: raw.fontSizeVariety as boolean,
    colorVariety: raw.colorVariety as boolean,
    hasImagery: raw.hasImagery as boolean,
    hasShapeDepth: raw.hasShapeDepth as boolean,
  }
}
