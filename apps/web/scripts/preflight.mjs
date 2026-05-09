// Next.js dev 시작 전 .next 캐시 stale 감지 + 자동 정리.
//
// HMR이 깨진 채로 dev server를 띄우면 main-app.js / app-pages-internals.js 등이
// 404로 떨어지는 케이스가 있다. .next 디렉터리는 있는데 핵심 manifest가 없거나,
// BUILD_ID와 static/<id>가 mismatch이거나, server chunk가 다른 chunk를 require하는데
// 실제 파일이 없으면 stale로 판단하고 정리한다. dev/build 둘 다 안전(build는 어차피
// 다시 만든다).
//
// false positive는 단지 빌드 캐시를 한 번 더 채우는 비용. false negative는 user에게
// 404 에러 / "Cannot find module './211.js'" 같은 webpack runtime 에러로 노출되므로
// tilt towards aggressive cleanup.

import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const NEXT_DIR = '.next'

const REQUIRED_MARKERS = [
  // 다음 marker들이 _어느 하나라도_ 누락되면 stale로 간주
  'build-manifest.json',
  'app-build-manifest.json',
]

function logStale(reason) {
  console.log(`[preflight] stale .next 감지 — ${reason}`)
}

function readSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

function collectJsFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...collectJsFiles(p))
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(p)
    }
  }
  return out
}

// require("./XXX.js") / require("./chunks/XXX.js") 같은 상대경로 .js 참조가
// 실제로 존재하는지 검사. webpack runtime이 chunk를 못 찾으면 dev 첫 요청에서 500.
function findFirstMissingChunkReference(filePath) {
  const content = readSafe(filePath)
  if (content === null) return null
  const pattern = /require\(["'](\.\.?\/[^"'`)\s]+?\.js)["']\)/g
  const fileDir = dirname(filePath)
  let match
  while ((match = pattern.exec(content)) !== null) {
    const refRaw = match[1]
    const refResolved = resolve(fileDir, refRaw)
    if (!existsSync(refResolved)) {
      return { source: filePath, ref: refRaw }
    }
  }
  return null
}

function isStale() {
  if (!existsSync(NEXT_DIR)) return false // 첫 실행

  // 1. 핵심 manifest 누락
  for (const marker of REQUIRED_MARKERS) {
    if (!existsSync(join(NEXT_DIR, marker))) {
      logStale(`${marker} 누락`)
      return true
    }
  }

  // 2. BUILD_ID ↔ static/<id> 매칭 (production build artifact가 있을 때만 의미)
  const buildIdPath = join(NEXT_DIR, 'BUILD_ID')
  if (existsSync(buildIdPath)) {
    const buildId = (readSafe(buildIdPath) ?? '').trim()
    if (buildId) {
      const staticDir = join(NEXT_DIR, 'static', buildId)
      if (!existsSync(staticDir)) {
        logStale(`static/${buildId} 누락 — BUILD_ID와 mismatch`)
        return true
      }
    }
  }

  // 3. server/webpack-runtime.js + server/app/**/*.js 의 chunk reference 무결성
  const runtimePath = join(NEXT_DIR, 'server', 'webpack-runtime.js')
  if (existsSync(runtimePath)) {
    const missing = findFirstMissingChunkReference(runtimePath)
    if (missing) {
      logStale(
        `${relative(NEXT_DIR, missing.source)} → ${missing.ref} chunk 누락`,
      )
      return true
    }
  }
  const serverAppDir = join(NEXT_DIR, 'server', 'app')
  if (existsSync(serverAppDir)) {
    for (const file of collectJsFiles(serverAppDir)) {
      const missing = findFirstMissingChunkReference(file)
      if (missing) {
        logStale(
          `${relative(NEXT_DIR, missing.source)} → ${missing.ref} chunk 누락`,
        )
        return true
      }
    }
  }

  return false
}

if (isStale()) {
  rmSync(NEXT_DIR, { recursive: true, force: true })
}
