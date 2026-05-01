import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  KIND_OPTIONS,
  RECENT_QUERIES,
  fileArea,
  searchSemantic,
  type SnippetKind,
} from './helpers';

type KindFilter = SnippetKind | 'all';

const KIND_TONE: Record<SnippetKind, 'accent' | 'info' | 'warn' | 'static' | 'hint' | 'neutral'> = {
  fn: 'neutral',
  class: 'info',
  hook: 'accent',
  component: 'static',
  action: 'warn',
  api: 'hint',
};

export function SemanticCodeSearchOverlay() {
  const open = useUiStore((s) => s.overlays.semanticCodeSearch.open);
  const seedQuery = useUiStore((s) => s.overlays.semanticCodeSearch.query);
  const close = useUiStore((s) => s.closeOverlay);

  const [query, setQuery] = useState<string>(seedQuery ?? 'useEffect cleanup with cache');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [kind, setKind] = useState<KindFilter>('all');
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const results = useMemo(() => searchSemantic(query), [query]);
  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (kind !== 'all' && r.snippet.kind !== kind) return false;
      if (areaFilter !== null && fileArea(r.snippet.file) !== areaFilter) return false;
      return true;
    });
  }, [results, kind, areaFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const r of filtered) {
      const arr = map.get(r.snippet.file) ?? [];
      arr.push(r);
      map.set(r.snippet.file, arr);
    }
    return [...map.entries()];
  }, [filtered]);

  const facetKinds = useMemo(() => {
    const m = new Map<SnippetKind, number>();
    for (const r of results) m.set(r.snippet.kind, (m.get(r.snippet.kind) ?? 0) + 1);
    return [...m.entries()];
  }, [results]);

  const facetAreas = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of results) {
      const a = fileArea(r.snippet.file);
      m.set(a, (m.get(a) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [results]);

  const top = filtered[0];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('semanticCodeSearch')}
      title="Semantic Code Search"
      subtitle="Vector-style search over indexed snippets"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            <span className="text-ink-2">{filtered.length}</span> results ·{' '}
            <span className="text-ink-2">{results.length}</span> indexed
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="default"
              disabled={top === undefined}
              onClick={() =>
                top !== undefined &&
                toast.success(`Test generated for ${top.snippet.signature.slice(0, 36)}...`)
              }
            >
              Generate test for top result
            </Button>
          </div>
        </div>
      }
    >
      {/* Top: large search input */}
      <div className="flex flex-col gap-2 hairline-b bg-bg-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-sm border border-line bg-bg px-2.5">
            <span className="text-ink-3 text-xs uppercase tracking-caps">find</span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="describe what you're looking for..."
              className="min-w-0 flex-1 bg-transparent text-sm text-ink-1 placeholder:text-ink-3 focus:outline-none"
            />
          </div>
          <button
            type="button"
            aria-pressed={caseSensitive}
            onClick={() => setCaseSensitive((v) => !v)}
            className={cn(
              'h-9 rounded-sm border px-2 font-mono text-xs',
              caseSensitive
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
            title="Case sensitive"
          >
            Aa
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">kind</span>
          {KIND_OPTIONS.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => setKind(k.key)}
              className={cn(
                'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
                kind === k.key
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_260px] divide-x divide-line">
        {/* Results list */}
        <main className="min-w-0 px-3 py-3">
          {grouped.length === 0 ? (
            <div className="px-1 py-8 text-center text-xs text-ink-3">No results.</div>
          ) : (
            <ul className="space-y-3">
              {grouped.map(([file, group]) => (
                <li key={file}>
                  <div className="mb-1 flex items-center gap-2 text-[11px]">
                    <span className="font-mono text-ink-1">{file}</span>
                    <span className="text-ink-3">· {group.length} hit{group.length === 1 ? '' : 's'}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {group.map((r) => (
                      <li
                        key={r.snippet.id}
                        className="rounded-sm border border-line bg-bg p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Chip tone={KIND_TONE[r.snippet.kind]} size="xs">
                              {r.snippet.kind}
                            </Chip>
                            <span className="font-mono text-[11px] text-ink-3">
                              :{r.snippet.line}
                            </span>
                            <span className="truncate font-mono text-[12px] text-ink-1">
                              {r.snippet.signature}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-ink-3">{r.relevance}%</span>
                            <div
                              className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-subtle"
                              title={`distance ${r.snippet.mockEmbeddingDistance.toFixed(2)}`}
                            >
                              <div
                                className="h-full bg-accent"
                                style={{ width: `${r.relevance}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <pre className="mt-1.5 overflow-auto rounded-sm bg-bg-subtle p-1.5 font-mono text-[11px] leading-[15px] text-ink-2">
                          {r.snippet.neighborhood}
                        </pre>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <Chip tone="info" size="xs">
                              {r.reason}
                            </Chip>
                            {r.snippet.tags.slice(0, 3).map((t) => (
                              <Chip key={t} tone="muted" size="xs">
                                #{t}
                              </Chip>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="xs"
                              tone="default"
                              onClick={() => toast(`Open ${r.snippet.file}:${r.snippet.line} (mock)`)}
                            >
                              Open
                            </Button>
                            <Button
                              size="xs"
                              tone="ghost"
                              onClick={() => toast(`Find similar to ${r.snippet.id} (mock)`)}
                            >
                              Find similar
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* Right rail */}
        <aside className="min-w-0 px-3 py-3">
          <h4 className="text-[10px] uppercase tracking-caps text-ink-3">Refine</h4>
          <div className="mt-1.5 space-y-2 text-[11px]">
            <div>
              <div className="mb-1 text-ink-3">By kind</div>
              <ul className="space-y-0.5">
                {facetKinds.map(([k, n]) => (
                  <li key={k}>
                    <button
                      type="button"
                      onClick={() => setKind(kind === k ? 'all' : k)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-sm px-1.5 py-0.5 hover:bg-bg-hover',
                        kind === k && 'bg-accent-soft text-accent',
                      )}
                    >
                      <span className="font-mono">{k}</span>
                      <span className="text-ink-3">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-ink-3">By file area</div>
              <ul className="space-y-0.5">
                {facetAreas.map(([a, n]) => (
                  <li key={a}>
                    <button
                      type="button"
                      onClick={() => setAreaFilter(areaFilter === a ? null : a)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-sm px-1.5 py-0.5 text-left hover:bg-bg-hover',
                        areaFilter === a && 'bg-accent-soft text-accent',
                      )}
                    >
                      <span className="truncate font-mono">{a}</span>
                      <span className="text-ink-3">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h4 className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">Recent queries</h4>
          <ul className="mt-1 space-y-0.5">
            {RECENT_QUERIES.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => setQuery(q)}
                  className="flex w-full items-start gap-1 rounded-sm px-1.5 py-1 text-left text-[11px] text-ink-2 hover:bg-bg-hover"
                >
                  <span className="text-ink-3">·</span>
                  <span className="truncate">{q}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
