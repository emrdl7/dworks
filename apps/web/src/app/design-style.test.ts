// design-style.ts — CSS 변환 helper 단위 테스트.
// 캔버스 렌더링 정확성과 직결되는 핵심 모듈.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  GRADIENT_DIRECTION_CSS,
  SHADOW_VALUES,
  customShadowToCss,
  getBoxSpacingStyle,
  getContainerSpacingStyle,
  getGapSpacingStyle,
  getLayoutStyle,
  getResolvedCornerRadius,
  getShapeStyle,
  gradientToCss,
  hasCornerRadiusOverride,
  hasLayoutOverride,
  toFlexAlignment,
  toFlexJustify,
} from './design-style.js'

describe('SHADOW_VALUES', () => {
  it('5개 preset 모두 정의', () => {
    assert.equal(SHADOW_VALUES.none, 'none')
    assert.match(SHADOW_VALUES.sm, /^0 1px/)
    assert.match(SHADOW_VALUES.md, /^0 4px/)
    assert.match(SHADOW_VALUES.lg, /^0 12px/)
    assert.match(SHADOW_VALUES.xl, /^0 24px/)
  })
})

describe('customShadowToCss', () => {
  it('opacity/spread/inset 없는 기본 형식', () => {
    const css = customShadowToCss({
      offsetX: 0,
      offsetY: 4,
      blur: 12,
      color: '#000000',
    })
    assert.equal(css, '0px 4px 12px 0px #000000')
  })

  it('spread 명시', () => {
    const css = customShadowToCss({
      offsetX: 1,
      offsetY: 2,
      blur: 3,
      spread: 4,
      color: '#ff0000',
    })
    assert.equal(css, '1px 2px 3px 4px #ff0000')
  })

  it('opacity 적용 (rgba 변환)', () => {
    const css = customShadowToCss({
      offsetX: 0,
      offsetY: 0,
      blur: 10,
      color: '#000000',
      opacity: 0.5,
    })
    assert.equal(css, '0px 0px 10px 0px rgba(0,0,0,0.5)')
  })

  it('inset:true → inset prefix', () => {
    const css = customShadowToCss({
      offsetX: 0,
      offsetY: 1,
      blur: 2,
      color: '#000000',
      inset: true,
    })
    assert.match(css, /^inset /)
  })

  it('inset:false (default) → prefix 없음', () => {
    const css = customShadowToCss({
      offsetX: 0,
      offsetY: 1,
      blur: 2,
      color: '#000000',
      inset: false,
    })
    assert.equal(css.startsWith('inset'), false)
  })
})

describe('hasCornerRadiusOverride', () => {
  it('단일 corner 명시 → true', () => {
    assert.equal(hasCornerRadiusOverride({ radiusTopLeft: 8 }), true)
  })

  it('radius (전체)만 있으면 false (corner override 아님)', () => {
    assert.equal(hasCornerRadiusOverride({ radius: 8 }), false)
  })

  it('빈 shape → false', () => {
    assert.equal(hasCornerRadiusOverride({}), false)
  })
})

describe('getResolvedCornerRadius', () => {
  it('해당 corner 명시값 우선', () => {
    assert.equal(
      getResolvedCornerRadius({ radius: 8, radiusTopLeft: 12 }, 'radiusTopLeft'),
      12,
    )
  })

  it('corner 없으면 radius fallback', () => {
    assert.equal(getResolvedCornerRadius({ radius: 8 }, 'radiusTopLeft'), 8)
  })

  it('둘 다 없으면 0', () => {
    assert.equal(getResolvedCornerRadius({}, 'radiusTopLeft'), 0)
  })
})

