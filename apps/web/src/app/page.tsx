'use client'

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  COLOR_PRESETS,
  COLOR_PRESET_IDS,
  type ButtonNode,
  type ColorPreset,
  type FontFamily,
  type FontWeight,
  type ImageNode,
  type TextNode,
  type TextAlign,
  type Tree,
  type TreeNode,
  type Typography,
} from '@dworks/tree'
import {
  deleteNode,
  duplicateNode,
  moveNode,
  updateButtonLabel,
  updateImage,
  updateStyleTokens,
  updateText,
  updateTextTypography,
} from '@dworks/tree-editor'
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

interface StructureInfo {
  isRoot: boolean
  parentId?: string
  index?: number
  siblingCount?: number
}

const nodeTypeLabels: Record<TreeNode['type'], string> = {
  text: '텍스트',
  button: '버튼',
  image: '이미지',
  section: '섹션',
  hero: '히어로',
  card: '카드',
  list: '목록',
  form: '폼',
}

const editKindLabels: Record<TreeNode['editKind'], string> = {
  text: '텍스트',
  media: '미디어',
  structure: '구조',
  style: '스타일',
}

const contentRoleLabels = {
  heading: '제목',
  body: '본문',
  caption: '캡션',
  cta: '주요 행동',
  label: '라벨',
  value: '값',
} as const

const buttonVariantLabels = {
  primary: '주요',
  secondary: '보조',
  ghost: '투명',
} as const

const listVariantLabels = {
  ordered: '순서 목록',
  unordered: '기본 목록',
  description: '설명 목록',
} as const

const imageAspectRatioLabels = {
  square: '정사각형',
  landscape: '가로형',
  portrait: '세로형',
  wide: '와이드',
} as const

const layoutIntentLabels = {
  stack: '세로 쌓기',
  grid: '그리드',
  inline: '가로 배치',
  split: '분할',
  'dashboard-grid': '대시보드 그리드',
} as const

const colorPresetLabels: Record<ColorPreset, string> = {
  mint: '민트',
  navy: '네이비',
  sand: '샌드',
  plum: '플럼',
  graphite: '그래파이트',
}

const fontWeightLabels: Record<FontWeight, string> = {
  '400': '보통',
  '500': '중간',
  '600': '볼드',
  '700': '굵게',
}

const textAlignLabels: Record<TextAlign, string> = {
  left: '좌',
  center: '중',
  right: '우',
}

const fontFamilyLabels: Record<FontFamily, string> = {
  sans: '산세리프',
  serif: '세리프',
}

