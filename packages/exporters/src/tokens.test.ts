// DS-03 — tokens.ts (extractDesignTokens + exportDesignTokens) 검증.
// node:test runner — packages 전반 일관 패턴.
//
// Tree fixture 는 _extractDesignTokens traversal_ 만 흉내내면 충분.
// 스키마 검증을 거치지 않으므로 root.type='section' + children 만 채우면 OK.
// 필드 이름은 packages/tree/src/schema.ts 기준 (paddingTop/marginLeft 등 9 spacing 키,
// radius/radiusTopLeft 등 5 radius 키, NodeColor 11 hex 키).

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { exportDesignTokens, extractDesignTokens } from './tokens'

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

test('extractDesignTokens — hex 색 추출 + 정렬 + lowercase 정규화', () => {
  const tree = makeTree([
    {
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'a',
      color: { backgroundColor: '#FF0000', textColor: '#00FF00' },
    },
    {
      id: 's1',
      type: 'section',
      editKind: 'container',
      shape: { borderColor: '#0000ff' },
      children: [],
    },
  ])
  const tokens = extractDesignTokens(tree as never)
  // 정렬 후 lowercase — '#0000ff', '#00ff00', '#ff0000'
  assert.deepEqual(tokens.colors, ['#0000ff', '#00ff00', '#ff0000'])
})

test('extractDesignTokens — spacing/radius/fontSize/fontFamily 추출 dedup', () => {
  const tree = makeTree([
    {
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'a',
      spacing: { paddingTop: 16, gap: 16 },
      shape: { radius: 8 },
      typography: { fontSize: 48, fontFamily: 'Pretendard' },
    },
    {
      id: 't2',
      type: 'text',
      editKind: 'text',
      content: 'b',
      spacing: { paddingLeft: 24 },
      shape: { radius: 8 },
      typography: { fontFamily: 'Pretendard' },
    },
  ])
  const tokens = extractDesignTokens(tree as never)
  assert.deepEqual(tokens.spacing, [16, 24])
  assert.deepEqual(tokens.radius, [8])
  assert.deepEqual(tokens.fontSize, [48])
  assert.deepEqual(tokens.fontFamily, ['Pretendard'])
})

test('exportDesignTokens tailwind — config 형식 + 색/spacing/fontSize 키', () => {
  const tree = makeTree([
    {
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'a',
      color: { backgroundColor: '#ff6600' },
      spacing: { paddingTop: 24 },
      typography: { fontSize: 24 },
    },
  ])
  const out = exportDesignTokens(tree as never, 'tailwind')
  assert.ok(out.includes("import type { Config } from 'tailwindcss'"))
  assert.ok(out.includes("'dw-1': '#ff6600'"), 'color token')
  assert.ok(out.includes("'dw-24': '24px'"), 'spacing/fontSize token (24)')
  assert.ok(out.includes('export default config'))
})

test('exportDesignTokens css — variables 형식', () => {
  const tree = makeTree([
    {
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'a',
      color: { backgroundColor: '#ff6600' },
      spacing: { paddingTop: 16 },
    },
  ])
  const out = exportDesignTokens(tree as never, 'css')
  assert.ok(out.includes(':root {'))
  assert.ok(out.includes('--dw-token-color-1: #ff6600;'))
  assert.ok(out.includes('--dw-token-space-16: 16px;'))
})

test('exportDesignTokens — 빈 트리는 빈 config/css 골격 생성', () => {
  const tree = makeTree([])
  const tw = exportDesignTokens(tree as never, 'tailwind')
  assert.ok(tw.includes('export default config'))
  // 빈 트리 — colors/spacing/borderRadius 등 블록은 생략됨.
  assert.ok(!tw.includes("colors: {"))
  const css = exportDesignTokens(tree as never, 'css')
  assert.ok(css.includes(':root {'))
  assert.ok(css.endsWith('}\n'))
  // 빈 트리 — 토큰 라인 없음.
  assert.ok(!css.includes('--dw-token-color'))
})
