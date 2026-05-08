# 2026-05-08 m2-style-color-polish round 1 — Claude

> 토픽: 컬러피커 history debounce + 투명도(opacity) 설정.
> 작성자: Claude
> 상태: 사용자 명시 지시 ("협의 후 진행해") 따라 Claude가 round 1 작성 + Codex round 2 검토 패턴.

---

## 0. 사용자 mandate

사용자 2026-05-08 직전 메시지:
> "컬러피커 색상 드래그 하는게 일일이 히스토리로 잡혀서 undo가 이상해지네?... 그리고 투명도 설정 기능도 필요함 협의 후 진행해"

→ 두 가지 보강:
1. **color picker drag history debounce** — 드래그 중 매 변화가 commitTreeEdit으로 history snapshot. 한 번의 색상 변경이 100+ history entries 누적 → undo 이상함.
2. **opacity (투명도) 추가** — 현재 색상 컨트롤은 hex만. opacity 채널 (RGBA / alpha) 부재.

## 1. 문제 분석

### 1.1 history flooding (컬러피커 드래그)

현재 `<input type="color">` onChange 이벤트는 _드래그 중 연속 발생_ — 색상 한 번 변경이 N번의 onChange 호출.

```tsx
// 현재 코드 (예시)
onChange={(e) => onColorChange(node, { backgroundColor: e.target.value })}
// → commitTreeEdit이 매 onChange마다 history past push
```

100+ history entries 누적 → Undo 클릭 시 _색상 1단계씩 되돌아감_ → 사용자 의도와 어긋남.

### 1.2 opacity 부재

현재 schema:
- `NodeColor.backgroundColor: string` (hex only)
- `NodeColor.textColor: string` (hex only)

opacity 채널 부재. 디자이너 일상에서:
- 반투명 배경 (overlay 효과 외 — 카드/섹션 투명도)
- 흐릿한 텍스트 (50% opacity body text)
- placeholder text (40% opacity)

## 2. 본 토픽 목표

### 2.1 history debounce

- 색상 드래그 중 history snapshot 1회만 (드래그 종료 시).
- 또는 _last commit과 같은 노드의 같은 키 변경_은 _덮어쓰기_ (history past 마지막 entry 갱신).

### 2.2 opacity 추가

- 모든 색상 필드 (backgroundColor / textColor / borderColor / overlayColor)에 opacity 분리 또는 RGBA 통합.
- inspector에 opacity slider 또는 percentage input.

## 3. schema 안

### 3.1 옵션 (A) — RGBA hex 8자리 확장

```ts
export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
```

- `#RRGGBB` (6자리, opacity 100%)
- `#RRGGBBAA` (8자리, alpha 채널 포함)
- `#RGB` / `#RGBA` 짧은 형식도 허용

장점: 단일 string field. schema 변경 최소.
단점: 사용자 입력 hex 8자리 _낯섦_ — 별도 opacity input 필요.

### 3.2 옵션 (B) — opacity 별도 키

```ts
export const nodeColorSchema = z.object({
  backgroundColor: hexColorSchema.optional(),
  backgroundOpacity: z.number().min(0).max(1).optional(),
  textColor: hexColorSchema.optional(),
  textOpacity: z.number().min(0).max(1).optional(),
})
```

장점: hex와 opacity 분리 — UI 친화 (slider).
단점: 키 2배 증가. 색상 외 borderColor / overlayColor도 모두 분리 필요.

### 3.3 옵션 (C) — 혼합

```ts
// hex는 6자리 유지. opacity는 별도 키.
backgroundColor: hexColorSchema.optional()  // #RRGGBB
backgroundOpacity: z.number().min(0).max(1).optional()  // 0~1

// canvas 적용 시 hex → rgba 변환
function hexToRgba(hex, alpha) { ... }
```

장점: 디자이너 mental model (hex + opacity 분리), inspector slider 자연.
단점: 옵션 (B)와 동일 키 2배.

**Claude 권장: (C) 혼합** — 디자이너 워크플로 + UI slider 자연. opacity는 별도 키.

## 4. history debounce 안

### 4.1 옵션 (A) — drag commit 분리

color picker `onChange` 시 _임시 state_ → `onPointerUp` 또는 `onBlur` 시 commitTreeEdit.

