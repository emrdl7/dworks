import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { Tree } from '@dworks/tree'

import {
  applyEditSequence,
  deleteNode,
  duplicateNode,
  moveNode,
  replaceTextById,
  updateColor,
  updateLayout,
  updateNodeMeta,
  updateShape,
  updateSpacing,
  updateButtonLabel,
  updateImage,
  updateStyleTokens,
  updateText,
  updateTextTypography,
} from './operations.js'

function fixtureTree(): Tree {
  return {
    version: '1',
    root: {
      id: 'landing',
      type: 'section',
      editKind: 'structure',
      children: [
        {
          id: 'landing.title',
          type: 'text',
          editKind: 'text',
          emphasis: 'heading-1',
          content: 'Dworks',
        },
        {
          id: 'landing.cta',
          type: 'button',
          editKind: 'text',
          label: '시작하기',
          variant: 'primary',
        },
        {
          id: 'landing.visual',
          type: 'image',
          editKind: 'media',
          src: '',
          alt: '',
          aspectRatio: 'wide',
        },
        {
          id: 'landing.card',
          type: 'card',
          editKind: 'structure',
          children: [
            {
              id: 'landing.card.title',
              type: 'text',
              editKind: 'text',
              emphasis: 'heading-3',
              content: '카드 제목',
            },
          ],
        },
      ],
    },
  }
}

