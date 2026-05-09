// Tree 통계 — node 수, 최대 depth.

import type { TreeNode } from '@dworks/tree'

export interface TreeStats {
  nodeCount: number
  depth: number
}

function isContainer(
  node: TreeNode,
): node is Extract<TreeNode, { children: TreeNode[] }> {
  return 'children' in node && Array.isArray((node as { children?: unknown }).children)
}

export function computeTreeStats(root: TreeNode): TreeStats {
  let nodeCount = 0
  let maxDepth = 0
  function visit(node: TreeNode, depth: number) {
    nodeCount += 1
    if (depth > maxDepth) maxDepth = depth
    if (isContainer(node)) {
      for (const child of node.children) {
        visit(child, depth + 1)
      }
    }
  }
  visit(root, 0)
  return { nodeCount, depth: maxDepth }
}
