import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import {
  Button,
  Chip,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  EmptyState,
  Icon,
  OverlayPanel,
  SeverityDot,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  LH_CATEGORY_ABBR,
  LH_CATEGORY_LABEL,
  type LhAudit,
  type LhCategory,
  type LhRouteReport,
  lhReports,
  rankAudits,
  rateCls,
  rateFcp,
  rateLcp,
  rateTbt,
  rateTtfb,
  reportFor,
  scoreBand,
  type VitalRating,
} from './helpers';

const CATEGORIES: ReadonlyArray<LhCategory> = ['perf', 'a11y', 'best', 'seo', 'pwa'];

const BAND_STROKE: Record<ReturnType<typeof scoreBand>, string> = {
  good: 'stroke-sem-static',
  avg: 'stroke-sev-warn',
  poor: 'stroke-sev-err',
};
const BAND_TEXT: Record<ReturnType<typeof scoreBand>, string> = {
  good: 'text-sem-static',
  avg: 'text-sev-warn',
  poor: 'text-sev-err',
};

const IMPACT_TONE: Record<LhAudit['impact'], 'err' | 'warn' | 'muted'> = {
  high: 'err',
  med: 'warn',
  low: 'muted',
};

const IMPACT_SEV: Record<LhAudit['impact'], 'err' | 'warn' | 'hint'> = {
  high: 'err',
  med: 'warn',
  low: 'hint',
};

const VITAL_TONE: Record<VitalRating, string> = {
  good: 'bg-sem-static',
  'needs-improvement': 'bg-sev-warn',
  poor: 'bg-sev-err',
};

