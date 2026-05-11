// 캔버스 노드 type별 design default — 현재 CanvasNode의 className에 _숨어있는_ 값을
// 명시화한다. design-resolver가 이 값을 explicit override 없을 때 fallback으로 쓴다.
//
// 마이그레이션 끝나면 CanvasNode가 직접 className을 박지 않고 resolver 결과로 렌더하므로
// 이 파일이 _진짜_ source of truth가 된다 — 지금은 className과 _이중 작성_ 단계.
//
// 값 추출 기준: apps/web/src/app/page.tsx 의 CanvasNode switch case 별 가장 일반적인
// branch (no layout override, no role-specific path). 특수 case(banner, layoutOverride
// 등)는 후속 phase에서 role/intent별 default로 분리.

import type {
  ColorPresetTokens,
  Emphasis,
  NodeLayout,
  Shape,
  Spacing,
  TreeNodeType,
  Typography,
} from '@dworks/tree'

// type별 spacing default — 캔버스 className과 _값 일치_ 보장 필요
//
// section: p-10 gap-8 (40, 32) — 일반 branch만. banner role / explicit column
//   direction(page shell)일 때는 default 적용 안 함. resolveSpacing에서 분기 처리.
// hero:    p-12 gap-10                     (48, 40)
// card:    p-5 gap-3                       (20, 12)
// list:    p-0 gap-3                       ( 0, 12)
// form:    p-8 gap-5                       (32, 20)
// leaf nodes(text/button/image): spacing default 없음
export const DEFAULT_SPACING_BY_TYPE: Record<TreeNodeType, Spacing> = {
  section: {
    paddingTop: 40,
    paddingRight: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    gap: 32,
  },
  hero: {
    paddingTop: 48,
    paddingRight: 48,
    paddingBottom: 48,
    paddingLeft: 48,
    gap: 40,
  },
  card: {
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    gap: 12,
  },
  list: {
    gap: 12,
  },
  form: {
    paddingTop: 32,
    paddingRight: 32,
    paddingBottom: 32,
    paddingLeft: 32,
    gap: 20,
  },
  text: {},
  // button: px-5 = padding-x 20px. vertical은 min-h-11(44px)로 처리 — spacing 영역 밖.
  button: { paddingLeft: 20, paddingRight: 20 },
  image: {},
  // carousel: 자체 padding 없음 — 부모 spacing이 채움. 이미지 레퍼런스(figure)와 동일.
  carousel: {},
  // tabs: tab list와 panel 사이 자연스러운 간격을 위해 작은 gap.
  tabs: { gap: 16 },
  // accordion: 각 item 사이 약간의 spacing.
  accordion: { gap: 4 },
  // modal: padding이 자체 카드 내부에. 큰 padding으로 컨텐츠 호흡.
  modal: { paddingTop: 28, paddingRight: 28, paddingBottom: 28, paddingLeft: 28, gap: 16 },
}

// emphasis별 typography default — text 노드 TextPreview의 className에서 추출 + 인스펙터
// 표시용 기본값(textAlign 'left', fontFamily 'sans' 등)을 함께 명시.
//
// heading-1: text-5xl(48) font-semibold(600) leading-tight(1.25)
// heading-2: text-2xl(24) font-semibold(600) — Tailwind line-height(1.35)
// heading-3: text-lg(18)  font-semibold(600) — Tailwind line-height(1.45)
// body:      text-base(16) leading-7(28→1.75) — fontWeight 400(normal)
// caption:   text-xs(12)  font-semibold(600) line-height(1.35)
//
// 모든 emphasis가 _완전한_ default 보유 (textShadow 제외) — getTypographyDefaults가
// 이 매핑을 lookup하기 위해 통합. 단일 source of truth.
export type EmphasisTypographyDefaults = Required<Omit<Typography, 'textShadow'>>

export const DEFAULT_TYPOGRAPHY_BY_EMPHASIS: Record<
  Emphasis,
  EmphasisTypographyDefaults
> = {
  'heading-1': {
    fontSize: 48,
    fontWeight: '600',
    lineHeight: 1.25,
    letterSpacing: 0,
    textAlign: 'left',
    fontFamily: 'sans',
  },
  'heading-2': {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 1.35,
    letterSpacing: 0,
    textAlign: 'left',
    fontFamily: 'sans',
  },
  'heading-3': {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 1.45,
    letterSpacing: 0,
    textAlign: 'left',
    fontFamily: 'sans',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 1.75,
    letterSpacing: 0,
    textAlign: 'left',
    fontFamily: 'sans',
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 1.35,
    letterSpacing: 0,
    textAlign: 'left',
    fontFamily: 'sans',
  },
}

