import type {
  CarouselNode,
  FocalPoint,
  ImageAspectRatio,
  ImageNode,
  ImagePresentation,
  NodeColor,
  NodeLayout,
  Shape,
  Spacing,
  StyleTokens,
  TextNode,
  Tree,
  TreeNode,
  Typography,
} from '@dworks/tree'

type ContainerNode = Extract<TreeNode, { children: TreeNode[] }>

export interface UpdateTextOperation {
  type: 'updateText'
  nodeId: string
  content: string
}

export interface UpdateTextTypographyOperation {
  type: 'updateTextTypography'
  nodeId: string
  patch: Partial<Typography>
}

export interface UpdateSpacingOperation {
  type: 'updateSpacing'
  nodeId: string
  patch: Partial<Spacing>
}

export interface UpdateShapeOperation {
  type: 'updateShape'
  nodeId: string
  patch: Partial<Shape>
}

export interface UpdateColorOperation {
  type: 'updateColor'
  nodeId: string
  patch: Partial<NodeColor>
}

export interface UpdateLayoutOperation {
  type: 'updateLayout'
  nodeId: string
  patch: Partial<NodeLayout>
}

export interface NodeMetaPatch {
  hidden?: TreeNode['hidden']
  disabled?: TreeNode['disabled']
  opacity?: TreeNode['opacity']
  pointerEvents?: TreeNode['pointerEvents']
  transition?: TreeNode['transition']
  transform?: TreeNode['transform']
  cursor?: TreeNode['cursor']
  position?: TreeNode['position']
  inset?: TreeNode['inset']
  hideOn?: TreeNode['hideOn']
  responsiveStyle?: TreeNode['responsiveStyle']
}

export interface UpdateNodeMetaOperation {
  type: 'updateNodeMeta'
  nodeId: string
  patch: NodeMetaPatch
}

export interface UpdateButtonLabelOperation {
  type: 'updateButtonLabel'
  nodeId: string
  label: string
}

export interface UpdateImageOperation {
  type: 'updateImage'
  nodeId: string
  src?: string
  alt?: string
  aspectRatio?: ImageAspectRatio
  focalPoint?: FocalPoint
  presentation?: Partial<ImagePresentation>
}

export interface UpdateCarouselOperation {
  type: 'updateCarousel'
  nodeId: string
  // 부분 업데이트 — 미정의 키는 변경 안 함.
  items?: CarouselNode['items']
  aspectRatio?: ImageAspectRatio
  auto?: boolean
  intervalMs?: number
  showDots?: boolean
  showArrows?: boolean
  previewIndex?: number
}

export interface MoveNodeOperation {
  type: 'moveNode'
  nodeId: string
  direction: 'up' | 'down'
}

export interface DuplicateNodeOperation {
  type: 'duplicateNode'
  nodeId: string
  newNodeId?: string
}

export interface DeleteNodeOperation {
  type: 'deleteNode'
  nodeId: string
}

export interface UpdateStyleTokensOperation {
  type: 'updateStyleTokens'
  patch: Partial<StyleTokens>
}

type ContentEditOperation =
  | UpdateTextOperation
  | UpdateTextTypographyOperation
  | UpdateSpacingOperation
  | UpdateShapeOperation
  | UpdateColorOperation
  | UpdateLayoutOperation
  | UpdateNodeMetaOperation
  | UpdateButtonLabelOperation
  | UpdateImageOperation
  | UpdateCarouselOperation

type StructureEditOperation =
  | MoveNodeOperation
  | DuplicateNodeOperation
  | DeleteNodeOperation

type StyleEditOperation = UpdateStyleTokensOperation

export type EditOperation =
  | ContentEditOperation
  | StructureEditOperation
  | StyleEditOperation

interface EditState {
  matched: boolean
}

export function updateText(
  tree: Tree,
  nodeId: string,
  content: string,
): Tree {
  return applyEditOperation(tree, { type: 'updateText', nodeId, content })
}

export function updateTextTypography(
  tree: Tree,
  nodeId: string,
  patch: Partial<Typography>,
): Tree {
  return applyEditOperation(tree, {
    type: 'updateTextTypography',
    nodeId,
    patch,
  })
}

export function updateSpacing(
  tree: Tree,
  nodeId: string,
  patch: Partial<Spacing>,
): Tree {
  return applyEditOperation(tree, { type: 'updateSpacing', nodeId, patch })
}

export function updateShape(
  tree: Tree,
  nodeId: string,
  patch: Partial<Shape>,
): Tree {
  return applyEditOperation(tree, { type: 'updateShape', nodeId, patch })
}

