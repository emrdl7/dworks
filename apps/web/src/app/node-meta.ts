// 노드 type별 한국어 라벨 + lucide icon 매핑.
// page.tsx 분할(Phase 6)에서 분리 — 다양한 컴포넌트(Layer panel / Inspector /
// SelectableNode badge 등)가 공유.

import {
  AppWindow,
  ChevronsUpDown,
  FormInput,
  GalleryHorizontal,
  ImageIcon,
  Layers,
  List,
  MousePointer,
  PanelTop,
  Square,
  SquareStack,
  Type,
  type LucideIcon,
} from 'lucide-react'

import type { TreeNode } from '@dworks/tree'

export const nodeTypeLabels: Record<TreeNode['type'], string> = {
  text: '텍스트',
  button: '버튼',
  image: '이미지',
  carousel: '이미지 carousel',
  tabs: '탭',
  accordion: '아코디언',
  modal: '모달',
  section: '섹션',
  hero: '히어로',
  card: '카드',
  list: '목록',
  form: '폼',
}

export const nodeTypeIcons: Record<TreeNode['type'], LucideIcon> = {
  text: Type,
  button: MousePointer,
  image: ImageIcon,
  carousel: GalleryHorizontal,
  tabs: AppWindow,
  accordion: ChevronsUpDown,
  modal: Layers,
  section: PanelTop,
  hero: SquareStack,
  card: Square,
  list: List,
  form: FormInput,
}

// 노드 타입 변환 매트릭스 — UX-03 호환 변환 source of truth.
// UI-SPEC.md line 137-148 + CONTEXT.md D-06 잠금.
export const nodeTypeConversionMatrix: Record<TreeNode['type'], readonly TreeNode['type'][]> = {
  text: ['button'],
  button: ['text'],
  section: ['hero', 'card'],
  hero: ['section', 'card'],
  card: ['section', 'hero'],
  list: ['accordion'],
  accordion: ['list'],
  image: ['carousel'],
  carousel: ['image'],
  form: [],
  tabs: [],
  modal: [],
}

// 비호환 사유 — 컨텍스트 메뉴 tooltip + ⌘K disabledReason 에서 사용.
export const nodeTypeConversionDisabledReason: Partial<Record<TreeNode['type'], string>> = {
  form: '입력 폼은 다른 노드로 변환할 수 없습니다',
  modal: '모달은 컨테이너 전용입니다',
  tabs: '탭은 다른 타입으로 변환할 수 없습니다',
}

// 호환 검사 헬퍼 — 컨텍스트 메뉴/명령 팔레트/인스펙터 dropdown 모두 호출 (DRY).
export function canConvertNodeType(
  fromType: TreeNode['type'],
  toType: TreeNode['type'],
): boolean {
  return nodeTypeConversionMatrix[fromType]?.includes(toType) ?? false
}
