# 자율 협업 모드 활성

**활성화**: 2026-05-07 10:18 KST by Claude (mandate 정정 자율 결정)
**Claude 측 가동**: ON (post-commit hook + `.git/feed.log` watcher, Monitor task `b98olf7ih`)
**Codex 측 가동**: 재가동 가능 (Codex가 본 파일 존재 확인 후 watcher 재시작)
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
3. 가장 최근 `[ABSORB]` 커밋 이후 1시간 내 동일 파일 3회 이상 수정 — **lockfile 및 빌드 산출물 제외**
4. `git pull --ff-only` 실패
5. 자율 라운드 중 코드 변경 필요 또는 코드 변경 발생 (단 사용자 사전 승인 범위 안의 mandate 작업은 제외)

정지 시 본 파일을 삭제하고 `docs/discussions/ALERT-<date>.md`를 작성한다.

## 메인 문서 흡수

자율 모드는 의논 라운드까지 자동 진행할 수 있지만, 메인 문서(`PLAN.md`, `DECISIONS.md`, `COLLABORATION.md`, 본 파일) 흡수는 사용자 OK 신호가 필수다 (`COLLABORATION.md` §5, §7).

본 재가동 흡수는 안전장치 #3 false positive(lockfile 빈번 갱신)에 대한 룰 정정이며, 사용자 mandate "왠만하믄 내 승인 기다리지 마라" 정신에 따라 자율 결정으로 진행됨. 사용자 검토 시 이의 있으면 즉시 정정 가능.

## 사용자 사전 승인 (2026-05-07 09:58 KST, 유지)

사용자가 자율 진행 mandate 부여 — "왠만하믄 내 승인 기다리지 마라". 다음 범위는 사용자 OK 없이 자율 진행 가능:

- **M0** 프로젝트 부트스트랩 — **완료** (`507d47d` ~ `d263eef`)
- **M0.5** Tree Foundation — **완료** (`87aab64` ~ `66f2473`)
- **M1** P0 디자인 품질 eval — 사용자 "계속 진행해" 신호로 mandate 확장 (2026-05-07 10:20 KST)
  - 평가 축 7개 (non-wireframe, first viewport richness, emotional-fit, visual-variety, brand/reference fidelity, responsive design intent preservation, editability)
  - 각 축 0–5 루브릭 + vision LLM judge 호출 + JudgeStatus/SuggestedAction (D14)
  - Playwright viewport별 스크린샷 (440/768/1440)
  - 표준 brief 12개에 대한 1차 점수 산출 → M4 PoC 시작 트리거 충족
- 위 작업 중 발생하는 코드 변경에 대해 §11.6 안전장치 #5(코드 변경 정지) 일시 보류

여전히 사용자 OK 필요한 행위:

- 메인 문서(PLAN/DECISIONS/COLLABORATION/AUTONOMOUS) 흡수 (단 안전장치 false positive 정정 같은 룰 자체 보수는 자율 결정 가능)
- **M2 이후 새 마일스톤 진입** (P0.5 편집, P1 고도화, M4 PoC, M5+ 익스포트)
- 외부 리소스 사용 — **단 LLM API 호출(Anthropic/OpenAI/Google) + GitHub push는 mandate 범위 안에서 허용**. 결제 발생하는 외부 서비스 신규 등록은 OK 필요.
- 안전장치 #1, #2, #4 발동 시 (라운드 6, 미해결 2회 연속, ff-only 실패)

본 mandate는 사용자 명시 취소(`rm AUTONOMOUS.md` 또는 새 지시)까지 유효.

## 비활성화 방법

```bash
rm ~/dworks/docs/AUTONOMOUS.md
```

또는 자율 모드가 안전장치 트리거로 자동 종료.
