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
  AlertTriangle,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Columns2,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  FormInput,
  Lock,
  Unlock,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MousePointer,
  Move,
  PanelLeft,
  PanelRight,
  PanelTop,
  Pin,
  Plus,
  Redo2,
  Rows2,
  Square,
  SquareStack,
  StretchHorizontal,
  Type,
  Menu,
  StretchVertical,
  Trash2,
  Undo2,
  WrapText,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  COLOR_PRESETS,
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
  type NodeTransform,
  type NodeTransition,
  type NodeTransitionTiming,
  type TransitionCubicBezier,
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
  addContainerChild,
  addContainerSibling,
  addLeafChild,
  addLeafSibling,
  type ContainerNodeType,
  changeContainerNodeType,
  changeLeafNodeType,
  deleteNode,
  duplicateNode,
  type LeafNodeType,
  moveNode,
  type NodeMetaPatch,
  updateColor,
  updateButtonLabel,
  updateImage,
  updateLayout,
  updateNodeMeta,
  updateShape,
  updateSpacing,
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
import {
  readPersistedGenerationState,
  writePersistedGenerationState,
} from './generation-storage'
import {
  buildExportFilename,
  buildExportPayload,
  parseImportPayload,
} from './generation-export'
import {
  createUserFixtureId,
  readUserFixtures,
  sanitizeUserFixtureName,
  writeUserFixtures,
  type UserFixture,
} from './user-fixtures'
import { extractDominantColors, pickAspectRatio } from './image-color'

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

interface ImageReferenceSeed {
  colors: string[]
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
}

interface SubmittedDesignBrief {
  intent: string
  answers?: BriefAnswer[]
  notes?: string
  /** @deprecated imageReferences[0]을 권장 (legacy 단일 호환). */
  imageReference?: ImageReferenceSeed
  imageReferences?: ImageReferenceSeed[]
}

interface ClarifyTurn {
  questions: ClarifyQuestionDto[]
  answers: BriefAnswer[]
}

type GenerateStage = 'intent' | 'questions'

interface GenerationEntry {
  id: string
  label: string
  userLabel?: string
  tree: Tree
  immutable: boolean
  pinned?: boolean
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('FileReader가 data URL을 반환하지 않았습니다.'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('읽기 실패'))
    reader.readAsDataURL(file)
  })
}

async function extractFromDataUrl(dataUrl: string): Promise<{
  colors: string[]
  aspectRatio: 'square' | 'landscape' | 'portrait' | 'wide' | null
}> {
  const image = await loadImage(dataUrl)
  const naturalWidth = image.naturalWidth
  const naturalHeight = image.naturalHeight
  const aspectRatio = pickAspectRatio(naturalWidth, naturalHeight)
  const MAX_DIM = 200
  const scale = Math.min(
    1,
    MAX_DIM / Math.max(naturalWidth, naturalHeight, 1),
  )
  const drawWidth = Math.max(1, Math.round(naturalWidth * scale))
  const drawHeight = Math.max(1, Math.round(naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = drawWidth
  canvas.height = drawHeight
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('canvas 2d context를 얻을 수 없습니다.')
  }
  ctx.drawImage(image, 0, 0, drawWidth, drawHeight)
  const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight)
  const colors = extractDominantColors(
    { data: imageData.data, width: drawWidth, height: drawHeight },
    5,
  )
  return { colors, aspectRatio }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('이미지 디코드 실패'))
    image.src = src
  })
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

