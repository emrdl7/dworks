# Design Works (dworks) — 합의된 결정 사항

> **상태**: 1차 정리 (2026-05-07). krds-studio 라운드 1~4의 합의 결과를 dworks 컨텍스트로 흡수.
> **출처 의논**: `~/krds-studio/docs/10-FRAME-REVIEW-2026-05-07.md` §10–§13 (라운드 1~4).
> **본 문서의 위계**: dworks의 모든 결정은 본 문서에 박힌 합의 위에서만 이뤄진다. 본 문서를 거스르려면 새 라운드 의논이 필요하다.

---

## D1. 프로젝트 정체성

**Design Works는 디자인툴이지 HTML 생성기가 아니다.**

- 제품의 산출물은 캔버스 위의 디자인이고, HTML은 그 디자인을 렌더하고 익스포트하기 위한 매체다.
- 사용자는 디자이너이며 HTML 시맨틱·접근성 룰을 직접 마주하지 않는다.
- jabworks / infoUX / KRDS 같은 "기준"은 디자인 단계의 강제가 아니라 **익스포트 프로파일**이다.

근거: krds-studio 라운드 2 §2, 라운드 3 §10.

## D2. 모델 표현 — E (Hybrid)

**제품 방향 확정**: JSON 의도 트리가 source of truth, HTML은 LLM I/O + 캔버스 렌더 + 익스포트 매체.
**흡수 전략은 PoC**(M4)에서 검증한다 — M4 실패 시는 트리 채택을 폐기하지 않고 흡수 방식만 변경한다 (PLAN.md M4 실패 분기 참조).

```
LLM (Codex)
  ↓ HTML/Tailwind 출력 (LLM 강점 유지)
HTML→트리 흡수기
  ↓ 즉시 트리로 흡수
트리 모델 (source of truth)
  - 의미 역할 (hero/card/section/button/list/form)
  - 콘텐츠
  - 스타일 토큰 참조
  - 레이아웃 의도 + 반응형 의도
  - 편집 단위 메타
  ↓
캔버스 렌더: 트리→HTML→iframe
편집: 트리 속성 변경
LLM 재호출: 트리 일부 + 자연어 → 부분 HTML → 부분 트리 흡수
익스포트: 트리→{plain, jabworks, infoUX, KRDS, …}
```

**원칙 두 개**:
1. HTML은 LLM의 출력 언어이지 시스템의 내부 모델이 아니다.
2. 익스포트는 트리에서 분기되는 다중 변환기다.

근거: krds-studio 라운드 1 §4 옵션 비교, 라운드 1 §6 v4와의 관계 매핑.

## D3. 우선순위 — P0 → P0.5 → P1 → P2

| 단계 | 내용 | 비고 |
|------|------|------|
| **P0** | 디자인 품질 eval 1차 구현 | 7개 평가 축 |
| **P0.5** | 편집 기능 + 편집 품질 측정 | 6개 범위 + 5개 평가 축 |
| **P1** | 디자인 고도화 루프 | eval 결과를 사용자 리포트 아닌 고도화 입력으로 |
| **P2** | HTML→트리 흡수 PoC | R&D, M1 완료가 시작 트리거 |

근거: krds-studio 라운드 3 §12, 라운드 4 §13.1.

## D4. eval 입력의 본질

**디자인 품질 평가의 입력은 DOM 구조가 아니라 다음이다**:

- brief (사용자 의도)
- 캔버스 스크린샷
- 업로드 자산 / 브랜드 컨텍스트
- viewport별 렌더 결과 (모바일/태블릿/데스크톱)

코드를 읽어서 판단하는 게 아니라 사람이 보는 것을 보고 판단한다 = vision LLM judge 경로.

근거: krds-studio 라운드 3 §12.

## D5. P0 평가 축 7개

| 축 | 정의 | 점수 |
|----|------|------|
| `non-wireframe` | 박스/placeholder/균일 카드 반복에 머물지 않는가 | 0–5 |
| `first viewport richness` | 첫 화면에서 브랜드/핵심 메시지/CTA/시각 초점이 보이는가 | 0–5 |
| `emotional-fit` | 감성 프리셋이 색/타이포/이미지/카피/CTA에 반영됐는가 | 0–5 |
| `visual-variety` | 섹션 간 레이아웃/리듬/밀도 변화가 있는가 | 0–5 |
| `brand/reference fidelity` | 로고/레퍼런스/브랜드 자산의 오판/중복/색감 왜곡 여부 | 0–5 |
| `responsive design intent preservation` | 모바일/태블릿/데스크톱에서 정보 구조와 시각 의도 유지 | 0–5 |
| `editability` | 편집 가능한 디자인 단위가 적절히 잡히는가 (P0.5 detail로 확장) | 0–5 |

