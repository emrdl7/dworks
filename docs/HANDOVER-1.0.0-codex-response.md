# 핸드오버 — 1.0.0 + Codex round 2 응답 (2026-05-09 밤)

> 다음 세션이 _Figma/Stitch 수준 UI 개선_ mandate를 즉시 이어가도록. 직전 핸드오버 `HANDOVER-0.1.0.md` 후속.

---

## 즉시 읽어야 할 파일

1. **본 파일** — 1.0.0 도달 + Codex 응답 + 다음 mandate
2. `docs/discussions/2026-05-09-1-0-verification-round-2-codex.md` — Codex 검증 보고서 (P0/P1 지적)
3. `docs/HANDOVER-0.1.0.md` — 0.1.0 마감 시점 흐름
4. `docs/AUTONOMOUS.md` — mandate / cleanup 학습

---

## 사용자 신호 (최근)

1. "1.0 될때까지 대기하지 말고 계속 쭉쭉 진행해"
2. "코덱스가 커밋한거 확인하고 개선해... 그리고 ui 피그마나 클로드디자인 스티치 수준으로 올라올때까지 계속 개선해"

→ 자율 모드로 1.0.0까지 마감 + Codex 검증 응답. **Figma/Stitch 수준 UI 개선이 다음 핵심 mandate.**

---

## 도달한 1.0.0 (제한된 의미)

