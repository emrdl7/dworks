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

export interface DesignSystemMetaExtended extends DesignSystemMeta {
  /** Primary CTA / accent hex (Agent Prompt Guide 의 Primary CTA 라인에서 추출). null 이면 swatch 표시 X. */
  accent: string | null
  /** Page Background hex (있으면 picker preview 배경에 활용). */
  bg: string | null
  /** DESIGN.md 의 첫 ## Visual Theme 단락 한 줄 요약 (~120자). */
  blurb: string | null
}

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}/

function extractFirstHex(text: string): string | null {
  const match = text.match(HEX_PATTERN)
  return match === null ? null : match[0].toLowerCase()
}

export function describeDesignSystem(
  id: DesignSystemId,
): DesignSystemMeta | null {
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

/** 메타 + accent/bg/blurb 추출 (picker UI 용). */
export function describeDesignSystemExtended(
  id: DesignSystemId,
): DesignSystemMetaExtended | null {
  const content = loadDesignSystem(id)
  if (content === null) return null
  const base = describeDesignSystem(id)
  if (base === null) return null
  // Section 9 "Agent Prompt Guide > Quick Color Reference" 가장 신뢰성 높음.
  // 형식: `- Primary CTA: Label (`#hex`)` / `- Page Background: Label (`#hex`)`.
  // Section 9 우선 파싱, 없으면 fallback 으로 prose 검색.
  let accent: string | null = null
  let bg: string | null = null
  const sec9Idx = content.indexOf('## 9.')
  const sec9 = sec9Idx >= 0 ? content.slice(sec9Idx) : null
  if (sec9 !== null) {
    const ctaLine = sec9.match(
      /-\s*(?:Primary\s*CTA|Primary\s*action|Brand\s*color)[^\n]*?(#[0-9a-fA-F]{3,8})/i,
    )
    if (ctaLine !== null) accent = ctaLine[1]?.toLowerCase() ?? null
    const bgLine = sec9.match(
      /-\s*(?:Page\s*Background|Body\s*background|Surface)[^\n]*?(#[0-9a-fA-F]{3,8})/i,
    )
    if (bgLine !== null) bg = bgLine[1]?.toLowerCase() ?? null
  }
  // Fallback — Section 9 없는 시스템은 prose / 다른 list 패턴 검색.
  if (accent === null) {
    // "- Primary action: Label (#hex)" 또는 "- Brand <X>: ... `#hex`"
    const m = content.match(
      /^-\s*(?:Primary\s*(?:CTA|action|brand)|Brand\s+\w+|Accent)\s*:?[^\n]*?(#[0-9a-fA-F]{3,8})/im,
    )
    if (m !== null) accent = m[1]?.toLowerCase() ?? null
  }
  if (bg === null) {
    const m = content.match(
      /(?:^|\n)-?\s*(?:marketing\s+background|page\s+background|body\s+bg|primary\s+bg)[^\n]*?(#[0-9a-fA-F]{3,8})/i,
    )
    if (m !== null) bg = m[1]?.toLowerCase() ?? null
  }
  // blurb — "Visual Theme" 섹션 첫 문장 또는 카테고리 다음 줄
  let blurb: string | null = null
  const themeIdx = content.indexOf('## 1. Visual Theme')
  if (themeIdx >= 0) {
    const after = content.slice(themeIdx).split('\n').filter((l) => l.trim().length > 0)
    const firstParaLine = after.find(
      (l, i) => i > 0 && !l.startsWith('#') && !l.startsWith('-'),
    )
    if (firstParaLine !== undefined) {
      // 첫 문장만 추출
      const sentence = firstParaLine.split(/\.\s/)[0]?.trim() ?? firstParaLine.trim()
      blurb = sentence.length > 140 ? sentence.slice(0, 137) + '...' : sentence
    }
  }
  return { ...base, accent, bg, blurb }
}

/** 전체 design system 메타 배열 — picker UI 가 한 번 fetch 해서 캐시. */
export function listDesignSystemsExtended(): DesignSystemMetaExtended[] {
  return availableDesignSystems()
    .map((id) => describeDesignSystemExtended(id))
    .filter((m): m is DesignSystemMetaExtended => m !== null)
}