describe('getBoxSpacingStyle', () => {
  it('빈 spacing → undefined', () => {
    assert.equal(getBoxSpacingStyle(undefined), undefined)
    assert.equal(getBoxSpacingStyle({}), undefined)
  })

  it('padding 명시 → px 단위 변환', () => {
    const style = getBoxSpacingStyle({ paddingTop: 10, paddingLeft: 20 })
    assert.deepEqual(style, { paddingTop: '10px', paddingLeft: '20px' })
  })

  it('margin (음수도 허용) 변환', () => {
    const style = getBoxSpacingStyle({ marginTop: -10 })
    assert.deepEqual(style, { marginTop: '-10px' })
  })

  it('gap은 box style에 포함 안 됨', () => {
    const style = getBoxSpacingStyle({ gap: 20 })
    assert.equal(style, undefined)
  })
})

describe('getGapSpacingStyle', () => {
  it('gap 명시 → { gap: "Npx" }', () => {
    assert.deepEqual(getGapSpacingStyle({ gap: 20 }), { gap: '20px' })
  })

  it('gap 없으면 undefined', () => {
    assert.equal(getGapSpacingStyle(undefined), undefined)
    assert.equal(getGapSpacingStyle({}), undefined)
  })
})

describe('getContainerSpacingStyle', () => {
  it('padding + gap 모두 합쳐서 반환', () => {
    const style = getContainerSpacingStyle({ paddingTop: 10, gap: 20 })
    assert.deepEqual(style, { paddingTop: '10px', gap: '20px' })
  })

  it('빈 spacing → undefined', () => {
    assert.equal(getContainerSpacingStyle({}), undefined)
  })
})

describe('hasLayoutOverride', () => {
  it('빈 layout / undefined → false', () => {
    assert.equal(hasLayoutOverride(undefined), false)
    assert.equal(hasLayoutOverride({}), false)
  })

  it('단일 키 → true', () => {
    assert.equal(hasLayoutOverride({ direction: 'row' }), true)
    assert.equal(hasLayoutOverride({ wrap: 'wrap' }), true)
  })
})

describe('toFlexAlignment', () => {
  it('start/end → flex-start / flex-end', () => {
    assert.equal(toFlexAlignment('start'), 'flex-start')
    assert.equal(toFlexAlignment('end'), 'flex-end')
  })

  it('center/stretch 그대로', () => {
    assert.equal(toFlexAlignment('center'), 'center')
    assert.equal(toFlexAlignment('stretch'), 'stretch')
  })
})

describe('toFlexJustify', () => {
  it('start/end → flex-start / flex-end', () => {
    assert.equal(toFlexJustify('start'), 'flex-start')
    assert.equal(toFlexJustify('end'), 'flex-end')
  })

  it('between/evenly → space-* 변환', () => {
    assert.equal(toFlexJustify('between'), 'space-between')
    assert.equal(toFlexJustify('evenly'), 'space-evenly')
  })

  it('center 그대로', () => {
    assert.equal(toFlexJustify('center'), 'center')
  })
})

describe('getLayoutStyle', () => {
  it('빈 layout → undefined (회귀: undefined가 빈 객체로 안 변환)', () => {
    assert.equal(getLayoutStyle(undefined), undefined)
    assert.equal(getLayoutStyle({}), undefined)
  })

  it('direction 명시 → display:flex + flexDirection', () => {
    const style = getLayoutStyle({ direction: 'column' })
    assert.equal(style?.display, 'flex')
    assert.equal(style?.flexDirection, 'column')
  })

  it('align/justify는 toFlex* 변환 거침', () => {
    const style = getLayoutStyle({ align: 'start', justify: 'between' })
    assert.equal(style?.alignItems, 'flex-start')
    assert.equal(style?.justifyContent, 'space-between')
  })

  it('wrap 그대로', () => {
    const style = getLayoutStyle({ wrap: 'wrap' })
    assert.equal(style?.flexWrap, 'wrap')
  })
})

