// image-color 추출 unit — m3-generate-image-ref.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  analyzeDominantColors,
  extractDominantColors,
  extractLayoutIntent,
  mergeImageReferenceAspect,
  mergeImageReferenceColors,
  pickAspectRatio,
} from './image-color.js'

function rgbaPlane(
  pixels: Array<[number, number, number, number]>,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(pixels.length * 4)
  for (let i = 0; i < pixels.length; i++) {
    const [r, g, b, a] = pixels[i] ?? [0, 0, 0, 0]
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = a
  }
  return data
}

describe('extractDominantColors', () => {
  it('단일 색만 있는 이미지에서 그 색을 반환한다', () => {
    const data = rgbaPlane([
      [255, 0, 0, 255],
      [255, 0, 0, 255],
      [255, 0, 0, 255],
      [255, 0, 0, 255],
    ])
    const colors = extractDominantColors(
      { data, width: 2, height: 2 },
      5,
    )
    assert.equal(colors[0], '#ff0000')
  })

  it('빈도 desc 정렬 — 다수파 색이 첫 번째', () => {
    const data = rgbaPlane([
      [10, 10, 10, 255],
      [10, 10, 10, 255],
      [10, 10, 10, 255],
      [240, 240, 240, 255],
    ])
    const colors = extractDominantColors(
      { data, width: 2, height: 2 },
      5,
    )
    assert.equal(colors.length, 2)
    // 검은 계열이 흰 계열보다 빈도 높음
    assert.ok(colors[0]?.startsWith('#0'))
  })

  it('투명 픽셀은 무시한다', () => {
    const data = rgbaPlane([
      [255, 0, 0, 50], // alpha < 128 → skip
      [255, 0, 0, 50],
      [10, 10, 10, 255],
      [10, 10, 10, 255],
    ])
    const colors = extractDominantColors(
      { data, width: 2, height: 2 },
      5,
    )
    assert.equal(colors.length, 1)
    assert.ok(colors[0]?.startsWith('#0'))
  })

  it('count=0이면 빈 배열', () => {
    const data = rgbaPlane([[100, 100, 100, 255]])
    assert.deepEqual(
      extractDominantColors({ data, width: 1, height: 1 }, 0),
      [],
    )
  })
})

describe('pickAspectRatio', () => {
  it('정사각형 1:1 → square', () => {
    assert.equal(pickAspectRatio(800, 800), 'square')
  })

  it('가로 4:3 → landscape', () => {
    assert.equal(pickAspectRatio(1200, 800), 'landscape')
  })

  it('세로 3:4 → portrait', () => {
    assert.equal(pickAspectRatio(600, 800), 'portrait')
  })

  it('와이드 16:9 → wide', () => {
    assert.equal(pickAspectRatio(1920, 1080), 'wide')
  })

  it('잘못된 입력은 null', () => {
    assert.equal(pickAspectRatio(0, 100), null)
    assert.equal(pickAspectRatio(NaN, 100), null)
  })
})

describe('mergeImageReferenceColors', () => {
  it('단일 ref은 colors 그대로 (빈도 가중 desc)', () => {
    const merged = mergeImageReferenceColors([
      { colors: ['#aabbcc', '#ddeeff', '#112233'] },
    ])
    assert.deepEqual(merged, ['#aabbcc', '#ddeeff', '#112233'])
  })

  it('동일 색은 가중 합산', () => {
    const merged = mergeImageReferenceColors(
      [
        { colors: ['#aabbcc', '#ddeeff'] },
        { colors: ['#aabbcc'] }, // 가중치 +1
      ],
      5,
    )
    // ref1: aabbcc(2) + ddeeff(1), ref2: aabbcc(1) = aabbcc 3, ddeeff 1
    assert.equal(merged[0], '#aabbcc')
    assert.equal(merged[1], '#ddeeff')
  })

  it('대소문자 정규화 — 동일 색 합산', () => {
    const merged = mergeImageReferenceColors([
      { colors: ['#AABBCC'] },
      { colors: ['#aabbcc'] },
    ])
    assert.deepEqual(merged, ['#aabbcc'])
  })

  it('빈 입력 → 빈 배열', () => {
    assert.deepEqual(mergeImageReferenceColors([]), [])
    assert.deepEqual(mergeImageReferenceColors([{ colors: [] }]), [])
  })

  it('maxColors cap 동작', () => {
    const merged = mergeImageReferenceColors(
      [
        {
          colors: ['#000001', '#000002', '#000003', '#000004', '#000005', '#000006'],
        },
      ],
      3,
    )
    assert.equal(merged.length, 3)
  })
})

