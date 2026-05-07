// 트리 → HTML 문서 wrap.
// renderer는 노드 fragment만 반환하므로, 캡처용으로 <html><head><body>로 감싼다.
// Tailwind v4는 CDN으로 dev 시점만. M2 이후에는 next 앱의 실 빌드 사용.

import type { Tree } from '@dworks/tree'
import { renderTree } from '@dworks/tree-renderer'

export interface DocumentOptions {
  title?: string
  tailwindCdn?: boolean
  // 추가 head HTML (font preload 등). M1 1차 미사용.
  extraHead?: string
}

const TAILWIND_CDN_TAG =
  '<script src="https://cdn.tailwindcss.com"></script>'

export function wrapInDocument(
  tree: Tree,
  options: DocumentOptions = {},
): string {
  const title = options.title ?? 'Dworks preview'
  const tailwind = options.tailwindCdn === false ? '' : TAILWIND_CDN_TAG
  const extraHead = options.extraHead ?? ''
  const body = renderTree(tree)
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeAttr(title)}</title>
    ${tailwind}
    ${extraHead}
  </head>
  <body>
    ${body}
  </body>
</html>`
}

function escapeAttr(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&#39;'
      default:
        return ch
    }
  })
}
