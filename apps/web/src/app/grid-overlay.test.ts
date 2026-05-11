// VIS-01 12-col grid overlay helper unit tests — computeColumnEdges /
// snapToColumnEdge / computeColumnSpan 의 logical px 계산 검증.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  computeColumnEdges,
  computeColumnSpan,
  snapToColumnEdge,
} from './grid-overlay.js'

describe('computeColumnEdges', () => {
  it('1440px container, 12 col, 16 gutter → 24 edges, 0/124/140/.../1440', () => {
    const edges = computeColumnEdges(1440, 12, 16)
    // 12 column 각각 시작점 + 끝점 → 최대 24 edge (중복 제거 후 정렬).
    // colWidth = (1440 - 11*16) / 12 = (1440 - 176) / 12 = 1264/12 ≈ 105.333…
    const colWidth = (1440 - 11 * 16) / 12
    assert.equal(edges.length, 24)
    assert.equal(edges[0], 0)
    assert.equal(edges[1], colWidth)
    // 첫 column 끝(=105.333) 과 두번째 column 시작(=105.333+16=121.333) 사이는 gutter.
    assert.equal(edges[2], colWidth + 16)
    // 마지막 column 끝점은 containerWidth 와 일치(부동소수점 ±1e-9 허용).
    const last = edges[edges.length - 1] ?? 0
    assert.ok(Math.abs(last - 1440) < 1e-9)
  })

  it('returns empty array if colWidth ≤ 0 (container too narrow)', () => {
    // 100px 폭에 12 column + 11 gutter(176px) 면 colWidth 음수 → 빈 배열.
    const edges = computeColumnEdges(100, 12, 16)
    assert.deepEqual(edges, [])
  })

  it('edges sorted ascending', () => {
    const edges = computeColumnEdges(1024, 12, 16)
    for (let i = 1; i < edges.length; i += 1) {
      const cur = edges[i] ?? 0
      const prev = edges[i - 1] ?? 0
      assert.ok(cur > prev, `edge[${i}] should be > edge[${i - 1}]`)
    }
  })
})

describe('snapToColumnEdge', () => {
  const edges = [0, 100, 200, 300]

  it('snaps to nearest edge when within threshold', () => {
    const r = snapToColumnEdge(102, edges, 4)
    assert.deepEqual(r, { value: 100, snapped: true, edge: 100 })
  })

  it('returns original value if no edge within threshold', () => {
    const r = snapToColumnEdge(150, edges, 4)
    assert.deepEqual(r, { value: 150, snapped: false, edge: null })
  })

  it('snaps to 0 (left edge) when value near 0', () => {
    const r = snapToColumnEdge(3, edges, 4)
    assert.equal(r.snapped, true)
    assert.equal(r.edge, 0)
  })

  it('handles empty edges array (no overlay)', () => {
    const r = snapToColumnEdge(50, [], 4)
    assert.deepEqual(r, { value: 50, snapped: false, edge: null })
  })

  it('exact boundary (≤4px) snaps; >4px does not', () => {
    assert.equal(snapToColumnEdge(104, edges, 4).snapped, true)
    assert.equal(snapToColumnEdge(105, edges, 4).snapped, false)
  })
})

describe('computeColumnSpan', () => {
  // 1440 / 12 col / 16 gutter: colWidth = 105.333…
  // 1 col width  = 105.333
  // 2 col width  = 2 * 105.333 + 1 * 16 = 226.666
  // 6 col width  = 6 * 105.333 + 5 * 16 = 712
  // 12 col width = 12 * 105.333 + 11 * 16 = 1440
  it('matches 1 col span', () => {
    const colWidth = (1440 - 11 * 16) / 12
    assert.equal(computeColumnSpan(colWidth, 1440, 12, 16, 4), 1)
  })

  it('matches 6 col span', () => {
    const target = 6 * ((1440 - 11 * 16) / 12) + 5 * 16
    assert.equal(computeColumnSpan(target, 1440, 12, 16, 4), 6)
  })

  it('matches 12 col span (full width)', () => {
    assert.equal(computeColumnSpan(1440, 1440, 12, 16, 4), 12)
  })

  it('returns null when width does not match any span', () => {
    // 5 col span 은 후보(1/2/3/4/6/12) 에 없음.
    const target = 5 * ((1440 - 11 * 16) / 12) + 4 * 16
    assert.equal(computeColumnSpan(target, 1440, 12, 16, 4), null)
  })

  it('respects tolerance (±4px)', () => {
    const colWidth = (1440 - 11 * 16) / 12
    assert.equal(computeColumnSpan(colWidth + 3, 1440, 12, 16, 4), 1)
    assert.equal(computeColumnSpan(colWidth + 5, 1440, 12, 16, 4), null)
  })

  it('returns null when containerWidth too small', () => {
    assert.equal(computeColumnSpan(50, 100, 12, 16, 4), null)
  })
})
