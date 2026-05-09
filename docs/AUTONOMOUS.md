# 자율 협업 모드 활성

**활성화**: 2026-05-07 10:37 KST by 사용자 승인
**재가동**: 2026-05-08 by 사용자 "ㄱㄱ" (m2-style-typography round 6 ALERT 후)
**Claude 측 가동**: ON (post-commit hook + `.git/feed.log` watcher)
**Codex 측 가동**: ON (Codex heartbeat `dworks-claude-commit-watcher`)
**모드**: 이벤트 기반 (post-commit hook + feed log + heartbeat)

상태/카운터는 보관하지 않는다. 안전장치는 git에서 즉석 산출한다 (`COLLABORATION.md` §11.6).

## 작동 요지

- `.git/hooks/post-commit`이 모든 커밋을 `.git/feed.log`에 hash 한 줄씩 누적한다.
- 각 작업자는 새 hash를 감지한 뒤 커밋 메시지 footer의 `[Claude]` / `[Codex]` 마커로 작성자를 식별한다.
- 자기 마커 커밋은 echo로 보고 무시한다.
- 상대방 마커 커밋은 `docs/COLLABORATION.md`와 본 파일의 mandate에 따라 검토하고 응답한다.
- 마커 없는 사용자 직접 커밋은 자율 모드에서 임의 처리하지 않고 사용자 명시 지시를 우선한다.

## 현재 mandate

### 2026-05-07 mandate (M1 트랙)

- **M0** 프로젝트 부트스트랩 — 완료
- **M0.5** Tree Foundation — 완료
- **M1.1** P0 부트스트랩 — 완료
- **M1.2** live baseline — 완료
  - 1단계 (4축 48 calls) ✓
  - 2단계 (7축 84 calls) ✓
  - 3단계 (재현성 7축 × repeat=3 = 252 calls, D8 stable) ✓ — `m1-live-reproducibility` 흡수 (`2adaf40`)

### 2026-05-09 mandate (AI 생성 파이프라인 — M3 트랙)

사용자 신호 (2026-05-09):
> "ai가 생성한 결과물을 사람이 고치는거야... 근데 ai생성쪽은 시작도 못하는 이유가 뭐야? 사람이 고치는쪽에만 너무 메달려 있는거 아니야?"

**mandate 핵심**: PoC 본질은 _사람이 AI 결과를 다듬는 것_. M2 자유 편집 트랙은 충분한 깊이 도달 (45+ 토픽, ABSORB 10회). 그러나 **AI 생성 파이프라인이 stub 상태** — `apps/api/src/index.ts`는 14줄 health check만, web에 prompt → tree 생성 호출 경로 없음. PoC 입증을 위해 m3 generate 트랙 진입.

**M2 트랙 흡수 (mandate 충분 도달)**:
- 8 mandate 영역 100% (font-upload / spacing / shape / color-free / layout / image-crop / responsive-preview / text-inline) + 디테일 35+ 후속
- 디자이너 자유 편집 mental model 완성 (노드 단위 모든 속성 override 가능)
- 추가 m2 후보 (transition-steps-custom / linear-easing / responsive-override / gradient-stops 등)는 _mandate 충분_ 후 polish 영역. M3 트랙 진척 후 우선순위 재평가.

**M3 트랙 mandate**:

> 사용자 prompt → LLM → tree JSON → 캔버스 즉시 적용. 그 결과를 디자이너가 m2 자유 편집으로 다듬는 end-to-end 1차 사이클을 입증한다.

