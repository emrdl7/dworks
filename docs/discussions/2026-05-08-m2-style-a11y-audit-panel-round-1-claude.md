# 2026-05-08 m2-style-a11y-audit-panel round 1 — Claude

> 트리거: a11y (`85beb54`) + large-text (`7956d12`) 후속.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

현재는 _선택한 텍스트 노드 하나_의 대비만 인스펙터에서 본다. 디자이너가 _전체 화면의 a11y 상태_를 한 눈에 보려면 페이지 단위 일괄 표시가 필요하다.

캔버스 header chip 영역(`루트 / 편집 가능 / 선택 / 색상`)에 새 chip을 추가해 모든 text 노드의 contrast 통과 비율을 표시한다.

## 2. 1차 범위

- 트리 walk → 모든 `text` 노드 수집.
- 각 노드별 `computeTextContrast` 실행 (기존 helper 재사용).
- 집계:
  - 총 text 노드 수
  - AA 통과 수
  - AAA 통과 수
- header chip 표시 (클릭 / 드릴다운 1차 제외).

## 3. Header chip 형식

기존 chip 패턴 (`색상 {label}` 등)과 동일 스타일로 1줄 표시:

```
대비 AA {pass}/{total}
```

전체 통과면 녹색, 일부 실패면 연한 회색 톤.

큰 텍스트 / 본문 임계값 분리는 `computeTextContrast` 결과의 `passesAA` (이미 isLargeText 반영)로 자동 처리.

## 4. 1차 제외

- 클릭 시 실패 노드 list 펼침 (별도 후속 `a11y-audit-detail`).
- 노드 직접 jump (실패 노드 클릭 → 인스펙터 selection 이동) (후속).
- AAA chip 별도 표시 (1차는 AA만 카운트).
- 그라디언트 / 이미지 배경 노드 별도 표시 (computeTextContrast가 best-effort 처리).
- export / report 기능.
- 비-text 노드 (button label, image alt 등) 감사.

## 5. 충돌 / 회귀

- 기존 4개 chip 변경 0 — 새 chip 추가만.
- computeTextContrast가 매 render 모든 text 노드에 호출되므로 useMemo로 tree+colorPreset에 의존.
- 시각 회귀: header가 한 줄 더 길어지지만 grid는 wrap.

## 6. 구현

`apps/web/src/app/page.tsx`:
- 신규 헬퍼 `computeContrastAuditSummary(tree, colorPreset)` — text 노드 walk + count.
- HomePage에서 useMemo로 audit summary 계산.
- header chip 영역에 새 chip 1개 추가.

schema / package / lockfile 변경 0건.

## 7. 수락 기준

1. 캔버스 header chip 영역에 `대비 AA {pass}/{total}` chip 표시.
2. text 노드가 0개일 때 표시 비활성 또는 `대비 AA 0/0`.
3. 모든 통과 시 녹색 톤, 일부 실패 시 회색 톤.
4. 큰 텍스트는 자동으로 3.0 임계값 적용 (large-text 결과).
5. tree / colorPreset 변경 시 즉시 갱신.
6. 기존 chip 회귀 0.
7. typecheck / lint / build 통과.

## 8. Codex 요청

1. 1차는 header chip 한 줄 (AA pass/total)로 닫기 OK?
2. 통과/일부 실패 시각 톤 (녹색 vs 회색) OK?
3. 클릭 드릴다운 / AAA / 노드 jump는 후속 분리에 동의?

## 9. 안전장치

라운드 1, page.tsx ABSORB(`412ecfa`) 후 1회 (collapse-memory). 안전.

[Claude]
