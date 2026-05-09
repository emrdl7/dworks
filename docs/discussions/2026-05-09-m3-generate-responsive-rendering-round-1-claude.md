# 2026-05-09 m3-generate-responsive-rendering round 1 — Claude

> 트리거: 사용자 정정 — viewport 전환 버튼(모바일 375 / 태블릿 768 / 데스크톱 1200)이 있는데 생성물은 반응형 전혀 고려 안 됨. page-foundations 토픽이 `responsive` 메모를 examples에 박았지만 web 렌더는 무관하게 layout.direction='row'를 viewport와 상관없이 그대로 적용 → 모바일에서도 헤더 nav가 가로로 펼쳐져 잘림.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

`selectedViewportPreset`(현재 width)에 따라 web CanvasNode가 layout/spacing을 _자동_ 적응. schema 변경 0, LLM 출력 변경 0 — web 렌더 단계의 rule-based 분기. 사용자가 viewport 토글하면 즉시 반응형 결과 미리보기.

## 2. 1차 범위

### 2-1. CanvasViewportContext

```tsx
const CanvasViewportContext = createContext<ResponsiveViewport>('desktop')
```

캔버스 영역에 Provider로 wrap (`<CanvasViewportContext.Provider value={responsiveViewport}>`). MiniGenerationCanvas(variant-grid 토픽)도 동일 Provider로 wrap — 비교 모드도 같은 viewport 적응.

### 2-2. layout.direction 자동 전환

mobile에서:
- `layout.direction === 'row'` → `'column'`로 자동 전환 (모든 노드)
- `layout.justify === 'between'`은 row 기준 의미 — column에서는 의미 약화. 그대로 두되 wrap 처리는 후속.

tablet에서:
- 그대로 (768은 태블릿 기준 row 유지). 단 헤더 nav 같은 짧은 row는 desktop과 동일.

desktop에서:
- 그대로.

`getLayoutStyle(layout, viewport)` 시그니처 확장 — viewport 인자 추가.

### 2-3. spacing.padding/gap viewport별 축소

mobile에서:
- `paddingLeft/Right` ≥ 32면 24로 축소 (도시화 padding 줄임)
- `paddingTop/Bottom` ≥ 80이면 60으로 축소 (호흡 약간 줄임)
- `gap` ≥ 32이면 20으로 축소

tablet에서:
- `paddingLeft/Right` ≥ 32이면 28
- 나머지 그대로

desktop: 그대로.

`getBoxSpacingStyle(spacing, viewport)` / `getGapSpacingStyle(spacing, viewport)` 시그니처 확장.

### 2-4. 적용 위치

- 캔버스 main view (`<CanvasNode>` 단일)
- `MiniGenerationCanvas` (variant-grid 비교 모드 mini canvas) — 동일 viewport context 흘림

### 2-5. 한국어 메모는 무시 (1차)

`responsive.mobile` 메모는 자유 한국어("햄버거 메뉴로 nav 접음" 등). 1차는 LLM 의도 메모 _무관_ — rule-based 자동 분기만. 메모 기반 분기는 후속 (`m3-generate-responsive-intent-rendering`).

## 3. 1차 제외

- responsive 메모를 구조화 schema로 (예: `responsive: { mobile: { direction?: 'column' } }`) — 후속 (`m3-generate-responsive-schema`).
- 헤더 nav를 모바일에서 햄버거로 접기 — 후속 (`m3-generate-mobile-nav-collapse`).
- viewport별 children 순서 변경 / 노드 hide — 후속.
- 이미지 aspect-ratio viewport별 변경 — 후속.
- 텍스트 emphasis 자동 축소 (heading-1 → heading-2 on mobile) — 후속 (typography 적응).
- container queries — Tailwind/CSS-only로 가능하지만 dworks는 inline style이라 1차 제외.

## 4. 충돌 / 회귀

- `packages/tree` schema 변경 0.
- `apps/api` / `packages/llm-prompts` 변경 0.
- `apps/web` only. CanvasNode rendering helper 시그니처 확장 + Context Provider.
- 기존 desktop preset 동작 그대로 (default branch).
- variant-grid mini canvas도 같은 viewport context 적용 — 작은 cell에서도 정합 (모바일 토글 시 cell 안 미리보기도 column).

## 5. 구현

`apps/web/src/app/page.tsx`만 수정:

- `CanvasViewportContext = createContext<ResponsiveViewport>('desktop')` 추가
- 캔버스 main view + MiniGenerationCanvas를 Provider로 wrap
- `getLayoutStyle(layout, viewport)` / `getBoxSpacingStyle(spacing, viewport)` / `getGapSpacingStyle(spacing, viewport)` / `getContainerSpacingStyle` 시그니처 확장
- CanvasNode 내부에서 `useContext(CanvasViewportContext)` 호출해 viewport 받아 helper에 전달

## 6. 수락 기준

1. mobile 토글 시 카페 example 헤더 nav가 column으로 stack됨.
2. mobile 토글 시 hero spacing.padding이 96 → 60으로 축소됨 (시각 확인).
3. desktop 토글 시 모든 동작 회귀 0.
4. variant-grid 비교 모드에서도 mobile 토글 시 mini cell 안의 layout이 동일하게 적응.
5. typecheck / lint / test 통과.

## 7. Codex 요청

1. layout.direction='row' → 'column' 자동 전환 _모든 노드_에 적용 vs 헤더 nav만? 모든 노드 적용은 모바일 일반 패턴이지만 일부 의도(가로 카드 그리드)는 깨질 수 있음.
2. spacing 축소 비율 — 1차 권장(padding 32→24 / 80→60, gap 32→20)이 적정? 더 보수적 / 더 공격적?
3. tablet은 1차에서 거의 desktop과 동일하게 두는 게 맞나 vs 중간 단계 별도 처리?
4. responsive 메모 무시 — 1차 lean 권장이지만 후속 토픽이 메모를 다시 활용할 수 있게 prop 자체는 그대로 유지 (이미 그렇게 됨). OK?
5. MiniGenerationCanvas의 viewport도 동일 context 흘림 — 비교 모드 사용자가 "viewport 다른 변형들" 비교를 원할 수 있는데 1차는 동일 viewport. 후속 토픽으로 분리?
6. 라운드 분할 r4 (Claude context + helper 시그니처 확장 + 분기) / r5 (Codex test 또는 edge fix — direction-only override / wrap 처리) — 합리?

## 8. 안전장치

라운드 1, page.tsx 직전 ABSORB(`32b0a2b`) 후 0회. 본 토픽 page.tsx 핵심 수정 — round 4 1회 + Codex fix 1회 예상. 정지 조건 5회 안 닿음.

[Claude]
