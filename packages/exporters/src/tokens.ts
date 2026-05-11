// DS-03 디자인 토큰 export — 트리에서 사용된 hex/spacing/radius/fontSize/fontFamily 추출.
// CONTEXT D-11 (extractDesignTokens), D-12 (Tailwind config + CSS variables), D-13 (adapter).
//
// 트리 순회는 _children 필드만_ 재귀 (TreeNode 가 들어있는 유일한 필드).
// CarouselItem / TabItem / AccordionItem 은 TreeNode 가 아니므로 descend 하지 않음.
// (html.ts 의 detectFeatures 패턴과 동일)
//
// 스키마 출처: packages/tree/src/schema.ts
//   - NodeColor: backgroundColor, textColor, accentColor + hover/active/focus/disabled 변형 11종
//   - Shape: radius (+ corner 변형 4종), borderColor, borderWidth
//   - Spacing: paddingTop/Right/Bottom/Left, marginTop/Right/Bottom/Left, gap (총 9 종 px)
//   - Typography: fontSize (px), fontFamily (string)
//   - ImagePresentation: overlayColor

import type { Tree, TreeNode } from '@dworks/tree'

export interface ExtractedTokens {
  colors: string[] // hex (정렬 + dedup, lowercase 정규화)
  spacing: number[] // px (정렬 + dedup)
  radius: number[] // px
  fontSize: number[] // px
  fontFamily: string[]
}

// NodeColor 의 모든 hex 필드 — interaction state 까지 전부 토큰화.
const COLOR_KEYS = [
  'backgroundColor',
  'textColor',
  'accentColor',
  'hoverBackgroundColor',
  'hoverTextColor',
  'activeBackgroundColor',
  'activeTextColor',
  'focusBackgroundColor',
  'focusTextColor',
  'disabledBackgroundColor',
  'disabledTextColor',
] as const

// Shape 의 radius 변형 — uniform + corner 별 4 종.
const RADIUS_KEYS = [
  'radius',
  'radiusTopLeft',
  'radiusTopRight',
  'radiusBottomRight',
  'radiusBottomLeft',
] as const

// Spacing 의 padding/margin/gap 전 9 종 — 모두 px 값.
const SPACING_KEYS = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'gap',
] as const

// hex 정규식 — schema 의 hexColorSchema 와 동일 (3 또는 6 자리).
// 토큰 export 는 8자리(알파) 도 받아주나, 스키마상 6자리까지만 valid.
const HEX_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function maybeAddHex(set: Set<string>, value: unknown): void {
  if (typeof value === 'string' && HEX_REGEX.test(value)) {
    set.add(value.toLowerCase())
  }
}

export function extractDesignTokens(tree: Tree): ExtractedTokens {
  const colors = new Set<string>()
  const spacing = new Set<number>()
  const radius = new Set<number>()
  const fontSize = new Set<number>()
  const fontFamily = new Set<string>()

  function visit(node: TreeNode): void {
    // color (NodeColor) — interaction state 까지 11 종 hex 키.
    const color = (node as { color?: Record<string, unknown> }).color
    if (color !== undefined) {
      for (const key of COLOR_KEYS) {
        maybeAddHex(colors, color[key])
      }
    }

    // shape (Shape) — borderColor 는 여기, radius 는 5 종 변형.
    const shape = (node as { shape?: Record<string, unknown> }).shape
    if (shape !== undefined) {
      maybeAddHex(colors, shape.borderColor)
      for (const key of RADIUS_KEYS) {
        const v = shape[key]
        if (typeof v === 'number') radius.add(v)
      }
    }

    // spacing (Spacing) — padding/margin 각 4 방향 + gap.
    const spacingProp = (node as { spacing?: Record<string, unknown> }).spacing
    if (spacingProp !== undefined) {
      for (const key of SPACING_KEYS) {
        const v = spacingProp[key]
        if (typeof v === 'number') spacing.add(v)
      }
    }

    // typography — fontSize (px) + fontFamily (문자열).
    const typography = (node as { typography?: Record<string, unknown> }).typography
    if (typography !== undefined) {
      const fs = typography.fontSize
      if (typeof fs === 'number') fontSize.add(fs)
      const ff = typography.fontFamily
      if (typeof ff === 'string' && ff.trim().length > 0) fontFamily.add(ff)
    }

    // presentation.overlayColor — image 노드의 overlay 색.
    const presentation = (node as { presentation?: Record<string, unknown> }).presentation
    if (presentation !== undefined) {
      maybeAddHex(colors, presentation.overlayColor)
    }

    // 컨테이너 노드만 children 보유 (section/hero/card/list/form).
    const children = (node as { children?: TreeNode[] }).children
    if (Array.isArray(children)) children.forEach(visit)
  }

  visit(tree.root)

  return {
    colors: Array.from(colors).sort(),
    spacing: Array.from(spacing).sort((a, b) => a - b),
    radius: Array.from(radius).sort((a, b) => a - b),
    fontSize: Array.from(fontSize).sort((a, b) => a - b),
    fontFamily: Array.from(fontFamily).sort(),
  }
}

