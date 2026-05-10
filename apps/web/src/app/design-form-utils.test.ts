// design-form-utils.ts — Inspector form helper들 단위 테스트.
// 회귀 방어 + 사용법 문서화.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_CUSTOM_SHADOW,
  DEFAULT_GRADIENT_DIRECTION,
  DEFAULT_GRADIENT_TO_COLOR,
  DEFAULT_GRADIENT_TYPE,
  DEFAULT_SHAPE_COLOR,
  DEFAULT_TEXT_SHADOW,
  MAX_CUSTOM_SHADOWS,
  getCustomShadowWithPatch,
  getGradientWithPatch,
  getNodeColorMergeKey,
  getResolvedCustomShadow,
  getResolvedCustomShadowList,
  getResolvedGradient,
  getResolvedTextShadow,
  getTextShadowWithPatch,
  getVisibleBorderPatch,
  hasShapeCustomShadow,
  isValidHexColor,
  normalizeHexColor,
  parseOptionalNumber,
  parseOptionalOpacity,
  roundFocalCoordinate,
  toColorInputValue,
} from './design-form-utils.js'

describe('isValidHexColor', () => {
  it('6자리 hex 통과', () => {
    assert.equal(isValidHexColor('#abcdef'), true)
    assert.equal(isValidHexColor('#ABCDEF'), true)
    assert.equal(isValidHexColor('#000000'), true)
  })

  it('3자리 hex 통과', () => {
    assert.equal(isValidHexColor('#abc'), true)
    assert.equal(isValidHexColor('#000'), true)
  })

  it('# 없으면 거부', () => {
    assert.equal(isValidHexColor('abcdef'), false)
  })

  it('잘못된 길이 거부', () => {
    assert.equal(isValidHexColor('#ab'), false)
    assert.equal(isValidHexColor('#abcd'), false)
    assert.equal(isValidHexColor('#abcde'), false)
    assert.equal(isValidHexColor('#abcdefab'), false)
  })

  it('hex 외 문자 거부', () => {
    assert.equal(isValidHexColor('#zzzzzz'), false)
    assert.equal(isValidHexColor('#g00000'), false)
  })
})

describe('normalizeHexColor', () => {
  it('대문자 → 소문자', () => {
    assert.equal(normalizeHexColor('#ABCDEF'), '#abcdef')
  })

  it('앞뒤 공백 제거', () => {
    assert.equal(normalizeHexColor('  #abcdef  '), '#abcdef')
  })

  it('이미 정규화된 값 그대로', () => {
    assert.equal(normalizeHexColor('#abcdef'), '#abcdef')
  })
})

describe('toColorInputValue', () => {
  it('3자리 → 6자리 expansion (color picker는 6자리만)', () => {
    assert.equal(toColorInputValue('#abc'), '#aabbcc')
    assert.equal(toColorInputValue('#f00'), '#ff0000')
  })

  it('6자리는 그대로 (소문자 정규화)', () => {
    assert.equal(toColorInputValue('#ABCDEF'), '#abcdef')
  })

  it('invalid hex는 fallback (default = DEFAULT_SHAPE_COLOR)', () => {
    assert.equal(toColorInputValue(''), DEFAULT_SHAPE_COLOR)
    assert.equal(toColorInputValue('not-a-color'), DEFAULT_SHAPE_COLOR)
  })

  it('명시된 fallback 사용', () => {
    assert.equal(toColorInputValue('', '#123456'), '#123456')
  })
})

describe('parseOptionalNumber', () => {
  it('빈 문자열 → undefined', () => {
    assert.equal(parseOptionalNumber('', 0, 100), undefined)
    assert.equal(parseOptionalNumber('   ', 0, 100), undefined)
  })

  it('숫자가 아니면 undefined', () => {
    assert.equal(parseOptionalNumber('abc', 0, 100), undefined)
  })

  it('범위 안 값 그대로', () => {
    assert.equal(parseOptionalNumber('50', 0, 100), 50)
  })

  it('min/max clamp', () => {
    assert.equal(parseOptionalNumber('-50', 0, 100), 0)
    assert.equal(parseOptionalNumber('150', 0, 100), 100)
  })

  it('소수 허용', () => {
    assert.equal(parseOptionalNumber('1.5', 0, 100), 1.5)
  })
})

describe('parseOptionalOpacity', () => {
  it('100% → undefined (default와 구분)', () => {
    assert.equal(parseOptionalOpacity('100'), undefined)
  })

  it('빈 문자열 → undefined', () => {
    assert.equal(parseOptionalOpacity(''), undefined)
  })

  it('0~99% → 0~0.99 변환', () => {
    assert.equal(parseOptionalOpacity('50'), 0.5)
    assert.equal(parseOptionalOpacity('25'), 0.25)
    assert.equal(parseOptionalOpacity('0'), 0)
  })

  it('clamp + 정밀도 (소수점 2자리)', () => {
    assert.equal(parseOptionalOpacity('-10'), 0)
    // -10은 clamp 후 0이 되어 0% → 0 (100%와 구분되어 undefined 아님)
    assert.equal(parseOptionalOpacity('150'), undefined)
  })
})

