# 2026-05-10 현재 작업분 재검증 — Codex follow-up

검증 시각: 2026-05-10 08:42 KST

대상 HEAD: `76420a6 feat: 캔버스 빈 영역 우클릭 → global context menu`

## 결론

Claude의 후속 작업은 이전 Codex 지적 사항(P1/P2)을 대부분 정상 보완했다.

다만 새로 추가된 `다크 럭셔리 hero` fixture가 자체 대비 검증을 깨고 있어, 현재 상태를 `완전 통과`로 보기는 어렵다.

## 통과 항목

- `pnpm lint`: 통과
- `pnpm typecheck`: 통과
- `pnpm test`: 통과
- `pnpm build`: 통과
- `http://localhost:3000/`: 200
- 주요 CSS/JS/image asset: 200
- Playwright 1680 / 768 / 440 렌더:
  - page error 없음
  - console error 없음
  - failed request 없음
- 이전 Codex P1 `모바일 프리뷰 이미지 overflow`: 해결 확인
- 이전 Codex P2 `440px 드로어 토글 가림`: 해결 확인
- 이전 Codex P2 `440px toolbar 그리드 버튼 접근 불가`: 해결 확인
- 빈 캔버스 우클릭 global context menu: 동작 확인
- 모바일 `FIT` 버튼: 동작 확인

## 확인한 개선점

### 모바일 프리뷰 이미지 overflow

440 / 768 / 1680 브라우저 폭에서 `모바일` viewport 선택 후 기본 fixture를 확인했다.

- `hero.visual` clientWidth: 약 273px
- `hero.visual` scrollWidth: 약 273px
- overflowingNodes: 없음

이전처럼 이미지가 375px 아트보드 밖으로 빠지는 현상은 재현되지 않았다.

### 모바일 드로어 토글

440px에서 다음 상호작용을 확인했다.

- `브리프 패널 열기` → `브리프 패널 닫기`: 통과
- `속성 패널 열기` → `속성 패널 닫기`: 통과

드로어가 헤더 토글을 덮던 문제는 해결됐다.

### 440px toolbar

440px 기준 `그리드` 버튼 rect:

- x: 359
- right: 427
- viewport width: 440

viewport 안에 들어오며 접근 가능하다.

### global context menu

캔버스 빈 영역 우클릭 시 다음 메뉴가 열리는 것 확인:

- 선택 해제
- 선택 노드를 화면 중앙에
- 화면에 맞춤
- 줌 100% 리셋
- 그리드 표시
- 좌/우 패널 표시

## 남은 문제

### P1 — `다크 럭셔리 hero` fixture 대비 실패

재현:

1. `http://localhost:3000/` 접속
2. 예제 fixture에서 `다크 럭셔리 hero` 선택

결과:

- 헤더에 `대비 11/12` chip이 표시된다.
- 대비 chip 클릭 시 실패 노드는 `footer.copy`로 이동한다.

의심 지점:

- `seeds/trees/dark-luxury-hero.json`
- `footer.copy`
- 현재 텍스트 색상: `#5b6069`
- 배경: `#0a0a0f`

관련 위치:

- `seeds/trees/dark-luxury-hero.json:380`

권장 보완:

- `footer.copy`의 `textColor`를 최소 `#898d97` 이상으로 올린다.
- fixture는 "품질 모범 예시"로 쓰이는 데이터라 자체 대비 chip이 떠서는 안 된다.
- 보완 후 fixture 선택 상태에서 대비 chip이 사라지는지 다시 확인한다.

### P2 — 768px toolbar가 아직 일부 가로 스크롤 의존

재현:

1. 768px 브라우저에서 기본 화면 확인

결과:

- 440px은 해결됐지만, 768px + 좌측 패널 표시 상태에서는 toolbar 전체 폭이 좁아 `그리드` 버튼이 오른쪽 끝에서 일부 잘린다.
- 접근 불능은 아니지만, 디자인 툴 품질 기준에서는 polish 대상이다.

의심 지점:

- `apps/web/src/app/page.tsx`
- toolbar container: `apps/web/src/app/page.tsx:4231`

권장 보완:

- 768~1024 구간에서 toolbar priority를 재정리한다.
- 예: viewport switcher, zoom, fit, grid를 compact icon-first로 전환하거나, 중간 폭에서도 일부 label을 숨긴다.

## 최종 판단

Claude의 방향은 맞다. 특히 이전 Codex P1/P2는 실제 브라우저 기준으로 대부분 해결됐다.

그러나 `다크 럭셔리 hero` fixture가 새로 접근성 실패를 만들었으므로, 현재 상태를 "완전 검증 통과"로 선언하면 안 된다. 다음 작업자는 fixture 대비 보정부터 처리해야 한다.

[Codex]
