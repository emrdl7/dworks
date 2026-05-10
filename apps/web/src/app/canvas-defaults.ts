// 캔버스 노드 type별 design default — 현재 CanvasNode의 className에 _숨어있는_ 값을
// 명시화한다. design-resolver가 이 값을 explicit override 없을 때 fallback으로 쓴다.
//
// 마이그레이션 끝나면 CanvasNode가 직접 className을 박지 않고 resolver 결과로 렌더하므로
// 이 파일이 _진짜_ source of truth가 된다 — 지금은 className과 _이중 작성_ 단계.
//
// 값 추출 기준: apps/web/src/app/page.tsx 의 CanvasNode switch case 별 가장 일반적인
// branch (no layout override, no role-specific path). 특수 case(banner, layoutOverride
// 등)는 후속 phase에서 role/intent별 default로 분리.

import type { NodeLayout, Spacing, TreeNodeType } from '@dworks/tree'

// type별 spacing default — 캔버스 className과 _값 일치_ 보장 필요
//
// section: p-10 gap-8                      (40, 32)
// hero:    p-12 gap-10                     (48, 40)
// card:    p-5 gap-3                       (20, 12)
// list:    p-0 gap-3                       ( 0, 12)
// form:    p-8 gap-5                       (32, 20)
// leaf nodes(text/button/image): spacing default 없음
export const DEFAULT_SPACING_BY_TYPE: Record<TreeNodeType, Spacing> = {
  section: {
    paddingTop: 40,
    paddingRight: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    gap: 32,
  },
  hero: {
    paddingTop: 48,
    paddingRight: 48,
    paddingBottom: 48,
    paddingLeft: 48,
    gap: 40,
  },
  card: {
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    gap: 12,
  },
  list: {
    gap: 12,
  },
  form: {
    paddingTop: 32,
    paddingRight: 32,
    paddingBottom: 32,
    paddingLeft: 32,
    gap: 20,
  },
  text: {},
  button: {},
  image: {},
}

// type별 layout default — 캔버스 className의 flex direction/wrap에서 추출.
//
// section(default branch): flex flex-col gap-8 p-10 → column / nowrap
// hero: grid 기반(min-h grid-cols 등) — NodeLayout 'grid' 미지원 → undefined로 둠
//   사용자가 hero 자체에 layout을 박지 않으므로 토글은 disabled. 자식 wrapper만 flex-col.
// card: article block 기반(no flex) → undefined. 자식 wrapper만 flex-col gap-3.
// list: flex flex-col gap-3 → column / nowrap
// form: flex flex-col gap-5 → column / nowrap
// leaf(text/button/image): layout 없음
//
// 주의: 'banner' role / layoutOverride 등 특수 path의 layout은 후속 phase에서
// role/intent별 override로 분리.
export const DEFAULT_LAYOUT_BY_TYPE: Record<TreeNodeType, NodeLayout> = {
  section: { direction: 'column', wrap: 'nowrap' },
  hero: {},
  card: {},
  list: { direction: 'column', wrap: 'nowrap' },
  form: { direction: 'column', wrap: 'nowrap' },
  text: {},
  button: {},
  image: {},
}