**M3 트랙 진척**:
- ✓ `m3-generate-mvp` (`24d5517` / `28d8f38` / `eb60396`) — POST /generate Claude CLI 단일, 헤더 한 줄 prompt UI
- ✓ `m3-generate-brief` (`fd5aa88`) — 좌측 패널 + 5필드 brief + 생성 히스토리 (clarify에 의해 5필드 UI 교체, API stepping stone)
- ✓ `m3-generate-clarify` (`d6d84cc` r4 / `e873a6d` r5 통합) — POST /clarify (적응형 질문 3~6) + brief 재정의 (answers) + Stage 1/2 web UI + "의도만으로 바로 생성" fallback
- ✓ `m3-generate-fallback` (`eb6aada` r4 / `c312aba` r5) — LlmProvider chain (claude/codex/gemini) + resolveProviderChain env + callLlmChain 순회. /generate + /clarify 모두 적용. parse/schema 실패는 fallback 안 함
- ✓ `m3-generate-codex-adapter` (`9f61575` r4 / `b40cd6a` r5) — codex `-o tempfile` + final message 회수. extract-failure 분류 + 다음 provider 시도
- ✓ `m3-generate-variant` (`9b6b503` r4 / `d31e3f2` r5 fix) — N (1/2/3) 변형 동시 생성. Promise.allSettled, diversity hint request-only, immutable 원본 보호 헬퍼
- ✓ `m3-generate-prompt-uplift` (`f6eba0e` r4 / `2280a56` r5) — schema-valid 3 generate examples (카페/SaaS 가격/블로그) + 1 clarify example (도시 호텔). TS 객체 + JSON.stringify, llm-prompts test로 drift 방지
- ✓ `m3-generate-eval` (`639ed03` r4 / `6dcfe6f` r5) — apps/m3-eval CLI: fixtures × repeat × providers, status/latency/treeStats 측정, manifest+calls.jsonl+summary.{json,md}. dry-run 기본 + --live, /generate body request-level providers override

**M3 후속 후보**:
- `m3-generate-gemini-adapter` — Gemini CLI 어댑터
- ✓ `m3-generate-prompt-style` (`f98a6e2` r4) — examples 3개에 도메인 시그니처(카페 따뜻한 그라디언트 / SaaS pro card accent / 블로그 절제 lineHeight), system prompt 정책 완화, drift 방지 test 3건. examples block 1.34×
- ✓ `m3-generate-eval-diversity` (`1de372e` r4 / `4b98f10` r5) — m3-eval에 multiset Jaccard 기반 구조 다양성 score, summary `구조 다양성` 컬럼 + dry-run 메모, in-memory tree 누적
- `m3-generate-eval-judge` — LLM-as-judge 정성 점수
- ✓ `m3-generate-variant-grid` (`892290f` r4 / `fc8223a` r5) — compareMode 토글 + mini canvas grid + 단일 모드 복귀. CanvasReadOnlyContext로 SelectableNode 비활성화, fixture/생성 시 자동 복귀 + generateLoading 중 cell 차단
- ✓ `m3-generate-clarify-loop` (`763b657` r4 / `4565e81` r5) — 선택형 multi-turn clarify (max 2 history). API schema 분리(첫 turn 3~6 / follow-up 0~3), web ClarifyTurn snapshot, "더 구체적으로" + "답변이 충분합니다" 신호. 별도 fix `c984b21` — api에 hono/cors 추가
- ✓ `m3-generate-prompt-emotional-mapping` (`7b5230a` r4) — system prompt에 5종 톤 매핑 가이드(차분/활기/친근/전문/프리미엄). raw hex X(색 계열만), 복합 톤은 주 톤 1개 우선. drift test 강화(header + 5 라벨)
- ✓ `m3-generate-prompt-page-foundations` (`1ab5273` r4 / `9aee05a` r5) — 풀 페이지 골격(root section + banner/main/contentinfo) + 2026 트렌드 가이드 + responsive 의도 시범. examples 3개 풀 페이지로 재구성(298 → ~600 라인). 사용자 정정(헤더/푸터 부재) 흡수. fallback 기본값도 풀 페이지로 정합
- ✓ `m3-generate-clarify-edit` (`d456089` r4 / `ab2a52a` r5) — active variant 선택 시 brief/questions/answers/notes를 Stage 2 폼에 복원, 답변 수정 후 새 변형 추가. GenerationEntry.questions snapshot, deep copy 방어, intent-only 분기, Stage 1에서 stale answers 차단
- `m3-generate-stream` — 스트리밍 응답 (CLI batch return 한계 대응)
- `m3-generate-image-ref` — 이미지 reference 입력

### 2026-05-08 mandate (디자이너 자유 편집 — M2 트랙) — 흡수 완료

