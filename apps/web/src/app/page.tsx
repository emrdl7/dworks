'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  COLOR_PRESETS,
  COLOR_PRESET_IDS,
  BUILT_IN_FONT_FAMILY_IDS,
  type BorderStyle,
  type ButtonNode,
  type BuiltInFontFamily,
  type ColorPreset,
  type FontFamily,
  type FontWeight,
  type ImageNode,
  type LayoutAlign,
  type LayoutDirection,
  type LayoutJustify,
  type LayoutWrap,
  type NodeColor,
  type NodeLayout,
  type ShadowPreset,
  type Shape,
  type Spacing,
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
  updateColor,
  updateButtonLabel,
  updateImage,
  updateLayout,
  updateShape,
  updateSpacing,
  updateStyleTokens,
  updateText,
  updateTextTypography,
} from '@dworks/tree-editor'
import {
  defaultTreeFixture,
  getTreeFixture,
  treeFixtures,
} from './tree-fixtures'
import {
  deleteRegisteredFont,
  generateFontId,
  getDefaultFontDisplayName,
  listRegisteredFonts,
  readSupportedFontFile,
  registerFontFace,
  saveRegisteredFont,
  toRegisteredFontSummary,
  type RegisteredFontRecord,
  type RegisteredFontSummary,
} from './font-registry'

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

const borderStyleLabels: Record<BorderStyle, string> = {
  solid: '실선',
  dashed: '점선',
  none: '없음',
}

const shadowPresetLabels: Record<ShadowPreset, string> = {
  none: '없음',
  sm: '옅게',
  md: '기본',
  lg: '진하게',
  xl: '매우 진하게',
}

const builtInFontFamilyLabels: Record<BuiltInFontFamily, string> = {
  sans: '산세리프',
  serif: '세리프',
  mono: '고정폭',
}

const layoutDirectionLabels: Record<LayoutDirection, string> = {
  row: '가로',
  column: '세로',
}

const layoutAlignLabels: Record<LayoutAlign, string> = {
  start: '시작',
  center: '가운데',
  end: '끝',
  stretch: '채움',
}

const layoutJustifyLabels: Record<LayoutJustify, string> = {
  start: '시작',
  center: '가운데',
  end: '끝',
  between: '양끝',
  evenly: '균등',
}

const layoutWrapLabels: Record<LayoutWrap, string> = {
  nowrap: '고정',
  wrap: '줄바꿈',
}

const fontWeightOptions: FontWeight[] = ['400', '500', '600', '700']
const textAlignOptions: TextAlign[] = ['left', 'center', 'right']
const borderStyleOptions: BorderStyle[] = ['solid', 'dashed', 'none']
const shadowPresetOptions: ShadowPreset[] = ['none', 'sm', 'md', 'lg', 'xl']
const builtInFontFamilyOptions = [...BUILT_IN_FONT_FAMILY_IDS]
const layoutDirectionOptions: LayoutDirection[] = ['row', 'column']
const layoutAlignOptions: LayoutAlign[] = ['start', 'center', 'end', 'stretch']
const layoutJustifyOptions: LayoutJustify[] = [
  'start',
  'center',
  'end',
  'between',
  'evenly',
]
const layoutWrapOptions: LayoutWrap[] = ['nowrap', 'wrap']
const UPLOAD_FONT_OPTION = '__upload-font__'
const typographyFields = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'fontFamily',
] as const
const spacingFields = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'gap',
] as const
const shapeFields = [
  'radius',
  'borderWidth',
  'borderColor',
  'borderStyle',
  'shadow',
] as const
const colorFields = ['backgroundColor', 'textColor'] as const
const layoutFields = ['direction', 'align', 'justify', 'wrap'] as const
type SpacingField = (typeof spacingFields)[number]
type ColorField = (typeof colorFields)[number]
type SpacingMode = 'all' | 'axis' | 'sides'

const spacingModes: SpacingMode[] = ['all', 'axis', 'sides']
const spacingModeLabels: Record<SpacingMode, string> = {
  all: '전체',
  axis: 'X-Y',
  sides: '4면',
}
const paddingSpacingFields: readonly SpacingField[] = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
]
const marginSpacingFields: readonly SpacingField[] = [
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
]
const paddingHorizontalFields: readonly SpacingField[] = [
  'paddingLeft',
  'paddingRight',
]
const paddingVerticalFields: readonly SpacingField[] = [
  'paddingTop',
  'paddingBottom',
]
const marginHorizontalFields: readonly SpacingField[] = [
  'marginLeft',
  'marginRight',
]
const marginVerticalFields: readonly SpacingField[] = [
  'marginTop',
  'marginBottom',
]

