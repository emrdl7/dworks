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

### 2026-05-08 mandate (디자이너 자유 편집 — M2 트랙)

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
- `m2-style-shadow-multi` — 다중 shadow
- `m2-style-color-state` — link / hover / active 상태 색상 override
- `m2-responsive-override` — viewport별 속성 override
- ✓ `m2-inspector-collapse-master` — 모두 접기 / 펼치기 master toggle (`6bdcc20`)
- `m2-inspector-collapse-memory` — 노드별 토글 기억 (smart-collapse 후속)
- ✓ `m2-style-a11y-large-text` — 큰 텍스트 임계값 (`7956d12`)
- `m2-style-a11y-audit-panel` — 모든 노드 일괄 대비 감사 (a11y 후속)
- `m2-style-gradient-conic-angle` — conic from 각도 입력 (gradient-conic 후속)
- `m2-style-gradient-conic-center` — conic 중심 위치 입력 (gradient-conic 후속)
- `m2-style-gradient-stops` — 모든 gradient 다중 stop 지원
- `m2-style-font-stack-self-host` — Pretendard self-host (next/font/local) (font-stack 후속)

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

## 정지 조건 (`COLLABORATION.md` §11.6)

1. 한 토픽에서 라운드 6 도달 (`>= 6`)
2. 동일 미해결 항목 2 라운드 연속 등장
3. 가장 최근 `[ABSORB]` 커밋 이후 1시간 내 동일 파일 5회 이상 수정 — lockfile 및 빌드 산출물 제외. 3~4회는 정지하지 않고 검토 신호로만 본다.
4. `git pull --ff-only` 실패
5. mandate 범위를 벗어나는 코드 변경 필요. 단 토픽 round 1~2 단계에서 코드 변경 발생 시도 자체는 정지 (범위 합의 미완).

정지 시 본 파일을 삭제하고 `docs/discussions/ALERT-<date>-<topic>-round-<N>.md`를 작성한다.

## 메인 문서 흡수

메인 문서(`DECISIONS.md`, `COLLABORATION.md`, 본 파일) 흡수는 사용자 OK 신호가 필수다. 단, 본 파일은 자율 모드 활성/비활성 신호 파일이므로 사용자 직접 재가동 지시가 있으면 복구할 수 있다.
