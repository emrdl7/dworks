// @dworks/tree-renderer — 트리 → HTML 최소 렌더러.
// 캔버스 렌더 매체로 사용 (DECISIONS D2). M0.5 범위 동결.
//
// 비범위 (M4 이후):
// - 본격 Tailwind class 매핑
// - 토큰 시스템 ↔ 실제 CSS variable 연결
// - 인라인 편집 마커 외 인터랙션 hooks

import type {
  AccordionNode,
  ButtonNode,
  CardNode,
  CarouselNode,
  FormNode,
  HeroNode,
  ImageNode,
  ListNode,
  ModalNode,
  SectionNode,
  TabsNode,
  TextNode,
  Tree,
  TreeNode,
} from '@dworks/tree'

// HTML special character escape — XSS 안전성 (안전장치 도구 내부).
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch)
}

function attrs(parts: Array<[string, string | undefined]>): string {
  const out = parts
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
    .join(' ')
  return out.length > 0 ? ' ' + out : ''
}

function classFromTokens(tokens?: string[]): string | undefined {
  if (!tokens || tokens.length === 0) return undefined
  // 토큰 -> CSS class 변환은 M1 토큰 시스템 정의 시 본격화. 지금은 1:1 join.
  return tokens.map((t) => `t-${t.replace(/[^a-zA-Z0-9_-]/g, '-')}`).join(' ')
}

function commonAttrs(node: TreeNode): string {
  // entranceAnimation은 data-attr로 노출 — export 후 라이브러리(IntersectionObserver
  // + CSS animation)가 이 attr 보고 진입 효과 처리.
  const anim = node.entranceAnimation
  return attrs([
    ['data-dw-node', node.id],
    ['data-dw-edit', node.editKind],
    ['class', classFromTokens(node.styleTokens)],
    ['data-dw-entrance', anim?.type],
    ['data-dw-entrance-trigger', anim?.trigger],
    ['data-dw-entrance-duration', anim?.duration?.toString()],
    ['data-dw-entrance-delay', anim?.delay?.toString()],
  ])
}

function renderText(node: TextNode): string {
  const inner = escapeHtml(node.content).replace(/\n/g, '<br />')
  switch (node.emphasis) {
    case 'heading-1':
      return `<h1${commonAttrs(node)}>${inner}</h1>`
    case 'heading-2':
      return `<h2${commonAttrs(node)}>${inner}</h2>`
    case 'heading-3':
      return `<h3${commonAttrs(node)}>${inner}</h3>`
    case 'caption':
      return `<small${commonAttrs(node)}>${inner}</small>`
    case 'body':
    default:
      return `<p${commonAttrs(node)}>${inner}</p>`
  }
}

function renderButton(node: ButtonNode): string {
  const variantAttr = attrs([['data-dw-variant', node.variant]])
  if (node.href !== undefined) {
    return `<a${commonAttrs(node)}${variantAttr}${attrs([['href', node.href]])}>${escapeHtml(node.label)}</a>`
  }
  return `<button${commonAttrs(node)}${variantAttr} type="button">${escapeHtml(node.label)}</button>`
}

function renderImage(node: ImageNode): string {
  const imageAttrs = attrs([
    ['src', node.src],
    ['alt', node.alt],
  ])
  const figureAttrs = attrs([['data-dw-aspect', node.aspectRatio]])
  return `<figure${commonAttrs(node)}${figureAttrs}><img${imageAttrs} /></figure>`
}

function renderChildren(children: TreeNode[]): string {
  return children.map(renderNode).join('')
}

function renderSection(node: SectionNode): string {
  const roleAttr = attrs([['data-dw-role', node.role]])
  return `<section${commonAttrs(node)}${roleAttr}>${renderChildren(node.children)}</section>`
}

function renderHero(node: HeroNode): string {
  return `<header${commonAttrs(node)} data-dw-role="hero">${renderChildren(node.children)}</header>`
}

function renderCard(node: CardNode): string {
  return `<article${commonAttrs(node)}>${renderChildren(node.children)}</article>`
}

