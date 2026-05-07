'use client'

import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { ButtonNode, TextNode, Tree, TreeNode } from '@dworks/tree'
import { updateButtonLabel, updateText } from '@dworks/tree-editor'
import {
  defaultTreeFixture,
  getTreeFixture,
  treeFixtures,
} from './tree-fixtures'

type ContainerNode = Extract<TreeNode, { children: TreeNode[] }>

interface LayerItem {
  node: TreeNode
  depth: number
}

const nodeTypeLabels: Record<TreeNode['type'], string> = {
  text: 'text',
  button: 'button',
  section: 'section',
  hero: 'hero',
  card: 'card',
  list: 'list',
  form: 'form',
}

const editKindLabels: Record<TreeNode['editKind'], string> = {
  text: '텍스트',
  media: '미디어',
  structure: '구조',
  style: '스타일',
}

const MAX_HISTORY = 100

export default function HomePage() {
  const [selectedFixtureId, setSelectedFixtureId] = useState(defaultTreeFixture.id)
  const [tree, setTree] = useState<Tree>(defaultTreeFixture.tree)
  const [selectedNodeId, setSelectedNodeId] = useState(
    findFirstEditableNodeId(defaultTreeFixture.tree.root) ??
      defaultTreeFixture.tree.root.id,
  )
  const [historyPast, setHistoryPast] = useState<Tree[]>([])
  const [historyFuture, setHistoryFuture] = useState<Tree[]>([])

  const selectedNode = useMemo(
    () => findNode(tree.root, selectedNodeId) ?? tree.root,
    [selectedNodeId, tree],
  )
  const selectedFixture = useMemo(
    () => getTreeFixture(selectedFixtureId) ?? defaultTreeFixture,
    [selectedFixtureId],
  )
  const layerItems = useMemo(() => flattenTree(tree.root), [tree])
  const editableCount = useMemo(() => countEditableNodes(tree.root), [tree])

  function handleFixtureChange(fixtureId: string) {
    const nextFixture = getTreeFixture(fixtureId) ?? defaultTreeFixture
    setSelectedFixtureId(nextFixture.id)
    setTree(nextFixture.tree)
    setHistoryPast([])
    setHistoryFuture([])
    setSelectedNodeId(
      findFirstEditableNodeId(nextFixture.tree.root) ?? nextFixture.tree.root.id,
    )
  }

  function commitTreeEdit(nextTree: Tree) {
    setHistoryPast((past) => [...past, tree].slice(-MAX_HISTORY))
    setHistoryFuture([])
    setTree(nextTree)
    setSelectedNodeId((currentNodeId) => getSafeSelectedNodeId(nextTree, currentNodeId))
  }

  function handleTextChange(node: TextNode, content: string) {
    commitTreeEdit(updateText(tree, node.id, content))
  }

  function handleButtonLabelChange(node: ButtonNode, label: string) {
    commitTreeEdit(updateButtonLabel(tree, node.id, label))
  }

  function handleUndo() {
    const previousTree = historyPast.at(-1)
    if (!previousTree) {
      return
    }

    setHistoryPast((past) => past.slice(0, -1))
    setHistoryFuture((future) => [...future, tree].slice(-MAX_HISTORY))
    setTree(previousTree)
    setSelectedNodeId((currentNodeId) =>
      getSafeSelectedNodeId(previousTree, currentNodeId),
    )
  }

  function handleRedo() {
    const nextTree = historyFuture.at(-1)
    if (!nextTree) {
      return
    }

    setHistoryFuture((future) => future.slice(0, -1))
    setHistoryPast((past) => [...past, tree].slice(-MAX_HISTORY))
    setTree(nextTree)
    setSelectedNodeId((currentNodeId) => getSafeSelectedNodeId(nextTree, currentNodeId))
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#18211d]">
      <header className="flex h-14 items-center justify-between border-b border-[#d7ddd2] bg-white px-5">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold">Dworks Editor</h1>
            <p className="text-xs text-[#647067]">m2-edit-undo</p>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4f5e56]">Fixture</span>
            <select
              className="h-9 min-w-40 rounded-md border border-[#c9d4cd] bg-white px-3 text-sm text-[#18211d] outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
              value={selectedFixture.id}
              title={selectedFixture.description}
              onChange={(event) => handleFixtureChange(event.target.value)}
            >
              {treeFixtures.map((fixture) => (
                <option key={fixture.id} title={fixture.description} value={fixture.id}>
                  {fixture.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-1">
            <HistoryButton
              ariaLabel="실행 취소"
              disabled={historyPast.length === 0}
              onClick={handleUndo}
            >
              Undo
            </HistoryButton>
            <HistoryButton
              ariaLabel="다시 실행"
              disabled={historyFuture.length === 0}
              onClick={handleRedo}
            >
              Redo
            </HistoryButton>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4f5e56]">
            <span className="rounded-full border border-[#c9d4cd] px-3 py-1">
              root {tree.root.id}
            </span>
            <span className="rounded-full border border-[#c9d4cd] px-3 py-1">
              editable {editableCount}
            </span>
            <span className="rounded-full border border-[#c9d4cd] px-3 py-1">
              selected {selectedNode.id}
            </span>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-56px)] grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="border-r border-[#d7ddd2] bg-[#fbfcfa]">
          <div className="border-b border-[#e0e5de] px-4 py-3">
            <h2 className="text-sm font-semibold">Layers</h2>
          </div>
          <nav className="max-h-[calc(100vh-105px)] overflow-auto p-2">
            {layerItems.map(({ node, depth }) => (
              <button
                key={node.id}
                type="button"
                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] ${
                  node.id === selectedNodeId
                    ? 'bg-[#dff1ee] text-[#073d37]'
                    : 'text-[#26312b] hover:bg-[#eef3ed]'
                }`}
                style={{ paddingLeft: 12 + depth * 14 }}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <span className="min-w-0 truncate">{node.id}</span>
                <span className="shrink-0 rounded border border-[#cfd8d2] bg-white px-1.5 py-0.5 text-[11px] text-[#647067]">
                  {nodeTypeLabels[node.type]}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 overflow-auto bg-[#eef2ec]">
          <div className="min-w-[1040px] px-8 py-8">
            <div className="mx-auto w-full max-w-[1200px] border border-[#cbd6cf] bg-white">
              <CanvasNode
                node={tree.root}
                selectedNodeId={selectedNodeId}
                onSelect={setSelectedNodeId}
              />
            </div>
          </div>
        </section>

        <aside className="border-l border-[#d7ddd2] bg-white">
          <NodeInspector
            node={selectedNode}
            onTextChange={handleTextChange}
            onButtonLabelChange={handleButtonLabelChange}
          />
        </aside>
      </div>
    </main>
  )
}

interface HistoryButtonProps {
  ariaLabel: string
  children: ReactNode
  disabled: boolean
  onClick: () => void
}

function HistoryButton({
  ariaLabel,
  children,
  disabled,
  onClick,
}: HistoryButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="h-9 rounded-md border border-[#c9d4cd] bg-white px-3 text-xs font-semibold text-[#26312b] transition hover:bg-[#eef3ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface CanvasNodeProps {
  node: TreeNode
  selectedNodeId: string
  onSelect: (nodeId: string) => void
}

function CanvasNode({ node, selectedNodeId, onSelect }: CanvasNodeProps) {
  switch (node.type) {
    case 'section': {
      const [firstChild, ...remainingChildren] = node.children

      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <section className="space-y-8 p-10">
            {firstChild ? (
              <CanvasNode
                node={firstChild}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
              />
            ) : null}
            {node.layoutIntent === 'grid' ? (
              <div className="grid grid-cols-3 gap-8">
                {remainingChildren.map((child) => (
                  <CanvasNode
                    key={child.id}
                    node={child}
                    selectedNodeId={selectedNodeId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-10">
                {remainingChildren.map((child) => (
                  <CanvasNode
                    key={child.id}
                    node={child}
                    selectedNodeId={selectedNodeId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </section>
        </SelectableNode>
      )
    }

    case 'hero':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <section className="grid min-h-[420px] grid-cols-[1.05fr_0.95fr] gap-10 bg-[#102822] p-12 text-white">
            <div className="flex flex-col justify-center gap-5">
              {node.children.map((child) => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                />
              ))}
            </div>
            <div className="min-h-[320px] border border-white/25 bg-[#d9e4df] p-4">
              <div className="flex h-full flex-col justify-end bg-[#86b4aa] p-6 text-[#102822]">
                <span className="text-xs font-semibold uppercase">Sehwa</span>
                <span className="mt-2 text-3xl font-semibold">Sea, forest, route</span>
              </div>
            </div>
          </section>
        </SelectableNode>
      )

    case 'card':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <article className="h-full rounded-lg border border-[#d7ddd2] bg-[#fbfcfa] p-5 shadow-sm">
            <div className="space-y-3">
              {node.children.map((child) => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </article>
        </SelectableNode>
      )

    case 'list':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <div className="space-y-3">
            {node.children.map((child) => (
              <CanvasNode
                key={child.id}
                node={child}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </SelectableNode>
      )

    case 'form':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <form className="mx-auto max-w-[520px] space-y-5 rounded-lg border border-[#d7ddd2] bg-[#fbfcfa] p-8 shadow-sm">
            {node.children.map((child) => (
              <CanvasNode
                key={child.id}
                node={child}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
              />
            ))}
          </form>
        </SelectableNode>
      )

    case 'text':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <TextPreview node={node} />
        </SelectableNode>
      )

    case 'button':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <span
            className={`inline-flex min-h-11 items-center rounded-md px-5 text-sm font-semibold ${
              node.variant === 'secondary'
                ? 'border border-current bg-white text-[#102822]'
                : 'bg-[#f3b84d] text-[#16231f]'
            }`}
          >
            {node.label}
          </span>
        </SelectableNode>
      )
  }
}

interface SelectableNodeProps {
  node: TreeNode
  selectedNodeId: string
  onSelect: (nodeId: string) => void
  children: ReactNode
}

function SelectableNode({
  node,
  selectedNodeId,
  onSelect,
  children,
}: SelectableNodeProps) {
  const isSelected = node.id === selectedNodeId

  function selectNode() {
    onSelect(node.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    onSelect(node.id)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`relative border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] ${
        isSelected
          ? 'border-[#1b7f72] shadow-[0_0_0_3px_rgba(27,127,114,0.18)]'
          : 'border-transparent hover:border-[#8c9a91]'
      }`}
      onClick={(event) => {
        event.stopPropagation()
        selectNode()
      }}
      onKeyDown={handleKeyDown}
    >
      {isSelected ? (
        <span className="pointer-events-none absolute -top-3 left-2 z-10 rounded bg-[#1b7f72] px-2 py-1 text-[11px] font-semibold text-white">
          {nodeTypeLabels[node.type]}
        </span>
      ) : null}
      {children}
    </div>
  )
}

function TextPreview({ node }: { node: TextNode }) {
  switch (node.emphasis) {
    case 'heading-1':
      return (
        <h2 className="max-w-3xl text-5xl font-semibold leading-tight">
          {node.content}
        </h2>
      )
    case 'heading-2':
      return (
        <h3 className="text-2xl font-semibold text-[#16231f]">{node.content}</h3>
      )
    case 'heading-3':
      return (
        <h4 className="text-lg font-semibold text-[#16231f]">{node.content}</h4>
      )
    case 'caption':
      return (
        <p className="text-xs font-semibold uppercase text-[#f3b84d]">{node.content}</p>
      )
    case 'body':
    default:
      return <p className="max-w-2xl text-base leading-7">{node.content}</p>
  }
}

interface NodeInspectorProps {
  node: TreeNode
  onTextChange: (node: TextNode, content: string) => void
  onButtonLabelChange: (node: ButtonNode, label: string) => void
}

function NodeInspector({
  node,
  onTextChange,
  onButtonLabelChange,
}: NodeInspectorProps) {
  return (
    <section className="flex h-full flex-col">
      <div className="border-b border-[#e0e5de] px-5 py-4">
        <h2 className="text-sm font-semibold">Inspector</h2>
        <p className="mt-1 break-all text-xs text-[#647067]">{node.id}</p>
      </div>

      <div className="space-y-5 overflow-auto p-5">
        <MetadataGrid node={node} />

        {node.type === 'text' ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">Content</span>
            <textarea
              className="mt-2 min-h-32 w-full resize-y rounded-md border border-[#cbd6cf] bg-white p-3 text-sm leading-6 outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
              value={node.content}
              onChange={(event) => onTextChange(node, event.target.value)}
            />
          </label>
        ) : null}

        {node.type === 'button' ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">Label</span>
            <input
              className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
              value={node.label}
              onChange={(event) => onButtonLabelChange(node, event.target.value)}
            />
          </label>
        ) : null}

        {isContainerNode(node) ? (
          <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
            <h3 className="text-sm font-semibold">Container</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <InspectorRow label="children" value={String(node.children.length)} />
              {'layoutIntent' in node && node.layoutIntent ? (
                <InspectorRow label="layout" value={node.layoutIntent} />
              ) : null}
              {'role' in node && node.role ? (
                <InspectorRow label="role" value={node.role} />
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function MetadataGrid({ node }: { node: TreeNode }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <InspectorMetric label="type" value={nodeTypeLabels[node.type]} />
      <InspectorMetric label="editKind" value={editKindLabels[node.editKind]} />
      {'contentRole' in node && node.contentRole ? (
        <InspectorMetric label="role" value={node.contentRole} />
      ) : null}
      {'variant' in node && node.variant ? (
        <InspectorMetric label="variant" value={node.variant} />
      ) : null}
    </dl>
  )
}

function InspectorMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-3">
      <dt className="text-[11px] font-semibold uppercase text-[#647067]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-[#1d2923]">{value}</dd>
    </div>
  )
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#647067]">{label}</dt>
      <dd className="break-all text-right font-medium text-[#1d2923]">{value}</dd>
    </div>
  )
}

function findNode(node: TreeNode, nodeId: string): TreeNode | null {
  if (node.id === nodeId) {
    return node
  }

  if (!isContainerNode(node)) {
    return null
  }

  for (const child of node.children) {
    const matched = findNode(child, nodeId)
    if (matched) {
      return matched
    }
  }

  return null
}

function flattenTree(node: TreeNode, depth = 0): LayerItem[] {
  const current = [{ node, depth }]
  if (!isContainerNode(node)) {
    return current
  }

  return [
    ...current,
    ...node.children.flatMap((child) => flattenTree(child, depth + 1)),
  ]
}

function countEditableNodes(node: TreeNode): number {
  const current = node.type === 'text' || node.type === 'button' ? 1 : 0
  if (!isContainerNode(node)) {
    return current
  }

  return current + node.children.reduce((sum, child) => sum + countEditableNodes(child), 0)
}

function findFirstEditableNodeId(node: TreeNode): string | null {
  if (node.type === 'text' || node.type === 'button') {
    return node.id
  }

  if (!isContainerNode(node)) {
    return null
  }

  for (const child of node.children) {
    const editableNodeId = findFirstEditableNodeId(child)
    if (editableNodeId) {
      return editableNodeId
    }
  }

  return null
}

function getSafeSelectedNodeId(tree: Tree, preferredNodeId: string): string {
  return (
    findNode(tree.root, preferredNodeId)?.id ??
    findFirstEditableNodeId(tree.root) ??
    tree.root.id
  )
}

function isContainerNode(node: TreeNode): node is ContainerNode {
  return 'children' in node
}