사용자 신호 (2026-05-08):
> "나는 디자이너야... 디자이너가 봤을때 저정도의 테마교체 로 디자인툴이라고 만족할 수 있겠니?"
> "타이포쪽을 우선으로 하고 나머지 순차적으로 모두 반영해"
> "폰트는 ttf를 내가 직접 등록해서 사용할 수 있도록 해줘"

**mandate 핵심**: preset toggle은 디자인툴 만족 못 함. 디자이너는 _노드 단위 자유 편집_을 기대.

**진척 (m2 트랙 흡수 commit `2adaf40` 이후)**:
- ✓ `m2-edit-runner` — apps/edit-runner CLI MVP
- ✓ `m2-edit-eval` — D6 5축 dry-run + Zod schema
- ✓ `m2-visible-editor` — apps/web 첫 화면
- ✓ `m2-fixture-loader` — seeds/trees 3종 catalog + switcher
- ✓ `m2-edit-undo` — snapshot stack undo/redo
- ✓ `m2-image-node` — image 1급 노드 + hero visual 트리화
- ✓ `m2-structure-ops` — move/duplicate/delete + inspector
- ✓ `m2-i18n-korean` — UI 한글화
- ✓ `m2-style-color` — colorPreset 5종 + 11키 토큰
- ✓ `m2-style-typography` — typography 자유 6필드 + TTF schema 확장
- ✓ `m2-style-gradient` — 배경 그라디언트 자유 입력
- ✓ `m2-style-shadow-custom` — 모양 커스텀 그림자 자유 입력
- ✓ `m2-style-text-shadow` — 텍스트 그림자 자유 입력
- ✓ `m2-brand-logo` — Dworks header 로고 + App Router favicon 적용

**남은 mandate (순차 진행)**:

1. **`m2-style-font-upload`** ← 다음 토픽 (사용자 mandate "TTF 직접 등록" 직접 충족). File API + FontFace API + IndexedDB registry.
2. `m2-style-spacing` — padding/margin/gap 노드별 자유 편집.
3. `m2-style-shape` — box-shadow + border-radius + border 노드별.
4. `m2-style-color-free` — 자유 색상 hex picker + 노드 단위 color override (preset 단독 종속 해제).
5. `m2-style-layout` — flex direction/align/justify/gap 자유.
6. `m2-image-crop` — focal point drag + crop UI + overlay/opacity.
7. `m2-responsive-preview` — mobile/tablet/desktop viewport switcher + 노드별 반응형 의도 보존.
8. `m2-text-inline` — paragraph 안 inline bold/italic/link 스팬.

