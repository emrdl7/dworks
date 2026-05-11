// 참고 이미지에서 dominant color + aspect ratio 추출 — m3-generate-image-ref MVP.
//
// vision-LLM 의존 없이 web canvas에서 픽셀을 sampling해 RGB 히스토그램 bucket 빈도로
// 상위 N 색을 hex로 추출한다. LLM은 이 색 hex를 디자인 팔레트의 시드로 활용한다.
//
// API 형태:
//   - extractDominantColors(imageData, count) → string[]   소문자 #rrggbb, 빈도 desc
//   - pickAspectRatio(width, height)          → 'square' | 'landscape' | 'portrait' | 'wide'
//   - analyzeDominantColors(imageData, count) → { hexes, classifications } HSL light/dark/neutral 분류
//   - extractLayoutIntent(imageData)          → 'centered' | 'left-aligned' | 'grid' | 'asymmetric'
//   - rgbToHsl(r, g, b)                       → [h, s, l] (0-1 ratio, internal helper)
//
// 순수 함수 — DOM 없이 ImageData(=Uint8ClampedArray + width)만 받는다. 호출 측이
// File → ObjectURL → HTMLImageElement → canvas.drawImage → getImageData를 책임진다.

export interface RgbaPixelSource {
  /** RGBA 평면 array. 길이 = width × height × 4. */
  data: Uint8ClampedArray | number[]
  width: number
  height: number
}

const QUANTIZE_STEP = 32

export function extractDominantColors(
  source: RgbaPixelSource,
  count = 5,
): string[] {
  if (count <= 0) return []
  const buckets = new Map<
    number,
    { rSum: number; gSum: number; bSum: number; n: number }
  >()
  const data = source.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0
    const g = data[i + 1] ?? 0
    const b = data[i + 2] ?? 0
    const a = data[i + 3] ?? 255
    if (a < 128) continue
    const key =
      Math.floor(r / QUANTIZE_STEP) * 64 +
      Math.floor(g / QUANTIZE_STEP) * 8 +
      Math.floor(b / QUANTIZE_STEP)
    const bucket = buckets.get(key)
    if (bucket === undefined) {
      buckets.set(key, { rSum: r, gSum: g, bSum: b, n: 1 })
    } else {
      bucket.rSum += r
      bucket.gSum += g
      bucket.bSum += b
      bucket.n += 1
    }
  }

  const entries = Array.from(buckets.values()).sort((a, b) => b.n - a.n)
  const top = entries.slice(0, count)
  return top.map((bucket) =>
    rgbToHex(
      Math.round(bucket.rSum / bucket.n),
      Math.round(bucket.gSum / bucket.n),
      Math.round(bucket.bSum / bucket.n),
    ),
  )
}

// RGB(0-255) → HSL(0-1 ratio). luminance L 로 light/dark/neutral 분류에 사용.
// 순수 수학 함수 — external dep 없음.
function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h /= 6
  }
  return [h, s, l]
}

// hex(#rrggbb) → luminance 기준 light/dark/neutral 분류.
// L >= 0.7 → light, L <= 0.3 → dark, 그 외 → neutral.
function classifyByLuminance(hex: string): 'light' | 'dark' | 'neutral' {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const [, , l] = rgbToHsl(r, g, b)
  if (l >= 0.7) return 'light'
  if (l <= 0.3) return 'dark'
  return 'neutral'
}

export interface DominantColorsAnalysis {
  /** 빈도 상위 hex 색 (소문자 #rrggbb). 최대 count 개. */
  hexes: string[]
  /** 각 hex 의 light/dark/neutral 분류 (HSL luminance 기준). hexes 와 같은 length. */
  classifications: Array<'light' | 'dark' | 'neutral'>
}

/**
 * dominant 5색 + light/dark/neutral 분류 분석.
 * extractDominantColors 결과를 HSL luminance 로 분류한 통합 결과.
 */
export function analyzeDominantColors(
  source: RgbaPixelSource,
  count = 5,
): DominantColorsAnalysis {
  const hexes = extractDominantColors(source, count)
  const classifications = hexes.map(classifyByLuminance)
  return { hexes, classifications }
}

export function pickAspectRatio(
  width: number,
  height: number,
): 'square' | 'landscape' | 'portrait' | 'wide' | null {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null
  }
  const ratio = width / height
  if (ratio >= 1.7) return 'wide'
  if (ratio >= 1.2) return 'landscape'
  if (ratio <= 0.8) return 'portrait'
  return 'square'
}

/** 이미지 콘텐츠의 레이아웃 의도. v1 은 4사분면 픽셀 분포 heuristic. */
export type LayoutIntent =
  | 'centered'
  | 'left-aligned'
  | 'grid'
  | 'asymmetric'

