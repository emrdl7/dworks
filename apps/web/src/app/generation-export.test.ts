// generation-export 빌드/검증 unit.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Tree } from '@dworks/tree'

import {
  EXPORT_BATCH_FORMAT_KEY,
  EXPORT_BATCH_FORMAT_VERSION,
  EXPORT_FORMAT_KEY,
  EXPORT_FORMAT_VERSION,
  buildExportBatchFilename,
  buildExportBatchPayload,
  buildExportFilename,
  buildExportPayload,
  parseImportBatchPayload,
  parseImportPayload,
  type ExportableGeneration,
} from './generation-export.js'

const sampleTree: Tree = {
  version: '1',
  root: {
    id: 'page',
    type: 'section',
    editKind: 'structure',
    children: [
      {
        id: 'title',
        type: 'text',
        editKind: 'text',
        content: 'export sample',
        emphasis: 'heading-1',
      },
    ],
  },
}

const sampleSource: ExportableGeneration = {
  tree: sampleTree,
  label: '생성 1',
  brief: {
    intent: '카페 랜딩',
    notes: '톤 차분',
    imageReference: {
      colors: ['#0b1220', '#22d3ee'],
      aspectRatio: 'wide',
    },
  },
  questions: [
    {
      id: 'tone',
      label: '톤',
      type: 'single',
      options: ['차분', '활기'],
    },
  ],
  clarifyTurns: [],
  model: 'claude',
  latencyMs: 1234,
}

describe('buildExportPayload', () => {
  it('format/version + ISO timestamp + 모든 필드 직렬화', () => {
    const out = buildExportPayload(
      sampleSource,
      new Date('2026-05-09T17:00:00Z'),
    )
    assert.equal(out.format, EXPORT_FORMAT_KEY)
    assert.equal(out.version, EXPORT_FORMAT_VERSION)
    assert.equal(out.exportedAt, '2026-05-09T17:00:00.000Z')
    assert.deepEqual(out.tree, sampleTree)
    assert.equal(out.label, '생성 1')
    assert.equal(out.brief?.intent, '카페 랜딩')
    assert.equal(out.brief?.imageReference?.aspectRatio, 'wide')
    assert.equal(out.model, 'claude')
    assert.equal(out.latencyMs, 1234)
  })
})

describe('buildExportFilename', () => {
  it('한글 label + 콜론 ISO timestamp 모두 안전 문자로', () => {
    const name = buildExportFilename(
      new Date('2026-05-09T17:30:45.000Z'),
      '생성 1 — 카페',
    )
    assert.match(
      name,
      /^dworks-generation-2026-05-09T17-30-45-000Z-생성-1-카페\.json$/,
    )
  })
})

