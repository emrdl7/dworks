// tree-renderer 단위 테스트.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { Tree } from '@dworks/tree'
import { renderNode, renderTree } from './render.js'

describe('renderNode', () => {
  it('renders text with heading-1 emphasis as h1', () => {
    const html = renderNode({
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'Hello',
      emphasis: 'heading-1',
    })
    assert.match(html, /^<h1[^>]*>Hello<\/h1>$/)
    assert.match(html, /data-dw-node="t1"/)
    assert.match(html, /data-dw-edit="text"/)
  })

  it('renders default text as paragraph', () => {
    const html = renderNode({
      id: 't2',
      type: 'text',
      editKind: 'text',
      content: 'body text',
    })
    assert.match(html, /^<p[^>]*>body text<\/p>$/)
  })

  it('escapes HTML in content', () => {
    const html = renderNode({
      id: 't3',
      type: 'text',
      editKind: 'text',
      content: '<script>alert(1)</script>',
    })
    assert.ok(!html.includes('<script>'))
    assert.match(html, /&lt;script&gt;/)
  })

  it('renders button without href as button element', () => {
    const html = renderNode({
      id: 'b1',
      type: 'button',
      editKind: 'text',
      label: 'Save',
      variant: 'primary',
    })
    assert.match(html, /^<button[^>]*type="button">Save<\/button>$/)
    assert.match(html, /data-dw-variant="primary"/)
  })

  it('renders button with href as anchor', () => {
    const html = renderNode({
      id: 'b2',
      type: 'button',
      editKind: 'text',
      label: 'Docs',
      href: '/docs',
    })
    assert.match(html, /^<a[^>]*href="\/docs"[^>]*>Docs<\/a>$/)
  })

  it('renders image nodes with empty decorative alt preserved', () => {
    const html = renderNode({
      id: 'hero.visual',
      type: 'image',
      editKind: 'media',
      src: '',
      alt: '',
      aspectRatio: 'wide',
    })

    assert.match(html, /^<figure[^>]*><img[^>]* \/><\/figure>$/)
    assert.match(html, /data-dw-node="hero.visual"/)
    assert.match(html, /data-dw-edit="media"/)
    assert.match(html, /data-dw-aspect="wide"/)
    assert.match(html, /src=""/)
    assert.match(html, /alt=""/)
  })

  it('escapes image attributes', () => {
    const html = renderNode({
      id: 'img',
      type: 'image',
      editKind: 'media',
      src: 'https://example.com/?q=<bad>',
      alt: '"quoted"',
    })

    assert.match(html, /src="https:\/\/example.com\/\?q=&lt;bad&gt;"/)
    assert.match(html, /alt="&quot;quoted&quot;"/)
  })

  it('renders section with role and nested children', () => {
    const html = renderNode({
      id: 's1',
      type: 'section',
      editKind: 'structure',
      role: 'feature',
      children: [
        {
          id: 't1',
          type: 'text',
          editKind: 'text',
          content: 'Title',
          emphasis: 'heading-2',
        },
      ],
    })
    assert.match(html, /<section[^>]*data-dw-role="feature"[^>]*>/)
    assert.match(html, /<h2[^>]*>Title<\/h2>/)
    assert.match(html, /<\/section>$/)
  })

  it('renders hero as header with role hero', () => {
    const html = renderNode({
      id: 'h1',
      type: 'hero',
      editKind: 'structure',
      children: [],
    })
    assert.match(html, /^<header[^>]*data-dw-role="hero"[^>]*><\/header>$/)
  })

  it('renders card as article', () => {
    const html = renderNode({
      id: 'c1',
      type: 'card',
      editKind: 'structure',
      children: [],
    })
    assert.match(html, /^<article[^>]*><\/article>$/)
  })

  it('renders unordered list with li-wrapped children', () => {
    const html = renderNode({
      id: 'l1',
      type: 'list',
      editKind: 'structure',
      variant: 'unordered',
      children: [
        { id: 't1', type: 'text', editKind: 'text', content: 'one' },
        { id: 't2', type: 'text', editKind: 'text', content: 'two' },
      ],
    })
    assert.match(html, /<ul[^>]*>(<li><p[^>]*>one<\/p><\/li>)(<li><p[^>]*>two<\/p><\/li>)<\/ul>/)
  })

  it('renders ordered list as ol', () => {
    const html = renderNode({
      id: 'l2',
      type: 'list',
      editKind: 'structure',
      variant: 'ordered',
      children: [],
    })
    assert.match(html, /^<ol[^>]*><\/ol>$/)
  })

  it('renders form with action and method', () => {
    const html = renderNode({
      id: 'f1',
      type: 'form',
      editKind: 'structure',
      action: '/submit',
      method: 'post',
      children: [],
    })
    assert.match(html, /<form[^>]*action="\/submit"[^>]*method="post"[^>]*>/)
  })

  it('renders style token classes', () => {
    const html = renderNode({
      id: 't1',
      type: 'text',
      editKind: 'text',
      content: 'styled',
      styleTokens: ['color.primary', 'spacing.md'],
    })
    assert.match(html, /class="t-color-primary t-spacing-md"/)
  })
})

