# 2026-05-10 인스펙터 렌더링 값 일치 검증 — Codex

검증 시각: 2026-05-10 09:20 KST

대상 HEAD: `a0fffa5 feat: 레이어 트리 컨테이너 row에 자식 카운트 표시`

## 결론

사용자 지적이 맞다. Claude의 `b8c08c9`는 인스펙터 기본 탭을 `콘텐츠`로 바꿔서 텍스트/이미지 내용 확인성은 개선했지만, 초기 생성 결과의 캔버스 렌더링 값 전체를 인스펙터 값과 일치시키는 작업은 아니다.

현재 상태:

1. 텍스트 content, 이미지 src/alt/focal point 같은 콘텐츠 값은 우측 인스펙터와 캔버스/fixture가 일치한다.
2. 타이포그래피는 일부 effective default를 placeholder/slider/select로 보여주지만, 숫자 input 값 자체는 비어 있다.
3. 레이아웃, 간격, 색상, 모양 등 캔버스 CSS class 또는 token으로 렌더링되는 기본값은 인스펙터 edit state에 들어오지 않는다.
4. 따라서 "초기 생성 시 인스펙터 값과 캔버스 내용/값 일치" mandate를 완료로 보면 안 된다.

## 재현 기준

기본 fixture: `단순 히어로`

서버:

- `http://localhost:3000/`: 200

브라우저 기준 실제 렌더 값:

- `hero` section
  - `display: grid`
  - `grid-template-columns: 556.5px 503.5px`
  - `gap: 40px`
  - `padding: 48px`
  - `background-color: rgb(16, 40, 34)`
  - `color: rgb(255, 255, 255)`
- `hero.title` h2
  - `font-size: 48px`
  - `font-weight: 600`
  - `line-height: 60px`
  - `color: rgb(255, 255, 255)`
- `hero.cta` span
  - `padding-left/right: 20px`
  - `height: 44px`
  - `border-radius: 6px`
  - `background-color: rgb(27, 127, 114)`
- `hero.visual` img
  - `object-fit: cover`
  - `width: 500px`
  - `height: 280px`

## 확인된 불일치

### P1 — 컨테이너 레이아웃/간격 값이 인스펙터에 비어 있음

`hero`를 선택하고 `레이아웃` 탭을 보면:

- `항목 간격`: value `""`, placeholder `기본`
- `안쪽 여백 전체`: value `""`, placeholder `기본`
- `자식 간격`: value `""`, placeholder `기본`
- 방향/정렬/분배 toggle도 렌더된 grid 상태를 표현하지 못함

반면 캔버스는 `grid`, `gap 40px`, `padding 48px`, 2-column grid로 렌더된다.

코드 근거:

- `apps/web/src/app/page.tsx`
  - `CanvasNode`의 hero case는 className으로 `grid min-h-[420px] gap-10 ... p-12`를 적용한다.
  - `LayoutControls`는 `node.layout ?? {}`와 `node.spacing ?? {}`만 읽는다.
  - `SpacingControls`도 `node.spacing ?? {}`만 읽고 placeholder `기본`을 보여준다.

이 구조에서는 className/default token으로 렌더된 값과 inspector edit state가 자동으로 일치할 수 없다.

### P1 — 색상/모양 기본 렌더 값이 인스펙터에 비어 있음

`hero`를 선택하고 `디자인` 탭을 보면:

- `배경 색상`: value `""`, placeholder `#RRGGBB`
- `글자 색상`: value `""`, placeholder `#RRGGBB`
- `테두리 종류`: selected `기본`
- `그림자 종류`: selected `기본`

반면 캔버스는 `hero` section에 배경색 `rgb(16, 40, 34)`와 흰 글자색이 적용된다.

`hero.visual`도 figure 배경, border, image object-fit이 렌더되지만 디자인 탭에는 대부분 빈 값으로 남는다.

### P2 — 텍스트 타이포그래피는 "부분 표시" 상태

`hero.title` 선택 후 `디자인 > 타이포그래피`:

- `글꼴`: value `sans`, selected `산세리프`
- `크기`: value `""`, placeholder `48`
- `굵기`: value `""`, selected `기본 세미볼드`
- `행간`: value `""`, placeholder `1.25`
- `자간`: value `""`, placeholder `0`
- `크기 슬라이더`: value `48`

즉 텍스트는 콘텐츠 값이 정확하고 일부 effective default 표시도 있지만, 입력 값 자체는 실제 렌더 값으로 채워져 있지 않다. "값 일치"를 엄격히 보면 아직 미완료다.

## 최근 Claude 커밋 확인

최신 5개 Claude 커밋 검증:

- `2621cc8` P1/P2 follow-up
  - 정적 검증 통과.
  - 이전 Codex 지적 범위였던 fixture 대비/toolbar 수정 방향 자체는 유지됨.
- `70f43e7` Cmd/Ctrl+A 전체 선택
  - Playwright: 기본 5개 노드 기준 primary ring 1개 + additional ring 4개 확인.
- `b8c08c9` 인스펙터 default 탭 콘텐츠 변경
  - 실제 기본 탭은 `콘텐츠`.
  - 텍스트 textarea와 이미지 src/alt/focal point는 맞음.
  - 다만 렌더링 속성값 일치 mandate까지 완료한 것은 아님.
- `0109f9b` 레이어 row hover tooltip content preview
  - `hero.title`: `텍스트 — Dworks로 디자인을 시작하세요`
  - `hero.subtitle`: `텍스트 — 자연어와 레퍼런스로 웹 디자인 시안을 생성하고 캔버스에서 바로 편집합니다.`
  - `hero.cta`: `버튼 — 지금 시작하기`
  - `hero.visual`: `이미지 — 노트북 화면 위에 열린 디자인 작업 공간`
- `a0fffa5` 레이어 container child count
  - 레이어 row에서 `hero4` 형태로 자식 수 4 표시 확인.

## 검증 결과

- `git status --short --branch`: clean, `main...origin/main [ahead 197]`
- `pnpm lint`: 통과
- `pnpm typecheck`: 통과
- `pnpm test`: 통과
- `pnpm build`: 통과
- `http://localhost:3000/`: 200
- Playwright 1680 viewport 실제 DOM/computed style 대조 완료

## Claude 다음 액션 권장

1. `b8c08c9`를 "전체 값 일치 완료"로 간주하지 말 것. 완료 범위는 콘텐츠 탭 기본 진입과 content/src/alt 표시 개선이다.
2. 초기 생성/fixture/LLM tree 적용 직후, inspector가 보여야 하는 값의 기준을 정해야 한다.
   - 권장안: canvas class default와 CSS token을 inspector용 resolved value로 계산해 읽기 전용/effective value로 보여준다.
   - 차선안: 생성 tree에 `spacing`, `layout`, `color`, `shape`, `typography` 값을 명시적으로 materialize해서 inspector edit state와 canvas render state를 동일 source of truth로 만든다.
3. 우선 P1 범위:
   - container layout: display/grid/flex, direction, align, justify, gap
   - spacing: padding/margin/gap
   - color: background/text/accent token resolved value
   - shape: radius/border/shadow
4. 이후 P2 범위:
   - typography numeric input도 placeholder가 아니라 effective value 표시 정책을 정한다.
   - image presentation(`object-fit`, ratio, focal point, overlay/filter)도 content/design 탭 간 분리를 재정리한다.

[Codex]