describe('parseImportPayload', () => {
  it('라운드트립 — buildExportPayload 직렬화 그대로 가져온다', () => {
    const payload = buildExportPayload(
      sampleSource,
      new Date('2026-05-09T18:00:00Z'),
    )
    const text = JSON.stringify(payload)
    const result = parseImportPayload(text)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.deepEqual(result.payload, payload)
    }
  })

  it('JSON 파싱 실패 시 ok=false', () => {
    const result = parseImportPayload('{ invalid json')
    assert.equal(result.ok, false)
  })

  it('format 키 mismatch 거부', () => {
    const text = JSON.stringify({
      format: 'other-format',
      version: 1,
      exportedAt: '2026-05-09T00:00:00Z',
      tree: sampleTree,
      label: 'x',
      brief: null,
      questions: [],
      clarifyTurns: [],
      model: null,
      latencyMs: null,
    })
    const result = parseImportPayload(text)
    assert.equal(result.ok, false)
  })

  it('version mismatch 거부', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT_KEY,
      version: 999,
      exportedAt: '2026-05-09T00:00:00Z',
      tree: sampleTree,
      label: 'x',
      brief: null,
      questions: [],
      clarifyTurns: [],
      model: null,
      latencyMs: null,
    })
    const result = parseImportPayload(text)
    assert.equal(result.ok, false)
  })

  it('tree schema 위반 거부', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT_KEY,
      version: 1,
      exportedAt: '2026-05-09T00:00:00Z',
      tree: { version: '1', root: { id: 'x' } },
      label: 'x',
      brief: null,
      questions: [],
      clarifyTurns: [],
      model: null,
      latencyMs: null,
    })
    const result = parseImportPayload(text)
    assert.equal(result.ok, false)
  })

  it('imageReference 잘못된 hex 거부', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT_KEY,
      version: 1,
      exportedAt: '2026-05-09T00:00:00Z',
      tree: sampleTree,
      label: 'x',
      brief: { intent: '카페', imageReference: { colors: ['rgba(0,0,0,0.5)'] } },
      questions: [],
      clarifyTurns: [],
      model: null,
      latencyMs: null,
    })
    const result = parseImportPayload(text)
    assert.equal(result.ok, false)
  })

  it('richness 메타 round-trip — score + 8 신호 boolean', () => {
    const sourceWithRichness = {
      ...sampleSource,
      richness: {
        score: 0.625,
        hasPageLandmarks: true,
        hasMainMultiSection: true,
        hasDisplayHeadingOne: true,
        hasCallToAction: true,
        fontSizeVariety: false,
        colorVariety: true,
        hasImagery: false,
        hasShapeDepth: false,
      },
    }
    const payload = buildExportPayload(sourceWithRichness, new Date())
    assert.equal(payload.richness?.score, 0.625)
    const text = JSON.stringify(payload)
    const result = parseImportPayload(text)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.payload.richness?.score, 0.625)
      assert.equal(result.payload.richness?.fontSizeVariety, false)
    }
  })

  it('richness 미포함도 valid (옵션 필드)', () => {
    const payload = buildExportPayload(sampleSource, new Date())
    assert.equal(payload.richness, undefined)
    const text = JSON.stringify(payload)
    const result = parseImportPayload(text)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.payload.richness, undefined)
    }
  })

  it('richness.score 범위 외 거부', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT_KEY,
      version: 1,
      exportedAt: '2026-05-09T00:00:00Z',
      tree: sampleTree,
      label: 'x',
      brief: null,
      questions: [],
      clarifyTurns: [],
      model: null,
      latencyMs: null,
      richness: {
        score: 1.5,
        hasPageLandmarks: true,
        hasMainMultiSection: true,
        hasDisplayHeadingOne: true,
        hasCallToAction: true,
        fontSizeVariety: true,
        colorVariety: true,
        hasImagery: true,
        hasShapeDepth: true,
      },
    })
    const result = parseImportPayload(text)
    assert.equal(result.ok, false)
  })

  it('richness 신호 boolean 누락 거부', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT_KEY,
      version: 1,
      exportedAt: '2026-05-09T00:00:00Z',
      tree: sampleTree,
      label: 'x',
      brief: null,
      questions: [],
      clarifyTurns: [],
      model: null,
      latencyMs: null,
      richness: {
        score: 0.5,
        hasPageLandmarks: true,
        // hasMainMultiSection 누락
      },
    })
    const result = parseImportPayload(text)
    assert.equal(result.ok, false)
  })
})

describe('generation export batch', () => {
  it('build batch payload — format/version + entries 직렬화', () => {
    const out = buildExportBatchPayload(
      [sampleSource, sampleSource],
      new Date('2026-05-09T17:00:00Z'),
    )
    assert.equal(out.format, EXPORT_BATCH_FORMAT_KEY)
    assert.equal(out.version, EXPORT_BATCH_FORMAT_VERSION)
    assert.equal(out.entries.length, 2)
    assert.equal(out.entries[0]?.format, EXPORT_FORMAT_KEY)
  })

  it('batch filename에 timestamp 포함', () => {
    const name = buildExportBatchFilename(new Date('2026-05-09T17:30:45.000Z'))
    assert.match(name, /^dworks-generations-2026-05-09T17-30-45-000Z\.json$/)
  })

  it('batch parse — round-trip', () => {
    const payload = buildExportBatchPayload([sampleSource], new Date())
    const text = JSON.stringify(payload)
    const result = parseImportBatchPayload(text)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.payload.entries.length, 1)
      assert.equal(result.payload.entries[0]?.label, '생성 1')
    }
  })

  it('batch — 빈 entries 배열도 valid', () => {
    const payload = buildExportBatchPayload([], new Date())
    const text = JSON.stringify(payload)
    const result = parseImportBatchPayload(text)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.payload.entries.length, 0)
    }
  })

  it('batch — 잘못된 format 거부', () => {
    const text = JSON.stringify({
      format: 'wrong',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: [],
    })
    const result = parseImportBatchPayload(text)
    assert.equal(result.ok, false)
  })

  it('batch — entries 항목 한 개라도 invalid면 위치 표시 + 거부', () => {
    const valid = buildExportPayload(sampleSource, new Date())
    const text = JSON.stringify({
      format: EXPORT_BATCH_FORMAT_KEY,
      version: EXPORT_BATCH_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      entries: [valid, { format: 'wrong' }],
    })
    const result = parseImportBatchPayload(text)
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.match(result.reason, /entries\[1\]/)
    }
  })

  it('batch — 단일 export 형식 거부 (format key 다름)', () => {
    const single = buildExportPayload(sampleSource, new Date())
    const text = JSON.stringify(single)
    const result = parseImportBatchPayload(text)
    assert.equal(result.ok, false)
  })
})
