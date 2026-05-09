# 2026-05-09 m3-generate-variant-grid round 1 — Claude

> 트리거: variant 토픽이 N(1/2/3) 동시 생성을 입증, eval-diversity가 구조 다양성을 정량화. 그러나 사용자가 변형들을 _시각적으로 비교_할 길이 없음 — 좌측 chip 하나 클릭 → 캔버스 단일 표시 → 다른 chip 클릭 → 다른 단일 표시. 비교는 사용자 머리 안에서 일어난다. PoC "마음에 드는 변형 골라 편집"의 첫 단계가 미해결.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1 lean.

## 1. 목표

변형들을 한 화면에서 동시에 보고 골라 편집. compareMode ON → 캔버스 영역이 mini grid (모든 mutable variants), cell 클릭 → 그 variant active + compareMode OFF + 단일 캔버스 + 편집 가능. 비교는 read-only view, 편집은 늘 단일 모드 — 단순한 mental model.

## 2. 1차 범위

### 2-1. compareMode state

```ts
const [compareMode, setCompareMode] = useState(false)
```

토글: 좌측 variant chip group 헤더 옆에 "비교" 버튼. mutable variants 수 ≥ 2일 때만 활성화. compareMode === true이면 chip group은 read-only 정보(클릭 비활성).

### 2-2. canvas grid view (compareMode ON)

CanvasNode N개를 css grid로 동시 렌더 — `grid-template-columns: repeat(N, 1fr)`. 각 cell:

- desktop preset width(1280)를 cell 너비에 맞춰 transform:scale 미니 표시
- cell 상단에 라벨 (immutable=`원본` / mutable=N1, N2…)
- onSelect/select는 noop, selectedNodeId={null} → highlight 없음
- cell 클릭 (전체 영역) → `handleSelectGeneration(entry.id)` + `setCompareMode(false)`

격자 셀 수: `generations.length`. mutable + immutable 모두 표시. N>3이면 2열 wrap.

### 2-3. compareMode OFF (기본)

기존 동작 그대로. 단일 캔버스 + active variant + 편집 가능.

### 2-4. UX 신호

- 비교 모드 ON 동안 inspector는 hidden 또는 disabled — 편집 불가 신호
- "비교" 버튼이 active일 때 visual 변화 (배경/테두리)
- 비교 모드 ON일 때 캔버스 상단에 한 줄 안내 "변형을 골라 클릭하면 편집할 수 있어요"

## 3. 1차 제외

- 동시 편집(여러 변형에 같은 edit 적용) — 후속 (`m3-generate-variant-sync-edit`).
- side-by-side split(2개 동시 편집) — 후속.
- grid 안에서 직접 inspect — 후속.
- mobile/tablet preset에서 grid scale 미세 조정 — 1차는 desktop preset 기준만.
- N>6일 때 가상 스크롤 — MAX_GENERATIONS=6이라 무관.
- 변형들 간 diff 시각화(색/위계 차이 highlight) — 후속.

## 4. 충돌 / 회귀

- `apps/api` / `packages/tree` / `packages/llm-prompts` 변경 0.
- `apps/web/src/app/page.tsx`만 수정. 새 state 1개 + 캔버스 영역 분기 + 비교 토글 버튼.
- chip group 클릭 동작은 compareMode === false일 때만 — chip은 그대로 작동, 다른 단축 경로.
- macbook scale 로직(stageScale) 영향 0 — single 모드 그대로.

## 5. 구현

`apps/web/src/app/page.tsx`만 변경:

- state `compareMode: boolean` (기본 false)
- variant chip group 옆에 "비교" 버튼 (variants ≥ 2일 때 enabled)
- 캔버스 영역: `compareMode === true`이면 grid 분기, false면 기존 single
- grid cell: transform:scale + onClick → handleSelectGeneration + setCompareMode(false)
- inspector aside는 `compareMode === false`일 때만 렌더
- 비교 모드 안내 줄 1줄

### scale 계산 1차 단순

```
const cellWidth = (containerWidth - gaps) / columns
const scale = cellWidth / desktopPresetWidth  // 0.2 ~ 0.4 정도
```

cell 안에 `transform: scale(${scale}); transform-origin: top left; width: ${desktopPresetWidth}px; height: auto`. 컨테이너는 `aspect-ratio: 16/9` 정도로 잡아 cell 크기 결정 — 또는 자동.

근데 height 자동이라 cell이 동적. 1차는 그냥 transform:scale + cell `min-height` 적당히 (예: 240px) + overflow:hidden. ugly하지만 lean.

## 6. 수락 기준

1. variants ≥ 2일 때 "비교" 버튼 표시, 클릭 → grid view + chip group 비활성.
2. grid에 immutable + mutable 모두 표시, 각 cell에 라벨 + 미니 캔버스.
3. cell 클릭 → 그 variant active + compareMode OFF + 단일 캔버스 + inspector 다시 표시.
4. compareMode ON 동안 inspector hidden + 캔버스 상단 안내 1줄.
5. 단일 모드(compareMode OFF) 기존 동작 회귀 0.
6. typecheck / lint / test 통과.

## 7. Codex 요청

1. 캔버스 grid view를 page.tsx 안에 인라인 분기 vs `<VariantGrid>` 별도 컴포넌트 — page.tsx 10000줄+ 인지 후 권장?
2. transform:scale 1차 단순 vs container query / iframe 분리 — 1차 적정?
3. compareMode ON 동안 inspector를 hidden vs disabled (visible but read-only) — 사용자 mental model 어느 쪽?
4. "비교" 버튼 위치 — chip group 헤더(disclosure summary 옆) vs chip group 아래 별도 버튼 — 어느 쪽?
5. 1차 grid는 desktop preset 기준만 — mobile/tablet preset 사용 중일 때는 grid 비활성화 vs 그대로 desktop scale로 표시?
6. 라운드 분할 r4 (Claude grid + 토글 + scale) / r5 (Codex 보강 — keyboard navigation / a11y / scale edge) — 합리?

## 8. 안전장치

라운드 1, page.tsx 직전 ABSORB(`20eed38`) 후 0회. 본 토픽 page.tsx 핵심 수정 토픽 — round 4 1회 + round 5 1회 예상. 정지 조건 5회 안 닿음.

[Claude]
