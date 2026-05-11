// DS-03 — 토큰 export 어댑터. @dworks/exporters 의 exportDesignTokens 를
// 브라우저(apps/web) 환경에서 호출해 .css / .ts 파일을 다운로드한다.
//
// CONTEXT D-15 — html-export.ts (EXP-01/02/03) 패턴과 동일한 Blob + anchor.click() 흐름.
// 차이: payload 생성기 (exportDesignTokens), MIME (text/css | text/typescript), 확장자 (.css | .ts).

import { exportDesignTokens, type TokenExportFormat } from '@dworks/exporters'
import type { Tree } from '@dworks/tree'

export interface DownloadTokensInput {
  tree: Tree
  label: string
}

// 파일명 — html-export.ts:buildHtmlFilename 패턴과 정렬.
// {ISO timestamp(콜론/점 → 하이픈)}-{한국어/영문 safe label, 최대 40자}-tokens.{css|ts}
// label 이 비었거나 sanitize 후 빈 문자열이면 'tokens' fallback (확장자 앞 suffix 생략).
export function buildTokensFilename(
  exportedAt: Date,
  label: string,
  format: TokenExportFormat,
): string {
  const stamp = exportedAt.toISOString().replace(/[:.]/g, '-')
  const safeLabel = label
    .replace(/[^a-zA-Z0-9가-힣\-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
  const labelPart = safeLabel.length > 0 ? `-${safeLabel}` : ''
  const ext = format === 'tailwind' ? 'ts' : 'css'
  return `dworks-tokens-${stamp}${labelPart}.${ext}`
}

// 활성 generation 의 tree 를 토큰 파일로 변환해 다운로드한다.
// 브라우저 전용 — document/URL.createObjectURL/Blob 의존.
export function downloadTokens(
  input: DownloadTokensInput,
  format: TokenExportFormat,
  exportedAt: Date,
): { filename: string } {
  const content = exportDesignTokens(input.tree, format)
  const filename = buildTokensFilename(exportedAt, input.label, format)
  // Tailwind 는 TS 파일 — text/typescript 는 IANA 표준 아니지만 브라우저 다운로드용으로 충분.
  const mime = format === 'tailwind' ? 'text/typescript;charset=utf-8' : 'text/css;charset=utf-8'
  const blob = new Blob([content], { type: mime })
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
