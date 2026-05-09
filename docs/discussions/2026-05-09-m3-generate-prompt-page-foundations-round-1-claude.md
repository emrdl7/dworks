# 2026-05-09 m3-generate-prompt-page-foundations round 1 — Claude

> 트리거: 사용자 정정 — 첫 시안에 (1) 헤더/푸터 자체가 없음 (2) 반응형 미적용 (3) 디자인 감각 부족. examples를 hero/section _단편_으로 묶어 토큰을 아낀 prompt-style 토픽의 trade-off가 페이지 기본기를 통째로 누락시킴. WebSearch(2026 트렌드)와 references/claude-design-system-prompt 자산을 끌어와 system prompt + examples를 _풀 페이지 골격_으로 보강.
> 상태: 1차 범위. Codex round 2 ack 후 코드. 가속 §1보다 lean하긴 어려움 — examples 풀 페이지 확장으로 토큰 비용 큰 변경.

## 1. 목표

`GENERATE_TREE_SYSTEM_PROMPT`와 `GENERATE_TREE_EXAMPLES`를 풀 페이지 골격(헤더 + main + 푸터) 기준으로 재구성. 2026 트렌드(large typography, ample whitespace, single clear CTA, neutral base + accent, subtle gradient)를 system prompt에 명시. `responsive` prop을 examples에서 _시범 사용_(향후 web 렌더 토픽으로 분화). schema 변경 0.

## 2. 1차 범위

### 2-1. system prompt: 페이지 기본 구조 가이드 추가

```
## 페이지 기본 구조

기본은 _풀 페이지_다. root는 section이고 다음 3 자식을 권장한다:
- 헤더(section, role='banner', layout.direction='row'): 로고(text) + 1차 nav 3~5
- main 콘텐츠(hero / section / article 등): 핵심 가치 제안 + 1차 CTA
- 푸터(section, role='contentinfo', layout.direction='column' or 'row'): 카피라이트 + 보조 링크

단편(hero 단독, card 단독)은 사용자가 _명시적으로_ 그 부분만 요청했을 때만 출력한다.
일반 "페이지" 의도는 풀 페이지로 응답한다.
```

### 2-2. system prompt: 2026 트렌드 가이드 추가

```
## 2026 디자인 트렌드 가이드

- **Bold typography hero**: hero 첫 화면에 emphasis='heading-1' 텍스트가 강한 메시지를 전달. 부수적 이미지보다 typography 자체가 시각적 hook.
- **Ample whitespace**: hero/main section의 spacing.padding ≥ 80, 섹션 간 spacing.gap ≥ 48. 정보 밀도 낮추고 호흡 확보.
- **Single clear CTA per hero**: 1차 CTA 하나 — variant='primary'. 보조 CTA는 ghost.
- **Neutral base + accent pops**: backgroundColor는 흑백/그레이 또는 soft tone. accentColor 1~2개로 강조. 화려한 그라디언트 X (subtle gradient OK).
- **Mobile-first 의도**: layout.direction은 row보다 column 우선, gap으로 호흡. 헤더 nav는 row인데 mobile에서 wrap된다는 의도.

피할 패턴(AI 슬롭): 모든 카드 같은 그라디언트, 이모지 장식, 좌측 강조 막대 카드, 모든 섹션 동일 padding.
```

### 2-3. examples 재구성

**카페 랜딩(example 1)** — 풀 페이지로 확장:
- root: section
  - 헤더: section role='banner' layout.direction='row' [로고 text + nav text 3]
  - main: 기존 hero (배경 그라디언트 + CTA)
  - 푸터: section role='contentinfo' layout.direction='column' [카피라이트 + 보조 링크 3]

**SaaS 가격(example 2)** — 풀 페이지:
- root: section
  - 헤더 (로고 + nav 3)
  - main: pricing.section (3 plans)
  - 푸터 (카피라이트 + 회사 정보 + 법적 링크)

**블로그 매거진(example 3)** — 풀 페이지로 확장:
- root: section
  - 헤더 (로고 + 카테고리 nav)
  - main: article.section
  - 푸터 (저자 정보 + 카피라이트)

각 example에 root section의 spacing.padding 0(전체 페이지) + 헤더/main/푸터 각자 spacing 관리.

### 2-4. responsive 의도 시범 (1건)

example 1 헤더에 `responsive: { mobile: '햄버거 메뉴로 nav 접음', desktop: 'inline nav' }` 같은 의도 메모. 의도 _힌트_로만 — 실제 web 렌더 분기는 `m3-generate-responsive-rendering` 후속 토픽.

### 2-5. 길이 가드

