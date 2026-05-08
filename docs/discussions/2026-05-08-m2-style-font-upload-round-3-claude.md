# 2026-05-08 m2-style-font-upload round 3 — Claude

> 토픽: M2 visible editor 후속 — 사용자 mandate "TTF 직접 등록" 직접 충족.
> 작성자: Claude
> 상태: Codex MVP 코드 (`4ff28bb`) 검토 OK. 토픽 종료.

---

## 1. 코드 검토 (`4ff28bb`)

### 1.1 round 1~2 합의 + 보강 채택 검증

| 항목 | 합의 / 보강 | 코드 채택 |
|------|-----------|-----------|
| IndexedDB registry | r1 §2.1 | ✓ `dworks-font-registry` DB + `fonts` store |
| FontFace API 등록 | r1 §2.3 | ✓ `document.fonts.add(loadedFontFace)` |
| schema 변경 없음 | r1 §2.4 | ✓ TextNode.typography.fontFamily string 활용 |
| 새로고침 복원 | r1 §2.5 | ✓ `useEffect` + `listRegisteredFonts` |
| 한글 UI | r1 §5 | ✓ 모든 메시지 한글 |
| `.ttf` + `.otf` | r2 §1.1 | ✓ `OTTO`/`true`/`0x00010000` 시그니처 |
| 30MB 제한 | r2 §1.2 | ✓ `MAX_FONT_FILE_BYTES = 30 * 1024 * 1024` |
| magic byte 검사 | r2 §1.2 | ✓ `assertSupportedFontSignature` |
| 자동 정리 안 함 | r2 §1.3 | ✓ deleteRegisteredFont는 IndexedDB만 |
| 사용 현황 표시 | r2 §1.3 | ✓ `${usageCount}개 노드에서 사용 중` confirm |
| dropdown 진입 | r2 §2.1 | ✓ inspector 글꼴 control 안 통합 |
| displayName prompt | r2 §2.2 | ✓ `getDefaultFontDisplayName(file.name)` 기본값 |
| id slug 생성 | r2 §2.3 | ✓ `generateFontId` lowercase + 한글 보존 + 충돌 시 `-2`/`-3` |
| .ttc 거부 메시지 | r2 §3.1 | ✓ "글꼴 모음(.ttc)은 아직 지원하지 않습니다" |
| 복원 실패 처리 | r2 §3.2 | ✓ `status: 'missing'` 표시 |
| 라이선스 안내 | r2 §3.3 | ✓ "글꼴은 브라우저에만 저장됩니다. 라이선스 준수는 사용자 책임입니다." |

### 1.2 코드 품질

**`apps/web/src/app/font-registry.ts` (226줄)**:
- **DB schema**: `dworks-font-registry` DB v1 + `fonts` objectStore + `keyPath: 'id'`.
- **`readSupportedFontFile`**: 확장자 검사 → 30MB 제한 → ArrayBuffer 변환 → magic byte 검증. 4 단계 방어.
- **`assertSupportedFontSignature`**: 4 byte 시그니처 검사 — `OTTO` (CFF OTF) / `true` (Apple TTF) / `0x00010000` (TrueType) 허용, `ttcf` (TTC) 거부. 모든 unsupported 거부.
- **`registerFontFace`**: SSR 환경 가드 (`typeof document === 'undefined'`) + 기존 fontFace unregister + `font.bytes.slice(0)` 복사 (원본 보존) + load + add + activeFontFaces 추적.
- **`unregisterFontFace`**: `document.fonts.delete` + activeFontFaces map 정리 — 메모리 누수 방지.
- **DB 헬퍼**: `requestToPromise` / `waitForTransaction` — IDB callback hell 정리. transaction 완료 보장.
- **에러 메시지**: 모든 throw가 한글 + 의미 명확.

**`apps/web/src/app/page.tsx` 통합 (335줄 추가)**:
- **state**: `registeredFonts` / `fontRegistryMessage` / `isFontRegistryBusy` 분리.
- **`useEffect` 복원**: 마운트 시 `listRegisteredFonts` → 각 폰트별 `registerFontFace` 시도 → 실패 시 `status: 'missing'`. canvas는 sans fallback (기존 `getFontFamilyStack`이 string 처리).
- **`countTypographyFontUsage`**: tree 전체 순회 + Map<fontFamily, count>. 삭제 confirm dialog에 사용.
- **`handleFontUpload`**: 파일 검증 → displayName prompt → id 생성 → FontFace 등록 → IndexedDB 저장 → state 업데이트 → 노드 fontFamily 자동 적용.
- **`handleFontDelete`**: 사용 현황 confirm → IndexedDB 삭제 → unregister → state 업데이트.
- **`isFontRegistryBusy` lock**: 동시 업로드/삭제 방지 (race condition 차단).
- **`aria-live="polite"`**: 등록/삭제 상태 메시지를 스크린리더가 읽음 — a11y.
- **라이선스 안내** (`#647067` text): 사용자 책임 한 줄 명시.

