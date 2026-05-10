// canvas-defaults.ts — 캔버스 className 값과 _이중 source_로 작성된 default들의
// 회귀 방어 (핸드오버 #6 className drift catch).
//
// 캔버스 CanvasNode의 className에 박힌 spacing/layout/shape 값이 변경되면
// 여기 값도 동기화 필요. 이 테스트는 _현재_ 값을 잠궈둔다.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_COLOR_TOKENS_BY_EMPHASIS,
  DEFAULT_COLOR_TOKENS_BY_TYPE,
  DEFAULT_LAYOUT_BY_TYPE,
  DEFAULT_SHAPE_BY_TYPE,
  DEFAULT_SPACING_BY_TYPE,
  DEFAULT_TYPOGRAPHY_BY_EMPHASIS,
} from './canvas-defaults.js'

describe('DEFAULT_SPACING_BY_TYPE — 캔버스 className padding/gap 값과 일치', () => {
  it('section: p-10 gap-8 (40, 32)', () => {
    assert.deepEqual(DEFAULT_SPACING_BY_TYPE.section, {
      paddingTop: 40,
      paddingRight: 40,
      paddingBottom: 40,
      paddingLeft: 40,
      gap: 32,
    })
  })

  it('hero: p-12 gap-10 (48, 40)', () => {
    assert.deepEqual(DEFAULT_SPACING_BY_TYPE.hero, {
      paddingTop: 48,
      paddingRight: 48,
      paddingBottom: 48,
      paddingLeft: 48,
      gap: 40,
    })
  })

  it('card: p-5 gap-3 (20, 12)', () => {
    assert.deepEqual(DEFAULT_SPACING_BY_TYPE.card, {
      paddingTop: 20,
      paddingRight: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      gap: 12,
    })
  })

  it('list: p-0 gap-3 (0, 12)', () => {
    assert.deepEqual(DEFAULT_SPACING_BY_TYPE.list, { gap: 12 })
  })

  it('form: p-8 gap-5 (32, 20)', () => {
    assert.deepEqual(DEFAULT_SPACING_BY_TYPE.form, {
      paddingTop: 32,
      paddingRight: 32,
      paddingBottom: 32,
      paddingLeft: 32,
      gap: 20,
    })
  })

  it('button: px-5 = padding-x 20px (vertical은 min-h로 처리, spacing 영역 외)', () => {
    assert.deepEqual(DEFAULT_SPACING_BY_TYPE.button, {
      paddingLeft: 20,
      paddingRight: 20,
    })
  })

  it('leaf nodes(text/image): spacing default 없음', () => {
    assert.deepEqual(DEFAULT_SPACING_BY_TYPE.text, {})
    assert.deepEqual(DEFAULT_SPACING_BY_TYPE.image, {})
  })
})

describe('DEFAULT_LAYOUT_BY_TYPE — flex direction/wrap', () => {
  it('section/list/form: flex column / nowrap', () => {
    assert.deepEqual(DEFAULT_LAYOUT_BY_TYPE.section, {
      direction: 'column',
      wrap: 'nowrap',
    })
    assert.deepEqual(DEFAULT_LAYOUT_BY_TYPE.list, {
      direction: 'column',
      wrap: 'nowrap',
    })
    assert.deepEqual(DEFAULT_LAYOUT_BY_TYPE.form, {
      direction: 'column',
      wrap: 'nowrap',
    })
  })

  it('hero/card: 빈 layout (자체는 grid/article 기반 — 자식 wrapper만 flex)', () => {
    assert.deepEqual(DEFAULT_LAYOUT_BY_TYPE.hero, {})
    assert.deepEqual(DEFAULT_LAYOUT_BY_TYPE.card, {})
  })

  it('leaf: 빈 layout', () => {
    assert.deepEqual(DEFAULT_LAYOUT_BY_TYPE.text, {})
    assert.deepEqual(DEFAULT_LAYOUT_BY_TYPE.button, {})
    assert.deepEqual(DEFAULT_LAYOUT_BY_TYPE.image, {})
  })
})

