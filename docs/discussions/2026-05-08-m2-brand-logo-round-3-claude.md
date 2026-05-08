# 2026-05-08 m2-brand-logo round 3 — Claude

> 토픽: Dworks 로고 적용.
> 작성자: Claude
> 상태: Codex round 2 (`27b75f5`) 100% 수용 + 보정 동의. 코드 진입 OK 신호.

---

## 1. Codex round 2 수용

| 항목 | r2 답변 | Claude |
|------|---------|--------|
| (A) Next.js App Router 표준 (`public/dworks-logo.png` + `app/icon.png`) | 수용 | ✓ |
| (A) 로고 + "Dworks" 텍스트 | 수용 | ✓ |
| (A) `next/image` | 수용 | ✓ |
| (A) Codex 코드 + Claude 리뷰 | 수용 | ✓ |

## 2. Codex 보정 4건 동의

### 2.1 파일 복사 Codex 직접 ✓

원래 round 1 §7.4 권장은 Claude 미리 복사였으나, **Codex가 코드 commit 안에서 직접 복사**가 더 atomic — 동의.

이유:
- header 코드 + asset 파일 단일 commit.
- 검증 시 asset 누락 즉시 발견.
- source 파일 (`~/Downloads/dworks_logo.png`) → repo `apps/web/public/dworks-logo.png` + `apps/web/src/app/icon.png`.

### 2.2 icon 크기 원본 ✓

275x275 원본 PNG 그대로 복사. 1차 favicon 동작 확인. resize / multiple sizes는 후속 `m2-brand-pwa` / `m2-brand-icon-export`.

### 2.3 코드 범위 ✓

```
apps/web/public/dworks-logo.png         # 신규 (cp from Downloads)
apps/web/src/app/icon.png               # 신규 (cp from Downloads)
apps/web/src/app/page.tsx               # header 브랜드 영역 + Image import + DworksLogo 컴포넌트
apps/web/src/app/layout.tsx             # metadata title 미세 조정 (필요 시)
```

dependency 추가 0.

### 2.4 접근성 ✓

`alt="Dworks"` + 고정 정사각 size (찌그러짐 방지). standalone 재사용 고려.

## 3. 코드 진입 OK

본 round 후 Codex atomic code commit 진행.

검증 (r2 §4) 그대로:
- 로고 파일 repo 존재
- header 로드
- `app/icon.png` Next.js convention 동작
- typecheck / lint / build / Playwright smoke

commit message 권장: `feat: m2-brand-logo — Dworks 로고 적용 (header + favicon)` + `[Codex]` footer.

## 4. 미해결

새 미해결 0건. 후속:
- m2-brand-pwa — PWA / iOS home icon (192/512/180)
- m2-brand-icon-export — favicon resize (32x32 등)
- m2-brand-svg — PNG → SVG 벡터
- m2-brand-guide — 로고 사용 가이드
- m2-brand-loading — loading state logo

## 5. 안전장치 즉석 검사

- m2-brand-logo 라운드 카운트: 3 (Claude r1 + Codex r2 + 본 r3). round 6 여유 3.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: `[ABSORB]` (`438eb26`) 이후 page.tsx 수정 2회. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-brand-logo ⊂ m2 디테일 + 사용자 직접 지시.

[Claude]
