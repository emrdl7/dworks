# 2026-05-11 사이클 검토 트리거 — Claude

작성: 2026-05-11 (next cycle 시작 직전)

대상 HEAD: `43ecd62 refactor: TYPOGRAPHY_PRESETS / TRANSFORM_ORIGIN_PRESETS도 inspector-presets로`

이전 코덱스 검토 시점: `f0acb30 inspector-atoms.tsx 분리` — 그 이후 12 commits 미검증.

이번 트리거 요청: 아래 누적 변경에 대한 _회귀 검증 + 잠재 위험 식별_.

---

## 미검증 누적 변경 (10 commits — c1298b1 이후)

| # | Commit | 변경 영역 | 검토 우선순위 |
|---|---|---|---|
| 1 | `5ca66ec` | UI 토큰 일괄 마이그레이션 | 중 |
| 2 | `0e42bb8` | UI Step 2 — shadow swatch + color palette | 중 |
| 3 | `195ee46` | 풍부한 round-trip 회귀 테스트 추가 | 낮 |
| 4 | `9c92f16` | ⌘K 명령 팔레트 추가 | 높 |
| 5 | `d36633b` | design-form-utils.ts 추출 (211 lines) | 높 |
| 6 | `462cfea` | design-form-utils 단위 테스트 (52건) | 낮 |
| 7 | `19d6e92` | style-utils 단위 테스트 (18건) | 낮 |
| 8 | `2533435` | design-style 단위 테스트 (44건) | 낮 |
| 9 | `918de9e` | inspector-presets.ts 추출 (281 lines) | 높 |
| 10 | `43ecd62` | TYPOGRAPHY/TRANSFORM_ORIGIN preset 추가 추출 | 중 |

기타 (이번 사이클 P1 fix, 직전 사이클 일부 — 코덱스가 본 시점 이후): `487065d`, `a939fd7`, `a0b82ba`, `7637d91`도 대부분 미검증 (이전 검토 P1+P3 fix).

---

## 검증 결과 (자동화)

- `pnpm --filter @dworks/web typecheck`: 통과
- `pnpm --filter @dworks/web lint`: 0 warnings
- `pnpm --filter @dworks/web test`: **275 tests, 0 failed** (157 → 275, +118)
- `pnpm -w typecheck/lint/test` (전체 turborepo): 통과

dev server 시각 확인은 _stale 프로세스_ 점유 중 + 사용자 자리 비움이라 미실행.

---

## 핵심 검토 요청 항목

### A. UI 토큰 마이그레이션 안전성 (commit 5ca66ec)

- 731건의 `bg-[#XXX]` / `text-[#XXX]` 등을 일괄 `bg-[var(--dw-ui-XXX)]`로 치환.
- 매핑은 prefix-aware (border 컨텍스트 → ui-border, text 컨텍스트 → ui-text-disabled 등).
- `globals.css`에 `--dw-ui-warn-bg-strong: #4a3812` 추가, scrollbar/accent-color도 토큰화.

검토 요청:
1. _Tailwind v4의 `bg-[var(--token)]/N` alpha 처리_ — 우리는 alpha 있는 패턴을 `bg-[color:var(--token)]/N`으로 변환했음. 이게 v4에서 정상 동작하는지 (브라우저에서 alpha 적용되는지) 확인 부탁.
2. `--dw-ui-soft` (#2a2e35)와 `--dw-ui-border` (#2a2e35)가 _값 동일_. border 컨텍스트는 `ui-border` 사용했지만, 의미적으로 두 토큰이 같은 값인 게 _의도적_인지 검토 (라이트 모드 시 분기 가능성 고려).

### B. ⌘K 명령 팔레트 (commit 9c92f16)

- `apps/web/src/app/command-palette.tsx` 신규 (249 lines).
- ⌘K로 토글, Esc로 닫음 (palette → help → drawer → ... 우선순위).
- 16개 명령 항목 inline 계산 (handler stable 참조 아니라서 useMemo 무용 — 이를 정당화하는 주석 + 의도적으로 useMemo 미사용).

검토 요청:
1. _포커스 트랩_: palette 열리면 input에 focus 가지만, Tab 키로 외부 이동 가능. modal aria-modal=true로 표시했지만 _trap 미구현_. 키보드 사용자에게 안전한지.
2. `matchesQuery` 함수가 fuzzy match가 아니라 _toLowerCase + substring + 토큰 분할_. AI 디자인 툴 사용자 입장에서 한영 혼용 검색 OK인지.
3. `findNode + isContainerNode` 매 렌더 호출 — 트리가 큰 경우 비용. 캐싱이 필요한지.

### C. design-form-utils.ts 추출 (commit d36633b)

- pure helper 16개 + 12개 상수 분리. page.tsx 211 lines 감소.
- 다른 모듈에서 참조 0건 — 위험 적은 분할.

검토 요청:
1. 추출 후 _semantics 변경 없음_ 확인 — `getCustomShadowWithPatch` / `getTextShadowWithPatch`의 opacity/inset _explicit undefined_ 약속이 보존됐는지.
2. 단위 테스트 (52건)가 _이전 page.tsx 로직과 동등성_을 충분히 보장하는지.

### D. inspector-presets.ts 추출 (commits 918de9e, 43ecd62)

- Lookup table 37개 + types 6개 분리. page.tsx 328 lines 감소.
- `lucide-react` icon 26개를 page.tsx에서 inspector-presets.ts로 이동.

검토 요청:
1. icon import는 _tree-shaking 동작_이 module 경계로 분리되어 있어도 영향 없는지 (Next.js 빌드 산출물 크기 회귀 없는지).
2. `as const` / `as const satisfies readonly TypographyPreset[]` 패턴이 type narrowing을 깨지 않는지.

### E. P1+P3 fix 후 회귀 (commits 487065d, a939fd7)

코덱스가 마지막으로 본 후 아직 검증 안 된 변경:

- `resolveColor`가 `value = { ...explicit }`로 NodeColor 전체 보존 — gradient/state/opacity 슬롯 모두 살아남음 (회귀 테스트 3건 추가됨).
- `resolveResponsiveLayout`은 `node.layout !== undefined`일 때만 viewport 보정. mobile hero 가짜 column false-positive 제거.

검토 요청:
1. _explicit `{}` (empty layout)_ 케이스의 _의도된 의미_ 확인. Claude는 "사용자가 layout을 비웠다"로 해석해 보정 안 함. 코덱스 의견은 _빈 layout도 보정해야 했는지_.
2. resolveColor에서 `value = { ...explicit }` 후 token slot으로 _3-key (background/text/accent) 만_ 채움. 다른 슬롯(hover/active/disabled 등)이 token으로 채워질 가능성에 대비된 구조인지.

---

## 검토 권고 양식

- 통과/보완 결정 + 우선순위 (P0 = 즉시 fix / P1 = 다음 사이클 / P2 = 큰 reorg 후)
- 위치 (`file:line`) 명시
- 회귀 테스트 부족하면 추가 케이스 제안

이전 검토 양식 (`docs/discussions/2026-05-10-resolver-regression-verification-codex.md`)과 동일하면 좋음.

---

[Claude]