describe('DEFAULT_SHAPE_BY_TYPE — radius/border/shadow', () => {
  it('card / form: rounded-lg(8) border-1px-solid shadow-sm', () => {
    assert.deepEqual(DEFAULT_SHAPE_BY_TYPE.card, {
      radius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      shadow: 'sm',
    })
    assert.deepEqual(DEFAULT_SHAPE_BY_TYPE.form, {
      radius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      shadow: 'sm',
    })
  })

  it('나머지 type: 빈 shape (명시 X)', () => {
    assert.deepEqual(DEFAULT_SHAPE_BY_TYPE.section, {})
    assert.deepEqual(DEFAULT_SHAPE_BY_TYPE.hero, {})
    assert.deepEqual(DEFAULT_SHAPE_BY_TYPE.list, {})
    assert.deepEqual(DEFAULT_SHAPE_BY_TYPE.text, {})
    assert.deepEqual(DEFAULT_SHAPE_BY_TYPE.button, {})
    assert.deepEqual(DEFAULT_SHAPE_BY_TYPE.image, {})
  })
})

describe('DEFAULT_COLOR_TOKENS_BY_TYPE — color preset slot 매핑', () => {
  it('hero: backgroundColor=heroSurface, textColor=heroText', () => {
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_TYPE.hero, {
      backgroundColor: 'heroSurface',
      textColor: 'heroText',
    })
  })

  it('card / form: backgroundColor=surfaceMuted, borderColor=border', () => {
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_TYPE.card, {
      backgroundColor: 'surfaceMuted',
      borderColor: 'border',
    })
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_TYPE.form, {
      backgroundColor: 'surfaceMuted',
      borderColor: 'border',
    })
  })

  it('section/list: 토큰 슬롯 없음 (부모 색 상속)', () => {
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_TYPE.section, {})
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_TYPE.list, {})
  })

  it('leaf: 토큰 슬롯 없음 (부모 상속)', () => {
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_TYPE.text, {})
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_TYPE.button, {})
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_TYPE.image, {})
  })
})

describe('DEFAULT_COLOR_TOKENS_BY_EMPHASIS — text emphasis별 textColor 토큰', () => {
  it('heading-2/3: textColor=textPrimary', () => {
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_EMPHASIS['heading-2'], {
      textColor: 'textPrimary',
    })
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_EMPHASIS['heading-3'], {
      textColor: 'textPrimary',
    })
  })

  it('caption: textColor=accent', () => {
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_EMPHASIS.caption, {
      textColor: 'accent',
    })
  })

  it('heading-1 / body: 부모 상속 (토큰 슬롯 없음)', () => {
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_EMPHASIS['heading-1'], {})
    assert.deepEqual(DEFAULT_COLOR_TOKENS_BY_EMPHASIS.body, {})
  })
})

describe('DEFAULT_TYPOGRAPHY_BY_EMPHASIS — TextPreview className 값과 일치', () => {
  it('heading-1: text-5xl(48) font-semibold(600) leading-tight(1.25)', () => {
    assert.deepEqual(DEFAULT_TYPOGRAPHY_BY_EMPHASIS['heading-1'], {
      fontSize: 48,
      fontWeight: '600',
      lineHeight: 1.25,
      letterSpacing: 0,
      textAlign: 'left',
      fontFamily: 'sans',
    })
  })

  it('heading-2: text-2xl(24) font-semibold(600) lh-1.35', () => {
    assert.deepEqual(DEFAULT_TYPOGRAPHY_BY_EMPHASIS['heading-2'], {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.35,
      letterSpacing: 0,
      textAlign: 'left',
      fontFamily: 'sans',
    })
  })

  it('heading-3: text-lg(18) font-semibold(600) lh-1.45', () => {
    assert.deepEqual(DEFAULT_TYPOGRAPHY_BY_EMPHASIS['heading-3'], {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.45,
      letterSpacing: 0,
      textAlign: 'left',
      fontFamily: 'sans',
    })
  })

  it('body: text-base(16) font-normal(400) lh-1.75', () => {
    assert.deepEqual(DEFAULT_TYPOGRAPHY_BY_EMPHASIS.body, {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.75,
      letterSpacing: 0,
      textAlign: 'left',
      fontFamily: 'sans',
    })
  })

  it('caption: text-xs(12) font-semibold(600) lh-1.35', () => {
    assert.deepEqual(DEFAULT_TYPOGRAPHY_BY_EMPHASIS.caption, {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 1.35,
      letterSpacing: 0,
      textAlign: 'left',
      fontFamily: 'sans',
    })
  })
})
