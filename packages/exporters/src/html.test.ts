// EXP-01/02/03 — html.ts (exportTreeToHtml + detectFeatures) 검증.
// node:test runner — packages 전반 일관 패턴.
//
// Tree fixture 는 _detectFeatures traversal_ 만 흉내내면 충분.
// renderTree 호출은 schema 통과만 보장하면 되므로 root.type='section' + children 만 채움.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { detectFeatures, exportTreeToHtml } from './html'

// 최소 SectionNode 골격 (BaseNodeMeta + children).
function makeTree(rootChildren: unknown[]): { root: unknown } {
  return {
    root: {
      id: 'root',
      type: 'section',
      editKind: 'container',
      children: rootChildren,
    },
  }
}

test('detectFeatures — 인터랙티브 4종 + entranceAnimation 검출', () => {
  const tree = makeTree([
    { id: 'c1', type: 'carousel', editKind: 'media', items: [] },
    { id: 't1', type: 'tabs', editKind: 'container', items: [] },
    { id: 'a1', type: 'accordion', editKind: 'container', items: [] },
    { id: 'm1', type: 'modal', editKind: 'container', title: 'X', content: 'X' },
    {
      id: 'x1',
      type: 'text',
      editKind: 'text',
      content: 'hi',
      entranceAnimation: { type: 'slide-up' },
    },
  ])
  const features = detectFeatures(tree as never)
  assert.equal(features.hasCarousel, true)
  assert.equal(features.hasTabs, true)
  assert.equal(features.hasAccordion, true)
  assert.equal(features.hasModal, true)
  assert.equal(features.hasEntranceAnimation, true)
})

test('detectFeatures — 빈 트리는 모든 feature false', () => {
  const tree = makeTree([])
  const features = detectFeatures(tree as never)
  assert.equal(features.hasCarousel, false)
  assert.equal(features.hasTabs, false)
  assert.equal(features.hasAccordion, false)
  assert.equal(features.hasModal, false)
  assert.equal(features.hasEntranceAnimation, false)
})

test('detectFeatures — 중첩 children 재귀 (section 안 carousel 검출)', () => {
  const tree = makeTree([
    {
      id: 's1',
      type: 'section',
      editKind: 'container',
      children: [{ id: 'c1', type: 'carousel', editKind: 'media', items: [] }],
    },
  ])
  const features = detectFeatures(tree as never)
  assert.equal(features.hasCarousel, true)
})

test('exportTreeToHtml — !DOCTYPE + lang ko + head meta + Pretendard', () => {
  const tree = makeTree([])
  const html = exportTreeToHtml(tree as never)
  assert.ok(html.startsWith('<!DOCTYPE html>'), 'starts with doctype')
  assert.ok(html.includes('lang="ko"'), 'lang=ko 박힘')
  assert.ok(html.includes('<meta charset="UTF-8">'), 'charset meta')
  assert.ok(html.includes('viewport'), 'viewport meta')
  assert.ok(html.includes('pretendardvariable'), 'Pretendard CDN')
  assert.ok(html.includes('<title>Dworks Export</title>'), '기본 title')
})

test('exportTreeToHtml — options.title / options.lang 적용', () => {
  const tree = makeTree([])
  const html = exportTreeToHtml(tree as never, { title: '커스텀', lang: 'en' })
  assert.ok(html.includes('lang="en"'))
  assert.ok(html.includes('<title>커스텀</title>'))
})

test('exportTreeToHtml — carousel 있으면 Embla CDN + init script 주입', () => {
  const tree = makeTree([
    { id: 'c1', type: 'carousel', editKind: 'media', items: [] },
  ])
  const html = exportTreeToHtml(tree as never)
  assert.ok(html.includes('embla-carousel@8.5.0'), 'Embla CDN script tag')
  assert.ok(html.includes('EmblaCarousel('), 'init script 호출')
})

test('exportTreeToHtml — 인터랙티브 없으면 script 미주입', () => {
  const tree = makeTree([
    { id: 't', type: 'text', editKind: 'text', content: 'hi' },
  ])
  const html = exportTreeToHtml(tree as never)
  assert.ok(!html.includes('EmblaCarousel'), 'Embla 없음')
  assert.ok(!html.includes('data-dworks-tab-trigger'), 'tabs script 없음')
  assert.ok(!html.includes('IntersectionObserver'), 'entrance script 없음')
})

test('exportTreeToHtml — entranceAnimation 있으면 IntersectionObserver + reduced-motion 주입', () => {
  const tree = makeTree([
    {
      id: 'x',
      type: 'text',
      editKind: 'text',
      content: 'animated',
      entranceAnimation: { type: 'slide-up' },
    },
  ])
  const html = exportTreeToHtml(tree as never)
  assert.ok(html.includes('IntersectionObserver'), 'IntersectionObserver 주입')
  assert.ok(html.includes('prefers-reduced-motion'), 'reduced-motion 체크')
})

test('exportTreeToHtml — tabs 노드만 있을 때 TABS_SCRIPT 주입 + 다른 script 미주입', () => {
  const tree = makeTree([
    { id: 't1', type: 'tabs', editKind: 'container', items: [] },
  ])
  const html = exportTreeToHtml(tree as never)
  assert.ok(html.includes('data-dworks-tab-trigger'), 'TABS_SCRIPT 주입')
  assert.ok(!html.includes('EmblaCarousel'), 'carousel script 없음')
  assert.ok(!html.includes('data-dworks-modal-trigger'), 'modal script 없음')
})
