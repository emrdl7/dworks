# Phase 2: AI 생성 품질 자동 검증 - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 7 (4 src + 3 test)
**Analogs found:** 7 / 7 (모두 in-file 자체 analog — 동일 파일 기존 패턴 확장)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/web/src/app/richness.ts` | validator (utility) | transform | `richness.ts` 자체 (#1~#8 신호) | exact (in-file extension) |
| `apps/web/src/app/generation-normalize.ts` | normalizer (transform pipeline) | transform | `generation-normalize.ts` 자체 (deduplicateIds/ensureRootSection 패턴) | exact (in-file extension) |
| `apps/web/src/app/image-color.ts` | utility (pixel analysis) | transform | `image-color.ts` 자체 (extractDominantColors bucket 패턴) | exact (in-file extension) |
| `packages/llm-prompts/src/index.ts` | config (system prompt + brief builder) | static + transform | `index.ts:1622` 13신호 섹션 + `formatBriefAsUserPrompt:139` 이미지 ref 블록 | exact (in-file extension) |
| `apps/web/src/app/richness.test.ts` | test (vitest/node:test) | n/a | `richness.test.ts` 자체 (`structuredRich` fixture 패턴) | exact (in-file extension) |
| `apps/web/src/app/generation-normalize.test.ts` | test | n/a | `generation-normalize.test.ts` 자체 (`makeTree`/`makeSection`/`makeText` helper) | exact (in-file extension) |
| `apps/web/src/app/image-color.test.ts` | test | n/a | `image-color.test.ts` 자체 (`rgbaPlane` helper) | exact (in-file extension) |

**Test runner note:** 모든 test 파일은 `node:test` + `node:assert/strict` 사용 (Vitest 아님 — CONTEXT의 "Vitest" 언급은 패턴 명칭이지만 실제 runner는 node built-in). 신규 테스트도 동일 patten 유지.

---

## Pattern Assignments

### `apps/web/src/app/richness.ts` (validator, transform)

**Analog:** 동일 파일 — 기존 8 신호 측정 패턴을 5 신호에 그대로 적용.

**(A) 신호 상수 + 키 list 패턴** (lines 35-46) — 5 신호 키 append:
```typescript
export const RICHNESS_SIGNAL_KEYS: RichnessSignalKey[] = [
  'hasPageLandmarks',
  'hasMainMultiSection',
  // ...기존 8 신호...
  'hasShapeDepth',
]
const SIGNAL_COUNT = 8   // → 13으로 변경
```
→ 5 신호 key (designOverrideVariety / sectionVisualVariety / nodeTypeVariety / interactiveComponent / entranceAnimationSpread) 를 array 끝에 append, SIGNAL_COUNT = 13.

**(B) visit 콜백 누적 패턴** (lines 74-136) — Set/counter 누적:
```typescript
visit(tree.root, (n) => {
  const node = n as unknown as Record<string, unknown>
  if (typeof node.role === 'string') landmarkRoles.add(node.role)
  if (node.role === 'main' && isContainer(n)) {
    const directSectionCount = n.children.filter((c) =>
      c.type === 'section' || c.type === 'hero',
    ).length
    if (directSectionCount >= 2) mainMultiSection = true
  }
  // ...
})
```
→ 신호 #9~#13 동일 패턴으로 누적:
- `#9 designOverrideVariety`: `let overrideCount = 0`; node 별 spacing/color/typography/shape/layout 중 하나라도 있으면 +1. `overrideCount >= 12` 체크.
- `#10 sectionVisualVariety`: `const sectionBgs = new Set<string>()`; `role==='main'` 직계 section/hero 의 `color.backgroundColor` 또는 `color.backgroundGradient` 누적. `sectionBgs.size >= 2`.
- `#11 nodeTypeVariety`: `const containerTypes = new Set<string>()`; type ∈ {section, hero, card, list, form} 누적. `containerTypes.size >= 3`.
- `#12 interactiveComponent`: `let interactiveCount = 0`; type ∈ {carousel, tabs, accordion, modal}. `interactiveCount >= 1`.
- `#13 entranceAnimationSpread`: `let animatedCount = 0`; `node.entranceAnimation !== undefined` 카운트. `animatedCount >= 6 && animatedCount <= 12`.

