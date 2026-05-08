'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import Image from 'next/image'
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceAround,
  AlignHorizontalSpaceBetween,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Columns2,
  Copy,
  GripVertical,
  Move,
  PanelTop,
  Redo2,
  Rows2,
  Square,
  StretchHorizontal,
  StretchVertical,
  Trash2,
  Undo2,
  WrapText,
  type LucideIcon,
} from 'lucide-react'
import {
  COLOR_PRESETS,
  COLOR_PRESET_IDS,
  BUILT_IN_FONT_FAMILY_IDS,
  GRADIENT_DIRECTION_IDS,
  GRADIENT_TYPE_IDS,
  type BorderStyle,
  type ButtonNode,
  type BuiltInFontFamily,
  type ColorPreset,
  type CustomShadow,
  type FocalPoint,
  type FontFamily,
  type FontWeight,
  type Gradient,
  type GradientDirection,
  type GradientType,
  type ImageAspectRatio,
  type ImageFit,
  type ImageNode,
  type ImagePresentation,
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
  type TextShadow,
  type Tree,
  type TreeNode,
  type Typography,
} from '@dworks/tree'
import {
  deleteNode,
  duplicateNode,
  moveNode,
  type NodeMetaPatch,
  updateColor,
  updateButtonLabel,
  updateImage,
  updateLayout,
  updateNodeMeta,
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
  getRegisteredFontFamilyId,
  getRegisteredFontFamilyName,
  getRegisteredFontWeight,
  inferFontMetadata,
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

interface ContextMenuState {
  nodeId: string
  x: number
  y: number
}

type LayerDropPosition = 'before' | 'after'

interface LayerDragState {
  nodeId: string
}

interface LayerDropTarget {
  nodeId: string
  position: LayerDropPosition
}

interface LayerReorderPlan {
  finalIndex: number
  sourceIndex: number
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

const imageFitLabels: Record<ImageFit, string> = {
  cover: '채우기',
  contain: '맞춤',
}

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
  '100': '씬',
  '200': '엑스트라 라이트',
  '300': '라이트',
  '400': '보통',
  '500': '중간',
  '600': '세미볼드',
  '700': '볼드',
  '800': '엑스트라볼드',
  '900': '블랙',
}

const textAlignTitles: Record<TextAlign, string> = {
  left: '왼쪽 정렬',
  center: '가운데 정렬',
  right: '오른쪽 정렬',
}
const textAlignIcons: Record<TextAlign, LucideIcon> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
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
const layoutDirectionIcons: Record<LayoutDirection, LucideIcon> = {
  row: Columns2,
  column: Rows2,
}

const layoutAlignLabels: Record<LayoutAlign, string> = {
  start: '시작',
  center: '가운데',
  end: '끝',
  stretch: '채움',
}
const layoutAlignIcons: Record<LayoutAlign, LucideIcon> = {
  start: AlignVerticalJustifyStart,
  center: AlignVerticalJustifyCenter,
  end: AlignVerticalJustifyEnd,
  stretch: StretchVertical,
}

const layoutJustifyLabels: Record<LayoutJustify, string> = {
  start: '시작',
  center: '가운데',
  end: '끝',
  between: '양끝',
  evenly: '균등',
}
const layoutJustifyIcons: Record<LayoutJustify, LucideIcon> = {
  start: AlignHorizontalJustifyStart,
  center: AlignHorizontalJustifyCenter,
  end: AlignHorizontalJustifyEnd,
  between: AlignHorizontalSpaceBetween,
  evenly: AlignHorizontalSpaceAround,
}

const layoutWrapLabels: Record<LayoutWrap, string> = {
  nowrap: '고정',
  wrap: '줄바꿈',
}
const layoutWrapIcons: Record<LayoutWrap, LucideIcon> = {
  nowrap: StretchHorizontal,
  wrap: WrapText,
}

const gradientDirectionLabels: Record<GradientDirection, string> = {
  'to-top': '위로',
  'to-top-right': '우상',
  'to-right': '오른쪽',
  'to-bottom-right': '우하',
  'to-bottom': '아래로',
  'to-bottom-left': '좌하',
  'to-left': '왼쪽',
  'to-top-left': '좌상',
}
const gradientDirectionIcons: Record<GradientDirection, LucideIcon> = {
  'to-top': ArrowUp,
  'to-top-right': ArrowUpRight,
  'to-right': ArrowRight,
  'to-bottom-right': ArrowDownRight,
  'to-bottom': ArrowDown,
  'to-bottom-left': ArrowDownLeft,
  'to-left': ArrowLeft,
  'to-top-left': ArrowUpLeft,
}
const gradientTypeLabels: Record<GradientType, string> = {
  linear: '선형',
  radial: '원형',
}

const fontWeightOptions: FontWeight[] = [
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
]
const textAlignOptions: TextAlign[] = ['left', 'center', 'right']
const borderStyleOptions: BorderStyle[] = ['solid', 'dashed', 'none']
const shadowPresetOptions: ShadowPreset[] = ['none', 'sm', 'md', 'lg', 'xl']
const imageAspectRatioOptions: ImageAspectRatio[] = [
  'square',
  'landscape',
  'portrait',
  'wide',
]
const imageFitOptions: ImageFit[] = ['cover', 'contain']
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
const gradientDirectionOptions: GradientDirection[] = [...GRADIENT_DIRECTION_IDS]
const gradientTypeOptions: GradientType[] = [...GRADIENT_TYPE_IDS]
const REGISTERED_FONT_FAMILY_OPTION_PREFIX = 'registered-family:'
const MAX_FONT_UPLOAD_FILES = 20
const typographyFields = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'fontFamily',
  'textShadow',
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
  'radiusTopLeft',
  'radiusTopRight',
  'radiusBottomRight',
  'radiusBottomLeft',
  'borderWidth',
  'borderColor',
  'borderOpacity',
  'borderStyle',
  'shadow',
  'customShadow',
] as const
const colorFields = [
  'backgroundColor',
  'backgroundOpacity',
  'backgroundGradient',
  'textColor',
  'textOpacity',
  'accentColor',
  'accentOpacity',
] as const
const layoutFields = ['direction', 'align', 'justify', 'wrap'] as const
const imagePresentationFields = [
  'fit',
  'overlayColor',
  'overlayOpacity',
  'overlayGradient',
] as const
type SpacingField = (typeof spacingFields)[number]
type ColorField = Extract<
  (typeof colorFields)[number],
  'backgroundColor' | 'textColor' | 'accentColor'
>
type ColorOpacityField = Extract<
  (typeof colorFields)[number],
  'backgroundOpacity' | 'textOpacity' | 'accentOpacity'
>
type ShapeRadiusField = Extract<
  (typeof shapeFields)[number],
  'radiusTopLeft' | 'radiusTopRight' | 'radiusBottomRight' | 'radiusBottomLeft'
>
type CustomShadowNumberField = 'offsetX' | 'offsetY' | 'blur' | 'spread'
type ImagePresentationField = (typeof imagePresentationFields)[number]
type SpacingMode = 'all' | 'axis' | 'sides'
type ShapeRadiusMode = 'all' | 'corners'
type GradientColorStopField = 'from' | 'to'
type GradientOpacityStopField = 'fromOpacity' | 'toOpacity'
type ColorMode = 'solid' | 'gradient'
type TextShadowNumberField = 'offsetX' | 'offsetY' | 'blur'

const spacingModes: SpacingMode[] = ['all', 'axis', 'sides']
const spacingModeLabels: Record<SpacingMode, string> = {
  all: '전체',
  axis: 'X-Y',
  sides: '4면',
}
const spacingModeIcons: Record<SpacingMode, LucideIcon> = {
  all: Square,
  axis: Move,
  sides: PanelTop,
}
const responsiveViewportPresets = {
  mobile: { label: '모바일', width: 375 },
  tablet: { label: '태블릿', width: 768 },
  desktop: { label: '데스크톱', width: 1200 },
} as const
type ResponsiveViewport = keyof typeof responsiveViewportPresets
const responsiveViewportOptions: ResponsiveViewport[] = [
  'mobile',
  'tablet',
  'desktop',
]
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
const shapeCornerRadiusFields: readonly ShapeRadiusField[] = [
  'radiusTopLeft',
  'radiusTopRight',
  'radiusBottomLeft',
  'radiusBottomRight',
]
const shapeCornerRadiusLabels: Record<ShapeRadiusField, string> = {
  radiusTopLeft: '좌상',
  radiusTopRight: '우상',
  radiusBottomLeft: '좌하',
  radiusBottomRight: '우하',
}

const DEFAULT_SHAPE_COLOR = '#d7ddd2'
const DEFAULT_COLOR_PICKER_COLOR = '#ffffff'
const DEFAULT_TEXT_PICKER_COLOR = '#18211d'
const DEFAULT_ACCENT_PICKER_COLOR = '#1b7f72'
const DEFAULT_IMAGE_OVERLAY_COLOR = '#000000'
const DEFAULT_GRADIENT_TO_COLOR = '#000000'
const DEFAULT_GRADIENT_DIRECTION: GradientDirection = 'to-bottom-right'
const DEFAULT_GRADIENT_TYPE: GradientType = 'linear'
const DEFAULT_CUSTOM_SHADOW: CustomShadow = {
  offsetX: 0,
  offsetY: 4,
  blur: 12,
  spread: 0,
  color: '#000000',
  opacity: 0.25,
}
const DEFAULT_TEXT_SHADOW: TextShadow = {
  offsetX: 0,
  offsetY: 2,
  blur: 4,
  color: '#000000',
  opacity: 0.25,
}
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const HISTORY_MERGE_WINDOW_MS = 600
const SHADOW_VALUES: Record<ShadowPreset, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg: '0 12px 32px rgba(0, 0, 0, 0.12)',
  xl: '0 24px 64px rgba(0, 0, 0, 0.16)',
}
const GRADIENT_DIRECTION_CSS: Record<GradientDirection, string> = {
  'to-top': 'to top',
  'to-top-right': 'to top right',
  'to-right': 'to right',
  'to-bottom-right': 'to bottom right',
  'to-bottom': 'to bottom',
  'to-bottom-left': 'to bottom left',
  'to-left': 'to left',
  'to-top-left': 'to top left',
}

const MAX_HISTORY = 100

interface CommitTreeEditOptions {
  mergeKey?: string
}

interface HistoryMergeState {
  key: string
  time: number
}

type ImageEditPatch = Pick<
  Partial<ImageNode>,
  'src' | 'alt' | 'aspectRatio' | 'focalPoint'
