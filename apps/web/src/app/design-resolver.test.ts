// design-resolver unit tests — Phase 2 첫 안전망.
// 회귀 방지 핵심: canvas-defaults 값이 _캔버스 className_과 어긋나면 즉시 깨져야 한다.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { TreeNode } from '@dworks/tree'

import {
  DEFAULT_LAYOUT_BY_TYPE,
  DEFAULT_SPACING_BY_TYPE,
} from './canvas-defaults.js'
import {
  resolveColor,
  resolveLayout,
  resolveShape,
  resolveSpacing,
  resolveTypography,
} from './design-resolver.js'

function makeSection(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'n-section',
    type: 'section',
    editKind: 'structure',
    responsive: undefined,
    children: [],
    ...overrides,
  } as TreeNode
}

function makeText(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'n-text',
    type: 'text',
    editKind: 'text',
    responsive: undefined,
    content: 'hi',
    ...overrides,
  } as TreeNode
}

describe('resolveSpacing', () => {
  it('leaf 노드는 default가 비어있어 value가 비어있다', () => {
    const out = resolveSpacing(makeText(), { viewport: 'desktop' })
    assert.deepEqual(out.value, {})
    assert.deepEqual(out.sources, {})
  })

  it('일반 section은 type default(p-10 gap-8)을 채운다', () => {
    const out = resolveSpacing(makeSection(), { viewport: 'desktop' })
    assert.equal(out.value.paddingTop, 40)
    assert.equal(out.value.gap, 32)
    assert.equal(out.sources.paddingTop, 'default')
  })

  it('banner role section은 default 적용 안 됨 (page shell)', () => {
    const node = makeSection({ role: 'banner' } as Partial<TreeNode>)
    const out = resolveSpacing(node, { viewport: 'desktop' })
    assert.deepEqual(out.value, {})
    assert.deepEqual(out.sources, {})
  })

  it('explicit column direction section은 default 적용 안 됨 (page shell)', () => {
    const node = makeSection({ layout: { direction: 'column' } })
    const out = resolveSpacing(node, { viewport: 'desktop' })
    assert.deepEqual(out.value, {})
    assert.deepEqual(out.sources, {})
  })

  it('hero default(p-12 gap-10)을 채운다', () => {
    const hero = makeSection({ type: 'hero', id: 'n-hero' } as Partial<TreeNode>)
    const out = resolveSpacing(hero, { viewport: 'desktop' })
    assert.equal(out.value.paddingTop, 48)
    assert.equal(out.value.gap, 40)
    assert.equal(out.sources.paddingTop, 'default')
    assert.equal(out.sources.gap, 'default')
  })

  it('explicit override는 default를 덮고 source가 explicit', () => {
    const hero = makeSection({
      type: 'hero',
      id: 'n-hero',
      spacing: { paddingTop: 100, gap: 16 },
    } as Partial<TreeNode>)
    const out = resolveSpacing(hero, { viewport: 'desktop' })
    assert.equal(out.value.paddingTop, 100)
    assert.equal(out.value.gap, 16)
    assert.equal(out.sources.paddingTop, 'explicit')
    assert.equal(out.sources.gap, 'explicit')
    // 명시 안 한 키는 default로 채워짐
    assert.equal(out.value.paddingLeft, 48)
    assert.equal(out.sources.paddingLeft, 'default')
  })

  it('mobile에서 큰 explicit padding은 responsive 보정되며 source가 responsive', () => {
    const node = makeSection({ spacing: { paddingTop: 96, paddingLeft: 32 } })
    const out = resolveSpacing(node, { viewport: 'mobile' })
    assert.equal(out.value.paddingTop, 60)
    assert.equal(out.value.paddingLeft, 24)
    assert.equal(out.sources.paddingTop, 'responsive')
    assert.equal(out.sources.paddingLeft, 'responsive')
  })

  it('mobile에서 작은 explicit padding은 보정 안 되고 source가 explicit 유지', () => {
    const node = makeSection({ spacing: { paddingTop: 16 } })
    const out = resolveSpacing(node, { viewport: 'mobile' })
    assert.equal(out.value.paddingTop, 16)
    assert.equal(out.sources.paddingTop, 'explicit')
  })

  it('default는 viewport 보정 없이 그대로 (회귀 방지 — 작은 화면에서 default 말없이 줄어들면 시각 회귀)', () => {
    // hero default paddingTop=48. mobile threshold(≥80)보다 작으므로 변동 없음
    const hero = makeSection({ type: 'hero', id: 'n-hero' } as Partial<TreeNode>)
    const out = resolveSpacing(hero, { viewport: 'mobile' })
    assert.equal(out.value.paddingTop, 48)
    assert.equal(out.sources.paddingTop, 'default')
  })

  it('canvas-defaults는 모든 TreeNodeType을 커버해야 한다 — 누락 시 사용자가 type 추가 후 resolver가 빠진 default 반환', () => {
    const types: Array<keyof typeof DEFAULT_SPACING_BY_TYPE> = [
      'text',
      'button',
      'image',
      'section',
      'hero',
      'card',
      'list',
      'form',
    ]
    for (const t of types) {
      assert.ok(
        DEFAULT_SPACING_BY_TYPE[t] !== undefined,
        `DEFAULT_SPACING_BY_TYPE missing ${t}`,
      )
      assert.ok(
        DEFAULT_LAYOUT_BY_TYPE[t] !== undefined,
        `DEFAULT_LAYOUT_BY_TYPE missing ${t}`,
      )
    }
  })
})