function renderList(node: ListNode): string {
  const tag = node.variant === 'ordered' ? 'ol' : node.variant === 'description' ? 'dl' : 'ul'
  // dl은 dt/dd 페어가 있어야 의미적으로 정확하지만 M0.5에선 단순 children 위임.
  // 일반 list는 각 child를 <li>로 감싼다 (자식이 text/button 같은 단일 요소일 때).
  if (tag === 'dl') {
    return `<dl${commonAttrs(node)}>${renderChildren(node.children)}</dl>`
  }
  const items = node.children
    .map((child) => `<li>${renderNode(child)}</li>`)
    .join('')
  return `<${tag}${commonAttrs(node)}>${items}</${tag}>`
}

function renderForm(node: FormNode): string {
  const formAttrs = attrs([
    ['action', node.action],
    ['method', node.method],
  ])
  return `<form${commonAttrs(node)}${formAttrs}>${renderChildren(node.children)}</form>`
}

export function renderNode(node: TreeNode): string {
  switch (node.type) {
    case 'text':
      return renderText(node)
    case 'button':
      return renderButton(node)
    case 'image':
      return renderImage(node)
    case 'carousel':
      return renderCarousel(node)
    case 'tabs':
      return renderTabs(node)
    case 'accordion':
      return renderAccordion(node)
    case 'modal':
      return renderModal(node)
    case 'section':
      return renderSection(node)
    case 'hero':
      return renderHero(node)
    case 'card':
      return renderCard(node)
    case 'list':
      return renderList(node)
    case 'form':
      return renderForm(node)
  }
}

function renderModal(node: ModalNode): string {
  // Phase 4 EXP-02 — vanilla JS wrap 을 위해 trigger 버튼 + dialog 양쪽 렌더.
  // trigger 가 dialog.showModal() 호출, close 버튼이 dialog.close() 호출 (export 후 vanilla JS).
  // open attr 은 _캔버스 미리보기_ 용 — vanilla JS 가 export 후 remove 함.
  const open = node.open !== false ? ' open' : ''
  const triggerLabel = node.title || '열기'
  const titleHtml = `<h2>${escapeHtml(node.title)}</h2>`
  const contentHtml = `<div>${escapeHtml(node.content).replace(/\n/g, '<br />')}</div>`
  const actions: string[] = []
  if (node.secondaryActionLabel) {
    actions.push(`<button type="button" data-dw-modal-action="secondary">${escapeHtml(node.secondaryActionLabel)}</button>`)
  }
  if (node.primaryActionLabel) {
    actions.push(`<button type="button" data-dw-modal-action="primary">${escapeHtml(node.primaryActionLabel)}</button>`)
  }
  const actionsHtml = actions.length > 0 ? `<footer>${actions.join('')}</footer>` : ''
  const closeButton = `<button type="button" class="dw-modal__close" data-dworks-modal-close aria-label="닫기">닫기</button>`
  const triggerButton = `<button type="button" class="dw-modal__trigger" data-dworks-modal-trigger${attrs([['data-modal-id', node.id]])}>${escapeHtml(triggerLabel)}</button>`
  return `${triggerButton}<dialog${commonAttrs(node)}${open} data-dworks-modal${attrs([['id', node.id], ['data-dw-modal-size', node.size ?? 'md']])}>${titleHtml}${contentHtml}${actionsHtml}${closeButton}</dialog>`
}

function renderAccordion(node: AccordionNode): string {
  // Phase 4 EXP-02 — details/summary 네이티브 + data-dworks-accordion-item attr.
  // data-expand-mode 가 vanilla JS 분기 신호 — multiple 이면 자유, single 이면 다른 details 자동 닫기.
  const expandMode = node.allowMultiple === true ? 'multiple' : 'single'
  const items = node.items
    .map((it) => {
      const open = it.expanded === true ? ' open' : ''
      const content = escapeHtml(it.content).replace(/\n/g, '<br />')
      return `<details${open} class="dw-accordion__item" data-dworks-accordion-item${attrs([['data-item-id', it.id]])}><summary class="dw-accordion__summary">${escapeHtml(it.title)}</summary><div class="dw-accordion__panel">${content}</div></details>`
    })
    .join('')
  return `<div${commonAttrs(node)} class="dw-accordion" data-dworks-accordion data-expand-mode="${expandMode}" role="region" aria-roledescription="accordion">${items}</div>`
}

