# Design Works (dworks) — 협업 컨벤션

> **상태**: 1차 안 (2026-05-07). Claude 작성. 사용자 + Codex 합의 후 결정.

본 문서는 **사용자 + Claude + Codex** 3자가 같은 로컬에서 dworks를 진행하기 위한 운영 규칙이다. krds-studio v4 의논의 4 라운드 경험을 그대로 컨벤션으로 박는다.

---

## 1. 작업 환경

- **작업 디렉토리**: `~/dworks` (단일 git repo)
- **작업자**: Claude (Anthropic), Codex (OpenAI), 사용자
- **git user**: 단일 git author로 커밋되므로, 작성자 구분은 **커밋 메시지로** 한다.
- **원격 저장소**: 미정 (사용자 결정 대기). 같은 로컬이라 협업에 필수는 아니지만 백업 관점에서 권장.

## 2. 커밋 트리거 협업 모델

핵심 규칙 한 줄: **상대방 커밋이 다음 행동의 트리거다.**

```
사용자 지시
  ↓
Claude 또는 Codex가 작업 → 커밋
  ↓
다른 쪽이 git fetch/pull → 변경 파악 → 응답 작업 → 커밋
  ↓
사용자 또는 양측이 합의 도달 판단
  ↓
합의 굳기 → 메인 문서 흡수 (별도 커밋)
```

- **한쪽이 작업 중이면 다른 쪽은 대기**. 동시 작업 금지 (충돌 위험).
- **사용자가 명시적으로 다른 쪽에 넘기기 전까지** 한 작업자가 라운드를 끝낸다.
- 한 라운드는 한 커밋으로 끝나는 게 기본이지만, 부트스트랩처럼 큰 작업은 다중 커밋도 허용.

## 3. 커밋 메시지 컨벤션

- **언어**: 한국어, 명령형 (krds-studio 컨벤션 유지).
- **작성자 표기**: footer에 `[Claude]` 또는 `[Codex]` 명시. 사용자 직접 커밋은 표기 없음.
- **타입 prefix**: `docs:`, `feat:`, `fix:`, `refactor:`, `chore:` (기존 컨벤션 유지).

예시:

```
docs: dworks 진행 플랜 1차 안 작성

PLAN.md, docs/DECISIONS.md, docs/COLLABORATION.md 추가.
krds-studio 라운드 1~4 합의를 dworks 컨텍스트로 흡수.

[Claude]
```

```
docs: dworks PLAN.md 라운드 5 응답

§4 마일스톤의 M2 추정 기간 보정. M5 jabworks 변환기의 입력
포맷 정의 누락 지적. docs/discussions/2026-05-07-plan-review-codex.md
신규.

[Codex]
```

## 4. 의논 라운드 누적 — `docs/discussions/`

**의논 중에는 메인 문서(`PLAN.md`, `DECISIONS.md`, 코드)를 손대지 않는다.**

대신 라운드별 의논 노트를 누적한다.

```
docs/discussions/
├── 2026-05-07-plan-round-1-claude.md
├── 2026-05-07-plan-round-2-codex.md
├── 2026-05-07-plan-round-3-claude.md
└── ...
```

**파일명 규칙**: `YYYY-MM-DD-<topic>-round-N-<author>.md`

라운드 안에서:
- 합의 / 이견 / 미해결 항목 명시
- 미해결 0건 도달 시 다음 커밋에서 메인 문서 흡수

## 5. 메인 문서 흡수 트리거

다음 조건이 모두 만족되면 의논 노트를 메인 문서로 흡수한다.

- 양측이 **미해결 항목 0건**임을 한 라운드에서 명시
- 사용자가 합의 OK 신호

흡수 커밋:
- 메인 문서(`PLAN.md`, `DECISIONS.md`) 갱신
- 의논 노트는 `docs/discussions/`에 그대로 보존 (history)
- 커밋 메시지에 어느 라운드들이 흡수됐는지 명시

## 6. 코드 변경 vs 문서 변경 분리

- **의논 중에는 문서만 변경**. 코드 수정 금지.
- **합의 후에는 코드 변경 가능**. 단 한 마일스톤에 해당하는 단위로 atomic 커밋.
- **신규 결정이 필요한 코드 변경**은 의논 라운드를 먼저 연다.

## 7. 사용자 개입 지점

사용자는 다음 시점에 명시적으로 개입한다.

- 본 컨벤션에 없는 새 결정이 필요할 때
- 양측이 합의에 도달하지 못할 때 (3 라운드 초과 시 자동으로 사용자 호출)
- 메인 문서 흡수 OK 신호
- 메모리 갱신이 필요한 결정 (예: 프로젝트 정체성 변경)

사용자가 어느 작업자에게 라운드를 맡길지 명시하지 않으면, 직전 라운드의 상대방이 자동으로 받는다.

## 8. 충돌 회피

- **동시 작업 금지** (§2 참조).
- **각 작업자는 시작 전 `git pull --ff-only` 필수**. fast-forward 안 되면 사용자에게 보고.
- **메인 문서와 의논 노트는 항상 분리 커밋**. 한 커밋에 섞지 않는다.
- **rebase / force-push 금지**. 합의 흐름이 git history로 보존되어야 한다.

## 9. 라운드 번호 일관성

krds-studio 라운드 1~4의 컨벤션을 그대로 가져온다.

- 전체 의논 흐름의 라운드 번호로 통일
- **홀수 라운드 = Codex가 시작 / 짝수 라운드 = Claude가 시작** (krds-studio 라운드 4 §13.3 정정 적용)
- dworks의 첫 라운드는 라운드 1로 새로 시작 (krds-studio 라운드와 별개 카운트)

dworks 라운드 매핑 예:
- 라운드 1 = Claude (본 PLAN.md 1차 안)
- 라운드 2 = Codex (PLAN.md 검토 응답)
- 라운드 3 = Claude (Codex 응답에 대한 답)
- ...

> **주**: krds-studio에선 §10이 Codex 라운드 1이었지만, dworks는 Claude가 첫 PLAN.md를 쓰며 시작하므로 라운드 1=Claude로 자연스럽게 채택된다. 본 컨벤션은 dworks 내부에서만 일관되면 된다.

## 10. 본 컨벤션의 변경

본 문서도 의논 대상이다. 변경 제안은 다음 라운드 의논 노트에서 명시 → 합의 후 본 문서 갱신.

---

## 부록. 권장 명령

매 라운드 시작 시:

```bash
cd ~/dworks
git pull --ff-only
git log --oneline -10  # 직전 라운드 변경 확인
```

매 라운드 종료 시:

```bash
git add docs/discussions/<file>
git commit -m "..."  # §3 컨벤션
git push origin main  # 원격 있을 시
```

메인 문서 흡수 시:

```bash
git add PLAN.md docs/DECISIONS.md
git commit -m "docs: 라운드 N–M 합의 사항을 메인 문서로 흡수"
```