const fontWeightOptions: FontWeight[] = ['400', '500', '600', '700']
const textAlignOptions: TextAlign[] = ['left', 'center', 'right']
const fontFamilyOptions: FontFamily[] = ['sans', 'serif']
const typographyFields = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'fontFamily',
] as const

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
  const selectedStructureInfo = useMemo(
    () => getStructureInfo(tree, selectedNodeId),
    [selectedNodeId, tree],
  )
  const selectedFixture = useMemo(
    () => getTreeFixture(selectedFixtureId) ?? defaultTreeFixture,
    [selectedFixtureId],
  )
  const layerItems = useMemo(() => flattenTree(tree.root), [tree])
  const editableCount = useMemo(() => countEditableNodes(tree.root), [tree])
  const colorPreset = tree.styleTokens?.colorPreset ?? 'mint'
  const canvasStyle = useMemo(
    () => getCanvasStyle(colorPreset),
    [colorPreset],
  )

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

  function commitTreeEdit(nextTree: Tree, nextSelectedNodeId?: string) {
    setHistoryPast((past) => [...past, tree].slice(-MAX_HISTORY))
    setHistoryFuture([])
    setTree(nextTree)
    setSelectedNodeId((currentNodeId) =>
      getSafeSelectedNodeId(nextTree, nextSelectedNodeId ?? currentNodeId),
    )
  }

  function handleTextChange(node: TextNode, content: string) {
    commitTreeEdit(updateText(tree, node.id, content))
  }

  function handleTextTypographyChange(
    node: TextNode,
    patch: Partial<Typography>,
  ) {
    commitTreeEdit(updateTextTypography(tree, node.id, patch))
  }

  function handleTextTypographyReset(node: TextNode) {
    commitTreeEdit(
      updateTextTypography(
        tree,
        node.id,
        Object.fromEntries(
          typographyFields.map((field) => [field, undefined]),
        ) as Partial<Typography>,
      ),
    )
  }

  function handleButtonLabelChange(node: ButtonNode, label: string) {
    commitTreeEdit(updateButtonLabel(tree, node.id, label))
  }

  function handleImageChange(
    node: ImageNode,
    patch: Pick<Partial<ImageNode>, 'src' | 'alt'>,
  ) {
    commitTreeEdit(updateImage(tree, node.id, patch))
  }

  function handleMoveSelected(direction: 'up' | 'down') {
    commitTreeEdit(moveNode(tree, selectedNodeId, direction), selectedNodeId)
  }

  function handleDuplicateSelected() {
    const duplicatedNodeId = createDuplicateNodeId(tree, selectedNodeId)
    commitTreeEdit(
      duplicateNode(tree, selectedNodeId, duplicatedNodeId),
      duplicatedNodeId,
    )
  }

  function handleDeleteSelected() {
    const parentId = selectedStructureInfo.parentId
    const nextTree = deleteNode(tree, selectedNodeId)
    commitTreeEdit(nextTree, parentId)
  }

  function handleColorPresetChange(nextColorPreset: ColorPreset) {
    commitTreeEdit(updateStyleTokens(tree, { colorPreset: nextColorPreset }))
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
            <h1 className="text-base font-semibold">Dworks 편집기</h1>
            <p className="text-xs text-[#647067]">색상 스타일 편집</p>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4f5e56]">예제</span>
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
              실행 취소
            </HistoryButton>
            <HistoryButton
              ariaLabel="다시 실행"
              disabled={historyFuture.length === 0}
              onClick={handleRedo}
            >
              다시 실행
            </HistoryButton>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4f5e56]">
            <span className="rounded-full border border-[#c9d4cd] px-3 py-1">
              루트 {tree.root.id}
            </span>
            <span className="rounded-full border border-[#c9d4cd] px-3 py-1">
              편집 가능 {editableCount}
            </span>
            <span className="rounded-full border border-[#c9d4cd] px-3 py-1">
              선택 {selectedNode.id}
            </span>
            <span className="rounded-full border border-[#c9d4cd] px-3 py-1">
              색상 {colorPresetLabels[colorPreset]}
            </span>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-56px)] grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="border-r border-[#d7ddd2] bg-[#fbfcfa]">
          <div className="border-b border-[#e0e5de] px-4 py-3">
            <h2 className="text-sm font-semibold">레이어</h2>
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
            <div
              className="mx-auto w-full max-w-[1200px] border border-[var(--dw-border)] bg-[var(--dw-surface)] text-[var(--dw-text-primary)]"
              style={canvasStyle}
            >
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
            structureInfo={selectedStructureInfo}
            onTextChange={handleTextChange}
            onTextTypographyChange={handleTextTypographyChange}
            onTextTypographyReset={handleTextTypographyReset}
            onButtonLabelChange={handleButtonLabelChange}
            onImageChange={handleImageChange}
            onMoveUp={() => handleMoveSelected('up')}
            onMoveDown={() => handleMoveSelected('down')}
            onDuplicate={handleDuplicateSelected}
            onDelete={handleDeleteSelected}
            colorPreset={colorPreset}
            onColorPresetChange={handleColorPresetChange}
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

    case 'hero': {
      const imageChildren = node.children.filter(isImageNode)
      const contentChildren = node.children.filter((child) => !isImageNode(child))
      const hasImage = imageChildren.length > 0

      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <section
            className={`grid min-h-[420px] gap-10 bg-[var(--dw-hero-surface)] p-12 text-[var(--dw-hero-text)] ${
              hasImage ? 'grid-cols-[1.05fr_0.95fr]' : 'grid-cols-1'
            }`}
          >
            <div className="flex flex-col justify-center gap-5">
              {contentChildren.map((child) => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                />
              ))}
            </div>
            {hasImage ? (
              <div className="min-h-[320px] space-y-4">
                {imageChildren.map((child) => (
                  <CanvasNode
                    key={child.id}
                    node={child}
                    selectedNodeId={selectedNodeId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ) : null}
          </section>
        </SelectableNode>
      )
    }

    case 'card':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <article className="h-full rounded-lg border border-[var(--dw-border)] bg-[var(--dw-surface-muted)] p-5 shadow-sm">
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
          <form className="mx-auto max-w-[520px] space-y-5 rounded-lg border border-[var(--dw-border)] bg-[var(--dw-surface-muted)] p-8 shadow-sm">
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
                ? 'border border-current bg-[var(--dw-surface-muted)] text-[var(--dw-text-primary)]'
                : 'bg-[var(--dw-accent)] text-[var(--dw-accent-text)]'
            }`}
          >
            {node.label}
          </span>
        </SelectableNode>
      )

    case 'image':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <ImagePreview key={node.src} node={node} />
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
      className={`relative border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-accent)] ${
        isSelected
          ? 'border-[var(--dw-accent)] shadow-[0_0_0_3px_var(--dw-selection-ring)]'
          : 'border-transparent hover:border-[var(--dw-border)]'
      }`}
      onClick={(event) => {
        event.stopPropagation()
        selectNode()
      }}
      onKeyDown={handleKeyDown}
    >
      {isSelected ? (
        <span className="pointer-events-none absolute -top-3 left-2 z-10 rounded bg-[var(--dw-accent)] px-2 py-1 text-[11px] font-semibold text-[var(--dw-accent-text)]">
          {nodeTypeLabels[node.type]}
        </span>
      ) : null}
      {children}
    </div>
  )
}

function TextPreview({ node }: { node: TextNode }) {
  const typographyStyle = getTypographyStyle(node.typography)

  switch (node.emphasis) {
    case 'heading-1':
      return (
        <h2
          className="max-w-3xl text-5xl font-semibold leading-tight"
          style={typographyStyle}
        >
          {node.content}
        </h2>
      )
    case 'heading-2':
      return (
        <h3
          className="text-2xl font-semibold text-[var(--dw-text-primary)]"
          style={typographyStyle}
        >
          {node.content}
        </h3>
      )
    case 'heading-3':
      return (
        <h4
          className="text-lg font-semibold text-[var(--dw-text-primary)]"
          style={typographyStyle}
        >
          {node.content}
        </h4>
      )
    case 'caption':
      return (
        <p
          className="text-xs font-semibold uppercase text-[var(--dw-accent)]"
          style={typographyStyle}
        >
          {node.content}
        </p>
      )
    case 'body':
    default:
      return (
        <p className="max-w-2xl text-base leading-7" style={typographyStyle}>
          {node.content}
        </p>
      )
  }
}

function getTypographyStyle(typography?: Typography): CSSProperties | undefined {
  if (!typography) {
    return undefined
  }

  return {
    ...(typography.fontSize !== undefined
      ? { fontSize: `${typography.fontSize}px` }
      : {}),
    ...(typography.fontWeight !== undefined
      ? { fontWeight: typography.fontWeight }
      : {}),
    ...(typography.lineHeight !== undefined
      ? { lineHeight: typography.lineHeight }
      : {}),
    ...(typography.letterSpacing !== undefined
      ? { letterSpacing: `${typography.letterSpacing}em` }
      : {}),
    ...(typography.textAlign !== undefined
      ? { textAlign: typography.textAlign }
      : {}),
    ...(typography.fontFamily !== undefined
      ? { fontFamily: getFontFamilyStack(typography.fontFamily) }
      : {}),
  }
}

function getFontFamilyStack(fontFamily: FontFamily): string {
  if (fontFamily === 'serif') {
    return 'ui-serif, "Noto Serif KR", Georgia, serif'
  }

  return 'ui-sans-serif, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif'
}

function ImagePreview({ node }: { node: ImageNode }) {
  const [hasError, setHasError] = useState(false)
  const canRenderImage = node.src.trim().length > 0 && !hasError

  useEffect(() => {
    setHasError(false)
  }, [node.src])

  return (
    <figure
      className={`relative flex min-h-[320px] overflow-hidden border border-white/25 bg-[var(--dw-image-surface)] ${
        aspectRatioClasses[node.aspectRatio ?? 'wide']
      }`}
    >
      {canRenderImage ? (
        // Arbitrary design-source URLs cannot use next/image domain allowlists yet.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="h-full w-full object-cover"
          src={node.src}
          alt={node.alt}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col justify-end bg-[var(--dw-image-accent)] p-6 text-[var(--dw-text-primary)]">
          <span className="text-xs font-semibold uppercase tracking-wide">
            이미지 슬롯
          </span>
          <span className="mt-2 max-w-sm text-2xl font-semibold leading-tight">
            {node.alt || '이미지 주소를 입력하세요'}
          </span>
          {node.src ? (
            <span className="mt-3 break-all text-xs text-[var(--dw-text-muted)]">
              {node.src}
            </span>
          ) : null}
        </div>
      )}
    </figure>
  )
}

const aspectRatioClasses: Record<NonNullable<ImageNode['aspectRatio']>, string> = {
  square: 'aspect-square',
  landscape: 'aspect-[3/2]',
  portrait: 'aspect-[4/5]',
  wide: 'aspect-video',
}

interface NodeInspectorProps {
  node: TreeNode
  structureInfo: StructureInfo
  colorPreset: ColorPreset
  onTextChange: (node: TextNode, content: string) => void
  onTextTypographyChange: (node: TextNode, patch: Partial<Typography>) => void
  onTextTypographyReset: (node: TextNode) => void
  onButtonLabelChange: (node: ButtonNode, label: string) => void
  onImageChange: (node: ImageNode, patch: Pick<Partial<ImageNode>, 'src' | 'alt'>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
  onColorPresetChange: (colorPreset: ColorPreset) => void
}

function NodeInspector({
  node,
  structureInfo,
  colorPreset,
  onTextChange,
  onTextTypographyChange,
  onTextTypographyReset,
  onButtonLabelChange,
  onImageChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onColorPresetChange,
}: NodeInspectorProps) {
  return (
    <section className="flex h-full flex-col">
      <div className="border-b border-[#e0e5de] px-5 py-4">
        <h2 className="text-sm font-semibold">속성</h2>
        <p className="mt-1 break-all text-xs text-[#647067]">{node.id}</p>
      </div>

      <div className="space-y-5 overflow-auto p-5">
        <MetadataGrid node={node} />

        <StyleControls
          colorPreset={colorPreset}
          onColorPresetChange={onColorPresetChange}
        />

        {node.type === 'text' ? (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-[#4f5e56]">내용</span>
              <textarea
                className="mt-2 min-h-32 w-full resize-y rounded-md border border-[#cbd6cf] bg-white p-3 text-sm leading-6 outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                value={node.content}
                onChange={(event) => onTextChange(node, event.target.value)}
              />
            </label>
            <TypographyControls
              node={node}
              onTypographyChange={onTextTypographyChange}
              onTypographyReset={onTextTypographyReset}
            />
          </div>
        ) : null}

        {node.type === 'button' ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">버튼 문구</span>
            <input
              className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
              value={node.label}
              onChange={(event) => onButtonLabelChange(node, event.target.value)}
            />
          </label>
        ) : null}

        {node.type === 'image' ? (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-[#4f5e56]">
                이미지 주소
              </span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                value={node.src}
                onChange={(event) => onImageChange(node, { src: event.target.value })}
              />
              {node.src.trim().length === 0 ? (
                <span className="mt-2 block text-xs text-[#647067]">
                  이미지 슬롯 - 이미지 주소를 입력하세요.
                </span>
              ) : null}
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#4f5e56]">
                대체 텍스트
              </span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                value={node.alt}
                onChange={(event) => onImageChange(node, { alt: event.target.value })}
              />
              {node.alt.length === 0 ? (
                <span className="mt-2 block text-xs text-[#647067]">
                  스크린리더가 이 이미지를 읽지 않습니다.
                </span>
              ) : null}
            </label>
          </div>
        ) : null}

        <StructureControls
          info={structureInfo}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />

        {isContainerNode(node) ? (
          <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
            <h3 className="text-sm font-semibold">그룹</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <InspectorRow label="하위 요소" value={String(node.children.length)} />
              {'layoutIntent' in node && node.layoutIntent ? (
                <InspectorRow
                  label="배치"
                  value={layoutIntentLabels[node.layoutIntent]}
                />
              ) : null}
              {'role' in node && node.role ? (
                <InspectorRow label="역할" value={node.role} />
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  )
}

interface StyleControlsProps {
  colorPreset: ColorPreset
  onColorPresetChange: (colorPreset: ColorPreset) => void
}

function StyleControls({
  colorPreset,
  onColorPresetChange,
}: StyleControlsProps) {
  return (
    <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">문서 스타일</h3>
          <p className="mt-1 text-xs text-[#647067]">캔버스 전체 색상</p>
        </div>
        <span className="rounded-full border border-[#c9d4cd] bg-white px-2 py-1 text-[11px] font-semibold text-[#4f5e56]">
          {colorPresetLabels[colorPreset]}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {COLOR_PRESET_IDS.map((presetId) => {
          const colors = COLOR_PRESETS[presetId]
          const isSelected = presetId === colorPreset

          return (
            <button
              key={presetId}
              type="button"
              aria-label={`${colorPresetLabels[presetId]} 색상 프리셋`}
              aria-pressed={isSelected}
              className={`h-11 rounded-md border bg-white p-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] ${
                isSelected
                  ? 'border-[#1b7f72] shadow-[0_0_0_2px_rgba(27,127,114,0.18)]'
                  : 'border-[#c9d4cd] hover:border-[#8c9a91]'
              }`}
              title={colorPresetLabels[presetId]}
              onClick={() => onColorPresetChange(presetId)}
            >
              <span className="flex h-full overflow-hidden rounded">
                <span
                  className="w-2/3"
                  style={{ backgroundColor: colors.surface }}
                />
                <span
                  className="w-1/3"
                  style={{ backgroundColor: colors.accent }}
                />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface TypographyControlsProps {
  node: TextNode
  onTypographyChange: (node: TextNode, patch: Partial<Typography>) => void
  onTypographyReset: (node: TextNode) => void
}

function TypographyControls({
  node,
  onTypographyChange,
  onTypographyReset,
}: TypographyControlsProps) {
  const defaults = getTypographyDefaults(node)
  const typography = node.typography ?? {}
  const effectiveTextAlign = typography.textAlign ?? defaults.textAlign
  const effectiveFontFamily = typography.fontFamily ?? defaults.fontFamily
  const sliderFontSize = typography.fontSize ?? defaults.fontSize

  function updateNumberField(
    field: 'fontSize' | 'lineHeight' | 'letterSpacing',
    value: string,
    min: number,
    max: number,
  ) {
    onTypographyChange(node, {
      [field]: parseOptionalNumber(value, min, max),
    })
  }

  return (
    <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">타이포그래피</h3>
          <p className="mt-1 text-xs text-[#647067]">
            선택한 텍스트만 조정
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-[#1b7f72] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72]"
          onClick={() => onTypographyReset(node)}
        >
          초기화
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <TypographyNumberField
          label="크기"
          unit="px"
          min={8}
          max={120}
          step={1}
          value={typography.fontSize}
          placeholder={String(defaults.fontSize)}
          onChange={(value) => updateNumberField('fontSize', value, 8, 120)}
        />
        <label className="block">
          <span className="text-xs font-semibold text-[#4f5e56]">굵기</span>
          <select
            className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
            value={typography.fontWeight ?? ''}
            onChange={(event) =>
              onTypographyChange(node, {
                fontWeight:
                  event.target.value === ''
                    ? undefined
                    : (event.target.value as FontWeight),
              })
            }
          >
            <option value="">기본 {fontWeightLabels[defaults.fontWeight]}</option>
            {fontWeightOptions.map((weight) => (
              <option key={weight} value={weight}>
                {fontWeightLabels[weight]} {weight}
              </option>
            ))}
          </select>
        </label>

        <TypographyNumberField
          label="행간"
          min={0.8}
          max={3}
          step={0.05}
          value={typography.lineHeight}
          placeholder={String(defaults.lineHeight)}
          onChange={(value) => updateNumberField('lineHeight', value, 0.8, 3)}
        />
        <TypographyNumberField
          label="자간"
          unit="em"
          min={-0.1}
          max={0.2}
          step={0.005}
          value={typography.letterSpacing}
          placeholder={String(defaults.letterSpacing)}
          onChange={(value) => updateNumberField('letterSpacing', value, -0.1, 0.2)}
        />
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-semibold text-[#4f5e56]">크기 슬라이더</span>
        <input
          className="mt-2 w-full accent-[#1b7f72]"
          type="range"
          min={8}
          max={120}
          step={1}
          value={sliderFontSize}
          aria-label="글자 크기 슬라이더"
          onChange={(event) =>
            onTypographyChange(node, {
              fontSize: Number(event.target.value),
            })
          }
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs font-semibold text-[#4f5e56]">정렬</span>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {textAlignOptions.map((align) => (
              <TypographyToggleButton
                key={align}
                isSelected={effectiveTextAlign === align}
                onClick={() => onTypographyChange(node, { textAlign: align })}
              >
                {textAlignLabels[align]}
              </TypographyToggleButton>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-[#4f5e56]">글꼴</span>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {fontFamilyOptions.map((family) => (
              <TypographyToggleButton
                key={family}
                isSelected={effectiveFontFamily === family}
                onClick={() => onTypographyChange(node, { fontFamily: family })}
              >
                {fontFamilyLabels[family]}
              </TypographyToggleButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface TypographyNumberFieldProps {
  label: string
  max: number
  min: number
  onChange: (value: string) => void
  placeholder: string
  step: number
  unit?: string
  value?: number
}

function TypographyNumberField({
  label,
  max,
  min,
  onChange,
  placeholder,
  step,
  unit,
  value,
}: TypographyNumberFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#4f5e56]">{label}</span>
      <span className="mt-2 flex h-10 items-center rounded-md border border-[#cbd6cf] bg-white focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
        <input
          className="h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {unit ? (
          <span className="shrink-0 px-2 text-xs font-semibold text-[#647067]">
            {unit}
          </span>
        ) : null}
      </span>
    </label>
  )
}

interface TypographyToggleButtonProps {
  children: ReactNode
  isSelected: boolean
  onClick: () => void
}

function TypographyToggleButton({
  children,
  isSelected,
  onClick,
}: TypographyToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={`h-9 rounded-md border px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] ${
        isSelected
          ? 'border-[#1b7f72] bg-[#dff1ee] text-[#073d37]'
          : 'border-[#c9d4cd] bg-white text-[#26312b] hover:bg-[#eef3ed]'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface StructureControlsProps {
  info: StructureInfo
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function StructureControls({
  info,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: StructureControlsProps) {
  const canMoveUp = !info.isRoot && (info.index ?? 0) > 0
  const canMoveDown =
    !info.isRoot && (info.index ?? 0) < (info.siblingCount ?? 0) - 1
  const canEditStructure = !info.isRoot

  return (
    <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">구조</h3>
        {info.parentId ? (
          <span className="max-w-36 truncate text-xs text-[#647067]">
            상위 {info.parentId}
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <InspectorActionButton
          ariaLabel="위로 이동"
          disabled={!canMoveUp}
          onClick={onMoveUp}
        >
          위로 이동
        </InspectorActionButton>
        <InspectorActionButton
          ariaLabel="아래로 이동"
          disabled={!canMoveDown}
          onClick={onMoveDown}
        >
          아래로 이동
        </InspectorActionButton>
        <InspectorActionButton
          ariaLabel="복제"
          disabled={!canEditStructure}
          onClick={onDuplicate}
        >
          복제
        </InspectorActionButton>
        <InspectorActionButton
          ariaLabel="삭제"
          disabled={!canEditStructure}
          tone="danger"
          onClick={onDelete}
        >
          삭제
        </InspectorActionButton>
      </div>
      {info.isRoot ? (
        <p className="mt-3 text-xs text-[#647067]">
          루트는 이동/삭제할 수 없습니다.
        </p>
      ) : null}
    </div>
  )
}

interface InspectorActionButtonProps {
  ariaLabel: string
  children: ReactNode
  disabled: boolean
  onClick: () => void
  tone?: 'neutral' | 'danger'
}

function InspectorActionButton({
  ariaLabel,
  children,
  disabled,
  onClick,
  tone = 'neutral',
}: InspectorActionButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'hover:border-[#a04545] hover:text-[#7a1f1f] focus-visible:border-[#a04545] focus-visible:text-[#7a1f1f]'
      : 'hover:bg-[#eef3ed]'

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`h-9 rounded-md border border-[#c9d4cd] bg-white px-3 text-xs font-semibold text-[#26312b] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#c9d4cd] disabled:hover:bg-white disabled:hover:text-[#26312b] ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function MetadataGrid({ node }: { node: TreeNode }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <InspectorMetric label="노드 유형" value={nodeTypeLabels[node.type]} />
      <InspectorMetric label="편집 유형" value={editKindLabels[node.editKind]} />
      {'contentRole' in node && node.contentRole ? (
        <InspectorMetric
          label="역할"
          value={contentRoleLabels[node.contentRole]}
        />
      ) : null}
      {node.type === 'button' && node.variant ? (
        <InspectorMetric label="버튼 종류" value={buttonVariantLabels[node.variant]} />
      ) : null}
      {node.type === 'list' && node.variant ? (
        <InspectorMetric label="목록 종류" value={listVariantLabels[node.variant]} />
      ) : null}
      {'aspectRatio' in node && node.aspectRatio ? (
        <InspectorMetric
          label="이미지 비율"
          value={imageAspectRatioLabels[node.aspectRatio]}
        />
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
  const current = isEditableNode(node) ? 1 : 0
  if (!isContainerNode(node)) {
    return current
  }

  return current + node.children.reduce((sum, child) => sum + countEditableNodes(child), 0)
}

function findFirstEditableNodeId(node: TreeNode): string | null {
  if (isEditableNode(node)) {
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

function isEditableNode(node: TreeNode): boolean {
  return node.type === 'text' || node.type === 'button' || node.type === 'image'
}

function isImageNode(node: TreeNode): node is ImageNode {
  return node.type === 'image'
}

function getSafeSelectedNodeId(tree: Tree, preferredNodeId: string): string {
  return (
    findNode(tree.root, preferredNodeId)?.id ??
    findFirstEditableNodeId(tree.root) ??
    tree.root.id
  )
}

function getStructureInfo(tree: Tree, nodeId: string): StructureInfo {
  if (tree.root.id === nodeId) {
    return { isRoot: true }
  }

  return findStructureInfo(tree.root, nodeId) ?? { isRoot: true }
}

function findStructureInfo(node: TreeNode, nodeId: string): StructureInfo | null {
  if (!isContainerNode(node)) {
    return null
  }

  const index = node.children.findIndex((child) => child.id === nodeId)
  if (index >= 0) {
    return {
      isRoot: false,
      parentId: node.id,
      index,
      siblingCount: node.children.length,
    }
  }

  for (const child of node.children) {
    const matched = findStructureInfo(child, nodeId)
    if (matched) {
      return matched
    }
  }

  return null
}

function parseOptionalNumber(
  value: string,
  min: number,
  max: number,
): number | undefined {
  if (value.trim() === '') {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }

  return Math.min(max, Math.max(min, parsed))
}

type TypographyDefaults = Required<Typography>

function getTypographyDefaults(node: TextNode): TypographyDefaults {
  switch (node.emphasis) {
    case 'heading-1':
      return {
        fontSize: 48,
        fontWeight: '600',
        lineHeight: 1.25,
        letterSpacing: 0,
        textAlign: 'left',
        fontFamily: 'sans',
      }
    case 'heading-2':
      return {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 1.35,
        letterSpacing: 0,
        textAlign: 'left',
        fontFamily: 'sans',
      }
    case 'heading-3':
      return {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 1.45,
        letterSpacing: 0,
        textAlign: 'left',
        fontFamily: 'sans',
      }
    case 'caption':
      return {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 1.35,
        letterSpacing: 0,
        textAlign: 'left',
        fontFamily: 'sans',
      }
    case 'body':
    default:
      return {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 1.75,
        letterSpacing: 0,
        textAlign: 'left',
        fontFamily: 'sans',
      }
  }
}

function createDuplicateNodeId(tree: Tree, nodeId: string): string {
  const existingIds = collectNodeIds(tree.root)
  const firstCandidate = `${nodeId}.copy`
  if (!existingIds.has(firstCandidate)) {
    return firstCandidate
  }

  let copyIndex = 2
  while (existingIds.has(`${nodeId}.copy-${copyIndex}`)) {
    copyIndex += 1
  }

  return `${nodeId}.copy-${copyIndex}`
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

function isContainerNode(node: TreeNode): node is ContainerNode {
  return 'children' in node
}

function getCanvasStyle(colorPreset: ColorPreset): CSSProperties {
  const colors = COLOR_PRESETS[colorPreset]

  return {
    '--dw-surface': colors.surface,
    '--dw-surface-muted': colors.surfaceMuted,
    '--dw-text-primary': colors.textPrimary,
    '--dw-text-muted': colors.textMuted,
    '--dw-accent': colors.accent,
    '--dw-accent-text': colors.accentText,
    '--dw-hero-surface': colors.heroSurface,
    '--dw-hero-text': colors.heroText,
    '--dw-border': colors.border,
    '--dw-image-surface': colors.imageSurface,
    '--dw-image-accent': colors.imageAccent,
    '--dw-selection-ring': hexToRgba(colors.accent, 0.22),
  } as CSSProperties
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255

  return `rgba(${red},${green},${blue},${alpha})`
}
