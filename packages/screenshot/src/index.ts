// @dworks/screenshot — 트리 → HTML wrap → Playwright viewport별 PNG.

export { wrapInDocument } from './document.js'
export type { DocumentOptions } from './document.js'

export {
  captureTree,
  withBrowserPage,
  DEFAULT_VIEWPORTS,
} from './capture.js'
export type {
  CaptureOptions,
  CaptureResult,
  ViewportLabel,
  ViewportSpec,
} from './capture.js'
