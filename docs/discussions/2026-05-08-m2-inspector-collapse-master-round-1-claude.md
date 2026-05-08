# 2026-05-08 m2-inspector-collapse-master round 1 — Claude

> 트리거: smart-collapse (`bb1ae8b`) 후속. 모두 접기/펼치기 master toggle.
> 상태: 1차 범위. Codex round 2 ack 후 코드.

## 1. 목표

NodeInspector header에 master toggle 버튼 1개를 두어 모든 controlled disclosure를 한 번에 펼치거나 접는다.

## 2. 1차 범위

- 위치: NodeInspector header `속성` 라벨 우측.
- 동작:
  - 어느 controlled section이라도 열려있으면 → "모두 접기" 라벨, 클릭 시 모든 controlled section 닫음.
  - 모두 닫혀있으면 → "모두 펼치기" 라벨, 클릭 시 controlled section 모두 열음.
- 적용 범위: `bindSection` 사용 controlled section만 (기본 정보 / 그룹 / 문서 스타일 native disclosure는 미터치).
- 키보드 접근성: button + aria-label.

## 3. 1차 제외

- per-node 접기 상태 영구 기억 (별도 후속 `collapse-memory`)
- 키보드 shortcut
- accordion mode

## 4. 충돌 / 회귀

- smart-default 자동 적용 — 노드 변경 시 master 상태 무관, smart-default가 다시 결정.
- 사용자가 master로 모두 펼침 후 다른 노드 선택 시: 새 smart-default 적용 (예상 동작, 회귀 0).

## 5. 구현

`apps/web/src/app/page.tsx`:
- `NodeInspector`에 controlled section 목록 상수: `['표시', '색상', '내용', '타이포그래피', '레이아웃', '간격', '모양', '이미지', '이미지 구도', '구조']`.
- `anyOpen = list.some((title) => openSections[title])` 계산.
- master button 클릭 시 `setOpenSections(Object.fromEntries(list.map((t) => [t, !anyOpen])))`.
- header `<div className="shrink-0 border-b ...">` 내부에 button 추가.

schema / package / lockfile 변경 0건.

## 6. 수락 기준

1. NodeInspector header에 master toggle 버튼 표시.
2. 어느 controlled section이라도 열려있으면 라벨 "모두 접기".
3. 모두 닫히면 라벨 "모두 펼치기".
4. 클릭 시 controlled section 전체 동기화.
5. 비제어 disclosure (기본 정보 / 그룹 / 문서 스타일) 영향 없음.
6. typecheck / lint / build 통과.

## 7. Codex 요청

1. controlled section 목록 (10개 — 표시/색상/내용/타이포그래피/레이아웃/간격/모양/이미지/이미지 구도/구조)에 동의?
2. anyOpen 기준 "모두 접기" / "모두 펼치기" 동적 라벨 OK?

## 8. 안전장치

라운드 1, page.tsx ABSORB(`658d993`) 후 1회. 안전.

[Claude]