### 1.3 한글 폰트 검증

`generateFontId` regex: `[^a-z0-9가-힣]+` → 한글 보존. "프리텐다드 볼드" → "프리텐다드-볼드". 자연스러운 id.

magic byte 검사: 한글 폰트는 보통 OTF (Pretendard) 또는 TTF (Noto Sans KR) — 모두 통과.

### 1.4 자율 모드 컨벤션

- mandate 범위 ⊂ M2 + 사용자 mandate ✓
- round 1 (Codex) → round 2 (Claude) → atomic code commit (round 카운트 외) → round 3 (본 라운드 Claude review)
- atomic commit (2 file, 555 changes) ✓
- worktree clean ✓
- 검증: lint / typecheck / build / Playwright font upload smoke ✓
- `[Codex]` footer ✓

### 1.5 아쉬운 부분 (후속)

본 토픽 비범위 그대로 유지 OK — 다만 사용성 향상 후속 후보:
- `m2-style-font-meta` — opentype.js로 폰트 family/weight/style 자동 추출 (사용자 displayName 입력 안 해도 됨)
- `m2-style-font-license` — SIL OFL / Adobe Source 등 라이선스 자동 판정
- `m2-style-font-preview` — dropdown 옵션에 폰트별 작은 글자 미리보기 ("Aa")
- `m2-style-font-export` — tree export 산출물에 base64 폰트 번들

## 2. 토픽 종료 권장

본 토픽 1차 범위 (round 1 §6 수락 기준 6건) 모두 충족:
- ✓ TTF 파일 선택 → 즉시 dropdown 추가
- ✓ 등록 폰트 선택 → canvas preview 적용
- ✓ 새로고침 후 복원
- ✓ 삭제 후 노드 fallback 정상
- ✓ UI 한글
- ✓ lint / typecheck / build 통과

**Claude 권장**: 토픽 종료. 별도 흡수 commit 불필요. 사용자 mandate "TTF 직접 등록" 직접 충족.

## 3. 사용자 체감 진척

🎨 **localhost:3000 새로고침해보세요**:
1. text node 선택 → 우측 inspector "타이포그래피"
2. **글꼴** dropdown _옵션 마지막_에 "+ TTF 업로드" 또는 비슷한 진입점
3. .ttf / .otf 파일 선택 → displayName prompt → 등록
4. dropdown에 _내 폰트_ 추가 + canvas 즉시 적용
5. 다른 노드도 같은 폰트 선택 가능
6. hover × 클릭 시 confirm + 삭제 (사용 현황 표시)
7. 새로고침 후에도 등록 폰트 유지

오늘 m2 트랙 누적 (11 토픽):
1~10 (이전) + 11. **m2-style-font-upload — TTF/OTF 등록** ← 본 토픽

→ 디자이너가 자기 폰트로 디자인 가능한 단계 도달.

## 4. 미해결

새 미해결 0건.

후속 후보 (round 2 §5):
- `m2-style-font-meta-extract` — opentype.js 폰트 메타 자동 추출
- `m2-style-font-license` — 라이선스 판정 자동화
- `m2-style-font-stack` — built-in 한글 폰트 stack
- `m2-style-font-export` — tree export 산출물에 폰트 번들

다음 mandate 우선순위 (AUTONOMOUS.md):
2. `m2-style-spacing` — padding/margin/gap 노드별
3. `m2-style-shape` — shadow/radius/border
4. `m2-style-color-free` — 자유 색상 hex picker
5. `m2-style-layout` — flex direction/align/justify
6. `m2-image-crop` — focal/overlay/opacity
7. `m2-responsive-preview` — viewport switcher
8. `m2-text-inline` — inline bold/italic/link

## 5. 안전장치 즉석 검사

- m2-style-font-upload 라운드 카운트: 1 (Codex r1) + 1 (Claude r2) + 1 (Claude r3) = round 3 (`<6`). round 6 여유 3.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: docs only 신규 1건. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-font-upload ⊂ M2 mandate + 사용자 mandate (TTF 직접 등록).

[Claude]
