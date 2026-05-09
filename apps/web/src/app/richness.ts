// 디자인 풍부도(= 1 - AI 슬롭) 점수.
//
// apps/m3-eval/src/ai-slop.ts와 동일한 8 신호. m3-eval은 batch intent별 평균,
// web은 chip 라벨에 단일 generation 점수를 표시한다. 신호 정의가 안정되면
// packages/tree-quality 등으로 추출 예정.
//
// 신호 8종(각 boolean):
//   1. hasPageLandmarks       — banner/main/contentinfo role 모두 존재
//   2. hasMainMultiSection    — main 직접 하위에 section/hero 2개 이상
//   3. hasDisplayHeadingOne   — heading-1 + fontSize ≥ 48
//   4. hasCallToAction        — button 또는 contentRole 'cta' 노드 ≥ 1
//   5. fontSizeVariety        — 고유 typography.fontSize 값 ≥ 3
//   6. colorVariety           — 고유 color hex 값 ≥ 3
//   7. hasImagery             — image 노드 ≥ 1
//   8. hasShapeDepth          — shape.shadow !== 'none' 또는 radius ≥ 8 인 노드 ≥ 1
//
// score = trueCount / 8 (0.0 슬롭 ~ 1.0 풍부).

import type { Tree, TreeNode } from '@dworks/tree'

export interface RichnessReport {
  hasPageLandmarks: boolean
  hasMainMultiSection: boolean
  hasDisplayHeadingOne: boolean
  hasCallToAction: boolean
  fontSizeVariety: boolean
  colorVariety: boolean
  hasImagery: boolean
  hasShapeDepth: boolean
  score: number
}

const SIGNAL_COUNT = 8

const COLOR_KEYS = [
  'backgroundColor',
  'textColor',
  'borderColor',
  'accentColor',
  'overlayColor',
] as const

function isContainer(
  node: TreeNode,
): node is Extract<TreeNode, { children: TreeNode[] }> {
  return (
    'children' in node &&
    Array.isArray((node as { children?: unknown }).children)
  )
}

function visit(node: TreeNode, fn: (n: TreeNode) => void): void {
  fn(node)
  if (isContainer(node)) {
    for (const child of node.children) {
      visit(child, fn)
    }
  }
}

export function computeRichnessReport(tree: Tree): RichnessReport {
  const landmarkRoles = new Set<string>()
  let mainMultiSection = false
  let displayHeadingOne = false
  let callToAction = false
  const fontSizes = new Set<number>()
  const colors = new Set<string>()
  let imageCount = 0
  let shapeDepth = false

  visit(tree.root, (n) => {
    const node = n as unknown as Record<string, unknown>

    if (typeof node.role === 'string') {
      landmarkRoles.add(node.role)
    }

    if (node.role === 'main' && isContainer(n)) {
      const directSectionCount = n.children.filter((child) => {
        return child.type === 'section' || child.type === 'hero'
      }).length
      if (directSectionCount >= 2) {
        mainMultiSection = true
      }
    }

    if (node.type === 'button' || node.contentRole === 'cta') {
      callToAction = true
    }
    if (node.type === 'image') imageCount += 1

    const typography = node.typography as { fontSize?: unknown } | undefined
    if (
      typography !== undefined &&
      typeof typography.fontSize === 'number' &&
      Number.isFinite(typography.fontSize)
    ) {
      fontSizes.add(typography.fontSize)
      if (node.emphasis === 'heading-1' && typography.fontSize >= 48) {
        displayHeadingOne = true
      }
    }

    const color = node.color as Record<string, unknown> | undefined
    if (color !== undefined) {
      for (const key of COLOR_KEYS) {
        const value = color[key]
        if (typeof value === 'string' && value.length > 0) {
          colors.add(value.toLowerCase())
        }
      }
    }

    const shape = node.shape as Record<string, unknown> | undefined
    if (shape !== undefined) {
      if (typeof shape.shadow === 'string' && shape.shadow !== 'none') {
        shapeDepth = true
      }
      if (typeof shape.radius === 'number' && shape.radius >= 8) {
        shapeDepth = true
      }
    }
  })

  const signals = {
    hasPageLandmarks:
      landmarkRoles.has('banner') &&
      landmarkRoles.has('main') &&
      landmarkRoles.has('contentinfo'),
    hasMainMultiSection: mainMultiSection,
    hasDisplayHeadingOne: displayHeadingOne,
    hasCallToAction: callToAction,
    fontSizeVariety: fontSizes.size >= 3,
    colorVariety: colors.size >= 3,
    hasImagery: imageCount >= 1,
    hasShapeDepth: shapeDepth,
  }
  const trueCount = Object.values(signals).filter(Boolean).length
  const score = trueCount / SIGNAL_COUNT
  return { ...signals, score }
}

export function formatRichnessScore(score: number): string {
  return score.toFixed(2)
}