export function updateColor(
  tree: Tree,
  nodeId: string,
  patch: Partial<NodeColor>,
): Tree {
  return applyEditOperation(tree, { type: 'updateColor', nodeId, patch })
}

export function updateLayout(
  tree: Tree,
  nodeId: string,
  patch: Partial<NodeLayout>,
): Tree {
  return applyEditOperation(tree, { type: 'updateLayout', nodeId, patch })
}

export function updateNodeMeta(
  tree: Tree,
  nodeId: string,
  patch: NodeMetaPatch,
): Tree {
  return applyEditOperation(tree, { type: 'updateNodeMeta', nodeId, patch })
}

export function replaceTextById(
  tree: Tree,
  nodeId: string,
  value: string,
): Tree {
  return updateText(tree, nodeId, value)
}

export function updateButtonLabel(
  tree: Tree,
  nodeId: string,
  label: string,
): Tree {
  return applyEditOperation(tree, { type: 'updateButtonLabel', nodeId, label })
}

export function updateImage(
  tree: Tree,
  nodeId: string,
  patch: Omit<UpdateImageOperation, 'type' | 'nodeId'>,
): Tree {
  return applyEditOperation(tree, { type: 'updateImage', nodeId, ...patch })
}

export function updateCarousel(
  tree: Tree,
  nodeId: string,
  patch: Omit<UpdateCarouselOperation, 'type' | 'nodeId'>,
): Tree {
  return applyEditOperation(tree, { type: 'updateCarousel', nodeId, ...patch })
}

export function moveNode(
  tree: Tree,
  nodeId: string,
  direction: MoveNodeOperation['direction'],
): Tree {
  return applyEditOperation(tree, { type: 'moveNode', nodeId, direction })
}

export function duplicateNode(
  tree: Tree,
  nodeId: string,
  newNodeId?: string,
): Tree {
  return applyEditOperation(tree, { type: 'duplicateNode', nodeId, newNodeId })
}

export function deleteNode(tree: Tree, nodeId: string): Tree {
  return applyEditOperation(tree, { type: 'deleteNode', nodeId })
}

export type ContainerNodeType = 'section' | 'hero' | 'card' | 'list' | 'form'

// 컨테이너 노드의 마지막 자식으로 새 컨테이너(빈 컨테이너 schema 금지 — 기본 텍스트
// 자식 1개와 함께 생성) 추가. 사용자 mandate: _그룹 노드 수동 추가_.
export function addContainerChild(
  tree: Tree,
  parentId: string,
  containerType: ContainerNodeType,
  newId: string,
  initialTextChildId: string,
): Tree {
  const existingIds = collectNodeIdsLocal(tree.root)
  if (existingIds.has(newId)) {
    throw new Error(`tree edit failed: id already exists: ${newId}`)
  }
  if (existingIds.has(initialTextChildId)) {
    throw new Error(
      `tree edit failed: initial child id already exists: ${initialTextChildId}`,
    )
  }
  const initialChild: TreeNode = {
    id: initialTextChildId,
    editKind: 'text',
    type: 'text',
    content: '내용',
  }
  const newChild = {
    id: newId,
    editKind: 'structure',
    type: containerType,
    children: [initialChild],
  } as TreeNode
  const state: EditState = { matched: false }
  const root = walkAndAddChild(tree.root, parentId, newChild, state)
  if (!state.matched) {
    throw new Error(`tree edit failed: parent not found: ${parentId}`)
  }
  return { ...tree, root }
}

// 컨테이너 노드 type 변경 (section ↔ card ↔ list 등). children 보존, 공통 props
// 보존, type별 특수 props(예: section.role)는 drop.
export function changeContainerNodeType(
  tree: Tree,
  nodeId: string,
  nextType: ContainerNodeType,
): Tree {
  return { ...tree, root: walkAndConvertContainer(tree.root, nodeId, nextType) }
}

