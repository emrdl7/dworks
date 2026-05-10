// @dworks/llm-prompts — LLM 시스템 프롬프트와 호출 헬퍼.
// LLM 정책 (D12): 1순위 Claude → 2순위 Codex → 3순위 Gemini fallback.

import { type Tree } from '@dworks/tree'

export const PACKAGE_NAME = '@dworks/llm-prompts'

/**
 * m3-generate-clarify 디자인 브리프 (web → API → LLM).
 */
export interface BriefAnswer {
  questionId: string
  questionLabel: string
  answer: string | string[]
}

/**
 * 사용자 참고 이미지에서 추출한 색감/비율 시드.
 * vision-LLM 미사용 PoC에서도 텍스트 시그널로 LLM에 전달된다.
 */
export interface ImageReference {
  /** 빈도 상위 hex 색 3~5개 (소문자 #rrggbb). */
  colors: string[]
  /** 'square' | 'landscape' | 'portrait' | 'wide' 중 가장 가까운 비율. */
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
}

export interface DesignBrief {
  intent: string
  answers?: BriefAnswer[]
  notes?: string
  /** @deprecated imageReferences[0]을 우선 사용. legacy v1 단일 호환. */
  imageReference?: ImageReference
  /** 다중 참고 이미지 (max 3). 단일이어도 imageReferences[0]에 두는 것을 권장. */
  imageReferences?: ImageReference[]
  /**
   * 다양성 시드 — 이전 변형 수와 무엇과 다르게 갈지 hint. 같은 brief 반복
   * 호출 시 LLM에 _다른 톤/팔레트/구성_을 명시적으로 요청한다.
   * undefined면 기본 톤 매핑 사용.
   */
  variantSeed?: {
    /** 이미 만든 변형의 1-based index. 첫 호출은 1, 두 번째는 2. */
    index: number
    /** 시도할 톤 (앞 5개는 system prompt 매핑 톤 — 다크/미니멀/빈티지/퓨처/에디토리얼/GenZ 등). */
    targetTone?: string
  }
}

/** brief에서 사용할 imageReferences 배열을 결정한다 — 신규(imageReferences) 우선, 없으면 legacy 단일을 array[0]로. */
export function resolveImageReferences(brief: DesignBrief): ImageReference[] {
  if (brief.imageReferences !== undefined && brief.imageReferences.length > 0) {
    return brief.imageReferences
  }
  if (brief.imageReference !== undefined) {
    return [brief.imageReference]
  }
  return []
}

/**
 * 다중 참고 이미지의 색을 빈도 가중으로 통합 — 앞쪽 색일수록 높은 가중치, 동일 색 합산.
 * apps/web/image-color.ts의 mergeImageReferenceColors와 동일 알고리즘 (LLM prompt-side reference).
 */
export function mergeReferenceColors(
  refs: ReadonlyArray<{ colors: ReadonlyArray<string> }>,
  maxColors = 5,
): string[] {
  if (maxColors <= 0) return []
  const weights = new Map<string, number>()
  for (const ref of refs) {
    const N = ref.colors.length
    for (let i = 0; i < N; i += 1) {
      const hex = ref.colors[i]
      if (typeof hex !== 'string') continue
      const lower = hex.toLowerCase()
      const weight = N - i
      weights.set(lower, (weights.get(lower) ?? 0) + weight)
    }
  }
  return Array.from(weights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([hex]) => hex)
}

const ASPECT_PRIORITY: ImageReference['aspectRatio'][] = [
  'wide',
  'landscape',
  'portrait',
  'square',
]

/**
 * 다중 참고 이미지의 aspectRatio를 통합 추론 — 가장 흔한 것, 동수면 wide > landscape > portrait > square.
 * apps/web/image-color.ts의 mergeImageReferenceAspect와 동일 알고리즘.
 */
export function mergeReferenceAspect(
  refs: ReadonlyArray<{ aspectRatio?: ImageReference['aspectRatio'] }>,
): ImageReference['aspectRatio'] {
  const counts = new Map<NonNullable<ImageReference['aspectRatio']>, number>()
  for (const ref of refs) {
    if (ref.aspectRatio === undefined) continue
    counts.set(ref.aspectRatio, (counts.get(ref.aspectRatio) ?? 0) + 1)
  }
  if (counts.size === 0) return undefined
  let best: ImageReference['aspectRatio']
  let bestCount = 0
  for (const kind of ASPECT_PRIORITY) {
    if (kind === undefined) continue
    const c = counts.get(kind) ?? 0
    if (c > bestCount) {
      best = kind
      bestCount = c
    }
  }
  return best
}

/**
 * Brief 객체를 LLM user prompt 문자열로 직렬화.
 */
export function formatBriefAsUserPrompt(brief: DesignBrief): string {
  const lines: string[] = ['## 디자인 브리프', '']
  lines.push(`### 의도`, brief.intent.trim())
  if (brief.answers !== undefined && brief.answers.length > 0) {
    lines.push('', `### 추가 질문 답변`)
    for (const entry of brief.answers) {
      const answerText = Array.isArray(entry.answer)
        ? entry.answer.join(', ')
        : entry.answer
      const trimmed = answerText.trim()
      if (trimmed.length === 0) continue
      lines.push(`- ${entry.questionLabel}: ${trimmed}`)
    }
  }
  if (brief.notes !== undefined && brief.notes.trim().length > 0) {
    lines.push('', `### 브랜드 / 참조 메모`, brief.notes.trim())
  }
  const refs = resolveImageReferences(brief).filter(
    (ref) => ref.colors.length > 0,
  )
  if (refs.length === 1) {
    const ref = refs[0]
    if (ref !== undefined) {
      lines.push('', `### 참고 이미지 시드`)
      lines.push(`- 주요 색: ${ref.colors.join(', ')}`)
      if (ref.aspectRatio !== undefined) {
        lines.push(`- 화면 비율: ${ref.aspectRatio}`)
      }
      lines.push(
        '  (참고 이미지에서 추출. 그대로 베끼지 말고 디자인 팔레트의 시드로 활용. raw hex 강제 X)',
      )
    }
  } else if (refs.length > 1) {
    lines.push('', `### 참고 이미지 시드 (${refs.length}장)`)
    for (let i = 0; i < refs.length; i += 1) {
      const ref = refs[i]
      if (ref === undefined) continue
      lines.push(`- 이미지 ${i + 1}: 색 ${ref.colors.join(', ')}${
        ref.aspectRatio !== undefined ? ` · 비율 ${ref.aspectRatio}` : ''
      }`)
    }
    const merged = mergeReferenceColors(refs, 5)
    if (merged.length > 0) {
      lines.push(`- 통합 팔레트(빈도 가중): ${merged.join(', ')}`)
    }
    const mergedAspect = mergeReferenceAspect(refs)
    if (mergedAspect !== undefined) {
      lines.push(`- 통합 비율(빈도 가중): ${mergedAspect}`)
    }
    lines.push(
      '  (여러 참고 이미지의 색감/비율을 종합한 시드. 그대로 베끼지 말고 디자인 팔레트의 영감 자료로 활용. raw hex 강제 X)',
    )
  }
  if (brief.variantSeed !== undefined && brief.variantSeed.index >= 2) {
    lines.push('', `### 변형 시드 — ${brief.variantSeed.index}번째 시도`)
    lines.push(
      `- 같은 brief에 대한 ${brief.variantSeed.index - 1}번 변형이 이미 있음. 이번 변형은 _기존과 다른_ 톤/팔레트/구성으로 시도해라.`,
    )
    if (brief.variantSeed.targetTone !== undefined) {
      lines.push(`- 추천 톤: ${brief.variantSeed.targetTone}`)
    } else {
      lines.push(
        '- 톤 다양화: 이전이 차분/절제였다면 활기/임팩트, 이전이 라이트였다면 다크/럭셔리, 이전이 미니멀이었다면 GenZ/vibrant 같이 _대조적 톤_ 시도.',
      )
    }
    lines.push(
      '- hero pattern, layout direction, color family를 의도적으로 다르게. 같은 패턴 반복 금지.',
    )
  }
  lines.push('', '위 브리프에 맞춰 dworks Tree JSON 하나를 반환한다.')
  return lines.join('\n')
}

// ---- m3-generate-prompt-uplift: schema-valid TS 객체로 examples 관리 ----

