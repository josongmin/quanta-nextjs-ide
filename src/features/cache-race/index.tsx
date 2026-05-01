// Cache race / overlap visualizer.
//
// Each detected risk gets a card with a tiny mini-timeline showing the
// overlapping cache operations on the same tag.
import { useEffect, useMemo } from 'react';
import {
  Button,
  Chip,
  EmptyState,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { cn } from '@shared/lib/cn';
import { useCacheRaceStore } from './store';
import type {
  CacheRaceKind,
  CacheRaceRisk,
  CacheRaceSeverity,
  CacheRaceTimelineEvent,
} from './types';

const KIND_LABEL: Record<CacheRaceKind, string> = {
  'overlap-revalidate': 'overlap',
  'redundant-revalidate': 'redundant',
  'stale-overwrite': 'stale-overwrite',
};

const SEVERITY_TONE: Record<CacheRaceSeverity, 'err' | 'warn' | 'info'> = {
  high: 'err',
  medium: 'warn',
  low: 'info',
};

const EVENT_COLOR: Record<CacheRaceTimelineEvent['kind'], string> = {
  producer: 'bg-sev-info-soft text-sev-info border-sev-info/40',
  invalidator: 'bg-accent-soft text-accent border-accent/40',
  mutation: 'bg-sev-err-soft text-sev-err border-sev-err/40',
};

interface CacheRaceOverlayProps {
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function CacheRaceOverlay({ open, onOpenChange }: CacheRaceOverlayProps) {
  const status = useCacheRaceStore((s) => s.status);
  const report = useCacheRaceStore((s) => s.report);
  const error = useCacheRaceStore((s) => s.error);
  const expandedRiskId = useCacheRaceStore((s) => s.expandedRiskId);
  const lastScannedAt = useCacheRaceStore((s) => s.lastScannedAt);
  const runScan = useCacheRaceStore((s) => s.runScan);
  const ensureScanned = useCacheRaceStore((s) => s.ensureScanned);
  const toggleExpanded = useCacheRaceStore((s) => s.toggleExpanded);

  useEffect(() => {
    if (open) ensureScanned();
  }, [open, ensureScanned]);

  const counts = useMemo(() => {
    const c: Record<CacheRaceSeverity, number> = { high: 0, medium: 0, low: 0 };
    if (!report) return c;
    for (const r of report.risks) c[r.severity] += 1;
    return c;
  }, [report]);

  const subtitle = report
    ? `${report.risks.length} race${report.risks.length === 1 ? '' : 's'} detected · ${report.durationMs} ms`
    : 'Detects overlapping cache operations across tags';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Cache race detector"
      subtitle={subtitle}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[10px] text-ink-3">
            {lastScannedAt > 0
              ? `Last scan: ${new Date(lastScannedAt).toLocaleTimeString()}`
              : 'Not scanned yet'}
          </span>
          <Button size="xs" tone="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => runScan()}
            disabled={status === 'scanning'}
          >
            {status === 'scanning' ? 'Scanning…' : 'Re-scan'}
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="tracking-caps text-ink-3">severity</span>
        <Chip tone="err" size="xs">
          {counts.high} high
        </Chip>
        <Chip tone="warn" size="xs">
          {counts.medium} med
        </Chip>
        <Chip tone="info" size="xs">
          {counts.low} low
        </Chip>
      </PanelHeader>

      <ScrollArea className="h-[480px]">
        <div className="px-4 py-3">
          {status === 'error' ? (
            <EmptyState
              title="Scan failed"
              description={error ?? 'Unknown analyzer error'}
            />
          ) : !report || report.risks.length === 0 ? (
            <EmptyState
              title={status === 'scanning' ? 'Scanning…' : 'No cache races'}
              description={
                status === 'scanning'
                  ? 'Inspecting cache-tag graph…'
                  : 'No overlapping cache operations were found.'
              }
            />
          ) : (
            <div className="space-y-2">
              {report.risks.map((risk) => (
                <RaceCard
                  key={risk.id}
                  risk={risk}
                  expanded={expandedRiskId === risk.id}
                  onToggle={() => toggleExpanded(risk.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </OverlayPanel>
  );
}

interface RaceCardProps {
  risk: CacheRaceRisk;
  expanded: boolean;
  onToggle(): void;
}

function RaceCard({ risk, expanded, onToggle }: RaceCardProps) {
  const tone = SEVERITY_TONE[risk.severity];
  const horizon = useMemo(() => {
    let max = 1;
    for (const ev of risk.events) if (ev.tSec > max) max = ev.tSec;
    return max + 0.5;
  }, [risk.events]);

  return (
    <div
      className={cn(
        'rounded-sm border bg-bg p-2.5 text-xs shadow-sm',
        tone === 'err' && 'border-sev-err/40',
        tone === 'warn' && 'border-sev-warn/40',
        tone === 'info' && 'border-line',
      )}
    >
      <button
        type="button"
        className="flex w-full items-baseline gap-2 text-left"
        onClick={onToggle}
      >
        <Chip tone={tone} size="xs">
          {risk.severity}
        </Chip>
        <Chip tone="muted" size="xs">
          {KIND_LABEL[risk.kind]}
        </Chip>
        <span className="font-medium text-ink-1">{risk.title}</span>
        <span className="ml-auto text-[10px] text-ink-3">
          {risk.events.length} site{risk.events.length === 1 ? '' : 's'} ·{' '}
          {expanded ? 'collapse' : 'expand'}
        </span>
      </button>

      <p className="mt-1.5 text-ink-2">{risk.reason}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {risk.tags.map((t) => (
          <Chip key={t} tone="accent" size="xs">
            {t}
          </Chip>
        ))}
      </div>

      {/* Mini timeline */}
      <div className="relative mt-3 h-7 rounded-sm bg-bg-subtle/60">
        {risk.events.map((ev) => (
          <div
            key={ev.id}
            className={cn(
              'absolute top-0.5 flex h-6 items-center justify-center rounded-sm border px-1.5 text-[10px] font-medium',
              EVENT_COLOR[ev.kind],
            )}
            style={{
              left: `calc(${(ev.tSec / horizon) * 100}% )`,
              minWidth: 90,
            }}
            title={`${ev.label} — ${ev.file}:L${ev.line}`}
          >
            <span className="truncate">{ev.label}</span>
          </div>
        ))}
      </div>

      {expanded ? (
        <div className="mt-3 space-y-2 border-t border-line/60 pt-3">
          <div>
            <h4 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              Mitigation
            </h4>
            <p className="text-ink-2">{risk.mitigation}</p>
          </div>
          <div>
            <h4 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              Sites
            </h4>
            <ul className="space-y-0.5">
              {risk.events.map((ev) => (
                <li key={`detail_${ev.id}`} className="font-mono text-[11px]">
                  <span className="text-ink-3">{ev.file}:L{ev.line}</span>
                  <span className="ml-2 text-ink-2">{ev.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { useCacheRaceStore } from './store';
export type { CacheRaceKind, CacheRaceRisk, CacheRaceReport } from './types';
