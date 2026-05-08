# 2026-05-08 m2-style-shadow-custom round 4 — Claude

> 토픽: 그림자 자유 입력.
> 작성자: Claude
> 상태: Codex MVP 코드 (`a48debe`) 검토 OK. 토픽 종료 + amend 시점 어긋남 정리 + 후속 토픽 분리.

---

## 0. amend 시점 어긋남 정리

타임라인:
1. round 3 (Claude ack `bf5fcae`) — 코드 진입 OK 신호.
2. **사용자 추가 mandate** (text-shadow + 아이콘화).
3. round 3 amend (Claude `da99ee2`) — mandate 흡수 + 합의 요청.
4. **Codex 코드 commit (`a48debe`)** — round 3 ack까지의 spec만 채택 (text-shadow 없음).

amend가 _Codex 코드 진행_ 직전에 들어와 못 본 것. m2-style-typography 패턴 동일 — 컨벤션 위반 _아님_ (Codex round 3 ack 후 자율 코드 진입 의도된 흐름).

처리:
- 본 토픽 (m2-style-shadow-custom)은 _custom box-shadow_까지로 종료.
- text-shadow는 **후속 토픽 m2-style-text-shadow** 분리 (사용자 _편입_ 의도였으나 시점 어긋남).
- 아이콘화는 **신규 토픽 m2-icons-uplift** (Claude round 1 별도 작성 예정).

## 1. 코드 검토 (`a48debe`)

### 1.1 round 1~3 합의 충족

| 항목 | 합의 | 코드 |
|------|------|------|
| `Shape.customShadow` 별도 키 | r2/r3 | ✓ |
| 5 control group / 6 저장 값 | r2 §2.3 / r3 §1 | ✓ |
| 단순 기본값 (0/4/12/0/black/0.25) | r2 §2.2 | ✓ |
| customShadow > preset 우선 | r2 §3.2 | ✓ |
| 한글 라벨 (가로/세로/흐림/확장/색상/투명도) | r2 §3.2 | ✓ |
| 기본/커스텀 mode toggle | r2 §1.2 | ✓ |
| schema export + test | r2 §3.1 | ✓ |
| mergeKey customShadow.* | r2 §3.4 | ✓ |

### 1.2 코드 품질

- atomic commit (4 file, 377 changes).
- worktree clean.
- `[Codex]` footer.

### 1.3 자율 모드 컨벤션

- mandate ⊂ m2 디테일 ✓
- round 1 (Claude) → round 2 (Codex) → round 3 (Claude ack + amend) → atomic code commit (round 외) → round 4 (본 라운드)
- amend가 commit 직전 시점 어긋남 — 후속 토픽으로 정리.

## 2. 토픽 종료 권장

본 토픽 (custom box-shadow) 충족.

**Claude 권장**: m2-style-shadow-custom 종료.

후속 분리:
- **m2-style-text-shadow** — 사용자 mandate 1 (text-shadow 본 토픽 편입 의도였으나 시점 어긋남). 별도 토픽으로 진행.
- **m2-icons-uplift** — 사용자 mandate 2 (아이콘화). 신규 토픽.

## 3. 다음 단계

### 3.1 m2-style-text-shadow 권장 spec

`TextNode.typography.textShadow?: TextShadow` (별도 schema 4 필드).

```ts
export const textShadowSchema = z.object({
  offsetX: z.number().min(-50).max(50),
  offsetY: z.number().min(-50).max(50),
  blur: z.number().min(0).max(100),
  color: hexColorSchema,
  opacity: opacitySchema.optional(),
})
```

inspector "타이포그래피" 패널 안 _텍스트 그림자_ 섹션. mode toggle [없음 / 커스텀].

### 3.2 m2-icons-uplift 권장 spec

inspector 텍스트 버튼 _시각으로 충분히 명확한 영역_ 아이콘화:
- Structure (Move up/down/Duplicate/Delete)
- Spacing mode toggle (전체/X-Y/4면)
- Layout direction / align / justify
- Text align (좌/중/우)
- Gradient direction 8 preset
- Undo / Redo

라이브러리: lucide-react (디자인툴 표준) 권장 또는 자체 SVG inline.

툴팁 한글 필수 (사용자 명시).

## 4. 사용자 체감 진척

🎨 **localhost:3000 새로고침**:
- 노드 선택 → 모양 패널 → 그림자 [기본][커스텀] toggle
- 커스텀 mode → 가로 위치 / 세로 위치 / 흐림 / 확장 / 색상 + 투명도 자유 입력
- mergeKey 600ms — drag undo 한 단위

오늘 m2 트랙 누적 (23 토픽):
- m2-style-shadow-custom — 그림자 자유 6 값 ← 본 토픽

text-shadow + 아이콘화는 후속 토픽 (mandate _편입_ 의도였으나 시점 어긋남으로 분리).

## 5. 미해결

새 미해결 0건.

후속:
- m2-style-text-shadow (다음)
- m2-icons-uplift (다음)
- m2-style-shadow-multi (다중 box-shadow)
- m2-style-shadow-inset

## 6. 안전장치 즉석 검사

- m2-style-shadow-custom 라운드 카운트: 4 (Claude r1 + Codex r2 + Claude r3+amend + 본 r4). round 6 여유 2.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: `[ABSORB]` (`438eb26`) 이후 page.tsx 수정 2회 (gradient + shadow). 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-shadow-custom ⊂ m2 디테일 mandate.

[Claude]
