// Server-action race detector — list view grouped by action.
//
// Each card expands to show before / after example code and a list of
// evidence (file + line + snippet).
import { useEffect, useMemo } from 'react';
import {
  Button,
  Chip,
  CodeBlock,
  EmptyState,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { cn } from '@shared/lib/cn';
import { useRaceDetectorStore } from './store';
import type { RaceKind, RaceRisk, RaceSeverity } from './types';

const KIND_LABEL: Record<RaceKind, string> = {
  'double-submit': 'double-submit',
  'lost-update': 'lost-update',
  'phantom-read': 'phantom-read',
  'no-dedupe': 'no-dedupe',
};

const SEVERITY_TONE: Record<RaceSeverity, 'err' | 'warn' | 'info'> = {
  high: 'err',
  medium: 'warn',
  low: 'info',
};

interface RaceDetectorOverlayProps {
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function RaceDetectorOverlay({
  open,
  onOpenChange,
}: RaceDetectorOverlayProps) {
  const status = useRaceDetectorStore((s) => s.status);
  const report = useRaceDetectorStore((s) => s.report);
  const error = useRaceDetectorStore((s) => s.error);
  const expandedRiskId = useRaceDetectorStore((s) => s.expandedRiskId);
  const lastScannedAt = useRaceDetectorStore((s) => s.lastScannedAt);
  const runScan = useRaceDetectorStore((s) => s.runScan);
  const ensureScanned = useRaceDetectorStore((s) => s.ensureScanned);
  const toggleExpanded = useRaceDetectorStore((s) => s.toggleExpanded);

  useEffect(() => {
    if (open) ensureScanned();
  }, [open, ensureScanned]);

  const grouped = useMemo(() => {
    const m = new Map<string, RaceRisk[]>();
    if (!report) return m;
    for (const r of report.risks) {
      const arr = m.get(r.action) ?? [];
      arr.push(r);
      m.set(r.action, arr);
    }
    return m;
  }, [report]);

  const counts = useMemo(() => {
    const c: Record<RaceSeverity, number> = { high: 0, medium: 0, low: 0 };
    if (!report) return c;
    for (const r of report.risks) c[r.severity] += 1;
    return c;
  }, [report]);

  const subtitle = report
    ? `${report.filesScanned} file${report.filesScanned === 1 ? '' : 's'} · ${report.risks.length} risk${report.risks.length === 1 ? '' : 's'} · ${report.durationMs} ms`
    : 'Static analysis of server actions for race conditions';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Server-action race detector"
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
        <span className="ml-auto" />
        <span className="text-[10px] text-ink-3">
          analyzer: <code className="font-mono">ts-morph</code>
        </span>
      </PanelHeader>

      <ScrollArea className="h-[520px]">
        <div className="px-4 py-3">
          {status === 'error' ? (
            <EmptyState
              title="Scan failed"
              description={error ?? 'Unknown analyzer error'}
            />
          ) : !report || report.risks.length === 0 ? (
            <EmptyState
              title={status === 'scanning' ? 'Scanning…' : 'No race risks detected'}
              description={
                status === 'scanning'
                  ? 'Parsing source files…'
                  : 'All server actions look concurrency-safe — for now.'
              }
            />
          ) : (
            <div className="space-y-4">
              {Array.from(grouped.entries()).map(([action, risks]) => (
                <section key={action}>
                  <header className="mb-1.5 flex items-baseline gap-2">
                    <h3 className="font-mono text-xs text-ink-1">{action}()</h3>
                    <span className="text-[10px] text-ink-3">
                      {risks.length} risk{risks.length === 1 ? '' : 's'}
                    </span>
                  </header>
                  <div className="space-y-2">
                    {risks.map((risk) => (
                      <RaceCard
                        key={risk.id}
                        risk={risk}
                        expanded={expandedRiskId === risk.id}
                        onToggle={() => toggleExpanded(risk.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </OverlayPanel>
  );
}

interface RaceCardProps {
  risk: RaceRisk;
  expanded: boolean;
  onToggle(): void;
}

function RaceCard({ risk, expanded, onToggle }: RaceCardProps) {
  const tone = SEVERITY_TONE[risk.severity];
  return (
    <div
      className={cn(
        'rounded-sm border bg-bg p-2.5 text-xs shadow-sm transition-colors',
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
        <span className="font-medium text-ink-1">{KIND_LABEL[risk.kind]}</span>
        <span className="ml-auto text-[10px] text-ink-3">
          {risk.evidence.length} site{risk.evidence.length === 1 ? '' : 's'} ·{' '}
          {expanded ? 'collapse' : 'expand'}
        </span>
      </button>

      <p className="mt-1.5 text-ink-2">{risk.mitigation}</p>

      {expanded ? (
        <div className="mt-3 space-y-3 border-t border-line/60 pt-3">
          <div>
            <h4 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              Evidence
            </h4>
            <ul className="space-y-1">
              {risk.evidence.map((e, i) => (
                <li
                  key={`${e.file}:${e.line}:${i}`}
                  className="flex items-start gap-2"
                >
                  <span className="font-mono text-[10px] text-ink-3">
                    {e.file}:L{e.line}
                  </span>
                  <span className="flex-1 text-ink-2">{e.reason}</span>
                </li>
              ))}
            </ul>
          </div>
          {risk.before && risk.after ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <h4 className="mb-1 text-[10px] uppercase tracking-caps text-sev-err">
                  before
                </h4>
                <CodeBlock language="ts" code={risk.before} />
              </div>
              <div>
                <h4 className="mb-1 text-[10px] uppercase tracking-caps text-accent">
                  after
                </h4>
                <CodeBlock language="ts" code={risk.after} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { useRaceDetectorStore } from './store';
export type { RaceKind, RaceRisk, RaceReport, RaceSeverity } from './types';
