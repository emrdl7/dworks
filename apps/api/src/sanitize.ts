const COLOR_WITH_OPTIONAL_ALPHA_RE =
  /^rgba?\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)(?:\s*,\s*([+-]?\d*\.?\d+%?))?\s*\)$/i

const HSL_WITH_OPTIONAL_ALPHA_RE =
  /^hsla?\(\s*([+-]?\d*\.?\d+)(?:deg)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%(?:\s*,\s*([+-]?\d*\.?\d+%?))?\s*\)$/i

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const OPACITY_PEERS: Record<string, string> = {
  accentColor: 'accentOpacity',
  backgroundColor: 'backgroundOpacity',
  borderColor: 'borderOpacity',
  color: 'opacity',
  from: 'fromOpacity',
  overlayColor: 'overlayOpacity',
  textColor: 'textOpacity',
  to: 'toOpacity',
}

const COLOR_KEY_RE = /(?:^color$|Color$|^from$|^to$)/

const FONT_WEIGHT_ALIASES: Record<string, string> = {
  black: '900',
  bold: '700',
  extrabold: '800',
  light: '300',
  medium: '500',
  normal: '400',
  regular: '400',
  semibold: '600',
  thin: '100',
}

const JUSTIFY_ALIASES: Record<string, string> = {
  'flex-end': 'end',
  'flex-start': 'start',
  'space-around': 'evenly',
  'space-between': 'between',
  'space-evenly': 'evenly',
}

const ROLE_ALIASES: Record<string, string> = {
  footer: 'contentinfo',
  header: 'banner',
  main: 'main',
}

export function sanitizeGeneratedTreeJson(input: unknown): unknown {
  return sanitizeValue(input)
}

function sanitizeValue(value: unknown, key?: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item))
  }
  if (value === null || typeof value !== 'object') {
    return sanitizeScalar(value, key)
  }

  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [entryKey, entryValue] of Object.entries(source)) {
    const sanitized = sanitizeValue(entryValue, entryKey)
    result[entryKey] = sanitized

    if (typeof entryValue === 'string' && COLOR_KEY_RE.test(entryKey)) {
      const color = parseCssColor(entryValue)
      if (color !== null) {
        result[entryKey] = color.hex
        const opacityKey = OPACITY_PEERS[entryKey]
        if (
          opacityKey !== undefined &&
          color.opacity !== undefined &&
          source[opacityKey] === undefined
        ) {
          result[opacityKey] = color.opacity
        }
      }
    }
  }

  return result
}

function sanitizeScalar(value: unknown, key?: string): unknown {
  if (key === 'letterSpacing') {
    return sanitizeLetterSpacing(value)
  }
  if (key === 'fontWeight') {
    return sanitizeFontWeight(value)
  }
  if (key === 'justify' && typeof value === 'string') {
    return JUSTIFY_ALIASES[value] ?? value
  }
  if (key === 'role' && typeof value === 'string') {
    return ROLE_ALIASES[value] ?? value
  }
  if (key !== undefined && key.endsWith('Opacity')) {
    return sanitizeOpacity(value)
  }
  return value
}

function sanitizeLetterSpacing(value: unknown): unknown {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return value
  }
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  if (!Number.isFinite(parsed)) {
    return value
  }
  return clamp(parsed, -0.1, 0.2)
}

function sanitizeFontWeight(value: unknown): unknown {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().replace(/\s+/g, '')
    return FONT_WEIGHT_ALIASES[normalized] ?? value
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return value
  }
  const rounded = Math.round(value / 100) * 100
  return String(clamp(rounded, 100, 900))
}

function sanitizeOpacity(value: unknown): unknown {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return value
  }
  const parsed = parseAlpha(value)
  if (parsed === undefined) {
    return value
  }
  return parsed
}

function parseCssColor(value: string): { hex: string; opacity?: number } | null {
  const trimmed = value.trim()
  if (HEX_COLOR_RE.test(trimmed)) {
    return { hex: normalizeHex(trimmed) }
  }

  const rgbMatch = COLOR_WITH_OPTIONAL_ALPHA_RE.exec(trimmed)
  if (rgbMatch !== null) {
    const [r, g, b] = rgbMatch.slice(1, 4).map((part) =>
      clamp(Math.round(Number(part)), 0, 255),
    )
    return {
      hex: rgbToHex(r ?? 0, g ?? 0, b ?? 0),
      ...parseOptionalAlpha(rgbMatch[4]),
    }
  }

  const hslMatch = HSL_WITH_OPTIONAL_ALPHA_RE.exec(trimmed)
  if (hslMatch !== null) {
    const hue = Number(hslMatch[1])
    const saturation = Number(hslMatch[2])
    const lightness = Number(hslMatch[3])
    const [r, g, b] = hslToRgb(hue, saturation, lightness)
    return {
      hex: rgbToHex(r, g, b),
      ...parseOptionalAlpha(hslMatch[4]),
    }
  }

  return null
}

function parseOptionalAlpha(alpha: string | undefined): { opacity?: number } {
  const parsed = parseAlpha(alpha)
  return parsed === undefined ? {} : { opacity: parsed }
}

function parseAlpha(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? clamp(value, 0, 1) : undefined
  }
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return undefined
  }
  const isPercent = trimmed.endsWith('%')
  const parsed = Number.parseFloat(trimmed)
  if (!Number.isFinite(parsed)) {
    return undefined
  }
  return clamp(isPercent ? parsed / 100 : parsed, 0, 1)
}

function normalizeHex(hex: string): string {
  const lower = hex.toLowerCase()
  if (lower.length !== 4) {
    return lower
  }
  return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((component) => component.toString(16).padStart(2, '0'))
    .join('')}`
}

function hslToRgb(hue: number, saturation: number, lightness: number): [
  number,
  number,
  number,
] {
  const h = ((hue % 360) + 360) % 360
  const s = clamp(saturation, 0, 100) / 100
  const l = clamp(lightness, 0, 100) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r1, g1, b1] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
