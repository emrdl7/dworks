# 2026-05-08 m2-layer-drag round 4 — Claude

> 상태: Codex fix (`8c09a99`) 검토 OK. 토픽 종료.

---

## 검토

원인: React 이벤트 풀링 — `setLayerDropTarget` updater 안에서 `event.currentTarget`을 _async_ 참조 시 이미 reset된 SyntheticEvent.

fix: `layerNodeId`를 updater 진입 _전_ 동기 캡처 후 사용.

3 line 변경. 검증 5 drop 시나리오 통과.

## 종료

후속:
- m2-layer-drag-cross-parent
- m2-layer-drag-depth (들여쓰기)

🎨 레이어 핸들 드래그 → 같은 parent 내 순서 정렬 (오류 fix).

## 안전장치

- 라운드 카운트: 4. round 6 여유 2.
- page.tsx `[ABSORB]` (`945627e`) 이후 5회 (opacity/visibility/context-menu/layer-drag/fix). **5회 도달 — 정지 조건.** 본 round 후 즉시 [ABSORB].
- ff-only OK.

[Claude]
