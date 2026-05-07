// @dworks/eval — P0 평가 축 7개의 루브릭 정의.
// DECISIONS D5 (각 축 정의) + D8 (vision LLM judge 0–5 + 축별 최저점 추적).
//
// 각 축은:
//  - id: AxisId enum
//  - title: 사람이 읽는 라벨
//  - description: 평가 의도 한 줄
//  - rubric: 0–5 각 점수의 의미. judge prompt에 그대로 삽입.
//  - inputViewports: 어느 viewport(들)을 보고 평가하는가.
//  - polishThreshold: 이 점수 이하는 자동 design-polish-needed.

import type { AxisId } from './types.js'

export type ViewportLabel = 'mobile' | 'tablet' | 'desktop'

export interface AxisRubric {
  id: AxisId
  title: string
  description: string
  rubric: Record<0 | 1 | 2 | 3 | 4 | 5, string>
  inputViewports: ViewportLabel[]
  polishThreshold: number
}

const RUBRIC_5_GENERIC = {
  0: '판단 자체가 불가능 — 렌더 깨짐, 빈 화면, 또는 의미 없는 요소만 있음.',
  1: '실제 시안이 아님 — 와이어프레임/배치만 잡힌 placeholder 수준.',
  2: '시안 형태는 있으나 큰 결함 — 디자인 의도가 거의 보이지 않음.',
  3: '평균 — 주요 요소는 있지만 1~2 영역에서 명백한 약점.',
  4: '양호 — 의도가 명확히 전달되고 작은 다듬기만 남음.',
  5: '훌륭 — 시안 단독으로 의도/감성/시각 위계가 모두 강함.',
} as const

