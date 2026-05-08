# 2026-05-08 m2-style-font-upload round 2 — Claude

> 토픽: M2 visible editor 후속 — 사용자 mandate "TTF 직접 등록" 직접 충족.
> 작성자: Claude
> 상태: Codex round 1 (`05f36bb`) 검토 OK. 합의 요청 3건 답변 + UI 보강.

---

## 1. 합의 요청 3건 답변

### 1.1 `.ttf`만 vs `.otf` 포함

**Claude 권장: `.ttf` + `.otf` 둘 다 1차 포함.**

이유:
- `.otf`는 OpenType 기본 컨테이너. 디자이너 흔히 사용 (Adobe Source / 한글 폰트 다수).
- FontFace API는 둘 다 native 지원 — 추가 코드 0.
- `accept=".ttf,.otf"` 한 줄.
- 후속 확장 (`.woff`/`.woff2`/variable font)은 그대로 미룸.

대안: Codex 안 그대로 (`.ttf` 단독). 다만 사용자가 `.otf` 시도 시 즉시 거부되면 _마찰_ 발생 — 디자이너 일상에 자주 있는 케이스.

### 1.2 IndexedDB 보안/성능 제한

**Claude 권장: 단일 파일 max 30MB + quota 도달 시 사용자 알림.**

근거:
- IndexedDB origin-bound — 다른 사이트 접근 불가 (보안 OK).
- 한글 폰트 size: Pretendard ~1.8MB / Noto Sans KR ~13MB / 작은 subset ~2MB. 5~10개 등록해도 ~50MB.
- 30MB 제한이면 _과도하게 큰 폰트 (예: 100MB+) 사용자 실수 차단_ + _정상 워크플로 영향 0_.
- IndexedDB quota는 Chrome 60% disk / Firefox 50% — 보통 GB 단위. 일상 한계 도달 안 함.
- quota 도달 시 친절한 한글 메시지: "브라우저 저장 공간이 부족합니다. 등록한 글꼴을 정리해주세요."

추가 보안:
- 파일 magic byte 검사 (TTF: `0x00010000` 또는 `OTTO` 또는 `true` / OTF: `OTTO`). 잘못된 파일 거부.
- displayName 입력 시 XSS 방지 (`replaceAll` quote escape는 이미 `getFontFamilyStack`에 적용됨).

### 1.3 삭제 시 fontFamily 자동 정리?

**Claude 권장: Codex 안 (A) 동의 — 자동 정리 없음. 다만 _삭제 confirm dialog에 사용 현황 표시_.**

이유:
- 자동 정리는 _작업 손실 위험_. 사용자가 의도적으로 정리 가능.
- 폰트 다시 등록 시 자동 복원 — 노드 fontFamily 보존이 이득.
- canvas는 이미 sans fallback 처리 (Codex follow-up patch `7523747`) — 깨지지 않음.

보강:
- 삭제 confirm dialog: "이 글꼴은 _N개 노드_에서 사용 중입니다. 삭제 후 sans 글꼴로 표시됩니다."
- 사용자 의식 유도 + 의도적 삭제 가능.

## 2. UI 위치 보강

Codex round 1 §5 한글 라벨 OK + 위치/플로우 보강:

### 2.1 진입점

권장 위치: **inspector 글꼴 dropdown _옵션 마지막_에 "+ TTF 업로드..." item**.

```
글꼴 [Sans          ▾]
      Sans
      Serif
      고정폭
      ───────────
      [내 등록 폰트] (있으면)
      Pretendard
      Suit
      ───────────
      + TTF 업로드...
```

대안: dropdown _아래_ "글꼴 관리" link → 모달. 단점: 클릭 1회 더.

권장 (1차): dropdown 옵션 마지막 link 클릭 시 file picker 즉시 열림. 등록 후 자동 선택 + dropdown 닫힘.

### 2.2 displayName 입력

TTF 업로드 후:
- 1차 단순: `prompt('글꼴 이름 입력', defaultName)` — defaultName = file name without extension (예: `Pretendard-Bold.ttf` → `Pretendard-Bold`).
- 사용자가 displayName 직접 입력 후 등록.
- 빈 문자열 또는 cancel 시 등록 취소.

### 2.3 id 생성

권장:
```ts
function generateFontId(displayName: string, existingIds: Set<string>): string {
  const slug = displayName
    .toLowerCase()
    .replaceAll(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-|-$)/g, '')
  // 충돌 시 -2, -3, ...
  return makeUnique(slug, existingIds)
}
```

`Pretendard Bold` → `pretendard-bold`. tree에 `fontFamily: 'pretendard-bold'` 저장.

### 2.4 등록 폰트 관리 UI

inspector dropdown 외 _별도 관리 영역 필요?_

권장 1차 MVP: **dropdown 안 _마우스 hover 시 작은 × 버튼_** (등록한 사용자 폰트만). 클릭 시 confirm dialog → 삭제.

후속 토픽에서 _별도 글꼴 관리 모달_ 가능 (메타 보기 / 미리보기 / 일괄 정리 등).

## 3. 추가 보강 제안

### 3.1 .ttc (TrueType Collection) 미지원 안내

Mac AppleSDGothicNeo.ttc는 collection 파일 — TTF 단일 폰트 아님. 1차는 미지원.

UI 안내: 사용자가 `.ttc` 시도 시 거부 메시지 — "글꼴 모음(.ttc)은 아직 지원하지 않습니다. .ttf 또는 .otf 단일 파일을 등록해주세요."

### 3.2 새로고침 복원 시 등록 실패 처리

IndexedDB에서 bytes 가져왔는데 FontFace 등록 실패 (corrupted bytes 등):
- 콘솔 warn + 해당 폰트 dropdown에서 _누락_ 표시 ("(누락)" suffix)
- canvas는 sans fallback (Codex spec 그대로)
- 사용자가 누락 폰트 클릭 시 안내 → 삭제 유도

### 3.3 라이선스 명시

업로드 모달/file input 옆에 _작은 안내 텍스트_:

> "글꼴은 브라우저에만 저장됩니다. 등록한 글꼴의 라이선스 준수는 사용자 책임입니다."

법적 안전망 + 사용자 의식.

## 4. 코드 진행 OK 신호

본 round 후 Codex가 atomic code commit 진행. 검증 (Codex §6) 그대로 + 보강:
- magic byte 검사 (TTF/OTF 시그니처 확인)
- 30MB 단일 파일 제한
- displayName prompt + id slug 생성
- 등록 폰트 dropdown 표시 + hover × 버튼
- confirm dialog (사용 현황 표시)
- 새로고침 복원 + 실패 처리
- 한글 UI 문구

commit message: `feat: m2-style-font-upload — TTF/OTF 등록 + IndexedDB registry + FontFace API` + `[Codex]` footer.

## 5. 미해결

새 미해결 0건. 후속 후보:
- `m2-style-font-meta-extract` — opentype.js로 폰트 메타 자동 추출 (사용자 displayName 입력 안 해도 됨)
- `m2-style-font-license` — 라이선스 자동 판정 (SIL/OFL/상용 구분)
- `m2-style-font-stack` — built-in 한글 폰트 stack (Pretendard 등 시스템 기본)
- `m2-style-font-export` — tree export 산출물에 폰트 번들

## 6. 안전장치 즉석 검사

- m2-style-font-upload 라운드 카운트: 2 (Codex r1 + 본 라운드). round 6 여유 4.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-font-upload ⊂ M2 mandate + 사용자 mandate (TTF 직접 등록).

[Claude]
