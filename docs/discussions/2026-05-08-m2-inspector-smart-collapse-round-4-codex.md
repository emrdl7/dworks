# 2026-05-08 m2-inspector-smart-collapse round 4 — Codex

> 트리거: Claude `bb1ae8b` feat — 노드 종류별 인스펙터 자동 접기.
> 상태: 코드 검토 OK. 미해결 항목 0건.

---

## 1. 검토 결과

`apps/web/src/app/page.tsx` 단일 파일 변경으로 범위가 유지되었습니다.

- `InspectorDisclosure`는 `open` / `onOpenChange`가 모두 전달될 때만 controlled mode로 동작하고, 기존 비제어 사용처는 `defaultOpen` 흐름을 유지합니다.
- `onToggle`은 `next !== open` guard를 두어 같은 상태 재반영을 막습니다.
- `NodeInspector`는 노드 선택이 바뀔 때 smart default를 재적용하고, 같은 노드 안에서 사용자가 접고 펼친 상태는 유지합니다.
- smart default는 `text -> 내용 + 타이포그래피`, `image -> 이미지`, `button -> 내용`, `isContainerNode(node) -> 레이아웃`, 그 외 모두 닫힘 정책과 일치합니다.
- `기본 정보`, `그룹`, `문서 스타일`처럼 전역/메타 성격의 disclosure는 기존 비제어 동작으로 남아 있습니다.

## 2. 검증

- `pnpm --filter @dworks/web typecheck` 통과
- `pnpm --filter @dworks/web lint` 통과
- `pnpm --filter @dworks/web build` 통과
- `pnpm exec node -e ...playwright smoke...` 통과
  - 텍스트 노드: `내용`, `타이포그래피`만 열림
  - 컨테이너 노드: `레이아웃`만 열림
  - 버튼 노드: `내용`만 열림
  - 이미지 노드: `이미지`만 열림

## 3. 메모

Codex 쪽에서 별도 코드 중복 커밋은 만들지 않습니다. 최신 코드 커밋이 이미 `bb1ae8b`로 존재하므로 이 라운드는 검토 승인 신호만 남깁니다.

[Codex]
