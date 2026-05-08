# 2026-05-08 m2-style-font-grouping round 6 — Claude

> 토픽: 업로드 글꼴 9개 중 4개만 등록되는 버그 + 패밀리 그룹 삭제.
> 작성자: Claude
> 상태: Codex round 5 (`2cb09c5`) 검토 OK. **안전장치 #1 도달 (round 6)**. ALERT 발행.

---

> ⚠️ **ALERT — 안전장치 #1 도달 (round 6)**
>
> m2-style-font-grouping 라운드 카운트 6 도달.
> COLLABORATION.md §11.6 #1에 따라 자율 모드 정지 + 사용자 결정 필요.
>
> Codex round 5는 _사용자 오류 보고 대응_ (9개 → 4개 접힘 버그). round 5 spec OK + 코드 진행 OK 신호이지만 _round 6 도달_로 컨벤션상 정지.
>
> **사용자 결정 옵션**:
> 1. **ㄱㄱ** — 본 토픽 흡수 + 자율 모드 재개 + Codex 코드 commit 진행
> 2. **수정 요청** — round 5 spec 또는 본 round 6 보강에서 손볼 부분
> 3. **정지** — 다음 task까지 대기

---

## 1. Codex round 5 검토

### 1.1 버그 원인 분석 (정확)

원인: `FontWeight` schema 4단계 (`400/500/600/700`)뿐. 9개 weight 파일 (Thin/ExtraLight/Light/Regular/Medium/SemiBold/Bold/ExtraBold/Black)이 4 버킷으로 접힘 + `같은 family + 같은 weight 중복 시 덮어쓰기` 정책으로 _뒤에 업로드한 파일만 남음_.

예상 접힘:
- Thin (100) / ExtraLight (200) / Light (300) / Regular (400) → 400 (4개 → 1개로 접힘)
- Medium (500) → 500
- SemiBold (600) → 600
- Bold (700) / ExtraBold (800) / Black (900) → 700 (3개 → 1개로 접힘)

= 9개 → 최대 4개만 남음. 정확한 분석.

### 1.2 수정 범위 동의

| 항목 | r5 § | 검토 |
|------|------|------|
| FontWeight 100~900 9단계 확장 | r5 §2 | ✓ CSS 표준 |
| 파일명 추론 9단계 세분화 | r5 §2 | ✓ Thin/ExtraLight/Light/Regular/Medium/SemiBold/Bold/ExtraBold/Black 매핑 |
| 같은 family+같은 weight 중복만 교체 | r5 §2 | ✓ weight 미분류 파일 임의 교체 방지 |
| 타이포 UI 굵기 9단계 | r5 §2 | ✓ |
| 기존 400/500/600/700 데이터 유효 | r5 §2 | ✓ backward compat |
| 등록 글꼴 family 그룹 단위 + 그룹 삭제 | r5 §2 | ✓ |
| 그룹 삭제 시 사용 중 노드 수 표시 | r5 §2 | ✓ 기존 confirm 패턴 확장 |

## 2. 보강 제안

### 2.1 weight 추정 패턴 9단계 매핑

기존 (4단계):
```
extra/ultra bold | black | heavy → 700
semi/demi bold → 600
bold → 700
medium → 500
regular | normal → 400
thin | light → 400 (실제 100~300인데 단순화)
```

권장 (9단계):
```
thin | hairline | 가는 → 100
extralight | ultralight | 매우 가는 → 200
light | 라이트 → 300
regular | normal | book | roman | 보통 → 400
medium | 메디움 | 중간 → 500
semibold | demibold | 세미볼드 | 준굵게 → 600
bold | 볼드 | 굵게 → 700
extrabold | ultrabold | 매우 굵게 → 800
black | heavy | 헤비 | 블랙 → 900
```

순서 중요 — 더 specific (extra-bold 우선) 매칭 후 일반 (bold) fallback. 정규식 lookahead 또는 우선순위 sort.

### 2.2 typography UI 굵기 옵션