describe('resolveLayout', () => {
  it('section default는 column / nowrap', () => {
    const out = resolveLayout(makeSection(), { viewport: 'desktop' })
    assert.equal(out.value.direction, 'column')
    assert.equal(out.value.wrap, 'nowrap')
    assert.equal(out.sources.direction, 'default')
    assert.equal(out.sources.wrap, 'default')
  })

  it('hero/card default는 비어 있어 토글이 비활성 상태로 표시', () => {
    const hero = makeSection({ type: 'hero', id: 'n-hero' } as Partial<TreeNode>)
    const out = resolveLayout(hero, { viewport: 'desktop' })
    assert.equal(out.value.direction, undefined)
    assert.equal(out.value.wrap, undefined)
  })

  it('explicit override는 default를 덮고 source가 explicit', () => {
    const node = makeSection({ layout: { direction: 'row', justify: 'center' } })
    const out = resolveLayout(node, { viewport: 'desktop' })
    assert.equal(out.value.direction, 'row')
    assert.equal(out.value.justify, 'center')
    assert.equal(out.sources.direction, 'explicit')
    assert.equal(out.sources.justify, 'explicit')
    // 명시 안 한 키는 default
    assert.equal(out.value.wrap, 'nowrap')
    assert.equal(out.sources.wrap, 'default')
  })

  it('mobile에서 explicit row direction은 column으로 보정 (source: responsive)', () => {
    const node = makeSection({ layout: { direction: 'row' } })
    const out = resolveLayout(node, { viewport: 'mobile' })
    assert.equal(out.value.direction, 'column')
    assert.equal(out.sources.direction, 'responsive')
  })

  it('mobile에서도 explicit column은 그대로 (source: explicit)', () => {
    const node = makeSection({ layout: { direction: 'column' } })
    const out = resolveLayout(node, { viewport: 'mobile' })
    assert.equal(out.value.direction, 'column')
    assert.equal(out.sources.direction, 'explicit')
  })
})

describe('resolveTypography', () => {
  it('text가 아닌 노드는 빈 typography 반환', () => {
    const out = resolveTypography(makeSection())
    assert.deepEqual(out.value, {})
    assert.deepEqual(out.sources, {})
  })

  it('emphasis 미지정 text는 body default(fontSize 16, fontWeight 400, lineHeight 1.75)', () => {
    const out = resolveTypography(makeText())
    assert.equal(out.value.fontSize, 16)
    assert.equal(out.value.fontWeight, '400')
    assert.equal(out.value.lineHeight, 1.75)
    assert.equal(out.value.textAlign, 'left')
    assert.equal(out.value.fontFamily, 'sans')
    assert.equal(out.sources.fontSize, 'default')
    assert.equal(out.sources.lineHeight, 'default')
  })

  it('heading-1 default는 48/600/1.25', () => {
    const node = makeText({ emphasis: 'heading-1' } as Partial<TreeNode>)
    const out = resolveTypography(node)
    assert.equal(out.value.fontSize, 48)
    assert.equal(out.value.fontWeight, '600')
    assert.equal(out.value.lineHeight, 1.25)
  })

  it('explicit fontSize는 default를 덮고 source가 explicit', () => {
    const node = makeText({
      emphasis: 'heading-1',
      typography: { fontSize: 64 },
    } as Partial<TreeNode>)
    const out = resolveTypography(node)
    assert.equal(out.value.fontSize, 64)
    assert.equal(out.value.fontWeight, '600')
    assert.equal(out.sources.fontSize, 'explicit')
    assert.equal(out.sources.fontWeight, 'default')
  })

  it('caption emphasis는 fontSize 12 fontWeight 600', () => {
    const node = makeText({ emphasis: 'caption' } as Partial<TreeNode>)
    const out = resolveTypography(node)
    assert.equal(out.value.fontSize, 12)
    assert.equal(out.value.fontWeight, '600')
  })
})

