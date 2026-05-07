// 트리 → Playwright viewport별 PNG.
// PLAN.md §3 정규 viewport 440/768/1440. base64 png를 in-memory로 반환하거나
// 파일 경로에 저장.
//
// 첫 실행 전: `npx playwright install chromium` 필요.
// M1 단계에서는 dev tool 호출 패턴만 정의, 실제 사용은 12 brief 점수 산출 시.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import type { Tree } from '@dworks/tree'
import { chromium, type Browser, type Page } from 'playwright'

import { wrapInDocument } from './document.js'

export type ViewportLabel = 'mobile' | 'tablet' | 'desktop'

export interface ViewportSpec {
  label: ViewportLabel
  width: number
  height: number
}

export const DEFAULT_VIEWPORTS: ViewportSpec[] = [
  { label: 'mobile', width: 440, height: 900 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'desktop', width: 1440, height: 900 },
]

export interface CaptureOptions {
  viewports?: ViewportSpec[]
  // PNG 저장 경로 prefix. 미지정이면 in-memory(base64)만 반환.
  // 실제 파일은 `${pathPrefix}-${viewport}.png`.
  pathPrefix?: string
  // full-page 또는 first viewport. 둘 다 필요할 수도 있어 옵션.
  fullPage?: boolean
  // Tailwind CDN 사용 여부. M1 1차 true.
  tailwindCdn?: boolean
}

export interface CaptureResult {
  viewport: ViewportLabel
  width: number
  height: number
  base64Png: string
  filePath?: string
}

/**
 * 단일 트리에 대해 viewport별 스크린샷을 생성.
 * Playwright chromium을 1회 띄우고 viewport별로 page.setViewportSize.
 */
export async function captureTree(
  tree: Tree,
  options: CaptureOptions = {},
): Promise<CaptureResult[]> {
  const viewports = options.viewports ?? DEFAULT_VIEWPORTS
  const fullPage = options.fullPage ?? true

  const html = wrapInDocument(tree, {
    tailwindCdn: options.tailwindCdn ?? true,
  })

  let browser: Browser | undefined
  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })

    const results: CaptureResult[] = []
    for (const v of viewports) {
      await page.setViewportSize({ width: v.width, height: v.height })
      // tailwind CDN이 layout에 영향을 주므로 약간 대기.
      await page.waitForTimeout(150)
      const buffer = await page.screenshot({ fullPage, type: 'png' })
      const base64 = buffer.toString('base64')
      const result: CaptureResult = {
        viewport: v.label,
        width: v.width,
        height: v.height,
        base64Png: base64,
      }
      if (options.pathPrefix !== undefined) {
        const filePath = `${options.pathPrefix}-${v.label}.png`
        await mkdir(dirname(filePath), { recursive: true })
        await writeFile(filePath, buffer)
        result.filePath = filePath
      }
      results.push(result)
    }
    return results
  } finally {
    if (browser !== undefined) await browser.close()
  }
}

/**
 * 단일 page를 재사용해 여러 트리를 캡처할 때의 헬퍼.
 * 12 brief × 7 axis × 3 viewport 시나리오에서 browser 재생성 비용 감소.
 */
export async function withBrowserPage<T>(
  fn: (page: Page, render: (tree: Tree) => Promise<void>) => Promise<T>,
  options: { tailwindCdn?: boolean } = {},
): Promise<T> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext()
    const page = await context.newPage()
    const render = async (tree: Tree) => {
      const html = wrapInDocument(tree, { tailwindCdn: options.tailwindCdn ?? true })
      await page.setContent(html, { waitUntil: 'networkidle' })
    }
    return await fn(page, render)
  } finally {
    await browser.close()
  }
}