후속 후보 (사용자 우선순위 위임):
- ✓ `m2-style-typography-preset` — 자유 입력 위의 빠른 preset shortcut (`7d415dc`)
- ✓ `m2-style-font-stack` — Pretendard 한글 sans 도입 (`54fb9d6`)
- ✓ `m2-style-a11y` — WCAG 텍스트 대비 readout (`85beb54`)
- ✓ `m2-style-gradient-conic` — conic gradient 종류 (`00ef3dd`)
- ✓ `m2-style-shadow-multi` — 다중 shadow (`e33941b`)
- ✓ `m2-style-color-state` — 버튼 hover 배경 (`5bc7a61`)
- `m2-responsive-override` — viewport별 속성 override
- ✓ `m2-inspector-collapse-master` — 모두 접기 / 펼치기 master toggle (`6bdcc20`)
- ✓ `m2-inspector-collapse-memory` — 노드별 토글 기억 (`27fd8e1`)
- ✓ `m2-style-a11y-large-text` — 큰 텍스트 임계값 (`7956d12`)
- ✓ `m2-style-a11y-audit-panel` — 헤더 chip 전체 대비 표시 (`9410711`)
- ✓ `m2-style-gradient-conic-controls` — conic 시작각/중심 (`53b7e36`)
- `m2-style-gradient-stops` — 모든 gradient 다중 stop 지원
- ✓ `m2-style-font-stack-self-host` — Pretendard npm self-host (`8895de8`)
- ✓ `m2-style-color-state-text` — hover textColor (`e28914c`)
- ✓ `m2-style-color-state-active` — active 배경 + 글자 (`ed92b0c`)
- ✓ `m2-style-color-state-focus` — focus-visible 배경 + 글자 (`1ff7047`)
- ✓ `m2-style-color-state-disabled` — disabled 배경 + 글자 (`4e268a8`)
- ✓ `m2-style-shadow-multi-inset` — inset shadow (`2d9d624` + Codex fix)
- ✓ `m2-color-state-disabled-toggle` — disabled 토글 UI (`a6483a6`)
- ✓ `m2-style-transition` — transition duration (`87ac637`)
- `m2-responsive-override` — viewport별 속성 override
- `m2-style-gradient-stops` — 모든 gradient 다중 stop
- ✓ `m2-style-cursor` — 노드별 cursor (`ece55cd`)
- ✓ `m2-style-image-filter` — 이미지 CSS filter 5종 (`f2458b1`)
- ✓ `m2-style-transition-timing` — timing function 5종 (`7458c6e`)
- ✓ `m2-color-state-disabled-pointerevents` — disabled button pointer 차단 (`a6a7e1b`)
- ✓ `m2-style-transition-cubic-bezier` — cubic-bezier 자유 입력 (`bf39b08` + Codex test `bf9c5d1`)
- ✓ `m2-style-image-filter-extra` — hue-rotate/saturate/invert/drop-shadow (`e5f5d33` + Codex test `ccb41d8`)
- ✓ `m2-style-transition-step` — step-start / step-end timing keyword (`1965453` + Codex test `3d7c78c`)
- `m2-style-transition-steps-custom` — steps(N, position) 자유 단계 수 (transition-step 후속)
- `m2-style-transition-linear-easing` — linear() spring 대체 곡선 (transition-step 후속)
- ✓ `m2-style-color-state-aria` — aria-disabled 명시 (`2244398`)
- ✓ `m2-style-transform` — translate/rotate/scale 노드별 변환 (`eb22afd` + Codex fix `fc0cfda`)
- ✓ `m2-style-transform-origin` — 9-point preset 기준점 (`52ed785` + Codex test `14e9b68`)
- ✓ `m2-style-transform-3d` — rotateX/Y + perspective (`476ad75` + Codex test `e722688`)
- ✓ `m2-style-skew` — skewX/Y ±45° (`c593666` + Codex test `6dd5af3`)
- ✓ `m2-style-image-filter-drop-shadow-multi` — multi drop-shadow stack (`12f41f8` + Codex test `9801e67`)
- `m2-style-transition-spring` — spring/steps timing 함수 (cubic-bezier 후속)

## 코드 변경 정책

- M1/M2/M4 mandate 범위 안의 코드 변경은 자율 진행 OK.
- 신규 토픽은 round 1 docs 합의 → round 2~ 코드 commit 패턴 (D15).
- 작은 UI copy / 한글화 / lint config 등도 round 1 docs 짧게라도 (3~5줄) 작성. m2-edit-eval / m2-i18n-korean에서 합의된 보정.

### 2026-05-08 가속 모드 (사용자 지시)

> 사용자: "ㄱㄱ 작업속도 좀더 올려라" / "내 허가받는 과정은 왠만하면 건너뛰고 둘이 합의하에 쭉쭉 진행해"

가속 정책 (양측 모두 적용):

1. **lean round 1 docs**: 50줄 이내 핵심 범위만 작성. 긴 prose / 중복 표 제거.
2. **round 3 ack 흡수**: Codex round 2가 깔끔한 동의 + minor notes면 별도 round 3 ack docs 생략 가능. `feat:` commit message에 "Codex round 2 흡수: ..." 형태로 acceptance 명시.
3. **사용자 허가 단계 생략**: ABSORB / 다음 토픽 선택 / 후속 후보 우선순위 등 routine 결정은 Claude/Codex 자체 합의 후 진행. 사용자 직접 명령(`ㄱㄱ`, `ALERT`, 토픽 지정)이 있으면 우선.
4. **병렬 토픽 진입**: 한 토픽 round 4 검토 대기 중 다음 토픽 round 1을 발행해도 OK. 양쪽 모두 lock-step 직렬화 불필요.
5. **fix commit 직접**: Codex의 round 4 검토 중 작은 보정(슬라이더 보강 / 테스트 추가 등)은 별도 round 없이 `fix: <topic> — <설명>` commit으로 직접 진행 가능. mandate 범위 안.

