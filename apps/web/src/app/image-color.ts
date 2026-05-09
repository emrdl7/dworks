// 참고 이미지에서 dominant color + aspect ratio 추출 — m3-generate-image-ref MVP.
//
// vision-LLM 의존 없이 web canvas에서 픽셀을 sampling해 RGB 히스토그램 bucket 빈도로
// 상위 N 색을 hex로 추출한다. LLM은 이 색 hex를 디자인 팔레트의 시드로 활용한다.
//
// API 형태:
//   - extractDominantColors(imageData, count) → string[]   소문자 #rrggbb, 빈도 desc
//   - pickAspectRatio(width, height)          → 'square' | 'landscape' | 'portrait' | 'wide'
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
