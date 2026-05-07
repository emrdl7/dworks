// @dworks/edit-eval — D6 편집 평가 축 5개 루브릭.

import type { EditAxisId, EditViewportLabel } from './types.js'

export interface EditAxisRubric {
  id: EditAxisId
  title: string
  description: string
  rubric: Record<0 | 1 | 2 | 3 | 4 | 5, string>
  inputViewports: EditViewportLabel[]
  polishThreshold: number
}

export const EDIT_AXIS_IDS: readonly EditAxisId[] = [
  'selection-accuracy',
  'edit-control-fit',
  'layout-preservation-after-edit',
  'user-intent-preservation',
  'output-tidiness',
] as const

export const EDIT_AXIS_RUBRICS: Record<EditAxisId, EditAxisRubric> = {
  'selection-accuracy': {
    id: 'selection-accuracy',
    title: '선택 정확도',
    description:
      '사용자가 의도한 디자인 단위가 너무 크거나 작게 묶이지 않고 정확히 선택되는가.',
    rubric: {
      0: '선택 대상이 식별되지 않거나 엉뚱한 노드가 선택된다.',
      1: '큰 컨테이너만 선택되어 실제 수정 단위와 맞지 않는다.',
      2: '주요 단위는 잡히지만 텍스트/CTA 같은 하위 단위가 자주 빗나간다.',
      3: '대체로 맞지만 1~2개 단위에서 과대/과소 선택이 보인다.',
      4: '대부분의 텍스트/버튼/카드 단위가 사용 의도와 일치한다.',
      5: '선택 단위가 디자인 의도와 편집 가능 단위에 정확히 대응한다.',
    },
    inputViewports: ['desktop'],
    polishThreshold: 2,
  },
  'edit-control-fit': {
    id: 'edit-control-fit',
    title: '편집 컨트롤 적합도',
    description:
      '선택된 단위에 맞는 편집 컨트롤이 노출되고, 불필요하거나 위험한 컨트롤이 앞서지 않는가.',
    rubric: {
      0: '선택 단위와 무관한 컨트롤만 노출된다.',
      1: '필수 컨트롤이 없고 raw 입력에 가깝다.',
      2: '일부 컨트롤은 맞지만 핵심 조작이 빠져 있다.',
      3: '대부분 맞지만 컨트롤 우선순위나 라벨이 모호하다.',
      4: '선택 단위별 핵심 컨트롤이 명확하고 안전하다.',
      5: '컨트롤이 역할별로 정돈되어 반복 편집 흐름이 매끄럽다.',
    },
    inputViewports: ['desktop'],
    polishThreshold: 2,
  },
  'layout-preservation-after-edit': {
    id: 'layout-preservation-after-edit',
    title: '편집 후 레이아웃 보존',
    description:
      '편집 후에도 데스크톱/태블릿/모바일 레이아웃과 정보 구조가 깨지지 않는가.',
    rubric: {
      0: '편집 후 주요 레이아웃이 붕괴하거나 콘텐츠가 겹친다.',
      1: '한 viewport 이상에서 overflow, 겹침, CTA 손실이 발생한다.',
      2: '큰 붕괴는 없지만 간격/줄바꿈/위계가 눈에 띄게 어긋난다.',
      3: '대체로 보존되나 일부 viewport에서 균형이 약해진다.',
      4: '세 viewport 모두에서 정보 구조와 시각 균형이 유지된다.',
      5: '편집 후에도 원래보다 자연스러운 반응형 리듬을 유지한다.',
    },
    inputViewports: ['mobile', 'tablet', 'desktop'],
    polishThreshold: 2,
  },
  'user-intent-preservation': {
    id: 'user-intent-preservation',
    title: '사용자 의도 보존',
    description:
      '고도화나 재생성이 사용자가 직접 수정한 문구/선택/구조를 덮어쓰지 않는가.',
    rubric: {
      0: '사용자 수정 내용이 사라지거나 정반대로 바뀐다.',
      1: '핵심 수정 일부가 덮어써진다.',
      2: '대부분 남지만 중요한 뉘앙스나 CTA 의도가 약해진다.',
      3: '의도는 보존되나 일부 표현이 불필요하게 변한다.',
      4: '사용자 수정이 명확히 유지되고 주변만 정돈된다.',
      5: '사용자 의도를 중심으로 더 설득력 있게 확장된다.',
    },
    inputViewports: ['desktop'],
    polishThreshold: 2,
  },
  'output-tidiness': {
    id: 'output-tidiness',
    title: '반복 편집 후 정돈감',
    description:
      '3회 이상 편집 시퀀스 후에도 시각적 일관성, 간격 리듬, 위계가 유지되는가.',
    rubric: {
      0: '반복 편집 후 결과가 산만하거나 사용 불가능하다.',
      1: '간격/정렬/위계가 여러 곳에서 무너진다.',
      2: '기능은 유지되지만 시각적 정돈감이 낮다.',
      3: '대체로 정돈되어 있으나 일부 리듬이 어색하다.',
      4: '반복 편집 후에도 간격과 위계가 안정적이다.',
      5: '여러 편집이 누적되어도 결과물이 하나의 완성된 시안처럼 보인다.',
    },
    inputViewports: ['mobile', 'desktop'],
    polishThreshold: 2,
  },
}

export function listEditAxes(): EditAxisRubric[] {
  return Object.values(EDIT_AXIS_RUBRICS)
}

export function getEditAxisRubric(id: EditAxisId): EditAxisRubric {
  return EDIT_AXIS_RUBRICS[id]
}
