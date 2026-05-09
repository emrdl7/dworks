# 2026-05-09 m3-generate-schema-resilience round 1 — Claude

> 사용자 신호 (2026-05-09): "LLM 응답이 트리 스키마를 만족하지 않습니다" 422가 retry 1회 후에도 재차 발생. 본 토픽은 그 문제를 _Codex가 주도_로 해결한다 — 사용자 명시: "코덱스한테 해결하라고 넘겨".

## 현재 상황 (Claude가 한 일과 한계)

세션 누적 7건의 commits로 풀 페이지 골격 + 시각 강화 + retry까지 갔다.

- `1ab5273` page-foundations — 풀 페이지 골격(banner/main/contentinfo) + 2026 트렌드 가이드
- `5bb1de6` responsive-rendering — viewport별 layout 자동 적응
- `df4c564` mobile-nav-collapse — 모바일/태블릿 헤더 햄버거
- `39d015c` / `93f413c` / `667b3f0` visual-richness 1/2/gallery — typography fontSize 강제, 색감, shadow, gallery
- `665a428` schema-retry — 422 시 1회 자동 재시도(NODE_ENV=test에서는 0)
- `6de3a1c` (직전, 본 토픽 r0 격) — system prompt에 "Schema 정확한 형식" 섹션 추가

그러나 사용자가 다시 schema-failure 받음. server log(`DWORKS_DEBUG_SCHEMA=1`) 캡처:

```
schema-failure issues:
  path: root.children[0].color.backgroundColor
    Invalid string: must match pattern /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
    raw: "rgba(255, 255, 255, 0.95)"
  path: root.children[0].children[0].typography.letterSpacing
    Too small: expected number to be >=-0.1
    raw: -1
  path: ... typography.letterSpacing
    Invalid type: expected number
    raw: "-0.02em"
```

LLM(특히 Claude/Codex CLI 응답)이 _매우 자주_ 다음 두 패턴을 박는다:

1. **`rgba(...)` / `rgb(...)` / `hsl(...)`** — schema는 hex만 허용
2. **`letterSpacing: "-0.02em"` string** 또는 **`letterSpacing: -1` number** — schema는 number -0.1~0.2 (CSS 표준 em이 아닌 dworks ratio)

직전 commit `6de3a1c`에서 system prompt 절대 규칙에 명시 추가했으나 LLM이 prompt 지침을 매번 따르지 않을 가능성 큼 — 학습된 web 표준이 schema 제약과 충돌.

## Codex에게 요청

본 토픽을 _Claude r1 → Codex 검토 + 직접 round 4 구현_ 형식으로 진행한다 (가속 §6 역방향). Codex가 다음 두 길 중 선택 또는 조합:

### 길 A. Schema 자체 확장 (LLM-friendly)

- `hexColorSchema`를 hex + `rgba(r, g, b, a)` + `rgb(r, g, b)` 허용으로 확장. 단 web 렌더(`getCssColorWithOpacity` 등)가 hex를 가정하는 곳이 있으므로 helper도 수정.
- `typographySchema.letterSpacing` 범위 `-0.1 ~ 0.2` → `-2 ~ 2`로 늘림. CSS rendering은 ratio 그대로 사용 가능 (`letter-spacing: ${n}em`).
- web 영향 검증 필수.

### 길 B. Sanitize layer 도입

- `apps/api/src/sanitize.ts` (또는 generate.ts 안 inner) 신규 — LLM JSON 응답을 schema 검증 _전에_ 자동 정정:
  - `rgba(255, 255, 255, 0.95)` → `#ffffff` + `backgroundOpacity: 0.95`
  - `"-0.02em"` → `-0.02`
  - `letterSpacing` 범위 외 → clamp
  - 기타 schema 위반 자동 정정 (가능한 것만, 복구 불가능하면 그대로 두고 schema 거부)
- 정정 후 schema.safeParse 재시도. 통과하면 200, 실패면 422.
- 단위 테스트로 sanitize 케이스 커버.

### 길 C. 둘 모두 (권장)

- Schema 살짝 확장(letterSpacing 범위 -1~1로) + 핵심 sanitize 2~3개(rgba→hex+opacity, string number 변환).

## 합의점

- 풀 페이지 골격 / 시각 강화 / retry 모두 그대로 유지. schema 자체와 sanitize만 수정.
- 사용자가 디자인 결과물 확인을 못 하고 있어 _가장 빠른 robustness 회복_이 우선.
- web `getCssColorWithOpacity` / 색 helper가 hex 가정한 곳 회귀 0 보장.

## 수락 기준 (예상)

- 사용자가 직전과 동일 brief로 호출 시 schema-failure 발생률 ≥ 80% 감소.
- api typecheck + test 통과. web 회귀 0.
- 신규 sanitize/schema test 추가.

## 라운드 분할 제안

- Codex r2 (검토 + 길 A/B/C 결정)
- Codex r4 (구현 commit) — Claude r1 docs를 Codex가 받아 _직접_ round 4
- Claude r5 (검증/edge fix) — 본 토픽은 Codex 주도라 Claude가 r5 보강

## 안전장치

라운드 1, page.tsx 미터치 (api/llm-prompts/tree만 영향 예상). 직전 ABSORB는 본 세션에서 따라가지 못함 — 본 토픽 close 시점에 묶어서 ABSORB.

[Claude]
