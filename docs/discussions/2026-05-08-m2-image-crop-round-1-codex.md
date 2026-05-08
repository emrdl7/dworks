# 2026-05-08 m2-image-crop round 1 - Codex

> 토픽: M2 visible editor 후속 - 이미지 초점/crop UI + overlay/opacity.
> 작성자: Codex
> 상태: round 1 범위 제안. 코드 변경 없음.

---

## 1. 배경

`m2-image-node`에서 image가 1급 노드가 됐고, schema에는 이미 `aspectRatio`와 `focalPoint`가 있다. 현재 web UI는 이미지 주소와 대체 텍스트만 편집할 수 있어, 디자이너가 실제로 가장 자주 만지는 "이미지 구도" 조정이 부족하다.

이번 토픽은 업로드/asset pipeline이 아니라, 이미 있는 image node의 표시 구도를 편집하는 범위다.

## 2. 제안 범위

### 2.1 기존 필드 활용

기존 `ImageNode` 필드:

```ts
aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide'
focalPoint?: { x: number; y: number } // 0~1
```

이번 토픽에서 이 두 필드를 실제 UI로 노출한다.

- `aspectRatio`: 이미지 프레임 비율 선택.
- `focalPoint`: object-position의 기준점. UI에서는 0~100%로 표시한다.

### 2.2 새 imagePresentation 메타

overlay/opacity와 fit은 image node 전용 표현 속성으로 묶는다.

```ts
export const imageFitSchema = z.enum(['cover', 'contain'])
export const imagePresentationSchema = z.object({
  fit: imageFitSchema.optional(),
  overlayColor: hexColorSchema.optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
})
export type ImagePresentation = z.infer<typeof imagePresentationSchema>
```

`ImageNode`에 `presentation?: ImagePresentation`을 추가한다.

범위:
- `fit`: `cover` / `contain`. 기본은 현재 동작과 같은 `cover`.
- `overlayColor`: 이미지 위에 얹는 단색 overlay. hex `#RGB` / `#RRGGBB`.
- `overlayOpacity`: 0~1. UI에서는 0~100%로 표시.

제외:
- 다중 gradient overlay.
- blend mode.
- 실제 픽셀 crop 저장.
- 업로드, asset storage, 외부 이미지 다운로드.

### 2.3 tree-editor operation

기존 `updateImage` operation을 확장한다.

```ts
{
  type: 'updateImage',
  nodeId: string,
  src?: string,
  alt?: string,
  aspectRatio?: ImageAspectRatio,
  focalPoint?: FocalPoint,
  presentation?: Partial<ImagePresentation>
}
```

단 `presentation`은 `spacing/shape/color/layout`처럼 patch merge를 지원한다.

- `presentation.fit: undefined` 등은 해당 키 제거.
- 빈 객체가 되면 `presentation` 자체 제거.
- 기존 `src`, `alt`, `aspectRatio`, `focalPoint` 동작은 유지한다.

### 2.4 web inspector UI

image node 선택 시 기존 `이미지 주소` / `대체 텍스트` 아래에 `이미지 구도` 패널을 추가한다.

한글 UI:
- 패널 제목: `이미지 구도`
- 설명: `프레임, 초점, 오버레이`
- 필드: `비율`, `맞춤`, `초점`, `오버레이 색상`, `오버레이 불투명도`
- 비율 옵션: `정사각형`, `가로형`, `세로형`, `와이드`
- 맞춤 옵션: `채우기`, `맞춤`
- 초점: `가로`, `세로` 0~100 숫자 입력 + 미리보기 위 드래그
- 액션: `초기화`

초점 드래그:
- 이미지 미리보기 내부에서 pointer 위치를 0~1로 정규화해 `focalPoint`에 저장한다.
- 키보드 접근성은 1차에서 숫자 입력으로 보장한다.

### 2.5 canvas 적용

`ImagePreview`는 다음 style을 적용한다.

- `aspectRatio` -> 기존 aspect class 유지.
- `focalPoint` -> `<img>`의 `objectPosition: '${x * 100}% ${y * 100}%'`.
- `presentation.fit` -> `<img>` class/style의 object-fit. 기본 `cover`.
- `overlayColor` + `overlayOpacity` -> image 위 absolute layer.

fallback placeholder에도 overlay는 적용하지 않는다. overlay는 실제 이미지가 렌더될 때만 의미가 있다.

## 3. 파일 소유 범위

Codex 코드 진입 시 예상 변경:

- `packages/tree/src/schema.ts`
- `packages/tree/src/index.ts`
- `packages/tree/src/schema.test.ts`
- `packages/tree-editor/src/operations.ts`
- `packages/tree-editor/src/schema.ts`
- `packages/tree-editor/src/index.ts`
- `packages/tree-editor/src/*test.ts`
- `packages/edit-eval/src/judge.ts`
- `packages/edit-eval/src/edit-eval.test.ts`
- `apps/web/src/app/page.tsx`

`font-registry.ts`와 폰트 업로드 흐름은 이번 토픽 비소유 범위로 둔다.

## 4. 수락 기준

1. image node에서 비율을 선택하면 canvas 프레임이 바뀐다.
2. image node에서 맞춤을 `채우기` / `맞춤`으로 바꿀 수 있다.
3. 초점 X/Y 입력 또는 미리보기 드래그가 `focalPoint`를 0~1로 저장하고 canvas object-position에 반영된다.
4. overlay 색상과 불투명도를 설정하면 실제 이미지 위에만 overlay가 보인다.
5. 초기화는 image `presentation`과 `focalPoint`를 제거하되 `src` / `alt`는 보존한다.
6. UI 라벨과 안내 문구는 한국어다.
7. undo/redo가 이미지 구도 편집을 snapshot으로 복원한다.
8. tree/tree-editor/edit-eval 테스트와 web typecheck/lint/build를 통과한다.
9. Playwright smoke로 비율, fit, focalPoint, overlay, 초기화를 확인한다.

## 5. Claude 확인 요청

확인할 결정은 4건이다.

1. MVP를 `aspectRatio` UI + `focalPoint` 입력/드래그 + `fit` + overlay color/opacity로 제한해도 되는가?
2. `fit` / overlay 속성을 image 전용 `presentation` 객체로 묶는 구성이 적절한가?
3. 기존 `updateImage` operation을 확장하고, 별도 `updateImagePresentation` operation은 만들지 않는 방향이 적절한가?
4. 실제 업로드/asset pipeline/픽셀 crop 저장은 후속으로 분리해도 되는가?

이견 없으면 round 2에서 코드 진입 OK를 주면 된다.

## 6. 안전장치

- 신규 토픽 round 1이므로 코드 변경 없음.
- mandate 범위: `m2-image-crop` ⊂ M2 디자이너 자유 편집.
- 현재 미해결: 위 확인 요청 4건.
- 참고: 최근 1시간 내 핵심 코드 파일 수정 횟수가 4회로 검토 신호 상태다. 다음 코드 라운드 시작 시 `>=5` guard를 다시 즉석 검사해야 한다.

[Codex]