// type별 layout default — 캔버스 className의 flex direction/wrap에서 추출.
//
// section(default branch): flex flex-col gap-8 p-10 → column / nowrap
// hero: grid 기반(min-h grid-cols 등) — NodeLayout 'grid' 미지원 → undefined로 둠
//   사용자가 hero 자체에 layout을 박지 않으므로 토글은 disabled. 자식 wrapper만 flex-col.
// card: article block 기반(no flex) → undefined. 자식 wrapper만 flex-col gap-3.
// list: flex flex-col gap-3 → column / nowrap
// form: flex flex-col gap-5 → column / nowrap
// leaf(text/button/image): layout 없음
//
// 주의: 'banner' role / layoutOverride 등 특수 path의 layout은 후속 phase에서
// role/intent별 override로 분리.
export const DEFAULT_LAYOUT_BY_TYPE: Record<TreeNodeType, NodeLayout> = {
  section: { direction: 'column', wrap: 'nowrap' },
  hero: {},
  card: {},
  list: { direction: 'column', wrap: 'nowrap' },
  form: { direction: 'column', wrap: 'nowrap' },
  text: {},
  button: {},
  image: {},
  carousel: {},
  // tabs: column — tab list가 위, panel이 아래.
  tabs: { direction: 'column', wrap: 'nowrap' },
  // accordion: column — items 세로 stack.
  accordion: { direction: 'column', wrap: 'nowrap' },
  // modal: column — title/content/footer 세로 stack.
  modal: { direction: 'column', wrap: 'nowrap' },
}

// type별 shape default — radius / border / shadow.
//
// card: rounded-lg(8) border(1px) border-[var(--dw-border)] shadow-sm
// form: rounded-lg(8) border(1px) border-[var(--dw-border)] shadow-sm
// 나머지: 명시 shape 없음
//
// borderColor는 CSS var(theme token) — 후속 token resolver가 hex로 변환. 지금은
// 미정의(undefined)로 두어 캔버스가 className의 token을 그대로 사용.
export const DEFAULT_SHAPE_BY_TYPE: Record<TreeNodeType, Shape> = {
  section: {},
  hero: {},
  card: { radius: 8, borderWidth: 1, borderStyle: 'solid', shadow: 'sm' },
  list: {},
  form: { radius: 8, borderWidth: 1, borderStyle: 'solid', shadow: 'sm' },
  text: {},
  button: {},
  image: {},
  // carousel: 시각 임팩트 위해 radius/shadow 약간 — 사용자가 explicit 으로 0/none 박을 수 있음.
  carousel: { radius: 12, shadow: 'md' },
  // tabs: 자체 border/radius 없음 — 자식 panel이 시각 책임.
  tabs: {},
  // accordion: 자체 stack — 각 item이 border/radius 책임.
  accordion: {},
  // modal: 카드 형태 — radius 16 + xl shadow.
  modal: { radius: 16, shadow: 'xl' },
}

// type별 color token slot — 캔버스 className의 var(--dw-*) 토큰을 ColorPresetTokens
// 키로 매핑한다. resolveColor가 colorPreset과 합쳐 _최종 hex_를 산출.
//
// hero: bg-[var(--dw-hero-surface)] text-[var(--dw-hero-text)]
//   → backgroundColor=heroSurface, textColor=heroText
// card/form: border-[var(--dw-border)] bg-[var(--dw-surface-muted)]
//   → backgroundColor=surfaceMuted, borderColor=border
// section/list: 컨테이너 색 명시 없음 — 캔버스가 부모 색 상속
// text/button/image leaf: 부모 색 상속 (token-aware inherited resolver는 후속 phase)
export interface ColorTokenSlots {
  backgroundColor?: keyof ColorPresetTokens
  textColor?: keyof ColorPresetTokens
  accentColor?: keyof ColorPresetTokens
  borderColor?: keyof ColorPresetTokens
}

export const DEFAULT_COLOR_TOKENS_BY_TYPE: Record<TreeNodeType, ColorTokenSlots> = {
  section: {},
  hero: { backgroundColor: 'heroSurface', textColor: 'heroText' },
  card: { backgroundColor: 'surfaceMuted', borderColor: 'border' },
  list: {},
  form: { backgroundColor: 'surfaceMuted', borderColor: 'border' },
  text: {},
  button: {},
  image: {},
  carousel: {},
  tabs: {},
  accordion: {},
  modal: {},
}

// emphasis별 text color token slot — text 노드의 textColor가 emphasis에 따라
// 다른 token slot을 가리킴. type-level slot으로는 표현 불가능하므로 별도.
//
// heading-1: 부모 상속 (TextPreview에 className text 색상 없음 — 부모 hero/section
//            의 textColor token 또는 inheritedTextColor 사용)
// heading-2/3: textPrimary token (text-[var(--dw-text-primary)])
// body:      부모 상속
// caption:   accent token (text-[var(--dw-accent)])
//
// resolveColor에서 text 노드일 때 type slot에 _덮어쓰기_ 형태로 합쳐 사용.
// explicit > emphasis slot > type slot > undefined.
export const DEFAULT_COLOR_TOKENS_BY_EMPHASIS: Record<Emphasis, ColorTokenSlots> = {
  'heading-1': {},
  'heading-2': { textColor: 'textPrimary' },
  'heading-3': { textColor: 'textPrimary' },
  body: {},
  caption: { textColor: 'accent' },
}