**(C) signals 객체 + score 패턴** (lines 138-153):
```typescript
const signals = { hasPageLandmarks: ..., /* 8개 */ }
const trueCount = Object.values(signals).filter(Boolean).length
const score = trueCount / SIGNAL_COUNT
return { ...signals, score }
```
→ signals 객체에 5 key 추가, SIGNAL_COUNT = 13, return 그대로.

**(D) D-03 validateTreeRichness 신규 API** (no analog — 새 함수):
```typescript
export function validateTreeRichness(tree: Tree): {
  signals: Omit<RichnessReport, 'score'>
  score: number
  missing: RichnessSignalKey[]
} {
  const report = computeRichnessReport(tree)
  const { score, ...signals } = report
  const missing = RICHNESS_SIGNAL_KEYS.filter((key) => signals[key] === false)
  return { signals, score, missing }
}
```
→ `computeRichnessReport` wrap + `missing[]` derive (RICHNESS_SIGNAL_KEYS 순회).

---

### `apps/web/src/app/generation-normalize.ts` (normalizer, transform)

**Analog:** 동일 파일 — `normalizeDesignTree` (lines 60-70) 의 sequential pipeline 패턴 + `ensureRootSection`/`deduplicateIds` 의 immutable tree transform 패턴.

**(A) sequential pipeline 패턴** (lines 60-70):
```typescript
export function normalizeDesignTree(tree, context = {}) {
  const fallbackRootId = context.fallbackRootId ?? 'auto-root-section'
  // 1) root이 section임을 보장
  const rooted = ensureRootSection(tree.root, fallbackRootId)
  // 2) id 중복 제거
  const deduped = deduplicateIds(rooted, new Set<string>())
  return { ...tree, root: deduped }
}
```
→ enforceRichness 는 _마지막 단계_ (3번)로 추가 — D-04 idempotent + safe 변환:
```typescript
export function normalizeDesignTree(tree, context = {}) {
  const fallbackRootId = context.fallbackRootId ?? 'auto-root-section'
  const rooted = ensureRootSection(tree.root, fallbackRootId)
  const deduped = deduplicateIds(rooted, new Set<string>())
  // 3) 풍부도 미달 신호 자동 보강 (idempotent + safe)
  const enforced = context.prompt !== undefined
    ? enforceRichness({ ...tree, root: deduped }, context.prompt)
    : { ...tree, root: deduped }
  return enforced
}
```

**(B) immutable spread + 재귀 패턴** (lines 22-43, `deduplicateIds`):
```typescript
function deduplicateIds(node: TreeNode, seen: Set<string>): TreeNode {
  let nextId = node.id
  if (seen.has(nextId)) { /* ... */ }
  if ('children' in node && Array.isArray(node.children)) {
    return { ...node, id: nextId, children: node.children.map(...) } as TreeNode
  }
  return { ...node, id: nextId } as TreeNode
}
```
→ 새 helper `addEntranceAnimation` / `addInteractiveComponent` 동일 immutable spread 패턴:
- `addEntranceAnimation(node, anim)` — `{ ...node, entranceAnimation: anim }` (D-10: 기존 값 있으면 skip).
- `appendInteractiveComponent(mainNode, component)` — `{ ...mainNode, children: [...children.slice(0,-1), component, lastSection] }` (D-06: 마지막 section 직전).

**(C) 신규 enforceRichness 함수** — boundary가 명확한 sub-routines:
```typescript
function enforceRichness(tree: Tree, prompt: string): Tree {
  const { missing } = validateTreeRichness(tree)
  let next = tree
  if (missing.includes('interactiveComponent')) {
    next = ensureInteractiveComponent(next, inferDomain(prompt))  // D-05, D-07
  }
  if (missing.includes('entranceAnimationSpread')) {
    next = ensureEntranceAnimations(next)  // D-08, D-09, D-10
  }
  if (missing.includes('hasCallToAction')) {
    next = ensureCallToAction(next)
  }
  return next
}
```

