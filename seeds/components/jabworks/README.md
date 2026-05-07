# jabworks 어댑터 컴포넌트 시드

Design Works 1차 베이스. 12개 컴포넌트.

## 상태 (Phase 1 Week 1 placeholder)

12개 모두 JSON 메타데이터 + React 구현 scaffold 완료. 정확한 토큰 binding/시각 디자인은 jabworks 디자이너 워크숍에서 확정.

## 1차 12개

`docs/05-COMPONENT-CATALOG.md` 참조.

| # | id | JSON | React | 비고 |
|---|----|----|-----|------|
| 1 | `jabworks.button` | ✓ | stable | variant 5 × size 3 × state 6 |
| 2 | `jabworks.stack` | ✓ | stable | 리듬 강제 핵심 |
| 3 | `jabworks.card` | ✓ | stable | elevation sm/md/lg |
| 4 | `jabworks.input-text` | ✓ | stable | label + error + helper |
| 5 | `jabworks.form-group` | ✓ | stable | fieldset + legend |
| 6 | `jabworks.layout.basic` | ✓ | stable | header/main/footer + skip-nav |
| 7 | `jabworks.textarea` | ✓ | placeholder | 워크숍 후 정식 구현 |
| 8 | `jabworks.select` | ✓ | placeholder | 워크숍 후 정식 구현 |
| 9 | `jabworks.checkbox-radio` | ✓ | placeholder | 워크숍 후 정식 구현 |
| 10 | `jabworks.modal` | ✓ | placeholder | 포커스 트랩은 워크숍 후 |
| 11 | `jabworks.toast` | ✓ | placeholder | 워크숍 후 정식 구현 |
| 12 | `jabworks.table` | ✓ | placeholder | 정렬 인터랙션 워크숍 후 |

## stable vs placeholder 의미

- **stable**: 시멘틱 마크업 + a11y + 토큰 alias 사용까지 정합. 시각 디테일은 워크숍에서 다듬음
- **placeholder**: 시멘틱·a11y는 정확하나 시각은 v0 임시. 워크숍 후 토큰 binding과 인터랙션 정식화

워크숍 진입 시점에 `Placeholder.tsx`의 6종을 분리된 파일로 승격 + 인터랙션 보완.

## 메타데이터 schema

`docs/05-COMPONENT-CATALOG.md` §2 참조. KRDS 어댑터와의 차이점:

- `adapter: "jabworks"`
- `krdsLevel` 필드 **없음** (KRDS 어댑터에만)
- `states.required` 필수
- `exemplaryUsages` 필드 (이전 `certifiedExamples` 대체)
