# 2026-05-08 m2-text-inline round 1 — Claude

> 토픽: M2 visible editor 후속 — 텍스트 inline bold/italic/link.
> 작성자: Claude
> 상태: 사용자 mandate 마지막 영역. 신규 토픽 round 1.

---

## 0. 사용자 mandate 인용

2026-05-08 mandate 8영역 마지막:
> "9. 인라인 텍스트 스타일 (bold/italic/link)"

디자이너 일상:
- heading 일부 단어 **bold** 강조
- body 안 _italic_ 인용 또는 emphasis
- link 텍스트 + URL (accent 색 + underline)

현재 `TextNode.content: string`은 _plain text_ — 부분 강조 불가.

## 1. 본 토픽 목표

다음 atomic code commit에서 visible editor는 **inline 강조** 지원:

1. content textarea에서 markdown subset 입력 가능.
2. canvas는 markdown → inline React elements parsing.
3. 3종 markdown:
   - `**text**` → **bold**
   - `*text*` → _italic_
   - `[text](url)` → link
4. backward compat: 기존 fixture (markdown 문법 없음) → plain text 그대로 렌더.

## 2. 비범위

- 이미지 inline (`![alt](url)`)
- 코드 (`` `code` ``)
- strikethrough (`~~`)
- nested formatting (`***bold italic***` 동시)
- list (`- item`, `1. item`)
- heading inline (`# heading`)
- selection-based rich editor (toolbar) — 후속 `m2-text-inline-rich`

## 3. 설계 옵션

### 3.1 옵션 (A) — markdown content (Claude 권장)

**`TextNode.content: string`** 그대로. canvas에서 markdown parsing.

장점:
- schema 변경 0.
- backward compat 자연 (기존 fixture markdown 문법 없음).
- inspector textarea 변경 0 — 사용자가 직접 markdown 입력.
- markdown 디자이너 친화 (Notion / Slack / GitHub).

단점:
- markdown 문법 외우기.
- inspector에서 _현재 강조 보기_ 어려움 (canvas만 시각).

### 3.2 옵션 (B) — TextSpan AST

```ts
export const textSpanSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('bold'), value: z.string() }),
  z.object({ type: z.literal('italic'), value: z.string() }),
  z.object({ type: z.literal('link'), value: z.string(), href: z.string() }),
])

interface TextNode {
  content: string  // fallback
  spans?: TextSpan[]  // 우선
}
```

장점:
- 정밀 schema.
- 외부 export (HTML / React) 변환 단순.

단점:
- inspector에 selection-based rich editor 필요 — 큰 UI 변경.
- 또는 _spans 직접 편집_ — 디자이너 친화 낮음.
- backward compat 복잡.

**Claude 1차 권장: (A) markdown content.** 이유:
- 1차 _빠른 시연_ + 단순 schema.
- 후속 토픽 `m2-text-inline-rich`에서 (B) AST + selection editor 가능.

### 3.3 옵션 (C) — 혼합

content는 markdown 형식 + canvas는 spans로 _parse 결과 캐시_. schema 변경 0이지만 _내부 표현_ spans 사용.

권장 1차: (A) 단순. (C)는 _최적화_라 후속.

## 4. canvas 구현

```tsx
function TextPreview({ node }: { node: TextNode }) {
  const t = node.typography
  const inlineStyle: CSSProperties = {/* 기존 */}
  const elements = parseInlineMarkdown(node.content)
  
  switch (node.emphasis) {
    case 'heading-1':
      return <h2 style={inlineStyle}>{elements}</h2>
    // ...
  }
}

function parseInlineMarkdown(content: string): React.ReactNode[] {
  // 1. **bold**
  // 2. *italic*
  // 3. [text](url)
  // 4. plain text
  // 순서대로 regex 매칭, 우선순위 (link > bold > italic) 또는 nested 지원
}
```

권장 parser:
- 단순 regex 기반 — full markdown parser library 안 씀 (의존성 제거).
- 우선순위: `[text](url)` 먼저 (URL 안 `*` 등 충돌 방지) → `**bold**` → `*italic*` → text.
- non-nested (1차) — `***both***` 미지원.

## 5. 보안 (link href)

`[text](url)` → `<a>` 태그 시:
- 허용 scheme: `http://`, `https://`, `mailto:`, `#fragment` (anchor 내 페이지).
- 그 외 (`javascript:`, `data:` 등) → link 무시 + plain text fallback.
- `target="_blank" rel="noopener noreferrer"` 외부 링크.
- href escape (HTML entities).

## 6. UI 보강

### 6.1 markdown 힌트

inspector textarea 위 또는 아래에 작은 안내:
> 굵게: `**굵게**` / 기울임: `*기울임*` / 링크: `[텍스트](URL)`

또는 textarea placeholder 갱신:
> "내용 (마크다운: **굵게**, *기울임*, [링크](URL))"

권장: textarea 옆 작은 link "마크다운 도움말" → tooltip 또는 hover 시 안내. 인터럽트 적음.

### 6.2 link preview

inspector에서 link 감지 시 _hover preview_ (URL 표시) — 후속.

## 7. Codex 합의 요청 4건

### 7.1 옵션 선택

(A) **markdown content** (Claude 권장 — 단순 + 빠름)
(B) TextSpan AST + selection editor (큰 UI 변경)
(C) 혼합 (최적화)

### 7.2 markdown subset

(A) **bold/italic/link 3종** (Claude 권장)
(B) 추가 (code / strikethrough / nested) — 1차에 포함?

Claude 1차 권장: (A) 3종 — 디자이너 일상 핵심.

### 7.3 link 보안

(A) **scheme allowlist (http/https/mailto/#)** + `noopener noreferrer` (Claude 권장)
(B) 모든 scheme 허용 (위험)

Claude 1차 권장: (A) 보안 필수.

### 7.4 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

## 8. 미해결

후속 후보:
- `m2-text-inline-rich` — TextSpan AST + selection-based rich editor + toolbar
- `m2-text-inline-extra` — code / strikethrough / nested
- `m2-text-inline-link-preview` — inspector hover URL preview

## 9. 안전장치 즉석 검사

- m2-text-inline 라운드 카운트: 1 (`<6`). 신규 토픽.
- 동일 미해결 2회 연속: N/A.
- 동일 파일 1h `>=5`: `[ABSORB]` (`ef1d08e`) 이후 `page.tsx` 수정 4회 (font-relocation / color-polish / responsive / 다음 코드). 다음 코드 commit 시 5회 도달 → [ABSORB] interim 흡수 필요.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-text-inline ⊂ M2 mandate (마지막 영역).

[Claude]
