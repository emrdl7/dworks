import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  getRegisteredFontFamilyId,
  getRegisteredFontFamilyName,
  getRegisteredFontWeight,
  inferFontMetadata,
  toRegisteredFontSummary,
  type RegisteredFontRecord,
} from './font-registry.js'

describe('font registry metadata', () => {
  it('infers a shared family and bold weight from a font variant name', () => {
    const metadata = inferFontMetadata('Pretendard Bold', 'Pretendard-Bold.otf')

    assert.equal(metadata.familyId, 'user-font-pretendard')
    assert.equal(metadata.familyName, 'Pretendard')
    assert.equal(metadata.weight, '700')
  })

  it('uses the file name for weight when the display name is only a family', () => {
    const metadata = inferFontMetadata('Pretendard', 'Pretendard-SemiBold.otf')

    assert.equal(metadata.familyId, 'user-font-pretendard')
    assert.equal(metadata.familyName, 'Pretendard')
    assert.equal(metadata.weight, '600')
  })

  it('keeps uploaded family metadata in registered font summaries', () => {
    const font: RegisteredFontRecord = {
      id: 'pretendard-bold',
      displayName: 'Pretendard Bold',
      familyId: 'user-font-pretendard',
      familyName: 'Pretendard',
      weight: '700',
      fileName: 'Pretendard-Bold.otf',
      mimeType: 'font/otf',
      createdAt: '2026-05-08T00:00:00.000Z',
      bytes: new ArrayBuffer(8),
    }
    const summary = toRegisteredFontSummary(font, 'available')

    assert.equal(getRegisteredFontFamilyId(summary), 'user-font-pretendard')
    assert.equal(getRegisteredFontFamilyName(summary), 'Pretendard')
    assert.equal(getRegisteredFontWeight(summary), '700')
  })

  it('leaves existing records addressable by their original id', () => {
    const legacyFont: RegisteredFontRecord = {
      id: 'pretendard-bold',
      displayName: 'Pretendard Bold',
      fileName: 'Pretendard-Bold.otf',
      mimeType: 'font/otf',
      createdAt: '2026-05-08T00:00:00.000Z',
      bytes: new ArrayBuffer(8),
    }
    const summary = toRegisteredFontSummary(legacyFont, 'available')

    assert.equal(getRegisteredFontFamilyId(summary), 'pretendard-bold')
    assert.equal(getRegisteredFontFamilyName(summary), 'Pretendard Bold')
    assert.equal(getRegisteredFontWeight(summary), '700')
  })
})
