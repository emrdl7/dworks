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
})
