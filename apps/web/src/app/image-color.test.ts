// image-color 추출 unit — m3-generate-image-ref.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { extractDominantColors, pickAspectRatio } from './image-color.js'

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
