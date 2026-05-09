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
        id: 'landing.hero',
        editKind: 'structure',
        type: 'hero',
        children: [
          {
            id: 'hero.title',
            editKind: 'text',
            type: 'text',
            content: '도시의 숨결, 한 잔의 여유',
            emphasis: 'heading-1',
          },
          {
            id: 'hero.subtitle',
            editKind: 'text',
            type: 'text',
            content: '직접 로스팅한 원두로 매일 아침을 깨웁니다.',
            emphasis: 'body',
          },
          {
            id: 'hero.image',
            editKind: 'media',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
            alt: '원목 테이블 위 따뜻한 라떼 한 잔',
            aspectRatio: 'wide',
          },
          {
            id: 'hero.cta',
            editKind: 'text',
            type: 'button',
            label: '메뉴 보기',
            variant: 'primary',
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
        id: 'pricing.section',
        editKind: 'structure',
        type: 'section',
        children: [
          {
            id: 'pricing.title',
            editKind: 'text',
            type: 'text',
            content: '팀에 맞는 요금제를 선택하세요',
            emphasis: 'heading-1',
          },
          {
            id: 'pricing.lead',
            editKind: 'text',
            type: 'text',
            content: '언제든지 업그레이드하거나 취소할 수 있습니다.',
            emphasis: 'body',
          },
          {
            id: 'pricing.plans',
            editKind: 'structure',
            type: 'section',
            children: [
              {
                id: 'pricing.plan.starter',
                editKind: 'structure',
                type: 'card',
                children: [
                  {
                    id: 'pricing.plan.starter.name',
                    editKind: 'text',
                    type: 'text',
                    content: 'Starter',
                    emphasis: 'heading-2',
                  },
                  {
                    id: 'pricing.plan.starter.price',
                    editKind: 'text',
                    type: 'text',
                    content: '월 9,000원',
                    emphasis: 'heading-3',
                  },
                  {
                    id: 'pricing.plan.starter.cta',
                    editKind: 'text',
                    type: 'button',
                    label: '시작하기',
                    variant: 'secondary',
                  },
                ],
              },
              {
                id: 'pricing.plan.pro',
                editKind: 'structure',
                type: 'card',
                children: [
                  {
                    id: 'pricing.plan.pro.name',
                    editKind: 'text',
                    type: 'text',
                    content: 'Pro',
                    emphasis: 'heading-2',
                  },
                  {
                    id: 'pricing.plan.pro.price',
                    editKind: 'text',
                    type: 'text',
                    content: '월 29,000원',
                    emphasis: 'heading-3',
                  },
                  {
                    id: 'pricing.plan.pro.cta',
                    editKind: 'text',
                    type: 'button',
                    label: '14일 무료 체험',
                    variant: 'primary',
                  },
                ],
              },
              {
                id: 'pricing.plan.enterprise',
                editKind: 'structure',
                type: 'card',
                children: [
                  {
                    id: 'pricing.plan.enterprise.name',
                    editKind: 'text',
                    type: 'text',
                    content: 'Enterprise',
                    emphasis: 'heading-2',
                  },
                  {
                    id: 'pricing.plan.enterprise.price',
                    editKind: 'text',
                    type: 'text',
                    content: '맞춤 견적',
                    emphasis: 'heading-3',
                  },
                  {
                    id: 'pricing.plan.enterprise.cta',
                    editKind: 'text',
                    type: 'button',
                    label: '문의하기',
                    variant: 'ghost',
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
        id: 'article.section',
        editKind: 'structure',
        type: 'section',
        children: [
          {
            id: 'article.heading',
            editKind: 'text',
            type: 'text',
            content: '제주의 가을, 오름 위를 걷다',
            emphasis: 'heading-1',
          },
          {
            id: 'article.byline',
            editKind: 'text',
            type: 'text',
            content: '글·사진 김도현 · 6분 읽기',
            emphasis: 'caption',
          },
          {
            id: 'article.cover',
            editKind: 'media',
            type: 'image',
            src: 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e',
            alt: '제주 오름 정상에서 바라본 가을 하늘과 억새 풍경',
            aspectRatio: 'wide',
          },
          {
            id: 'article.intro',
            editKind: 'text',
            type: 'text',
            content:
              '바람이 차가워지면 제주의 오름은 다른 얼굴로 바뀐다. 억새가 은빛으로 출렁이고, 발 아래 도시는 안개에 잠긴다.',
            emphasis: 'body',
          },
          {
            id: 'article.section1.title',
            editKind: 'text',
            type: 'text',
            content: '새벽의 다랑쉬',
            emphasis: 'heading-2',
          },
          {
            id: 'article.section1.body',
            editKind: 'text',
            type: 'text',
            content:
              '동이 트기 전에 다랑쉬오름 입구에 도착했다. 분화구를 한 바퀴 도는 동안 능선이 점점 황금빛으로 물들었다.',
            emphasis: 'body',
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

스타일 prop (color/spacing/shape/layout/typography/transition/transform)은 사용자가 명시적으로 요청하지 않았다면 **생략** — 디자이너가 m2에서 자유 편집한다.

## 디자인 브리프 처리

사용자 메시지는 brief 형태일 수 있다:
- **의도**: 페이지 목적 (필수, 가장 중요).
- **추가 질문 답변**: \`- 질문 라벨: 답변\` 목록. 답변은 단일 문자열 또는 ', '로 결합된 다중 선택. 의도와 답변을 종합해 root 노드 종류 / children 구성 / content 디테일 결정.
- **브랜드 / 참조 메모**: brand voice / 참조 자료.

## 예시 (도메인 다양화)

${GENERATE_EXAMPLES_BLOCK}

## 절대 규칙

- JSON 외 어떤 출력도 금지.
- id는 트리 안에서 유일.
- 비어 있는 컨테이너 (children 없음 / 빈 배열) 금지.
- 사용자 요청이 모호하면 합리적 기본 (hero 또는 section + 1~3 child)으로 진행.

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

이제 사용자 의도를 받아 위 규칙에 따라 질문 JSON 하나만 반환한다.`
