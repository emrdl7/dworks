// brief 로더 + 카테고리별 placeholder 트리 빌더.
//
// M1 단계: brief 12개 파일을 로드하고, 각 brief에 대해 의미 있는 placeholder
// 트리를 자동 생성한다. 실제 LLM 생성은 M2 이후. M1 점수 산출은 placeholder
// 트리에 대해 수행 — 점수 자체는 낮을 가능성이 높지만 (와이어프레임/감성 약함)
// 그 점수가 P0 측정 기준선을 만들어준다.

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { z } from 'zod'

import type { Tree, TreeNode } from '@dworks/tree'

// ---- brief schema ----

export const briefSchema = z.object({
  id: z.string(),
  category: z.enum([
    'public-landing',
    'brand-campaign',
    'dashboard',
    'application-form',
    'list-detail',
  ]),
  complianceProfile: z.enum(['free', 'jabworks', 'infoux', 'krds']).optional(),
  intent: z.string(),
  answers: z.record(z.string(), z.string()),
  expected: z
    .object({
      requiredSections: z.array(z.string()).optional(),
      forbiddenPatterns: z.array(z.string()).optional(),
      mobileRisks: z.array(z.string()).optional(),
    })
    .optional(),
})
export type Brief = z.infer<typeof briefSchema>

// ---- 로더 ----

/**
 * 디렉토리에서 *.json brief 파일을 모두 로드.
 * `seeds/evals/briefs/`가 기본.
 */
export async function loadBriefs(dir: string): Promise<Brief[]> {
  const entries = await readdir(dir)
  const briefs: Brief[] = []
  for (const name of entries) {
    if (!name.endsWith('.json')) continue
    if (name === 'README.md') continue
    const raw = await readFile(join(dir, name), 'utf8')
    const parsed = briefSchema.parse(JSON.parse(raw))
    briefs.push(parsed)
  }
  return briefs.sort((a, b) => a.id.localeCompare(b.id))
}

// ---- 카테고리별 placeholder 트리 빌더 ----

function nodeId(prefix: string, suffix: string): string {
  return `${prefix}.${suffix}`
}

function landingTree(brief: Brief): Tree {
  const id = brief.id
  const heroTitle =
    brief.answers.key_message ?? brief.intent.split('.')[0] ?? brief.id
  const tone = brief.answers.tone ?? '공공기관형'
  const audience = brief.answers.audience ?? '대상 사용자'
  return {
    version: '1',
    root: {
      id: nodeId(id, 'root'),
      type: 'section',
      editKind: 'structure',
      role: 'landing',
      children: [
        {
          id: nodeId(id, 'hero'),
          type: 'hero',
          editKind: 'structure',
          children: [
            {
              id: nodeId(id, 'hero.title'),
              type: 'text',
              editKind: 'text',
              emphasis: 'heading-1',
              content: heroTitle,
            },
            {
              id: nodeId(id, 'hero.body'),
              type: 'text',
              editKind: 'text',
              emphasis: 'body',
              content: `${audience}을 위한 ${tone} 톤의 진입.`,
            },
            {
              id: nodeId(id, 'hero.cta'),
              type: 'button',
              editKind: 'text',
              label: '자세히 보기',
              variant: 'primary',
              href: '#main',
            },
          ],
        },
        sectionWithCards(id, 'services', '주요 서비스', 3),
        sectionWithList(id, 'notice', '소식', 3),
      ],
    },
  }
}

function dashboardTree(brief: Brief): Tree {
  const id = brief.id
  return {
    version: '1',
    root: {
      id: nodeId(id, 'root'),
      type: 'section',
      editKind: 'structure',
      role: 'dashboard',
      children: [
        {
          id: nodeId(id, 'header'),
          type: 'text',
          editKind: 'text',
          emphasis: 'heading-1',
          content: brief.answers.key_message ?? brief.intent.split('.')[0] ?? brief.id,
        },
        sectionWithCards(id, 'kpis', '핵심 지표', 4),
        sectionWithList(id, 'recent', '최근 활동', 5),
      ],
    },
  }
}

function formTree(brief: Brief): Tree {
  const id = brief.id
  return {
    version: '1',
    root: {
      id: nodeId(id, 'root'),
      type: 'section',
      editKind: 'structure',
      role: 'form',
      children: [
        {
          id: nodeId(id, 'header'),
          type: 'text',
          editKind: 'text',
          emphasis: 'heading-2',
          content: brief.answers.key_message ?? brief.intent.split('.')[0] ?? brief.id,
        },
        {
          id: nodeId(id, 'form'),
          type: 'form',
          editKind: 'structure',
          action: '/api/submit',
          method: 'post',
          children: [
            {
              id: nodeId(id, 'form.label-1'),
              type: 'text',
              editKind: 'text',
              emphasis: 'caption',
              content: '필수 항목을 입력하세요.',
            },
            {
              id: nodeId(id, 'form.submit'),
              type: 'button',
              editKind: 'text',
              label: '제출',
              variant: 'primary',
            },
          ],
        },
      ],
    },
  }
}

