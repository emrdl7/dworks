// generation-export 빌드/검증 unit.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { treeSchema, type Tree } from '@dworks/tree'

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

  it('imageReferences (배열) round-trip — 1~3장', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT_KEY,
      version: 1,
      exportedAt: '2026-05-09T00:00:00Z',
      tree: sampleTree,
      label: 'x',
      brief: {
        intent: '카페',
        imageReferences: [
          { colors: ['#0b1220', '#22d3ee'], aspectRatio: 'wide' },
          { colors: ['#f8fafc'] },
        ],
      },
      questions: [],
      clarifyTurns: [],
      model: null,
      latencyMs: null,
    })
    const result = parseImportPayload(text)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.payload.brief?.imageReferences?.length, 2)
      assert.equal(result.payload.brief?.imageReferences?.[0]?.aspectRatio, 'wide')
    }
  })

  it('imageReferences max 3 초과 거부', () => {
    const text = JSON.stringify({
      format: EXPORT_FORMAT_KEY,
      version: 1,
      exportedAt: '2026-05-09T00:00:00Z',
      tree: sampleTree,
      label: 'x',
      brief: {
        intent: '카페',
        imageReferences: [
          { colors: ['#000000'] },
          { colors: ['#111111'] },
          { colors: ['#222222'] },
          { colors: ['#333333'] },
        ],
      },
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

  it('batch — summary count + 풍부도 통계 자동 계산', () => {
    const sourceWithRichness = {
      ...sampleSource,
      richness: {
        score: 0.75,
        hasPageLandmarks: true,
        hasMainMultiSection: true,
        hasDisplayHeadingOne: true,
        hasCallToAction: true,
        fontSizeVariety: true,
        colorVariety: true,
        hasImagery: false,
        hasShapeDepth: false,
      },
    }
    const sourceLow = {
      ...sampleSource,
      richness: {
        score: 0.25,
        hasPageLandmarks: true,
        hasMainMultiSection: true,
        hasDisplayHeadingOne: false,
        hasCallToAction: false,
        fontSizeVariety: false,
        colorVariety: false,
        hasImagery: false,
        hasShapeDepth: false,
      },
    }
    const out = buildExportBatchPayload(
      [sourceWithRichness, sourceLow],
      new Date(),
    )
    assert.equal(out.summary?.count, 2)
    assert.equal(out.summary?.maxRichness, 0.75)
    assert.equal(out.summary?.minRichness, 0.25)
    assert.equal(out.summary?.avgRichness, 0.5)
  })

  it('batch — richness 없는 entries는 summary stats null', () => {
    const out = buildExportBatchPayload([sampleSource], new Date())
    assert.equal(out.summary?.count, 1)
    assert.equal(out.summary?.avgRichness, null)
    assert.equal(out.summary?.maxRichness, null)
    assert.equal(out.summary?.minRichness, null)
  })

  it('batch — summary 잘못된 score 거부', () => {
    const valid = buildExportPayload(sampleSource, new Date())
    const text = JSON.stringify({
      format: EXPORT_BATCH_FORMAT_KEY,
      version: EXPORT_BATCH_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      entries: [valid],
      summary: {
        count: 1,
        avgRichness: 1.5,
        maxRichness: 1,
        minRichness: 0,
      },
    })
    const result = parseImportBatchPayload(text)
    assert.equal(result.ok, false)
  })
})

// 핸드오버 미검증 #5 — 풍부한 design override (gradient/state colors/responsive
// /transform/customShadows/typography textShadow/opacity)에 대해 export ↔ parse
// round-trip이 idempotent인지 회귀 방어. AI 응답이 모든 슬롯을 박을 가능성에 대비.
const richTree: Tree = {
  version: '1',
  styleTokens: { colorPreset: 'navy' },
  root: {
    id: 'page',
    type: 'section',
    editKind: 'structure',
    role: 'main',
    layoutIntent: 'stack',
    opacity: 0.95,
    responsive: {
      mobile: '단일 컬럼, hero 축소',
      tablet: '2열 그리드',
      desktop: '3열 그리드',
    },
    spacing: {
      paddingTop: 80,
      paddingRight: 24,
      paddingBottom: 80,
      paddingLeft: 24,
      gap: 32,
    },
    layout: {
      direction: 'column',
      align: 'center',
      justify: 'start',
    },
    color: {
      backgroundGradient: {
        type: 'linear',
        from: '#0e1a2e',
        to: '#1e3a5f',
        direction: 'to-bottom-right',
        fromOpacity: 0.95,
        toOpacity: 0.85,
      },
    },
    shape: {
      radius: 12,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#2a5fa0',
      borderOpacity: 0.5,
      shadow: 'lg',
      customShadows: [
        {
          offsetX: 0,
          offsetY: 4,
          blur: 12,
          spread: 0,
          color: '#000000',
          opacity: 0.2,
        },
        {
          offsetX: 0,
          offsetY: 1,
          blur: 2,
          color: '#000000',
          opacity: 0.1,
          inset: true,
        },
      ],
    },
    transform: {
      translateX: 0,
      translateY: -10,
      rotate: 0,
      scale: 1,
      perspective: 800,
      originX: 50,
      originY: 50,
    },
    transition: {
      duration: 200,
      timing: 'custom',
      cubicBezier: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
    },
    children: [
      {
        id: 'heading',
        type: 'text',
        editKind: 'text',
        content: '풍부한 fixture 검증',
        emphasis: 'heading-1',
        contentRole: 'heading',
        opacity: 1,
        typography: {
          fontSize: 56,
          fontWeight: '700',
          lineHeight: 1.1,
          letterSpacing: -0.02,
          textAlign: 'center',
          fontFamily: 'sans',
          textShadow: {
            offsetX: 0,
            offsetY: 2,
            blur: 8,
            color: '#000000',
            opacity: 0.3,
          },
        },
        color: {
          textColor: '#ffffff',
          textOpacity: 0.95,
        },
      },
      {
        id: 'cta',
        type: 'button',
        editKind: 'text',
        label: '시작하기',
        variant: 'primary',
        contentRole: 'cta',
        cursor: 'pointer',
        color: {
          backgroundColor: '#2a5fa0',
          textColor: '#ffffff',
          hoverBackgroundColor: '#1e4a82',
          hoverTextColor: '#ffffff',
          activeBackgroundColor: '#163966',
          focusBackgroundColor: '#2a5fa0',
          focusTextColor: '#ffffff',
          disabledBackgroundColor: '#8aa8c8',
          disabledTextColor: '#dbe5f2',
        },
        shape: {
          radius: 8,
          shadow: 'sm',
        },
        spacing: {
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
        },
        transition: {
          duration: 140,
          timing: 'ease-out',
        },
      },
      {
        id: 'hero-image',
        type: 'image',
        editKind: 'media',
        src: 'https://example.com/hero.png',
        alt: '풍부한 fixture 이미지',
        aspectRatio: 'wide',
        focalPoint: { x: 0.5, y: 0.4 },
        presentation: {
          fit: 'cover',
          overlayGradient: {
            type: 'linear',
            from: '#000000',
            to: '#000000',
            direction: 'to-top',
            fromOpacity: 0.6,
            toOpacity: 0,
          },
          filter: {
            brightness: 95,
            contrast: 110,
            saturate: 105,
            dropShadows: [
              { offsetX: 0, offsetY: 8, blur: 24, color: '#000000' },
            ],
          },
        },
      },
    ],
  },
}

const richSource: ExportableGeneration = {
  tree: richTree,
  label: '풍부한 fixture',
  brief: {
    intent: '복잡한 design override 검증',
    notes: '모든 슬롯 박음',
    imageReferences: [
      {
        colors: ['#0e1a2e', '#2a5fa0', '#dbe5f2'],
        aspectRatio: 'wide',
      },
    ],
  },
  questions: [],
  clarifyTurns: [],
  model: 'claude',
  latencyMs: 5678,
  richness: {
    score: 0.92,
    hasPageLandmarks: true,
    hasMainMultiSection: true,
    hasDisplayHeadingOne: true,
    hasCallToAction: true,
    fontSizeVariety: true,
    colorVariety: true,
    hasImagery: true,
    hasShapeDepth: true,
  },
}

describe('idempotent — 풍부한 design override round-trip', () => {
  it('richTree가 treeSchema 통과 (sanity)', () => {
    const result = treeSchema.safeParse(richTree)
    if (!result.success) {
      throw new Error(
        `richTree schema 위반 — fixture 자체가 invalid: ${JSON.stringify(result.error.issues)}`,
      )
    }
    assert.equal(result.success, true)
  })

  it('export → JSON → parse 1회 round-trip — payload deepEqual', () => {
    const exportedAt = new Date('2026-05-10T10:00:00Z')
    const payload = buildExportPayload(richSource, exportedAt)
    const text = JSON.stringify(payload)
    const result = parseImportPayload(text)
    if (!result.ok) {
      throw new Error(`parse 거부 — ${result.reason}`)
    }
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.deepEqual(result.payload, payload)
      assert.deepEqual(result.payload.tree, richTree)
    }
  })

  it('export → parse → export → parse 2회 round-trip — drift 없음', () => {
    const exportedAt = new Date('2026-05-10T10:00:00Z')
    const first = buildExportPayload(richSource, exportedAt)
    const firstParsed = parseImportPayload(JSON.stringify(first))
    assert.equal(firstParsed.ok, true)
    if (!firstParsed.ok) return

    // 두 번째 export — parsed payload를 source 형태로 재구성해서 export.
    // ExportedGeneration과 ExportableGeneration이 brief/model/latencyMs 모두 |null.
    const secondSource: ExportableGeneration = {
      tree: firstParsed.payload.tree,
      label: firstParsed.payload.label,
      brief: firstParsed.payload.brief,
      questions: firstParsed.payload.questions,
      clarifyTurns: firstParsed.payload.clarifyTurns,
      model: firstParsed.payload.model,
      latencyMs: firstParsed.payload.latencyMs,
      richness: firstParsed.payload.richness,
    }
    const second = buildExportPayload(secondSource, exportedAt)
    const secondParsed = parseImportPayload(JSON.stringify(second))
    assert.equal(secondParsed.ok, true)
    if (!secondParsed.ok) return

    // drift 0건 — 두 번 round-trip해도 첫 번째와 동일.
    assert.deepEqual(secondParsed.payload, firstParsed.payload)
  })

  it('gradient + state colors + customShadows 보존 (P1 회귀 방어)', () => {
    const payload = buildExportPayload(richSource, new Date())
    const result = parseImportPayload(JSON.stringify(payload))
    assert.equal(result.ok, true)
    if (!result.ok) return

    const root = result.payload.tree.root
    assert.equal(root.type, 'section')
    if (root.type !== 'section') return

    // gradient 보존 확인 — section root.
    assert.deepEqual(root.color?.backgroundGradient, {
      type: 'linear',
      from: '#0e1a2e',
      to: '#1e3a5f',
      direction: 'to-bottom-right',
      fromOpacity: 0.95,
      toOpacity: 0.85,
    })

    // customShadows 2건 보존.
    assert.equal(root.shape?.customShadows?.length, 2)
    assert.equal(root.shape?.customShadows?.[1]?.inset, true)

    // state colors 보존 — button.
    const button = root.children[1]
    assert.equal(button?.type, 'button')
    if (button?.type !== 'button') return
    assert.equal(button.color?.hoverBackgroundColor, '#1e4a82')
    assert.equal(button.color?.activeBackgroundColor, '#163966')
    assert.equal(button.color?.focusBackgroundColor, '#2a5fa0')
    assert.equal(button.color?.disabledBackgroundColor, '#8aa8c8')

    // transform / responsive 보존.
    assert.equal(root.transform?.perspective, 800)
    assert.equal(root.responsive?.mobile, '단일 컬럼, hero 축소')

    // image presentation overlayGradient 보존.
    const image = root.children[2]
    assert.equal(image?.type, 'image')
    if (image?.type !== 'image') return
    assert.equal(image.presentation?.overlayGradient?.fromOpacity, 0.6)
    assert.equal(image.presentation?.filter?.dropShadows?.length, 1)
  })
})
