'use client'

// UX-04 — 좌측 컴포넌트 라이브러리 패널 (240px 펼침 / 32px 접힘).
// CONTEXT.md D-08..D-11 잠금. UI-SPEC line 160-205, PATTERNS.md line 230-298.
//
// 카드 카테고리:
//  1. 기본 — 12 노드 타입 (text/button/image/section/hero/card/list/form/carousel/tabs/accordion/modal)
//  2. 패턴 — treeFixtures 의 ≥10 fixture
//
// 인터랙션:
//  - HTML5 native drag → dataTransfer 에 'application/x-dworks-node' MIME + JSON payload
//  - Enter/Space 키 활성 (drag 대체 a11y 경로 — UI-SPEC line 323)
//  - 토글 단축키 [ — page.tsx 의 global keydown handler 가 onToggle 호출

import { useMemo, type DragEvent as ReactDragEvent } from 'react'

import {
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  FormInput,
  GalleryHorizontal,
  Image as ImageIcon,
  Layers,
  Layout,
  LayoutTemplate,
  List,
  MousePointerClick,
  PanelTop,
  Square,
  Type,
  type LucideIcon,
} from 'lucide-react'

import type { TreeNode } from '@dworks/tree'

import { nodeTypeLabels } from './node-meta'
import { treeFixtures } from './tree-fixtures'

// UI-SPEC line 173-187 — Basic 카드의 lucide 아이콘 매핑.
// node-meta.ts 의 nodeTypeIcons 와 별도 — Basic 카드는 _섬세한 사이즈_ 라
// 본 패널 전용 매핑 (UI-SPEC 잠금 사양과 1:1).
const BASIC_TYPE_ICONS: Record<TreeNode['type'], LucideIcon> = {
  text: Type,
  button: MousePointerClick,
  image: ImageIcon,
  section: PanelTop,
  hero: LayoutTemplate,
  card: Square,
  list: List,
  form: FormInput,
  carousel: GalleryHorizontal,
  tabs: Layout,
  accordion: ChevronsDownUp,
  modal: Layers,
}

// 12 노드 타입 — Basic 카테고리 노출 순서 (UI-SPEC 정렬).
const BASIC_TYPE_ORDER: readonly TreeNode['type'][] = [
  'text',
  'button',
  'image',
  'section',
  'hero',
  'card',
  'list',
  'form',
  'carousel',
  'tabs',
  'accordion',
  'modal',
]

// LR-04 — tree-editor 가 leaf/container 헬퍼만 노출 → 본 4 타입은 Basic 카드에서
// 활성화해도 warn toast 만 발생. AT 사용자에게는 비활성 상태를 알려야 WCAG 4.1.2
// (Name, Role, Value) 충족 — aria-disabled + label 안내 변경.
const BASIC_UNSUPPORTED_TYPES: ReadonlySet<TreeNode['type']> = new Set([
  'carousel',
  'tabs',
  'accordion',
  'modal',
])

// 패턴 카드 라벨 — fixture.name 보다 짧은 한국어 별칭.
// fixture 추가 시 fallback (fixture.name → fixture.description → fixture.id).
const FIXTURE_LABELS: Record<string, string> = {
  'simple-hero': '이미지 히어로',
  'card-grid': '3열 기능 그리드',
  'signup-form': '가입 폼',
  'dark-luxury-hero': '다크 럭셔리 히어로',
  'saas-dashboard': 'SaaS 대시보드 상단',
  'minimal-portfolio': '미니멀 포트폴리오 헤더',
  'playful-product': '플레이풀 제품 페이지',
  'pricing-tier': '가격표',
  'products-carousel': '상품 캐러셀',
  'faq-accordion': 'FAQ 아코디언',
}

// dataTransfer payload — page.tsx 의 onDrop 이 동일 인터페이스로 parse.
// MIME 'application/x-dworks-node' 는 외부 drag 와 충돌 회피.
export interface ComponentLibraryDragPayload {
  type?: TreeNode['type']
  fixtureId?: string
}

export interface ComponentLibraryPanelProps {
  open: boolean
  onToggle: () => void
  onAddByKeyboard: (payload: ComponentLibraryDragPayload) => void
}

