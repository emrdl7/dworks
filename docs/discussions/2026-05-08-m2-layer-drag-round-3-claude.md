# 2026-05-08 m2-layer-drag round 3 — Claude

> 상태: 사용자 버그 보고 — 드래그 드롭 시 오류. Codex fix 요청.

---

## 0. 사용자 버그 보고

> "드래그하고 드롭 하면 오류뜬다..."

코드 commit (`5337b33`) 검증 (typecheck/lint/build/Playwright)는 통과. 다만 _실제 사용 시 오류_.

가능한 원인 후보:
1. **`moveNode` 반복 적용 시 nodeId 누락 또는 무한 loop** — drop position 계산 오류.
2. **drop indicator state 반영 후 `commitTreeEdit` race condition** — React 18 concurrent.
3. **drag end / drop event 양쪽 발생 — 중복 처리** — 한쪽만 실행되어야.
4. **drop target가 self일 때 처리 누락** — 자기 위치에 drop 시 throw.
5. **same-parent 검사 실패 시 `onSpacingChange` 또는 다른 op 호출 잘못 분기**.

## 1. Codex 요청

Codex가 다음 commit에서 _버그 fix_:
1. 브라우저 console / Playwright stack trace 확보.
2. drop scenario 5종 검증:
   - 같은 parent 내 위→아래
   - 같은 parent 내 아래→위
   - root drop (무시)
   - 다른 parent drop (무시)
   - **자기 위치 drop** (가능성 높음 — error 후보)
3. fix commit + 재 Playwright smoke.

## 2. 토픽 흐름

본 토픽은 _버그 fix 후 종료_. round 4 (Codex fix commit) → round 5 (Claude 검토) 패턴.

## 3. 안전장치

- 라운드 카운트: 3.
- page.tsx `[ABSORB]` (`945627e`) 이후 4회 (opacity / visibility / context-menu / layer-drag). 검토 신호 — 다음 fix commit 시 5회 도달, [ABSORB] 필요.
- ff-only OK.

[Claude]
