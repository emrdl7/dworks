// @dworks/llm-prompts examples schema 검증 — m3-generate-prompt-uplift.
// few-shot examples이 schema와 drift되지 않게 테스트로 고정.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { z } from 'zod'

import { treeSchema } from '@dworks/tree'

import {
  CLARIFY_QUESTIONS_EXAMPLE,
  CLARIFY_QUESTIONS_SYSTEM_PROMPT,
  GENERATE_TREE_EXAMPLES,
  GENERATE_TREE_SYSTEM_PROMPT,
} from './index.js'

const clarifyQuestionSchema = z
  .object({
    id: z.string().min(1).max(40),
    label: z.string().min(1).max(120),
    type: z.enum(['single', 'multi', 'text']),
    options: z.array(z.string().min(1).max(40)).min(2).max(6).optional(),
    hint: z.string().max(120).optional(),
  })
  .refine(
    (q) =>
      q.type === 'text'
        ? q.options === undefined
        : q.options !== undefined,
    { message: 'single/multi 질문에는 options 2~6개가 필수입니다.' },
  )
const clarifyExampleSchema = z.object({
  intent: z.string().min(1).max(500),
  questions: z.array(clarifyQuestionSchema).min(3).max(6),
})

const STYLE_CATEGORIES = [
  'color',
  'spacing',
  'shape',
  'layout',
  'typography',
] as const
type StyleCategory = (typeof STYLE_CATEGORIES)[number]

function collectStyleCategories(
  node: unknown,
  into: Set<StyleCategory>,
): void {
  if (node === null || typeof node !== 'object') return
  const obj = node as Record<string, unknown>
  for (const key of STYLE_CATEGORIES) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      obj[key] !== undefined
    ) {
      into.add(key)
    }
  }
  const children = obj.children
  if (Array.isArray(children)) {
    for (const c of children) collectStyleCategories(c, into)
  }
}

function categoriesInTree(tree: unknown): Set<StyleCategory> {
  const set = new Set<StyleCategory>()
  collectStyleCategories((tree as { root?: unknown }).root, set)
  return set
}