/**
 * 이미지 4사분면 (좌상/우상/좌하/우하) 의 _콘텐츠 픽셀_ 밀도로 레이아웃 의도를 추출.
 * 콘텐츠 픽셀 기준: alpha >= 128 인 픽셀만 카운트.
 * heuristic:
 *   - 좌측 두 사분면 합 / 총 ≥ 0.7 → 'left-aligned' (ME-03: 0.6 → 0.7 보수화)
 *   - 중앙 영역 (가로/세로 25-75% box) 픽셀 / 총 ≥ 0.6 → 'centered'
 *   - 4 사분면 비율 변동계수 (stdev/mean) < 0.2 → 'grid'
 *   - 나머지 → 'asymmetric'
 */
export function extractLayoutIntent(source: RgbaPixelSource): LayoutIntent {
  const { data, width, height } = source
  const halfW = width / 2
  const halfH = height / 2
  // 중앙 박스 영역 (전체 가로/세로의 25~75% 구간).
  const cx0 = width * 0.25
  const cx1 = width * 0.75
  const cy0 = height * 0.25
  const cy1 = height * 0.75
  let tl = 0
  let tr = 0
  let bl = 0
  let br = 0
  let centerBox = 0
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] ?? 255
    if (a < 128) continue
    const pi = i / 4
    const x = pi % width
    const y = Math.floor(pi / width)
    total += 1
    if (x < halfW && y < halfH) tl += 1
    else if (x >= halfW && y < halfH) tr += 1
    else if (x < halfW && y >= halfH) bl += 1
    else br += 1
    if (x >= cx0 && x < cx1 && y >= cy0 && y < cy1) centerBox += 1
  }
  if (total === 0) return 'asymmetric'
  const leftRatio = (tl + bl) / total
  // ME-03: 0.6 → 0.7 — left-aligned 편향 완화 (균일 분포가 이미 50% 이라 0.6 은 너무 낮음).
  if (leftRatio >= 0.7) return 'left-aligned'
  const centerRatio = centerBox / total
  if (centerRatio >= 0.6) return 'centered'
  const mean = total / 4
  const variance =
    ((tl - mean) ** 2 +
      (tr - mean) ** 2 +
      (bl - mean) ** 2 +
      (br - mean) ** 2) /
    4
  const stdev = Math.sqrt(variance)
  const cv = mean > 0 ? stdev / mean : 0
  if (cv < 0.2) return 'grid'
  return 'asymmetric'
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => clamp(value, 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// 여러 참고 이미지의 색을 빈도 가중으로 통합 — image-ref-multi 흐름의 reference helper.
// 각 ref의 colors 순서를 _빈도 가중치_(앞쪽일수록 높음)로 누적, 동일 색은 합산.
// 결과는 가중치 desc, 최대 maxColors 만큼 unique hex 배열.
export function mergeImageReferenceColors(
  refs: ReadonlyArray<{ colors: ReadonlyArray<string> }>,
  maxColors = 5,
): string[] {
  if (maxColors <= 0) return []
  const weights = new Map<string, number>()
  for (const ref of refs) {
    const N = ref.colors.length
    for (let i = 0; i < N; i += 1) {
      const hex = ref.colors[i]
      if (typeof hex !== 'string') continue
      const lower = hex.toLowerCase()
      // 앞쪽 색일수록 높은 가중치 — N개 중 1번째는 N, N번째는 1.
      const weight = N - i
      weights.set(lower, (weights.get(lower) ?? 0) + weight)
    }
  }
  return Array.from(weights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([hex]) => hex)
}

type AspectRatioKind = 'square' | 'landscape' | 'portrait' | 'wide'
const ASPECT_RATIO_PRIORITY: AspectRatioKind[] = [
  'wide',
  'landscape',
  'portrait',
  'square',
]

// 다중 image-ref의 aspectRatio를 통합 추론.
// 가장 흔한 것 → 동수면 ASPECT_RATIO_PRIORITY 순(wide > landscape > portrait > square 확장적 비율 우선).
// 모든 ref이 aspectRatio undefined면 undefined 반환.
export function mergeImageReferenceAspect(
  refs: ReadonlyArray<{ aspectRatio?: AspectRatioKind }>,
): AspectRatioKind | undefined {
  const counts = new Map<AspectRatioKind, number>()
  for (const ref of refs) {
    if (ref.aspectRatio === undefined) continue
    counts.set(ref.aspectRatio, (counts.get(ref.aspectRatio) ?? 0) + 1)
  }
  if (counts.size === 0) return undefined
  let best: AspectRatioKind | undefined
  let bestCount = 0
  for (const kind of ASPECT_RATIO_PRIORITY) {
    const c = counts.get(kind) ?? 0
    if (c > bestCount) {
      best = kind
      bestCount = c
    }
  }
  return best
}
