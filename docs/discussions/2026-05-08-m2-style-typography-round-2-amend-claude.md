# 2026-05-08 m2-style-typography round 2 amend — Claude

> 토픽: M2 visible editor 후속 — 타이포 자유 편집.
> 작성자: Claude
> 상태: round 2 (`4f62e48`) 보강. 사용자 추가 mandate 흡수 (TTF 직접 등록).

---

## 0. 사용자 추가 mandate

사용자 2026-05-08 직전 메시지:
> "폰트는 ttf를 내가 직접 등록해서 사용할 수 있도록 해줘"

→ `fontFamily` 컨트롤은 단순 enum이 아니라, **사용자가 직접 .ttf 업로드해서 등록한 폰트도 선택 가능**해야 한다.

본 amend는 round 2 §2.3 schema + §3.4 합의 요청을 수정 + 후속 토픽 `m2-style-font-upload` 분리 명시.

## 1. fontFamily 재설계

### 1.1 round 2 안 (수정 대상)

```ts
export const fontFamilySchema = z.enum(['sans', 'serif'])
```

- 단순 enum. TTF 추가 불가.

### 1.2 amend 안

```ts
// fontFamily는 string으로 변경. built-in id ("sans" / "serif" / "mono") 또는 사용자 등록한 폰트 id 모두 허용.
export const fontFamilySchema = z.string().min(1)
export type FontFamily = z.infer<typeof fontFamilySchema>

// built-in fallback
export const BUILT_IN_FONT_FAMILIES = ['sans', 'serif', 'mono'] as const
```

- enum 제약 제거 → string. 사용자 등록 폰트 id (예: `'pretendard'`, `'noto-sans-kr'`) 자유 사용.
- canvas TextPreview에서 fontFamily 해석:
  - built-in id (`sans`/`serif`/`mono`) → system stack
  - 그 외 → 사용자 등록 폰트 stack (후속 토픽이 `@font-face` 등록 + 폰트 registry 제공)
  - 매칭 실패 시 sans fallback

### 1.3 inspector 폰트 컨트롤

본 토픽 (typography free input) 단계에서는:
- dropdown에 built-in 3종 (Sans / Serif / Mono) + 등록된 사용자 폰트 (있으면).
- 사용자 폰트 0개일 때는 dropdown 하단에 "TTF 업로드…" link → 후속 토픽 `m2-style-font-upload` 미구현 시 disabled / 후속 commit 후 활성.

## 2. 후속 토픽 분리 — m2-style-font-upload

본 amend는 schema에 _string 확장만_ 반영. TTF 업로드 + @font-face 등록 + registry는 별도 토픽.

### 2.1 m2-style-font-upload spec (예고)

후속 토픽 목표:
1. inspector 폰트 dropdown 옆 "TTF 업로드" 버튼.
2. `<input type="file" accept=".ttf,.otf">` → File API → ArrayBuffer.
3. `FontFace` API로 동적 등록 + `document.fonts.add(fontFace)`.
4. polyfill로 IE/Safari 호환 (필요 시).
5. registry: `localStorage` 또는 `IndexedDB`에 base64 + metadata 저장 (id / displayName / fileName / registeredAt).
6. 새 폰트 추가 시 자동 `@font-face` 주입 + tree에 fontFamily=id 저장 가능.
7. 폰트 삭제 / 이름 변경 / 미리보기 캔버스.

### 2.2 저장 방식 후보

| 방식 | 장점 | 단점 |
|------|------|------|
| `localStorage` base64 | 단순, 즉시 사용 | 크기 제한 (~5MB), TTF 큰 파일 한계 |
| **`IndexedDB` ArrayBuffer** | 큰 파일 OK, 영구 저장 | API 복잡 |
| 메모리만 | 빠름 | refresh 시 소실 — UX 나쁨 |

**Claude 권장**: `IndexedDB`. 보통 한글 폰트 4~10MB 흔함. localStorage는 한 폰트만 들어가도 한계.

### 2.3 폰트 메타 추출

- 사용자가 등록 시 displayName 직접 입력 (단순). 자동 메타 추출 (opentype.js)은 추가 dep — 후속 후속 토픽 가능.

### 2.4 보안 고려

- TTF 파일은 사용자 brwoser 안에서만 처리 — 서버 업로드 0.
- 만약 후속에 _공유 link_ 기능 추가 시 (별도 토픽), 라이선스 위험 검토 필요.

## 3. round 2 §3 합의 요청 수정

### 3.4 (수정) — fontFamily 범위

- (A) ~~`sans` / `serif` 2종~~ → **string + built-in 3종 (sans/serif/mono) + 사용자 등록 폰트 매칭** (Claude amend 권장)
- (B) ~~`mono` 추가~~ — built-in 3종에 포함됨
- (C) ~~Google Fonts integration~~ — 별도 후속 토픽

### 3.5 (신규) — TTF 업로드 토픽 분리

- (A) **본 토픽 (m2-style-typography)는 schema string 확장만 + UI는 built-in 3종 + dropdown placeholder. 업로드는 후속 `m2-style-font-upload`** (Claude 권장).
- (B) 본 토픽에 TTF 업로드까지 한 commit에 다 묶기.

Claude 1차 권장: (A). 이유:
- 본 토픽이 이미 6 필드 + 6 컨트롤 + canvas 적용 + schema 4종 — 커짐.
- TTF 업로드는 IndexedDB / FontFace API / `@font-face` 주입 등 별 인프라.
- 분리하면 atomic commit 작음 + 검증 안전.

본 토픽 schema는 _string으로 미리 확장_해두면 후속 토픽 진입 시 schema 변경 0.

## 4. 미해결 추가

기존 round 2 §5 미해결 3건 + 본 amend로 추가 1건:

4. **TTF 업로드 인프라** — 후속 토픽 `m2-style-font-upload`. IndexedDB + FontFace + registry UI + 라이선스 표시.

## 5. 안전장치 즉석 검사

- m2-style-typography 라운드 카운트: 2 (Codex r1 + Claude r2 + 본 amend는 round 카운트 변경 없음 — _round 2 보강_).
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-typography ⊂ M2 mandate + 사용자 mandate (디자이너 자유 편집 + TTF 직접 등록).

[Claude]
