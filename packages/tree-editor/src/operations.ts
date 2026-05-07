import type { Tree, TreeNode } from '@dworks/tree'

export interface UpdateTextOperation {
  type: 'updateText'
  nodeId: string
  content: string
}

export interface UpdateButtonLabelOperation {
  type: 'updateButtonLabel'
  nodeId: string
  label: string
}

export type EditOperation =
  | UpdateTextOperation
  | UpdateButtonLabelOperation

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

export function updateButtonLabel(
  tree: Tree,
  nodeId: string,
  label: string,
): Tree {
  return applyEditOperation(tree, { type: 'updateButtonLabel', nodeId, label })
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
  const state: EditState = { matched: false }
  const root = editNode(tree.root, operation, state)
  if (!state.matched) {
    throw new Error(`tree edit failed: node not found: ${operation.nodeId}`)
  }
  return { ...tree, root }
}

function editNode(
  node: TreeNode,
  operation: EditOperation,
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
      return node
  }
}

function editMatchedNode(
  node: TreeNode,
  operation: EditOperation,
): TreeNode {
  switch (operation.type) {
    case 'updateText':
      if (node.type !== 'text') {
        throw new Error(
          `tree edit failed: updateText requires text node, got ${node.type}: ${node.id}`,
        )
      }
      return { ...node, content: operation.content }

    case 'updateButtonLabel':
      if (node.type !== 'button') {
        throw new Error(
          `tree edit failed: updateButtonLabel requires button node, got ${node.type}: ${node.id}`,
        )
      }
      return { ...node, label: operation.label }
  }
}