describe('llm-prompts examples', () => {
  it('exposes 3 generate examples', () => {
    assert.equal(GENERATE_TREE_EXAMPLES.length, 3)
  })

  it('every generate example has a valid Tree against treeSchema', () => {
    for (const example of GENERATE_TREE_EXAMPLES) {
      const parsed = treeSchema.safeParse(example.tree)
      assert.equal(parsed.success, true, `intent="${example.intent}" failed`)
    }
  })

  it('clarify example matches clarify response schema', () => {
    const parsed = clarifyExampleSchema.safeParse(CLARIFY_QUESTIONS_EXAMPLE)
    assert.equal(parsed.success, true)
  })

  it('GENERATE_TREE_SYSTEM_PROMPT embeds every generate example', () => {
    for (const example of GENERATE_TREE_EXAMPLES) {
      assert.ok(
        GENERATE_TREE_SYSTEM_PROMPT.includes(example.intent),
        `intent missing in prompt: ${example.intent}`,
      )
      assert.ok(
        GENERATE_TREE_SYSTEM_PROMPT.includes(
          JSON.stringify(example.tree, null, 2),
        ),
        `tree JSON missing in prompt: ${example.intent}`,
      )
    }
  })

  it('CLARIFY_QUESTIONS_SYSTEM_PROMPT embeds the clarify example', () => {
    assert.ok(
      CLARIFY_QUESTIONS_SYSTEM_PROMPT.includes(CLARIFY_QUESTIONS_EXAMPLE.intent),
    )
    assert.ok(
      CLARIFY_QUESTIONS_SYSTEM_PROMPT.includes(
        JSON.stringify({ questions: CLARIFY_QUESTIONS_EXAMPLE.questions }, null, 2),
      ),
    )
    for (const q of CLARIFY_QUESTIONS_EXAMPLE.questions) {
      assert.ok(CLARIFY_QUESTIONS_SYSTEM_PROMPT.includes(q.label))
    }
  })

  it('every generate example has at least 2 style prop categories (DFS)', () => {
    for (const example of GENERATE_TREE_EXAMPLES) {
      const cats = categoriesInTree(example.tree)
      assert.ok(
        cats.size >= 2,
        `example "${example.intent}" categories=${[...cats].join(',') || '(none)'}`,
      )
    }
  })

  it('three generate examples together cover color, spacing, shape', () => {
    const union = new Set<StyleCategory>()
    for (const example of GENERATE_TREE_EXAMPLES) {
      for (const c of categoriesInTree(example.tree)) union.add(c)
    }
    for (const required of ['color', 'spacing', 'shape'] as const) {
      assert.ok(union.has(required), `missing required category: ${required}`)
    }
  })

  it('serialized examples do not contain forbidden field names', () => {
    const serialized = JSON.stringify(
      GENERATE_TREE_EXAMPLES.map((e) => e.tree),
    )
    const forbidden = [
      '"gradient":',
      '"borderRadius":',
      '"shadow":{"preset"',
      '"color":{"color":',
      '"padding":',
    ]
    for (const f of forbidden) {
      assert.equal(
        serialized.includes(f),
        false,
        `forbidden field substring present: ${f}`,
      )
    }
  })

  it('GENERATE_TREE_SYSTEM_PROMPT includes 답변 → 스타일 매핑 가이드 with all 5 tone labels', () => {
    assert.ok(
      GENERATE_TREE_SYSTEM_PROMPT.includes('## 답변 → 스타일 매핑 가이드'),
      'mapping guide header missing',
    )
    const toneLabels = [
      '차분 / 절제 / 신뢰',
      '활기 / 임팩트 / 강조',
      '친근 / 따뜻 / 부드러움',
      '전문 / 정확 / 깔끔',
      '프리미엄 / 고급',
    ]
    for (const label of toneLabels) {
      assert.ok(
        GENERATE_TREE_SYSTEM_PROMPT.includes(label),
        `mapping guide missing tone label: ${label}`,
      )
    }
  })

  it('GENERATE_TREE_SYSTEM_PROMPT includes 페이지 기본 구조 and 2026 디자인 트렌드 가이드', () => {
    assert.ok(
      GENERATE_TREE_SYSTEM_PROMPT.includes('## 페이지 기본 구조'),
      '페이지 기본 구조 header missing',
    )
    assert.ok(
      GENERATE_TREE_SYSTEM_PROMPT.includes('## 2026 디자인 트렌드 가이드'),
      '2026 트렌드 header missing',
    )
  })

  it('every example has root section with banner/main/contentinfo role children', () => {
    for (const example of GENERATE_TREE_EXAMPLES) {
      const root = example.tree.root as {
        type?: string
        children?: Array<{ type?: string; role?: string }>
      }
      assert.equal(
        root.type,
        'section',
        `example "${example.intent}" root is not section`,
      )
      const roles = (root.children ?? [])
        .map((c) => c.role)
        .filter((r): r is string => typeof r === 'string')
      for (const required of ['banner', 'main', 'contentinfo']) {
        assert.ok(
          roles.includes(required),
          `example "${example.intent}" missing role: ${required}`,
        )
      }
    }
  })

  it('every example uses typography.fontSize on at least one heading-1 (anti-wireframe)', () => {
    function visit(node: unknown, found: { fontSize: boolean }): void {
      if (node === null || typeof node !== 'object') return
      const obj = node as Record<string, unknown>
      const emphasis = obj.emphasis
      const typography = obj.typography as
        | { fontSize?: number }
        | undefined
      if (
        emphasis === 'heading-1' &&
        typography !== undefined &&
        typeof typography.fontSize === 'number' &&
        typography.fontSize >= 48
      ) {
        found.fontSize = true
      }
      const children = obj.children
      if (Array.isArray(children)) {
        for (const c of children) visit(c, found)
      }
    }
    for (const example of GENERATE_TREE_EXAMPLES) {
      const found = { fontSize: false }
      visit(example.tree.root, found)
      assert.ok(
        found.fontSize,
        `example "${example.intent}" has no heading-1 with fontSize >= 48 (would be wireframe-like)`,
      )
    }
  })

  it('every example uses shape.shadow on at least one node (visual depth)', () => {
    function visit(node: unknown, found: { shadow: boolean }): void {
      if (node === null || typeof node !== 'object') return
      const obj = node as Record<string, unknown>
      const shape = obj.shape as { shadow?: string } | undefined
      if (
        shape !== undefined &&
        typeof shape.shadow === 'string' &&
        shape.shadow !== 'none'
      ) {
        found.shadow = true
      }
      const children = obj.children
      if (Array.isArray(children)) {
        for (const c of children) visit(c, found)
      }
    }
    for (const example of GENERATE_TREE_EXAMPLES) {
      const found = { shadow: false }
      visit(example.tree.root, found)
      assert.ok(
        found.shadow,
        `example "${example.intent}" has no shape.shadow usage (visual depth missing)`,
      )
    }
  })

  it('GENERATE_TREE_SYSTEM_PROMPT bans wireframe output explicitly', () => {
    assert.ok(
      GENERATE_TREE_SYSTEM_PROMPT.includes('와이어프레임'),
      'system prompt missing wireframe ban guidance',
    )
  })

  it('SaaS example main has hero / features / pricing sections', () => {
    const saas = GENERATE_TREE_EXAMPLES.find((ex) =>
      ex.tree.root.id.startsWith('saas.'),
    )
    assert.ok(saas !== undefined, 'saas example missing')
    const json = JSON.stringify(saas?.tree)
    assert.ok(json.includes('"saas.hero"'), 'saas.hero missing')
    assert.ok(json.includes('"saas.features"'), 'saas.features missing')
    assert.ok(json.includes('"pricing.section"'), 'pricing.section missing')
  })

  it('Magazine example main has article + related grid', () => {
    const magazine = GENERATE_TREE_EXAMPLES.find((ex) =>
      ex.tree.root.id.startsWith('magazine.'),
    )
    assert.ok(magazine !== undefined, 'magazine example missing')
    const json = JSON.stringify(magazine?.tree)
    assert.ok(json.includes('"article.section"'), 'article.section missing')
    assert.ok(json.includes('"magazine.related"'), 'magazine.related missing')
    assert.ok(json.includes('"magazine.related.grid"'), 'magazine.related.grid missing')
  })
})