**(D) 도메인 추론** (D-05) — pure keyword match:
```typescript
function inferDomain(prompt: string): 'ecommerce' | 'saas' | 'faq' | 'auth' | 'default' {
  const p = prompt.toLowerCase()
  if (/e-?commerce|쇼핑|제품|카탈로그/.test(p)) return 'ecommerce'  // → carousel
  if (/saas|b2b|dashboard|기능|pricing/.test(p)) return 'saas'      // → tabs
  if (/faq|컨퍼런스|일정|specs/.test(p)) return 'faq'                // → accordion
  if (/가입|회원|약관/.test(p)) return 'auth'                        // → modal
  return 'default'                                                   // → accordion
}
```

---

### `apps/web/src/app/image-color.ts` (utility, transform)

**Analog:** 동일 파일 — `extractDominantColors` (lines 22-62) 의 bucket histogram 패턴 + `pickAspectRatio` (lines 64-81) 의 ratio bin 패턴.

**(A) RgbaPixelSource + count 파라미터** (lines 13-26) — extractDominantColors 시그니처는 _이미 count=5 지원_:
```typescript
export interface RgbaPixelSource {
  data: Uint8ClampedArray | number[]
  width: number
  height: number
}
export function extractDominantColors(source: RgbaPixelSource, count = 5): string[] {
  if (count <= 0) return []
  // bucket histogram ...
}
```
→ **D-14 의 "count=5"는 이미 default**. 추가 작업은 HSL 분류 (light/dark/neutral) 부착 — 반환 타입 확장이 필요하면 별도 함수:
```typescript
export interface DominantColorsAnalysis {
  hexes: string[]                          // top 5 hex
  classifications: Array<'light' | 'dark' | 'neutral'>  // 각 hex 의 HSL 분류
}
export function analyzeDominantColors(source: RgbaPixelSource, count = 5): DominantColorsAnalysis
```
→ HSL 변환 helper 추가 (`rgbToHsl`), `classifyByLuminance` (L>0.7 → light, L<0.3 → dark, else neutral).

**(B) quadrant 분석 — layout intent** (no analog in file; pixel scan 패턴은 `extractDominantColors` for-loop 22-62 와 동일 구조):
```typescript
// extractDominantColors의 픽셀 순회 패턴 재사용
for (let i = 0; i < data.length; i += 4) {
  const r = data[i] ?? 0, g = data[i + 1] ?? 0, b = data[i + 2] ?? 0, a = data[i + 3] ?? 255
  if (a < 128) continue
  // bucket key 계산 ...
}
```
→ extractLayoutIntent 동일 픽셀 순회 패턴 + pixel index → (x, y) 좌표 → 사분면 카운트:
```typescript
export type LayoutIntent = 'centered' | 'left-aligned' | 'grid' | 'asymmetric'
export function extractLayoutIntent(source: RgbaPixelSource): LayoutIntent {
  const { data, width, height } = source
  const halfW = width / 2, halfH = height / 2
  let tl = 0, tr = 0, bl = 0, br = 0
  let totalNonBg = 0
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] ?? 255
    if (a < 128) continue
    // 콘텐츠 mass 판별 — luminance variance 또는 saturated pixel
    const pi = i / 4
    const x = pi % width, y = Math.floor(pi / width)
    totalNonBg += 1
    if (x < halfW && y < halfH) tl += 1
    else if (x >= halfW && y < halfH) tr += 1
    else if (x < halfW && y >= halfH) bl += 1
    else br += 1
  }
  // heuristic: 좌측 두 사분면 합 > 우측 → left-aligned
  //           네 사분면 균등 (CV<0.2) → grid
  //           중앙 집중 (네 사분면 비슷 + 외곽 적음) → centered
  //           나머지 → asymmetric
}
```

