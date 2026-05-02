/**
 * Cockpit Start Screen — SOTA++ first-impression project pulse.
 *
 * Renders when no editor tab is active, or as a deliberate overlay via
 * the `cockpit` overlays key. All values are derived from existing
 * stores (route, diagnostic, evidence) — see `./derive.ts`.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { Button, Icon, Kbd, OverlayPanel, Skeleton } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { RiskRow } from './risk-row';
import { RecentRow } from './recent-row';
import { StatTile } from './stat-tile';
import { useCockpitStore } from './store';
import { useCockpitOverlay } from './integration';
import type {
  CockpitRisk,
  ProjectPulse,
  ReadinessGate,
  ReadinessVerdict,
} from './types';

// ─────────────────────────────────────────────────────────────
// Verdict badge
// ─────────────────────────────────────────────────────────────

const VERDICT_LABEL: Record<ReadinessVerdict, string> = {
  admit: 'ADMIT',
  review: 'REVIEW',
  reject: 'REJECT',
};

const VERDICT_TONE: Record<ReadinessVerdict, string> = {
  admit:
    'border-sem-static/40 bg-sem-static/10 text-sem-static',
  review:
    'border-sev-warn/40 bg-sev-warn-soft text-sev-warn',
  reject:
    'border-sev-err/40 bg-sev-err-soft text-sev-err',
};

function VerdictBadge({ verdict }: { verdict: ReadinessVerdict }) {
  const pulse = verdict !== 'admit';
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-bold tracking-caps',
        VERDICT_TONE[verdict],
        pulse && 'mi-pulse-ring',
      )}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Gate chip
// ─────────────────────────────────────────────────────────────

const GATE_TONE: Record<ReadinessGate['status'], string> = {
  pass: 'border-sem-static/30 text-sem-static bg-sem-static/8',
  warn: 'border-sev-warn/30 text-sev-warn bg-sev-warn-soft/60',
  fail: 'border-sev-err/30 text-sev-err bg-sev-err-soft/60',
  pending: 'border-line text-ink-3 bg-bg-subtle',
};

const GATE_GLYPH: Record<ReadinessGate['status'], string> = {
  pass: '✓',
  warn: '!',
  fail: '✗',
  pending: '·',
};

function GateChip({ gate }: { gate: ReadinessGate }) {
  return (
    <span
      title={gate.detail}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium',
        GATE_TONE[gate.status],
      )}
    >
      <span className="font-mono text-[10px] leading-none">
        {GATE_GLYPH[gate.status]}
      </span>
      <span>{gate.label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini-bar breakdown for the routes tile
// ─────────────────────────────────────────────────────────────

function RoutesBreakdown({
  staticCount,
  dynamic,
  streaming,
}: {
  staticCount: number;
  dynamic: number;
  streaming: number;
}) {
  const total = Math.max(staticCount + dynamic + streaming, 1);
  const sPct = (staticCount / total) * 100;
  const dPct = (dynamic / total) * 100;
  const stPct = (streaming / total) * 100;
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex h-1 w-full overflow-hidden rounded-full bg-bg-subtle">
        <span style={{ width: `${sPct}%` }} className="bg-sem-static" />
        <span style={{ width: `${dPct}%` }} className="bg-sem-dynamic" />
        <span style={{ width: `${stPct}%` }} className="bg-sem-isr" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sem-static">{staticCount}s</span>
        <span className="text-sem-dynamic">{dynamic}d</span>
        <span className="text-sem-isr">{streaming}str</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stagger delays
// ─────────────────────────────────────────────────────────────

const SECTION_STAGGER = 60;

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function CockpitSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[980px] p-12">
      <div className="space-y-8">
        <Skeleton className="h-10 w-72 mi-shimmer" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 mi-shimmer" />
          ))}
        </div>
        <Skeleton className="h-40 mi-shimmer" />
        <Skeleton className="h-32 mi-shimmer" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Cockpit body
// ─────────────────────────────────────────────────────────────

interface CockpitBodyProps {
  pulse: ProjectPulse;
  /** When true, renders the "Open editor" CTA (only meaningful as the
   *  empty editor state — not when this view is itself an overlay). */
  inlineLayout?: boolean;
  /** Optional override for the Esc / overlay close action. */
  onDismiss?: () => void;
}

