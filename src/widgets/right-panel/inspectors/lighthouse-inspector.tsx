import { useMemo } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import {
  Button,
  Chip,
  Inspector,
  Section,
  SeverityDot,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  LH_CATEGORY_ABBR,
  LH_CATEGORY_LABEL,
  type LhAudit,
  type LhCategory,
  rankAudits,
  rateCls,
  rateFcp,
  rateLcp,
  rateTbt,
  rateTtfb,
  reportFor,
  scoreBand,
  type VitalRating,
} from '@features/lighthouse/helpers';
import { EmptyState, KvRow } from '../parts';

interface Props {
  routeId: string;
}

const CATEGORIES: ReadonlyArray<LhCategory> = ['perf', 'a11y', 'best', 'seo', 'pwa'];

const BAND_TEXT: Record<ReturnType<typeof scoreBand>, string> = {
  good: 'text-sem-static',
  avg: 'text-sev-warn',
  poor: 'text-sev-err',
};
const BAND_PILL: Record<ReturnType<typeof scoreBand>, 'static' | 'warn' | 'err'> = {
  good: 'static',
  avg: 'warn',
  poor: 'err',
};

const VITAL_TONE: Record<VitalRating, string> = {
  good: 'bg-sem-static',
  'needs-improvement': 'bg-sev-warn',
  poor: 'bg-sev-err',
};

const IMPACT_SEV: Record<LhAudit['impact'], 'err' | 'warn' | 'hint'> = {
  high: 'err',
  med: 'warn',
  low: 'hint',
};

interface Run {
  at: string;
  perf: number;
  delta: number;
}

const MOCK_RUNS_BASE: ReadonlyArray<Pick<Run, 'at' | 'delta'>> = [
  { at: '2 hours ago', delta: -2 },
  { at: 'yesterday', delta: +4 },
  { at: '3 days ago', delta: -6 },
];

export function LighthouseInspector({ routeId }: Props) {
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const route = useRouteStore((s) => s.byId(routeId));

  const report = useMemo(() => reportFor(routeId), [routeId]);

  const top5 = useMemo(
    () => (report ? rankAudits(report.audits).slice(0, 5) : []),
    [report],
  );

  const recentRuns: Run[] = useMemo(() => {
    if (!report) return [];
    let p = report.score.perf;
    return MOCK_RUNS_BASE.map((r) => {
      const next: Run = { at: r.at, perf: p, delta: r.delta };
      p = p - r.delta;
      return next;
    });
  }, [report]);

  if (!report) {
    return (
      <Inspector
        title="LIGHTHOUSE"
        meta={routeId}
        pinned={inspectorPinned}
        onTogglePin={togglePin}
      >
        <EmptyState>No Lighthouse data for this route.</EmptyState>
      </Inspector>
    );
  }

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <Chip tone="accent" size="xs">
            LIGHTHOUSE
          </Chip>
          <span className="text-sm text-ink-1">{route?.path ?? routeId}</span>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          <span className="text-ink-3">predicted scores · web vitals</span>
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
      rightActions={
        <Button
          size="xs"
          tone="ghost"
          onClick={() => openOverlay('lighthouse', { routeId })}
        >
          Open report
        </Button>
      }
    >
      {/* Scores --------------------------------------------------------- */}
      <Section title="Scores" defaultOpen>
        <div className="grid grid-cols-5 gap-1.5">
          {CATEGORIES.map((cat) => {
            const v = report.score[cat];
            const band = scoreBand(v);
            return (
              <div
                key={cat}
                className="flex flex-col items-center gap-0.5 rounded-sm border border-line bg-bg p-1.5"
              >
                <span className="text-[10px] uppercase tracking-caps text-ink-3">
                  {LH_CATEGORY_ABBR[cat]}
                </span>
                <span className={cn('font-mono text-base font-semibold leading-none', BAND_TEXT[band])}>
                  {v}
                </span>
                <Chip size="xs" tone={BAND_PILL[band]}>
                  {band === 'good' ? 'good' : band === 'avg' ? 'avg' : 'poor'}
                </Chip>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Top opportunities --------------------------------------------- */}
      <Section title={`Top opportunities (${top5.length})`} defaultOpen>
        <ul className="space-y-1">
          {top5.map((aud) => (
            <li
              key={aud.id}
              className="grid grid-cols-[10px_1fr_auto] items-start gap-2 py-1 text-xs"
            >
              <span className="mt-1">
                <SeverityDot severity={IMPACT_SEV[aud.impact]} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-ink-1">{aud.title}</div>
                {aud.suggestion ? (
                  <div className="mt-0.5 truncate text-[11px] text-ink-3">
                    {aud.suggestion}
                  </div>
                ) : null}
              </div>
              <Chip size="xs" tone="muted">
                {LH_CATEGORY_ABBR[aud.category]}
              </Chip>
            </li>
          ))}
        </ul>
      </Section>

      {/* Web Vitals ----------------------------------------------------- */}
      <Section title="Web Vitals" defaultOpen>
        <div className="space-y-0.5">
          <KvRow label="LCP" mono>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', VITAL_TONE[rateLcp(report.lcp)])} />
              {(report.lcp / 1000).toFixed(2)} s
            </span>
          </KvRow>
          <KvRow label="TBT" mono>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', VITAL_TONE[rateTbt(report.tbt)])} />
              {Math.round(report.tbt)} ms
            </span>
          </KvRow>
          <KvRow label="CLS" mono>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', VITAL_TONE[rateCls(report.cls)])} />
              {report.cls.toFixed(3)}
            </span>
          </KvRow>
          <KvRow label="TTFB" mono>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', VITAL_TONE[rateTtfb(report.ttfb)])} />
              {Math.round(report.ttfb)} ms
            </span>
          </KvRow>
          <KvRow label="FCP" mono>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', VITAL_TONE[rateFcp(report.fcp)])} />
              {(report.fcp / 1000).toFixed(2)} s
            </span>
          </KvRow>
        </div>
      </Section>

      {/* Recent runs ---------------------------------------------------- */}
      <Section title="Recent runs" defaultOpen={false}>
        <ul className="space-y-1 text-xs">
          {recentRuns.map((r, i) => (
            <li
              key={i}
              className="flex items-center justify-between hairline-b py-1 last:border-b-0"
            >
              <span className="text-ink-3">{r.at}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-ink-1">{r.perf}</span>
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    r.delta > 0 ? 'text-sem-static' : r.delta < 0 ? 'text-sev-err' : 'text-ink-3',
                  )}
                >
                  {r.delta > 0 ? `▲ +${r.delta}` : r.delta < 0 ? `▼ ${r.delta}` : '· 0'}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-[11px] text-ink-3">
          Categories ({CATEGORIES.map((c) => LH_CATEGORY_LABEL[c]).join(', ')}) tracked.
          <button
            className="ml-1 text-accent hover:underline"
            onClick={() => toast('Open historical report (preview)')}
          >
            View history
          </button>
        </div>
      </Section>
    </Inspector>
  );
}
