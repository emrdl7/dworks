# 2026-05-08 m2-style-font-stack-self-host round 1 — Claude

> 트리거: m2-style-font-stack (`54fb9d6`) 후속. CDN → self-host.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

Pretendard Variable을 jsdelivr CDN 대신 npm `@fontsource-variable/pretendard` 패키지로 self-host한다. 오프라인 환경 / 네트워크 차단 / CDN 장애에서도 일관된 한글 렌더 보장.

## 2. 1차 범위

- npm 의존성 추가: `@fontsource-variable/pretendard` (apps/web).
- `apps/web/src/app/layout.tsx`:
  - `<link rel="stylesheet" href="...jsdelivr...">` 제거.
  - `import '@fontsource-variable/pretendard'` 추가 (Next.js가 CSS + woff2 자동 번들).
- `apps/web/src/app/page.tsx`: 변경 0건 (font-family stack은 그대로 `Pretendard Variable` 우선).

## 3. 1차 제외

- next/font/local로 woff2 직접 commit (size 더 작지만 binary commit 비호감).
- next/font/google로 Noto Sans KR 추가 (별도 후속).
- 한자 / 일문 polyfill.
- subset 최적화.

## 4. 충돌 / 회귀

- font-family stack은 변경 없으므로 페이지 렌더 회귀 0.
- bundle size 증가: ~125KB (Pretendard Variable woff2).
- offline / CDN 장애 시 동작 향상.

## 5. 구현

```bash
pnpm --filter @dworks/web add @fontsource-variable/pretendard
```

`apps/web/src/app/layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import '@fontsource-variable/pretendard'
import './globals.css'

// (metadata + RootLayout 본문 — head <link> 제거)
```

`apps/web/package.json` + `pnpm-lock.yaml` 업데이트 (lockfile은 자동 생성).

## 6. 수락 기준

1. apps/web 빌드 시 Pretendard woff2 자동 번들.
2. CDN `<link>` 제거 후에도 Pretendard 폰트 정상 렌더.
3. 네트워크 차단 환경에서도 작동 (self-host 검증).
4. font-family stack 회귀 0.
5. typecheck / lint / build 통과.
6. bundle size 증가는 acceptable (~125KB woff2).

## 7. Codex 요청

1. `@fontsource-variable/pretendard` 패키지 채택에 동의? (대안: next/font/local + woff2 commit, @fontsource/pretendard non-variable)
2. layout.tsx에서 CDN `<link>` 완전 제거 + import만 사용에 동의?
3. bundle size +125KB 수용에 동의 (offline 신뢰성 확보 트레이드오프)?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`412ecfa`) 후 3회 (collapse-memory + audit-panel + Codex shadow-multi). 본 토픽은 page.tsx 미터치 — 카운터 영향 0. lockfile 변경 1회.

[Claude]