export const GENERATE_TREE_EXAMPLES: ReadonlyArray<{
  intent: string
  tree: Tree
}> = [
  {
    intent: '히어로 섹션이 있는 카페 랜딩 페이지, 메뉴 보기 버튼 포함',
    tree: {
      version: '1',
      root: {
        id: 'cafe.page',
        editKind: 'structure',
        type: 'section',
        layout: { direction: 'column' },
        children: [
          {
            id: 'cafe.header',
            editKind: 'structure',
            type: 'section',
            role: 'banner',
            layout: { direction: 'row', align: 'center', justify: 'between' },
            spacing: {
              paddingTop: 16,
              paddingRight: 32,
              paddingBottom: 16,
              paddingLeft: 32,
              gap: 24,
            },
            responsive: { mobile: '햄버거 메뉴로 nav 접고 로고만 노출' },
            children: [
              {
                id: 'cafe.header.logo',
                editKind: 'text',
                type: 'text',
                content: '도시카페',
                emphasis: 'heading-3',
                contentRole: 'heading',
              },
              {
                id: 'cafe.header.nav',
                editKind: 'structure',
                type: 'section',
                layout: { direction: 'row', align: 'center' },
                spacing: { gap: 24 },
                children: [
                  {
                    id: 'cafe.header.nav.menu',
                    editKind: 'text',
                    type: 'text',
                    content: '메뉴',
                    contentRole: 'label',
                  },
                  {
                    id: 'cafe.header.nav.brand',
                    editKind: 'text',
                    type: 'text',
                    content: '브랜드',
                    contentRole: 'label',
                  },
                  {
                    id: 'cafe.header.nav.location',
                    editKind: 'text',
                    type: 'text',
                    content: '매장',
                    contentRole: 'label',
                  },
                ],
              },
            ],
          },
          {
            id: 'cafe.main',
            editKind: 'structure',
            type: 'section',
            role: 'main',
            layout: { direction: 'column' },
            spacing: { gap: 64 },
            children: [
              {
                id: 'cafe.hero',
                editKind: 'structure',
                type: 'hero',
                color: {
                  backgroundGradient: {
                    from: '#fff1dc',
                    to: '#e89b50',
                    direction: 'to-bottom-right',
                  },
                  textColor: '#3a2718',
                },
                spacing: {
                  paddingTop: 120,
                  paddingBottom: 120,
                  paddingLeft: 48,
                  paddingRight: 48,
                  gap: 32,
                },
                layout: { align: 'center' },
                responsive: { mobile: 'image 아래로 stack, padding 축소' },
                children: [
                  {
                    id: 'cafe.hero.title',
                    editKind: 'text',
                    type: 'text',
                    content: '도시의 숨결,\n한 잔의 여유',
                    emphasis: 'heading-1',
                    typography: {
                      fontSize: 72,
                      fontWeight: '900',
                      lineHeight: 1.1,
                    },
                  },
                  {
                    id: 'cafe.hero.subtitle',
                    editKind: 'text',
                    type: 'text',
                    content:
                      '직접 로스팅한 원두로 매일 아침을 깨우는 동네 카페. 천천히 머물고, 깊게 음미하세요.',
                    emphasis: 'body',
                    typography: { fontSize: 20, lineHeight: 1.6 },
                  },
                  {
                    id: 'cafe.hero.image',
                    editKind: 'media',
                    type: 'image',
                    src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
                    alt: '원목 테이블 위 따뜻한 라떼 한 잔',
                    aspectRatio: 'wide',
                    shape: { radius: 24, shadow: 'xl' },
                  },
                  {
                    id: 'cafe.hero.cta',
                    editKind: 'text',
                    type: 'button',
                    label: '오늘의 메뉴 보기',
                    variant: 'primary',
                    shape: { radius: 36, shadow: 'lg' },
                    color: {
                      backgroundColor: '#3a2718',
                      textColor: '#fff1dc',
                    },
                  },
                ],
              },
              {
                id: 'cafe.menu',
                editKind: 'structure',
                type: 'section',
                spacing: {
                  paddingTop: 96,
                  paddingBottom: 96,
                  paddingLeft: 48,
                  paddingRight: 48,
                  gap: 48,
                },
                layout: { direction: 'column', align: 'center' },
                children: [
                  {
                    id: 'cafe.menu.title',
                    editKind: 'text',
                    type: 'text',
                    content: '오늘의 시그니처',
                    emphasis: 'heading-2',
                    typography: { fontSize: 48, fontWeight: '800' },
                  },
                  {
                    id: 'cafe.menu.list',
                    editKind: 'structure',
                    type: 'section',
                    spacing: { gap: 32 },
                    layout: { direction: 'row', align: 'stretch' },
                    children: [
                      {
                        id: 'cafe.menu.card.1',
                        editKind: 'structure',
                        type: 'card',
                        spacing: { paddingBottom: 24, gap: 16 },
                        shape: { radius: 20, shadow: 'lg' },
                        color: { backgroundColor: '#ffffff' },
                        children: [
                          {
                            id: 'cafe.menu.card.1.image',
                            editKind: 'media',
                            type: 'image',
                            src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
                            alt: '갓 내린 에스프레소 잔',
                            aspectRatio: 'square',
                          },
                          {
                            id: 'cafe.menu.card.1.name',
                            editKind: 'text',
                            type: 'text',
                            content: '에스프레소 콘 파나',
                            emphasis: 'heading-3',
                            typography: { fontSize: 22, fontWeight: '700' },
                          },
                          {
                            id: 'cafe.menu.card.1.desc',
                            editKind: 'text',
                            type: 'text',
                            content: '갓 내린 에스프레소 위에 부드러운 휘핑',
                            emphasis: 'caption',
                            typography: { lineHeight: 1.55 },
                          },
                          {
                            id: 'cafe.menu.card.1.price',
                            editKind: 'text',
                            type: 'text',
                            content: '5,500원',
                            emphasis: 'heading-3',
                            typography: { fontSize: 20, fontWeight: '800' },
                            color: { textColor: '#a5471f' },
                          },
                        ],
                      },
                      {
                        id: 'cafe.menu.card.2',
                        editKind: 'structure',
                        type: 'card',
                        spacing: { paddingBottom: 24, gap: 16 },
                        shape: { radius: 20, shadow: 'lg' },
                        color: { backgroundColor: '#ffffff' },
                        children: [
                          {
                            id: 'cafe.menu.card.2.image',
                            editKind: 'media',
                            type: 'image',
                            src: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d',
                            alt: '풍성한 거품의 라떼 한 잔',
                            aspectRatio: 'square',
                          },
                          {
                            id: 'cafe.menu.card.2.name',
                            editKind: 'text',
                            type: 'text',
                            content: '시즌 바닐라 라떼',
                            emphasis: 'heading-3',
                            typography: { fontSize: 22, fontWeight: '700' },
                          },
                          {
                            id: 'cafe.menu.card.2.desc',
                            editKind: 'text',
                            type: 'text',
                            content: '마다가스카르 바닐라 빈으로 만든 시즌 한정',
                            emphasis: 'caption',
                            typography: { lineHeight: 1.55 },
                          },
                          {
                            id: 'cafe.menu.card.2.price',
                            editKind: 'text',
                            type: 'text',
                            content: '6,800원',
                            emphasis: 'heading-3',
                            typography: { fontSize: 20, fontWeight: '800' },
                            color: { textColor: '#a5471f' },
                          },
                        ],
                      },
                      {
                        id: 'cafe.menu.card.3',
                        editKind: 'structure',
                        type: 'card',
                        spacing: { paddingBottom: 24, gap: 16 },
                        shape: { radius: 20, shadow: 'lg' },
                        color: { backgroundColor: '#ffffff' },
                        children: [
                          {
                            id: 'cafe.menu.card.3.image',
                            editKind: 'media',
                            type: 'image',
                            src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
                            alt: '가을빛 디저트 플레이트',
                            aspectRatio: 'square',
                          },
                          {
                            id: 'cafe.menu.card.3.name',
                            editKind: 'text',
                            type: 'text',
                            content: '계절 무화과 타르트',
                            emphasis: 'heading-3',
                            typography: { fontSize: 22, fontWeight: '700' },
                          },
                          {
                            id: 'cafe.menu.card.3.desc',
                            editKind: 'text',
                            type: 'text',
                            content: '제주 무화과를 올린 손수 만든 타르트',
                            emphasis: 'caption',
                            typography: { lineHeight: 1.55 },
                          },
                          {
                            id: 'cafe.menu.card.3.price',
                            editKind: 'text',
                            type: 'text',
                            content: '8,200원',
                            emphasis: 'heading-3',
                            typography: { fontSize: 20, fontWeight: '800' },
                            color: { textColor: '#a5471f' },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'cafe.gallery',
                editKind: 'structure',
                type: 'section',
                spacing: {
                  paddingTop: 96,
                  paddingBottom: 96,
                  paddingLeft: 48,
                  paddingRight: 48,
                  gap: 32,
                },
                color: { backgroundColor: '#1f1c1a', textColor: '#f5efe6' },
                layout: { direction: 'column', align: 'center' },
                children: [
                  {
                    id: 'cafe.gallery.title',
                    editKind: 'text',
                    type: 'text',
                    content: '오늘의 풍경',
                    emphasis: 'heading-2',
                    typography: { fontSize: 44, fontWeight: '800' },
                  },
                  {
                    id: 'cafe.gallery.subtitle',
                    editKind: 'text',
                    type: 'text',
                    content: '천천히 머무는 사람들의 시간',
                    emphasis: 'body',
                    typography: { fontSize: 18, lineHeight: 1.6 },
                  },
                  {
                    id: 'cafe.gallery.grid',
                    editKind: 'structure',
                    type: 'section',
                    spacing: { gap: 16 },
                    layout: { direction: 'row' },
                    children: [
                      {
                        id: 'cafe.gallery.image.1',
                        editKind: 'media',
                        type: 'image',
                        src: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3',
                        alt: '바리스타가 핸드드립 커피를 내리는 모습',
                        aspectRatio: 'square',
                        shape: { radius: 16, shadow: 'md' },
                      },
                      {
                        id: 'cafe.gallery.image.2',
                        editKind: 'media',
                        type: 'image',
                        src: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247',
                        alt: '햇살 비치는 카페 창가',
                        aspectRatio: 'square',
                        shape: { radius: 16, shadow: 'md' },
                      },
                      {
                        id: 'cafe.gallery.image.3',
                        editKind: 'media',
                        type: 'image',
                        src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
                        alt: '원목 테이블 위에 놓인 갓 구운 빵',
                        aspectRatio: 'square',
                        shape: { radius: 16, shadow: 'md' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'cafe.footer',
            editKind: 'structure',
            type: 'section',
            role: 'contentinfo',
            layout: { direction: 'row', align: 'center', justify: 'between' },
            spacing: {
              paddingTop: 40,
              paddingRight: 48,
              paddingBottom: 40,
              paddingLeft: 48,
              gap: 24,
            },
            color: { backgroundColor: '#3a2718', textColor: '#fff1dc' },
            children: [
              {
                id: 'cafe.footer.copy',
                editKind: 'text',
                type: 'text',
                content: '© 2026 도시카페 — 매일 아침 7시 오픈',
                emphasis: 'caption',
                typography: { fontSize: 14 },
              },
              {
                id: 'cafe.footer.links',
                editKind: 'structure',
                type: 'section',
                layout: { direction: 'row' },
                spacing: { gap: 16 },
                children: [
                  {
                    id: 'cafe.footer.privacy',
                    editKind: 'text',
                    type: 'text',
                    content: '개인정보처리방침',
                    contentRole: 'label',
                  },
                  {
                    id: 'cafe.footer.contact',
                    editKind: 'text',
                    type: 'text',
                    content: '문의',
                    contentRole: 'label',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  {
    intent: 'SaaS 협업 도구의 가격제 페이지, 3가지 플랜 비교',
    tree: {
      version: '1',
      root: {
        id: 'saas.page',
        editKind: 'structure',
        type: 'section',
        layout: { direction: 'column' },
        children: [
          {
            id: 'saas.header',
            editKind: 'structure',
            type: 'section',
            role: 'banner',
            layout: { direction: 'row', align: 'center', justify: 'between' },
            spacing: {
              paddingTop: 16,
              paddingRight: 32,
              paddingBottom: 16,
              paddingLeft: 32,
              gap: 24,
            },
            responsive: { mobile: '햄버거 메뉴로 nav 접음' },
            children: [
              {
                id: 'saas.header.logo',
                editKind: 'text',
                type: 'text',
                content: 'Dworks',
                emphasis: 'heading-3',
                contentRole: 'heading',
              },
              {
                id: 'saas.header.nav',
                editKind: 'structure',
                type: 'section',
                layout: { direction: 'row', align: 'center' },
                spacing: { gap: 24 },
                children: [
                  {
                    id: 'saas.header.nav.product',
                    editKind: 'text',
                    type: 'text',
                    content: '제품',
                    contentRole: 'label',
                  },
                  {
                    id: 'saas.header.nav.pricing',
                    editKind: 'text',
                    type: 'text',
                    content: '가격',
                    contentRole: 'label',
                  },
                  {
                    id: 'saas.header.nav.docs',
                    editKind: 'text',
                    type: 'text',
                    content: '문서',
                    contentRole: 'label',
                  },
                  {
                    id: 'saas.header.nav.login',
                    editKind: 'text',
                    type: 'text',
                    content: '로그인',
                    contentRole: 'label',
                  },
                ],
              },
            ],
          },
          {
            id: 'saas.main',
            editKind: 'structure',
            type: 'section',
            role: 'main',
            children: [
              {
                id: 'saas.hero',
                editKind: 'structure',
                type: 'hero',
                spacing: {
                  paddingTop: 120,
                  paddingBottom: 120,
                  paddingLeft: 48,
                  paddingRight: 48,
                  gap: 48,
                },
                layout: { direction: 'row', align: 'center', justify: 'between' },
                color: { backgroundColor: '#0b1220', textColor: '#ffffff' },
                children: [
                  {
                    id: 'saas.hero.copy',
                    editKind: 'structure',
                    type: 'section',
                    layout: { direction: 'column', align: 'start' },
                    spacing: { gap: 24 },
                    children: [
                      {
                        id: 'saas.hero.eyebrow',
                        editKind: 'text',
                        type: 'text',
                        content: '팀을 위한 협업 분석',
                        emphasis: 'caption',
                        typography: { fontSize: 14, letterSpacing: 0.08 },
                        color: { textColor: '#9aa4b2' },
                      },
                      {
                        id: 'saas.hero.title',
                        editKind: 'text',
                        type: 'text',
                        content: '데이터로 의사결정 속도를 두 배로',
                        emphasis: 'heading-1',
                        typography: {
                          fontSize: 72,
                          fontWeight: '900',
                          lineHeight: 1.05,
                          letterSpacing: -0.02,
                        },
                      },
                      {
                        id: 'saas.hero.lead',
                        editKind: 'text',
                        type: 'text',
                        content:
                          '흩어진 지표를 한 화면에 모으고, 팀 전체가 같은 그래프를 보면서 결정합니다.',
                        emphasis: 'body',
                        typography: { fontSize: 20, lineHeight: 1.7 },
                        color: { textColor: '#cbd5e1' },
                      },
                      {
                        id: 'saas.hero.cta',
                        editKind: 'text',
                        type: 'button',
                        label: '14일 무료 체험',
                        variant: 'primary',
                        shape: { radius: 12, shadow: 'lg' },
                        color: { backgroundColor: '#22d3ee', textColor: '#0b1220' },
                      },
                    ],
                  },
                  {
                    id: 'saas.hero.screenshot',
                    editKind: 'media',
                    type: 'image',
                    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
                    alt: '대시보드 화면 스크린샷 — 매출 그래프와 KPI 카드',
                    aspectRatio: 'landscape',
                    shape: { radius: 20, shadow: 'xl' },
                  },
                ],
              },
              {
                id: 'saas.features',
                editKind: 'structure',
                type: 'section',
                spacing: {
                  paddingTop: 96,
                  paddingBottom: 96,
                  paddingLeft: 48,
                  paddingRight: 48,
                  gap: 48,
                },
                layout: { direction: 'column', align: 'center' },
                color: { backgroundColor: '#ffffff' },
                children: [
                  {
                    id: 'saas.features.title',
                    editKind: 'text',
                    type: 'text',
                    content: '팀이 매일 쓰는 세 가지 기능',
                    emphasis: 'heading-2',
                    typography: { fontSize: 44, fontWeight: '900', lineHeight: 1.15 },
                  },
                  {
                    id: 'saas.features.grid',
                    editKind: 'structure',
                    type: 'section',
                    layout: { direction: 'row', align: 'stretch' },
                    spacing: { gap: 24 },
                    children: [
                      {
                        id: 'saas.features.card.dashboards',
                        editKind: 'structure',
                        type: 'card',
                        spacing: {
                          paddingTop: 32,
                          paddingBottom: 32,
                          paddingLeft: 28,
                          paddingRight: 28,
                          gap: 12,
                        },
                        shape: { radius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
                        color: { backgroundColor: '#f8fafc' },
                        children: [
                          {
                            id: 'saas.features.card.dashboards.title',
                            editKind: 'text',
                            type: 'text',
                            content: '실시간 대시보드',
                            emphasis: 'heading-3',
                            typography: { fontSize: 22, fontWeight: '800' },
                          },
                          {
                            id: 'saas.features.card.dashboards.body',
                            editKind: 'text',
                            type: 'text',
                            content:
                              '드래그만으로 KPI 카드를 정렬하고, 팀별 뷰를 저장합니다.',
                            emphasis: 'body',
                            typography: { fontSize: 16, lineHeight: 1.7 },
                            color: { textColor: '#475569' },
                          },
                        ],
                      },
                      {
                        id: 'saas.features.card.alerts',
                        editKind: 'structure',
                        type: 'card',
                        spacing: {
                          paddingTop: 32,
                          paddingBottom: 32,
                          paddingLeft: 28,
                          paddingRight: 28,
                          gap: 12,
                        },
                        shape: { radius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
                        color: { backgroundColor: '#f8fafc' },
                        children: [
                          {
                            id: 'saas.features.card.alerts.title',
                            editKind: 'text',
                            type: 'text',
                            content: '이상 감지 알림',
                            emphasis: 'heading-3',
                            typography: { fontSize: 22, fontWeight: '800' },
                          },
                          {
                            id: 'saas.features.card.alerts.body',
                            editKind: 'text',
                            type: 'text',
                            content:
                              '지표 이상치를 자동으로 감지해 Slack과 이메일로 알립니다.',
                            emphasis: 'body',
                            typography: { fontSize: 16, lineHeight: 1.7 },
                            color: { textColor: '#475569' },
                          },
                        ],
                      },
                      {
                        id: 'saas.features.card.collab',
                        editKind: 'structure',
                        type: 'card',
                        spacing: {
                          paddingTop: 32,
                          paddingBottom: 32,
                          paddingLeft: 28,
                          paddingRight: 28,
                          gap: 12,
                        },
                        shape: { radius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
                        color: { backgroundColor: '#f8fafc' },
                        children: [
                          {
                            id: 'saas.features.card.collab.title',
                            editKind: 'text',
                            type: 'text',
                            content: '주석과 메모',
                            emphasis: 'heading-3',
                            typography: { fontSize: 22, fontWeight: '800' },
                          },
                          {
                            id: 'saas.features.card.collab.body',
                            editKind: 'text',
                            type: 'text',
                            content:
                              '그래프 위에 바로 주석을 달고, 결정 근거를 함께 기록합니다.',
                            emphasis: 'body',
                            typography: { fontSize: 16, lineHeight: 1.7 },
                            color: { textColor: '#475569' },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
        id: 'pricing.section',
        editKind: 'structure',
        type: 'section',
        spacing: {
          paddingTop: 96,
          paddingBottom: 96,
          paddingLeft: 32,
          paddingRight: 32,
          gap: 56,
        },
        layout: { direction: 'column', align: 'center' },
        color: { backgroundColor: '#f7f9fc' },
        children: [
          {
            id: 'pricing.title',
            editKind: 'text',
            type: 'text',
            content: '팀에 맞는 요금제',
            emphasis: 'heading-1',
            typography: {
              fontSize: 56,
              fontWeight: '900',
              lineHeight: 1.15,
            },
          },
          {
            id: 'pricing.lead',
            editKind: 'text',
            type: 'text',
            content: '언제든지 업그레이드하거나 취소할 수 있습니다.',
            emphasis: 'body',
            typography: { fontSize: 18, lineHeight: 1.6 },
            color: { textColor: '#4f5868' },
          },
          {
            id: 'pricing.plans',
            editKind: 'structure',
            type: 'section',
            spacing: { gap: 24 },
            layout: { direction: 'row', align: 'stretch' },
            children: [
              {
                id: 'pricing.plan.starter',
                editKind: 'structure',
                type: 'card',
                spacing: {
                  paddingTop: 24,
                  paddingBottom: 24,
                  paddingLeft: 24,
                  paddingRight: 24,
                  gap: 16,
                },
                shape: {
                  radius: 16,
                  borderWidth: 1,
                  borderColor: '#dde3ec',
                },
                color: { backgroundColor: '#ffffff' },
                children: [
                  {
                    id: 'pricing.plan.starter.name',
                    editKind: 'text',
                    type: 'text',
                    content: 'Starter',
                    emphasis: 'heading-2',
                    typography: { fontSize: 26, fontWeight: '800' },
                  },
                  {
                    id: 'pricing.plan.starter.price',
                    editKind: 'text',
                    type: 'text',
                    content: '월 9,000원',
                    emphasis: 'heading-3',
                    typography: { fontSize: 36, fontWeight: '900' },
                  },
                  {
                    id: 'pricing.plan.starter.cta',
                    editKind: 'text',
                    type: 'button',
                    label: '시작하기',
                    variant: 'secondary',
                    shape: { radius: 12, shadow: 'md' },
                  },
                ],
              },
              {
                id: 'pricing.plan.pro',
                editKind: 'structure',
                type: 'card',
                color: {
                  backgroundColor: '#0f4c75',
                  textColor: '#ffffff',
                },
                spacing: {
                  paddingTop: 40,
                  paddingBottom: 40,
                  paddingLeft: 28,
                  paddingRight: 28,
                  gap: 20,
                },
                shape: { radius: 20, shadow: 'xl' },
                children: [
                  {
                    id: 'pricing.plan.pro.name',
                    editKind: 'text',
                    type: 'text',
                    content: 'Pro',
                    emphasis: 'heading-2',
                    typography: { fontSize: 28, fontWeight: '800' },
                  },
                  {
                    id: 'pricing.plan.pro.price',
                    editKind: 'text',
                    type: 'text',
                    content: '월 29,000원',
                    emphasis: 'heading-3',
                    typography: { fontSize: 40, fontWeight: '900' },
                  },
                  {
                    id: 'pricing.plan.pro.cta',
                    editKind: 'text',
                    type: 'button',
                    label: '14일 무료 체험',
                    variant: 'primary',
                    shape: { radius: 12, shadow: 'lg' },
                    color: {
                      backgroundColor: '#ffffff',
                      textColor: '#0f4c75',
                    },
                  },
                ],
              },
              {
                id: 'pricing.plan.enterprise',
                editKind: 'structure',
                type: 'card',
                spacing: {
                  paddingTop: 24,
                  paddingBottom: 24,
                  paddingLeft: 24,
                  paddingRight: 24,
                  gap: 16,
                },
                shape: {
                  radius: 16,
                  borderWidth: 1,
                  borderColor: '#dde3ec',
                },
                color: { backgroundColor: '#ffffff' },
                children: [
                  {
                    id: 'pricing.plan.enterprise.name',
                    editKind: 'text',
                    type: 'text',
                    content: 'Enterprise',
                    emphasis: 'heading-2',
                    typography: { fontSize: 26, fontWeight: '800' },
                  },
                  {
                    id: 'pricing.plan.enterprise.price',
                    editKind: 'text',
                    type: 'text',
                    content: '맞춤 견적',
                    emphasis: 'heading-3',
                    typography: { fontSize: 36, fontWeight: '900' },
                  },
                  {
                    id: 'pricing.plan.enterprise.cta',
                    editKind: 'text',
                    type: 'button',
                    label: '문의하기',
                    variant: 'ghost',
                    shape: { radius: 12 },
                  },
                ],
              },
            ],
          },
        ],
      },
            ],
          },
          {
            id: 'saas.footer',
            editKind: 'structure',
            type: 'section',
            role: 'contentinfo',
            layout: { direction: 'row', align: 'center', justify: 'between' },
            spacing: {
              paddingTop: 40,
              paddingRight: 48,
              paddingBottom: 40,
              paddingLeft: 48,
              gap: 24,
            },
            color: { backgroundColor: '#0f1729', textColor: '#cdd5e0' },
            children: [
              {
                id: 'saas.footer.copy',
                editKind: 'text',
                type: 'text',
                content: '© 2026 Dworks. All rights reserved.',
                emphasis: 'caption',
              },
              {
                id: 'saas.footer.links',
                editKind: 'structure',
                type: 'section',
                layout: { direction: 'row' },
                spacing: { gap: 16 },
                children: [
                  {
                    id: 'saas.footer.privacy',
                    editKind: 'text',
                    type: 'text',
                    content: '개인정보처리방침',
                    contentRole: 'label',
                  },
                  {
                    id: 'saas.footer.terms',
                    editKind: 'text',
                    type: 'text',
                    content: '이용약관',
                    contentRole: 'label',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  {
    intent: '여행 매거진 블로그 글 페이지, 사진과 본문 위주',
    tree: {
      version: '1',
      root: {
        id: 'magazine.page',
        editKind: 'structure',
        type: 'section',
        layout: { direction: 'column' },
        children: [
          {
            id: 'magazine.header',
            editKind: 'structure',
            type: 'section',
            role: 'banner',
            layout: { direction: 'row', align: 'center', justify: 'between' },
            spacing: {
              paddingTop: 16,
              paddingRight: 32,
              paddingBottom: 16,
              paddingLeft: 32,
              gap: 24,
            },
            children: [
              {
                id: 'magazine.header.logo',
                editKind: 'text',
                type: 'text',
                content: '오늘의 여행',
                emphasis: 'heading-3',
                contentRole: 'heading',
              },
              {
                id: 'magazine.header.nav',
                editKind: 'structure',
                type: 'section',
                layout: { direction: 'row' },
                spacing: { gap: 24 },
                children: [
                  {
                    id: 'magazine.header.nav.essay',
                    editKind: 'text',
                    type: 'text',
                    content: '에세이',
                    contentRole: 'label',
                  },
                  {
                    id: 'magazine.header.nav.guide',
                    editKind: 'text',
                    type: 'text',
                    content: '가이드',
                    contentRole: 'label',
                  },
                  {
                    id: 'magazine.header.nav.photo',
                    editKind: 'text',
                    type: 'text',
                    content: '사진',
                    contentRole: 'label',
                  },
                ],
              },
            ],
          },
          {
            id: 'magazine.main',
            editKind: 'structure',
            type: 'section',
            role: 'main',
            children: [
              {
                id: 'article.section',
                editKind: 'structure',
                type: 'section',
                spacing: {
                  paddingTop: 64,
                  paddingBottom: 64,
                  paddingLeft: 24,
                  paddingRight: 24,
                  gap: 24,
                },
                layout: { direction: 'column' },
                children: [
                  {
                    id: 'article.heading',
                    editKind: 'text',
                    type: 'text',
                    content: '제주의 가을, 오름 위를 걷다',
                    emphasis: 'heading-1',
                    typography: {
                      fontSize: 64,
                      fontWeight: '900',
                      lineHeight: 1.1,
                    },
                  },
                  {
                    id: 'article.byline',
                    editKind: 'text',
                    type: 'text',
                    content: '글·사진 김도현 · 6분 읽기',
                    emphasis: 'caption',
                    typography: { fontSize: 14 },
                    color: { textColor: '#6b7280' },
                  },
                  {
                    id: 'article.cover',
                    editKind: 'media',
                    type: 'image',
                    src: 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e',
                    alt: '제주 오름 정상에서 바라본 가을 하늘과 억새 풍경',
                    aspectRatio: 'wide',
                    shape: { radius: 16, shadow: 'lg' },
                  },
                  {
                    id: 'article.intro',
                    editKind: 'text',
                    type: 'text',
                    content:
                      '바람이 차가워지면 제주의 오름은 다른 얼굴로 바뀐다. 억새가 은빛으로 출렁이고, 발 아래 도시는 안개에 잠긴다.',
                    emphasis: 'body',
                    typography: { fontSize: 20, lineHeight: 1.8 },
                  },
                  {
                    id: 'article.section1.title',
                    editKind: 'text',
                    type: 'text',
                    content: '새벽의 다랑쉬',
                    emphasis: 'heading-2',
                    typography: {
                      fontSize: 36,
                      fontWeight: '800',
                      lineHeight: 1.25,
                    },
                  },
                  {
                    id: 'article.section1.body',
                    editKind: 'text',
                    type: 'text',
                    content:
                      '동이 트기 전에 다랑쉬오름 입구에 도착했다. 분화구를 한 바퀴 도는 동안 능선이 점점 황금빛으로 물들었다.',
                    emphasis: 'body',
                    typography: { fontSize: 18, lineHeight: 1.8 },
                  },
                ],
              },
              {
                id: 'magazine.related',
                editKind: 'structure',
                type: 'section',
                spacing: {
                  paddingTop: 80,
                  paddingBottom: 80,
                  paddingLeft: 24,
                  paddingRight: 24,
                  gap: 32,
                },
                layout: { direction: 'column', align: 'start' },
                color: { backgroundColor: '#fafaf6' },
                children: [
                  {
                    id: 'magazine.related.title',
                    editKind: 'text',
                    type: 'text',
                    content: '함께 읽기 좋은 글',
                    emphasis: 'heading-2',
                    typography: { fontSize: 32, fontWeight: '800', lineHeight: 1.2 },
                  },
                  {
                    id: 'magazine.related.grid',
                    editKind: 'structure',
                    type: 'section',
                    layout: { direction: 'row', align: 'stretch' },
                    spacing: { gap: 24 },
                    children: [
                      {
                        id: 'magazine.related.card.1',
                        editKind: 'structure',
                        type: 'card',
                        layout: { direction: 'column', align: 'start' },
                        spacing: { gap: 12 },
                        children: [
                          {
                            id: 'magazine.related.card.1.image',
                            editKind: 'media',
                            type: 'image',
                            src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
                            alt: '안개 낀 새벽 산길',
                            aspectRatio: 'landscape',
                            shape: { radius: 12 },
                          },
                          {
                            id: 'magazine.related.card.1.title',
                            editKind: 'text',
                            type: 'text',
                            content: '안개의 시간, 한라산 1100고지',
                            emphasis: 'heading-3',
                            typography: { fontSize: 20, fontWeight: '700', lineHeight: 1.3 },
                          },
                          {
                            id: 'magazine.related.card.1.byline',
                            editKind: 'text',
                            type: 'text',
                            content: '글 박은지 · 5분 읽기',
                            emphasis: 'caption',
                            typography: { fontSize: 13 },
                            color: { textColor: '#6b7280' },
                          },
                        ],
                      },
                      {
                        id: 'magazine.related.card.2',
                        editKind: 'structure',
                        type: 'card',
                        layout: { direction: 'column', align: 'start' },
                        spacing: { gap: 12 },
                        children: [
                          {
                            id: 'magazine.related.card.2.image',
                            editKind: 'media',
                            type: 'image',
                            src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
                            alt: '가을 들판의 억새',
                            aspectRatio: 'landscape',
                            shape: { radius: 12 },
                          },
                          {
                            id: 'magazine.related.card.2.title',
                            editKind: 'text',
                            type: 'text',
                            content: '억새가 우는 밤, 따라비 오름',
                            emphasis: 'heading-3',
                            typography: { fontSize: 20, fontWeight: '700', lineHeight: 1.3 },
                          },
                          {
                            id: 'magazine.related.card.2.byline',
                            editKind: 'text',
                            type: 'text',
                            content: '글 김도현 · 7분 읽기',
                            emphasis: 'caption',
                            typography: { fontSize: 13 },
                            color: { textColor: '#6b7280' },
                          },
                        ],
                      },
                      {
                        id: 'magazine.related.card.3',
                        editKind: 'structure',
                        type: 'card',
                        layout: { direction: 'column', align: 'start' },
                        spacing: { gap: 12 },
                        children: [
                          {
                            id: 'magazine.related.card.3.image',
                            editKind: 'media',
                            type: 'image',
                            src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
                            alt: '겨울 산정의 눈 풍경',
                            aspectRatio: 'landscape',
                            shape: { radius: 12 },
                          },
                          {
                            id: 'magazine.related.card.3.title',
                            editKind: 'text',
                            type: 'text',
                            content: '눈을 밟는 사람들, 영실에서',
                            emphasis: 'heading-3',
                            typography: { fontSize: 20, fontWeight: '700', lineHeight: 1.3 },
                          },
                          {
                            id: 'magazine.related.card.3.byline',
                            editKind: 'text',
                            type: 'text',
                            content: '글 이서윤 · 6분 읽기',
                            emphasis: 'caption',
                            typography: { fontSize: 13 },
                            color: { textColor: '#6b7280' },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'magazine.footer',
            editKind: 'structure',
            type: 'section',
            role: 'contentinfo',
            layout: { direction: 'row', align: 'center', justify: 'between' },
            spacing: {
              paddingTop: 40,
              paddingRight: 48,
              paddingBottom: 40,
              paddingLeft: 48,
              gap: 24,
            },
            color: { backgroundColor: '#1f1c1a', textColor: '#e9e5dc' },
            children: [
              {
                id: 'magazine.footer.copy',
                editKind: 'text',
                type: 'text',
                content: '© 2026 오늘의 여행 · 매주 금요일 새 글',
                emphasis: 'caption',
                typography: { fontSize: 14 },
              },
              {
                id: 'magazine.footer.links',
                editKind: 'structure',
                type: 'section',
                layout: { direction: 'row' },
                spacing: { gap: 16 },
                children: [
                  {
                    id: 'magazine.footer.about',
                    editKind: 'text',
                    type: 'text',
                    content: '소개',
                    contentRole: 'label',
                  },
                  {
                    id: 'magazine.footer.subscribe',
                    editKind: 'text',
                    type: 'text',
                    content: '뉴스레터',
                    contentRole: 'label',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
]

export const CLARIFY_QUESTIONS_EXAMPLE = {
  intent: '예약을 받는 도시 호텔 랜딩 페이지',
  questions: [
    {
      id: 'q1',
      label: '이 페이지에서 사용자가 가장 먼저 하길 바라는 행동은 무엇인가요?',
      type: 'single' as const,
      options: ['예약하기', '객실 둘러보기', '위치 확인', '문의 남기기'],
      hint: '메인 CTA와 hero 메시지에 반영됩니다.',
    },
    {
      id: 'q2',
      label: '강조할 콘텐츠를 모두 골라주세요.',
      type: 'multi' as const,
      options: ['프리미엄 객실', '주변 명소', '식음료', '리뷰', '특가 프로모션'],
    },
    {
      id: 'q3',
      label: '주요 대상 사용자는 누구인가요?',
      type: 'single' as const,
      options: ['커플 / 신혼여행', '비즈니스 출장', '가족 여행', '나홀로 여행'],
    },
    {
      id: 'q4',
      label: '브랜드 voice 또는 피하고 싶은 분위기를 한 줄로 알려주세요.',
      type: 'text' as const,
      hint: '예) "차분한 럭셔리, 과한 화려함은 피하기"',
    },
  ],
}

const GENERATE_EXAMPLES_BLOCK = GENERATE_TREE_EXAMPLES.map(
  (example, index) =>
    `### 예시 ${index + 1}\n사용자 입력: "${example.intent}"\n응답:\n${JSON.stringify(example.tree, null, 2)}`,
).join('\n\n')

const CLARIFY_EXAMPLE_BLOCK = `사용자 입력: "${CLARIFY_QUESTIONS_EXAMPLE.intent}"\n응답:\n${JSON.stringify(
  { questions: CLARIFY_QUESTIONS_EXAMPLE.questions },
  null,
  2,
)}`

/**
 * m3-generate-mvp용 system prompt.
 *
 * 목표: 사용자 prompt → 항상 유효한 dworks Tree JSON 1개 출력.
 * "schema-valid"에 집중하면서 lean few-shot examples로 콘텐츠 깊이 가이드 (m3-generate-prompt-uplift).
 */
export const GENERATE_TREE_SYSTEM_PROMPT = `너는 디자인 페이지 트리 생성기다. 사용자가 한국어로 페이지 의도를 설명하면, 정확히 하나의 dworks Tree JSON만을 반환한다.

## 출력 규칙

1. JSON 객체 하나만 출력. 코드 펜스 / 설명 / 주석 / 추가 텍스트 절대 금지.
2. 최상위 형태: { "version": "1", "root": <TreeNode> }. \`version\`은 반드시 문자열 "1".
3. \`root\`는 보통 \`hero\` 또는 \`section\` 노드.

## TreeNode 8 종류 + 필수 필드

모든 노드 공통: \`id\` (소문자/숫자/점/하이픈, 1자 이상, 트리 안 유일) + \`editKind\` ("text" | "media" | "structure" | "style").

종류별 필수:
- "text": { id, editKind:"text", type:"text", content }
- "button": { id, editKind:"text", type:"button", label }
- "image": { id, editKind:"media", type:"image", src (https://...), alt (한글) }
- "section" / "hero" / "card" / "list" / "form": { id, editKind:"structure", type, children:[...] } — children 최소 1개

## 이미지 src

\`https://images.unsplash.com/photo-...\` 또는 \`https://\`로 시작하는 안정적 URL. 빈 문자열 / placeholder 금지. alt는 한글 의미 텍스트.

## 선택 필드 (optional)

- text: \`emphasis\` ("heading-1" | "heading-2" | "heading-3" | "body" | "caption")
- button: \`variant\` ("primary" | "secondary" | "ghost"), \`href\`
- image: \`aspectRatio\` ("square" | "landscape" | "portrait" | "wide")
- 공통: \`hidden\`, \`disabled\` (button만), \`opacity\` (0~1)

스타일 prop은 _디자인 의도가 명확한 곳에 자유롭게_ 박는다. \`color\` / \`spacing\` / \`shape\` / \`layout\` / \`typography\`(fontSize/fontWeight/lineHeight/letterSpacing/textAlign/fontFamily/textShadow) — 시각 위계와 호흡을 만드는 데 필요하다 판단되는 모든 노드에 명시한다. 시스템에 design-resolver가 있어 type별 default가 자동으로 채워지므로, _override가 필요한 부분만_ 명시해도 일관성이 유지된다.

\`transition\` / \`transform\` / \`cursor\` / 상태 색(hover/active/focus/disabled)은 _상호작용 의도가 명확할 때_(예: CTA 버튼 hover 색상 변화, primary 카드 hover lift) 자유롭게 사용. 단순 정적 노드엔 생략. \`responsive\`는 layout이 viewport별로 적응할 의도가 있을 때 한국어 메모로 표현.

## 디자인 브리프 처리

사용자 메시지는 brief 형태일 수 있다:
- **의도**: 페이지 목적 (필수, 가장 중요).
- **추가 질문 답변**: \`- 질문 라벨: 답변\` 목록. 답변은 단일 문자열 또는 ', '로 결합된 다중 선택. 의도와 답변을 종합해 root 노드 종류 / children 구성 / content 디테일 결정.
- **브랜드 / 참조 메모**: brand voice / 참조 자료.

## 페이지 기본 구조

기본 출력은 _풀 페이지_다. root는 \`section\`이고 다음 3 자식을 둔다:

- \`section role="banner"\` (헤더): \`layout.direction='row'\`, 로고 text + 1차 nav text 3~5. 각 nav text는 \`contentRole='label'\`.
- \`section role="main"\` (메인): hero / pricing / article 등 핵심 콘텐츠를 감싼다. 이 section의 자식이 도메인 시그니처를 담는다.
- \`section role="contentinfo"\` (푸터): 카피라이트 + 보조 링크 2~3개. 각 링크 text는 \`contentRole='label'\`.

단편 출력 예외: 사용자가 _명시적으로_ "hero만", "카드만"처럼 부분만 요청한 경우만 root를 hero/card 단독으로 둔다. 일반 "페이지" 의도는 풀 페이지로 응답한다.

\`responsive\` prop은 헤더/메인의 layout이 viewport별로 어떻게 적응할지 한국어 의도 메모(예: \`{ "mobile": "햄버거 메뉴로 nav 접음" }\`). 의도 _힌트_만 — 실제 렌더 분기는 시스템이 처리.

## 2026 디자인 트렌드 가이드 (와이어프레임 금지)

**절대 규칙**: 출력은 _완성된 디자인_이지 와이어프레임이 아니다. 텍스트 박스만 있는 plain section은 금지. 모든 hero/section/card/footer는 색감/typography/이미지/그림자 중 _최소 2개_가 명확히 보이게 만든다.

- **Bold typography hero**: hero \`heading-1\` 텍스트는 \`typography.fontSize\` 56~80 + \`fontWeight\` 700~900 명시. body는 fontSize 16~20 + lineHeight 1.55~1.7. 큰 typography 자체가 시각적 hook.
- **Section 다양화**: 한 페이지는 보통 5~8 섹션 — hero / 핵심 가치 또는 메뉴 카드 / 이미지 gallery 또는 product preview / customer logos 또는 social proof / pricing 또는 features / testimonials / closing CTA / footer. 단일 hero 페이지 금지.
- **이미지 풍부**: hero 외에도 menu/product/gallery/about 섹션에 이미지 활용. unsplash 등 안정적 URL.
- **색감 강함**: hero/CTA/footer 중 하나 이상에 \`color.backgroundColor\` 또는 \`backgroundGradient\` 명시. 회색 배경에 텍스트만은 와이어프레임.
- **Shadow 적극**: 핵심 CTA 버튼 \`shape.shadow\`=\`md\`/\`lg\`, 강조 카드 \`lg\`/\`xl\`, hero 핵심 시각 요소 \`xl\`. \`none\` 남발 금지.
- **Generous spacing**: hero \`spacing.padding\` ≥ 96, 섹션 간 \`spacing.gap\` ≥ 64. 정보 밀도 낮추고 호흡.
- **Single primary CTA per hero**: 1차 CTA 하나 \`variant='primary'\` + \`shape.radius\` 24~48 + \`shadow\`=\`md\`. 보조 ghost.
- **Mobile-first 의도**: \`layout.direction\`은 column 우선. 헤더만 row + responsive로 mobile 적응.
- **레이어드 디자인 (Overlay 헤더 패턴)**: 헤더가 항상 hero 위에 _스택_으로 쌓일 필요 없음. 풀-블리드 hero에서는 헤더를 _hero 위에 떠있게_ 만든다. \`section role='banner'\`에 \`position: 'absolute'\` + \`inset: { top: 0, left: 0, right: 0, zIndex: 20 }\` 적용. 배경은 \`color.backgroundOpacity 0.4~0.7\`로 반투명 dark/light fade(또는 transparent로 _color 키 자체 제거_). hero가 banner 영역만큼 _상단 padding 보장_(paddingTop ≥ 96). 다크 hero + 투명 banner에서는 시각적 깊이가 크게 살아남. sticky 헤더는 \`position: 'sticky'\` + \`inset.top: 0\`. (system이 자동으로 부모를 \`position: relative\`로 잡아준다.)
- **반응형 노드 hide (viewport별)**: \`hideOn: { mobile?: boolean, tablet?: boolean, desktop?: boolean }\` 으로 viewport별 노드 표시/숨김. 모바일에서 데스크탑 nav 숨기고 햄버거 보여주기, 데스크탑에서 모바일-only sticky CTA 숨기기 등에 사용. \`hidden=true\`(전 viewport)와 별개. 예: 데스크탑 nav text 4개 \`hideOn: { mobile: true }\` + 모바일 hamburger button \`hideOn: { desktop: true }\`. 시각적 _진짜 반응형_은 단순한 layout 이동을 넘어 _노드 자체가 viewport별로 다르게_ 보일 때 완성된다.
- **다크 / 럭셔리 / 스타일리시 옵션**: 사용자가 _다크 / 어두운 / 스타일리시 / 럭셔리 / 세련된 / 미드나잇_ 같은 톤을 의도하면 다크 palette로 출력. \`backgroundColor\` deep tone(#0a0a0a~#1a1d22), text bright(#e5e7eb~#f9fafb), accent vivid(#6366f1 / #a78bfa / #34d399 등). 다크에선 shadow가 약해지므로 _bg 톤 차이_ + _border 약간 강화_(#2a2e35~#3a3f48)로 위계. 흰 카드 위 흰 배경 같은 light 패턴은 와이어프레임이므로 금지.
- **GenZ / playful / 활기 옵션**: \`hero\` background에 vivid gradient(coral~orange, electric blue~purple, mint~lime 등) + 큰 fontSize 72~96 + 강한 shadow. 회색 안전 디자인 회피.
- **B2B / SaaS / 전문 옵션**: 흰/oat(#f8f5ef) 또는 deep navy(#0f172a~#1e293b) bg + 작은 radius(4~8) + crisp typography(fontSize 정확, lineHeight 1.5) + 데이터 강조 컴포넌트.

피할 패턴(AI 슬롭, 즉시 거부): 텍스트 박스만 있는 hero, 모든 카드 동일 그라디언트, 이모지 장식, 좌측 강조 막대 카드, 모든 섹션 동일 padding, fontSize 명시 없이 emphasis만 박은 typography, 회색 캔버스에 텍스트만, 다크 bg에 어두운 text(대비 위반), 흰 bg에 옅은 회색 text(가독 위반), 모든 섹션 동일 backgroundColor(시각 위계 부재), nav만 있고 hero 섹션 부재.

## 참고 이미지 활용 가이드

사용자가 \`### 참고 이미지 시드\`를 제공하면(단일 또는 다중):

- 색감과 비율은 _시드_로만 활용 — 그대로 베끼지 않고 디자인 팔레트의 영감 자료로 쓴다.
- 다중 이미지면 색을 단일 이미지보다 _넓은 팔레트_로 종합하되 톤이 깨지지 않게 주조 색 1~2개 + 보조 색으로 위계를 만든다.
- 비율이 명시된 경우 hero/cover/이미지 노드에 비율을 반영(예: \`wide\` → 16:9 정도, \`portrait\` → 3:4 정도).
- 다중 이미지 비율이 서로 다르면 첫 번째 이미지의 비율을 hero에 우선 적용하고, 나머지는 보조 노드(card / gallery 항목)에 분산한다.
- 통합 팔레트(빈도 가중)가 출력되면 _주조 색_으로 우선 활용 — 그 위에 강조 색 1~2개 추가로 위계.
- raw hex 값을 그대로 출력 강제하지 말고 시드 색감을 반영한 자유 색을 고른다.
- 이미지 시드와 의도(intent)가 충돌하면 의도를 우선한다 — 시드는 보조 시그널.

## 풍부도 11 신호 자체 점검

응답 직전 트리를 11 신호로 자체 검사하고 모두 만족하지 않으면 그 자리에서 보강한 뒤 반환한다. 미달한 채 응답하지 않는다.

1. **랜드마크 구조** — root는 \`section\` 하나, 직접 자식에 \`role: 'banner'\` / \`role: 'main'\` / \`role: 'contentinfo'\` 모두 존재.
2. **main 다중 섹션** — \`role: 'main'\` 직접 자식에 \`type: 'section'\` 또는 \`type: 'hero'\`가 _4개 이상_ (hero + features + social proof + CTA 패턴 최소). 단순 hero 페이지 금지.
3. **Display heading-1** — \`emphasis: 'heading-1'\` 텍스트는 \`typography.fontSize\` ≥ 48 명시.
4. **Call to action** — \`type: 'button'\` 노드 또는 \`contentRole: 'cta'\` 텍스트 노드가 _1개 이상_.
5. **fontSize 다양성** — \`typography.fontSize\` 고유값 _3종 이상_(예: 디스플레이 / 본문 / 캡션).
6. **색 다양성** — \`color\` prop의 hex 고유값 _3개 이상_(\`backgroundColor\` / \`textColor\` / \`borderColor\` / \`accentColor\` / \`overlayColor\` 통합).
7. **이미지 사용** — \`type: 'image'\` 노드 _1개 이상_, plausible https URL.
8. **Shape 깊이** — \`shape.shadow !== 'none'\` 또는 \`shape.radius\` ≥ 8 인 노드 _1개 이상_.
9. **명시 design override 다양성** — type별 default를 그대로 두지 않고 _최소 12 노드 이상_에 \`spacing\` / \`color\` / \`typography\` / \`shape\` / \`layout\` 중 하나라도 명시 override가 있어야 한다. 와이어프레임처럼 default만 의존하지 말고 _의도된 디자인_을 노드별로 표현. (resolver가 default를 채우므로 LLM은 _차별화 포인트_만 박아도 충분.)
10. **section 시각 차별화** — main 직접 자식 section/hero 들이 _서로 다른 backgroundColor 또는 backgroundGradient_를 가진다. 모든 섹션 같은 흰 배경 = 와이어프레임 (위계 부재). 최소 _2가지 이상의 배경 톤_ (예: hero accent gradient + features muted bg + final CTA strong color)으로 시각 리듬을 만든다.
11. **노드 type 다양성** — 트리 안에 \`section\` / \`hero\` / \`card\` / \`list\` / \`form\` 중 _3종 이상_의 컨테이너 type 사용. card 또는 list로 콘텐츠를 묶어 정보 위계 표현. (단순 모든 것을 \`section\` 안에만 넣지 말고 _의미별로_ card/list 활용.)

## 답변 → 스타일 매핑 가이드

답변의 감성/톤 키워드를 \`color\` / \`spacing\` / \`shape\` / \`layout\` / \`typography\` prop에 일관되게 반영한다. 색 계열만 제시 — raw hex는 자유롭게 고른다.

- **차분 / 절제 / 신뢰**: cool muted palette, 큰 \`typography.lineHeight\`(≥1.6), 작은 \`shape.shadow\`(\`sm\`), 큰 \`spacing.padding\`으로 호흡.
- **활기 / 임팩트 / 강조**: warm accent palette, 큰 \`spacing.gap\`, 진한 \`shape.shadow\`(\`lg\`/\`xl\`), \`shape.radius\` 12~24.
- **친근 / 따뜻 / 부드러움**: warm \`color.backgroundGradient\`, soft \`shape.radius\`(16~32), 큰 \`spacing.padding\`, \`typography.lineHeight\` ≥ 1.6.
- **전문 / 정확 / 깔끔**: 흑백 가까운 palette, sharp \`shape.radius\`(4~8), 명확한 \`layout.direction='column'\`, 절제된 \`typography.lineHeight\`(~1.5).
- **프리미엄 / 고급**: deep premium palette, generous \`spacing.padding\`(≥64), subtle \`shape.shadow\`(\`sm\`), \`layout.align='center'\`.
- **다크 / 미드나잇 / 럭셔리 / 스타일리시**: bg deep(#0a0a0a~#1a1d22), text bright(#e5e7eb~#f9fafb), accent vivid(violet/cyan/lime/orange 중 하나). shadow는 약하게 또는 \`none\`, border 약간 강화로 위계.
- **미니멀 / 절제미 / 선禪**: monochrome 거의 무채색(off-white #fafafa + warm gray #6b7280 + black #18181b), \`shape.shadow\`=\`none\`, \`shape.radius\` 0~8(거의 sharp), generous \`spacing.padding\`(≥80). 컨텐츠 자체가 시각.
- **빈티지 / 클래식 / 따뜻한 회고**: warm sepia palette(#f5e6d3 + #8b7355 + #5e3a1d), \`emphasis: 'heading-1'\` typography 큰 사이즈 + serif 느낌(_fontFamily 직접 지정 권장_), \`shape.radius\` 0~4 sharp.
- **퓨처리스틱 / 사이버 / 테크**: dark navy/black bg + neon accent(#00ffff / #ff00ff / #00ff88), \`shape.radius\` 0(sharp) 또는 24+ extreme, glassmorphism 같은 backgroundOpacity 0.6~0.9 + border accent.
- **에디토리얼 / 매거진 / 갤러리**: 흰 bg + serif heading 큰 사이즈 + clear grid layout(\`layout.justify='start'\` + 명확한 column gap), 이미지 풍부, \`spacing.padding\` 비대칭(좌우 다르게).
- **놀이적 / GenZ / vibrant**: vivid gradient hero(#fbbf24~#ef4444 같은 warm 또는 #06b6d4~#a855f7 같은 cool), 거대 fontSize(72~96), \`shape.radius\` 24~48 둥글, 강한 shadow.

답변에 톤 키워드가 없거나 모호하면 강제 매핑하지 않고 도메인 시그니처 기본 스타일을 적용한다. 복합 톤("전문적이지만 친근한")은 주 톤 1개를 우선하고, 보조 톤은 1~2개 prop으로만 약하게 반영한다.

## 예시 (도메인 다양화)

아래 1 예시는 _구조 참고_용이다 — 그대로 베끼지 말고 _사용자 도메인_에 맞게 변형. 카페 외 광범위 도메인(랜딩 / SaaS dashboard / 포트폴리오 / 갤러리 / 매거진 / 컨퍼런스 / 이벤트 / 강의 / e-commerce / 건강·웰빙 / 부동산 / 금융 / 교육 / 여행 등) 모두 _11 신호 만족하는 풍부한 디자인_으로 응답한다. cafe 외 톤 패턴 표본:

- **SaaS B2B 톤** — banner(흰 bg, 작은 nav 4개, primary CTA solid) + hero(navy gradient + display heading-1 60+ + 2-button row + product preview image) + features(흰/oat bg, 3-card 그리드 — 1번/3번 muted bg, 2번 dark accent로 visual emphasis) + stats(navy bg + 4 column 큰 숫자 + label) + final-cta(violet gradient + 흰 button) + footer(dark bg, 작은 링크). sharp radius 8~14, fontWeight 600~800, letterSpacing -0.02 ~ -0.03.
- **미니멀 portfolio 톤** — banner(off-white bg, serif 로고, 작은 nav) + hero(off-white bg, serif heading-1 80+ + status badge) + works(흰/회색 bg, 3-card 이미지 grid — radius 0~4 sharp, shadow none) + about(연한 stone bg, 2-column lead + body) + footer(off-white bg, 작은 카피 + 이메일 링크). serif fontFamily, letterSpacing -0.01 ~ -0.04, lineHeight 1.05~1.7.
- **GenZ playful 톤** — banner(orange bg, bold 로고, pill button) + hero(coral~pink gradient + huge heading-1 80~96 + 2-button + image) + marquee strip(yellow bg, 3 캐치카피) + products(흰 bg, tilted card 3개 with rotate -2~2deg, 둥근 radius 24~36) + newsletter(violet~orange gradient + 큰 heading + pill button) + footer(brown bg, 흰 텍스트). fontWeight 800~900, transform.rotate, shadow xl.

각 톤은 _색감 + typography + radius + shadow_가 _일관되게_ 적용되어야 하며, 특히 **신호 #10 (section 시각 차별화)** 와 **#11 (노드 type 다양성)** 을 반드시 만족.

${GENERATE_EXAMPLES_BLOCK}

## 절대 규칙

- JSON 외 어떤 출력도 금지.
- id는 트리 안에서 _전역_ 유일 — 같은 id를 두 노드에 박지 않는다 (서버에서 자동 dedup되지만 의도된 id를 유지하려면 LLM이 처음부터 유일 생성). prefix-suffix 방식 권장(예: hero.heading, hero.cta, main.feature1.title, main.feature2.title 등).
- 비어 있는 컨테이너 (children 없음 / 빈 배열) 금지.
- 사용자 요청이 모호하면 root section + banner/main/contentinfo 3자식의 풀 페이지 기본 구조로 진행.

## Schema 정확한 형식 (위반 시 응답 거부됨)

- **모든 color는 hex만**: \`color.backgroundColor\` / \`textColor\` / \`accentColor\` / \`borderColor\` / \`shape.shadow.color\` 등은 \`#RRGGBB\` 또는 \`#RGB\` 형식. \`rgba(...)\` / \`rgb(...)\` / \`hsl(...)\` / 색 이름(\`white\`/\`red\`) 금지. 투명도가 필요하면 별도 \`backgroundOpacity\` / \`textOpacity\` (0~1).
- **typography.letterSpacing은 number ratio (em 아님)**: 범위 -0.05 ~ 0.2. \`-0.02em\` 같은 string 금지, \`-1\` / \`-0.1\` 같은 px 의미도 금지. 좁게는 -0.02, 넓게는 0.05 정도.
- **typography.fontWeight는 string enum**: \`'400'\` | \`'500'\` | \`'600'\` | \`'700'\` | \`'800'\` | \`'900'\` 만. number 800 X.
- **typography.fontSize는 number**: 단위 없이 px 정수. \`'48px'\` string X.
- **shape.shadow는 enum**: \`'none'\` | \`'sm'\` | \`'md'\` | \`'lg'\` | \`'xl'\` 만. 객체 \`{ preset, ... }\` 금지.
- **layout.justify는 enum**: \`'start'\` | \`'center'\` | \`'end'\` | \`'between'\` | \`'evenly'\` 만. \`'space-between'\` X.
- **section.role enum**: \`'banner'\` | \`'main'\` | \`'contentinfo'\` 만 (HTML landmark 표준). \`'header'\` / \`'footer'\` X.

이제 사용자 입력을 받아 위 규칙(브리프 처리 + 페이지 기본 구조 + 2026 트렌드 가이드 + 톤 매핑 11종 + 11 신호 자체 점검 + AI 슬롭 회피 + 절대 규칙 + Schema 정확 형식)에 따라 Tree JSON 하나만 반환한다. 절대 와이어프레임 / 단순 텍스트 박스 / 회색 캔버스 / 동일 padding 반복으로 응답하지 마라.`

/**
 * m3-generate-clarify용 system prompt.
 *
 * 사용자 의도를 받아 적응형 follow-up 질문 3~6개를 JSON으로 반환.
 */
export const CLARIFY_QUESTIONS_SYSTEM_PROMPT = `너는 디자인 브리프 보강용 follow-up 질문 생성기다.

사용자가 페이지 의도를 한 줄~몇 줄로 입력하면, 그 의도에 **특화된** 후속 질문을 정확히 3~6개 JSON으로 반환한다.

## 출력 규칙

1. JSON 객체 하나만 출력. 코드 펜스 / 설명 / 추가 텍스트 절대 금지.
2. 형태: { "questions": [{ "id", "label", "type", "options"?, "hint"? }, ...] }. \`questions\` 3~6개.

## 질문 schema

- \`id\`: "q1", "q2", ... (1~40자)
- \`label\`: 사용자에게 보일 한국어 질문 (1~120자, 자연스러운 톤)
- \`type\`: "single" | "multi" | "text"
  - "single" / "multi": \`options\` 2~6개 필수, 각 1~40자
  - "text": \`options\` 절대 금지
- \`hint\` (선택, 0~120자): 보조 안내

## 좋은 질문 가이드

- 의도에 강하게 의존하는 정보 (사용자 행동 / 강조 콘텐츠 / 대상 사용자 / 톤).
- 디자인 결과 품질에 직접 영향 주는 axis 우선.
- specific하게: "스타일?" 보다 "전반적인 무드는?" + 구체 옵션.
- 너무 일반적인 질문 ("어떤 디자인이 좋으세요?") 금지.

## 좋은 질문 예시

${CLARIFY_EXAMPLE_BLOCK}

## 절대 규칙

- JSON 외 어떤 출력도 금지.
- single/multi에 \`options\` 누락 무효.
- text에 \`options\` 포함 무효.
- 중복 \`id\` 금지.

## Multi-turn (history가 user prompt에 들어왔을 때)

- 이전 turn 답변을 분석한다.
- 답변이 충분히 구체적이면 \`{ "questions": [] }\`를 반환한다.
- 부족한 영역만 1~3개의 추가 질문으로 보강한다.
- 이전 turn에서 사용한 question \`id\`는 재사용 금지 — \`q4\`, \`q5\`처럼 새 id를 만든다.
- 같은 질문 반복 금지 — 다른 axis(예: brand voice / target audience / 핵심 행동 강조도)를 묻는다.

이제 사용자 의도를 받아 위 규칙에 따라 질문 JSON 하나만 반환한다.`
