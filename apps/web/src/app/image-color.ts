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
