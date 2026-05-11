// EXP-01/02/03 HTML exporter — Embla CDN + vanilla JS + IntersectionObserver wrap.
// CONTEXT D-01 (full document), D-02 (feature detect), D-03 (inline CSS lite), D-04 (download UI hook).
//
// 트리 순회는 _children 필드만_ 재귀 (TreeNode 가 들어있는 유일한 필드).
// CarouselItem / TabItem / AccordionItem 은 TreeNode 가 아니므로 descend 하지 않음
// (스키마 검증: packages/tree/src/schema.ts 578-672).

import { renderTree } from '@dworks/tree-renderer'
import type { Tree, TreeNode } from '@dworks/tree'

import {
  TABS_SCRIPT,
  MODAL_SCRIPT,
  ACCORDION_SCRIPT,
  CAROUSEL_INIT_SCRIPT,
  ENTRANCE_ANIMATION_SCRIPT,
  BASE_CSS,
} from './html-scripts'

export interface ExportFeatures {
  hasCarousel: boolean
  hasTabs: boolean
  hasAccordion: boolean
  hasModal: boolean
  hasEntranceAnimation: boolean
}

export interface ExportHtmlOptions {
  title?: string
  // 기본 'ko' — 한국어 우선 (CLAUDE.md 정책).
  lang?: string
}

// Embla Carousel UMD CDN (8.5.0 stable, CONTEXT D-05).
const EMBLA_CDN = 'https://unpkg.com/embla-carousel@8.5.0/embla-carousel.umd.js'
// Pretendard Variable web font (CONTEXT D-03, lite CSS 포함).
const PRETENDARD_CDN =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css'

// HTML attribute / text 내부에서 안전한 escape.
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

// 트리를 순회하며 인터랙티브 노드 5종을 검출.
// 검출된 기능만 head/body script injection 분기에 사용 — payload 최소화.
export function detectFeatures(tree: Tree): ExportFeatures {
  const features: ExportFeatures = {
    hasCarousel: false,
    hasTabs: false,
    hasAccordion: false,
    hasModal: false,
    hasEntranceAnimation: false,
  }

  function visit(node: TreeNode): void {
    if (node.type === 'carousel') features.hasCarousel = true
    if (node.type === 'tabs') features.hasTabs = true
    if (node.type === 'accordion') features.hasAccordion = true
    if (node.type === 'modal') features.hasModal = true
    // BaseNodeMeta.entranceAnimation — 모든 노드 type 공통 optional 필드.
    if (node.entranceAnimation !== undefined) {
      features.hasEntranceAnimation = true
    }
    // 컨테이너 노드만 children 보유 (section/hero/card/list/form).
    const children = (node as { children?: TreeNode[] }).children
    if (Array.isArray(children)) children.forEach(visit)
  }

  visit(tree.root)
  return features
}

// 트리 → 완성된 <!DOCTYPE html> 문서. body 는 renderTree, head/script 는 자동 wrap.
export function exportTreeToHtml(tree: Tree, options: ExportHtmlOptions = {}): string {
  const title = options.title ?? 'Dworks Export'
  const lang = options.lang ?? 'ko'
  const body = renderTree(tree)
  const features = detectFeatures(tree)
  const head = buildHead(title, lang, features)
  const scripts = buildScripts(features)
  return `<!DOCTYPE html>\n<html lang="${escapeHtml(lang)}">\n<head>\n${head}\n</head>\n<body>\n${body}\n${scripts}\n</body>\n</html>\n`
}

function buildHead(title: string, lang: string, features: ExportFeatures): string {
  // lang 인자는 head 빌드에 직접 쓰이지 않지만 (html 태그에 박힘),
  // 향후 lang 별 분기 (font fallback) 가능성에 대비해 시그니처 유지.
  void lang
  const parts: string[] = []
  parts.push(`<meta charset="UTF-8">`)
  parts.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`)
  parts.push(`<title>${escapeHtml(title)}</title>`)
  parts.push(`<link rel="stylesheet" href="${PRETENDARD_CDN}">`)
  parts.push(`<style>${BASE_CSS}</style>`)
  // Carousel 노드가 있어야만 Embla CDN 로드 — 다른 export 는 외부 의존 0.
  if (features.hasCarousel) {
    parts.push(`<script src="${EMBLA_CDN}" defer></script>`)
  }
  return parts.join('\n')
}

function buildScripts(features: ExportFeatures): string {
  const scripts: string[] = []
  // 순서: 라이트(데이터 attr 토글) → 무거운 것(애니메이션). 모두 IIFE — 글로벌 미오염.
  if (features.hasTabs) scripts.push(`<script>${TABS_SCRIPT}</script>`)
  if (features.hasModal) scripts.push(`<script>${MODAL_SCRIPT}</script>`)
  if (features.hasAccordion) scripts.push(`<script>${ACCORDION_SCRIPT}</script>`)
  if (features.hasCarousel) scripts.push(`<script>${CAROUSEL_INIT_SCRIPT}</script>`)
  if (features.hasEntranceAnimation) scripts.push(`<script>${ENTRANCE_ANIMATION_SCRIPT}</script>`)
  return scripts.join('\n')
}
