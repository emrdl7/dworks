# Phase 1: UX 핵심 fix + 측정 도구 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 01-ux-fix
**Mode:** --auto (autonomous)
**Areas discussed:** UX-02 Spacing, UX-03 Type Conversion, UX-04 Component Panel, UX-05 Box Select & Align, UX-06 Quick-add Shortcuts

---

## UX-02 — Spacing 측정 overlay

| Option | Description | Selected |
|--------|-------------|----------|
| 기본 동작 (hover 시 자동) | Figma 동등 — modifier 키 불필요. Alt는 가이드 라인 강제 | ✓ |
| Alt 토글만 | ROADMAP 그대로 Alt 필요 | |
| Cmd 토글 | OS 충돌 위험 | |

**User's choice (auto):** 기본 동작 + Alt 강조. Figma UX 일치 우선.

| Option | Description | Selected |
|--------|-------------|----------|
| absolute DOM overlay | 캔버스 transform 곱한 div 레이어 | ✓ |
| SVG layer | 정밀하지만 라벨 인터랙션 제약 | |
| Canvas API | 성능 최적이지만 reflow 비싸 | |

**User's choice (auto):** DOM overlay — 기존 Tailwind/React 패턴과 일관.

---

## UX-03 — 노드 타입 변환

| Option | Description | Selected |
|--------|-------------|----------|
| 컨텍스트 메뉴 + 인스펙터 dropdown + ⌘K 액션 (3-route) | 발견성 최대 | ✓ |
| 컨텍스트 메뉴만 | 단순하지만 인스펙터 사용자 불편 | |
| 인스펙터 dropdown만 | 우클릭 사용자 불편 | |

**User's choice (auto):** 3-route. 발견성과 흐름 양쪽 보장.

| Option | Description | Selected |
|--------|-------------|----------|
| 호환 매트릭스 (text↔button, section↔hero↔card, list↔accordion, image↔carousel) | ROADMAP 명시 | ✓ |
| 자유 변환 (모든 type 간) | 데이터 손실 위험 큼 | |
| 매우 제한 (같은 카테고리만) | 사용자 요구에 부족 | |

**User's choice (auto):** ROADMAP 매트릭스. 비호환은 메뉴 비활성 + toast.

---

## UX-04 — 컴포넌트 라이브러리 패널

| Option | Description | Selected |
|--------|-------------|----------|
| 좌측 접이식 240px (기본 펼침) | Webflow 패턴, 토글 `[` | ✓ |
| 좌측 hover-pop overlay | 공간 절약하나 발견성 약 | |
| 우측 인스펙터와 통합 | 인스펙터 비좁아짐 | |

**User's choice (auto):** 좌측 패널. 기성 디자인툴 표준.

| Option | Description | Selected |
|--------|-------------|----------|
| Basic 12 + Patterns ≥10 (2 카테고리) | ROADMAP 요구 충족 | ✓ |
| Basic만 | Patterns 누락 | |
| Flat (카테고리 없음) | 12+10=22 평면 — 스캔 어려움 | |

**User's choice (auto):** 2 카테고리. Basic + Patterns 분할.

| Option | Description | Selected |
|--------|-------------|----------|
| HTML5 native drag-and-drop | 표준 API, 외부 dep 없음 | ✓ |
| react-dnd | 풍부하나 무거움 | |
| 커스텀 mouse event | 구현 비용 큼 | |

**User's choice (auto):** Native DnD. 의존성 최소.

---

## UX-05 — 박스 선택 + 정렬/분포

| Option | Description | Selected |
|--------|-------------|----------|
| Shift+drag (캔버스 빈 공간) | Cmd는 OS 충돌, Shift가 안전 | ✓ |
| Cmd+drag | Mac Mission Control 충돌 | |
| 빈 공간 단순 drag | 캔버스 pan과 충돌 | |

**User's choice (auto):** Shift+drag. ROADMAP 명시 + OS 충돌 회피.

| Option | Description | Selected |
|--------|-------------|----------|
| 박스에 일부라도 들어간 노드 (intersect) | Figma 패턴 | ✓ |
| 박스에 완전 포함된 노드만 (contain) | 작은 박스 사용자 불편 | |

**User's choice (auto):** Intersect. 사용자 의도에 더 부합.

| Option | Description | Selected |
|--------|-------------|----------|
| Alt+ 단일 키 조합 (좌중우/상중하 6개 + 분포 2개) | OS 충돌 없음, 학습성 보통 | ✓ |
| Cmd+Alt+ 조합 (Figma 호환) | Mac 메뉴/Spotlight 충돌 위험 | |
| 단축키 없이 toolbar 버튼만 | 키보드 사용자 불편 | |

**User's choice (auto):** Alt+ 조합. Figma 패턴 충돌 회피.

---

## UX-06 — Quick-add 단축키

| Option | Description | Selected |
|--------|-------------|----------|
| T/B/I/R/C/H/L/F/A/M + Shift+C/Shift+T | Figma 영문 약자 패턴, 충돌은 Shift 처리 | ✓ |
| 숫자 키 (1=text, 2=button…) | 학습성 약, 12개 매핑 모호 | |
| ⌘K 명령만 | 키보드 사용자 흐름 끊김 | |

**User's choice (auto):** 영문 약자. Figma 패턴 호환.

| Option | Description | Selected |
|--------|-------------|----------|
| 컨텍스트 의존 (선택 컨테이너 children / 부모 sibling / root) | 사용자 의도 추론 | ✓ |
| 항상 root에 append | 단순하지만 위치 매번 수정 필요 | |
| 마우스 포인터 위치 | 키보드 사용자에게 어색 | |

**User's choice (auto):** 컨텍스트 의존. 자연스러운 흐름.

---

## Claude's Discretion

- 정렬 가이드 라인 색상/굵기 (Figma 파스텔 핑크 점선 기본).
- 박스 선택 박스 z-index / pointer-events 처리.
- 컴포넌트 패널 카드 hover 미리보기 확대 여부.
- 단축키 충돌 감지/사용자 경고 메커니즘.
- 변환 시 매핑 손실 toast 문구.

## Deferred Ideas

- AI 자동 변환 (text → button 라벨 AI 생성) → Phase 2
- 컴포넌트 패널에서 AI 생성 패턴 카드 → Phase 2
- align to canvas guide / grid → Phase 3 (VIS-01 의존)
- 자유 키 customize → v3.0+
- Multi-monitor 컨텍스트 메뉴 → UX-01 follow-up