describe('roundFocalCoordinate', () => {
  it('0~1 범위 clamp + 0.001 단위 round', () => {
    assert.equal(roundFocalCoordinate(0.5), 0.5)
    assert.equal(roundFocalCoordinate(0.123456), 0.123)
    assert.equal(roundFocalCoordinate(-0.5), 0)
    assert.equal(roundFocalCoordinate(1.5), 1)
  })
})

describe('getNodeColorMergeKey', () => {
  it('node id + field로 stable merge key 생성', () => {
    assert.equal(
      getNodeColorMergeKey('node-123', 'backgroundColor'),
      'node:node-123:backgroundColor',
    )
  })
})

describe('getResolvedGradient', () => {
  it('undefined gradient → defaults + fallbackFrom', () => {
    const result = getResolvedGradient(undefined, '#abcdef')
    assert.equal(result.type, DEFAULT_GRADIENT_TYPE)
    assert.equal(result.from, '#abcdef')
    assert.equal(result.to, DEFAULT_GRADIENT_TO_COLOR)
    assert.equal(result.direction, DEFAULT_GRADIENT_DIRECTION)
    assert.equal(result.fromOpacity, undefined)
    assert.equal(result.toOpacity, undefined)
  })

  it('fallbackFromOpacity가 적용됨 (gradient.fromOpacity 없을 때)', () => {
    const result = getResolvedGradient(undefined, '#abcdef', 0.5)
    assert.equal(result.fromOpacity, 0.5)
  })

  it('explicit gradient는 그대로 + 누락만 fallback', () => {
    const result = getResolvedGradient(
      {
        type: 'radial',
        from: '#111111',
        to: '#222222',
        direction: 'to-top',
        fromOpacity: 0.8,
        toOpacity: 0.6,
      },
      '#abcdef',
    )
    assert.equal(result.type, 'radial')
    assert.equal(result.from, '#111111')
    assert.equal(result.to, '#222222')
    assert.equal(result.direction, 'to-top')
    assert.equal(result.fromOpacity, 0.8)
    assert.equal(result.toOpacity, 0.6)
  })

  it('conic geometry (centerX/Y, fromAngle) 보존', () => {
    const result = getResolvedGradient(
      {
        type: 'conic',
        from: '#000000',
        to: '#ffffff',
        direction: 'to-bottom',
        conicFromAngle: 90,
        conicCenterX: 50,
        conicCenterY: 50,
      },
      '#abcdef',
    )
    assert.equal(result.conicFromAngle, 90)
    assert.equal(result.conicCenterX, 50)
    assert.equal(result.conicCenterY, 50)
  })
})

describe('getGradientWithPatch', () => {
  const baseGradient = {
    type: 'linear' as const,
    from: '#000000',
    to: '#ffffff',
    direction: 'to-bottom-right' as const,
    fromOpacity: 0.8,
  }

  it('patch 적용 후 새 객체 반환', () => {
    const result = getGradientWithPatch(baseGradient, { from: '#111111' })
    assert.equal(result.from, '#111111')
    assert.equal(result.to, '#ffffff')
  })

  it('undefined patch는 키 자체를 삭제 (optional 슬롯)', () => {
    const result = getGradientWithPatch(baseGradient, { fromOpacity: undefined })
    assert.equal('fromOpacity' in result, false)
  })

  it('type undefined도 키 삭제', () => {
    const result = getGradientWithPatch(baseGradient, { type: undefined })
    assert.equal('type' in result, false)
  })
})

describe('getResolvedCustomShadow', () => {
  it('undefined → DEFAULT_CUSTOM_SHADOW', () => {
    assert.deepEqual(getResolvedCustomShadow(undefined), DEFAULT_CUSTOM_SHADOW)
  })

  it('값 있으면 그대로', () => {
    const shadow = { offsetX: 1, offsetY: 2, blur: 3, color: '#aabbcc' }
    assert.equal(getResolvedCustomShadow(shadow), shadow)
  })
})

describe('hasShapeCustomShadow', () => {
  it('단일 customShadow 있음', () => {
    assert.equal(
      hasShapeCustomShadow({ customShadow: DEFAULT_CUSTOM_SHADOW }),
      true,
    )
  })

  it('customShadows 배열 있음 (1개 이상)', () => {
    assert.equal(
      hasShapeCustomShadow({ customShadows: [DEFAULT_CUSTOM_SHADOW] }),
      true,
    )
  })

  it('customShadows 빈 배열 → false', () => {
    assert.equal(hasShapeCustomShadow({ customShadows: [] }), false)
  })

  it('둘 다 없음 → false', () => {
    assert.equal(hasShapeCustomShadow({}), false)
  })
})

