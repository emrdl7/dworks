import type { FontWeight } from '@dworks/tree'

const DATABASE_NAME = 'dworks-font-registry'
const DATABASE_VERSION = 1
const FONT_STORE_NAME = 'fonts'

export const MAX_FONT_FILE_BYTES = 30 * 1024 * 1024

export interface RegisteredFontRecord {
  id: string
  displayName: string
  familyId?: string
  familyName?: string
  weight?: FontWeight
  fileName: string
  mimeType: string
  createdAt: string
  bytes: ArrayBuffer
}

export interface RegisteredFontSummary {
  id: string
  displayName: string
  familyId?: string
  familyName?: string
  weight?: FontWeight
  fileName: string
  mimeType: string
  createdAt: string
  status: 'available' | 'missing'
}

let databasePromise: Promise<IDBDatabase> | undefined
const activeFontFaces = new Map<string, FontFace>()

const fontWeightInferenceRules: Array<{
  pattern: RegExp
  removePattern: RegExp
  weight: FontWeight
}> = [
  {
    pattern: /(?:extra|ultra)[\s_-]*bold|black|heavy|extrabold|ultrabold|헤비|블랙|매우[\s_-]*굵게/i,
    removePattern:
      /(?:extra|ultra)[\s_-]*bold|black|heavy|extrabold|ultrabold|헤비|블랙|매우[\s_-]*굵게/gi,
    weight: '700',
  },
  {
    pattern: /semi[\s_-]*bold|demi[\s_-]*bold|semibold|demibold|세미[\s_-]*볼드|준[\s_-]*굵게/i,
    removePattern:
      /semi[\s_-]*bold|demi[\s_-]*bold|semibold|demibold|세미[\s_-]*볼드|준[\s_-]*굵게/gi,
    weight: '600',
  },
  {
    pattern: /\bbold\b|bold|볼드|굵게/i,
    removePattern: /\bbold\b|bold|볼드|굵게/gi,
    weight: '700',
  },
  {
    pattern: /medium|메디움|중간/i,
    removePattern: /medium|메디움|중간/gi,
    weight: '500',
  },
  {
    pattern: /regular|normal|book|roman|레귤러|보통|본문/i,
    removePattern: /regular|normal|book|roman|레귤러|보통|본문/gi,
    weight: '400',
  },
  {
    pattern: /thin|hairline|light|extralight|ultralight|가는|얇은|라이트/i,
    removePattern: /thin|hairline|light|extralight|ultralight|가는|얇은|라이트/gi,
    weight: '400',
  },
]

export function getDefaultFontDisplayName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim()
}

