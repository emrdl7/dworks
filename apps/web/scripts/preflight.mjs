// Next.js dev 시작 전 .next 캐시 stale 감지 + 자동 정리.
//
// HMR이 깨진 채로 dev server를 띄우면 main-app.js / app-pages-internals.js 등이
// 404로 떨어지는 케이스가 있다. .next 디렉터리는 있는데 핵심 manifest가 없는 경우
// stale로 판단하고 정리한다. dev/build 둘 다 안전(build는 어차피 다시 만든다).
//
// false positive는 단지 빌드 캐시를 한 번 더 채우는 비용. false negative는 user에게
// 404 에러로 노출되므로 tilt towards aggressive cleanup.

import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const NEXT_DIR = '.next'
const REQUIRED_MARKERS = [
  // 완전히 비어있는 .next는 첫 실행 — 정리 X
  // 다음 marker들이 _어느 하나라도_ 누락되면 stale로 간주
  'build-manifest.json',
  'app-build-manifest.json',
]

function isStale() {
  if (!existsSync(NEXT_DIR)) return false // 첫 실행

  // .next는 있는데 핵심 manifest가 없으면 stale.
  for (const marker of REQUIRED_MARKERS) {
    if (!existsSync(join(NEXT_DIR, marker))) {
      return true
    }
  }
  return false
}

if (isStale()) {
  console.log('[preflight] stale .next 감지 — 정리 후 빌드')
  rmSync(NEXT_DIR, { recursive: true, force: true })
}