자율 마감 사이클 commits:
- `21fe923` 0.1.0 — 모든 워크스페이스 0.0.1 → 0.1.0
- `316f286` 0.2.0 — production build 통과 확인 (web)
- `1d14257` 0.3.0 — inspector 제거 영역 dead code (-357 line)
- `0f6dbc9` 0.4.0 — dead 라벨/import (-50 line)
- `aa8ae01` 0.5.0 — dead handler
- `22545ba` 0.6.0 — NodeInspector dead props, web ESLint warning 0
- `c79bdad` 1.0.0 — apps/web만 1.0.0 (Codex 지적)
- `d1470b9` — **모든 워크스페이스 1.0.0 정합** (Codex P0 #2)
- `aa20587` — 좁은 화면 좌측/우측 패널 hide (Codex P1 1차)

**검증:**
- ✓ `pnpm --filter @dworks/web typecheck` / build / ESLint warning 0
- ✓ `pnpm typecheck` (17/17) / `pnpm test` (13/13)
- ✗ `pnpm lint` (root) — Codex P0 #1 미해결

---

## Codex round 2 검증 (2026-05-09-1-0-verification-round-2-codex.md)

검증자: Codex / 대상: `c79bdad` / 결론: "1.0.0 stable foundation 단정 어렵다"

### P0 (release gate)

| # | 지적 | 상태 |
|---|------|------|
| 1 | 루트 `pnpm lint` 실패 — `eslint.config` 부재. apps/web에만 flat config 있음 | **미해결** — 큰 작업 |
| 2 | 1.0.0 bump가 web에만 적용. 다른 패키지 0.1.0 | ✓ 해결 (`d1470b9`) |
| 3 | preflight가 webpack runtime/chunk layout mismatch(예: `Cannot find module './211.js'`) 감지 못 함 | **미해결** |

### P1 (design tool 구조)

768/440에서 좌측 260 + 우측 360 고정 패널이 캔버스를 가림.

| 처리 | 상태 |
|---|---|
| md 미만 좌측 hide / xl 미만 우측 hide (`aa20587`) | 1차 fix — 좁은 화면 캔버스만 보임 |
| drawer / 탭 전환 / bottom sheet 같은 진짜 responsive UX | **미해결** — 큰 사이클 |

---

## 다음 핵심 mandate: Figma/Stitch 수준 UI

사용자: "ui 피그마나 클로드디자인 스티치 수준으로 올라올때까지 계속 개선해"

### Figma/Stitch 분석 (참고)

| 영역 | 현재 dworks | Figma/Stitch 수준 |
|---|---|---|
| 헤더 | 로고 + 예제 select + viewport + zoom + undo/redo + 대비 chip | 메뉴바 + 파일 정보 + 협업 + share |
| 좌측 패널 | brief 입력 + history chip + 4 버튼 | 레이어 트리 + 페이지 + assets / drawer 형태 |
| 캔버스 | 단일 viewport + zoom | 무한 캔버스 + 다중 페이지 + ruler + grid |
| 우측 inspector | 9 disclosure | tab 분리(Design / Inspect / Prototype) + collapsible |
| 좁은 화면 | hide만 | drawer / bottom sheet / 탭 전환 |

### 권장 우선순위 (중간 사이클들로 분할)

1. **inspector 탭 분리** — 9 disclosure를 _범주_(색/타이포 / 레이아웃 / 인터랙션 등)로 묶어 탭 전환
2. **좌측 drawer** — 768~1024 사이에서 toggle button으로 좌측 표시/숨김
3. **레이어 트리 노출** — 현재는 트리 구조가 inspector 안에만 있음. 좌측 패널에 _Layers_ 탭 추가 (Figma 표준)
4. **헤더 minimal** — 메뉴바로 통합 (File / Edit / View / Help 같은)
5. **canvas grid/ruler** — 디자인 정밀도 높이는 가이드

각 항목 _별도 사이클_ — context 부족 시 한 번에 시도하면 깨짐.

---

## 미해결 Codex P0 작업 (별도 사이클)

### P0 #1: ESLint flat config 셋업

각 워크스페이스 패키지에 `eslint.config.mjs` 또는 루트 공유 config:
- `@dworks/api`, `packages/components`, `packages/exporters`, `packages/llm-prompts`, `packages/tokens`, `packages/tree`, `packages/tree-editor`, `packages/tree-renderer`, `packages/validators` 등

### P0 #3: preflight 강화

`apps/web/scripts/preflight.mjs` 현재는 manifest 파일 존재만 검사. 강화:
- `BUILD_ID`/`static/<buildId>` 매칭
- `server/webpack-runtime.js` chunk reference 무결성

---

## 컨벤션 / 학습

### 자율 모드 cleanup 학습 (재확인)

1. 사용자 직접 요구한 mandate 영역인가
2. 디자이너 _직접 사용하는 툴_ 가치인가
3. 메트릭/통계/시각화 등 메타 정보는 사용자 요구 없으면 추가 X
4. UI 요소 추가 전 _제거 가능_한지 먼저 검토
5. _일 벌리기보단 정리/마감_ 우선

### 환경 변수

- `DWORKS_DEBUG_SCHEMA=1` / `DWORKS_LLM_TIMEOUT_MS` / `DWORKS_GENERATE_RETRIES` / `DWORKS_LLM_PROVIDERS`

### dev 시작 / stale 복구

```sh
pnpm --filter @dworks/web dev          # preflight 자동 실행
pnpm --filter @dworks/web dev:fresh    # .next 강제 정리 후 dev
pnpm --filter @dworks/web clean        # .next 정리만
```

stale `.next`로 500 발생 시(Codex 지적):
```sh
for pid in $(lsof -tiTCP:3000 -sTCP:LISTEN); do kill "$pid" || true; done
rm -rf apps/web/.next
pnpm --filter @dworks/web dev
```

---

## 다음 세션 시작 체크리스트

1. `git log --oneline -10` — `aa20587`까지 확인
2. `git status` — worktree clean 확인
3. `cat docs/HANDOVER-1.0.0-codex-response.md` (본 파일)
4. `cat docs/discussions/2026-05-09-1-0-verification-round-2-codex.md` — Codex 보고서 원본
5. **Figma/Stitch UI 개선** 우선순위 1번부터 진행 (inspector 탭 분리)
6. 한 사이클당 1 토픽 + ABSORB. context 여유 있을 때만 큰 토픽 시도
7. Codex P0 #1, #3 별도 사이클(release 안정성에 가까운 시점)

---

## 핵심 코드 위치

- `apps/web/src/app/page.tsx` — 헤더(2330+) / 좌측 aside(2354) / 캔버스(3060+) / 우측 aside(3110) / NodeInspector(5274+) / context menu(3380+)
- `apps/web/src/app/globals.css` — html/body overflow hidden
- `apps/web/scripts/preflight.mjs` — .next stale 감지(현재 manifest 존재만 검사 — 강화 필요)
- `packages/tree-editor/src/operations.ts` — changeLeafNodeType 등
- `packages/tree/src/schema.ts` — TreeNode union (text/button/image/section/hero/card/list/form)

[Claude]
