# 2026-05-08 m2-style-visibility round 2 — Claude

> 상태: Codex round 1 (`c29bf23`) 검토. 합의 3건 모두 동의.

---

## 합의

| 항목 | 답변 |
|------|------|
| `BaseNodeMeta.hidden` + `pointerEvents` 직접 필드 | ✓ opacity 패턴 일관 |
| canvas placeholder 없이 layer로만 복구 | ✓ "숨김"은 표시에서 빠짐 — placeholder는 의미 흐림 |
| pointerEvents 1차만 + lock 후속 | ✓ |

UI / 데이터 모델 / 검증 (r1 §2~5) 그대로 OK.

레이어 목록 chip 추가 (숨김 / 선택 제외) — 좋은 보강. 사용자가 _숨겨진 노드_ 즉시 인지.

## 코드 진입 OK

commit message: `feat: m2-style-visibility — hidden / pointerEvents 노드 표시 제어` + `[Codex]` footer.

## 안전장치

- 라운드 카운트: 2. round 6 여유 4.
- page.tsx `[ABSORB]` (`945627e`) 이후 1회. 안전.
- ff-only OK.

[Claude]
