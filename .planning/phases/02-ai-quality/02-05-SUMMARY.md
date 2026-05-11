---
phase: 02-ai-quality
plan: 05
subsystem: ai-quality-wiring
tags: [gap-closure, wiring, ai-01, ai-02, ai-03, ai-05]
status: complete
completed: 2026-05-11
duration_minutes: 12
tasks_completed: 2
tasks_total: 2
files_modified: 1
commits:
  - 9cb2818
  - 1518289
requires:
  - apps/web/src/app/generation-normalize.ts (Plan 02-04)
  - apps/web/src/app/image-color.ts (Plan 02-03)
  - packages/llm-prompts/src/index.ts (Plan 02-02, 02-03)
provides:
  - production wiring — normalizeDesignTree(success.tree, { prompt: submitted.intent })
  - production wiring — extractFromDataUrl → analyzeDominantColors + extractLayoutIntent → ImageReferenceSeed
affects:
  - AI-01 (production 도달)
  - AI-02 (production 도달)
  - AI-03 (production 도달)
  - AI-05 (production 도달)
tech-stack:
  added: []
  patterns:
    - "imageData pixelSource 재사용 — 3 함수 (extractDominantColors, analyzeDominantColors, extractLayoutIntent) 동일 객체 전달로 canvas 디코딩 코스트 1회 유지"
key-files:
  modified:
    - apps/web/src/app/page.tsx
  created: []
decisions:
  - "Backward compat 유지 — generation-normalize.ts:78 의 `context.prompt === undefined → early return` 보존, 호출 측에서 명시적 prompt 전달"
  - "ImageReferenceSeed 두 필드 모두 optional — legacy 단일 ref state (briefImageRef) 와 spread 호환"
  - "동일 pixelSource 재사용 — analyze + extractLayout 가 별도 canvas 디코딩하지 않음 (성능 보존)"
metrics:
  duration: "12 minutes"
  completed: "2026-05-11"
  tasks: 2
  files: 1
  loc_added: 34
  loc_removed: 8
---

# Phase 02 Plan 05: AI 품질 production wiring 갭 보강 Summary

`02-VERIFICATION.md` 의 Gap 1 (AI-01/02/03 자동 보강 hook 미실행) + Gap 2 (AI-05 image 분석 데이터 파이프라인 끊김) 두 wiring 결락을 `apps/web/src/app/page.tsx` 한 파일 두 commit 으로 해소.

## Goal Achievement

### Truth 1 — normalizeDesignTree 가 prompt 인자를 받아 enforceRichness 활성화

**Status:** VERIFIED

**Before (page.tsx:1878):**
```ts
tree: normalizeDesignTree(success.tree),
```

**After (page.tsx:1879):**
```ts
// AI-01/02/03 자동 보강 활성화 — prompt 전달 시에만 enforceRichness branch 실행 (D-05~10).
tree: normalizeDesignTree(success.tree, { prompt: submitted.intent }),
```

generation-normalize.ts:78 의 `if (context.prompt === undefined) return intermediate` early return 우회 → enforceRichness 가 실행 → ensureInteractiveComponent + ensureEntranceAnimations 두 sub-routine 이 사용자 화면에 도달.

**Evidence (grep):**
```
1879:        tree: normalizeDesignTree(success.tree, { prompt: submitted.intent }),
```

**Tests:**
- `generation-normalize.test.ts` 11/11 pass
- `@dworks/web tsc --noEmit` exit 0

### Truth 2 — 사용자 이미지가 dominantColors + layoutIntent 를 ImageReference 로 propagate

**Status:** VERIFIED

**Before (page.tsx:165 + 348-351 + 408-437 + 1517-1520):**
```ts
// import
import { extractDominantColors, pickAspectRatio } from './image-color'

// interface
interface ImageReferenceSeed {
  colors: string[]
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
}

// extractFromDataUrl 반환
const colors = extractDominantColors(
  { data: imageData.data, width: drawWidth, height: drawHeight },
  5,
)
return { colors, aspectRatio }

// newRefs.push
newRefs.push({
  colors,
  ...(aspectRatio !== null ? { aspectRatio } : {}),
})
```

**After:**
```ts
// import (line 165-171)
import {
  analyzeDominantColors,
  extractDominantColors,
  extractLayoutIntent,
  pickAspectRatio,
  type LayoutIntent,
} from './image-color'

// interface (line 354-360)
interface ImageReferenceSeed {
  colors: string[]
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
  // AI-05 — image-color.analyzeDominantColors / extractLayoutIntent 결과를 llm-prompts ImageReference 로 propagate.
  dominantColors?: string[]
  layoutIntent?: LayoutIntent
}

// extractFromDataUrl 반환 (line 446-457) — 동일 pixelSource 재사용
const pixelSource = {
  data: imageData.data,
  width: drawWidth,
  height: drawHeight,
}
// AI-05 — 5색 hex + light/dark/neutral 분류 + 4사분면 layout heuristic 동시 추출 (동일 imageData 재사용으로 1회 디코딩).
const colors = extractDominantColors(pixelSource, 5)
const analysis = analyzeDominantColors(pixelSource, 5)
const layoutIntent = extractLayoutIntent(pixelSource)
return {
  colors,
  aspectRatio,
  dominantColors: analysis.hexes,
  layoutIntent,
}

// newRefs.push (line 1539-1545)
// AI-05 — dominantColors / layoutIntent 를 ImageReferenceSeed 에 함께 저장 (llm-prompts <reference_image_analysis> inject 활성 조건).
newRefs.push({
  colors,
  ...(aspectRatio !== null ? { aspectRatio } : {}),
  dominantColors,
  layoutIntent,
})
```