function ScoreGauge({
  score,
  label,
  size = 96,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 210;
  const endAngle = -30;
  const sweep = startAngle - endAngle; // 240
  const ratio = Math.max(0, Math.min(1, score / 100));
  const band = scoreBand(score);
  const polar = (deg: number): { x: number; y: number } => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };
  const start = polar(startAngle);
  const end = polar(endAngle);
  const valueAngle = startAngle - sweep * ratio;
  const valueEnd = polar(valueAngle);
  const arcPath = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    largeArc: 0 | 1,
  ): string => `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 0 ${p1.x} ${p1.y}`;
  const trackPath = arcPath(start, end, 1);
  const arcSpan = startAngle - valueAngle;
  const valuePath = arcPath(start, valueEnd, arcSpan > 180 ? 1 : 0);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} score`}>
          <path d={trackPath} fill="none" className="stroke-line" strokeWidth={stroke} strokeLinecap="round" />
          {ratio > 0 ? (
            <path
              d={valuePath}
              fill="none"
              className={BAND_STROKE[band]}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-mono text-xl font-semibold leading-none', BAND_TEXT[band])}>
            {Math.round(score)}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-caps text-ink-3">/100</span>
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-caps text-ink-2">{label}</span>
    </div>
  );
}

function VitalRow({
  label,
  value,
  unit,
  rating,
}: {
  label: string;
  value: string;
  unit: string;
  rating: VitalRating;
}) {
  return (
    <div className="flex items-center justify-between gap-3 hairline-b py-1.5 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', VITAL_TONE[rating])} aria-label={`rating ${rating}`} />
        <span className="text-[11px] uppercase tracking-caps text-ink-2">{label}</span>
      </div>
      <span className="font-mono text-xs text-ink-1">
        {value}
        {unit ? <span className="ml-0.5 text-[10px] text-ink-3">{unit}</span> : null}
      </span>
    </div>
  );
}

export function LighthouseOverlay() {
  const open = useUiStore((s) => s.overlays.lighthouse.open);
  const initialRouteId = useUiStore((s) => s.overlays.lighthouse.routeId);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);

  const [routeId, setRouteId] = useState<string>(
    initialRouteId ?? routes[0]?.id ?? 'route_home',
  );
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  const report: LhRouteReport | undefined = useMemo(() => reportFor(routeId), [routeId]);
  const ranked = useMemo(
    () => (report ? rankAudits(report.audits).slice(0, 5) : []),
    [report],
  );

  const route = routes.find((r) => r.id === routeId);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('lighthouse'))}
      title="Lighthouse Predictor"
      subtitle="perf · a11y · best practices · SEO · PWA"
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Compare across routes (preview)')}>
            <Icon.Layers className="h-3 w-3" />
            Compare across routes
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Export HTML report (preview)')}>
            <Icon.Doc className="h-3 w-3" />
            Export HTML report
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-10 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Route</span>
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          className="h-6 rounded-sm border border-line bg-bg px-1.5 font-mono text-xs text-ink-1 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {lhReports.map((r) => {
            const rt = routes.find((x) => x.id === r.routeId);
            return (
              <option key={r.routeId} value={r.routeId}>
                {rt?.path ?? r.routeId}
              </option>
            );
          })}
        </select>
        <div className="ml-2 inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {(['mobile', 'desktop'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              aria-selected={device === d}
              className={cn(
                'h-5 rounded-full px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                device === d && 'bg-bg-selected text-ink-1',
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="xs"
            tone="default"
            onClick={() => toast('Audit run queued', { description: 'Mock LH run for ' + (route?.path ?? routeId) })}
          >
            <Icon.Refresh className="h-3 w-3" />
            Run audit
          </Button>
        </div>
      </div>

      {report ? (
        <>
          {/* Score gauges header */}
          <div className="grid grid-cols-5 gap-3 px-4 py-4 hairline-b">
            {CATEGORIES.map((cat) => (
              <ScoreGauge
                key={cat}
                score={report.score[cat]}
                label={LH_CATEGORY_ABBR[cat]}
              />
            ))}
          </div>

          {/* Body 2-column */}
          <div className="grid grid-cols-[1fr_320px]">
            <section className="hairline-r p-3">
              <header className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink-1">Opportunities</h3>
                  <Chip size="xs" tone="muted">
                    top {ranked.length}
                  </Chip>
                </div>
                <span className="font-mono text-[11px] text-ink-3">
                  {route?.path ?? routeId}
                </span>
              </header>
              <ul className="space-y-1">
                {ranked.map((aud) => (
                  <ContextMenu key={aud.id}>
                    <ContextMenuTrigger asChild>
                      <li
                        onClick={() =>
                          toast('Apply audit fix (preview)', {
                            description: aud.suggestion ?? aud.title,
                          })
                        }
                        className="grid cursor-default grid-cols-[12px_1fr_auto_auto] items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-bg-hover"
                      >
                        <span className="mt-1.5">
                          <SeverityDot severity={IMPACT_SEV[aud.impact]} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm text-ink-1">{aud.title}</div>
                          {aud.suggestion ? (
                            <div className="mt-0.5 truncate text-[11px] text-ink-3">
                              {aud.suggestion}
                            </div>
                          ) : null}
                        </div>
                        <span className="font-mono text-[11px] text-ink-3">
                          {aud.saving ?? '—'}
                        </span>
                        <Chip size="xs" tone={IMPACT_TONE[aud.impact]}>
                          {LH_CATEGORY_ABBR[aud.category]}
                        </Chip>
                      </li>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => toast(`Show evidence: ${aud.title}`)}>
                        Show evidence
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => toast(`Apply fix: ${aud.title}`)}>
                        Apply fix
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => toast(`Muted: ${aud.id}`)}>
                        Mute
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </ul>
              <div className="mt-3 text-[11px] text-ink-3">
                Showing {ranked.length} of {report.audits.length} audits.
                <button
                  className="ml-1 text-accent hover:underline"
                  onClick={() => toast('See all audits (preview)')}
                >
                  See all
                </button>
              </div>
            </section>

            <aside className="bg-bg-subtle p-3">
              <header className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-1">Web Vitals</h3>
                <Chip size="xs" tone="muted">
                  {device}
                </Chip>
              </header>
              <div>
                <VitalRow
                  label="LCP"
                  value={(report.lcp / 1000).toFixed(2)}
                  unit="s"
                  rating={rateLcp(report.lcp)}
                />
                <VitalRow
                  label="TBT"
                  value={String(Math.round(report.tbt))}
                  unit="ms"
                  rating={rateTbt(report.tbt)}
                />
                <VitalRow
                  label="CLS"
                  value={report.cls.toFixed(3)}
                  unit=""
                  rating={rateCls(report.cls)}
                />
                <VitalRow
                  label="TTFB"
                  value={String(Math.round(report.ttfb))}
                  unit="ms"
                  rating={rateTtfb(report.ttfb)}
                />
                <VitalRow
                  label="FCP"
                  value={(report.fcp / 1000).toFixed(2)}
                  unit="s"
                  rating={rateFcp(report.fcp)}
                />
              </div>
              <div className="mt-3 text-[11px] text-ink-3">
                Thresholds use Web Vitals 2024 standards.
              </div>
              <div className="mt-3 flex flex-col gap-1">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center justify-between text-[11px] text-ink-2">
                    <span>{LH_CATEGORY_LABEL[cat]}</span>
                    <span className={cn('font-mono', BAND_TEXT[scoreBand(report.score[cat])])}>
                      {report.score[cat]}
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </>
      ) : (
        <EmptyState title="No Lighthouse report" description="No data for this route." />
      )}
    </OverlayPanel>
  );
}
