# 2026-05-08 m2-brand-logo round 1 — Claude

> 토픽: M2 visible editor 디테일 — Dworks 로고 적용.
> 작성자: Claude
> 상태: 사용자 로고 제공 + 적용 협의 요청. 신규 토픽.

---

## 0. 사용자 mandate

사용자 2026-05-08 첨부 로고:
- `/Users/johyeonchang/Downloads/dworks_logo.png`
- 정사각 비율 (~280x280px 추정)
- 보라/파랑 그라데이션 (`#7B61FF` ~ `#5DD3FF` 추정)
- 두 D가 겹친 형태 (Design Works 정체성)
- 투명 배경 (PNG)

> "이거 적용하는것도 합의해서 진행해"

→ 협의 후 적용. 신규 토픽 round 1.

## 1. 본 토픽 목표

다음 atomic code commit에서 visible editor에 **Dworks 브랜드 로고** 적용:

1. 로고 파일을 `apps/web/public/`에 배치.
2. header 좌측에 로고 컴포넌트 추가.
3. browser favicon 갱신.
4. 로고 + "Dworks 편집기" 텍스트 조합 또는 로고 단독 (합의 결정).

## 2. 비범위

- Marketing landing page (`apps/landing` 등) — 별도 mandate.
- PWA / iOS home screen icon (다양한 크기 export) — 후속 `m2-brand-pwa`.
- Loading state / 404 page logo — 후속.
- Logo dark mode variant — 현재 graphite preset에서 로고 자체 그라데이션이 _배경 영향 적음_, 1차 단일 사용.
- Logo 사용 가이드 (clear space / minimum size) — 후속.
- SVG 변환 (PNG → SVG 벡터) — 후속 권장 (정밀 렌더 + 스케일링).

## 3. 파일 배치 안

### 3.1 옵션 (A) public + favicon 분리

```
apps/web/public/dworks-logo.png        # 컴포넌트용
apps/web/src/app/icon.png              # Next.js favicon (App Router 표준)
apps/web/src/app/apple-icon.png        # iOS home (후속)
```

Next.js App Router 표준:
- `app/icon.png` → automatic `<link rel="icon">` 주입.
- size 32x32 (또는 64x64).

### 3.2 옵션 (B) public 단독

```
apps/web/public/dworks-logo.png
apps/web/public/favicon.ico            # 직접 favicon
```

수동 favicon — 오래된 패턴.

### 3.3 권장

**(A) Next.js App Router 표준** — `app/icon.png` 자동 주입 + `public/dworks-logo.png` 컴포넌트.

다만 _현재 PNG 파일 1개_ → 두 파일 복사:
- 큰 사이즈 (~280x280) 그대로 → `public/dworks-logo.png`
- 동일 파일 또는 resize → `app/icon.png`

리사이징은 후속 가능 (PNG 그대로 두 곳 복사로 1차).

## 4. header 적용 안

### 4.1 현재 header

```tsx
<div>
  <h1 className="text-base font-semibold">Dworks 편집기</h1>
  <p className="text-xs text-[#647067]">색상 스타일 편집</p>
</div>
```

### 4.2 옵션 (A) 로고 + 텍스트

```tsx
<div className="flex items-center gap-3">
  <Logo size={32} />
  <div>
    <h1 className="text-base font-semibold">Dworks</h1>
    <p className="text-xs text-[#647067]">현재 편집 mode</p>
  </div>
</div>
```

장점: 로고 + 텍스트 명확. 디자인툴 표준 (Figma / Sketch 동일).

### 4.3 옵션 (B) 로고 단독

```tsx
<div className="flex items-center gap-3">
  <Logo size={28} />
  <p className="text-xs text-[#647067]">현재 편집 mode</p>
</div>
```

장점: 공간 절약. 단점: 작은 logo 인식도 ↓.

### 4.4 권장

**(A) 로고 + 텍스트**. 이유:
- header 공간 충분 (h-14 = 56px).
- 로고 + 텍스트 조합이 _기억성 (memorability)_ 향상.
- "편집기" → "Dworks" 단축 (편집기 의미는 _현재 mode_ subtitle로 자연 추출).

## 5. Logo 컴포넌트

```tsx
function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/dworks-logo.png"
      alt="Dworks"
      width={size}
      height={size}
      priority
    />
  )
}
```

next/image 사용 — public asset이라 domain allowlist 무관, optimization 자연.

`priority` — header above-the-fold라 LCP.

## 6. favicon 적용

Next.js App Router metadata API:

```ts
// app/layout.tsx (이미 존재 또는 신규)
export const metadata: Metadata = {
  title: 'Dworks',
  icons: {
    icon: '/icon.png',
  },
}
```

또는 `app/icon.png` 파일 자체로 자동 주입 (App Router 컨벤션).

## 7. Codex 합의 요청 4건

### 7.1 파일 배치

(A) **Next.js App Router 표준** (`app/icon.png` + `public/dworks-logo.png`) (Claude 권장)
(B) public 단독 (`public/favicon.ico` + `public/dworks-logo.png`)

### 7.2 header 표시

(A) **로고 + "Dworks" 텍스트** (Claude 권장)
(B) 로고 단독
(C) 텍스트 단독 (현재 그대로) — 로고는 favicon만

### 7.3 next/image 사용

(A) **next/image** (Claude 권장 — public asset 표준)
(B) `<img>` direct (현재 unsplash 패턴 동일 — 다만 lint disable 필요)

### 7.4 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

추가 작업 — 파일 복사:
- Codex가 commit 시 `cp /Users/johyeonchang/Downloads/dworks_logo.png apps/web/public/dworks-logo.png` 등.
- 또는 Claude가 _round 1 단계_에서 파일 미리 복사 + Codex 코드 진행.

권장: **Claude가 파일 미리 복사** (round 2 commit 직전) + Codex 코드 진행.

## 8. 미해결

후속:
- m2-brand-pwa — PWA / iOS home icon (192/512/180 등)
- m2-brand-svg — PNG → SVG 벡터 변환 (디자이너 직접 또는 자동 변환)
- m2-brand-guide — 로고 사용 가이드 (clear space / 최소 크기)
- m2-brand-loading — loading state logo

## 9. 안전장치 즉석 검사

- m2-brand-logo 라운드 카운트: 1 (`<6`). 신규 토픽.
- 동일 미해결 2회 연속: N/A.
- 동일 파일 1h `>=5`: `[ABSORB]` (`438eb26`) 이후 page.tsx 수정 2회. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-brand-logo ⊂ m2 디테일 + 사용자 직접 지시.

[Claude]
