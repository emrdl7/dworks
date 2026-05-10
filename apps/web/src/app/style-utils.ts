// 공통 style utility — page.tsx 분할의 첫 모듈.
//
// design-resolver와 캔버스 / 인스펙터가 공유하는 _순수_ helpers. 외부 의존 없음.
// page.tsx에서 분리하면서 _코드 이동만_, 로직 변경 없음.

import type { CSSProperties } from 'react'

/**
 * 여러 CSSProperties를 하나로 합침. undefined / falsy는 무시.
 * 결과가 빈 객체면 undefined 반환 — React style prop 최적화.
 */
export function mergeStyles(
  ...styles: Array<CSSProperties | undefined>
): CSSProperties | undefined {
  const merged = Object.assign({}, ...styles.filter(Boolean))
  return Object.keys(merged).length > 0 ? merged : undefined
}

/**
 * computed style의 'rgb(R, G, B)' / 'rgba(R, G, B, A)'를 #RRGGBB로 정규화.
 * 투명(alpha 0) 또는 'transparent' 등은 undefined 반환.
 */
export function rgbToHex(rgb: string): string | undefined {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return undefined
  const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  if (!m) return undefined
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  const a = m[4] !== undefined ? Number(m[4]) : 1
  if (a < 0.05) return undefined
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * #RRGGBB / #RGB을 rgba(R,G,B,A) 형식으로 변환. 잘못된 hex면 입력 그대로.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 3 && normalized.length !== 6) {
    return hex
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((digit) => `${digit}${digit}`)
          .join('')
      : normalized
  const value = Number.parseInt(expanded, 16)
  if (!Number.isFinite(value)) {
    return hex
  }

  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255

  return `rgba(${red},${green},${blue},${alpha})`
}

/**
 * hex 색상에 opacity를 적용해 CSS 색상 문자열로 반환.
 * opacity 1 이상 / undefined는 hex 그대로.
 */
export function getCssColorWithOpacity(color: string, opacity?: number): string {
  if (opacity === undefined || opacity >= 1) {
    return color
  }

  if (opacity <= 0) {
    return hexToRgba(color, 0)
  }

  return hexToRgba(color, opacity)
}