export function generateFontId(
  displayName: string,
  existingIds: Set<string>,
): string {
  const normalized = normalizeFontId(displayName)
  const baseId = normalized.length > 0 ? normalized : 'user-font'
  let candidate = baseId
  let suffix = 2

  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`
    suffix += 1
  }

  return candidate
}

export function inferFontMetadata(
  displayName: string,
  fileName: string,
): Pick<RegisteredFontRecord, 'familyId' | 'familyName' | 'weight'> {
  const fileDisplayName = getDefaultFontDisplayName(fileName)
  const sourceName =
    displayName.trim() || fileDisplayName || '등록 글꼴'
  const weight = inferFontWeight(`${sourceName} ${fileDisplayName}`)
  const familyName =
    stripFontWeightName(sourceName) ||
    stripFontWeightName(fileDisplayName) ||
    sourceName

  return {
    familyId: getUserFontFamilyId(familyName || sourceName),
    familyName,
    ...(weight ? { weight } : {}),
  }
}

export function getRegisteredFontFamilyId(
  font: Pick<RegisteredFontSummary, 'displayName' | 'familyId' | 'fileName' | 'id'>,
): string {
  return font.familyId ?? font.id
}

export function getRegisteredFontFamilyName(
  font: Pick<RegisteredFontSummary, 'displayName' | 'familyName' | 'fileName'>,
): string {
  return font.familyName ?? font.displayName
}

export function getRegisteredFontWeight(
  font: Pick<RegisteredFontSummary, 'displayName' | 'fileName' | 'weight'>,
): FontWeight | undefined {
  return font.weight ?? inferFontMetadata(font.displayName, font.fileName).weight
}

export async function readSupportedFontFile(file: File): Promise<{
  bytes: ArrayBuffer
  mimeType: string
}> {
  const extension = getFileExtension(file.name)

  if (extension === 'ttc') {
    throw new Error(
      '글꼴 모음(.ttc)은 아직 지원하지 않습니다. .ttf 또는 .otf 단일 파일을 등록해주세요.',
    )
  }

  if (extension !== 'ttf' && extension !== 'otf') {
    throw new Error('TTF 또는 OTF 파일만 등록할 수 있습니다.')
  }

  if (file.size > MAX_FONT_FILE_BYTES) {
    throw new Error('30MB 이하의 글꼴 파일만 등록할 수 있습니다.')
  }

  const bytes = await file.arrayBuffer()
  assertSupportedFontSignature(bytes)

  return {
    bytes,
    mimeType: file.type || (extension === 'otf' ? 'font/otf' : 'font/ttf'),
  }
}

export async function listRegisteredFonts(): Promise<RegisteredFontRecord[]> {
  const database = await openFontDatabase()
  const transaction = database.transaction(FONT_STORE_NAME, 'readonly')
  const request = transaction
    .objectStore(FONT_STORE_NAME)
    .getAll() as IDBRequest<RegisteredFontRecord[]>
  const fonts = await requestToPromise(request)
  await waitForTransaction(transaction)

  return fonts.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function saveRegisteredFont(
  font: RegisteredFontRecord,
): Promise<void> {
  const database = await openFontDatabase()
  const transaction = database.transaction(FONT_STORE_NAME, 'readwrite')
  transaction.objectStore(FONT_STORE_NAME).put(font)
  await waitForTransaction(transaction)
}

export async function deleteRegisteredFont(fontId: string): Promise<void> {
  const database = await openFontDatabase()
  const transaction = database.transaction(FONT_STORE_NAME, 'readwrite')
  transaction.objectStore(FONT_STORE_NAME).delete(fontId)
  await waitForTransaction(transaction)
  unregisterFontFace(fontId)
}

export async function registerFontFace(
  font: RegisteredFontRecord,
): Promise<void> {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    throw new Error('이 브라우저는 동적 글꼴 등록을 지원하지 않습니다.')
  }

  unregisterFontFace(font.id)

  const familyId = getRegisteredFontFamilyId(font)
  const weight = getRegisteredFontWeight(font)
  const fontFace = new FontFace(
    familyId,
    font.bytes.slice(0),
    weight ? { weight } : undefined,
  )
  const loadedFontFace = await fontFace.load()
  document.fonts.add(loadedFontFace)
  activeFontFaces.set(font.id, loadedFontFace)
}

export function unregisterFontFace(fontId: string) {
  const fontFace = activeFontFaces.get(fontId)

  if (!fontFace || typeof document === 'undefined') {
    return
  }

  document.fonts.delete(fontFace)
  activeFontFaces.delete(fontId)
}

export function toRegisteredFontSummary(
  font: RegisteredFontRecord,
  status: RegisteredFontSummary['status'],
): RegisteredFontSummary {
  const metadata = inferFontMetadata(font.displayName, font.fileName)

  return {
    id: font.id,
    displayName: font.displayName,
    familyId: font.familyId,
    familyName: font.familyName ?? (font.familyId ? metadata.familyName : undefined),
    weight: font.weight ?? metadata.weight,
    fileName: font.fileName,
    mimeType: font.mimeType,
    createdAt: font.createdAt,
    status,
  }
}

function normalizeFontId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function getUserFontFamilyId(value: string): string {
  const normalized = normalizeFontId(value)
  return normalized ? `user-font-${normalized}` : 'user-font'
}

function inferFontWeight(value: string): FontWeight | undefined {
  return fontWeightInferenceRules.find((rule) => rule.pattern.test(value))?.weight
}

function stripFontWeightName(value: string): string {
  let nextValue = value
    .replace(/\.[a-z0-9]+$/i, '')
    .replaceAll(/[_-]+/g, ' ')
    .replace(/\b(?:italic|oblique)\b/gi, '')

  for (const rule of fontWeightInferenceRules) {
    nextValue = nextValue.replace(rule.removePattern, ' ')
  }

  return nextValue.replace(/\s+/g, ' ').trim()
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function assertSupportedFontSignature(bytes: ArrayBuffer) {
  if (bytes.byteLength < 4) {
    throw new Error('글꼴 파일을 읽을 수 없습니다.')
  }

  const signatureBytes = new Uint8Array(bytes.slice(0, 4))
  const signature = String.fromCharCode(...signatureBytes)
  const scalarType = new DataView(bytes).getUint32(0, false)

  if (signature === 'ttcf') {
    throw new Error(
      '글꼴 모음(.ttc)은 아직 지원하지 않습니다. .ttf 또는 .otf 단일 파일을 등록해주세요.',
    )
  }

  if (signature === 'OTTO' || signature === 'true' || scalarType === 0x00010000) {
    return
  }

  throw new Error('지원하는 TTF/OTF 글꼴 파일 형식이 아닙니다.')
}

function openFontDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise
  }

  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(
      new Error('이 브라우저는 글꼴 저장소를 지원하지 않습니다.'),
    )
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(FONT_STORE_NAME)) {
        database.createObjectStore(FONT_STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('글꼴 저장소를 열 수 없습니다.'))
    request.onblocked = () =>
      reject(new Error('다른 탭에서 글꼴 저장소를 사용 중입니다.'))
  })

  return databasePromise
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('글꼴 저장소 요청이 실패했습니다.'))
  })
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('글꼴 저장소 작업이 실패했습니다.'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('글꼴 저장소 작업이 중단되었습니다.'))
  })
}