describe('getShapeStyle', () => {
  it('빈 shape → undefined', () => {
    assert.equal(getShapeStyle(undefined), undefined)
    assert.equal(getShapeStyle({}), undefined)
  })

  it('radius만 → borderRadius (단일값)', () => {
    const style = getShapeStyle({ radius: 8 })
    assert.equal(style?.borderRadius, '8px')
  })

  it('corner override → 4면 별도 px', () => {
    const style = getShapeStyle({
      radius: 8,
      radiusTopLeft: 12,
      radiusTopRight: 4,
    })
    // 순서: TL TR BR BL
    assert.equal(style?.borderRadius, '12px 4px 8px 8px')
  })

  it('borderWidth 명시 → solid + 1px default 보정', () => {
    const style = getShapeStyle({ borderWidth: 2 })
    assert.equal(style?.borderStyle, 'solid')
    assert.equal(style?.borderWidth, '2px')
  })

  it('borderStyle:none → width 0 + transparent color', () => {
    const style = getShapeStyle({ borderStyle: 'none' })
    assert.equal(style?.borderStyle, 'none')
    assert.equal(style?.borderWidth, '0px')
    assert.equal(style?.borderColor, 'transparent')
  })

  it('shadow preset 적용 (P1 회귀: customShadow 없을 때 preset 사용)', () => {
    const style = getShapeStyle({ shadow: 'md' })
    assert.equal(style?.boxShadow, SHADOW_VALUES.md)
  })

  it('customShadows가 customShadow보다 우선', () => {
    const style = getShapeStyle({
      customShadow: { offsetX: 0, offsetY: 1, blur: 2, color: '#aaaaaa' },
      customShadows: [
        { offsetX: 0, offsetY: 4, blur: 8, color: '#ff0000' },
        { offsetX: 0, offsetY: 8, blur: 16, color: '#00ff00' },
      ],
    })
    assert.match(style?.boxShadow ?? '', /#ff0000.*#00ff00/)
    assert.equal(style?.boxShadow?.includes('#aaaaaa'), false)
  })
})

describe('GRADIENT_DIRECTION_CSS', () => {
  it('8방향 모두 정의', () => {
    assert.equal(GRADIENT_DIRECTION_CSS['to-top'], 'to top')
    assert.equal(GRADIENT_DIRECTION_CSS['to-top-right'], 'to top right')
    assert.equal(GRADIENT_DIRECTION_CSS['to-right'], 'to right')
    assert.equal(GRADIENT_DIRECTION_CSS['to-bottom-right'], 'to bottom right')
    assert.equal(GRADIENT_DIRECTION_CSS['to-bottom'], 'to bottom')
    assert.equal(GRADIENT_DIRECTION_CSS['to-bottom-left'], 'to bottom left')
    assert.equal(GRADIENT_DIRECTION_CSS['to-left'], 'to left')
    assert.equal(GRADIENT_DIRECTION_CSS['to-top-left'], 'to top left')
  })
})

describe('gradientToCss', () => {
  const baseGradient = {
    type: 'linear' as const,
    from: '#000000',
    to: '#ffffff',
    direction: 'to-bottom-right' as const,
  }

  it('linear gradient 형식', () => {
    const css = gradientToCss(baseGradient)
    assert.equal(css, 'linear-gradient(to bottom right, #000000, #ffffff)')
  })

  it('radial gradient 형식', () => {
    const css = gradientToCss({ ...baseGradient, type: 'radial' })
    assert.equal(css, 'radial-gradient(circle, #000000, #ffffff)')
  })

  it('conic gradient — fromAngle / center default 0/50/50', () => {
    const css = gradientToCss({ ...baseGradient, type: 'conic' })
    assert.equal(css, 'conic-gradient(from 0deg at 50% 50%, #000000, #ffffff)')
  })

  it('conic gradient — fromAngle/center 명시', () => {
    const css = gradientToCss({
      ...baseGradient,
      type: 'conic',
      conicFromAngle: 90,
      conicCenterX: 25,
      conicCenterY: 75,
    })
    assert.equal(css, 'conic-gradient(from 90deg at 25% 75%, #000000, #ffffff)')
  })

  it('fromOpacity / toOpacity 적용 (rgba 변환)', () => {
    const css = gradientToCss({
      ...baseGradient,
      fromOpacity: 0.5,
      toOpacity: 0.8,
    })
    assert.equal(
      css,
      'linear-gradient(to bottom right, rgba(0,0,0,0.5), rgba(255,255,255,0.8))',
    )
  })
})