export function ComponentLibraryPanel({
  open,
  onToggle,
  onAddByKeyboard,
}: ComponentLibraryPanelProps) {
  // 정렬된 패턴 fixture — treeFixtures 는 readonly 라 새 array 로 안정 정렬.
  const sortedFixtures = useMemo(() => [...treeFixtures], [])

  return (
    <aside
      role="region"
      aria-label="컴포넌트 라이브러리"
      className="relative flex shrink-0 flex-col overflow-hidden border-r border-[var(--dw-ui-border)] bg-[var(--dw-ui-panel)] transition-[width] duration-[var(--dw-motion-base)] ease-[var(--dw-motion-ease)]"
      style={{ width: open ? 240 : 32 }}
    >
      {/* 토글 헤더 — open / closed 양쪽 노출 */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--dw-ui-border)] px-2 py-2">
        {open && (
          <h2 className="text-[length:var(--dw-text-section-heading)] font-semibold text-[var(--dw-ui-text-strong)]">
            컴포넌트
          </h2>
        )}
        <button
          type="button"
          aria-label="컴포넌트 패널 토글"
          aria-pressed={open}
          onClick={onToggle}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--dw-radius-sm)] text-[var(--dw-ui-text-muted)] transition-colors hover:bg-[var(--dw-ui-elevated)] hover:text-[var(--dw-ui-text-body)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dw-ui-accent)]"
        >
          {open ? (
            <ChevronLeft size={16} aria-hidden="true" />
          ) : (
            <ChevronRight size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      {open && (
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-3 pb-12">
          {/* 기본 — 12 노드 타입 카드 (2열 grid) */}
          <section>
            <h3 className="mb-2 text-[length:var(--dw-text-section-heading)] font-semibold uppercase tracking-wider text-[var(--dw-ui-text-muted)]">
              기본
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {BASIC_TYPE_ORDER.map((type) => {
                const unsupported = BASIC_UNSUPPORTED_TYPES.has(type)
                return (
                  <ComponentCard
                    key={type}
                    icon={BASIC_TYPE_ICONS[type]}
                    label={nodeTypeLabels[type]}
                    variant="basic"
                    // LR-04 — 4 타입은 활성화 시 warn toast 만 발생. AT 사용자에게도 안내.
                    ariaDisabled={unsupported}
                    ariaLabelOverride={
                      unsupported
                        ? `${nodeTypeLabels[type]} 카드 (패턴 카드 또는 ⌘K 사용)`
                        : undefined
                    }
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'copy'
                      event.dataTransfer.setData(
                        'application/x-dworks-node',
                        JSON.stringify({ type } satisfies ComponentLibraryDragPayload),
                      )
                    }}
                    onActivate={() => onAddByKeyboard({ type })}
                  />
                )
              })}
            </div>
          </section>

          {/* 패턴 — fixture 카드 (1열, 상단 32px 아이콘 thumbnail — D-11) */}
          <section>
            <h3 className="mb-2 text-[length:var(--dw-text-section-heading)] font-semibold uppercase tracking-wider text-[var(--dw-ui-text-muted)]">
              패턴
            </h3>
            <div className="flex flex-col gap-2">
              {sortedFixtures.map((fixture) => (
                <ComponentCard
                  key={fixture.id}
                  icon={fixture.icon}
                  label={
                    FIXTURE_LABELS[fixture.id] ?? fixture.name ?? fixture.description ?? fixture.id
                  }
                  variant="pattern"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'copy'
                    event.dataTransfer.setData(
                      'application/x-dworks-node',
                      JSON.stringify({
                        fixtureId: fixture.id,
                      } satisfies ComponentLibraryDragPayload),
                    )
                  }}
                  onActivate={() =>
                    onAddByKeyboard({ fixtureId: fixture.id })
                  }
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </aside>
  )
}

// ---------------------------------------------------------------------------
// ComponentCard — Basic / Pattern 양쪽에서 재사용.
//   variant='basic'   : 좌측 16px 아이콘 + 우측 라벨 (UI-SPEC line 166)
//   variant='pattern' : 상단 32px 아이콘 thumbnail + 하단 라벨 (D-11 잠금)
// ---------------------------------------------------------------------------

interface ComponentCardProps {
  icon: LucideIcon
  label: string
  variant: 'basic' | 'pattern'
  // LR-04 — Basic 카드 중 tree-editor 미지원 (carousel/tabs/accordion/modal) 일 때 true.
  // role=button + tabIndex 는 유지해 SR navigation 가능. aria-disabled 만 전달.
  ariaDisabled?: boolean
  ariaLabelOverride?: string
  onDragStart: (event: ReactDragEvent<HTMLDivElement>) => void
  onActivate: () => void
}

function ComponentCard({
  icon: Icon,
  label,
  variant,
  ariaDisabled = false,
  ariaLabelOverride,
  onDragStart,
  onActivate,
}: ComponentCardProps) {
  const isBasic = variant === 'basic'
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      aria-disabled={ariaDisabled || undefined}
      onDragStart={onDragStart}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate()
        }
      }}
      aria-label={ariaLabelOverride ?? `${label} 카드 (드래그 또는 Enter)`}
      className={[
        'group cursor-grab rounded-[var(--dw-radius-sm)] border border-[var(--dw-ui-border)] bg-[var(--dw-ui-elevated)] transition-all duration-[var(--dw-motion-base)] ease-[var(--dw-motion-ease)]',
        'hover:scale-[1.02] hover:border-[var(--dw-ui-accent)] hover:ring-1 hover:ring-[var(--dw-ui-accent)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dw-ui-accent)]',
        'active:cursor-grabbing',
        isBasic
          ? 'flex h-10 items-center gap-2 px-2'
          : 'flex flex-col items-center justify-center gap-1 px-2 py-2',
      ].join(' ')}
    >
      {variant === 'basic' && Icon && (
        <Icon
          aria-hidden="true"
          size={16}
          strokeWidth={1.75}
          className="shrink-0 text-[var(--dw-ui-text-muted)] group-hover:text-[var(--dw-ui-accent-text)]"
        />
      )}
      {variant === 'pattern' && Icon && (
        // D-11 — 패턴 카드 상단 32×32 lucide thumbnail.
        // --dw-space-5 × 3 = 60px 영역 안에 32px 아이콘 + 8px 여백 + 라벨.
        <div
          aria-hidden="true"
          className="flex h-[60px] w-full items-center justify-center text-[var(--dw-ui-text-muted)] group-hover:text-[var(--dw-ui-accent-text)]"
        >
          <Icon aria-hidden="true" size={32} strokeWidth={1.5} />
        </div>
      )}
      <span
        className={[
          'text-[length:var(--dw-text-label)] font-semibold text-[var(--dw-ui-text-body)]',
          isBasic ? 'truncate' : 'text-center leading-tight',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  )
}
