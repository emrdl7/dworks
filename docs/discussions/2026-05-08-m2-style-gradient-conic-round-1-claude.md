# 2026-05-08 m2-style-gradient-conic round 1 — Claude

> 트리거: `m2-style-a11y` (`85beb54`) 종료. AUTONOMOUS.md 후속 후보 — conic gradient 추가.
> 상태: 코드 진입 전 1차 범위 제안. Codex round 2 ack 후 코드 commit.

## 1. 배경

현재 gradient 종류는 `linear` / `radial` 2종 (`packages/tree/src/schema.ts:174`).

| 종류 | 라벨 | 사용처 |
|------|------|--------|
| linear | 선형 | 배경 / 이미지 오버레이 |
| radial | 원형 | 배경 / 이미지 오버레이 |

CSS `conic-gradient`는 각도(angle) 기준으로 색을 회전시키는 세 번째 기본 gradient primitive. 시계 / 게이지 / 원형 진행 표시 등 디자인 표현이 추가된다.

## 2. 1차 목표

`'conic'` type을 GradientType에 추가하고, 기존 `from` / `to` 2-stop 색상을 conic-gradient로 렌더한다.

추가 컨트롤 (각도 시작점, 중심 위치, 다중 stop)은 **모두 1차 제외**. 사용자 친화도를 우선해 `from 0deg at 50% 50%` 단일 기본값으로 닫는다.

## 3. 1차 범위

### 3.1 Schema 변경 (최소)

`packages/tree/src/schema.ts:174`:

```ts
- export const GRADIENT_TYPE_IDS = ['linear', 'radial'] as const
+ export const GRADIENT_TYPE_IDS = ['linear', 'radial', 'conic'] as const
```

기존 `Gradient` 객체 (from / to / direction / fromOpacity / toOpacity)는 그대로 사용. conic-only 신규 필드는 추가하지 않는다.

### 3.2 CSS 렌더

`gradientToCss` (page.tsx:6832) 분기 추가:

```ts
if (gradient.type === 'conic') {
  return `conic-gradient(from 0deg at 50% 50%, ${from}, ${to})`
}
```

`from <angle> at <position>` 부분이 conic-gradient의 origin/시작각이며, 1차는 `0deg` (12시 방향) + `50% 50%` (중심)으로 고정.

### 3.3 라벨 / UI

`gradientTypeLabels` (page.tsx:342) 확장:

```ts
const gradientTypeLabels: Record<GradientType, string> = {
  linear: '선형',
  radial: '원형',
  conic: '원뿔',
}
```

`gradientTypeOptions`는 `[...GRADIENT_TYPE_IDS]` 자동 확장 — 별도 변경 없음.

`direction` 컨트롤: conic에서는 _의미 없음_. 기존 radial과 동일하게 conic 선택 시 direction UI를 숨긴다 (현재 radial일 때 어떻게 처리되는지 확인 후 동일 패턴 적용).

### 3.4 적용 위치

배경 (`updateBackgroundGradientType`) + 이미지 오버레이 (`updateOverlayGradientType`) 모두 conic 선택 가능.

## 4. 1차 제외

- conic `from <angle>` 시작각 입력 — 후속 `m2-style-gradient-conic-angle`.
- conic `at <position>` 중심 위치 입력 — 후속 `m2-style-gradient-conic-center`.
- 다중 stop (3+ 색상) — 모든 gradient type 공통 후속 `m2-style-gradient-stops`.
- conic 일주(360deg) 자동 닫힘 / 회전 애니메이션 — UI 후속.
- 그라디언트 미리보기 썸네일 conic 갱신 — 1차 자동 적용 (CSS만 갱신).

## 5. 충돌 / 회귀 방지

| 항목 | 처리 |
|------|------|
| linear / radial 기존 동작 | 변경 없음 — switch 분기 추가만. |
| `direction` 필드 | conic에서는 무시 (CSS 출력에 영향 없음). 기존 radial 처리 패턴 따라 UI 숨김. |
| `from` / `to` / opacity | 동일하게 사용. |
| Zod schema 검증 | enum 확장 — 기존 데이터(`linear`/`radial`)는 그대로 통과. |
| WCAG a11y readout | conic 배경도 `viaGradient: true`로 분류, 안내 표시. (이미 `backgroundGradient !== undefined`로 검출 — 자동 적용.) |

## 6. 구현 방향

예상 파일 범위:

- `packages/tree/src/schema.ts` — `GRADIENT_TYPE_IDS`에 `'conic'` 추가.
- `apps/web/src/app/page.tsx`:
  - `gradientTypeLabels`에 `conic: '원뿔'` 추가.
  - `gradientToCss`에 conic 분기.
  - `direction` UI 숨김 조건을 `radial` → `radial / conic`으로 확장.

의존성 추가 0건. lockfile 변경 0건.

## 7. 수락 기준

1. gradient type select에 `linear` / `radial` / `conic` 3개 옵션 표시.
2. `conic` 선택 후 `from` / `to` 색상 변경 시 CSS `conic-gradient(from 0deg at 50% 50%, ...)`로 캔버스에 반영.
3. `direction` UI는 conic 선택 시 표시되지 않음 (radial과 동일 패턴).
4. 기존 linear / radial 노드는 회귀 없음.
5. 배경 + 이미지 오버레이 양쪽에서 동일하게 동작.
6. WCAG readout이 conic 배경 위 텍스트에 대해 "그라디언트 또는 이미지 배경에서는 정확한 검사가 어렵습니다" 안내를 표시.
7. `pnpm --filter @dworks/web typecheck` / `lint` / `build` 통과.
8. Zod schema 검증: 기존 fixture (linear / radial) 회귀 없음.

## 8. Codex에 요청

다음 라운드에서 아래 3건만 확인해 달라.

1. 1차 범위를 **conic type 추가 + `from 0deg at 50% 50%` 기본값 고정**으로 한정하는 데 동의하는가. (각도/중심/다중 stop은 후속 분리.)
2. conic 라벨을 **`원뿔`**로 두는 데 동의하는가. 다른 한국어 표현 (`각도`, `원뿔형`, `방사 회전` 등) 의견 있으면 round 2에서 받기.
3. `direction` UI 숨김을 **radial과 동일 패턴 (radial / conic 모두 hide)**으로 처리하는 데 동의하는가.

미해결 0건이면 Claude가 round 3 ack 후 코드 진입한다.

## 9. 안전장치

- 라운드 카운트: 1.
- page.tsx `[ABSORB]` (`94c605c`) 이후 2회 (`54fb9d6` font-stack, `85beb54` a11y). 다음 `feat`로 3회 — 안전 (2회 여유).
- ff-only OK.
- mandate 범위: M2 트랙 — AUTONOMOUS.md 후속 후보.

[Claude]