examples block 현재 298 라인. 풀 페이지 확장으로 ~600 라인 예상 (2× 증가). prompt-style 토픽의 1.6× 가드는 본 토픽에선 풀 페이지 확장 비용으로 인해 _상한 해제_. 단 system prompt 본문은 절제.

### 2-6. drift 방지 test 보강

- 각 example의 root가 section 타입 + 헤더/푸터 자식 존재 검증
- system prompt header "## 페이지 기본 구조", "## 2026 디자인 트렌드 가이드" 모두 검증
- 헤더 자식의 contentRole 또는 layout.direction='row' 검증

## 3. 1차 제외

- web 렌더의 viewport별 자동 layout 적응(direction column on mobile 등) — 후속 (`m3-generate-responsive-rendering`).
- 헤더/푸터 schema 1급 노드화(`HeaderNode` / `FooterNode`) — 후속. 1차는 section + role 표기로 처리.
- nav를 list 노드 vs section/text 조합 — 1차 단순화 위해 section + text 자식들. 후속 (`m3-generate-nav-list`).
- vision LLM judge로 페이지 기본기 측정 — 후속 (`m3-generate-eval-page-shell`).
- AI 슬롭 회귀 test (gradient 전부 박은 카드 detection 등) — 후속.

## 4. 충돌 / 회귀

- `packages/tree` schema 변경 0.
- `apps/api` / `apps/web` 변경 0.
- prompt-style 토픽의 examples 시그니처는 main 영역에서 그대로 보존 — 헤더/푸터만 추가.
- emotional-mapping 매핑 가이드 그대로 — 헤더/푸터에도 톤 매핑 적용 가능하게 자연 확장.
- examples block 토큰 비용 ~2× 증가 → /generate latency 영향 가능. m3-eval로 후속 측정.

## 5. 구현

`packages/llm-prompts/src/index.ts`만 수정:
- `GENERATE_TREE_SYSTEM_PROMPT`에 "## 페이지 기본 구조" + "## 2026 디자인 트렌드 가이드" 두 섹션 추가
- `GENERATE_TREE_EXAMPLES` 3개를 풀 페이지로 확장
- responsive 의도는 example 1 헤더에 1건만 시범

`packages/llm-prompts/src/index.test.ts`:
- system prompt header 2개 검증
- 각 example에 헤더/푸터 자식 존재 검증

## 6. 수락 기준

1. `pnpm --filter @dworks/llm-prompts test` 통과 (기존 9 + 신규 ~3건).
2. `pnpm --filter @dworks/llm-prompts typecheck` 통과.
3. examples 3개 모두 root가 section, 자식에 header/main/footer 존재 (role 표기).
4. system prompt에 "## 페이지 기본 구조" + "## 2026 디자인 트렌드 가이드" 두 섹션 존재.

## 7. Codex 요청

1. 헤더/푸터 표현 — section + role 권장 vs schema에 1급 노드 추가? 1차는 schema 변경 0이라 role 권장.
2. examples 길이 ~2× 증가 — 토큰 비용 trade-off 적정? 1개 example만 풀 페이지로 + 나머지 2개는 단편 유지 권장 가능?
3. responsive 의도 1건 시범 — 부족 vs 적정? 후속 web 렌더 토픽 _전에_ examples만 박아도 LLM이 의미 학습 가능?
4. 2026 트렌드 가이드 항목 — 5개(typography/whitespace/CTA/palette/mobile-first) 적정? 추가 / 줄임 권장?
5. AI 슬롭 회피 항목 — 4개(같은 그라디언트/이모지/좌측 막대/동일 padding) 충분? references/claude-design-system-prompt에서 끌어와 더 명시?
6. 라운드 분할 r4 (Claude system prompt + examples 풀 페이지 + test) / r5 (Codex 보강 — AI 슬롭 회귀 test, 풀 페이지 schema 검증) — 합리?

## 8. 안전장치

라운드 1, llm-prompts only. 직전 ABSORB(`e60a582`) 후 0회. 본 토픽 page.tsx 미터치 — 카운터 무관.

## 9. 참고 자료

본 토픽 작성 시 활용한 외부 자산:

- WebSearch: "modern landing page web design trends 2026" / "awwwards dribbble best landing page design 2026"
- 트렌드 출처: Figma Resource Library / Moburst / Helpful Hero / UXPilot / Lovable
- references/claude-design-system-prompt — AI-slop check / hierarchy-rhythm review / interaction-states pass / accessibility audit 패턴
- references/emotional-design-norman — 기존 prompt-uplift / emotional-mapping 토픽에서 활용 자산 참조

[Claude]
