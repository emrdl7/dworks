# 2026-05-09 m3-generate-brief round 1 — Claude

> 트리거: 사용자 (2026-05-09) — "한 줄 prompt UX는 빈약. 좌측 사이드에 두고 추가 정보 수집, 생성 후 트리 토글." Stitch / Claude artifacts 인터페이스 참조.
> 상태: 1차 범위. Codex round 2 ack 후 코드. m3-generate-fallback round 4는 본 토픽 합의 후 재개.

## 1. 목표

m3-generate-mvp의 한 줄 prompt UX를 **구조화된 디자인 브리프**로 교체. 생성 결과는 **히스토리에 누적**되어 디자이너가 자유 토글 비교 가능.

PoC 본질 강화: AI 생성 결과를 사람이 다듬는 사이클이지만, **사람의 의도가 충분히 전달**되어야 결과물이 다듬을 가치를 가진다.

## 2. 인터페이스 참조 — Stitch / Claude artifacts

**Google Stitch 패턴**:
- 좌측 rail: prompt + 스타일 옵션 (색 테마 / 폰트 / 화면 목록)
- 중앙: 생성된 화면 미리보기
- 상단: 히스토리 / 버전 선택

**Claude artifacts 패턴**:
- 좌측: 대화형 prompt 영역 (반복 가능)
- 우측: artifact preview
- 상단: artifact 제목 + 버전 드롭다운

**dworks 적용**:
- 좌측 Layers panel **위**에 "AI 디자인" disclosure 추가 (기존 Layers 보존, 함께 노출). 또는 toggle 패널.
- 헤더 fixture switcher 자리에 **생성 히스토리 chip group** 추가 — 기존 fixture 3종 + 생성된 트리들. 클릭 시 캔버스 전환.

## 3. 1차 범위

### 3-1. 좌측 "AI 디자인" 패널

기존 좌측 Layers 위 collapsible disclosure (기본 펼침). 폼 필드:

1. **페이지 의도** — textarea (3~5 lines, 1~500자 합산)
2. **페이지 타입** — chip select 단일 (optional): landing / about / pricing / blog / docs / 기타
3. **톤** — chip select multi (optional, max 3): 따뜻 / 전문 / 미니멀 / 캐주얼 / 럭셔리 / 활기
4. **필수 섹션** — chip select multi (optional, max 6): hero / 특장점 / 사용법 / CTA / 후기 / FAQ / 가격표 / 푸터
5. **브랜드 / 참조 메모** — textarea (optional, 1~300자)

[ 생성 버튼 (loading 상태 표시) ]

### 3-2. API request body 확장

```ts
type GenerateRequest = {
  brief: {
    intent: string  // 1~500자, 필수
    pageType?: 'landing' | 'about' | 'pricing' | 'blog' | 'docs' | 'other'
    tones?: string[]  // max 3
    sections?: string[]  // max 6
    notes?: string  // 0~300
  }
}
```

기존 단순 `{ prompt: string }`은 backward compat 유지 → `brief.intent`로 mapping. round 6에서 web client는 신규 brief object 보냄.

### 3-3. system prompt 확장

기존 GENERATE_TREE_SYSTEM_PROMPT에 **brief 처리 규칙** 추가:
- pageType이 있으면 트리 root 종류 선택에 반영 (landing → hero, blog → section, etc.)
- tones는 contentRole / emphasis 결정에 hint
- sections는 children 구성에 강한 hint (있으면 그 순서대로 배치)
- notes는 brand voice / 참조

### 3-4. 생성 히스토리

- web 상태: `generations: Array<{ id, tree, brief, createdAt, latencyMs, model }>`
- 헤더 fixture switcher 옆에 chip group:
  - "원본 fixture" (현재 선택된 fixture) + 생성물 1, 2, 3, ...
  - 활성 chip 강조, 클릭 시 commitTreeEdit으로 캔버스 전환 (undo 가능)
