// 사용자 정의 fixture — 좋은 generation 결과를 catalog처럼 보관해 다음 세션에서 즉시 선택.
//
// localStorage 'dworks:user-fixtures:v1'에 array로 저장. 기본 fixture와는 다른 키라 generations
// persist(휘발 방지)와 독립적이다. 사용자가 명시 "fixture로 등록"을 클릭한 generation만 보관.

import { treeSchema, type Tree } from '@dworks/tree'

const STORAGE_KEY = 'dworks:user-fixtures:v1'
const STORAGE_VERSION = 1
const MAX_NAME_LENGTH = 40

export interface UserFixture {
  id: string
  name: string
  tree: Tree
  createdAt: number
}

interface PersistedShape {
  version: typeof STORAGE_VERSION
  fixtures: UserFixture[]
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readUserFixtures(): UserFixture[] {
  if (!isBrowser()) return []
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return []
  }
  if (raw === null || raw.length === 0) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    clearUserFixtures()
    return []
  }
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    return []
  }
  const obj = parsed as Record<string, unknown>
  if (obj.version !== STORAGE_VERSION) return []
  if (!Array.isArray(obj.fixtures)) return []
  const out: UserFixture[] = []
  for (const item of obj.fixtures) {
    const validated = validateFixture(item)
    if (validated === null) return []
    out.push(validated)
  }
  return out
}

export function writeUserFixtures(fixtures: UserFixture[]): void {
  if (!isBrowser()) return
  const payload: PersistedShape = {
    version: STORAGE_VERSION,
    fixtures,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 조용히 포기 — 다음 변경에 다시 시도된다.
  }
}

export function clearUserFixtures(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

let userFixtureCounter = 0
export function createUserFixtureId(): string {
  userFixtureCounter += 1
  return `user-${Date.now().toString(36)}-${userFixtureCounter}`
}

export function sanitizeUserFixtureName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH)
}

// 단일 fixture의 name만 교체한 새 배열 반환. 일치 id 없으면 원본 그대로.
// sanitize는 caller 책임 — 빈 문자열 들어오면 변경 없이 원본 유지.
export function renameUserFixture(
  fixtures: UserFixture[],
  fixtureId: string,
  nextName: string,
): UserFixture[] {
  if (nextName.length === 0) return fixtures
  let changed = false
  const next = fixtures.map((fixture) => {
    if (fixture.id !== fixtureId) return fixture
    if (fixture.name === nextName) return fixture
    changed = true
    return { ...fixture, name: nextName }
  })
  return changed ? next : fixtures
}

function validateFixture(raw: unknown): UserFixture | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.id !== 'string' || obj.id.length === 0) return null
  if (typeof obj.name !== 'string' || obj.name.length === 0) return null
  if (typeof obj.createdAt !== 'number' || !Number.isFinite(obj.createdAt)) {
    return null
  }
  const treeParse = treeSchema.safeParse(obj.tree)
  if (!treeParse.success) return null
  return {
    id: obj.id,
    name: obj.name,
    tree: treeParse.data,
    createdAt: obj.createdAt,
  }
}
