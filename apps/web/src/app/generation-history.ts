export interface GenerationHistoryEntry {
  immutable: boolean
  pinned?: boolean
  label: string
}

export type VariantCount = 1 | 2 | 3

export const VARIANT_COUNT_OPTIONS: VariantCount[] = [1, 2, 3]

export const VARIANT_DIVERSITY_HINTS: ReadonlyArray<string> = [
  '변형 1: 구조와 정보 밀도가 균형 잡힌 안정형 레이아웃.',
  '변형 2: 시각 강조와 헤드라인이 강한 임팩트형 레이아웃.',
  '변형 3: 여백이 넓고 차분한 실무형 레이아웃.',
]

interface BriefWithNotes {
  notes?: string
}

export function buildVariantRequestBrief<T extends object>(
  brief: T & BriefWithNotes,
  index: number,
  count: VariantCount,
): T & BriefWithNotes {
  if (count === 1) {
    return brief
  }

  const notes = [brief.notes, VARIANT_DIVERSITY_HINTS[index] ?? '']
    .filter((part): part is string => part !== undefined && part.trim().length > 0)
    .join('\n\n')
    .trim()

  return {
    ...brief,
    ...(notes.length > 0 ? { notes } : {}),
  }
}

function isProtected(entry: GenerationHistoryEntry): boolean {
  return entry.immutable || entry.pinned === true
}

export function appendGenerationHistoryEntries<T extends GenerationHistoryEntry>(
  entries: readonly T[],
  newEntries: readonly T[],
  maxEntries: number,
): T[] {
  if (maxEntries <= 0) {
    return []
  }

  const combined = [...entries, ...newEntries]
  const protectedEntries = combined
    .filter((entry) => isProtected(entry))
    .slice(0, maxEntries)
  const mutableLimit = maxEntries - protectedEntries.length
  const recentMutableEntries =
    mutableLimit > 0
      ? combined.filter((entry) => !isProtected(entry)).slice(-mutableLimit)
      : []

  return relabelGenerationHistory([...protectedEntries, ...recentMutableEntries])
}

export function relabelGenerationHistory<T extends GenerationHistoryEntry>(
  entries: readonly T[],
): T[] {
  return entries.map((entry, index) =>
    isProtected(entry) ? entry : ({ ...entry, label: `생성 ${index}` } as T),
  )
}

// mutable & non-pinned entry만 제거. immutable과 pinned는 보호. relabel로 라벨 정리.
export function clearMutableEntries<T extends GenerationHistoryEntry>(
  entries: readonly T[],
): T[] {
  return relabelGenerationHistory(entries.filter((entry) => isProtected(entry)))
}
