// @dworks/tree-renderer — 트리 → HTML 최소 렌더러.
// 캔버스 렌더 매체로 사용 (DECISIONS D2). M0.5 범위 동결.
//
// 비범위 (M4 이후):
// - 본격 Tailwind class 매핑
// - 토큰 시스템 ↔ 실제 CSS variable 연결
// - 인라인 편집 마커 외 인터랙션 hooks

import type {
  ButtonNode,
  CardNode,
  FormNode,
  HeroNode,
  ImageNode,
  ListNode,
  SectionNode,
  TextNode,
  Tree,
  TreeNode,
} from '@dworks/tree'

// HTML special character escape — XSS 안전성 (안전장치 도구 내부).
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch)
}

function attrs(parts: Array<[string, string | undefined]>): string {
  const out = parts
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
    .join(' ')
  return out.length > 0 ? ' ' + out : ''
}

function classFromTokens(tokens?: string[]): string | undefined {
  if (!tokens || tokens.length === 0) return undefined
  // 토큰 -> CSS class 변환은 M1 토큰 시스템 정의 시 본격화. 지금은 1:1 join.
  return tokens.map((t) => `t-${t.replace(/[^a-zA-Z0-9_-]/g, '-')}`).join(' ')
}

function commonAttrs(node: TreeNode): string {
  return attrs([
    ['data-dw-node', node.id],
    ['data-dw-edit', node.editKind],
    ['class', classFromTokens(node.styleTokens)],
  ])
}

function renderText(node: TextNode): string {
  const inner = escapeHtml(node.content).replace(/\n/g, '<br />')
  switch (node.emphasis) {
    case 'heading-1':
      return `<h1${commonAttrs(node)}>${inner}</h1>`
    case 'heading-2':
      return `<h2${commonAttrs(node)}>${inner}</h2>`
    case 'heading-3':
      return `<h3${commonAttrs(node)}>${inner}</h3>`
    case 'caption':
      return `<small${commonAttrs(node)}>${inner}</small>`
    case 'body':
    default:
      return `<p${commonAttrs(node)}>${inner}</p>`
  }
}

function renderButton(node: ButtonNode): string {
  const variantAttr = attrs([['data-dw-variant', node.variant]])
  if (node.href !== undefined) {
    return `<a${commonAttrs(node)}${variantAttr}${attrs([['href', node.href]])}>${escapeHtml(node.label)}</a>`
  }
  return `<button${commonAttrs(node)}${variantAttr} type="button">${escapeHtml(node.label)}</button>`
}

function renderImage(node: ImageNode): string {
  const imageAttrs = attrs([
    ['src', node.src],
    ['alt', node.alt],
  ])
  const figureAttrs = attrs([['data-dw-aspect', node.aspectRatio]])
  return `<figure${commonAttrs(node)}${figureAttrs}><img${imageAttrs} /></figure>`
}

function renderChildren(children: TreeNode[]): string {
  return children.map(renderNode).join('')
}

function renderSection(node: SectionNode): string {
  const roleAttr = attrs([['data-dw-role', node.role]])
  return `<section${commonAttrs(node)}${roleAttr}>${renderChildren(node.children)}</section>`
}

function renderHero(node: HeroNode): string {
  return `<header${commonAttrs(node)} data-dw-role="hero">${renderChildren(node.children)}</header>`
}

function renderCard(node: CardNode): string {
  return `<article${commonAttrs(node)}>${renderChildren(node.children)}</article>`
}

function renderList(node: ListNode): string {
  const tag = node.variant === 'ordered' ? 'ol' : node.variant === 'description' ? 'dl' : 'ul'
  // dl은 dt/dd 페어가 있어야 의미적으로 정확하지만 M0.5에선 단순 children 위임.
  // 일반 list는 각 child를 <li>로 감싼다 (자식이 text/button 같은 단일 요소일 때).
  if (tag === 'dl') {
    return `<dl${commonAttrs(node)}>${renderChildren(node.children)}</dl>`
  }
  const items = node.children
    .map((child) => `<li>${renderNode(child)}</li>`)
    .join('')
  return `<${tag}${commonAttrs(node)}>${items}</${tag}>`
}

function renderForm(node: FormNode): string {
  const formAttrs = attrs([
    ['action', node.action],
    ['method', node.method],
  ])
  return `<form${commonAttrs(node)}${formAttrs}>${renderChildren(node.children)}</form>`
}

export function renderNode(node: TreeNode): string {
  switch (node.type) {
    case 'text':
      return renderText(node)
    case 'button':
      return renderButton(node)
    case 'image':
      return renderImage(node)
    case 'section':
      return renderSection(node)
    case 'hero':
      return renderHero(node)
    case 'card':
      return renderCard(node)
    case 'list':
      return renderList(node)
    case 'form':
      return renderForm(node)
  }
}

export function renderTree(tree: Tree): string {
  return renderNode(tree.root)
}
