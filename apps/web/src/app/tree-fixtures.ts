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
  name: 'Simple hero',
  description: 'Hero headline, body copy, primary CTA',
  tree: parseFixtureTree(simpleHeroRaw),
}

const cardGridFixture: TreeFixture = {
  id: 'card-grid',
  name: 'Card grid',
  description: 'Section heading and three feature cards',
  tree: parseFixtureTree(cardGridRaw),
}

const signupFormFixture: TreeFixture = {
  id: 'signup-form',
  name: 'Signup form',
  description: 'Short form with labels and CTA',
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
