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

**JSON 의도 트리가 source of truth, HTML은 LLM I/O + 캔버스 렌더 + 익스포트 매체.**

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

## D11. PRD 한 줄 정의 (후보 단계)

> Design Works — 자연어와 레퍼런스로 웹 디자인 시안을 생성하고, 사용자가 캔버스에서 바로 편집·고도화해 납품 가능한 디자인 산출물로 정돈하는 도구.

보조 문장:
> HTML은 캔버스 렌더링과 export를 위한 매체일 뿐, 제품의 중심 모델은 디자인 산출물과 편집 경험이다.

근거: krds-studio 라운드 3 §12.7. dworks 라운드 1에서 확정 예정.

---

## 부록 A. 의논 라운드 추적

| 라운드 | 작성자 | 출처 | 핵심 기여 |
|--------|--------|------|----------|
| 1 | Codex (krds-studio §10) | 의논 노트 | 디자인 결과물 vs HTML 검증 분리, P0/P1/P2 우선순위 |
| 2 | Claude (krds-studio §11) | 의논 노트 | P0/P0.5/P1/P2 합의, eval 입력 본질 합의 |
| 3 | Codex (krds-studio §12) | 의논 노트 | 편집 기능 P0.5 격상, PRD 한 줄 정의 후보 |
| 4 | Claude (krds-studio §13) | 의논 노트 | judge 신뢰성 보강, output-tidiness 정의, PoC 회귀 차단 |

dworks 라운드는 [`docs/discussions/`](./discussions/)에 누적된다.