**(C) pickAspectRatio 의 enum return 패턴** (lines 64-81) — extractLayoutIntent 도 동일 union literal return:
```typescript
if (ratio >= 1.7) return 'wide'
if (ratio >= 1.2) return 'landscape'
// ...
```

---

### `packages/llm-prompts/src/index.ts` (config, static + transform)

**Analog:** 동일 파일 — 두 곳:
1. `index.ts:1622-1638` 13 신호 자체 점검 섹션 — 매트릭스 표 추가 위치.
2. `formatBriefAsUserPrompt:139-174` 의 image reference block — `<reference_image_analysis>` 블록 inject 위치.

**(A) markdown 섹션 추가 패턴** (lines 1622-1638):
```typescript
## 풍부도 13 신호 자체 점검
응답 직전 트리를 13 신호로 자체 검사하고 ...
1. **랜드마크 구조** — ...
13. **진입 애니메이션** — ...
```
→ 신호 13 섹션 _뒤_ (line ~1639 직전) 에 신규 markdown 섹션 추가:
```typescript
## 도메인 × 톤 매트릭스
다음 표는 도메인(행) × 톤(열) 별 _권장 톤 가이드_다. 사용자 도메인+톤이 추론되면 셀의 가이드를 _시드_로 적용.

| 도메인 \ 톤   | dark/luxury | playful/GenZ | minimal/zen | professional | warm/friendly |
|---            |---          |---           |---          |---           |---           |
| e-commerce    | (셀 2-3줄)  | ...          | ...         | ...          | ...          |
| SaaS          | ...         | ...          | ...         | ...          | ...          |
| portfolio     | ...         | ...          | ...         | ...          | ...          |
| event         | ...         | ...          | ...         | ...          | ...          |
| education     | ...         | ...          | ...         | ...          | ...          |
| health        | ...         | ...          | ...         | ...          | ...          |
```
→ 셀 내용 source: line 1640-1655 (11 톤 매핑) + line 1660-1665 (도메인 4개 예시).

**(B) image reference 블록 패턴** (lines 142-174, `formatBriefAsUserPrompt`):
```typescript
if (refs.length === 1) {
  const ref = refs[0]
  if (ref !== undefined) {
    lines.push('', `### 참고 이미지 시드`)
    lines.push(`- 주요 색: ${ref.colors.join(', ')}`)
    if (ref.aspectRatio !== undefined) {
      lines.push(`- 화면 비율: ${ref.aspectRatio}`)
    }
    // ...
  }
}
```
→ `<reference_image_analysis>` 블록 추가 (D-16) — 기존 `### 참고 이미지 시드` 블록 _뒤_ 에 inject:
```typescript
// 참고 이미지의 dominantColors + layoutIntent 가 ImageReference 에 있으면 노출
if (ref.dominantColors !== undefined || ref.layoutIntent !== undefined) {
  lines.push('', `<reference_image_analysis>`)
  if (ref.dominantColors !== undefined) {
    lines.push(`dominantColors: [${ref.dominantColors.join(', ')}]`)
  }
  if (ref.layoutIntent !== undefined) {
    lines.push(`layoutIntent: '${ref.layoutIntent}'`)
  }
  lines.push(`</reference_image_analysis>`)
}
```
→ `ImageReference` interface (lines 21-26) 확장:
```typescript
export interface ImageReference {
  colors: string[]
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
  /** D-14: 5색 dominant + light/dark/neutral 분류 결과 (v2 신규) */
  dominantColors?: string[]
  /** D-15: 레이아웃 의도 추출 결과 (v2 신규) */
  layoutIntent?: 'centered' | 'left-aligned' | 'grid' | 'asymmetric'
}
```

---

### `apps/web/src/app/richness.test.ts` (test)

**Analog:** 동일 파일 — `structuredRich` fixture (lines 27-112) + `it('structured rich tree satisfies all 8 quality signals')` 패턴.