근거: krds-studio 라운드 3 §12.3, 라운드 4 §13.1.

## D6. P0.5 편집 평가 축 5개

| 축 | 정의 |
|----|------|
| `selection-accuracy` | 사용자가 의도한 디자인 단위가 정확히 선택되는가 |
| `edit-control-fit` | 선택 단위에 맞는 편집 컨트롤이 나오는가 |
| `layout-preservation-after-edit` | 편집 후 레이아웃과 반응형이 깨지지 않는가 |
| `user-intent-preservation` | 디자인 고도화가 사용자 수정을 덮어쓰지 않는가 |
| `output-tidiness` | 여러 번 편집 후에도 시각적 일관성·간격 리듬·위계가 보존되는가 (3회 편집 시퀀스 스크린샷 입력) |

근거: krds-studio 라운드 3 §12.6, 라운드 4 §13.2.2.

## D7. P0.5 편집 기능 6개 범위

1. **콘텐츠**: 텍스트/버튼 라벨/링크 라벨/alt/마이크로카피
2. **미디어**: 이미지 교체/crop/focal point/overlay, 로고 워드마크-심볼-콤비네이션 구분
3. **구조**: 섹션 순서, 카드/리스트 추가·삭제·복제, 폼 필드, 표 행/열
4. **스타일**: color preset, 배경 톤, 타이포 강도, 섹션 밀도, radius, shadow (raw class 입력보다 control 중심)
5. **반응형**: 모바일/태블릿/데스크톱에서 디자인 의도 유지 즉시 확인
6. **고도화 연결**: 선택 영역 polish, 전체 polish, 사용자 편집 lock/preserve

근거: krds-studio 라운드 3 §12.5.

## D8. 측정 도구 — vision LLM judge

- 0–5 루브릭 + 표준 brief fixture 12개
- 축별 평균 + **축별 최저점 brief 추적** (평균에 묻히지 않게)
- 2점 이하 자동 `design-polish-needed` 표시
- 반복 실패하는 축은 prompt/eval fixture로 승격
- **재현성 체크**: 같은 fixture 3회 실행 시 분산 ≤ 0.5. 분산 크면 `unstable` 표시 후 PoC 판단에서 제외.
- **사람 grading 보정**: 12개 중 3개는 사람 5점 척도, judge와의 Pearson 상관계수 ≥ 0.6. 미만이면 사람 grading 우선 fallback.

근거: krds-studio 라운드 3 §12.3, 라운드 4 §13.2.1.

## D9. 익스포트 = 트리에서 분기되는 다중 변환기

- 변환기 후보: `plain`, `jabworks`, `infoUX`, `KRDS`
- 각 변환기가 **자체 변환 + 자체 검증 + 자체 정렬**을 책임
- v4의 "Compliance Align" 단계는 익스포트 변환기로 흡수
- 사용자 화면에는 "어떤 형식으로 익스포트?" 옵션 한 줄로만 노출
- 사용자가 마주하는 검증은 사실상 "익스포트 가능 여부" 한 가지뿐

근거: krds-studio 라운드 1 §6, 라운드 2 §2.

## D10. P2 PoC 시작 트리거 + 통과 조건

**시작 트리거** (P0의 일부):
- P0 평가 축 7개 중 **최소 4개 이상**이 측정 가능한 상태
- 그 **구현 완료된 축 전체**에 대해 표준 brief 12개 결과 1차 점수 산출
- 점수 산출 결과에 축별 평균/최저점 brief/대표 실패 사유 기록
- 미구현 축은 `not-measured`로 명시 (PoC 판단 근거에서 제외)

**보고 양식 의무 항목**:
- P0.5 5개 축 점수
- P0 측정 완료된 축 점수

**통과 조건**:
- 의미 역할 추출률 ≥ 80%
- 트리→HTML 재렌더 후 `layout-preservation-after-edit`, `output-tidiness` 점수 평균 -0.5 이내

**실패 시 분기**:
- HTML→트리 흡수 어려움 → 옵션 C(JSON 트리 LLM 직접 출력) vs 옵션 A(현행 유지) 재검토
- 트리는 만들 수 있으나 익스포트 디자인 훼손 심함 → 다중 익스포트 자체 재검토, 단일 plain HTML로 축소 옵션

근거: krds-studio 라운드 3 §12.2, 라운드 4 §13.2.3.

## D11. PRD 한 줄 정의

> Dworks — 자연어와 레퍼런스로 웹 디자인 시안을 생성하고, 사용자가 캔버스에서 바로 편집·고도화해 납품 가능한 디자인 산출물로 정돈하는 디자인툴.