> & {
  presentation?: Partial<ImagePresentation>
}

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
  const [responsiveViewport, setResponsiveViewport] =
    useState<ResponsiveViewport>('desktop')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [layerDrag, setLayerDrag] = useState<LayerDragState | null>(null)
  const [layerDropTarget, setLayerDropTarget] = useState<LayerDropTarget | null>(
    null,
  )
  const lastHistoryMergeRef = useRef<HistoryMergeState | null>(null)

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
  const contextMenuNode = useMemo(
    () => (contextMenu ? findNode(tree.root, contextMenu.nodeId) : null),
    [contextMenu, tree],
  )
  const contextMenuStructureInfo = useMemo(
    () => (contextMenu ? getStructureInfo(tree, contextMenu.nodeId) : null),
    [contextMenu, tree],
  )
  const layerItems = useMemo(() => flattenTree(tree.root), [tree])
  const editableCount = useMemo(() => countEditableNodes(tree.root), [tree])
  const fontUsageCounts = useMemo(
    () => countTypographyFontUsage(tree.root),
    [tree],
  )
  const colorPreset = tree.styleTokens?.colorPreset ?? 'mint'
  const selectedViewportPreset = responsiveViewportPresets[responsiveViewport]
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

  useEffect(() => {
    if (!contextMenu || contextMenuNode) {
      return
    }

    setContextMenu(null)
  }, [contextMenu, contextMenuNode])

  function handleFixtureChange(fixtureId: string) {
    const nextFixture = getTreeFixture(fixtureId) ?? defaultTreeFixture
    setSelectedFixtureId(nextFixture.id)
    setTree(nextFixture.tree)
    setHistoryPast([])
    setHistoryFuture([])
    lastHistoryMergeRef.current = null
    setSelectedNodeId(
      findFirstEditableNodeId(nextFixture.tree.root) ?? nextFixture.tree.root.id,
    )
  }

  function commitTreeEdit(
    nextTree: Tree,
    nextSelectedNodeId?: string,
    options: CommitTreeEditOptions = {},
  ) {
    const now = Date.now()
    const previousMerge = lastHistoryMergeRef.current
    const shouldMergeHistory =
      options.mergeKey !== undefined &&
      previousMerge?.key === options.mergeKey &&
      now - previousMerge.time <= HISTORY_MERGE_WINDOW_MS

    setHistoryPast((past) =>
      shouldMergeHistory ? past : [...past, tree].slice(-MAX_HISTORY),
    )
    setHistoryFuture([])
    setTree(nextTree)
    setSelectedNodeId((currentNodeId) =>
      getSafeSelectedNodeId(nextTree, nextSelectedNodeId ?? currentNodeId),
    )
    lastHistoryMergeRef.current =
      options.mergeKey === undefined ? null : { key: options.mergeKey, time: now }
  }

  function openContextMenu(
    nodeId: string,
    position: Pick<ContextMenuState, 'x' | 'y'>,
  ) {
    setSelectedNodeId(nodeId)
    setContextMenu({ nodeId, ...position })
  }

  function openPointerContextMenu(
    nodeId: string,
    event: ReactMouseEvent<HTMLElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()
    openContextMenu(nodeId, { x: event.clientX, y: event.clientY })
  }

  function openElementContextMenu(nodeId: string, element: HTMLElement) {
    const bounds = element.getBoundingClientRect()
    openContextMenu(nodeId, {
      x: bounds.left + 16,
      y: bounds.top + Math.min(bounds.height, 32),
    })
  }

  function openKeyboardContextMenu(
    nodeId: string,
    event: KeyboardEvent<HTMLElement>,
  ) {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    openElementContextMenu(nodeId, event.currentTarget)
  }

  function closeContextMenu() {
    setContextMenu(null)
  }

  function handleTextChange(node: TextNode, content: string) {
    commitTreeEdit(updateText(tree, node.id, content))
  }

  function handleTextTypographyChange(
    node: TextNode,
    patch: Partial<Typography>,
    options?: CommitTreeEditOptions,
  ) {
    commitTreeEdit(updateTextTypography(tree, node.id, patch), undefined, options)
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

  function handleShapeChange(
    node: TreeNode,
    patch: Partial<Shape>,
    options?: CommitTreeEditOptions,
  ) {
    commitTreeEdit(updateShape(tree, node.id, patch), undefined, options)
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

  function handleNodeColorChange(
    node: TreeNode,
    patch: Partial<NodeColor>,
    options?: CommitTreeEditOptions,
  ) {
    commitTreeEdit(updateColor(tree, node.id, patch), undefined, options)
  }

  function handleNodeMetaChange(
    node: TreeNode,
    patch: NodeMetaPatch,
    options?: CommitTreeEditOptions,
  ) {
    commitTreeEdit(updateNodeMeta(tree, node.id, patch), undefined, options)
  }

  function handleNodeColorReset(node: TreeNode) {
    const resetColorTree = updateColor(
      tree,
      node.id,
      Object.fromEntries(
        colorFields.map((field) => [field, undefined]),
      ) as Partial<NodeColor>,
    )

    commitTreeEdit(
      updateNodeMeta(resetColorTree, node.id, {
        opacity: undefined,
      }),
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
    files: File[],
    node: TextNode,
  ): Promise<RegisteredFontSummary[]> {
    if (files.length === 0) {
      return []
    }

    if (files.length > MAX_FONT_UPLOAD_FILES) {
      setFontRegistryMessage(
        `한 번에 최대 ${MAX_FONT_UPLOAD_FILES}개까지 등록할 수 있습니다.`,
      )
      return []
    }

    const isBatchUpload = files.length > 1
    setIsFontRegistryBusy(true)
    setFontRegistryMessage(
      isBatchUpload
        ? `글꼴 ${files.length}개를 등록하는 중입니다.`
        : '글꼴을 등록하는 중입니다.',
    )

    try {
      const existingIds = new Set([
        ...builtInFontFamilyOptions,
        ...registeredFonts.map((font) => font.id),
      ])
      const uploadedFonts: RegisteredFontSummary[] = []
      const failures: string[] = []
      const replacedFontIds = new Set<string>()

      for (const [index, file] of files.entries()) {
        if (isBatchUpload) {
          setFontRegistryMessage(`등록 중... (${index + 1}/${files.length})`)
        }

        try {
          const { bytes, mimeType } = await readSupportedFontFile(file)
          const defaultName = getDefaultFontDisplayName(file.name)
          const displayName = isBatchUpload
            ? defaultName
            : window.prompt('글꼴 이름을 입력해주세요.', defaultName)?.trim()

          if (!displayName) {
            if (!isBatchUpload) {
              setFontRegistryMessage('글꼴 등록을 취소했습니다.')
              return []
            }

            failures.push(file.name)
            continue
          }

          const metadata = inferFontMetadata(displayName, file.name)
          const duplicateFont = findDuplicateFontVariant(
            [...registeredFonts, ...uploadedFonts],
            metadata,
          )
          const font: RegisteredFontRecord = {
            id: duplicateFont?.id ?? generateFontId(displayName, existingIds),
            displayName,
            ...metadata,
            fileName: file.name,
            mimeType,
            createdAt: new Date().toISOString(),
            bytes,
          }

          await registerFontFace(font)
          await saveRegisteredFont(font)

          const summary = toRegisteredFontSummary(font, 'available')
          replaceRegisteredFontSummary(uploadedFonts, summary)
          existingIds.add(font.id)

          if (duplicateFont) {
            replacedFontIds.add(duplicateFont.id)
          }
        } catch (error) {
          console.warn('글꼴 등록 실패', file.name, error)
          const failureMessage = getFontRegistryErrorMessage(error)

          if (!isBatchUpload) {
            setFontRegistryMessage(failureMessage)
            return []
          }

          failures.push(failureMessage)
        }
      }

      if (uploadedFonts.length === 0) {
        setFontRegistryMessage(
          failures.length > 0
            ? `글꼴 ${failures.length}개 등록에 실패했습니다.`
            : '글꼴 등록을 취소했습니다.',
        )
        return []
      }

      setRegisteredFonts((fonts) => mergeRegisteredFontSummaries(fonts, uploadedFonts))
      setFontRegistryMessage(
        getFontUploadMessage(
          uploadedFonts,
          failures,
          replacedFontIds.size,
        ),
      )
      handleTextTypographyChange(
        node,
        {
          fontFamily: getRegisteredFontFamilyId(
            getPreferredUploadedFont(
              uploadedFonts,
              node.typography?.fontWeight ?? getTypographyDefaults(node).fontWeight,
            ),
          ),
        },
      )

      return uploadedFonts
    } catch (error) {
      setFontRegistryMessage(getFontRegistryErrorMessage(error))
      return []
    } finally {
      setIsFontRegistryBusy(false)
    }
  }

  async function handleFontDelete(fontId: string) {
    const font = registeredFonts.find((item) => item.id === fontId)

    if (!font) {
      return
    }

    const familyName = getRegisteredFontFamilyName(font)
    const usageCount = fontUsageCounts.get(getRegisteredFontFamilyId(font)) ?? 0
    const confirmed = window.confirm(
      usageCount > 0
        ? `${familyName} 패밀리는 ${usageCount}개 노드에서 사용 중입니다. 이 파일을 삭제하면 해당 굵기는 기본 표시로 대체될 수 있습니다. 삭제할까요?`
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

  async function handleFontFamilyDelete(familyId: string) {
    const familyFonts = registeredFonts.filter(
      (font) => getRegisteredFontFamilyId(font) === familyId,
    )

    if (familyFonts.length === 0) {
      return
    }

    const familyName = getRegisteredFontFamilyName(familyFonts[0]!)
    const usageCount = fontUsageCounts.get(familyId) ?? 0
    const confirmed = window.confirm(
      usageCount > 0
        ? `${familyName} 글꼴 그룹은 ${usageCount}개 노드에서 사용 중입니다. 등록된 ${familyFonts.length}개 파일을 모두 삭제하면 기본 글꼴로 표시됩니다. 삭제할까요?`
        : `${familyName} 글꼴 그룹의 ${familyFonts.length}개 파일을 모두 삭제할까요?`,
    )

    if (!confirmed) {
      return
    }

    setIsFontRegistryBusy(true)
    setFontRegistryMessage('글꼴 그룹을 삭제하는 중입니다.')

    try {
      for (const font of familyFonts) {
        await deleteRegisteredFont(font.id)
      }

      setRegisteredFonts((fonts) =>
        fonts.filter((font) => getRegisteredFontFamilyId(font) !== familyId),
      )
      setFontRegistryMessage(
        `${familyName} 글꼴 그룹 ${familyFonts.length}개 파일을 삭제했습니다.`,
      )
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
    patch: ImageEditPatch,
    options?: CommitTreeEditOptions,
  ) {
    commitTreeEdit(updateImage(tree, node.id, patch), undefined, options)
  }

  function handleMoveNode(nodeId: string, direction: 'up' | 'down') {
    commitTreeEdit(moveNode(tree, nodeId, direction), nodeId)
    closeContextMenu()
  }

  function clearLayerDragState() {
    setLayerDrag(null)
    setLayerDropTarget(null)
  }

  function handleLayerDragStart(
    nodeId: string,
    event: ReactDragEvent<HTMLButtonElement>,
  ) {
    const structureInfo = getStructureInfo(tree, nodeId)
    if (structureInfo.isRoot) {
      event.preventDefault()
      return
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', nodeId)
    setSelectedNodeId(nodeId)
    setLayerDrag({ nodeId })
    setLayerDropTarget(null)
    closeContextMenu()
  }

  function handleLayerDragOver(
    targetNodeId: string,
    event: ReactDragEvent<HTMLDivElement>,
  ) {
    const sourceNodeId = layerDrag?.nodeId ?? event.dataTransfer.getData('text/plain')
    if (sourceNodeId) {
      event.preventDefault()
    }

    const position = getLayerDropPosition(event)
    const plan = sourceNodeId
      ? getLayerReorderPlan(tree, sourceNodeId, targetNodeId, position)
      : null

    if (!plan) {
      if (layerDropTarget?.nodeId === targetNodeId) {
        setLayerDropTarget(null)
      }
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setLayerDropTarget((current) =>
      current?.nodeId === targetNodeId && current.position === position
        ? current
        : { nodeId: targetNodeId, position },
    )
  }

  function handleLayerDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    const relatedTarget = event.relatedTarget
    if (
      relatedTarget instanceof Node &&
      event.currentTarget.contains(relatedTarget)
    ) {
      return
    }

    setLayerDropTarget((current) =>
      current?.nodeId === event.currentTarget.dataset.layerNodeId ? null : current,
    )
  }

  function handleLayerDrop(
    targetNodeId: string,
    event: ReactDragEvent<HTMLDivElement>,
  ) {
    const sourceNodeId = layerDrag?.nodeId ?? event.dataTransfer.getData('text/plain')
    const position = getLayerDropPosition(event)
    const plan = sourceNodeId
      ? getLayerReorderPlan(tree, sourceNodeId, targetNodeId, position)
      : null

    if (!sourceNodeId || !plan) {
      clearLayerDragState()
      return
    }

    const nextTree = reorderLayerNode(tree, sourceNodeId, plan)
    commitTreeEdit(nextTree, sourceNodeId)
    clearLayerDragState()
  }

  function handleMoveSelected(direction: 'up' | 'down') {
    handleMoveNode(selectedNodeId, direction)
  }

  function handleDuplicateNode(nodeId: string) {
    const duplicatedNodeId = createDuplicateNodeId(tree, nodeId)
    commitTreeEdit(duplicateNode(tree, nodeId, duplicatedNodeId), duplicatedNodeId)
    closeContextMenu()
  }

  function handleDuplicateSelected() {
    handleDuplicateNode(selectedNodeId)
  }

  function handleDeleteNode(nodeId: string) {
    const structureInfo = getStructureInfo(tree, nodeId)
    if (structureInfo.isRoot) {
      return
    }

    const nextTree = deleteNode(tree, nodeId)
    commitTreeEdit(nextTree, structureInfo.parentId)
    closeContextMenu()
  }

  function handleDeleteSelected() {
    handleDeleteNode(selectedNodeId)
  }

  function handleToggleNodeVisibility(node: TreeNode) {
    handleNodeMetaChange(node, {
      hidden: node.hidden === true ? undefined : true,
    })
    closeContextMenu()
  }

  function handleToggleNodeCanvasSelection(node: TreeNode) {
    handleNodeMetaChange(node, {
      pointerEvents: node.pointerEvents === 'none' ? undefined : 'none',
    })
    closeContextMenu()
  }

  function handleColorPresetChange(nextColorPreset: ColorPreset) {
    commitTreeEdit(updateStyleTokens(tree, { colorPreset: nextColorPreset }))
  }

  function handleUndo() {
    const previousTree = historyPast.at(-1)
    if (!previousTree) {
      return
    }

    lastHistoryMergeRef.current = null
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

    lastHistoryMergeRef.current = null
    setHistoryFuture((future) => future.slice(0, -1))
    setHistoryPast((past) => [...past, tree].slice(-MAX_HISTORY))
    setTree(nextTree)
    setSelectedNodeId((currentNodeId) => getSafeSelectedNodeId(nextTree, currentNodeId))
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#18211d]">
      <header className="flex h-14 items-center justify-between border-b border-[#d7ddd2] bg-white px-5">
        <div className="flex items-center gap-4">
          <DworksLogo />
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
          <ViewportSwitcher
            value={responsiveViewport}
            onChange={setResponsiveViewport}
          />
          <div className="flex items-center gap-1">
            <HistoryButton
              ariaLabel="실행 취소"
              disabled={historyPast.length === 0}
              icon={Undo2}
              onClick={handleUndo}
            />
            <HistoryButton
              ariaLabel="다시 실행"
              disabled={historyFuture.length === 0}
              icon={Redo2}
              onClick={handleRedo}
            />
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

      <div className="grid h-[calc(100vh-56px)] min-h-0 grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="min-h-0 border-r border-[#d7ddd2] bg-[#fbfcfa]">
          <div className="border-b border-[#e0e5de] px-4 py-3">
            <h2 className="text-sm font-semibold">레이어</h2>
          </div>
          <nav className="max-h-[calc(100vh-105px)] overflow-auto p-2">
            {layerItems.map(({ node, depth }) => {
              const structureInfo = getStructureInfo(tree, node.id)
              const isRoot = structureInfo.isRoot
              const dropPosition =
                layerDropTarget?.nodeId === node.id
                  ? layerDropTarget.position
                  : null
              const isDragging = layerDrag?.nodeId === node.id

              return (
                <div
                  key={node.id}
                  data-layer-node-id={node.id}
                  className="relative py-0.5"
                  onDragLeave={handleLayerDragLeave}
                  onDragOver={(event) => handleLayerDragOver(node.id, event)}
                  onDrop={(event) => handleLayerDrop(node.id, event)}
                  onContextMenu={(event) => openPointerContextMenu(node.id, event)}
                >
                  {dropPosition ? (
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute left-2 right-2 z-10 flex items-center ${
                        dropPosition === 'before' ? '-top-1' : '-bottom-1'
                      }`}
                    >
                      <span className="h-0.5 flex-1 rounded bg-[#1b7f72]" />
                      <span className="ml-2 rounded-full bg-[#1b7f72] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                        여기에 놓기
                      </span>
                    </span>
                  ) : null}
                  <div
                    className={`flex items-center gap-1 rounded-md pr-2 text-sm transition ${
                      node.id === selectedNodeId
                        ? 'bg-[#dff1ee] text-[#073d37]'
                        : 'text-[#26312b] hover:bg-[#eef3ed]'
                    } ${isDragging ? 'opacity-50' : ''}`}
                    style={{ paddingLeft: 8 + depth * 14 }}
                  >
                    <button
                      type="button"
                      aria-label={
                        isRoot
                          ? `${node.id} 루트는 이동할 수 없습니다`
                          : `${node.id} 순서 이동`
                      }
                      className="flex h-8 w-7 shrink-0 items-center justify-center rounded text-[#6d7a72] outline-none transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:text-[#b5beb8] disabled:hover:bg-transparent"
                      disabled={isRoot}
                      draggable={!isRoot}
                      title={isRoot ? '루트는 이동할 수 없습니다' : '순서 이동'}
                      onDragEnd={clearLayerDragState}
                      onDragStart={(event) => handleLayerDragStart(node.id, event)}
                    >
                      <GripVertical aria-hidden="true" size={15} />
                    </button>
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-2 text-left outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1b7f72]"
                      onClick={() => setSelectedNodeId(node.id)}
                      onKeyDown={(event) => openKeyboardContextMenu(node.id, event)}
                    >
                      <span className="min-w-0 truncate">{node.id}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        {getNodeLayerStateChips(node).map((chip) => (
                          <span
                            key={chip}
                            className="rounded border border-[#d5b56c] bg-[#fff8df] px-1.5 py-0.5 text-[11px] font-semibold text-[#6b4b00]"
                          >
                            {chip}
                          </span>
                        ))}
                        <span className="rounded border border-[#cfd8d2] bg-white px-1.5 py-0.5 text-[11px] text-[#647067]">
                          {nodeTypeLabels[node.type]}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>

        <section
          className="min-h-0 min-w-0 overflow-auto bg-[#eef2ec]"
          onContextMenu={(event) => {
            const target = event.target
            if (!(target instanceof Element)) {
              return
            }

            const nodeElement = target.closest<HTMLElement>('[data-dworks-node-id]')
            const nodeId = nodeElement?.dataset.dworksNodeId
            if (!nodeId) {
              return
            }

            openPointerContextMenu(nodeId, event)
          }}
          onKeyDownCapture={(event) => {
            if (
              event.key !== 'ContextMenu' &&
              !(event.shiftKey && event.key === 'F10')
            ) {
              return
            }

            const target = event.target
            if (!(target instanceof Element)) {
              return
            }

            const nodeElement = target.closest<HTMLElement>('[data-dworks-node-id]')
            const nodeId = nodeElement?.dataset.dworksNodeId
            if (!nodeId) {
              return
            }

            event.preventDefault()
            event.stopPropagation()
            openElementContextMenu(nodeId, nodeElement)
          }}
        >
          <div
            className="px-8 py-8"
            style={{ minWidth: selectedViewportPreset.width + 64 }}
          >
            <div
              className="mx-auto border border-[var(--dw-border)] bg-[var(--dw-surface)] text-[var(--dw-text-primary)]"
              style={{
                ...canvasStyle,
                width: selectedViewportPreset.width,
              }}
            >
              <CanvasNode
                node={tree.root}
                selectedNodeId={selectedNodeId}
                onSelect={setSelectedNodeId}
              />
            </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-hidden border-l border-[#d7ddd2] bg-white">
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
            onNodeMetaChange={handleNodeMetaChange}
            onLayoutChange={handleLayoutChange}
            onLayoutReset={handleLayoutReset}
            registeredFonts={registeredFonts}
            fontUsageCounts={fontUsageCounts}
            fontRegistryMessage={fontRegistryMessage}
            isFontRegistryBusy={isFontRegistryBusy}
            onFontUpload={handleFontUpload}
            onFontDelete={handleFontDelete}
            onFontFamilyDelete={handleFontFamilyDelete}
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
      {contextMenu && contextMenuNode && contextMenuStructureInfo ? (
        <NodeContextMenu
          node={contextMenuNode}
          position={contextMenu}
          structureInfo={contextMenuStructureInfo}
          onClose={closeContextMenu}
          onDelete={() => handleDeleteNode(contextMenuNode.id)}
          onDuplicate={() => handleDuplicateNode(contextMenuNode.id)}
          onMoveDown={() => handleMoveNode(contextMenuNode.id, 'down')}
          onMoveUp={() => handleMoveNode(contextMenuNode.id, 'up')}
          onToggleCanvasSelection={() =>
            handleToggleNodeCanvasSelection(contextMenuNode)
          }
          onToggleVisibility={() => handleToggleNodeVisibility(contextMenuNode)}
        />
      ) : null}
    </main>
  )
}

interface HistoryButtonProps {
  ariaLabel: string
  disabled: boolean
  icon: LucideIcon
  onClick: () => void
}

function HistoryButton({
  ariaLabel,
  disabled,
  icon: Icon,
  onClick,
}: HistoryButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-[#c9d4cd] bg-white text-[#26312b] transition hover:bg-[#eef3ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
    </button>
  )
}

function DworksLogo() {
  return (
    <div className="flex min-w-40 items-center gap-2.5">
      <Image
        src="/dworks-logo.png"
        alt="Dworks"
        width={32}
        height={32}
        priority
        className="h-8 w-8 rounded-md object-contain"
      />
      <div>
        <h1 className="text-base font-semibold leading-tight">Dworks</h1>
        <p className="text-xs text-[#647067]">디자인 편집기</p>
      </div>
    </div>
  )
}

interface ViewportSwitcherProps {
  onChange: (viewport: ResponsiveViewport) => void
  value: ResponsiveViewport
}

function ViewportSwitcher({ onChange, value }: ViewportSwitcherProps) {
  const selectedPreset = responsiveViewportPresets[value]

  return (
    <div className="flex items-center gap-2 text-xs text-[#4f5e56]">
      <span className="font-semibold">화면</span>
      <div
        role="group"
        aria-label="캔버스 화면 폭"
        className="flex h-9 rounded-md border border-[#c9d4cd] bg-[#eef3ed] p-0.5"
      >
        {responsiveViewportOptions.map((viewport) => {
          const preset = responsiveViewportPresets[viewport]
          const isSelected = viewport === value

          return (
            <button
              key={viewport}
              type="button"
              aria-pressed={isSelected}
              className={`min-w-16 rounded px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] ${
                isSelected
                  ? 'bg-white text-[#073d37] shadow-sm'
                  : 'text-[#4f5e56] hover:bg-white/70'
              }`}
              onClick={() => onChange(viewport)}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
      <span className="rounded-full border border-[#c9d4cd] bg-white px-3 py-1 font-semibold text-[#26312b]">
        {selectedPreset.width}px
      </span>
    </div>
  )
}

interface NodeContextMenuProps {
  node: TreeNode
  onClose: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveDown: () => void
  onMoveUp: () => void
  onToggleCanvasSelection: () => void
  onToggleVisibility: () => void
  position: Pick<ContextMenuState, 'x' | 'y'>
  structureInfo: StructureInfo
}

function NodeContextMenu({
  node,
  onClose,
  onDelete,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onToggleCanvasSelection,
  onToggleVisibility,
  position,
  structureInfo,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const canMoveUp = !structureInfo.isRoot && (structureInfo.index ?? 0) > 0
  const canMoveDown =
    !structureInfo.isRoot &&
    (structureInfo.index ?? 0) < (structureInfo.siblingCount ?? 0) - 1
  const canEditStructure = !structureInfo.isRoot
  const isVisible = node.hidden !== true
  const isCanvasSelectable = node.pointerEvents !== 'none'

  useEffect(() => {
    const firstEnabledItem = getContextMenuItems(menuRef.current)[0]
    firstEnabledItem?.focus()

    function handlePointerDown(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (!menuRef.current?.contains(target)) {
        onClose()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', onClose)
    window.addEventListener('scroll', onClose, true)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    event.preventDefault()

    const items = getContextMenuItems(menuRef.current)
    if (items.length === 0) {
      return
    }

    const currentIndex = items.findIndex((item) => item === document.activeElement)
    const nextIndex =
      event.key === 'ArrowDown'
        ? currentIndex < 0
          ? 0
          : (currentIndex + 1) % items.length
        : currentIndex <= 0
          ? items.length - 1
          : currentIndex - 1

    items[nextIndex]?.focus()
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${node.id} 컨텍스트 메뉴`}
      className="fixed z-50 min-w-52 rounded-md border border-[#c9d4cd] bg-white p-1 shadow-xl"
      style={{
        left: position.x,
        top: position.y,
      }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
    >
      <ContextMenuButton disabled={!canMoveUp} onClick={onMoveUp}>
        위로 이동
      </ContextMenuButton>
      <ContextMenuButton disabled={!canMoveDown} onClick={onMoveDown}>
        아래로 이동
      </ContextMenuButton>
      <ContextMenuButton disabled={!canEditStructure} onClick={onDuplicate}>
        복제
      </ContextMenuButton>
      <ContextMenuButton
        disabled={!canEditStructure}
        onClick={onDelete}
        tone="danger"
      >
        삭제
      </ContextMenuButton>
      <div className="my-1 h-px bg-[#e0e5de]" role="separator" />
      <ContextMenuButton
        checked={isVisible}
        onClick={onToggleVisibility}
        roleType="menuitemcheckbox"
      >
        캔버스에 표시
      </ContextMenuButton>
      <ContextMenuButton
        checked={isCanvasSelectable}
        disabled={!isVisible}
        onClick={onToggleCanvasSelection}
        roleType="menuitemcheckbox"
      >
        캔버스에서 선택
      </ContextMenuButton>
    </div>
  )
}

interface ContextMenuButtonProps {
  checked?: boolean
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  roleType?: 'menuitem' | 'menuitemcheckbox'
  tone?: 'neutral' | 'danger'
}

function ContextMenuButton({
  checked,
  children,
  disabled = false,
  onClick,
  roleType = 'menuitem',
  tone = 'neutral',
}: ContextMenuButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-[#7a1f1f] hover:bg-[#fff1f1] focus-visible:bg-[#fff1f1]'
      : 'text-[#26312b] hover:bg-[#eef8f6] focus-visible:bg-[#eef8f6]'

  return (
    <button
      type="button"
      role={roleType}
      aria-checked={roleType === 'menuitemcheckbox' ? checked : undefined}
      className={`flex min-h-9 w-full items-center justify-between gap-3 rounded px-3 text-left text-sm font-semibold outline-none transition disabled:cursor-not-allowed disabled:text-[#9aa49d] disabled:hover:bg-transparent ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span>{children}</span>
      {roleType === 'menuitemcheckbox' ? (
        <span className="text-xs text-[#1b7f72]">{checked ? '켬' : '끔'}</span>
      ) : null}
    </button>
  )
}

function getContextMenuItems(menu: HTMLDivElement | null): HTMLButtonElement[] {
  if (!menu) {
    return []
  }

  return Array.from(menu.querySelectorAll<HTMLButtonElement>('button')).filter(
    (item) => !item.disabled,
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
  if (node.hidden === true) {
    return null
  }

  const boxSpacingStyle = getBoxSpacingStyle(node.spacing)
  const gapSpacingStyle = getGapSpacingStyle(node.spacing)
  const containerSpacingStyle = getContainerSpacingStyle(node.spacing)
  const shapeStyle = getShapeStyle(node.shape)
  const colorStyle = getColorStyle(node.color, inheritedTextColor)
  const accentBackgroundStyle = getAccentBackgroundStyle(node.color)
  const accentTextColorStyle = getAccentTextColorStyle(node.color)
  const layoutStyle = getLayoutStyle(node.layout)
  const effectiveTextColor =
    node.color?.textColor !== undefined || inheritedTextColor !== undefined
      ? getCssColorWithOpacity(
          node.color?.textColor ?? inheritedTextColor ?? '',
          node.color?.textOpacity,
        )
      : undefined
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
            <TextPreview
              node={node}
              accentColorStyle={accentTextColorStyle}
              textColorStyle={textColorStyle}
            />
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
            style={
              node.variant === 'secondary'
                ? boxStyle
                : mergeStyles(boxStyle, accentBackgroundStyle)
            }
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
  const isCanvasSelectable = node.pointerEvents !== 'none'
  const nodeMetaStyle: CSSProperties = {
    pointerEvents: isCanvasSelectable ? 'auto' : 'none',
    ...(node.opacity === undefined ? {} : { opacity: node.opacity }),
  }

  function selectNode() {
    if (!isCanvasSelectable) {
      return
    }

    onSelect(node.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!isCanvasSelectable) {
      return
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    onSelect(node.id)
  }

  return (
    <div
      role="button"
      tabIndex={isCanvasSelectable ? 0 : -1}
      data-dworks-node-id={node.id}
      className={`relative border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-accent)] ${
        isSelected
          ? 'border-[var(--dw-accent)] shadow-[0_0_0_3px_var(--dw-selection-ring)]'
          : 'border-transparent hover:border-[var(--dw-border)]'
      }`}
      style={nodeMetaStyle}
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

function getNodeLayerStateChips(node: TreeNode): string[] {
  const chips: string[] = []

  if (node.hidden === true) {
    chips.push('숨김')
  }

  if (node.pointerEvents === 'none') {
    chips.push('선택 제외')
  }

  return chips
}

function TextPreview({
  accentColorStyle,
  node,
  textColorStyle,
}: {
  accentColorStyle?: CSSProperties
  node: TextNode
  textColorStyle?: CSSProperties
}) {
  const typographyStyle = getTypographyStyle(node.typography)
  const textStyle = mergeStyles(typographyStyle, textColorStyle)
  const captionTextStyle = mergeStyles(textStyle, accentColorStyle)
  const content = parseInlineMarkdown(node.content)

  switch (node.emphasis) {
    case 'heading-1':
      return (
        <h2
          className="max-w-3xl text-5xl font-semibold leading-tight"
          style={textStyle}
        >
          {content}
        </h2>
      )
    case 'heading-2':
      return (
        <h3
          className="text-2xl font-semibold text-[var(--dw-text-primary)]"
          style={textStyle}
        >
          {content}
        </h3>
      )
    case 'heading-3':
      return (
        <h4
          className="text-lg font-semibold text-[var(--dw-text-primary)]"
          style={textStyle}
        >
          {content}
        </h4>
      )
    case 'caption':
      return (
        <p
          className="text-xs font-semibold uppercase text-[var(--dw-accent)]"
          style={captionTextStyle}
        >
          {content}
        </p>
      )
    case 'body':
    default:
      return (
        <p className="max-w-2xl text-base leading-7" style={textStyle}>
          {content}
        </p>
      )
  }
}

function parseInlineMarkdown(content: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const inlinePattern =
    /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g
  let lastIndex = 0

  for (const match of content.matchAll(inlinePattern)) {
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      nodes.push(content.slice(lastIndex, matchIndex))
    }

    const rawMatch = match[0]
    const linkText = match[1]
    const linkHref = match[2]
    const boldText = match[3]
    const italicText = match[4]
    const key = `${matchIndex}-${rawMatch.length}`

    if (linkText !== undefined && linkHref !== undefined) {
      const safeHref = getSafeInlineHref(linkHref)

      if (safeHref) {
        nodes.push(
          <a
            key={`link-${key}`}
            className="font-semibold text-[var(--dw-accent)] underline underline-offset-4"
            href={safeHref}
            target={isFragmentHref(safeHref) ? undefined : '_blank'}
            rel={isFragmentHref(safeHref) ? undefined : 'noopener noreferrer'}
            onClick={(event) => event.preventDefault()}
          >
            {linkText}
          </a>,
        )
      } else {
        nodes.push(rawMatch)
      }
    } else if (boldText !== undefined) {
      nodes.push(
        <strong key={`bold-${key}`} className="font-semibold">
          {boldText}
        </strong>,
      )
    } else if (italicText !== undefined) {
      nodes.push(
        <em key={`italic-${key}`} className="italic">
          {italicText}
        </em>,
      )
    }

    lastIndex = matchIndex + rawMatch.length
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [content]
}

function getSafeInlineHref(href: string): string | null {
  const trimmedHref = href.trim()

  if (trimmedHref.length === 0 || /[\u0000-\u001f\u007f]/.test(trimmedHref)) {
    return null
  }

  if (isFragmentHref(trimmedHref)) {
    return trimmedHref
  }

  try {
    const parsedUrl = new URL(trimmedHref)
    const allowedProtocols = new Set(['http:', 'https:', 'mailto:'])

    return allowedProtocols.has(parsedUrl.protocol) ? trimmedHref : null
  } catch {
    return null
  }
}

function isFragmentHref(href: string): boolean {
  return href.startsWith('#')
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
    ...(typography.textShadow !== undefined
      ? { textShadow: textShadowToCss(typography.textShadow) }
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

  const borderRadius = getBorderRadiusValue(shape)
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
        : getCssColorWithOpacity(
            shape.borderColor ?? 'var(--dw-border)',
            shape.borderOpacity,
          )

  const style: CSSProperties = {
    ...(borderRadius !== undefined ? { borderRadius } : {}),
    ...(effectiveBorderStyle !== undefined
      ? { borderStyle: effectiveBorderStyle }
      : {}),
    ...(effectiveBorderWidth !== undefined
      ? { borderWidth: `${effectiveBorderWidth}px` }
      : {}),
    ...(effectiveBorderColor !== undefined
      ? { borderColor: effectiveBorderColor }
      : {}),
    ...(shape.customShadow !== undefined
      ? { boxShadow: customShadowToCss(shape.customShadow) }
      : shape.shadow !== undefined
        ? { boxShadow: SHADOW_VALUES[shape.shadow] }
        : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}

function getBorderRadiusValue(shape: Shape): string | undefined {
  if (hasCornerRadiusOverride(shape)) {
    return [
      getResolvedCornerRadius(shape, 'radiusTopLeft'),
      getResolvedCornerRadius(shape, 'radiusTopRight'),
      getResolvedCornerRadius(shape, 'radiusBottomRight'),
      getResolvedCornerRadius(shape, 'radiusBottomLeft'),
    ]
      .map((value) => `${value}px`)
      .join(' ')
  }

  return shape.radius !== undefined ? `${shape.radius}px` : undefined
}

function getColorStyle(
  color?: NodeColor,
  inheritedTextColor?: string,
): CSSProperties | undefined {
  const effectiveTextColor =
    color?.textColor !== undefined || inheritedTextColor !== undefined
      ? getCssColorWithOpacity(
          color?.textColor ?? inheritedTextColor ?? '',
          color?.textOpacity,
        )
      : undefined
  const style: CSSProperties = {
    ...(color?.backgroundGradient !== undefined
      ? { backgroundImage: gradientToCss(color.backgroundGradient) }
      : {}),
    ...(color?.backgroundGradient === undefined &&
    color?.backgroundColor !== undefined
      ? {
          backgroundColor: getCssColorWithOpacity(
            color.backgroundColor,
            color.backgroundOpacity,
          ),
        }
      : {}),
    ...(effectiveTextColor !== undefined ? { color: effectiveTextColor } : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}

function getAccentBackgroundStyle(color?: NodeColor): CSSProperties | undefined {
  return color?.accentColor === undefined
    ? undefined
    : {
        backgroundColor: getCssColorWithOpacity(
          color.accentColor,
          color.accentOpacity,
        ),
      }
}

function getAccentTextColorStyle(color?: NodeColor): CSSProperties | undefined {
  return color?.accentColor === undefined
    ? undefined
    : {
        color: getCssColorWithOpacity(color.accentColor, color.accentOpacity),
      }
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

interface RegisteredFontGroup {
  familyId: string
  familyName: string
  fonts: RegisteredFontSummary[]
}

function groupRegisteredFonts(fonts: RegisteredFontSummary[]): RegisteredFontGroup[] {
  const groups = new Map<string, RegisteredFontGroup>()

  for (const font of fonts) {
    const familyId = getRegisteredFontFamilyId(font)
    const group = groups.get(familyId) ?? {
      familyId,
      familyName: getRegisteredFontFamilyName(font),
      fonts: [],
    }

    group.fonts.push(font)
    groups.set(familyId, group)
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      fonts: [...group.fonts].sort(compareRegisteredFonts),
    }))
    .sort((a, b) => a.familyName.localeCompare(b.familyName, 'ko'))
}

function getRegisteredFontFamilySelectValue(familyId: string): string {
  return `${REGISTERED_FONT_FAMILY_OPTION_PREFIX}${familyId}`
}

function getSelectedFontSelectValue(
  fontFamily: FontFamily,
  fonts: RegisteredFontSummary[],
): string {
  if (builtInFontFamilyOptions.includes(fontFamily as BuiltInFontFamily)) {
    return fontFamily
  }

  const selectedFont = fonts.find((font) =>
    isRegisteredFontFamilyMatch(font, fontFamily),
  )

  return selectedFont
    ? getRegisteredFontFamilySelectValue(getRegisteredFontFamilyId(selectedFont))
    : fontFamily
}

function findDuplicateFontVariant(
  fonts: RegisteredFontSummary[],
  metadata: Pick<RegisteredFontRecord, 'familyId' | 'weight'>,
): RegisteredFontSummary | undefined {
  if (!metadata.familyId || !metadata.weight) {
    return undefined
  }

  return fonts.find(
    (font) =>
      getRegisteredFontFamilyId(font) === metadata.familyId &&
      getRegisteredFontWeight(font) === metadata.weight,
  )
}

function replaceRegisteredFontSummary(
  fonts: RegisteredFontSummary[],
  summary: RegisteredFontSummary,
) {
  const existingIndex = fonts.findIndex((font) => font.id === summary.id)

  if (existingIndex >= 0) {
    fonts[existingIndex] = summary
    return
  }

  fonts.push(summary)
}

function mergeRegisteredFontSummaries(
  currentFonts: RegisteredFontSummary[],
  nextFonts: RegisteredFontSummary[],
): RegisteredFontSummary[] {
  const mergedFonts = [...currentFonts]

  for (const font of nextFonts) {
    replaceRegisteredFontSummary(mergedFonts, font)
  }

  return mergedFonts
}

function getRegisteredFontGroupLabel(group: RegisteredFontGroup): string {
  const missingCount = group.fonts.filter((font) => font.status === 'missing').length
  const missingSuffix = missingCount > 0 ? ` · 누락 ${missingCount}개` : ''

  return `${group.familyName} (${group.fonts.length}개 굵기${missingSuffix})`
}

function getFontWeightLabel(font: RegisteredFontSummary): string {
  const weight = getRegisteredFontWeight(font)

  return weight ? `${fontWeightLabels[weight]} ${weight}` : '굵기 미분류'
}

function getPreferredUploadedFont(
  fonts: RegisteredFontSummary[],
  preferredWeight: FontWeight,
): RegisteredFontSummary {
  const fallbackFont = fonts[0]

  if (!fallbackFont) {
    throw new Error('등록한 글꼴이 없습니다.')
  }

  const preferredWeightValue = Number(preferredWeight)
  const closestFont = fonts
    .map((font) => ({
      font,
      weight: Number(getRegisteredFontWeight(font) ?? Number.NaN),
    }))
    .filter(({ weight }) => Number.isFinite(weight))
    .sort(
      (first, second) =>
        Math.abs(first.weight - preferredWeightValue) -
          Math.abs(second.weight - preferredWeightValue) ||
        second.weight - first.weight,
    )[0]?.font

  return closestFont ?? fallbackFont
}

function getFontUploadMessage(
  uploadedFonts: RegisteredFontSummary[],
  failures: string[],
  replacedCount: number,
): string {
  const failureSuffix = getFontFailureMessage(failures)
  const replacedSuffix =
    replacedCount > 0 ? ` 기존 ${replacedCount}개는 새 파일로 교체했습니다.` : ''

  if (uploadedFonts.length === 1) {
    const font = uploadedFonts[0]

    if (!font) {
      return '등록한 글꼴 없음'
    }

    return `${getRegisteredFontFamilyName(font)} 글꼴을 ${getFontWeightLabel(font)}로 등록했습니다.${replacedSuffix}${failureSuffix}`
  }

  const familyCount = new Set(uploadedFonts.map(getRegisteredFontFamilyId)).size

  return `글꼴 ${uploadedFonts.length}개를 등록했고 ${familyCount}개 패밀리로 묶었습니다.${replacedSuffix}${failureSuffix}`
}

function getFontFailureMessage(failures: string[]): string {
  if (failures.length === 0) {
    return ''
  }

  const groupedFailures = new Map<string, number>()

  for (const failure of failures) {
    groupedFailures.set(failure, (groupedFailures.get(failure) ?? 0) + 1)
  }

  const detail = [...groupedFailures.entries()]
    .map(([message, count]) => `${message} ${count}개`)
    .join(', ')

  return ` 실패 ${failures.length}개 (${detail}).`
}

function isRegisteredFontFamilyMatch(
  font: RegisteredFontSummary,
  fontFamily: FontFamily,
): boolean {
  return font.id === fontFamily || getRegisteredFontFamilyId(font) === fontFamily
}

function compareRegisteredFonts(
  firstFont: RegisteredFontSummary,
  secondFont: RegisteredFontSummary,
): number {
  const firstWeight = Number(getRegisteredFontWeight(firstFont) ?? 0)
  const secondWeight = Number(getRegisteredFontWeight(secondFont) ?? 0)

  if (firstWeight !== secondWeight) {
    return firstWeight - secondWeight
  }

  return firstFont.displayName.localeCompare(secondFont.displayName, 'ko')
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
  const presentation = node.presentation ?? {}
  const imageFit = presentation.fit ?? 'cover'
  const overlayOpacity = presentation.overlayOpacity ?? 1
  const shouldRenderOverlay =
    canRenderImage &&
    (presentation.overlayGradient !== undefined ||
      presentation.overlayColor !== undefined) &&
    overlayOpacity > 0
  const imageStyle: CSSProperties = {
    objectFit: imageFit,
    ...(node.focalPoint
      ? { objectPosition: getImageObjectPosition(node.focalPoint) }
      : {}),
  }

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
          className="h-full w-full"
          src={node.src}
          alt={node.alt}
          style={imageStyle}
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
      {shouldRenderOverlay ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={
            presentation.overlayGradient
              ? { backgroundImage: gradientToCss(presentation.overlayGradient) }
              : {
                  backgroundColor: presentation.overlayColor,
                  opacity: overlayOpacity,
                }
          }
        />
      ) : null}
    </figure>
  )
}

function getImageObjectPosition(focalPoint: FocalPoint): string {
  return `${Math.round(focalPoint.x * 100)}% ${Math.round(focalPoint.y * 100)}%`
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
  onNodeMetaChange: (
    node: TreeNode,
    patch: NodeMetaPatch,
    options?: CommitTreeEditOptions,
  ) => void
  onLayoutChange: (node: TreeNode, patch: Partial<NodeLayout>) => void
  onLayoutReset: (node: TreeNode) => void
  registeredFonts: RegisteredFontSummary[]
  fontUsageCounts: Map<string, number>
  fontRegistryMessage: string
  isFontRegistryBusy: boolean
  onFontUpload: (
    files: File[],
    node: TextNode,
  ) => Promise<RegisteredFontSummary[]>
  onFontDelete: (fontId: string) => Promise<void>
  onFontFamilyDelete: (familyId: string) => Promise<void>
  onButtonLabelChange: (node: ButtonNode, label: string) => void
  onImageChange: (node: ImageNode, patch: ImageEditPatch) => void
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
  onNodeMetaChange,
  onLayoutChange,
  onLayoutReset,
  registeredFonts,
  fontUsageCounts,
  fontRegistryMessage,
  isFontRegistryBusy,
  onFontUpload,
  onFontDelete,
  onFontFamilyDelete,
  onButtonLabelChange,
  onImageChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onColorPresetChange,
}: NodeInspectorProps) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[#e0e5de] px-5 py-4">
        <h2 className="text-sm font-semibold">속성</h2>
        <p className="mt-1 break-all text-xs text-[#647067]">{node.id}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <InspectorDisclosure title="기본 정보" defaultOpen={false}>
          <MetadataGrid node={node} />
        </InspectorDisclosure>

        <NodeVisibilityControls
          node={node}
          onNodeMetaChange={onNodeMetaChange}
        />

        <StyleControls
          colorPreset={colorPreset}
          onColorPresetChange={onColorPresetChange}
        />

        <NodeColorControls
          node={node}
          onNodeColorChange={onNodeColorChange}
          onNodeColorReset={onNodeColorReset}
          onNodeMetaChange={onNodeMetaChange}
        />

        {node.type === 'text' ? (
          <>
            <InspectorDisclosure title="내용" defaultOpen={false}>
              <label className="block">
                <span className="text-xs font-semibold text-[#4f5e56]">문구</span>
                <textarea
                  className="mt-2 min-h-32 w-full resize-y rounded-md border border-[#cbd6cf] bg-white p-3 text-sm leading-6 outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                  placeholder="내용을 입력하세요. 마크다운으로 **굵게**, *기울임*, [링크](URL)를 사용할 수 있습니다."
                  value={node.content}
                  onChange={(event) => onTextChange(node, event.target.value)}
                />
                <span className="mt-2 block text-xs leading-5 text-[#647067]">
                  굵게 <code className="font-mono">**텍스트**</code> / 기울임{' '}
                  <code className="font-mono">*텍스트*</code> / 링크{' '}
                  <code className="font-mono">[텍스트](URL)</code>
                </span>
              </label>
            </InspectorDisclosure>
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
              onFontFamilyDelete={onFontFamilyDelete}
            />
          </>
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
          <InspectorDisclosure title="내용">
            <label className="block">
              <span className="text-xs font-semibold text-[#4f5e56]">버튼 문구</span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                value={node.label}
                onChange={(event) => onButtonLabelChange(node, event.target.value)}
              />
            </label>
          </InspectorDisclosure>
        ) : null}

        {node.type === 'image' ? (
          <>
            <InspectorDisclosure title="이미지">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-[#4f5e56]">
                    이미지 주소
                  </span>
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                    value={node.src}
                    onChange={(event) =>
                      onImageChange(node, { src: event.target.value })
                    }
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
                    onChange={(event) =>
                      onImageChange(node, { alt: event.target.value })
                    }
                  />
                  {node.alt.length === 0 ? (
                    <span className="mt-2 block text-xs text-[#647067]">
                      스크린리더가 이 이미지를 읽지 않습니다.
                    </span>
                  ) : null}
                </label>
              </div>
            </InspectorDisclosure>
            <ImageCompositionControls
              node={node}
              onImageChange={onImageChange}
            />
          </>
        ) : null}

        <StructureControls
          info={structureInfo}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />

        {isContainerNode(node) ? (
          <InspectorDisclosure title="그룹" defaultOpen={false}>
            <dl className="space-y-2 text-sm">
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
          </InspectorDisclosure>
        ) : null}
      </div>
    </section>
  )
}

interface StyleControlsProps {
  colorPreset: ColorPreset
  onColorPresetChange: (colorPreset: ColorPreset) => void
}

interface InspectorDisclosureProps {
  actionLabel?: string
  children: ReactNode
  defaultOpen?: boolean
  description?: string
  isActionDisabled?: boolean
  onAction?: () => void
  summaryEnd?: ReactNode
  title: string
}

function InspectorDisclosure({
  actionLabel,
  children,
  defaultOpen = true,
  description,
  isActionDisabled = false,
  onAction,
  summaryEnd,
  title,
}: InspectorDisclosureProps) {
  return (
    <details
      className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] [&[open]>summary_.dw-chevron]:rotate-180"
      open={defaultOpen}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1b7f72] [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#1d2923]">{title}</h3>
          {description ? (
            <p className="mt-1 truncate text-xs text-[#647067]">{description}</p>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {onAction ? (
            <button
              type="button"
              className="text-xs font-semibold text-[#1b7f72] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:text-[#8a958d] disabled:hover:no-underline"
              disabled={isActionDisabled}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onAction()
              }}
            >
              {actionLabel ?? '초기화'}
            </button>
          ) : (
            summaryEnd
          )}
          <DisclosureChevron />
        </span>
      </summary>
      <div className="border-t border-[#e0e5de] p-4">{children}</div>
    </details>
  )
}

function DisclosureChevron() {
  return (
    <svg
      aria-hidden="true"
      className="dw-chevron h-4 w-4 text-[#647067] transition-transform"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function StyleControls({
  colorPreset,
  onColorPresetChange,
}: StyleControlsProps) {
  return (
    <InspectorDisclosure
      title="문서 스타일"
      description="캔버스 전체 색상"
      defaultOpen={false}
      summaryEnd={
        <span className="rounded-full border border-[#c9d4cd] bg-white px-2 py-1 text-[11px] font-semibold text-[#4f5e56]">
          {colorPresetLabels[colorPreset]}
        </span>
      }
    >
      <div className="grid grid-cols-5 gap-2">
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
    </InspectorDisclosure>
  )
}

interface NodeVisibilityControlsProps {
  node: TreeNode
  onNodeMetaChange: (
    node: TreeNode,
    patch: NodeMetaPatch,
    options?: CommitTreeEditOptions,
  ) => void
}

function NodeVisibilityControls({
  node,
  onNodeMetaChange,
}: NodeVisibilityControlsProps) {
  const isVisible = node.hidden !== true
  const isCanvasSelectable = node.pointerEvents !== 'none'
  const isResetDisabled = node.hidden === undefined && node.pointerEvents === undefined

  function updateVisibility(nextVisible: boolean) {
    onNodeMetaChange(
      node,
      {
        hidden: nextVisible ? undefined : true,
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'meta.hidden') },
    )
  }

  function updateCanvasSelection(nextSelectable: boolean) {
    onNodeMetaChange(
      node,
      {
        pointerEvents: nextSelectable ? undefined : 'none',
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'meta.pointerEvents') },
    )
  }

  function resetVisibility() {
    onNodeMetaChange(node, {
      hidden: undefined,
      pointerEvents: undefined,
    })
  }

  return (
    <InspectorDisclosure
      title="표시"
      description={
        isVisible
          ? isCanvasSelectable
            ? '표시 · 선택 가능'
            : '표시 · 선택 제외'
          : '숨김'
      }
      onAction={resetVisibility}
      isActionDisabled={isResetDisabled}
    >
      <div className="space-y-3">
        <VisibilitySwitch
          checked={isVisible}
          label="캔버스에 표시"
          onChange={updateVisibility}
        />
        <VisibilitySwitch
          checked={isCanvasSelectable}
          disabled={!isVisible}
          label="캔버스에서 선택"
          onChange={updateCanvasSelection}
        />
      </div>
    </InspectorDisclosure>
  )
}

interface VisibilitySwitchProps {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}

function VisibilitySwitch({
  checked,
  disabled = false,
  label,
  onChange,
}: VisibilitySwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#d7ddd2] bg-white px-3 text-left transition hover:bg-[#eef8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="text-sm font-semibold text-[#26312b]">{label}</span>
      <span className="flex items-center gap-2 text-xs font-semibold text-[#4f5e56]">
        {checked ? '켬' : '끔'}
        <span
          className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${
            checked ? 'bg-[#1b7f72]' : 'bg-[#c9d4cd]'
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </span>
      </span>
    </button>
  )
}

interface NodeColorControlsProps {
  node: TreeNode
  onNodeColorChange: (
    node: TreeNode,
    patch: Partial<NodeColor>,
    options?: CommitTreeEditOptions,
  ) => void
  onNodeMetaChange: (
    node: TreeNode,
    patch: NodeMetaPatch,
    options?: CommitTreeEditOptions,
  ) => void
  onNodeColorReset: (node: TreeNode) => void
}

function NodeColorControls({
  node,
  onNodeColorChange,
  onNodeMetaChange,
  onNodeColorReset,
}: NodeColorControlsProps) {
  const color = node.color ?? {}
  const supportsAccentColor = canUseAccentColor(node)
  const backgroundMode: ColorMode =
    color.backgroundGradient === undefined ? 'solid' : 'gradient'
  const backgroundGradient = getResolvedGradient(
    color.backgroundGradient,
    color.backgroundColor ?? DEFAULT_COLOR_PICKER_COLOR,
    color.backgroundOpacity,
  )
  const [backgroundColorInput, setBackgroundColorInput] = useState(
    color.backgroundColor ?? '',
  )
  const [backgroundGradientFromInput, setBackgroundGradientFromInput] = useState(
    backgroundGradient.from,
  )
  const [backgroundGradientToInput, setBackgroundGradientToInput] = useState(
    backgroundGradient.to,
  )
  const [textColorInput, setTextColorInput] = useState(color.textColor ?? '')
  const [accentColorInput, setAccentColorInput] = useState(
    color.accentColor ?? '',
  )
  const [backgroundColorError, setBackgroundColorError] = useState(false)
  const [backgroundGradientFromError, setBackgroundGradientFromError] =
    useState(false)
  const [backgroundGradientToError, setBackgroundGradientToError] =
    useState(false)
  const [textColorError, setTextColorError] = useState(false)
  const [accentColorError, setAccentColorError] = useState(false)

  useEffect(() => {
    setBackgroundColorInput(color.backgroundColor ?? '')
    setBackgroundColorError(false)
  }, [node.id, color.backgroundColor])

  useEffect(() => {
    setTextColorInput(color.textColor ?? '')
    setTextColorError(false)
  }, [node.id, color.textColor])

  useEffect(() => {
    setAccentColorInput(color.accentColor ?? '')
    setAccentColorError(false)
  }, [node.id, color.accentColor])

  useEffect(() => {
    setBackgroundGradientFromInput(backgroundGradient.from)
    setBackgroundGradientToInput(backgroundGradient.to)
    setBackgroundGradientFromError(false)
    setBackgroundGradientToError(false)
  }, [
    node.id,
    backgroundGradient.from,
    backgroundGradient.to,
    backgroundGradient.type,
    backgroundGradient.direction,
  ])

  function updateColorFromText(field: ColorField, value: string) {
    const trimmedValue = value.trim()

    setColorFieldInput(field, value)

    if (trimmedValue === '') {
      setColorFieldError(field, false)
      onNodeColorChange(
        node,
        {
          [field]: undefined,
          [getPairedColorOpacityField(field)]: undefined,
        } as Partial<NodeColor>,
      )
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setColorFieldError(field, true)
      return
    }

    setColorFieldError(field, false)
    onNodeColorChange(
      node,
      { [field]: normalizeHexColor(trimmedValue) } as Partial<NodeColor>,
    )
  }

  function updateColorFromPicker(field: ColorField, value: string) {
    const normalizedValue = normalizeHexColor(value)
    setColorFieldInput(field, normalizedValue)
    setColorFieldError(field, false)

    onNodeColorChange(
      node,
      { [field]: normalizedValue } as Partial<NodeColor>,
      { mergeKey: getNodeColorMergeKey(node.id, field) },
    )
  }

  function updateOpacity(
    field: ColorOpacityField,
    colorField: ColorField,
    defaultColor: string,
    value: string,
  ) {
    const nextOpacity = parseOptionalOpacity(value)
    const patch: Partial<NodeColor> = { [field]: nextOpacity }

    if (nextOpacity !== undefined && color[colorField] === undefined) {
      Object.assign(patch, { [colorField]: defaultColor })
      setColorFieldInput(colorField, defaultColor)
    }

    onNodeColorChange(node, patch, {
      mergeKey: getNodeColorMergeKey(node.id, field),
    })
  }

  function setColorFieldInput(field: ColorField, value: string) {
    if (field === 'backgroundColor') {
      setBackgroundColorInput(value)
    } else if (field === 'textColor') {
      setTextColorInput(value)
    } else {
      setAccentColorInput(value)
    }
  }

  function setColorFieldError(field: ColorField, value: boolean) {
    if (field === 'backgroundColor') {
      setBackgroundColorError(value)
    } else if (field === 'textColor') {
      setTextColorError(value)
    } else {
      setAccentColorError(value)
    }
  }

  function updateBackgroundMode(mode: ColorMode) {
    if (mode === backgroundMode) {
      return
    }

    if (mode === 'gradient') {
      const nextGradient = getResolvedGradient(
        color.backgroundGradient,
        color.backgroundColor ?? DEFAULT_COLOR_PICKER_COLOR,
        color.backgroundOpacity,
      )
      setBackgroundGradientFromInput(nextGradient.from)
      setBackgroundGradientToInput(nextGradient.to)
      setBackgroundGradientFromError(false)
      setBackgroundGradientToError(false)
      onNodeColorChange(node, {
        backgroundColor: undefined,
        backgroundOpacity: undefined,
        backgroundGradient: nextGradient,
      })
      return
    }

    const nextColor =
      color.backgroundGradient?.from ??
      color.backgroundColor ??
      DEFAULT_COLOR_PICKER_COLOR
    setBackgroundColorInput(nextColor)
    setBackgroundColorError(false)
    onNodeColorChange(node, {
      backgroundColor: nextColor,
      backgroundOpacity: color.backgroundGradient?.fromOpacity,
      backgroundGradient: undefined,
    })
  }

  function updateBackgroundGradientColorFromText(
    field: GradientColorStopField,
    value: string,
  ) {
    const trimmedValue = value.trim()
    const setInput =
      field === 'from'
        ? setBackgroundGradientFromInput
        : setBackgroundGradientToInput
    const setError =
      field === 'from'
        ? setBackgroundGradientFromError
        : setBackgroundGradientToError

    setInput(value)

    if (!isValidHexColor(trimmedValue)) {
      setError(true)
      return
    }

    setError(false)
    onNodeColorChange(node, {
      backgroundColor: undefined,
      backgroundOpacity: undefined,
      backgroundGradient: getGradientWithPatch(backgroundGradient, {
        [field]: normalizeHexColor(trimmedValue),
      }),
    })
  }

  function updateBackgroundGradientColorFromPicker(
    field: GradientColorStopField,
    value: string,
  ) {
    const normalizedValue = normalizeHexColor(value)
    if (field === 'from') {
      setBackgroundGradientFromInput(normalizedValue)
      setBackgroundGradientFromError(false)
    } else {
      setBackgroundGradientToInput(normalizedValue)
      setBackgroundGradientToError(false)
    }

    onNodeColorChange(
      node,
      {
        backgroundColor: undefined,
        backgroundOpacity: undefined,
        backgroundGradient: getGradientWithPatch(backgroundGradient, {
          [field]: normalizedValue,
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, `backgroundGradient.${field}`) },
    )
  }

  function updateBackgroundGradientOpacity(
    field: GradientOpacityStopField,
    value: string,
  ) {
    onNodeColorChange(
      node,
      {
        backgroundColor: undefined,
        backgroundOpacity: undefined,
        backgroundGradient: getGradientWithPatch(backgroundGradient, {
          [field]: parseOptionalOpacity(value),
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, `backgroundGradient.${field}`) },
    )
  }

  function updateBackgroundGradientDirection(direction: GradientDirection) {
    onNodeColorChange(
      node,
      {
        backgroundColor: undefined,
        backgroundOpacity: undefined,
        backgroundGradient: getGradientWithPatch(backgroundGradient, {
          direction,
        }),
      },
      {
        mergeKey: getNodeColorMergeKey(
          node.id,
          'backgroundGradient.direction',
        ),
      },
    )
  }

  function updateNodeOpacity(value: string) {
    onNodeMetaChange(
      node,
      {
        opacity: parseOptionalOpacity(value),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'opacity') },
    )
  }

  function updateBackgroundGradientType(type: GradientType) {
    onNodeColorChange(
      node,
      {
        backgroundColor: undefined,
        backgroundOpacity: undefined,
        backgroundGradient: getGradientWithPatch(backgroundGradient, {
          type,
        }),
      },
      {
        mergeKey: getNodeColorMergeKey(node.id, 'backgroundGradient.type'),
      },
    )
  }

  function renderColorField({
    colorField,
    defaultColor,
    error,
    inputValue,
    label,
    opacityField,
    opacityLabel,
    opacityValue,
  }: {
    colorField: ColorField
    defaultColor: string
    error: boolean
    inputValue: string
    label: string
    opacityField: ColorOpacityField
    opacityLabel: string
    opacityValue?: number
  }) {
    return (
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-[#4f5e56]">{label}</span>
          <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
            <input
              className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
              value={inputValue}
              placeholder="#RRGGBB"
              aria-invalid={error}
              spellCheck={false}
              onChange={(event) =>
                updateColorFromText(colorField, event.target.value)
              }
            />
            <input
              type="color"
              aria-label={`${label} 선택`}
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
              value={toColorInputValue(inputValue, defaultColor)}
              onChange={(event) =>
                updateColorFromPicker(colorField, event.target.value)
              }
            />
          </span>
          {error ? (
            <span className="mt-2 block text-xs text-[#b42318]">
              HEX 형식 (#RRGGBB)으로 입력해주세요.
            </span>
          ) : null}
        </label>
        <OpacityControl
          label={opacityLabel}
          value={opacityValue}
          onChange={(value) =>
            updateOpacity(opacityField, colorField, defaultColor, value)
          }
        />
      </div>
    )
  }

  return (
    <InspectorDisclosure
      title="색상"
      description="선택한 노드의 배경, 글자, 강조"
      onAction={() => onNodeColorReset(node)}
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#4f5e56]">
              배경 방식
            </span>
            <div className="grid w-40 grid-cols-2 gap-1">
              <TypographyToggleButton
                isSelected={backgroundMode === 'solid'}
                onClick={() => updateBackgroundMode('solid')}
              >
                단일
              </TypographyToggleButton>
              <TypographyToggleButton
                isSelected={backgroundMode === 'gradient'}
                onClick={() => updateBackgroundMode('gradient')}
              >
                그라디언트
              </TypographyToggleButton>
            </div>
          </div>
          <div className="mt-3">
            {backgroundMode === 'gradient' ? (
              <GradientControls
                gradient={backgroundGradient}
                fromError={backgroundGradientFromError}
                fromInput={backgroundGradientFromInput}
                labelPrefix="배경"
                toError={backgroundGradientToError}
                toInput={backgroundGradientToInput}
                onColorPicker={updateBackgroundGradientColorFromPicker}
                onColorText={updateBackgroundGradientColorFromText}
                onDirection={updateBackgroundGradientDirection}
                onOpacity={updateBackgroundGradientOpacity}
                onType={updateBackgroundGradientType}
              />
            ) : (
              renderColorField({
                colorField: 'backgroundColor',
                defaultColor: DEFAULT_COLOR_PICKER_COLOR,
                error: backgroundColorError,
                inputValue: backgroundColorInput,
                label: '배경 색상',
                opacityField: 'backgroundOpacity',
                opacityLabel: '배경 투명도',
                opacityValue: color.backgroundOpacity,
              })
            )}
          </div>
        </div>

        <div
          className={
            supportsAccentColor ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'
          }
        >
          {renderColorField({
            colorField: 'textColor',
            defaultColor: DEFAULT_TEXT_PICKER_COLOR,
            error: textColorError,
            inputValue: textColorInput,
            label: '글자 색상',
            opacityField: 'textOpacity',
            opacityLabel: '글자 투명도',
            opacityValue: color.textOpacity,
          })}
          {supportsAccentColor
            ? renderColorField({
                colorField: 'accentColor',
                defaultColor: DEFAULT_ACCENT_PICKER_COLOR,
                error: accentColorError,
                inputValue: accentColorInput,
                label: '강조 색상',
                opacityField: 'accentOpacity',
                opacityLabel: '강조 투명도',
                opacityValue: color.accentOpacity,
              })
            : null}
        </div>

        <OpacityControl
          label="노드 투명도"
          value={node.opacity}
          onChange={updateNodeOpacity}
        />
      </div>
    </InspectorDisclosure>
  )
}

interface GradientControlsProps {
  fromError: boolean
  fromInput: string
  gradient: Gradient
  labelPrefix: string
  onColorPicker: (field: GradientColorStopField, value: string) => void
  onColorText: (field: GradientColorStopField, value: string) => void
  onDirection: (direction: GradientDirection) => void
  onOpacity: (field: GradientOpacityStopField, value: string) => void
  onType: (type: GradientType) => void
  toError: boolean
  toInput: string
}

function GradientControls({
  fromError,
  fromInput,
  gradient,
  labelPrefix,
  onColorPicker,
  onColorText,
  onDirection,
  onOpacity,
  onType,
  toError,
  toInput,
}: GradientControlsProps) {
  return (
    <div className="space-y-4 rounded-md border border-[#e0e5de] bg-white p-3">
      <div>
        <span className="text-xs font-semibold text-[#4f5e56]">종류</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {gradientTypeOptions.map((type) => (
            <TypographyToggleButton
              key={type}
              isSelected={gradient.type === type}
              onClick={() => onType(type)}
            >
              {gradientTypeLabels[type]}
            </TypographyToggleButton>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GradientColorField
          colorField="from"
          error={fromError}
          inputValue={fromInput}
          label={`${labelPrefix} 시작 색`}
          opacityField="fromOpacity"
          opacityLabel="시작 투명도"
          opacityValue={gradient.fromOpacity}
          onColorPicker={onColorPicker}
          onColorText={onColorText}
          onOpacity={onOpacity}
        />
        <GradientColorField
          colorField="to"
          error={toError}
          inputValue={toInput}
          label={`${labelPrefix} 끝 색`}
          opacityField="toOpacity"
          opacityLabel="끝 투명도"
          opacityValue={gradient.toOpacity}
          onColorPicker={onColorPicker}
          onColorText={onColorText}
          onOpacity={onOpacity}
        />
      </div>

      {gradient.type === 'linear' ? (
        <div>
          <span className="text-xs font-semibold text-[#4f5e56]">방향</span>
          <div className="mt-2 grid grid-cols-8 gap-1">
            {gradientDirectionOptions.map((direction) => (
              <IconToggleButton
                key={direction}
                icon={gradientDirectionIcons[direction]}
                isSelected={gradient.direction === direction}
                label={`${gradientDirectionLabels[direction]} 그라디언트`}
                onClick={() => onDirection(direction)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface GradientColorFieldProps {
  colorField: GradientColorStopField
  error: boolean
  inputValue: string
  label: string
  onColorPicker: (field: GradientColorStopField, value: string) => void
  onColorText: (field: GradientColorStopField, value: string) => void
  onOpacity: (field: GradientOpacityStopField, value: string) => void
  opacityField: GradientOpacityStopField
  opacityLabel: string
  opacityValue?: number
}

function GradientColorField({
  colorField,
  error,
  inputValue,
  label,
  onColorPicker,
  onColorText,
  onOpacity,
  opacityField,
  opacityLabel,
  opacityValue,
}: GradientColorFieldProps) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-semibold text-[#4f5e56]">{label}</span>
        <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
          <input
            className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
            value={inputValue}
            placeholder="#RRGGBB"
            aria-invalid={error}
            spellCheck={false}
            onChange={(event) => onColorText(colorField, event.target.value)}
          />
          <input
            type="color"
            aria-label={`${label} 선택`}
            className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
            value={toColorInputValue(inputValue, DEFAULT_COLOR_PICKER_COLOR)}
            onChange={(event) => onColorPicker(colorField, event.target.value)}
          />
        </span>
        {error ? (
          <span className="mt-2 block text-xs text-[#b42318]">
            HEX 형식 (#RRGGBB)으로 입력해주세요.
          </span>
        ) : null}
      </label>
      <OpacityControl
        label={opacityLabel}
        value={opacityValue}
        onChange={(value) => onOpacity(opacityField, value)}
      />
    </div>
  )
}

interface TypographyControlsProps {
  node: TextNode
  onTypographyChange: (
    node: TextNode,
    patch: Partial<Typography>,
    options?: CommitTreeEditOptions,
  ) => void
  onTypographyReset: (node: TextNode) => void
  registeredFonts: RegisteredFontSummary[]
  fontUsageCounts: Map<string, number>
  fontRegistryMessage: string
  isFontRegistryBusy: boolean
  onFontUpload: (
    files: File[],
    node: TextNode,
  ) => Promise<RegisteredFontSummary[]>
  onFontDelete: (fontId: string) => Promise<void>
  onFontFamilyDelete: (familyId: string) => Promise<void>
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
  onFontFamilyDelete,
}: TypographyControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const defaults = getTypographyDefaults(node)
  const typography = node.typography ?? {}
  const effectiveTextAlign = typography.textAlign ?? defaults.textAlign
  const effectiveFontFamily = typography.fontFamily ?? defaults.fontFamily
  const sliderFontSize = typography.fontSize ?? defaults.fontSize
  const textShadowMode = typography.textShadow === undefined ? 'none' : 'custom'
  const effectiveTextShadow = getResolvedTextShadow(typography.textShadow)
  const [textShadowColorInput, setTextShadowColorInput] = useState(
    effectiveTextShadow.color,
  )
  const [textShadowColorError, setTextShadowColorError] = useState(false)
  const registeredFontGroups = groupRegisteredFonts(registeredFonts)
  const selectedFontValue = getSelectedFontSelectValue(
    effectiveFontFamily,
    registeredFonts,
  )
  const hasRegisteredFamily = registeredFonts.some(
    (font) => isRegisteredFontFamilyMatch(font, effectiveFontFamily),
  )
  const hasSelectedMissingFont =
    !builtInFontFamilyOptions.includes(effectiveFontFamily as BuiltInFontFamily) &&
    !hasRegisteredFamily

  useEffect(() => {
    setTextShadowColorInput(effectiveTextShadow.color)
    setTextShadowColorError(false)
  }, [node.id, effectiveTextShadow.color])

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

  function updateTextShadowMode(mode: 'none' | 'custom') {
    if (mode === textShadowMode) {
      return
    }

    onTypographyChange(node, {
      textShadow:
        mode === 'custom'
          ? (typography.textShadow ?? DEFAULT_TEXT_SHADOW)
          : undefined,
    })
  }

  function updateTextShadowNumber(
    field: TextShadowNumberField,
    value: string,
    min: number,
    max: number,
  ) {
    const nextValue = parseOptionalNumber(value, min, max)
    if (nextValue === undefined) {
      return
    }

    onTypographyChange(
      node,
      {
        textShadow: getTextShadowWithPatch(effectiveTextShadow, {
          [field]: nextValue,
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, `typography.textShadow.${field}`) },
    )
  }

  function updateTextShadowColorFromText(value: string) {
    const trimmedValue = value.trim()
    setTextShadowColorInput(value)

    if (trimmedValue === '') {
      setTextShadowColorError(false)
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setTextShadowColorError(true)
      return
    }

    const normalizedValue = normalizeHexColor(trimmedValue)
    setTextShadowColorError(false)
    onTypographyChange(
      node,
      {
        textShadow: getTextShadowWithPatch(effectiveTextShadow, {
          color: normalizedValue,
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'typography.textShadow.color') },
    )
  }

  function updateTextShadowColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setTextShadowColorInput(normalizedValue)
    setTextShadowColorError(false)
    onTypographyChange(
      node,
      {
        textShadow: getTextShadowWithPatch(effectiveTextShadow, {
          color: normalizedValue,
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'typography.textShadow.color') },
    )
  }

  function updateTextShadowOpacity(value: string) {
    onTypographyChange(
      node,
      {
        textShadow: getTextShadowWithPatch(effectiveTextShadow, {
          opacity: parseOptionalOpacity(value),
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'typography.textShadow.opacity') },
    )
  }

  async function handleFontFileChange(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])

    if (files.length === 0) {
      return
    }

    await onFontUpload(files, node)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleFontSelect(value: string) {
    if (value.startsWith(REGISTERED_FONT_FAMILY_OPTION_PREFIX)) {
      const familyId = value.slice(REGISTERED_FONT_FAMILY_OPTION_PREFIX.length)

      onTypographyChange(node, { fontFamily: familyId as FontFamily })
      return
    }

    onTypographyChange(node, { fontFamily: value })
  }

  return (
    <InspectorDisclosure
      title="타이포그래피"
      description="선택한 텍스트만 조정"
      onAction={() => onTypographyReset(node)}
    >
      <label className="block">
        <span className="text-xs font-semibold text-[#4f5e56]">글꼴</span>
        <select
          className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm font-semibold text-[#26312b] outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
          value={selectedFontValue}
          disabled={isFontRegistryBusy}
          onChange={(event) => handleFontSelect(event.target.value)}
        >
          {builtInFontFamilyOptions.map((family) => (
            <option key={family} value={family}>
              {builtInFontFamilyLabels[family]}
            </option>
          ))}
          {registeredFontGroups.map((group) => (
            <option
              key={group.familyId}
              value={getRegisteredFontFamilySelectValue(group.familyId)}
            >
              등록한 글꼴 · {getRegisteredFontGroupLabel(group)}
            </option>
          ))}
          {hasSelectedMissingFont ? (
            <option value={effectiveFontFamily}>
              누락된 글꼴 ({effectiveFontFamily})
            </option>
          ) : null}
        </select>
      </label>
      <details className="mt-3 rounded-md border border-[#e0e5de] bg-white [&[open]>summary_.dw-chevron]:rotate-180">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1b7f72] [&::-webkit-details-marker]:hidden">
          <span className="text-xs font-semibold text-[#4f5e56]">
            글꼴 관리
          </span>
          <span className="flex items-center gap-2 text-[11px] text-[#647067]">
            {registeredFonts.length > 0
              ? `${registeredFontGroups.length}개 그룹 · ${registeredFonts.length}개 파일`
              : '등록 없음'}
            <DisclosureChevron />
          </span>
        </summary>
        <div className="border-t border-[#eef1ec] p-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.otf"
            multiple
            className="sr-only"
            onChange={(event) => handleFontFileChange(event.target.files)}
          />
          <button
            type="button"
            className="h-9 w-full rounded-md border border-dashed border-[#c9d4cd] bg-white px-3 text-xs font-semibold text-[#1b7f72] transition hover:bg-[#eef8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:text-[#8a958d] disabled:hover:bg-white"
            disabled={isFontRegistryBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {isFontRegistryBusy ? '글꼴 처리 중' : 'TTF/OTF 여러 개 업로드'}
          </button>
          <p className="mt-2 text-xs leading-5 text-[#647067]">
            등록한 글꼴은 이 브라우저의 모든 프로젝트에서 함께 사용됩니다. 같은 패밀리의 굵기 파일은 자동으로 묶습니다.
          </p>
          <p className="mt-1 text-xs leading-5 text-[#647067]" aria-live="polite">
            {fontRegistryMessage}
          </p>
          {registeredFonts.length > 0 ? (
            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
              {registeredFontGroups.map((group) => (
                <details
                  key={group.familyId}
                  className="rounded-md border border-[#eef1ec] bg-[#fbfcfa] [&[open]>summary_.dw-chevron]:rotate-180"
                >
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1b7f72] [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-[#26312b]">
                        {group.familyName}
                      </span>
                      <span className="block truncate text-[11px] text-[#647067]">
                        {group.fonts.length}개 굵기 · 사용{' '}
                        {fontUsageCounts.get(group.familyId) ?? 0}개
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="rounded border border-[#d7ddd2] px-2 py-1 text-[11px] font-semibold text-[#7f1d1d] transition hover:bg-[#fff1f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isFontRegistryBusy}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onFontFamilyDelete(group.familyId)
                        }}
                      >
                        그룹 삭제
                      </button>
                      <DisclosureChevron />
                    </span>
                  </summary>
                  <div className="space-y-1 border-t border-[#eef1ec] p-2">
                    {group.fonts.map((font) => (
                      <div
                        key={font.id}
                        className="flex min-h-8 items-center justify-between gap-2 rounded border border-[#f2f4f1] bg-white px-2"
                      >
                        <span className="min-w-0 truncate text-[11px] text-[#647067]">
                          {getFontWeightLabel(font)} · {font.displayName}
                          {font.status === 'missing' ? ' (누락)' : ''}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 text-[11px] font-semibold text-[#7f1d1d] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isFontRegistryBusy}
                          onClick={() => onFontDelete(font.id)}
                        >
                          파일 삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      </details>

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

      <div className="mt-4">
        <div>
          <span className="text-xs font-semibold text-[#4f5e56]">정렬</span>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {textAlignOptions.map((align) => (
              <IconToggleButton
                key={align}
                icon={textAlignIcons[align]}
                isSelected={effectiveTextAlign === align}
                label={textAlignTitles[align]}
                onClick={() => onTypographyChange(node, { textAlign: align })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#4f5e56]">
            텍스트 그림자
          </span>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-[#cbd6cf] bg-white p-1">
            <TypographyToggleButton
              isSelected={textShadowMode === 'none'}
              onClick={() => updateTextShadowMode('none')}
            >
              없음
            </TypographyToggleButton>
            <TypographyToggleButton
              isSelected={textShadowMode === 'custom'}
              onClick={() => updateTextShadowMode('custom')}
            >
              커스텀
            </TypographyToggleButton>
          </div>
        </div>

        {textShadowMode === 'custom' ? (
          <div className="grid grid-cols-2 gap-3">
            <TypographyNumberField
              label="가로 위치"
              unit="px"
              min={-50}
              max={50}
              step={1}
              value={effectiveTextShadow.offsetX}
              placeholder="0"
              onChange={(value) =>
                updateTextShadowNumber('offsetX', value, -50, 50)
              }
            />
            <TypographyNumberField
              label="세로 위치"
              unit="px"
              min={-50}
              max={50}
              step={1}
              value={effectiveTextShadow.offsetY}
              placeholder="2"
              onChange={(value) =>
                updateTextShadowNumber('offsetY', value, -50, 50)
              }
            />
            <TypographyNumberField
              label="흐림"
              unit="px"
              min={0}
              max={100}
              step={1}
              value={effectiveTextShadow.blur}
              placeholder="4"
              onChange={(value) => updateTextShadowNumber('blur', value, 0, 100)}
            />
            <OpacityControl
              label="투명도"
              value={effectiveTextShadow.opacity}
              onChange={updateTextShadowOpacity}
            />
            <label className="col-span-2 block">
              <span className="text-xs font-semibold text-[#4f5e56]">색상</span>
              <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
                <input
                  className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                  value={textShadowColorInput}
                  placeholder="#RRGGBB"
                  aria-invalid={textShadowColorError}
                  spellCheck={false}
                  onChange={(event) =>
                    updateTextShadowColorFromText(event.target.value)
                  }
                />
                <input
                  type="color"
                  aria-label="텍스트 그림자 색상 선택"
                  className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                  value={toColorInputValue(
                    textShadowColorInput,
                    DEFAULT_TEXT_SHADOW.color,
                  )}
                  onChange={(event) =>
                    updateTextShadowColorFromPicker(event.target.value)
                  }
                />
              </span>
              {textShadowColorError ? (
                <span className="mt-2 block text-xs text-[#b42318]">
                  HEX 형식 (#RRGGBB)으로 입력해주세요.
                </span>
              ) : null}
            </label>
          </div>
        ) : null}
      </div>
    </InspectorDisclosure>
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
    icons,
    options,
    title,
  }: {
    disabled: boolean
    field: T
    labels: Record<NonNullable<NodeLayout[T]>, string>
    icons: Record<NonNullable<NodeLayout[T]>, LucideIcon>
    options: Array<NonNullable<NodeLayout[T]>>
    title: string
  }) {
    return (
      <div>
        <span className="text-xs font-semibold text-[#4f5e56]">{title}</span>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {options.map((option) => (
            <IconToggleButton
              key={option}
              disabled={disabled}
              icon={icons[option]}
              isSelected={layout[field] === option}
              label={`${title}: ${labels[option]}`}
              onClick={() =>
                updateLayoutField(
                  field,
                  layout[field] === option ? undefined : option,
                )
              }
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <InspectorDisclosure
      title="레이아웃"
      description="선택한 노드의 자식 배치"
      isActionDisabled={!canEditLayout}
      onAction={() => onLayoutReset(node)}
      defaultOpen={canEditLayout}
    >

      {!canEditLayout ? (
        <p className="rounded-md border border-dashed border-[#c9d4cd] bg-white px-3 py-2 text-xs text-[#647067]">
          자식이 있는 노드에서 사용할 수 있습니다.
        </p>
      ) : null}

      <div className={canEditLayout ? 'mt-4 space-y-4' : 'mt-4 space-y-4 opacity-50'}>
        <div className="grid grid-cols-2 gap-3">
          {renderToggleGroup({
            disabled: !canEditLayout,
            field: 'direction',
            icons: layoutDirectionIcons,
            labels: layoutDirectionLabels,
            options: layoutDirectionOptions,
            title: '방향',
          })}
          {renderToggleGroup({
            disabled: !canEditLayout,
            field: 'wrap',
            icons: layoutWrapIcons,
            labels: layoutWrapLabels,
            options: layoutWrapOptions,
            title: '줄바꿈',
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {renderToggleGroup({
            disabled: !canEditLayout,
            field: 'align',
            icons: layoutAlignIcons,
            labels: layoutAlignLabels,
            options: layoutAlignOptions,
            title: '정렬',
          })}
          {renderToggleGroup({
            disabled: !canEditLayout,
            field: 'justify',
            icons: layoutJustifyIcons,
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
    </InspectorDisclosure>
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
          <IconToggleButton
            key={modeOption}
            icon={spacingModeIcons[modeOption]}
            isSelected={mode === modeOption}
            label={`${spacingModeLabels[modeOption]} 간격 모드`}
            onClick={() => onModeChange(modeOption)}
          />
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
    <InspectorDisclosure
      title="간격"
      description="선택한 노드의 여백 조정"
      defaultOpen={false}
      onAction={() => onSpacingReset(node)}
    >
      <div className="space-y-3">
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
    </InspectorDisclosure>
  )
}

interface ShapeControlsProps {
  node: TreeNode
  onShapeChange: (
    node: TreeNode,
    patch: Partial<Shape>,
    options?: CommitTreeEditOptions,
  ) => void
  onShapeReset: (node: TreeNode) => void
}

function ShapeControls({
  node,
  onShapeChange,
  onShapeReset,
}: ShapeControlsProps) {
  const shape = node.shape ?? {}
  const radiusMode: ShapeRadiusMode = hasCornerRadiusOverride(shape)
    ? 'corners'
    : 'all'
  const [borderColorInput, setBorderColorInput] = useState(shape.borderColor ?? '')
  const [borderColorError, setBorderColorError] = useState(false)
  const effectiveCustomShadow = getResolvedCustomShadow(shape.customShadow)
  const shadowMode = shape.customShadow === undefined ? 'preset' : 'custom'
  const [customShadowColorInput, setCustomShadowColorInput] = useState(
    effectiveCustomShadow.color,
  )
  const [customShadowColorError, setCustomShadowColorError] = useState(false)
  const isBorderDisabled = shape.borderStyle === 'none'

  useEffect(() => {
    setBorderColorInput(shape.borderColor ?? '')
    setBorderColorError(false)
  }, [node.id, shape.borderColor])

  useEffect(() => {
    setCustomShadowColorInput(effectiveCustomShadow.color)
    setCustomShadowColorError(false)
  }, [node.id, effectiveCustomShadow.color])

  function updateRadius(value: string) {
    onShapeChange(
      node,
      {
        radius: parseOptionalNumber(value, 0, 120),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'radius') },
    )
  }

  function updateRadiusMode(mode: ShapeRadiusMode) {
    if (mode === radiusMode) {
      return
    }

    if (mode === 'corners') {
      onShapeChange(
        node,
        Object.fromEntries(
          shapeCornerRadiusFields.map((field) => [
            field,
            getResolvedCornerRadius(shape, field),
          ]),
        ) as Partial<Shape>,
      )
      return
    }

    onShapeChange(node, {
      radius: getResolvedCornerRadius(shape, 'radiusTopLeft'),
      radiusTopLeft: undefined,
      radiusTopRight: undefined,
      radiusBottomRight: undefined,
      radiusBottomLeft: undefined,
    })
  }

  function updateCornerRadius(field: ShapeRadiusField, value: string) {
    onShapeChange(
      node,
      {
        [field]: parseOptionalNumber(value, 0, 120),
      } as Partial<Shape>,
      { mergeKey: getNodeColorMergeKey(node.id, field) },
    )
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
      onShapeChange(node, { borderColor: undefined, borderOpacity: undefined })
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
    const normalizedValue = normalizeHexColor(value)
    setBorderColorInput(normalizedValue)
    setBorderColorError(false)
    onShapeChange(
      node,
      {
        borderColor: normalizedValue,
        ...getVisibleBorderPatch(shape),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'borderColor') },
    )
  }

  function updateBorderOpacity(value: string) {
    const nextOpacity = parseOptionalOpacity(value)
    const shouldEnsureBorder =
      nextOpacity !== undefined ||
      shape.borderOpacity !== undefined ||
      shape.borderColor !== undefined ||
      shape.borderWidth !== undefined ||
      shape.borderStyle !== undefined
    onShapeChange(
      node,
      {
        borderOpacity: nextOpacity,
        ...(nextOpacity !== undefined && shape.borderColor === undefined
          ? { borderColor: DEFAULT_SHAPE_COLOR }
          : {}),
        ...(shouldEnsureBorder ? getVisibleBorderPatch(shape) : {}),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'borderOpacity') },
    )
  }

  function updateShadow(value: string) {
    onShapeChange(node, {
      shadow: value === '' ? undefined : (value as ShadowPreset),
    })
  }

  function updateShadowMode(mode: 'preset' | 'custom') {
    if (mode === shadowMode) {
      return
    }

    onShapeChange(node, {
      customShadow:
        mode === 'custom'
          ? (shape.customShadow ?? DEFAULT_CUSTOM_SHADOW)
          : undefined,
    })
  }

  function updateCustomShadowNumber(
    field: CustomShadowNumberField,
    value: string,
    min: number,
    max: number,
  ) {
    const nextValue = parseOptionalNumber(value, min, max)
    if (nextValue === undefined) {
      return
    }

    onShapeChange(
      node,
      {
        customShadow: getCustomShadowWithPatch(effectiveCustomShadow, {
          [field]: nextValue,
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, `customShadow.${field}`) },
    )
  }

  function updateCustomShadowColorFromText(value: string) {
    const trimmedValue = value.trim()
    setCustomShadowColorInput(value)

    if (trimmedValue === '') {
      setCustomShadowColorError(false)
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setCustomShadowColorError(true)
      return
    }

    const normalizedValue = normalizeHexColor(trimmedValue)
    setCustomShadowColorError(false)
    onShapeChange(node, {
      customShadow: getCustomShadowWithPatch(effectiveCustomShadow, {
        color: normalizedValue,
      }),
    })
  }

  function updateCustomShadowColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setCustomShadowColorInput(normalizedValue)
    setCustomShadowColorError(false)
    onShapeChange(
      node,
      {
        customShadow: getCustomShadowWithPatch(effectiveCustomShadow, {
          color: normalizedValue,
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'customShadow.color') },
    )
  }

  function updateCustomShadowOpacity(value: string) {
    onShapeChange(
      node,
      {
        customShadow: getCustomShadowWithPatch(effectiveCustomShadow, {
          opacity: parseOptionalOpacity(value),
        }),
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'customShadow.opacity') },
    )
  }

  return (
    <InspectorDisclosure
      title="모양"
      description="선택한 노드의 테두리와 그림자"
      defaultOpen={false}
      onAction={() => onShapeReset(node)}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#4f5e56]">모서리</span>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-[#cbd6cf] bg-white p-1">
              <TypographyToggleButton
                isSelected={radiusMode === 'all'}
                onClick={() => updateRadiusMode('all')}
              >
                전체
              </TypographyToggleButton>
              <TypographyToggleButton
                isSelected={radiusMode === 'corners'}
                onClick={() => updateRadiusMode('corners')}
              >
                분리
              </TypographyToggleButton>
            </div>
          </div>

          {radiusMode === 'all' ? (
            <div className="mt-3">
              <TypographyNumberField
                label="전체"
                unit="px"
                min={0}
                max={120}
                step={1}
                value={shape.radius}
                placeholder="기본"
                onChange={updateRadius}
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {shapeCornerRadiusFields.map((field) => (
                <TypographyNumberField
                  key={field}
                  label={shapeCornerRadiusLabels[field]}
                  unit="px"
                  min={0}
                  max={120}
                  step={1}
                  value={getResolvedCornerRadius(shape, field)}
                  placeholder="0"
                  onChange={(value) => updateCornerRadius(field, value)}
                />
              ))}
            </div>
          )}
        </div>
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
              className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none disabled:cursor-not-allowed"
              value={borderColorInput}
              placeholder={isBorderDisabled ? '없음' : '#RRGGBB'}
              aria-invalid={borderColorError}
              disabled={isBorderDisabled}
              spellCheck={false}
              onChange={(event) => updateBorderColorFromText(event.target.value)}
            />
            <input
              type="color"
              aria-label="테두리 색상 선택"
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0 disabled:cursor-not-allowed"
              value={toColorInputValue(borderColorInput)}
              disabled={isBorderDisabled}
              onChange={(event) => updateBorderColorFromPicker(event.target.value)}
            />
          </span>
          {borderColorError ? (
            <span className="mt-2 block text-xs text-[#b42318]">
              HEX 형식 (#RRGGBB)으로 입력해주세요.
            </span>
          ) : null}
        </label>

        <div className={isBorderDisabled ? 'opacity-50' : ''}>
          <OpacityControl
            label="테두리 투명도"
            value={shape.borderOpacity}
            disabled={isBorderDisabled}
            onChange={updateBorderOpacity}
          />
        </div>

        <div className="col-span-2 space-y-3 rounded-md border border-[#d7ddd2] bg-[#fbfcfa] p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#4f5e56]">그림자</span>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-[#cbd6cf] bg-white p-1">
              <TypographyToggleButton
                isSelected={shadowMode === 'preset'}
                onClick={() => updateShadowMode('preset')}
              >
                기본
              </TypographyToggleButton>
              <TypographyToggleButton
                isSelected={shadowMode === 'custom'}
                onClick={() => updateShadowMode('custom')}
              >
                커스텀
              </TypographyToggleButton>
            </div>
          </div>

          {shadowMode === 'preset' ? (
            <label className="block">
              <span className="text-xs font-semibold text-[#4f5e56]">
                그림자 종류
              </span>
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
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <TypographyNumberField
                label="가로 위치"
                unit="px"
                min={-100}
                max={100}
                step={1}
                value={effectiveCustomShadow.offsetX}
                placeholder="0"
                onChange={(value) =>
                  updateCustomShadowNumber('offsetX', value, -100, 100)
                }
              />
              <TypographyNumberField
                label="세로 위치"
                unit="px"
                min={-100}
                max={100}
                step={1}
                value={effectiveCustomShadow.offsetY}
                placeholder="4"
                onChange={(value) =>
                  updateCustomShadowNumber('offsetY', value, -100, 100)
                }
              />
              <TypographyNumberField
                label="흐림"
                unit="px"
                min={0}
                max={200}
                step={1}
                value={effectiveCustomShadow.blur}
                placeholder="12"
                onChange={(value) =>
                  updateCustomShadowNumber('blur', value, 0, 200)
                }
              />
              <TypographyNumberField
                label="확장"
                unit="px"
                min={-100}
                max={100}
                step={1}
                value={effectiveCustomShadow.spread ?? 0}
                placeholder="0"
                onChange={(value) =>
                  updateCustomShadowNumber('spread', value, -100, 100)
                }
              />
              <label className="block">
                <span className="text-xs font-semibold text-[#4f5e56]">
                  색상
                </span>
                <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                    value={customShadowColorInput}
                    placeholder="#RRGGBB"
                    aria-invalid={customShadowColorError}
                    spellCheck={false}
                    onChange={(event) =>
                      updateCustomShadowColorFromText(event.target.value)
                    }
                  />
                  <input
                    type="color"
                    aria-label="그림자 색상 선택"
                    className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                    value={toColorInputValue(
                      customShadowColorInput,
                      DEFAULT_CUSTOM_SHADOW.color,
                    )}
                    onChange={(event) =>
                      updateCustomShadowColorFromPicker(event.target.value)
                    }
                  />
                </span>
                {customShadowColorError ? (
                  <span className="mt-2 block text-xs text-[#b42318]">
                    HEX 형식 (#RRGGBB)으로 입력해주세요.
                  </span>
                ) : null}
              </label>
              <OpacityControl
                label="투명도"
                value={effectiveCustomShadow.opacity}
                onChange={updateCustomShadowOpacity}
              />
            </div>
          )}
        </div>
      </div>
    </InspectorDisclosure>
  )
}

interface ImageCompositionControlsProps {
  node: ImageNode
  onImageChange: (
    node: ImageNode,
    patch: ImageEditPatch,
    options?: CommitTreeEditOptions,
  ) => void
}

function ImageCompositionControls({
  node,
  onImageChange,
}: ImageCompositionControlsProps) {
  const presentation = node.presentation ?? {}
  const effectiveFit = presentation.fit ?? 'cover'
  const effectiveFocalPoint = node.focalPoint ?? { x: 0.5, y: 0.5 }
  const focalXPercent = Math.round(effectiveFocalPoint.x * 100)
  const focalYPercent = Math.round(effectiveFocalPoint.y * 100)
  const overlayOpacityPercent = getOpacityPercent(presentation.overlayOpacity)
  const overlayMode: ColorMode =
    presentation.overlayGradient === undefined ? 'solid' : 'gradient'
  const overlayGradient = getResolvedGradient(
    presentation.overlayGradient,
    presentation.overlayColor ?? DEFAULT_IMAGE_OVERLAY_COLOR,
    presentation.overlayOpacity,
  )
  const [overlayColorInput, setOverlayColorInput] = useState(
    presentation.overlayColor ?? '',
  )
  const [overlayGradientFromInput, setOverlayGradientFromInput] = useState(
    overlayGradient.from,
  )
  const [overlayGradientToInput, setOverlayGradientToInput] = useState(
    overlayGradient.to,
  )
  const [overlayColorError, setOverlayColorError] = useState(false)
  const [overlayGradientFromError, setOverlayGradientFromError] = useState(false)
  const [overlayGradientToError, setOverlayGradientToError] = useState(false)

  useEffect(() => {
    setOverlayColorInput(presentation.overlayColor ?? '')
    setOverlayColorError(false)
  }, [node.id, presentation.overlayColor])

  useEffect(() => {
    setOverlayGradientFromInput(overlayGradient.from)
    setOverlayGradientToInput(overlayGradient.to)
    setOverlayGradientFromError(false)
    setOverlayGradientToError(false)
  }, [
    node.id,
    overlayGradient.from,
    overlayGradient.to,
    overlayGradient.type,
    overlayGradient.direction,
  ])

  function updateAspectRatio(value: string) {
    onImageChange(node, {
      aspectRatio: value === '' ? undefined : (value as ImageAspectRatio),
    })
  }

  function updateFit(fit: ImageFit) {
    onImageChange(node, {
      presentation: {
        fit: fit === 'cover' ? undefined : fit,
      },
    })
  }

  function updateFocalPointField(field: keyof FocalPoint, value: string) {
    const nextValue = parseOptionalNumber(value, 0, 100)
    if (nextValue === undefined) {
      onImageChange(node, { focalPoint: undefined })
      return
    }

    onImageChange(node, {
      focalPoint: {
        ...effectiveFocalPoint,
        [field]: roundFocalCoordinate(nextValue / 100),
      },
    })
  }

  function updateFocalPointFromPointer(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) {
      return
    }

    onImageChange(node, {
      focalPoint: {
        x: roundFocalCoordinate((event.clientX - rect.left) / rect.width),
        y: roundFocalCoordinate((event.clientY - rect.top) / rect.height),
      },
    })
  }

  function updateOverlayColorFromText(value: string) {
    const trimmedValue = value.trim()
    setOverlayColorInput(value)

    if (trimmedValue === '') {
      setOverlayColorError(false)
      onImageChange(node, {
        presentation: {
          overlayColor: undefined,
          overlayOpacity: undefined,
        },
      })
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setOverlayColorError(true)
      return
    }

    const normalizedValue = normalizeHexColor(trimmedValue)
    setOverlayColorError(false)
    onImageChange(node, { presentation: { overlayColor: normalizedValue } })
  }

  function updateOverlayColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setOverlayColorInput(normalizedValue)
    setOverlayColorError(false)
    onImageChange(
      node,
      { presentation: { overlayColor: normalizedValue } },
      { mergeKey: getNodeColorMergeKey(node.id, 'overlayColor') },
    )
  }

  function updateOverlayOpacity(value: string) {
    onImageChange(
      node,
      {
        presentation: {
          overlayOpacity: parseOptionalOpacity(value),
        },
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'overlayOpacity') },
    )
  }

  function updateOverlayMode(mode: ColorMode) {
    if (mode === overlayMode) {
      return
    }

    if (mode === 'gradient') {
      const nextGradient = getResolvedGradient(
        presentation.overlayGradient,
        presentation.overlayColor ?? DEFAULT_IMAGE_OVERLAY_COLOR,
        presentation.overlayOpacity,
      )
      setOverlayGradientFromInput(nextGradient.from)
      setOverlayGradientToInput(nextGradient.to)
      setOverlayGradientFromError(false)
      setOverlayGradientToError(false)
      onImageChange(node, {
        presentation: {
          overlayColor: undefined,
          overlayOpacity: undefined,
          overlayGradient: nextGradient,
        },
      })
      return
    }

    const nextColor =
      presentation.overlayGradient?.from ??
      presentation.overlayColor ??
      DEFAULT_IMAGE_OVERLAY_COLOR
    setOverlayColorInput(nextColor)
    setOverlayColorError(false)
    onImageChange(node, {
      presentation: {
        overlayColor: nextColor,
        overlayOpacity: presentation.overlayGradient?.fromOpacity,
        overlayGradient: undefined,
      },
    })
  }

  function updateOverlayGradientColorFromText(
    field: GradientColorStopField,
    value: string,
  ) {
    const trimmedValue = value.trim()
    const setInput =
      field === 'from' ? setOverlayGradientFromInput : setOverlayGradientToInput
    const setError =
      field === 'from' ? setOverlayGradientFromError : setOverlayGradientToError

    setInput(value)

    if (!isValidHexColor(trimmedValue)) {
      setError(true)
      return
    }

    setError(false)
    onImageChange(node, {
      presentation: {
        overlayColor: undefined,
        overlayOpacity: undefined,
        overlayGradient: getGradientWithPatch(overlayGradient, {
          [field]: normalizeHexColor(trimmedValue),
        }),
      },
    })
  }

  function updateOverlayGradientColorFromPicker(
    field: GradientColorStopField,
    value: string,
  ) {
    const normalizedValue = normalizeHexColor(value)
    if (field === 'from') {
      setOverlayGradientFromInput(normalizedValue)
      setOverlayGradientFromError(false)
    } else {
      setOverlayGradientToInput(normalizedValue)
      setOverlayGradientToError(false)
    }

    onImageChange(
      node,
      {
        presentation: {
          overlayColor: undefined,
          overlayOpacity: undefined,
          overlayGradient: getGradientWithPatch(overlayGradient, {
            [field]: normalizedValue,
          }),
        },
      },
      { mergeKey: getNodeColorMergeKey(node.id, `overlayGradient.${field}`) },
    )
  }

  function updateOverlayGradientOpacity(
    field: GradientOpacityStopField,
    value: string,
  ) {
    onImageChange(
      node,
      {
        presentation: {
          overlayColor: undefined,
          overlayOpacity: undefined,
          overlayGradient: getGradientWithPatch(overlayGradient, {
            [field]: parseOptionalOpacity(value),
          }),
        },
      },
      { mergeKey: getNodeColorMergeKey(node.id, `overlayGradient.${field}`) },
    )
  }

  function updateOverlayGradientDirection(direction: GradientDirection) {
    onImageChange(
      node,
      {
        presentation: {
          overlayColor: undefined,
          overlayOpacity: undefined,
          overlayGradient: getGradientWithPatch(overlayGradient, {
            direction,
          }),
        },
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'overlayGradient.direction') },
    )
  }

  function updateOverlayGradientType(type: GradientType) {
    onImageChange(
      node,
      {
        presentation: {
          overlayColor: undefined,
          overlayOpacity: undefined,
          overlayGradient: getGradientWithPatch(overlayGradient, {
            type,
          }),
        },
      },
      { mergeKey: getNodeColorMergeKey(node.id, 'overlayGradient.type') },
    )
  }

  function resetImageComposition() {
    onImageChange(node, {
      focalPoint: undefined,
      presentation: getImagePresentationResetPatch(),
    })
  }

  return (
    <InspectorDisclosure
      title="이미지 구도"
      description="비율, 초점, 오버레이"
      onAction={resetImageComposition}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-[#4f5e56]">비율</span>
          <select
            aria-label="이미지 비율"
            className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
            value={node.aspectRatio ?? ''}
            onChange={(event) => updateAspectRatio(event.target.value)}
          >
            <option value="">기본 와이드</option>
            {imageAspectRatioOptions.map((aspectRatio) => (
              <option key={aspectRatio} value={aspectRatio}>
                {imageAspectRatioLabels[aspectRatio]}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-xs font-semibold text-[#4f5e56]">맞춤</span>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {imageFitOptions.map((fit) => (
              <TypographyToggleButton
                key={fit}
                isSelected={effectiveFit === fit}
                onClick={() => updateFit(fit)}
              >
                {imageFitLabels[fit]}
              </TypographyToggleButton>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-[#e0e5de] bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#4f5e56]">초점</span>
          <span className="text-[11px] font-semibold text-[#647067]">
            {focalXPercent}% / {focalYPercent}%
          </span>
        </div>
        <button
          type="button"
          aria-label="이미지 초점 미리보기"
          className="relative mt-2 flex aspect-[3/2] w-full cursor-crosshair overflow-hidden rounded-md border border-[#d7ddd2] bg-[var(--dw-image-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72]"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            updateFocalPointFromPointer(event)
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updateFocalPointFromPointer(event)
            }
          }}
        >
          {node.src.trim().length > 0 ? (
            // Inspector preview uses arbitrary user URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full"
              src={node.src}
              style={{
                objectFit: effectiveFit,
                objectPosition: getImageObjectPosition(effectiveFocalPoint),
              }}
            />
          ) : (
            <span className="m-auto text-xs font-semibold text-[#647067]">
              이미지 슬롯
            </span>
          )}
          {presentation.overlayGradient ? (
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: gradientToCss(presentation.overlayGradient),
              }}
            />
          ) : presentation.overlayColor && overlayOpacityPercent > 0 ? (
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundColor: presentation.overlayColor,
                opacity: overlayOpacityPercent / 100,
              }}
            />
          ) : null}
          <span
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1b7f72] shadow"
            style={{
              left: `${focalXPercent}%`,
              top: `${focalYPercent}%`,
            }}
          />
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <TypographyNumberField
            label="가로 초점"
            unit="%"
            min={0}
            max={100}
            step={1}
            value={node.focalPoint ? focalXPercent : undefined}
            placeholder="50"
            onChange={(value) => updateFocalPointField('x', value)}
          />
          <TypographyNumberField
            label="세로 초점"
            unit="%"
            min={0}
            max={100}
            step={1}
            value={node.focalPoint ? focalYPercent : undefined}
            placeholder="50"
            onChange={(value) => updateFocalPointField('y', value)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#4f5e56]">
            오버레이 방식
          </span>
          <div className="grid w-40 grid-cols-2 gap-1">
            <TypographyToggleButton
              isSelected={overlayMode === 'solid'}
              onClick={() => updateOverlayMode('solid')}
            >
              단일
            </TypographyToggleButton>
            <TypographyToggleButton
              isSelected={overlayMode === 'gradient'}
              onClick={() => updateOverlayMode('gradient')}
            >
              그라디언트
            </TypographyToggleButton>
          </div>
        </div>

        {overlayMode === 'gradient' ? (
          <GradientControls
            gradient={overlayGradient}
            fromError={overlayGradientFromError}
            fromInput={overlayGradientFromInput}
            labelPrefix="오버레이"
            toError={overlayGradientToError}
            toInput={overlayGradientToInput}
            onColorPicker={updateOverlayGradientColorFromPicker}
            onColorText={updateOverlayGradientColorFromText}
            onDirection={updateOverlayGradientDirection}
            onOpacity={updateOverlayGradientOpacity}
            onType={updateOverlayGradientType}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-[#4f5e56]">
                오버레이 색상
              </span>
              <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
                <input
                  className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                  value={overlayColorInput}
                  placeholder="#RRGGBB"
                  aria-invalid={overlayColorError}
                  spellCheck={false}
                  onChange={(event) =>
                    updateOverlayColorFromText(event.target.value)
                  }
                />
                <input
                  type="color"
                  aria-label="오버레이 색상 선택"
                  className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                  value={toColorInputValue(
                    overlayColorInput,
                    DEFAULT_IMAGE_OVERLAY_COLOR,
                  )}
                  onChange={(event) =>
                    updateOverlayColorFromPicker(event.target.value)
                  }
                />
              </span>
              {overlayColorError ? (
                <span className="mt-2 block text-xs text-[#b42318]">
                  HEX 형식 (#RRGGBB)으로 입력해주세요.
                </span>
              ) : null}
            </label>

            <OpacityControl
              label="오버레이 투명도"
              value={presentation.overlayOpacity}
              onChange={updateOverlayOpacity}
            />
          </div>
        )}
      </div>
    </InspectorDisclosure>
  )
}

interface OpacityControlProps {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  value?: number
}

function OpacityControl({
  disabled = false,
  label,
  onChange,
  value,
}: OpacityControlProps) {
  const percent = getOpacityPercent(value)

  return (
    <div>
      <TypographyNumberField
        disabled={disabled}
        label={label}
        unit="%"
        min={0}
        max={100}
        step={1}
        value={value === undefined ? undefined : percent}
        placeholder="100"
        onChange={onChange}
      />
      <label className="mt-2 block">
        <span className="sr-only">{label} 슬라이더</span>
        <input
          className="w-full accent-[#1b7f72] disabled:cursor-not-allowed"
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          aria-label={`${label} 슬라이더`}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
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

interface IconToggleButtonProps {
  disabled?: boolean
  icon: LucideIcon
  isSelected: boolean
  label: string
  onClick: () => void
}

function IconToggleButton({
  disabled = false,
  icon: Icon,
  isSelected,
  label,
  onClick,
}: IconToggleButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      title={label}
      className={`flex h-9 items-center justify-center rounded-md border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] ${
        isSelected
          ? 'border-[#1b7f72] bg-[#dff1ee] text-[#073d37]'
          : 'border-[#c9d4cd] bg-white text-[#26312b] hover:bg-[#eef3ed]'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white`}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
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
    <InspectorDisclosure
      title="구조"
      defaultOpen={false}
      summaryEnd={
        info.parentId ? (
          <span className="max-w-36 truncate text-xs text-[#647067]">
            상위 {info.parentId}
          </span>
        ) : null
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <InspectorActionButton
          ariaLabel="위로 이동"
          disabled={!canMoveUp}
          icon={ChevronUp}
          onClick={onMoveUp}
        />
        <InspectorActionButton
          ariaLabel="아래로 이동"
          disabled={!canMoveDown}
          icon={ChevronDown}
          onClick={onMoveDown}
        />
        <InspectorActionButton
          ariaLabel="복제"
          disabled={!canEditStructure}
          icon={Copy}
          onClick={onDuplicate}
        />
        <InspectorActionButton
          ariaLabel="삭제"
          disabled={!canEditStructure}
          icon={Trash2}
          tone="danger"
          onClick={onDelete}
        />
      </div>
      {info.isRoot ? (
        <p className="mt-3 text-xs text-[#647067]">
          루트는 이동/삭제할 수 없습니다.
        </p>
      ) : null}
    </InspectorDisclosure>
  )
}

interface InspectorActionButtonProps {
  ariaLabel: string
  disabled: boolean
  icon: LucideIcon
  onClick: () => void
  tone?: 'neutral' | 'danger'
}

function InspectorActionButton({
  ariaLabel,
  disabled,
  icon: Icon,
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
      title={ariaLabel}
      className={`flex h-9 items-center justify-center rounded-md border border-[#c9d4cd] bg-white text-[#26312b] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#c9d4cd] disabled:hover:bg-white disabled:hover:text-[#26312b] ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
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

function hasCornerRadiusOverride(shape: Partial<Shape>): boolean {
  return shapeCornerRadiusFields.some((field) => shape[field] !== undefined)
}

function getResolvedCornerRadius(
  shape: Partial<Shape>,
  field: ShapeRadiusField,
): number {
  return shape[field] ?? shape.radius ?? 0
}

function canUseAccentColor(node: TreeNode): boolean {
  return (
    (node.type === 'button' && node.variant === 'primary') ||
    (node.type === 'text' && node.emphasis === 'caption')
  )
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

function getLayerDropPosition(
  event: ReactDragEvent<HTMLElement>,
): LayerDropPosition {
  const bounds = event.currentTarget.getBoundingClientRect()
  return event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
}

function getLayerReorderPlan(
  tree: Tree,
  sourceNodeId: string,
  targetNodeId: string,
  position: LayerDropPosition,
): LayerReorderPlan | null {
  if (sourceNodeId === targetNodeId) {
    return null
  }

  const sourceInfo = getStructureInfo(tree, sourceNodeId)
  const targetInfo = getStructureInfo(tree, targetNodeId)
  if (
    sourceInfo.isRoot ||
    targetInfo.isRoot ||
    sourceInfo.parentId === undefined ||
    targetInfo.parentId === undefined ||
    sourceInfo.parentId !== targetInfo.parentId ||
    sourceInfo.index === undefined ||
    targetInfo.index === undefined
  ) {
    return null
  }

  let finalIndex = targetInfo.index + (position === 'after' ? 1 : 0)
  if (sourceInfo.index < finalIndex) {
    finalIndex -= 1
  }

  if (finalIndex === sourceInfo.index) {
    return null
  }

  return {
    finalIndex,
    sourceIndex: sourceInfo.index,
  }
}

function reorderLayerNode(
  tree: Tree,
  sourceNodeId: string,
  plan: LayerReorderPlan,
): Tree {
  const direction = plan.finalIndex > plan.sourceIndex ? 'down' : 'up'
  let nextTree = tree

  for (
    let index = plan.sourceIndex;
    index !== plan.finalIndex;
    index += direction === 'down' ? 1 : -1
  ) {
    nextTree = moveNode(nextTree, sourceNodeId, direction)
  }

  return nextTree
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

function parseOptionalOpacity(value: string): number | undefined {
  const percent = parseOptionalNumber(value, 0, 100)
  if (percent === undefined || percent === 100) {
    return undefined
  }

  return Math.round((percent / 100) * 100) / 100
}

function getOpacityPercent(value: number | undefined): number {
  return Math.round((value ?? 1) * 100)
}

function roundFocalCoordinate(value: number): number {
  const clampedValue = Math.min(1, Math.max(0, value))
  return Math.round(clampedValue * 1000) / 1000
}

function getImagePresentationResetPatch(): Partial<ImagePresentation> {
  return Object.fromEntries(
    imagePresentationFields.map((field): [ImagePresentationField, undefined] => [
      field,
      undefined,
    ]),
  ) as Partial<ImagePresentation>
}

function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value)
}

function normalizeHexColor(value: string): string {
  return value.trim().toLowerCase()
}

function getNodeColorMergeKey(nodeId: string, field: string): string {
  return `node:${nodeId}:${field}`
}

function getResolvedGradient(
  gradient: Gradient | undefined,
  fallbackFrom: string,
  fallbackFromOpacity?: number,
): Gradient {
  return {
    type: gradient?.type ?? DEFAULT_GRADIENT_TYPE,
    from: gradient?.from ?? normalizeHexColor(fallbackFrom),
    to: gradient?.to ?? DEFAULT_GRADIENT_TO_COLOR,
    direction: gradient?.direction ?? DEFAULT_GRADIENT_DIRECTION,
    ...(gradient?.fromOpacity !== undefined
      ? { fromOpacity: gradient.fromOpacity }
      : fallbackFromOpacity !== undefined
        ? { fromOpacity: fallbackFromOpacity }
        : {}),
    ...(gradient?.toOpacity !== undefined ? { toOpacity: gradient.toOpacity } : {}),
  }
}

function getGradientWithPatch(
  gradient: Gradient,
  patch: Partial<Gradient>,
): Gradient {
  const next: Gradient = { ...gradient, ...patch }

  if (next.fromOpacity === undefined) {
    delete next.fromOpacity
  }

  if (next.toOpacity === undefined) {
    delete next.toOpacity
  }

  if (next.type === undefined) {
    delete next.type
  }

  return next
}

function gradientToCss(gradient: Gradient): string {
  const from = getCssColorWithOpacity(gradient.from, gradient.fromOpacity)
  const to = getCssColorWithOpacity(gradient.to, gradient.toOpacity)

  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${from}, ${to})`
  }

  return `linear-gradient(${GRADIENT_DIRECTION_CSS[gradient.direction]}, ${from}, ${to})`
}

function customShadowToCss(shadow: CustomShadow): string {
  return [
    `${shadow.offsetX}px`,
    `${shadow.offsetY}px`,
    `${shadow.blur}px`,
    `${shadow.spread ?? 0}px`,
    getCssColorWithOpacity(shadow.color, shadow.opacity),
  ].join(' ')
}

function textShadowToCss(shadow: TextShadow): string {
  return [
    `${shadow.offsetX}px`,
    `${shadow.offsetY}px`,
    `${shadow.blur}px`,
    getCssColorWithOpacity(shadow.color, shadow.opacity),
  ].join(' ')
}

function getPairedColorOpacityField(field: ColorField): ColorOpacityField {
  if (field === 'backgroundColor') {
    return 'backgroundOpacity'
  }

  return field === 'textColor' ? 'textOpacity' : 'accentOpacity'
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

function getResolvedCustomShadow(shadow: CustomShadow | undefined): CustomShadow {
  return shadow ?? DEFAULT_CUSTOM_SHADOW
}

function getCustomShadowWithPatch(
  shadow: CustomShadow,
  patch: Partial<CustomShadow>,
): CustomShadow {
  const hasOpacityPatch = Object.prototype.hasOwnProperty.call(patch, 'opacity')

  return {
    offsetX: patch.offsetX ?? shadow.offsetX,
    offsetY: patch.offsetY ?? shadow.offsetY,
    blur: patch.blur ?? shadow.blur,
    spread: patch.spread ?? shadow.spread ?? 0,
    color: patch.color ?? shadow.color,
    ...(!hasOpacityPatch && shadow.opacity !== undefined
      ? { opacity: shadow.opacity }
      : patch.opacity !== undefined
        ? { opacity: patch.opacity }
        : {}),
  }
}

function getResolvedTextShadow(shadow: TextShadow | undefined): TextShadow {
  return shadow ?? DEFAULT_TEXT_SHADOW
}

function getTextShadowWithPatch(
  shadow: TextShadow,
  patch: Partial<TextShadow>,
): TextShadow {
  const hasOpacityPatch = Object.prototype.hasOwnProperty.call(patch, 'opacity')

  return {
    offsetX: patch.offsetX ?? shadow.offsetX,
    offsetY: patch.offsetY ?? shadow.offsetY,
    blur: patch.blur ?? shadow.blur,
    color: patch.color ?? shadow.color,
    ...(!hasOpacityPatch && shadow.opacity !== undefined
      ? { opacity: shadow.opacity }
      : patch.opacity !== undefined
        ? { opacity: patch.opacity }
        : {}),
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

type TypographyDefaults = Required<Omit<Typography, 'textShadow'>> & {
  textShadow?: TextShadow
}

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

function getCssColorWithOpacity(color: string, opacity?: number): string {
  if (opacity === undefined || opacity >= 1) {
    return color
  }

  if (opacity <= 0) {
    return hexToRgba(color, 0)
  }

  return hexToRgba(color, opacity)
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 3 && normalized.length !== 6) {
    return hex
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((digit) => `${digit}${digit}`)
          .join('')
      : normalized
  const value = Number.parseInt(expanded, 16)
  if (!Number.isFinite(value)) {
    return hex
  }

  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255

  return `rgba(${red},${green},${blue},${alpha})`
}
