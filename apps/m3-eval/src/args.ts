// CLI args parsing for m3-eval.

import { z } from 'zod'

export interface M3EvalArgs {
  fixturesPath: string
  repeat: number
  apiBase: string
  outDir: string | null
  providers: string[] | null
  live: boolean
  minRichness: number | null
}

const POSITIVE_INT = z.number().int().min(1).max(50)
const RICHNESS_RANGE = z.number().min(0).max(1)
const PROVIDER_IDS = ['claude', 'codex', 'gemini'] as const
const PROVIDER_SET = new Set<string>(PROVIDER_IDS)

export class M3EvalArgsError extends Error {}

/**
 * 단순 --key value 또는 --flag 파싱. zod로 검증.
 */
export function parseM3EvalArgs(argv: readonly string[]): M3EvalArgs {
  const map = new Map<string, string>()
  const flags = new Set<string>()
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      flags.add(key)
      continue
    }
    map.set(key, next)
    i += 1
  }

  const fixturesPath = map.get('fixtures')
  if (fixturesPath === undefined || fixturesPath.length === 0) {
    throw new M3EvalArgsError('--fixtures <path>가 필요합니다.')
  }

  const repeatRaw = map.get('repeat') ?? '1'
  const repeatNum = Number(repeatRaw)
  const repeatParse = POSITIVE_INT.safeParse(repeatNum)
  if (!repeatParse.success) {
    throw new M3EvalArgsError('--repeat은 1~50의 정수여야 합니다.')
  }

  const providersRaw = map.get('providers')
  const providers =
    providersRaw === undefined
      ? null
      : parseProviders(providersRaw)

  let minRichness: number | null = null
  const minRichnessRaw = map.get('min-richness')
  if (minRichnessRaw !== undefined) {
    const parsed = Number(minRichnessRaw)
    const result = RICHNESS_RANGE.safeParse(parsed)
    if (!result.success) {
      throw new M3EvalArgsError('--min-richness는 0.0~1.0 범위 숫자여야 합니다.')
    }
    minRichness = result.data
  }

  return {
    fixturesPath,
    repeat: repeatParse.data,
    apiBase: map.get('api-base') ?? 'http://localhost:3001',
    outDir: map.get('out') ?? null,
    providers,
    live: flags.has('live'),
    minRichness,
  }
}

function parseProviders(value: string): string[] {
  const providers = value
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  if (providers.length === 0) {
    throw new M3EvalArgsError('--providers는 비어 있을 수 없습니다.')
  }
  for (const provider of providers) {
    if (!PROVIDER_SET.has(provider)) {
      throw new M3EvalArgsError(
        `--providers는 ${PROVIDER_IDS.join(', ')} 중 하나여야 합니다: ${provider}`,
      )
    }
  }
  return [...new Set(providers)]
}