const DEFAULT_SHAPE_COLOR = '#d7ddd2'
const DEFAULT_COLOR_PICKER_COLOR = '#ffffff'
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const SHADOW_VALUES: Record<ShadowPreset, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg: '0 12px 32px rgba(0, 0, 0, 0.12)',
  xl: '0 24px 64px rgba(0, 0, 0, 0.16)',
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
  const [registeredFonts, setRegisteredFonts] = useState<RegisteredFontSummary[]>([])
  const [fontRegistryMessage, setFontRegistryMessage] = useState(
    '등록한 글꼴을 불러오는 중입니다.',
  )
  const [isFontRegistryBusy, setIsFontRegistryBusy] = useState(false)

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
  const fontUsageCounts = useMemo(
    () => countTypographyFontUsage(tree.root),
    [tree],
  )
  const colorPreset = tree.styleTokens?.colorPreset ?? 'mint'
  const canvasStyle = useMemo(
    () => getCanvasStyle(colorPreset),
    [colorPreset],
  )

  useEffect(() => {
    let isActive = true

    async function restoreFonts() {
      try {
        const fonts = await listRegisteredFonts()
        const summaries = await Promise.all(
          fonts.map(async (font) => {
            try {
              await registerFontFace(font)
              return toRegisteredFontSummary(font, 'available')
            } catch (error) {
              console.warn('글꼴 복원 실패', font.id, error)
              return toRegisteredFontSummary(font, 'missing')
            }
          }),
        )

        if (!isActive) {
          return
        }

        setRegisteredFonts(summaries)
        setFontRegistryMessage(
          summaries.length > 0
            ? `등록한 글꼴 ${summaries.length}개를 불러왔습니다.`
            : '등록된 글꼴 없음',
        )
      } catch (error) {
        if (!isActive) {
          return
        }

        setFontRegistryMessage(getFontRegistryErrorMessage(error))
      }
    }

    restoreFonts()

    return () => {
      isActive = false
    }
  }, [])

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

  function handleSpacingChange(node: TreeNode, patch: Partial<Spacing>) {
    commitTreeEdit(updateSpacing(tree, node.id, patch))
  }

  function handleSpacingReset(node: TreeNode) {
    commitTreeEdit(
      updateSpacing(
        tree,
        node.id,
        Object.fromEntries(
          spacingFields.map((field) => [field, undefined]),
        ) as Partial<Spacing>,
      ),
    )
  }

  function handleShapeChange(node: TreeNode, patch: Partial<Shape>) {
    commitTreeEdit(updateShape(tree, node.id, patch))
  }

  function handleShapeReset(node: TreeNode) {
    commitTreeEdit(
      updateShape(
        tree,
        node.id,
        Object.fromEntries(
          shapeFields.map((field) => [field, undefined]),
        ) as Partial<Shape>,
      ),
    )
  }

  function handleNodeColorChange(node: TreeNode, patch: Partial<NodeColor>) {
    commitTreeEdit(updateColor(tree, node.id, patch))
  }

  function handleNodeColorReset(node: TreeNode) {
    commitTreeEdit(
      updateColor(
        tree,
        node.id,
        Object.fromEntries(
          colorFields.map((field) => [field, undefined]),
        ) as Partial<NodeColor>,
      ),
    )
  }

  function handleLayoutChange(node: TreeNode, patch: Partial<NodeLayout>) {
    commitTreeEdit(updateLayout(tree, node.id, patch))
  }

  function handleLayoutReset(node: TreeNode) {
    commitTreeEdit(
      updateLayout(
        tree,
        node.id,
        Object.fromEntries(
          layoutFields.map((field) => [field, undefined]),
        ) as Partial<NodeLayout>,
      ),
    )
  }

  async function handleFontUpload(
    file: File,
    node: TextNode,
  ): Promise<RegisteredFontSummary | undefined> {
    setIsFontRegistryBusy(true)
    setFontRegistryMessage('글꼴을 등록하는 중입니다.')

    try {
      const { bytes, mimeType } = await readSupportedFontFile(file)
      const defaultName = getDefaultFontDisplayName(file.name)
      const displayName = window
        .prompt('글꼴 이름을 입력해주세요.', defaultName)
        ?.trim()

      if (!displayName) {
        setFontRegistryMessage('글꼴 등록을 취소했습니다.')
        return undefined
      }

      const existingIds = new Set([
        ...builtInFontFamilyOptions,
        ...registeredFonts.map((font) => font.id),
      ])
      const font: RegisteredFontRecord = {
        id: generateFontId(displayName, existingIds),
        displayName,
        fileName: file.name,
        mimeType,
        createdAt: new Date().toISOString(),
        bytes,
      }

      await registerFontFace(font)
      await saveRegisteredFont(font)

      const summary = toRegisteredFontSummary(font, 'available')
      setRegisteredFonts((fonts) => [...fonts, summary])
      setFontRegistryMessage(`${displayName} 글꼴을 등록했습니다.`)
      handleTextTypographyChange(node, { fontFamily: summary.id })

      return summary
    } catch (error) {
      setFontRegistryMessage(getFontRegistryErrorMessage(error))
      return undefined
    } finally {
      setIsFontRegistryBusy(false)
    }
  }

  async function handleFontDelete(fontId: string) {
    const font = registeredFonts.find((item) => item.id === fontId)

    if (!font) {
      return
    }

    const usageCount = fontUsageCounts.get(font.id) ?? 0
    const confirmed = window.confirm(
      usageCount > 0
        ? `이 글꼴은 ${usageCount}개 노드에서 사용 중입니다. 삭제 후 기본 글꼴로 표시됩니다. 삭제할까요?`
        : `${font.displayName} 글꼴을 삭제할까요?`,
    )

    if (!confirmed) {
      return
    }

    setIsFontRegistryBusy(true)
    setFontRegistryMessage('글꼴을 삭제하는 중입니다.')

    try {
      await deleteRegisteredFont(font.id)
      setRegisteredFonts((fonts) => fonts.filter((item) => item.id !== font.id))
      setFontRegistryMessage(`${font.displayName} 글꼴을 삭제했습니다.`)
    } catch (error) {
      setFontRegistryMessage(getFontRegistryErrorMessage(error))
    } finally {
      setIsFontRegistryBusy(false)
    }
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
            onSpacingChange={handleSpacingChange}
            onSpacingReset={handleSpacingReset}
            onShapeChange={handleShapeChange}
            onShapeReset={handleShapeReset}
            onNodeColorChange={handleNodeColorChange}
            onNodeColorReset={handleNodeColorReset}
            onLayoutChange={handleLayoutChange}
            onLayoutReset={handleLayoutReset}
            registeredFonts={registeredFonts}
            fontUsageCounts={fontUsageCounts}
            fontRegistryMessage={fontRegistryMessage}
            isFontRegistryBusy={isFontRegistryBusy}
            onFontUpload={handleFontUpload}
            onFontDelete={handleFontDelete}
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
  inheritedTextColor?: string
  node: TreeNode
  selectedNodeId: string
  onSelect: (nodeId: string) => void
}

