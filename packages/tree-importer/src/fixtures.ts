// M0.5 수동 fixture 5개. PLAN.md M0.5 완료 기준의 입력 자산.
// 흡수기 본격 구현(M4 PoC) 이전, 트리 모델 자체의 표현력을 검증하기 위해 수동 작성.
//
// 5개 패턴:
// 1. simple-hero          — hero(text + cta)
// 2. card-grid            — section + cards 3개
// 3. notice-list          — section + ordered list
// 4. signup-form          — form + 라벨 텍스트 + submit
// 5. landing-composite    — hero + section(cards) + cta footer

import type { Tree } from '@dworks/tree'

export const simpleHero: Tree = {
  version: '1',
  root: {
    id: 'hero',
    type: 'hero',
    editKind: 'structure',
    children: [
      {
        id: 'hero.title',
        type: 'text',
        editKind: 'text',
        emphasis: 'heading-1',
        content: '디자인을 자연어로.',
      },
      {
        id: 'hero.subtitle',
        type: 'text',
        editKind: 'text',
        emphasis: 'body',
        content: '레퍼런스를 던지고 캔버스에서 다듬는 디자인툴.',
      },
      {
        id: 'hero.cta',
        type: 'button',
        editKind: 'text',
        label: '시안 만들기',
        variant: 'primary',
      },
    ],
  },
}

export const cardGrid: Tree = {
  version: '1',
  root: {
    id: 'grid',
    type: 'section',
    editKind: 'structure',
    role: 'feature-cards',
    children: [
      {
        id: 'grid.title',
        type: 'text',
        editKind: 'text',
        emphasis: 'heading-2',
        content: '핵심 기능',
      },
      {
        id: 'grid.card-1',
        type: 'card',
        editKind: 'structure',
        children: [
          {
            id: 'grid.card-1.title',
            type: 'text',
            editKind: 'text',
            emphasis: 'heading-3',
            content: '자연어 생성',
          },
          {
            id: 'grid.card-1.body',
            type: 'text',
            editKind: 'text',
            emphasis: 'body',
            content: '브리프와 레퍼런스만으로 시안을 만든다.',
          },
        ],
      },
      {
        id: 'grid.card-2',
        type: 'card',
        editKind: 'structure',
        children: [
          {
            id: 'grid.card-2.title',
            type: 'text',
            editKind: 'text',
            emphasis: 'heading-3',
            content: '캔버스 편집',
          },
          {
            id: 'grid.card-2.body',
            type: 'text',
            editKind: 'text',
            emphasis: 'body',
            content: '디자인 단위로 텍스트, 이미지, 구조를 즉시 수정한다.',
          },
        ],
      },
      {
        id: 'grid.card-3',
        type: 'card',
        editKind: 'structure',
        children: [
          {
            id: 'grid.card-3.title',
            type: 'text',
            editKind: 'text',
            emphasis: 'heading-3',
            content: '다중 익스포트',
          },
          {
            id: 'grid.card-3.body',
            type: 'text',
            editKind: 'text',
            emphasis: 'body',
            content: 'plain / jabworks / infoUX / KRDS 변환을 한 트리에서 분기.',
          },
        ],
      },
    ],
  },
}

export const noticeList: Tree = {
  version: '1',
  root: {
    id: 'notice',
    type: 'section',
    editKind: 'structure',
    role: 'notice-list',
    children: [
      {
        id: 'notice.title',
        type: 'text',
        editKind: 'text',
        emphasis: 'heading-2',
        content: '공지사항',
      },
      {
        id: 'notice.list',
        type: 'list',
        editKind: 'structure',
        variant: 'ordered',
        children: [
          {
            id: 'notice.item-1',
            type: 'text',
            editKind: 'text',
            content: '2026 사업 신청 마감 안내',
          },
          {
            id: 'notice.item-2',
            type: 'text',
            editKind: 'text',
            content: '시스템 점검 일정 변경',
          },
          {
            id: 'notice.item-3',
            type: 'text',
            editKind: 'text',
            content: '신규 서비스 베타 모집',
          },
        ],
      },
    ],
  },
}

export const signupForm: Tree = {
  version: '1',
  root: {
    id: 'signup',
    type: 'section',
    editKind: 'structure',
    role: 'signup',
    children: [
      {
        id: 'signup.title',
        type: 'text',
        editKind: 'text',
        emphasis: 'heading-2',
        content: '뉴스레터 구독',
      },
      {
        id: 'signup.form',
        type: 'form',
        editKind: 'structure',
        action: '/api/subscribe',
        method: 'post',
        children: [
          {
            id: 'signup.label',
            type: 'text',
            editKind: 'text',
            emphasis: 'caption',
            content: '이메일 주소를 입력하세요.',
          },
          {
            id: 'signup.submit',
            type: 'button',
            editKind: 'text',
            label: '구독하기',
            variant: 'primary',
          },
        ],
      },
    ],
  },
}

export const landingComposite: Tree = {
  version: '1',
  root: {
    id: 'landing',
    type: 'section',
    editKind: 'structure',
    role: 'landing',
    children: [
      {
        id: 'landing.hero',
        type: 'hero',
        editKind: 'structure',
        children: [
          {
            id: 'landing.hero.title',
            type: 'text',
            editKind: 'text',
            emphasis: 'heading-1',
            content: 'Dworks',
          },
          {
            id: 'landing.hero.tagline',
            type: 'text',
            editKind: 'text',
            emphasis: 'body',
            content: '디자인 + jabworks.',
          },
        ],
      },
      {
        id: 'landing.features',
        type: 'section',
        editKind: 'structure',
        role: 'features',
        children: [
          {
            id: 'landing.features.card',
            type: 'card',
            editKind: 'structure',
            children: [
              {
                id: 'landing.features.card.title',
                type: 'text',
                editKind: 'text',
                emphasis: 'heading-3',
                content: '캔버스 편집',
              },
            ],
          },
        ],
      },
      {
        id: 'landing.cta',
        type: 'button',
        editKind: 'text',
        label: '시작하기',
        variant: 'primary',
        href: '/start',
      },
    ],
  },
}

export const FIXTURES = {
  'simple-hero': simpleHero,
  'card-grid': cardGrid,
  'notice-list': noticeList,
  'signup-form': signupForm,
  'landing-composite': landingComposite,
} as const

export type FixtureName = keyof typeof FIXTURES
