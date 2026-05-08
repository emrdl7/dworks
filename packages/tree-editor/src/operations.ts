import type {
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
  | UpdateButtonLabelOperation
  | UpdateImageOperation

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
  }
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