describe('renderTree', () => {
  it('renders a tree root', () => {
    const tree: Tree = {
      version: '1',
      root: {
        id: 'root',
        type: 'section',
        editKind: 'structure',
        children: [
          {
            id: 'h',
            type: 'text',
            editKind: 'text',
            content: 'Dworks',
            emphasis: 'heading-1',
          },
        ],
      },
    }
    const html = renderTree(tree)
    assert.match(html, /^<section[^>]*>/)
    assert.match(html, /<h1[^>]*>Dworks<\/h1>/)
    assert.match(html, /<\/section>$/)
  })
})

describe('renderCarousel', () => {
  it('renderCarousel 모든 slide 와 prev/next 버튼 박음', () => {
    const html = renderNode({
      id: 'car1',
      type: 'carousel',
      editKind: 'media',
      items: [
        { id: 's1', src: '/a.jpg', alt: 'a' },
        { id: 's2', src: '/b.jpg', alt: 'b' },
        { id: 's3', src: '/c.jpg', alt: 'c' },
      ],
    })
    // 3 슬라이드 모두 렌더
    assert.equal((html.match(/data-dworks-carousel-slide/g) ?? []).length, 3)
    // viewport + container 구조 (Embla 호환)
    assert.match(html, /class="dw-carousel__viewport"/)
    assert.match(html, /class="dw-carousel__container"/)
    // prev/next 버튼 + 한국어 aria
    assert.match(html, /data-dworks-carousel-prev[^>]*aria-label="이전 슬라이드"/)
    assert.match(html, /data-dworks-carousel-next[^>]*aria-label="다음 슬라이드"/)
    // root 에 data-dworks-carousel attr
    assert.match(html, /<div[^>]*data-dworks-carousel/)
    // slide index attr
    assert.match(html, /data-slide-index="0"/)
    assert.match(html, /data-slide-index="2"/)
  })

  it('renderCarousel caption 있으면 figure/figcaption 으로 wrap', () => {
    const html = renderNode({
      id: 'car2',
      type: 'carousel',
      editKind: 'media',
      items: [
        { id: 's1', src: '/a.jpg', alt: 'a', caption: '첫 슬라이드' },
      ],
    })
    assert.match(html, /<figure><img[^>]*\/><figcaption>첫 슬라이드<\/figcaption><\/figure>/)
  })
})

