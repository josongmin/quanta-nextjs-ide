import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  RECENT_QUERIES,
  SEARCH_ATTRIBUTES,
  SYNONYMS,
  highlight,
  parseQuery,
  runSearch,
  type SearchAttribute,
  type SearchFilters,
} from './helpers';

const PRICE_RANGES: ReadonlyArray<{ id: SearchFilters['priceRange']; label: string }> = [
  { id: 'all', label: 'all' },
  { id: 'lt50', label: '<$50' },
  { id: '50-150', label: '$50–150' },
  { id: 'gt150', label: '>$150' },
];

const CATEGORY_OPTIONS = ['Apparel', 'Home', 'Electronics', 'Outdoor', 'Books', 'Beauty'];

export function SearchPlaygroundOverlay() {
  const open = useUiStore((s) => s.overlays.searchPlayground.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [query, setQuery] = useState('+sweater wool');
  const [activeAttrs, setActiveAttrs] = useState<ReadonlySet<SearchAttribute>>(new Set(SEARCH_ATTRIBUTES));
  const [activeCats, setActiveCats] = useState<ReadonlySet<string>>(new Set());
  const [priceRange, setPriceRange] = useState<SearchFilters['priceRange']>('all');
  const [synonyms, setSynonyms] = useState(SYNONYMS.map((s) => ({ ...s })));

  const result = useMemo(
    () =>
      runSearch(query, {
        attrs: activeAttrs,
        categories: activeCats,
        priceRange,
      }),
    [query, activeAttrs, activeCats, priceRange],
  );

  const parsed = parseQuery(query);
  const allTerms = [...parsed.required, ...parsed.bare, ...parsed.phrases];

  const categoryFacets = result.facets.category ?? [];
  const tagFacets = result.facets.tags ?? [];
  const maxFacet = Math.max(1, ...categoryFacets.map((f) => f.count));

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('searchPlayground')}
      title="Search playground"
      subtitle="Algolia-style query analyzer"
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Query saved as test (mock)')}>
            Save query as test
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Config exported (mock)')}>
            Export config
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try: +wool "down jacket" -kids'
          className="h-7 flex-1 min-w-[280px] rounded-sm border border-line bg-bg px-2 font-mono text-xs"
        />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">attrs</span>
        <div className="flex gap-1">
          {SEARCH_ATTRIBUTES.map((a) => (
            <ToggleChip
              key={a}
              active={activeAttrs.has(a)}
              onClick={() => {
                setActiveAttrs((prev) => {
                  const next = new Set(prev);
                  if (next.has(a)) next.delete(a);
                  else next.add(a);
                  return next;
                });
              }}
            >
              {a}
            </ToggleChip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle/60 px-3 py-2">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">cat</span>
        <div className="flex flex-wrap gap-1">
          {CATEGORY_OPTIONS.map((c) => (
            <ToggleChip
              key={c}
              active={activeCats.has(c)}
              onClick={() => {
                setActiveCats((prev) => {
                  const next = new Set(prev);
                  if (next.has(c)) next.delete(c);
                  else next.add(c);
                  return next;
                });
              }}
            >
              {c}
            </ToggleChip>
          ))}
        </div>
        <span className="ml-3 text-[10px] uppercase tracking-caps text-ink-3">price</span>
        <div className="flex gap-1">
          {PRICE_RANGES.map((p) => (
            <ToggleChip key={p.id} active={p.id === priceRange} onClick={() => setPriceRange(p.id)}>
              {p.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_360px_280px]">
        <div className="hairline-r">
          <ScrollArea className="max-h-[60vh]">
            <ul>
              {result.hits.length === 0 ? (
                <li className="p-4 text-[12px] text-ink-3">No results</li>
              ) : (
                result.hits.map((h, i) => (
                  <li key={h.doc.id} className="border-t border-line/60 first:border-t-0 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 text-right font-mono text-[10px] text-ink-3">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink-1">
                          {highlight(h.doc.title, allTerms).map((p, k) => (
                            <span
                              key={k}
                              className={cn(p.hit && 'bg-accent-soft text-accent rounded-sm px-0.5')}
                            >
                              {p.text}
                            </span>
                          ))}
                        </div>
                        <div className="truncate text-[11px] text-ink-3">
                          {highlight(h.doc.description, allTerms).map((p, k) => (
                            <span key={k} className={cn(p.hit && 'bg-accent-soft text-accent')}>
                              {p.text}
                            </span>
                          ))}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Chip tone="muted" size="xs">{h.doc.category}</Chip>
                          <Chip tone="hint" size="xs">${h.doc.price}</Chip>
                          {h.doc.tags.slice(0, 3).map((t) => (
                            <Chip key={t} tone="info" size="xs">#{t}</Chip>
                          ))}
                        </div>
                      </div>
                      <div className="w-20 shrink-0 text-right">
                        <div className="font-mono text-[11px] text-ink-2">{h.score.toFixed(1)}</div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-subtle">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${Math.min(100, (h.score / 30) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </div>

        <div className="hairline-r p-3">
          <div className="mb-2 flex items-center gap-2">
            <Chip tone="static" size="sm">{result.totalHits} hits</Chip>
            <Chip tone="muted" size="sm">{result.ms}ms</Chip>
          </div>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">parse tree</div>
          <div className="rounded-sm border border-line bg-bg p-2">
            {parsed.required.length === 0 &&
            parsed.excluded.length === 0 &&
            parsed.phrases.length === 0 &&
            parsed.bare.length === 0 ? (
              <span className="text-[11px] text-ink-3">empty query</span>
            ) : null}
            {parsed.required.length > 0 ? (
              <div className="mb-1 flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-ink-3">required:</span>
                {parsed.required.map((t) => (
                  <Chip key={t} tone="static" size="xs">+{t}</Chip>
                ))}
              </div>
            ) : null}
            {parsed.excluded.length > 0 ? (
              <div className="mb-1 flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-ink-3">excluded:</span>
                {parsed.excluded.map((t) => (
                  <Chip key={t} tone="err" size="xs">-{t}</Chip>
                ))}
              </div>
            ) : null}
            {parsed.phrases.length > 0 ? (
              <div className="mb-1 flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-ink-3">phrases:</span>
                {parsed.phrases.map((t) => (
                  <Chip key={t} tone="accent" size="xs">"{t}"</Chip>
                ))}
              </div>
            ) : null}
            {parsed.bare.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-ink-3">bare:</span>
                {parsed.bare.map((t) => (
                  <Chip key={t} tone="muted" size="xs">{t}</Chip>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-3 mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            facets · category
          </div>
          <svg viewBox="0 0 320 140" width="100%" className="rounded-sm border border-line bg-bg">
            {categoryFacets.length === 0 ? (
              <text x="160" y="74" fill="#9aa1ab" fontSize="10" textAnchor="middle" fontFamily="system-ui">
                no facets
              </text>
            ) : (
              categoryFacets.slice(0, 6).map((f, i) => {
                const w = (f.count / maxFacet) * 200;
                return (
                  <g key={f.key}>
                    <text x="6" y={20 + i * 20} fill="#3c4043" fontSize="10" fontFamily="system-ui">
                      {f.key}
                    </text>
                    <rect x="80" y={10 + i * 20} width={w} height={12} fill="#1d6dfd" fillOpacity="0.7" />
                    <text x={84 + w} y={20 + i * 20} fill="#5f6368" fontSize="10" fontFamily="system-ui">
                      {f.count}
                    </text>
                  </g>
                );
              })
            )}
          </svg>

          <div className="mt-2 mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            facets · tags
          </div>
          <div className="flex flex-wrap gap-1">
            {tagFacets.length === 0 ? (
              <span className="text-[11px] text-ink-3">none</span>
            ) : (
              tagFacets.map((f) => (
                <Chip key={f.key} tone="info" size="xs">
                  {f.key} · {f.count}
                </Chip>
              ))
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">synonyms</div>
            <ul className="space-y-1">
              {synonyms.map((s, i) => (
                <li key={i} className="flex items-center gap-1">
                  <input
                    value={s.a}
                    onChange={(e) =>
                      setSynonyms((arr) => arr.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))
                    }
                    className="h-6 w-1/2 rounded-sm border border-line bg-bg px-1.5 text-[11px]"
                  />
                  <span className="text-[11px] text-ink-3">↔</span>
                  <input
                    value={s.b}
                    onChange={(e) =>
                      setSynonyms((arr) => arr.map((x, j) => (j === i ? { ...x, b: e.target.value } : x)))
                    }
                    className="h-6 flex-1 rounded-sm border border-line bg-bg px-1.5 text-[11px]"
                  />
                </li>
              ))}
            </ul>

            <div className="mt-3 mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              recent queries
            </div>
            <ul className="space-y-1">
              {RECENT_QUERIES.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => setQuery(q)}
                    className="block w-full truncate rounded-sm border border-line bg-bg px-2 py-1 text-left font-mono text-[11px] text-ink-1 hover:bg-bg-hover"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}
