/**
 * Phase 6 — Full Context Hover (36-1).
 *
 * Public surface:
 *   - <FullContextHoverCard symbol file line ...>
 *   - aggregateContext(input) — pure aggregator (re-exported below).
 *
 * The card is glass-morphism, 480px wide, sectioned, and keyboard-friendly:
 *   - Esc → onDismiss
 *   - Enter on any row → navigate to file:line
 *   - Sections are collapsible (Radix Collapsible via Section).
 *
 * Visuals are intentionally restrained: 200ms fade + 4px translateY entrance,
 * a 1px hairline border, and `backdrop-blur` for the Apple-grade glass.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useEditorStore } from '@entities/editor';
import { Chip, Section, SeverityDot } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { aggregateContext, type AggregateInput } from './aggregator';
import type {
  CacheImpactRef,
  MutationRef,
  PiiNodeRef,
  RiskRef,
  RouteRef,
  SymbolContext,
  TestRef,
} from './types';
import { WhyBrokenButton } from './why-broken';
import { FixSafelyButton } from './fix-safely';

export type { SymbolContext, AggregateInput };
export { aggregateContext } from './aggregator';

// ─────────────────────────────────────────────────────────────────────────
// Local CSS for the entrance animation. Keeps the component self-contained.
// ─────────────────────────────────────────────────────────────────────────
const entranceStyle = `
@keyframes nss-fch-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.nss-fch-card {
  animation: nss-fch-in 220ms cubic-bezier(0.2, 0, 0.0, 1) both;
}
`;

interface Props {
  /** Symbol name under the cursor. */
  symbol: string;
  /** File path. */
  file: string;
  /** 1-based line number. */
  line: number;
  /** Optional TypeScript signature (from tsserver quickInfo). */
  signature?: string;
  /** Optional documentation. */
  docs?: string;
  /** Optional positioning override. */
  style?: CSSProperties;
  /** Called when the user hits Escape or the card loses focus. */
  onDismiss?: () => void;
  /** Optional className. */
  className?: string;
}