export const AXIS_RUBRICS: Record<AxisId, AxisRubric> = {
  'non-wireframe': {
    id: 'non-wireframe',
    title: '와이어프레임성 제거',
    description:
      '단순 박스, 균일 카드 반복, 회색 placeholder 느낌에 머물지 않고 실제 시안처럼 보이는가.',
    rubric: {
      0: '대부분 회색 박스/placeholder. 실제 콘텐츠 없음.',
      1: '와이어프레임 그대로. 텍스트는 있으나 placeholder 느낌이 강함.',
      2: '몇몇 영역에 디자인 시도. 다수가 균일 카드 반복.',
      3: '실제 시안 느낌 있으나 일부 영역이 와이어프레임 잔존.',
      4: '대부분 시안. 와이어프레임 잔존 거의 없음.',
      5: '완전한 시안. 어느 영역을 봐도 실제 디자인된 결과.',
    },
    inputViewports: ['desktop', 'mobile'],
    polishThreshold: 2,
  },
  'first-viewport-richness': {
    id: 'first-viewport-richness',
    title: '첫 화면 임팩트',
    description:
      '첫 viewport에서 브랜드/서비스/핵심 행동(CTA)이 즉시 읽히고 시각적 초점이 있는가.',
    rubric: {
      0: '첫 화면에 콘텐츠가 거의 없음.',
      1: '브랜드/서비스 식별 어려움. CTA 없음.',
      2: '서비스는 식별되나 CTA가 약함, 시각 초점 부재.',
      3: '핵심 메시지 + CTA 보이지만 위계가 약함.',
      4: '브랜드/메시지/CTA 모두 명확. 시각 초점 1개 명확.',
      5: '한눈에 누가/무엇을/왜 알 수 있고 다음 행동이 자연스럽게 유도됨.',
    },
    inputViewports: ['desktop', 'mobile'],
    polishThreshold: 2,
  },
  'emotional-fit': {
    id: 'emotional-fit',
    title: '감성 적합도',
    description:
      'brief 감성 프리셋(공공/스타트업/신뢰감/따뜻함 등)이 색·타이포·이미지·카피·CTA에 일관되게 반영됐는가.',
    rubric: {
      0: '감성 방향과 정반대 (예: 신뢰감 brief인데 장난스러운 색/카피).',
      1: '감성 방향 무시. 일반 템플릿.',
      2: '일부 요소만 감성 일치. 색/카피/이미지 중 한두 개 어긋남.',
      3: '대체로 일치. 1~2 요소가 약함.',
      4: '색·타이포·카피·이미지가 일관되게 감성 표현.',
      5: '감성이 모든 결정(레이아웃, 마이크로카피, CTA 톤)에 깊이 반영.',
    },
    inputViewports: ['desktop'],
    polishThreshold: 2,
  },
  'visual-variety': {
    id: 'visual-variety',
    title: '시각 다양성',
    description:
      '섹션 간 레이아웃·리듬·밀도 변화가 있는가. 같은 카드 패턴이 반복되지 않는가.',
    rubric: {
      0: '한 가지 레이아웃의 반복.',
      1: '카드 그리드만 반복. 다른 패턴 없음.',
      2: '2~3 패턴 있으나 단조로움.',
      3: '대체로 다양. 한두 섹션이 균일.',
      4: '섹션마다 다른 레이아웃·리듬. 시각 흐름 있음.',
      5: '레이아웃 다양성 + 의도된 리듬 + 밀도 변화로 페이지 전체가 살아있음.',
    },
    inputViewports: ['desktop'],
    polishThreshold: 2,
  },
  'brand-reference-fidelity': {
    id: 'brand-reference-fidelity',
    title: '브랜드 / 레퍼런스 충실도',
    description:
      '업로드된 로고/브랜드 자산이 정확히 표현되고(워드마크/심볼/콤비네이션 구분), 색감이 왜곡되지 않으며 중복/오용이 없는가.',
    rubric: {
      0: '브랜드 자산 무시 또는 잘못된 자산 표시.',
      1: '브랜드 표시는 있으나 색감/형태가 어긋남.',
      2: '큰 결함은 없으나 부정확함 (예: 워드마크 옆 중복 텍스트).',
      3: '대체로 정확. 한 곳에서 오용.',
      4: '브랜드 자산 정확. 색감 일치.',
      5: '브랜드가 디자인의 자연스러운 일부로 통합.',
    },
    inputViewports: ['desktop'],
    polishThreshold: 2,
  },
  'responsive-design-intent-preservation': {
    id: 'responsive-design-intent-preservation',
    title: '반응형 디자인 의도 보존',
    description:
      '모바일/태블릿/데스크톱에서 정보 구조와 시각 의도가 유지되는가.',
    rubric: {
      0: '모바일에서 레이아웃 깨짐 또는 정보 손실.',
      1: '모바일은 단순 column 변환만, 의도 보존 약함.',
      2: 'viewport 별 차이는 있으나 위계가 흐트러짐.',
      3: '대체로 보존. 한 viewport에서 약함.',
      4: '세 viewport 모두에서 의도 일관.',
      5: 'viewport마다 의도된 강조 변화 + 정보 구조 일관.',
    },
    inputViewports: ['mobile', 'tablet', 'desktop'],
    polishThreshold: 2,
  },
  editability: {
    id: 'editability',
    title: '편집 가능성',
    description:
      '사용자가 편집할 만한 디자인 단위(텍스트/이미지/카드/섹션/CTA)가 적절히 분리되어 선택/수정 가능한가. (P0.5의 selection-accuracy 등 5개 세부 축은 별도)',
    rubric: {
      0: '편집 단위가 잡히지 않음.',
      1: '큰 영역만 잡히고 세부 단위 분리 안 됨.',
      2: '주요 단위는 있으나 일부 텍스트가 통째로 묶임.',
      3: '대체로 분리. 1~2 영역에서 단위가 너무 큼.',
      4: '텍스트/이미지/CTA/카드 단위 모두 적절.',
      5: '편집 단위가 디자인 의도와 정확히 일치 (data-dw-edit 활용).',
    },
    inputViewports: ['desktop'],
    polishThreshold: 2,
  },
}

export function listAxes(): AxisRubric[] {
  return Object.values(AXIS_RUBRICS)
}

// 축 ID로 루브릭 가져오기.
export function getAxisRubric(id: AxisId): AxisRubric {
  return AXIS_RUBRICS[id]
}

// generic rubric 사용 안 하더라도 export로 보존 (개별 축 정의에서 참고용).
export { RUBRIC_5_GENERIC }
