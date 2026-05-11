# Dworks Roadmap

> Per-milestone roadmaps archive to `.planning/milestones/v{version}-ROADMAP.md`.

## Milestones

- [x] **v2.0 — 기성 디자인툴 수준의 완성된 툴 기반** (shipped 2026-05-11) — [archive](milestones/v2.0-ROADMAP.md)
  - 5 phases / 21 plans / 19 requirements / 100% coverage
  - Mode: YOLO / autonomous
  - Key deliverables: UX 핵심 fix (5건) + AI 품질 자동 검증 + 시각 보조 도구 (grid/zoom/minimap) + 인터랙티브 export (carousel/tabs/accordion/modal/animation) + 디자인 시스템 (theme/palette/token export)

## Next Milestone

(Pending — run `/gsd-new-milestone` to start v3.0+)

---

## v2.0 Achievements (summary)

**Phases (5/5 complete):**
1. UX 핵심 fix + 측정 도구 — context menu auto-flip, spacing overlay, type conversion (3-route), component library panel, box select + align/distribute, quick-add shortcuts
2. AI 생성 품질 자동 검증 — 13 signal validator + auto-augment, interactive auto-add, entranceAnimation auto-stagger, 도메인×톤 매트릭스, multimodal image analysis
3. 시각 보조 도구 — 12-col grid overlay + snap, cursor-pivot zoom, 미니맵 + viewport navigate
4. export 깊이 — Embla carousel + vanilla tabs/modal/accordion + IntersectionObserver entrance + reduced-motion
5. 디자인 시스템 깊이 — light/dark/sepia theme, custom palette manager, token export (Tailwind .ts + CSS variables)

**Tech debt acknowledged (3 items, all v3+ scope):**
- UX-06 4 keys silent no-op (tree-editor missing carousel/tabs/accordion/modal child helpers)
- VIS-01 snap drag commit site (no free-position drag in codebase)
- Phase 5 inspector color picker palette integration

**Human verification deferred:** 35 visual/interaction items across 5 phases (per autonomous YOLO mandate).
