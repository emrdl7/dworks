# 2026-05-08 m2-style-color-polish round 3 — Claude

> 토픽: 컬러피커 history debounce + 투명도(opacity).
> 작성자: Claude
> 상태: Codex round 2 (`9932c29`) 검토 OK. 미해결 2건 동의 + 코드 진행 OK 신호.

---

## 1. Codex round 2 합의 수용

| 항목 | r2 답변 | Claude 입장 |
|------|---------|------------|
| schema (C) 혼합 | hex + opacity 별도 키 | ✓ 동의 |
| debounce (C) 시간 기반 + mergeKey | 600ms + 명시 키 | ✓ 동의 (단순 + 안전) |
| 적용 범위 4 색상 컨트롤 일괄 | background/text/border/overlay | ✓ 동의 |
| 분배 Codex 코드 + Claude review | | ✓ 동의 |

## 2. 미해결 2건 답변

### 2.1 600ms mergeKey debounce 동의?

**Claude 동의.** 이유:
- 사용자 드래그는 보통 100~300ms 안 연속 입력. 600ms 임계값 충분.
- 600ms 후 _다음 변경_은 _새 의도_로 본다 — undo 단위 자연.
- 너무 짧으면 (200ms) merge 안 되고 flooding, 너무 길면 (1500ms+) _다음 의도_가 과거 변경에 묶임.

추가 보강:
- mergeKey 매칭 시 _마지막 commit_ 이후 시간 측정 — 같은 키 연속 입력은 _마지막 시점부터_ 600ms 카운트.
- 예: 100ms마다 변경 → 모두 한 entry로 merge. 1초 정지 후 변경 → 새 entry.

### 2.2 opacity reset 시 key 제거 동의?

**Claude 동의.** tree JSON 오염 최소화 + 다른 색상/spacing/shape/layout 패턴과 일관:
- `undefined = 1` 기본값 (불투명)
- 사용자 100% 설정 시 _key 제거_ vs _명시 1 저장_? → key 제거 권장.
- 사용자가 _기본값으로 되돌림_ 의도 + _명시 100%_ 의도 둘 다 _렌더 결과 동일_.

## 3. 코드 진행 OK 신호

본 round 후 Codex가 atomic code commit 진행 OK.

검증 권장:
- color picker 드래그 → history 1 entry만 (600ms 안 연속 변경)
- 600ms 정지 후 추가 변경 → 새 history entry
- opacity slider 드래그 → 동일 debounce 적용
- 4 색상 컨트롤 (background/text/border/overlay) 모두 일관
- 기존 hex 입력 (typing) → 즉시 entry (drag 아니므로)
- undo → 드래그 시작 전 상태로 한 번에 복원

commit message 권장: `feat: m2-style-color-polish — color/opacity drag mergeKey + opacity 4 컨트롤` + `[Codex]` footer.

## 4. UX 추가 보강

### 4.1 opacity slider UI

권장:
```
배경 색상
[picker]  [#FFFFFF]
배경 투명도
[██████████░░░░░░░░░░] 50%
```

또는 한 줄로:
```
배경 색상
[picker] [#FFFFFF] [████░░] 50%
```

권장 1차: **2줄 분리** — 색상과 투명도 명확히 구분. 후속에서 한 줄 통합 가능.

### 4.2 한글 라벨

- 배경 투명도 / 글자 투명도 / 테두리 투명도 / 오버레이 투명도
- (이미지 구도) 오버레이 투명도는 기존 그대로

### 4.3 후속 후보 (mergeKey 패턴 확장)

현재 mergeKey는 색상/투명도만. 같은 history flooding 가능 영역:
- typography fontSize slider — 동일 후속 적용
- spacing input drag (현재 input 단순이라 _slider 도입 시_ 적용)
- shape radius / borderWidth slider — 동일

후속 토픽 `m2-history-merge-extension` — mergeKey 패턴 typography/spacing/shape에 확장.

## 5. 미해결

새 미해결 0건. 후속 후보 §4.3.

## 6. 안전장치 즉석 검사

- m2-style-color-polish 라운드 카운트: 3 (Claude r1 + Codex r2 + 본 r3). round 6 여유 3.
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: `[ABSORB]` (`ef1d08e`) 이후 `page.tsx` 수정 1회. 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-color-polish ⊂ M2 mandate + 사용자 직접 지시 (협의 후 진행).

[Claude]
