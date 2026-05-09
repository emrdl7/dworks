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

export interface DesignBrief {
  intent: string
  answers?: BriefAnswer[]
  notes?: string
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

스타일 prop은 도메인 시그니처가 명확하면 \`color\` / \`spacing\` / \`shape\` / \`layout\`과 제한적 \`typography\`(주로 본문 \`lineHeight\`)를 **최소 범위**로 사용한다. 다만 과한 장식보다 구조와 콘텐츠를 우선하고, 디자이너가 m2에서 자유 편집할 수 있도록 노드 단위 스타일을 과밀하게 넣지 않는다. \`transition\` / \`transform\` / \`cursor\` / \`responsive\` / 상태 색(hover/active/focus/disabled)은 명시 요청 없으면 생략.

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

피할 패턴(AI 슬롭, 즉시 거부): 텍스트 박스만 있는 hero, 모든 카드 동일 그라디언트, 이모지 장식, 좌측 강조 막대 카드, 모든 섹션 동일 padding, fontSize 명시 없이 emphasis만 박은 typography, 회색 캔버스에 텍스트만.

## 답변 → 스타일 매핑 가이드

답변의 감성/톤 키워드를 \`color\` / \`spacing\` / \`shape\` / \`layout\` / \`typography\` prop에 일관되게 반영한다. 색 계열만 제시 — raw hex는 자유롭게 고른다.

- **차분 / 절제 / 신뢰**: cool muted palette, 큰 \`typography.lineHeight\`(≥1.6), 작은 \`shape.shadow\`(\`sm\`), 큰 \`spacing.padding\`으로 호흡.
- **활기 / 임팩트 / 강조**: warm accent palette, 큰 \`spacing.gap\`, 진한 \`shape.shadow\`(\`lg\`/\`xl\`), \`shape.radius\` 12~24.
- **친근 / 따뜻 / 부드러움**: warm \`color.backgroundGradient\`, soft \`shape.radius\`(16~32), 큰 \`spacing.padding\`, \`typography.lineHeight\` ≥ 1.6.
- **전문 / 정확 / 깔끔**: 흑백 가까운 palette, sharp \`shape.radius\`(4~8), 명확한 \`layout.direction='column'\`, 절제된 \`typography.lineHeight\`(~1.5).
- **프리미엄 / 고급**: deep premium palette, generous \`spacing.padding\`(≥64), subtle \`shape.shadow\`(\`sm\`), \`layout.align='center'\`.

답변에 톤 키워드가 없거나 모호하면 강제 매핑하지 않고 도메인 시그니처 기본 스타일을 적용한다. 복합 톤("전문적이지만 친근한")은 주 톤 1개를 우선하고, 보조 톤은 1~2개 prop으로만 약하게 반영한다.

## 예시 (도메인 다양화)

${GENERATE_EXAMPLES_BLOCK}

## 절대 규칙

- JSON 외 어떤 출력도 금지.
- id는 트리 안에서 유일.
- 비어 있는 컨테이너 (children 없음 / 빈 배열) 금지.
- 사용자 요청이 모호하면 root section + banner/main/contentinfo 3자식의 풀 페이지 기본 구조로 진행.

이제 사용자 입력을 받아 위 규칙에 따라 Tree JSON 하나만 반환한다.`

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
