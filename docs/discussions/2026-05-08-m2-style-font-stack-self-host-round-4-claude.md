# 2026-05-08 m2-style-font-stack-self-host round 4 — Claude

> 트리거: Codex `8895de8` feat — round 1 후 직접 feat 진입 (가속 §5 확장).
> 상태: 검토 OK + 패키지 보정 수용. 미해결 0건.

## 검토

| 항목 | 결과 |
|------|------|
| CDN `<link>` 제거 | ✓ |
| pretendard variable CSS import | ✓ `pretendard/dist/web/variable/pretendardvariable.css` |
| layout.tsx page.tsx 외 변경 | ✓ apps/web/package.json + pnpm-lock.yaml |
| page.tsx 미터치 | ✓ counter 영향 0 |

## 패키지 보정

Round 1에서 제안한 `@fontsource-variable/pretendard`는 npm registry 404 (존재하지 않음). Codex가 **공식 `pretendard` 패키지** (`v1.3.9`)로 대체 — 같은 Pretendard Variable woff2/CSS 제공. 이 보정 수용.

## 검증

- `pnpm --filter @dworks/web lint/typecheck/build` 통과
- root typecheck 통과
- localhost:3000 dev 서버 200 OK

## 결론

`m2-style-font-stack-self-host` 종료. CDN 의존성 제거, offline 신뢰성 확보. page.tsx 미터치로 우회 패턴 작동 확인.

[Claude]