function CockpitBody({ pulse, inlineLayout, onDismiss }: CockpitBodyProps) {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard: "/" focuses the codebase search input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape' && onDismiss) {
        onDismiss();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  function openEvidence(risk: CockpitRisk) {
    openOverlay('evidenceTracer', { diagnosticId: risk.diagnosticId });
  }

  const hasRisks = pulse.risks.length > 0;
  const recent = pulse.recentShipped[0];

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[980px] p-12',
        'animate-spring-up motion-reduce:animate-none',
      )}
    >
      {/* HEADER ─────────────────────────────────────────── */}
      <header
        style={{
          animationDelay: `${0 * SECTION_STAGGER}ms`,
          animationFillMode: 'both',
        }}
        className="animate-fade-in motion-reduce:animate-none"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white',
              'gradient-accent shadow-glow-accent',
            )}
          >
            N
          </span>
          <h1 className="text-[32px] font-bold tracking-tighter2 text-ink-1 leading-none">
            {pulse.projectName}
          </h1>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
              'border-accent/40 text-accent',
              'bg-gradient-to-r from-accent/5 to-transparent',
            )}
          >
            {pulse.framework}
          </span>
        </div>
        <p className="mt-2 ml-11 text-sm text-ink-3">
          {pulse.workspacePath}
          <span className="mx-2 text-ink-3/60">·</span>
          <span className="text-ink-3 nums-tabular">
            {new Date(pulse.computedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </p>
      </header>

      {/* STATS ─────────────────────────────────────────── */}
      <section
        style={{
          animationDelay: `${1 * SECTION_STAGGER}ms`,
          animationFillMode: 'both',
        }}
        className="mt-8 grid grid-cols-4 gap-4 animate-fade-in motion-reduce:animate-none"
      >
        <StatTile
          label="Routes"
          value={pulse.totals.total}
          delayMs={1 * SECTION_STAGGER}
          breakdown={
            <RoutesBreakdown
              staticCount={pulse.totals.static}
              dynamic={pulse.totals.dynamic}
              streaming={pulse.totals.streaming}
            />
          }
        />
        <StatTile
          label="Client JS p50"
          value={pulse.totals.clientKbP50}
          unit="kB"
          delayMs={1 * SECTION_STAGGER + 40}
          breakdown={
            <span>
              median across {pulse.totals.total} page route
              {pulse.totals.total === 1 ? '' : 's'}
            </span>
          }
        />
        <StatTile
          label="Server budget"
          value={pulse.totals.serverBudgetPct}
          unit="%"
          delayMs={1 * SECTION_STAGGER + 80}
          breakdown={<span>headroom remaining</span>}
        />
        <StatTile
          label="Risks"
          value={pulse.risks.length}
          delayMs={1 * SECTION_STAGGER + 120}
          breakdown={
            <span>
              {pulse.risks.filter((r) => r.severity === 'err').length} err ·{' '}
              {pulse.risks.filter((r) => r.severity === 'warn').length} warn
            </span>
          }
        />
      </section>

      {/* RISKS ─────────────────────────────────────────── */}
      <section
        style={{
          animationDelay: `${2 * SECTION_STAGGER}ms`,
          animationFillMode: 'both',
        }}
        className="mt-8 animate-fade-in motion-reduce:animate-none"
      >
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-caps text-ink-2">
            Needs attention
          </h2>
          <span
            className={cn(
              'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums',
              hasRisks
                ? 'bg-sev-warn-soft text-sev-warn'
                : 'bg-sem-static/15 text-sem-static',
            )}
          >
            {pulse.risks.length}
          </span>
        </div>
        {hasRisks ? (
          <div className="flex flex-col gap-2">
            {pulse.risks.map((risk, i) => (
              <RiskRow
                key={risk.id}
                risk={risk}
                delayMs={2 * SECTION_STAGGER + i * 80}
                onOpenEvidence={openEvidence}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-3 rounded-md border px-4 py-3 text-sm',
              'border-sem-static/30 bg-sem-static/8 text-sem-static',
            )}
          >
            <span className="font-bold">All clear ✓</span>
            <span className="text-ink-2">
              no admission-gate findings — ship with confidence
            </span>
          </div>
        )}
      </section>

      {/* RECENTLY SHIPPED ───────────────────────────────── */}
      <section
        style={{
          animationDelay: `${3 * SECTION_STAGGER}ms`,
          animationFillMode: 'both',
        }}
        className="mt-8 animate-fade-in motion-reduce:animate-none"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-caps text-ink-2">
            Recently shipped
          </h2>
          {recent ? (
            <span className="text-[11px] text-ink-3 nums-tabular">
              latest{' '}
              {Math.max(
                1,
                Math.round((Date.now() - recent.shippedAt) / 60_000),
              )}
              m ago
            </span>
          ) : null}
        </div>
        <div className="rounded-md border border-line bg-bg px-3">
          {pulse.recentShipped.length ? (
            pulse.recentShipped.map((c, i, arr) => (
              <div key={c.id}>
                <RecentRow
                  change={c}
                  delayMs={3 * SECTION_STAGGER + i * 50}
                />
                {i < arr.length - 1 ? (
                  <div className="hairline-fade-x" />
                ) : null}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-[12px] text-ink-3">
              no recent ships in this workspace
            </div>
          )}
        </div>
      </section>

      {/* DEPLOY READINESS ───────────────────────────────── */}
      <section
        style={{
          animationDelay: `${4 * SECTION_STAGGER}ms`,
          animationFillMode: 'both',
        }}
        className="mt-8 animate-fade-in motion-reduce:animate-none"
      >
        <div
          className={cn(
            'rounded-lg border bg-bg p-5',
            'border-line',
            'glass',
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <VerdictBadge verdict={pulse.deployReadiness.verdict} />
            <div className="flex flex-wrap gap-1.5">
              {pulse.deployReadiness.gates.map((g) => (
                <GateChip key={g.id} gate={g} />
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                tone="ghost"
                size="sm"
                onClick={() => openOverlay('aiPatchGate')}
              >
                Run admission
              </Button>
              <Button
                tone="soft"
                size="sm"
                onClick={() => openOverlay('semanticCodeSearch')}
              >
                <Icon.Search className="h-3.5 w-3.5" />
                Ask the codebase
              </Button>
              {inlineLayout ? (
                <Button
                  tone="accent"
                  size="sm"
                  onClick={() => openOverlay('commandPalette')}
                >
                  Open editor
                  <span className="ml-1 flex items-center gap-0.5">
                    <Kbd>⌘</Kbd>
                    <Kbd>P</Kbd>
                  </span>
                </Button>
              ) : (
                <Button tone="accent" size="sm" onClick={onDismiss}>
                  Dismiss
                  <Kbd>Esc</Kbd>
                </Button>
              )}
            </div>
          </div>

          {pulse.deployReadiness.reasons.length ? (
            <ul className="mt-3 space-y-0.5 text-[11px] text-ink-3">
              {pulse.deployReadiness.reasons.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden>›</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Hidden, focusable codebase-search input — "/" routes here. */}
        <input
          ref={searchInputRef}
          aria-label="Search codebase"
          placeholder='Press "/" to ask the codebase'
          onFocus={() => openOverlay('semanticCodeSearch')}
          className={cn(
            'mt-4 block w-full rounded-md border border-line bg-bg-subtle px-3 py-2 text-sm',
            'text-ink-1 placeholder:text-ink-3',
            'mi-focus-ring focus:border-accent/50 focus:bg-bg',
          )}
        />
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Public entry — inline (editor empty state) and overlay variants
// ─────────────────────────────────────────────────────────────

interface CockpitViewProps {
  /** Render as the editor's empty state (vs. an overlay). Default true. */
  inline?: boolean;
}

export function CockpitView({ inline = true }: CockpitViewProps) {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const hasActiveTab = tabs.some((t) => t.id === activeTabId);

  const refresh = useCockpitStore((s) => s.refresh);
  const cached = useCockpitStore((s) => s.pulse);

  // Compute the pulse on mount and whenever the cockpit becomes visible.
  // Done in an effect so the first paint can show the skeleton (when the
  // store is cold) and let the spring-up entrance read.
  const [ready, setReady] = useState<ProjectPulse | null>(cached);
  useEffect(() => {
    const next = refresh();
    setReady(next);
  }, [refresh, hasActiveTab]);

  const pulse = useMemo(() => ready ?? cached, [ready, cached]);

  if (!pulse) {
    return (
      <main
        className={cn(
          inline && 'flex h-full min-h-0 overflow-auto bg-bg',
          !inline && 'h-full overflow-auto',
        )}
      >
        <CockpitSkeleton />
      </main>
    );
  }

  const { closeCockpit } = {
    closeCockpit: () => {
      // For the overlay path (handled by `<CockpitOverlay />`) we close
      // via the UI store; for the inline path Esc is a no-op.
      useUiStore.getState().closeOverlay('cockpit');
    },
  };

  return (
    <main
      className={cn(
        'h-full min-h-0 overflow-auto bg-bg',
        inline && 'flex',
      )}
    >
      <CockpitBody
        pulse={pulse}
        inlineLayout={inline}
        onDismiss={inline ? undefined : closeCockpit}
      />
    </main>
  );
}

/**
 * Overlay variant — wraps `CockpitBody` in an `OverlayPanel` so the
 * cockpit can be opened on demand (via command palette or top-bar
 * button) even when an editor tab is active.
 */
export function CockpitOverlay() {
  const { open, closeCockpit } = useCockpitOverlay();
  const refresh = useCockpitStore((s) => s.refresh);
  const [pulse, setPulse] = useState<ProjectPulse | null>(null);

  useEffect(() => {
    if (open) setPulse(refresh());
  }, [open, refresh]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : closeCockpit())}
      title="Cockpit"
      subtitle="Project pulse"
      size="lg"
    >
      {pulse ? (
        <CockpitBody pulse={pulse} inlineLayout={false} onDismiss={closeCockpit} />
      ) : (
        <CockpitSkeleton />
      )}
    </OverlayPanel>
  );
}

export { useCockpitOverlay } from './integration';
export type { ProjectPulse, CockpitRisk, ShippedChange } from './types';
