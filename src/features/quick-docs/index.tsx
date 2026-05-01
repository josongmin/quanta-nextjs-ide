import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, EmptyState, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CATEGORY_LABEL,
  QUICK_DOC_INDEX,
  type QuickDocCategory,
  type QuickDocEntry,
  lookupDoc,
} from './docs';

const CATEGORIES: ReadonlyArray<QuickDocCategory> = ['next', 'react', 'ts', 'css'];

const CATEGORY_TONE: Record<QuickDocCategory, 'accent' | 'info' | 'warn' | 'static'> = {
  next: 'accent',
  react: 'info',
  ts: 'warn',
  css: 'static',
};

function DocBody({ entry }: { entry: QuickDocEntry }) {
  return (
    <div className="space-y-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Chip size="sm" tone={CATEGORY_TONE[entry.category]}>
            {CATEGORY_LABEL[entry.category]}
          </Chip>
          <code className="font-mono text-md font-semibold text-ink-1">{entry.symbol}</code>
        </div>
        <a
          href={entry.reference}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <Icon.UpRight className="h-3 w-3" />
          Reference
        </a>
      </header>
      <p className="text-sm text-ink-2">{entry.oneLiner}</p>

      {entry.signature ? (
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">Signature</div>
          <CodeBlock
            code={entry.signature}
            language="ts"
            maxHeight={120}
            showLineNumbers={false}
          />
        </div>
      ) : null}

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">Example</div>
        <CodeBlock code={entry.example} language="tsx" maxHeight={240} showLineNumbers={false} />
      </div>

      {entry.caveats && entry.caveats.length > 0 ? (
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">Caveats</div>
          <ul className="space-y-1">
            {entry.caveats.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-2">
                <Icon.Bulb className="mt-0.5 h-3 w-3 shrink-0 text-sev-warn" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function QuickDocsOverlay() {
  const open = useUiStore((s) => s.overlays.quickDocs.open);
  const symbol = useUiStore((s) => s.overlays.quickDocs.symbol);
  const close = useUiStore((s) => s.closeOverlay);
  const openOverlay = useUiStore((s) => s.openOverlay);

  const [query, setQuery] = useState('');

  const entry = useMemo<QuickDocEntry | undefined>(
    () => (symbol ? lookupDoc(symbol) : undefined),
    [symbol],
  );

  const grouped = useMemo(() => {
    const out: Record<QuickDocCategory, QuickDocEntry[]> = { next: [], react: [], ts: [], css: [] };
    const q = query.trim().toLowerCase();
    for (const k of Object.keys(QUICK_DOC_INDEX)) {
      const e = QUICK_DOC_INDEX[k];
      if (!e) continue;
      if (q && !e.symbol.toLowerCase().includes(q) && !e.oneLiner.toLowerCase().includes(q)) {
        continue;
      }
      out[e.category].push(e);
    }
    return out;
  }, [query]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('quickDocs'))}
      title="Quick Docs"
      subtitle={entry ? entry.symbol : 'inline reference for any symbol'}
      size="sm"
      footer={
        entry ? (
          <Button
            size="xs"
            tone="ghost"
            onClick={() => openOverlay('quickDocs', { symbol: undefined })}
          >
            <Icon.Search className="h-3 w-3" />
            Browse all
          </Button>
        ) : (
          <span className="text-[11px] text-ink-3">
            {Object.keys(QUICK_DOC_INDEX).length} entries indexed
          </span>
        )
      }
    >
      {entry ? (
        <DocBody entry={entry} />
      ) : (
        <div className="p-3">
          <div className="mb-3 flex items-center gap-2">
            <Icon.Search className="h-4 w-4 text-ink-3" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol, hook, or CSS feature…"
              className="h-7 flex-1 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 outline-none focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const list = grouped[cat];
              if (!list || list.length === 0) return null;
              return (
                <section key={cat}>
                  <header className="mb-1 flex items-center gap-2 hairline-b pb-1">
                    <Chip size="xs" tone={CATEGORY_TONE[cat]}>
                      {CATEGORY_LABEL[cat]}
                    </Chip>
                    <span className="text-[10px] uppercase tracking-caps text-ink-3">
                      {list.length}
                    </span>
                  </header>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {list.map((e) => (
                      <li key={e.symbol}>
                        <button
                          onClick={() =>
                            openOverlay('quickDocs', { symbol: e.symbol })
                          }
                          className={cn(
                            'flex w-full items-start gap-2 rounded-sm px-2 py-1 text-left hover:bg-bg-hover',
                          )}
                        >
                          <Icon.Code className="mt-0.5 h-3 w-3 shrink-0 text-ink-3" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-xs text-ink-1">
                              {e.symbol}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-ink-3">
                              {e.oneLiner}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            {Object.values(grouped).every((arr) => arr.length === 0) ? (
              <EmptyState title="No matches" description={`No docs match “${query}”.`} />
            ) : null}
          </div>
        </div>
      )}
    </OverlayPanel>
  );
}