describe('analyzeDominantColors', () => {
  it('5색 HSL 분류 light/dark/neutral 반환', () => {
    // 5 픽셀 — 어두운 회색, 밝은 회색, 중간 회색, 빨강, 파랑.
    const data = rgbaPlane([
      [10, 10, 10, 255], // dark
      [240, 240, 240, 255], // light
      [128, 128, 128, 255], // neutral
      [255, 0, 0, 255], // saturated red (mid luminance → neutral)
      [0, 0, 255, 255], // saturated blue (low luminance → dark)
    ])
    const result = analyzeDominantColors(
      { data, width: 5, height: 1 },
      5,
    )
    // hexes 와 classifications 길이가 같아야 한다 (1:1 mapping).
    assert.equal(result.hexes.length, result.classifications.length)
    assert.ok(result.hexes.length >= 1 && result.hexes.length <= 5)
    // dark / light 분류가 둘 다 등장해야 한다 (입력에 명확히 존재).
    assert.ok(result.classifications.includes('dark'))
    assert.ok(result.classifications.includes('light'))
  })
})

describe('extractLayoutIntent', () => {
  it('좌측 두 사분면 집중 → left-aligned', () => {
    // 2x2: 좌측 두 픽셀만 opaque, 우측 투명.
    const data = rgbaPlane([
      [255, 0, 0, 255],
      [0, 0, 0, 0],
      [255, 0, 0, 255],
      [0, 0, 0, 0],
    ])
    assert.equal(
      extractLayoutIntent({ data, width: 2, height: 2 }),
      'left-aligned',
    )
  })

  it('네 사분면 균등 → grid', () => {
    // 2x2: 네 픽셀 모두 opaque (cv=0 → grid).
    const data = rgbaPlane([
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255],
      [255, 255, 0, 255],
    ])
    assert.equal(
      extractLayoutIntent({ data, width: 2, height: 2 }),
      'grid',
    )
  })

  it('중앙 영역 집중 → centered', () => {
    // 4x4: 중앙 2x2 (인덱스 5,6,9,10) 만 opaque, 외곽 12 픽셀 투명.
    const transparent: [number, number, number, number] = [0, 0, 0, 0]
    const opaque: [number, number, number, number] = [255, 255, 255, 255]
    const pixels: Array<[number, number, number, number]> =
      Array.from({ length: 16 }, () => transparent)
    pixels[5] = opaque
    pixels[6] = opaque
    pixels[9] = opaque
    pixels[10] = opaque
    const data = rgbaPlane(pixels)
    assert.equal(
      extractLayoutIntent({ data, width: 4, height: 4 }),
      'centered',
    )
  })

  it('불규칙 분포 → asymmetric', () => {
    // 2x2: tl + br 만 opaque (대각선) — 좌 비율 0.5, 중앙 0, cv 높음.
    const data = rgbaPlane([
      [255, 0, 0, 255],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 255, 0, 255],
    ])
    assert.equal(
      extractLayoutIntent({ data, width: 2, height: 2 }),
      'asymmetric',
    )
  })
})

describe('mergeImageReferenceAspect', () => {
  it('모두 동일하면 그대로', () => {
    assert.equal(
      mergeImageReferenceAspect([
        { aspectRatio: 'wide' },
        { aspectRatio: 'wide' },
      ]),
      'wide',
    )
  })

  it('가장 흔한 것 우선', () => {
    assert.equal(
      mergeImageReferenceAspect([
        { aspectRatio: 'portrait' },
        { aspectRatio: 'landscape' },
        { aspectRatio: 'landscape' },
      ]),
      'landscape',
    )
  })

  it('동수면 wide > landscape > portrait > square 우선순위', () => {
    assert.equal(
      mergeImageReferenceAspect([
        { aspectRatio: 'portrait' },
        { aspectRatio: 'wide' },
      ]),
      'wide',
    )
    assert.equal(
      mergeImageReferenceAspect([
        { aspectRatio: 'landscape' },
        { aspectRatio: 'square' },
      ]),
      'landscape',
    )
  })

  it('모든 ref이 aspectRatio undefined면 undefined', () => {
    assert.equal(mergeImageReferenceAspect([{}, {}]), undefined)
    assert.equal(mergeImageReferenceAspect([]), undefined)
  })
})
