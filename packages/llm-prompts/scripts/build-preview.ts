#!/usr/bin/env tsx
// Open Design 흡수 — 149 design system 시각 카탈로그 빌더.
// 산출물: packages/llm-prompts/src/design-systems/PREVIEW.html
// 각 시스템의 accent + bg + title + category 를 카드로 노출 (149개 한눈에).
// 사용: pnpm --filter @dworks/llm-prompts exec tsx scripts/build-preview.ts

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { listDesignSystemsExtended } from '../src/design-systems/loader.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(HERE, '..', 'src', 'design-systems', 'PREVIEW.html')

const systems = listDesignSystemsExtended()

// 카테고리 그룹화
const grouped = new Map<string, typeof systems>()
for (const s of systems) {
  const key = s.category ?? '기타'
  const arr = grouped.get(key) ?? []
  arr.push(s)
  grouped.set(key, arr)
}
const groups = Array.from(grouped.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(
    ([cat, list]) =>
      [cat, list.sort((a, b) => a.title.localeCompare(b.title))] as const,
  )

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        ch
      ] ?? ch,
  )
}

function renderCard(s: (typeof systems)[number]): string {
  const accent = s.accent ?? '#cccccc'
  const bg = s.bg ?? '#ffffff'
  // bg luminance — 흰/검은 텍스트 자동
  const hex = bg.replace('#', '').padEnd(6, '0').slice(0, 6)
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const fg = lum > 0.55 ? '#1a1a1a' : '#ffffff'

  return `
    <article class="card" style="background:${escapeHtml(bg)};color:${fg};">
      <header>
        <span class="swatch" style="background:${escapeHtml(accent)};border:1px solid ${fg === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};"></span>
        <span class="title">${escapeHtml(s.title)}</span>
      </header>
      <p class="meta">
        <code>${escapeHtml(s.id)}</code>
        ${s.accent !== null ? `<span>${escapeHtml(s.accent)}</span>` : ''}
        ${s.bg !== null && s.bg !== s.accent ? `<span>${escapeHtml(s.bg)}</span>` : ''}
      </p>
      ${s.blurb !== null ? `<p class="blurb">${escapeHtml(s.blurb)}</p>` : ''}
      <div class="sample">
        <button style="background:${escapeHtml(accent)};color:#fff;">Action</button>
        <span class="text-sample">Heading + body</span>
      </div>
    </article>
  `
}

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dworks Design Systems — ${systems.length}개 카탈로그</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Pretendard Variable',-apple-system,BlinkMacSystemFont,sans-serif;background:#0d0e10;color:#ebecef;padding:24px;line-height:1.5;-webkit-font-smoothing:antialiased}
  h1{font-size:28px;font-weight:700;margin-bottom:8px}
  h1 small{font-size:14px;font-weight:400;color:#898d97;margin-left:8px}
  .lede{color:#c5c8cf;font-size:14px;margin-bottom:32px;max-width:720px}
  .lede a{color:#a5b4fc}
  h2{font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#898d97;margin:32px 0 12px;border-bottom:1px solid #2a2e35;padding-bottom:6px}
  h2 small{font-weight:400;font-size:12px;text-transform:none;letter-spacing:0;color:#5b6069;margin-left:8px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
  .card{border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-height:160px;transition:transform 0.15s ease}
  .card:hover{transform:translateY(-2px)}
  .card header{display:flex;align-items:center;gap:8px}
  .swatch{display:inline-block;width:16px;height:16px;border-radius:4px;flex-shrink:0}
  .title{font-size:14px;font-weight:600;line-height:1.2}
  .meta{font-size:11px;opacity:0.7;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  .meta code{font-family:ui-monospace,SF Mono,Menlo,monospace;font-size:10px;opacity:0.8}
  .blurb{font-size:11px;opacity:0.7;line-height:1.4;flex:1}
  .sample{display:flex;align-items:center;gap:8px;margin-top:auto}
  .sample button{border:0;border-radius:4px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}
  .text-sample{font-size:11px;opacity:0.6}
  footer{margin-top:48px;padding-top:16px;border-top:1px solid #2a2e35;color:#5b6069;font-size:11px}
  footer a{color:#a5b4fc}
</style>
</head>
<body>
<h1>Dworks Design Systems <small>${systems.length}개 · Open Design 흡수 · Apache 2.0</small></h1>
<p class="lede">
  v2.1 작업 — <code>packages/llm-prompts/src/design-systems/</code> 의 <strong>149 디자인 시스템</strong> 시각 카탈로그.
  각 시스템의 <code>DESIGN.md</code> 를 <code>DesignBrief.activeDesignSystem</code> 로 활성화하면 LLM prompt 에 9 섹션 명세가 자동 inject 된다.
  원본: <a href="https://github.com/nexu-io/open-design">nexu-io/open-design</a> · 자동 생성: <code>pnpm --filter @dworks/llm-prompts exec tsx scripts/build-preview.ts</code>
</p>

${groups
  .map(
    ([cat, list]) => `
<h2>${escapeHtml(cat)} <small>${list.length}개</small></h2>
<div class="grid">
  ${list.map(renderCard).join('\n')}
</div>
`,
  )
  .join('\n')}

<footer>
  <p>${systems.length} systems · accent detected: ${systems.filter((s) => s.accent !== null).length} · bg detected: ${systems.filter((s) => s.bg !== null).length} · category coverage: ${systems.filter((s) => s.category !== null).length}</p>
  <p>Generated ${new Date().toISOString()} · <a href="../../README.md">@dworks/llm-prompts</a></p>
</footer>
</body>
</html>
`

writeFileSync(OUT_PATH, html, 'utf-8')
console.log(`Written ${OUT_PATH}`)
console.log(
  `  ${systems.length} systems · ${groups.length} categories · ${systems.filter((s) => s.accent !== null).length}/${systems.length} with accent`,
)
