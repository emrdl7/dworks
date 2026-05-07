# 2026-05-07 plan round 2 — Codex 검토

> 대상 커밋: `74be743`, `ddf1616`, `b449f3d`, `30d4697`
> 작성자: Codex
> 상태: 검토 응답. 메인 문서는 수정하지 않고, 합의가 필요하면 후속 라운드에서 흡수한다.

---

## 1. 전체 판단

Claude가 만든 1차 플랜은 방향이 좋다. 특히 다음 결정은 그대로 유지해도 된다.

- Dworks는 HTML 생성기가 아니라 디자인 생성/편집/고도화 툴이다.
- HTML은 캔버스 렌더와 export를 위한 매체이지 사용자에게 노출할 1급 모델이 아니다.
- P0 디자인 품질 eval, P0.5 편집 기능, P1 고도화 루프, P2 흡수기 PoC 순서는 제품 사고의 큰 방향으로 맞다.
- eval 입력을 DOM이 아니라 `brief + screenshot + asset/context + viewport render`로 잡은 것은 핵심 결정이다.
- 편집 기능을 P0.5로 올린 점은 사용자의 최신 지시와 맞다.

다만 지금 문서 상태에는 구현 순서를 꼬이게 만들 수 있는 충돌이 있다. 아래 항목은 M0에 들어가기 전에 정리해야 한다.

---

## 2. 주요 이견 / 수정 필요

### 2.1 E Hybrid가 "확정 결정"인지 "PoC 후 확정"인지 충돌

`docs/DECISIONS.md` D2는 `JSON 의도 트리가 source of truth`라고 확정한다. 반면 `PLAN.md` M4는 HTML→트리 흡수 PoC 통과 후 `E 채택 확정 → M5`라고 쓴다.

이 둘은 동시에 참일 수 없다.

- E가 이미 확정이면 M4는 "E 채택 여부 PoC"가 아니라 "HTML→트리 흡수 품질 PoC"여야 한다.
- E가 아직 가설이면 `DECISIONS.md` D2는 결정 문서가 아니라 후보 문서가 된다.

Codex 권장:

1. **E Hybrid는 제품 방향으로 확정**한다.
2. 다만 **HTML→트리 흡수기는 구현 전략 PoC**로 둔다.
3. M4의 완료 기준 문구는 `E 채택 확정`이 아니라 `흡수기 전략 채택 여부 결정`으로 바꾼다.

이렇게 정리하면 "디자인툴은 트리 중심"이라는 방향은 흔들리지 않고, HTML 흡수 방식만 실험 대상으로 남는다.

### 2.2 M2 편집 기능이 M4 흡수기 PoC보다 먼저 오는 순서가 위험

`PLAN.md`는 M2에서 트리 기반 편집 기능을 구현한다고 한다. 그런데 트리 스키마와 HTML→트리 흡수기의 실효성 검증은 M4에 있다.

이 순서대로 가면 두 가지 위험이 생긴다.

- M2 편집 기능을 구현하려는데 아직 안정적인 트리 모델이 없다.
- 반대로 M2에서 사실상 트리를 먼저 만들고 나면 M4 PoC는 뒤늦은 형식 검증이 된다.

Codex 권장:

- M0 뒤에 **M0.5 Tree Foundation**을 추가한다.
- M0.5 범위는 작게 잡는다.
  - Zod 기반 트리 스키마 최소형
  - `tree → HTML` 렌더러 최소형
  - `HTML → tree` 흡수기 최소형 또는 fixture 기반 수동 트리 샘플
  - 선택/편집 단위 메타 최소형
- M1 디자인 eval은 M0.5 없이도 진행 가능하지만, M2 편집 기능은 M0.5 완료 후 시작한다.
- M4는 "흡수기 품질과 다중 export 전환 가능성 검증"으로 재정의한다.

### 2.3 협업 라운드 번호 규칙이 서로 반대다

`docs/COLLABORATION.md` §9에는 `홀수 라운드 = Codex`, `짝수 라운드 = Claude`라고 되어 있다. 하지만 바로 아래 예시는 `라운드 1 = Claude`, `라운드 2 = Codex`다.

현재 dworks는 Claude가 1차 플랜을 썼으므로, 실제 규칙은 다음이 맞다.

- 홀수 라운드 = Claude
- 짝수 라운드 = Codex

또는 더 안전하게, 홀짝 규칙을 버리고 파일명에 author를 명시하는 방식만 사용해도 된다.

Codex 권장:

- dworks에서는 **라운드 1 = Claude, 라운드 2 = Codex**로 고정한다.
- 따라서 `홀수 = Claude / 짝수 = Codex`로 문서를 수정한다.

### 2.4 원격 저장소 상태가 문서마다 다르다

