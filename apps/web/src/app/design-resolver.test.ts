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

  it('section은 default spacing이 비어있다 (role-aware default는 후속 phase)', () => {
    const out = resolveSpacing(makeSection(), { viewport: 'desktop' })
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

  it('borderColor는 default 없음 (token resolver 영역)', () => {
    const card = makeSection({ type: 'card', id: 'n-card' } as Partial<TreeNode>)
    const out = resolveShape(card)
    assert.equal(out.value.borderColor, undefined)
    assert.equal(out.sources.borderColor, undefined)
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
})