describe('getResolvedCustomShadowList', () => {
  it('customShadows 우선 (단일보다)', () => {
    const list = [DEFAULT_CUSTOM_SHADOW]
    const result = getResolvedCustomShadowList({
      customShadow: { ...DEFAULT_CUSTOM_SHADOW, color: '#ff0000' },
      customShadows: list,
    })
    assert.equal(result.length, 1)
    assert.equal(result[0]?.color, '#000000')
  })

  it('MAX_CUSTOM_SHADOWS 초과 시 clamp', () => {
    const tooMany = Array.from({ length: 5 }, () => DEFAULT_CUSTOM_SHADOW)
    const result = getResolvedCustomShadowList({ customShadows: tooMany })
    assert.equal(result.length, MAX_CUSTOM_SHADOWS)
  })

  it('customShadow 단일은 길이 1로 wrap', () => {
    const result = getResolvedCustomShadowList({
      customShadow: DEFAULT_CUSTOM_SHADOW,
    })
    assert.equal(result.length, 1)
  })

  it('둘 다 없으면 default 1개', () => {
    const result = getResolvedCustomShadowList({})
    assert.equal(result.length, 1)
    assert.deepEqual(result[0], DEFAULT_CUSTOM_SHADOW)
  })
})

describe('getCustomShadowWithPatch', () => {
  it('숫자 patch 적용', () => {
    const result = getCustomShadowWithPatch(DEFAULT_CUSTOM_SHADOW, {
      offsetX: 10,
    })
    assert.equal(result.offsetX, 10)
    assert.equal(result.offsetY, DEFAULT_CUSTOM_SHADOW.offsetY)
  })

  it('opacity patch는 explicit (undefined로도 set 가능)', () => {
    const original = { ...DEFAULT_CUSTOM_SHADOW, opacity: 0.5 }
    const result = getCustomShadowWithPatch(original, { opacity: undefined })
    assert.equal('opacity' in result, false)
  })

  it('inset patch는 explicit', () => {
    const original = { ...DEFAULT_CUSTOM_SHADOW, inset: true }
    const result = getCustomShadowWithPatch(original, { inset: undefined })
    assert.equal('inset' in result, false)
  })

  it('opacity patch 없으면 기존 값 보존', () => {
    const original = { ...DEFAULT_CUSTOM_SHADOW, opacity: 0.5 }
    const result = getCustomShadowWithPatch(original, { offsetX: 1 })
    assert.equal(result.opacity, 0.5)
  })

  it('spread 누락 → 0 default', () => {
    const sansSpread = { ...DEFAULT_CUSTOM_SHADOW }
    delete (sansSpread as Partial<typeof sansSpread>).spread
    const result = getCustomShadowWithPatch(sansSpread, {})
    assert.equal(result.spread, 0)
  })
})

describe('getResolvedTextShadow', () => {
  it('undefined → DEFAULT_TEXT_SHADOW', () => {
    assert.deepEqual(getResolvedTextShadow(undefined), DEFAULT_TEXT_SHADOW)
  })
})

describe('getTextShadowWithPatch', () => {
  it('opacity patch undefined → 키 삭제', () => {
    const original = { ...DEFAULT_TEXT_SHADOW, opacity: 0.5 }
    const result = getTextShadowWithPatch(original, { opacity: undefined })
    assert.equal('opacity' in result, false)
  })

  it('color patch 적용', () => {
    const result = getTextShadowWithPatch(DEFAULT_TEXT_SHADOW, {
      color: '#ff0000',
    })
    assert.equal(result.color, '#ff0000')
  })
})

describe('getVisibleBorderPatch', () => {
  it('borderStyle:none → solid 강제', () => {
    const result = getVisibleBorderPatch({ borderStyle: 'none' })
    assert.equal(result.borderStyle, 'solid')
  })

  it('borderWidth:0 → 1 강제', () => {
    const result = getVisibleBorderPatch({ borderWidth: 0 })
    assert.equal(result.borderWidth, 1)
  })

  it('이미 보이는 상태 (solid + width 2) 그대로', () => {
    const result = getVisibleBorderPatch({
      borderStyle: 'solid',
      borderWidth: 2,
    })
    assert.equal(result.borderStyle, 'solid')
    assert.equal(result.borderWidth, 2)
  })

  it('빈 shape → defaults (solid + 1)', () => {
    const result = getVisibleBorderPatch({})
    assert.equal(result.borderStyle, 'solid')
    assert.equal(result.borderWidth, 1)
  })
})
