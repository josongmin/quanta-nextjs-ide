import { useEffect, useRef } from 'react';
import { Button, Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { ModeSection } from './sections/mode-section';
import { CacheSection } from './sections/cache-section';
import { AuthSection } from './sections/auth-section';
import { ActionsSection } from './sections/actions-section';
import { DataSection } from './sections/data-section';
import { RiskSection } from './sections/risk-section';
import { ShippingSection } from './sections/shipping-section';
import type { ModeFamily, RouteSpec, RouteSpecSection } from './types';

interface Props {
  spec: RouteSpec;
  collapsed: boolean;
  /** True only on the very first reveal of a card for a given file. */
  firstReveal?: boolean;
  onToggle(): void;
  onJumpEvidence(file: string, line: number): void;
  onOpenInspector(): void;
  onSeeAllRisks(): void;
  onShipNow(): void;
  onTraceFullstack(): void;
}

const familyStripe: Record<ModeFamily, string> = {
  static: 'bg-sem-static',
  isr: 'bg-sev-info',
  dynamic: 'bg-sev-warn',
  streaming: 'bg-accent',
};

const familyDotTone = (family: ModeFamily) => {
  switch (family) {
    case 'static':
      return 'static' as const;
    case 'isr':
      return 'info' as const;
    case 'dynamic':
      return 'warn' as const;
    case 'streaming':
      return 'accent' as const;
  }
};

const SECTION_ORDER: RouteSpecSection[] = [
  'mode',
  'cache',
  'auth',
  'actions',
  'data',
  'risk',
  'shipping',
];

export function RouteSpecCard({
  spec,
  collapsed,
  firstReveal = false,
  onToggle,
  onJumpEvidence,
  onOpenInspector,
  onSeeAllRisks,
  onShipNow,
  onTraceFullstack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Keyboard nav: ↑/↓ between sections, Enter activates first action,
  // Esc collapses. Active only when card root is the focused element.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement !== node && !node.contains(document.activeElement)) {
        return;
      }
      if (e.key === 'Escape' && !collapsed) {
        e.preventDefault();
        onToggle();
        return;
      }
      if (collapsed) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const active = document.activeElement;
        const currentIdx = SECTION_ORDER.findIndex(
          (k) => sectionRefs.current[k]?.contains(active as Node) ?? false,
        );
        const nextIdx =
          e.key === 'ArrowDown'
            ? Math.min(SECTION_ORDER.length - 1, Math.max(0, currentIdx + 1))
            : Math.max(0, currentIdx - 1);
        const nextKey = SECTION_ORDER[nextIdx];
        const next = nextKey ? sectionRefs.current[nextKey] : null;
        const target = next?.querySelector<HTMLElement>('button, a, [tabindex]') ?? next;
        target?.focus();
      } else if (e.key === 'Enter') {
        const first = sectionRefs.current.mode?.querySelector<HTMLElement>('button');
        first?.focus();
        first?.click();
      }
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [collapsed, onToggle]);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={`Route spec for ${spec.path}`}
      tabIndex={0}
      onClick={(e) => {
        // Only toggle when clicking the inert chrome — not interactive children.
        const target = e.target as HTMLElement;
        if (target.closest('button, a, [data-no-toggle]')) return;
        onToggle();
      }}
      className={cn(
        'group relative flex h-full w-full overflow-hidden',
        'glass hairline-b text-ink-1 outline-none',
        'transition-[background-color,border-color] duration-snappy ease-swift-out',
        firstReveal && 'route-spec-enter',
      )}
      style={{ ['--rs-stagger' as never]: '40ms' }}
    >
      {/* Family color stripe (3px) — first thing the eye catches */}
      <div
        aria-hidden
        className={cn('absolute left-0 top-0 h-full w-[3px]', familyStripe[spec.mode.family])}
      />

      {/* Subtle inner-top highlight (only visible on dark themes via the
          token-driven layered gradient). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-b from-white/10 to-transparent"
      />

      {collapsed ? (
        <CollapsedRow
          spec={spec}
          onToggle={onToggle}
        />
      ) : (
        <ExpandedGrid
          spec={spec}
          sectionRefs={sectionRefs}
          firstReveal={firstReveal}
          onJumpEvidence={onJumpEvidence}
          onOpenInspector={onOpenInspector}
          onSeeAllRisks={onSeeAllRisks}
          onShipNow={onShipNow}
          onTraceFullstack={onTraceFullstack}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}

/* ---------- Collapsed (64px) ---------- */

interface CollapsedProps {
  spec: RouteSpec;
  onToggle(): void;
}

function CollapsedRow({ spec, onToggle }: CollapsedProps) {
  const cacheSummary =
    spec.cache.tags.length > 0
      ? `${spec.cache.tags.length} tag${spec.cache.tags.length === 1 ? '' : 's'}${
          spec.cache.revalidate !== null ? ` · rev ${spec.cache.revalidate}` : ''
        }`
      : 'no tags';

  return (
    <div className="flex h-full w-full items-center gap-2 pl-[64px] pr-3">
      <Icon.File className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />
      <span className="truncate font-mono text-[12px] tracking-tight text-ink-1">
        {spec.path}
      </span>
      <span className="text-ink-3">·</span>
      <Chip
        tone={familyDotTone(spec.mode.family)}
        size="xs"
        className={cn('font-mono', spec.mode.family !== 'static' && 'mi-pulse-ring')}
      >
        {spec.mode.label}
      </Chip>
      <span className="text-ink-3">·</span>
      <span className="truncate text-[11px] text-ink-2">{cacheSummary}</span>
      <span className="text-ink-3">·</span>
      <RiskDot count={spec.risks.length} severity={spec.risks[0]?.severity} />
      <div className="ml-auto flex items-center gap-1.5">
        <span className="hidden text-[10px] text-ink-3 sm:inline">expand</span>
        <Button
          size="icon"
          tone="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label="Expand route spec"
        >
          <Icon.ChevDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function RiskDot({
  count,
  severity,
}: {
  count: number;
  severity: RouteSpec['risks'][number]['severity'] | undefined;
}) {
  if (count === 0) {
    return (
      <span
        aria-label="no risks"
        className="inline-block h-1.5 w-1.5 rounded-full bg-sem-static"
      />
    );
  }
  const tone =
    severity === 'err' ? 'bg-sev-err' : severity === 'warn' ? 'bg-sev-warn' : 'bg-sev-info';
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden
        className={cn('inline-block h-1.5 w-1.5 rounded-full', tone)}
      />
      <span className="nums-tabular text-[11px] text-ink-2">{count}</span>
    </span>
  );
}

/* ---------- Expanded (200px) ---------- */

interface ExpandedProps {
  spec: RouteSpec;
  sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  firstReveal: boolean;
  onToggle(): void;
  onJumpEvidence(file: string, line: number): void;
  onOpenInspector(): void;
  onSeeAllRisks(): void;
  onShipNow(): void;
  onTraceFullstack(): void;
}

function ExpandedGrid({
  spec,
  sectionRefs,
  firstReveal,
  onToggle,
  onJumpEvidence,
  onOpenInspector,
  onSeeAllRisks,
  onShipNow,
  onTraceFullstack,
}: ExpandedProps) {
  const setRef =
    (key: RouteSpecSection) =>
    (el: HTMLElement | null): void => {
      sectionRefs.current[key] = el;
    };
  const stagger = (i: number): React.CSSProperties =>
    firstReveal ? { animationDelay: `${i * 40}ms` } : {};

  return (
    <div className="flex h-full w-full flex-col pl-[64px] pr-3 py-2">
      {/* Header row */}
      <div className="flex items-center gap-2 pb-1.5">
        <Icon.File className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />
        <span className="truncate font-mono text-[12px] tracking-tight text-ink-1">
          {spec.path}
        </span>
        <Chip tone="muted" size="xs" className="font-mono lowercase">
          {spec.archetype}
        </Chip>
        <Chip tone="muted" size="xs" className="font-mono nums-tabular">
          cost {spec.costClass}
        </Chip>
        {spec.clientKb > 0 ? (
          <Chip tone="client" size="xs" className="font-mono nums-tabular">
            client {spec.clientKb}KB
          </Chip>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <Button size="xs" tone="ghost" onClick={onTraceFullstack} data-no-toggle>
            trace
          </Button>
          <Button size="xs" tone="ghost" onClick={onOpenInspector} data-no-toggle>
            <Icon.UpRight className="h-3 w-3" /> inspect
          </Button>
          <Button
            size="icon"
            tone="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label="Collapse route spec"
          >
            <Icon.ChevDown className="h-3.5 w-3.5 rotate-180" />
          </Button>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_1fr_1.1fr] gap-3">
        <section
          ref={setRef('mode')}
          className={cn('route-spec-section', firstReveal && 'route-spec-stagger')}
          style={stagger(0)}
        >
          <ModeSection mode={spec.mode} onJumpEvidence={onJumpEvidence} />
        </section>

        <section
          ref={setRef('cache')}
          className={cn(
            'route-spec-section flex flex-col gap-2',
            firstReveal && 'route-spec-stagger',
          )}
          style={stagger(1)}
        >
          <CacheSection cache={spec.cache} />
          <div ref={setRef('auth')}>
            <AuthSection auth={spec.auth} />
          </div>
        </section>

        <section
          ref={setRef('risk')}
          className={cn(
            'route-spec-section flex flex-col gap-2',
            firstReveal && 'route-spec-stagger',
          )}
          style={stagger(2)}
        >
          <RiskSection
            risks={spec.risks}
            onJumpRisk={onJumpEvidence}
            onSeeAll={onSeeAllRisks}
          />
          <div ref={setRef('shipping')}>
            <ShippingSection shipping={spec.shipping} onShipNow={onShipNow} />
          </div>
        </section>
      </div>

      {/* Footer row — Actions + Data inline so all 7 sections are visible. */}
      <div className="grid grid-cols-2 gap-3 pt-1.5 hairline-t mt-1.5">
        <div ref={setRef('actions')}>
          <ActionsSection actions={spec.actions} />
        </div>
        <div ref={setRef('data')}>
          <DataSection data={spec.data} />
        </div>
      </div>
    </div>
  );
}