function renderTabs(node: TabsNode): string {
  // Phase 4 EXP-02 — 모든 trigger + 모든 panel 렌더. vanilla JS 가 클릭 시 활성 전환.
  // 비활성 panel 은 hidden attr — vanilla JS 가 toggle. tabindex / aria-selected / aria-controls 박음.
  if (node.items.length === 0) {
    return `<div${commonAttrs(node)} class="dw-tabs" data-dworks-tabs role="region" aria-roledescription="tabs"></div>`
  }
  const activeIndex = Math.min(
    Math.max(node.activeIndex ?? 0, 0),
    node.items.length - 1,
  )
  const activeId = node.items[activeIndex]?.id ?? node.items[0]?.id ?? ''
  // CR-01 / WR-01 — trigger 에 id 부착 + tabs node.id prefix 로 globally-unique 보장.
  // panel 의 aria-labelledby 가 가리킬 대상이 실재해야 스크린 리더가 panel 라벨을 결정한다 (WAI-ARIA tabs).
  const prefix = node.id
  const triggers = node.items
    .map((it) => {
      const isActive = it.id === activeId
      return `<button${attrs([
        ['type', 'button'],
        ['class', 'dw-tabs__trigger'],
        ['role', 'tab'],
        ['id', `${prefix}-tab-${it.id}`],
        ['data-dworks-tab-trigger', ''],
        ['data-tab-id', it.id],
        ['aria-controls', `${prefix}-panel-${it.id}`],
        ['aria-selected', isActive ? 'true' : 'false'],
        ['tabindex', isActive ? '0' : '-1'],
      ])}>${escapeHtml(it.label)}</button>`
    })
    .join('')
  const panels = node.items
    .map((it) => {
      const isActive = it.id === activeId
      const hiddenAttr = isActive ? '' : ' hidden'
      const content = escapeHtml(it.content).replace(/\n/g, '<br />')
      return `<div${attrs([
        ['class', 'dw-tabs__panel'],
        ['role', 'tabpanel'],
        ['data-dworks-tab-panel', ''],
        ['data-tab-id', it.id],
        ['id', `${prefix}-panel-${it.id}`],
        ['aria-labelledby', `${prefix}-tab-${it.id}`],
      ])}${hiddenAttr}>${content}</div>`
    })
    .join('')
  return `<div${commonAttrs(node)} class="dw-tabs" data-dworks-tabs role="region" aria-roledescription="tabs"><div class="dw-tabs__list" role="tablist">${triggers}</div>${panels}</div>`
}

function renderCarousel(node: CarouselNode): string {
  // Phase 4 EXP-01 — Embla Carousel CDN 과 호환되는 viewport + container + slide 구조 + prev/next 버튼.
  // _모든_ items 를 렌더 (preview 가 아닌 export 본격). vanilla JS / Embla 가 transform 으로 슬라이드 이동.
  if (node.items.length === 0) {
    return `<div${commonAttrs(node)} class="dw-carousel" data-dworks-carousel role="region" aria-roledescription="carousel"></div>`
  }
  const slides = node.items
    .map((item, idx) => {
      const img = `<img${attrs([['src', item.src], ['alt', item.alt]])} />`
      const caption = item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ''
      const inner = caption ? `<figure>${img}${caption}</figure>` : img
      return `<div${attrs([
        ['class', 'dw-carousel__slide'],
        ['data-dworks-carousel-slide', ''],
        ['data-slide-index', idx.toString()],
      ])}>${inner}</div>`
    })
    .join('')
  const prevBtn = `<button type="button" class="dw-carousel__btn dw-carousel__btn--prev" data-dworks-carousel-prev aria-label="이전 슬라이드">‹</button>`
  const nextBtn = `<button type="button" class="dw-carousel__btn dw-carousel__btn--next" data-dworks-carousel-next aria-label="다음 슬라이드">›</button>`
  return `<div${commonAttrs(node)} class="dw-carousel" data-dworks-carousel role="region" aria-label="이미지 carousel" aria-roledescription="carousel"><div class="dw-carousel__viewport"><div class="dw-carousel__container">${slides}</div></div>${prevBtn}${nextBtn}</div>`
}

export function renderTree(tree: Tree): string {
  return renderNode(tree.root)
}
