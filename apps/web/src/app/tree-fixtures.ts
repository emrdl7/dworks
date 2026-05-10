import { treeSchema, type Tree } from '@dworks/tree'

import cardGridRaw from '../../../../seeds/trees/card-grid.json'
import darkLuxuryHeroRaw from '../../../../seeds/trees/dark-luxury-hero.json'
import minimalPortfolioRaw from '../../../../seeds/trees/minimal-portfolio.json'
import playfulProductRaw from '../../../../seeds/trees/playful-product.json'
import saasDashboardRaw from '../../../../seeds/trees/saas-dashboard.json'
import signupFormRaw from '../../../../seeds/trees/signup-form.json'
import simpleHeroRaw from '../../../../seeds/trees/simple-hero.json'

export interface TreeFixture {
  id: string
  name: string
  description: string
  tree: Tree
}

const simpleHeroFixture: TreeFixture = {
  id: 'simple-hero',
  name: '단순 히어로',
  description: '히어로 제목, 본문, 주요 행동 버튼',
  tree: parseFixtureTree(simpleHeroRaw),
}

const cardGridFixture: TreeFixture = {
  id: 'card-grid',
  name: '카드 그리드',
  description: '섹션 제목과 기능 카드 3개',
  tree: parseFixtureTree(cardGridRaw),
}

const signupFormFixture: TreeFixture = {
  id: 'signup-form',
  name: '가입 폼',
  description: '라벨과 주요 행동 버튼이 있는 짧은 폼',
  tree: parseFixtureTree(signupFormRaw),
}

const darkLuxuryHeroFixture: TreeFixture = {
  id: 'dark-luxury-hero',
  name: '다크 럭셔리 hero',
  description: '미드나잇 그라디언트 + 보라/시안/민트 액센트 — 럭셔리 브랜드용',
  tree: parseFixtureTree(darkLuxuryHeroRaw),
}

const saasDashboardFixture: TreeFixture = {
  id: 'saas-dashboard',
  name: 'SaaS 대시보드 랜딩',
  description: 'B2B navy 톤 — hero + 로고 strip + 3-card features + stats + final CTA + footer',
  tree: parseFixtureTree(saasDashboardRaw),
}

const minimalPortfolioFixture: TreeFixture = {
  id: 'minimal-portfolio',
  name: '미니멀 포트폴리오',
  description: '서체 중심 monochrome — 디자이너/스튜디오용. serif heading + 작품 grid + about',
  tree: parseFixtureTree(minimalPortfolioRaw),
}

const playfulProductFixture: TreeFixture = {
  id: 'playful-product',
  name: 'GenZ 프로덕트 드롭',
  description: 'vivid 그라디언트 + 거대 typography + tilted card — 한정 드롭 / 라이프스타일 브랜드',
  tree: parseFixtureTree(playfulProductRaw),
}

export const treeFixtures = [
  simpleHeroFixture,
  cardGridFixture,
  signupFormFixture,
  darkLuxuryHeroFixture,
  saasDashboardFixture,
  minimalPortfolioFixture,
  playfulProductFixture,
]

export const defaultTreeFixture = simpleHeroFixture

export function getTreeFixture(fixtureId: string): TreeFixture | undefined {
  return treeFixtures.find((fixture) => fixture.id === fixtureId)
}

function parseFixtureTree(rawTree: unknown): Tree {
  return treeSchema.parse(rawTree)
}