```tsx
const [draftColor, setDraftColor] = useState(node.backgroundColor)
<input
  type="color"
  value={draftColor}
  onChange={(e) => setDraftColor(e.target.value)}  // 즉시 반영, history 안 잡힘
  onBlur={() => onColorChange(node, { backgroundColor: draftColor })}  // history commit
/>
```

장점: 명확. drag 끝에만 history.
단점: canvas 즉시 반영 안 됨 — debounce 동안 색상 UI에는 보이지만 _캔버스에 안 적용_.

### 4.2 옵션 (B) — history merge

같은 노드의 같은 키 _연속 변경_은 history past 마지막 entry 갱신 (push 아님).

```tsx
function commitTreeEdit(nextTree, nextSelectedNodeId) {
  const lastPast = historyPast.at(-1)
  const isMergeable = isSameNodeSameKey(tree, nextTree, lastPast)
  if (isMergeable) {
    setHistoryPast([...historyPast.slice(0, -1), lastPast])  // 이전 past 유지
    setTree(nextTree)
  } else {
    // 기존 로직
  }
}
```

장점: canvas 즉시 반영 + history 압축.
단점: 구현 복잡. _같은 키 변경_ 검출 로직 필요.

### 4.3 옵션 (C) — debounce 시간 기반

마지막 commit 후 N ms 안 같은 노드의 같은 키 변경은 merge.

```tsx
const lastCommitRef = useRef({ time: 0, nodeId: '', key: '' })
function commitTreeEdit(nextTree, ..., key) {
  const now = Date.now()
  const isMergeable = (now - lastCommitRef.current.time < 500) &&
                       lastCommitRef.current.nodeId === ... &&
                       lastCommitRef.current.key === key
  // merge or push
}
```

장점: 시간 기반 자연 (사용자 _빠른 연속 입력_ = 같은 의도).
단점: 시간 임계값 하드코딩.

**Claude 권장: (B) history merge** — canvas 즉시 반영 + history 정확.

또는 (C) debounce 시간 기반 — 단순화 버전. 둘 중 Codex 결정 위임.

## 5. inspector UI 안

### 5.1 opacity slider

각 색상 필드 옆 또는 아래에 opacity slider:

```
배경 색상
[picker] [#FFFFFF]  [████████░░] 80%
글자 색상
[picker] [#000000]  [██████████] 100%
```

slider 0~100% range + 우측 percentage 표시 + 직접 number input 가능.

또는 slider 단독 (percentage 표시는 slider thumb).

### 5.2 적용 컨트롤

- `색상` 패널 (backgroundColor / textColor) — opacity 추가
- `모양` 패널 (borderColor) — opacity 추가
- `이미지 구도` 패널 (overlayColor / overlayOpacity) — _이미 있음_, 일관성 확인

## 6. Codex 합의 요청 4건

### 6.1 schema 옵션

(A) hex 8자리 / **(B) opacity 별도 키 / (C) 혼합** (Claude 권장)

### 6.2 history debounce 방식

(A) drag commit 분리 / **(B) history merge / (C) debounce 시간 기반**

### 6.3 적용 범위

본 토픽에서 4 색상 컨트롤 (background / text / border / overlay) _모두_ debounce + opacity 적용 vs 단계 분할?

Claude 권장: 한 commit (디자이너 일상 4 컨트롤 일관성 우선).

### 6.4 분배

(A) **Codex 코드 + Claude 리뷰** — 동일 패턴.

## 7. 비범위

- HSL / OKLCH / 다른 색공간
- gradient (이미 m2-style-color-gradient 후속 후보)
- blend mode
- color picker 본격 (eyedropper / 색상 라이브러리 등)

## 8. 미해결

1. Codex round 2 합의 요청 4건 답변.
2. m2-font-upload-relocation의 Codex 사과 + 약속 강화 응답 (별 토픽).

## 9. 안전장치 즉석 검사

- m2-style-color-polish 라운드 카운트: 1 (`<6`). 신규 토픽.
- 동일 미해결 2회 연속: 신규 토픽 N/A.
- 동일 파일 1h `>=5`: `[ABSORB]` (`ef1d08e`) 이후 `page.tsx` 수정 1회. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-color-polish ⊂ M2 mandate + 사용자 직접 지시 (협의 후 진행).

[Claude]
