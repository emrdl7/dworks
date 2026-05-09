# 2026-05-10 현재 작업분 검증 — Codex

검증 시각: 2026-05-10 07:48 KST

대상 HEAD: `87ee5a2 docs: HANDOVER-2026-05-10-overnight — 자율 밤샘 세션 70+ commit 정리`

## 결론

1. 정적 검증과 서버 구동은 통과.
2. CSS/JS asset 로드는 현재 3000 서버에서 정상.
3. 다만 실제 브라우저 시각 검증에서 모바일/태블릿 품질 이슈가 남아 있어, `1.0 완성`으로 보기는 아직 이르다.

## 통과 항목

- `pnpm lint`: 통과
- `pnpm typecheck`: 통과
- `pnpm test`: 통과
- `pnpm build`: 통과
- `pnpm --filter @dworks/web preflight`: 통과
- `http://localhost:3000/`: 200
- 주요 `/_next/static/*` CSS/JS: 200
- `/_next/image?url=%2Fdworks-logo.png&w=64&q=75`: 200
- 1680 / 768 / 440 Playwright 렌더: page error, console error, failed request 없음

## 재현된 문제

### P1 — 모바일 프리뷰에서 이미지 노드가 아트보드 밖으로 넘침

재현:

1. 440px 또는 768px 브라우저에서 `http://localhost:3000/` 접속
2. 캔버스 toolbar에서 `모바일` 선택
3. 기본 `단순 히어로` fixture 확인

결과:

- 375px 모바일 아트보드 내부에서 `hero.visual` 이미지가 오른쪽으로 넘친다.
- Playwright 측정 기준 `hero.visual` 부모는 약 275px인데 내부 figure/image scrollWidth가 약 569~619px까지 커진다.
- 이는 디자인 툴의 모바일 미리보기 품질뿐 아니라, 생성 결과의 웹 구조 신뢰도를 낮춘다.

의심 지점:

- `apps/web/src/app/page.tsx`
- `ImagePreview`의 `figure`가 `min-h-[320px]`와 aspect-ratio를 동시에 갖고 있어 좁은 부모에서 최소 너비가 커지는 것으로 보인다.
- 관련 라인: `apps/web/src/app/page.tsx:6272`

권장 보완:

- 이미지 figure에 `w-full max-w-full min-w-0` 계열 제약을 걸고, 모바일/좁은 부모에서는 `min-height`를 반응형으로 낮춘다.
- 모바일 preview용 회귀 테스트를 추가해 `canvas artboard scrollWidth <= clientWidth + 허용치`를 확인한다.

### P2 — 모바일 좌/우 드로어의 헤더 토글이 드로어에 가려짐

재현:

1. 440px 브라우저에서 `브리프 패널 열기` 클릭
2. 같은 헤더 버튼으로 닫기 시도

결과:

- Playwright 클릭이 실패한다.
- 이유: 열린 좌측 패널이 헤더 닫기 버튼 위를 덮고 있고, 실제 hit target은 좌측 패널의 `브리프` 탭이다.
- 우측 속성 패널도 동일하게 헤더 닫기 버튼 위치가 패널 내부 컨텐츠에 의해 가려진다.
- 외부 overlay 클릭 또는 Esc로 닫을 수는 있지만, 사용자가 본 토글 버튼으로 다시 닫는 기본 기대와 맞지 않는다.

의심 지점:

- 좌측 드로어: `apps/web/src/app/page.tsx:2786`
- 우측 드로어: `apps/web/src/app/page.tsx:3927`
- header toggle: `apps/web/src/app/page.tsx:2681`, `apps/web/src/app/page.tsx:2754`

권장 보완:

- 드로어 내부 상단에 명시적인 닫기 버튼을 배치하거나, 모바일에서 header보다 낮은 top offset으로 drawer를 시작한다.
- overlay와 header toggle에 동일한 `aria-label`을 쓰는 구조도 테스트 선택자와 보조기기 탐색을 혼란스럽게 하므로 구분한다.

### P2 — 440px toolbar에서 그리드 버튼이 오른쪽으로 잘려 접근 불가

재현:

1. 440px 브라우저에서 기본 화면 확인

결과:

- toolbar의 `그리드` 버튼이 `x=456` 이후에 위치해 440px viewport 밖으로 밀린다.
- document horizontal overflow는 숨겨져 있어 화면에서는 접근하기 어렵다.
- `데스크톱` segmented button도 2줄로 꺾여 toolbar 밀도를 더 악화시킨다.

의심 지점:

- `apps/web/src/app/page.tsx:3746`
- toolbar가 `flex h-10 ... gap-3 ... px-4` 고정 구조이고, mobile overflow/scroll/compact 처리 없음.

권장 보완:

- toolbar에 `overflow-x-auto`와 모바일 전용 compact spacing을 적용한다.
- 440px에서는 viewport switcher / width badge / zoom / grid를 우선순위별로 줄이거나 일부를 overflow menu로 분리한다.

## 현재 서버 상태

- 기존 3000 프로세스는 정리 후 재시작했다.
- 현재 `http://localhost:3000/`는 fresh `.next` 기준으로 200 응답.

## Claude에게 필요한 다음 액션

1. 위 P1을 먼저 수정한다. 사용자가 강조한 "웹 디자인 툴" 기준에서 모바일 아트보드 오버플로우는 품질 기준 미달이다.
2. P2 두 건은 모바일 사용성 문제다. 1.0 완료 선언 전에 최소 보완 또는 명시적 known issue 처리가 필요하다.
3. 보완 후 `pnpm lint && pnpm typecheck && pnpm test && pnpm build`와 1680/768/440 Playwright 스크린샷 검증을 다시 수행한다.
