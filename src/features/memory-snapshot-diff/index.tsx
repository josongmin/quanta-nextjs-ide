import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { cn } from '@shared/lib/cn';
import {
  SNAPSHOTS,
  diffSnapshots,
  formatKb,
  signedKb,
  type DiffRow,
} from './helpers';

type SortKey = 'deltaSize' | 'afterSize' | 'deltaCount' | 'constructor';

function leakTone(
  kind: NonNullable<DiffRow['leakHint']>['kind'],
): 'err' | 'warn' | 'info' | 'hint' {
  switch (kind) {
    case 'detached':
      return 'err';
    case 'listener':
      return 'warn';
    case 'cache':
      return 'info';
    case 'closure':
      return 'hint';
  }
}

export function MemorySnapshotDiffOverlay() {
  const open = useUiStore((s) => s.overlays.memorySnapshotDiff.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [beforeId, setBeforeId] = useState<string>('s_t0');
  const [afterId, setAfterId] = useState<string>('s_t3');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('deltaSize');
  const [expandedCtor, setExpandedCtor] = useState<string | null>(null);

  const rows = useMemo<ReadonlyArray<DiffRow>>(() => {
    return diffSnapshots(beforeId, afterId);
  }, [beforeId, afterId]);

  const filtered = useMemo<ReadonlyArray<DiffRow>>(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => r.constructor.toLowerCase().includes(q))
      : rows;
    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'deltaSize':
          return b.deltaSize - a.deltaSize;
        case 'afterSize':
          return b.afterSize - a.afterSize;
        case 'deltaCount':
          return b.deltaCount - a.deltaCount;
        case 'constructor':
          return a.constructor.localeCompare(b.constructor);
      }
    });
    return sorted;
  }, [rows, search, sortKey]);

  const totalDelta = rows.reduce((sum, r) => sum + r.deltaSize, 0);
  const maxAbsDelta = Math.max(...rows.map((r) => Math.abs(r.deltaSize)), 1);

  const histo = useMemo<ReadonlyArray<{ label: string; count: number }>>(() => {
    const bins: Array<{ label: string; lo: number; hi: number; count: number }> = [
      { label: '<1KB', lo: 0, hi: 1024, count: 0 },
      { label: '<8KB', lo: 1024, hi: 8 * 1024, count: 0 },
      { label: '<32KB', lo: 8 * 1024, hi: 32 * 1024, count: 0 },
      { label: '<128KB', lo: 32 * 1024, hi: 128 * 1024, count: 0 },
      { label: '<1MB', lo: 128 * 1024, hi: 1024 * 1024, count: 0 },
      { label: '>=1MB', lo: 1024 * 1024, hi: Infinity, count: 0 },
    ];
    for (const r of rows) {
      for (const b of bins) {
        if (r.afterSize >= b.lo && r.afterSize < b.hi) {
          b.count += 1;
          break;
        }
      }
    }
    return bins.map((b) => ({ label: b.label, count: b.count }));
  }, [rows]);

  const histoMax = Math.max(...histo.map((h) => h.count), 1);

  const snapshotOpts = SNAPSHOTS.map((s) => ({
    value: s.id,
    label: `${s.label} · ${s.capturedAt}`,
  }));

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('memorySnapshotDiff')}
      title="Memory Snapshot Diff"
      subtitle="before vs after — grouped by constructor"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="text-ink-3">
            <span className="text-ink-2">Δ retained:</span>{' '}
            <span
              className={cn(
                'font-mono',
                totalDelta > 0 ? 'text-sev-err' : 'text-ink-1',
              )}
            >
              {signedKb(totalDelta)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Snapshot saved (mock)')}
            >
              Save snapshot
            </Button>
            <Button
              size="xs"
              tone="warn"
              onClick={() => toast('Marked as leak suspect (mock)')}
            >
              Mark as leak
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => close('memorySnapshotDiff')}
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          before
        </span>
        <SelectControl
          value={beforeId}
          onChange={setBeforeId}
          options={snapshotOpts}
        />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          after
        </span>
        <SelectControl
          value={afterId}
          onChange={setAfterId}
          options={snapshotOpts}
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        <SelectControl<SortKey>
          label="sort"
          value={sortKey}
          onChange={setSortKey}
          options={[
            { value: 'deltaSize', label: 'Δ size' },
            { value: 'afterSize', label: 'after size' },
            { value: 'deltaCount', label: 'Δ count' },
            { value: 'constructor', label: 'name' },
          ]}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="filter constructor"
          className="ml-auto w-56"
        />
      </PanelHeader>

      <div className="grid" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="hairline-r">
          <div
            className="grid hairline-b bg-bg-subtle px-2 py-1 text-[10px] uppercase tracking-caps text-ink-3"
            style={{
              gridTemplateColumns: '1fr 64px 64px 80px 80px 80px 1fr',
            }}
          >
            <span>constructor</span>
            <span className="text-right">before</span>
            <span className="text-right">after</span>
            <span className="text-right">Δ count</span>
            <span className="text-right">before sz</span>
            <span className="text-right">after sz</span>
            <span>Δ size</span>
          </div>
          <ScrollArea className="max-h-[440px]">
            <ul>
              {filtered.map((r) => {
                const expanded = expandedCtor === r.constructor;
                const dPct = (Math.abs(r.deltaSize) / maxAbsDelta) * 100;
                const grew = r.deltaSize > 0;
                return (
                  <li key={r.constructor} className="hairline-b">
                    <div
                      className="grid cursor-pointer items-center gap-1 px-2 py-1 text-[11px] hover:bg-bg-hover"
                      style={{
                        gridTemplateColumns: '1fr 64px 64px 80px 80px 80px 1fr',
                      }}
                      onClick={() =>
                        setExpandedCtor((c) =>
                          c === r.constructor ? null : r.constructor,
                        )
                      }
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-ink-1">
                          {r.constructor}
                        </span>
                        {r.leakHint ? (
                          <Chip
                            tone={leakTone(r.leakHint.kind)}
                            size="xs"
                            title={r.leakHint.reason}
                          >
                            {r.leakHint.kind}
                          </Chip>
                        ) : null}
                      </div>
                      <span className="text-right font-mono text-ink-2">
                        {r.beforeCount}
                      </span>
                      <span className="text-right font-mono text-ink-1">
                        {r.afterCount}
                      </span>
                      <span className="text-right">
                        {r.deltaCount !== 0 ? (
                          <Chip
                            tone={r.deltaCount > 0 ? 'err' : 'static'}
                            size="xs"
                          >
                            {r.deltaCount > 0 ? '+' : ''}
                            {r.deltaCount}
                          </Chip>
                        ) : (
                          <span className="font-mono text-ink-3">0</span>
                        )}
                      </span>
                      <span className="text-right font-mono text-ink-3">
                        {formatKb(r.beforeSize)}
                      </span>
                      <span className="text-right font-mono text-ink-1">
                        {formatKb(r.afterSize)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 flex-1 rounded-full bg-bg-subtle">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              grew ? 'bg-sev-err' : 'bg-sem-static',
                            )}
                            style={{ width: `${Math.max(2, dPct)}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            'w-16 text-right font-mono text-[10px]',
                            grew
                              ? 'text-sev-err'
                              : r.deltaSize < 0
                                ? 'text-sem-static'
                                : 'text-ink-3',
                          )}
                        >
                          {signedKb(r.deltaSize)}
                        </span>
                      </div>
                    </div>
                    {expanded ? (
                      <div className="bg-bg-subtle px-3 py-2">
                        {r.leakHint ? (
                          <div className="mb-2 flex items-start gap-1.5 rounded-sm border border-line bg-bg px-2 py-1.5">
                            <Chip tone={leakTone(r.leakHint.kind)} size="xs">
                              likely {r.leakHint.kind}
                            </Chip>
                            <span className="text-[11px] text-ink-2">
                              {r.leakHint.reason}
                            </span>
                          </div>
                        ) : null}
                        <h4 className="text-[10px] uppercase tracking-caps text-ink-3">
                          top retainer chains
                        </h4>
                        <div className="mt-1 space-y-1.5">
                          {r.retainerChains.slice(0, 3).map((chain, i) => (
                            <div
                              key={i}
                              className="rounded-sm border border-line bg-bg p-1.5 font-mono text-[10px]"
                            >
                              {chain.map((step, j) => (
                                <div
                                  key={j}
                                  className="flex items-center gap-1"
                                  style={{ paddingLeft: j * 12 }}
                                >
                                  <span className="text-ink-3">
                                    {j === chain.length - 1 ? '→' : '↓'}
                                  </span>
                                  <span className="text-ink-1">
                                    {step.label}
                                  </span>
                                  {step.hint ? (
                                    <Chip tone="warn" size="xs">
                                      {step.hint}
                                    </Chip>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-[11px] text-ink-3">
                  No constructors match.
                </li>
              )}
            </ul>
          </ScrollArea>
        </div>

        <aside className="p-3">
          <div className="rounded-sm border border-line bg-bg">
            <div className="flex h-7 items-center hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
              retained size distribution
            </div>
            <div className="p-2">
              <svg
                viewBox={`0 0 240 130`}
                preserveAspectRatio="none"
                className="block h-32 w-full"
              >
                {histo.map((bin, i) => {
                  const bw = 240 / histo.length - 6;
                  const bx = i * (240 / histo.length) + 3;
                  const bh = (bin.count / histoMax) * 90;
                  const by = 100 - bh;
                  return (
                    <g key={bin.label}>
                      <rect
                        x={bx}
                        y={by}
                        width={bw}
                        height={bh}
                        rx={1}
                        className="fill-accent-soft stroke-accent"
                        strokeWidth={0.5}
                      />
                      <text
                        x={bx + bw / 2}
                        y={by - 2}
                        fontSize={9}
                        textAnchor="middle"
                        className="fill-ink-2"
                      >
                        {bin.count}
                      </text>
                      <text
                        x={bx + bw / 2}
                        y={114}
                        fontSize={8}
                        textAnchor="middle"
                        className="fill-ink-3"
                      >
                        {bin.label}
                      </text>
                    </g>
                  );
                })}
                <line
                  x1={0}
                  x2={240}
                  y1={100}
                  y2={100}
                  className="stroke-line"
                  strokeWidth={0.5}
                />
              </svg>
            </div>
          </div>

          <div className="mt-2 rounded-sm border border-line bg-bg p-2">
            <h4 className="text-[10px] uppercase tracking-caps text-ink-3">
              summary
            </h4>
            <dl className="mt-1 grid grid-cols-2 gap-y-0.5 text-[11px]">
              <dt className="text-ink-3">groups</dt>
              <dd className="font-mono text-ink-1">{rows.length}</dd>
              <dt className="text-ink-3">grew</dt>
              <dd className="font-mono text-sev-err">
                {rows.filter((r) => r.deltaSize > 0).length}
              </dd>
              <dt className="text-ink-3">shrank</dt>
              <dd className="font-mono text-sem-static">
                {rows.filter((r) => r.deltaSize < 0).length}
              </dd>
              <dt className="text-ink-3">leak hints</dt>
              <dd className="font-mono text-sev-warn">
                {rows.filter((r) => r.leakHint).length}
              </dd>
            </dl>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