**(A) fixture 확장 패턴** (lines 27-112) — `structuredRich` 트리에 5 신호 만족 노드 append:
```typescript
const structuredRich: Tree = {
  version: '1',
  root: {
    id: 'page',
    type: 'section',
    // ...children에 banner / main / footer 3 섹션...
  },
}
```
→ 신규 fixture `structuredFullRich` (또는 structuredRich 확장) — 13 신호 모두 만족:
- main 직계 section 4개 이상 (현재 2개 → 추가)
- 12+ 노드에 spacing/color/typography/shape/layout override (신호 #9)
- main 직계 section 들 backgroundColor 서로 다르게 (신호 #10)
- type 'card' 또는 'list' 또는 'form' 1개 추가 (신호 #11 — section/hero 외 1종)
- `type: 'accordion'` 노드 1개 추가 (신호 #12)
- 6-12 노드에 `entranceAnimation` 박기 (신호 #13)

**(B) 단일 신호 assertion 패턴** (lines 114-135):
```typescript
it('structured rich tree satisfies all 8 quality signals', () => {
  const report = computeRichnessReport(structuredRich)
  assert.equal(report.hasPageLandmarks, true)
  assert.equal(report.hasMainMultiSection, true)
  // ...
  assert.equal(report.score, 1)
})
```
→ 신규 it 블록 5개 — 신호 별 isolated fixture + 단일 assertion:
```typescript
it('#9 designOverrideVariety — 12 노드 이상 override 시 true', () => {
  const report = computeRichnessReport(fixtureWithOverrides)
  assert.equal(report.designOverrideVariety, true)
})
it('#10 sectionVisualVariety — section bg 2종 이상 시 true', () => { /* ... */ })
it('#11 nodeTypeVariety — container type 3종 이상 시 true', () => { /* ... */ })
it('#12 interactiveComponent — accordion 노드 시 true', () => { /* ... */ })
it('#13 entranceAnimationSpread — 6-12 노드 entranceAnimation 시 true', () => { /* ... */ })
```

**(C) validateTreeRichness API 테스트** (no analog — 새 함수):
```typescript
it('validateTreeRichness — bare tree 는 missing 13개', () => {
  const result = validateTreeRichness(bare)
  assert.equal(result.score, 0)
  assert.equal(result.missing.length, 13)
})
it('validateTreeRichness — structuredFullRich 는 missing 0개', () => {
  const result = validateTreeRichness(structuredFullRich)
  assert.deepEqual(result.missing, [])
})
```

---

### `apps/web/src/app/generation-normalize.test.ts` (test)

**Analog:** 동일 파일 — `makeTree`/`makeSection`/`makeText` helpers (lines 10-34) + `describe('normalizeDesignTree')` 의 단일 책임 it 블록 패턴.

**(A) factory helper 패턴** (lines 10-34):
```typescript
function makeTree(root: TreeNode): Tree { return { version: '1', root } as Tree }
function makeSection(overrides: Partial<TreeNode> = {}): TreeNode {
  return { id: 'n-section', type: 'section', editKind: 'structure', children: [], ...overrides } as TreeNode
}
function makeText(overrides: Partial<TreeNode> = {}): TreeNode { /* ... */ }
```
→ 신규 helper `makeHero`, `makeAccordion`, `makeEntranceAnim` 동일 패턴:
```typescript
function makeAccordion(overrides: Partial<TreeNode> = {}): TreeNode {
  return { id: 'n-accordion', type: 'accordion', editKind: 'structure', items: [], ...overrides } as TreeNode
}
```

**(B) it 블록 단일 책임 패턴** (lines 37-109):
```typescript
it('root이 section이면 그대로 통과', () => {
  const tree = makeTree(makeSection())
  const out = normalizeDesignTree(tree)
  assert.equal(out.root.id, 'n-section')
})
```
→ 신규 it 블록 (enforceRichness 시나리오):
```typescript
it('enforceRichness — interactiveComponent 부재 시 prompt 도메인 추론 후 1개 추가', () => {
  const tree = makeTreeMissingInteractive()   // missing #12
  const out = normalizeDesignTree(tree, { prompt: 'SaaS dashboard 페이지' })
  // 도메인 saas → tabs 추가 확인
  assert.ok(findFirstByType(out.root, 'tabs') !== undefined)
})

it('enforceRichness — entranceAnimation 부재 시 hero.title + cards + final CTA 에 박힘', () => {
  const tree = makeTreeMissingAnimations()    // missing #13
  const out = normalizeDesignTree(tree, { prompt: '카페 랜딩' })
  // animatedCount 6~8 사이
})

it('enforceRichness — 이미 entranceAnimation 있으면 덮어쓰지 않음 (D-10)', () => {
  const tree = makeTreeWithExistingAnim('slide-up', 700)
  const out = normalizeDesignTree(tree, { prompt: '...' })
  // hero.title 의 entranceAnimation.type 이 'slide-up' 유지
})

it('enforceRichness — 이미 interactive 1개 이상이면 추가하지 않음 (D-07)', () => { /* ... */ })

it('enforceRichness — idempotent (두 번 호출해도 같은 결과)', () => {
  const tree = makeTreeMissingInteractive()
  const once = normalizeDesignTree(tree, { prompt: '...' })
  const twice = normalizeDesignTree(once, { prompt: '...' })
  assert.deepEqual(once, twice)
})
```

---

### `apps/web/src/app/image-color.test.ts` (test)

**Analog:** 동일 파일 — `rgbaPlane` helper (lines 14-25) + `describe('extractDominantColors')` 패턴.

**(A) rgbaPlane helper 패턴** (lines 14-25):
```typescript
function rgbaPlane(pixels: Array<[number, number, number, number]>): Uint8ClampedArray {
  const data = new Uint8ClampedArray(pixels.length * 4)
  for (let i = 0; i < pixels.length; i++) { /* ... */ }
  return data
}
```
→ 그대로 재사용 — multi-dominant + layout intent 테스트도 동일 helper.

**(B) 단일 색 시나리오 패턴** (lines 28-40):
```typescript
it('단일 색만 있는 이미지에서 그 색을 반환한다', () => {
  const data = rgbaPlane([
    [255, 0, 0, 255], [255, 0, 0, 255], [255, 0, 0, 255], [255, 0, 0, 255],
  ])
  const colors = extractDominantColors({ data, width: 2, height: 2 }, 5)
  assert.equal(colors[0], '#ff0000')
})
```
→ 신규 multi-dominant + classification 테스트:
```typescript
it('analyzeDominantColors — 5색 HSL 분류 (light/dark/neutral)', () => {
  const data = rgbaPlane([
    [10, 10, 10, 255],      // dark
    [240, 240, 240, 255],   // light
    [128, 128, 128, 255],   // neutral
    [255, 0, 0, 255],       // saturated (neutral-ish luminance)
    [0, 0, 255, 255],       // saturated dark
  ])
  const result = analyzeDominantColors({ data, width: 5, height: 1 }, 5)
  assert.equal(result.hexes.length, 5)
  assert.ok(result.classifications.includes('dark'))
  assert.ok(result.classifications.includes('light'))
})
```

**(C) extractLayoutIntent 신규 테스트** — 사분면 픽셀 분포 fixture:
```typescript
it('extractLayoutIntent — 좌측 두 사분면 집중 → left-aligned', () => {
  // 4x2 grid, 좌측 두 칸만 colored, 우측 두 칸 투명
  const data = rgbaPlane([
    [255, 0, 0, 255], [0, 0, 0, 0],
    [255, 0, 0, 255], [0, 0, 0, 0],
  ])
  assert.equal(extractLayoutIntent({ data, width: 2, height: 2 }), 'left-aligned')
})

it('extractLayoutIntent — 네 사분면 균등 → grid', () => { /* ... */ })
it('extractLayoutIntent — 중앙 집중 → centered', () => { /* ... */ })
it('extractLayoutIntent — 불규칙 → asymmetric', () => { /* ... */ })
```

---

## Shared Patterns

### 한국어 주석 + 한국어 toast (mandate)
**Source:** 모든 기존 파일 — `richness.ts:1-17`, `generation-normalize.ts:1-11`, `image-color.ts:1-11`.
**Apply to:** 모든 신규 코드. JSDoc 도 한국어. toast: `'풍부도 부족 — 재생성 권장 (점수 N/13)'` (D-04).
```typescript
// 디자인 풍부도(= 1 - AI 슬롭) 점수.
//
// apps/m3-eval/src/ai-slop.ts와 동일한 8 신호. ...
```

### TypeScript strict — `as unknown as Record<string, unknown>` 도피
**Source:** `richness.ts:85`
**Apply to:** 동적 TreeNode prop 접근 (entranceAnimation, color.backgroundGradient 등 — packages/tree 스키마에 union 으로 안 박힌 prop).
```typescript
visit(tree.root, (n) => {
  const node = n as unknown as Record<string, unknown>
  if (typeof node.role === 'string') landmarkRoles.add(node.role)
  // ...
})
```

### Pure function — DOM 의존 없음
**Source:** `image-color.ts:11-12` 헤더 주석 — "순수 함수 — DOM 없이 ImageData(=Uint8ClampedArray + width)만 받는다."
**Apply to:** extractLayoutIntent, analyzeDominantColors — 모두 RgbaPixelSource 만 받음. canvas 호출은 호출 측 책임.

### Immutable tree spread + 재귀
**Source:** `generation-normalize.ts:22-43` (`deduplicateIds`)
**Apply to:** enforceRichness 의 모든 mutation — `{ ...node, children: ... }` spread, 원본 비파괴.
```typescript
if ('children' in node && Array.isArray(node.children)) {
  return { ...node, id: nextId, children: node.children.map((c) => deduplicateIds(c, seen)) } as TreeNode
}
```

### node:test + node:assert/strict (runner)
**Source:** 모든 *.test.ts (`import { describe, it } from 'node:test'`)
**Apply to:** 모든 신규 테스트. Vitest 아님 — CONTEXT 가 "Vitest" 라고 적었으나 실제는 node built-in.
```typescript
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
```

### Korean test 설명 + describe 구조
**Source:** `generation-normalize.test.ts:36-110` ("root이 section이면 그대로 통과", "id 충돌은 suffix로 자동 rename")
**Apply to:** 신규 it 설명 한국어 + 짧고 동사형.

---

## No Analog Found

해당 없음 — 모든 신규 함수가 동일 파일 내 기존 패턴(visit 콜백, spread 재귀, bucket histogram, fixture/it 블록) 의 확장으로 표현 가능.

다만 _개념적_ 으로 새로운 영역:
| 신규 영역 | 영향 파일 | 비고 |
|---|---|---|
| HSL 변환 (RGB → light/dark/neutral) | `image-color.ts` | rgbToHex 옆에 `rgbToHsl` helper 추가. 수학적 변환 (no external dep). |
| Markdown table (도메인×톤 6×5) | `llm-prompts/src/index.ts` | 1622+ 자연어 섹션 추가. LLM parse 가 잘됨 → 단순 string 작성. |
| 도메인 keyword regex | `generation-normalize.ts` | 단순 `/regex/i.test(prompt)` — no library, pure. |

---

## Metadata

**Analog search scope:**
- `/Users/johyeonchang/dworks/apps/web/src/app/` (richness, generation-normalize, image-color 및 *.test.ts)
- `/Users/johyeonchang/dworks/packages/llm-prompts/src/` (index.ts:1-200 + 1600-1690)

**Files scanned:** 7 src + 1 prompt + 3 test = 11 reads (모두 1회, 비중복 range).

**Pattern extraction date:** 2026-05-11

**Stack confirmed:**
- TypeScript strict (`as unknown as Record<string, unknown>` 도피 패턴)
- node:test + node:assert/strict (Vitest 가 아님 — CONTEXT 표기 정정)
- 한국어 주석/토스트 mandate
- Pure functions (DOM-free for testability)
- Immutable tree transforms (`...spread` + map)
