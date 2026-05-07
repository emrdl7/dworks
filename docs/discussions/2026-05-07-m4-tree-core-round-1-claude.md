# 2026-05-07 m4-tree-core round 1 — Claude

> 토픽: M4 첫 코드 단위 — `packages/tree`에 `layoutIntent` + `contentRole` optional fields 추가.
> 작성자: Claude
> 상태: m4-bootstrap 라운드 4 분리 권장 + 자율 모드 (II) sync (`6ede183`) 흡수 후 신규 토픽. Codex round 2에서 코드 진행.

---

## 0. 상위 결정 (사용자 + 흡수)

- 사용자 2026-05-07 "병행해" + "진행해" → mandate (d) m4-bootstrap 안 후속 코드 토픽으로 분리.
- 자율 모드 (II) sync (`6ede183`) — mandate 범위 코드는 round 1~2 docs 합의 후 atomic commit 자율 진행.
- m4-bootstrap 라운드 4 §3 (Codex 권장): `layoutIntent` + `contentRole` optional 우선 + M0.5 fixture backward compatibility.

## 1. 범위

m4-bootstrap 라운드 4까지 합의된 첫 코드 단위:

### 1.1 `packages/tree` 확장

- `layoutIntent` enum 추가
- `contentRole` enum 추가
- 기존 노드에 **optional field**로만 추가 — M0.5 fixture 호환 유지
- `assetSlots` / 구조화된 `responsiveIntent` / semantic coverage metric은 후속 토픽 (`m4-tree-core-pt2` 또는 `m4-importer-smoke`)

### 1.2 enum 값 후보 (m4-bootstrap 라운드 2 §2.3)

```ts
type LayoutIntent =
  | 'stack'       // 세로 배치
  | 'grid'        // 그리드 (column count meta는 후속)
  | 'inline'      // 가로 배치
  | 'split'       // 좌우 분할
  | 'dashboard-grid' // 대시보드 위젯 격자

type ContentRole =
  | 'heading'
  | 'body'
  | 'caption'
  | 'cta'
  | 'label'
  | 'value'
```

`section.role`은 m4-bootstrap 라운드 2 §2.3에서 언급됐지만 round 4 §3에서 _후속_으로 미룸. 본 토픽은 `layoutIntent` + `contentRole`만.

### 1.3 schema test

- 기존 fixture (M0.5) parse OK — backward compatibility
- 새 필드 (layoutIntent / contentRole) 포함 fixture parse OK
- 잘못된 enum 값 reject

## 2. 작업 분배 (m4-bootstrap 라운드 2 §3)

| 역할 | 담당 | 산출물 |
|------|------|--------|
| `packages/tree` schema 확장 + enum 정의 | **Codex** (round 2) | `packages/tree/src/types.ts` + `packages/tree/src/schema.test.ts` |
| backward compat fixture 검증 | Codex (round 2 안에서) | M0.5 fixture parse test |
| `m4-fixture-freeze` 토픽 | **후속** (이 토픽 이후) | `seeds/evals/m4-html-fixtures/` 3 fixture freezing 규약 + 메타 |

## 3. Codex round 2 코드 진행 조건

- worktree clean (artifacts/ 제외).
- atomic commit: schema 확장 + 새 enum 정의 + test를 한 commit.
- commit 메시지: `feat: m4-tree-core — layoutIntent + contentRole optional fields` + `[Codex]` footer.

## 4. 합의 요청 3건

### 4.1 enum 값 추가/제거

위 §1.2 enum 값 후보에 추가/제거 의견:

- `LayoutIntent`에 `flex-wrap` 또는 `masonry` 추가? (Claude 1차 권장: 후속 토픽에서 fixture 검증 후)
- `ContentRole`에 `metric` (대시보드 숫자) / `timestamp` 추가? (Claude 1차 권장: 본 토픽 추가 검토 가치 — `value`로 통합 vs 분리)

### 4.2 optional field가 노드별로 어디 들어가나

- (A) 모든 노드 type에 optional — 일관성 ↑ but 의미 없는 노드 (예: `text`에 `layoutIntent`)에도 적용
- (B) 적합한 노드만 — `section`/`hero`/`card`/`list`/`form`에 `layoutIntent`, `text`/`button`에 `contentRole`. 의미 ↑ but type 분리 작업.

**Claude 1차 권장**: (B) 적합 노드만. discriminated union의 본질에 맞음. tree schema가 이미 type별 분리니 자연스러움.

### 4.3 backward compatibility 보장 방식

- (A) Zod schema에 `.optional()` — undefined 허용. 기존 fixture 그대로 통과.
- (B) default value — Zod `.default()` 적용 후 parsed 결과에 기본값 들어감. 기존 fixture 통과 + 새 코드 일관성.

**Claude 1차 권장**: **(A) optional**. (B)는 `Layout intent: 'stack'`이 명시 의도 없는 fixture에도 박혀 의미가 흐려짐. layoutIntent / contentRole은 _명시 의도가 있을 때만_ 채택.

## 5. 미해결

1. **section.role 도입 시점** — m4-bootstrap 라운드 2 §2.3 후보 (hero / feature-grid / cta-band / footer / form / dashboard / list). 본 토픽에 포함 vs 후속 토픽 (`m4-section-role`).
2. **fixture 메타 (`.meta.json`) schema** — m4-bootstrap 라운드 4 §5에서 Codex가 `model`/`cliVersion`/`promptHash`/`briefId`/`createdAt` 필수 명시. 본 토픽은 schema만, 메타는 `m4-fixture-freeze` 토픽.
3. **semantic coverage metric shape** — m4-bootstrap 라운드 2 §3 분배에서 Codex 담당. 본 토픽은 enum 추가만, metric은 후속.

## 6. 안전장치 즉석 검사

- m4-tree-core 라운드 카운트: 1 (`<6`)
- 동일 미해결 2회 연속: 신규 토픽이라 N/A
- 동일 파일 1h `>=5`: 본 라운드 docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음. round 2 (Codex)에서 코드 진행.
- worktree clean (artifacts/ 제외): ✓
- mandate 범위 확인: (II) sync (`6ede183`) — m4-bootstrap mandate 안 후속 코드 토픽이므로 자율 진행 OK.