const nodeTypeIcons: Record<TreeNode['type'], LucideIcon> = {
  text: Type,
  button: MousePointer,
  image: ImageIcon,
  section: PanelTop,
  hero: SquareStack,
  card: Square,
  list: List,
  form: FormInput,
}

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
import {
  responsiveViewportPresets,
  resolveResponsiveLayout,
  resolveResponsiveSpacing,
  type ResponsiveViewport,
} from './responsive.js'
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
const DEFAULT_ACCENT_PICKER_COLOR = '#4f46e5'
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
  // 추가 선택 노드 (Shift/Cmd+click) — primary는 selectedNodeId, 나머지는 여기.
  // selectedNodeId 변경 시 자동으로 비워진다(useEffect).
  const [additionalSelectedNodeIds, setAdditionalSelectedNodeIds] = useState<
    Set<string>
  >(new Set())
  useEffect(() => {
    setAdditionalSelectedNodeIds(new Set())
  }, [selectedNodeId])
  const allSelectedNodeIds = useMemo(
    () => new Set<string>([selectedNodeId, ...additionalSelectedNodeIds]),
    [selectedNodeId, additionalSelectedNodeIds],
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
  const [canvasZoom, setCanvasZoom] = useState(1)
  // 선택 노드 logical 크기 (status bar 표시용) — DOM 측정 후 업데이트
  const [selectedNodeSize, setSelectedNodeSize] = useState<{
    width: number
    height: number
  } | null>(null)
  // 캔버스 렌더링 default 값(Tailwind class에서 오는 padding/gap/color/font 등)을
  // inspector placeholder로 노출하기 위한 effective style. tree props가 비어있어도
  // 사용자가 _현재 렌더되고 있는 값_을 즉시 확인 가능 (Codex P1 회신).
  const [effectiveStyle, setEffectiveStyle] = useState<EffectiveCanvasStyle>({})
  // 캔버스 panning(스페이스+드래그) 상태
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const canvasScrollRef = useRef<HTMLDivElement | null>(null)
  const panStateRef = useRef<{
    startX: number
    startY: number
    scrollLeft: number
    scrollTop: number
  } | null>(null)
  // 좌/우 패널 폭 — drag로 조정 가능. localStorage 저장.
  const LEFT_PANEL_MIN = 220
  const LEFT_PANEL_MAX = 420
  const RIGHT_PANEL_MIN = 280
  const RIGHT_PANEL_MAX = 520
  const [leftPanelWidth, setLeftPanelWidth] = useState(260)
  const [rightPanelWidth, setRightPanelWidth] = useState(360)
  const [resizingPanel, setResizingPanel] = useState<'left' | 'right' | null>(
    null,
  )
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [globalContextMenu, setGlobalContextMenu] = useState<{
    x: number
    y: number
  } | null>(null)
  const [layerDrag, setLayerDrag] = useState<LayerDragState | null>(null)
  const [layerDropTarget, setLayerDropTarget] = useState<LayerDropTarget | null>(
    null,
  )
  const [generateStage, setGenerateStage] = useState<GenerateStage>('intent')
  const [briefIntent, setBriefIntent] = useState('')
  const [briefNotes, setBriefNotes] = useState('')
  const [briefVariantCount, setBriefVariantCount] = useState<VariantCount>(1)
  const [userFixtures, setUserFixtures] = useState<UserFixture[]>([])
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [editingLabelDraft, setEditingLabelDraft] = useState('')
  const [briefImageRef, setBriefImageRef] = useState<ImageReferenceSeed | null>(
    null,
  )
  const [briefImageRefThumbnail, setBriefImageRefThumbnail] = useState<
    string | null
  >(null)
  const [briefImageRefs, setBriefImageRefs] = useState<ImageReferenceSeed[]>([])
  const [briefImageRefThumbnails, setBriefImageRefThumbnails] = useState<
    string[]
  >([])
  const [briefImageRefError, setBriefImageRefError] = useState<string | null>(
    null,
  )
  const [briefImageRefBusy, setBriefImageRefBusy] = useState(false)
  const MAX_IMAGE_REFS = 3
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
  // 좁은 화면 drawer 토글 — md 이상은 grid 컬럼으로 표시되고, 미만에서는 fixed overlay로 띄움
  const [briefDrawerOpen, setBriefDrawerOpen] = useState(false)
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false)
  // ⌘\ — 데스크톱에서 좌/우 패널 동시 hide (집중 모드 / Figma 표준)
  const [panelsHidden, setPanelsHidden] = useState(false)
  // 좌측 패널 탭 — 브리프/레이어 풀 높이 전환
  const [leftPanelTab, setLeftPanelTab] = useState<'brief' | 'layers'>('brief')
  // 캔버스 grid — 디자인 정밀도용 격자 (off / 8 / 16 / 24 px cycle)
  const [canvasGridSize, setCanvasGridSize] = useState<0 | 8 | 16 | 24>(0)
  // 키보드 단축키 도움말 popover
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false)
  const shortcutHelpCloseRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (shortcutHelpOpen) {
      // 마운트 직후 focus — animation 시작과 함께
      shortcutHelpCloseRef.current?.focus()
    }
  }, [shortcutHelpOpen])
  // 레이어 트리 collapse 상태 — 컨테이너 노드 ID 집합. 기본 모두 펼침.
  const [collapsedLayerNodeIds, setCollapsedLayerNodeIds] = useState<
    Set<string>
  >(() => new Set())
  // 레이어↔캔버스 cross-highlight — hover 중인 노드 ID
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const canvasHoverValue = useMemo(
    () => ({ hoveredNodeId, setHoveredNodeId }),
    [hoveredNodeId],
  )
  // 레이어 트리 검색 — node.id 부분 일치 필터
  const [layerQuery, setLayerQuery] = useState('')

  // 선택된 노드를 레이어 트리에서 _보이게_ — 조상 collapse 해제 + 자동 scroll
  useEffect(() => {
    if (selectedNodeId === tree.root.id) return
    const ancestors = getAncestorChain(tree, selectedNodeId)
    if (ancestors.length === 0) return
    setCollapsedLayerNodeIds((prev) => {
      let changed = false
      const next = new Set(prev)
      for (const id of ancestors) {
        if (next.delete(id)) changed = true
      }
      return changed ? next : prev
    })
  }, [selectedNodeId, tree])

  useEffect(() => {
    if (leftPanelTab !== 'layers') return
    if (selectedNodeId === tree.root.id) return
    const row = document.querySelector<HTMLElement>(
      `[data-layer-row-main][data-layer-node-id="${CSS.escape(selectedNodeId)}"]`,
    )
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedNodeId, tree.root.id, leftPanelTab])

  // 캔버스 자동 reveal — 선택 노드가 캔버스 viewport 밖이면 부드럽게 스크롤.
  // 단, panning/zoom 중에는 사용자 의도 존중 + 직접 scroll 보정 우선이라 skip.
  useEffect(() => {
    if (selectedNodeId === '' || selectedNodeId === tree.root.id) return
    if (isPanning || pendingZoomAnchorRef.current || pendingDirectScrollRef.current)
      return
    const wrapper = document.querySelector<HTMLElement>(
      `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
    )
    if (!wrapper) return
    const container = canvasScrollRef.current
    if (!container) return
    // 노드가 viewport 밖에 있을 때만 scroll (이미 보이면 jitter 방지)
    const wRect = wrapper.getBoundingClientRect()
    const cRect = container.getBoundingClientRect()
    const margin = 40 // 가장자리 padding
    const fullyVisible =
      wRect.top >= cRect.top + margin &&
      wRect.bottom <= cRect.bottom - margin &&
      wRect.left >= cRect.left + margin &&
      wRect.right <= cRect.right - margin
    if (fullyVisible) return
    wrapper.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [selectedNodeId, tree, isPanning])

  // 선택 노드의 effective canvas style 측정 — Tailwind/CSS class에서 오는 default 값
  useEffect(() => {
    function measureEffective(): void {
      if (selectedNodeId === '') {
        setEffectiveStyle({})
        return
      }
      const wrapper = document.querySelector<HTMLElement>(
        `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
      )
      if (!wrapper) {
        setEffectiveStyle({})
        return
      }
      // SelectableNode wrapper의 첫 _content_ 자식.
      // 단, isPrimary 시 추가되는 type 라벨 badge(span.absolute)와 CanvasNodeToolbar는
      // skip — 이들은 absolute 위치 + 자체 padding/gap을 가져 측정값을 오염시킴.
      function pickContentChild(parent: Element): HTMLElement | null {
        const children = Array.from(parent.children) as HTMLElement[]
        return (
          children.find((el) => {
            if (el.classList.contains('absolute')) return false
            if (el.classList.contains('pointer-events-none')) return false
            return true
          }) ?? null
        )
      }
      let inner: HTMLElement = pickContentChild(wrapper) ?? wrapper
      // 텍스트 노드 등 일부는 boxStyle wrapper(빈 div)로 한 번 더 감싸있어 실제
      // 의미 있는 element는 그 안에 있다. 최대 3단 drill — text-/font-/grid/flex/
      // bg- 같은 의미 class가 있거나, 텍스트 content를 가진 element를 만나면 stop.
      let depth = 0
      while (depth < 3) {
        const cls = inner.className?.toString() ?? ''
        if (/(text-|font-|grid|flex|aspect-|p-|gap-|bg-|border-|rounded-|shadow-|min-h-|min-w-)/.test(cls))
          break
        const innerTag = inner.tagName
        if (
          innerTag === 'H1' ||
          innerTag === 'H2' ||
          innerTag === 'H3' ||
          innerTag === 'H4' ||
          innerTag === 'H5' ||
          innerTag === 'H6' ||
          innerTag === 'P' ||
          innerTag === 'BUTTON' ||
          innerTag === 'A' ||
          innerTag === 'FIGURE' ||
          innerTag === 'IMG' ||
          innerTag === 'SECTION' ||
          innerTag === 'ARTICLE' ||
          innerTag === 'UL' ||
          innerTag === 'OL' ||
          innerTag === 'FORM'
        )
          break
        const next = pickContentChild(inner)
        if (!next) break
        inner = next
        depth++
      }
      const cs = window.getComputedStyle(inner)
      const z = canvasZoom > 0 ? canvasZoom : 1
      // CSS zoom으로 크기 모두 z배 — 픽셀 값은 / z로 logical 변환
      const px = (v: string): number | undefined => {
        const n = parseFloat(v)
        if (!Number.isFinite(n)) return undefined
        return Math.round((n / z) * 10) / 10
      }
      setEffectiveStyle({
        paddingTop: px(cs.paddingTop),
        paddingRight: px(cs.paddingRight),
        paddingBottom: px(cs.paddingBottom),
        paddingLeft: px(cs.paddingLeft),
        marginTop: px(cs.marginTop),
        marginRight: px(cs.marginRight),
        marginBottom: px(cs.marginBottom),
        marginLeft: px(cs.marginLeft),
        gap: cs.rowGap !== '' ? px(cs.rowGap) : undefined,
        backgroundColor: rgbToHex(cs.backgroundColor),
        textColor: rgbToHex(cs.color),
        borderRadiusTopLeft: px(cs.borderTopLeftRadius),
        borderRadiusTopRight: px(cs.borderTopRightRadius),
        borderRadiusBottomLeft: px(cs.borderBottomLeftRadius),
        borderRadiusBottomRight: px(cs.borderBottomRightRadius),
        fontSize: px(cs.fontSize),
        fontWeight: cs.fontWeight,
        lineHeight:
          cs.lineHeight === 'normal'
            ? undefined
            : (() => {
                const lh = parseFloat(cs.lineHeight) / z
                const fs = parseFloat(cs.fontSize) / z
                if (!Number.isFinite(lh) || !Number.isFinite(fs) || fs <= 0)
                  return undefined
                return Math.round((lh / fs) * 100) / 100
              })(),
        letterSpacing:
          cs.letterSpacing === 'normal'
            ? 0
            : (() => {
                const ls = parseFloat(cs.letterSpacing) / z
                const fs = parseFloat(cs.fontSize) / z
                if (!Number.isFinite(ls) || !Number.isFinite(fs) || fs <= 0)
                  return undefined
                return Math.round((ls / fs) * 1000) / 1000
              })(),
        display: cs.display,
        flexDirection: cs.flexDirection,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
      })
    }
    measureEffective()
    const ro = new ResizeObserver(() => measureEffective())
    const wrapper = document.querySelector<HTMLElement>(
      `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
    )
    if (wrapper) ro.observe(wrapper)
    return () => ro.disconnect()
  }, [selectedNodeId, tree, canvasZoom, responsiveViewport])

  // 선택 노드의 logical (zoom 무관) 크기를 status bar용으로 측정
  useEffect(() => {
    function measure(): void {
      if (selectedNodeId === '') {
        setSelectedNodeSize(null)
        return
      }
      const el = document.querySelector<HTMLElement>(
        `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
      )
      if (!el) {
        setSelectedNodeSize(null)
        return
      }
      const rect = el.getBoundingClientRect()
      // CSS zoom이 적용되므로 logical = visual / zoom
      const z = canvasZoom > 0 ? canvasZoom : 1
      setSelectedNodeSize({
        width: Math.round(rect.width / z),
        height: Math.round(rect.height / z),
      })
    }
    measure()
    // 캔버스 사이즈/zoom 변경에도 다시 측정
    const ro = new ResizeObserver(() => measure())
    const el = document.querySelector<HTMLElement>(
      `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
    )
    if (el) ro.observe(el)
    return () => ro.disconnect()
  }, [selectedNodeId, tree, canvasZoom, responsiveViewport])
  const lastHistoryMergeRef = useRef<HistoryMergeState | null>(null)
  const [isGenerationStateHydrated, setIsGenerationStateHydrated] =
    useState(false)
  const [isUIPrefsHydrated, setIsUIPrefsHydrated] = useState(false)

  // UI 환경설정 hydration — 마운트 1회. 마지막 세션의 grid/zoom/viewport/leftPanelTab 복원.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('dw:uiPrefs:v1')
      if (raw) {
        const saved = JSON.parse(raw) as {
          canvasGridVisible?: boolean
          canvasGridSize?: number
          canvasZoom?: number
          responsiveViewport?: ResponsiveViewport
          leftPanelTab?: 'brief' | 'layers'
          leftPanelWidth?: number
          rightPanelWidth?: number
        }
        // 신규(canvasGridSize) 우선, 없으면 legacy boolean 마이그레이션
        if (
          saved.canvasGridSize === 8 ||
          saved.canvasGridSize === 16 ||
          saved.canvasGridSize === 24
        ) {
          setCanvasGridSize(saved.canvasGridSize)
        } else if (saved.canvasGridSize === 0) {
          setCanvasGridSize(0)
        } else if (typeof saved.canvasGridVisible === 'boolean') {
          setCanvasGridSize(saved.canvasGridVisible ? 16 : 0)
        }
        if (
          typeof saved.canvasZoom === 'number' &&
          saved.canvasZoom >= 0.25 &&
          saved.canvasZoom <= 2
        ) {
          setCanvasZoom(saved.canvasZoom)
        }
        if (
          saved.responsiveViewport === 'desktop' ||
          saved.responsiveViewport === 'tablet' ||
          saved.responsiveViewport === 'mobile'
        ) {
          setResponsiveViewport(saved.responsiveViewport)
        }
        if (saved.leftPanelTab === 'brief' || saved.leftPanelTab === 'layers') {
          setLeftPanelTab(saved.leftPanelTab)
        }
        if (
          typeof saved.leftPanelWidth === 'number' &&
          saved.leftPanelWidth >= 220 &&
          saved.leftPanelWidth <= 420
        ) {
          setLeftPanelWidth(saved.leftPanelWidth)
        }
        if (
          typeof saved.rightPanelWidth === 'number' &&
          saved.rightPanelWidth >= 280 &&
          saved.rightPanelWidth <= 520
        ) {
          setRightPanelWidth(saved.rightPanelWidth)
        }
      }
    } catch {
      // localStorage 접근 실패는 무시 — default 상태 유지
    }
    setIsUIPrefsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isUIPrefsHydrated) return
    try {
      window.localStorage.setItem(
        'dw:uiPrefs:v1',
        JSON.stringify({
          canvasGridSize,
          canvasZoom,
          responsiveViewport,
          leftPanelTab,
          leftPanelWidth,
          rightPanelWidth,
        }),
      )
    } catch {
      // quota / 보안 모드 등은 무시
    }
  }, [
    isUIPrefsHydrated,
    canvasGridSize,
    canvasZoom,
    responsiveViewport,
    leftPanelTab,
    leftPanelWidth,
    rightPanelWidth,
  ])

  useEffect(() => {
    // 마운트 1회 — localStorage 복원으로 새로고침 후 생성 결과물 휘발 방지.
    const persisted = readPersistedGenerationState()
    if (persisted !== null) {
      const fixture = getTreeFixture(persisted.fixtureId) ?? defaultTreeFixture
      const restoredGenerations = persisted.generations as GenerationEntry[]
      const activeId =
        restoredGenerations.find((entry) => entry.id === persisted.activeGenerationId)
          ?.id ?? restoredGenerations[0]?.id
      const activeEntry = restoredGenerations.find((entry) => entry.id === activeId)

      setSelectedFixtureId(fixture.id)
      setGenerations(restoredGenerations)
      if (activeId !== undefined) {
        setActiveGenerationId(activeId)
      }
      if (activeEntry !== undefined) {
        setTree(activeEntry.tree)
        setSelectedNodeId(
          findFirstEditableNodeId(activeEntry.tree.root) ?? activeEntry.tree.root.id,
        )
        setHistoryPast([])
        setHistoryFuture([])
        lastHistoryMergeRef.current = null
      }

      setBriefIntent(persisted.brief.intent)
      setBriefNotes(persisted.brief.notes)
      setBriefVariantCount(persisted.brief.variantCount)
      setBriefAnswers(persisted.brief.answers)
      setClarifyQuestions(persisted.brief.questions as ClarifyQuestionDto[])
      setClarifyTurns(persisted.clarify.turns as ClarifyTurn[])
      setClarifyComplete(persisted.clarify.complete)
      setGenerateStage(persisted.clarify.stage)
      setBriefImageRef(persisted.brief.imageReference)
      setBriefImageRefThumbnail(persisted.brief.imageReferenceThumbnail)
      // 신규 array 키가 있으면 그대로, 없으면 legacy 단일 키를 array[0]로 마이그레이션
      const hydratedRefs =
        persisted.brief.imageReferences ??
        (persisted.brief.imageReference !== null
          ? [persisted.brief.imageReference]
          : [])
      const hydratedThumbs =
        persisted.brief.imageReferenceThumbnails ??
        (persisted.brief.imageReferenceThumbnail !== null
          ? [persisted.brief.imageReferenceThumbnail]
          : [])
      setBriefImageRefs(hydratedRefs)
      setBriefImageRefThumbnails(hydratedThumbs)
    }
    setIsGenerationStateHydrated(true)
  }, [])

  useEffect(() => {
    // 변경 시 localStorage 동기화 — hydrate 전 write는 skip해 default 상태로 덮어쓰지 않는다.
    if (!isGenerationStateHydrated) return
    writePersistedGenerationState({
      version: 1,
      fixtureId: selectedFixtureId,
      generations,
      activeGenerationId,
      brief: {
        intent: briefIntent,
        notes: briefNotes,
        variantCount: briefVariantCount,
        answers: briefAnswers,
        questions: clarifyQuestions,
        imageReference: briefImageRef,
        imageReferenceThumbnail: briefImageRefThumbnail,
        ...(briefImageRefs.length > 0
          ? { imageReferences: briefImageRefs }
          : {}),
        ...(briefImageRefThumbnails.length > 0
          ? { imageReferenceThumbnails: briefImageRefThumbnails }
          : {}),
      },
      clarify: {
        turns: clarifyTurns,
        complete: clarifyComplete,
        stage: generateStage,
      },
    })
  }, [
    selectedFixtureId,
    generations,
    activeGenerationId,
    briefIntent,
    briefNotes,
    briefImageRef,
    briefImageRefThumbnail,
    briefImageRefs,
    briefImageRefThumbnails,
    briefVariantCount,
    briefAnswers,
    clarifyQuestions,
    clarifyTurns,
    clarifyComplete,
    generateStage,
    isGenerationStateHydrated,
  ])

  useEffect(() => {
    if (compareMode && generations.length < 2) {
      setCompareMode(false)
    }
  }, [compareMode, generations.length])

  const isUserFixturesHydratedRef = useRef(false)
  useEffect(() => {
    setUserFixtures(readUserFixtures())
    isUserFixturesHydratedRef.current = true
  }, [])

  useEffect(() => {
    if (!isUserFixturesHydratedRef.current) return
    writeUserFixtures(userFixtures)
  }, [userFixtures])

  const selectedNode = useMemo(
    () => findNode(tree.root, selectedNodeId) ?? tree.root,
    [selectedNodeId, tree],
  )
  const selectedStructureInfo = useMemo(
    () => getStructureInfo(tree, selectedNodeId),
    [selectedNodeId, tree],
  )
  const selectedFixture = useMemo(() => {
    const builtin = getTreeFixture(selectedFixtureId)
    if (builtin !== undefined) return builtin
    const userFixture = userFixtures.find(
      (fixture) => fixture.id === selectedFixtureId,
    )
    if (userFixture !== undefined) {
      return {
        id: userFixture.id,
        name: userFixture.name,
        description: '사용자 fixture',
        tree: userFixture.tree,
      }
    }
    return defaultTreeFixture
  }, [selectedFixtureId, userFixtures])
  const contextMenuNode = useMemo(
    () => (contextMenu ? findNode(tree.root, contextMenu.nodeId) : null),
    [contextMenu, tree],
  )
  const contextMenuStructureInfo = useMemo(
    () => (contextMenu ? getStructureInfo(tree, contextMenu.nodeId) : null),
    [contextMenu, tree],
  )
  const layerItems = useMemo(
    () => flattenTree(tree.root, collapsedLayerNodeIds),
    [tree, collapsedLayerNodeIds],
  )

  const filteredLayerItems = useMemo(() => {
    const q = layerQuery.trim().toLowerCase()
    if (q === '') return layerItems
    // 검색 시에는 collapsed 무시(전체 트리 평탄화 후 매치) — 결과 가독성 우선
    const allItems = flattenTree(tree.root)
    return allItems.filter((item) =>
      item.node.id.toLowerCase().includes(q),
    )
  }, [layerItems, layerQuery, tree])

  function toggleLayerCollapse(nodeId: string): void {
    setCollapsedLayerNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }
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
    const builtin = getTreeFixture(fixtureId)
    const userFixture =
      builtin === undefined
        ? userFixtures.find((fixture) => fixture.id === fixtureId)
        : undefined
    const nextTree =
      builtin?.tree ?? userFixture?.tree ?? defaultTreeFixture.tree
    const resolvedId =
      builtin?.id ?? userFixture?.id ?? defaultTreeFixture.id
    const nextOriginal = createOriginalEntry(nextTree)
    setSelectedFixtureId(resolvedId)
    setCompareMode(false)
    setTree(nextTree)
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
    handleImageRefClear()
    setSelectedNodeId(
      findFirstEditableNodeId(nextTree.root) ?? nextTree.root.id,
    )
  }

  function handleSaveAsUserFixture(): void {
    const active = generations.find((entry) => entry.id === activeGenerationId)
    if (active === undefined) return
    const defaultName =
      active.brief?.intent !== undefined
        ? sanitizeUserFixtureName(active.brief.intent)
        : sanitizeUserFixtureName(active.label)
    const name = window.prompt(
      'fixture 이름을 입력하세요 (40자 이내). 다음 세션에서 예제 dropdown에 표시됩니다.',
      defaultName.length > 0 ? defaultName : '내 디자인',
    )
    if (name === null) return
    const sanitized = sanitizeUserFixtureName(name)
    if (sanitized.length === 0) {
      setGenerateError('fixture 이름이 비어 있습니다.')
      return
    }
    const existing = userFixtures.find((fixture) => fixture.name === sanitized)
    if (existing !== undefined) {
      const overwrite = window.confirm(
        `이미 "${sanitized}" 이름의 fixture가 있습니다. 덮어쓸까요?\n취소하면 같은 이름으로 새 fixture가 추가됩니다.`,
      )
      if (overwrite) {
        setUserFixtures((prev) =>
          prev.map((fixture) =>
            fixture.id === existing.id
              ? { ...fixture, tree: active.tree, createdAt: Date.now() }
              : fixture,
          ),
        )
        setGenerateError(null)
        return
      }
    }
    const newFixture: UserFixture = {
      id: createUserFixtureId(),
      name: sanitized,
      tree: active.tree,
      createdAt: Date.now(),
    }
    setUserFixtures((prev) => [...prev, newFixture])
    setGenerateError(null)
  }

  function handleDeleteUserFixture(fixtureId: string): void {
    setUserFixtures((prev) => prev.filter((fixture) => fixture.id !== fixtureId))
    if (selectedFixtureId === fixtureId) {
      handleFixtureChange(defaultTreeFixture.id)
    }
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
    const imageReference =
      briefImageRef !== null && briefImageRef.colors.length > 0
        ? briefImageRef
        : undefined
    const validRefs = briefImageRefs.filter((ref) => ref.colors.length > 0)
    const imageReferences =
      validRefs.length > 0
        ? validRefs
        : imageReference !== undefined
          ? [imageReference]
          : undefined
    if (generateStage === 'intent') {
      return {
        intent,
        ...(imageReferences !== undefined ? { imageReferences } : {}),
      }
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
      ...(imageReferences !== undefined ? { imageReferences } : {}),
    }
  }

  async function handleImageRefAddFiles(files: File[]): Promise<void> {
    const MAX_BYTES = 5 * 1024 * 1024
    const remaining = MAX_IMAGE_REFS - briefImageRefs.length
    if (remaining <= 0) {
      setBriefImageRefError(
        `참고 이미지는 최대 ${MAX_IMAGE_REFS}장까지 추가할 수 있습니다.`,
      )
      return
    }
    setBriefImageRefBusy(true)
    setBriefImageRefError(null)
    const newRefs: ImageReferenceSeed[] = []
    const newThumbs: string[] = []
    const failures: string[] = []
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        failures.push(`${file.name}: 이미지 파일이 아닙니다.`)
        continue
      }
      if (file.size > MAX_BYTES) {
        failures.push(`${file.name}: 5MB 초과`)
        continue
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        const { colors, aspectRatio } = await extractFromDataUrl(dataUrl)
        if (colors.length === 0) {
          failures.push(`${file.name}: 색 추출 실패`)
          continue
        }
        newRefs.push({
          colors,
          ...(aspectRatio !== null ? { aspectRatio } : {}),
        })
        newThumbs.push(dataUrl)
      } catch (error) {
        failures.push(
          `${file.name}: ${error instanceof Error ? error.message : '처리 실패'}`,
        )
      }
    }
    if (newRefs.length > 0) {
      setBriefImageRefs((prev) => [...prev, ...newRefs])
      setBriefImageRefThumbnails((prev) => [...prev, ...newThumbs])
      // 단일 fallback state는 첫 ref와 동기화 (legacy persist 호환).
      const firstRef = newRefs[0]
      const firstThumb = newThumbs[0]
      if (briefImageRef === null && firstRef !== undefined) {
        setBriefImageRef(firstRef)
        setBriefImageRefThumbnail(firstThumb ?? null)
      }
    }
    if (failures.length > 0) {
      setBriefImageRefError(`일부 이미지 추가 실패 — ${failures.join(' / ')}`)
    }
    setBriefImageRefBusy(false)
  }

  function handleImageRefRemoveAt(index: number): void {
    setBriefImageRefs((prev) => prev.filter((_, i) => i !== index))
    setBriefImageRefThumbnails((prev) => prev.filter((_, i) => i !== index))
    // 단일 fallback도 동기화 — index 0을 지우면 legacy 단일도 비우기.
    if (index === 0) {
      const next = briefImageRefs[1]
      const nextThumb = briefImageRefThumbnails[1]
      setBriefImageRef(next ?? null)
      setBriefImageRefThumbnail(nextThumb ?? null)
    }
    setBriefImageRefError(null)
  }

  function handleImageRefClear(): void {
    setBriefImageRef(null)
    setBriefImageRefThumbnail(null)
    setBriefImageRefs([])
    setBriefImageRefThumbnails([])
    setBriefImageRefError(null)
  }

  function handleExportActiveGeneration(): void {
    const active = generations.find((entry) => entry.id === activeGenerationId)
    if (active === undefined) return
    const exportedAt = new Date()
    const payload = buildExportPayload(
      {
        tree: active.tree,
        label: active.label,
        brief: active.brief,
        questions: active.questions,
        clarifyTurns: active.clarifyTurns,
        model: active.model,
        latencyMs: active.latencyMs,
      },
      exportedAt,
    )
    const filename = buildExportFilename(exportedAt, active.label)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const href = URL.createObjectURL(blob)
    try {
      const anchor = document.createElement('a')
      anchor.href = href
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    } finally {
      URL.revokeObjectURL(href)
    }
  }

  async function handleImportGenerationFiles(files: File[]): Promise<void> {
    const importedEntries: GenerationEntry[] = []
    const failures: string[] = []
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        failures.push(`${file.name}: JSON 파일이 아닙니다.`)
        continue
      }
      let text: string
      try {
        text = await file.text()
      } catch (error) {
        failures.push(
          `${file.name}: ${error instanceof Error ? error.message : '읽기 실패'}`,
        )
        continue
      }
      const result = parseImportPayload(text)
      if (!result.ok) {
        failures.push(`${file.name}: ${result.reason}`)
        continue
      }
      importedEntries.push({
        id: createGenerationEntryId(),
        label: '가져옴',
        tree: result.payload.tree,
        immutable: false,
        brief: result.payload.brief,
        questions: result.payload.questions,
        clarifyTurns: result.payload.clarifyTurns,
        createdAt: Date.now(),
        latencyMs: result.payload.latencyMs,
        model: result.payload.model,
      })
    }
    if (importedEntries.length === 0) {
      setGenerateError(
        failures.length > 0
          ? `가져오기 실패 — ${failures.join(' / ')}`
          : '가져올 파일이 없습니다.',
      )
      return
    }

    const lastEntry = importedEntries[importedEntries.length - 1]
    if (lastEntry === undefined) return

    setGenerations((entries) =>
      appendGenerationHistoryEntries(entries, importedEntries, MAX_GENERATIONS),
    )
    setActiveGenerationId(lastEntry.id)
    setCompareMode(false)
    setTree(lastEntry.tree)
    setSelectedNodeId(
      findFirstEditableNodeId(lastEntry.tree.root) ?? lastEntry.tree.root.id,
    )
    setHistoryPast([])
    setHistoryFuture([])
    lastHistoryMergeRef.current = null
    if (failures.length > 0) {
      setGenerateError(
        `${importedEntries.length}개 가져옴, ${failures.length}개 실패 — ${failures.join(' / ')}`,
      )
    } else {
      setGenerateError(null)
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

  function handleToggleGenerationPin(targetId: string): void {
    setGenerations((entries) =>
      entries.map((entry) => {
        if (entry.id !== targetId || entry.immutable) return entry
        return { ...entry, pinned: !(entry.pinned === true) }
      }),
    )
  }

  function handleStartLabelEdit(entry: GenerationEntry): void {
    if (entry.immutable) return
    setEditingLabelId(entry.id)
    setEditingLabelDraft(entry.userLabel ?? entry.label)
  }

  function handleCommitLabelEdit(): void {
    if (editingLabelId === null) return
    const trimmed = editingLabelDraft.trim().slice(0, 30)
    setGenerations((entries) =>
      entries.map((entry) => {
        if (entry.id !== editingLabelId) return entry
        if (trimmed.length === 0) {
          const { userLabel: _userLabel, ...rest } = entry
          void _userLabel
          return rest
        }
        return { ...entry, userLabel: trimmed }
      }),
    )
    setEditingLabelId(null)
    setEditingLabelDraft('')
  }

  function handleCancelLabelEdit(): void {
    setEditingLabelId(null)
    setEditingLabelDraft('')
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
      setBriefImageRef(null)
      setBriefImageRefThumbnail(null)
      setBriefImageRefError(null)
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
      setBriefImageRef(target.brief.imageReference ?? null)
      setBriefImageRefThumbnail(null)
      setBriefImageRefError(null)
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
    const ids = Array.from(allSelectedNodeIds).filter(
      (id) => id !== tree.root.id,
    )
    if (ids.length === 0) {
      return
    }
    if (ids.length === 1) {
      const onlyId = ids[0]
      if (onlyId !== undefined) handleDuplicateNode(onlyId)
      return
    }
    // multi-target — 각 노드를 개별 복제, 마지막 복제로 selection 이동
    let nextTree = tree
    let lastNewId = selectedNodeId
    for (const id of ids) {
      try {
        const dupId = createDuplicateNodeId(nextTree, id)
        nextTree = duplicateNode(nextTree, id, dupId)
        lastNewId = dupId
      } catch {
        // 노드가 부모와 같이 처리되지 않은 경우는 skip
      }
    }
    commitTreeEdit(nextTree, lastNewId)
    setAdditionalSelectedNodeIds(new Set())
    closeContextMenu()
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
    const ids = Array.from(allSelectedNodeIds).filter(
      (id) => id !== tree.root.id,
    )
    if (ids.length === 0) {
      return
    }
    if (ids.length === 1) {
      const onlyId = ids[0]
      if (onlyId !== undefined) handleDeleteNode(onlyId)
      return
    }
    // multi-target — 자손이 부모와 함께 사라질 수 있으니 try-catch로 silent skip
    let nextTree = tree
    let surviveAt = tree.root.id
    for (const id of ids) {
      try {
        const info = getStructureInfo(nextTree, id)
        if (info.isRoot) continue
        nextTree = deleteNode(nextTree, id)
        surviveAt = info.parentId ?? tree.root.id
      } catch {
        // 노드가 이미 사라짐(부모와 함께)
      }
    }
    setAdditionalSelectedNodeIds(new Set())
    commitTreeEdit(nextTree, surviveAt)
    closeContextMenu()
  }

  // 컨테이너 자식으로 leaf 노드 수동 추가 — LLM 의존 없는 자유 편집
  function handleAddLeafChild(parentId: string, childType: LeafNodeType) {
    const existingIds = collectNodeIds(tree.root)
    const base = `${parentId}.${childType}`
    let suffix = 1
    while (existingIds.has(`${base}-${suffix}`)) {
      suffix += 1
    }
    const newId = `${base}-${suffix}`
    const nextTree = addLeafChild(tree, parentId, childType, newId)
    commitTreeEdit(nextTree, newId)
    closeContextMenu()
  }

  function handleAddContainerChild(
    parentId: string,
    containerType: ContainerNodeType,
  ) {
    const existingIds = collectNodeIds(tree.root)
    const base = `${parentId}.${containerType}`
    let suffix = 1
    while (existingIds.has(`${base}-${suffix}`)) {
      suffix += 1
    }
    const newContainerId = `${base}-${suffix}`
    const newTextChildId = `${newContainerId}.text-1`
    const nextTree = addContainerChild(
      tree,
      parentId,
      containerType,
      newContainerId,
      newTextChildId,
    )
    commitTreeEdit(nextTree, newContainerId)
    closeContextMenu()
  }

  // 선택 노드 _다음에_ 형제 leaf 노드 추가 (root 노드는 부모가 없어 불가)
  function handleAddLeafSibling(siblingId: string, childType: LeafNodeType) {
    if (siblingId === tree.root.id) return
    const existingIds = collectNodeIds(tree.root)
    const base = `${siblingId}.${childType}`
    let suffix = 1
    while (existingIds.has(`${base}-${suffix}`)) {
      suffix += 1
    }
    const newId = `${base}-${suffix}`
    const nextTree = addLeafSibling(tree, siblingId, childType, newId)
    commitTreeEdit(nextTree, newId)
    closeContextMenu()
  }

  function handleAddContainerSibling(
    siblingId: string,
    containerType: ContainerNodeType,
  ) {
    if (siblingId === tree.root.id) return
    const existingIds = collectNodeIds(tree.root)
    const base = `${siblingId}.${containerType}`
    let suffix = 1
    while (existingIds.has(`${base}-${suffix}`)) {
      suffix += 1
    }
    const newContainerId = `${base}-${suffix}`
    const newTextChildId = `${newContainerId}.text-1`
    const nextTree = addContainerSibling(
      tree,
      siblingId,
      containerType,
      newContainerId,
      newTextChildId,
    )
    commitTreeEdit(nextTree, newContainerId)
    closeContextMenu()
  }

  function handleToggleNodeVisibility(node: TreeNode) {
    handleNodeMetaChange(node, {
      hidden: node.hidden === true ? undefined : true,
    })
    closeContextMenu()
  }

  function handleChangeLeafType(nodeId: string, nextType: LeafNodeType) {
    const next = changeLeafNodeType(tree, nodeId, nextType)
    commitTreeEdit(next, nodeId)
    closeContextMenu()
  }

  function handleChangeContainerType(
    nodeId: string,
    nextType: ContainerNodeType,
  ) {
    const next = changeContainerNodeType(tree, nodeId, nextType)
    commitTreeEdit(next, nodeId)
    closeContextMenu()
  }

  function handleToggleNodeCanvasSelection(node: TreeNode) {
    handleNodeMetaChange(node, {
      pointerEvents: node.pointerEvents === 'none' ? undefined : 'none',
    })
    closeContextMenu()
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

  // 캔버스 화면에 맞춤 (Figma ⌘1) — 사용 가능한 폭 ÷ viewport 폭으로 줌 계산
  function handleCanvasFit(): void {
    const el = canvasScrollRef.current
    if (!el) return
    const available = el.clientWidth - 64 // px-8 양쪽 padding 제외
    if (available <= 0) return
    const next = Math.max(
      0.25,
      Math.min(2, Math.round((available / selectedViewportPreset.width) * 100) / 100),
    )
    setCanvasZoom(next)
  }

  // 선택 노드를 화면에 fit + 중앙 (Figma ⌘2)
  function handleZoomToSelection(): void {
    const el = canvasScrollRef.current
    if (!el) return
    const nodeEl = el.querySelector<HTMLElement>(
      `[data-dworks-node-id="${CSS.escape(selectedNodeId)}"]`,
    )
    if (!nodeEl) return
    const nodeRect = nodeEl.getBoundingClientRect()
    const containerRect = el.getBoundingClientRect()
    if (nodeRect.width <= 0 || nodeRect.height <= 0) return
    // 현재 zoom 기준 logical 크기·위치
    const nodeLogicalWidth = nodeRect.width / canvasZoom
    const nodeLogicalHeight = nodeRect.height / canvasZoom
    const nodeLogicalLeft =
      (nodeRect.left - containerRect.left + el.scrollLeft) / canvasZoom
    const nodeLogicalTop =
      (nodeRect.top - containerRect.top + el.scrollTop) / canvasZoom
    // 노드를 80px 패딩 두고 화면에 fit하는 zoom
    const padding = 80
    const widthScale = (containerRect.width - padding) / nodeLogicalWidth
    const heightScale = (containerRect.height - padding) / nodeLogicalHeight
    const targetScale = Math.min(widthScale, heightScale)
    const newZoom = Math.max(
      0.25,
      Math.min(2, Math.round(targetScale * 100) / 100),
    )
    // 노드 중심을 화면 중심에 맞추는 scroll
    pendingDirectScrollRef.current = {
      left:
        newZoom * (nodeLogicalLeft + nodeLogicalWidth / 2) -
        containerRect.width / 2,
      top:
        newZoom * (nodeLogicalTop + nodeLogicalHeight / 2) -
        containerRect.height / 2,
    }
    setCanvasZoom(newZoom)
  }

  // 글로벌 키보드 shortcut — input/textarea/contenteditable에서는 비활성
  useEffect(() => {
    function isEditableTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (el.isContentEditable) return true
      return false
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (isEditableTarget(event.target)) return
      const meta = event.metaKey || event.ctrlKey

      // Cmd/Ctrl+Z — undo / Cmd/Ctrl+Shift+Z — redo
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        return
      }
      // Cmd/Ctrl+Y — redo (Windows 표준)
      if (meta && !event.shiftKey && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        handleRedo()
        return
      }
      // Cmd/Ctrl+D — duplicate
      if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        handleDuplicateSelected()
        return
      }
      // Cmd/Ctrl+A — select all nodes (root는 primary, 나머지는 additional)
      if (meta && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        const allItems = flattenTree(tree.root)
        const others = allItems
          .map((item) => item.node.id)
          .filter((id) => id !== selectedNodeId)
        setAdditionalSelectedNodeIds(new Set(others))
        return
      }
      // Cmd/Ctrl+↑/↓ — 형제 노드 사이 reorder
      if (meta && event.key === 'ArrowUp') {
        event.preventDefault()
        handleMoveSelected('up')
        return
      }
      if (meta && event.key === 'ArrowDown') {
        event.preventDefault()
        handleMoveSelected('down')
        return
      }
      // Delete/Backspace — delete selected (root는 무시)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        handleDeleteSelected()
        return
      }
      // Esc — 우선순위: 도움말 popover → drawer → multi-select → 선택 해제
      if (event.key === 'Escape') {
        if (shortcutHelpOpen) {
          event.preventDefault()
          setShortcutHelpOpen(false)
          return
        }
        if (briefDrawerOpen || inspectorDrawerOpen) {
          event.preventDefault()
          setBriefDrawerOpen(false)
          setInspectorDrawerOpen(false)
          return
        }
        if (additionalSelectedNodeIds.size > 0) {
          event.preventDefault()
          setAdditionalSelectedNodeIds(new Set())
          return
        }
        if (selectedNodeId !== tree.root.id) {
          event.preventDefault()
          setSelectedNodeId(tree.root.id)
        }
        return
      }
      // ? — 키보드 단축키 도움말 토글
      if (event.key === '?' && !meta) {
        event.preventDefault()
        setShortcutHelpOpen((v) => !v)
        return
      }
      // ⌘\ — 좌/우 패널 동시 hide (집중 모드, Figma 표준)
      if (meta && event.key === '\\') {
        event.preventDefault()
        setPanelsHidden((v) => !v)
        return
      }
      // ⌘0 — 캔버스 줌 100% 리셋 (Figma/Sketch 표준)
      if (meta && event.key === '0') {
        event.preventDefault()
        setCanvasZoom(1)
        return
      }
      // ⌘1 — fit to screen (선택 viewport가 화면에 꽉 차도록)
      if (meta && event.key === '1') {
        event.preventDefault()
        handleCanvasFit()
        return
      }
      // ⌘2 — zoom to selection (선택 노드를 화면 중앙에 fit)
      if (meta && event.key === '2') {
        event.preventDefault()
        handleZoomToSelection()
        return
      }
      // ⌘+ / ⌘= — 줌 인 (= 키도 받음, shift 없는 + 입력 호환)
      if (meta && (event.key === '+' || event.key === '=')) {
        event.preventDefault()
        setCanvasZoom((z) =>
          Math.min(2, Math.round((z + 0.1) * 100) / 100),
        )
        return
      }
      // ⌘- — 줌 아웃
      if (meta && event.key === '-') {
        event.preventDefault()
        setCanvasZoom((z) =>
          Math.max(0.25, Math.round((z - 0.1) * 100) / 100),
        )
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // 핸들러는 closure로 최신 state를 참조하므로 deps 비움
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    historyPast,
    historyFuture,
    selectedNodeId,
    tree,
    shortcutHelpOpen,
    briefDrawerOpen,
    inspectorDrawerOpen,
    additionalSelectedNodeIds,
    allSelectedNodeIds,
  ])

  // 캔버스 스페이스+드래그 panning — Figma/Sketch 표준
  // (Space 누른 채로 캔버스 드래그 → 패닝, 또는 마우스 가운데 버튼)
  useEffect(() => {
    function isEditableTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (el.isContentEditable) return true
      return false
    }
    function onSpaceDown(event: globalThis.KeyboardEvent) {
      if (event.code !== 'Space') return
      if (isEditableTarget(event.target)) return
      // 반복 keydown 무시 (계속 누르면 한번만 토글)
      if (event.repeat) return
      event.preventDefault()
      setIsSpacePressed(true)
    }
    function onSpaceUp(event: globalThis.KeyboardEvent) {
      if (event.code !== 'Space') return
      setIsSpacePressed(false)
    }
    window.addEventListener('keydown', onSpaceDown)
    window.addEventListener('keyup', onSpaceUp)
    return () => {
      window.removeEventListener('keydown', onSpaceDown)
      window.removeEventListener('keyup', onSpaceUp)
    }
  }, [])

  // 캔버스 panning mouse move/up — 패닝 활성 시만 listen
  useEffect(() => {
    if (!isPanning) return
    function onMove(event: MouseEvent) {
      const el = canvasScrollRef.current
      const state = panStateRef.current
      if (!el || !state) return
      el.scrollLeft = state.scrollLeft - (event.clientX - state.startX)
      el.scrollTop = state.scrollTop - (event.clientY - state.startY)
    }
    function onUp() {
      setIsPanning(false)
      panStateRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isPanning])

  // 좌/우 패널 resize drag
  useEffect(() => {
    if (resizingPanel === null) return
    function onMove(event: MouseEvent) {
      if (resizingPanel === 'left') {
        // 왼쪽 패널 폭 = 마우스 X 좌표 (창 좌측 기준). clamp.
        const next = Math.max(
          LEFT_PANEL_MIN,
          Math.min(LEFT_PANEL_MAX, event.clientX),
        )
        setLeftPanelWidth(next)
      } else if (resizingPanel === 'right') {
        // 오른쪽 패널 폭 = 창 폭 - 마우스 X. clamp.
        const next = Math.max(
          RIGHT_PANEL_MIN,
          Math.min(RIGHT_PANEL_MAX, window.innerWidth - event.clientX),
        )
        setRightPanelWidth(next)
      }
    }
    function onUp() {
      setResizingPanel(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    // 리사이즈 중 텍스트 선택/iframe pointer 이벤트 차단
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizingPanel])

  // 줌 변경 시 cursor anchor 위치 보정 — Figma처럼 커서 아래 점이 그대로
  const pendingZoomAnchorRef = useRef<{
    cursorX: number
    cursorY: number
    oldScrollLeft: number
    oldScrollTop: number
    oldZoom: number
  } | null>(null)
  // zoom-to-selection 같은 직접 scroll 지정용
  const pendingDirectScrollRef = useRef<{ left: number; top: number } | null>(null)

  // 캔버스 트랙패드/⌘+wheel 줌 — passive:false로 native attach (preventDefault 위해)
  useEffect(() => {
    const el = canvasScrollRef.current
    if (!el) return
    function onWheel(event: WheelEvent) {
      // ctrlKey: 트랙패드 pinch는 브라우저가 ctrl+wheel로 변환
      // metaKey: ⌘+휠 사용자 명시 줌
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const target = canvasScrollRef.current
      if (!target) return
      const rect = target.getBoundingClientRect()
      // delta 한 단계당 약 5% — 부드러운 줌
      const factor = Math.exp(-event.deltaY * 0.005)
      setCanvasZoom((prev) => {
        const next = Math.max(
          0.25,
          Math.min(2, Math.round(prev * factor * 100) / 100),
        )
        if (next === prev) return prev
        // cursor anchor 저장 — 다음 effect에서 scroll 보정
        pendingZoomAnchorRef.current = {
          cursorX: event.clientX - rect.left,
          cursorY: event.clientY - rect.top,
          oldScrollLeft: target.scrollLeft,
          oldScrollTop: target.scrollTop,
          oldZoom: prev,
        }
        return next
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  // canvasZoom 변경 후 scroll 보정 — DOM 갱신 후 적용
  // 1) cursor anchor (트랙패드 pinch): 커서 아래 점이 그대로
  // 2) direct scroll (zoom-to-selection): 절대 좌표 지정
  useEffect(() => {
    const el = canvasScrollRef.current
    if (!el) return
    const anchor = pendingZoomAnchorRef.current
    if (anchor) {
      const ratio = canvasZoom / anchor.oldZoom
      el.scrollLeft = (anchor.oldScrollLeft + anchor.cursorX) * ratio - anchor.cursorX
      el.scrollTop = (anchor.oldScrollTop + anchor.cursorY) * ratio - anchor.cursorY
      pendingZoomAnchorRef.current = null
      return
    }
    const direct = pendingDirectScrollRef.current
    if (direct) {
      el.scrollLeft = direct.left
      el.scrollTop = direct.top
      pendingDirectScrollRef.current = null
    }
  }, [canvasZoom])

  return (
    <CanvasSelectionContext.Provider
      value={{
        primarySelectedId: selectedNodeId,
        allSelectedIds: allSelectedNodeIds,
        toggleAdditional: (id: string) => {
          if (id === selectedNodeId) return
          setAdditionalSelectedNodeIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })
        },
        selectRange: (targetId: string) => {
          if (targetId === selectedNodeId) return
          // tree 전체를 flat 순서로 — 모든 컨테이너 expand 가정 (캔버스 위 노드는 다 보임)
          const allItems = flattenTree(tree.root)
          const primaryIdx = allItems.findIndex(
            (item) => item.node.id === selectedNodeId,
          )
          const targetIdx = allItems.findIndex(
            (item) => item.node.id === targetId,
          )
          if (primaryIdx < 0 || targetIdx < 0) return
          const [start, end] =
            primaryIdx < targetIdx
              ? [primaryIdx, targetIdx]
              : [targetIdx, primaryIdx]
          const range = allItems.slice(start, end + 1)
          setAdditionalSelectedNodeIds(() => {
            const next = new Set<string>()
            for (const item of range) {
              if (item.node.id !== selectedNodeId) {
                next.add(item.node.id)
              }
            }
            return next
          })
        },
        isPanActive: isSpacePressed || isPanning,
      }}
    >
    <CanvasHoverContext.Provider value={canvasHoverValue}>
    <main className="flex h-screen flex-col overflow-hidden bg-[#0d0e10] text-[#ebecef]">
      <header className="flex h-14 items-center justify-between border-b border-[#2a2e35] bg-[#16181c] px-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label={
              panelsHidden
                ? '좌/우 패널 모두 보이기 (⌘\\)'
                : briefDrawerOpen
                  ? '브리프 패널 닫기'
                  : '브리프 패널 열기'
            }
            aria-pressed={briefDrawerOpen || panelsHidden}
            onClick={() => {
              if (panelsHidden) {
                setPanelsHidden(false)
                return
              }
              setBriefDrawerOpen((v) => !v)
            }}
            className={`-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
              panelsHidden ? '' : 'md:hidden'
            } ${
              briefDrawerOpen || panelsHidden
                ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
                : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1] hover:text-[#c7d2fe]'
            }`}
          >
            <PanelLeft size={16} />
          </button>
          <DworksLogo />
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-1">
            <HistoryButton
              ariaLabel="실행 취소"
              shortcut="⌘Z"
              disabled={historyPast.length === 0}
              icon={Undo2}
              onClick={handleUndo}
            />
            <HistoryButton
              ariaLabel="다시 실행"
              shortcut="⌘⇧Z"
              disabled={historyFuture.length === 0}
              icon={Redo2}
              onClick={handleRedo}
            />
          </div>
          {(() => {
            const total = contrastAuditSummary.total
            const passes = contrastAuditSummary.passesAA
            // 모두 통과거나 측정 대상이 없으면 헤더에 chip을 띄우지 않음 (signal-only)
            if (total === 0 || passes === total) {
              return null
            }
            const failing = total - passes
            return (
              <button
                type="button"
                title={`WCAG AA 대비 미통과 ${failing}/${total} — 첫 미통과 텍스트로 이동`}
                onClick={() => {
                  const failingId = findFirstContrastFailNodeId(
                    tree,
                    colorPreset,
                  )
                  if (failingId !== null) {
                    setSelectedNodeId(failingId)
                  }
                }}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#a3741f] bg-[#3a2e0a] px-2 text-xs font-semibold text-[#fbbf24] transition-colors hover:bg-[#4a3812] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24]"
              >
                <AlertTriangle aria-hidden="true" size={13} />
                <span>
                  대비 {passes}/{total}
                </span>
              </button>
            )
          })()}
          <button
            type="button"
            aria-label="키보드 단축키"
            title="키보드 단축키 (?)"
            aria-pressed={shortcutHelpOpen}
            onClick={() => setShortcutHelpOpen((v) => !v)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
              shortcutHelpOpen
                ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
                : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1] hover:text-[#c7d2fe]'
            }`}
          >
            ?
          </button>
          {compareMode ? null : (
            <button
              type="button"
              aria-label={
                panelsHidden
                  ? '좌/우 패널 모두 보이기 (⌘\\)'
                  : inspectorDrawerOpen
                    ? '속성 패널 닫기'
                    : '속성 패널 열기'
              }
              aria-pressed={inspectorDrawerOpen || panelsHidden}
              onClick={() => {
                if (panelsHidden) {
                  setPanelsHidden(false)
                  return
                }
                setInspectorDrawerOpen((v) => !v)
              }}
              className={`-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
                panelsHidden ? '' : 'xl:hidden'
              } ${
                inspectorDrawerOpen || panelsHidden
                  ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
                  : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1] hover:text-[#c7d2fe]'
              }`}
            >
              <PanelRight size={16} />
            </button>
          )}
        </div>
      </header>

      <div
        className={`grid h-[calc(100vh-56px)] min-h-0 grid-cols-1 ${
          panelsHidden
            ? ''
            : compareMode
              ? 'dw-grid-2col'
              : 'dw-grid-2col dw-grid-3col'
        }`}
        style={{
          // CSS 변수: globals.css의 .dw-grid-2col / .dw-grid-3col 미디어 쿼리에서 사용
          ['--dw-left-panel' as string]: `${leftPanelWidth}px`,
          ['--dw-right-panel' as string]: `${rightPanelWidth}px`,
        }}
      >
        <button
          type="button"
          aria-label="브리프 패널 닫기 (overlay 클릭)"
          aria-hidden={!briefDrawerOpen}
          tabIndex={briefDrawerOpen ? 0 : -1}
          onClick={() => setBriefDrawerOpen(false)}
          className={`fixed inset-x-0 bottom-0 top-14 z-40 cursor-default bg-black/60 transition-opacity duration-200 ease-out md:hidden ${
            briefDrawerOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
        />
        <aside
          aria-label="AI 디자인 브리프 패널"
          aria-hidden={!briefDrawerOpen}
          className={`fixed bottom-0 left-0 top-14 z-40 flex min-h-0 w-[280px] flex-col border-r border-[#2a2e35] bg-[#16181c] shadow-xl transition-transform duration-200 ease-out md:relative md:z-auto md:w-auto md:translate-x-0 md:shadow-none md:transition-none ${
            briefDrawerOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          } ${panelsHidden ? 'md:hidden' : ''}`}
        >
          {/* 우측 가장자리 resize handle (md+에서만 보임) */}
          <button
            type="button"
            aria-label={`좌측 패널 폭 조정 (현재 ${leftPanelWidth}px)`}
            title="드래그로 폭 조정 — 더블클릭으로 260px 리셋"
            onMouseDown={(event) => {
              event.preventDefault()
              setResizingPanel('left')
            }}
            onDoubleClick={() => setLeftPanelWidth(260)}
            className={`absolute -right-0.5 top-0 z-30 hidden h-full w-1 cursor-col-resize bg-transparent transition-colors hover:bg-[#6366f1]/40 focus-visible:bg-[#6366f1]/60 focus-visible:outline-none md:block ${
              resizingPanel === 'left' ? 'bg-[#6366f1]/60' : ''
            }`}
          />
          <div
            role="tablist"
            aria-label="좌측 패널"
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return
              }
              event.preventDefault()
              const ids: Array<'brief' | 'layers'> = ['brief', 'layers']
              const idx = ids.indexOf(leftPanelTab)
              const nextIdx =
                event.key === 'ArrowRight'
                  ? (idx + 1) % ids.length
                  : (idx - 1 + ids.length) % ids.length
              const nextId = ids[nextIdx]
              if (!nextId) return
              setLeftPanelTab(nextId)
              const nextEl = event.currentTarget.querySelector<HTMLElement>(
                `#left-panel-tab-${nextId}`,
              )
              nextEl?.focus()
            }}
            className="flex shrink-0 items-stretch border-b border-[#2a2e35] bg-[#16181c]"
          >
            {([
              { id: 'brief' as const, label: '브리프', count: generations.length },
              { id: 'layers' as const, label: '레이어', count: filteredLayerItems.length },
            ]).map((tab) => {
              const isActive = leftPanelTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`left-panel-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`left-panel-tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setLeftPanelTab(tab.id)}
                  className={`relative -mb-px inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
                    isActive
                      ? 'border-[#6366f1] text-[#a5b4fc]'
                      : 'border-transparent text-[#898d97] hover:text-[#ebecef]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`tabular-nums text-[10px] font-medium ${
                      isActive ? 'text-[#a5b4fc]/70' : 'text-[#5b6069]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
          {leftPanelTab === 'brief' ? (
          <div
            role="tabpanel"
            id="left-panel-tabpanel-brief"
            aria-labelledby="left-panel-tab-brief"
            style={{ animation: 'dw-fade-in 150ms ease-out both' }}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
          >
          <div className="border-b border-[#2a2e35]">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-sm font-semibold text-[#a5b4fc]">AI 디자인</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#898d97]">
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
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-50 ${
                      compareMode
                        ? 'border-[#6366f1] bg-[#6366f1] text-white'
                        : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1]'
                    }`}
                  >
                    변형 비교
                  </button>
                ) : null}
              </div>
            </div>
            <div className="space-y-3 px-4 pb-4">
              <label className="block">
                <span className="text-[11px] font-semibold text-[#898d97]">
                  예제 fixture
                </span>
                <select
                  className="mt-1 h-9 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-2 text-xs text-[#ebecef] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
                  value={selectedFixture.id}
                  title={selectedFixture.description}
                  onChange={(event) => handleFixtureChange(event.target.value)}
                >
                  <optgroup label="기본">
                    {treeFixtures.map((fixture) => (
                      <option
                        key={fixture.id}
                        title={fixture.description}
                        value={fixture.id}
                      >
                        {fixture.name}
                      </option>
                    ))}
                  </optgroup>
                  {userFixtures.length > 0 ? (
                    <optgroup label="내 fixture">
                      {userFixtures.map((fixture) => (
                        <option key={fixture.id} value={fixture.id}>
                          {fixture.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </label>
              <div className="flex flex-wrap gap-1">
                {generations.map((entry) => {
                  const isActive = entry.id === activeGenerationId
                  const isPinned = entry.pinned === true
                  const isEditing = editingLabelId === entry.id
                  const displayLabel = entry.userLabel ?? entry.label
                  const generationTitle =
                    entry.brief?.intent ??
                    (entry.immutable ? '원본 fixture' : '생성 결과')
                  return (
                    <span key={entry.id} className="inline-flex items-center">
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          maxLength={30}
                          value={editingLabelDraft}
                          onChange={(event) =>
                            setEditingLabelDraft(event.target.value)
                          }
                          onBlur={handleCommitLabelEdit}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              handleCommitLabelEdit()
                            } else if (event.key === 'Escape') {
                              event.preventDefault()
                              handleCancelLabelEdit()
                            }
                          }}
                          className="rounded-l-md rounded-r-none border border-[#6366f1] bg-[#16181c] px-2.5 py-1 text-[11px] font-semibold text-[#ebecef] outline-none focus:ring-2 focus:ring-[#6366f1]/40"
                          style={{ width: '6.5rem' }}
                          placeholder="이름 (비우면 기본값)"
                        />
                      ) : (
                        <button
                          type="button"
                          title={`${generationTitle} (더블클릭으로 이름 변경)`}
                          aria-label={displayLabel}
                          aria-pressed={isActive}
                          aria-disabled={compareMode || undefined}
                          disabled={compareMode}
                          className={`${
                            entry.immutable
                              ? 'rounded-md'
                              : 'rounded-l-md rounded-r-none'
                          } border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                            isActive
                              ? 'border-[#6366f1] bg-[#6366f1] text-white'
                              : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1]'
                          }`}
                          onClick={() => handleSelectGeneration(entry.id)}
                          onDoubleClick={() => handleStartLabelEdit(entry)}
                        >
                          {displayLabel}
                        </button>
                      )}
                      {!entry.immutable ? (
                        <button
                          type="button"
                          title={
                            isPinned
                              ? '고정 해제 — 새 생성으로 밀려날 수 있습니다'
                              : '고정 — 새 생성으로 밀려나지 않게 보호'
                          }
                          aria-label={
                            isPinned
                              ? `${entry.label} 고정 해제`
                              : `${entry.label} 고정`
                          }
                          aria-pressed={isPinned}
                          disabled={compareMode}
                          className={`inline-flex items-center justify-center rounded-r-md rounded-l-none border border-l-0 px-1.5 py-1 leading-none transition disabled:opacity-50 ${
                            isPinned
                              ? 'border-[#4338ca] bg-[#1e1f3a] text-[#a5b4fc]'
                              : 'border-[#2a2e35] bg-[#16181c] text-[#5b6069] hover:border-[#4338ca] hover:text-[#c7d2fe]'
                          }`}
                          onClick={() => handleToggleGenerationPin(entry.id)}
                        >
                          <Pin
                            size={11}
                            className={isPinned ? 'fill-current' : ''}
                            aria-hidden="true"
                          />
                        </button>
                      ) : null}
                    </span>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-md border border-[#2a2e35] bg-[#16181c] px-3 py-2 font-semibold text-[#898d97] hover:border-[#6366f1] hover:text-[#c7d2fe] disabled:opacity-40"
                  onClick={handleSaveAsUserFixture}
                  disabled={compareMode}
                  title="활성 디자인을 사용자 fixture로 저장 — 다음 세션에서 예제 dropdown에 표시됩니다."
                >
                  fixture로 등록
                </button>
                {userFixtures.find((fx) => fx.id === selectedFixtureId) !==
                undefined ? (
                  <button
                    type="button"
                    className="rounded-md border border-[#7f1d1d] bg-[#16181c] px-3 py-2 font-semibold text-[#fca5a5] hover:bg-[#4a1f1f]"
                    onClick={() => handleDeleteUserFixture(selectedFixtureId)}
                    title="현재 선택된 사용자 fixture를 삭제합니다."
                  >
                    fixture 삭제
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-md border border-[#2a2e35] bg-[#16181c] px-3 py-2 font-semibold text-[#898d97] hover:border-[#6366f1] hover:text-[#c7d2fe] disabled:opacity-40"
                  onClick={handleExportActiveGeneration}
                  disabled={compareMode}
                  title="활성 디자인을 JSON 파일로 내보냅니다."
                >
                  내보내기
                </button>
                <label className="cursor-pointer rounded-md border border-[#2a2e35] bg-[#16181c] px-3 py-2 font-semibold text-[#898d97] hover:border-[#6366f1] hover:text-[#c7d2fe]">
                  불러오기
                  <input
                    type="file"
                    accept="application/json,.json"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? [])
                      event.target.value = ''
                      if (files.length > 0) {
                        void handleImportGenerationFiles(files)
                      }
                    }}
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#898d97]">
                    참고 이미지 (선택, {briefImageRefs.length}/{MAX_IMAGE_REFS})
                  </span>
                  {briefImageRefs.length > 0 ? (
                    <button
                      type="button"
                      className="text-[10px] text-[#5b6069] hover:text-[#c7d2fe]"
                      onClick={handleImageRefClear}
                    >
                      모두 지우기
                    </button>
                  ) : null}
                </div>
                {briefImageRefs.length > 0 ? (
                  <div className="space-y-1">
                    {briefImageRefs.map((ref, i) => {
                      const thumb = briefImageRefThumbnails[i] ?? null
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] p-2"
                        >
                          {thumb !== null ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={`참고 이미지 ${i + 1}`}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : null}
                          <div className="flex-1 space-y-1 text-[10px] text-[#898d97]">
                            <div className="flex flex-wrap gap-1">
                              {ref.colors.map((hex) => (
                                <span
                                  key={hex}
                                  className="inline-flex items-center gap-1 rounded bg-[#1d2025] px-1.5 py-0.5"
                                  title={hex}
                                >
                                  <span
                                    aria-hidden="true"
                                    className="inline-block h-2.5 w-2.5 rounded-full border border-[#2a2e35]"
                                    style={{ backgroundColor: hex }}
                                  />
                                  {hex}
                                </span>
                              ))}
                            </div>
                            {ref.aspectRatio !== undefined ? (
                              <div className="text-[#5b6069]">
                                비율 {ref.aspectRatio}
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="text-[10px] text-[#5b6069] hover:text-[#fca5a5]"
                            onClick={() => handleImageRefRemoveAt(i)}
                            title={`이미지 ${i + 1} 제거`}
                            aria-label={`참고 이미지 ${i + 1} 제거`}
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
                {briefImageRefs.length < MAX_IMAGE_REFS ? (
                  <label
                    className={`block rounded-md border border-dashed border-[#2a2e35] bg-[#16181c] px-3 py-2 text-center text-[11px] text-[#5b6069] ${
                      briefImageRefBusy || clarifyLoading || generateLoading
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:border-[#6366f1] hover:text-[#c7d2fe]'
                    }`}
                  >
                    {briefImageRefBusy
                      ? '이미지 분석 중…'
                      : briefImageRefs.length === 0
                        ? '이미지 파일 선택 (최대 3장, 각 5MB 이하)'
                        : '이미지 추가'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      disabled={
                        briefImageRefBusy || clarifyLoading || generateLoading
                      }
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? [])
                        event.target.value = ''
                        if (files.length > 0) {
                          void handleImageRefAddFiles(files)
                        }
                      }}
                    />
                  </label>
                ) : null}
                {briefImageRefError !== null ? (
                  <div className="text-[10px] text-[#fca5a5]" role="alert">
                    {briefImageRefError}
                  </div>
                ) : null}
              </div>

              {generateStage === 'intent' ? (
                <>
                  <label className="block">
                    <span className="text-xs font-semibold text-[#898d97]">
                      의도 *
                    </span>
                    <textarea
                      rows={4}
                      maxLength={500}
                      placeholder="이 페이지로 무엇을 보여주고 싶은가요? (⌘Enter — 질문 받기)"
                      className="mt-1 w-full resize-none rounded-md border border-[#2a2e35] bg-[#16181c] px-3 py-2 text-sm text-[#ebecef] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
                      value={briefIntent}
                      disabled={clarifyLoading || generateLoading}
                      onChange={(event) => {
                        setBriefIntent(event.target.value)
                        if (generateError !== null) setGenerateError(null)
                      }}
                      onKeyDown={(event) => {
                        if (
                          (event.metaKey || event.ctrlKey) &&
                          event.key === 'Enter' &&
                          !clarifyLoading &&
                          !generateLoading &&
                          briefIntent.trim().length > 0
                        ) {
                          event.preventDefault()
                          if (event.shiftKey) {
                            void handleGenerateTree()
                          } else {
                            void handleAskQuestions()
                          }
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="w-full rounded-md bg-[#6366f1] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50"
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
                    className="w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 py-2 text-xs font-semibold text-[#898d97] hover:border-[#6366f1] disabled:opacity-40"
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
                    <p className="text-[10px] text-[#898d97]">
                      선택한 디자인의 답변
                    </p>
                  ) : null}
                  <div className="rounded-md border border-[#2a2e35] bg-[#1d2025] p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#898d97]">
                        의도
                      </span>
                      <button
                        type="button"
                        className="text-[11px] text-[#a5b4fc] underline"
                        onClick={handleEditIntent}
                        disabled={clarifyLoading || generateLoading}
                      >
                        수정
                      </button>
                    </div>
                    <p className="text-xs text-[#ebecef]">{briefIntent}</p>
                  </div>

                  {clarifyTurns.length > 0 ? (
                    <div className="space-y-1">
                      {clarifyTurns.map((turn, turnIndex) => (
                        <details
                          key={turnIndex}
                          className="rounded-md border border-[#2a2e35] bg-[#16181c]"
                        >
                          <summary className="cursor-pointer px-2.5 py-1.5 text-[11px] text-[#898d97]">
                            이전 답변 {turnIndex + 1} ({turn.answers.length}개)
                          </summary>
                          <div className="space-y-0.5 border-t border-[#2a2e35] px-2.5 py-1.5">
                            {turn.answers.map((a) => (
                              <div key={a.questionId} className="text-[11px]">
                                <span className="font-semibold text-[#898d97]">
                                  {a.questionLabel}
                                </span>
                                <span className="text-[#898d97]">
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
                        <span className="text-xs font-semibold text-[#898d97]">
                          {question.label}
                        </span>
                        {question.hint !== undefined ? (
                          <p className="text-[10px] text-[#898d97]">
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
                                      ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
                                      : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1]'
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
                                      ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
                                      : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1]'
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
                            className="w-full resize-none rounded-md border border-[#2a2e35] bg-[#16181c] px-3 py-2 text-sm text-[#ebecef] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
                    <p className="rounded-md border border-[#2a2e35] bg-[#1e1f3a] px-2 py-1.5 text-[11px] text-[#a5b4fc]">
                      답변이 충분합니다. 이제 디자인을 생성할 수 있습니다.
                    </p>
                  ) : clarifyTurns.length < 2 && clarifyQuestions.length > 0 ? (
                    <button
                      type="button"
                      className="w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 py-2 text-xs font-semibold text-[#898d97] hover:border-[#6366f1] disabled:opacity-50"
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
                    <span className="text-xs font-semibold text-[#898d97]">
                      추가 메모 (선택)
                    </span>
                    <textarea
                      rows={2}
                      maxLength={300}
                      placeholder="브랜드 voice, 참조 사이트 등"
                      className="mt-1 w-full resize-none rounded-md border border-[#2a2e35] bg-[#16181c] px-3 py-2 text-sm text-[#ebecef] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
                      value={briefNotes}
                      disabled={generateLoading}
                      onChange={(event) => setBriefNotes(event.target.value)}
                    />
                  </label>

                  <div>
                    <span className="text-xs font-semibold text-[#898d97]">
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
                              ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
                              : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1]'
                          }`}
                          onClick={() => setBriefVariantCount(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {briefVariantCount > 1 ? (
                      <p className="mt-1 text-[10px] text-[#898d97]">
                        같은 브리프로 {briefVariantCount}개 변형을 동시 생성합니다.
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#6366f1] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50"
                    disabled={generateLoading}
                    onClick={() => void handleGenerateTree()}
                  >
                    {generateLoading ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"
                        />
                        <span>
                          {briefVariantCount > 1
                            ? `${briefVariantCount}개 생성 중…`
                            : '생성 중…'}
                        </span>
                      </>
                    ) : (
                      <span>
                        {briefVariantCount > 1
                          ? `디자인 ${briefVariantCount}개 생성`
                          : '디자인 생성'}
                      </span>
                    )}
                  </button>
                </>
              )}

              {generateError !== null ? (
                <p
                  role="status"
                  className="text-xs text-[#fca5a5]"
                  title={generateError}
                >
                  {generateError}
                </p>
              ) : null}
            </div>
          </div>
          </div>
          ) : null}
          {leftPanelTab === 'layers' ? (
          <div
            role="tabpanel"
            id="left-panel-tabpanel-layers"
            aria-labelledby="left-panel-tab-layers"
            style={{ animation: 'dw-fade-in 150ms ease-out both' }}
            className="flex min-h-0 flex-1 flex-col"
          >
          <div className="shrink-0 border-b border-[#2a2e35] px-2 py-2">
            <input
              type="search"
              value={layerQuery}
              onChange={(event) => setLayerQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && layerQuery !== '') {
                  event.preventDefault()
                  event.stopPropagation()
                  setLayerQuery('')
                }
              }}
              placeholder="레이어 검색 (Esc — 지우기)"
              aria-label="레이어 검색"
              className="h-8 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-2.5 text-xs text-[#ebecef] outline-none placeholder:text-[#5b6069] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
            />
          </div>
          {filteredLayerItems.length === 0 && layerQuery.trim() !== '' ? (
            <p className="px-4 py-6 text-center text-xs text-[#5b6069]">
              {`"${layerQuery}"에 일치하는 레이어가 없습니다.`}
            </p>
          ) : null}
          <nav
            className="flex-1 overflow-auto overscroll-contain p-2"
            onKeyDown={(event) => {
              if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
                return
              }
              const target = event.target
              if (!(target instanceof HTMLElement)) return
              const main = target.closest<HTMLElement>('[data-layer-row-main]')
              if (!main) return
              event.preventDefault()
              const buttons = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>(
                  '[data-layer-row-main]',
                ),
              )
              const idx = buttons.indexOf(main)
              if (idx < 0) return
              const nextIdx =
                event.key === 'ArrowDown' ? idx + 1 : idx - 1
              if (nextIdx < 0 || nextIdx >= buttons.length) return
              const nextEl = buttons[nextIdx]
              if (!nextEl) return
              nextEl.focus()
              const nextNodeId = nextEl.dataset.layerNodeId
              if (nextNodeId) setSelectedNodeId(nextNodeId)
            }}
          >
            {filteredLayerItems.map(({ node, depth }) => {
              const structureInfo = getStructureInfo(tree, node.id)
              const isRoot = structureInfo.isRoot
              const dropPosition =
                layerDropTarget?.nodeId === node.id
                  ? layerDropTarget.position
                  : null
              const isDragging = layerDrag?.nodeId === node.id
              const NodeTypeIcon = nodeTypeIcons[node.type]
              const isContainer = isContainerNode(node)
              const isCollapsed =
                isContainer && collapsedLayerNodeIds.has(node.id)

              return (
                <div
                  key={node.id}
                  data-layer-node-id={node.id}
                  className="relative py-0.5"
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => {
                    if (hoveredNodeId === node.id) {
                      setHoveredNodeId(null)
                    }
                  }}
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
                      <span className="h-0.5 flex-1 rounded bg-[#6366f1]" />
                      <span className="ml-2 rounded-full bg-[#6366f1] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                        여기에 놓기
                      </span>
                    </span>
                  ) : null}
                  <div
                    className={`group/layer-row relative flex items-center gap-1 rounded-md pr-2 text-sm transition ${
                      node.id === selectedNodeId
                        ? 'bg-[#1e1f3a] text-[#a5b4fc]'
                        : allSelectedNodeIds.has(node.id)
                          ? 'bg-[#1e1f3a]/70 text-[#a5b4fc]'
                          : hoveredNodeId === node.id
                            ? 'bg-[#1d2025] text-[#c5c8cf]'
                            : 'text-[#c5c8cf] hover:bg-[#1d2025]'
                    } ${isDragging ? 'opacity-50' : ''}`}
                    style={{ paddingLeft: 8 + depth * 14 }}
                  >
                    {node.id === selectedNodeId ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-1 left-0 w-[3px] rounded-full bg-[#6366f1]"
                      />
                    ) : null}
                    <button
                      type="button"
                      aria-label={
                        isRoot
                          ? `${node.id} 루트는 이동할 수 없습니다`
                          : `${node.id} 순서 이동`
                      }
                      className="flex h-8 w-7 shrink-0 items-center justify-center rounded text-[#5b6069] outline-none transition hover:bg-[#1d2025]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6366f1] disabled:cursor-not-allowed disabled:text-[#3a3f48] disabled:hover:bg-transparent"
                      disabled={isRoot}
                      draggable={!isRoot}
                      title={isRoot ? '루트는 이동할 수 없습니다' : '순서 이동'}
                      onDragEnd={clearLayerDragState}
                      onDragStart={(event) => handleLayerDragStart(node.id, event)}
                    >
                      <GripVertical aria-hidden="true" size={15} />
                    </button>
                    {isContainer ? (
                      <button
                        type="button"
                        aria-label={
                          isCollapsed
                            ? `${node.id} 자식 노드 펼치기`
                            : `${node.id} 자식 노드 접기`
                        }
                        aria-expanded={!isCollapsed}
                        onClick={() => toggleLayerCollapse(node.id)}
                        className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-[#5b6069] outline-none transition hover:bg-[#1d2025]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6366f1]"
                      >
                        {isCollapsed ? (
                          <ChevronRight aria-hidden="true" size={13} />
                        ) : (
                          <ChevronDown aria-hidden="true" size={13} />
                        )}
                      </button>
                    ) : (
                      <span aria-hidden="true" className="w-5 shrink-0" />
                    )}
                    <button
                      type="button"
                      data-layer-row-main
                      data-layer-node-id={node.id}
                      title={(() => {
                        const typeLabel = nodeTypeLabels[node.type]
                        if (node.type === 'text') {
                          return `${typeLabel} — ${node.content.slice(0, 80)}`
                        }
                        if (node.type === 'button') {
                          return `${typeLabel} — ${node.label}`
                        }
                        if (node.type === 'image') {
                          return `${typeLabel} — ${node.alt || '(alt 없음)'}`
                        }
                        return typeLabel
                      })()}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6366f1]"
                      onClick={(event) => {
                        // Shift = 범위 선택 (primary~target)
                        if (event.shiftKey) {
                          if (node.id === selectedNodeId) return
                          const allItems = flattenTree(tree.root)
                          const primaryIdx = allItems.findIndex(
                            (item) => item.node.id === selectedNodeId,
                          )
                          const targetIdx = allItems.findIndex(
                            (item) => item.node.id === node.id,
                          )
                          if (primaryIdx < 0 || targetIdx < 0) return
                          const [start, end] =
                            primaryIdx < targetIdx
                              ? [primaryIdx, targetIdx]
                              : [targetIdx, primaryIdx]
                          const range = allItems.slice(start, end + 1)
                          setAdditionalSelectedNodeIds(() => {
                            const next = new Set<string>()
                            for (const item of range) {
                              if (item.node.id !== selectedNodeId) {
                                next.add(item.node.id)
                              }
                            }
                            return next
                          })
                          return
                        }
                        // Cmd/Ctrl = 개별 토글
                        if (event.metaKey || event.ctrlKey) {
                          if (node.id === selectedNodeId) return
                          setAdditionalSelectedNodeIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(node.id)) {
                              next.delete(node.id)
                            } else {
                              next.add(node.id)
                            }
                            return next
                          })
                          return
                        }
                        setSelectedNodeId(node.id)
                      }}
                      onKeyDown={(event) => openKeyboardContextMenu(node.id, event)}
                    >
                      <NodeTypeIcon
                        aria-hidden="true"
                        size={13}
                        className="shrink-0 text-[#898d97]"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {highlightSearchMatch(node.id, layerQuery)}
                      </span>
                      {isContainer ? (
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-[10px] tabular-nums text-[#5b6069]"
                          title={`자식 ${node.children.length}개`}
                        >
                          {node.children.length}
                        </span>
                      ) : null}
                    </button>
                    <span className="flex shrink-0 items-center gap-1">
                      {/* visibility */}
                      {node.hidden === true ? (
                        <button
                          type="button"
                          title="숨김 해제"
                          aria-label="숨김 해제"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleToggleNodeVisibility(node)
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#a3741f] bg-[#3a2e0a] text-[#fbbf24] transition hover:border-[#6366f1] hover:text-[#c7d2fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6366f1]"
                        >
                          <EyeOff size={11} aria-hidden="true" />
                        </button>
                      ) : !isRoot ? (
                        <button
                          type="button"
                          title="숨기기"
                          aria-label="숨기기"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleToggleNodeVisibility(node)
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-[#5b6069] opacity-0 transition hover:bg-[#16181c] hover:text-[#898d97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6366f1] focus-visible:opacity-100 group-hover/layer-row:opacity-100"
                        >
                          <Eye size={11} aria-hidden="true" />
                        </button>
                      ) : null}
                      {/* selection */}
                      {node.pointerEvents === 'none' ? (
                        <button
                          type="button"
                          title="선택 제외 해제"
                          aria-label="선택 제외 해제"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleToggleNodeCanvasSelection(node)
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#a3741f] bg-[#3a2e0a] text-[#fbbf24] transition hover:border-[#6366f1] hover:text-[#c7d2fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6366f1]"
                        >
                          <Lock size={11} aria-hidden="true" />
                        </button>
                      ) : !isRoot ? (
                        <button
                          type="button"
                          title="선택에서 제외"
                          aria-label="선택에서 제외"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleToggleNodeCanvasSelection(node)
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-[#5b6069] opacity-0 transition hover:bg-[#16181c] hover:text-[#898d97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6366f1] focus-visible:opacity-100 group-hover/layer-row:opacity-100"
                        >
                          <Unlock size={11} aria-hidden="true" />
                        </button>
                      ) : null}
                      {/* container에는 hover 시 quick add 버튼 노출 */}
                      {isContainer ? (
                        <button
                          type="button"
                          title="텍스트 자식 추가"
                          aria-label={`${node.id}에 텍스트 자식 추가`}
                          onClick={(event) => {
                            event.stopPropagation()
                            handleAddLeafChild(node.id, 'text')
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-[#5b6069] opacity-0 transition hover:bg-[#16181c] hover:text-[#a5b4fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6366f1] focus-visible:opacity-100 group-hover/layer-row:opacity-100"
                        >
                          <Plus size={11} aria-hidden="true" />
                        </button>
                      ) : null}
                    </span>
                  </div>
                </div>
              )
            })}
          </nav>
          </div>
          ) : null}
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col bg-[#0d0e10]">
          {compareMode ? null : (
            <div className="flex h-10 shrink-0 items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-[#2a2e35] bg-[#16181c] px-3 lg:gap-3 lg:px-4 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-[#2a2e35]">
              <div className="flex shrink-0 items-center gap-2 lg:gap-3">
                <ViewportSwitcher
                  value={responsiveViewport}
                  onChange={setResponsiveViewport}
                />
                <span className="h-4 w-px shrink-0 bg-[#2a2e35]" aria-hidden="true" />
                <CanvasZoomControl
                  value={canvasZoom}
                  onChange={setCanvasZoom}
                  onFit={handleCanvasFit}
                />
                <span className="h-4 w-px shrink-0 bg-[#2a2e35]" aria-hidden="true" />
                <button
                  type="button"
                  aria-label={
                    canvasGridSize === 0
                      ? '그리드 8px로 켜기'
                      : `그리드 ${canvasGridSize}px → 다음 사이즈`
                  }
                  aria-pressed={canvasGridSize > 0}
                  title="그리드 사이즈 cycle (off / 8 / 16 / 24 px)"
                  onClick={() =>
                    setCanvasGridSize((s) => {
                      if (s === 0) return 8
                      if (s === 8) return 16
                      if (s === 16) return 24
                      return 0
                    })
                  }
                  className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
                    canvasGridSize > 0
                      ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
                      : 'border-[#2a2e35] bg-[#16181c] text-[#898d97] hover:border-[#6366f1] hover:text-[#c7d2fe]'
                  }`}
                >
                  <LayoutGrid size={13} aria-hidden="true" />
                  <span className="tabular-nums">
                    {canvasGridSize === 0 ? '그리드' : `${canvasGridSize}px`}
                  </span>
                </button>
              </div>
            </div>
          )}
          <div
            ref={canvasScrollRef}
            className={`min-h-0 flex-1 overflow-auto overscroll-contain ${
              isPanning
                ? 'cursor-grabbing select-none [&_*]:!cursor-grabbing'
                : isSpacePressed
                  ? 'cursor-grab select-none [&_*]:!cursor-grab'
                  : ''
            }`}
            onMouseDown={(event) => {
              // 스페이스+드래그 또는 가운데 버튼(button=1) → 패닝
              const isMiddleButton = event.button === 1
              if (!isSpacePressed && !isMiddleButton) return
              event.preventDefault()
              const el = canvasScrollRef.current
              if (!el) return
              setIsPanning(true)
              panStateRef.current = {
                startX: event.clientX,
                startY: event.clientY,
                scrollLeft: el.scrollLeft,
                scrollTop: el.scrollTop,
              }
            }}
            onClick={(event) => {
              // 패닝 중이면 클릭 무시 (드래그 끝난 mouseup이 click을 발생시킬 수 있음)
              if (isPanning || isSpacePressed) return
              // CanvasNode들은 stopPropagation 처리되므로 여기까지 도달하면 빈 영역 클릭.
              // 단 toolbar 등 별도 영역은 형제 노드라 여기에 안 들어옴.
              if (compareMode) return
              if (event.target !== event.currentTarget) {
                // 캔버스 padding/wrapper 클릭만 deselect — viewport 카드(border) 안 클릭은 노드가 처리
                const target = event.target
                if (target instanceof Element) {
                  const nodeElement = target.closest<HTMLElement>(
                    '[data-dworks-node-id]',
                  )
                  if (nodeElement) return
                }
              }
              if (selectedNodeId !== tree.root.id) {
                setSelectedNodeId(tree.root.id)
              }
            }}
            onContextMenu={(event) => {
              if (compareMode) return
              const target = event.target
              if (!(target instanceof Element)) {
                return
              }

              const nodeElement = target.closest<HTMLElement>('[data-dworks-node-id]')
              const nodeId = nodeElement?.dataset.dworksNodeId
              if (!nodeId) {
                // 빈 영역 우클릭 → global context menu (canvas-wide 액션)
                event.preventDefault()
                setContextMenu(null)
                setGlobalContextMenu({ x: event.clientX, y: event.clientY })
                return
              }

              setGlobalContextMenu(null)
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
              <p className="text-xs text-[#898d97]">
                비교할 디자인을 선택하면 편집 화면으로 돌아갑니다.
              </p>
              <VariantCompareGrid
                generations={generations}
                activeGenerationId={activeGenerationId}
                viewport={responsiveViewport}
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
              style={{
                minWidth: selectedViewportPreset.width * canvasZoom + 64,
                ...(canvasGridSize > 0
                  ? {
                      backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                      backgroundSize: `${canvasGridSize}px ${canvasGridSize}px`,
                    }
                  : {}),
              }}
            >
              <div
                className="mx-auto border border-[var(--dw-border)] bg-[var(--dw-surface)] text-[var(--dw-text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
                style={{
                  ...canvasStyle,
                  width: selectedViewportPreset.width,
                  zoom: canvasZoom,
                }}
              >
                <CanvasViewportContext.Provider value={responsiveViewport}>
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
                </CanvasViewportContext.Provider>
              </div>
            </div>
          )}
          </div>
          {compareMode ? null : (
            <div className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-[#2a2e35] bg-[#16181c] px-4 text-[11px] text-[#5b6069]">
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-[#898d97]">
                  {Math.round(canvasZoom * 100)}%
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {selectedViewportPreset.width}px {selectedViewportPreset.label}
                </span>
                {canvasGridSize > 0 ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">grid {canvasGridSize}px</span>
                  </>
                ) : null}
                {isSpacePressed ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#a5b4fc]">Space → drag로 panning</span>
                  </>
                ) : null}
              </div>
              <div className="flex min-w-0 shrink items-center gap-2">
                {additionalSelectedNodeIds.size > 0 ? (
                  <span className="text-[#a5b4fc]">
                    +{additionalSelectedNodeIds.size}개 선택
                  </span>
                ) : null}
                {selectedNodeSize !== null && selectedNodeId !== tree.root.id ? (
                  <span
                    className="hidden tabular-nums text-[10px] text-[#898d97] sm:inline"
                    title={`logical 크기: ${selectedNodeSize.width}×${selectedNodeSize.height} px (zoom 무관)`}
                  >
                    {selectedNodeSize.width}×{selectedNodeSize.height}
                  </span>
                ) : null}
                {hoveredNodeId !== null && hoveredNodeId !== selectedNodeId ? (
                  <span
                    className="hidden truncate font-mono text-[10px] text-[#5b6069]/80 sm:inline"
                    title={`hover: ${hoveredNodeId}`}
                  >
                    ↳ {hoveredNodeId}
                  </span>
                ) : null}
                <span className="truncate font-mono text-[10px]" title={selectedNodeId}>
                  {selectedNodeId === tree.root.id ? '— root —' : selectedNodeId}
                </span>
              </div>
            </div>
          )}
        </section>

        {compareMode ? null : (
        <>
        <button
          type="button"
          aria-label="속성 패널 닫기 (overlay 클릭)"
          aria-hidden={!inspectorDrawerOpen}
          tabIndex={inspectorDrawerOpen ? 0 : -1}
          onClick={() => setInspectorDrawerOpen(false)}
          className={`fixed inset-x-0 bottom-0 top-14 z-40 cursor-default bg-black/60 transition-opacity duration-200 ease-out xl:hidden ${
            inspectorDrawerOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
        />
        <aside
          aria-label="속성 패널"
          aria-hidden={!inspectorDrawerOpen}
          className={`fixed bottom-0 right-0 top-14 z-40 block min-h-0 w-[360px] overflow-hidden border-l border-[#2a2e35] bg-[#16181c] shadow-xl transition-transform duration-200 ease-out xl:relative xl:z-auto xl:block xl:w-auto xl:translate-x-0 xl:shadow-none xl:transition-none ${
            inspectorDrawerOpen
              ? 'translate-x-0'
              : 'translate-x-full xl:translate-x-0'
          } ${panelsHidden ? 'xl:hidden' : ''}`}
        >
          {/* 좌측 가장자리 resize handle (xl+에서만 보임) */}
          <button
            type="button"
            aria-label={`우측 패널 폭 조정 (현재 ${rightPanelWidth}px)`}
            title="드래그로 폭 조정 — 더블클릭으로 360px 리셋"
            onMouseDown={(event) => {
              event.preventDefault()
              setResizingPanel('right')
            }}
            onDoubleClick={() => setRightPanelWidth(360)}
            className={`absolute -left-0.5 top-0 z-30 hidden h-full w-1 cursor-col-resize bg-transparent transition-colors hover:bg-[#6366f1]/40 focus-visible:bg-[#6366f1]/60 focus-visible:outline-none xl:block ${
              resizingPanel === 'right' ? 'bg-[#6366f1]/60' : ''
            }`}
          />
          {additionalSelectedNodeIds.size > 0 ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#6366f1]/40 bg-[#1e1f3a] px-4 py-2 text-xs font-semibold text-[#a5b4fc]">
              <span>
                +{additionalSelectedNodeIds.size}개 다중 선택됨 (primary
                속성만 표시)
              </span>
              <button
                type="button"
                onClick={() => setAdditionalSelectedNodeIds(new Set())}
                className="inline-flex items-center gap-1 rounded border border-[#6366f1]/40 px-1.5 py-0.5 text-[10px] font-semibold transition-colors hover:bg-[#2a2e35]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1]"
                title="다중 선택 해제 (Esc)"
              >
                <X size={10} aria-hidden="true" />
                해제
              </button>
            </div>
          ) : null}
          <NodeInspector
            node={selectedNode}
            tree={tree}
            effectiveStyle={effectiveStyle}
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
            colorPreset={colorPreset}
          />
        </aside>
        </>
        )}
      </div>
      {contextMenu && contextMenuNode && contextMenuStructureInfo ? (
        <NodeContextMenu
          node={contextMenuNode}
          position={contextMenu}
          structureInfo={contextMenuStructureInfo}
          onAddLeafChild={(childType) =>
            handleAddLeafChild(contextMenuNode.id, childType)
          }
          onAddContainerChild={(containerType) =>
            handleAddContainerChild(contextMenuNode.id, containerType)
          }
          onAddLeafSibling={(childType) =>
            handleAddLeafSibling(contextMenuNode.id, childType)
          }
          onAddContainerSibling={(containerType) =>
            handleAddContainerSibling(contextMenuNode.id, containerType)
          }
          onChangeContainerType={(nextType) =>
            handleChangeContainerType(contextMenuNode.id, nextType)
          }
          onChangeLeafType={(nextType) =>
            handleChangeLeafType(contextMenuNode.id, nextType)
          }
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
      {globalContextMenu ? (
        <GlobalContextMenu
          position={globalContextMenu}
          canvasZoom={canvasZoom}
          canvasGridSize={canvasGridSize}
          panelsHidden={panelsHidden}
          hasSelection={selectedNodeId !== tree.root.id}
          onClose={() => setGlobalContextMenu(null)}
          onDeselect={() => {
            setSelectedNodeId(tree.root.id)
            setAdditionalSelectedNodeIds(new Set())
          }}
          onFit={handleCanvasFit}
          onZoomReset={() => setCanvasZoom(1)}
          onZoomToSelection={handleZoomToSelection}
          onToggleGrid={() =>
            setCanvasGridSize((s) => {
              if (s === 0) return 16
              return 0
            })
          }
          onTogglePanels={() => setPanelsHidden((v) => !v)}
        />
      ) : null}
      {shortcutHelpOpen ? (
        <>
          <button
            type="button"
            aria-label="단축키 도움말 닫기"
            onClick={() => setShortcutHelpOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/60"
            style={{ animation: 'dw-fade-in 180ms ease-out both' }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcut-help-title"
            className="fixed bottom-6 right-6 z-50 w-[22rem] max-w-[calc(100vw-3rem)] rounded-lg border border-[#2a2e35] bg-[#1d2025] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            style={{ animation: 'dw-fade-up 200ms ease-out both' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="shortcut-help-title"
                className="text-sm font-semibold text-[#ebecef]"
              >
                키보드 단축키
              </h2>
              <button
                type="button"
                aria-label="닫기"
                ref={shortcutHelpCloseRef}
                onClick={() => setShortcutHelpOpen(false)}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[#898d97] hover:bg-[#2a2e35] hover:text-[#ebecef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                {
                  category: '편집',
                  items: [
                    { keys: ['⌘', 'Z'], label: '실행 취소' },
                    { keys: ['⌘', '⇧', 'Z'], label: '다시 실행' },
                    { keys: ['⌘', 'D'], label: '복제' },
                    { keys: ['Delete'], label: '삭제' },
                  ],
                },
                {
                  category: '노드 이동',
                  items: [
                    { keys: ['⌘', '↑'], label: '형제 위로 이동' },
                    { keys: ['⌘', '↓'], label: '형제 아래로 이동' },
                    { keys: ['↑', '↓'], label: '레이어 사이 이동' },
                    { keys: ['←', '→'], label: '탭 전환' },
                  ],
                },
                {
                  category: '브리프 입력',
                  items: [
                    { keys: ['⌘', 'Enter'], label: '질문 받기' },
                    { keys: ['⌘', '⇧', 'Enter'], label: '바로 생성' },
                  ],
                },
                {
                  category: '다중 선택',
                  items: [
                    { keys: ['⇧', 'click'], label: '범위 선택 (primary ~ target)' },
                    { keys: ['⌘', 'click'], label: '개별 토글' },
                    { keys: ['⌘', 'A'], label: '전체 선택' },
                  ],
                },
                {
                  category: '캔버스 패닝 / 줌',
                  items: [
                    { keys: ['Space', '+ drag'], label: '캔버스 panning' },
                    { keys: ['middle', 'drag'], label: '캔버스 panning (대체)' },
                    { keys: ['⌘', 'wheel'], label: '캔버스 줌 (트랙패드 pinch도 OK)' },
                    { keys: ['⌘', '+'], label: '줌 인 10%' },
                    { keys: ['⌘', '-'], label: '줌 아웃 10%' },
                    { keys: ['⌘', '0'], label: '줌 100% 리셋' },
                    { keys: ['⌘', '1'], label: '화면에 맞춤 (fit to screen)' },
                    { keys: ['⌘', '2'], label: '선택 노드를 화면 중앙에 fit' },
                  ],
                },
                {
                  category: '선택 / 도움말',
                  items: [
                    { keys: ['Esc'], label: '선택 해제 / 닫기' },
                    { keys: ['?'], label: '이 도움말 토글' },
                    { keys: ['⌘', '\\'], label: '좌/우 패널 hide (집중 모드)' },
                  ],
                },
              ].map((group) => (
                <div key={group.category}>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#5b6069]">
                    {group.category}
                  </div>
                  <dl className="space-y-1">
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <dt className="text-[#898d97]">{item.label}</dt>
                        <dd className="flex items-center gap-1">
                          {item.keys.map((k, i) => (
                            <kbd
                              key={`${item.label}-${i}`}
                              className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-[#2a2e35] bg-[#16181c] px-1.5 text-[11px] font-semibold text-[#c5c8cf]"
                            >
                              {k}
                            </kbd>
                          ))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-[#5b6069]">
              입력 필드에서는 단축키가 비활성화됩니다.
            </p>
          </div>
        </>
      ) : null}
    </main>
    </CanvasHoverContext.Provider>
    </CanvasSelectionContext.Provider>
  )
}

interface HistoryButtonProps {
  ariaLabel: string
  disabled: boolean
  icon: LucideIcon
  onClick: () => void
  shortcut?: string
}

function HistoryButton({
  ariaLabel,
  disabled,
  icon: Icon,
  onClick,
  shortcut,
}: HistoryButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={shortcut ? `${ariaLabel} (${shortcut})` : ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-[#2a2e35] bg-[#16181c] text-[#c5c8cf] transition hover:bg-[#1d2025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#16181c]"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
    </button>
  )
}

function DworksLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/dworks-logo.png"
        alt="Dworks"
        width={32}
        height={32}
        priority
        className="h-8 w-8 rounded-md object-contain"
      />
      <div className="hidden lg:block">
        <h1 className="text-base font-semibold leading-tight">Dworks</h1>
        <p className="text-[11px] text-[#5b6069]">디자인 편집기</p>
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
    <div className="flex shrink-0 items-center gap-2 text-xs text-[#898d97]">
      <div
        role="group"
        aria-label="캔버스 화면 폭"
        className="flex h-8 rounded-md border border-[#2a2e35] bg-[#1d2025] p-0.5"
      >
        {responsiveViewportOptions.map((viewport) => {
          const preset = responsiveViewportPresets[viewport]
          const isSelected = viewport === value

          return (
            <button
              key={viewport}
              type="button"
              aria-pressed={isSelected}
              title={`${preset.label} (${preset.width}px)`}
              className={`shrink-0 rounded px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] lg:px-3 ${
                isSelected
                  ? 'bg-[#2a2e35] text-[#ebecef] shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                  : 'text-[#898d97] hover:bg-[#2a2e35]/50 hover:text-[#c5c8cf]'
              }`}
              onClick={() => onChange(viewport)}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
      <span className="hidden h-7 shrink-0 items-center rounded-md border border-[#2a2e35] bg-[#16181c] px-2 text-xs font-semibold tabular-nums text-[#c5c8cf] xl:inline-flex">
        {selectedPreset.width}px
      </span>
    </div>
  )
}

const CANVAS_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const

interface CanvasZoomControlProps {
  value: number
  onChange: (next: number) => void
  onFit?: () => void
}

function CanvasZoomControl({ value, onChange, onFit }: CanvasZoomControlProps) {
  function step(direction: 1 | -1): void {
    const idx = CANVAS_ZOOM_LEVELS.findIndex((z) => z === value)
    if (idx < 0) {
      // 현재 값이 preset 밖이면 가장 가까운 preset으로 우선 정렬
      const nearest = CANVAS_ZOOM_LEVELS.reduce((best, z) =>
        Math.abs(z - value) < Math.abs(best - value) ? z : best,
      )
      onChange(nearest)
      return
    }
    const nextIdx = Math.max(
      0,
      Math.min(CANVAS_ZOOM_LEVELS.length - 1, idx + direction),
    )
    const nextValue = CANVAS_ZOOM_LEVELS[nextIdx]
    if (nextValue !== undefined) onChange(nextValue)
  }

  const percent = Math.round(value * 100)
  const minZoom = CANVAS_ZOOM_LEVELS[0] ?? 0.25
  const maxZoom = CANVAS_ZOOM_LEVELS[CANVAS_ZOOM_LEVELS.length - 1] ?? 2

  return (
    <div
      role="group"
      aria-label="캔버스 확대/축소"
      className="flex h-8 shrink-0 items-center rounded-md border border-[#2a2e35] bg-[#16181c]"
    >
      <button
        type="button"
        aria-label="축소"
        className="flex h-full w-8 items-center justify-center text-sm font-semibold text-[#c5c8cf] hover:bg-[#2a2e35] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6366f1]"
        onClick={() => step(-1)}
        disabled={value <= minZoom}
      >
        −
      </button>
      <button
        type="button"
        aria-label="100%로 재설정"
        className="min-w-14 px-2 text-xs font-semibold tabular-nums text-[#ebecef] hover:bg-[#2a2e35]"
        onClick={() => onChange(1)}
        title="100%로 재설정"
      >
        {percent}%
      </button>
      <button
        type="button"
        aria-label="확대"
        className="flex h-full w-8 items-center justify-center text-sm font-semibold text-[#c5c8cf] hover:bg-[#2a2e35] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6366f1]"
        onClick={() => step(1)}
        disabled={value >= maxZoom}
      >
        +
      </button>
      {onFit ? (
        <button
          type="button"
          aria-label="화면에 맞춤"
          title="화면에 맞춤 (⌘1)"
          className="flex h-full items-center justify-center border-l border-[#2a2e35] px-2 text-[10px] font-semibold uppercase tracking-wide text-[#898d97] hover:bg-[#2a2e35] hover:text-[#ebecef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6366f1]"
          onClick={onFit}
        >
          fit
        </button>
      ) : null}
    </div>
  )
}

interface NodeContextMenuProps {
  node: TreeNode
  onAddLeafChild: (childType: LeafNodeType) => void
  onAddContainerChild: (containerType: ContainerNodeType) => void
  onAddLeafSibling: (childType: LeafNodeType) => void
  onAddContainerSibling: (containerType: ContainerNodeType) => void
  onChangeContainerType: (nextType: ContainerNodeType) => void
  onChangeLeafType: (nextType: LeafNodeType) => void
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
  onAddLeafChild,
  onAddContainerChild,
  onAddLeafSibling,
  onAddContainerSibling,
  onChangeContainerType,
  onChangeLeafType,
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

  const NodeTypeIcon = nodeTypeIcons[node.type]
  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${node.id} 컨텍스트 메뉴`}
      className="fixed z-50 min-w-56 rounded-md border border-[#2a2e35] bg-[#1d2025] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
      style={{
        left: position.x,
        top: position.y,
        animation: 'dw-fade-up 140ms ease-out both',
      }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
    >
      <div className="mb-1 flex items-center gap-2 border-b border-[#2a2e35] px-3 pb-2 pt-1">
        <NodeTypeIcon
          aria-hidden="true"
          size={13}
          className="shrink-0 text-[#898d97]"
        />
        <span className="text-xs font-semibold text-[#ebecef]">
          {nodeTypeLabels[node.type]}
        </span>
        <span className="ml-auto truncate text-[11px] text-[#5b6069]">
          {node.id}
        </span>
      </div>
      <ContextMenuButton
        disabled={!canMoveUp}
        onClick={onMoveUp}
        shortcut="⌘↑"
      >
        위로 이동
      </ContextMenuButton>
      <ContextMenuButton
        disabled={!canMoveDown}
        onClick={onMoveDown}
        shortcut="⌘↓"
      >
        아래로 이동
      </ContextMenuButton>
      <ContextMenuButton
        disabled={!canEditStructure}
        onClick={onDuplicate}
        shortcut="⌘D"
      >
        복제
      </ContextMenuButton>
      <ContextMenuButton
        disabled={!canEditStructure}
        onClick={onDelete}
        shortcut="Del"
        tone="danger"
      >
        삭제
      </ContextMenuButton>
      <div className="my-1 h-px bg-[#2a2e35]" role="separator" />
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
      {!structureInfo.isRoot ? (
        <>
          <div className="my-1 h-px bg-[#2a2e35]" role="separator" />
          <ContextMenuButton onClick={() => onAddLeafSibling('text')}>
            다음에 텍스트 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddLeafSibling('image')}>
            다음에 이미지 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddContainerSibling('section')}>
            다음에 섹션 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddContainerSibling('card')}>
            다음에 카드 추가
          </ContextMenuButton>
        </>
      ) : null}
      {node.type === 'text' || node.type === 'button' || node.type === 'image' ? (
        <>
          <div className="my-1 h-px bg-[#2a2e35]" role="separator" />
          <ContextMenuButton
            disabled={node.type === 'text'}
            onClick={() => onChangeLeafType('text')}
          >
            텍스트로 변경
          </ContextMenuButton>
          <ContextMenuButton
            disabled={node.type === 'image'}
            onClick={() => onChangeLeafType('image')}
          >
            이미지로 변경
          </ContextMenuButton>
          <ContextMenuButton
            disabled={node.type === 'button'}
            onClick={() => onChangeLeafType('button')}
          >
            버튼으로 변경
          </ContextMenuButton>
        </>
      ) : null}
      {node.type === 'section' ||
      node.type === 'hero' ||
      node.type === 'card' ||
      node.type === 'list' ||
      node.type === 'form' ? (
        <>
          <div className="my-1 h-px bg-[#2a2e35]" role="separator" />
          <ContextMenuButton onClick={() => onAddLeafChild('text')}>
            텍스트 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddLeafChild('button')}>
            버튼 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddLeafChild('image')}>
            이미지 추가
          </ContextMenuButton>
          <div className="my-1 h-px bg-[#2a2e35]" role="separator" />
          <ContextMenuButton onClick={() => onAddContainerChild('section')}>
            섹션 그룹 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddContainerChild('card')}>
            카드 그룹 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddContainerChild('list')}>
            목록 그룹 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddContainerChild('hero')}>
            히어로 그룹 추가
          </ContextMenuButton>
          <ContextMenuButton onClick={() => onAddContainerChild('form')}>
            폼 그룹 추가
          </ContextMenuButton>
          <div className="my-1 h-px bg-[#2a2e35]" role="separator" />
          <ContextMenuButton
            disabled={node.type === 'section'}
            onClick={() => onChangeContainerType('section')}
          >
            섹션으로 변경
          </ContextMenuButton>
          <ContextMenuButton
            disabled={node.type === 'card'}
            onClick={() => onChangeContainerType('card')}
          >
            카드로 변경
          </ContextMenuButton>
          <ContextMenuButton
            disabled={node.type === 'list'}
            onClick={() => onChangeContainerType('list')}
          >
            목록으로 변경
          </ContextMenuButton>
        </>
      ) : null}
    </div>
  )
}

interface GlobalContextMenuProps {
  position: { x: number; y: number }
  canvasZoom: number
  canvasGridSize: number
  panelsHidden: boolean
  hasSelection: boolean
  onClose: () => void
  onDeselect: () => void
  onFit: () => void
  onZoomReset: () => void
  onZoomToSelection: () => void
  onToggleGrid: () => void
  onTogglePanels: () => void
}

function GlobalContextMenu({
  position,
  canvasZoom,
  canvasGridSize,
  panelsHidden,
  hasSelection,
  onClose,
  onDeselect,
  onFit,
  onZoomReset,
  onZoomToSelection,
  onToggleGrid,
  onTogglePanels,
}: GlobalContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const firstItem = getContextMenuItems(menuRef.current)[0]
    firstItem?.focus()
    function handlePointerDown(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!menuRef.current?.contains(target)) onClose()
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
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = getContextMenuItems(menuRef.current)
    if (items.length === 0) return
    const currentIndex = items.findIndex(
      (item) => item === document.activeElement,
    )
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
      aria-label="캔버스 컨텍스트 메뉴"
      className="fixed z-50 min-w-56 rounded-md border border-[#2a2e35] bg-[#1d2025] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
      style={{
        left: position.x,
        top: position.y,
        animation: 'dw-fade-up 140ms ease-out both',
      }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
    >
      <div className="mb-1 border-b border-[#2a2e35] px-3 pb-2 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5b6069]">
          캔버스
        </span>
      </div>
      <ContextMenuButton
        disabled={!hasSelection}
        onClick={() => {
          onDeselect()
          onClose()
        }}
        shortcut="Esc"
      >
        선택 해제
      </ContextMenuButton>
      <ContextMenuButton
        disabled={!hasSelection}
        onClick={() => {
          onZoomToSelection()
          onClose()
        }}
        shortcut="⌘2"
      >
        선택 노드를 화면 중앙에
      </ContextMenuButton>
      <div className="my-1 h-px bg-[#2a2e35]" role="separator" />
      <ContextMenuButton
        onClick={() => {
          onFit()
          onClose()
        }}
        shortcut="⌘1"
      >
        화면에 맞춤
      </ContextMenuButton>
      <ContextMenuButton
        onClick={() => {
          onZoomReset()
          onClose()
        }}
        disabled={canvasZoom === 1}
        shortcut="⌘0"
      >
        줌 100% 리셋
      </ContextMenuButton>
      <div className="my-1 h-px bg-[#2a2e35]" role="separator" />
      <ContextMenuButton
        checked={canvasGridSize > 0}
        onClick={() => {
          onToggleGrid()
          onClose()
        }}
        roleType="menuitemcheckbox"
      >
        그리드 표시
      </ContextMenuButton>
      <ContextMenuButton
        checked={!panelsHidden}
        onClick={() => {
          onTogglePanels()
          onClose()
        }}
        roleType="menuitemcheckbox"
        shortcut="⌘\\"
      >
        좌/우 패널 표시
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
  shortcut?: string
  tone?: 'neutral' | 'danger'
}

function ContextMenuButton({
  checked,
  children,
  disabled = false,
  onClick,
  roleType = 'menuitem',
  shortcut,
  tone = 'neutral',
}: ContextMenuButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-[#fca5a5] hover:bg-[#3a1717] focus-visible:bg-[#3a1717]'
      : 'text-[#c5c8cf] hover:bg-[#2a2e35] focus-visible:bg-[#2a2e35]'

  return (
    <button
      type="button"
      role={roleType}
      aria-checked={roleType === 'menuitemcheckbox' ? checked : undefined}
      className={`flex min-h-9 w-full items-center justify-between gap-3 rounded px-3 text-left text-sm font-semibold outline-none transition disabled:cursor-not-allowed disabled:text-[#5b6069] disabled:hover:bg-transparent ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span>{children}</span>
      {roleType === 'menuitemcheckbox' ? (
        <span className="text-xs text-[#a5b4fc]">{checked ? '켬' : '끔'}</span>
      ) : shortcut ? (
        <span className="text-[11px] font-medium tabular-nums text-[#5b6069]">
          {shortcut}
        </span>
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
const CanvasViewportContext = createContext<ResponsiveViewport>('desktop')

interface CanvasHoverContextValue {
  hoveredNodeId: string | null
  setHoveredNodeId: (id: string | null) => void
}
const CanvasHoverContext = createContext<CanvasHoverContextValue>({
  hoveredNodeId: null,
  setHoveredNodeId: () => {},
})

interface CanvasSelectionContextValue {
  primarySelectedId: string
  allSelectedIds: ReadonlySet<string>
  toggleAdditional: (id: string) => void
  // Shift+click 범위 선택: primary부터 target까지 (트리 flat 순서 기준)
  selectRange: (id: string) => void
  // 캔버스 panning 활성 시 노드 click을 무시 (Space drag 시 selection 변경 방지)
  isPanActive: boolean
}
const CanvasSelectionContext = createContext<CanvasSelectionContextValue>({
  primarySelectedId: '',
  allSelectedIds: new Set(),
  toggleAdditional: () => {},
  selectRange: () => {},
  isPanActive: false,
})

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
  const viewport = useContext(CanvasViewportContext)

  if (node.hidden === true) {
    return null
  }

  const resolvedSpacing = resolveResponsiveSpacing(node.spacing, viewport)
  const resolvedLayout = resolveResponsiveLayout(node.layout, viewport)
  const boxSpacingStyle = getBoxSpacingStyle(resolvedSpacing)
  const gapSpacingStyle = getGapSpacingStyle(resolvedSpacing)
  const containerSpacingStyle = getContainerSpacingStyle(resolvedSpacing)
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
  const layoutStyle = getLayoutStyle(resolvedLayout)
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
      const isPageShellSection =
        node.role !== undefined ||
        node.layout?.direction === 'column'
      const sectionClass = isPageShellSection
        ? 'flex flex-col'
        : 'flex flex-col gap-8 p-10'

      if (node.role === 'banner' && viewport !== 'desktop') {
        return (
          <MobileBannerSection
            node={node}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
            inheritedTextColor={effectiveTextColor}
            boxStyle={boxStyle}
            childLayoutStyle={childLayoutStyle}
          />
        )
      }
      if (hasLayoutOverride(node.layout)) {
        return (
          <SelectableNode
            node={node}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          >
            <section
              className={sectionClass}
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
          <section className={sectionClass} style={boxStyle}>
            {firstChild ? (
              <CanvasNode
                node={firstChild}
                inheritedTextColor={effectiveTextColor}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
              />
            ) : null}
            {node.layoutIntent === 'grid' ? (
              <div
                className={`grid ${
                  viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'
                } gap-8`}
                style={gapSpacingStyle}
              >
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
              hasImage && viewport !== 'mobile'
                ? 'grid-cols-[1.05fr_0.95fr]'
                : 'grid-cols-1'
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
              <div className="flex min-w-0 flex-col gap-4">
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
      className="pointer-events-auto absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-md border border-[#2a2e35] bg-[#1d2025] px-1 py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    >
      <CanvasToolbarButton
        ariaLabel="위로 이동"
        shortcut="⌘↑"
        disabled={!canMoveUp}
        icon={ArrowUp}
        onClick={onMoveUp}
      />
      <CanvasToolbarButton
        ariaLabel="아래로 이동"
        shortcut="⌘↓"
        disabled={!canMoveDown}
        icon={ArrowDown}
        onClick={onMoveDown}
      />
      <CanvasToolbarButton
        ariaLabel="복제"
        shortcut="⌘D"
        icon={Copy}
        onClick={onDuplicate}
      />
      <CanvasToolbarButton
        ariaLabel="삭제"
        shortcut="Del"
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
  shortcut?: string
  tone?: 'neutral' | 'danger'
}

function CanvasToolbarButton({
  ariaLabel,
  disabled = false,
  icon: Icon,
  onClick,
  shortcut,
  tone = 'neutral',
}: CanvasToolbarButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-[#fca5a5] hover:bg-[#3a1717] focus-visible:bg-[#3a1717]'
      : 'text-[#c5c8cf] hover:bg-[#2a2e35] focus-visible:bg-[#2a2e35]'

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={shortcut ? `${ariaLabel} (${shortcut})` : ariaLabel}
      className={`inline-flex h-6 w-6 items-center justify-center rounded outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dw-accent)] disabled:cursor-not-allowed disabled:text-[#5b6069] disabled:hover:bg-transparent ${toneClass}`}
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

interface MobileBannerSectionProps {
  node: Extract<TreeNode, { type: 'section' }>
  selectedNodeId: string
  onSelect: (nodeId: string) => void
  inheritedTextColor?: string
  boxStyle?: CSSProperties
  childLayoutStyle?: CSSProperties
}

function MobileBannerSection({
  node,
  selectedNodeId,
  onSelect,
  inheritedTextColor,
  boxStyle,
  childLayoutStyle,
}: MobileBannerSectionProps) {
  const [open, setOpen] = useState(false)
  const readOnly = useContext(CanvasReadOnlyContext)
  const [firstChild, ...restChildren] = node.children

  return (
    <SelectableNode
      node={node}
      selectedNodeId={selectedNodeId}
      onSelect={onSelect}
    >
      <section
        className="flex flex-col gap-3 p-4"
        style={mergeStyles(boxStyle, childLayoutStyle)}
      >
        <div className="flex items-center justify-between gap-3">
          {firstChild ? (
            <CanvasNode
              node={firstChild}
              inheritedTextColor={inheritedTextColor}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
            />
          ) : (
            <span />
          )}
          {restChildren.length > 0 ? (
            <button
              type="button"
              aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={open}
              disabled={readOnly}
              onClick={(event) => {
                event.stopPropagation()
                setOpen((v) => !v)
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-current/30"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          ) : null}
        </div>
        {open && restChildren.length > 0 ? (
          <div className="flex flex-col gap-3" style={childLayoutStyle}>
            {restChildren.map((child) => (
              <CanvasNode
                key={child.id}
                node={child}
                inheritedTextColor={inheritedTextColor}
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
  const { hoveredNodeId, setHoveredNodeId } = useContext(CanvasHoverContext)
  const _selectionCtxTopLevel = useContext(CanvasSelectionContext)
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

  const selectionCtx = _selectionCtxTopLevel
  const isPrimary = node.id === selectedNodeId
  const isInSelection = selectionCtx.allSelectedIds.has(node.id)
  const isCanvasSelectable = node.pointerEvents !== 'none'
  const isHovered = hoveredNodeId === node.id && !isInSelection
  const nodeMetaStyle: CSSProperties = {
    pointerEvents: isCanvasSelectable ? 'auto' : 'none',
    ...(node.opacity === undefined ? {} : { opacity: node.opacity }),
    ...(node.cursor === undefined ? {} : { cursor: node.cursor }),
    ...(transitionStyle ?? {}),
    ...(transformStyle ?? {}),
  }

  function selectNode(modifiers?: { shift?: boolean; meta?: boolean }) {
    if (!isCanvasSelectable) {
      return
    }
    // Shift = 범위 선택 (primary~target). Cmd/Ctrl = 개별 토글.
    if (modifiers?.shift === true) {
      selectionCtx.selectRange(node.id)
      return
    }
    if (modifiers?.meta === true) {
      selectionCtx.toggleAdditional(node.id)
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
    selectNode({
      shift: event.shiftKey,
      meta: event.metaKey || event.ctrlKey,
    })
  }

  return (
    <div
      role="button"
      tabIndex={isCanvasSelectable ? 0 : -1}
      data-dworks-node-id={node.id}
      className={`group/dwnode relative border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dw-accent)] ${
        isPrimary
          ? 'border-[var(--dw-accent)] shadow-[0_0_0_3px_var(--dw-selection-ring)]'
          : isInSelection
            ? 'border-[var(--dw-accent)] shadow-[0_0_0_2px_rgba(99,102,241,0.45)]'
            : isHovered
              ? 'border-[var(--dw-accent)]/60 shadow-[0_0_0_2px_rgba(99,102,241,0.3)]'
              : 'border-transparent hover:border-[var(--dw-border)]'
      }`}
      style={nodeMetaStyle}
      onMouseEnter={() => {
        if (isCanvasSelectable) setHoveredNodeId(node.id)
      }}
      onMouseLeave={() => {
        if (isCanvasSelectable && hoveredNodeId === node.id) {
          setHoveredNodeId(null)
        }
      }}
      onClick={(event) => {
        event.stopPropagation()
        // Space drag로 panning 시작했으면 click 무시 (selection 변경 방지)
        if (selectionCtx.isPanActive) return
        selectNode({
          shift: event.shiftKey,
          meta: event.metaKey || event.ctrlKey,
        })
      }}
      onDoubleClick={(event) => {
        // 텍스트/버튼/이미지: 더블클릭 → 인스펙터의 콘텐츠 input/textarea로 focus 이동
        // 사용자가 캔버스에서 직접 편집하는 mental model
        event.stopPropagation()
        if (selectionCtx.isPanActive) return
        if (
          node.type !== 'text' &&
          node.type !== 'button' &&
          node.type !== 'image'
        )
          return
        // 1) 노드 선택 (보통 이미 선택됨)
        onSelect(node.id)
        // 2) 다음 frame에서 콘텐츠 input 찾아 focus + select
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const aside = document.querySelector<HTMLElement>(
              'aside[aria-label="속성 패널"]',
            )
            if (!aside) return
            const target =
              aside.querySelector<HTMLTextAreaElement | HTMLInputElement>(
                'details[open] textarea, details[open] input[type="text"]',
              ) ?? aside.querySelector<HTMLTextAreaElement>('textarea')
            if (target) {
              target.focus()
              if (target instanceof HTMLTextAreaElement) {
                target.select()
              } else if (target instanceof HTMLInputElement) {
                target.select()
              }
            }
          })
        })
      }}
      onKeyDown={handleKeyDown}
    >
      {isPrimary ? (
        <span className="pointer-events-none absolute -top-3 left-2 z-10 inline-flex items-center gap-1 rounded bg-[var(--dw-accent)] px-2 py-1 text-[11px] font-semibold text-[var(--dw-accent-text)]">
          {(() => {
            const Icon = nodeTypeIcons[node.type]
            return <Icon aria-hidden="true" size={11} />
          })()}
          {nodeTypeLabels[node.type]}
        </span>
      ) : null}
      {isPrimary ? <CanvasNodeToolbar nodeId={node.id} /> : null}
      {children}
    </div>
  )
}

function highlightSearchMatch(text: string, query: string): ReactNode {
  const trimmed = query.trim()
  if (trimmed === '') return text
  const idx = text.toLowerCase().indexOf(trimmed.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-[#3a2e0a] px-0.5 text-[#fbbf24]">
        {text.slice(idx, idx + trimmed.length)}
      </mark>
      {text.slice(idx + trimmed.length)}
    </>
  )
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
      <span className="text-[11px] text-[#898d97]">{label}</span>
      <input
        type="number"
        className="mt-1 h-9 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-2 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
      className={`relative flex w-full min-w-0 max-w-full overflow-hidden border border-white/25 bg-[var(--dw-image-surface)] ${
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
  colorPreset: ColorPreset
  effectiveStyle: EffectiveCanvasStyle
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
}

function NodeInspector({
  node,
  tree,
  colorPreset,
  effectiveStyle,
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
}: NodeInspectorProps) {
  const isSelectedNodeContainer = isContainerNode(node)
  const [nodeIdCopied, setNodeIdCopied] = useState(false)
  // 노드 변경 시 copied state reset
  useEffect(() => {
    setNodeIdCopied(false)
  }, [node.id])
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

  // 초기 default tab은 _콘텐츠_ — 캔버스에 보이는 내용과 inspector 내용 일치.
  // 사용자가 디자인/레이아웃 탭을 명시적으로 선택하면, 다음 노드로 이동해도
  // 그 선택을 유지(Figma 표준 — 작업 흐름 끊지 않음).
  const [activeTab, setActiveTab] = useState<InspectorTab>(DEFAULT_INSPECTOR_TAB)
  const activeTabSectionTitles = getInspectorTabSectionTitles(
    activeTab,
    node.type,
    isSelectedNodeContainer,
  )
  const anyVisibleSectionOpen = activeTabSectionTitles.some(
    (title) => openSections[title] === true,
  )

  function handleMasterCollapseToggle() {
    setOpenSectionsByNode((prev) => {
      const current = prev[node.id] ?? {}
      const next: Record<string, boolean> = { ...current }
      activeTabSectionTitles.forEach((title) => {
        next[title] = !anyVisibleSectionOpen
      })
      return { ...prev, [node.id]: next }
    })
  }

  const NodeTypeIcon = nodeTypeIcons[node.type]
  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[#2a2e35] px-4 pb-0 pt-4">
        <div className="flex items-center justify-between gap-3 px-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1e1f3a] text-[#a5b4fc]">
              <NodeTypeIcon aria-hidden="true" size={13} />
            </span>
            <h2 className="truncate text-sm font-semibold text-[#ebecef]">
              {nodeTypeLabels[node.type]}
            </h2>
          </div>
          <button
            type="button"
            aria-label={
              anyVisibleSectionOpen ? '모두 접기' : '모두 펼치기'
            }
            className="shrink-0 text-xs font-semibold text-[#a5b4fc] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1]"
            onClick={handleMasterCollapseToggle}
          >
            {anyVisibleSectionOpen ? '모두 접기' : '모두 펼치기'}
          </button>
        </div>
        <button
          type="button"
          title="ID 복사"
          onClick={() => {
            void navigator.clipboard
              .writeText(node.id)
              .then(() => {
                setNodeIdCopied(true)
                window.setTimeout(() => setNodeIdCopied(false), 1200)
              })
              .catch(() => {})
          }}
          className="mt-0.5 -mx-1 block w-[calc(100%+0.5rem)] break-all rounded px-1 py-0.5 text-left text-[11px] transition-colors hover:bg-[#1d2025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] data-[copied=true]:text-[#a5b4fc]"
          data-copied={nodeIdCopied || undefined}
          style={{ color: nodeIdCopied ? undefined : '#5b6069' }}
        >
          {nodeIdCopied ? 'ID 복사됨 ✓' : node.id}
        </button>
        <div
          role="tablist"
          aria-label="속성 탭"
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
              return
            }
            event.preventDefault()
            const ids = INSPECTOR_TABS.map((t) => t.id)
            const idx = ids.indexOf(activeTab)
            const nextIdx =
              event.key === 'ArrowRight'
                ? (idx + 1) % ids.length
                : (idx - 1 + ids.length) % ids.length
            const nextId = ids[nextIdx]
            if (!nextId) return
            setActiveTab(nextId)
            const nextEl = event.currentTarget.querySelector<HTMLElement>(
              `#inspector-tab-${nextId}`,
            )
            nextEl?.focus()
          }}
          className="-mx-4 mt-3 flex items-stretch border-t border-[#2a2e35] px-4"
        >
          {INSPECTOR_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`inspector-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`inspector-tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`relative -mb-px flex-1 border-b-2 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
                  isActive
                    ? 'border-[#6366f1] text-[#a5b4fc]'
                    : 'border-transparent text-[#898d97] hover:text-[#ebecef]'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        key={activeTab}
        role="tabpanel"
        id={`inspector-tabpanel-${activeTab}`}
        aria-labelledby={`inspector-tab-${activeTab}`}
        style={{ animation: 'dw-fade-in 150ms ease-out both' }}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
      >
        {activeTab === 'design' ? (
          <>
            <NodeColorControls
              node={node}
              tree={tree}
              colorPreset={colorPreset}
              effectiveStyle={effectiveStyle}
              disclosure={bindSection('색상')}
              onNodeColorChange={onNodeColorChange}
              onNodeColorReset={onNodeColorReset}
              onNodeMetaChange={onNodeMetaChange}
            />

            {node.type === 'text' ? (
              <TypographyControls
                node={node}
                effectiveStyle={effectiveStyle}
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
            ) : null}

            <ShapeControls
              node={node}
              effectiveStyle={effectiveStyle}
              disclosure={bindSection('모양')}
              onShapeChange={onShapeChange}
              onShapeReset={onShapeReset}
            />
          </>
        ) : null}

        {activeTab === 'layout' ? (
          <>
            <LayoutControls
              node={node}
              effectiveStyle={effectiveStyle}
              disclosure={bindSection('레이아웃')}
              onLayoutChange={onLayoutChange}
              onLayoutReset={onLayoutReset}
              onSpacingChange={onSpacingChange}
            />

            <SpacingControls
              node={node}
              effectiveStyle={effectiveStyle}
              disclosure={bindSection('간격')}
              onSpacingChange={onSpacingChange}
              onSpacingReset={onSpacingReset}
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
          <div className="mt-3 rounded-md border border-dashed border-[#2a2e35] bg-[#1d2025] p-3">
            <span className="text-xs font-semibold text-[#898d97]">3D</span>
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
            <span className="text-[11px] text-[#898d97]">기준점</span>
            <div className="mt-1 grid w-fit grid-cols-3 gap-1 rounded-md border border-[#2a2e35] bg-[#16181c] p-1">
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
                        ? 'border-[#6366f1] bg-[#6366f1] text-white'
                        : 'border-transparent text-[#898d97] hover:border-[#2a2e35] hover:bg-[#1d2025]'
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
                        isActive ? 'bg-[#16181c]' : 'bg-[#3a3f48]'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </div>
            </InspectorDisclosure>
          </>
        ) : null}

        {activeTab === 'content' ? (
          <>
            {node.type === 'text' ? (
              <InspectorDisclosure
                title="내용"
                {...bindSection('내용')}
              >
                <label className="block">
                  <span className="text-xs font-semibold text-[#898d97]">문구</span>
                  <textarea
                    className="mt-2 min-h-24 w-full resize-y rounded-md border border-[#2a2e35] bg-[#16181c] p-3 text-sm leading-6 outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
                    placeholder="텍스트 — **굵게**, *기울임*, [링크](URL)"
                    value={node.content}
                    onChange={(event) => onTextChange(node, event.target.value)}
                  />
                </label>
              </InspectorDisclosure>
            ) : null}

            {node.type === 'button' ? (
              <InspectorDisclosure title="내용" {...bindSection('내용')}>
                <label className="block">
                  <span className="text-xs font-semibold text-[#898d97]">버튼 문구</span>
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
                      <span className="text-xs font-semibold text-[#898d97]">
                        이미지 주소
                      </span>
                      <input
                        className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
                        value={node.src}
                        onChange={(event) =>
                          onImageChange(node, { src: event.target.value })
                        }
                      />
                      {node.src.trim().length === 0 ? (
                        <span className="mt-2 block text-xs text-[#898d97]">
                          이미지 슬롯 - 이미지 주소를 입력하세요.
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-[#898d97]">
                        대체 텍스트
                      </span>
                      <input
                        className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
                        value={node.alt}
                        onChange={(event) =>
                          onImageChange(node, { alt: event.target.value })
                        }
                      />
                      {node.alt.length === 0 ? (
                        <span className="mt-2 block text-xs text-[#898d97]">
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
          </>
        ) : null}
      </div>
    </section>
  )
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
      className="rounded-md border border-[#2a2e35] bg-[#16181c] [&[open]>summary_.dw-chevron]:rotate-180"
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
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6366f1] [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#ebecef]">{title}</h3>
          {description ? (
            <p className="mt-1 truncate text-xs text-[#898d97]">{description}</p>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {onAction ? (
            <button
              type="button"
              className="text-xs font-semibold text-[#a5b4fc] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] disabled:cursor-not-allowed disabled:text-[#3a3f48] disabled:hover:no-underline"
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
      <div className="border-t border-[#2a2e35] p-4">{children}</div>
    </details>
  )
}

function DisclosureChevron() {
  return (
    <svg
      aria-hidden="true"
      className="dw-chevron h-4 w-4 text-[#898d97] transition-transform"
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

interface NodeColorControlsProps {
  disclosure?: InspectorDisclosureControl
  node: TreeNode
  tree: Tree
  colorPreset: ColorPreset
  effectiveStyle?: EffectiveCanvasStyle
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
  effectiveStyle,
  onNodeColorChange,
  onNodeMetaChange,
  onNodeColorReset,
}: NodeColorControlsProps) {
  const textContrast =
    node.type === 'text' ? computeTextContrast(tree, node, colorPreset) : null
  const color = node.color ?? {}
  const eff = effectiveStyle ?? {}
  // tree 색상 || 캔버스 렌더 색상 — 비어있어도 _현재 렌더 색_을 input value로 표시
  const effectiveBackgroundColor = color.backgroundColor ?? eff.backgroundColor
  const effectiveTextColor = color.textColor ?? eff.textColor
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
    color.backgroundColor ?? eff.backgroundColor ?? '',
  )
  const [backgroundGradientFromInput, setBackgroundGradientFromInput] = useState(
    backgroundGradient.from,
  )
  const [backgroundGradientToInput, setBackgroundGradientToInput] = useState(
    backgroundGradient.to,
  )
  const [textColorInput, setTextColorInput] = useState(
    color.textColor ?? eff.textColor ?? '',
  )
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
    setBackgroundColorInput(color.backgroundColor ?? effectiveBackgroundColor ?? '')
    setBackgroundColorError(false)
  }, [node.id, color.backgroundColor, effectiveBackgroundColor])

  useEffect(() => {
    setTextColorInput(color.textColor ?? effectiveTextColor ?? '')
    setTextColorError(false)
  }, [node.id, color.textColor, effectiveTextColor])

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
          <span className="text-xs font-semibold text-[#898d97]">{label}</span>
          <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
              value={toColorInputValue(inputValue, defaultColor)}
              onChange={(event) =>
                updateColorFromPicker(colorField, event.target.value)
              }
            />
          </span>
          {error ? (
            <span className="mt-2 block text-xs text-[#fca5a5]">
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
            <span className="text-xs font-semibold text-[#898d97]">
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
            <span className="text-xs font-semibold text-[#898d97]">
              호버 배경
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
              <span className="mt-2 block text-xs text-[#fca5a5]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#898d97]">
              호버 글자
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
              <span className="mt-2 block text-xs text-[#fca5a5]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#898d97]">
              활성 배경
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
              <span className="mt-2 block text-xs text-[#fca5a5]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#898d97]">
              활성 글자
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
              <span className="mt-2 block text-xs text-[#fca5a5]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#898d97]">
              포커스 배경
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
              <span className="mt-2 block text-xs text-[#fca5a5]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#898d97]">
              포커스 글자
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
              <span className="mt-2 block text-xs text-[#fca5a5]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#898d97]">
              전환 시간 (ms)
            </span>
            <input
              type="number"
              min={0}
              max={2000}
              step={10}
              placeholder="150"
              value={node.transition?.duration ?? ''}
              className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
            <span className="text-xs font-semibold text-[#898d97]">
              전환 곡선
            </span>
            <select
              className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm font-semibold text-[#c5c8cf] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
          <div className="space-y-2 rounded-md border border-dashed border-[#2a2e35] bg-[#1d2025] p-3">
            <span className="text-xs font-semibold text-[#898d97]">
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
          <label className="flex items-center gap-2 text-xs font-semibold text-[#898d97]">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-[#6366f1]"
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
            <span className="text-xs font-semibold text-[#898d97]">
              비활성 배경
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
              <span className="mt-2 block text-xs text-[#fca5a5]">
                HEX 형식 (#RRGGBB)으로 입력해주세요.
              </span>
            ) : null}
          </label>
        ) : null}

        {supportsHoverBackgroundColor ? (
          <label className="block">
            <span className="text-xs font-semibold text-[#898d97]">
              비활성 글자
            </span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
              <span className="mt-2 block text-xs text-[#fca5a5]">
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
    <div className="space-y-4 rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
      <div>
        <span className="text-xs font-semibold text-[#898d97]">종류</span>
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
          <span className="text-xs font-semibold text-[#898d97]">방향</span>
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
          <span className="text-xs font-semibold text-[#898d97]">원뿔형 위치</span>
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
      <span className="text-[11px] text-[#898d97]">{label}</span>
      <input
        type="number"
        className="mt-1 h-9 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-2 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
        min={min}
        max={max}
        step={1}
        placeholder={placeholder}
        value={value === undefined ? '' : value}
        onChange={(event) => updateValue(event.target.value, true)}
      />
      <input
        type="range"
        className="mt-2 w-full accent-[#6366f1]"
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
    <div className="mb-4 rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#898d97]">
          대비 ({contrast.isLargeText ? '큰 텍스트 기준' : '본문 기준'})
        </span>
        <span className="text-sm font-semibold tabular-nums text-[#c5c8cf]">
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
        <p className="mt-2 text-xs text-[#898d97]">
          그라디언트 또는 이미지 배경에서는 정확한 검사가 어렵습니다.
        </p>
      ) : null}
    </div>
  )
}

function ContrastBadge({ label, pass }: { label: string; pass: boolean }) {
  const className = pass
    ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
    : 'border-[#2a2e35] bg-[#16181c] text-[#898d97]'
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
        <span className="text-xs font-semibold text-[#898d97]">{label}</span>
        <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
            className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
            value={toColorInputValue(inputValue, DEFAULT_COLOR_PICKER_COLOR)}
            onChange={(event) => onColorPicker(colorField, event.target.value)}
          />
        </span>
        {error ? (
          <span className="mt-2 block text-xs text-[#fca5a5]">
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
  effectiveStyle?: EffectiveCanvasStyle
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
  effectiveStyle,
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
            className="rounded-full border border-[#2a2e35] px-3 py-1 text-xs font-semibold text-[#c5c8cf] transition hover:bg-[#1e1f3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1]"
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
        <span className="text-xs font-semibold text-[#898d97]">글꼴</span>
        <select
          className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm font-semibold text-[#c5c8cf] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
      <details className="mt-3 rounded-md border border-[#2a2e35] bg-[#16181c] [&[open]>summary_.dw-chevron]:rotate-180">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6366f1] [&::-webkit-details-marker]:hidden">
          <span className="text-xs font-semibold text-[#898d97]">
            글꼴 관리
          </span>
          <span className="flex items-center gap-2 text-[11px] text-[#898d97]">
            {registeredFonts.length > 0
              ? `${registeredFontGroups.length}개 그룹 · ${registeredFonts.length}개 파일`
              : '등록 없음'}
            <DisclosureChevron />
          </span>
        </summary>
        <div className="border-t border-[#2a2e35] p-2">
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
            className="h-9 w-full rounded-md border border-dashed border-[#2a2e35] bg-[#16181c] px-3 text-xs font-semibold text-[#a5b4fc] transition hover:bg-[#1e1f3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] disabled:cursor-not-allowed disabled:text-[#3a3f48] disabled:hover:bg-[#16181c]"
            disabled={isFontRegistryBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {isFontRegistryBusy ? '글꼴 처리 중' : 'TTF/OTF 여러 개 업로드'}
          </button>
          <p className="mt-2 text-xs leading-5 text-[#898d97]">
            등록한 글꼴은 이 브라우저의 모든 프로젝트에서 함께 사용됩니다. 같은 패밀리의 굵기 파일은 자동으로 묶습니다.
          </p>
          <p className="mt-1 text-xs leading-5 text-[#898d97]" aria-live="polite">
            {fontRegistryMessage}
          </p>
          {registeredFonts.length > 0 ? (
            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
              {registeredFontGroups.map((group) => (
                <details
                  key={group.familyId}
                  className="rounded-md border border-[#2a2e35] bg-[#16181c] [&[open]>summary_.dw-chevron]:rotate-180"
                >
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6366f1] [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-[#c5c8cf]">
                        {group.familyName}
                      </span>
                      <span className="block truncate text-[11px] text-[#898d97]">
                        {group.fonts.length}개 굵기 · 사용{' '}
                        {fontUsageCounts.get(group.familyId) ?? 0}개
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="rounded border border-[#2a2e35] px-2 py-1 text-[11px] font-semibold text-[#fca5a5] transition hover:bg-[#3a1717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fca5a5] disabled:cursor-not-allowed disabled:opacity-50"
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
                  <div className="space-y-1 border-t border-[#2a2e35] p-2">
                    {group.fonts.map((font) => (
                      <div
                        key={font.id}
                        className="flex min-h-8 items-center justify-between gap-2 rounded border border-[#2a2e35] bg-[#16181c] px-2"
                      >
                        <span className="min-w-0 truncate text-[11px] text-[#898d97]">
                          {getFontWeightLabel(font)} · {font.displayName}
                          {font.status === 'missing' ? ' (누락)' : ''}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 text-[11px] font-semibold text-[#fca5a5] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fca5a5] disabled:cursor-not-allowed disabled:opacity-50"
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
          value={typography.fontSize ?? effectiveStyle?.fontSize}
          isEffective={
            typography.fontSize === undefined && effectiveStyle?.fontSize !== undefined
          }
          placeholder={String(defaults.fontSize)}
          onChange={(value) => updateNumberField('fontSize', value, 8, 120)}
        />
        <label className="block">
          <span className="text-xs font-semibold text-[#898d97]">굵기</span>
          <select
            className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
            value={typography.fontWeight ?? (effectiveStyle?.fontWeight as FontWeight | undefined) ?? ''}
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
          value={typography.lineHeight ?? effectiveStyle?.lineHeight}
          isEffective={
            typography.lineHeight === undefined && effectiveStyle?.lineHeight !== undefined
          }
          placeholder={String(defaults.lineHeight)}
          onChange={(value) => updateNumberField('lineHeight', value, 0.8, 3)}
        />
        <TypographyNumberField
          label="자간"
          unit="em"
          min={-0.1}
          max={0.2}
          step={0.005}
          value={typography.letterSpacing ?? effectiveStyle?.letterSpacing}
          isEffective={
            typography.letterSpacing === undefined &&
            effectiveStyle?.letterSpacing !== undefined &&
            effectiveStyle.letterSpacing !== 0
          }
          placeholder={String(defaults.letterSpacing)}
          onChange={(value) => updateNumberField('letterSpacing', value, -0.1, 0.2)}
        />
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-semibold text-[#898d97]">크기 슬라이더</span>
        <input
          className="mt-2 w-full accent-[#6366f1]"
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
          <span className="text-xs font-semibold text-[#898d97]">정렬</span>
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

      <div className="mt-4 space-y-3 rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#898d97]">
            텍스트 그림자
          </span>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-[#2a2e35] bg-[#16181c] p-1">
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
              <span className="text-xs font-semibold text-[#898d97]">색상</span>
              <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                  className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
                <span className="mt-2 block text-xs text-[#fca5a5]">
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
  effectiveStyle?: EffectiveCanvasStyle
  onSpacingChange: (node: TreeNode, patch: Partial<Spacing>) => void
  onSpacingReset: (node: TreeNode) => void
}

interface LayoutControlsProps {
  disclosure?: InspectorDisclosureControl
  node: TreeNode
  effectiveStyle?: EffectiveCanvasStyle
  onLayoutChange: (node: TreeNode, patch: Partial<NodeLayout>) => void
  onLayoutReset: (node: TreeNode) => void
  onSpacingChange: (node: TreeNode, patch: Partial<Spacing>) => void
}

function LayoutControls({
  disclosure,
  node,
  effectiveStyle,
  onLayoutChange,
  onLayoutReset,
  onSpacingChange,
}: LayoutControlsProps) {
  const canEditLayout = isContainerNode(node)
  const layout = node.layout ?? {}
  const spacing = node.spacing ?? {}
  // 캔버스 렌더 default 값을 fallback으로 (사용자가 _현재 보이는 값_을 input에 직접 보고 즉시 수정 가능)
  const eff = effectiveStyle ?? {}
  const effectiveGap = spacing.gap ?? eff.gap

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
        <span className="text-xs font-semibold text-[#898d97]">{title}</span>
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
        <p className="rounded-md border border-dashed border-[#2a2e35] bg-[#16181c] px-3 py-2 text-xs text-[#898d97]">
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
          value={effectiveGap}
          isEffective={spacing.gap === undefined && effectiveGap !== undefined}
          placeholder="0"
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
  effectiveStyle,
  onSpacingChange,
  onSpacingReset,
}: SpacingControlsProps) {
  const [paddingMode, setPaddingMode] = useState<SpacingMode>('all')
  const [marginMode, setMarginMode] = useState<SpacingMode>('all')
  const spacing = node.spacing ?? {}
  const canEditGap = isContainerNode(node)
  // tree 값 || 캔버스 렌더 default — 사용자가 _현재 보이는 값_을 input에 직접 보고 즉시 수정
  const eff = effectiveStyle ?? {}
  const spacingWithEffective: Spacing = {
    paddingTop: spacing.paddingTop ?? eff.paddingTop,
    paddingRight: spacing.paddingRight ?? eff.paddingRight,
    paddingBottom: spacing.paddingBottom ?? eff.paddingBottom,
    paddingLeft: spacing.paddingLeft ?? eff.paddingLeft,
    marginTop: spacing.marginTop ?? eff.marginTop,
    marginRight: spacing.marginRight ?? eff.marginRight,
    marginBottom: spacing.marginBottom ?? eff.marginBottom,
    marginLeft: spacing.marginLeft ?? eff.marginLeft,
    gap: spacing.gap ?? eff.gap,
  }

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
      <div className="rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold text-[#898d97]">{title}</h4>
          <span className="text-[11px] font-semibold text-[#898d97]">px</span>
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
              value={getSpacingGroupValue(spacingWithEffective, fields)}
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
              value={getSpacingGroupValue(spacingWithEffective, horizontalFields)}
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
              value={getSpacingGroupValue(spacingWithEffective, verticalFields)}
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
              value={spacingWithEffective[topField]}
              placeholder={placeholder}
              onChange={(value) => updateField(topField, value, min, max)}
            />
            <TypographyNumberField
              label="오른쪽"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={spacingWithEffective[rightField]}
              placeholder={placeholder}
              onChange={(value) => updateField(rightField, value, min, max)}
            />
            <TypographyNumberField
              label="아래"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={spacingWithEffective[bottomField]}
              placeholder={placeholder}
              onChange={(value) => updateField(bottomField, value, min, max)}
            />
            <TypographyNumberField
              label="왼쪽"
              unit="px"
              min={min}
              max={max}
              step={1}
              value={spacingWithEffective[leftField]}
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
          <div className="rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
            <TypographyNumberField
              label="자식 간격"
              unit="px"
              min={0}
              max={200}
              step={1}
              value={spacingWithEffective.gap}
              placeholder="0"
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
  effectiveStyle?: EffectiveCanvasStyle
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
  effectiveStyle,
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
        <div className="col-span-2 rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#898d97]">모서리</span>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-[#2a2e35] bg-[#16181c] p-1">
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
                value={
                  shape.radius ??
                  (effectiveStyle?.borderRadiusTopLeft !== undefined &&
                  effectiveStyle.borderRadiusTopLeft ===
                    effectiveStyle.borderRadiusTopRight &&
                  effectiveStyle.borderRadiusTopLeft ===
                    effectiveStyle.borderRadiusBottomLeft &&
                  effectiveStyle.borderRadiusTopLeft ===
                    effectiveStyle.borderRadiusBottomRight
                    ? effectiveStyle.borderRadiusTopLeft
                    : undefined)
                }
                placeholder="0"
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
          <span className="text-xs font-semibold text-[#898d97]">
            테두리 종류
          </span>
          <select
            className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
          <span className="text-xs font-semibold text-[#898d97]">
            테두리 색상
          </span>
          <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0 disabled:cursor-not-allowed"
              value={toColorInputValue(borderColorInput)}
              disabled={isBorderDisabled}
              onChange={(event) => updateBorderColorFromPicker(event.target.value)}
            />
          </span>
          {borderColorError ? (
            <span className="mt-2 block text-xs text-[#fca5a5]">
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

        <div className="col-span-2 space-y-3 rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#898d97]">그림자</span>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-[#2a2e35] bg-[#16181c] p-1">
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
              <span className="text-xs font-semibold text-[#898d97]">
                그림자 종류
              </span>
              <select
                className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
                <span className="text-xs font-semibold text-[#898d97]">
                  레이어 {activeCustomShadows.length}/{MAX_CUSTOM_SHADOWS}
                </span>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 text-xs font-semibold text-[#c5c8cf] transition hover:bg-[#1d2025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#16181c]"
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
                    className="rounded-md border border-[#2a2e35] bg-[#16181c] p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#898d97]">
                        그림자 {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`그림자 ${index + 1} 위로 이동`}
                          title="위로 이동"
                          className="flex h-7 w-7 items-center justify-center rounded border border-[#2a2e35] bg-[#16181c] text-[#898d97] transition hover:bg-[#1d2025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#16181c]"
                          disabled={index === 0}
                          onClick={() => moveCustomShadow(index, -1)}
                        >
                          <ArrowUp aria-hidden="true" size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`그림자 ${index + 1} 아래로 이동`}
                          title="아래로 이동"
                          className="flex h-7 w-7 items-center justify-center rounded border border-[#2a2e35] bg-[#16181c] text-[#898d97] transition hover:bg-[#1d2025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#16181c]"
                          disabled={index === activeCustomShadows.length - 1}
                          onClick={() => moveCustomShadow(index, 1)}
                        >
                          <ArrowDown aria-hidden="true" size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`그림자 ${index + 1} 삭제`}
                          title="삭제"
                          className="flex h-7 w-7 items-center justify-center rounded border border-[#2a2e35] bg-[#16181c] text-[#fca5a5] transition hover:bg-[#3a1717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1]"
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
                        <span className="text-xs font-semibold text-[#898d97]">
                          색상
                        </span>
                        <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                            className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
                          <span className="mt-2 block text-xs text-[#fca5a5]">
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

                    <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#898d97]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-[#6366f1]"
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
          <span className="text-xs font-semibold text-[#898d97]">비율</span>
          <select
            aria-label="이미지 비율"
            className="mt-2 h-10 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-3 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
          <span className="text-xs font-semibold text-[#898d97]">맞춤</span>
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

      <div className="mt-4 rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#898d97]">초점</span>
          <span className="text-[11px] font-semibold text-[#898d97]">
            {focalXPercent}% / {focalYPercent}%
          </span>
        </div>
        <button
          type="button"
          aria-label="이미지 초점 미리보기"
          className="relative mt-2 flex aspect-[3/2] w-full cursor-crosshair overflow-hidden rounded-md border border-[#2a2e35] bg-[var(--dw-image-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1]"
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
            <span className="m-auto text-xs font-semibold text-[#898d97]">
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
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#6366f1] shadow"
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
          <span className="text-xs font-semibold text-[#898d97]">
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
              <span className="text-xs font-semibold text-[#898d97]">
                오버레이 색상
              </span>
              <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#2a2e35] bg-[#16181c] px-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
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
                  className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e35] bg-[#16181c] p-0"
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
                <span className="mt-2 block text-xs text-[#fca5a5]">
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

      <div className="mt-4 rounded-md border border-[#2a2e35] bg-[#16181c] p-3">
        <span className="text-xs font-semibold text-[#898d97]">필터</span>
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
        <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#898d97]">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-[#6366f1]"
            checked={presentation.filter?.dropShadow !== undefined}
            onChange={(event) => toggleImageDropShadow(event.target.checked)}
          />
          그림자
        </label>
        {presentation.filter?.dropShadow !== undefined ? (
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-dashed border-[#2a2e35] bg-[#1d2025] p-3">
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
              <span className="text-[11px] text-[#898d97]">색상</span>
              <input
                type="color"
                aria-label="그림자 색상"
                className="mt-1 h-9 w-full cursor-pointer rounded-md border border-[#2a2e35] bg-[#16181c] p-0.5"
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
                className="rounded-md border border-[#2a2e35] bg-[#16181c] p-2"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#898d97]">
                    추가 그림자 {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`추가 그림자 ${index + 1} 위로`}
                      title="위로"
                      disabled={index === 0}
                      className="h-6 w-6 rounded border border-[#2a2e35] text-xs text-[#898d97] disabled:opacity-40"
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
                      className="h-6 w-6 rounded border border-[#2a2e35] text-xs text-[#898d97] disabled:opacity-40"
                      onClick={() => moveImageDropShadowExtra(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={`추가 그림자 ${index + 1} 삭제`}
                      title="삭제"
                      className="h-6 w-6 rounded border border-[#7f1d1d] text-xs text-[#fca5a5]"
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
                    <span className="text-[11px] text-[#898d97]">색상</span>
                    <input
                      type="color"
                      aria-label={`추가 그림자 ${index + 1} 색상`}
                      className="mt-1 h-9 w-full cursor-pointer rounded-md border border-[#2a2e35] bg-[#16181c] p-0.5"
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
              className="w-full rounded-md border border-dashed border-[#2a2e35] py-2 text-xs font-semibold text-[#898d97] hover:bg-[#1d2025] disabled:opacity-40"
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
      <span className="text-[11px] text-[#898d97]">{label}</span>
      <input
        type="number"
        className="mt-1 h-9 w-full rounded-md border border-[#2a2e35] bg-[#16181c] px-2 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40"
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
          className="w-full accent-[#6366f1] disabled:cursor-not-allowed"
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
  // value가 effective(캔버스 default 측정)에서 왔으면 true. 시각 dot + italic으로 구분.
  isEffective?: boolean
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
  isEffective = false,
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
      <span className="flex items-center gap-1 text-xs font-semibold text-[#898d97]">
        {label}
        {isEffective ? (
          <span
            aria-label="캔버스 default 값"
            title="캔버스 default 값 (트리에 명시 없음). 입력하면 이 노드 전용으로 override."
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#5b6069]"
          />
        ) : null}
      </span>
      <span className="mt-2 flex h-10 items-center rounded-md border border-[#2a2e35] bg-[#16181c] focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/20">
        <input
          className={`h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed ${
            isEffective ? 'text-[#898d97] italic' : ''
          }`}
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
          <span className="shrink-0 px-2 text-xs font-semibold text-[#898d97]">
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
      className={`h-9 rounded-md border px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
        isSelected
          ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
          : 'border-[#2a2e35] bg-[#16181c] text-[#c5c8cf] hover:bg-[#1d2025]'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#16181c]`}
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
      className={`flex h-9 items-center justify-center rounded-md border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
        isSelected
          ? 'border-[#6366f1] bg-[#1e1f3a] text-[#a5b4fc]'
          : 'border-[#2a2e35] bg-[#16181c] text-[#c5c8cf] hover:bg-[#1d2025]'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#16181c]`}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
    </button>
  )
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#898d97]">{label}</dt>
      <dd className="break-all text-right font-medium text-[#ebecef]">{value}</dd>
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

function flattenTree(
  node: TreeNode,
  collapsedIds?: ReadonlySet<string>,
  depth = 0,
): LayerItem[] {
  const current = [{ node, depth }]
  if (!isContainerNode(node)) {
    return current
  }
  // 컨테이너가 collapsed면 자식 노드는 트리에서 제외
  if (collapsedIds !== undefined && collapsedIds.has(node.id)) {
    return current
  }

  return [
    ...current,
    ...node.children.flatMap((child) =>
      flattenTree(child, collapsedIds, depth + 1),
    ),
  ]
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

// inspector 탭 — Figma 표준에 가까운 3분할(디자인/레이아웃/콘텐츠)
type InspectorTab = 'design' | 'layout' | 'content'

const INSPECTOR_TABS: Array<{ id: InspectorTab; label: string }> = [
  { id: 'design', label: '디자인' },
  { id: 'layout', label: '레이아웃' },
  { id: 'content', label: '콘텐츠' },
]

// 노드 type 무관하게 _콘텐츠_ tab을 default로.
// 사용자 mandate: 최초/선택 시 _캔버스에 보이는 내용_과 _우측 inspector 내용_이
// 일치해야 함 (텍스트면 문구, 이미지면 src/alt, 컨테이너면 그룹 자식 정보).
// '디자인'/'레이아웃'은 사용자가 명시적으로 선택해 들어가는 보조 탭.
const DEFAULT_INSPECTOR_TAB: InspectorTab = 'content'

// 활성 탭에서 노출되는 disclosure section 제목들. master collapse 토글 대상.
function getInspectorTabSectionTitles(
  tab: InspectorTab,
  nodeType: TreeNode['type'],
  isContainer: boolean,
): string[] {
  if (tab === 'design') {
    const out = ['색상']
    if (nodeType === 'text') {
      out.push('타이포그래피')
    }
    out.push('모양')
    return out
  }
  if (tab === 'layout') {
    return ['레이아웃', '간격', '변환']
  }
  // content
  if (nodeType === 'text' || nodeType === 'button') {
    return ['내용']
  }
  if (nodeType === 'image') {
    return ['이미지', '이미지 구도']
  }
  if (isContainer) {
    return ['그룹']
  }
  return []
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

function findFirstContrastFailNodeId(
  tree: Tree,
  colorPreset: ColorPreset,
): string | null {
  for (const textNode of collectTextNodes(tree.root)) {
    const result = computeTextContrast(tree, textNode, colorPreset)
    if (result !== null && !result.passesAA) {
      return textNode.id
    }
  }
  return null
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

// 캔버스 노드 effective style — Tailwind class에서 오는 padding/gap/color/font 등을
// inspector placeholder로 노출 (Codex 회신: 사용자가 _현재 렌더 중_인 값 즉시 확인).
interface EffectiveCanvasStyle {
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  gap?: number
  backgroundColor?: string
  textColor?: string
  borderRadiusTopLeft?: number
  borderRadiusTopRight?: number
  borderRadiusBottomLeft?: number
  borderRadiusBottomRight?: number
  fontSize?: number
  fontWeight?: string
  lineHeight?: number
  letterSpacing?: number
  display?: string
  flexDirection?: string
  justifyContent?: string
  alignItems?: string
}

// computed style의 'rgb(R, G, B)' / 'rgba(R, G, B, A)'를 #RRGGBB로 정규화.
// 투명(alpha 0) 또는 'transparent' 등은 undefined 반환.
function rgbToHex(rgb: string): string | undefined {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return undefined
  const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  if (!m) return undefined
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  const a = m[4] !== undefined ? Number(m[4]) : 1
  if (a < 0.05) return undefined
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
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
  viewport: ResponsiveViewport
  viewportWidth: number
  canvasStyle: CSSProperties
  disabled: boolean
  onSelect: (id: string) => void
}

function VariantCompareGrid({
  generations,
  activeGenerationId,
  viewport,
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
          viewport={viewport}
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
  viewport: ResponsiveViewport
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
  viewport,
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
      className={`group flex flex-col overflow-hidden rounded-lg border bg-[#16181c] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${
        isActive
          ? 'border-[#6366f1] shadow-[0_0_0_3px_rgba(27,127,114,0.22)]'
          : 'border-[#2a2e35] hover:border-[#6366f1]'
      }`}
      style={{ width: MINI_CELL_WIDTH }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#2a2e35] px-3 py-2">
        <span className="text-xs font-semibold text-[#ebecef]">{label}</span>
        <span className="truncate text-[10px] text-[#898d97]" title={intentText}>
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
            <CanvasViewportContext.Provider value={viewport}>
              <CanvasNode
                node={entry.tree.root}
                selectedNodeId=""
                onSelect={() => {}}
              />
            </CanvasViewportContext.Provider>
          </CanvasReadOnlyContext.Provider>
        </div>
      </div>
    </div>
  )
}
