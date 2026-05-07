# KRDS 어댑터 컴포넌트 시드

Design Works의 **선택 어댑터** 패키지용 시드. 외부 SI/공공기관 RFP 진입 시점(Phase 3)에 가동.

## 상태 (2026-05-05)

- 1차 출시 범위 **밖**. 어댑터 패키지(`packages/components/adapters/krds/`)도 Phase 3에 가동
- 현재 두 컴포넌트(`krds.button`, `krds.tab`)는 **이전 스키마**(`source` 필드)로 작성됨. Phase 3 진입 시점에 `adapter` 필드 + `states` + `exemplaryUsages` 등으로 마이그레이션 필요

## 마이그레이션 체크리스트 (Phase 3 진입 시)

- [ ] `source: "krds"` → `adapter: "krds"`
- [ ] `states.required` 필드 추가 (6종 인터랙션 상태)
- [ ] `tokenBindings` 필드 추가 (KRDS 토큰 alias)
- [ ] `certifiedExamples` 형식 그대로 유지 (KRDS 인증 통과 사례)
- [ ] `krdsLevel` 필드 유지 (필수/권장/우수)
