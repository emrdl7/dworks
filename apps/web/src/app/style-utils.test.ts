// style-utils.ts — 색상 변환 + style merge 단위 테스트.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  getCssColorWithOpacity,
  hexToRgba,
  mergeStyles,
  rgbToHex,
} from './style-utils.js'

describe('mergeStyles', () => {
  it('여러 객체를 순서대로 병합 (뒤에 있는 게 우선)', () => {
    const result = mergeStyles(
      { color: 'red', padding: 10 },
      { color: 'blue', margin: 5 },
    )
    assert.deepEqual(result, { color: 'blue', padding: 10, margin: 5 })
  })

  it('undefined는 무시', () => {
    const result = mergeStyles(undefined, { color: 'red' }, undefined)
    assert.deepEqual(result, { color: 'red' })
  })

  it('빈 객체만 있으면 undefined (React style prop 최적화)', () => {
    assert.equal(mergeStyles(), undefined)
    assert.equal(mergeStyles({}), undefined)
    assert.equal(mergeStyles(undefined, {}), undefined)
  })

  it('falsy 값(undefined) 필터 — null은 무시 안 됨 (typed로 들어올 수 없음)', () => {
    const result = mergeStyles({ a: 1 } as never, undefined, { b: 2 } as never)
    assert.deepEqual(result, { a: 1, b: 2 })
  })
})

describe('rgbToHex', () => {
  it('rgb(R, G, B) → #RRGGBB', () => {
    assert.equal(rgbToHex('rgb(255, 0, 0)'), '#ff0000')
    assert.equal(rgbToHex('rgb(0, 128, 255)'), '#0080ff')
  })

  it('rgba(R, G, B, A) → #RRGGBB (alpha 무시, 단 alpha < 0.05 → undefined)', () => {
    assert.equal(rgbToHex('rgba(255, 0, 0, 1)'), '#ff0000')
    assert.equal(rgbToHex('rgba(255, 0, 0, 0.5)'), '#ff0000')
  })

  it('alpha < 0.05 (투명) → undefined', () => {
    assert.equal(rgbToHex('rgba(255, 0, 0, 0.04)'), undefined)
    assert.equal(rgbToHex('rgba(0, 0, 0, 0)'), undefined)
  })

  it("'transparent' 키워드 → undefined", () => {
    assert.equal(rgbToHex('transparent'), undefined)
  })

  it('빈 문자열 → undefined', () => {
    assert.equal(rgbToHex(''), undefined)
  })

  it('parse 실패 → undefined (hex로 들어오면 안 됨)', () => {
    assert.equal(rgbToHex('#ff0000'), undefined)
    assert.equal(rgbToHex('not-a-color'), undefined)
  })
})

describe('hexToRgba', () => {
  it('#RRGGBB + alpha → rgba(R,G,B,A)', () => {
    assert.equal(hexToRgba('#ff0000', 1), 'rgba(255,0,0,1)')
    assert.equal(hexToRgba('#000000', 0.5), 'rgba(0,0,0,0.5)')
  })

  it('#RGB → 6자리로 expand 후 변환', () => {
    assert.equal(hexToRgba('#f00', 1), 'rgba(255,0,0,1)')
    assert.equal(hexToRgba('#abc', 0.5), 'rgba(170,187,204,0.5)')
  })

  it('# 없이도 통과', () => {
    assert.equal(hexToRgba('ff0000', 1), 'rgba(255,0,0,1)')
  })

  it('잘못된 길이는 입력 그대로', () => {
    assert.equal(hexToRgba('#abcd', 1), '#abcd')
    assert.equal(hexToRgba('#ab', 1), '#ab')
  })
})

describe('getCssColorWithOpacity', () => {
  it('opacity undefined → 입력 그대로', () => {
    assert.equal(getCssColorWithOpacity('#ff0000'), '#ff0000')
  })

  it('opacity ≥ 1 → 입력 그대로', () => {
    assert.equal(getCssColorWithOpacity('#ff0000', 1), '#ff0000')
    assert.equal(getCssColorWithOpacity('#ff0000', 1.5), '#ff0000')
  })

  it('opacity 0~1 → rgba 변환', () => {
    assert.equal(getCssColorWithOpacity('#ff0000', 0.5), 'rgba(255,0,0,0.5)')
  })

  it('opacity ≤ 0 → 완전 투명 rgba', () => {
    assert.equal(getCssColorWithOpacity('#ff0000', 0), 'rgba(255,0,0,0)')
    assert.equal(getCssColorWithOpacity('#ff0000', -0.5), 'rgba(255,0,0,0)')
  })
})
