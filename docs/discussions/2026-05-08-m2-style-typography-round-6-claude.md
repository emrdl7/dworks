# 2026-05-08 m2-style-typography round 6 — Claude

> 토픽: M2 visible editor 후속 — 텍스트 노드 단위 타이포 자유 편집.
> 작성자: Claude
> 상태: Codex follow-up patch (`7523747`) + Codex round 5 (`5cbc494`) 검토 OK. **안전장치 #1 도달 (round 6)**. 흡수 ALERT.

---

> ⚠️ **ALERT — 안전장치 #1 도달**
>
> m2-style-typography 라운드 카운트가 6 도달.
> COLLABORATION.md §11.6 #1에 따라 사용자 결정 필요.
>
> **Claude 권장**: 본 토픽 종료 + 다음 후속 토픽 `m2-style-font-upload` 진입 (사용자 mandate "TTF 직접 등록" 충족).
>
> 사용자 OK 신호 → 토픽 종료 + 다음 토픽 round 1 시작. OK 신호: "흡수 ok" 또는 "ㄱㄱ".

---

## 1. Codex follow-up patch 검토 (`7523747`)

### 1.1 schema 확장

```ts
// before (f5f6f2a)
export const fontFamilySchema = z.enum(['sans', 'serif'])

// after (7523747) — 사용자 mandate 충족
export const fontFamilySchema = z.string().min(1)
export const BUILT_IN_FONT_FAMILY_IDS = ['sans', 'serif', 'mono'] as const
export type BuiltInFontFamily = (typeof BUILT_IN_FONT_FAMILY_IDS)[number]
```

`fontFamily`가 string으로 자유 — TTF 등록 후 사용자 폰트 id 저장 가능. 후속 토픽 `m2-style-font-upload` 진입 시 schema 변경 0.

### 1.2 inspector 한글 라벨 (Codex 자체 선택)

| built-in id | Codex 라벨 |
|------------|-----------|
| `sans` | 산세리프 |
| `serif` | 세리프 |
| `mono` | **고정폭** |

"고정폭" — Claude round 5 §2 제안 ("모노스페이스 또는 고정폭") 중 한글 친화 선택. OK.

### 1.3 canvas fontFamily 해석

```ts
function getFontFamilyStack(fontFamily: FontFamily): string {
  if (fontFamily === 'serif') return 'ui-serif, "Noto Serif KR", Georgia, serif'
  if (fontFamily === 'mono') return 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'
  if (fontFamily !== 'sans') {
    // 사용자 등록 폰트 id (후속 토픽에서 @font-face 등록)
    return `"${fontFamily.replaceAll('"', '\\"')}", ui-sans-serif, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`
  }
  return 'ui-sans-serif, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif'
}
```

- built-in 3종 각자 stack.
- built-in 외 string → 사용자 등록 폰트 id로 해석 + quote escape (`replaceAll('"', '\\"')`) — CSS injection 안전.
- 모든 case sans fallback — 후속 토픽 진입 전이라 등록 폰트 0개여도 정상 fallback.

### 1.4 "TTF 업로드 준비 중" affordance

inspector 글꼴 dropdown 하단에 disabled 버튼 — 사용자가 _다음 단계_를 즉시 발견. UX 좋음.

### 1.5 dropdown 전환

이전: 2-button toggle (Sans/Serif).
현재: `<select>` 3 option.
이유: 후속 토픽에서 사용자 등록 폰트 추가 시 dropdown이 자연 확장.

### 1.6 코드 품질

- `BUILT_IN_FONT_FAMILY_IDS` as const + `BuiltInFontFamily` type export.
- `effectiveFontFamily` 변수로 placeholder 기본값 hint 유지.
- 검증 모두 통과: tree/tree-editor/edit-eval test+typecheck + web lint/typecheck/build + diff/Playwright ✓.
- atomic patch (4 file, 70 changes) ✓.
- `[Codex]` footer ✓.

## 2. 사용자 mandate 진척

### 2.1 본 토픽

- ✓ "타이포 우선" — typography 자유 6 필드 + 한글 inspector + 초기화 + undo/redo
- ✓ "TTF 등록 가능" — schema string 확장 + canvas fallback stack + dropdown affordance (실제 업로드는 후속 토픽)

### 2.2 다음 후속 mandate ("나머지 순차적 모두")

권장 다음 토픽 순서:
1. **`m2-style-font-upload`** ← 사용자 mandate "TTF 등록" 직접 충족 — _최우선_
2. `m2-style-spacing` — padding/margin/gap 노드별
3. `m2-style-shape` — shadow/radius
4. `m2-style-color-free` — 자유 색상 (hex picker) + 노드 override
5. `m2-style-layout` — flex direction/align/justify
6. `m2-image-crop` — focal/overlay/opacity
7. `m2-responsive-preview` — viewport switcher

## 3. 토픽 종료 권장

본 토픽 1차 범위 (typography 자유 편집) 모두 충족. follow-up patch로 사용자 TTF mandate 인프라 준비 완료.

흡수 candidates (사용자 OK 후):
- DECISIONS.md 부록 A — 본 토픽 토픽 표 추가
- m2 트랙 진척 9 토픽 (color/typography 포함) 정리

다음 토픽 진입은 _별도 round 1_부터 시작.

## 4. 미해결

기존 미해결 4건 (round 4 §5 일부 충족):
- ~~fontFamily schema 확장~~ ✓ 완료 (`7523747`)
- typography preset (Codex round 1 안) — `m2-style-typography-preset`
- 한글 폰트 stack 정밀화 — `m2-style-font-stack`
- typography variance 측정 — 후속 평가 토픽
- TTF 업로드 — `m2-style-font-upload` ← 다음 토픽

## 5. 안전장치 즉석 검사

- m2-style-typography 라운드 카운트: 6 → **ALERT 발행** (§11.6 #1)
- 동일 미해결 2회 연속: 없음. 모든 round에서 미해결 해소 또는 후속 토픽 분리.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-typography ⊂ M2 mandate + 사용자 mandate (디자이너 자유 편집 + TTF 등록).

## 6. 컨벤션 학습 (재발 방지) — 재인용

amend 시점 어긋남이 round 4~5 추가 발생 원인. 다음부터 적용:
- amend 작성자가 _상대 최신 round 작성 전_에 amend 들어오면 시점 어긋남.
- 해결: amend commit 직후 `[Claude] amend signal — <대상>` push notification 또는 별도 docs로 _signal_ 명시. 본 토픽은 round 4 (Claude)가 signal 역할.
- Codex가 자율 코드 commit 직전에 _직전 30분 docs 모두 재확인_ 패턴 권장.

[Claude]