describe('tree editor operations', () => {
  it('updates a text node without mutating the original tree', () => {
    const tree = fixtureTree()
    const updated = updateText(tree, 'landing.title', 'Dworks Studio')

    assert.notEqual(updated, tree)
    assert.equal(tree.root.type, 'section')
    assert.equal(updated.root.type, 'section')
    if (tree.root.type === 'section' && updated.root.type === 'section') {
      const originalTitle = tree.root.children[0]
      const updatedTitle = updated.root.children[0]
      assert.equal(originalTitle?.type, 'text')
      assert.equal(updatedTitle?.type, 'text')
      if (originalTitle?.type === 'text' && updatedTitle?.type === 'text') {
        assert.equal(originalTitle.content, 'Dworks')
        assert.equal(updatedTitle.content, 'Dworks Studio')
      }
    }
  })

  it('updates a button label', () => {
    const tree = fixtureTree()
    const updated = updateButtonLabel(tree, 'landing.cta', '시안 만들기')

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const cta = updated.root.children[1]
      assert.equal(cta?.type, 'button')
      if (cta?.type === 'button') {
        assert.equal(cta.label, '시안 만들기')
      }
    }
  })

  it('updates an image source and alt text', () => {
    const tree = fixtureTree()
    const updated = updateImage(tree, 'landing.visual', {
      src: 'https://example.com/hero.jpg',
      alt: '작업 중인 디자인 캔버스',
    })

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const visual = updated.root.children[2]
      assert.equal(visual?.type, 'image')
      if (visual?.type === 'image') {
        assert.equal(visual.src, 'https://example.com/hero.jpg')
        assert.equal(visual.alt, '작업 중인 디자인 캔버스')
        assert.equal(visual.aspectRatio, 'wide')
      }
    }
  })

  it('updates and clears image composition metadata', () => {
    const tree = fixtureTree()
    const composed = updateImage(tree, 'landing.visual', {
      aspectRatio: 'portrait',
      focalPoint: { x: 0.25, y: 0.75 },
      presentation: {
        fit: 'contain',
        overlayColor: '#123456',
        overlayOpacity: 0.4,
        filter: {
          blur: 8,
          grayscale: 70,
          brightness: 115,
        },
      },
    })
    const retinted = updateImage(composed, 'landing.visual', {
      presentation: {
        overlayOpacity: 0.65,
        filter: {
          blur: 4,
          grayscale: 70,
          brightness: 115,
          contrast: 130,
        },
      },
    })
    const reset = updateImage(retinted, 'landing.visual', {
      aspectRatio: undefined,
      focalPoint: undefined,
      presentation: {
        fit: undefined,
        overlayColor: undefined,
        overlayOpacity: undefined,
        filter: undefined,
      },
    })

    assert.equal(composed.root.type, 'section')
    assert.equal(retinted.root.type, 'section')
    assert.equal(reset.root.type, 'section')
    if (
      composed.root.type === 'section' &&
      retinted.root.type === 'section' &&
      reset.root.type === 'section'
    ) {
      const composedVisual = composed.root.children[2]
      const retintedVisual = retinted.root.children[2]
      const resetVisual = reset.root.children[2]
      assert.equal(composedVisual?.type, 'image')
      assert.equal(retintedVisual?.type, 'image')
      assert.equal(resetVisual?.type, 'image')
      if (
        composedVisual?.type === 'image' &&
        retintedVisual?.type === 'image' &&
        resetVisual?.type === 'image'
      ) {
        assert.equal(composedVisual.aspectRatio, 'portrait')
        assert.deepEqual(composedVisual.focalPoint, { x: 0.25, y: 0.75 })
        assert.deepEqual(composedVisual.presentation, {
          fit: 'contain',
          overlayColor: '#123456',
          overlayOpacity: 0.4,
          filter: {
            blur: 8,
            grayscale: 70,
            brightness: 115,
          },
        })
        assert.deepEqual(retintedVisual.presentation, {
          fit: 'contain',
          overlayColor: '#123456',
          overlayOpacity: 0.65,
          filter: {
            blur: 4,
            grayscale: 70,
            brightness: 115,
            contrast: 130,
          },
        })
        assert.equal(resetVisual.aspectRatio, undefined)
        assert.equal(resetVisual.focalPoint, undefined)
        assert.equal(resetVisual.presentation, undefined)
      }
    }
  })

  it('updates and clears common node metadata', () => {
    const tree = fixtureTree()
    const edited = updateNodeMeta(tree, 'landing.card', {
      hidden: true,
      disabled: true,
      opacity: 0.42,
      pointerEvents: 'none',
      cursor: 'help',
      transition: {
        duration: 240,
        timing: 'ease-in-out',
      },
      transform: {
        translateX: 24,
        translateY: -16,
        rotate: 12,
        scale: 1.2,
        originX: 0,
      },
    })
    const withOrigin = updateNodeMeta(edited, 'landing.card', {
      transform: {
        translateX: 24,
        translateY: -16,
        rotate: 12,
        scale: 1.2,
        originX: 0,
        originY: 100,
      },
    })
    const reset = updateNodeMeta(edited, 'landing.card', {
      hidden: undefined,
      disabled: undefined,
      opacity: undefined,
      pointerEvents: undefined,
      cursor: undefined,
      transition: undefined,
      transform: undefined,
    })

    assert.equal(tree.root.type, 'section')
    assert.equal(edited.root.type, 'section')
    assert.equal(reset.root.type, 'section')
    if (
      tree.root.type === 'section' &&
      edited.root.type === 'section' &&
      withOrigin.root.type === 'section' &&
      reset.root.type === 'section'
    ) {
      const originalCard = tree.root.children[3]
      const editedCard = edited.root.children[3]
      const originCard = withOrigin.root.children[3]
      const resetCard = reset.root.children[3]
      assert.equal(originalCard?.type, 'card')
      assert.equal(editedCard?.type, 'card')
      assert.equal(originCard?.type, 'card')
      assert.equal(resetCard?.type, 'card')
      if (
        originalCard?.type === 'card' &&
        editedCard?.type === 'card' &&
        originCard?.type === 'card' &&
        resetCard?.type === 'card'
      ) {
        assert.equal(originalCard.hidden, undefined)
        assert.equal(originalCard.disabled, undefined)
        assert.equal(originalCard.opacity, undefined)
        assert.equal(originalCard.pointerEvents, undefined)
        assert.equal(originalCard.cursor, undefined)
        assert.equal(originalCard.transition, undefined)
        assert.equal(originalCard.transform, undefined)
        assert.equal(editedCard.hidden, true)
        assert.equal(editedCard.disabled, true)
        assert.equal(editedCard.opacity, 0.42)
        assert.equal(editedCard.pointerEvents, 'none')
        assert.equal(editedCard.cursor, 'help')
        assert.deepEqual(editedCard.transition, {
          duration: 240,
          timing: 'ease-in-out',
        })
        assert.deepEqual(editedCard.transform, {
          translateX: 24,
          translateY: -16,
          rotate: 12,
          scale: 1.2,
          originX: 0,
        })
        assert.deepEqual(originCard.transform, {
          translateX: 24,
          translateY: -16,
          rotate: 12,
          scale: 1.2,
          originX: 0,
          originY: 100,
        })
        assert.equal(resetCard.hidden, undefined)
        assert.equal(resetCard.disabled, undefined)
        assert.equal(resetCard.opacity, undefined)
        assert.equal(resetCard.pointerEvents, undefined)
        assert.equal(resetCard.cursor, undefined)
        assert.equal(resetCard.transition, undefined)
        assert.equal(resetCard.transform, undefined)
      }
    }
  })

  it('replaces text by id through the compatibility helper', () => {
    const updated = replaceTextById(fixtureTree(), 'landing.title', '새 이름')

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const title = updated.root.children[0]
      assert.equal(title?.type, 'text')
      if (title?.type === 'text') {
        assert.equal(title.content, '새 이름')
      }
    }
  })

  it('applies edit operations in order', () => {
    const updated = applyEditSequence(fixtureTree(), [
      {
        type: 'updateText',
        nodeId: 'landing.title',
        content: '새 제목',
      },
      {
        type: 'updateButtonLabel',
        nodeId: 'landing.cta',
        label: '바로 시작',
      },
      {
        type: 'updateTextTypography',
        nodeId: 'landing.title',
        patch: { fontSize: 56, fontWeight: '700', textAlign: 'center' },
      },
      {
        type: 'updateSpacing',
        nodeId: 'landing.card',
        patch: { paddingTop: 24, marginBottom: 12, gap: 16 },
      },
      {
        type: 'updateShape',
        nodeId: 'landing.card',
        patch: {
          radius: 18,
          borderWidth: 2,
          borderColor: '#aabbcc',
          borderStyle: 'dashed',
          shadow: 'lg',
        },
      },
      {
        type: 'updateColor',
        nodeId: 'landing.card',
        patch: {
          backgroundColor: '#f8fafc',
          textColor: '#123456',
        },
      },
      {
        type: 'updateLayout',
        nodeId: 'landing.card',
        patch: {
          direction: 'row',
          align: 'center',
          justify: 'evenly',
          wrap: 'wrap',
        },
      },
      {
        type: 'updateImage',
        nodeId: 'landing.visual',
        alt: '새 이미지 설명',
        focalPoint: { x: 0.4, y: 0.6 },
        presentation: { fit: 'contain', overlayOpacity: 0.25 },
      },
      {
        type: 'moveNode',
        nodeId: 'landing.visual',
        direction: 'up',
      },
      {
        type: 'updateStyleTokens',
        patch: { colorPreset: 'navy' },
      },
    ])

    assert.equal(updated.styleTokens?.colorPreset, 'navy')
    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const title = updated.root.children[0]
      const visual = updated.root.children[1]
      const cta = updated.root.children[2]
      assert.equal(title?.type, 'text')
      assert.equal(cta?.type, 'button')
      assert.equal(visual?.type, 'image')
      if (
        title?.type === 'text' &&
        visual?.type === 'image' &&
        cta?.type === 'button' &&
        updated.root.children[3]?.type === 'card'
      ) {
        const card = updated.root.children[3]
        assert.equal(title.content, '새 제목')
        assert.equal(title.typography?.fontSize, 56)
        assert.equal(title.typography?.fontWeight, '700')
        assert.equal(title.typography?.textAlign, 'center')
        assert.equal(cta.label, '바로 시작')
        assert.equal(visual.alt, '새 이미지 설명')
        assert.deepEqual(visual.focalPoint, { x: 0.4, y: 0.6 })
        assert.deepEqual(visual.presentation, {
          fit: 'contain',
          overlayOpacity: 0.25,
        })
        assert.equal(card.spacing?.paddingTop, 24)
        assert.equal(card.spacing?.marginBottom, 12)
        assert.equal(card.spacing?.gap, 16)
        assert.equal(card.shape?.radius, 18)
        assert.equal(card.shape?.borderWidth, 2)
        assert.equal(card.shape?.borderColor, '#aabbcc')
        assert.equal(card.shape?.borderStyle, 'dashed')
        assert.equal(card.shape?.shadow, 'lg')
        assert.equal(card.color?.backgroundColor, '#f8fafc')
        assert.equal(card.color?.textColor, '#123456')
        assert.equal(card.layout?.direction, 'row')
        assert.equal(card.layout?.align, 'center')
        assert.equal(card.layout?.justify, 'evenly')
        assert.equal(card.layout?.wrap, 'wrap')
      }
    }
  })

  it('moves a node within the same parent without mutating siblings', () => {
    const tree = fixtureTree()
    const movedUp = moveNode(tree, 'landing.visual', 'up')

    assert.equal(movedUp.root.type, 'section')
    if (movedUp.root.type === 'section') {
      assert.deepEqual(
        movedUp.root.children.map((child) => child.id),
        ['landing.title', 'landing.visual', 'landing.cta', 'landing.card'],
      )
    }

    const movedDown = moveNode(movedUp, 'landing.visual', 'down')
    assert.equal(movedDown.root.type, 'section')
    if (movedDown.root.type === 'section') {
      assert.deepEqual(
        movedDown.root.children.map((child) => child.id),
        ['landing.title', 'landing.cta', 'landing.visual', 'landing.card'],
      )
    }
  })

  it('duplicates a node subtree with deterministic ids', () => {
    const duplicated = duplicateNode(fixtureTree(), 'landing.card')

    assert.equal(duplicated.root.type, 'section')
    if (duplicated.root.type === 'section') {
      const card = duplicated.root.children[4]
      assert.equal(card?.type, 'card')
      if (card?.type === 'card') {
        assert.equal(card.id, 'landing.card.copy')
        assert.equal(card.children[0]?.id, 'landing.card.copy.title')
      }
    }
  })

  it('increments duplicated root ids when a copy already exists', () => {
    const once = duplicateNode(fixtureTree(), 'landing.card')
    const twice = duplicateNode(once, 'landing.card')

    assert.equal(twice.root.type, 'section')
    if (twice.root.type === 'section') {
      assert.deepEqual(
        twice.root.children.map((child) => child.id),
        [
          'landing.title',
          'landing.cta',
          'landing.visual',
          'landing.card',
          'landing.card.copy-2',
          'landing.card.copy',
        ],
      )
    }
  })

  it('deletes a node from its parent', () => {
    const updated = deleteNode(fixtureTree(), 'landing.cta')

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      assert.deepEqual(
        updated.root.children.map((child) => child.id),
        ['landing.title', 'landing.visual', 'landing.card'],
      )
    }
  })

  it('updates root style tokens without mutating the original tree', () => {
    const tree = fixtureTree()
    const updated = updateStyleTokens(tree, { colorPreset: 'plum' })

    assert.notEqual(updated, tree)
    assert.equal(tree.styleTokens, undefined)
    assert.equal(updated.styleTokens?.colorPreset, 'plum')
    assert.equal(updated.root, tree.root)
  })

  it('merges root style token patches', () => {
    const tree: Tree = {
      ...fixtureTree(),
      styleTokens: { colorPreset: 'mint' },
    }

    const updated = updateStyleTokens(tree, { colorPreset: 'graphite' })

    assert.equal(updated.styleTokens?.colorPreset, 'graphite')
  })

  it('updates text typography overrides without changing content', () => {
    const tree = fixtureTree()
    const updated = updateTextTypography(tree, 'landing.title', {
      fontSize: 48,
      fontWeight: '700',
      lineHeight: 1.1,
      letterSpacing: -0.02,
      textAlign: 'center',
      fontFamily: 'serif',
    })

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const title = updated.root.children[0]
      assert.equal(title?.type, 'text')
      if (title?.type === 'text') {
        assert.equal(title.content, 'Dworks')
        assert.deepEqual(title.typography, {
          fontSize: 48,
          fontWeight: '700',
          lineHeight: 1.1,
          letterSpacing: -0.02,
          textAlign: 'center',
          fontFamily: 'serif',
        })
      }
    }
  })

  it('removes text typography fields when patch values are undefined', () => {
    const styled = updateTextTypography(fixtureTree(), 'landing.title', {
      fontSize: 48,
      fontWeight: '700',
    })
    const reset = updateTextTypography(styled, 'landing.title', {
      fontSize: undefined,
      fontWeight: undefined,
    })

    assert.equal(reset.root.type, 'section')
    if (reset.root.type === 'section') {
      const title = reset.root.children[0]
      assert.equal(title?.type, 'text')
      if (title?.type === 'text') {
        assert.equal(title.typography, undefined)
      }
    }
  })

  it('updates spacing overrides on any node without changing content', () => {
    const tree = fixtureTree()
    const updated = updateSpacing(tree, 'landing.cta', {
      paddingTop: 14,
      paddingRight: 18,
      paddingBottom: 14,
      paddingLeft: 18,
      marginTop: -4,
    })

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const cta = updated.root.children[1]
      assert.equal(cta?.type, 'button')
      if (cta?.type === 'button') {
        assert.equal(cta.label, '시작하기')
        assert.deepEqual(cta.spacing, {
          paddingTop: 14,
          paddingRight: 18,
          paddingBottom: 14,
          paddingLeft: 18,
          marginTop: -4,
        })
      }
    }
  })

  it('removes spacing fields and clears empty spacing objects', () => {
    const spaced = updateSpacing(fixtureTree(), 'landing.card', {
      paddingTop: 24,
      gap: 12,
    })
    const reset = updateSpacing(spaced, 'landing.card', {
      paddingTop: undefined,
      gap: undefined,
    })

    assert.equal(reset.root.type, 'section')
    if (reset.root.type === 'section') {
      const card = reset.root.children[3]
      assert.equal(card?.type, 'card')
      if (card?.type === 'card') {
        assert.equal(card.spacing, undefined)
      }
    }
  })

  it('updates shape overrides on any node without changing content', () => {
    const tree = fixtureTree()
    const updated = updateShape(tree, 'landing.cta', {
      radius: 12,
      borderWidth: 1,
      borderColor: '#112233',
      borderStyle: 'solid',
      shadow: 'md',
      customShadows: [
        {
          offsetX: 0,
          offsetY: 8,
          blur: 24,
          spread: 0,
          color: '#000000',
          opacity: 0.2,
        },
        {
          offsetX: 0,
          offsetY: 0,
          blur: 16,
          spread: 4,
          color: '#ffffff',
          opacity: 0.4,
          inset: true,
        },
      ],
    })

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const cta = updated.root.children[1]
      assert.equal(cta?.type, 'button')
      if (cta?.type === 'button') {
        assert.equal(cta.label, '시작하기')
        assert.deepEqual(cta.shape, {
          radius: 12,
          borderWidth: 1,
          borderColor: '#112233',
          borderStyle: 'solid',
          shadow: 'md',
          customShadows: [
            {
              offsetX: 0,
              offsetY: 8,
              blur: 24,
              spread: 0,
              color: '#000000',
              opacity: 0.2,
            },
            {
              offsetX: 0,
              offsetY: 0,
              blur: 16,
              spread: 4,
              color: '#ffffff',
              opacity: 0.4,
              inset: true,
            },
          ],
        })
      }
    }
  })

  it('removes shape fields and clears empty shape objects', () => {
    const shaped = updateShape(fixtureTree(), 'landing.card', {
      radius: 18,
      shadow: 'lg',
    })
    const reset = updateShape(shaped, 'landing.card', {
      radius: undefined,
      shadow: undefined,
    })

    assert.equal(reset.root.type, 'section')
    if (reset.root.type === 'section') {
      const card = reset.root.children[3]
      assert.equal(card?.type, 'card')
      if (card?.type === 'card') {
        assert.equal(card.shape, undefined)
      }
    }
  })

  it('updates color overrides on any node without changing content', () => {
    const tree = fixtureTree()
    const updated = updateColor(tree, 'landing.cta', {
      backgroundColor: '#f8fafc',
      hoverBackgroundColor: '#0f766e',
      hoverTextColor: '#ffffff',
      activeBackgroundColor: '#0b5f57',
      activeTextColor: '#f8fafc',
      focusBackgroundColor: '#114b5f',
      focusTextColor: '#f0fdfa',
      disabledBackgroundColor: '#64748b',
      disabledTextColor: '#f8fafc',
      textColor: '#123456',
    })

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const cta = updated.root.children[1]
      assert.equal(cta?.type, 'button')
      if (cta?.type === 'button') {
        assert.equal(cta.label, '시작하기')
        assert.deepEqual(cta.color, {
          backgroundColor: '#f8fafc',
          hoverBackgroundColor: '#0f766e',
          hoverTextColor: '#ffffff',
          activeBackgroundColor: '#0b5f57',
          activeTextColor: '#f8fafc',
          focusBackgroundColor: '#114b5f',
          focusTextColor: '#f0fdfa',
          disabledBackgroundColor: '#64748b',
          disabledTextColor: '#f8fafc',
          textColor: '#123456',
        })
      }
    }
  })

  it('removes color fields and clears empty color objects', () => {
    const colored = updateColor(fixtureTree(), 'landing.card', {
      backgroundColor: '#f8fafc',
      textColor: '#123456',
    })
    const reset = updateColor(colored, 'landing.card', {
      backgroundColor: undefined,
      textColor: undefined,
    })

    assert.equal(reset.root.type, 'section')
    if (reset.root.type === 'section') {
      const card = reset.root.children[3]
      assert.equal(card?.type, 'card')
      if (card?.type === 'card') {
        assert.equal(card.color, undefined)
      }
    }
  })

  it('updates layout overrides on any node without changing content', () => {
    const tree = fixtureTree()
    const updated = updateLayout(tree, 'landing.card', {
      direction: 'row',
      align: 'center',
      justify: 'evenly',
      wrap: 'wrap',
    })

    assert.equal(updated.root.type, 'section')
    if (updated.root.type === 'section') {
      const card = updated.root.children[3]
      assert.equal(card?.type, 'card')
      if (card?.type === 'card') {
        assert.equal(card.children[0]?.id, 'landing.card.title')
        assert.deepEqual(card.layout, {
          direction: 'row',
          align: 'center',
          justify: 'evenly',
          wrap: 'wrap',
        })
      }
    }
  })

  it('removes layout fields and clears empty layout objects', () => {
    const layouted = updateLayout(fixtureTree(), 'landing.card', {
      direction: 'column',
      justify: 'between',
    })
    const reset = updateLayout(layouted, 'landing.card', {
      direction: undefined,
      justify: undefined,
    })

    assert.equal(reset.root.type, 'section')
    if (reset.root.type === 'section') {
      const card = reset.root.children[3]
      assert.equal(card?.type, 'card')
      if (card?.type === 'card') {
        assert.equal(card.layout, undefined)
      }
    }
  })

  it('throws when structure operations target the root', () => {
    assert.throws(
      () => moveNode(fixtureTree(), 'landing', 'down'),
      /moveNode cannot target root node: landing/,
    )
    assert.throws(
      () => duplicateNode(fixtureTree(), 'landing'),
      /duplicateNode cannot target root node: landing/,
    )
    assert.throws(
      () => deleteNode(fixtureTree(), 'landing'),
      /deleteNode cannot target root node: landing/,
    )
  })

  it('throws when a node cannot move beyond sibling bounds', () => {
    assert.throws(
      () => moveNode(fixtureTree(), 'landing.title', 'up'),
      /cannot move up: landing.title/,
    )
    assert.throws(
      () => moveNode(fixtureTree(), 'landing.card', 'down'),
      /cannot move down: landing.card/,
    )
  })

  it('throws when the node id does not exist', () => {
    assert.throws(
      () => updateText(fixtureTree(), 'missing', 'x'),
      /node not found: missing/,
    )
  })

  it('throws when the operation targets the wrong node type', () => {
    assert.throws(
      () => updateText(fixtureTree(), 'landing.cta', 'x'),
      /updateText requires text node, got button/,
    )

    assert.throws(
      () => updateImage(fixtureTree(), 'landing.title', { alt: 'x' }),
      /updateImage requires image node, got text/,
    )

    assert.throws(
      () => updateTextTypography(fixtureTree(), 'landing.cta', { fontSize: 18 }),
      /updateTextTypography requires text node, got button/,
    )
  })
})
