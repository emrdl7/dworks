// TextPreview — text 노드 emphasis별 렌더 컴포넌트.
//
// page.tsx 분할(Phase 6): TextPreview + 의존하는 typography/markdown helpers를
// 한 모듈로 분리. resolver의 emphasis-driven typography default가 style로 적용되어
// 시각 결과는 분할 전과 동일.

import type { CSSProperties, ReactNode } from 'react'

import type { FontFamily, TextNode, TextShadow, Typography } from '@dworks/tree'

import { resolveTypography } from './design-resolver'
import type { ResponsiveViewport } from './responsive'
import { getCssColorWithOpacity, mergeStyles } from './style-utils'

const KOREAN_SANS_FALLBACK_STACK =
  '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Helvetica Neue", "Segoe UI", Arial, sans-serif'

export function getFontFamilyStack(fontFamily: FontFamily): string {
  if (fontFamily === 'serif') {
    return 'ui-serif, "Noto Serif KR", Georgia, serif'
  }

  if (fontFamily === 'mono') {
    return 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'
  }

  if (fontFamily !== 'sans') {
    return `"${fontFamily.replaceAll('"', '\\"')}", ${KOREAN_SANS_FALLBACK_STACK}`
  }

  return KOREAN_SANS_FALLBACK_STACK
}

export function textShadowToCss(shadow: TextShadow): string {
  return [
    `${shadow.offsetX}px`,
    `${shadow.offsetY}px`,
    `${shadow.blur}px`,
    getCssColorWithOpacity(shadow.color, shadow.opacity),
  ].join(' ')
}

export function getTypographyStyle(
  typography?: Typography,
): CSSProperties | undefined {
  if (!typography) {
    return undefined
  }

  return {
    ...(typography.fontSize !== undefined
      ? { fontSize: `${typography.fontSize}px` }
      : {}),
    ...(typography.fontWeight !== undefined
      ? { fontWeight: typography.fontWeight }
      : {}),
    ...(typography.lineHeight !== undefined
      ? { lineHeight: typography.lineHeight }
      : {}),
    ...(typography.letterSpacing !== undefined
      ? { letterSpacing: `${typography.letterSpacing}em` }
      : {}),
    ...(typography.textAlign !== undefined
      ? { textAlign: typography.textAlign }
      : {}),
    ...(typography.fontFamily !== undefined
      ? { fontFamily: getFontFamilyStack(typography.fontFamily) }
      : {}),
    ...(typography.textShadow !== undefined
      ? { textShadow: textShadowToCss(typography.textShadow) }
      : {}),
  }
}

function isFragmentHref(href: string): boolean {
  return href.startsWith('#')
}

// XSS 방지: control character (U+0000~U+001F + DEL U+007F) 포함 href 차단.
function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

function getSafeInlineHref(href: string): string | null {
  const trimmedHref = href.trim()

  if (trimmedHref.length === 0 || hasControlCharacter(trimmedHref)) {
    return null
  }

  if (isFragmentHref(trimmedHref)) {
    return trimmedHref
  }

  try {
    const parsedUrl = new URL(trimmedHref)
    const allowedProtocols = new Set(['http:', 'https:', 'mailto:'])

    return allowedProtocols.has(parsedUrl.protocol) ? trimmedHref : null
  } catch {
    return null
  }
}

function parseInlineMarkdown(content: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const inlinePattern =
    /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g
  let lastIndex = 0

  for (const match of content.matchAll(inlinePattern)) {
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      nodes.push(content.slice(lastIndex, matchIndex))
    }

    const rawMatch = match[0]
    const linkText = match[1]
    const linkHref = match[2]
    const boldText = match[3]
    const italicText = match[4]
    const key = `${matchIndex}-${rawMatch.length}`

    if (linkText !== undefined && linkHref !== undefined) {
      const safeHref = getSafeInlineHref(linkHref)

      if (safeHref) {
        nodes.push(
          <a
            key={`link-${key}`}
            className="font-semibold text-[var(--dw-accent)] underline underline-offset-4"
            href={safeHref}
            target={isFragmentHref(safeHref) ? undefined : '_blank'}
            rel={isFragmentHref(safeHref) ? undefined : 'noopener noreferrer'}
            onClick={(event) => event.preventDefault()}
          >
            {linkText}
          </a>,
        )
      } else {
        nodes.push(rawMatch)
      }
    } else if (boldText !== undefined) {
      nodes.push(
        <strong key={`bold-${key}`} className="font-semibold">
          {boldText}
        </strong>,
      )
    } else if (italicText !== undefined) {
      nodes.push(
        <em key={`italic-${key}`} className="italic">
          {italicText}
        </em>,
      )
    }

    lastIndex = matchIndex + rawMatch.length
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [content]
}

export function TextPreview({
  accentColorStyle,
  node,
  textColorStyle,
  viewport,
}: {
  accentColorStyle?: CSSProperties
  node: TextNode
  textColorStyle?: CSSProperties
  viewport?: ResponsiveViewport
}) {
  // resolveTypography 결과(emphasis-driven default + explicit + viewport override)를 style로.
  // text color token(var(--dw-*))은 부모 컨테이너 / resolveColor의 emphasis token slot이 처리.
  const typographyStyle = getTypographyStyle(
    resolveTypography(node, viewport ? { viewport } : undefined).value,
  )
  const textStyle = mergeStyles(typographyStyle, textColorStyle)
  const captionTextStyle = mergeStyles(textStyle, accentColorStyle)
  const content = parseInlineMarkdown(node.content)

  switch (node.emphasis) {
    case 'heading-1':
      return (
        <h2 className="max-w-3xl" style={textStyle}>
          {content}
        </h2>
      )
    case 'heading-2':
      // textColor token(textPrimary)은 resolveColor가 처리해 effectiveTextColor로 이미 적용
      return <h3 style={textStyle}>{content}</h3>
    case 'heading-3':
      return <h4 style={textStyle}>{content}</h4>
    case 'caption':
      // caption textColor token(accent)도 resolveColor가 처리. uppercase는 typography 영역 밖이라 className 유지.
      return (
        <p className="uppercase" style={captionTextStyle}>
          {content}
        </p>
      )
    case 'body':
    default:
      return (
        <p className="max-w-2xl" style={textStyle}>
          {content}
        </p>
      )
  }
}
