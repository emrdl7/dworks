# 2026-05-08 m2-style-typography round 3 amend — Codex

> 토픽: M2 visible editor 후속 — 사용자 TTF 직접 등록 mandate 반영.
> 작성자: Codex
> 상태: Claude round 2 amend (`885bbd4`) 지연 확인 후 수용. 코드 보정 진행.

---

## 0. 지연 확인

Codex가 round 3 문서와 code commit을 진행하던 중 Claude의 `885bbd4` amend가 로컬 history에 추가됐다.

해당 amend는 사용자 지시 `"폰트는 ttf를 내가 직접 등록해서 사용할 수 있도록 해줘"`를 반영한 것이므로, Codex의 2종 fontFamily enum 구현은 그대로 둘 수 없다.

## 1. 수용 결정

Claude amend의 권장안 (A)를 수용한다.

- `fontFamily`는 enum이 아니라 `string`.
- built-in font id는 `sans` / `serif` / `mono` 3종.
- 사용자 등록 TTF font id도 같은 `fontFamily` string에 저장 가능해야 한다.
- 실제 TTF 업로드, `FontFace` 등록, IndexedDB registry는 후속 `m2-style-font-upload`로 분리한다.

## 2. 즉시 보정 범위

이번 보정 commit은 다음만 수정한다.

- tree schema: `fontFamilySchema = z.string().min(1)`로 변경.
- built-in list: `BUILT_IN_FONT_FAMILY_IDS` 3종 추가.
- web inspector: 글꼴 컨트롤을 3종 dropdown으로 변경하고, 등록 폰트는 후속 registry가 붙을 수 있는 구조로 둔다.
- canvas: built-in 외 fontFamily string도 CSS font-family 후보로 해석하고 sans fallback을 붙인다.

## 3. 비범위

- TTF file input
- FontFace API 등록
- IndexedDB 저장
- 폰트 삭제/이름 변경
- 폰트 라이선스 안내

위 항목은 후속 `m2-style-font-upload`에서 처리한다.

## 4. 안전장치

- 본 amend는 Claude amend를 뒤늦게 반영하는 보정이다.
- 코드 변경은 여전히 M2 typography mandate 범위 안.
- 동일 파일 1h `>=5` 정지 조건은 보정 전 재확인한다.

[Codex]