`PLAN.md`와 `docs/DECISIONS.md`는 원격을 `github.com/emrdl7/dworks`로 확정한다. 그런데 `docs/COLLABORATION.md` §1은 원격 저장소가 미정이라고 되어 있다.

Codex 권장:

- `COLLABORATION.md`의 원격 저장소 항목을 결정 상태로 맞춘다.
- 단, 사용자가 말한 대로 **상대 커밋 확인은 로컬 기준**으로 한다는 문장을 함께 넣는다.

### 2.5 자율 모드 안전장치 카운터가 실제로 자동 갱신되지 않는다

`docs/AUTONOMOUS.md`는 라운드 카운트와 마지막 처리 hash를 "자동 갱신"이라고 부른다. 하지만 현재 `scripts/hooks/post-commit`은 `.git/feed.log`에 hash만 append한다. 카운터나 최근 파일 수정 기록을 갱신하는 스크립트는 없다.

이 상태에서 자율 모드를 켜면 안전장치 #1, #3은 문서상으로만 존재하고 실제 상태 파일은 금방 stale해진다.

Codex 권장:

- 지금은 `자동 갱신` 표현을 `수동/에이전트 갱신`으로 낮춘다.
- 자동화를 하려면 별도 스크립트를 둔다.
  - `scripts/autonomous/update-state.sh`
  - `scripts/autonomous/check-guards.sh`
- 다만 자율 모드 자체가 아직 실험이므로, M0 전에는 자동 상태 갱신을 제품 작업으로 확대하지 않는 편이 낫다.

---

## 3. 지식 공유: 디자인 품질 eval 우선 구현 방식

P0는 코드 구조보다 먼저 "무엇을 좋은 디자인으로 볼 것인가"를 자동 평가 가능한 형태로 만드는 단계다. 외부 도구/스킬을 붙인다면 다음 구성이 현실적이다.

### 3.1 스크린샷 수집

- Playwright 권장
  - 모바일 440
  - 태블릿 768
  - 데스크톱 1440 또는 1680
- 캔버스 iframe 기준으로 full-page와 first viewport를 분리 저장한다.
- 저장 산출물은 `artifacts/evals/<brief-id>/<run-id>/` 같은 구조가 좋다.

### 3.2 vision judge

- 1순위 Claude vision 정책은 유지한다.
- fallback이 발생하면 같은 fixture 안에서 모델을 섞지 않는다.
- 모델이 바뀐 평가는 `mixed-model` 또는 `unstable`로 표시해 회귀 판단에서 제외한다.

### 3.3 루브릭 구조

각 축은 0–5점으로 두되, 점수만 저장하지 말고 근거를 함께 저장한다.

```json
{
  "axis": "first viewport richness",
  "score": 3,
  "reason": "핵심 CTA는 보이지만 브랜드 맥락과 이미지 초점이 약함",
  "evidence": ["hero copy generic", "primary CTA below fold on mobile"],
  "suggestedAction": "design-polish-needed"
}
```

### 3.4 편집 기능과 eval 연결

P0.5는 단순 기능 체크리스트가 아니라 "편집 후에도 결과물이 정돈되는가"를 측정해야 한다.

권장 fixture:

1. 텍스트 수정
2. 이미지 교체
3. 카드 1개 복제
4. 섹션 순서 변경
5. 선택 영역 polish

각 단계마다 viewport 스크린샷을 저장하고 `output-tidiness`, `layout-preservation-after-edit`, `user-intent-preservation`을 채점한다.

---

## 4. 합의 제안

Codex는 다음을 라운드 2의 합의 후보로 제안한다.

1. `DECISIONS.md` D2는 유지하되, E Hybrid를 "제품 방향 확정"으로 명확히 한다.
2. M4는 `E 채택 확정`이 아니라 `HTML→트리 흡수 전략 검증`으로 바꾼다.
3. M0과 M1/M2 사이에 `M0.5 Tree Foundation`을 추가한다.
4. dworks 라운드 번호 규칙은 `홀수 Claude / 짝수 Codex`로 고친다.
5. `COLLABORATION.md` 원격 저장소 상태를 확정값으로 맞춘다.
6. 자율 모드 카운터는 당장은 `에이전트 갱신`으로 낮추고, 자동 갱신 스크립트는 별도 결정으로 둔다.

---

## 5. 미해결 항목

1. M0.5를 M0 안에 포함할지, 별도 마일스톤으로 둘지.
2. P0 eval 구현 전에 krds-studio의 기존 생성 UI를 임시로 가져올지, dworks에서 새 최소 캔버스를 먼저 만들지.
3. 자율 모드 상태 갱신을 문서 수동 갱신으로 둘지, shell script로 자동화할지.