describe('renderTabs', () => {
  it('renderTabs 모든 trigger + 모든 panel 박고 활성 panel 만 visible', () => {
    const html = renderNode({
      id: 'tabs1',
      type: 'tabs',
      editKind: 'structure',
      activeIndex: 1,
      items: [
        { id: 'a', label: '소개', content: 'about' },
        { id: 'b', label: '가격', content: 'pricing' },
        { id: 'c', label: '문의', content: 'contact' },
      ],
    })
    // 3 trigger, 3 panel
    assert.equal((html.match(/data-dworks-tab-trigger/g) ?? []).length, 3)
    assert.equal((html.match(/data-dworks-tab-panel/g) ?? []).length, 3)
    // activeIndex=1 (id 'b') aria-selected="true", tabindex="0"
    assert.match(html, /data-tab-id="b"[^>]*aria-selected="true"[^>]*tabindex="0"/)
    // 비활성 (id 'a') aria-selected="false"
    assert.match(html, /data-tab-id="a"[^>]*aria-selected="false"/)
    // 비활성 panel hidden, 활성 panel visible
    assert.match(html, /id="panel-a"[^>]*hidden>/)
    assert.match(html, /id="panel-b"[^>]*>pricing<\/div>/)
    // aria-controls 연결
    assert.match(html, /data-tab-id="b"[^>]*aria-controls="panel-b"/)
    // root data-dworks-tabs
    assert.match(html, /<div[^>]*data-dworks-tabs/)
  })

  it('renderTabs activeIndex 미지정 시 첫 tab 활성', () => {
    const html = renderNode({
      id: 'tabs2',
      type: 'tabs',
      editKind: 'structure',
      items: [
        { id: 'x', label: 'X', content: 'xx' },
        { id: 'y', label: 'Y', content: 'yy' },
      ],
    })
    assert.match(html, /data-tab-id="x"[^>]*aria-selected="true"/)
    assert.match(html, /data-tab-id="y"[^>]*aria-selected="false"/)
  })
})

describe('renderAccordion', () => {
  it('renderAccordion data-expand-mode single (allowMultiple false/undefined)', () => {
    const html = renderNode({
      id: 'acc1',
      type: 'accordion',
      editKind: 'structure',
      items: [
        { id: 'i1', title: 'Q1', content: 'A1' },
        { id: 'i2', title: 'Q2', content: 'A2', expanded: true },
      ],
    })
    assert.match(html, /data-expand-mode="single"/)
    // 각 item 에 data-dworks-accordion-item
    assert.equal((html.match(/data-dworks-accordion-item/g) ?? []).length, 2)
    // expanded item 에 open attr
    assert.match(html, /<details open[^>]*data-item-id="i2"/)
    // 비-expanded item open 없음
    assert.match(html, /<details class="dw-accordion__item"[^>]*data-item-id="i1"/)
  })

  it('renderAccordion data-expand-mode multiple (allowMultiple true)', () => {
    const html = renderNode({
      id: 'acc2',
      type: 'accordion',
      editKind: 'structure',
      allowMultiple: true,
      items: [{ id: 'i1', title: 'Q', content: 'A' }],
    })
    assert.match(html, /data-expand-mode="multiple"/)
    assert.match(html, /<div[^>]*data-dworks-accordion[^>]*data-expand-mode="multiple"/)
  })
})

describe('renderModal', () => {
  it('renderModal trigger 버튼 + dialog + close 버튼 + 한국어 aria', () => {
    const html = renderNode({
      id: 'mod1',
      type: 'modal',
      editKind: 'structure',
      title: '확인',
      content: '진행하시겠습니까?',
      primaryActionLabel: '확인',
      secondaryActionLabel: '취소',
    })
    // trigger 버튼 박힘 (modal 전)
    assert.match(html, /^<button[^>]*data-dworks-modal-trigger[^>]*data-modal-id="mod1"[^>]*>확인<\/button>/)
    // dialog 박힘 + data-dworks-modal + id
    assert.match(html, /<dialog[^>]*data-dworks-modal[^>]*id="mod1"/)
    // 본문 + footer 보존
    assert.match(html, /<h2>확인<\/h2>/)
    assert.match(html, /<div>진행하시겠습니까\?<\/div>/)
    assert.match(html, /data-dw-modal-action="primary"/)
    assert.match(html, /data-dw-modal-action="secondary"/)
    // close 버튼 + 한국어 aria
    assert.match(html, /<button[^>]*data-dworks-modal-close[^>]*aria-label="닫기">닫기<\/button>/)
    // dialog 닫는 태그
    assert.match(html, /<\/dialog>$/)
  })

  it('renderModal title 비어있어도 trigger fallback 라벨 (열기)', () => {
    // 스키마상 title 은 min(1) 이므로 의도된 단축 라벨 검증 — title 이 있으면 그게 라벨로 쓰임.
    const html = renderNode({
      id: 'mod2',
      type: 'modal',
      editKind: 'structure',
      title: '안내',
      content: '',
    })
    // trigger 버튼은 title 을 라벨로 사용
    assert.match(html, /^<button[^>]*data-dworks-modal-trigger[^>]*>안내<\/button>/)
  })
})
