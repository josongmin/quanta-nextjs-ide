import { useEffect, useMemo } from 'react';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  EmptyState,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { cn } from '@shared/lib/cn';
import { useCacheDirectiveStore } from '@entities/cache-directive';
import type {
  UseCacheFinding,
  UseCacheKind,
} from '@entities/cache-directive';

const KIND_LABEL: Record<UseCacheKind, string> = {
  'has-directive': 'has directive',
  candidate: 'candidate',
  unsafe: 'unsafe',
};

const KIND_TONE: Record<UseCacheKind, 'accent' | 'warn' | 'err'> = {
  'has-directive': 'accent',
  candidate: 'warn',
  unsafe: 'err',
};

export function UseCacheAnalyzerOverlay() {
  const open = useUiStore((s) => s.overlays.useCacheAnalyzer.open);
  const close = useUiStore((s) => s.closeOverlay);

  const status = useCacheDirectiveStore((s) => s.status);
  const report = useCacheDirectiveStore((s) => s.report);
  const error = useCacheDirectiveStore((s) => s.error);
  const lastScannedAt = useCacheDirectiveStore((s) => s.lastScannedAt);
  const runScan = useCacheDirectiveStore((s) => s.runScan);
  const ensureScanned = useCacheDirectiveStore((s) => s.ensureScanned);

  // Kick off the first scan when the overlay is opened.
  useEffect(() => {
    if (open) ensureScanned();
  }, [open, ensureScanned]);

  const counts = useMemo(() => {
    const c: Record<UseCacheKind, number> = {
      'has-directive': 0,
      candidate: 0,
      unsafe: 0,
    };
    if (!report) return c;
    for (const f of report.findings) c[f.kind] += 1;
    return c;
  }, [report]);

  const grouped = useMemo(() => {
    const m = new Map<string, UseCacheFinding[]>();
    if (!report) return m;
    for (const f of report.findings) {
      const arr = m.get(f.file) ?? [];
      arr.push(f);
      m.set(f.file, arr);
    }
    return m;
  }, [report]);

  const subtitle = report
    ? `${report.filesScanned} file${report.filesScanned === 1 ? '' : 's'} · ${report.findings.length} finding${report.findings.length === 1 ? '' : 's'} · scanned in ${report.durationMs} ms`
    : 'Real ts-morph AST scan of e2e/fixtures/next-app/app';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('useCacheAnalyzer'))}
      title="`use cache` analyzer"
      subtitle={subtitle}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[10px] text-ink-3">
            {lastScannedAt > 0
              ? `Last scan: ${new Date(lastScannedAt).toLocaleTimeString()}`
              : 'Not scanned yet'}
          </span>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => close('useCacheAnalyzer')}
          >
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
        <span className="tracking-caps text-ink-3">summary</span>
        <Chip tone="accent" size="xs">
          {counts['has-directive']} has-directive
        </Chip>
        <Chip tone="warn" size="xs">
          {counts.candidate} candidate
        </Chip>
        <Chip tone="err" size="xs">
          {counts.unsafe} unsafe
        </Chip>
        <span className="ml-auto" />
        <span className="text-[10px] text-ink-3">
          analyzer: <code className="font-mono">ts-morph</code>
        </span>
      </PanelHeader>

      <ScrollArea className="h-[480px]">
        <div className="px-4 py-3">
          {status === 'error' ? (
            <EmptyState
              title="Scan failed"
              description={error ?? 'Unknown analyzer error'}
            />
          ) : !report || report.findings.length === 0 ? (
            <EmptyState
              title="No findings"
              description={
                status === 'scanning'
                  ? 'Scanning fixture sources…'
                  : 'The fixture is empty or contains no analyzable functions.'
              }
            />
          ) : (
            <div className="space-y-4">
              {Array.from(grouped.entries()).map(([file, findings]) => (
                <section key={file}>
                  <header className="mb-1 flex items-baseline gap-2">
                    <h3 className="font-mono text-xs text-ink-1">{file}</h3>
                    <span className="text-[10px] text-ink-3">
                      {findings.length} finding{findings.length === 1 ? '' : 's'}
                    </span>
                  </header>
                  <ul className="divide-y divide-line rounded-sm border border-line bg-bg">
                    {findings.map((f, i) => (
                      <li
                        key={`${f.file}:${f.line}:${f.name}:${i}`}
                        className="flex items-start gap-2 px-2 py-1.5 text-xs"
                      >
                        <Chip tone={KIND_TONE[f.kind]} size="xs">
                          {KIND_LABEL[f.kind]}
                        </Chip>
                        <span className="font-mono text-[11px] text-ink-3">
                          L{f.line}
                        </span>
                        <span className="font-mono text-ink-1">{f.name}</span>
                        <span className={cn('flex-1 text-ink-2')}>{f.reason}</span>
                        <span className="text-[10px] uppercase tracking-caps text-ink-3">
                          {f.scope}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </OverlayPanel>
  );
}
