import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  CHANGE_FREQ,
  INITIAL_ROUTES,
  LOCALES,
  dynamicWarnings,
  generateSitemapXml,
  summaryByFrequency,
  topByPriority,
  type ChangeFreq,
  type SitemapLocale,
  type SitemapRoute,
} from './helpers';

const FREQ_OPTIONS = CHANGE_FREQ.map((f) => ({ value: f, label: f }));

export function SitemapBuilderOverlay() {
  const open = useUiStore((s) => s.overlays.sitemapBuilder.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [routes, setRoutes] = useState<SitemapRoute[]>(() =>
    INITIAL_ROUTES.map((r) => ({ ...r, locales: [...r.locales] })),
  );
  const [search, setSearch] = useState('');
  const [hideExcluded, setHideExcluded] = useState(false);
  const [bulkFreq, setBulkFreq] = useState<ChangeFreq>('weekly');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes.filter((r) => {
      if (hideExcluded && r.exclude) return false;
      if (!q) return true;
      return r.path.toLowerCase().includes(q);
    });
  }, [routes, search, hideExcluded]);

  function update(id: string, patch: Partial<SitemapRoute>) {
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleLocale(id: string, locale: SitemapLocale) {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const has = r.locales.includes(locale);
        return {
          ...r,
          locales: has ? r.locales.filter((l) => l !== locale) : [...r.locales, locale],
        };
      }),
    );
  }

  function applyBulk() {
    setRoutes((prev) => prev.map((r) => (r.exclude ? r : { ...r, changeFrequency: bulkFreq })));
    toast(`Set ${bulkFreq} on all included routes`);
  }

  const xml = useMemo(() => generateSitemapXml(routes), [routes]);
  const freqSummary = useMemo(() => summaryByFrequency(routes), [routes]);
  const top5 = useMemo(() => topByPriority(routes, 5), [routes]);
  const dyn = useMemo(() => dynamicWarnings(routes), [routes]);

  const includedCount = routes.filter((r) => !r.exclude).length;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('sitemapBuilder')}
      title={
        <span className="flex items-center gap-2">
          <span>Sitemap builder</span>
          <Chip tone="muted" size="xs">
            {includedCount}/{routes.length} included
          </Chip>
        </span>
      }
      subtitle="sitemap.xml from your route tree"
      size="xl"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {routes.length} routes · {dyn.length} dynamic
          </span>
          <Button size="sm" tone="ghost" onClick={() => toast.success('Saved sitemap.ts (mock)')}>
            Save sitemap.ts
          </Button>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Generated robots.txt (mock)')}
          >
            Generate robots.txt
          </Button>
          <Button size="sm" tone="accent" onClick={() => toast.success('Sitemap valid (mock)')}>
            Validate
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
        <SearchInput value={search} onChange={setSearch} placeholder="filter routes" />
        <ToggleChip active={hideExcluded} onClick={() => setHideExcluded((v) => !v)}>
          Hide excluded
        </ToggleChip>
        <span className="ml-2 text-caps text-ink-3">Bulk</span>
        <SelectControl<ChangeFreq>
          label="freq"
          value={bulkFreq}
          options={FREQ_OPTIONS}
          onChange={setBulkFreq}
        />
        <Button size="xs" tone="ghost" onClick={applyBulk}>
          Apply to included
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_360px_280px] divide-x divide-line">
        {/* Routes table */}
        <div className="min-w-0 max-h-[68vh] overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-bg-subtle text-caps text-ink-3">
              <tr className="hairline-b">
                <th className="px-2 py-1.5 text-left font-medium">path</th>
                <th className="px-2 py-1.5 text-left font-medium">freq</th>
                <th className="px-2 py-1.5 text-left font-medium">priority</th>
                <th className="px-2 py-1.5 text-left font-medium">locales</th>
                <th className="px-2 py-1.5 text-center font-medium">excl.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={cn('hairline-b align-middle', r.exclude && 'opacity-50')}
                >
                  <td className="px-2 py-1.5 font-mono text-[11px] text-ink-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{r.path}</span>
                      {r.dynamic ? (
                        <Chip tone="warn" size="xs">
                          dynamic
                        </Chip>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-ink-3">{r.lastModified}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <SelectControl<ChangeFreq>
                      value={r.changeFrequency}
                      options={FREQ_OPTIONS}
                      onChange={(v) => update(r.id, { changeFrequency: v })}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={r.priority}
                        onChange={(e) =>
                          update(r.id, { priority: parseFloat(e.target.value) })
                        }
                        className="h-1 w-20 cursor-pointer"
                      />
                      <span className="w-7 font-mono text-[10px] text-ink-2">
                        {r.priority.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap gap-0.5">
                      {LOCALES.map((l) => {
                        const active = r.locales.includes(l);
                        return (
                          <button
                            key={l}
                            type="button"
                            onClick={() => toggleLocale(r.id, l)}
                            className={cn(
                              'rounded-sm border px-1 text-[10px] tracking-caps',
                              active
                                ? 'border-accent bg-accent-soft text-accent'
                                : 'border-line bg-bg text-ink-3 hover:bg-bg-hover',
                            )}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={r.exclude}
                      onChange={(e) => update(r.id, { exclude: e.target.checked })}
                      className="cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-ink-3">No routes match.</div>
          ) : null}
        </div>

        {/* XML preview */}
        <div className="min-w-0 max-h-[68vh] overflow-y-auto p-3">
          <header className="mb-2 flex items-center gap-2 text-caps text-ink-3">
            <span>sitemap.xml</span>
            <Chip tone="muted" size="xs">
              {includedCount} urls
            </Chip>
          </header>
          <CodeBlock code={xml} language="xml" maxHeight={520} />
        </div>

        {/* Right rail summary */}
        <aside className="min-w-0 max-h-[68vh] space-y-3 overflow-y-auto p-3">
          <section>
            <header className="mb-1 text-caps text-ink-3">By frequency</header>
            <ul className="space-y-1">
              {(Object.keys(freqSummary) as ChangeFreq[]).map((f) => (
                <li
                  key={f}
                  className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1 text-[11px]"
                >
                  <span className="font-mono text-ink-2">{f}</span>
                  <span className="font-mono text-ink-1">{freqSummary[f]}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <header className="mb-1 text-caps text-ink-3">Top 5 priority</header>
            <ul className="space-y-1">
              {top5.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1 text-[11px]"
                >
                  <span className="truncate font-mono text-ink-1">{r.path}</span>
                  <Chip tone="accent" size="xs">
                    {r.priority.toFixed(1)}
                  </Chip>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <header className="mb-1 text-caps text-ink-3">Warnings</header>
            {dyn.length === 0 ? (
              <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 p-2 text-center text-[11px] text-ink-3">
                No dynamic-route warnings.
              </div>
            ) : (
              <ul className="space-y-1">
                {dyn.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-sm border border-sev-warn/30 bg-sev-warn-soft px-2 py-1 text-[11px] text-sev-warn"
                  >
                    <span className="font-mono">{r.path}</span>
                    <div className="text-[10px] text-ink-3">
                      dynamic param needs static gen list
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </OverlayPanel>
  );
}
