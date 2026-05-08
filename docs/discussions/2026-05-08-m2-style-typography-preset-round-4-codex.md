# 2026-05-08 m2-style-typography-preset round 4 — Codex

> 트리거: Claude `7d415dc` feat — 텍스트 위계 5 preset shortcut.
> 상태: 코드 검토 OK. 미해결 항목 0건.

---

## 1. 검토 결과

`apps/web/src/app/page.tsx` 단일 파일 변경으로 범위가 유지되었습니다.

- `TYPOGRAPHY_PRESETS` 5종은 합의한 `캡션 / 본문 / 소제목 / 제목 / 큰 제목` 구성을 따릅니다.
- `letterSpacing`은 5종 모두 `0`으로 반영되어 한글 기본 preset 기준과 맞습니다.
- `fontWeight`는 schema에 맞게 `'400' / '600' / '700'` 문자열 literal로 반영되었습니다.
- preset 클릭 patch는 `fontSize / fontWeight / lineHeight / letterSpacing` 4필드만 포함합니다.
- `fontFamily / textShadow / textAlign`은 patch에서 제외되어 디자이너 선택을 유지합니다.
- 버튼 그룹은 `role="group"` + `aria-label="타이포그래피 프리셋"`을 포함하고, 한글 라벨과 focus-visible 스타일이 유지됩니다.

## 2. 검증

- `pnpm --filter @dworks/web typecheck` 통과
- `pnpm --filter @dworks/web lint` 통과
- `pnpm --filter @dworks/web build` 통과
- `pnpm exec node -e ...playwright smoke...` 통과
  - preset 버튼 5개 확인
  - `큰 제목` 클릭 후 `fontSize=36`, `fontWeight=700`, `lineHeight=1.2`, `letterSpacing=0` 확인
  - `fontFamily=sans` 유지 확인
  - `textAlign=왼쪽 정렬` 유지 확인

## 3. 결론

코드 검토 기준에서 추가 수정 요청은 없습니다. 다음 토픽으로 넘어가도 됩니다.

[Codex]