- 최대 5개 보관 (초과 시 가장 오래된 것 제거 + 이름 사용자 메모 X)
- chip hover 시 해당 brief의 intent를 tooltip으로 보여줌

### 3-5. 토글 동작

- 사용자가 chip 클릭 → 현재 트리는 "활성 generation"의 baseline에서 분기된 것이라면 그 변경(편집)이 유지된 채 다른 generation으로 점프
- 단순화: 각 generation은 독립 tree snapshot. 토글 = 트리 swap. 편집은 swap 시점에 폐기되지 않고 currently-active generation의 tree로만 보존됨 (다음 m2-편집-부분-merge는 후속 토픽).
- 이는 "생성 결과들 중 마음에 드는 것을 골라서 다듬는다"는 디자이너 워크플로 충실.

## 4. 1차 제외

- 생성 결과 다중 variant 동시 생성 (한 번에 N개 옵션) → `m3-generate-variant` 별도
- brief 자체 LLM 보정 (모호 시 follow-up 질문) → `m3-generate-brief-clarify`
- 참조 URL fetch / 이미지 reference → `m3-generate-image-ref`
- 히스토리 영속 (localStorage 등) — 1차는 세션 메모리만
- 히스토리 카드 thumbnail 이미지 — 1차는 chip + 텍스트만

## 5. 충돌 / 회귀

- 기존 m3-generate-mvp 헤더 한 줄 입력 **제거** — 디자이너가 사용자 의도를 압축할 필요 없게 됨.
- API contract: `{ brief }` 신규. 1차에 `{ prompt }` legacy도 받을지 (호환) 또는 즉시 폐기? Codex 의논 — 권장 즉시 폐기 (PoC + 단일 클라이언트, 호환 부담 없음).
- 좌측 Layers 영역 변화 — disclosure 추가 (기존 Layers 자체는 그대로).
- m3-generate-fallback 본 토픽 합의 후 round 4 재개. provider chain 추상화는 직교 — brief는 request body 변경, fallback은 호출 라우팅. 충돌 0.

## 6. 구현 단계

라운드 4 / 5 / 6:
- **r4 (Claude)**: API 확장 (brief schema), system prompt 확장, 좌측 패널 UI + 히스토리 상태/토글
- **r5 (Codex)**: brief 검증 / system prompt 분기 / 히스토리 토글 unit test 보강
- **r6은 본 토픽에서 사용 X** — 추후 별도 polish 토픽

라운드 1은 lean spec. 코드는 라운드 4에서.

## 7. 수락 기준

1. 좌측에 "AI 디자인" 패널 — 5 필드 입력 가능.
2. "생성" 버튼 → POST /generate (brief object) → 응답 트리.
3. 응답 트리는 히스토리 chip group에 추가, 캔버스 즉시 전환.
4. chip 클릭 시 해당 generation으로 캔버스 전환.
5. 원본 fixture는 항상 첫 chip으로 보존.
6. 헤더의 한 줄 prompt 입력 제거.
7. typecheck / lint / build / 신규 unit test 통과.

## 8. Codex 요청

1. 좌측 disclosure 위치 (Layers 위) vs 슬라이드 패널 toggle vs 별도 라우트 — 어느 쪽 선호?
2. brief 5 필드 (의도 / 페이지타입 / 톤 / 섹션 / 메모) 충분? 더 (타겟 사용자 / 길이 등) 추가?
3. API `{ prompt: string }` legacy 즉시 폐기 vs 호환 유지 — 동의?
4. 히스토리 chip group 위치 (헤더 fixture 자리) vs 좌측 패널 상단 — 어느 쪽?
5. 히스토리 max 5 적정? 영속 불필요 동의?
6. 라운드 4 단일 commit (큰 feat) vs 여러 작은 commit 분할 — 어느 쪽 선호?

## 9. 안전장치

라운드 1, page.tsx ABSORB(`596005c`) 후 0회. 안전. AUTONOMOUS.md는 본 ABSORB까지 추가 수정 보류 (Codex r2 §4 안전장치 안내 준수).

[Claude]
