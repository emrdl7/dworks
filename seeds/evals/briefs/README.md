# Design Works eval briefs

Codex 생성 품질 회귀 테스트용 표준 brief 세트다. 각 파일은 생성 입력과 기대 조건을 함께 담는다.

## 사용 원칙

- 같은 brief를 반복 생성해 hard fail, schema 누락, 와이어프레임성 결과를 추적한다.
- `expected.requiredSections`는 결과 HTML에 반드시 드러나야 하는 정보 구조다.
- `expected.forbiddenPatterns`는 프롬프트/검증 개선 시 우선 제거할 패턴이다.
- `expected.mobileRisks`는 440px 모바일 검수에서 반드시 확인할 위험이다.

## 실행

- schema 검증: `pnpm eval:briefs`
- schema 결과 저장: `pnpm eval:briefs:write`
- API live 생성 검증 및 결과 저장: `pnpm eval:briefs:live`

`--live`는 기본으로 `http://localhost:3001/generate`를 호출한다. 다른 API 주소를 쓰려면 `DESIGN_WORKS_API_BASE`를 지정한다. `--write`를 쓰면 `seeds/evals/results/latest.json`과 timestamp 파일이 함께 생성되어 결과 이력이 누적된다.
