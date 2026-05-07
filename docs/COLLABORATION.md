# Dworks — 협업 컨벤션

> **상태**: 결정 (2026-05-07, dworks 라운드 1~5 합의 흡수). 변경은 새 라운드 의논을 거친다.

본 문서는 **사용자 + Claude + Codex** 3자가 같은 로컬에서 dworks를 진행하기 위한 운영 규칙이다.

---

## 1. 작업 환경

- **작업 디렉토리**: `~/dworks` (단일 git repo)
- **원격 저장소**: `https://github.com/emrdl7/dworks` (퍼블릭). **상대 커밋 확인은 로컬 git 기준**으로 한다 — 같은 로컬에서 작업하므로 원격 polling은 불필요.
- **작업자**: Claude (Anthropic), Codex (OpenAI), 사용자
- **git user**: 단일 git author로 커밋되므로, 작성자 구분은 **커밋 메시지 footer 마커**로 한다 (`[Claude]` / `[Codex]`).

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
- **흡수 marker**: 메인 문서(`PLAN.md` / `DECISIONS.md` / `COLLABORATION.md` / `AUTONOMOUS.md`)에 의논 라운드 합의를 일괄 반영하는 커밋의 footer에 `[ABSORB]`를 추가한다. §11.6 #3 안전장치 reset의 기준점이 된다.

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

dworks 내부에서 다음 규칙을 일관 적용한다.

- 한 토픽의 라운드 번호는 1부터 시작.
- **홀수 라운드 = Claude / 짝수 라운드 = Codex**.
- dworks의 첫 라운드(plan)는 Claude가 시작했으므로 라운드 1=Claude.

dworks plan 라운드 매핑 (확정):

| 라운드 | 작성자 | 파일 |
|--------|--------|------|
| 1 | Claude | 별도 노트 없음 — 1차 안 커밋 4건: `74be743`/`ddf1616`/`b449f3d`/`30d4697` |
| 2 | Codex | `docs/discussions/2026-05-07-plan-round-2-codex.md` |
| 3 | Claude | `docs/discussions/2026-05-07-plan-round-3-claude.md` |
| 4 | Codex | `docs/discussions/2026-05-07-plan-round-4-codex.md` |
| 5 | Claude | `docs/discussions/2026-05-07-plan-round-5-claude.md` |

## 10. 본 컨벤션의 변경

본 문서도 의논 대상이다. 변경 제안은 다음 라운드 의논 노트에서 명시 → 합의 후 본 문서 갱신.

---

## 11. 자율 협업 모드 (이벤트 기반)

사용자가 자리를 비워도 Claude/Codex가 상대방 커밋을 즉시 감지하고 응답 라운드를 진행하는 모드.
**폴링이 아니라 git post-commit hook + tail -F + Monitor 도구 기반의 이벤트 알림**이다.

### 11.1 작동 원리

```
[Claude 또는 Codex가 커밋]
   ↓
.git/hooks/post-commit 발화
   ↓
.git/feed.log 끝에 새 커밋 hash 한 줄 추가
   ↓
[양측이 background로 돌리는 tail -F .git/feed.log]
   ↓
새 라인 감지 (밀리초 단위)
   ↓
Monitor 도구가 Claude/Codex 세션을 자동으로 깨움
   ↓
깨어난 측이 git show <hash>로 커밋 정보 fetch
   ↓
자기 작성이면 무시, 상대방 작성이면 응답 라운드 진행
```

폴링 없음. 유휴 시 CPU/네트워크 비용 0. 반응 latency ~수 ms.

### 11.2 세팅 (양측 모두 1회 실행)

#### 1. post-commit hook 설치

```bash
cd ~/dworks
bash scripts/install-hooks.sh
```

확인:

```bash
ls -la .git/hooks/post-commit
# -rwxr-xr-x ... .git/hooks/post-commit
```

같은 로컬에서 작업하면 한 번만 설치하면 양측이 같은 `.git`을 공유하므로 자동 적용.
다른 로컬이거나 fresh clone이라면 각자 한 번씩 실행.

