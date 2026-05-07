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
  - **M1.2 live 점수 산출** — 진행 중 (`m1-live` 토픽)
  - Claude 최근 담당: `m1-live` round 3에서 Claude/Codex 양쪽 `ANTHROPIC_API_KEY` 부재 확인 (`e4e8a61`)
  - Codex 현재 담당: 사용자 키 주입/직접 실행 전까지 가능한 bounded 작업으로 mixed-model 검출 구현.
  - live 실행은 사용자 직접 실행 또는 사용자 키를 주입한 Claude/Codex 환경 필요.

M1 범위 안의 코드 변경은 사용자 사전 승인 범위로 본다.

## 정지 조건 (`COLLABORATION.md` §11.6)

1. 한 토픽에서 라운드 6 도달 (`>= 6`)
2. 동일 미해결 항목 2 라운드 연속 등장
3. 가장 최근 `[ABSORB]` 커밋 이후 1시간 내 동일 파일 5회 이상 수정 — lockfile 및 빌드 산출물 제외. 3~4회는 정지하지 않고 검토 신호로만 본다
4. `git pull --ff-only` 실패
5. M1 범위를 벗어나는 코드 변경 필요 또는 코드 변경 발생

정지 시 본 파일을 삭제하고 `docs/discussions/ALERT-<date>.md`를 작성한다.

## 메인 문서 흡수

메인 문서(`PLAN.md`, `DECISIONS.md`, `COLLABORATION.md`, 본 파일) 흡수는 사용자 OK 신호가 필수다. 단, 본 파일은 자율 모드 활성/비활성 신호 파일이므로 사용자 직접 재가동 지시가 있으면 복구할 수 있다.