function listTree(brief: Brief): Tree {
  const id = brief.id
  const items = brief.expected?.requiredSections ?? ['항목 1', '항목 2', '항목 3']
  return {
    version: '1',
    root: {
      id: nodeId(id, 'root'),
      type: 'section',
      editKind: 'structure',
      role: 'list',
      children: [
        {
          id: nodeId(id, 'header'),
          type: 'text',
          editKind: 'text',
          emphasis: 'heading-2',
          content: brief.answers.key_message ?? brief.intent.split('.')[0] ?? brief.id,
        },
        {
          id: nodeId(id, 'list'),
          type: 'list',
          editKind: 'structure',
          variant: 'unordered',
          children: items.map((label, idx) => ({
            id: nodeId(id, `list.item-${idx + 1}`),
            type: 'text' as const,
            editKind: 'text' as const,
            content: label,
          })),
        },
      ],
    },
  }
}

function brandTree(brief: Brief): Tree {
  const id = brief.id
  return {
    version: '1',
    root: {
      id: nodeId(id, 'root'),
      type: 'section',
      editKind: 'structure',
      role: 'campaign',
      children: [
        {
          id: nodeId(id, 'hero'),
          type: 'hero',
          editKind: 'structure',
          children: [
            {
              id: nodeId(id, 'hero.title'),
              type: 'text',
              editKind: 'text',
              emphasis: 'heading-1',
              content: brief.answers.key_message ?? brief.intent.split('.')[0] ?? brief.id,
            },
            {
              id: nodeId(id, 'hero.body'),
              type: 'text',
              editKind: 'text',
              emphasis: 'body',
              content: brief.intent,
            },
            {
              id: nodeId(id, 'hero.cta'),
              type: 'button',
              editKind: 'text',
              label: '캠페인 참여',
              variant: 'primary',
            },
          ],
        },
        sectionWithCards(id, 'pillars', '핵심 메시지', 3),
      ],
    },
  }
}

// ---- 공통 헬퍼 ----

function sectionWithCards(
  briefId: string,
  role: string,
  title: string,
  cardCount: number,
): TreeNode {
  return {
    id: nodeId(briefId, role),
    type: 'section',
    editKind: 'structure',
    role,
    children: [
      {
        id: nodeId(briefId, `${role}.title`),
        type: 'text',
        editKind: 'text',
        emphasis: 'heading-2',
        content: title,
      },
      ...Array.from({ length: cardCount }, (_, i) => ({
        id: nodeId(briefId, `${role}.card-${i + 1}`),
        type: 'card' as const,
        editKind: 'structure' as const,
        children: [
          {
            id: nodeId(briefId, `${role}.card-${i + 1}.title`),
            type: 'text' as const,
            editKind: 'text' as const,
            emphasis: 'heading-3' as const,
            content: `${title} ${i + 1}`,
          },
          {
            id: nodeId(briefId, `${role}.card-${i + 1}.body`),
            type: 'text' as const,
            editKind: 'text' as const,
            emphasis: 'body' as const,
            content: 'placeholder 본문 — M2 이후 LLM 생성으로 교체.',
          },
        ],
      })),
    ],
  }
}

function sectionWithList(
  briefId: string,
  role: string,
  title: string,
  itemCount: number,
): TreeNode {
  return {
    id: nodeId(briefId, role),
    type: 'section',
    editKind: 'structure',
    role,
    children: [
      {
        id: nodeId(briefId, `${role}.title`),
        type: 'text',
        editKind: 'text',
        emphasis: 'heading-2',
        content: title,
      },
      {
        id: nodeId(briefId, `${role}.list`),
        type: 'list',
        editKind: 'structure',
        variant: 'ordered',
        children: Array.from({ length: itemCount }, (_, i) => ({
          id: nodeId(briefId, `${role}.list.item-${i + 1}`),
          type: 'text' as const,
          editKind: 'text' as const,
          content: `${title} 항목 ${i + 1}`,
        })),
      },
    ],
  }
}

// ---- 공개 빌더 ----

const CATEGORY_BUILDERS: Record<Brief['category'], (b: Brief) => Tree> = {
  'public-landing': landingTree,
  'brand-campaign': brandTree,
  dashboard: dashboardTree,
  'application-form': formTree,
  'list-detail': listTree,
}

export function buildPlaceholderTree(brief: Brief): Tree {
  return CATEGORY_BUILDERS[brief.category](brief)
}