#### 2. feed.log 워밍업 (선택)

```bash
git rev-parse HEAD > ~/dworks/.git/feed.log
```

feed가 비어 있으면 첫 커밋 전까지 tail이 EOF에서 머문다. 직전 HEAD를 미리 박아두면 깔끔.

#### 3. 신호 파일 — `docs/AUTONOMOUS.md`

자율 모드 활성/비활성 토글은 **신호 파일의 존재**로만 결정한다. 카운터는 두지 않고 안전장치는 §11.6 즉석 검사로 산출한다.

```bash
# 활성화 (양식)
cat > ~/dworks/docs/AUTONOMOUS.md <<'EOF'
# 자율 협업 모드 활성

활성화: <YYYY-MM-DD HH:MM> by <user|claude|codex>
모드: 이벤트 기반 (post-commit hook + tail -F + Monitor)

상태/카운터는 보관하지 않는다 — 안전장치는 git에서 즉석 산출 (COLLABORATION.md §11.6).
EOF

# 비활성화
rm ~/dworks/docs/AUTONOMOUS.md
```

각 작업자는 watch 시작 전 `docs/AUTONOMOUS.md` 존재 여부를 확인하고, 없으면 자율 모드 가동을 거부한다.

### 11.3 Claude 측 watch 메커니즘

Claude Code 내장 `Bash(run_in_background)` + `Monitor` 도구 조합.

1. background로 tail 시작:
   ```bash
   tail -F ~/dworks/.git/feed.log
   ```
2. Monitor 도구로 stdout 라인을 받음. 라인 도착 = 새 커밋.
3. 라인의 hash로 `git show <hash>` 호출 → 작성자 식별.
   - commit message footer에 `[Claude]` 있으면 자기 커밋 → 무시.
   - `[Codex]` 있으면 응답 라운드 진행.
   - `[Claude]`/`[Codex]` 둘 다 없으면 사용자 직접 커밋 → 라운드 정의에 따라 행동.
4. 응답 라운드 진행 후 자신의 커밋 → 다시 hook 발화 → Codex가 받음.

### 11.4 Codex 측 watch 메커니즘 (Codex CLI 의존)

Codex CLI가 동등한 파일 watch + 자동 응답 메커니즘을 지원해야 한다. 후보:

- **Codex CLI의 자체 watch 모드**가 있다면 그걸 활용.
- 없다면 일반 Unix 도구로 우회:
  - `tail -F .git/feed.log | while read hash; do codex exec --prompt "$(prompt-template)" --hash "$hash"; done` 같은 wrapper 스크립트.
  - 또는 `fswatch ~/dworks/.git/refs/heads/main` 위에 codex 호출 wrapper.
- Codex가 사용 가능한 파일 watch 도구 / 외부 트리거 메커니즘에 따라 결정.

**Codex가 본 §11을 읽고 자기 측 setup을 결정**하면 된다. Claude 측 동작은 §11.3 그대로 가동.

### 11.5 자기 커밋 무시 (echo 방지)

각 측은 자신이 방금 한 커밋이 hook을 통해 다시 자기 알림으로 돌아오는 것을 무시해야 한다.

판별 방법 (권장):

- 커밋 메시지 footer의 `[Claude]` / `[Codex]` 마커로 작성자 식별.
- 자기 마커면 무시.
- 상대방 마커면 응답.
- 마커 없는 커밋(사용자 직접 커밋)은 사용자가 명시한 행동을 우선.

### 11.6 안전장치 5개 (필수, 카운터 없는 즉석 검사)

자율 모드의 가장 큰 위험은 무한 루프와 충돌이다. 모든 안전장치는 라운드 응답 시작 시 git에서 즉석 산출한다 (상태 파일 없음).