describe('resolveShape', () => {
  it('section/list/leaf는 빈 shape (default 없음)', () => {
    const out = resolveShape(makeSection())
    assert.deepEqual(out.value, {})
    assert.deepEqual(out.sources, {})
  })

  it('card default는 radius 8 borderWidth 1 solid shadow sm', () => {
    const card = makeSection({ type: 'card', id: 'n-card' } as Partial<TreeNode>)
    const out = resolveShape(card)
    assert.equal(out.value.radius, 8)
    assert.equal(out.value.borderWidth, 1)
    assert.equal(out.value.borderStyle, 'solid')
    assert.equal(out.value.shadow, 'sm')
    assert.equal(out.sources.radius, 'default')
    assert.equal(out.sources.shadow, 'default')
  })

  it('explicit override는 default를 덮음', () => {
    const card = makeSection({
      type: 'card',
      id: 'n-card',
      shape: { radius: 16, shadow: 'lg' },
    } as Partial<TreeNode>)
    const out = resolveShape(card)
    assert.equal(out.value.radius, 16)
    assert.equal(out.value.shadow, 'lg')
    assert.equal(out.sources.radius, 'explicit')
    assert.equal(out.sources.shadow, 'explicit')
    // 명시 안 한 키는 default
    assert.equal(out.value.borderWidth, 1)
    assert.equal(out.sources.borderWidth, 'default')
  })

  it('borderColor는 colorPreset 미지정 시 undefined', () => {
    const card = makeSection({ type: 'card', id: 'n-card' } as Partial<TreeNode>)
    const out = resolveShape(card)
    assert.equal(out.value.borderColor, undefined)
    assert.equal(out.sources.borderColor, undefined)
  })

  it('card는 mint preset에서 border token(#d7ddd2)을 borderColor로 resolve', () => {
    const card = makeSection({ type: 'card', id: 'n-card' } as Partial<TreeNode>)
    const out = resolveShape(card, { viewport: 'desktop', colorPreset: 'mint' })
    assert.equal(out.value.borderColor, '#d7ddd2')
    assert.equal(out.sources.borderColor, 'token')
  })

  it('explicit borderColor는 token을 덮음', () => {
    const card = makeSection({
      type: 'card',
      id: 'n-card',
      shape: { borderColor: '#123456' },
    } as Partial<TreeNode>)
    const out = resolveShape(card, { viewport: 'desktop', colorPreset: 'mint' })
    assert.equal(out.value.borderColor, '#123456')
    assert.equal(out.sources.borderColor, 'explicit')
  })
})

