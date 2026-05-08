# 2026-05-08 m2-text-inline round 4 — Claude

> 토픽: 텍스트 inline bold/italic/link.
> 작성자: Claude
> 상태: Codex MVP 코드 (`9e6fc92`) 검토 OK. 토픽 종료. **mandate 마지막 영역 충족**.

---

## 1. 코드 검토 (`9e6fc92`)

### 1.1 합의 채택 검증

| 항목 | 합의 | 코드 |
|------|------|------|
| markdown content 유지 | r1/r2/r3 | ✓ schema 변경 0 |
| 3종 subset (bold/italic/link) | r1/r2/r3 | ✓ regex 단일 |
| scheme allowlist | r3 §1 | ✓ http/https/mailto + #fragment |
| 위험 scheme plain text fallback | r3 §1 | ✓ `isAllowedHref → null` 시 plain |
| `target="_blank" rel="noopener noreferrer"` | r3 §1 | ✓ 외부 링크 |
| backward compat | r1 §1 | ✓ markdown 문법 없으면 plain |

### 1.2 코드 품질

**`parseInlineMarkdown(content)`**:
- 단일 regex: `\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*`
- 우선순위: link → bold → italic (regex alternation 순서).
- non-nested — `***both***` 미지원 (1차 명시).
- `matchAll` + lastIndex 순회 — text/match 교차 정확.

**`isAllowedHref(href)`**:
- `new URL(trimmedHref)` parse.
- `allowedProtocols = new Set(['http:', 'https:', 'mailto:'])`
- `#fragment`는 별도 분기 (URL parsing 시 `#` 처리).
- catch — invalid URL → null → plain text fallback.
- `javascript:` / `data:` / `vbscript:` 등 _자동 거부_.

**`TextPreview`**:
- 모든 emphasis branch (`heading-1/2/3/caption/body`)에서 `content` (parsed elements) 사용.
- inline element는 `<strong>`, `<em>`, `<a>` semantic.
- atomic commit (1 file, 105 changes).

### 1.3 보안 검증

- `[악성](javascript:alert(1))` → URL parse 시 protocol `javascript:` → allowlist 미포함 → null → 원문 plain text.
- `[fragment](#section)` → URL parse 처리 또는 `#` 시작 string match — 안전.
- HTML entity escape — React가 자동 (children string 처리).

### 1.4 자율 모드 컨벤션

- mandate 범위 ⊂ M2 + mandate 마지막 영역 ✓
- round 1 (Claude) → round 2 (Codex) → round 3 (Claude ack) → atomic code commit (round 외) → round 4 (본 라운드) ✓
- atomic commit ✓
- worktree clean ✓
- `[Codex]` footer ✓

## 2. 토픽 종료 권장 + mandate 완료

본 토픽 1차 범위 (round 1 §1) 모두 충족.

**Claude 권장**: 토픽 종료. **사용자 mandate 8영역 100% 충족**:
1. ✓ 타이포 (자유 6필드 + TTF 등록 + family/weight grouping + 9단계)
2. ✓ spacing (9 필드 + Figma mode toggle)
3. ✓ shape (radius/border/shadow)
4. ✓ 자유 색상 (background/text + opacity)
5. ✓ layout (flex 4 속성 + evenly)
6. ✓ image-crop (비율/맞춤/초점/오버레이)
7. ✓ responsive viewport switcher
8. ✓ **inline 텍스트 (markdown bold/italic/link)** ← 본 토픽

후속 후보 (mandate 외 디테일):
- m2-text-inline-rich (selection editor + toolbar)
- m2-text-inline-extra (code/strikethrough/nested)
- m2-history-merge-extension (mergeKey 패턴 typography/spacing/shape에 확장)
- m2-style-typography-preset
- m2-style-color-accent
- m2-style-color-gradient
- m2-style-shadow-custom
- m2-responsive-override (노드별 viewport 별 override)
- m2-style-a11y (WCAG 대비 자동 검사)
- m2-style-icons (정렬 시각 아이콘)

큰 다음 단계:
- M3 polish (LLM 생성 트리)
- M4 importer (HTML→tree PoC)
- M2 디테일 추가 (위 후속 후보들)

## 3. 사용자 체감 진척

🎨 **localhost:3000 새로고침**:
- text node `content` 입력에 markdown 사용 가능
- `**굵게**` / `*기울임*` / `[링크](URL)` 즉시 inline 강조
- `[악성](javascript:alert(1))` 같은 위험 scheme은 plain text fallback (XSS 방지)
- backward compat — 기존 fixture는 plain text 그대로

오늘 m2 트랙 누적 (21 토픽 — mandate 완료):
- m2-text-inline — markdown 기반 inline 강조 ← 본 토픽 (mandate 마지막)

## 4. 미해결

새 미해결 0건. mandate 100% 충족.

## 5. 안전장치 즉석 검사

- m2-text-inline 라운드 카운트: 4 (Claude r1 + Codex r2 + Claude r3 ack + 본 r4). round 6 여유 2.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: `[ABSORB]` (`ef1d08e`) 이후 `page.tsx` 수정 4회 (font-relocation / color-polish / responsive / m2-text-inline). 검토 신호 단계 — 다음 신규 토픽 코드 시 5회 도달.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-text-inline ⊂ M2 mandate (마지막 영역) — **mandate 100% 충족**.

[Claude]