| # | 트리거 | 즉석 검사 명령 | 행동 |
|---|--------|-----------------|------|
| 1 | 한 토픽에서 라운드 6 도달 (`≥ 6`) | `ls docs/discussions/<topic>-round-*-*.md \| wc -l` ≥ 6 | 자율 모드 즉시 정지 + `docs/discussions/ALERT-<date>.md` 작성 |
| 2 | 동일 미해결 항목 2 라운드 연속 등장 | 직전 두 라운드 노트의 미해결 섹션 비교 (에이전트 문맥 판단) | 자율 모드 즉시 정지 + ALERT |
| 3 | 한 작업자가 1시간 안에 같은 파일 5회 이상 수정 (단 가장 최근의 흡수 커밋 이후만 카운트, 자동 생성 파일 제외) | `SINCE=$(git log --grep='\[ABSORB\]' -n1 --pretty=%ct \|\| true); FROM_TS=$(($(date +%s)-3600)); CUTOFF=$((SINCE > FROM_TS ? SINCE : FROM_TS)); git log --since="@$CUTOFF" --name-only --pretty=format: \| grep -vE '^(pnpm-lock\.yaml\|package-lock\.json\|yarn\.lock\|bun\.lockb\|\.next/\|\.turbo/\|dist/\|build/)' \| sort \| uniq -c \| sort -rn`에서 ≥5 발견. **제외 대상**: lockfile(`pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` / `bun.lockb`), 빌드 산출물(`.next/`, `.turbo/`, `dist/`, `build/`) 등 의존성 추가나 빌드마다 자동 갱신되는 파일은 의도된 빈번 수정이므로 카운트 제외. 3~4회는 정지 조건이 아니라 검토 신호로만 본다 | 자율 모드 즉시 정지 + ALERT |
| 4 | `git pull --ff-only` 실패 (non-FF 충돌) | 라운드 시작 시 `git pull --ff-only` 결과 | 자율 모드 즉시 정지 + ALERT. **rebase/merge 자동 시도 금지** |
| 5 | 승인된 mandate 범위를 벗어나는 코드 변경, 또는 round 1~2 합의 전 코드 변경 | 응답 라운드 중 mandate 외 파일 수정 시도 또는 round 3 미만 단계 코드 변경 시도 시 | 자율 모드 자동 정지 + ALERT. **승인된 mandate 범위 안의 코드 변경은 round 1~2 docs 합의 후 atomic commit으로 허용** (m2/m4-bootstrap 라운드 4 합의, II 확장) |

**정지 = `docs/AUTONOMOUS.md` 파일을 삭제**한다. 사용자가 ALERT를 보고 판단 후 신호 파일을 다시 만들어야 자율 모드 재개.

### 11.7 ALERT 파일 형식

```markdown
# 자율 모드 ALERT — <date>

트리거: <안전장치 # 와 사유>
정지 시각: <ISO 시각>
마지막 라운드 hash: <hash>
관련 파일: <list>

## 컨텍스트
<무엇을 의논 중이었는지 1~2문단>

## 사용자 행동 요청
<무엇을 결정해야 하는지>
```

Claude/Codex는 ALERT 작성 후 자율 모드를 종료한다. 사용자가 다음 접속 시 `docs/discussions/ALERT-*.md`를 먼저 본다.

### 11.8 비활성화 / 재개 흐름

- **비활성화**: `rm docs/AUTONOMOUS.md` (수동) 또는 §11.6 안전장치 발동 (자동).
- **재개**: 사용자가 ALERT 검토 → 결정 → `docs/AUTONOMOUS.md` 재생성 → Claude/Codex가 watch 재시작.

### 11.9 코드 변경과 자율 모드의 분리 (II 확장)

자율 모드는 **문서 라운드**(의논, 합의, 메인 문서 흡수)를 기본으로 다룬다. 단 사용자가 특정 milestone/topic의 코드 진행을 명시 승인한 경우에는 해당 mandate 범위 안에서만 코드 라운드를 진행할 수 있다 (m2/m4-bootstrap 라운드 4 합의).

**코드 라운드 진입 조건**:
- 토픽 round 1~2 docs 합의 완료 (범위 / 분배 / 첫 코드 단위 명확)
- worktree clean
- 파일 소유 범위 명시 (어느 패키지/파일을 누가 수정)
- atomic commit (한 의미 단위 = 한 commit)

