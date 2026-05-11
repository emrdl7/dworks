// EXP-01/02/03 HTML 내보내기 어댑터 — @dworks/exporters 의 exportTreeToHtml 을
// 브라우저(apps/web) 환경에서 호출해 .html 파일을 다운로드한다.
//
// CONTEXT Phase 4 D-04 (download UI 통합) — 기존 JSON 내보내기 패턴
// (generation-export.ts + page.tsx:handleExportActiveGeneration) 과 동일한
// Blob + anchor.click() 흐름. 차이는 MIME (text/html) + 확장자 (.html) +
// payload 생성기 (exportTreeToHtml).

import { exportTreeToHtml } from '@dworks/exporters'
import type { Tree } from '@dworks/tree'

export interface DownloadHtmlInput {
  tree: Tree
  label: string
}

// 파일명 — generation-export.ts:buildExportFilename 패턴과 정렬.
// {ISO timestamp(콜론/점 → 하이픈)}-{한국어/영문 safe label, 최대 40자}.html
// label 이 비었거나 sanitize 후 빈 문자열이면 'export' fallback.
export function buildHtmlFilename(exportedAt: Date, label: string): string {
  const stamp = exportedAt.toISOString().replace(/[:.]/g, '-')
  const safeLabel = label
    .replace(/[^a-zA-Z0-9가-힣\-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
  const labelPart = safeLabel.length > 0 ? `-${safeLabel}` : '-export'
  return `dworks-generation-${stamp}${labelPart}.html`
}

// 활성 generation 의 tree 를 완성된 HTML 문서로 변환해 다운로드한다.
// 브라우저 전용 — document/URL.createObjectURL/Blob 의존.
export function downloadGenerationAsHtml(
  input: DownloadHtmlInput,
  exportedAt: Date,
): { filename: string } {
  const html = exportTreeToHtml(input.tree, {
    title: input.label,
    lang: 'ko',
  })
  const filename = buildHtmlFilename(exportedAt, input.label)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(href)
  }
  return { filename }
}
