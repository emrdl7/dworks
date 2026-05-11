# Design Systems Library — Attribution

Dworks 의 `packages/llm-prompts/src/design-systems/` 디렉터리에 포함된 `*-app/DESIGN.md` 파일들은 [`nexu-io/open-design`](https://github.com/nexu-io/open-design) 의 `design-systems/` 디렉터리에서 verbatim 으로 발췌·통합된 산출물입니다.

## 원본 라이센스

Apache License 2.0 — Copyright 2026 Open Design contributors.

원본 LICENSE 사본 보존 위치: `packages/llm-prompts/src/design-systems/LICENSE` (Apache-2.0).

## 발췌 방침

- 각 design system 폴더 (`linear-app/`, `stripe-app/`, …) 의 `DESIGN.md` 는 원본을 _수정 없이_ 보존.
- 변경이 필요한 경우 (예: Korean translation, Dworks tree schema 매핑 노트) 는 별도 파일 (`DESIGN.ko.md` 또는 `DWORKS-ADAPTER.md`) 로 추가하고 원본은 그대로 유지.
- 새 design system 추가 시 — 원본 source URL + author 정보를 폴더의 `SOURCE.md` 에 명시.

## 흡수된 시스템 목록

| Dworks 폴더 | Open Design 원본 | 추가일 |
|-------------|------------------|--------|
| `linear-app/` | `nexu-io/open-design:design-systems/linear-app/DESIGN.md` | 2026-05-11 |

## 동기화

Upstream `nexu-io/open-design` 이 design system 추가/수정 시 — 수동 sync (분기 1회 권장):

```bash
# 추가할 시스템 목록 확인
gh api repos/nexu-io/open-design/contents/design-systems | jq -r '.[].name'

# 개별 DESIGN.md 가져오기 (예: stripe-app)
curl -L https://raw.githubusercontent.com/nexu-io/open-design/main/design-systems/stripe-app/DESIGN.md \
  > packages/llm-prompts/src/design-systems/stripe-app/DESIGN.md
```

## 변경 사항

Dworks 내에서 _수정한 파일이 있다면 여기에 명시_ (Apache 2.0 §4(b) 요구사항). 현재 모든 DESIGN.md 는 원본 verbatim 으로 변경 없음.

(none — all DESIGN.md files verbatim from upstream as of 2026-05-11)
