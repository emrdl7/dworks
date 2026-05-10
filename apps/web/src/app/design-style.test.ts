// design-style.ts — CSS 변환 helper 단위 테스트.
// 캔버스 렌더링 정확성과 직결되는 핵심 모듈.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  GRADIENT_DIRECTION_CSS,
  SHADOW_VALUES,
  customShadowToCss,
  getAccentBackgroundStyle,
  getAccentTextColorStyle,
  getActiveBackgroundStyle,
  getActiveTextStyle,
  getBoxSpacingStyle,
  getColorStyle,
  getContainerSpacingStyle,
  getDisabledBackgroundStyle,
  getDisabledTextStyle,
  getFocusBackgroundStyle,
  getFocusTextStyle,
  getGapSpacingStyle,
  getHoverBackgroundStyle,
  getHoverTextStyle,
  getLayoutStyle,
  getResolvedCornerRadius,
  getShapeStyle,
  getTextColorStyle,
  getTransformStyle,
  getTransitionStyle,
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

describe('getColorStyle', () => {
  it('빈 color → undefined', () => {
    assert.equal(getColorStyle(undefined), undefined)
    assert.equal(getColorStyle({}), undefined)
  })

  it('backgroundColor + opacity → bg + rgba', () => {
    const style = getColorStyle({
      backgroundColor: '#ff0000',
      backgroundOpacity: 0.5,
    })
    assert.equal(style?.backgroundColor, 'rgba(255,0,0,0.5)')
  })

  it('backgroundGradient가 backgroundColor보다 우선 (gradient 있을 때 bg 무시)', () => {
    const style = getColorStyle({
      backgroundColor: '#ff0000',
      backgroundGradient: {
        type: 'linear',
        from: '#000000',
        to: '#ffffff',
        direction: 'to-right',
      },
    })
    assert.equal(style?.backgroundImage, 'linear-gradient(to right, #000000, #ffffff)')
    assert.equal(style?.backgroundColor, undefined)
  })

  it('textColor 명시 → color 적용', () => {
    const style = getColorStyle({ textColor: '#abcdef', textOpacity: 0.5 })
    assert.equal(style?.color, 'rgba(171,205,239,0.5)')
  })

  it('inheritedTextColor — 명시 없을 때 부모 색 상속', () => {
    const style = getColorStyle({}, '#aabbcc')
    assert.equal(style?.color, '#aabbcc')
  })

  it('inheritedTextColor — 명시 textColor가 우선', () => {
    const style = getColorStyle({ textColor: '#111111' }, '#aabbcc')
    assert.equal(style?.color, '#111111')
  })
})

describe('getAccentBackgroundStyle', () => {
  it('accentColor 없음 → undefined', () => {
    assert.equal(getAccentBackgroundStyle({}), undefined)
    assert.equal(getAccentBackgroundStyle(undefined), undefined)
  })

  it('accentColor + opacity → backgroundColor rgba', () => {
    const style = getAccentBackgroundStyle({
      accentColor: '#ff0000',
      accentOpacity: 0.5,
    })
    assert.equal(style?.backgroundColor, 'rgba(255,0,0,0.5)')
  })
})

describe('getAccentTextColorStyle', () => {
  it('accentColor 없음 → undefined', () => {
    assert.equal(getAccentTextColorStyle({}), undefined)
  })

  it('accentColor + opacity → color rgba', () => {
    const style = getAccentTextColorStyle({
      accentColor: '#00ff00',
      accentOpacity: 0.7,
    })
    assert.equal(style?.color, 'rgba(0,255,0,0.7)')
  })
})

describe('getTextColorStyle', () => {
  it('빈 → undefined', () => {
    assert.equal(getTextColorStyle(undefined), undefined)
    assert.equal(getTextColorStyle(''), undefined)
  })

  it('값 있으면 { color: value } (opacity 적용 X — 단순 lookup)', () => {
    assert.deepEqual(getTextColorStyle('#abc'), { color: '#abc' })
  })
})

