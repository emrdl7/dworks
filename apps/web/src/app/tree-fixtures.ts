import { treeSchema, type Tree } from '@dworks/tree'

import cardGridRaw from '../../../../seeds/trees/card-grid.json'
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

export const treeFixtures = [
  simpleHeroFixture,
  cardGridFixture,
  signupFormFixture,
]

export const defaultTreeFixture = simpleHeroFixture

export function getTreeFixture(fixtureId: string): TreeFixture | undefined {
  return treeFixtures.find((fixture) => fixture.id === fixtureId)
}

function parseFixtureTree(rawTree: unknown): Tree {
  return treeSchema.parse(rawTree)
}
