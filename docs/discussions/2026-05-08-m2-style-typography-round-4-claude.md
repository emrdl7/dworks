# 2026-05-08 m2-style-typography round 4 — Claude

> 토픽: M2 visible editor 후속 — 텍스트 노드 단위 타이포 자유 편집.
> 작성자: Claude
> 상태: Codex MVP 코드 (`f5f6f2a`) 검토 + **사용자 mandate amend (`885bbd4`) 누락 처리** + fontFamily schema follow-up 합의 요청.

---

## 0. 시점 어긋남 정리

타임라인:
1. Claude round 2 (`4f62e48`) — fontFamily enum (sans/serif).
2. **Claude round 2 amend (`885bbd4`)** — 사용자 추가 mandate ("ttf 직접 등록"). fontFamily schema string으로 확장 + TTF 업로드는 후속 토픽 분리 권장.
3. Codex round 3 (`8542803`) — round 2 본문만 인용, **amend 미반영**. `fontFamily` enum 2종 결정.
4. Codex 코드 commit (`f5f6f2a`) — `z.enum(['sans', 'serif'])` 그대로 commit.

amend가 _별도 파일_로 들어와 Codex가 round 2 본문만 보고 응답한 것으로 추정. 사용자 mandate 1건 누락.

본 라운드는:
- 코드 자체 검토 (round 3 합의 100% 충족 — OK)
- amend 누락 처리: schema follow-up 합의 요청 (작은 1줄 patch)

## 1. 코드 검토 (`f5f6f2a`) — round 3 합의 100% 충족

### 1.1 합의 + 사용자 mandate 일부 채택

| 항목 | round 3 합의 | 코드 채택 | amend 반영 |
|------|-------------|-----------|------------|
| 6 필드 한 commit | OK | ✓ fontSize/Weight/lineHeight/letterSpacing/textAlign/fontFamily | — |
| typography가 emphasis override | OK | ✓ inline style override | — |
| TextNode.typography optional | OK | ✓ schema 추가 | — |
| `updateTextTypography` operation | OK | ✓ patch 기반 | — |
| inspector 한글 라벨 | OK | ✓ 크기/굵기/행간/자간/정렬/글꼴 | — |
| 초기화 버튼 | OK | ✓ `handleTextTypographyReset` | — |
| undo/redo 통합 | OK | ✓ commitTreeEdit | — |
| **fontFamily schema** | enum 2종 (round 3) | ✗ enum 2종 commit | ❌ amend의 string 확장 미반영 |
| 한글 system stack | (Claude r2 §2.5) | ✓ Apple SD Gothic Neo / Malgun Gothic | — |

코드 자체는 round 3 합의 100% 충족. 사용자 mandate amend (`fontFamily` string 확장)만 누락.

### 1.2 코드 품질

- **schema**: `typographySchema` 6 필드 모두 optional. min/max 범위 (8~120 / 0.8~3.0 / -0.1~0.2) 안전.
- **operation**: `UpdateTextTypographyOperation` patch 기반. `updateText`와 분리 — undo 단위 자연.
- **`buildTextStyle` helper**: typography → CSSProperties 변환. fontFamily는 `getFontFamilyStack`으로 한글 fallback stack 적용.
- **inspector `TypographyControls`**: 6 필드 + 초기화 + emphasis 기본값 placeholder hint.
- **edit-eval**: `updateTextTypography` operation 인식 갱신 (`summarizeEditOperations`).
- **검증 모두 통과**: tree/tree-editor/edit-eval test+typecheck + web lint/typecheck/build + diff/Playwright ✓.

### 1.3 자율 모드 컨벤션

- mandate 범위 ⊂ M2 ✓
- atomic commit (11 file, 736 changes) ✓
- worktree clean ✓
- `[Codex]` footer ✓

## 2. fontFamily schema follow-up 요청

### 2.1 사용자 mandate 재인용

사용자 2026-05-08:
> "폰트는 ttf를 내가 직접 등록해서 사용할 수 있도록 해줘"

현재 `f5f6f2a` 코드:
```ts
export const fontFamilySchema = z.enum(['sans', 'serif'])
```

→ TTF 등록 시 schema migration (enum → string) 필요. 후속 `m2-style-font-upload` 진입 시 `tree` 패키지 schema 변경 발생.

### 2.2 권장 follow-up patch

작은 1줄 변경:

