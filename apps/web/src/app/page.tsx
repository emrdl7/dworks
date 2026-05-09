'use client'

import {
  createContext,
  useContext,
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
  Plus,
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
  type ImageFilter,
  type ImageDropShadow,
  type NodeColor,
  type NodeCursor,
  type NodeTransform,
  type NodeTransition,
  type NodeTransitionTiming,
  type TransitionCubicBezier,
  NODE_CURSOR_IDS,
  NODE_TRANSITION_TIMING_IDS,
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
import {
  VARIANT_COUNT_OPTIONS,
  appendGenerationHistoryEntries,
  buildVariantRequestBrief,
  type VariantCount,
} from './generation-history'

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

type ClarifyQuestionType = 'single' | 'multi' | 'text'

interface ClarifyQuestionDto {
  id: string
  label: string
  type: ClarifyQuestionType
  options?: string[]
  hint?: string
}

interface BriefAnswer {
  questionId: string
  questionLabel: string
  answer: string | string[]
}

interface SubmittedDesignBrief {
  intent: string
  answers?: BriefAnswer[]
  notes?: string
}

interface ClarifyTurn {
  questions: ClarifyQuestionDto[]
  answers: BriefAnswer[]
}

type GenerateStage = 'intent' | 'questions'

interface GenerationEntry {
  id: string
  label: string
  tree: Tree
  immutable: boolean
  brief: SubmittedDesignBrief | null
  questions: ClarifyQuestionDto[]
  clarifyTurns: ClarifyTurn[]
  createdAt: number
  latencyMs: number | null
  model: 'claude' | 'codex' | 'gemini' | null
}

const MAX_GENERATIONS = 6

let generationCounter = 0
function createGenerationEntryId(): string {
  generationCounter += 1
  return `gen-${Date.now().toString(36)}-${generationCounter}`
}

function createOriginalEntry(tree: Tree): GenerationEntry {
  return {
    id: createGenerationEntryId(),
    label: '원본',
    tree,
    immutable: true,
    brief: null,
    questions: [],
    clarifyTurns: [],
    createdAt: Date.now(),
    latencyMs: null,
    model: null,
  }
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

const nodeCursorLabels: Record<NodeCursor, string> = {
  default: '기본',
  pointer: '포인터',
  text: '텍스트',
  help: '도움말',
  'not-allowed': '금지',
  grab: '잡기',
  crosshair: '십자',
}

const nodeTransitionTimingLabels: Record<NodeTransitionTiming, string> = {
  linear: '선형',
  ease: '기본',
  'ease-in': '시작 가속',
  'ease-out': '끝 가속',
  'ease-in-out': '양쪽 가속',
  custom: '사용자 지정',
  'step-start': '즉시',
  'step-end': '도약',
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
  conic: '원뿔형',
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
  'hoverBackgroundColor',
  'hoverTextColor',
  'activeBackgroundColor',
  'activeTextColor',
  'focusBackgroundColor',
  'focusTextColor',
  'disabledBackgroundColor',
  'disabledTextColor',
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
  'filter',
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
const EMPTY_SHAPE: Shape = {}
const MAX_CUSTOM_SHADOWS = 3
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
  skipGenerationSync?: boolean
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
  const [generateStage, setGenerateStage] = useState<GenerateStage>('intent')
  const [briefIntent, setBriefIntent] = useState('')
  const [briefNotes, setBriefNotes] = useState('')
  const [briefVariantCount, setBriefVariantCount] = useState<VariantCount>(1)
  const [clarifyQuestions, setClarifyQuestions] = useState<ClarifyQuestionDto[]>(
    [],
  )
  const [briefAnswers, setBriefAnswers] = useState<Record<string, string | string[]>>(
    {},
  )
  const [clarifyTurns, setClarifyTurns] = useState<ClarifyTurn[]>([])
  const [clarifyComplete, setClarifyComplete] = useState(false)
  const [clarifyLoading, setClarifyLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generations, setGenerations] = useState<GenerationEntry[]>(() => [
    createOriginalEntry(defaultTreeFixture.tree),
  ])
  const [activeGenerationId, setActiveGenerationId] = useState<string>(
    () => generations[0]?.id ?? 'original',
  )
  const [compareMode, setCompareMode] = useState(false)
  const lastHistoryMergeRef = useRef<HistoryMergeState | null>(null)

  useEffect(() => {
    if (compareMode && generations.length < 2) {
      setCompareMode(false)
    }
  }, [compareMode, generations.length])

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
  const contrastAuditSummary = useMemo(
    () => computeContrastAuditSummary(tree, colorPreset),
    [tree, colorPreset],
  )
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
    const nextOriginal = createOriginalEntry(nextFixture.tree)
    setSelectedFixtureId(nextFixture.id)
    setCompareMode(false)
    setTree(nextFixture.tree)
    setHistoryPast([])
    setHistoryFuture([])
    lastHistoryMergeRef.current = null
    setGenerations([nextOriginal])
    setActiveGenerationId(nextOriginal.id)
    setGenerateError(null)
    setBriefIntent('')
    setBriefNotes('')
    setClarifyQuestions([])
    setBriefAnswers({})
    setClarifyTurns([])
    setClarifyComplete(false)
    setGenerateStage('intent')
    setSelectedNodeId(
      findFirstEditableNodeId(nextFixture.tree.root) ?? nextFixture.tree.root.id,
    )
  }

  function collectCurrentAnswers(): BriefAnswer[] {
    const collected: BriefAnswer[] = []
    for (const question of clarifyQuestions) {
      const raw = briefAnswers[question.id]
      if (raw === undefined) continue
      if (Array.isArray(raw)) {
        if (raw.length === 0) continue
        collected.push({
          questionId: question.id,
          questionLabel: question.label,
          answer: raw,
        })
      } else {
        const trimmed = raw.trim()
        if (trimmed.length === 0) continue
        collected.push({
          questionId: question.id,
          questionLabel: question.label,
          answer: trimmed,
        })
      }
    }
    return collected
  }

  function buildSubmittedBrief(): SubmittedDesignBrief | null {
    const intent = briefIntent.trim()
    if (intent.length === 0) {
      return null
    }
    if (generateStage === 'intent') {
      return { intent }
    }
    const answerMap = new Map<string, BriefAnswer>()
    for (const turn of clarifyTurns) {
      for (const a of turn.answers) {
        answerMap.set(a.questionId, {
          questionId: a.questionId,
          questionLabel: a.questionLabel,
          answer: Array.isArray(a.answer) ? [...a.answer] : a.answer,
        })
      }
    }
    for (const a of collectCurrentAnswers()) {
      answerMap.set(a.questionId, a)
    }
    const answers = Array.from(answerMap.values()).slice(0, 6)
    const trimmedNotes = briefNotes.trim()
    const notes = trimmedNotes.length > 0 ? trimmedNotes : undefined
    return {
      intent,
      ...(answers.length > 0 ? { answers } : {}),
      ...(notes !== undefined ? { notes } : {}),
    }
  }

  async function handleAskQuestions() {
    const intent = briefIntent.trim()
    if (intent.length === 0 || clarifyLoading) return
    setClarifyLoading(true)
    setGenerateError(null)
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_DWORKS_API_URL ?? 'http://localhost:3001'
      const response = await fetch(`${apiBase}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
      })
      const payload = (await response.json()) as
        | { questions: ClarifyQuestionDto[]; model: string; latencyMs: number }
        | { error: string; message: string }
      if (!response.ok) {
        const message =
          'message' in payload
            ? payload.message
            : '질문 생성에 실패했습니다.'
        setGenerateError(message)
        return
      }
      if (!('questions' in payload)) {
        setGenerateError('질문 응답이 비어 있습니다.')
        return
      }
      setClarifyQuestions(payload.questions)
      setBriefAnswers({})
      setClarifyTurns([])
      setClarifyComplete(false)
      setGenerateStage('questions')
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : '질문 생성에 실패했습니다.',
      )
    } finally {
      setClarifyLoading(false)
    }
  }

  function handleEditIntent() {
    if (clarifyLoading || generateLoading) return
    setGenerateStage('intent')
    setClarifyTurns([])
    setClarifyComplete(false)
  }

  async function handleAskFollowUp() {
    const intent = briefIntent.trim()
    if (intent.length === 0 || clarifyLoading || generateLoading) return
    if (clarifyTurns.length >= 2) return
    const currentAnswers = collectCurrentAnswers()
    if (currentAnswers.length === 0) return

    const completedTurn: ClarifyTurn = {
      questions: clarifyQuestions,
      answers: currentAnswers,
    }
    const nextTurns = [...clarifyTurns, completedTurn]

    setClarifyLoading(true)
    setGenerateError(null)
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_DWORKS_API_URL ?? 'http://localhost:3001'
      const response = await fetch(`${apiBase}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, history: nextTurns }),
      })
      const payload = (await response.json()) as
        | { questions: ClarifyQuestionDto[]; model: string; latencyMs: number }
        | { error: string; message: string }
      if (!response.ok) {
        const message =
          'message' in payload
            ? payload.message
            : '추가 질문 생성에 실패했습니다.'
        setGenerateError(message)
        return
      }
      if (!('questions' in payload)) {
        setGenerateError('질문 응답이 비어 있습니다.')
        return
      }

      setClarifyTurns(nextTurns)
      if (payload.questions.length === 0) {
        setClarifyQuestions([])
        setBriefAnswers({})
        setClarifyComplete(true)
      } else {
        setClarifyQuestions(payload.questions)
        setBriefAnswers({})
        setClarifyComplete(false)
      }
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : '추가 질문 생성에 실패했습니다.',
      )
    } finally {
      setClarifyLoading(false)
    }
  }

  function snapshotActiveGeneration(currentTree: Tree) {
    setGenerations((entries) =>
      entries.map((entry) =>
        entry.id === activeGenerationId && !entry.immutable
          ? { ...entry, tree: currentTree }
          : entry,
      ),
    )
  }

  async function callGenerateOnce(
    apiBase: string,
    requestBrief: SubmittedDesignBrief,
  ): Promise<
    | { ok: true; tree: Tree; model: GenerationEntry['model']; latencyMs: number }
    | { ok: false; reason: string }
  > {
    try {
      const response = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: requestBrief }),
      })
      const payload = (await response.json()) as
        | { tree: Tree; model: GenerationEntry['model']; latencyMs: number }
        | { error: string; message: string }
      if (!response.ok) {
        return {
          ok: false,
          reason:
            'message' in payload ? payload.message : 'AI 생성에 실패했습니다.',
        }
      }
      if (!('tree' in payload)) {
        return { ok: false, reason: 'AI 응답이 비어 있습니다.' }
      }
      return {
        ok: true,
        tree: payload.tree,
        model: payload.model ?? 'claude',
        latencyMs: payload.latencyMs ?? 0,
      }
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'AI 생성에 실패했습니다.',
      }
    }
  }

  async function handleGenerateTree() {
    const submitted = buildSubmittedBrief()
    if (submitted === null || generateLoading) {
      return
    }
    setGenerateLoading(true)
    setGenerateError(null)
    const apiBase =
      process.env.NEXT_PUBLIC_DWORKS_API_URL ?? 'http://localhost:3001'
    const count = briefVariantCount
    try {
      const requests: Array<Promise<Awaited<ReturnType<typeof callGenerateOnce>>>> =
        []
      for (let i = 0; i < count; i++) {
        const requestBrief = buildVariantRequestBrief(submitted, i, count)
        requests.push(callGenerateOnce(apiBase, requestBrief))
      }
      const settled = await Promise.allSettled(requests)
      const successes: Array<{
        tree: Tree
        model: GenerationEntry['model']
        latencyMs: number
      }> = []
      const failures: string[] = []
      for (const r of settled) {
        if (r.status === 'fulfilled') {
          if (r.value.ok) {
            successes.push({
              tree: r.value.tree,
              model: r.value.model,
              latencyMs: r.value.latencyMs,
            })
          } else {
            failures.push(r.value.reason)
          }
        } else {
          failures.push(
            r.reason instanceof Error ? r.reason.message : String(r.reason),
          )
        }
      }
      if (successes.length === 0) {
        const firstReason = failures[0] ?? 'AI 생성에 실패했습니다.'
        setGenerateError(
          count === 1 ? firstReason : `모든 변형 생성 실패: ${firstReason}`,
        )
        return
      }
      snapshotActiveGeneration(tree)
      const now = Date.now()
      const newEntries: GenerationEntry[] = successes.map((success) => ({
        id: createGenerationEntryId(),
        label: '',
        tree: success.tree,
        immutable: false,
        brief: submitted,
        questions: clarifyQuestions,
        clarifyTurns: clarifyTurns,
        createdAt: now,
        latencyMs: success.latencyMs,
        model: success.model,
      }))
      setGenerations((entries) => {
        return appendGenerationHistoryEntries(
          entries,
          newEntries,
          MAX_GENERATIONS,
        )
      })
      const firstNew = newEntries[0]
      if (firstNew !== undefined) {
        const nextSelectedId =
          findFirstEditableNodeId(firstNew.tree.root) ?? firstNew.tree.root.id
        setActiveGenerationId(firstNew.id)
        setCompareMode(false)
        commitTreeEdit(firstNew.tree, nextSelectedId, {
          skipGenerationSync: true,
        })
      }
      if (failures.length > 0) {
        setGenerateError(
          `${count}개 중 ${successes.length}개 생성됨 (${failures.length}개 실패)`,
        )
      } else {
        setGenerateError(null)
      }
    } finally {
      setGenerateLoading(false)
    }
  }

  function handleSelectGeneration(targetId: string) {
    if (targetId === activeGenerationId || generateLoading) return
    const target = generations.find((entry) => entry.id === targetId)
    if (target === undefined) return
    setGenerations((entries) =>
      entries.map((entry) =>
        entry.id === activeGenerationId && !entry.immutable
          ? { ...entry, tree }
          : entry,
      ),
    )
    setActiveGenerationId(target.id)

    if (target.brief === null) {
      setBriefIntent('')
      setBriefNotes('')
      setClarifyQuestions([])
      setBriefAnswers({})
      setClarifyTurns([])
      setClarifyComplete(false)
      setGenerateStage('intent')
      setGenerateError(null)
    } else {
      const restoredQuestions = target.questions ?? []
      const restoredTurns = target.clarifyTurns ?? []
      setBriefIntent(target.brief.intent)
      setBriefNotes(target.brief.notes ?? '')
      setClarifyQuestions(restoredQuestions)
      const restoredAnswers: Record<string, string | string[]> = {}
      for (const a of target.brief.answers ?? []) {
        restoredAnswers[a.questionId] = Array.isArray(a.answer)
          ? [...a.answer]
          : a.answer
      }
      setBriefAnswers(restoredAnswers)
      setClarifyTurns(
        restoredTurns.map((turn) => ({
          questions: turn.questions,
          answers: turn.answers.map((a) => ({
            questionId: a.questionId,
            questionLabel: a.questionLabel,
            answer: Array.isArray(a.answer) ? [...a.answer] : a.answer,
          })),
        })),
      )
      setClarifyComplete(
        restoredTurns.length > 0 && restoredQuestions.length === 0,
      )
      setGenerateStage(
        restoredQuestions.length === 0 && restoredTurns.length === 0
          ? 'intent'
          : 'questions',
      )
    }

    const nextSelectedId =
      findFirstEditableNodeId(target.tree.root) ?? target.tree.root.id
    commitTreeEdit(target.tree, nextSelectedId, { skipGenerationSync: true })
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
    if (options.skipGenerationSync !== true) {
      setGenerations((entries) =>
        entries.map((entry) =>
          entry.id === activeGenerationId && !entry.immutable
            ? { ...entry, tree: nextTree }
            : entry,
        ),
      )
    }
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
    const layerNodeId = event.currentTarget.dataset.layerNodeId
    if (
      relatedTarget instanceof Node &&
      event.currentTarget.contains(relatedTarget)
    ) {
      return
    }

    setLayerDropTarget((current) =>
      current?.nodeId === layerNodeId ? null : current,
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#4f5e56]">
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
            <span
              className={`rounded-full border px-3 py-1 ${
                contrastAuditSummary.total === 0
                  ? 'border-[#dde3df] bg-white text-[#9aa49d]'
                  : contrastAuditSummary.passesAA ===
                      contrastAuditSummary.total
                    ? 'border-[#1b7f72] bg-[#eef8f6] text-[#1b7f72]'
                    : 'border-[#c9d4cd] bg-white text-[#4f5e56]'
              }`}
            >
              대비 AA {contrastAuditSummary.passesAA}/
              {contrastAuditSummary.total}
            </span>
          </div>
        </div>
      </header>

      <div
        className={`grid h-[calc(100vh-56px)] min-h-0 ${
          compareMode
            ? 'grid-cols-[260px_minmax(0,1fr)]'
            : 'grid-cols-[260px_minmax(0,1fr)_360px]'
        }`}
      >
        <aside className="flex min-h-0 flex-col border-r border-[#d7ddd2] bg-[#fbfcfa]">
          <details
            open
            className="border-b border-[#e0e5de] [&_summary]:cursor-pointer"
          >
            <summary className="flex items-center justify-between px-4 py-3">
              <h2 className="text-sm font-semibold text-[#1b7f72]">AI 디자인</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#647067]">
                  {generations.length}/{MAX_GENERATIONS}
                </span>
                {generations.length >= 2 ? (
                  <button
                    type="button"
                    aria-pressed={compareMode}
                    disabled={generateLoading}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setCompareMode((v) => !v)
                    }}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-50 ${
                      compareMode
                        ? 'border-[#1b7f72] bg-[#1b7f72] text-white'
                        : 'border-[#cbd6cf] bg-white text-[#4f5e56] hover:border-[#1b7f72]'
                    }`}
                  >
                    변형 비교
                  </button>
                ) : null}
              </div>
            </summary>
            <div className="space-y-3 px-4 pb-4">
              <div className="flex flex-wrap gap-1">
                {generations.map((entry) => {
                  const isActive = entry.id === activeGenerationId
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      title={entry.brief?.intent ?? '원본 fixture'}
                      aria-pressed={isActive}
                      aria-disabled={compareMode || undefined}
                      disabled={compareMode}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                        isActive
                          ? 'border-[#1b7f72] bg-[#1b7f72] text-white'
                          : 'border-[#cbd6cf] bg-white text-[#4f5e56] hover:border-[#1b7f72]'
                      }`}
                      onClick={() => handleSelectGeneration(entry.id)}
                    >
                      {entry.label}
                    </button>
                  )
                })}
              </div>

              {generateStage === 'intent' ? (
                <>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-[#4f5e56]">
                      의도 *
                    </span>
                    <textarea
                      rows={4}
                      maxLength={500}
                      placeholder="이 페이지로 무엇을 보여주고 싶은가요?"
                      className="mt-1 w-full resize-none rounded-md border border-[#cbd6cf] bg-white px-2 py-1.5 text-xs text-[#18211d] outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                      value={briefIntent}
                      disabled={clarifyLoading || generateLoading}
                      onChange={(event) => {
                        setBriefIntent(event.target.value)
                        if (generateError !== null) setGenerateError(null)
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="w-full rounded-md bg-[#1b7f72] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15665b] disabled:opacity-50"
                    disabled={
                      clarifyLoading ||
                      generateLoading ||
                      briefIntent.trim().length === 0
                    }
                    onClick={() => void handleAskQuestions()}
                  >
                    {clarifyLoading ? '질문 받는 중…' : '질문 받기'}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md border border-[#cbd6cf] bg-white px-3 py-2 text-xs font-semibold text-[#4f5e56] hover:border-[#1b7f72] disabled:opacity-40"
                    disabled={
                      clarifyLoading ||
                      generateLoading ||
                      briefIntent.trim().length === 0
                    }
                    onClick={() => void handleGenerateTree()}
                  >
                    {generateLoading
                      ? '생성 중…'
                      : '의도만으로 바로 생성'}
                  </button>
                </>
              ) : (
                <>
                  {generations.find((e) => e.id === activeGenerationId)?.brief !=
                  null ? (
                    <p className="text-[10px] text-[#647067]">
                      선택한 디자인의 답변
                    </p>
                  ) : null}
                  <div className="rounded-md border border-[#e0e5de] bg-[#f8faf9] p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4f5e56]">
                        의도
                      </span>
                      <button
                        type="button"
                        className="text-[11px] text-[#1b7f72] underline"
                        onClick={handleEditIntent}
                        disabled={clarifyLoading || generateLoading}
                      >
                        수정
                      </button>
                    </div>
                    <p className="text-xs text-[#18211d]">{briefIntent}</p>
                  </div>

                  {clarifyTurns.length > 0 ? (
                    <div className="space-y-1">
                      {clarifyTurns.map((turn, turnIndex) => (
                        <details
                          key={turnIndex}
                          className="rounded-md border border-[#e0e5de] bg-white"
                        >
                          <summary className="cursor-pointer px-2.5 py-1.5 text-[11px] text-[#4f5e56]">
                            이전 답변 {turnIndex + 1} ({turn.answers.length}개)
                          </summary>
                          <div className="space-y-0.5 border-t border-[#e0e5de] px-2.5 py-1.5">
                            {turn.answers.map((a) => (
                              <div key={a.questionId} className="text-[11px]">
                                <span className="font-semibold text-[#4f5e56]">
                                  {a.questionLabel}
                                </span>
                                <span className="text-[#647067]">
                                  {': '}
                                  {Array.isArray(a.answer)
                                    ? a.answer.join(', ')
                                    : a.answer}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : null}

                  {clarifyQuestions.map((question) => {
                    const answer = briefAnswers[question.id]
                    return (
                      <div key={question.id} className="space-y-1">
                        <span className="text-[11px] font-semibold text-[#4f5e56]">
                          {question.label}
                        </span>
                        {question.hint !== undefined ? (
                          <p className="text-[10px] text-[#647067]">
                            {question.hint}
                          </p>
                        ) : null}
                        {question.type === 'single' ? (
                          <div className="flex flex-wrap gap-1">
                            {(question.options ?? []).map((opt) => {
                              const isOn = answer === opt
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  aria-pressed={isOn}
                                  disabled={generateLoading}
                                  className={`rounded-md border px-2 py-1 text-[11px] transition ${
                                    isOn
                                      ? 'border-[#1b7f72] bg-[#dff1ee] text-[#073d37]'
                                      : 'border-[#cbd6cf] bg-white text-[#4f5e56] hover:border-[#1b7f72]'
                                  }`}
                                  onClick={() =>
                                    setBriefAnswers((current) => ({
                                      ...current,
                                      [question.id]:
                                        current[question.id] === opt ? '' : opt,
                                    }))
                                  }
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        ) : null}
                        {question.type === 'multi' ? (
                          <div className="flex flex-wrap gap-1">
                            {(question.options ?? []).map((opt) => {
                              const list = Array.isArray(answer) ? answer : []
                              const isOn = list.includes(opt)
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  aria-pressed={isOn}
                                  disabled={generateLoading}
                                  className={`rounded-md border px-2 py-1 text-[11px] transition ${
                                    isOn
                                      ? 'border-[#1b7f72] bg-[#dff1ee] text-[#073d37]'
                                      : 'border-[#cbd6cf] bg-white text-[#4f5e56] hover:border-[#1b7f72]'
                                  }`}
                                  onClick={() =>
                                    setBriefAnswers((current) => {
                                      const prev = current[question.id]
                                      const prevList = Array.isArray(prev) ? prev : []
                                      const next = prevList.includes(opt)
                                        ? prevList.filter((v) => v !== opt)
                                        : [...prevList, opt]
                                      return { ...current, [question.id]: next }
                                    })
                                  }
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        ) : null}
                        {question.type === 'text' ? (
                          <textarea
                            rows={2}
                            maxLength={500}
                            placeholder="자유롭게 답변하세요 (선택)"
                            className="w-full resize-none rounded-md border border-[#cbd6cf] bg-white px-2 py-1.5 text-xs text-[#18211d] outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                            value={typeof answer === 'string' ? answer : ''}
                            disabled={generateLoading}
                            onChange={(event) =>
                              setBriefAnswers((current) => ({
                                ...current,
                                [question.id]: event.target.value,
                              }))
                            }
                          />
                        ) : null}
                      </div>
                    )
                  })}

                  {clarifyComplete ? (
                    <p className="rounded-md border border-[#dde3df] bg-[#eef8f6] px-2 py-1.5 text-[11px] text-[#1b7f72]">
                      답변이 충분합니다. 이제 디자인을 생성할 수 있습니다.
                    </p>
                  ) : clarifyTurns.length < 2 && clarifyQuestions.length > 0 ? (
                    <button
                      type="button"
                      className="w-full rounded-md border border-[#cbd6cf] bg-white px-3 py-2 text-[11px] font-semibold text-[#4f5e56] hover:border-[#1b7f72] disabled:opacity-50"
                      disabled={
                        clarifyLoading ||
                        generateLoading ||
                        collectCurrentAnswers().length === 0
                      }
                      onClick={() => void handleAskFollowUp()}
                    >
                      {clarifyLoading
                        ? '추가 질문 생성 중…'
                        : '더 구체적으로 답변하기'}
                    </button>
                  ) : null}

                  <label className="block">
                    <span className="text-[11px] font-semibold text-[#4f5e56]">
                      추가 메모 (선택)
                    </span>
                    <textarea
                      rows={2}
                      maxLength={300}
                      placeholder="브랜드 voice, 참조 사이트 등"
                      className="mt-1 w-full resize-none rounded-md border border-[#cbd6cf] bg-white px-2 py-1.5 text-xs text-[#18211d] outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
                      value={briefNotes}
                      disabled={generateLoading}
                      onChange={(event) => setBriefNotes(event.target.value)}
                    />
                  </label>

                  <div>
                    <span className="text-[11px] font-semibold text-[#4f5e56]">
                      변형 개수
                    </span>
                    <div className="mt-1 flex gap-1">
                      {VARIANT_COUNT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={briefVariantCount === opt}
                          disabled={generateLoading}
                          className={`rounded-md border px-3 py-1 text-[11px] transition ${
                            briefVariantCount === opt
                              ? 'border-[#1b7f72] bg-[#dff1ee] text-[#073d37]'
                              : 'border-[#cbd6cf] bg-white text-[#4f5e56] hover:border-[#1b7f72]'
                          }`}
                          onClick={() => setBriefVariantCount(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {briefVariantCount > 1 ? (
                      <p className="mt-1 text-[10px] text-[#647067]">
                        같은 브리프로 {briefVariantCount}개 변형을 동시 생성합니다.
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-md bg-[#1b7f72] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15665b] disabled:opacity-50"
                    disabled={generateLoading}
                    onClick={() => void handleGenerateTree()}
                  >
                    {generateLoading
                      ? briefVariantCount > 1
                        ? `${briefVariantCount}개 생성 중…`
                        : '생성 중…'
                      : briefVariantCount > 1
                        ? `디자인 ${briefVariantCount}개 생성`
                        : '디자인 생성'}
                  </button>
                </>
              )}

              {generateError !== null ? (
                <p
                  role="status"
                  className="text-xs text-[#9b3030]"
                  title={generateError}
                >
                  {generateError}
                </p>
              ) : null}
            </div>
          </details>

          <div className="border-b border-[#e0e5de] px-4 py-3">
            <h2 className="text-sm font-semibold">레이어</h2>
          </div>
          <nav className="flex-1 overflow-auto p-2">
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
            if (compareMode) return
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
            if (compareMode) return
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
          {compareMode ? (
            <div className="space-y-3 px-8 py-6">
              <p className="text-xs text-[#4f5e56]">
                비교할 디자인을 선택하면 편집 화면으로 돌아갑니다.
              </p>
              <VariantCompareGrid
                generations={generations}
                activeGenerationId={activeGenerationId}
                viewportWidth={selectedViewportPreset.width}
                canvasStyle={canvasStyle}
                disabled={generateLoading}
                onSelect={(id) => {
                  if (generateLoading) {
                    return
                  }
                  setCompareMode(false)
                  if (id !== activeGenerationId) {
                    handleSelectGeneration(id)
                  }
                }}
              />
            </div>
          ) : (
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
                <CanvasToolbarContext.Provider
                  value={{
                    selectedNodeId,
                    selectedStructureInfo,
                    onMoveUp: () => handleMoveSelected('up'),
                    onMoveDown: () => handleMoveSelected('down'),
                    onDuplicate: handleDuplicateSelected,
                    onDelete: handleDeleteSelected,
                  }}
                >
                  <CanvasNode
                    node={tree.root}
                    selectedNodeId={selectedNodeId}
                    onSelect={setSelectedNodeId}
                  />
                </CanvasToolbarContext.Provider>
              </div>
            </div>
          )}
        </section>

        {compareMode ? null : (
        <aside className="min-h-0 overflow-hidden border-l border-[#d7ddd2] bg-white">
          <NodeInspector
            node={selectedNode}
            tree={tree}
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
        )}
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

const CanvasReadOnlyContext = createContext(false)

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
  const hoverBackgroundStyle = getHoverBackgroundStyle(node.color)
  const hoverTextStyle = getHoverTextStyle(node.color)
  const activeBackgroundStyle = getActiveBackgroundStyle(node.color)
  const activeTextStyle = getActiveTextStyle(node.color)
  const focusBackgroundStyle = getFocusBackgroundStyle(node.color)
  const focusTextStyle = getFocusTextStyle(node.color)
  const disabledBackgroundStyle = getDisabledBackgroundStyle(node.color)
  const disabledTextStyle = getDisabledTextStyle(node.color)
  const transitionStyle = getTransitionStyle(node.transition)
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
            data-disabled={node.disabled === true ? 'true' : undefined}
            aria-disabled={node.disabled === true ? true : undefined}
            className={`inline-flex min-h-11 items-center rounded-md px-5 text-sm font-semibold transition ${
              node.variant === 'secondary'
                ? 'border border-current bg-[var(--dw-surface-muted)] text-[var(--dw-text-primary)]'
                : 'bg-[var(--dw-accent)] text-[var(--dw-accent-text)]'
            } ${
              node.color?.hoverBackgroundColor !== undefined
                ? 'hover:!bg-[var(--dw-hover-bg)] hover:!bg-none'
                : ''
            } ${
              node.color?.hoverTextColor !== undefined
                ? 'hover:!text-[var(--dw-hover-text)]'
                : ''
            } ${
              node.color?.activeBackgroundColor !== undefined
                ? 'active:!bg-[var(--dw-active-bg)] active:!bg-none'
                : ''
            } ${
              node.color?.activeTextColor !== undefined
                ? 'active:!text-[var(--dw-active-text)]'
                : ''
            } ${
              node.color?.focusBackgroundColor !== undefined
                ? 'group-focus-visible/dwnode:!bg-[var(--dw-focus-bg)] group-focus-visible/dwnode:!bg-none'
                : ''
            } ${
              node.color?.focusTextColor !== undefined
                ? 'group-focus-visible/dwnode:!text-[var(--dw-focus-text)]'
                : ''
            } ${
              node.color?.disabledBackgroundColor !== undefined
                ? 'data-[disabled=true]:!bg-[var(--dw-disabled-bg)] data-[disabled=true]:!bg-none'
                : ''
            } ${
              node.color?.disabledTextColor !== undefined
                ? 'data-[disabled=true]:!text-[var(--dw-disabled-text)]'
                : ''
            } data-[disabled=true]:pointer-events-none`}
            style={
              node.variant === 'secondary'
                ? mergeStyles(
                    boxStyle,
                    hoverBackgroundStyle,
                    hoverTextStyle,
                    activeBackgroundStyle,
                    activeTextStyle,
                    focusBackgroundStyle,
                    focusTextStyle,
                    disabledBackgroundStyle,
                    disabledTextStyle,
                    transitionStyle,
                  )
                : mergeStyles(
                    boxStyle,
                    accentBackgroundStyle,
                    hoverBackgroundStyle,
                    hoverTextStyle,
                    activeBackgroundStyle,
                    activeTextStyle,
                    focusBackgroundStyle,
                    focusTextStyle,
                    disabledBackgroundStyle,
                    disabledTextStyle,
                    transitionStyle,
                  )
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

interface CanvasToolbarContextValue {
  selectedNodeId: string
  selectedStructureInfo: StructureInfo
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
}

const CanvasToolbarContext = createContext<CanvasToolbarContextValue | null>(
  null,
)

function CanvasNodeToolbar({ nodeId }: { nodeId: string }) {
  const ctx = useContext(CanvasToolbarContext)
  if (ctx === null || ctx.selectedNodeId !== nodeId) {
    return null
  }

  const {
    selectedStructureInfo: info,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
  } = ctx

  if (info.isRoot) {
    return null
  }

  const canMoveUp = (info.index ?? 0) > 0
  const canMoveDown = (info.index ?? 0) < (info.siblingCount ?? 0) - 1

  return (
    <div
      role="toolbar"
      aria-label="선택 노드 툴바"
      className="pointer-events-auto absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded border border-[#c9d4cd] bg-white px-1 py-0.5 shadow"
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    >
      <CanvasToolbarButton
        ariaLabel="위로 이동"
        disabled={!canMoveUp}
        icon={ArrowUp}
        onClick={onMoveUp}
      />
      <CanvasToolbarButton
        ariaLabel="아래로 이동"
        disabled={!canMoveDown}
        icon={ArrowDown}
        onClick={onMoveDown}
      />
      <CanvasToolbarButton
        ariaLabel="복제"
        icon={Copy}
        onClick={onDuplicate}
      />
      <CanvasToolbarButton
        ariaLabel="삭제"
        icon={Trash2}
        onClick={onDelete}
        tone="danger"
      />
    </div>
  )
}

interface CanvasToolbarButtonProps {
  ariaLabel: string
  disabled?: boolean
  icon: LucideIcon
  onClick: () => void
  tone?: 'neutral' | 'danger'
}

function CanvasToolbarButton({
  ariaLabel,
  disabled = false,
  icon: Icon,
  onClick,
  tone = 'neutral',
}: CanvasToolbarButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-[#7a1f1f] hover:bg-[#fff1f1] focus-visible:bg-[#fff1f1]'
      : 'text-[#26312b] hover:bg-[#eef8f6] focus-visible:bg-[#eef8f6]'

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`inline-flex h-6 w-6 items-center justify-center rounded outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dw-accent)] disabled:cursor-not-allowed disabled:text-[#9aa49d] disabled:hover:bg-transparent ${toneClass}`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation()
        }
      }}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
    </button>
  )
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
  const readOnly = useContext(CanvasReadOnlyContext)
  const transformStyle = getTransformStyle(node.transform)
  const transitionStyle = getTransitionStyle(node.transition)

  if (readOnly) {
    const readOnlyStyle: CSSProperties = {
      pointerEvents: 'none',
      ...(node.opacity === undefined ? {} : { opacity: node.opacity }),
      ...(transitionStyle ?? {}),
      ...(transformStyle ?? {}),
    }
    return (
      <div className="border border-transparent" style={readOnlyStyle}>
        {children}
      </div>
    )
  }

  const isSelected = node.id === selectedNodeId
  const isCanvasSelectable = node.pointerEvents !== 'none'
  const nodeMetaStyle: CSSProperties = {
    pointerEvents: isCanvasSelectable ? 'auto' : 'none',
    ...(node.opacity === undefined ? {} : { opacity: node.opacity }),
    ...(node.cursor === undefined ? {} : { cursor: node.cursor }),
    ...(transitionStyle ?? {}),
    ...(transformStyle ?? {}),
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
      className={`group/dwnode relative border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-accent)] ${
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
      {isSelected ? <CanvasNodeToolbar nodeId={node.id} /> : null}
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
  const boxShadow = getShapeBoxShadow(shape)

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
    ...(boxShadow !== undefined ? { boxShadow } : {}),
  }

  return Object.keys(style).length > 0 ? style : undefined
}

function getShapeBoxShadow(shape: Shape): string | undefined {
  const customShadows = shape.customShadows?.filter(Boolean) ?? []
  if (customShadows.length > 0) {
    return customShadows.map(customShadowToCss).join(', ')
  }

  if (shape.customShadow !== undefined) {
    return customShadowToCss(shape.customShadow)
  }

  return shape.shadow !== undefined ? SHADOW_VALUES[shape.shadow] : undefined
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

function getHoverBackgroundStyle(color?: NodeColor): CSSProperties | undefined {
  return color?.hoverBackgroundColor === undefined
    ? undefined
    : ({
        '--dw-hover-bg': getCssColorWithOpacity(color.hoverBackgroundColor),
      } as CSSProperties)
}

function getHoverTextStyle(color?: NodeColor): CSSProperties | undefined {
  return color?.hoverTextColor === undefined
    ? undefined
    : ({
        '--dw-hover-text': getCssColorWithOpacity(color.hoverTextColor),
      } as CSSProperties)
}

function getActiveBackgroundStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.activeBackgroundColor === undefined
    ? undefined
    : ({
        '--dw-active-bg': getCssColorWithOpacity(color.activeBackgroundColor),
      } as CSSProperties)
}

function getActiveTextStyle(color?: NodeColor): CSSProperties | undefined {
  return color?.activeTextColor === undefined
    ? undefined
    : ({
        '--dw-active-text': getCssColorWithOpacity(color.activeTextColor),
      } as CSSProperties)
}

function getFocusBackgroundStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.focusBackgroundColor === undefined
    ? undefined
    : ({
        '--dw-focus-bg': getCssColorWithOpacity(color.focusBackgroundColor),
      } as CSSProperties)
}

function getFocusTextStyle(color?: NodeColor): CSSProperties | undefined {
  return color?.focusTextColor === undefined
    ? undefined
    : ({
        '--dw-focus-text': getCssColorWithOpacity(color.focusTextColor),
      } as CSSProperties)
}

function getDisabledBackgroundStyle(
  color?: NodeColor,
): CSSProperties | undefined {
  return color?.disabledBackgroundColor === undefined
    ? undefined
    : ({
        '--dw-disabled-bg': getCssColorWithOpacity(
          color.disabledBackgroundColor,
        ),
      } as CSSProperties)
}

function getDisabledTextStyle(color?: NodeColor): CSSProperties | undefined {
  return color?.disabledTextColor === undefined
    ? undefined
    : ({
        '--dw-disabled-text': getCssColorWithOpacity(color.disabledTextColor),
      } as CSSProperties)
}

function NodeTransformInput({
  label,
  max,
  min,
  placeholder,
  step,
  value,
  onChange,
}: {
  label: string
  max: number
  min: number
  placeholder: string
  step?: number
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-[#647067]">{label}</span>
      <input
        type="number"
        className="mt-1 h-9 w-full rounded-md border border-[#cbd6cf] bg-white px-2 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
        min={min}
        max={max}
        step={step ?? 1}
        placeholder={placeholder}
        value={value === undefined ? '' : value}
        onChange={(event) => {
          const raw = event.target.value
          if (raw === '') {
            onChange(undefined)
            return
          }
          const next = Number(raw)
          if (Number.isNaN(next)) {
            return
          }
          onChange(Math.max(min, Math.min(max, next)))
        }}
      />
    </label>
  )
}

function updateNodeTransformField(
  node: TreeNode,
  field: keyof NodeTransform,
  value: number | undefined,
  onNodeMetaChange: (
    node: TreeNode,
    patch: NodeMetaPatch,
    options?: CommitTreeEditOptions,
  ) => void,
) {
  const currentTransform = node.transform ?? {}
  const nextTransform: NodeTransform = { ...currentTransform }
  if (value === undefined) {
    delete nextTransform[field]
  } else {
    nextTransform[field] = value
  }
  const isEmpty = Object.keys(nextTransform).length === 0
  onNodeMetaChange(
    node,
    { transform: isEmpty ? undefined : nextTransform },
    { mergeKey: getNodeColorMergeKey(node.id, `meta.transform.${field}`) },
  )
}

const TRANSITION_CUBIC_BEZIER_DEFAULT: TransitionCubicBezier = {
  x1: 0.25,
  y1: 0.1,
  x2: 0.25,
  y2: 1,
}

function updateNodeTransitionCubicBezierField(
  node: TreeNode,
  field: keyof TransitionCubicBezier,
  value: number,
  onNodeMetaChange: (
    node: TreeNode,
    patch: NodeMetaPatch,
    options?: CommitTreeEditOptions,
  ) => void,
) {
  const currentTransition = node.transition ?? {}
  const currentCubicBezier =
    currentTransition.cubicBezier ?? TRANSITION_CUBIC_BEZIER_DEFAULT
  const min = field === 'x1' || field === 'x2' ? 0 : -2
  const max = field === 'x1' || field === 'x2' ? 1 : 2
  const clamped = Math.max(min, Math.min(max, value))
  const nextCubicBezier: TransitionCubicBezier = {
    ...currentCubicBezier,
    [field]: clamped,
  }
  onNodeMetaChange(
    node,
    {
      transition: {
        ...(currentTransition.duration !== undefined
          ? { duration: currentTransition.duration }
          : {}),
        ...(currentTransition.timing !== undefined
          ? { timing: currentTransition.timing }
          : {}),
        cubicBezier: nextCubicBezier,
      },
    },
    {
      mergeKey: getNodeColorMergeKey(
        node.id,
        `meta.transition.cubicBezier.${field}`,
      ),
    },
  )
}

function getTransformStyle(
  transform?: NodeTransform,
): CSSProperties | undefined {
  if (transform === undefined) {
    return undefined
  }
  const parts: string[] = []
  if (transform.perspective !== undefined) {
    parts.push(`perspective(${transform.perspective}px)`)
  }
  if (transform.translateX !== undefined) {
    parts.push(`translateX(${transform.translateX}px)`)
  }
  if (transform.translateY !== undefined) {
    parts.push(`translateY(${transform.translateY}px)`)
  }
  if (transform.rotate !== undefined) {
    parts.push(`rotate(${transform.rotate}deg)`)
  }
  if (transform.scale !== undefined) {
    parts.push(`scale(${transform.scale})`)
  }
  if (transform.skewX !== undefined) {
    parts.push(`skewX(${transform.skewX}deg)`)
  }
  if (transform.skewY !== undefined) {
    parts.push(`skewY(${transform.skewY}deg)`)
  }
  if (transform.rotateX !== undefined) {
    parts.push(`rotateX(${transform.rotateX}deg)`)
  }
  if (transform.rotateY !== undefined) {
    parts.push(`rotateY(${transform.rotateY}deg)`)
  }
  const style: CSSProperties = {}
  if (parts.length > 0) {
    style.transform = parts.join(' ')
  }
  if (transform.originX !== undefined || transform.originY !== undefined) {
    style.transformOrigin = `${transform.originX ?? 50}% ${transform.originY ?? 50}%`
  }
  return Object.keys(style).length === 0 ? undefined : style
}

const TRANSFORM_ORIGIN_PRESETS: ReadonlyArray<{
  id: string
  label: string
  x: number
  y: number
}> = [
  { id: 'top-left', label: '좌상', x: 0, y: 0 },
  { id: 'top', label: '상', x: 50, y: 0 },
  { id: 'top-right', label: '우상', x: 100, y: 0 },
  { id: 'left', label: '좌', x: 0, y: 50 },
  { id: 'center', label: '중앙', x: 50, y: 50 },
  { id: 'right', label: '우', x: 100, y: 50 },
  { id: 'bottom-left', label: '좌하', x: 0, y: 100 },
  { id: 'bottom', label: '하', x: 50, y: 100 },
  { id: 'bottom-right', label: '우하', x: 100, y: 100 },
]

function setNodeTransformOrigin(
  node: TreeNode,
  originX: number | undefined,
  originY: number | undefined,
  onNodeMetaChange: (
    node: TreeNode,
    patch: NodeMetaPatch,
    options?: CommitTreeEditOptions,
  ) => void,
) {
  const currentTransform = node.transform ?? {}
  const nextTransform: NodeTransform = { ...currentTransform }
  if (originX === undefined) {
    delete nextTransform.originX
  } else {
    nextTransform.originX = originX
  }
  if (originY === undefined) {
    delete nextTransform.originY
  } else {
    nextTransform.originY = originY
  }
  const isEmpty = Object.keys(nextTransform).length === 0
  onNodeMetaChange(
    node,
    { transform: isEmpty ? undefined : nextTransform },
    { mergeKey: getNodeColorMergeKey(node.id, 'meta.transform.origin') },
  )
}

function getTransitionStyle(
  transition?: NodeTransition,
): CSSProperties | undefined {
  if (transition === undefined) {
    return undefined
  }
  const style: CSSProperties = {}
  if (transition.duration !== undefined) {
    style.transitionDuration = `${transition.duration}ms`
  }
  if (transition.timing === 'custom') {
    const cb = transition.cubicBezier
    style.transitionTimingFunction =
      cb === undefined
        ? 'ease'
        : `cubic-bezier(${cb.x1}, ${cb.y1}, ${cb.x2}, ${cb.y2})`
  } else if (transition.timing !== undefined) {
    style.transitionTimingFunction = transition.timing
  }
  return Object.keys(style).length === 0 ? undefined : style
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

const KOREAN_SANS_FALLBACK_STACK =
  '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Helvetica Neue", "Segoe UI", Arial, sans-serif'

function getFontFamilyStack(fontFamily: FontFamily): string {
  if (fontFamily === 'serif') {
    return 'ui-serif, "Noto Serif KR", Georgia, serif'
  }

  if (fontFamily === 'mono') {
    return 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'
  }

  if (fontFamily !== 'sans') {
    return `"${fontFamily.replaceAll('"', '\\"')}", ${KOREAN_SANS_FALLBACK_STACK}`
  }

  return KOREAN_SANS_FALLBACK_STACK
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
  const filterCss = getImageFilterCss(presentation.filter)
  const imageStyle: CSSProperties = {
    objectFit: imageFit,
    ...(node.focalPoint
      ? { objectPosition: getImageObjectPosition(node.focalPoint) }
      : {}),
    ...(filterCss !== undefined ? { filter: filterCss } : {}),
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

const IMAGE_DROP_SHADOW_DEFAULT: ImageDropShadow = {
  offsetX: 0,
  offsetY: 4,
  blur: 6,
  color: '#000000',
}

function getImageFilterCss(filter?: ImageFilter): string | undefined {
  if (filter === undefined) {
    return undefined
  }
  const parts: string[] = []
  if (filter.blur !== undefined) {
    parts.push(`blur(${filter.blur}px)`)
  }
  if (filter.grayscale !== undefined) {
    parts.push(`grayscale(${filter.grayscale}%)`)
  }
  if (filter.sepia !== undefined) {
    parts.push(`sepia(${filter.sepia}%)`)
  }
  if (filter.brightness !== undefined) {
    parts.push(`brightness(${filter.brightness}%)`)
  }
  if (filter.contrast !== undefined) {
    parts.push(`contrast(${filter.contrast}%)`)
  }
  if (filter.hueRotate !== undefined) {
    parts.push(`hue-rotate(${filter.hueRotate}deg)`)
  }
  if (filter.saturate !== undefined) {
    parts.push(`saturate(${filter.saturate}%)`)
  }
  if (filter.invert !== undefined) {
    parts.push(`invert(${filter.invert}%)`)
  }
  if (filter.dropShadow !== undefined) {
    const ds = filter.dropShadow
    parts.push(
      `drop-shadow(${ds.offsetX}px ${ds.offsetY}px ${ds.blur}px ${ds.color})`,
    )
  }
  if (filter.dropShadows !== undefined) {
    for (const ds of filter.dropShadows) {
      parts.push(
        `drop-shadow(${ds.offsetX}px ${ds.offsetY}px ${ds.blur}px ${ds.color})`,
      )
    }
  }
  return parts.length === 0 ? undefined : parts.join(' ')
}

const aspectRatioClasses: Record<NonNullable<ImageNode['aspectRatio']>, string> = {
  square: 'aspect-square',
  landscape: 'aspect-[3/2]',
  portrait: 'aspect-[4/5]',
  wide: 'aspect-video',
}

interface NodeInspectorProps {
  node: TreeNode
  tree: Tree
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
  tree,
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
  const isSelectedNodeContainer = isContainerNode(node)
  const [openSectionsByNode, setOpenSectionsByNode] = useState<
    Record<string, Record<string, boolean>>
  >(() => ({
    [node.id]: computeInspectorSmartDefaults(node.type, isSelectedNodeContainer),
  }))

  useEffect(() => {
    setOpenSectionsByNode((prev) => {
      if (prev[node.id] !== undefined) {
        return prev
      }
      return {
        ...prev,
        [node.id]: computeInspectorSmartDefaults(
          node.type,
          isSelectedNodeContainer,
        ),
      }
    })
  }, [node.id, node.type, isSelectedNodeContainer])

  const openSections =
    openSectionsByNode[node.id] ??
    computeInspectorSmartDefaults(node.type, isSelectedNodeContainer)

  function bindSection(title: string) {
    return {
      open: openSections[title] === true,
      onOpenChange: (next: boolean) =>
        setOpenSectionsByNode((prev) => {
          const current = prev[node.id] ?? {}
          if (current[title] === next) {
            return prev
          }
          return { ...prev, [node.id]: { ...current, [title]: next } }
        }),
    }
  }

  const visibleControlledSectionTitles = getVisibleControlledSectionTitles(
    node.type,
  )
  const anyVisibleSectionOpen = visibleControlledSectionTitles.some(
    (title) => openSections[title] === true,
  )

  function handleMasterCollapseToggle() {
    setOpenSectionsByNode((prev) => {
      const current = prev[node.id] ?? {}
      const next: Record<string, boolean> = { ...current }
      visibleControlledSectionTitles.forEach((title) => {
        next[title] = !anyVisibleSectionOpen
      })
      return { ...prev, [node.id]: next }
    })
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[#e0e5de] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">속성</h2>
          <button
            type="button"
            aria-label={
              anyVisibleSectionOpen ? '모두 접기' : '모두 펼치기'
            }
            className="text-xs font-semibold text-[#1b7f72] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72]"
            onClick={handleMasterCollapseToggle}
          >
            {anyVisibleSectionOpen ? '모두 접기' : '모두 펼치기'}
          </button>
        </div>
        <p className="mt-1 break-all text-xs text-[#647067]">{node.id}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <InspectorDisclosure title="기본 정보" defaultOpen={false}>
          <MetadataGrid node={node} />
        </InspectorDisclosure>

        <NodeVisibilityControls
          node={node}
          disclosure={bindSection('표시')}
          onNodeMetaChange={onNodeMetaChange}
        />

        <StyleControls
          colorPreset={colorPreset}
          onColorPresetChange={onColorPresetChange}
        />

        <NodeColorControls
          node={node}
          tree={tree}
          colorPreset={colorPreset}
          disclosure={bindSection('색상')}
          onNodeColorChange={onNodeColorChange}
          onNodeColorReset={onNodeColorReset}
          onNodeMetaChange={onNodeMetaChange}
        />

        {node.type === 'text' ? (
          <>
            <InspectorDisclosure
              title="내용"
              defaultOpen={false}
              {...bindSection('내용')}
            >
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
              disclosure={bindSection('타이포그래피')}
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
          disclosure={bindSection('레이아웃')}
          onLayoutChange={onLayoutChange}
          onLayoutReset={onLayoutReset}
          onSpacingChange={onSpacingChange}
        />

        <SpacingControls
          node={node}
          disclosure={bindSection('간격')}
          onSpacingChange={onSpacingChange}
          onSpacingReset={onSpacingReset}
        />

        <ShapeControls
          node={node}
          disclosure={bindSection('모양')}
          onShapeChange={onShapeChange}
          onShapeReset={onShapeReset}
        />

        {node.type === 'button' ? (
          <InspectorDisclosure title="내용" {...bindSection('내용')}>
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
            <InspectorDisclosure title="이미지" {...bindSection('이미지')}>
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
              disclosure={bindSection('이미지 구도')}
              onImageChange={onImageChange}
            />
          </>
        ) : null}

        <StructureControls
          info={structureInfo}
          disclosure={bindSection('구조')}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />

        <InspectorDisclosure
          title="변환"
          description="이동, 회전, 크기"
          {...bindSection('변환')}
          onAction={() =>
            onNodeMetaChange(
              node,
              { transform: undefined },
              { mergeKey: getNodeColorMergeKey(node.id, 'meta.transform.reset') },
            )
          }
          isActionDisabled={node.transform === undefined}
        >
          <div className="grid grid-cols-2 gap-2">
            <NodeTransformInput
              label="X 이동 (px)"
              min={-200}
              max={200}
              placeholder="0"
              value={node.transform?.translateX}
              onChange={(value) =>
                updateNodeTransformField(
                  node,
                  'translateX',
                  value,
                  onNodeMetaChange,
                )
              }
            />
            <NodeTransformInput
              label="Y 이동 (px)"
              min={-200}
              max={200}
              placeholder="0"
              value={node.transform?.translateY}
              onChange={(value) =>
                updateNodeTransformField(
                  node,
                  'translateY',
                  value,
                  onNodeMetaChange,
                )
              }
            />
            <NodeTransformInput
              label="회전 (°)"
              min={-360}
              max={360}
              placeholder="0"
              value={node.transform?.rotate}
              onChange={(value) =>
                updateNodeTransformField(
                  node,
                  'rotate',
                  value,
                  onNodeMetaChange,
                )
              }
            />
            <NodeTransformInput
              label="크기"
              min={0.5}
              max={2}
              step={0.05}
              placeholder="1"
              value={node.transform?.scale}
              onChange={(value) =>
                updateNodeTransformField(
                  node,
                  'scale',
                  value,
                  onNodeMetaChange,
                )
              }
            />
            <NodeTransformInput
              label="X 기울임 (°)"
              min={-45}
              max={45}
              placeholder="0"
              value={node.transform?.skewX}
              onChange={(value) =>
                updateNodeTransformField(
                  node,
                  'skewX',
                  value,
                  onNodeMetaChange,
                )
              }
            />
            <NodeTransformInput
              label="Y 기울임 (°)"
              min={-45}
              max={45}
              placeholder="0"
              value={node.transform?.skewY}
              onChange={(value) =>
                updateNodeTransformField(
                  node,
                  'skewY',
                  value,
                  onNodeMetaChange,
                )
              }
            />
          </div>
          <div className="mt-3 rounded-md border border-dashed border-[#cbd6cf] bg-[#f8faf9] p-3">
            <span className="text-[11px] font-semibold text-[#4f5e56]">3D</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <NodeTransformInput
                label="X 회전 (°)"
                min={-360}
                max={360}
                placeholder="0"
                value={node.transform?.rotateX}
                onChange={(value) =>
                  updateNodeTransformField(
                    node,
                    'rotateX',
                    value,
                    onNodeMetaChange,
                  )
                }
              />
              <NodeTransformInput
                label="Y 회전 (°)"
                min={-360}
                max={360}
                placeholder="0"
                value={node.transform?.rotateY}
                onChange={(value) =>
                  updateNodeTransformField(
                    node,
                    'rotateY',
                    value,
                    onNodeMetaChange,
                  )
                }
              />
              <NodeTransformInput
                label="원근 (px)"
                min={200}
                max={2000}
                placeholder="800"
                value={node.transform?.perspective}
                onChange={(value) =>
                  updateNodeTransformField(
                    node,
                    'perspective',
                    value,
                    onNodeMetaChange,
                  )
                }
              />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] text-[#647067]">기준점</span>
            <div className="mt-1 grid w-fit grid-cols-3 gap-1 rounded-md border border-[#cbd6cf] bg-white p-1">
              {TRANSFORM_ORIGIN_PRESETS.map((preset) => {
                const isActive =
                  node.transform?.originX === preset.x &&
                  node.transform?.originY === preset.y
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={`기준점 ${preset.label}`}
                    aria-pressed={isActive}
                    title={preset.label}
                    className={`flex h-6 w-6 items-center justify-center rounded border text-[10px] transition-colors ${
                      isActive
                        ? 'border-[#1b7f72] bg-[#1b7f72] text-white'
                        : 'border-transparent text-[#647067] hover:border-[#cbd6cf] hover:bg-[#f1f5f3]'
                    }`}
                    onClick={() => {
                      if (isActive) {
                        setNodeTransformOrigin(
                          node,
                          undefined,
                          undefined,
                          onNodeMetaChange,
                        )
                      } else {
                        setNodeTransformOrigin(
                          node,
                          preset.x,
                          preset.y,
                          onNodeMetaChange,
                        )
                      }
                    }}
                  >
                    <span
                      className={`block h-1.5 w-1.5 rounded-full ${
                        isActive ? 'bg-white' : 'bg-[#647067]'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        </InspectorDisclosure>

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

interface InspectorDisclosureControl {
  onOpenChange: (next: boolean) => void
  open: boolean
}

interface InspectorDisclosureProps {
  actionLabel?: string
  children: ReactNode
  defaultOpen?: boolean
  description?: string
  isActionDisabled?: boolean
  onAction?: () => void
  onOpenChange?: (next: boolean) => void
  open?: boolean
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
  onOpenChange,
  open,
  summaryEnd,
  title,
}: InspectorDisclosureProps) {
  const isControlled = open !== undefined && onOpenChange !== undefined
  const detailsOpen = isControlled ? open : defaultOpen

  return (
    <details
      className="rounded-md border border-[#d7ddd2] bg-[#fbfcfa] [&[open]>summary_.dw-chevron]:rotate-180"
      open={detailsOpen}
      onToggle={
        isControlled
          ? (event) => {
              const next = event.currentTarget.open
              if (next !== open) {
                onOpenChange(next)
              }
            }
          : undefined
      }
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
  disclosure?: InspectorDisclosureControl
  node: TreeNode
  onNodeMetaChange: (
    node: TreeNode,
    patch: NodeMetaPatch,
    options?: CommitTreeEditOptions,
  ) => void
}

function NodeVisibilityControls({
  disclosure,
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
      {...disclosure}
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
        <label className="block">
          <span className="text-xs font-semibold text-[#4f5e56]">커서</span>
          <select
            className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm font-semibold text-[#26312b] outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
            value={node.cursor ?? ''}
            onChange={(event) => {
              const raw = event.target.value
              onNodeMetaChange(
                node,
                {
                  cursor:
                    raw === '' ? undefined : (raw as NodeCursor),
                },
                { mergeKey: getNodeColorMergeKey(node.id, 'meta.cursor') },
              )
            }}
          >
            <option value="">자동</option>
            {NODE_CURSOR_IDS.map((cursorId) => (
              <option key={cursorId} value={cursorId}>
                {nodeCursorLabels[cursorId]}
              </option>
            ))}
          </select>
        </label>
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
  disclosure?: InspectorDisclosureControl
  node: TreeNode
  tree: Tree
  colorPreset: ColorPreset
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
  disclosure,
  node,
  tree,
  colorPreset,
  onNodeColorChange,
  onNodeMetaChange,
  onNodeColorReset,
}: NodeColorControlsProps) {
  const textContrast =
    node.type === 'text' ? computeTextContrast(tree, node, colorPreset) : null
  const color = node.color ?? {}
  const supportsAccentColor = canUseAccentColor(node)
  const supportsHoverBackgroundColor = node.type === 'button'
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
  const [hoverBackgroundColorInput, setHoverBackgroundColorInput] = useState(
    color.hoverBackgroundColor ?? '',
  )
  const [hoverTextColorInput, setHoverTextColorInput] = useState(
    color.hoverTextColor ?? '',
  )
  const [activeBackgroundColorInput, setActiveBackgroundColorInput] = useState(
    color.activeBackgroundColor ?? '',
  )
  const [activeTextColorInput, setActiveTextColorInput] = useState(
    color.activeTextColor ?? '',
  )
  const [focusBackgroundColorInput, setFocusBackgroundColorInput] = useState(
    color.focusBackgroundColor ?? '',
  )
  const [focusTextColorInput, setFocusTextColorInput] = useState(
    color.focusTextColor ?? '',
  )
  const [disabledBackgroundColorInput, setDisabledBackgroundColorInput] =
    useState(color.disabledBackgroundColor ?? '')
  const [disabledTextColorInput, setDisabledTextColorInput] = useState(
    color.disabledTextColor ?? '',
  )
  const [backgroundColorError, setBackgroundColorError] = useState(false)
  const [backgroundGradientFromError, setBackgroundGradientFromError] =
    useState(false)
  const [backgroundGradientToError, setBackgroundGradientToError] =
    useState(false)
  const [textColorError, setTextColorError] = useState(false)
  const [accentColorError, setAccentColorError] = useState(false)
  const [hoverBackgroundColorError, setHoverBackgroundColorError] =
    useState(false)
  const [hoverTextColorError, setHoverTextColorError] = useState(false)
  const [activeBackgroundColorError, setActiveBackgroundColorError] =
    useState(false)
  const [activeTextColorError, setActiveTextColorError] = useState(false)
  const [focusBackgroundColorError, setFocusBackgroundColorError] =
    useState(false)
  const [focusTextColorError, setFocusTextColorError] = useState(false)
  const [disabledBackgroundColorError, setDisabledBackgroundColorError] =
    useState(false)
  const [disabledTextColorError, setDisabledTextColorError] = useState(false)

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
    setHoverBackgroundColorInput(color.hoverBackgroundColor ?? '')
    setHoverBackgroundColorError(false)
  }, [node.id, color.hoverBackgroundColor])

  useEffect(() => {
    setHoverTextColorInput(color.hoverTextColor ?? '')
    setHoverTextColorError(false)
  }, [node.id, color.hoverTextColor])

  useEffect(() => {
    setActiveBackgroundColorInput(color.activeBackgroundColor ?? '')
    setActiveBackgroundColorError(false)
  }, [node.id, color.activeBackgroundColor])

  useEffect(() => {
    setActiveTextColorInput(color.activeTextColor ?? '')
    setActiveTextColorError(false)
  }, [node.id, color.activeTextColor])

  useEffect(() => {
    setFocusBackgroundColorInput(color.focusBackgroundColor ?? '')
    setFocusBackgroundColorError(false)
  }, [node.id, color.focusBackgroundColor])

  useEffect(() => {
    setFocusTextColorInput(color.focusTextColor ?? '')
    setFocusTextColorError(false)
  }, [node.id, color.focusTextColor])

  useEffect(() => {
    setDisabledBackgroundColorInput(color.disabledBackgroundColor ?? '')
    setDisabledBackgroundColorError(false)
  }, [node.id, color.disabledBackgroundColor])

  useEffect(() => {
    setDisabledTextColorInput(color.disabledTextColor ?? '')
    setDisabledTextColorError(false)
  }, [node.id, color.disabledTextColor])

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

  function updateHoverBackgroundColorFromText(value: string) {
    const trimmedValue = value.trim()

    setHoverBackgroundColorInput(value)

    if (trimmedValue === '') {
      setHoverBackgroundColorError(false)
      onNodeColorChange(node, { hoverBackgroundColor: undefined })
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setHoverBackgroundColorError(true)
      return
    }

    const normalizedValue = normalizeHexColor(trimmedValue)
    setHoverBackgroundColorInput(normalizedValue)
    setHoverBackgroundColorError(false)
    onNodeColorChange(node, { hoverBackgroundColor: normalizedValue })
  }

  function updateHoverBackgroundColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setHoverBackgroundColorInput(normalizedValue)
    setHoverBackgroundColorError(false)

    onNodeColorChange(
      node,
      { hoverBackgroundColor: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, 'hoverBackgroundColor') },
    )
  }

  function updateHoverTextColorFromText(value: string) {
    const trimmedValue = value.trim()

    setHoverTextColorInput(value)

    if (trimmedValue === '') {
      setHoverTextColorError(false)
      onNodeColorChange(node, { hoverTextColor: undefined })
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setHoverTextColorError(true)
      return
    }

    const normalizedValue = normalizeHexColor(trimmedValue)
    setHoverTextColorInput(normalizedValue)
    setHoverTextColorError(false)
    onNodeColorChange(node, { hoverTextColor: normalizedValue })
  }

  function updateHoverTextColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setHoverTextColorInput(normalizedValue)
    setHoverTextColorError(false)

    onNodeColorChange(
      node,
      { hoverTextColor: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, 'hoverTextColor') },
    )
  }

  function updateActiveBackgroundColorFromText(value: string) {
    const trimmedValue = value.trim()
    setActiveBackgroundColorInput(value)
    if (trimmedValue === '') {
      setActiveBackgroundColorError(false)
      onNodeColorChange(node, { activeBackgroundColor: undefined })
      return
    }
    if (!isValidHexColor(trimmedValue)) {
      setActiveBackgroundColorError(true)
      return
    }
    const normalizedValue = normalizeHexColor(trimmedValue)
    setActiveBackgroundColorInput(normalizedValue)
    setActiveBackgroundColorError(false)
    onNodeColorChange(node, { activeBackgroundColor: normalizedValue })
  }

  function updateActiveBackgroundColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setActiveBackgroundColorInput(normalizedValue)
    setActiveBackgroundColorError(false)
    onNodeColorChange(
      node,
      { activeBackgroundColor: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, 'activeBackgroundColor') },
    )
  }

  function updateActiveTextColorFromText(value: string) {
    const trimmedValue = value.trim()
    setActiveTextColorInput(value)
    if (trimmedValue === '') {
      setActiveTextColorError(false)
      onNodeColorChange(node, { activeTextColor: undefined })
      return
    }
    if (!isValidHexColor(trimmedValue)) {
      setActiveTextColorError(true)
      return
    }
    const normalizedValue = normalizeHexColor(trimmedValue)
    setActiveTextColorInput(normalizedValue)
    setActiveTextColorError(false)
    onNodeColorChange(node, { activeTextColor: normalizedValue })
  }

  function updateActiveTextColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setActiveTextColorInput(normalizedValue)
    setActiveTextColorError(false)
    onNodeColorChange(
      node,
      { activeTextColor: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, 'activeTextColor') },
    )
  }

  function updateFocusBackgroundColorFromText(value: string) {
    const trimmedValue = value.trim()
    setFocusBackgroundColorInput(value)
    if (trimmedValue === '') {
      setFocusBackgroundColorError(false)
      onNodeColorChange(node, { focusBackgroundColor: undefined })
      return
    }
    if (!isValidHexColor(trimmedValue)) {
      setFocusBackgroundColorError(true)
      return
    }
    const normalizedValue = normalizeHexColor(trimmedValue)
    setFocusBackgroundColorInput(normalizedValue)
    setFocusBackgroundColorError(false)
    onNodeColorChange(node, { focusBackgroundColor: normalizedValue })
  }

  function updateFocusBackgroundColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setFocusBackgroundColorInput(normalizedValue)
    setFocusBackgroundColorError(false)
    onNodeColorChange(
      node,
      { focusBackgroundColor: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, 'focusBackgroundColor') },
    )
  }

  function updateFocusTextColorFromText(value: string) {
    const trimmedValue = value.trim()
    setFocusTextColorInput(value)
    if (trimmedValue === '') {
      setFocusTextColorError(false)
      onNodeColorChange(node, { focusTextColor: undefined })
      return
    }
    if (!isValidHexColor(trimmedValue)) {
      setFocusTextColorError(true)
      return
    }
    const normalizedValue = normalizeHexColor(trimmedValue)
    setFocusTextColorInput(normalizedValue)
    setFocusTextColorError(false)
    onNodeColorChange(node, { focusTextColor: normalizedValue })
  }

  function updateFocusTextColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setFocusTextColorInput(normalizedValue)
    setFocusTextColorError(false)
    onNodeColorChange(
      node,
      { focusTextColor: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, 'focusTextColor') },
    )
  }

  function updateDisabledBackgroundColorFromText(value: string) {
    const trimmedValue = value.trim()
    setDisabledBackgroundColorInput(value)
    if (trimmedValue === '') {
      setDisabledBackgroundColorError(false)
      onNodeColorChange(node, { disabledBackgroundColor: undefined })
      return
    }
    if (!isValidHexColor(trimmedValue)) {
      setDisabledBackgroundColorError(true)
      return
    }
    const normalizedValue = normalizeHexColor(trimmedValue)
    setDisabledBackgroundColorInput(normalizedValue)
    setDisabledBackgroundColorError(false)
    onNodeColorChange(node, { disabledBackgroundColor: normalizedValue })
  }

  function updateDisabledBackgroundColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setDisabledBackgroundColorInput(normalizedValue)
    setDisabledBackgroundColorError(false)
    onNodeColorChange(
      node,
      { disabledBackgroundColor: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, 'disabledBackgroundColor') },
    )
  }

  function updateDisabledTextColorFromText(value: string) {
    const trimmedValue = value.trim()
    setDisabledTextColorInput(value)
    if (trimmedValue === '') {
      setDisabledTextColorError(false)
      onNodeColorChange(node, { disabledTextColor: undefined })
      return
    }
    if (!isValidHexColor(trimmedValue)) {
      setDisabledTextColorError(true)
      return
    }
    const normalizedValue = normalizeHexColor(trimmedValue)
    setDisabledTextColorInput(normalizedValue)
    setDisabledTextColorError(false)
    onNodeColorChange(node, { disabledTextColor: normalizedValue })
  }

  function updateDisabledTextColorFromPicker(value: string) {
    const normalizedValue = normalizeHexColor(value)
    setDisabledTextColorInput(normalizedValue)
    setDisabledTextColorError(false)
    onNodeColorChange(
      node,
      { disabledTextColor: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, 'disabledTextColor') },
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

  function updateBackgroundGradientConicGeometry(
    field: GradientConicField,
    value: number | undefined,
  ) {
    onNodeColorChange(
      node,
      {
        backgroundColor: undefined,
        backgroundOpacity: undefined,
        backgroundGradient: getGradientWithPatch(backgroundGradient, {
          [field]: value,
        }),
      },
      {
        mergeKey: getNodeColorMergeKey(
          node.id,
          `backgroundGradient.${field}`,
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
      {...disclosure}
    >
      {textContrast ? (
        <TextContrastReadout contrast={textContrast} />
      ) : null}
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
                onConicGeometry={updateBackgroundGradientConicGeometry}
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

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              호버 배경
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
              <input
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                value={hoverBackgroundColorInput}
                placeholder="#RRGGBB"
                aria-invalid={hoverBackgroundColorError}
                spellCheck={false}
                onChange={(event) =>
                  updateHoverBackgroundColorFromText(event.target.value)
                }
              />
              <input
                type="color"
                aria-label="호버 배경 선택"
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                value={toColorInputValue(
                  hoverBackgroundColorInput,
                  color.backgroundColor ?? DEFAULT_COLOR_PICKER_COLOR,
                )}
                onChange={(event) =>
                  updateHoverBackgroundColorFromPicker(event.target.value)
                }
              />
            </span>
            {hoverBackgroundColorError ? (
              <span className="mt-2 block text-xs text-[#b42318]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              호버 글자
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
              <input
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                value={hoverTextColorInput}
                placeholder="#RRGGBB"
                aria-invalid={hoverTextColorError}
                spellCheck={false}
                onChange={(event) =>
                  updateHoverTextColorFromText(event.target.value)
                }
              />
              <input
                type="color"
                aria-label="호버 글자 선택"
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                value={toColorInputValue(
                  hoverTextColorInput,
                  color.textColor ?? DEFAULT_TEXT_PICKER_COLOR,
                )}
                onChange={(event) =>
                  updateHoverTextColorFromPicker(event.target.value)
                }
              />
            </span>
            {hoverTextColorError ? (
              <span className="mt-2 block text-xs text-[#b42318]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              활성 배경
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
              <input
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                value={activeBackgroundColorInput}
                placeholder="#RRGGBB"
                aria-invalid={activeBackgroundColorError}
                spellCheck={false}
                onChange={(event) =>
                  updateActiveBackgroundColorFromText(event.target.value)
                }
              />
              <input
                type="color"
                aria-label="활성 배경 선택"
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                value={toColorInputValue(
                  activeBackgroundColorInput,
                  color.backgroundColor ?? DEFAULT_COLOR_PICKER_COLOR,
                )}
                onChange={(event) =>
                  updateActiveBackgroundColorFromPicker(event.target.value)
                }
              />
            </span>
            {activeBackgroundColorError ? (
              <span className="mt-2 block text-xs text-[#b42318]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              활성 글자
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
              <input
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                value={activeTextColorInput}
                placeholder="#RRGGBB"
                aria-invalid={activeTextColorError}
                spellCheck={false}
                onChange={(event) =>
                  updateActiveTextColorFromText(event.target.value)
                }
              />
              <input
                type="color"
                aria-label="활성 글자 선택"
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                value={toColorInputValue(
                  activeTextColorInput,
                  color.textColor ?? DEFAULT_TEXT_PICKER_COLOR,
                )}
                onChange={(event) =>
                  updateActiveTextColorFromPicker(event.target.value)
                }
              />
            </span>
            {activeTextColorError ? (
              <span className="mt-2 block text-xs text-[#b42318]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              포커스 배경
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
              <input
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                value={focusBackgroundColorInput}
                placeholder="#RRGGBB"
                aria-invalid={focusBackgroundColorError}
                spellCheck={false}
                onChange={(event) =>
                  updateFocusBackgroundColorFromText(event.target.value)
                }
              />
              <input
                type="color"
                aria-label="포커스 배경 선택"
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                value={toColorInputValue(
                  focusBackgroundColorInput,
                  color.backgroundColor ?? DEFAULT_COLOR_PICKER_COLOR,
                )}
                onChange={(event) =>
                  updateFocusBackgroundColorFromPicker(event.target.value)
                }
              />
            </span>
            {focusBackgroundColorError ? (
              <span className="mt-2 block text-xs text-[#b42318]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              포커스 글자
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
              <input
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                value={focusTextColorInput}
                placeholder="#RRGGBB"
                aria-invalid={focusTextColorError}
                spellCheck={false}
                onChange={(event) =>
                  updateFocusTextColorFromText(event.target.value)
                }
              />
              <input
                type="color"
                aria-label="포커스 글자 선택"
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                value={toColorInputValue(
                  focusTextColorInput,
                  color.textColor ?? DEFAULT_TEXT_PICKER_COLOR,
                )}
                onChange={(event) =>
                  updateFocusTextColorFromPicker(event.target.value)
                }
              />
            </span>
            {focusTextColorError ? (
              <span className="mt-2 block text-xs text-[#b42318]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              전환 시간 (ms)
            </span>
            <input
              type="number"
              min={0}
              max={2000}
              step={10}
              placeholder="150"
              value={node.transition?.duration ?? ''}
              className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
              onChange={(event) => {
                const raw = event.target.value
                const currentTiming = node.transition?.timing
                const currentCubicBezier = node.transition?.cubicBezier
                if (raw === '') {
                  const nextTransition =
                    currentTiming === undefined && currentCubicBezier === undefined
                      ? undefined
                      : {
                          ...(currentTiming !== undefined
                            ? { timing: currentTiming }
                            : {}),
                          ...(currentCubicBezier !== undefined
                            ? { cubicBezier: currentCubicBezier }
                            : {}),
                        }
                  onNodeMetaChange(
                    node,
                    { transition: nextTransition },
                    {
                      mergeKey: getNodeColorMergeKey(
                        node.id,
                        'meta.transition.duration',
                      ),
                    },
                  )
                  return
                }
                const next = Number(raw)
                if (Number.isNaN(next)) {
                  return
                }
                const clamped = Math.max(0, Math.min(2000, next))
                onNodeMetaChange(
                  node,
                  {
                    transition: {
                      duration: clamped,
                      ...(currentTiming !== undefined
                        ? { timing: currentTiming }
                        : {}),
                      ...(currentCubicBezier !== undefined
                        ? { cubicBezier: currentCubicBezier }
                        : {}),
                    },
                  },
                  {
                    mergeKey: getNodeColorMergeKey(
                      node.id,
                      'meta.transition.duration',
                    ),
                  },
                )
              }}
            />
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              전환 곡선
            </span>
            <select
              className="mt-2 h-10 w-full rounded-md border border-[#cbd6cf] bg-white px-3 text-sm font-semibold text-[#26312b] outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
              value={node.transition?.timing ?? ''}
              onChange={(event) => {
                const raw = event.target.value
                const currentDuration = node.transition?.duration
                const currentCubicBezier = node.transition?.cubicBezier
                const nextTiming =
                  raw === '' ? undefined : (raw as NodeTransitionTiming)
                const nextTransition =
                  currentDuration === undefined &&
                  nextTiming === undefined &&
                  currentCubicBezier === undefined
                    ? undefined
                    : {
                        ...(currentDuration !== undefined
                          ? { duration: currentDuration }
                          : {}),
                        ...(nextTiming !== undefined
                          ? { timing: nextTiming }
                          : {}),
                        ...(currentCubicBezier !== undefined
                          ? { cubicBezier: currentCubicBezier }
                          : {}),
                      }
                onNodeMetaChange(
                  node,
                  { transition: nextTransition },
                  {
                    mergeKey: getNodeColorMergeKey(
                      node.id,
                      'meta.transition.timing',
                    ),
                  },
                )
              }}
            >
              <option value="">자동</option>
              {NODE_TRANSITION_TIMING_IDS.map((timingId) => (
                <option key={timingId} value={timingId}>
                  {nodeTransitionTimingLabels[timingId]}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {supportsHoverBackgroundColor && node.transition?.timing === 'custom' ? (
          <div className="space-y-2 rounded-md border border-dashed border-[#cbd6cf] bg-[#f8faf9] p-3">
            <span className="text-[11px] font-semibold text-[#4f5e56]">
              사용자 지정 곡선
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(['x1', 'y1', 'x2', 'y2'] as const).map((axis) => {
                const isX = axis === 'x1' || axis === 'x2'
                const fallback = TRANSITION_CUBIC_BEZIER_DEFAULT[axis]
                const current = node.transition?.cubicBezier?.[axis] ?? fallback
                return (
                  <NodeTransformInput
                    key={axis}
                    label={axis.toUpperCase()}
                    min={isX ? 0 : -2}
                    max={isX ? 1 : 2}
                    step={0.01}
                    placeholder={`${fallback}`}
                    value={current}
                    onChange={(value) =>
                      updateNodeTransitionCubicBezierField(
                        node,
                        axis,
                        value === undefined ? fallback : value,
                        onNodeMetaChange,
                      )
                    }
                  />
                )
              })}
            </div>
          </div>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="flex items-center gap-2 text-xs font-semibold text-[#4f5e56]">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-[#1b7f72]"
              checked={node.disabled === true}
              onChange={(event) =>
                onNodeMetaChange(
                  node,
                  { disabled: event.target.checked ? true : undefined },
                  { mergeKey: getNodeColorMergeKey(node.id, 'meta.disabled') },
                )
              }
            />
            비활성 상태
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              비활성 배경
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
              <input
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                value={disabledBackgroundColorInput}
                placeholder="#RRGGBB"
                aria-invalid={disabledBackgroundColorError}
                spellCheck={false}
                onChange={(event) =>
                  updateDisabledBackgroundColorFromText(event.target.value)
                }
              />
              <input
                type="color"
                aria-label="비활성 배경 선택"
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                value={toColorInputValue(
                  disabledBackgroundColorInput,
                  color.backgroundColor ?? DEFAULT_COLOR_PICKER_COLOR,
                )}
                onChange={(event) =>
                  updateDisabledBackgroundColorFromPicker(event.target.value)
                }
              />
            </span>
            {disabledBackgroundColorError ? (
              <span className="mt-2 block text-xs text-[#b42318]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#4f5e56]">
              비활성 글자
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
              <input
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                value={disabledTextColorInput}
                placeholder="#RRGGBB"
                aria-invalid={disabledTextColorError}
                spellCheck={false}
                onChange={(event) =>
                  updateDisabledTextColorFromText(event.target.value)
                }
              />
              <input
                type="color"
                aria-label="비활성 글자 선택"
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                value={toColorInputValue(
                  disabledTextColorInput,
                  color.textColor ?? DEFAULT_TEXT_PICKER_COLOR,
                )}
                onChange={(event) =>
                  updateDisabledTextColorFromPicker(event.target.value)
                }
              />
            </span>
            {disabledTextColorError ? (
              <span className="mt-2 block text-xs text-[#b42318]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        <OpacityControl
          label="노드 투명도"
          value={node.opacity}
          onChange={updateNodeOpacity}
        />
      </div>
    </InspectorDisclosure>
  )
}

type GradientConicField =
  | 'conicFromAngle'
  | 'conicCenterX'
  | 'conicCenterY'

interface GradientControlsProps {
  fromError: boolean
  fromInput: string
  gradient: Gradient
  labelPrefix: string
  onColorPicker: (field: GradientColorStopField, value: string) => void
  onColorText: (field: GradientColorStopField, value: string) => void
  onConicGeometry: (field: GradientConicField, value: number | undefined) => void
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
  onConicGeometry,
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

      {gradient.type === 'conic' ? (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#4f5e56]">원뿔형 위치</span>
          <div className="grid grid-cols-3 gap-2">
            <ConicGeometryInput
              label="시작각 (°)"
              max={360}
              min={0}
              placeholder="0"
              value={gradient.conicFromAngle}
              onChange={(value) => onConicGeometry('conicFromAngle', value)}
            />
            <ConicGeometryInput
              label="중심 X (%)"
              max={100}
              min={0}
              placeholder="50"
              value={gradient.conicCenterX}
              onChange={(value) => onConicGeometry('conicCenterX', value)}
            />
            <ConicGeometryInput
              label="중심 Y (%)"
              max={100}
              min={0}
              placeholder="50"
              value={gradient.conicCenterY}
              onChange={(value) => onConicGeometry('conicCenterY', value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ConicGeometryInput({
  label,
  max,
  min,
  placeholder,
  value,
  onChange,
}: {
  label: string
  max: number
  min: number
  placeholder: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  const fallbackValue = Math.max(min, Math.min(max, Number(placeholder)))
  const sliderValue = value ?? fallbackValue

  function updateValue(raw: string, allowEmpty: boolean) {
    if (raw === '') {
      if (allowEmpty) {
        onChange(undefined)
      }
      return
    }
    const next = Number(raw)
    if (Number.isNaN(next)) {
      return
    }
    onChange(Math.max(min, Math.min(max, next)))
  }

  return (
    <label className="block min-w-0">
      <span className="text-[11px] text-[#647067]">{label}</span>
      <input
        type="number"
        className="mt-1 h-9 w-full rounded-md border border-[#cbd6cf] bg-white px-2 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
        min={min}
        max={max}
        step={1}
        placeholder={placeholder}
        value={value === undefined ? '' : value}
        onChange={(event) => updateValue(event.target.value, true)}
      />
      <input
        type="range"
        className="mt-2 w-full accent-[#1b7f72]"
        min={min}
        max={max}
        step={1}
        value={sliderValue}
        aria-label={`${label} 슬라이더`}
        onChange={(event) => updateValue(event.target.value, false)}
      />
    </label>
  )
}

function TextContrastReadout({ contrast }: { contrast: TextContrastResult }) {
  return (
    <div className="mb-4 rounded-md border border-[#d7ddd2] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#4f5e56]">
          대비 ({contrast.isLargeText ? '큰 텍스트 기준' : '본문 기준'})
        </span>
        <span className="text-sm font-semibold tabular-nums text-[#26312b]">
          {contrast.ratio.toFixed(1)} : 1
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <ContrastBadge
          label={contrast.passesAA ? 'AA 통과' : 'AA 미달'}
          pass={contrast.passesAA}
        />
        <ContrastBadge
          label={contrast.passesAAA ? 'AAA 통과' : 'AAA 미달'}
          pass={contrast.passesAAA}
        />
      </div>
      {contrast.viaGradient ? (
        <p className="mt-2 text-xs text-[#647067]">
          그라디언트 또는 이미지 배경에서는 정확한 검사가 어렵습니다.
        </p>
      ) : null}
    </div>
  )
}

function ContrastBadge({ label, pass }: { label: string; pass: boolean }) {
  const className = pass
    ? 'border-[#1b7f72] bg-[#eef8f6] text-[#1b7f72]'
    : 'border-[#cbd6cf] bg-white text-[#647067]'
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
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

type TypographyPreset = {
  id: string
  label: string
  typography: Partial<Typography>
}

const TYPOGRAPHY_PRESETS = [
  {
    id: 'caption',
    label: '캡션',
    typography: { fontSize: 13, fontWeight: '400', lineHeight: 1.4, letterSpacing: 0 },
  },
  {
    id: 'body',
    label: '본문',
    typography: { fontSize: 16, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0 },
  },
  {
    id: 'subtitle',
    label: '소제목',
    typography: { fontSize: 18, fontWeight: '600', lineHeight: 1.4, letterSpacing: 0 },
  },
  {
    id: 'heading',
    label: '제목',
    typography: { fontSize: 24, fontWeight: '700', lineHeight: 1.3, letterSpacing: 0 },
  },
  {
    id: 'display',
    label: '큰 제목',
    typography: { fontSize: 36, fontWeight: '700', lineHeight: 1.2, letterSpacing: 0 },
  },
] as const satisfies readonly TypographyPreset[]

interface TypographyControlsProps {
  disclosure?: InspectorDisclosureControl
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
  disclosure,
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
      {...disclosure}
    >
      <div
        role="group"
        aria-label="타이포그래피 프리셋"
        className="flex flex-wrap gap-1.5 pb-3"
      >
        {TYPOGRAPHY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="rounded-full border border-[#cbd6cf] px-3 py-1 text-xs font-semibold text-[#26312b] transition hover:bg-[#eef8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72]"
            onClick={() =>
              onTypographyChange(node, preset.typography, {
                mergeKey: getNodeColorMergeKey(
                  node.id,
                  `typography.preset.${preset.id}`,
                ),
              })
            }
          >
            {preset.label}
          </button>
        ))}
      </div>
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
  disclosure?: InspectorDisclosureControl
  node: TreeNode
  onSpacingChange: (node: TreeNode, patch: Partial<Spacing>) => void
  onSpacingReset: (node: TreeNode) => void
}

interface LayoutControlsProps {
  disclosure?: InspectorDisclosureControl
  node: TreeNode
  onLayoutChange: (node: TreeNode, patch: Partial<NodeLayout>) => void
  onLayoutReset: (node: TreeNode) => void
  onSpacingChange: (node: TreeNode, patch: Partial<Spacing>) => void
}

function LayoutControls({
  disclosure,
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
      {...disclosure}
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
  disclosure,
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
      {...disclosure}
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
  disclosure?: InspectorDisclosureControl
  node: TreeNode
  onShapeChange: (
    node: TreeNode,
    patch: Partial<Shape>,
    options?: CommitTreeEditOptions,
  ) => void
  onShapeReset: (node: TreeNode) => void
}

function ShapeControls({
  disclosure,
  node,
  onShapeChange,
  onShapeReset,
}: ShapeControlsProps) {
  const shape = node.shape ?? EMPTY_SHAPE
  const radiusMode: ShapeRadiusMode = hasCornerRadiusOverride(shape)
    ? 'corners'
    : 'all'
  const [borderColorInput, setBorderColorInput] = useState(shape.borderColor ?? '')
  const [borderColorError, setBorderColorError] = useState(false)
  const activeCustomShadows = useMemo(
    () => getResolvedCustomShadowList(shape),
    [shape],
  )
  const customShadowColorSignature = activeCustomShadows
    .map((shadow) => shadow.color)
    .join('|')
  const shadowMode = hasShapeCustomShadow(shape) ? 'custom' : 'preset'
  const [customShadowColorInputs, setCustomShadowColorInputs] = useState(
    activeCustomShadows.map((shadow) => shadow.color),
  )
  const [customShadowColorErrors, setCustomShadowColorErrors] = useState<
    boolean[]
  >([])
  const isBorderDisabled = shape.borderStyle === 'none'

  useEffect(() => {
    setBorderColorInput(shape.borderColor ?? '')
    setBorderColorError(false)
  }, [node.id, shape.borderColor])

  useEffect(() => {
    setCustomShadowColorInputs(activeCustomShadows.map((shadow) => shadow.color))
    setCustomShadowColorErrors([])
  }, [activeCustomShadows, node.id, customShadowColorSignature])

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
      customShadows: undefined,
    })
  }

  function commitCustomShadowList(
    nextShadows: CustomShadow[],
    options?: CommitTreeEditOptions,
  ) {
    const normalizedShadows = nextShadows
      .slice(0, MAX_CUSTOM_SHADOWS)
      .map((shadow) => getResolvedCustomShadow(shadow))

    onShapeChange(
      node,
      {
        customShadow: undefined,
        customShadows:
          normalizedShadows.length > 0 ? normalizedShadows : undefined,
      },
      options,
    )
  }

  function updateCustomShadowAt(
    index: number,
    patch: Partial<CustomShadow>,
    options?: CommitTreeEditOptions,
  ) {
    const shadows = getResolvedCustomShadowList(shape)
    const target = shadows[index] ?? DEFAULT_CUSTOM_SHADOW
    const nextShadow = getCustomShadowWithPatch(target, patch)

    if (shape.customShadows !== undefined) {
      const nextShadows = shadows.map((shadow, shadowIndex) =>
        shadowIndex === index ? nextShadow : shadow,
      )
      commitCustomShadowList(nextShadows, options)
      return
    }

    onShapeChange(
      node,
      {
        customShadow: nextShadow,
        customShadows: undefined,
      },
      options,
    )
  }

  function addCustomShadow() {
    if (activeCustomShadows.length >= MAX_CUSTOM_SHADOWS) {
      return
    }

    commitCustomShadowList([...activeCustomShadows, DEFAULT_CUSTOM_SHADOW])
  }

  function deleteCustomShadow(index: number) {
    commitCustomShadowList(
      activeCustomShadows.filter((_, shadowIndex) => shadowIndex !== index),
    )
  }

  function moveCustomShadow(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= activeCustomShadows.length) {
      return
    }

    const nextShadows = [...activeCustomShadows]
    const current = nextShadows[index]
    const target = nextShadows[nextIndex]
    if (!current || !target) {
      return
    }
    nextShadows[index] = target
    nextShadows[nextIndex] = current
    commitCustomShadowList(nextShadows)
  }

  function updateCustomShadowNumber(
    index: number,
    field: CustomShadowNumberField,
    value: string,
    min: number,
    max: number,
  ) {
    const nextValue = parseOptionalNumber(value, min, max)
    if (nextValue === undefined) {
      return
    }

    updateCustomShadowAt(
      index,
      { [field]: nextValue } as Partial<CustomShadow>,
      { mergeKey: getNodeColorMergeKey(node.id, `customShadow.${index}.${field}`) },
    )
  }

  function setCustomShadowColorInputAt(index: number, value: string) {
    setCustomShadowColorInputs((currentInputs) => {
      const nextInputs = [...currentInputs]
      nextInputs[index] = value
      return nextInputs
    })
  }

  function setCustomShadowColorErrorAt(index: number, value: boolean) {
    setCustomShadowColorErrors((currentErrors) => {
      const nextErrors = [...currentErrors]
      nextErrors[index] = value
      return nextErrors
    })
  }

  function updateCustomShadowColorFromText(index: number, value: string) {
    const trimmedValue = value.trim()
    setCustomShadowColorInputAt(index, value)

    if (trimmedValue === '') {
      setCustomShadowColorErrorAt(index, false)
      return
    }

    if (!isValidHexColor(trimmedValue)) {
      setCustomShadowColorErrorAt(index, true)
      return
    }

    const normalizedValue = normalizeHexColor(trimmedValue)
    setCustomShadowColorInputAt(index, normalizedValue)
    setCustomShadowColorErrorAt(index, false)
    updateCustomShadowAt(index, { color: normalizedValue })
  }

  function updateCustomShadowColorFromPicker(index: number, value: string) {
    const normalizedValue = normalizeHexColor(value)
    setCustomShadowColorInputAt(index, normalizedValue)
    setCustomShadowColorErrorAt(index, false)
    updateCustomShadowAt(
      index,
      { color: normalizedValue },
      { mergeKey: getNodeColorMergeKey(node.id, `customShadow.${index}.color`) },
    )
  }

  function updateCustomShadowOpacity(index: number, value: string) {
    updateCustomShadowAt(
      index,
      { opacity: parseOptionalOpacity(value) },
      { mergeKey: getNodeColorMergeKey(node.id, `customShadow.${index}.opacity`) },
    )
  }

  function updateCustomShadowInset(index: number, next: boolean) {
    updateCustomShadowAt(
      index,
      { inset: next ? true : undefined },
      { mergeKey: getNodeColorMergeKey(node.id, `customShadow.${index}.inset`) },
    )
  }

  return (
    <InspectorDisclosure
      title="모양"
      description="선택한 노드의 테두리와 그림자"
      defaultOpen={false}
      onAction={() => onShapeReset(node)}
      {...disclosure}
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#4f5e56]">
                  레이어 {activeCustomShadows.length}/{MAX_CUSTOM_SHADOWS}
                </span>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-[#c9d4cd] bg-white px-2 text-xs font-semibold text-[#26312b] transition hover:bg-[#eef3ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                  disabled={activeCustomShadows.length >= MAX_CUSTOM_SHADOWS}
                  onClick={addCustomShadow}
                >
                  <Plus aria-hidden="true" size={14} />
                  추가
                </button>
              </div>

              {activeCustomShadows.map((customShadow, index) => {
                const colorInput =
                  customShadowColorInputs[index] ?? customShadow.color
                const hasColorError = customShadowColorErrors[index] ?? false

                return (
                  <div
                    key={`${node.id}-custom-shadow-${index}`}
                    className="rounded-md border border-[#d7ddd2] bg-white p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#4f5e56]">
                        그림자 {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`그림자 ${index + 1} 위로 이동`}
                          title="위로 이동"
                          className="flex h-7 w-7 items-center justify-center rounded border border-[#c9d4cd] bg-white text-[#4f5e56] transition hover:bg-[#eef3ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                          disabled={index === 0}
                          onClick={() => moveCustomShadow(index, -1)}
                        >
                          <ArrowUp aria-hidden="true" size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`그림자 ${index + 1} 아래로 이동`}
                          title="아래로 이동"
                          className="flex h-7 w-7 items-center justify-center rounded border border-[#c9d4cd] bg-white text-[#4f5e56] transition hover:bg-[#eef3ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                          disabled={index === activeCustomShadows.length - 1}
                          onClick={() => moveCustomShadow(index, 1)}
                        >
                          <ArrowDown aria-hidden="true" size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`그림자 ${index + 1} 삭제`}
                          title="삭제"
                          className="flex h-7 w-7 items-center justify-center rounded border border-[#c9d4cd] bg-white text-[#7a3b31] transition hover:bg-[#fff1ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72]"
                          onClick={() => deleteCustomShadow(index)}
                        >
                          <Trash2 aria-hidden="true" size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <TypographyNumberField
                        label="가로 위치"
                        unit="px"
                        min={-100}
                        max={100}
                        step={1}
                        value={customShadow.offsetX}
                        placeholder="0"
                        onChange={(value) =>
                          updateCustomShadowNumber(
                            index,
                            'offsetX',
                            value,
                            -100,
                            100,
                          )
                        }
                      />
                      <TypographyNumberField
                        label="세로 위치"
                        unit="px"
                        min={-100}
                        max={100}
                        step={1}
                        value={customShadow.offsetY}
                        placeholder="4"
                        onChange={(value) =>
                          updateCustomShadowNumber(
                            index,
                            'offsetY',
                            value,
                            -100,
                            100,
                          )
                        }
                      />
                      <TypographyNumberField
                        label="흐림"
                        unit="px"
                        min={0}
                        max={200}
                        step={1}
                        value={customShadow.blur}
                        placeholder="12"
                        onChange={(value) =>
                          updateCustomShadowNumber(index, 'blur', value, 0, 200)
                        }
                      />
                      <TypographyNumberField
                        label="확장"
                        unit="px"
                        min={-100}
                        max={100}
                        step={1}
                        value={customShadow.spread ?? 0}
                        placeholder="0"
                        onChange={(value) =>
                          updateCustomShadowNumber(
                            index,
                            'spread',
                            value,
                            -100,
                            100,
                          )
                        }
                      />
                      <label className="block">
                        <span className="text-xs font-semibold text-[#4f5e56]">
                          색상
                        </span>
                        <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cbd6cf] bg-white px-2 focus-within:border-[#1b7f72] focus-within:ring-2 focus-within:ring-[#1b7f72]/20">
                          <input
                            className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                            value={colorInput}
                            placeholder="#RRGGBB"
                            aria-invalid={hasColorError}
                            spellCheck={false}
                            onChange={(event) =>
                              updateCustomShadowColorFromText(
                                index,
                                event.target.value,
                              )
                            }
                          />
                          <input
                            type="color"
                            aria-label={`그림자 ${index + 1} 색상 선택`}
                            className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#d7ddd2] bg-white p-0"
                            value={toColorInputValue(
                              colorInput,
                              DEFAULT_CUSTOM_SHADOW.color,
                            )}
                            onChange={(event) =>
                              updateCustomShadowColorFromPicker(
                                index,
                                event.target.value,
                              )
                            }
                          />
                        </span>
                        {hasColorError ? (
                          <span className="mt-2 block text-xs text-[#b42318]">
                            HEX 형식 (#RRGGBB)으로 입력해주세요.
                          </span>
                        ) : null}
                      </label>
                      <OpacityControl
                        label="투명도"
                        value={customShadow.opacity}
                        onChange={(value) =>
                          updateCustomShadowOpacity(index, value)
                        }
                      />
                    </div>

                    <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#4f5e56]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-[#1b7f72]"
                        checked={customShadow.inset === true}
                        onChange={(event) =>
                          updateCustomShadowInset(index, event.target.checked)
                        }
                      />
                      안쪽 그림자
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </InspectorDisclosure>
  )
}

interface ImageCompositionControlsProps {
  disclosure?: InspectorDisclosureControl
  node: ImageNode
  onImageChange: (
    node: ImageNode,
    patch: ImageEditPatch,
    options?: CommitTreeEditOptions,
  ) => void
}

function ImageCompositionControls({
  disclosure,
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

  function updateOverlayGradientConicGeometry(
    field: GradientConicField,
    value: number | undefined,
  ) {
    onImageChange(
      node,
      {
        presentation: {
          overlayColor: undefined,
          overlayOpacity: undefined,
          overlayGradient: getGradientWithPatch(overlayGradient, {
            [field]: value,
          }),
        },
      },
      { mergeKey: getNodeColorMergeKey(node.id, `overlayGradient.${field}`) },
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

  function updateImageFilterField(
    field: 'blur' | 'grayscale' | 'sepia' | 'brightness' | 'contrast' | 'hueRotate' | 'saturate' | 'invert',
    value: number | undefined,
  ) {
    const currentFilter = presentation.filter ?? {}
    const nextFilter: ImageFilter = { ...currentFilter }
    if (value === undefined) {
      delete nextFilter[field]
    } else {
      nextFilter[field] = value
    }
    const isEmpty = Object.keys(nextFilter).length === 0
    onImageChange(
      node,
      {
        presentation: {
          filter: isEmpty ? undefined : nextFilter,
        },
      },
      { mergeKey: getNodeColorMergeKey(node.id, `imageFilter.${field}`) },
    )
  }

  function updateImageDropShadowField<K extends keyof ImageDropShadow>(
    field: K,
    value: ImageDropShadow[K],
  ) {
    const currentFilter = presentation.filter ?? {}
    const currentDropShadow =
      currentFilter.dropShadow ?? IMAGE_DROP_SHADOW_DEFAULT
    const nextDropShadow: ImageDropShadow = {
      ...currentDropShadow,
      [field]: value,
    }
    const nextFilter: ImageFilter = {
      ...currentFilter,
      dropShadow: nextDropShadow,
    }
    onImageChange(
      node,
      { presentation: { filter: nextFilter } },
      {
        mergeKey: getNodeColorMergeKey(
          node.id,
          `imageFilter.dropShadow.${field}`,
        ),
      },
    )
  }

  function toggleImageDropShadow(enabled: boolean) {
    const currentFilter = presentation.filter ?? {}
    const nextFilter: ImageFilter = { ...currentFilter }
    if (enabled) {
      nextFilter.dropShadow = IMAGE_DROP_SHADOW_DEFAULT
    } else {
      delete nextFilter.dropShadow
      delete nextFilter.dropShadows
    }
    const isEmpty = Object.keys(nextFilter).length === 0
    onImageChange(
      node,
      {
        presentation: {
          filter: isEmpty ? undefined : nextFilter,
        },
      },
      {
        mergeKey: getNodeColorMergeKey(
          node.id,
          'imageFilter.dropShadow.toggle',
        ),
      },
    )
  }

  function getCurrentDropShadows(): ImageDropShadow[] {
    return presentation.filter?.dropShadows ?? []
  }

  function commitDropShadows(nextDropShadows: ImageDropShadow[], mergeKey: string) {
    const currentFilter = presentation.filter ?? {}
    const nextFilter: ImageFilter = { ...currentFilter }
    if (nextDropShadows.length === 0) {
      delete nextFilter.dropShadows
    } else {
      nextFilter.dropShadows = nextDropShadows
    }
    onImageChange(
      node,
      { presentation: { filter: nextFilter } },
      { mergeKey: getNodeColorMergeKey(node.id, mergeKey) },
    )
  }

  function addImageDropShadowExtra() {
    const current = getCurrentDropShadows()
    if (current.length >= 2) return
    commitDropShadows(
      [...current, IMAGE_DROP_SHADOW_DEFAULT],
      'imageFilter.dropShadows.add',
    )
  }

  function removeImageDropShadowExtra(index: number) {
    const current = getCurrentDropShadows()
    const next = current.filter((_, i) => i !== index)
    commitDropShadows(next, `imageFilter.dropShadows.remove.${index}`)
  }

  function moveImageDropShadowExtra(index: number, dir: -1 | 1) {
    const current = getCurrentDropShadows()
    const target = index + dir
    if (target < 0 || target >= current.length) return
    const item = current[index]
    if (item === undefined) return
    const next = current.filter((_, i) => i !== index)
    next.splice(target, 0, item)
    commitDropShadows(next, `imageFilter.dropShadows.move.${index}.${dir}`)
  }

  function updateImageDropShadowExtraField<K extends keyof ImageDropShadow>(
    index: number,
    field: K,
    value: ImageDropShadow[K],
  ) {
    const current = getCurrentDropShadows()
    if (index < 0 || index >= current.length) return
    const next = current.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry,
    )
    commitDropShadows(next, `imageFilter.dropShadows.${index}.${field}`)
  }

  return (
    <InspectorDisclosure
      title="이미지 구도"
      description="비율, 초점, 오버레이"
      onAction={resetImageComposition}
      {...disclosure}
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
            onConicGeometry={updateOverlayGradientConicGeometry}
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

      <div className="mt-4 rounded-md border border-[#e0e5de] bg-white p-3">
        <span className="text-xs font-semibold text-[#4f5e56]">필터</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ImageFilterInput
            label="블러 (px)"
            min={0}
            max={20}
            placeholder="0"
            value={presentation.filter?.blur}
            onChange={(value) => updateImageFilterField('blur', value)}
          />
          <ImageFilterInput
            label="흑백 (%)"
            min={0}
            max={100}
            placeholder="0"
            value={presentation.filter?.grayscale}
            onChange={(value) => updateImageFilterField('grayscale', value)}
          />
          <ImageFilterInput
            label="세피아 (%)"
            min={0}
            max={100}
            placeholder="0"
            value={presentation.filter?.sepia}
            onChange={(value) => updateImageFilterField('sepia', value)}
          />
          <ImageFilterInput
            label="밝기 (%)"
            min={50}
            max={150}
            placeholder="100"
            value={presentation.filter?.brightness}
            onChange={(value) => updateImageFilterField('brightness', value)}
          />
          <ImageFilterInput
            label="대비 (%)"
            min={50}
            max={150}
            placeholder="100"
            value={presentation.filter?.contrast}
            onChange={(value) => updateImageFilterField('contrast', value)}
          />
          <ImageFilterInput
            label="색상 회전 (°)"
            min={0}
            max={360}
            placeholder="0"
            value={presentation.filter?.hueRotate}
            onChange={(value) => updateImageFilterField('hueRotate', value)}
          />
          <ImageFilterInput
            label="채도 (%)"
            min={0}
            max={200}
            placeholder="100"
            value={presentation.filter?.saturate}
            onChange={(value) => updateImageFilterField('saturate', value)}
          />
          <ImageFilterInput
            label="반전 (%)"
            min={0}
            max={100}
            placeholder="0"
            value={presentation.filter?.invert}
            onChange={(value) => updateImageFilterField('invert', value)}
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#4f5e56]">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-[#1b7f72]"
            checked={presentation.filter?.dropShadow !== undefined}
            onChange={(event) => toggleImageDropShadow(event.target.checked)}
          />
          그림자
        </label>
        {presentation.filter?.dropShadow !== undefined ? (
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-dashed border-[#cbd6cf] bg-[#f8faf9] p-3">
            <ImageFilterInput
              label="X 오프셋 (px)"
              min={-50}
              max={50}
              placeholder="0"
              value={presentation.filter.dropShadow.offsetX}
              onChange={(value) =>
                updateImageDropShadowField(
                  'offsetX',
                  value === undefined ? 0 : value,
                )
              }
            />
            <ImageFilterInput
              label="Y 오프셋 (px)"
              min={-50}
              max={50}
              placeholder="4"
              value={presentation.filter.dropShadow.offsetY}
              onChange={(value) =>
                updateImageDropShadowField(
                  'offsetY',
                  value === undefined ? 0 : value,
                )
              }
            />
            <ImageFilterInput
              label="흐림 (px)"
              min={0}
              max={50}
              placeholder="6"
              value={presentation.filter.dropShadow.blur}
              onChange={(value) =>
                updateImageDropShadowField(
                  'blur',
                  value === undefined ? 0 : value,
                )
              }
            />
            <label className="block">
              <span className="text-[11px] text-[#647067]">색상</span>
              <input
                type="color"
                aria-label="그림자 색상"
                className="mt-1 h-9 w-full cursor-pointer rounded-md border border-[#cbd6cf] bg-white p-0.5"
                value={presentation.filter.dropShadow.color}
                onChange={(event) =>
                  updateImageDropShadowField('color', event.target.value)
                }
              />
            </label>
          </div>
        ) : null}
        {presentation.filter?.dropShadow !== undefined ? (
          <div className="mt-2 space-y-2">
            {(presentation.filter?.dropShadows ?? []).map((extra, index) => (
              <div
                key={index}
                className="rounded-md border border-[#e0e5de] bg-white p-2"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#4f5e56]">
                    추가 그림자 {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`추가 그림자 ${index + 1} 위로`}
                      title="위로"
                      disabled={index === 0}
                      className="h-6 w-6 rounded border border-[#cbd6cf] text-xs text-[#4f5e56] disabled:opacity-40"
                      onClick={() => moveImageDropShadowExtra(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`추가 그림자 ${index + 1} 아래로`}
                      title="아래로"
                      disabled={
                        index >= (presentation.filter?.dropShadows ?? []).length - 1
                      }
                      className="h-6 w-6 rounded border border-[#cbd6cf] text-xs text-[#4f5e56] disabled:opacity-40"
                      onClick={() => moveImageDropShadowExtra(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={`추가 그림자 ${index + 1} 삭제`}
                      title="삭제"
                      className="h-6 w-6 rounded border border-[#f0c4c4] text-xs text-[#9b3030]"
                      onClick={() => removeImageDropShadowExtra(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ImageFilterInput
                    label="X 오프셋 (px)"
                    min={-50}
                    max={50}
                    placeholder="0"
                    value={extra.offsetX}
                    onChange={(value) =>
                      updateImageDropShadowExtraField(
                        index,
                        'offsetX',
                        value === undefined ? 0 : value,
                      )
                    }
                  />
                  <ImageFilterInput
                    label="Y 오프셋 (px)"
                    min={-50}
                    max={50}
                    placeholder="4"
                    value={extra.offsetY}
                    onChange={(value) =>
                      updateImageDropShadowExtraField(
                        index,
                        'offsetY',
                        value === undefined ? 0 : value,
                      )
                    }
                  />
                  <ImageFilterInput
                    label="흐림 (px)"
                    min={0}
                    max={50}
                    placeholder="6"
                    value={extra.blur}
                    onChange={(value) =>
                      updateImageDropShadowExtraField(
                        index,
                        'blur',
                        value === undefined ? 0 : value,
                      )
                    }
                  />
                  <label className="block">
                    <span className="text-[11px] text-[#647067]">색상</span>
                    <input
                      type="color"
                      aria-label={`추가 그림자 ${index + 1} 색상`}
                      className="mt-1 h-9 w-full cursor-pointer rounded-md border border-[#cbd6cf] bg-white p-0.5"
                      value={extra.color}
                      onChange={(event) =>
                        updateImageDropShadowExtraField(
                          index,
                          'color',
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              disabled={(presentation.filter?.dropShadows ?? []).length >= 2}
              className="w-full rounded-md border border-dashed border-[#cbd6cf] py-2 text-xs font-semibold text-[#4f5e56] hover:bg-[#f1f5f3] disabled:opacity-40"
              onClick={addImageDropShadowExtra}
            >
              + 그림자 추가
            </button>
          </div>
        ) : null}
      </div>
    </InspectorDisclosure>
  )
}

function ImageFilterInput({
  label,
  max,
  min,
  placeholder,
  value,
  onChange,
}: {
  label: string
  max: number
  min: number
  placeholder: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-[#647067]">{label}</span>
      <input
        type="number"
        className="mt-1 h-9 w-full rounded-md border border-[#cbd6cf] bg-white px-2 text-sm outline-none focus:border-[#1b7f72] focus:ring-2 focus:ring-[#1b7f72]/20"
        min={min}
        max={max}
        placeholder={placeholder}
        value={value === undefined ? '' : value}
        onChange={(event) => {
          const raw = event.target.value
          if (raw === '') {
            onChange(undefined)
            return
          }
          const next = Number(raw)
          if (Number.isNaN(next)) {
            return
          }
          onChange(Math.max(min, Math.min(max, next)))
        }}
      />
    </label>
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
  disclosure?: InspectorDisclosureControl
  info: StructureInfo
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function StructureControls({
  disclosure,
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
      {...disclosure}
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
    ...(gradient?.conicFromAngle !== undefined
      ? { conicFromAngle: gradient.conicFromAngle }
      : {}),
    ...(gradient?.conicCenterX !== undefined
      ? { conicCenterX: gradient.conicCenterX }
      : {}),
    ...(gradient?.conicCenterY !== undefined
      ? { conicCenterY: gradient.conicCenterY }
      : {}),
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

  if (next.conicFromAngle === undefined) {
    delete next.conicFromAngle
  }

  if (next.conicCenterX === undefined) {
    delete next.conicCenterX
  }

  if (next.conicCenterY === undefined) {
    delete next.conicCenterY
  }

  return next
}

function gradientToCss(gradient: Gradient): string {
  const from = getCssColorWithOpacity(gradient.from, gradient.fromOpacity)
  const to = getCssColorWithOpacity(gradient.to, gradient.toOpacity)

  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${from}, ${to})`
  }

  if (gradient.type === 'conic') {
    const angle = gradient.conicFromAngle ?? 0
    const x = gradient.conicCenterX ?? 50
    const y = gradient.conicCenterY ?? 50
    return `conic-gradient(from ${angle}deg at ${x}% ${y}%, ${from}, ${to})`
  }

  return `linear-gradient(${GRADIENT_DIRECTION_CSS[gradient.direction]}, ${from}, ${to})`
}

function customShadowToCss(shadow: CustomShadow): string {
  const parts = [
    `${shadow.offsetX}px`,
    `${shadow.offsetY}px`,
    `${shadow.blur}px`,
    `${shadow.spread ?? 0}px`,
    getCssColorWithOpacity(shadow.color, shadow.opacity),
  ]
  return shadow.inset === true ? `inset ${parts.join(' ')}` : parts.join(' ')
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

function hasShapeCustomShadow(shape: Partial<Shape>): boolean {
  return (
    shape.customShadow !== undefined ||
    (shape.customShadows !== undefined && shape.customShadows.length > 0)
  )
}

function getResolvedCustomShadowList(shape: Partial<Shape>): CustomShadow[] {
  if (shape.customShadows !== undefined && shape.customShadows.length > 0) {
    return shape.customShadows
      .slice(0, MAX_CUSTOM_SHADOWS)
      .map((shadow) => getResolvedCustomShadow(shadow))
  }

  if (shape.customShadow !== undefined) {
    return [getResolvedCustomShadow(shape.customShadow)]
  }

  return [DEFAULT_CUSTOM_SHADOW]
}

function getCustomShadowWithPatch(
  shadow: CustomShadow,
  patch: Partial<CustomShadow>,
): CustomShadow {
  const hasOpacityPatch = Object.prototype.hasOwnProperty.call(patch, 'opacity')
  const hasInsetPatch = Object.prototype.hasOwnProperty.call(patch, 'inset')

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
    ...(!hasInsetPatch && shadow.inset !== undefined
      ? { inset: shadow.inset }
      : patch.inset !== undefined
        ? { inset: patch.inset }
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

function computeInspectorSmartDefaults(
  nodeType: TreeNode['type'],
  isContainer: boolean,
): Record<string, boolean> {
  if (nodeType === 'text') {
    return { 내용: true, 타이포그래피: true }
  }
  if (nodeType === 'image') {
    return { 이미지: true }
  }
  if (nodeType === 'button') {
    return { 내용: true }
  }
  if (isContainer) {
    return { 레이아웃: true }
  }
  return {}
}

const COMMON_INSPECTOR_CONTROLLED_SECTIONS = [
  '표시',
  '색상',
  '레이아웃',
  '간격',
  '모양',
  '구조',
] as const

function getVisibleControlledSectionTitles(
  nodeType: TreeNode['type'],
): string[] {
  const sections: string[] = [...COMMON_INSPECTOR_CONTROLLED_SECTIONS]
  if (nodeType === 'text') {
    sections.push('내용', '타이포그래피')
  }
  if (nodeType === 'button') {
    sections.push('내용')
  }
  if (nodeType === 'image') {
    sections.push('이미지', '이미지 구도')
  }
  return sections
}

type RGB = { r: number; g: number; b: number }

function parseHexColor(hex: string): RGB | null {
  if (typeof hex !== 'string') {
    return null
  }
  const cleaned = hex.trim().replace(/^#/, '')
  if (cleaned.length === 3) {
    const r = Number.parseInt(cleaned.slice(0, 1).repeat(2), 16)
    const g = Number.parseInt(cleaned.slice(1, 2).repeat(2), 16)
    const b = Number.parseInt(cleaned.slice(2, 3).repeat(2), 16)
    if ([r, g, b].some((c) => Number.isNaN(c))) {
      return null
    }
    return { r, g, b }
  }
  if (cleaned.length === 6) {
    const r = Number.parseInt(cleaned.slice(0, 2), 16)
    const g = Number.parseInt(cleaned.slice(2, 4), 16)
    const b = Number.parseInt(cleaned.slice(4, 6), 16)
    if ([r, g, b].some((c) => Number.isNaN(c))) {
      return null
    }
    return { r, g, b }
  }
  return null
}

function srgbChannelToLinear(channel: number): number {
  const v = channel / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function relativeLuminance({ r, g, b }: RGB): number {
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  )
}

function contrastRatio(c1: RGB, c2: RGB): number {
  const L1 = relativeLuminance(c1)
  const L2 = relativeLuminance(c2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

function blendOver(fg: RGB, fgAlpha: number, bg: RGB): RGB {
  const a = Math.max(0, Math.min(1, fgAlpha))
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  }
}

function clampOpacity(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) {
    return 1
  }
  return Math.max(0, Math.min(1, value))
}

function getAncestorChain(tree: Tree, nodeId: string): string[] {
  const chain: string[] = []
  let currentId: string | undefined = nodeId
  while (currentId) {
    const info = getStructureInfo(tree, currentId)
    if (info.isRoot || info.parentId === undefined) {
      break
    }
    chain.push(info.parentId)
    currentId = info.parentId
  }
  return chain
}

function resolveBackgroundColor(
  tree: Tree,
  nodeId: string,
  colorPreset: ColorPreset,
): { color: RGB; viaGradient: boolean } {
  let viaGradient = false
  const visit = [nodeId, ...getAncestorChain(tree, nodeId)]

  for (let i = 0; i < visit.length; i++) {
    const id = visit[i]
    if (id === undefined) {
      continue
    }
    const node = findNode(tree.root, id)
    if (!node) {
      continue
    }
    const color = node.color
    if (color?.backgroundGradient !== undefined) {
      viaGradient = true
    }
    if (color?.backgroundColor !== undefined) {
      const parsed = parseHexColor(color.backgroundColor)
      if (parsed === null) {
        continue
      }
      const alpha = clampOpacity(color.backgroundOpacity)
      if (alpha >= 1) {
        return { color: parsed, viaGradient }
      }
      // Background has opacity — blend with parent's effective bg (or canvas surface)
      const restChain = visit.slice(i + 1)
      const parentBg = resolveBackgroundFromChain(tree, restChain, colorPreset)
      return {
        color: blendOver(parsed, alpha, parentBg.color),
        viaGradient: viaGradient || parentBg.viaGradient,
      }
    }
  }

  const surface = parseHexColor(COLOR_PRESETS[colorPreset].surface) ?? {
    r: 255,
    g: 255,
    b: 255,
  }
  return { color: surface, viaGradient }
}

function resolveBackgroundFromChain(
  tree: Tree,
  chain: string[],
  colorPreset: ColorPreset,
): { color: RGB; viaGradient: boolean } {
  let viaGradient = false
  for (let i = 0; i < chain.length; i++) {
    const id = chain[i]
    if (id === undefined) {
      continue
    }
    const node = findNode(tree.root, id)
    if (!node) {
      continue
    }
    const color = node.color
    if (color?.backgroundGradient !== undefined) {
      viaGradient = true
    }
    if (color?.backgroundColor !== undefined) {
      const parsed = parseHexColor(color.backgroundColor)
      if (parsed === null) {
        continue
      }
      const alpha = clampOpacity(color.backgroundOpacity)
      if (alpha >= 1) {
        return { color: parsed, viaGradient }
      }
      const restChain = chain.slice(i + 1)
      const parentBg = resolveBackgroundFromChain(tree, restChain, colorPreset)
      return {
        color: blendOver(parsed, alpha, parentBg.color),
        viaGradient: viaGradient || parentBg.viaGradient,
      }
    }
  }
  const surface = parseHexColor(COLOR_PRESETS[colorPreset].surface) ?? {
    r: 255,
    g: 255,
    b: 255,
  }
  return { color: surface, viaGradient }
}

function resolveTextColor(
  tree: Tree,
  nodeId: string,
  colorPreset: ColorPreset,
): { color: RGB; alpha: number } {
  const visit = [nodeId, ...getAncestorChain(tree, nodeId)]
  for (const id of visit) {
    const node = findNode(tree.root, id)
    if (!node) {
      continue
    }
    if (node.color?.textColor !== undefined) {
      const parsed = parseHexColor(node.color.textColor)
      if (parsed !== null) {
        return { color: parsed, alpha: clampOpacity(node.color.textOpacity) }
      }
    }
  }
  const fallback = parseHexColor(COLOR_PRESETS[colorPreset].textPrimary) ?? {
    r: 0,
    g: 0,
    b: 0,
  }
  return { color: fallback, alpha: 1 }
}

interface TextContrastResult {
  ratio: number
  passesAA: boolean
  passesAAA: boolean
  viaGradient: boolean
  isLargeText: boolean
  aaThreshold: number
  aaaThreshold: number
}

function isLargeTextTypography(
  typography: Partial<Typography> | undefined,
  defaults: Typography,
): boolean {
  const fontSize = typography?.fontSize ?? defaults.fontSize ?? 16
  const rawWeight = typography?.fontWeight ?? defaults.fontWeight
  const weight = rawWeight !== undefined ? Number(rawWeight) : NaN
  if (fontSize >= 24) {
    return true
  }
  if (Number.isFinite(weight) && weight >= 700 && fontSize >= 19) {
    return true
  }
  return false
}

function computeTextContrast(
  tree: Tree,
  node: TreeNode,
  colorPreset: ColorPreset,
): TextContrastResult | null {
  if (node.type !== 'text') {
    return null
  }
  const text = resolveTextColor(tree, node.id, colorPreset)
  const bg = resolveBackgroundColor(tree, node.id, colorPreset)
  const textOnBg =
    text.alpha < 1 ? blendOver(text.color, text.alpha, bg.color) : text.color
  const nodeAlpha = clampOpacity(node.opacity)
  const finalText =
    nodeAlpha < 1 ? blendOver(textOnBg, nodeAlpha, bg.color) : textOnBg
  const ratio = contrastRatio(finalText, bg.color)
  const isLargeText = isLargeTextTypography(node.typography, getTypographyDefaults(node))
  const aaThreshold = isLargeText ? 3.0 : 4.5
  const aaaThreshold = isLargeText ? 4.5 : 7.0
  return {
    ratio,
    passesAA: ratio >= aaThreshold,
    passesAAA: ratio >= aaaThreshold,
    viaGradient: bg.viaGradient,
    isLargeText,
    aaThreshold,
    aaaThreshold,
  }
}

interface ContrastAuditSummary {
  total: number
  passesAA: number
  passesAAA: number
}

function computeContrastAuditSummary(
  tree: Tree,
  colorPreset: ColorPreset,
): ContrastAuditSummary {
  const summary: ContrastAuditSummary = {
    total: 0,
    passesAA: 0,
    passesAAA: 0,
  }
  collectTextNodes(tree.root).forEach((textNode) => {
    const result = computeTextContrast(tree, textNode, colorPreset)
    if (result === null) {
      return
    }
    summary.total += 1
    if (result.passesAA) {
      summary.passesAA += 1
    }
    if (result.passesAAA) {
      summary.passesAAA += 1
    }
  })
  return summary
}

function collectTextNodes(node: TreeNode): TextNode[] {
  const result: TextNode[] = []
  if (node.type === 'text') {
    result.push(node)
  }
  if (isContainerNode(node)) {
    node.children.forEach((child) => {
      result.push(...collectTextNodes(child))
    })
  }
  return result
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

interface VariantCompareGridProps {
  generations: GenerationEntry[]
  activeGenerationId: string
  viewportWidth: number
  canvasStyle: CSSProperties
  disabled: boolean
  onSelect: (id: string) => void
}

function VariantCompareGrid({
  generations,
  activeGenerationId,
  viewportWidth,
  canvasStyle,
  disabled,
  onSelect,
}: VariantCompareGridProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {generations.map((entry, index) => (
        <MiniGenerationCanvas
          key={entry.id}
          entry={entry}
          fallbackLabel={entry.immutable ? '원본' : `변형 ${index}`}
          isActive={entry.id === activeGenerationId}
          viewportWidth={viewportWidth}
          canvasStyle={canvasStyle}
          disabled={disabled}
          onSelect={() => onSelect(entry.id)}
        />
      ))}
    </div>
  )
}

interface MiniGenerationCanvasProps {
  entry: GenerationEntry
  fallbackLabel: string
  isActive: boolean
  viewportWidth: number
  canvasStyle: CSSProperties
  disabled: boolean
  onSelect: () => void
}

const MINI_CELL_WIDTH = 320
const MINI_CELL_HEIGHT = 220

function MiniGenerationCanvas({
  entry,
  fallbackLabel,
  isActive,
  viewportWidth,
  canvasStyle,
  disabled,
  onSelect,
}: MiniGenerationCanvasProps) {
  const scale = MINI_CELL_WIDTH / viewportWidth
  const label = entry.label.length > 0 ? entry.label : fallbackLabel
  const intentText = entry.brief?.intent ?? '원본 fixture'

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect()
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${label} 선택하여 편집`}
      aria-current={isActive ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onSelect()
      }}
      onKeyDown={handleKeyDown}
      className={`group flex flex-col overflow-hidden rounded-lg border bg-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b7f72] ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${
        isActive
          ? 'border-[#1b7f72] shadow-[0_0_0_3px_rgba(27,127,114,0.22)]'
          : 'border-[#cbd6cf] hover:border-[#1b7f72]'
      }`}
      style={{ width: MINI_CELL_WIDTH }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#e0e5de] px-3 py-2">
        <span className="text-xs font-semibold text-[#18211d]">{label}</span>
        <span className="truncate text-[10px] text-[#647067]" title={intentText}>
          {intentText}
        </span>
      </div>
      <div
        className="relative overflow-hidden bg-[var(--dw-surface)]"
        style={{ width: MINI_CELL_WIDTH, height: MINI_CELL_HEIGHT }}
      >
        <div
          style={{
            ...canvasStyle,
            width: viewportWidth,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <CanvasReadOnlyContext.Provider value={true}>
            <CanvasNode
              node={entry.tree.root}
              selectedNodeId=""
              onSelect={() => {}}
            />
          </CanvasReadOnlyContext.Provider>
        </div>
      </div>
    </div>
  )
}
