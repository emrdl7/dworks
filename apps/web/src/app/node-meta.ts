// 노드 type별 한국어 라벨 + lucide icon 매핑.
// page.tsx 분할(Phase 6)에서 분리 — 다양한 컴포넌트(Layer panel / Inspector /
// SelectableNode badge 등)가 공유.

import {
  AppWindow,
  ChevronsUpDown,
  FormInput,
  GalleryHorizontal,
  ImageIcon,
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
  section: PanelTop,
  hero: SquareStack,
  card: Square,
  list: List,
  form: FormInput,
}