function CanvasNode({
  inheritedTextColor,
  node,
  selectedNodeId,
  onSelect,
}: CanvasNodeProps) {
  const boxSpacingStyle = getBoxSpacingStyle(node.spacing)
  const gapSpacingStyle = getGapSpacingStyle(node.spacing)
  const containerSpacingStyle = getContainerSpacingStyle(node.spacing)
  const shapeStyle = getShapeStyle(node.shape)
  const colorStyle = getColorStyle(node.color, inheritedTextColor)
  const layoutStyle = getLayoutStyle(node.layout)
  const effectiveTextColor = node.color?.textColor ?? inheritedTextColor
  const textColorStyle = getTextColorStyle(effectiveTextColor)
  const boxStyle = mergeStyles(boxSpacingStyle, shapeStyle, colorStyle)
  const containerStyle = mergeStyles(containerSpacingStyle, shapeStyle, colorStyle)
  const childLayoutStyle = mergeStyles(gapSpacingStyle, layoutStyle)

  switch (node.type) {
    case 'section': {
      if (hasLayoutOverride(node.layout)) {
        return (
          <SelectableNode
            node={node}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          >
            <section
              className="flex flex-col gap-8 p-10"
              style={mergeStyles(boxStyle, childLayoutStyle)}
            >
              {node.children.map((child) => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  inheritedTextColor={effectiveTextColor}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                />
              ))}
            </section>
          </SelectableNode>
        )
      }

      const [firstChild, ...remainingChildren] = node.children
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <section className="flex flex-col gap-8 p-10" style={boxStyle}>
            {firstChild ? (
              <CanvasNode
                node={firstChild}
                inheritedTextColor={effectiveTextColor}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
              />
            ) : null}
            {node.layoutIntent === 'grid' ? (
              <div className="grid grid-cols-3 gap-8" style={gapSpacingStyle}>
                {remainingChildren.map((child) => (
                  <CanvasNode
                    key={child.id}
                    node={child}
                    inheritedTextColor={effectiveTextColor}
                    selectedNodeId={selectedNodeId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-10" style={gapSpacingStyle}>
                {remainingChildren.map((child) => (
                  <CanvasNode
                    key={child.id}
                    node={child}
                    inheritedTextColor={effectiveTextColor}
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

      if (hasLayoutOverride(node.layout)) {
        return (
          <SelectableNode
            node={node}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          >
            <section
              className="grid min-h-[420px] gap-10 bg-[var(--dw-hero-surface)] p-12 text-[var(--dw-hero-text)]"
              style={mergeStyles(containerStyle, childLayoutStyle)}
            >
              {node.children.map((child) => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  inheritedTextColor={effectiveTextColor}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                />
              ))}
            </section>
          </SelectableNode>
        )
      }

      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <section
            className={`grid min-h-[420px] gap-10 bg-[var(--dw-hero-surface)] p-12 text-[var(--dw-hero-text)] ${
              hasImage ? 'grid-cols-[1.05fr_0.95fr]' : 'grid-cols-1'
            }`}
            style={containerStyle}
          >
            <div className="flex flex-col justify-center gap-5">
              {contentChildren.map((child) => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  inheritedTextColor={effectiveTextColor}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                />
              ))}
            </div>
            {hasImage ? (
              <div className="flex min-h-[320px] flex-col gap-4">
                {imageChildren.map((child) => (
                  <CanvasNode
                    key={child.id}
                    node={child}
                    inheritedTextColor={effectiveTextColor}
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
          <article
            className="h-full rounded-lg border border-[var(--dw-border)] bg-[var(--dw-surface-muted)] p-5 shadow-sm"
            style={boxStyle}
          >
            <div className="flex flex-col gap-3" style={childLayoutStyle}>
              {node.children.map((child) => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  inheritedTextColor={effectiveTextColor}
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
          <div
            className="flex flex-col gap-3"
            style={mergeStyles(containerStyle, layoutStyle)}
          >
            {node.children.map((child) => (
              <CanvasNode
                key={child.id}
                node={child}
                inheritedTextColor={effectiveTextColor}
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
          <form
            className="mx-auto flex max-w-[520px] flex-col gap-5 rounded-lg border border-[var(--dw-border)] bg-[var(--dw-surface-muted)] p-8 shadow-sm"
            style={mergeStyles(containerStyle, layoutStyle)}
          >
            {node.children.map((child) => (
              <CanvasNode
                key={child.id}
                node={child}
                inheritedTextColor={effectiveTextColor}
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
          <div style={boxStyle}>
            <TextPreview node={node} textColorStyle={textColorStyle} />
          </div>
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
            style={boxStyle}
          >
            {node.label}
          </span>
        </SelectableNode>
      )

    case 'image':
      return (
        <SelectableNode node={node} selectedNodeId={selectedNodeId} onSelect={onSelect}>
          <ImagePreview
            key={node.src}
            node={node}
            fallbackStyle={colorStyle}
            style={boxStyle}
          />
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

function TextPreview({
  node,
  textColorStyle,
}: {
  node: TextNode
  textColorStyle?: CSSProperties
}) {
  const typographyStyle = getTypographyStyle(node.typography)
  const textStyle = mergeStyles(typographyStyle, textColorStyle)

  switch (node.emphasis) {
    case 'heading-1':
      return (
        <h2
          className="max-w-3xl text-5xl font-semibold leading-tight"
          style={textStyle}
        >
          {node.content}
        </h2>
      )
    case 'heading-2':
      return (
        <h3
          className="text-2xl font-semibold text-[var(--dw-text-primary)]"
          style={textStyle}
        >
          {node.content}
        </h3>
      )
    case 'heading-3':
      return (
        <h4
          className="text-lg font-semibold text-[var(--dw-text-primary)]"
          style={textStyle}
        >
          {node.content}
        </h4>
      )
    case 'caption':
      return (
        <p
          className="text-xs font-semibold uppercase text-[var(--dw-accent)]"
          style={textStyle}
        >
          {node.content}
        </p>
      )
    case 'body':
    default:
      return (
        <p className="max-w-2xl text-base leading-7" style={textStyle}>
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

function getBoxSpacingStyle(spacing?: Spacing): CSSProperties | undefined {
  if (!spacing) {
    return undefined
  }

  const style: CSSProperties = {
    ...(spacing.paddingTop !== undefined
      ? { paddingTop: `${spacing.paddingTop}px` }
      : {}),
    ...(spacing.paddingRight !== undefined
      ? { paddingRight: `${spacing.paddingRight}px` }
      : {}),
    ...(spacing.paddingBottom !== undefined
      ? { paddingBottom: `${spacing.paddingBottom}px` }
      : {}),
    ...(spacing.paddingLeft !== undefined
      ? { paddingLeft: `${spacing.paddingLeft}px` }
      : {}),
    ...(spacing.marginTop !== undefined
      ? { marginTop: `${spacing.marginTop}px` }
      : {}),
    ...(spacing.marginRight !== undefined
      ? { marginRight: `${spacing.marginRight}px` }
      : {}),
    ...(spacing.marginBottom !== undefined
      ? { marginBottom: `${spacing.marginBottom}px` }
      : {}),
    ...(spacing.marginLeft !== undefined
      ? { marginLeft: `${spacing.marginLeft}px` }
      : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}

function getGapSpacingStyle(spacing?: Spacing): CSSProperties | undefined {
  if (spacing?.gap === undefined) {
    return undefined
  }

  return { gap: `${spacing.gap}px` }
}

function hasLayoutOverride(layout?: NodeLayout): boolean {
  return layout !== undefined && Object.keys(layout).length > 0
}

function getLayoutStyle(layout?: NodeLayout): CSSProperties | undefined {
  if (!hasLayoutOverride(layout)) {
    return undefined
  }

  const style: CSSProperties = {
    display: 'flex',
    ...(layout?.direction !== undefined
      ? { flexDirection: layout.direction }
      : {}),
    ...(layout?.align !== undefined
      ? { alignItems: toFlexAlignment(layout.align) }
      : {}),
    ...(layout?.justify !== undefined
      ? { justifyContent: toFlexJustify(layout.justify) }
      : {}),
    ...(layout?.wrap !== undefined ? { flexWrap: layout.wrap } : {}),
  }

  return style
}

function toFlexAlignment(value: LayoutAlign): CSSProperties['alignItems'] {
  if (value === 'start') return 'flex-start'
  if (value === 'end') return 'flex-end'
  return value
}

function toFlexJustify(value: LayoutJustify): CSSProperties['justifyContent'] {
  if (value === 'start') return 'flex-start'
  if (value === 'end') return 'flex-end'
  if (value === 'between') return 'space-between'
  if (value === 'evenly') return 'space-evenly'
  return value
}

function getContainerSpacingStyle(spacing?: Spacing): CSSProperties | undefined {
  return mergeStyles(getBoxSpacingStyle(spacing), getGapSpacingStyle(spacing))
}

function getShapeStyle(shape?: Shape): CSSProperties | undefined {
  if (!shape) {
    return undefined
  }

  const hasBorderDetail =
    shape.borderWidth !== undefined ||
    shape.borderColor !== undefined ||
    shape.borderStyle !== undefined
  const effectiveBorderStyle =
    shape.borderStyle ?? (hasBorderDetail ? 'solid' : undefined)
  const effectiveBorderWidth =
    effectiveBorderStyle === undefined
      ? undefined
      : effectiveBorderStyle === 'none'
        ? 0
        : (shape.borderWidth ?? 1)
  const effectiveBorderColor =
    effectiveBorderStyle === undefined
      ? undefined
      : effectiveBorderStyle === 'none'
        ? 'transparent'
        : (shape.borderColor ?? 'var(--dw-border)')

  const style: CSSProperties = {
    ...(shape.radius !== undefined ? { borderRadius: `${shape.radius}px` } : {}),
    ...(effectiveBorderStyle !== undefined
      ? { borderStyle: effectiveBorderStyle }
      : {}),
    ...(effectiveBorderWidth !== undefined
      ? { borderWidth: `${effectiveBorderWidth}px` }
      : {}),
    ...(effectiveBorderColor !== undefined
      ? { borderColor: effectiveBorderColor }
      : {}),
    ...(shape.shadow !== undefined ? { boxShadow: SHADOW_VALUES[shape.shadow] } : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}

function getColorStyle(
  color?: NodeColor,
  inheritedTextColor?: string,
): CSSProperties | undefined {
  const style: CSSProperties = {
    ...(color?.backgroundColor !== undefined
      ? { backgroundColor: color.backgroundColor }
      : {}),
    ...(color?.textColor !== undefined || inheritedTextColor !== undefined
      ? { color: color?.textColor ?? inheritedTextColor }
      : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}

function getTextColorStyle(textColor?: string): CSSProperties | undefined {
  return textColor ? { color: textColor } : undefined
}

function mergeStyles(
  ...styles: Array<CSSProperties | undefined>
): CSSProperties | undefined {
  const merged = Object.assign({}, ...styles.filter(Boolean))
  return Object.keys(merged).length > 0 ? merged : undefined
}

function getFontFamilyStack(fontFamily: FontFamily): string {
  if (fontFamily === 'serif') {
    return 'ui-serif, "Noto Serif KR", Georgia, serif'
  }

  if (fontFamily === 'mono') {
    return 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'
  }

  if (fontFamily !== 'sans') {
    return `"${fontFamily.replaceAll('"', '\\"')}", ui-sans-serif, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`
  }

  return 'ui-sans-serif, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif'
}

function ImagePreview({
  fallbackStyle,
  node,
  style,
}: {
  fallbackStyle?: CSSProperties
  node: ImageNode
  style?: CSSProperties
}) {
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
      style={style}
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
        <div
          className="flex h-full w-full flex-col justify-end bg-[var(--dw-image-accent)] p-6 text-[var(--dw-text-primary)]"
          style={fallbackStyle}
        >
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
  onSpacingChange: (node: TreeNode, patch: Partial<Spacing>) => void
  onSpacingReset: (node: TreeNode) => void
  onShapeChange: (node: TreeNode, patch: Partial<Shape>) => void
  onShapeReset: (node: TreeNode) => void
  onNodeColorChange: (node: TreeNode, patch: Partial<NodeColor>) => void
  onNodeColorReset: (node: TreeNode) => void
  onLayoutChange: (node: TreeNode, patch: Partial<NodeLayout>) => void
  onLayoutReset: (node: TreeNode) => void
  registeredFonts: RegisteredFontSummary[]
  fontUsageCounts: Map<string, number>
  fontRegistryMessage: string
  isFontRegistryBusy: boolean
  onFontUpload: (
    file: File,
    node: TextNode,
  ) => Promise<RegisteredFontSummary | undefined>
  onFontDelete: (fontId: string) => Promise<void>
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
  onSpacingChange,
  onSpacingReset,
  onShapeChange,
  onShapeReset,
  onNodeColorChange,
  onNodeColorReset,
  onLayoutChange,
  onLayoutReset,
  registeredFonts,
  fontUsageCounts,
  fontRegistryMessage,
  isFontRegistryBusy,
  onFontUpload,
  onFontDelete,
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

        <NodeColorControls
          node={node}
          onNodeColorChange={onNodeColorChange}
          onNodeColorReset={onNodeColorReset}
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
              registeredFonts={registeredFonts}
              fontUsageCounts={fontUsageCounts}
              fontRegistryMessage={fontRegistryMessage}
              isFontRegistryBusy={isFontRegistryBusy}
              onFontUpload={onFontUpload}
              onFontDelete={onFontDelete}
            />
          </div>
        ) : null}

        <LayoutControls
          node={node}
          onLayoutChange={onLayoutChange}
          onLayoutReset={onLayoutReset}
          onSpacingChange={onSpacingChange}
        />

        <SpacingControls
          node={node}
          onSpacingChange={onSpacingChange}
          onSpacingReset={onSpacingReset}
        />

        <ShapeControls
          node={node}
          onShapeChange={onShapeChange}
          onShapeReset={onShapeReset}
        />

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

interface NodeColorControlsProps {
  node: TreeNode
  onNodeColorChange: (node: TreeNode, patch: Partial<NodeColor>) => void
  onNodeColorReset: (node: TreeNode) => void
}

function NodeColorControls({
  node,
  onNodeColorChange,
  onNodeColorReset,
}: NodeColorControlsProps) {
  const color = node.color ?? {}
  const [backgroundColorInput, setBackgroundColorInput] = useState(
    color.backgroundColor ?? '',
  )
  const [textColorInput, setTextColorInput] = useState(color.textColor ?? '')
  const [backgroundColorError, setBackgroundColorError] = useState(false)
  const [textColorError, setTextColorError] = useState(false)

  useEffect(() => {
    setBackgroundColorInput(color.backgroundColor ?? '')
    setBackgroundColorError(false)
  }, [node.id, color.backgroundColor])

  useEffect(() => {
    setTextColorInput(color.textColor ?? '')
    setTextColorError(false)
  }, [node.id, color.textColor])

  function updateColorFromText(field: ColorField, value: string) {
    const trimmedValue = value.trim()
    const setInput =
      field === 'backgroundColor' ? setBackgroundColorInput : setTextColorInput
    const setError =
      field === 'backgroundColor' ? setBackgroundColorError : setTextColorError

    setInput(value)

    if (trimmedValue === '') {
      setError(false)
      onNodeColorChange(node, { [field]: undefined })
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setError(true)
      return
    }

    setError(false)
    onNodeColorChange(node, { [field]: normalizeHexColor(trimmedValue) })
  }

  function updateColorFromPicker(field: ColorField, value: string) {
    const normalizedValue = normalizeHexColor(value)
    if (field === 'backgroundColor') {
      setBackgroundColorInput(normalizedValue)
      setBackgroundColorError(false)
    } else {
      setTextColorInput(normalizedValue)
      setTextColorError(false)
    }

    onNodeColorChange(node, { [field]: normalizedValue })
  }

  function renderColorField({
    error,
    field,
    inputValue,
    label,
  }: {
    error: boolean
    field: ColorField
    inputValue: string
    label: string
  }) {
    return (
      <label className="block">
        <span className="text-xs font-semibold text-[#4f5e56]">{label}</span>
        <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
          <input
            type="color"
            aria-label={`${label} 선택`}
            className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
            value={toColorInputValue(inputValue, DEFAULT_COLOR_PICKER_COLOR)}
            onChange={(event) => updateColorFromPicker(field, event.target.value)}
          />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={inputValue}
            placeholder="기본"
            aria-invalid={error}
            onChange={(event) => updateColorFromText(field, event.target.value)}
          />
        </span>
        {error ? (
          <span className="mt-2 block text-xs text-[#b42318]">
            HEX 형식 (#RRGGBB)으로 입력해주세요.
          </span>
        ) : null}
      </label>
    )
  }

  return (
    <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">색상</h3>
          <p className="mt-1 text-xs text-[#647067]">
            선택한 노드의 배경과 글자
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-[#1b7f72] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72]"
          onClick={() => onNodeColorReset(node)}
        >
          초기화
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {renderColorField({
          error: backgroundColorError,
          field: 'backgroundColor',
          inputValue: backgroundColorInput,
          label: '배경 색상',
        })}
        {renderColorField({
          error: textColorError,
          field: 'textColor',
          inputValue: textColorInput,
          label: '글자 색상',
        })}
      </div>
    </div>
  )
}

interface TypographyControlsProps {
  node: TextNode
  onTypographyChange: (node: TextNode, patch: Partial<Typography>) => void
  onTypographyReset: (node: TextNode) => void
  registeredFonts: RegisteredFontSummary[]
  fontUsageCounts: Map<string, number>
  fontRegistryMessage: string
  isFontRegistryBusy: boolean
  onFontUpload: (
    file: File,
    node: TextNode,
  ) => Promise<RegisteredFontSummary | undefined>
  onFontDelete: (fontId: string) => Promise<void>
}

function TypographyControls({
  node,
  onTypographyChange,
  onTypographyReset,
  registeredFonts,
  fontUsageCounts,
  fontRegistryMessage,
  isFontRegistryBusy,
  onFontUpload,
  onFontDelete,
}: TypographyControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const defaults = getTypographyDefaults(node)
  const typography = node.typography ?? {}
  const effectiveTextAlign = typography.textAlign ?? defaults.textAlign
  const effectiveFontFamily = typography.fontFamily ?? defaults.fontFamily
  const sliderFontSize = typography.fontSize ?? defaults.fontSize
  const hasSelectedMissingFont =
    !builtInFontFamilyOptions.includes(effectiveFontFamily as BuiltInFontFamily) &&
    !registeredFonts.some((font) => font.id === effectiveFontFamily)

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

  async function handleFontFileChange(fileList: FileList | null) {
    const file = fileList?.item(0)

    if (!file) {
      return
    }

    await onFontUpload(file, node)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleFontSelect(value: string) {
    if (value === UPLOAD_FONT_OPTION) {
      fileInputRef.current?.click()
      return
    }

    onTypographyChange(node, { fontFamily: value })
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

        <label className="block">
          <span className="text-xs font-semibold text-[#4f5e56]">글꼴</span>
          <select
            className="mt-2 h-9 w-full rounded-md border border-[#cbd6cf] bg-white px-2 text-xs font-semibold text-[#26312b] outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
            value={effectiveFontFamily}
            disabled={isFontRegistryBusy}
            onChange={(event) => handleFontSelect(event.target.value)}
          >
            {builtInFontFamilyOptions.map((family) => (
              <option key={family} value={family}>
                {builtInFontFamilyLabels[family]}
              </option>
            ))}
            {registeredFonts.length > 0 ? (
              <optgroup label="등록한 글꼴">
                {registeredFonts.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.status === 'missing'
                      ? `${font.displayName} (누락)`
                      : font.displayName}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {hasSelectedMissingFont ? (
              <option value={effectiveFontFamily}>
                누락된 글꼴 ({effectiveFontFamily})
              </option>
            ) : null}
            <option value={UPLOAD_FONT_OPTION}>+ TTF/OTF 업로드...</option>
          </select>
        </label>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf"
        className="sr-only"
        onChange={(event) => handleFontFileChange(event.target.files)}
      />
      <button
        type="button"
        className="mt-3 h-9 w-full rounded-md border border-dashed border-[#c9d4cd] bg-white px-3 text-xs font-semibold text-[#1b7f72] transition hover:bg-[#eef8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:text-[#8a958d] disabled:hover:bg-white"
        disabled={isFontRegistryBusy}
        onClick={() => fileInputRef.current?.click()}
      >
        {isFontRegistryBusy ? '글꼴 처리 중' : 'TTF/OTF 업로드'}
      </button>
      <p className="mt-2 text-xs leading-5 text-[#647067]">
        글꼴은 브라우저에만 저장됩니다. 등록한 글꼴의 라이선스 준수는 사용자 책임입니다.
      </p>
      <p className="mt-1 text-xs leading-5 text-[#647067]" aria-live="polite">
        {fontRegistryMessage}
      </p>
      {registeredFonts.length > 0 ? (
        <div className="mt-3 rounded-md border border-[#e0e5de] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#4f5e56]">
              등록한 글꼴
            </span>
            <span className="text-[11px] text-[#647067]">
              {registeredFonts.length}개
            </span>
          </div>
          <div className="mt-2 space-y-2">
            {registeredFonts.map((font) => (
              <div
                key={font.id}
                className="flex min-h-9 items-center justify-between gap-2 rounded-md border border-[#eef1ec] px-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#26312b]">
                    {font.displayName}
                    {font.status === 'missing' ? ' (누락)' : ''}
                  </p>
                  <p className="truncate text-[11px] text-[#647067]">
                    사용 {fontUsageCounts.get(font.id) ?? 0}개
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded border border-[#d7ddd2] px-2 py-1 text-[11px] font-semibold text-[#7f1d1d] transition hover:bg-[#fff1f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isFontRegistryBusy}
                  onClick={() => onFontDelete(font.id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface SpacingControlsProps {
  node: TreeNode
  onSpacingChange: (node: TreeNode, patch: Partial<Spacing>) => void
  onSpacingReset: (node: TreeNode) => void
}

interface LayoutControlsProps {
  node: TreeNode
  onLayoutChange: (node: TreeNode, patch: Partial<NodeLayout>) => void
  onLayoutReset: (node: TreeNode) => void
  onSpacingChange: (node: TreeNode, patch: Partial<Spacing>) => void
}

function LayoutControls({
  node,
  onLayoutChange,
  onLayoutReset,
  onSpacingChange,
}: LayoutControlsProps) {
  const canEditLayout = isContainerNode(node)
  const layout = node.layout ?? {}
  const spacing = node.spacing ?? {}

  function updateLayoutField<T extends keyof NodeLayout>(
    field: T,
    value: NodeLayout[T],
  ) {
    onLayoutChange(node, { [field]: value })
  }

  function renderToggleGroup<T extends keyof NodeLayout>({
    disabled,
    field,
    labels,
    options,
    title,
  }: {
    disabled: boolean
    field: T
    labels: Record<NonNullable<NodeLayout[T]>, string>
    options: Array<NonNullable<NodeLayout[T]>>
    title: string
  }) {
    return (
      <div>
        <span className="text-xs font-semibold text-[#4f5e56]">{title}</span>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {options.map((option) => (
            <TypographyToggleButton
              key={option}
              disabled={disabled}
              isSelected={layout[field] === option}
              onClick={() =>
                updateLayoutField(
                  field,
                  layout[field] === option ? undefined : option,
                )
              }
            >
              {labels[option]}
            </TypographyToggleButton>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">레이아웃</h3>
          <p className="mt-1 text-xs text-[#647067]">
            선택한 노드의 자식 배치
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-[#1b7f72] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:text-[#8a958d] disabled:hover:no-underline"
          disabled={!canEditLayout}
          onClick={() => onLayoutReset(node)}
        >
          초기화
        </button>
      </div>

      {!canEditLayout ? (
        <p className="mt-3 rounded-md border border-dashed border-[#c9d4cd] bg-white px-3 py-2 text-xs text-[#647067]">
          자식이 있는 노드에서 사용할 수 있습니다.
        </p>
      ) : null}

      <div className={canEditLayout ? 'mt-4 space-y-4' : 'mt-4 space-y-4 opacity-50'}>
        <div className="grid grid-cols-2 gap-3">
          {renderToggleGroup({
            disabled: !canEditLayout,
            field: 'direction',
            labels: layoutDirectionLabels,
            options: layoutDirectionOptions,
            title: '방향',
          })}
          {renderToggleGroup({
            disabled: !canEditLayout,
            field: 'wrap',
            labels: layoutWrapLabels,
            options: layoutWrapOptions,
            title: '줄바꿈',
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {renderToggleGroup({
            disabled: !canEditLayout,
            field: 'align',
            labels: layoutAlignLabels,
            options: layoutAlignOptions,
            title: '정렬',
          })}
          {renderToggleGroup({
            disabled: !canEditLayout,
            field: 'justify',
            labels: layoutJustifyLabels,
            options: layoutJustifyOptions,
            title: '분배',
          })}
        </div>

        <TypographyNumberField
          disabled={!canEditLayout}
          label="항목 간격"
          unit="px"
          min={0}
          max={200}
          step={1}
          value={spacing.gap}
          placeholder="기본"
          onChange={(value) =>
            onSpacingChange(node, {
              gap: parseOptionalNumber(value, 0, 200),
            })
          }
        />
      </div>
    </div>
  )
}

function SpacingControls({
  node,
  onSpacingChange,
  onSpacingReset,
}: SpacingControlsProps) {
  const [paddingMode, setPaddingMode] = useState<SpacingMode>('all')
  const [marginMode, setMarginMode] = useState<SpacingMode>('all')
  const spacing = node.spacing ?? {}
  const canEditGap = isContainerNode(node)

  function updateFields(
    fields: readonly SpacingField[],
    value: string,
    min: number,
    max: number,
  ) {
    const nextValue = parseOptionalNumber(value, min, max)
    onSpacingChange(
      node,
      Object.fromEntries(
        fields.map((field) => [field, nextValue]),
      ) as Partial<Spacing>,
    )
  }

  function updateField(
    field: SpacingField,
    value: string,
    min: number,
    max: number,
  ) {
    onSpacingChange(node, {
      [field]: parseOptionalNumber(value, min, max),
    })
  }

  function renderModeButtons(
    mode: SpacingMode,
    onModeChange: (mode: SpacingMode) => void,
  ) {
    return (
      <div className="mt-3 grid grid-cols-3 gap-1">
        {spacingModes.map((modeOption) => (
          <TypographyToggleButton
            key={modeOption}
            isSelected={mode === modeOption}
            onClick={() => onModeChange(modeOption)}
          >
            {spacingModeLabels[modeOption]}
          </TypographyToggleButton>
        ))}
      </div>
    )
  }

  function renderSpacingGroup({
    title,
    mode,
    onModeChange,
    fields,
    horizontalFields,
    verticalFields,
    min,
    max,
    placeholder,
  }: {
    title: string
    mode: SpacingMode
    onModeChange: (mode: SpacingMode) => void
    fields: readonly SpacingField[]
    horizontalFields: readonly SpacingField[]
    verticalFields: readonly SpacingField[]
    min: number
    max: number
    placeholder: string
  }) {
    const topField = fields[0] as SpacingField
    const rightField = fields[1] as SpacingField
    const bottomField = fields[2] as SpacingField
    const leftField = fields[3] as SpacingField

    return (
      <div className="rounded-md border border-[#e0e5de] bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold text-[#4f5e56]">{title}</h4>
          <span className="text-[11px] font-semibold text-[#647067]">px</span>
        </div>
        {renderModeButtons(mode, onModeChange)}
        {mode === 'all' ? (
          <div className="mt-3">
            <TypographyNumberField
              label="전체"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={getSpacingGroupValue(spacing, fields)}
              placeholder={placeholder}
              onChange={(value) => updateFields(fields, value, min, max)}
            />
          </div>
        ) : null}
        {mode === 'axis' ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <TypographyNumberField
              label="가로"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={getSpacingGroupValue(spacing, horizontalFields)}
              placeholder={placeholder}
              onChange={(value) =>
                updateFields(horizontalFields, value, min, max)
              }
            />
            <TypographyNumberField
              label="세로"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={getSpacingGroupValue(spacing, verticalFields)}
              placeholder={placeholder}
              onChange={(value) => updateFields(verticalFields, value, min, max)}
            />
          </div>
        ) : null}
        {mode === 'sides' ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <TypographyNumberField
              label="위"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={spacing[topField]}
              placeholder={placeholder}
              onChange={(value) => updateField(topField, value, min, max)}
            />
            <TypographyNumberField
              label="오른쪽"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={spacing[rightField]}
              placeholder={placeholder}
              onChange={(value) => updateField(rightField, value, min, max)}
            />
            <TypographyNumberField
              label="아래"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={spacing[bottomField]}
              placeholder={placeholder}
              onChange={(value) => updateField(bottomField, value, min, max)}
            />
            <TypographyNumberField
              label="왼쪽"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={spacing[leftField]}
              placeholder={placeholder}
              onChange={(value) => updateField(leftField, value, min, max)}
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">간격</h3>
          <p className="mt-1 text-xs text-[#647067]">
            선택한 노드의 여백 조정
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-[#1b7f72] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72]"
          onClick={() => onSpacingReset(node)}
        >
          초기화
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {renderSpacingGroup({
          title: '안쪽 여백',
          mode: paddingMode,
          onModeChange: setPaddingMode,
          fields: paddingSpacingFields,
          horizontalFields: paddingHorizontalFields,
          verticalFields: paddingVerticalFields,
          min: 0,
          max: 500,
          placeholder: '기본',
        })}
        {renderSpacingGroup({
          title: '바깥 여백',
          mode: marginMode,
          onModeChange: setMarginMode,
          fields: marginSpacingFields,
          horizontalFields: marginHorizontalFields,
          verticalFields: marginVerticalFields,
          min: -200,
          max: 500,
          placeholder: '음수 가능',
        })}
        {canEditGap ? (
          <div className="rounded-md border border-[#e0e5de] bg-white p-3">
            <TypographyNumberField
              label="자식 간격"
              unit="px"
              min={0}
              max={200}
              step={1}
              value={spacing.gap}
              placeholder="기본"
              onChange={(value) => updateField('gap', value, 0, 200)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

interface ShapeControlsProps {
  node: TreeNode
  onShapeChange: (node: TreeNode, patch: Partial<Shape>) => void
  onShapeReset: (node: TreeNode) => void
}

function ShapeControls({
  node,
  onShapeChange,
  onShapeReset,
}: ShapeControlsProps) {
  const shape = node.shape ?? {}
  const [borderColorInput, setBorderColorInput] = useState(shape.borderColor ?? '')
  const [borderColorError, setBorderColorError] = useState(false)
  const isBorderDisabled = shape.borderStyle === 'none'

  useEffect(() => {
    setBorderColorInput(shape.borderColor ?? '')
    setBorderColorError(false)
  }, [node.id, shape.borderColor])

  function updateRadius(value: string) {
    onShapeChange(node, {
      radius: parseOptionalNumber(value, 0, 120),
    })
  }

  function updateBorderWidth(value: string) {
    const nextValue = parseOptionalNumber(value, 0, 20)

    if (nextValue === undefined) {
      onShapeChange(node, { borderWidth: undefined })
      return
    }

    if (nextValue === 0) {
      onShapeChange(node, {
        borderWidth: 0,
        borderStyle: 'none',
      })
      return
    }

    onShapeChange(node, {
      borderWidth: nextValue,
      borderStyle:
        shape.borderStyle === undefined || shape.borderStyle === 'none'
          ? 'solid'
          : shape.borderStyle,
    })
  }

  function updateBorderStyle(value: string) {
    if (value === '') {
      onShapeChange(node, { borderStyle: undefined })
      return
    }

    const nextStyle = value as BorderStyle
    if (nextStyle === 'none') {
      onShapeChange(node, {
        borderStyle: 'none',
        borderWidth: 0,
      })
      return
    }

    onShapeChange(node, {
      borderStyle: nextStyle,
      borderWidth:
        shape.borderWidth === undefined || shape.borderWidth === 0
          ? 1
          : shape.borderWidth,
    })
  }

  function updateBorderColorFromText(value: string) {
    const trimmedValue = value.trim()
    setBorderColorInput(value)

    if (trimmedValue === '') {
      setBorderColorError(false)
      onShapeChange(node, { borderColor: undefined })
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setBorderColorError(true)
      return
    }

    setBorderColorError(false)
    onShapeChange(node, {
      borderColor: normalizeHexColor(trimmedValue),
      ...getVisibleBorderPatch(shape),
    })
  }

  function updateBorderColorFromPicker(value: string) {
    setBorderColorInput(value)
    setBorderColorError(false)
    onShapeChange(node, {
      borderColor: normalizeHexColor(value),
      ...getVisibleBorderPatch(shape),
    })
  }

  function updateShadow(value: string) {
    onShapeChange(node, {
      shadow: value === '' ? undefined : (value as ShadowPreset),
    })
  }

  return (
    <div className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">모양</h3>
          <p className="mt-1 text-xs text-[#647067]">
            선택한 노드의 테두리와 그림자
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-[#1b7f72] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72]"
          onClick={() => onShapeReset(node)}
        >
          초기화
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <TypographyNumberField
          label="모서리"
          unit="px"
          min={0}
          max={120}
          step={1}
          value={shape.radius}
          placeholder="기본"
          onChange={updateRadius}
        />
        <label className="block">
          <span className="text-xs font-semibold text-[#4f5e56]">
            테두리 종류
          </span>
          <select
            className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
            value={shape.borderStyle ?? ''}
            onChange={(event) => updateBorderStyle(event.target.value)}
          >
            <option value="">기본</option>
            {borderStyleOptions.map((style) => (
              <option key={style} value={style}>
                {borderStyleLabels[style]}
              </option>
            ))}
          </select>
        </label>

        <TypographyNumberField
          label="테두리 두께"
          unit="px"
          min={0}
          max={20}
          step={1}
          value={shape.borderWidth}
          placeholder={isBorderDisabled ? '없음' : '기본'}
          disabled={isBorderDisabled}
          onChange={updateBorderWidth}
        />
        <label className={isBorderDisabled ? 'block opacity-50' : 'block'}>
          <span className="text-xs font-semibold text-[#4f5e56]">
            테두리 색상
          </span>
          <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
            <input
              type="color"
              aria-label="테두리 색상 선택"
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0 disabled:cursor-not-allowed"
              value={toColorInputValue(borderColorInput)}
              disabled={isBorderDisabled}
              onChange={(event) => updateBorderColorFromPicker(event.target.value)}
            />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
              value={borderColorInput}
              placeholder={isBorderDisabled ? '없음' : DEFAULT_SHAPE_COLOR}
              aria-invalid={borderColorError}
              disabled={isBorderDisabled}
              onChange={(event) => updateBorderColorFromText(event.target.value)}
            />
          </span>
          {borderColorError ? (
            <span className="mt-2 block text-xs text-[#b42318]">
              HEX 형식 (#RRGGBB)으로 입력해주세요.
            </span>
          ) : null}
        </label>

        <label className="col-span-2 block">
          <span className="text-xs font-semibold text-[#4f5e56]">그림자</span>
          <select
            className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
            value={shape.shadow ?? ''}
            onChange={(event) => updateShadow(event.target.value)}
          >
            <option value="">기본</option>
            {shadowPresetOptions.map((shadow) => (
              <option key={shadow} value={shadow}>
                {shadowPresetLabels[shadow]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

interface TypographyNumberFieldProps {
  disabled?: boolean
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
  disabled = false,
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
    <label className={disabled ? 'block opacity-50' : 'block'}>
      <span className="text-xs font-semibold text-[#4f5e56]">{label}</span>
      <span className="mt-2 flex h-10 items-center rounded-md border border-[#cbd6cf] bg-white focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
        <input
          className="h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ''}
          placeholder={placeholder}
          disabled={disabled}
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
  disabled?: boolean
  isSelected: boolean
  onClick: () => void
}

function TypographyToggleButton({
  children,
  disabled = false,
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
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white`}
      disabled={disabled}
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

function countTypographyFontUsage(
  node: TreeNode,
  counts = new Map<string, number>(),
): Map<string, number> {
  if (node.type === 'text' && node.typography?.fontFamily) {
    counts.set(
      node.typography.fontFamily,
      (counts.get(node.typography.fontFamily) ?? 0) + 1,
    )
  }

  if (!isContainerNode(node)) {
    return counts
  }

  for (const child of node.children) {
    countTypographyFontUsage(child, counts)
  }

  return counts
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

function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value)
}

function normalizeHexColor(value: string): string {
  return value.trim().toLowerCase()
}

function toColorInputValue(
  value: string,
  fallback = DEFAULT_SHAPE_COLOR,
): string {
  const normalizedValue = normalizeHexColor(value)
  if (!isValidHexColor(normalizedValue)) {
    return fallback
  }

  if (normalizedValue.length === 4) {
    const red = normalizedValue.slice(1, 2)
    const green = normalizedValue.slice(2, 3)
    const blue = normalizedValue.slice(3, 4)
    return `#${red}${red}${green}${green}${blue}${blue}`
  }

  return normalizedValue
}

function getVisibleBorderPatch(shape: Partial<Shape>): Partial<Shape> {
  return {
    borderStyle:
      shape.borderStyle === undefined || shape.borderStyle === 'none'
        ? 'solid'
        : shape.borderStyle,
    borderWidth:
      shape.borderWidth === undefined || shape.borderWidth === 0
        ? 1
        : shape.borderWidth,
  }
}

function getSpacingGroupValue(
  spacing: Partial<Spacing>,
  fields: readonly SpacingField[],
): number | undefined {
  const values = fields
    .map((field) => spacing[field])
    .filter((value): value is number => value !== undefined)

  if (values.length === 0) {
    return undefined
  }

  const first = values[0]
  if (values.every((value) => value === first)) {
    return first
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  return Number(average.toFixed(2))
}

function getFontRegistryErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.name === 'QuotaExceededError' ||
      error.message.includes('quota') ||
      error.message.includes('Quota')
    ) {
      return '브라우저 저장 공간이 부족합니다. 등록한 글꼴을 정리해주세요.'
    }

    return error.message
  }

  return '글꼴 작업에 실패했습니다.'
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
