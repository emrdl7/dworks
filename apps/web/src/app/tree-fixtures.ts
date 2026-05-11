import {
  ClipboardEdit,
  GalleryHorizontal,
  HelpCircle,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Minus,
  Moon,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react'

import { treeSchema, type Tree } from '@dworks/tree'

import cardGridRaw from '../../../../seeds/trees/card-grid.json'
import darkLuxuryHeroRaw from '../../../../seeds/trees/dark-luxury-hero.json'
import faqAccordionRaw from '../../../../seeds/trees/faq-accordion.json'
import minimalPortfolioRaw from '../../../../seeds/trees/minimal-portfolio.json'
import playfulProductRaw from '../../../../seeds/trees/playful-product.json'
import pricingTierRaw from '../../../../seeds/trees/pricing-tier.json'
import productsCarouselRaw from '../../../../seeds/trees/products-carousel.json'
import saasDashboardRaw from '../../../../seeds/trees/saas-dashboard.json'
import signupFormRaw from '../../../../seeds/trees/signup-form.json'
import simpleHeroRaw from '../../../../seeds/trees/simple-hero.json'

// fixture 카드 메타. icon 필드는 UX-04 D-11 잠금 — ComponentLibraryPanel 의
// 패턴 카드 상단 32×32 thumbnail 로 렌더된다.
export interface TreeFixture {
  id: string
  name: string
  description: string
  tree: Tree
  icon: LucideIcon
}

const simpleHeroFixture: TreeFixture = {
  id: 'simple-hero',
  name: '단순 히어로',
  description: '히어로 제목, 본문, 주요 행동 버튼',
  tree: parseFixtureTree(simpleHeroRaw),
  icon: LayoutTemplate,
}

const cardGridFixture: TreeFixture = {
  id: 'card-grid',
  name: '카드 그리드',
  description: '섹션 제목과 기능 카드 3개',
  tree: parseFixtureTree(cardGridRaw),
  icon: LayoutGrid,
}

const signupFormFixture: TreeFixture = {
  id: 'signup-form',
  name: '가입 폼',
  description: '라벨과 주요 행동 버튼이 있는 짧은 폼',
  tree: parseFixtureTree(signupFormRaw),
  icon: ClipboardEdit,
}

const darkLuxuryHeroFixture: TreeFixture = {
  id: 'dark-luxury-hero',
  name: '다크 럭셔리 hero',
  description: '미드나잇 그라디언트 + 보라/시안/민트 액센트 — 럭셔리 브랜드용',
  tree: parseFixtureTree(darkLuxuryHeroRaw),
  icon: Moon,
}

const saasDashboardFixture: TreeFixture = {
  id: 'saas-dashboard',
  name: 'SaaS 대시보드 랜딩',
  description: 'B2B navy 톤 — hero + 로고 strip + 3-card features + stats + final CTA + footer',
  tree: parseFixtureTree(saasDashboardRaw),
  icon: LayoutDashboard,
}

const minimalPortfolioFixture: TreeFixture = {
  id: 'minimal-portfolio',
  name: '미니멀 포트폴리오',
  description: '서체 중심 monochrome — 디자이너/스튜디오용. serif heading + 작품 grid + about',
  tree: parseFixtureTree(minimalPortfolioRaw),
  icon: Minus,
}

const playfulProductFixture: TreeFixture = {
  id: 'playful-product',
  name: 'GenZ 프로덕트 드롭',
  description: 'vivid 그라디언트 + 거대 typography + tilted card — 한정 드롭 / 라이프스타일 브랜드',
  tree: parseFixtureTree(playfulProductRaw),
  icon: Sparkles,
}

// UX-04 신규 3 fixture — Phase 1 Wave 5 추가 (가격표/캐러셀/FAQ).
const pricingTierFixture: TreeFixture = {
  id: 'pricing-tier',
  name: '가격표',
  description: '가격표 (3 카드 + 강조 1)',
  tree: parseFixtureTree(pricingTierRaw),
  icon: Tag,
}

const productsCarouselFixture: TreeFixture = {
  id: 'products-carousel',
  name: '상품 캐러셀',
  description: '상품 캐러셀 (4 슬라이드)',
  tree: parseFixtureTree(productsCarouselRaw),
  icon: GalleryHorizontal,
}

const faqAccordionFixture: TreeFixture = {
  id: 'faq-accordion',
  name: 'FAQ 아코디언',
  description: 'FAQ 아코디언 (5 entries)',
  tree: parseFixtureTree(faqAccordionRaw),
  icon: HelpCircle,
}

export const treeFixtures: readonly TreeFixture[] = [
  simpleHeroFixture,
  cardGridFixture,
  signupFormFixture,
  darkLuxuryHeroFixture,
  saasDashboardFixture,
  minimalPortfolioFixture,
  playfulProductFixture,
  pricingTierFixture,
  productsCarouselFixture,
  faqAccordionFixture,
]

export const defaultTreeFixture = simpleHeroFixture

export function getTreeFixture(fixtureId: string): TreeFixture | undefined {
  return treeFixtures.find((fixture) => fixture.id === fixtureId)
}

function parseFixtureTree(rawTree: unknown): Tree {
  return treeSchema.parse(rawTree)
}
