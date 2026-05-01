import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  search,
  type SearchHit,
  type SearchOptions,
  type SearchResult,
} from './helpers';

export type { SearchHit, SearchOptions, SearchResult } from './helpers';
export { search } from './helpers';

const DEFAULT_OPTS: SearchOptions = {
  query: '',
  replace: '',
  regex: false,
  caseSensitive: false,
  wholeWord: false,
  include: '',
  exclude: '',
};

const SAVED_DEFAULTS = ['revalidateTag', 'use server', 'getProduct'];

function shortFile(file: string): string {
  if (file.length <= 50) return file;
  return `…${file.slice(-49)}`;
}

export function WorkspaceSearchOverlay() {
  const open = useUiStore((s) => s.overlays.workspaceSearch.open);
  const initialQuery = useUiStore((s) => s.overlays.workspaceSearch.query);
  const close = useUiStore((s) => s.closeOverlay);
  const openTab = useEditorStore((s) => s.openTab);

  const [opts, setOpts] = useState<SearchOptions>(DEFAULT_OPTS);
  const [recents, setRecents] = useState<string[]>([
    'getSession',
    'createOrderTx',
    'session',
  ]);
  const [saved, setSaved] = useState<string[]>(SAVED_DEFAULTS);
  const [replaceHistory, setReplaceHistory] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Seed query when overlay opens with prefill.
  useEffect(() => {
    if (open && initialQuery && !opts.query) {
      setOpts((o) => ({ ...o, query: initialQuery }));
    }
  }, [open, initialQuery, opts.query]);

  const result: SearchResult = useMemo(() => search(opts), [opts]);

  // Keep first 5 file groups expanded by default — we track collapsed set, so
  // anything not in collapsed is expanded.
  useEffect(() => {
    if (result.fileGroups.length > 5) {
      const next = new Set<string>();
      result.fileGroups.slice(5).forEach((g) => next.add(g.file));
      setCollapsed(next);
    } else {
      setCollapsed(new Set());
    }
  }, [result.fileGroups]);

  const onCommitQuery = () => {
    if (!opts.query) return;
    setRecents((prev) => {
      const next = [opts.query, ...prev.filter((q) => q !== opts.query)];
      return next.slice(0, 8);
    });
  };

  const onSave = () => {
    if (!opts.query) return;
    setSaved((prev) =>
      prev.includes(opts.query) ? prev : [opts.query, ...prev].slice(0, 8),
    );
    toast('Search saved', { description: opts.query });
  };

  const onReplace = (mode: 'one' | 'all') => {
    if (!opts.query) return;
    const desc =
      mode === 'all'
        ? `${result.totalHits} hits in ${result.totalFiles} files → "${opts.replace}"`
        : `next hit → "${opts.replace}"`;
    toast(`Replace ${mode === 'all' ? 'all' : 'one'} (mock)`, { description: desc });
    if (opts.replace) {
      setReplaceHistory((prev) =>
        [opts.replace, ...prev.filter((r) => r !== opts.replace)].slice(0, 6),
      );
    }
  };

  const onHitClick = (hit: SearchHit) => {
    openTab({
      id: `tab-${hit.file}`,
      file: hit.file,
      label: hit.file.split('/').pop() ?? hit.file,
    });
    toast('Opened result', { description: `${hit.file}:${hit.line}:${hit.column}` });
    close('workspaceSearch');
  };

  const toggleGroup = (file: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('workspaceSearch'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Search className="h-4 w-4 text-ink-3" />
          <span>Workspace Search</span>
        </span>
      }
      subtitle="find / replace across all files · regex · glob include / exclude"
      size="lg"
      footer={
        <>
          <Button
            size="sm"
            tone="ghost"
            onClick={() =>
              toast('Exported results (mock)', {
                description: `${result.totalHits} hits across ${result.totalFiles} files`,
              })
            }
          >
            <Icon.Doc className="h-3.5 w-3.5" /> Export results
          </Button>
          <Button size="sm" tone="ghost" onClick={() => close('workspaceSearch')}>
            Cancel
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_240px] divide-x divide-line">
        <div className="min-w-0 p-3">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              spellCheck={false}
              value={opts.query}
              onChange={(e) => setOpts((o) => ({ ...o, query: e.target.value }))}
              onBlur={onCommitQuery}
              placeholder="Search (regex / literal)…"
              className={cn(
                'flex-1 rounded-sm border border-line bg-bg px-2 py-1 font-mono text-xs text-ink-1',
                'focus:border-accent focus:outline-none',
              )}
            />
            <ToggleBtn
              active={opts.caseSensitive}
              onClick={() =>
                setOpts((o) => ({ ...o, caseSensitive: !o.caseSensitive }))
              }
              label="Aa"
              title="Match case"
            />
            <ToggleBtn
              active={opts.wholeWord}
              onClick={() =>
                setOpts((o) => ({ ...o, wholeWord: !o.wholeWord }))
              }
              label="\b"
              title="Whole word"
            />
            <ToggleBtn
              active={opts.regex}
              onClick={() => setOpts((o) => ({ ...o, regex: !o.regex }))}
              label=".*"
              title="Regex"
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              spellCheck={false}
              value={opts.replace}
              onChange={(e) =>
                setOpts((o) => ({ ...o, replace: e.target.value }))
              }
              placeholder="Replace…"
              className={cn(
                'flex-1 rounded-sm border border-line bg-bg px-2 py-1 font-mono text-xs text-ink-1',
                'focus:border-accent focus:outline-none',
              )}
            />
            <Button size="sm" tone="soft" onClick={() => onReplace('one')}>
              Replace
            </Button>
            <Button size="sm" tone="accent" onClick={() => onReplace('all')}>
              Replace All
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              spellCheck={false}
              value={opts.include}
              onChange={(e) =>
                setOpts((o) => ({ ...o, include: e.target.value }))
              }
              placeholder="files to include (e.g. app/**, *.ts)"
              className={cn(
                'rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1',
                'focus:border-accent focus:outline-none',
              )}
            />
            <input
              spellCheck={false}
              value={opts.exclude}
              onChange={(e) =>
                setOpts((o) => ({ ...o, exclude: e.target.value }))
              }
              placeholder="files to exclude (e.g. **/*.test.ts)"
              className={cn(
                'rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1',
                'focus:border-accent focus:outline-none',
              )}
            />
          </div>

          <div className="mt-3 flex items-center justify-between hairline-b pb-2">
            <p className="text-[11px] text-ink-3">
              {opts.query
                ? `${result.totalHits} hit${result.totalHits === 1 ? '' : 's'} in ${result.totalFiles} file${result.totalFiles === 1 ? '' : 's'}${result.truncated ? ' · truncated' : ''}`
                : 'Type to search'}
            </p>
            <button
              type="button"
              onClick={onSave}
              className="text-[11px] text-ink-3 hover:text-accent"
            >
              Save search
            </button>
          </div>

          <div className="mt-2 max-h-[52vh] overflow-y-auto">
            {opts.query && result.fileGroups.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-xs text-ink-3">
                No matches.
              </div>
            ) : null}
            {result.fileGroups.map((group) => {
              const isCollapsed = collapsed.has(group.file);
              return (
                <div key={group.file} className="hairline-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.file)}
                    className="flex w-full items-center gap-2 px-1 py-1.5 text-left hover:bg-bg-hover"
                  >
                    {isCollapsed ? (
                      <Icon.ChevRight className="h-3 w-3 text-ink-3" />
                    ) : (
                      <Icon.ChevDown className="h-3 w-3 text-ink-3" />
                    )}
                    <Icon.File className="h-3 w-3 text-ink-3" />
                    <span
                      className="truncate font-mono text-xs text-ink-1"
                      title={group.file}
                    >
                      {shortFile(group.file)}
                    </span>
                    <Chip tone="muted" size="xs" className="ml-auto">
                      {group.hits.length}
                    </Chip>
                  </button>
                  {isCollapsed ? null : (
                    <ul className="pb-1">
                      {group.hits.map((hit, i) => (
                        <li key={`${hit.line}-${hit.column}-${i}`}>
                          <button
                            type="button"
                            onClick={() => onHitClick(hit)}
                            className="flex w-full items-baseline gap-2 px-6 py-0.5 text-left hover:bg-bg-hover"
                          >
                            <span className="w-16 shrink-0 font-mono text-[11px] text-ink-3">
                              {hit.line}:{hit.column}
                            </span>
                            <pre className="truncate font-mono text-[11px] text-ink-2">
                              {hit.preview.slice(0, hit.matchStart)}
                              <span className="rounded-sm bg-accent-soft px-0.5 text-accent">
                                {hit.preview.slice(hit.matchStart, hit.matchEnd)}
                              </span>
                              {hit.preview.slice(hit.matchEnd)}
                            </pre>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="min-w-0 px-3 py-3">
          <SidebarSection title="Recent searches" empty="No recent searches.">
            {recents.map((q) => (
              <SidebarRow
                key={q}
                label={q}
                onClick={() => setOpts((o) => ({ ...o, query: q }))}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="Saved searches" empty="No saved searches.">
            {saved.map((q) => (
              <SidebarRow
                key={q}
                label={q}
                onClick={() => setOpts((o) => ({ ...o, query: q }))}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="Replace history" empty="No replacements yet.">
            {replaceHistory.map((r) => (
              <SidebarRow
                key={r}
                label={r}
                onClick={() => setOpts((o) => ({ ...o, replace: r }))}
              />
            ))}
          </SidebarSection>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean;
  onClick(): void;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'h-7 min-w-[28px] rounded-sm border px-1.5 font-mono text-xs',
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
      )}
    >
      {label}
    </button>
  );
}

function SidebarSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasItems = arr.some(Boolean) && arr.length > 0;
  return (
    <section className="mb-3">
      <header className="mb-1 text-caps text-ink-3">{title}</header>
      {hasItems && arr.length ? (
        <ul className="space-y-0.5">{children}</ul>
      ) : (
        <p className="text-[11px] text-ink-3">{empty}</p>
      )}
    </section>
  );
}

function SidebarRow({ label, onClick }: { label: string; onClick(): void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="block w-full truncate rounded-sm px-1.5 py-0.5 text-left font-mono text-[11px] text-ink-2 hover:bg-bg-hover"
        title={label}
      >
        {label}
      </button>
    </li>
  );
}
