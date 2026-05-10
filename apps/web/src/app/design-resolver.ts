// design-resolver — 트리 노드의 _resolved_ 디자인 값을 계산.
//
// 배경: 기존 구조에서는 캔버스가 className/Tailwind로 default를 _숨겨_ 렌더했고,
// 인스펙터는 그 값을 알 수 없어 DOM(getComputedStyle)을 _역측정_ 했다. 결과적으로
// 같은 노드를 캔버스/인스펙터/내보내기/AI 생성/QA가 _서로 다른 값_으로 본다.
//
// resolver는 (raw TreeNode + node type defaults + role/intent defaults + theme tokens
// + viewport responsive rules + explicit user overrides)를 합쳐 ResolvedNodeDesign을
// 만든다. 캔버스/인스펙터 모두 이 값을 _읽어_ 렌더 — single source of truth.
//
// 마이그레이션 단계:
//   Phase 2 (현재): resolver 모듈 도입. spacing부터. 어디서도 미사용 — 안전망.
//   Phase 3: CanvasNode가 resolver 결과로 렌더 (node type별 점진).
//   Phase 4: Inspector가 resolver 결과 표시 (effectiveStyle 제거).
//   Phase 5: AI 생성 후 normalize에 resolver 적용.

import type { NodeLayout, Spacing, TreeNode } from '@dworks/tree'
import {
  resolveResponsiveLayout,
  resolveResponsiveSpacing,
  type ResponsiveViewport,
} from './responsive'
import { DEFAULT_LAYOUT_BY_TYPE, DEFAULT_SPACING_BY_TYPE } from './canvas-defaults'

// 인스펙터에서 각 값의 _출처_를 표시하기 위한 태그.
//   explicit  — 트리에 명시 (사용자가 직접 박은 값)
//   default   — 노드 type default
//   role      — role(banner/main/contentinfo)별 default — 후속 phase
//   token     — theme token (colorPreset 등) — 후속 phase
//   responsive — viewport별 override
//   inherited — 부모로부터 상속 — 후속 phase
export type NodeDesignSource =
  | 'explicit'
  | 'default'
  | 'role'
  | 'token'
  | 'responsive'
  | 'inherited'

// resolved spacing — 모든 키 optional이지만 explicit/default/responsive 어디서든 값이
// 들어온 경우 sources에 항목이 생긴다. (즉 sources는 _값이 정의된_ 키만 포함.)
export type SpacingKey = keyof Spacing

export interface ResolvedSpacing {
  value: Spacing
  sources: Partial<Record<SpacingKey, NodeDesignSource>>
}

export interface ResolveContext {
  viewport: ResponsiveViewport
}

// node + context → resolved spacing.
//   1) type default을 깔고
//   2) explicit override가 있으면 덮고
//   3) viewport responsive 보정 (현재는 explicit 값만 보정. default 값은 default 그대로)
//
// 주의: resolveResponsiveSpacing은 explicit 값만 다룬다 — type default를 같이
// responsive 보정하면 작은 화면에서 default가 _말 없이_ 줄어들어 회귀 위험. 명시 값만
// 보정하는게 안전 (현재 캔버스 동작과 일치).
export function resolveSpacing(
  node: TreeNode,
  context: ResolveContext,
): ResolvedSpacing {
  const defaults = DEFAULT_SPACING_BY_TYPE[node.type] ?? {}
  const explicit = node.spacing ?? {}
  const responsiveExplicit =
    resolveResponsiveSpacing(explicit, context.viewport) ?? explicit

  const value: Spacing = {}
  const sources: Partial<Record<SpacingKey, NodeDesignSource>> = {}

  const keys: SpacingKey[] = [
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'gap',
  ]

  for (const key of keys) {
    const explicitValue = explicit[key]
    const responsiveValue = responsiveExplicit[key]
    const defaultValue = defaults[key]
    if (explicitValue !== undefined) {
      // explicit이 있는데 responsive 보정으로 다른 값이 나오면 source는 responsive
      if (responsiveValue !== undefined && responsiveValue !== explicitValue) {
        value[key] = responsiveValue
        sources[key] = 'responsive'
      } else {
        value[key] = explicitValue
        sources[key] = 'explicit'
      }
    } else if (defaultValue !== undefined) {
      value[key] = defaultValue
      sources[key] = 'default'
    }
  }

  return { value, sources }
}

// resolved layout — spacing과 같은 패턴.
//   1) type default
//   2) explicit override
//   3) viewport responsive 보정 (mobile에서 row → column 등)
export type LayoutKey = keyof NodeLayout

export interface ResolvedLayout {
  value: NodeLayout
  sources: Partial<Record<LayoutKey, NodeDesignSource>>
}

export function resolveLayout(
  node: TreeNode,
  context: ResolveContext,
): ResolvedLayout {
  const defaults = DEFAULT_LAYOUT_BY_TYPE[node.type] ?? {}
  const explicit = node.layout ?? {}
  const responsiveExplicit =
    resolveResponsiveLayout(explicit, context.viewport) ?? explicit

  const value: NodeLayout = {}
  const sources: Partial<Record<LayoutKey, NodeDesignSource>> = {}

  // generic loop이면 NodeLayout key별 enum 타입이 narrow되지 않아 unroll. 4개 키.
  function pick<K extends LayoutKey>(key: K): void {
    const explicitValue = explicit[key]
    const responsiveValue = responsiveExplicit[key]
    const defaultValue = defaults[key]
    if (explicitValue !== undefined) {
      if (responsiveValue !== undefined && responsiveValue !== explicitValue) {
        value[key] = responsiveValue as NodeLayout[K]
        sources[key] = 'responsive'
      } else {
        value[key] = explicitValue
        sources[key] = 'explicit'
      }
    } else if (responsiveValue !== undefined && responsiveValue !== defaultValue) {
      // explicit이 없는 노드도 viewport에 따라 layout direction이 바뀔 수 있다
      // (resolveResponsiveLayout은 mobile에서 explicit row를 column으로 바꾸지만,
      // explicit 없는 default direction이 'row'면 보정 안 됨 — default 자체는 그대로 유지)
      // 따라서 이 분기는 사실상 덜 적용되지만 안전망으로 둠.
      value[key] = responsiveValue as NodeLayout[K]
      sources[key] = 'responsive'
    } else if (defaultValue !== undefined) {
      value[key] = defaultValue
      sources[key] = 'default'
    }
  }

  pick('direction')
  pick('align')
  pick('justify')
  pick('wrap')

  return { value, sources }
}