export function FullContextHoverCard({
  symbol,
  file,
  line,
  signature,
  docs,
  style,
  onDismiss,
  className,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const openTab = useEditorStore((s) => s.openTab);

  // Compute a snapshot at render. The aggregator reads from zustand stores
  // at call-time; this is fine for hover lifecycles (re-mounts on each hover).
  const ctx: SymbolContext = aggregateContext({
    symbol,
    file,
    line,
    ...(signature !== undefined ? { signature } : {}),
    ...(docs !== undefined ? { docs } : {}),
  });

  const navigate = (targetFile: string, targetLine: number) => {
    openTab({
      id: `tab-${targetFile.replace(/[^a-zA-Z0-9]/g, '-')}`,
      file: targetFile,
      label: targetFile.split('/').pop() ?? targetFile,
    });
    // Tab open is a side-effect; the useEditorStore's setCursor on
    // EditorSurface mount will then place the caret. We don't rely on it
    // here because cross-file navigation is best-effort in mock mode.
    onDismiss?.();
    void targetLine;
  };

  // Esc → dismiss
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label={`Full context for ${symbol}`}
      style={style}
      className={cn(
        'nss-fch-card',
        'pointer-events-auto z-50 w-[480px] overflow-hidden rounded-md border border-line/80',
        'bg-bg/85 shadow-pop backdrop-blur-md',
        'text-sm text-ink-1',
        className,
      )}
      tabIndex={-1}
    >
      <style>{entranceStyle}</style>

      {/* Header strip ─────────────────────────────────────────────── */}
      <header className="flex items-start gap-2 px-4 py-3 hairline-b">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded-sm border border-line bg-bg-subtle px-1 py-0 text-[10px] font-semibold uppercase tracking-caps text-ink-3">
              {ctx.kind}
            </span>
            <span className="truncate font-mono text-[13px] font-semibold text-ink-1">
              {ctx.name}
            </span>
            <BoundaryBadge surface={ctx.boundary.surface} />
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-ink-3">
            {ctx.file}:{ctx.line}
          </div>
          {ctx.signature ? (
            <pre className="mt-2 max-h-16 overflow-hidden truncate whitespace-pre-wrap rounded-sm bg-bg-subtle px-2 py-1 font-mono text-[11px] leading-relaxed text-ink-2">
              {ctx.signature}
            </pre>
          ) : null}
          {ctx.docs ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-2">
              {ctx.docs}
            </p>
          ) : null}
        </div>
      </header>

      {/* Counts strip ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-2 hairline-b text-[11px]">
        <CountChip label="consumers" value={ctx.counts.consumers} />
        <CountChip label="routes" value={ctx.counts.routes} tone="info" />
        <CountChip label="mutations" value={ctx.counts.mutations} tone="accent" />
        <CountChip label="cache" value={ctx.counts.cache} tone="static" />
        <CountChip label="pii" value={ctx.counts.pii} tone="warn" />
        <CountChip label="tests" value={ctx.counts.tests} />
        <CountChip label="risks" value={ctx.counts.risks} tone={ctx.counts.risks > 0 ? 'err' : 'muted'} />
      </div>

      {/* Sections ─────────────────────────────────────────────────── */}
      <Section title="Used in" defaultOpen={ctx.consumers.length > 0}>
        {ctx.consumers.length === 0 ? (
          <Empty>No consumers detected. References will appear once the index resolves.</Empty>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {ctx.consumers.slice(0, 6).map((c, i) => (
              <Row
                key={`${c.file}:${c.line}:${i}`}
                onClick={() => navigate(c.file, c.line)}
                lead={<span className="text-[10px] uppercase tracking-caps text-ink-3">{c.via}</span>}
                main={<span className="font-mono text-[11px]">{c.label ?? basename(c.file)}</span>}
                meta={`${basename(c.file)}:${c.line}`}
              />
            ))}
            {ctx.consumers.length > 6 ? (
              <li className="px-1 pt-1 text-[11px] text-ink-3">+ {ctx.consumers.length - 6} more</li>
            ) : null}
          </ul>
        )}
      </Section>

      <Section title="Routes affected" defaultOpen={ctx.routes.length > 0}>
        {ctx.routes.length === 0 ? (
          <Empty>This symbol is not reachable from a route.</Empty>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {ctx.routes.map((r) => (
              <RouteRow key={r.routeId} route={r} />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Mutations" defaultOpen={ctx.mutations.length > 0}>
        {ctx.mutations.length === 0 ? (
          <Empty>Pure read — no server actions or handlers triggered.</Empty>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {ctx.mutations.map((m) => (
              <MutationRow key={m.id} m={m} />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Cache impact" defaultOpen={ctx.cache.length > 0}>
        {ctx.cache.length === 0 ? (
          <Empty>No tags touch this symbol — safe to refactor for cache.</Empty>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {ctx.cache.map((c) => (
              <CacheRow key={c.tag} c={c} />
            ))}
          </ul>
        )}
      </Section>

      <Section title="PII flow" defaultOpen={ctx.pii.length > 0}>
        {ctx.pii.length === 0 ? (
          <Empty>No PII heuristics matched this name.</Empty>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {ctx.pii.map((p, i) => (
              <PiiRow key={`${p.file}:${p.line}:${i}`} p={p} onClick={() => navigate(p.file, p.line)} />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Tests" defaultOpen={false}>
        {ctx.tests.length === 0 ? (
          <Empty>No tests found. Add one to gain admission confidence.</Empty>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {ctx.tests.map((t, i) => (
              <TestRow key={`${t.file}:${i}`} t={t} onClick={() => navigate(t.file, t.line)} />
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Risks (${ctx.risks.length})`} defaultOpen={ctx.risks.length > 0}>
        {ctx.risks.length === 0 ? (
          <Empty>No diagnostics on this file.</Empty>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {ctx.risks.slice(0, 6).map((r) => (
              <RiskRow key={r.id} r={r} onClick={() => navigate(r.file, r.line)} />
            ))}
            {ctx.risks.length > 6 ? (
              <li className="px-1 pt-1 text-[11px] text-ink-3">+ {ctx.risks.length - 6} more</li>
            ) : null}
          </ul>
        )}
      </Section>

      {/* Footer actions ───────────────────────────────────────────── */}
      <footer className="flex items-center gap-1 px-3 py-2 hairline-t bg-bg-subtle/60">
        <WhyBrokenButton risks={ctx.risks} />
        <FixSafelyButton context={ctx} />
        <span className="ml-auto text-[10px] uppercase tracking-caps text-ink-3">Esc to close</span>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Internal small components
// ─────────────────────────────────────────────────────────────────────────

function basename(p: string): string {
  return p.split('/').pop() ?? p;
}

function BoundaryBadge({ surface }: { surface: SymbolContext['boundary']['surface'] }) {
  if (surface === 'unknown') return null;
  const tone = surface === 'client' ? 'client' : surface === 'server' ? 'server' : 'edge';
  return (
    <Chip tone={tone} size="xs">
      {surface}
    </Chip>
  );
}

function CountChip({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: number;
  tone?: 'muted' | 'info' | 'accent' | 'static' | 'warn' | 'err';
}) {
  const dim = value === 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border border-line bg-bg px-1.5 py-0.5',
        dim && 'opacity-60',
      )}
      role="status"
      aria-label={`${value} ${label}`}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          tone === 'info' && 'bg-accent',
          tone === 'accent' && 'bg-sem-edge',
          tone === 'static' && 'bg-sem-static',
          tone === 'warn' && 'bg-sev-warn',
          tone === 'err' && 'bg-sev-err',
          tone === 'muted' && 'bg-ink-3',
        )}
      />
      <span className="font-mono text-ink-1">{value}</span>
      <span className="text-ink-3">{label}</span>
    </span>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="text-[11px] italic text-ink-3">{children}</div>;
}

interface RowProps {
  onClick?: () => void;
  lead?: ReactNode;
  main: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
}
function Row({ onClick, lead, main, meta, trailing }: RowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group flex w-full items-center gap-2 rounded-sm px-1 py-1 text-left',
          'transition-colors duration-150 hover:bg-bg-hover focus-visible:bg-bg-hover focus-visible:outline-none',
        )}
      >
        {lead ? <span className="shrink-0">{lead}</span> : null}
        <span className="min-w-0 flex-1 truncate text-ink-1">{main}</span>
        {meta ? (
          <span className="shrink-0 truncate font-mono text-[10px] text-ink-3">{meta}</span>
        ) : null}
        {trailing}
      </button>
    </li>
  );
}

function RouteRow({ route }: { route: RouteRef }) {
  return (
    <Row
      lead={
        <Chip tone={route.rendering === 'static' ? 'static' : route.rendering === 'dynamic' ? 'dynamic' : 'isr'} size="xs">
          {route.rendering}
        </Chip>
      }
      main={<span className="font-mono">{route.path}</span>}
      meta={route.archetype}
    />
  );
}

function MutationRow({ m }: { m: MutationRef }) {
  return (
    <Row
      lead={<Chip tone="accent" size="xs">action</Chip>}
      main={<span className="font-mono">{m.name}</span>}
      meta={m.mutates.length > 0 ? m.mutates.slice(0, 2).join(', ') : '—'}
    />
  );
}

function CacheRow({ c }: { c: CacheImpactRef }) {
  return (
    <Row
      lead={<Chip tone="info" size="xs">tag</Chip>}
      main={<span className="font-mono">{c.tag}</span>}
      meta={
        <span>
          {c.affectedRouteIds.length} routes · {c.hasInvalidator ? 'invalidator' : 'no invalidator'}
        </span>
      }
    />
  );
}

function PiiRow({ p, onClick }: { p: PiiNodeRef; onClick?: () => void }) {
  return (
    <Row
      onClick={onClick}
      lead={
        <Chip tone={p.classification === 'secret' ? 'err' : 'warn'} size="xs">
          {p.classification}
        </Chip>
      }
      main={<span className="font-mono">{p.label}</span>}
      meta={`${basename(p.file)}:${p.line}`}
    />
  );
}

function TestRow({ t, onClick }: { t: TestRef; onClick?: () => void }) {
  return (
    <Row
      onClick={onClick}
      lead={
        <Chip tone={t.status === 'pass' ? 'static' : t.status === 'fail' ? 'err' : 'muted'} size="xs">
          {t.status}
        </Chip>
      }
      main={<span className="font-mono">{t.label ?? basename(t.file)}</span>}
      meta={`${basename(t.file)}:${t.line}`}
    />
  );
}

function RiskRow({ r, onClick }: { r: RiskRef; onClick?: () => void }) {
  return (
    <Row
      onClick={onClick}
      lead={
        <span className="inline-flex items-center gap-1">
          <SeverityDot severity={r.severity} />
          <span className="text-[10px] uppercase tracking-caps text-ink-3">{r.severity}</span>
        </span>
      }
      main={<span className="truncate">{r.title}</span>}
      meta={`${basename(r.file)}:${r.line}`}
      trailing={
        r.fromAdmission ? (
          <Chip tone="warn" size="xs">
            admission
          </Chip>
        ) : null
      }
    />
  );
}