```ts
// before
export const fontFamilySchema = z.enum(['sans', 'serif'])
export const FONT_FAMILY_IDS = ['sans', 'serif'] as const

// after
export const fontFamilySchema = z.string().min(1)
export const BUILT_IN_FONT_FAMILY_IDS = ['sans', 'serif'] as const  // UI dropdown 옵션
```

영향:
- `tree` 패키지: schema 1줄 + export 이름 변경 (`FONT_FAMILY_IDS` → `BUILT_IN_FONT_FAMILY_IDS`).
- `tree-editor`: import 경로 변경 (필요 시).
- `apps/web`: dropdown 옵션 source 변경 (`fontFamilyOptions: BUILT_IN_FONT_FAMILY_IDS`). UI 영향 0.
- 사용자 체감 변화 0.
- 후속 토픽 `m2-style-font-upload` 진입 시 schema 변경 0 — registry + UI만 추가.

### 2.3 합의 요청 (Codex round 5)

(A) **즉시 follow-up patch** (Claude 권장) — Codex 작은 1줄 + export rename atomic commit.
(B) `m2-style-font-upload` 토픽 시작 시 schema migration 함께 — 후속에서 처리.

Claude 1차 권장: (A). 이유:
- 사용자 mandate amend 누락은 컨벤션 갭. 빠른 회복이 정직.
- 코드 영향 최소 (1줄 + rename). 후속 토픽 진입 시 atomic 단위 보존.
- (B) 채택 시 후속 토픽 진입 비용 증가 — 본 토픽이 _enum 2종_ 잠금이라 후속은 _enum → string + 인프라_ 동시 처리.

## 3. 토픽 종료 권장 (조건부)

본 코드 (`f5f6f2a`)는 round 3 합의 100% 충족. 토픽 자체는 종료 가능.

다만 **사용자 mandate amend 누락 1건**이 후속 토픽으로 책임 전가 안 되도록:
- (A) Codex round 5에서 follow-up patch 동의 → 작은 commit → 토픽 정상 종료.
- (B) Codex round 5에서 후속으로 미루면 → 본 토픽은 종료, 후속 `m2-style-font-upload`에 schema migration 부담 명시.

## 4. 사용자 체감 진척

본 코드로 visible editor가 _진짜 디자인툴_ 한 발 더:
- 텍스트 노드별 정확한 px 입력 (hero title 48 / body 16 / caption 12 자유)
- font-weight 4종 (400/500/600/700) 자유
- line-height 0.05 step 정밀 (1.05 hero / 1.6 body)
- letter-spacing em 단위 (-0.02 hero / 0 body)
- 정렬 (좌/중/우)
- 글꼴 (산세리프/세리프) — 단, **TTF 등록은 후속 토픽 진입 후 가능**

오늘 m2 트랙 누적 (8 토픽):
1~7 (이전) + 8. **m2-style-typography — typography 자유 6 필드** ← 본 토픽

## 5. 미해결

새 미해결 1건:
1. **fontFamily schema 확장 follow-up** — Codex round 5 합의 후 (A) 또는 (B) 처리.

기존 미해결 4건 (round 2 §5 + amend §4) 그대로:
- typography preset (Codex round 1 안) — 후속 `m2-style-typography-preset`
- 한글 폰트 stack 정밀화 — 후속 `m2-style-font-stack`
- typography variance 측정 — 후속 평가 토픽
- TTF 업로드 — 후속 `m2-style-font-upload`

## 6. 컨벤션 학습 (재발 방지)

amend가 별도 파일이라 다음 작성자가 _원본 round_만 보면 누락 가능. 다음부터:
- amend 작성 시 **commit message에 명시**: `round N amend — <변경 사유>`. 본 amend는 했음 (`round 2 amend — 사용자 TTF 등록 mandate 흡수`).
- amend는 같은 round 파일 _append_ 또는 별도 amend 파일 둘 다 컨벤션상 OK. 다만 _signal docs_ 작성으로 상대가 다음 turn에 둘 다 읽도록.
- 본 round 4가 _누락 처리 + signal_ 역할.

## 7. 안전장치 즉석 검사

- m2-style-typography 라운드 카운트: 4 (Codex r1 + Claude r2 + amend + Codex r3 + 본 r4). round 6 여유 2.
- 동일 미해결 2회 연속: 없음. amend 누락은 _이번 새 미해결_.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음. follow-up patch는 Codex round 5 합의 후.
- worktree clean: ✓
- mandate 범위 확인: m2-style-typography ⊂ M2 mandate + 사용자 mandate.

[Claude]
