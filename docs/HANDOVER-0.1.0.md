# 핸드오버 — 0.1.0 출시 마감 (2026-05-09)

> 사용자 신호 "0.1버전이라도 일단 나와야 할꺼 아니야". 자율 모드 곁가지 revert + UI 일관화 + leaf type 변경 + 캔버스 zoom + 페이지 scroll/캐시 방어로 마감.

---

## 출시 체크리스트

- ✓ 모든 workspace package version 0.1.0 (`21fe923`)
- ✓ typecheck 통과
- ✓ test 통과 (web 112 / api 39 / llm-prompts 24 / tree-editor 77 / 외 모듈 통과)
- ✓ worktree clean

---

## 0.1.0 핵심 흐름

### Generate

1. 사용자 자연어 prompt → /clarify(다중 turn 적응형 질문 0~6) → /generate
2. provider chain (Claude → Codex → Gemini) + schema-resilience(rgba/hsl→hex sanitize) + retry
3. N(1/2/3) 변형 동시 생성 + 비교 grid
4. 다중 참고 이미지 (max 3) — 색감/비율 시드 텍스트로 LLM에 전달

### Edit (m2 자유 편집 inspector)

- 색상 / 내용 / 타이포그래피 / 레이아웃 / 간격 / 모양 / 이미지 / 이미지 구도 / 변환 — 9 disclosure
- 노드 type 변경 (text ↔ image ↔ button) 컨텍스트 메뉴 — 로고 자리 텍스트를 이미지로
- WCAG AA 대비 chip (헤더)
- Undo/Redo

### Persist

- localStorage v1 (휘발 방지, hydrate 시 legacy 자동 마이그레이션)
- 단일 generation .json export/import
- user fixture catalog 등록/삭제

### UI

- header: 로고 + 예제 select + ViewportSwitcher + **−/100%/+ 캔버스 zoom** + Undo/Redo + 대비 AA
- 좌측: AI 디자인 panel (history chip + 4 버튼 + 참고 이미지 + brief 입력)
- 캔버스: 선택 viewport 폭 + zoom 적용
- 우측: 노드 inspector
- 우클릭 메뉴: 위/아래 이동 / 복제 / 삭제 / 표시 / 선택 / 텍스트·이미지·버튼 변경

### 안정성

- main h-screen overflow-hidden + html/body overflow:hidden — 페이지 자체 스크롤바 차단
- preflight.mjs — .next 캐시 stale 자동 감지 + 정리 (main-app.js 404 등 자동 self-heal)
- dev:fresh / clean / preflight script

---

## 색·폼 (디자인 시스템)

- primary: indigo-600 `#4f46e5` / hover `#4338ca` (로고 인디고/시안 그라디언트 정합)
- destructive: red-50/100/200/700
- pinned ★: indigo-50/200/600
- form: 라벨 text-xs / input·textarea text-sm h-10 px-3 py-2 / 액션 버튼 text-xs px-3 py-2
- 좌측 brief 폼 ↔ 우측 inspector 폼 사이즈 정합

---

## 알려진 한계 / 다음 마일스톤 후보

- **m3-generate-stream** — 스트리밍 응답 (vendor-specific CLI batch 한계, 어려움)
- container 노드(section/hero/card/list/form) type 변경 미지원 — children 처리 복잡
- 캔버스 zoom CSS `zoom` property — Firefox는 최근 버전만 지원

---

## dev 시작

```sh
# api (port 3001) + web (port 3000) 두 프로세스
pnpm --filter @dworks/web dev
DWORKS_DEBUG_SCHEMA=1 pnpm --filter @dworks/api dev
```

stale 캐시 의심 시:
```sh
pnpm --filter @dworks/web dev:fresh   # .next 정리 후 dev
# or
pnpm --filter @dworks/web clean       # .next 정리만
```

---

## 환경 변수 (api)

- `DWORKS_DEBUG_SCHEMA=1` — schema-failure 시 server console에 issues + raw + sanitized
- `DWORKS_LLM_TIMEOUT_MS` — LLM CLI timeout (default 90s)
- `DWORKS_GENERATE_RETRIES` — schema/parse 422 자동 재시도 (default 1)
- `DWORKS_LLM_PROVIDERS` — provider chain (default claude,codex,gemini)

---

## 자율 모드 학습 (cleanup 사이클에서)

자율 모드에서 ABSORB 27~33 동안 _풍부도 시각화_ 같은 폴리시 토픽이 새끼치며 mandate에서 이탈한 신호가 누적됨. 사용자 정정으로 ABSORB 34 cleanup + ABSORB 35 마감.

다음 자율 진행 시 검토 기준:
1. 사용자가 _직접_ 요구한 mandate 영역인가
2. 디자이너가 _직접 사용하는 툴_ 가치인가
3. 메트릭/통계/시각화 등 _메타 정보_는 사용자 요구 없으면 추가 X
4. UI 요소 추가 전 _제거 가능_한지 먼저 검토
5. _일 벌리기보단 정리/마감_ 우선

[Claude]
