import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  DEAD_ENTRIES,
  KIND_FILTERS,
  KIND_TONE,
  RISK_TONE,
  relativeDate,
  type DeadEntry,
  type DeadKind,
} from './helpers';

type KindFilter = DeadKind | 'all';

export function DeadCodeFinderOverlay() {
  const open = useUiStore((s) => s.overlays.deadCodeFinder.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [safeOnly, setSafeOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [marked, setMarked] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...DEAD_ENTRIES]
      .filter((e) => kindFilter === 'all' || e.kind === kindFilter)
      .filter((e) => !safeOnly || e.risk === 'safe')
      .filter(
        (e) =>
          q.length === 0 ||
          e.name.toLowerCase().includes(q) ||
          e.file.toLowerCase().includes(q),
      )
      .sort((a, b) => b.sizeKB - a.sizeKB);
  }, [kindFilter, safeOnly, search]);

  const totalKB = useMemo(() => {
    let s = 0;
    for (const e of DEAD_ENTRIES) if (marked.has(e.id)) s += e.sizeKB;
    return s;
  }, [marked]);

  function toggleMarked(id: string): void {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('deadCodeFinder')}
      title="Dead Code Finder"
      subtitle="Unused exports, files, and dead branches"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            <span className="text-ink-2">{marked.size}</span> selected ·{' '}
            <span className="text-ink-2">{totalKB.toFixed(1)}KB</span> to remove
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="accent"
              disabled={marked.size === 0}
              onClick={() => toast.success(`Removal PR drafted for ${marked.size} entries (mock)`)}
            >
              Open removal PR (mock)
            </Button>
          </div>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">kind</span>
        {KIND_FILTERS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKindFilter(k.key)}
            className={cn(
              'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
              kindFilter === k.key
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {k.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-line" />
        <button
          type="button"
          aria-pressed={safeOnly}
          onClick={() => setSafeOnly((v) => !v)}
          className={cn(
            'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
            safeOnly
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
          )}
        >
          safe only
        </button>
        <div className="ml-auto flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search name / file..."
            className="w-48 bg-transparent text-[11px] text-ink-1 placeholder:text-ink-3 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-3 py-2">
        <div className="grid grid-cols-[24px_minmax(0,2fr)_70px_minmax(0,2fr)_70px_70px_70px] gap-2 px-2 py-1 text-[10px] uppercase tracking-caps text-ink-3">
          <span aria-hidden></span>
          <span>name</span>
          <span>kind</span>
          <span>file</span>
          <span className="text-right">size</span>
          <span>touched</span>
          <span>risk</span>
        </div>
        <ul className="divide-y divide-line/60 rounded-sm border border-line">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-ink-3">No entries match.</li>
          ) : (
            filtered.map((e: DeadEntry) => {
              const isOpen = expanded === e.id;
              const isMarked = marked.has(e.id);
              return (
                <li key={e.id} className="text-[11px]">
                  <div className="grid grid-cols-[24px_minmax(0,2fr)_70px_minmax(0,2fr)_70px_70px_70px] items-center gap-2 px-2 py-1.5 hover:bg-bg-subtle">
                    <input
                      type="checkbox"
                      checked={isMarked}
                      onChange={() => toggleMarked(e.id)}
                      className="h-3 w-3"
                      aria-label={`Mark ${e.name} for delete`}
                    />
                    <button
                      type="button"
                      className="truncate text-left font-mono text-ink-1 hover:underline"
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                    >
                      {e.name}
                    </button>
                    <Chip tone={KIND_TONE[e.kind]} size="xs">
                      {e.kind}
                    </Chip>
                    <span className="truncate font-mono text-ink-3">
                      {e.file}:{e.line}
                    </span>
                    <span className="text-right font-mono text-ink-2">{e.sizeKB.toFixed(1)}KB</span>
                    <span className="text-ink-3">{relativeDate(e.lastTouched)}</span>
                    <Chip tone={RISK_TONE[e.risk]} size="xs">
                      {e.risk}
                    </Chip>
                  </div>
                  {isOpen && (
                    <div className="bg-bg-subtle px-3 py-2 text-[11px] text-ink-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                            Usage chain
                          </div>
                          {e.usageChain.length === 0 ? (
                            <div className="rounded-sm border border-dashed border-line bg-bg px-2 py-1.5 text-ink-3">
                              No importers — looks safe to delete.
                            </div>
                          ) : (
                            <ul className="space-y-0.5">
                              {e.usageChain.map((u, i) => (
                                <li
                                  key={`${e.id}-u-${i}`}
                                  className="flex items-start gap-1 font-mono"
                                >
                                  <span className="text-ink-3">·</span>
                                  <span>{u}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {e.whyKept !== undefined && (
                            <div>
                              <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                                Why kept
                              </div>
                              <div className="rounded-sm bg-sev-warn-soft px-2 py-1 text-sev-warn">
                                {e.whyKept}
                              </div>
                            </div>
                          )}
                          {e.suggestedReplacement !== undefined && (
                            <div>
                              <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                                Suggested replacement
                              </div>
                              <div className="rounded-sm bg-sem-static-soft px-2 py-1 font-mono text-sem-static">
                                {e.suggestedReplacement}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </OverlayPanel>
  );
}
