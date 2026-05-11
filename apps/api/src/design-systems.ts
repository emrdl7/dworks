// GET /design-systems — Open Design 흡수 design system 카탈로그 노출.
// web picker UI 가 한 번 fetch → 클라이언트 메모리 캐시.
// Output: { count, systems: [{ id, title, category, accent, bg, blurb }] }

import { listDesignSystemsExtended } from '@dworks/llm-prompts'

export interface DesignSystemsResponse {
  status: 200 | 500
  body:
    | {
        count: number
        systems: Array<{
          id: string
          title: string
          category: string | null
          accent: string | null
          bg: string | null
          blurb: string | null
        }>
      }
    | { error: string; message: string }
}

let cache: DesignSystemsResponse['body'] | null = null

export function handleListDesignSystems(): DesignSystemsResponse {
  if (cache !== null) {
    return { status: 200, body: cache }
  }
  try {
    const systems = listDesignSystemsExtended()
    const body = { count: systems.length, systems }
    cache = body
    return { status: 200, body }
  } catch (error) {
    return {
      status: 500,
      body: {
        error: 'design-systems-load-failed',
        message:
          error instanceof Error
            ? error.message
            : 'design system 카탈로그 로딩 실패',
      },
    }
  }
}

/** 테스트 hook — fresh load 강제. */
export function _resetDesignSystemsCache(): void {
  cache = null
}
