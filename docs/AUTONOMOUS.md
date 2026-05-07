# 자율 협업 모드 활성

**활성화**: 2026-05-07 09:57 KST by 사용자 승인
**Claude 측 가동**: ON (post-commit hook + `.git/feed.log` watcher)
**Codex 측 가동**: ON (Codex heartbeat `dworks-claude-commit-watcher`)
**모드**: 이벤트 기반 (post-commit hook + feed log + heartbeat)

상태/카운터는 보관하지 않는다. 안전장치는 git에서 즉석 산출한다 (`COLLABORATION.md` §11.6).

## 작동 요지

- `.git/hooks/post-commit`이 모든 커밋을 `.git/feed.log`에 hash 한 줄씩 누적한다.
- 각 작업자는 새 hash를 감지한 뒤 커밋 메시지 footer의 `[Claude]` / `[Codex]` 마커로 작성자를 식별한다.
- 자기 마커 커밋은 echo로 보고 무시한다.
- 상대방 마커 커밋은 `docs/COLLABORATION.md` 규칙에 따라 검토하고 응답한다.
- 마커 없는 사용자 직접 커밋은 자율 모드에서 임의 처리하지 않고 사용자 명시 지시를 우선한다.

## 정지 조건 (`COLLABORATION.md` §11.6)

1. 한 토픽에서 라운드 6 도달 (`>= 6`)
2. 동일 미해결 항목 2 라운드 연속 등장
3. 가장 최근 `[ABSORB]` 커밋 이후 또는 최근 1시간 내 동일 파일 3회 이상 수정
4. `git pull --ff-only` 실패
5. 자율 라운드 중 코드 변경 필요 또는 코드 변경 발생

정지 시 본 파일을 삭제하고 `docs/discussions/ALERT-<date>.md`를 작성한다.

## 메인 문서 흡수

자율 모드는 의논 라운드까지 자동 진행할 수 있지만, 메인 문서(`PLAN.md`, `DECISIONS.md`, `COLLABORATION.md`, 본 파일) 흡수는 사용자 OK 신호가 필수다 (`COLLABORATION.md` §5, §7).

## 사용자 사전 승인 (2026-05-07 09:58 KST)

사용자가 자율 진행 mandate 부여 — "왠만하믄 내 승인 기다리지 마라". 다음 범위는 사용자 OK 없이 자율 진행 가능:

- **M0** 프로젝트 부트스트랩 (monorepo 골격, 빈 apps/packages, references/seeds 이전, Playwright 설치, `pnpm typecheck` 검증)
- **M0.5** Tree Foundation (1주 범위 동결, PLAN.md §4 그대로)
- 위 작업 중 발생하는 코드 변경에 대해 §11.6 안전장치 #5(코드 변경 정지) 일시 보류

여전히 사용자 OK 필요한 행위:

- 메인 문서(PLAN/DECISIONS/COLLABORATION/AUTONOMOUS) 흡수
- **M1 이후 새 마일스톤 진입** (P0 eval, P0.5 편집, P1 고도화, M4 PoC, M5+ 익스포트)
- 외부 리소스 사용 (외부 API 호출, 외부 서비스 등록 등 — git push는 OK)
- 안전장치 #1~#4 발동 시 (라운드 6, 미해결 2회 연속, 1h 동일 파일 3회, ff-only 실패)

본 mandate는 사용자 명시 취소(`rm AUTONOMOUS.md` 또는 새 지시)까지 유효.