describe('resolveColor', () => {
  it('section/list/leaf는 token slot 없어 빈 color', () => {
    const out = resolveColor(makeSection(), {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    assert.deepEqual(out.value, {})
    assert.deepEqual(out.sources, {})
  })

  it('hero는 mint preset에서 heroSurface(#102822) / heroText(#ffffff) token resolved', () => {
    const hero = makeSection({ type: 'hero', id: 'n-hero' } as Partial<TreeNode>)
    const out = resolveColor(hero, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    assert.equal(out.value.backgroundColor, '#102822')
    assert.equal(out.value.textColor, '#ffffff')
    assert.equal(out.sources.backgroundColor, 'token')
    assert.equal(out.sources.textColor, 'token')
  })

  it('card는 mint preset에서 surfaceMuted(#fbfcfa) backgroundColor token resolved', () => {
    // borderColor는 Shape 스키마라 본 resolver 영역 밖 — 후속 phase의 resolveShape에서 처리
    const card = makeSection({ type: 'card', id: 'n-card' } as Partial<TreeNode>)
    const out = resolveColor(card, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    assert.equal(out.value.backgroundColor, '#fbfcfa')
    assert.equal(out.sources.backgroundColor, 'token')
  })

  it('explicit override는 token을 덮음', () => {
    const hero = makeSection({
      type: 'hero',
      id: 'n-hero',
      color: { backgroundColor: '#ff0000' },
    } as Partial<TreeNode>)
    const out = resolveColor(hero, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    assert.equal(out.value.backgroundColor, '#ff0000')
    assert.equal(out.sources.backgroundColor, 'explicit')
    // 명시 안 한 키는 token
    assert.equal(out.value.textColor, '#ffffff')
    assert.equal(out.sources.textColor, 'token')
  })

  it('text heading-2는 emphasis slot textColor=textPrimary로 token resolved', () => {
    const node = makeText({ emphasis: 'heading-2' } as Partial<TreeNode>)
    const out = resolveColor(node, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    // mint preset textPrimary = '#18211d'
    assert.equal(out.value.textColor, '#18211d')
    assert.equal(out.sources.textColor, 'token')
  })

  it('text caption은 emphasis slot textColor=accent로 token resolved', () => {
    const node = makeText({ emphasis: 'caption' } as Partial<TreeNode>)
    const out = resolveColor(node, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    // mint preset accent = '#1b7f72'
    assert.equal(out.value.textColor, '#1b7f72')
    assert.equal(out.sources.textColor, 'token')
  })

  it('text body/heading-1은 textColor 미지정 (부모 상속)', () => {
    const body = makeText({ emphasis: 'body' } as Partial<TreeNode>)
    const out = resolveColor(body, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    assert.equal(out.value.textColor, undefined)
    assert.equal(out.sources.textColor, undefined)
  })

  it('colorPreset 미지정 시 token slot은 resolve 안 됨 (explicit만 살아남음)', () => {
    const hero = makeSection({
      type: 'hero',
      id: 'n-hero',
      color: { backgroundColor: '#abcdef' },
    } as Partial<TreeNode>)
    const out = resolveColor(hero, { viewport: 'desktop' })
    assert.equal(out.value.backgroundColor, '#abcdef')
    assert.equal(out.sources.backgroundColor, 'explicit')
    assert.equal(out.value.textColor, undefined)
    assert.equal(out.sources.textColor, undefined)
  })

  // 코덱스 P1 회귀 방지 — explicit gradient/opacity/state colors가 보존되어야 한다.
  it('explicit backgroundGradient는 resolved value에 보존', () => {
    const hero = makeSection({
      type: 'hero',
      id: 'n-hero',
      color: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to-bottom-right',
          from: '#111111',
          to: '#eeeeee',
        },
      },
    } as Partial<TreeNode>)
    const out = resolveColor(hero, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    assert.deepEqual(out.value.backgroundGradient, {
      type: 'linear',
      direction: 'to-bottom-right',
      from: '#111111',
      to: '#eeeeee',
    })
  })

  it('explicit backgroundOpacity / textOpacity 보존', () => {
    const hero = makeSection({
      type: 'hero',
      id: 'n-hero',
      color: { backgroundColor: '#ff0000', backgroundOpacity: 0.5, textOpacity: 0.8 },
    } as Partial<TreeNode>)
    const out = resolveColor(hero, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    assert.equal(out.value.backgroundOpacity, 0.5)
    assert.equal(out.value.textOpacity, 0.8)
  })

  it('explicit hover/active/focus/disabled state colors 보존', () => {
    const button = makeSection({
      type: 'button',
      id: 'n-btn',
      color: {
        hoverBackgroundColor: '#abc123',
        activeTextColor: '#def456',
        focusBackgroundColor: '#fedcba',
        disabledTextColor: '#789012',
      },
    } as Partial<TreeNode>)
    const out = resolveColor(button, {
      viewport: 'desktop',
      colorPreset: 'mint',
    })
    assert.equal(out.value.hoverBackgroundColor, '#abc123')
    assert.equal(out.value.activeTextColor, '#def456')
    assert.equal(out.value.focusBackgroundColor, '#fedcba')
    assert.equal(out.value.disabledTextColor, '#789012')
  })
})

describe('resolveLayout — 코덱스 P1 회귀 방지', () => {
  it('layout 명시 없는 hero는 mobile에서도 빈 layout (responsive 가짜 column 박지 않음)', () => {
    const hero = makeSection({ type: 'hero', id: 'n-hero' } as Partial<TreeNode>)
    const out = resolveLayout(hero, { viewport: 'mobile' })
    // hero default layout은 빈 {}이고, explicit이 없으므로 responsive 보정도 안 됨
    assert.equal(out.value.direction, undefined)
    assert.equal(out.sources.direction, undefined)
  })

  it('layout 명시 없는 card도 mobile에서 빈 layout', () => {
    const card = makeSection({ type: 'card', id: 'n-card' } as Partial<TreeNode>)
    const out = resolveLayout(card, { viewport: 'mobile' })
    assert.equal(out.value.direction, undefined)
    assert.equal(out.sources.direction, undefined)
  })

  it('explicit layout(direction:row)이 있는 hero는 mobile에서 column 보정', () => {
    const hero = makeSection({
      type: 'hero',
      id: 'n-hero',
      layout: { direction: 'row' },
    } as Partial<TreeNode>)
    const out = resolveLayout(hero, { viewport: 'mobile' })
    assert.equal(out.value.direction, 'column')
    assert.equal(out.sources.direction, 'responsive')
  })
})

describe('responsiveStyle viewport override', () => {
  it('typography fontSize override가 mobile에서 적용되고 desktop에서 base 유지', () => {
    const text = makeText({
      typography: { fontSize: 64, fontWeight: '800' },
      responsiveStyle: { mobile: { typography: { fontSize: 36 } } },
    } as Partial<TreeNode>)
    const desktop = resolveTypography(text, { viewport: 'desktop' })
    const mobile = resolveTypography(text, { viewport: 'mobile' })
    const tablet = resolveTypography(text, { viewport: 'tablet' })
    assert.equal(desktop.value.fontSize, 64)
    assert.equal(mobile.value.fontSize, 36)
    assert.equal(tablet.value.fontSize, 64)
    // base의 다른 키(fontWeight)는 모든 viewport에서 유지 — 부분 머지
    assert.equal(mobile.value.fontWeight, '800')
    // override된 키는 sources='responsive'
    assert.equal(mobile.sources.fontSize, 'responsive')
    assert.equal(desktop.sources.fontSize, 'explicit')
  })

  it('spacing 부분 override — paddingTop만 override, paddingLeft는 base 유지', () => {
    const section = makeSection({
      id: 'n',
      type: 'card',
      spacing: { paddingTop: 80, paddingLeft: 56 },
      responsiveStyle: { mobile: { spacing: { paddingTop: 24 } } },
    } as Partial<TreeNode>)
    const desktop = resolveSpacing(section, { viewport: 'desktop' })
    const mobile = resolveSpacing(section, { viewport: 'mobile' })
    assert.equal(desktop.value.paddingTop, 80)
    assert.equal(desktop.value.paddingLeft, 56)
    // mobile: paddingTop은 user override 적용, paddingLeft는 자동 보정(56→24)
    assert.equal(mobile.value.paddingTop, 24)
    assert.equal(mobile.value.paddingLeft, 24)
    assert.equal(mobile.sources.paddingTop, 'responsive')
  })

  it('user override가 자동 보정을 이긴다 (mobile padding 60 그대로)', () => {
    const section = makeSection({
      id: 'n',
      type: 'card',
      spacing: { paddingTop: 80 },
      // mobile에서 자동 보정은 ≥80을 60으로 줄이지만 user override가 우선
      responsiveStyle: { mobile: { spacing: { paddingTop: 60 } } },
    } as Partial<TreeNode>)
    const out = resolveSpacing(section, { viewport: 'mobile' })
    assert.equal(out.value.paddingTop, 60)
    assert.equal(out.sources.paddingTop, 'responsive')
  })

  it('shape radius mobile override', () => {
    const card = makeSection({
      id: 'n',
      type: 'card',
      shape: { radius: 24 },
      responsiveStyle: { mobile: { shape: { radius: 8 } } },
    } as Partial<TreeNode>)
    const desktop = resolveShape(card, { viewport: 'desktop' })
    const mobile = resolveShape(card, { viewport: 'mobile' })
    assert.equal(desktop.value.radius, 24)
    assert.equal(mobile.value.radius, 8)
  })

  it('layout direction tablet override', () => {
    const hero = makeSection({
      type: 'hero',
      id: 'n',
      layout: { direction: 'row' },
      responsiveStyle: { tablet: { layout: { direction: 'column' } } },
    } as Partial<TreeNode>)
    const desktop = resolveLayout(hero, { viewport: 'desktop' })
    const tablet = resolveLayout(hero, { viewport: 'tablet' })
    assert.equal(desktop.value.direction, 'row')
    assert.equal(tablet.value.direction, 'column')
    assert.equal(tablet.sources.direction, 'responsive')
  })

  it('color textColor mobile override', () => {
    const text = makeText({
      color: { textColor: '#0f172a' },
      responsiveStyle: { mobile: { color: { textColor: '#dc2626' } } },
    } as Partial<TreeNode>)
    const desktop = resolveColor(text, { viewport: 'desktop' })
    const mobile = resolveColor(text, { viewport: 'mobile' })
    assert.equal(desktop.value.textColor, '#0f172a')
    assert.equal(mobile.value.textColor, '#dc2626')
  })

  it('responsiveStyle 없으면 기존 동작 그대로', () => {
    const text = makeText({
      typography: { fontSize: 48 },
    } as Partial<TreeNode>)
    const out = resolveTypography(text, { viewport: 'mobile' })
    assert.equal(out.value.fontSize, 48)
  })
})