export type TokenExportFormat = 'tailwind' | 'css'

// 트리 → Tailwind config (.ts) 또는 CSS variables (.css) 문자열.
// 빈 트리는 빈 골격 (Tailwind: `theme.extend` 비어있음 / CSS: `:root { }`) 반환.
export function exportDesignTokens(tree: Tree, format: TokenExportFormat): string {
  const tokens = extractDesignTokens(tree)
  if (format === 'tailwind') return formatTailwind(tokens)
  return formatCss(tokens)
}

function formatTailwind(tokens: ExtractedTokens): string {
  const lines: string[] = []
  lines.push('// Dworks 추출 디자인 토큰 — Tailwind config (.ts)')
  lines.push('// DS-03 token export — 트리에서 사용된 색/간격/radius/font 토큰화.')
  lines.push("import type { Config } from 'tailwindcss'")
  lines.push('')
  lines.push('const config: Config = {')
  lines.push('  theme: {')
  lines.push('    extend: {')

  if (tokens.colors.length > 0) {
    lines.push('      colors: {')
    tokens.colors.forEach((c, i) => {
      lines.push(`        'dw-${i + 1}': '${c}',`)
    })
    lines.push('      },')
  }

  if (tokens.spacing.length > 0) {
    lines.push('      spacing: {')
    tokens.spacing.forEach((px) => {
      lines.push(`        'dw-${px}': '${px}px',`)
    })
    lines.push('      },')
  }

  if (tokens.radius.length > 0) {
    lines.push('      borderRadius: {')
    tokens.radius.forEach((px) => {
      lines.push(`        'dw-${px}': '${px}px',`)
    })
    lines.push('      },')
  }

  if (tokens.fontSize.length > 0) {
    lines.push('      fontSize: {')
    tokens.fontSize.forEach((px) => {
      lines.push(`        'dw-${px}': '${px}px',`)
    })
    lines.push('      },')
  }

  if (tokens.fontFamily.length > 0) {
    lines.push('      fontFamily: {')
    tokens.fontFamily.forEach((ff, i) => {
      lines.push(`        'dw-${i + 1}': [${JSON.stringify(ff)}],`)
    })
    lines.push('      },')
  }

  lines.push('    },')
  lines.push('  },')
  lines.push('  content: [],')
  lines.push('}')
  lines.push('')
  lines.push('export default config')
  return lines.join('\n') + '\n'
}

function formatCss(tokens: ExtractedTokens): string {
  const lines: string[] = []
  lines.push('/* Dworks 추출 디자인 토큰 — CSS variables */')
  lines.push('/* DS-03 token export — 트리에서 사용된 색/간격/radius/font 토큰화. */')
  lines.push(':root {')

  tokens.colors.forEach((c, i) => {
    lines.push(`  --dw-token-color-${i + 1}: ${c};`)
  })
  tokens.spacing.forEach((px) => {
    lines.push(`  --dw-token-space-${px}: ${px}px;`)
  })
  tokens.radius.forEach((px) => {
    lines.push(`  --dw-token-radius-${px}: ${px}px;`)
  })
  tokens.fontSize.forEach((px) => {
    lines.push(`  --dw-token-fontsize-${px}: ${px}px;`)
  })
  tokens.fontFamily.forEach((ff, i) => {
    lines.push(`  --dw-token-font-${i + 1}: ${ff};`)
  })

  lines.push('}')
  return lines.join('\n') + '\n'
}
