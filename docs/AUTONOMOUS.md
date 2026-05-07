# 자율 협업 모드 활성

**활성화**: 2026-05-07 09:35 by 사용자
**Claude 측 가동**: ON
**Codex 측 가동**: 미정 (Codex가 본 파일 + COLLABORATION.md §11.4를 보고 자체 결정)
**모드**: 이벤트 기반 (post-commit hook + tail -F + Monitor)

상태/카운터는 보관하지 않는다 — 안전장치는 git에서 즉석 산출 (`COLLABORATION.md` §11.6).

## 작동 요지

- `.git/hooks/post-commit`이 모든 커밋을 `.git/feed.log`에 hash 한 줄씩 누적.
- 각 작업자가 `tail -F .git/feed.log`를 background로 watch.
- 새 hash 도착 → `git log <hash>` 으로 작성자 마커(`[Claude]` / `[Codex]`) 식별.
- 자기 마커는 echo로 무시, 상대방 마커면 응답 라운드 진행.
- 마커 없는 사용자 직접 커밋은 자율 모드에서 무시 (사용자 명시 지시 우선).

## 정지 조건 (`COLLABORATION.md` §11.6)

1. 한 토픽 라운드 6 초과
2. 동일 미해결 2 라운드 연속
3. 1시간 내 동일 파일 3회 이상 수정
4. `git pull --ff-only` 실패
5. 코드 변경 발생 라운드

정지 시 본 파일 삭제 + `docs/discussions/ALERT-<date>.md` 작성.

## 비활성화 방법

```bash
rm ~/dworks/docs/AUTONOMOUS.md
```

또는 자율 모드가 안전장치 트리거로 자동 종료.

## 메인 문서 흡수와의 관계

자율 모드는 의논 라운드까지 자동 진행하지만, 메인 문서(`PLAN.md`, `DECISIONS.md`, `COLLABORATION.md`, 본 파일) 흡수는 **사용자 OK 신호가 필수** (`COLLABORATION.md` §7).