**메인 문서 흡수**(`PLAN.md` / `DECISIONS.md` / `COLLABORATION.md` / `AUTONOMOUS.md` 변경)는 **여전히 사용자 OK 필수** — 코드 자율 진행과 결정 흡수의 안전 경계는 유지된다.

§11.6 안전장치 #5가 이를 강제한다 — 범위 밖 코드 변경, round 3 미만 단계 코드 변경, 또는 합의 전 코드 변경은 즉시 정지 + ALERT.

---

## 12. 세션 인계 (context resume)

새 Claude/Codex 세션이 시작될 때 진행 중인 토픽 컨텍스트를 자동으로 회복하는 절차. 사용자 트리거: "새 세션에서 이어가자", "이어가자", "resume", "context restore" 같은 발화 또는 단순히 cwd가 `~/dworks`인 채 라운드가 진행 중인 상태로 들어왔을 때.

### 12.1 자동 회복 절차 (필수)

새 세션 진입 즉시 다음을 실행한다 (사용자 명시 지시 없이도 자율 수행):

1. **git history 파악**
   ```bash
   cd ~/dworks
   git pull --ff-only
   git log --oneline -15
   ```
2. **자율 모드 상태**
   ```bash
   test -f docs/AUTONOMOUS.md && cat docs/AUTONOMOUS.md
   ```
3. **최신 라운드 노트 3건**
   ```bash
   ls -t docs/discussions/2026-*-round-*.md | head -3 | xargs -I{} cat {}
   ```
4. **메인 결정 핵심**
   ```bash
   sed -n '/## 4. 마일스톤/,/## 5/p' PLAN.md  # 마일스톤 섹션
   ```
5. **자율 모드 watch 재가동** (AUTONOMOUS.md ON 일 시)
   - Claude: `Bash(run_in_background)` + `Monitor` 도구로 `tail -F .git/feed.log` 재시작 (`COLLABORATION.md` §11.3 패턴).
   - Codex: 자기 측 watch 재시작 (§11.4).
6. **사용자에게 회복 요약 1줄 보고** + 다음 [CODEX]/[Claude] 이벤트 또는 사용자 지시 대기.

### 12.2 회복 후 행동 가이드

- 진행 중인 토픽이 미해결을 가지고 있으면, 그 미해결을 검토 후 다음 라운드 작성.
- 흡수 트리거 도달 상태(미해결 0건)였으면 사용자 OK 신호 대기.
- 안전장치 발동 직후였으면 ALERT 파일 검토 후 사용자 결정 대기.
- 코드 변경 작업 중간이었으면 working tree 상태 확인 (`git status`) 후 미커밋 변경이 있으면 상태 보고.

### 12.3 양측 동일 적용

본 컨벤션은 Claude / Codex 둘 다 새 세션 시작 시 동일 절차를 따른다. 한쪽이 이미 회복했어도 다른 쪽은 자기 회복을 독립적으로 수행 (서로 다른 세션 시점에서 시작 가능).

### 12.4 Monitor 재가동 명령 (Claude)

```typescript
Monitor({
  description: 'dworks Codex 커밋 watch — feed.log 변경 감지',
  persistent: true,
  timeout_ms: 3600000,
  command: `FEED=~/dworks/.git/feed.log
tail -F -n 0 "$FEED" 2>&1 | while read -r line; do
  [ -z "$line" ] && continue
  if echo "$line" | grep -qE '^tail:|ENOENT'; then echo "[ERROR] $line"; continue; fi
  hash="$line"
  body=$(git -C ~/dworks log -1 --format='%B' "$hash" 2>/dev/null) || { echo "[ERROR] git show failed for $hash"; continue; }
  subject=$(git -C ~/dworks log -1 --format='%s' "$hash" 2>/dev/null)
  if echo "$body" | grep -q '\\[Codex\\]'; then echo "[CODEX] $hash $subject"
  elif echo "$body" | grep -q '\\[Claude\\]'; then : # self echo
  else echo "[USER] $hash $subject"; fi
done`,
})
```

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
