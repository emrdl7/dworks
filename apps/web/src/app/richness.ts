// 디자인 풍부도(= 1 - AI 슬롭) 점수.
//
// apps/m3-eval/src/ai-slop.ts와 동일한 신호 set 의 web 측 측정. m3-eval은 batch
// intent별 평균, web은 chip 라벨에 단일 generation 점수를 표시한다. 신호 정의가
// 안정되면 packages/tree-quality 등으로 추출 예정.
//
// 신호 13종(각 boolean):
//   1. hasPageLandmarks         — banner/main/contentinfo role 모두 존재
//   2. hasMainMultiSection      — main 직접 하위에 section/hero 2개 이상
//   3. hasDisplayHeadingOne     — heading-1 + fontSize ≥ 48
//   4. hasCallToAction          — button 또는 contentRole 'cta' 노드 ≥ 1
//   5. fontSizeVariety          — 고유 typography.fontSize 값 ≥ 3
//   6. colorVariety             — 고유 color hex 값 ≥ 3
//   7. hasImagery               — image 노드 ≥ 1
//   8. hasShapeDepth            — shape.shadow !== 'none' 또는 radius ≥ 8 인 노드 ≥ 1
//   9. designOverrideVariety    — spacing/color/typography/shape/layout 중 하나라도 명시된 노드 ≥ 12
//  10. sectionVisualVariety     — main 직계 section/hero 의 backgroundColor/Gradient 종 ≥ 2
//  11. nodeTypeVariety          — container type ∈ {section, hero, card, list, form} 중 ≥ 3 종 사용
//  12. interactiveComponent     — type ∈ {carousel, tabs, accordion, modal} 노드 ≥ 1
//  13. entranceAnimationSpread  — entranceAnimation 명시 노드 6~12개 (적으면 부족, 많으면 산만)
//
// score = trueCount / 13 (0.0 슬롭 ~ 1.0 풍부).

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
  designOverrideVariety: boolean // #9 — spacing/color/typography/shape/layout 중 하나라도 명시된 노드 ≥ 12
  sectionVisualVariety: boolean // #10 — main 직계 section/hero bg 종 ≥ 2
  nodeTypeVariety: boolean // #11 — container type ≥ 3 종
  interactiveComponent: boolean // #12 — carousel/tabs/accordion/modal ≥ 1
  entranceAnimationSpread: boolean // #13 — entranceAnimation 명시 노드 6~12
  score: number
}

export type RichnessSignalKey = keyof Omit<RichnessReport, 'score'>

export const RICHNESS_SIGNAL_KEYS: RichnessSignalKey[] = [
  'hasPageLandmarks',
  'hasMainMultiSection',
  'hasDisplayHeadingOne',
  'hasCallToAction',
  'fontSizeVariety',
  'colorVariety',
  'hasImagery',
  'hasShapeDepth',
  'designOverrideVariety',
  'sectionVisualVariety',
  'nodeTypeVariety',
  'interactiveComponent',
  'entranceAnimationSpread',
]

const SIGNAL_COUNT = 13

const COLOR_KEYS = [
  'backgroundColor',
  'textColor',
  'borderColor',
  'accentColor',
  'overlayColor',
] as const

// #9 designOverrideVariety — 이 키들 중 하나라도 truthy 객체이면 노드별 override 카운트 +1.
const OVERRIDE_KEYS = [
  'spacing',
  'color',
  'typography',
  'shape',
  'layout',
] as const

// #11 nodeTypeVariety — container 으로 인정되는 타입 set.
const CONTAINER_TYPES = new Set([
  'section',
  'hero',
  'card',
  'list',
  'form',
])

// #12 interactiveComponent — 인터랙티브 컴포넌트로 인정되는 타입 set.
const INTERACTIVE_TYPES = new Set([
  'carousel',
  'tabs',
  'accordion',
  'modal',
])

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
  // #9~#13 누적 변수.
  let overrideCount = 0
  const sectionBgs = new Set<string>()
  const containerTypes = new Set<string>()
  let interactiveCount = 0
  let animatedCount = 0

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
      // #10 sectionVisualVariety — main 직계 section/hero 의 bg 종을 누적.
      for (const child of n.children) {
        if (child.type !== 'section' && child.type !== 'hero') continue
        const childNode = child as unknown as Record<string, unknown>
        const childColor = childNode.color as
          | Record<string, unknown>
          | undefined
        if (childColor === undefined) continue
        const bgColor = childColor.backgroundColor
        if (typeof bgColor === 'string' && bgColor.length > 0) {
          sectionBgs.add(`solid:${bgColor.toLowerCase()}`)
        }
        const bgGradient = childColor.backgroundGradient
        if (bgGradient !== undefined && bgGradient !== null) {
          // gradient 는 객체 — 키 형태로 기록 (정확한 종 비교는 JSON 직렬화 기반).
          try {
            sectionBgs.add(`gradient:${JSON.stringify(bgGradient)}`)
          } catch {
            // 직렬화 실패 시에도 종 1개로 인정.
            sectionBgs.add('gradient:unknown')
          }
        }
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

    // #9 designOverrideVariety — 노드 단위로 OVERRIDE_KEYS 중 하나라도 객체이면 +1.
    let nodeHasOverride = false
    for (const key of OVERRIDE_KEYS) {
      const value = node[key]
      if (value !== undefined && value !== null && typeof value === 'object') {
        nodeHasOverride = true
        break
      }
    }
    if (nodeHasOverride) overrideCount += 1

    // #11 nodeTypeVariety — container type set 누적.
    if (typeof node.type === 'string' && CONTAINER_TYPES.has(node.type)) {
      containerTypes.add(node.type)
    }

    // #12 interactiveComponent — interactive type 카운트.
    if (typeof node.type === 'string' && INTERACTIVE_TYPES.has(node.type)) {
      interactiveCount += 1
    }

    // #13 entranceAnimationSpread — entranceAnimation 명시 노드 수.
    if (node.entranceAnimation !== undefined && node.entranceAnimation !== null) {
      animatedCount += 1
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
    designOverrideVariety: overrideCount >= 12,
    sectionVisualVariety: sectionBgs.size >= 2,
    nodeTypeVariety: containerTypes.size >= 3,
    interactiveComponent: interactiveCount >= 1,
    entranceAnimationSpread: animatedCount >= 6 && animatedCount <= 12,
  }
  const trueCount = Object.values(signals).filter(Boolean).length
  const score = trueCount / SIGNAL_COUNT
  return { ...signals, score }
}

export function formatRichnessScore(score: number): string {
  return score.toFixed(2)
}

// 13 신호 풍부도 검증 + missing 키 list 추출.
// generation-normalize 의 enforceRichness hook 이 어떤 신호가 미달인지 판단하기 위해 사용한다.
export function validateTreeRichness(tree: Tree): {
  signals: Omit<RichnessReport, 'score'>
  score: number
  missing: RichnessSignalKey[]
} {
  const report = computeRichnessReport(tree)
  const { score, ...signals } = report
  const missing = RICHNESS_SIGNAL_KEYS.filter((key) => signals[key] === false)
  return { signals, score, missing }
}
