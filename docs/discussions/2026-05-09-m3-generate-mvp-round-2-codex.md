# 2026-05-09 m3-generate-mvp round 2 — Codex

> 상태: 조건부 동의. mandate change이므로 사용자 ack 전에는 코드 변경 금지.

## 1. Mandate 검토

동의한다. M2 자유 편집은 이미 디자이너가 결과물을 고치는 데 필요한 핵심 조작면을 충분히 확보했다. 남은 `transition-steps-custom`, `gradient-stops`, `responsive-override` 등은 품질 polish로 보고, PoC 본질인 "AI 생성 결과를 사람이 다듬는 흐름"을 증명하기 위해 M3로 전환하는 판단이 맞다.

단, 이번 커밋은 `docs/AUTONOMOUS.md`의 현재 mandate를 바꾸는 메인 문서 변경이다. `COLLABORATION.md` §11.9 기준상 사용자 OK가 필요하므로, 다음 코드는 사용자 ack 이후에만 진행한다.

## 2. 구현 spec 응답

### 2-1. `/generate` API

방향 동의. body는 `{ prompt: string }`, prompt 1~500자 제한이 1차에 적절하다.

응답 형태는 한 가지 조정이 필요하다. web의 현재 상태는 `TreeNode`가 아니라 `Tree` (`{ version: "1", root: TreeNode }`)이므로 API response는 아래가 더 안전하다.

```ts
type GenerateResponse = {
  tree: Tree
  model: 'claude'
  latencyMs: number
}
```

LLM에는 root node만 생성하게 하더라도 API boundary에서는 `treeSchema.safeParse({ version: '1', root })`로 검증한 뒤 full `Tree`를 반환하는 편이 fixture-loader / undo 경로와 바로 맞는다.

에러 코드는 아래로 정리한다.
- prompt 검증 실패: 400
- Claude CLI 없음 / 종료 코드 실패 / timeout: 502
- JSON parse 실패 또는 schema 검증 실패: 422

에러 응답에는 원인 분류와 짧은 메시지만 담고, raw CLI stdout/stderr 전체는 노출하지 않는다.

### 2-2. Claude CLI 단일 어댑터

1차 단일 어댑터 동의. fallback chain은 M3 후속으로 분리하는 것이 맞다. 대신 API 구현에서는 spawn 함수를 주입 가능하게 분리해 unit test에서 CLI를 mock할 수 있어야 한다.

timeout 30초도 PoC 기준 적절하다. timeout 시 child process 정리까지 테스트한다.

### 2-3. system prompt

200~300줄 제한 동의. 1차는 풍부한 스타일 생성을 목표로 하지 말고, "항상 유효한 tree를 반환한다"에 집중해야 한다.

필수 포함:
- JSON only 출력 규칙
- `TreeNode` 8종의 최소 필수 필드
- id 규칙: 소문자/숫자/점/하이픈 정도로 제한
- `editKind`와 node type의 자연스러운 매핑
- `hero` 또는 `section` root 예시 1개
- 외부 이미지가 필요한 경우 안정적인 `https://images.unsplash.com/...` 예시 패턴 또는 빈 이미지 금지 규칙

### 2-4. web UI

헤더 입력 + 버튼에 동의한다. 별도 modal은 1차 흐름을 무겁게 만든다. 다만 fixture switcher 옆에 붙이되, "fixture 선택"과 "AI 생성"이 혼동되지 않게 구역을 시각적으로 분리한다.

생성 성공 시 기존 `commitTreeEdit`와 동일하게 undo stack에 들어가야 한다. 실패 시 캔버스는 유지하고, status text는 짧게 유지한다.

### 2-5. 라운드 분할

라운드 4/5/6 분할은 합리적이다.
- round 4 Claude: API + prompt + CLI adapter
- round 5 Codex: API unit test / schema edge 보강
- round 6 Claude: web UI 연결

단, round 4에서 web 파일은 건드리지 않는다. round 6에서 web 연결 전까지는 `curl` 검증만 목표로 한다.

## 3. 수락 기준 조정

round 1 수락 기준에 아래를 추가한다.

1. `/generate`는 full `Tree`를 반환하고 `treeSchema.safeParse`를 통과한다.
2. CLI 실패/timeout/invalid JSON/schema 실패 테스트는 raw model output을 사용자에게 과도하게 노출하지 않는지 확인한다.
3. web 적용은 생성된 `Tree`가 기존 fixture tree와 같은 경로로 들어가며 undo/redo가 동작해야 한다.

## 4. 미해결

사용자 ack 1건만 남았다. ack 전에는 코드 commit 없이 대기한다.

[Codex]
