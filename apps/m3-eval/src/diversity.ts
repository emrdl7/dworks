// 같은 intent의 변형 트리 구조 다양성 — type-path multiset 자카드.
//
// content/스타일 차이는 1차 metric에 포함하지 않는다. 구조 위계만 측정한다.

import type { Tree, TreeNode } from '@dworks/tree'

function isContainer(
  node: TreeNode,
): node is Extract<TreeNode, { children: TreeNode[] }> {
  return (
    'children' in node &&
    Array.isArray((node as { children?: unknown }).children)
  )
}

export function computeBag(tree: Tree): string[] {
  const bag: string[] = []
  function visit(node: TreeNode, prefix: string): void {
    const path = prefix === '' ? node.type : `${prefix}/${node.type}`
    bag.push(path)
    if (isContainer(node)) {
      for (const child of node.children) {
        visit(child, path)
      }
    }
  }
  visit(tree.root, '')
  return bag
}

export function jaccard(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 && b.length === 0) return 1
  const countsA = new Map<string, number>()
  const countsB = new Map<string, number>()
  for (const x of a) countsA.set(x, (countsA.get(x) ?? 0) + 1)
  for (const x of b) countsB.set(x, (countsB.get(x) ?? 0) + 1)
  const keys = new Set<string>()
  for (const k of countsA.keys()) keys.add(k)
  for (const k of countsB.keys()) keys.add(k)
  let inter = 0
  let uni = 0
  for (const k of keys) {
    const ca = countsA.get(k) ?? 0
    const cb = countsB.get(k) ?? 0
    inter += Math.min(ca, cb)
    uni += Math.max(ca, cb)
  }
  return uni === 0 ? 1 : inter / uni
}

export function pairwiseSimilarity(trees: readonly Tree[]): number | null {
  if (trees.length < 2) return null
  const bags = trees.map((t) => computeBag(t))
  let sum = 0
  let pairs = 0
  for (let i = 0; i < bags.length; i++) {
    for (let j = i + 1; j < bags.length; j++) {
      sum += jaccard(bags[i] ?? [], bags[j] ?? [])
      pairs += 1
    }
  }
  return pairs === 0 ? null : sum / pairs
}

/**
 * 1 - avgPairwiseSimilarity. 트리 < 2이면 null.
 * 0 = 모든 변형 동일 / 1 = 완전 다른 구조.
 */
export function computeDiversity(trees: readonly Tree[]): number | null {
  const sim = pairwiseSimilarity(trees)
  return sim === null ? null : 1 - sim
}