function walkAndConvertContainer(
  node: TreeNode,
  nodeId: string,
  nextType: ContainerNodeType,
): TreeNode {
  if (node.id === nodeId) {
    if (
      node.type !== 'section' &&
      node.type !== 'hero' &&
      node.type !== 'card' &&
      node.type !== 'list' &&
      node.type !== 'form'
    ) {
      return node
    }
    if (node.type === nextType) return node
    const {
      id,
      editKind,
      hidden,
      opacity,
      pointerEvents,
      responsive,
      styleTokens,
      spacing,
      shape,
      color,
      layout,
      transition,
      transform,
      cursor,
      children,
    } = node
    return {
      id,
      editKind,
      type: nextType,
      children,
      ...(hidden !== undefined ? { hidden } : {}),
      ...(opacity !== undefined ? { opacity } : {}),
      ...(pointerEvents !== undefined ? { pointerEvents } : {}),
      ...(responsive !== undefined ? { responsive } : {}),
      ...(styleTokens !== undefined ? { styleTokens } : {}),
      ...(spacing !== undefined ? { spacing } : {}),
      ...(shape !== undefined ? { shape } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(layout !== undefined ? { layout } : {}),
      ...(transition !== undefined ? { transition } : {}),
      ...(transform !== undefined ? { transform } : {}),
      ...(cursor !== undefined ? { cursor } : {}),
    } as TreeNode
  }
  if (
    node.type === 'section' ||
    node.type === 'hero' ||
    node.type === 'card' ||
    node.type === 'list' ||
    node.type === 'form'
  ) {
    return {
      ...node,
      children: node.children.map((child) =>
        walkAndConvertContainer(child, nodeId, nextType),
      ),
    }
  }
  return node
}

// 컨테이너 노드의 마지막 자식으로 leaf 노드 추가. 사용자 mandate: _노드 수동 추가_.
// LLM 의존을 줄이기 위한 free-form 편집 진입점.
export function addLeafChild(
  tree: Tree,
  parentId: string,
  childType: LeafNodeType,
  newId: string,
): Tree {
  const existingIds = collectNodeIdsLocal(tree.root)
  if (existingIds.has(newId)) {
    throw new Error(`tree edit failed: id already exists: ${newId}`)
  }
  const newChild = createDefaultLeafNode(newId, childType)
  const state: EditState = { matched: false }
  const root = walkAndAddChild(tree.root, parentId, newChild, state)
  if (!state.matched) {
    throw new Error(`tree edit failed: parent not found: ${parentId}`)
  }
  return { ...tree, root }
}

function createDefaultLeafNode(id: string, type: LeafNodeType): TreeNode {
  if (type === 'text') {
    return { id, editKind: 'text', type: 'text', content: '새 텍스트' }
  }
  if (type === 'button') {
    return { id, editKind: 'text', type: 'button', label: '버튼' }
  }
  return { id, editKind: 'media', type: 'image', src: '', alt: '이미지' }
}

// 선택 노드 _다음에_ 형제 leaf 추가 — 같은 부모, 선택 노드 인덱스 + 1 위치.
// root 노드는 부모가 없으므로 형제 추가 불가 → 명시적 에러.
export function addLeafSibling(
  tree: Tree,
  siblingNodeId: string,
  childType: LeafNodeType,
  newId: string,
): Tree {
  if (siblingNodeId === tree.root.id) {
    throw new Error(`tree edit failed: cannot add sibling to root: ${siblingNodeId}`)
  }
  const existingIds = collectNodeIdsLocal(tree.root)
  if (existingIds.has(newId)) {
    throw new Error(`tree edit failed: id already exists: ${newId}`)
  }
  const newChild = createDefaultLeafNode(newId, childType)
  const state: EditState = { matched: false }
  const root = walkAndAddSibling(tree.root, siblingNodeId, newChild, state)
  if (!state.matched) {
    throw new Error(`tree edit failed: sibling not found: ${siblingNodeId}`)
  }
  return { ...tree, root }
}

// 선택 노드 _다음에_ 컨테이너 형제 추가 — 빈 컨테이너 schema 위반이라 default text 자식 1개 동시 생성.
export function addContainerSibling(
  tree: Tree,
  siblingNodeId: string,
  containerType: ContainerNodeType,
  newId: string,
  initialTextChildId: string,
): Tree {
  if (siblingNodeId === tree.root.id) {
    throw new Error(`tree edit failed: cannot add sibling to root: ${siblingNodeId}`)
  }
  const existingIds = collectNodeIdsLocal(tree.root)
  if (existingIds.has(newId)) {
    throw new Error(`tree edit failed: id already exists: ${newId}`)
  }
  if (existingIds.has(initialTextChildId)) {
    throw new Error(
      `tree edit failed: initial child id already exists: ${initialTextChildId}`,
    )
  }
  const initialChild: TreeNode = {
    id: initialTextChildId,
    editKind: 'text',
    type: 'text',
    content: '내용',
  }
  const newChild = {
    id: newId,
    editKind: 'structure',
    type: containerType,
    children: [initialChild],
  } as TreeNode
  const state: EditState = { matched: false }
  const root = walkAndAddSibling(tree.root, siblingNodeId, newChild, state)
  if (!state.matched) {
    throw new Error(`tree edit failed: sibling not found: ${siblingNodeId}`)
  }
  return { ...tree, root }
}

function walkAndAddSibling(
  node: TreeNode,
  siblingNodeId: string,
  newChild: TreeNode,
  state: EditState,
): TreeNode {
  if (
    node.type !== 'section' &&
    node.type !== 'hero' &&
    node.type !== 'card' &&
    node.type !== 'list' &&
    node.type !== 'form'
  ) {
    return node
  }
  const idx = node.children.findIndex((c) => c.id === siblingNodeId)
  if (idx >= 0) {
    state.matched = true
    return {
      ...node,
      children: [
        ...node.children.slice(0, idx + 1),
        newChild,
        ...node.children.slice(idx + 1),
      ],
    }
  }
  return {
    ...node,
    children: node.children.map((child) =>
      state.matched ? child : walkAndAddSibling(child, siblingNodeId, newChild, state),
    ),
  }
}

function walkAndAddChild(
  node: TreeNode,
  parentId: string,
  newChild: TreeNode,
  state: EditState,
): TreeNode {
  if (node.id === parentId) {
    if (
      node.type === 'section' ||
      node.type === 'hero' ||
      node.type === 'card' ||
      node.type === 'list' ||
      node.type === 'form'
    ) {
      state.matched = true
      return { ...node, children: [...node.children, newChild] }
    }
    throw new Error(
      `tree edit failed: parent is not a container: ${parentId} (${node.type})`,
    )
  }
  if (
    node.type === 'section' ||
    node.type === 'hero' ||
    node.type === 'card' ||
    node.type === 'list' ||
    node.type === 'form'
  ) {
    return {
      ...node,
      children: node.children.map((child) =>
        state.matched
          ? child
          : walkAndAddChild(child, parentId, newChild, state),
      ),
    }
  }
  return node
}

function collectNodeIdsLocal(
  node: TreeNode,
  ids: Set<string> = new Set(),
): Set<string> {
  ids.add(node.id)
  if (
    node.type === 'section' ||
    node.type === 'hero' ||
    node.type === 'card' ||
    node.type === 'list' ||
    node.type === 'form'
  ) {
    for (const child of node.children) {
      collectNodeIdsLocal(child, ids)
    }
  }
  return ids
}

// leaf 노드(text/button/image) 간 type 변경. 위치/위계와 base props(spacing/shape/color/
// layout/transition/transform/cursor 등)는 보존, semantic 내용은 가능한 한 캐리오버한다.
//   text → image: alt = old.content, src = ''
//   text → button: label = old.content
//   image → text: content = old.alt
//   image → button: label = old.alt
//   button → text: content = old.label
//   button → image: alt = old.label, src = ''
// container 노드(section/hero/card/list/form)는 변환 대상 X — children 처리 어려움.
// 같은 type이면 원본 그대로 반환.
export type LeafNodeType = 'text' | 'button' | 'image'

export function changeLeafNodeType(
  tree: Tree,
  nodeId: string,
  nextType: LeafNodeType,
): Tree {
  return { ...tree, root: walkAndConvertLeaf(tree.root, nodeId, nextType) }
}

function walkAndConvertLeaf(
  node: TreeNode,
  nodeId: string,
  nextType: LeafNodeType,
): TreeNode {
  if (node.id === nodeId) {
    if (
      node.type === 'text' ||
      node.type === 'button' ||
      node.type === 'image'
    ) {
      return convertLeafNode(node, nextType)
    }
    return node
  }
  if (
    node.type === 'section' ||
    node.type === 'hero' ||
    node.type === 'card' ||
    node.type === 'list' ||
    node.type === 'form'
  ) {
    return {
      ...node,
      children: node.children.map((child) =>
        walkAndConvertLeaf(child, nodeId, nextType),
      ),
    }
  }
  return node
}

function convertLeafNode(
  node: Extract<TreeNode, { type: 'text' | 'button' | 'image' }>,
  nextType: LeafNodeType,
): TreeNode {
  if (node.type === nextType) return node

  // base props 추출 — 모든 leaf 노드 공통.
  const {
    id,
    editKind,
    hidden,
    disabled,
    opacity,
    pointerEvents,
    responsive,
    styleTokens,
    spacing,
    shape,
    color,
    layout,
    transition,
    transform,
    cursor,
  } = node
  const base = {
    id,
    editKind,
    ...(hidden !== undefined ? { hidden } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
    ...(opacity !== undefined ? { opacity } : {}),
    ...(pointerEvents !== undefined ? { pointerEvents } : {}),
    responsive,
    ...(styleTokens !== undefined ? { styleTokens } : {}),
    ...(spacing !== undefined ? { spacing } : {}),
    ...(shape !== undefined ? { shape } : {}),
    ...(color !== undefined ? { color } : {}),
    ...(layout !== undefined ? { layout } : {}),
    ...(transition !== undefined ? { transition } : {}),
    ...(transform !== undefined ? { transform } : {}),
    ...(cursor !== undefined ? { cursor } : {}),
  }

  // semantic 캐리오버.
  const semantic =
    node.type === 'text'
      ? node.content
      : node.type === 'button'
        ? node.label
        : node.alt

  if (nextType === 'text') {
    return { ...base, type: 'text', content: semantic }
  }
  if (nextType === 'button') {
    return { ...base, type: 'button', label: semantic }
  }
  // image
  return { ...base, type: 'image', src: '', alt: semantic }
}

export function updateStyleTokens(
  tree: Tree,
  patch: Partial<StyleTokens>,
): Tree {
  return applyEditOperation(tree, { type: 'updateStyleTokens', patch })
}

export function applyEditSequence(
  tree: Tree,
  operations: EditOperation[],
): Tree {
  return operations.reduce(
    (current, operation) => applyEditOperation(current, operation),
    tree,
  )
}

export function applyEditOperation(tree: Tree, operation: EditOperation): Tree {
  if (operation.type === 'updateStyleTokens') {
    return applyStyleOperation(tree, operation)
  }

  if (isStructureOperation(operation)) {
    return applyStructureOperation(tree, operation)
  }

  const state: EditState = { matched: false }
  const root = editNode(tree.root, operation, state)
  if (!state.matched) {
    throw new Error(`tree edit failed: node not found: ${operation.nodeId}`)
  }
  return { ...tree, root }
}

function applyStyleOperation(
  tree: Tree,
  operation: StyleEditOperation,
): Tree {
  return {
    ...tree,
    styleTokens: {
      ...(tree.styleTokens ?? {}),
      ...operation.patch,
    },
  }
}

function editNode(
  node: TreeNode,
  operation: ContentEditOperation,
  state: EditState,
): TreeNode {
  if (node.id === operation.nodeId) {
    state.matched = true
    return editMatchedNode(node, operation)
  }

  switch (node.type) {
    case 'section':
    case 'hero':
    case 'card':
    case 'list':
    case 'form':
      return {
        ...node,
        children: node.children.map((child) => editNode(child, operation, state)),
      }
    case 'text':
    case 'button':
    case 'image':
    case 'carousel':
      return node
  }
}

function editMatchedNode(
  node: TreeNode,
  operation: ContentEditOperation,
): TreeNode {
  switch (operation.type) {
    case 'updateText':
      if (node.type !== 'text') {
        throw new Error(
          `tree edit failed: updateText requires text node, got ${node.type}: ${node.id}`,
        )
      }
      return { ...node, content: operation.content }

    case 'updateTextTypography':
      if (node.type !== 'text') {
        throw new Error(
          `tree edit failed: updateTextTypography requires text node, got ${node.type}: ${node.id}`,
        )
      }
      return withTypographyPatch(node, operation.patch)

    case 'updateSpacing':
      return withSpacingPatch(node, operation.patch)

    case 'updateShape':
      return withShapePatch(node, operation.patch)

    case 'updateColor':
      return withColorPatch(node, operation.patch)

    case 'updateLayout':
      return withLayoutPatch(node, operation.patch)

    case 'updateNodeMeta':
      return withNodeMetaPatch(node, operation.patch)

    case 'updateButtonLabel':
      if (node.type !== 'button') {
        throw new Error(
          `tree edit failed: updateButtonLabel requires button node, got ${node.type}: ${node.id}`,
        )
      }
      return { ...node, label: operation.label }

    case 'updateImage':
      if (node.type !== 'image') {
        throw new Error(
          `tree edit failed: updateImage requires image node, got ${node.type}: ${node.id}`,
        )
      }
      return withImagePatch(node, operation)

    case 'updateCarousel':
      if (node.type !== 'carousel') {
        throw new Error(
          `tree edit failed: updateCarousel requires carousel node, got ${node.type}: ${node.id}`,
        )
      }
      return withCarouselPatch(node, operation)
  }
}

function withNodeMetaPatch<T extends TreeNode>(
  node: T,
  patch: NodeMetaPatch,
): T {
  const next: T = { ...node }

  if ('hidden' in patch) {
    if (patch.hidden === undefined) {
      delete next.hidden
    } else {
      next.hidden = patch.hidden
    }
  }

  if ('disabled' in patch) {
    if (patch.disabled === undefined) {
      delete next.disabled
    } else {
      next.disabled = patch.disabled
    }
  }

  if ('opacity' in patch) {
    if (patch.opacity === undefined) {
      delete next.opacity
    } else {
      next.opacity = patch.opacity
    }
  }

  if ('pointerEvents' in patch) {
    if (patch.pointerEvents === undefined) {
      delete next.pointerEvents
    } else {
      next.pointerEvents = patch.pointerEvents
    }
  }

  if ('transition' in patch) {
    if (patch.transition === undefined) {
      delete next.transition
    } else {
      next.transition = patch.transition
    }
  }

  if ('cursor' in patch) {
    if (patch.cursor === undefined) {
      delete next.cursor
    } else {
      next.cursor = patch.cursor
    }
  }

  if ('transform' in patch) {
    if (patch.transform === undefined) {
      delete next.transform
    } else {
      next.transform = patch.transform
    }
  }

  if ('position' in patch) {
    if (patch.position === undefined) {
      delete next.position
    } else {
      next.position = patch.position
    }
  }

  if ('inset' in patch) {
    if (patch.inset === undefined) {
      delete next.inset
    } else {
      next.inset = patch.inset
    }
  }

  if ('hideOn' in patch) {
    if (patch.hideOn === undefined) {
      delete next.hideOn
    } else {
      next.hideOn = patch.hideOn
    }
  }

  if ('responsiveStyle' in patch) {
    if (patch.responsiveStyle === undefined) {
      delete next.responsiveStyle
    } else {
      next.responsiveStyle = patch.responsiveStyle
    }
  }

  return next
}

function withImagePatch(
  node: ImageNode,
  patch: Omit<UpdateImageOperation, 'type' | 'nodeId'>,
): ImageNode {
  const next: ImageNode = {
    ...node,
    ...(patch.src !== undefined ? { src: patch.src } : {}),
    ...(patch.alt !== undefined ? { alt: patch.alt } : {}),
  }

  if ('aspectRatio' in patch) {
    if (patch.aspectRatio === undefined) {
      delete next.aspectRatio
    } else {
      next.aspectRatio = patch.aspectRatio
    }
  }

  if ('focalPoint' in patch) {
    if (patch.focalPoint === undefined) {
      delete next.focalPoint
    } else {
      next.focalPoint = patch.focalPoint
    }
  }

  if (patch.presentation !== undefined) {
    const presentation = mergeImagePresentationPatch(
      node.presentation,
      patch.presentation,
    )

    if (presentation === undefined) {
      delete next.presentation
    } else {
      next.presentation = presentation
    }
  }

  return next
}

function withCarouselPatch(
  node: CarouselNode,
  patch: Omit<UpdateCarouselOperation, 'type' | 'nodeId'>,
): CarouselNode {
  const next: CarouselNode = { ...node }

  if (patch.items !== undefined) next.items = patch.items

  if ('aspectRatio' in patch) {
    if (patch.aspectRatio === undefined) delete next.aspectRatio
    else next.aspectRatio = patch.aspectRatio
  }
  if ('auto' in patch) {
    if (patch.auto === undefined) delete next.auto
    else next.auto = patch.auto
  }
  if ('intervalMs' in patch) {
    if (patch.intervalMs === undefined) delete next.intervalMs
    else next.intervalMs = patch.intervalMs
  }
  if ('showDots' in patch) {
    if (patch.showDots === undefined) delete next.showDots
    else next.showDots = patch.showDots
  }
  if ('showArrows' in patch) {
    if (patch.showArrows === undefined) delete next.showArrows
    else next.showArrows = patch.showArrows
  }
  if ('previewIndex' in patch) {
    if (patch.previewIndex === undefined) delete next.previewIndex
    else next.previewIndex = patch.previewIndex
  }

  return next
}

function mergeImagePresentationPatch(
  current: ImagePresentation | undefined,
  patch: Partial<ImagePresentation>,
): ImagePresentation | undefined {
  const next: Partial<ImagePresentation> = { ...(current ?? {}) }

  for (const [key, value] of Object.entries(patch) as [
    keyof ImagePresentation,
    ImagePresentation[keyof ImagePresentation] | undefined,
  ][]) {
    if (value === undefined) {
      delete next[key]
    } else {
      Object.assign(next, { [key]: value })
    }
  }

  return Object.keys(next).length > 0 ? next : undefined
}

function withLayoutPatch<T extends TreeNode>(
  node: T,
  patch: Partial<NodeLayout>,
): T {
  const layout = mergeLayoutPatch(node.layout, patch)
  if (layout === undefined) {
    const { layout: _removed, ...nodeWithoutLayout } = node
    return nodeWithoutLayout as T
  }

  return { ...node, layout }
}

function mergeLayoutPatch(
  current: NodeLayout | undefined,
  patch: Partial<NodeLayout>,
): NodeLayout | undefined {
  const next: Partial<NodeLayout> = { ...(current ?? {}) }

  for (const [key, value] of Object.entries(patch) as [
    keyof NodeLayout,
    NodeLayout[keyof NodeLayout] | undefined,
  ][]) {
    if (value === undefined) {
      delete next[key]
    } else {
      Object.assign(next, { [key]: value })
    }
  }

  return Object.keys(next).length > 0 ? next : undefined
}

function withColorPatch<T extends TreeNode>(
  node: T,
  patch: Partial<NodeColor>,
): T {
  const color = mergeColorPatch(node.color, patch)
  if (color === undefined) {
    const { color: _removed, ...nodeWithoutColor } = node
    return nodeWithoutColor as T
  }

  return { ...node, color }
}

function mergeColorPatch(
  current: NodeColor | undefined,
  patch: Partial<NodeColor>,
): NodeColor | undefined {
  const next: Partial<NodeColor> = { ...(current ?? {}) }

  for (const [key, value] of Object.entries(patch) as [
    keyof NodeColor,
    NodeColor[keyof NodeColor] | undefined,
  ][]) {
    if (value === undefined) {
      delete next[key]
    } else {
      Object.assign(next, { [key]: value })
    }
  }

  return Object.keys(next).length > 0 ? next : undefined
}

function withShapePatch<T extends TreeNode>(node: T, patch: Partial<Shape>): T {
  const shape = mergeShapePatch(node.shape, patch)
  if (shape === undefined) {
    const { shape: _removed, ...nodeWithoutShape } = node
    return nodeWithoutShape as T
  }

  return { ...node, shape }
}

function mergeShapePatch(
  current: Shape | undefined,
  patch: Partial<Shape>,
): Shape | undefined {
  const next: Partial<Shape> = { ...(current ?? {}) }

  for (const [key, value] of Object.entries(patch) as [
    keyof Shape,
    Shape[keyof Shape] | undefined,
  ][]) {
    if (value === undefined) {
      delete next[key]
    } else {
      Object.assign(next, { [key]: value })
    }
  }

  return Object.keys(next).length > 0 ? next : undefined
}

function withSpacingPatch<T extends TreeNode>(
  node: T,
  patch: Partial<Spacing>,
): T {
  const spacing = mergeSpacingPatch(node.spacing, patch)
  if (spacing === undefined) {
    const { spacing: _removed, ...nodeWithoutSpacing } = node
    return nodeWithoutSpacing as T
  }

  return { ...node, spacing }
}

function mergeSpacingPatch(
  current: Spacing | undefined,
  patch: Partial<Spacing>,
): Spacing | undefined {
  const next: Partial<Spacing> = { ...(current ?? {}) }

  for (const [key, value] of Object.entries(patch) as [
    keyof Spacing,
    Spacing[keyof Spacing] | undefined,
  ][]) {
    if (value === undefined) {
      delete next[key]
    } else {
      Object.assign(next, { [key]: value })
    }
  }

  return Object.keys(next).length > 0 ? next : undefined
}

function withTypographyPatch(
  node: TextNode,
  patch: Partial<Typography>,
): TextNode {
  const typography = mergeTypographyPatch(node.typography, patch)
  if (typography === undefined) {
    const { typography: _removed, ...nodeWithoutTypography } = node
    return nodeWithoutTypography
  }

  return { ...node, typography }
}

function mergeTypographyPatch(
  current: Typography | undefined,
  patch: Partial<Typography>,
): Typography | undefined {
  const next: Partial<Typography> = { ...(current ?? {}) }

  for (const [key, value] of Object.entries(patch) as [
    keyof Typography,
    Typography[keyof Typography] | undefined,
  ][]) {
    if (value === undefined) {
      delete next[key]
    } else {
      Object.assign(next, { [key]: value })
    }
  }

  return Object.keys(next).length > 0 ? next : undefined
}

function applyStructureOperation(
  tree: Tree,
  operation: StructureEditOperation,
): Tree {
  if (tree.root.id === operation.nodeId) {
    throw new Error(
      `tree edit failed: ${operation.type} cannot target root node: ${operation.nodeId}`,
    )
  }

  const state: EditState = { matched: false }
  const existingIds = collectNodeIds(tree.root)
  const root = isContainerNode(tree.root)
    ? editContainerNode(tree.root, operation, state, existingIds)
    : tree.root

  if (!state.matched) {
    throw new Error(`tree edit failed: node not found: ${operation.nodeId}`)
  }

  return { ...tree, root }
}

function editContainerNode(
  node: ContainerNode,
  operation: StructureEditOperation,
  state: EditState,
  existingIds: Set<string>,
): ContainerNode {
  const directChildIndex = node.children.findIndex(
    (child) => child.id === operation.nodeId,
  )

  if (directChildIndex >= 0) {
    state.matched = true
    return withChildren(
      node,
      editDirectChildren(node.children, directChildIndex, operation, existingIds),
    )
  }

  return withChildren(
    node,
    node.children.map((child) => {
      if (state.matched || !isContainerNode(child)) {
        return child
      }

      return editContainerNode(child, operation, state, existingIds)
    }),
  )
}

function editDirectChildren(
  children: TreeNode[],
  targetIndex: number,
  operation: StructureEditOperation,
  existingIds: Set<string>,
): TreeNode[] {
  switch (operation.type) {
    case 'moveNode': {
      const nextIndex =
        operation.direction === 'up' ? targetIndex - 1 : targetIndex + 1
      if (nextIndex < 0 || nextIndex >= children.length) {
        throw new Error(
          `tree edit failed: cannot move ${operation.direction}: ${operation.nodeId}`,
        )
      }

      const nextChildren = [...children]
      const target = nextChildren[targetIndex]
      const sibling = nextChildren[nextIndex]
      if (!target || !sibling) {
        return children
      }

      nextChildren[targetIndex] = sibling
      nextChildren[nextIndex] = target
      return nextChildren
    }

    case 'duplicateNode': {
      const target = children[targetIndex]
      if (!target) {
        return children
      }

      const newRootId = resolveDuplicateRootId(
        existingIds,
        operation.nodeId,
        operation.newNodeId,
      )
      const duplicatedNode = duplicateTreeNode(
        target,
        operation.nodeId,
        newRootId,
        existingIds,
      )
      return [
        ...children.slice(0, targetIndex + 1),
        duplicatedNode,
        ...children.slice(targetIndex + 1),
      ]
    }

    case 'deleteNode':
      return [
        ...children.slice(0, targetIndex),
        ...children.slice(targetIndex + 1),
      ]
  }
}

function resolveDuplicateRootId(
  existingIds: Set<string>,
  sourceNodeId: string,
  requestedNodeId?: string,
): string {
  if (requestedNodeId !== undefined) {
    if (requestedNodeId.trim().length === 0) {
      throw new Error('tree edit failed: duplicateNode newNodeId cannot be empty')
    }
    if (existingIds.has(requestedNodeId)) {
      throw new Error(
        `tree edit failed: duplicateNode id already exists: ${requestedNodeId}`,
      )
    }
    return requestedNodeId
  }

  return generateCopyId(existingIds, sourceNodeId)
}

function duplicateTreeNode(
  node: TreeNode,
  sourceRootId: string,
  newRootId: string,
  existingIds: Set<string>,
): TreeNode {
  const nextId =
    node.id === sourceRootId
      ? newRootId
      : generateUniqueId(
          existingIds,
          rewriteDuplicateId(node.id, sourceRootId, newRootId),
        )

  existingIds.add(nextId)

  if (!isContainerNode(node)) {
    return { ...node, id: nextId }
  }

  return withChildren(
    { ...node, id: nextId },
    node.children.map((child) =>
      duplicateTreeNode(child, sourceRootId, newRootId, existingIds),
    ),
  )
}

function rewriteDuplicateId(
  nodeId: string,
  sourceRootId: string,
  newRootId: string,
): string {
  return nodeId.startsWith(`${sourceRootId}.`)
    ? `${newRootId}${nodeId.slice(sourceRootId.length)}`
    : `${nodeId}.copy`
}

function generateCopyId(existingIds: Set<string>, baseId: string): string {
  return generateUniqueId(existingIds, `${baseId}.copy`)
}

function generateUniqueId(existingIds: Set<string>, preferredId: string): string {
  if (!existingIds.has(preferredId)) {
    return preferredId
  }

  let copyIndex = 2
  while (existingIds.has(`${preferredId}-${copyIndex}`)) {
    copyIndex += 1
  }

  return `${preferredId}-${copyIndex}`
}

function collectNodeIds(node: TreeNode, ids = new Set<string>()): Set<string> {
  ids.add(node.id)

  if (isContainerNode(node)) {
    for (const child of node.children) {
      collectNodeIds(child, ids)
    }
  }

  return ids
}

function isStructureOperation(
  operation: EditOperation,
): operation is StructureEditOperation {
  return (
    operation.type === 'moveNode' ||
    operation.type === 'duplicateNode' ||
    operation.type === 'deleteNode'
  )
}

function isContainerNode(node: TreeNode): node is ContainerNode {
  return 'children' in node
}

function withChildren(node: ContainerNode, children: TreeNode[]): ContainerNode {
  return { ...node, children } as ContainerNode
}