보조 문장:
> HTML은 캔버스 렌더링과 export를 위한 매체일 뿐, 제품의 중심 모델은 디자인 산출물과 편집 경험이다.

이름의 어원: 디자인 + jabworks = Dworks.

근거: krds-studio 라운드 3 §12.7 후보 + 사용자 2026-05-07 결정 (이름 정정).

## D12. LLM 호출 정책 — Claude → Codex → Gemini fallback

**모든 LLM 호출**(생성, 고도화, vision judge, 익스포트 변환 보조 등)은 다음 순서로 시도한다.

1. **1순위: Claude** (Anthropic Sonnet/Opus) — 기본 호출 대상.
2. **2순위: Codex** (OpenAI) — Claude가 불능(API 장애, rate limit, 응답 실패, timeout)일 때 자동 fallback.
3. **3순위: Gemini** (Google) — Codex도 불능일 때 fallback.

**구현 원칙**:
- LLM 추상화 레이어를 단일 인터페이스로 두고, 호출자는 fallback 흐름을 알 필요 없다.
- 각 호출에 대해 어느 모델이 응답했는지 메타로 기록 (`generation.modelUsed`, `eval.judgeModel` 등).
- "불능" 판정 기준: HTTP 5xx, rate limit 429, 30초 timeout, 명시적 오류 응답. 코드 정의는 별도.
- vision judge의 모델 일관성을 위해 **judge 호출은 가능한 한 같은 모델로 반복**한다. 한 fixture를 평가하는 도중 fallback이 발생하면 그 fixture의 점수는 `mixed-model`로 표시하고 재현성 체크에서 제외.
- 각 모델의 호출 비용/실패율을 운영 지표로 누적.

**근거**: 사용자 2026-05-07 결정.

## D13. 트리 스키마 라이브러리 — Zod

JSON 의도 트리 정의/검증/흡수기 안전망에 **Zod** (`zod` v3 또는 v4)를 채택.

**선택 근거**:
- TypeScript-first 생태계 1위. Hono, Drizzle, Next.js 등 dworks의 모든 핵심 의존성과 동일 패턴.
- **Discriminated union 지원**이 본 프로젝트에 결정적. 트리 노드 타입(section/hero/card/button/list/form/table/...)이 깊은 union이라 분기 추론이 강해야 한다.
- 타입 추론(`z.infer<typeof schema>`)이 강력해 트리 노드와 TypeScript 타입을 단일 정의로 유지 가능.
- LLM(Claude/Codex/Gemini 모두)이 Zod 스키마 생성에 가장 익숙. 시스템 프롬프트에서 트리 스키마 묘사 시 토큰 효율 우위.
- 광범위한 생태계: `drizzle-zod`, `hono/zod-validator`, `@anatine/zod-mock` 등 dworks가 쓸 도구가 즉시 호환.

**거부된 후보**:
- **ArkType**: 런타임 성능은 더 빠르지만 생태계 점유와 LLM 친화도가 떨어짐. 트리 검증 자체가 hot path가 아니라 ROI가 약함.
- **Yup**: TypeScript 추론이 약함. 추론 강도가 본 프로젝트의 핵심 요건.
- **자체 정의**: 안전망/생태계 도구 손실 비용이 큼.

**적용 범위**:
- `packages/tree`(가칭) — 트리 노드 스키마 정의
- `apps/api` 라우트 입출력 검증
- HTML→트리 흡수기의 출력 검증
- 익스포트 변환기 입력 검증

**근거**: 사용자가 "가장 강점 많은 걸로 알아서" 위임 → Claude 선택 2026-05-07.

## D14. 평가 결과 모델 — JudgeStatus / SuggestedAction 분리

평가 결과는 **점수 신뢰도**와 **제품 다음 행동**을 별도 enum으로 표현한다. 둘을 한 enum에 섞으면 후속 자동화의 분기 조건이 잘못 잡힌다.

```ts
type JudgeStatus =
  | 'ok'            // 정상 평가
  | 'unstable'      // 재현성 분산 > 0.5
  | 'mixed-model'   // 한 fixture 안에서 모델 fallback 발생
  | 'failed'        // 평가 자체 실패 (응답 없음, 파싱 실패 등)

type SuggestedAction =
  | 'acceptable'              // 점수 양호, 그대로 진행
  | 'design-polish-needed'    // 점수 2점 이하, 자동 고도화 입력
  | 'manual-review-needed'    // 신뢰도 의심, 사람 판단 필요
  | 'export-blocking'         // 익스포트 단계 hard fail
```