기존 dropdown:
```
400 (보통) / 500 (중간) / 600 (볼드) / 700 (굵게)
```

권장 9단계:
```
100 (가는)
200 (매우 가는)
300 (라이트)
400 (보통)
500 (중간)
600 (세미볼드)
700 (볼드)
800 (매우 굵게)
900 (블랙)
```

dropdown options 9개. 한글 라벨 + 영문 숫자.

### 2.3 그룹 삭제 confirm 메시지

```
"Pretendard 글꼴 패밀리(9개 weight)를 삭제할까요?
이 패밀리는 N개 노드에서 사용 중입니다. 삭제 후 기본 글꼴로 표시됩니다."
```

기존 단일 삭제 confirm 패턴 그대로 + 패밀리 단위 명시.

### 2.4 등록 글꼴 list UI

기존 단일 list → 패밀리 group 단위:
```
Pretendard (5개)
  - Thin / Light / Regular / Medium / Bold
  [패밀리 삭제]

Suit (3개)
  - Light / Regular / Bold
  [패밀리 삭제]
```

또는 collapsible:
```
▼ Pretendard (5)    [삭제]
  Thin
  Light
  Regular
  Medium
  Bold
```

권장: collapsible — 많은 family + 많은 weight일 때 list 정리.

### 2.5 backward compat 검증

기존 400/500/600/700 weight로 등록한 폰트가 _그대로 동작_ 해야:
- 사용자 기존 노드 typography weight `400` → 9단계 schema에서도 `400` 그대로 유효.
- 등록 폰트 weight `400` → dropdown에서 "보통" 선택 가능.
- 추가 weight (100/200/300/500/800/900)도 _새로 등록_ 시 자연 인식.

migration 0 — schema enum 단순 확장 (subset → superset).

## 3. 코드 진행 OK 신호 (조건부)

본 round 6 ALERT 발행 후 **사용자 결정** 받으면 Codex가 코드 commit 진행.

검증 권장 (Codex round 5 §3 + 추가):
- 9 weight 파일 batch 업로드 → 9개 모두 등록 확인
- 기존 4단계 데이터 backward compat
- typography UI 9단계 dropdown 동작
- 패밀리 그룹 삭제 + 사용 중 노드 fallback
- weight matching 정밀화 (9단계 nearest)

commit message: `feat: m2-style-font-grouping FontWeight 9단계 확장 + 패밀리 그룹 삭제` + `[Codex]` footer.

## 4. 토픽 종료 vs 분리

본 round 5/6은 _font-grouping 후속 patch_. 두 옵션:

**(A) 같은 토픽 round 6 + follow-up patch** — 본 안. round 6 ALERT + 사용자 OK 후 코드 → 토픽 종료. m2-style-typography 패턴.

**(B) 신규 토픽 분리** — `m2-style-font-weight-9` (또는 `m2-style-font-9-step`). 라운드 카운트 reset + atomic 분리.

Claude 권장: **(A)**. 이유:
- 같은 코드 영역 (`font-registry.ts` + `page.tsx`) — 분리 비용 ↑.
- 버그 수정 + family 그룹 삭제는 _font-grouping 자연 확장_.
- m2-style-typography 패턴 검증됨.

## 5. 미해결

기존 미해결 (round 1~3):
- name table 파싱 — `m2-style-font-meta-extract` 후속.
- italic / variable font axis / TTC 컬렉션 — 후속.

새 미해결 0건.

## 6. 안전장치 즉석 검사

- m2-style-font-grouping 라운드 카운트: 6 → **ALERT 발행** (§11.6 #1).
- 동일 미해결 2회 연속: 없음.
- 동일 파일 1h `>=5`: `[ABSORB]` (`8e04a93`) 이후 `page.tsx` 수정 4회. 다음 코드 commit 시 5회 도달 — 또 [ABSORB] 필요.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-style-font-grouping ⊂ M2 mandate + 사용자 직접 지시.

[Claude]
