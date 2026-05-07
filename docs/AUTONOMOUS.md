# 자율 협업 모드 활성

**활성화**: 2026-05-07 10:37 KST by 사용자 승인
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

- **M0** 프로젝트 부트스트랩 — 완료 (`507d47d` ~ `d263eef`)
- **M0.5** Tree Foundation — 완료 (`87aab64` ~ `66f2473`)
- **M1** P0 디자인 품질 eval — 진행 중
  - **M1.1 부트스트랩** — 완료 (`3e29537` ~ `cd2d3cd`, 흡수 `6d16c44`)
  - **M1.2 1단계 live baseline** — 완료 (`m1-live-execution` 토픽 라운드 1~5, `997cec0`~`f03df7c`, 흡수 사용자 OK 2026-05-07)
- **사용자 2026-05-07 "병행해" mandate** — 다음 4 토픽 병행 진행 (자율 모드 범위 확장):
  - **(a) `m1-live-7axis`** — M1.2 2단계 7축 확장 (12 brief × 7 axis = 84 calls)
  - **(b) `m1-live-reproducibility`** — M1.2 3단계 repeat=3 재현성 (12 brief × 7 axis × 3 = 252 calls, D8 variance threshold 검증)
  - **(c) `m2-bootstrap`** — M2 (P0.5) 편집 기능 + 측정. placeholder → LLM 생성 트리.
  - **(d) `m4-bootstrap`** — M4 (P2) HTML→트리 흡수 PoC. M1.2 4축 측정 완료 트리거 충족.
- live 실행은 API key가 아니라 로컬 인증 CLI(`claude`, `codex`, `gemini`) 가용성에 의존한다. 현재 로컬에서 Claude Code CLI(절대 경로), `codex`, `gemini` 모두 감지됐다.

M1/M2/M4 4 토픽 범위 안의 코드 변경은 사용자 사전 승인 범위로 본다 ("병행해" mandate). 단 M2/M4는 새 마일스톤 단위라 round 1~2에서 범위 합의 후 실 코드 진행 (사용자 사전 승인은 토픽 시작 자체이지, 범위 미정 상태의 자유 코드 변경은 아니다).

**(II) 확장 sync** (m2/m4-bootstrap 라운드 4 합의 + 사용자 OK 2026-05-07): D15 / §11.6 #5 / §11.9가 docs-only 원칙 + mandate 예외로 갱신됨. 본 mandate의 코드 진행은 docs round 1~2 합의 → round 3+ atomic commit. 후속 코드 토픽 (예: `m2-tree-editor`, `m4-tree-core`)은 본 mandate 범위 안에서 자연스럽게 분리 가능.

## 정지 조건 (`COLLABORATION.md` §11.6)

1. 한 토픽에서 라운드 6 도달 (`>= 6`)
2. 동일 미해결 항목 2 라운드 연속 등장
3. 가장 최근 `[ABSORB]` 커밋 이후 1시간 내 동일 파일 5회 이상 수정 — lockfile 및 빌드 산출물 제외. 3~4회는 정지하지 않고 검토 신호로만 본다
4. `git pull --ff-only` 실패
5. M1 / M2 / M4 4 토픽 mandate 범위를 벗어나는 코드 변경 필요. 단 토픽 round 1~2 단계에서 코드 변경 발생 시도 자체는 정지 (범위 합의 미완)

정지 시 본 파일을 삭제하고 `docs/discussions/ALERT-<date>.md`를 작성한다.

## 메인 문서 흡수

메인 문서(`PLAN.md`, `DECISIONS.md`, `COLLABORATION.md`, 본 파일) 흡수는 사용자 OK 신호가 필수다. 단, 본 파일은 자율 모드 활성/비활성 신호 파일이므로 사용자 직접 재가동 지시가 있으면 복구할 수 있다.