**Evidence (grep):**
```
166:  analyzeDominantColors,
168:  extractLayoutIntent,
357:  // AI-05 — image-color.analyzeDominantColors / extractLayoutIntent 결과를 llm-prompts ImageReference 로 propagate.
358:  dominantColors?: string[]
359:  layoutIntent?: LayoutIntent
420:  dominantColors: string[]
421:  layoutIntent: LayoutIntent
450:  const analysis = analyzeDominantColors(pixelSource, 5)
451:  const layoutIntent = extractLayoutIntent(pixelSource)
455:    dominantColors: analysis.hexes,
1533:        const { colors, aspectRatio, dominantColors, layoutIntent } =
1543:          dominantColors,
1544:          layoutIntent,
```

**Tests:**
- `image-color.test.ts` 23/23 pass
- `richness.test.ts` 11/11 pass
- `@dworks/web tsc --noEmit` exit 0
- `@dworks/llm-prompts tsc --noEmit` exit 0

### Truth 3 — formatBriefAsUserPrompt 의 `<reference_image_analysis>` inject 블록이 실제 LLM prompt 에 포함

**Status:** VERIFIED (구조적)

ImageReferenceSeed → DesignBrief.imageReferences → llm-prompts ImageReference 의 structural compat:
- 두 인터페이스 모두 `dominantColors?: string[]` + `layoutIntent?: LayoutIntent` 옵셔널 필드
- LayoutIntent union 타입 동일 (`'centered' | 'left-aligned' | 'grid' | 'asymmetric'`)
- tsc strict 통과 — 호환성 확인됨

production 환경에서 사용자가 이미지 업로드 후 brief.intent 와 함께 LLM 호출 시:
1. handleImageRefAddFiles → extractFromDataUrl → ImageReferenceSeed 에 신규 필드 채워짐
2. setBriefImageRefs 로 state 저장
3. buildSubmittedBrief 가 imageReferences[] 로 DesignBrief 에 포함 (spread/copy 만 — 신규 필드 자동 propagate)
4. callGenerateOnce → API → llm-prompts formatBriefAsUserPrompt 의 line 164-180 inject 분기 진입 → user prompt 에 `<reference_image_analysis>` 블록 포함

(라인 4 의 실제 LLM 송출은 dev server + network 탭 spot-check 권장 — 단위 테스트 범위 외.)

## Deviations from Plan

None — 두 task 모두 plan 의 before/after diff 그대로 적용. tsc + 기존 45+ unit tests 회귀 없음.

## Verification Output

```bash
$ pnpm --filter @dworks/web exec tsc --noEmit
(exit 0, no output)

$ pnpm --filter @dworks/llm-prompts exec tsc --noEmit
(exit 0, no output)

$ pnpm --filter @dworks/web exec node --import tsx --test src/app/generation-normalize.test.ts
# tests 11 / pass 11 / fail 0

$ pnpm --filter @dworks/web exec node --import tsx --test src/app/image-color.test.ts
# tests 23 / pass 23 / fail 0

$ pnpm --filter @dworks/web exec node --import tsx --test src/app/richness.test.ts
# tests 11 / pass 11 / fail 0
```

## Requirements Coverage

| Requirement | Status (이전) | Status (이번 plan) | Production 도달 |
|---|---|---|---|
| AI-01 | BLOCKED (wiring) | UNBLOCKED | YES |
| AI-02 | BLOCKED (wiring) | UNBLOCKED | YES |
| AI-03 | BLOCKED (wiring) | UNBLOCKED | YES |
| AI-05 | BLOCKED (wiring) | UNBLOCKED | YES (single-ref; multi-ref aggregation 은 deferred override 유지) |

## Commits

| Commit | Task | Files |
|---|---|---|
| 9cb2818 | Task 1: normalizeDesignTree({ prompt: submitted.intent }) | apps/web/src/app/page.tsx |
| 1518289 | Task 2: extractFromDataUrl → analyzeDominantColors + extractLayoutIntent + ImageReferenceSeed 확장 | apps/web/src/app/page.tsx |

## Self-Check: PASSED

- [x] page.tsx:1879 grep 매치 (`normalizeDesignTree(success.tree, { prompt: submitted.intent })`)
- [x] page.tsx:450-451 grep 매치 (`analyzeDominantColors(pixelSource`, `extractLayoutIntent(pixelSource)`)
- [x] page.tsx:358-359 grep 매치 (`dominantColors?: string[]`, `layoutIntent?: LayoutIntent`)
- [x] page.tsx:1543-1544 grep 매치 (`dominantColors,`, `layoutIntent,`)
- [x] Commit 9cb2818 (Task 1) exists in git log
- [x] Commit 1518289 (Task 2) exists in git log
- [x] tsc --noEmit (web + llm-prompts) 두 패키지 모두 exit 0
- [x] generation-normalize.test.ts 11/11 pass
- [x] image-color.test.ts 23/23 pass
- [x] richness.test.ts 11/11 pass
- [x] CLAUDE.md 한국어 주석 규칙 준수 (AI-01/02/03, AI-05 키워드 포함)