**해석 원칙**:
- `judgeStatus !== 'ok'`이면 `suggestedAction`은 기본 `manual-review-needed`로 강제.
- `acceptable` / `design-polish-needed` / `export-blocking`은 `judgeStatus === 'ok'`일 때만 선택.

**평가 결과 페이로드 구조**:

```json
{
  "axis": "first viewport richness",
  "score": 3,
  "reason": "핵심 CTA는 보이지만 브랜드 맥락과 이미지 초점이 약함",
  "evidence": ["hero copy generic", "primary CTA below fold on mobile"],
  "judgeStatus": "ok",
  "suggestedAction": "design-polish-needed"
}
```

`axis`는 D5/D6의 12개 축 id로 제한 (Zod enum). `evidence`는 다중 근거 배열.

**근거**: dworks 라운드 4 §2.4 (Codex 분리 제안), 라운드 5 §1.4 (Claude 수용).

## D15. 자율 협업 모드 — 카운터 없는 즉석 검사

Claude / Codex가 사용자 자리 비움에도 의논을 진행하는 모드. 자세한 컨벤션은 `docs/COLLABORATION.md` §11.

**핵심 원칙**:
- 활성/비활성 토글은 `docs/AUTONOMOUS.md` 신호 파일의 존재로만 결정.
- 작동 매개체는 `.git/hooks/post-commit` + `.git/feed.log` + `tail -F` + Monitor 도구.
- 자기 커밋 echo는 `[Claude]` / `[Codex]` 마커로 무시.
- 마커 없는 사용자 직접 커밋은 자율 모드에서 무시 (사용자 명시 지시 우선).

**안전장치는 카운터 없이 즉석 검사**:
- 라운드 6 도달 (`≥ 6`): `ls docs/discussions/<topic>-round-*-*.md | wc -l`
- 1시간 내 동일 파일 3회 이상 (단 가장 최근의 `[ABSORB]` marker 커밋 이후만 카운트): 흡수 커밋이 reset 지점이라 의논 흐름의 자연스러운 누적이 false positive를 만들지 않는다.
- 동일 미해결 2회 연속: 라운드 시작 시 에이전트 문맥 판단
- `git pull --ff-only` 실패: 즉시 정지 + ALERT
- 코드 변경 발생 라운드: 즉시 정지 (자율 모드는 docs만)

**메인 문서 흡수는 사용자 OK 신호 필수** (`COLLABORATION.md` §7). 자율 모드가 흡수까지 자동 진행하지 않는다.

**근거**: dworks 라운드 1 §11 (Claude 컨벤션 도입), 라운드 2 §2.5 (Codex 카운터 stale 지적), 라운드 3 §2.3 (Claude 카운터 제거 대안), 라운드 4 §2.1 (Codex 채택), 라운드 5 §1.1 (Claude 합의).

---

## 부록 A. 의논 라운드 추적

### krds-studio 라운드 (의논 발단)

| 라운드 | 작성자 | 출처 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Codex (krds-studio §10) | 의논 노트 | 디자인 결과물 vs HTML 검증 분리, P0/P1/P2 우선순위 |
| 2 | Claude (krds-studio §11) | 의논 노트 | P0/P0.5/P1/P2 합의, eval 입력 본질 합의 |
| 3 | Codex (krds-studio §12) | 의논 노트 | 편집 기능 P0.5 격상, PRD 한 줄 정의 후보 |
| 4 | Claude (krds-studio §13) | 의논 노트 | judge 신뢰성 보강, output-tidiness 정의, PoC 회귀 차단 |

### dworks 라운드 (PLAN 합의)

| 라운드 | 작성자 | 파일 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Claude | (별도 노트 없음, 1차 안 커밋 4건: `74be743`/`ddf1616`/`b449f3d`/`30d4697`) | PLAN.md/DECISIONS.md/COLLABORATION.md 1차 안 + 자율 모드 도입 |
| 2 | Codex | `docs/discussions/2026-05-07-plan-round-2-codex.md` | E Hybrid 명확화, M0.5 신설 제안, 라운드 번호 정정, 카운터 stale 지적 |
| 3 | Claude | `docs/discussions/2026-05-07-plan-round-3-claude.md` | 라운드 2 6건 합의, M0.5 범위 + 새 캔버스 + 카운터 제거 대안 |
| 4 | Codex | `docs/discussions/2026-05-07-plan-round-4-codex.md` | 라운드 3 4건 채택 + JudgeStatus/SuggestedAction 분리 제안 |
| 5 | Claude | `docs/discussions/2026-05-07-plan-round-5-claude.md` | 분리안 수용, 미해결 0건, 흡수 트리거 |