가속 모드 안전장치:
- §11.6 정지 조건은 그대로 유지 (라운드 6 / 동일 미해결 2회 / page.tsx 5회 / ff-only / mandate 외).
- ABSORB 시점은 자체 판단 (사용자 지시로 일시 건너뛰기 가능). 5회 도달 시 정지 조건 적용.

### 2026-05-09 가속 §6 병렬 흐름 (사용자 지시)

> 사용자: "그냥 클로드가 큰 덩어리 하나씩 구축하고, 그거에 대한 검증 및 수정을 코덱스가 맡아서 하는 게 어때... 한쪽이 일하고 한쪽이 대기하고가 아니라 동시에 뭔가를 하도록"

기존 round 1 → r2 → r4 → r5 직렬 사이클은 watcher 알림 사이마다 한쪽이 idle. 두 사람이 동시에 흐르도록 정책 강화.

**Claude 측**:
1. **큰 덩어리 round 4 직접**: 사용자 mandate 안 명백한 후속(이전 토픽의 자연스러운 다음 단계)은 round 1 docs 생략하고 `feat:` commit으로 직접 구현 가능. 합의가 필요한 미묘한 결정만 round 1을 짧게(15줄 이내) 발행.
2. **commit 직후 즉시 다음 진입**: round 4 commit 마치면 _즉시_ 다음 큰 덩어리 작업 시작. 직전 토픽의 Codex r5 fix는 watcher가 알리면 그때 처리. 대기 X.
3. **여러 토픽 동시 진행 OK**: 가속 §4 병렬 토픽의 강화. 토픽 A round 4 commit → 토픽 B round 4 commit → 그 사이에 Codex가 A에 r5 fix 보내면 watcher 알림 받아 흡수.

**Codex 측**:
1. **검증/수정 자유**: 직전 Claude commit을 받으면 직접 `fix:` 또는 `test:` 또는 `refactor:` commit으로 보강. round 5 docs 없이 commit만으로 OK.
2. **Claude의 다음 commit 와도 정합 유지**: 새 commit이 직전 토픽 검증 중 도착해도 동시 처리 — 한 토픽 끝낸 후 다음 토픽으로.
3. **검증 외 작업 가능**: Claude가 작업 중인 영역과 _다른 영역_(test 인프라 / lint config / 작은 한글화 등)을 자체 진행 가능. mandate 안.

**ABSORB 시점**:
- 한 토픽이 r4 + r5 모두 받은 시점 또는 r4 + Codex가 r5 추가 조치 없음 명시한 시점.
- 여러 토픽이 동시에 close 상태면 함께 한 ABSORB commit으로 묶어도 OK.

**안전장치는 그대로**: 정지 조건(라운드 6 / page.tsx 5회 / mandate 외 등) 변경 없음. round 1을 생략한 토픽도 page.tsx 카운터는 동일 적용.

이 정책은 dworks 자율 모드 _기본_으로 즉시 적용. 다음 commit부터 양쪽 모두 §6 흐름.

## 정지 조건 (`COLLABORATION.md` §11.6)

1. 한 토픽에서 라운드 6 도달 (`>= 6`)
2. 동일 미해결 항목 2 라운드 연속 등장
3. 가장 최근 `[ABSORB]` 커밋 이후 1시간 내 동일 파일 5회 이상 수정 — lockfile 및 빌드 산출물 제외. 3~4회는 정지하지 않고 검토 신호로만 본다.
4. `git pull --ff-only` 실패
5. mandate 범위를 벗어나는 코드 변경 필요. 단 토픽 round 1~2 단계에서 코드 변경 발생 시도 자체는 정지 (범위 합의 미완).

정지 시 본 파일을 삭제하고 `docs/discussions/ALERT-<date>-<topic>-round-<N>.md`를 작성한다.

## 메인 문서 흡수

메인 문서(`DECISIONS.md`, `COLLABORATION.md`, 본 파일) 흡수는 사용자 OK 신호가 필수다. 단, 본 파일은 자율 모드 활성/비활성 신호 파일이므로 사용자 직접 재가동 지시가 있으면 복구할 수 있다.
