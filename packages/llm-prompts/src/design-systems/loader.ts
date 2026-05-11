// Design System loader — `nexu-io/open-design` 의 DESIGN.md 포맷을 prompt 에 inject.
// NOTICE.md / LICENSE 참조 (Apache 2.0, 원본 attribution 보존).
//
// 사용 패턴:
//   import { loadDesignSystem, availableDesignSystems } from '@dworks/llm-prompts/design-systems/loader'
//   const linearMd = loadDesignSystem('linear-app')
//   ...formatBriefAsUserPrompt 등에서 prompt 에 inject

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/** 등록된 design system id — 폴더명 (`linear-app`, `stripe-app` 등). */
export type DesignSystemId = string

/** design-systems/ 디렉터리 하위 폴더 스캔 → DESIGN.md 존재하는 system id list. */
export function availableDesignSystems(): DesignSystemId[] {
  try {
    const entries = readdirSync(HERE, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => {
        try {
          readFileSync(join(HERE, name, 'DESIGN.md'), 'utf-8')
          return true
        } catch {
          return false
        }
      })
      .sort()
  } catch {
    return []
  }
}

/**
 * DESIGN.md 문자열 반환. 없으면 null.
 *
 * @example
 *   const md = loadDesignSystem('linear-app')
 *   if (md !== null) prompt += `\n\n## Active Design System\n\n${md}`
 */
export function loadDesignSystem(id: DesignSystemId): string | null {
  // path traversal 가드 — id 에 / 또는 .. 포함시 거부.
  if (id.includes('/') || id.includes('..') || id.includes('\\')) {
    return null
  }
  try {
    return readFileSync(join(HERE, id, 'DESIGN.md'), 'utf-8')
  } catch {
    return null
  }
}

/**
 * design system metadata 추출 — DESIGN.md 첫 줄(제목) + 두번째 줄(Category) 까지만 파싱.
 * picker UI 에서 system 목록 보여줄 때 사용.
 */
export interface DesignSystemMeta {
  id: DesignSystemId
  title: string
  category: string | null
}

export function describeDesignSystem(id: DesignSystemId): DesignSystemMeta | null {
  const content = loadDesignSystem(id)
  if (content === null) return null
  const lines = content.split('\n')
  const titleLine = lines[0] ?? ''
  const title = titleLine.replace(/^#\s*/, '').trim() || id
  const catLine = lines.find((l) => /Category:/i.test(l)) ?? null
  const category = catLine === null
    ? null
    : catLine.replace(/^.*Category:\s*/i, '').trim() || null
  return { id, title, category }
}
