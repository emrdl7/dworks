# Phase 2: AI 생성 품질 자동 검증 - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** Auto (autonomous milestone, YOLO)

<domain>
## Phase Boundary

prompt에 박힌 13 풍부도 신호가 _자동 enforce_ 되도록 — generation 후 validator + 자동 보강 + 도메인×톤 매트릭스 확장 + 참조 이미지 활용 강화.

**현재 상태 (v1):**
- `apps/web/src/app/richness.ts` — 13 신호 중 _8개_ 만 측정 (signals #1~#8 + score)
- `packages/llm-prompts/src/index.ts:1622` — 13 신호 _프롬프트에 박혀 있지만 LLM 자체 점검 의존_
- `apps/web/src/app/generation-normalize.ts` — 생성 결과 normalize, signal 검증 없음
- `apps/web/src/app/image-color.ts` — 이미지 color 추출 존재 (depth 미상)
- prompt 톤 매핑 11종 + 도메인 패턴 (cafe/SaaS/portfolio/GenZ 등) — _도메인×톤 매트릭스_ 형식 아님

**Phase 2 scope:**
- AI-01 13 신호 자동 enforce — richness.ts 5 신호 추가 + generation-normalize.ts 자동 보강 hook
- AI-02 인터랙티브 컴포넌트 도메인-적합 1개 자동 추가
- AI-03 entranceAnimation 자동 박기 (hero.title + features cards staggered)
- AI-04 prompt 도메인×톤 매트릭스 표 (e-commerce/SaaS/portfolio × dark/playful/minimal 등)
- AI-05 참조 이미지 — dominant 5 colors + 레이아웃 의도 (centered/left-aligned/grid) 추출

**Out of scope:** UI surfaces (signal 시각화 패널은 Phase 3 영역), AI 자동 prompt (Phase 별 도구).

</domain>

<decisions>
## Implementation Decisions

### AI-01 — 13 신호 자동 enforce

- **D-01**: `richness.ts` 의 8 신호에 _5개 추가_:
  - **#9 designOverrideVariety** — node ≥12개에 spacing/color/typography/shape/layout override 명시
  - **#10 sectionVisualVariety** — main 직계 section/hero 의 backgroundColor/Gradient 종 ≥2
  - **#11 nodeTypeVariety** — container type (section/hero/card/list/form) 중 ≥3종 사용
  - **#12 interactiveComponent** — carousel/tabs/accordion/modal 중 ≥1 사용
  - **#13 entranceAnimationSpread** — entranceAnimation 노드 6~12개 사이 (적으면 부족, 많으면 산만)
- **D-02**: score 식 변경: `trueCount / 13`. `SIGNAL_COUNT` 상수 8 → 13.
- **D-03**: validator API 추가 — `validateTreeRichness(tree)` 반환 `{ signals, score, missing: string[] }`. missing 은 false 신호 키 list.
- **D-04**: `generation-normalize.ts` 에 `enforceRichness(tree, prompt, missing[])` hook — 미달 신호 발견 시 _서버사이드 자동 보강_ trigger. boundary: 자동 보강은 _idempotent + safe_ 한 변환만 (CTA 추가 / entranceAnimation 박기 / interactive 컴포넌트 1개 추가). 보강 후에도 미달이면 toast: `'풍부도 부족 — 재생성 권장 (점수 N/13)'`.

### AI-02 — 인터랙티브 컴포넌트 자동 추가

- **D-05**: 도메인 추론 — prompt 의도 키워드 매칭:
  - e-commerce / 쇼핑 / 제품 / 카탈로그 → `carousel` (제품 슬라이드)
  - SaaS / B2B / dashboard / 기능 / pricing → `tabs` (use case 별)
  - FAQ / 컨퍼런스 / 일정 / specs → `accordion`
  - 가입 / 회원 / 약관 → `modal`
  - 기본 (no domain match) → `accordion` (가장 보편)
- **D-06**: 자동 추가 위치 — main 의 마지막 section 직전 (위계상 중간/하단). 빈 슬롯 1개 + 한국어 placeholder text ("인터랙티브 요소 — 도메인에 맞게 편집하세요"). 사용자가 편집할 명시 anchor.
- **D-07**: 자동 추가는 _LLM 결과에 0개 일 때만_ trigger. ≥1개 있으면 그대로 둠.

### AI-03 — entranceAnimation 자동 박기

- **D-08**: 자동 박기 정책 — `richness.entranceAnimationSpread === false` (0~5개 또는 13+ 개) 일 때 정규화 단계에서 자동 보강.
- **D-09**: 보강 대상 우선순위 (먼저 박힘):
  1. `role === 'main'` 의 첫 `type === 'hero'` 의 `.heading` 자식 → `slide-up duration:700 trigger:load`
  2. main 직계 section/hero 의 직접 자식 (`role === 'main'` 그룹 카드) → `slide-up duration:600 trigger:scroll delay:0/150/300...` staggered
  3. final CTA 영역 (마지막 section/hero) heading + button → `fade-in duration:500 trigger:scroll`
  4. 총 8개 (6-12 범위 중간) 까지 박고 멈춤
- **D-10**: 이미 entranceAnimation 있는 노드는 _덮어쓰지 않음_ — append 만.

### AI-04 — 도메인×톤 매트릭스

- **D-11**: prompt 에 _표 형식_ 매트릭스 섹션 추가 (signal 13 섹션 뒤). 행=도메인 (e-commerce / SaaS / portfolio / event / education / health), 열=톤 (dark/luxury / playful/GenZ / minimal/zen / professional / warm/friendly). 셀=구체 톤 가이드 (color palette + radius + fontWeight + entranceAnimation 패턴).
- **D-12**: 매트릭스는 _LLM 가이드_ — generation-normalize 의 자동 보강이 매트릭스 cell 을 직접 참조하지 않음. LLM 이 prompt 의 매트릭스를 보고 일관된 톤 적용.
- **D-13**: 매트릭스 크기 — 6×5 = 30 셀. 셀당 2~3 줄. prompt 토큰 ~3000 추가. 기존 prompt ~25000 토큰 이므로 12% 증가 (감내 범위).

### AI-05 — 참조 이미지 multimodal 강화

- **D-14**: `image-color.ts` 확장 — `extractDominantColors(imageData, count: 5)` 가 RGB 5색 + HSL 분석으로 light/dark/neutral 분류 반환.
- **D-15**: 레이아웃 의도 추출 — `extractLayoutIntent(imageData)` 반환 `'centered' | 'left-aligned' | 'grid' | 'asymmetric'`. heuristic: edge detection으로 콘텐츠 mass 위치 분석. v1 은 _간단한 quadrant analysis_ (좌상/좌하/우상/우하 사분면 픽셀 밀도).
- **D-16**: prompt 에 `<reference_image_analysis>` 블록 inject — `dominantColors: [#xxx, #yyy, ...]` + `layoutIntent: 'grid'`. LLM 은 이 신호를 _보조_ 로 사용 (의도 우선).

### Claude's Discretion

- 도메인×톤 매트릭스 셀 내용의 정확한 wording — Claude 자율 (v1 톤 매핑 11종 텍스트 재활용 + 도메인별 응용).
- enforceRichness 의 자동 보강 순서 — 안전성 우선.
- 5색 추출 알고리즘 (k-means vs median cut) — Claude 자율, 성능 우선.
- 레이아웃 의도 heuristic 정확도 (v1 은 ~60% 정확이면 충분).

</decisions>

<canonical_refs>
## Canonical References

### Project-level
- `.planning/PROJECT.md` — v2.0 vision, AI-01..AI-05 정의
- `.planning/REQUIREMENTS.md` — AI 요구사항
- `.planning/ROADMAP.md` §Phase 2 — Success criteria

### Code anchors
- `apps/web/src/app/richness.ts` — 현재 8 신호 측정. SIGNAL_COUNT 상수 + signals object 확장 위치.
- `apps/web/src/app/generation-normalize.ts` — 생성 결과 후처리. enforceRichness 자동 보강 hook 추가 위치.
- `apps/web/src/app/image-color.ts` — 이미지 색 추출. dominant 5색 + layout intent 함수 추가 위치.
- `packages/llm-prompts/src/index.ts:1622` — 13 신호 자체 점검 섹션. 매트릭스 표 추가 위치 (line ~1670 부근).
- `packages/llm-prompts/src/index.ts:1640` — 답변 → 스타일 매핑 가이드 (11 톤). 도메인×톤 매트릭스 source.
- `packages/llm-prompts/src/index.ts:1658` — 도메인 다양화 예시 (4 도메인). 매트릭스 행 source.
- `packages/eval/src/axes.ts` — 평가 축 (참고용, 신호 정의 참고)
- `packages/tree/src` — 노드 schema (validator 가 노드 type 검사)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **richness.ts 8 신호** — landmark/main/heading/CTA/fontSize/color/image/shape 모두 작동. 신호 #9~#13 추가만.
- **generation-normalize.ts** — 트리 normalize hook. 신규 enforceRichness 단계는 normalize 후 _마지막 단계_ 로 추가 (idempotent).
- **image-color.ts** — `extractDominantColor` 단일 색 추출 함수 추정. 다중 추출 확장.
- **prompt 매트릭스 source** — 11 톤 (line 1640+) + 4 도메인 예시 (line 1658+). 표 변환 시 행/열 source 로 사용.

### Established Patterns
- TypeScript strict — 신호 validator union types.
- Korean comments + Korean toast.
- 모든 prompt 파일 한국어 (mandate).
- 테스트는 `.test.ts` 동일 폴더 (Vitest).

### Integration Points
- **generation-normalize** → richness validator → enforce hook → toast on residual gap
- **image-color** → generation-normalize → prompt inject
- **prompt** matrix 섹션 → LLM 가이드 (compile-time)

</code_context>

<specifics>
## Specific Ideas

- 5색 dominant — k-means 5 cluster (간단). 또는 quantize 후 빈도 top 5.
- 레이아웃 intent — 이미지 4분면 픽셀 밀도 분포로 grid (균등) / centered (중앙 집중) / left-aligned (좌측 집중) / asymmetric (불규칙) 판별.
- 매트릭스 표는 markdown table 형식 — LLM 이 잘 parse 함.
- enforceRichness 는 _server-side_ (generation-normalize) 에서. UI 표시는 Phase 3 영역.

</specifics>

<deferred>
## Deferred Ideas

- **인스펙터 richness 패널** — 13 신호 점수 시각화 (Phase 3 시각 보조 도구 영역에 가까움)
- **AI 자동 재생성** — 보강 후에도 미달 시 재생성 prompt — Phase 2 v2 (현재는 toast 안내 만)
- **multimodal text from image** — OCR 로 이미지 텍스트 추출해 prompt 강화 (v3)
- **palette extraction → fixture 자동 생성** — 사용자 이미지에서 fixture 만들기 (v3)

</deferred>

---

*Phase: 02-ai-quality*
*Context gathered: 2026-05-11*