describe('state color helpers (hover/active/focus/disabled × bg/text = 8개)', () => {
  it('hover background → CSS var', () => {
    const style = getHoverBackgroundStyle({ hoverBackgroundColor: '#ff0000' })
    assert.equal(
      (style as Record<string, unknown>)?.['--dw-hover-bg'],
      '#ff0000',
    )
  })

  it('hover text → CSS var', () => {
    const style = getHoverTextStyle({ hoverTextColor: '#00ff00' })
    assert.equal(
      (style as Record<string, unknown>)?.['--dw-hover-text'],
      '#00ff00',
    )
  })

  it('active background → CSS var', () => {
    const style = getActiveBackgroundStyle({ activeBackgroundColor: '#ff00ff' })
    assert.equal(
      (style as Record<string, unknown>)?.['--dw-active-bg'],
      '#ff00ff',
    )
  })

  it('active text → CSS var', () => {
    const style = getActiveTextStyle({ activeTextColor: '#ffff00' })
    assert.equal(
      (style as Record<string, unknown>)?.['--dw-active-text'],
      '#ffff00',
    )
  })

  it('focus background → CSS var', () => {
    const style = getFocusBackgroundStyle({ focusBackgroundColor: '#00ffff' })
    assert.equal(
      (style as Record<string, unknown>)?.['--dw-focus-bg'],
      '#00ffff',
    )
  })

  it('focus text → CSS var', () => {
    const style = getFocusTextStyle({ focusTextColor: '#0000ff' })
    assert.equal(
      (style as Record<string, unknown>)?.['--dw-focus-text'],
      '#0000ff',
    )
  })

  it('disabled background → CSS var', () => {
    const style = getDisabledBackgroundStyle({
      disabledBackgroundColor: '#888888',
    })
    assert.equal(
      (style as Record<string, unknown>)?.['--dw-disabled-bg'],
      '#888888',
    )
  })

  it('disabled text → CSS var', () => {
    const style = getDisabledTextStyle({ disabledTextColor: '#cccccc' })
    assert.equal(
      (style as Record<string, unknown>)?.['--dw-disabled-text'],
      '#cccccc',
    )
  })

  it('빈 color → 모두 undefined', () => {
    assert.equal(getHoverBackgroundStyle({}), undefined)
    assert.equal(getHoverTextStyle({}), undefined)
    assert.equal(getActiveBackgroundStyle({}), undefined)
    assert.equal(getActiveTextStyle({}), undefined)
    assert.equal(getFocusBackgroundStyle({}), undefined)
    assert.equal(getFocusTextStyle({}), undefined)
    assert.equal(getDisabledBackgroundStyle({}), undefined)
    assert.equal(getDisabledTextStyle({}), undefined)
  })
})

describe('getTransformStyle', () => {
  it('undefined → undefined', () => {
    assert.equal(getTransformStyle(undefined), undefined)
  })

  it('빈 객체 → undefined (아무 transform도 없으면)', () => {
    assert.equal(getTransformStyle({}), undefined)
  })

  it('translate/rotate/scale 명시 → CSS transform 문자열 (정해진 순서)', () => {
    const style = getTransformStyle({
      translateX: 10,
      translateY: 20,
      rotate: 45,
      scale: 1.5,
    })
    // perspective → translateX → translateY → rotate → scale → skew → rotate3d 순서
    assert.equal(
      style?.transform,
      'translateX(10px) translateY(20px) rotate(45deg) scale(1.5)',
    )
  })

  it('perspective는 가장 먼저 (3D 변환)', () => {
    const style = getTransformStyle({
      perspective: 800,
      rotateX: 30,
      translateX: 5,
    })
    assert.equal(
      style?.transform,
      'perspective(800px) translateX(5px) rotateX(30deg)',
    )
  })

  it('skew + rotate3d', () => {
    const style = getTransformStyle({
      skewX: 5,
      skewY: 10,
      rotateX: 15,
      rotateY: 20,
    })
    assert.equal(
      style?.transform,
      'skewX(5deg) skewY(10deg) rotateX(15deg) rotateY(20deg)',
    )
  })

  it('originX/Y 명시 → transformOrigin', () => {
    const style = getTransformStyle({ originX: 25, originY: 75 })
    assert.equal(style?.transformOrigin, '25% 75%')
  })

  it('originX만 있고 originY 없으면 50% default', () => {
    const style = getTransformStyle({ originX: 25 })
    assert.equal(style?.transformOrigin, '25% 50%')
  })

  it('transform 부분 + origin 모두 결과 객체에', () => {
    const style = getTransformStyle({
      translateX: 10,
      originX: 50,
      originY: 50,
    })
    assert.equal(style?.transform, 'translateX(10px)')
    assert.equal(style?.transformOrigin, '50% 50%')
  })
})

describe('getTransitionStyle', () => {
  it('undefined → undefined', () => {
    assert.equal(getTransitionStyle(undefined), undefined)
  })

  it('빈 객체 → undefined (duration도 timing도 없으면)', () => {
    assert.equal(getTransitionStyle({}), undefined)
  })

  it('duration → transitionDuration ms', () => {
    const style = getTransitionStyle({ duration: 200 })
    assert.equal(style?.transitionDuration, '200ms')
  })

  it('preset timing → transitionTimingFunction (CSS name 그대로)', () => {
    const style = getTransitionStyle({ duration: 100, timing: 'ease-in-out' })
    assert.equal(style?.transitionTimingFunction, 'ease-in-out')
  })

  it('custom timing + cubicBezier → cubic-bezier()', () => {
    const style = getTransitionStyle({
      duration: 100,
      timing: 'custom',
      cubicBezier: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
    })
    assert.equal(style?.transitionTimingFunction, 'cubic-bezier(0.4, 0, 0.2, 1)')
  })

  it('custom timing + cubicBezier 없으면 ease로 fallback', () => {
    const style = getTransitionStyle({ duration: 100, timing: 'custom' })
    assert.equal(style?.transitionTimingFunction, 'ease')
  })
})
