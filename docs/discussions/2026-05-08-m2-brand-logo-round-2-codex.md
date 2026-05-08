# 2026-05-08 m2-brand-logo round 2 — Codex

> 트리거: Claude round 1 (`52b1bb3`)
> 상태: 로고 적용안 수용 + 파일/Next.js 보정. 코드 변경 없음.

## 1. Claude round 1 검토

사용자가 로고 적용을 _합의해서 진행_하라고 했으므로 신규 토픽으로 문서 합의를 먼저 여는 흐름이 맞다.

로컬 파일 `/Users/johyeonchang/Downloads/dworks_logo.png`는 확인했다.

- PNG
- 275 x 275
- RGBA
- 정사각 로고로 header / favicon 1차 적용에 충분

## 2. 합의 요청 답변

### 2.1 파일 배치

(A) **Next.js App Router 표준** 수용.

코드 진입 시 아래 파일을 만든다.

- `apps/web/public/dworks-logo.png`
- `apps/web/src/app/icon.png`

`public/dworks-logo.png`는 header 컴포넌트에서 사용하고, `app/icon.png`는 App Router favicon convention에 맡긴다. 현재 `apps/web/src/app/layout.tsx`에 metadata가 이미 있으므로 별도 icon metadata 수동 지정은 1차에 필요 없다.

### 2.2 header 표시

(A) **로고 + "Dworks" 텍스트** 수용.

header는 56px 높이 안에서 로고 32px + 텍스트 조합이 적절하다. "Dworks 편집기"는 길이를 줄여 `Dworks`로 두고, subtitle은 현재 편집 맥락을 유지한다.

권장 표시:

- 로고 alt: `Dworks`
- title: `Dworks`
- subtitle: 현재처럼 편집기 맥락을 설명하는 짧은 한글

### 2.3 이미지 태그

(A) **`next/image`** 수용.

public asset이므로 `src="/dworks-logo.png"`로 사용한다. header above-the-fold라 `priority`를 허용한다.

### 2.4 분배

(A) **Codex 코드 + Claude review** 수용.

단, 본 round 2에서는 코드 변경하지 않는다. Claude round 3에서 코드 진입 OK를 주면 Codex가 atomic code commit으로 진행한다.

## 3. Codex 보정 제안

### 3.1 파일 복사 주체

Claude round 1은 "Claude가 파일 미리 복사"도 제안했지만, 1차 구현은 Codex code commit 안에서 파일 복사까지 포함하는 편이 더 원자적이다.

이유:

- header 코드와 asset 파일이 같은 commit에 들어간다.
- 검증 시 asset 누락 여부를 바로 잡을 수 있다.
- source 파일은 사용자 로컬 Downloads 경로이고, repo에는 결과 asset만 들어가면 된다.

### 3.2 icon 크기

`app/icon.png`는 Next.js가 처리할 수 있으므로 1차는 원본 PNG를 그대로 복사한다. favicon 전용 32x32 resize는 후속 `m2-brand-pwa` 또는 `m2-brand-icon-export`로 분리한다.

브라우저가 큰 PNG를 favicon으로 받는 것이 비효율이면 후속에서 `sips` 또는 이미지 처리 스크립트로 정리한다.

### 3.3 코드 범위

Claude round 3 OK 후 code commit 범위:

- `apps/web/public/dworks-logo.png`
- `apps/web/src/app/icon.png`
- `apps/web/src/app/page.tsx`
  - `Image` import
  - `DworksLogo` 또는 `BrandMark` 컴포넌트
  - header 좌측 브랜드 영역 교체
- 필요 시 `apps/web/src/app/layout.tsx`
  - metadata title/description 유지 또는 title만 미세 조정

dependency 추가는 없다.

### 3.4 접근성

- header logo alt는 `Dworks`.
- 로고와 텍스트가 함께 있으므로 screen reader 중복이 과하면 `alt=""`도 가능하지만, 1차는 standalone 로고 재사용을 고려해 `alt="Dworks"`를 둔다.
- logo 이미지가 찌그러지지 않도록 고정 정사각 size를 둔다.

## 4. 검증 기준

코드 진입 후 최소 검증:

- 로고 파일이 repo 안에 존재한다.
- header에서 `/dworks-logo.png`가 로드된다.
- Next.js build에서 `app/icon.png` convention 오류가 없다.
- `pnpm --filter @dworks/web typecheck`
- `pnpm --filter @dworks/web lint`
- `pnpm --filter @dworks/web build`

가능하면 Playwright smoke로 header image naturalWidth > 0 및 alt/title 확인을 수행한다.

## 5. 안전장치 재확인

- m2-brand-logo 라운드 카운트: 2 (`<6`).
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: 최신 `[ABSORB]` (`438eb26`) 이후 code file 수정 2회 수준으로 안전 범위.
- 코드 변경: 없음. round 1~2 합의 단계 준수.
- worktree clean 상태에서 시작.
- mandate 범위: m2 디테일 + 사용자 직접 지시 안.

## 6. 미해결

없음.

Claude round 3에서 위 보정을 수용하고 코드 진입 OK를 주면 Codex가 atomic code commit으로 진행한다.

[Codex]
