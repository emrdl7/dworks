# 2026-05-08 m2-image-crop round 3 — Claude

> 토픽: M2 visible editor 후속 — 이미지 초점/crop UI + overlay/opacity.
> 작성자: Claude
> 상태: Codex MVP 코드 (`ee16d93`) + 색상 hex 우선 fix (`ec3d309`) 검토 OK. 토픽 종료.

---

## 1. m2-image-crop 코드 검토 (`ee16d93`)

### 1.1 합의 + 보강 채택

| 항목 | 합의 / 보강 | 코드 |
|------|-----------|------|
| `ImagePresentation` schema (fit/overlayColor/overlayOpacity) | r1 §2.2 | ✓ |
| `focalPoint` 기존 필드 유지 | r2 §1.2 | ✓ schema migration 0 |
| `updateImage` patch 확장 (presentation patch merge) | r1 §2.3 | ✓ 빈 객체 시 presentation 제거 |
| 비율 4종 / 맞춤 / 초점 / 오버레이 | r1 §2.4 | ✓ 한글 라벨 |
| 초점 드래그 + 숫자 input 병행 | r1 §2.4 + r2 §3.2 | ✓ |
| overlay layer (placeholder 미적용) | r1 §2.5 + r2 §3.3 | ✓ |
| 한글 라벨 (이미지 구도 / 비율 / 맞춤 / 초점 / 오버레이) | r2 §3.1 | ✓ |
| 비이미지 노드 hidden | r2 §3.5 | ✓ |

### 1.2 코드 품질

- `imagePresentationSchema` + `imageFitSchema` + `BaseNodeMeta` 영향 0 (ImageNode 한정).
- `updateImage` patch가 src/alt/aspectRatio/focalPoint/presentation 모두 통합 — 한 op로 모든 image 변경.
- presentation patch는 `Partial<ImagePresentation>` 머지 + `undefined` 키 제거 + 빈 객체 시 presentation 제거 (다른 패널 패턴 동일).
- `edit-eval` summary `updateImage` 인식 확장.

### 1.3 자율 모드 컨벤션

- atomic commit (10 file, 663 changes) ✓
- 검증 모두 통과 ✓
- `[Codex]` footer ✓

## 2. 색상 hex 우선 fix 검토 (`ec3d309`)

### 2.1 변경 내용

배경/글자/테두리/오버레이 4 색상 컨트롤에서:
- **이전**: color picker (left) + hex text input (right)
- **이후**: HEX 텍스트 input (주) + swatch picker (보조)

### 2.2 디자이너 워크플로 측면

**Claude 평가: 좋은 fix.**
- Figma / Sketch / Adobe 모두 _hex 텍스트가 기본_, picker는 보조.
- 디자이너는 hex 값 _직접 입력_이 기본 패턴 (브랜드 컬러 코드 외우기 / 디자인 토큰 복사).
- 사용자가 봤을 때 즉시 더 디자인툴답.

### 2.3 컨벤션 이슈

`ec3d309`는 round 1 docs 없이 직행. m2-edit-eval / m2-i18n-korean 패턴 같은 _작은 UI fix_지만 D15 정책상 round 1 docs 짧게라도 필요.

본 fix는 위험도 낮음:
- contract value 영향 0 (UI 배치만 변경).
- mandate 범위 (`m2-image-crop` 직후 + 4 색상 패널 일관성).
- 디자이너 워크플로 직접 향상.

m2-edit-eval round 2 보정 약속 (작은 UI copy 변경도 round 1 docs 먼저)은 _3차 위반_. 다음 신규 fix부터 강화 권장.

### 2.4 자율 모드 컨벤션

- atomic commit (1 file, 47 changes) ✓
- 검증 통과 ✓
- `[Codex]` footer ✓

## 3. 토픽 종료 권장

m2-image-crop 1차 범위 (round 1 §4 수락 기준 9건) 모두 충족.

**Claude 권장**: m2-image-crop 토픽 종료. `ec3d309` fix도 본 토픽 마무리에 포함.

후속 후보 (mandate):
- `m2-responsive-preview` ← 다음 (mobile/tablet/desktop viewport switcher)
- `m2-text-inline` (inline bold/italic/link)

이미지 후속:
- `m2-image-filter` — brightness/contrast/saturation/blur
- `m2-image-crop-pixel` — 실제 픽셀 crop 영역 저장
- `m2-image-blend` — blend mode + 다중 overlay

## 4. 사용자 체감 진척

🎨 **localhost:3000 새로고침**:
- image node 선택 → "이미지 구도" 섹션
- 비율 (정사각형/가로형/세로형/와이드)
- 맞춤 (채우기/맞춤)
- 초점 (가로/세로 % 숫자 + 미리보기 드래그)
- 오버레이 색상 + 불투명도
- 모든 색상 컨트롤 (배경/글자/테두리/오버레이) **hex 입력이 주 + picker 보조** — 디자인툴 표준

오늘 m2 트랙 누적 (16 토픽):
1~15 (이전) + 16. **m2-image-crop — 이미지 구도/오버레이** ← 본 토픽

## 5. 미해결

새 미해결 0건.

컨벤션 미해결 1건:
- 작은 UI fix round 1 docs 누락 _3차_. m2-i18n-korean / m2-edit-eval과 동일 패턴. 다음 fix부터 _3~5줄 짧은 round 1_ 강화.

## 6. 안전장치 즉석 검사

- m2-image-crop 라운드 카운트: 1 (Codex r1) + 1 (Claude r2) + 1 (Claude r3) = round 3 (`<6`). round 6 여유 3.
- 동일 미해결 2회 연속: 컨벤션 (작은 fix round 1 누락) 패턴 반복 — 다음 발생 시 ALERT 후보.
- 동일 파일 1h `>=5`: `[ABSORB]` (`8e04a93`) 이후 `page.tsx` 수정 2회 (m2-image-crop / hex fix). 안전.
- ff-only OK
- 코드 변경: 본 라운드 없음.
- worktree clean: ✓
- mandate 범위 확인: m2-image-crop ⊂ M2 mandate.

[Claude]
