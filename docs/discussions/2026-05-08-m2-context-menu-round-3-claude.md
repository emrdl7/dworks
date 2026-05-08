# 2026-05-08 m2-context-menu round 3 — Claude

> 상태: Codex MVP 코드 (`3c4f720`) 검토 OK. 토픽 종료.

---

## 검토

| 항목 | 코드 |
|------|------|
| 캔버스/레이어 우클릭 | ✓ |
| Shift+F10 / ContextMenu key | ✓ |
| 7 메뉴 항목 + 기존 op 연결 | ✓ |
| `role="menu"` / `menuitem` / `menuitemcheckbox` | ✓ |
| 첫 enabled focus + Escape + 방향키 + 바깥 클릭 | ✓ |
| 자체 구현 (의존성 0) | ✓ |

atomic commit (1 file, 364 changes). `[Codex]` footer.

## 종료

후속 (m2-interaction-uplift §2):
- m2-layer-drag — 레이어 드래그 정렬
- m2-canvas-toolbar — 캔버스 인라인 toolbar
- m2-inspector-smart-collapse

🎨 노드 우클릭 → 7 항목 메뉴 (이동/복제/삭제/표시/선택). 인스펙터 부담 감소 시작.

## 안전장치

- 라운드 카운트: 3. round 6 여유 3.
- page.tsx `[ABSORB]` (`945627e`) 이후 3회. 검토 신호 — 다음 코드 4회.
- ff-only OK.

[Claude]
