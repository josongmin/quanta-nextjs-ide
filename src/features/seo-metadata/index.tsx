/**
 * SEO / Metadata / AEO validator panel.
 *
 * Spec area 44.  Surfaces a route table with score donuts, expand-on-click
 * for full preview cards, and a footer summary covering sitemap coverage
 * and AEO opportunities.
 */

import { useMemo, useState } from 'react';
import { Button, Chip, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import { useSeoStore } from './store';
import { RouteCard } from './route-card';
import type { RouteSeoReport } from './types';
import { aeoOpportunities } from './structured-data';

type Filter = 'all' | 'errors' | 'aeo' | 'critical';

export function SeoMetadataPanel() {
  const reports = useSeoStore((s) => s.reports);
  const sitemapDiff = useSeoStore((s) => s.sitemapDiff);
  const rescan = useSeoStore((s) => s.rescan);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(
    () => reports.filter((r) => keep(r, filter)),
    [reports, filter],
  );

  const totals = useMemo(() => summarize(reports), [reports]);
  const opps = useMemo(
    () =>
      aeoOpportunities(
        reports.flatMap((r) => r.metadata.jsonLd.map((j) => j.type)),
      ),
    [reports],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader>
        <span className="text-caps text-ink-3">SEO / Metadata</span>
        <span className="text-[11px] text-ink-2">
          {totals.routes} routes · score {totals.avgScore} avg
        </span>
        <div className="ml-2 flex items-center gap-1">
          {(['all', 'errors', 'aeo', 'critical'] as const).map((f) => (
            <ToggleChip
              key={f}
              active={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </ToggleChip>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="xs" tone="soft" onClick={rescan}>
            Rescan
          </Button>
        </div>
      </PanelHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Routes" value={totals.routes} />
            <Stat
              label="Errors"
              value={totals.errors}
              tone={totals.errors > 0 ? 'err' : 'static'}
            />
            <Stat
              label="AEO gaps"
              value={totals.aeo}
              tone={totals.aeo > 0 ? 'warn' : 'static'}
            />
            <Stat
              label="Sitemap"
              value={`${Math.round(sitemapDiff.coverage * 100)}%`}
              tone={sitemapDiff.coverage > 0.8 ? 'static' : 'warn'}
            />
          </div>

          {opps.length > 0 ? (
            <div className="rounded-sm border border-line bg-bg-subtle/30 p-2 text-[11px]">
              <div className="text-caps text-[10px] text-ink-3">
                AEO opportunities (no route currently emits these)
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {opps.map((t) => (
                  <Chip key={t} size="xs" tone="info">
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            {filtered.length === 0 ? (
              <div className="rounded-sm border border-dashed border-line p-3 text-center text-[11px] text-ink-3">
                No routes match the current filter.
              </div>
            ) : (
              filtered.map((r) => (
                <RouteCard
                  key={r.route}
                  report={r}
                  defaultOpen={r.route === filtered[0]?.route}
                />
              ))
            )}
          </div>

          <SitemapBlock />
        </div>
      </ScrollArea>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'muted',
}: {
  readonly label: string;
  readonly value: string | number;
  readonly tone?: 'muted' | 'static' | 'warn' | 'err';
}) {
  const cls = cn(
    'text-md font-medium',
    tone === 'static' && 'text-sem-static',
    tone === 'warn' && 'text-sev-warn',
    tone === 'err' && 'text-sev-err',
    tone === 'muted' && 'text-ink-1',
  );
  return (
    <div className="rounded-sm border border-line bg-bg-subtle/30 p-2">
      <div className="text-caps text-[9px] uppercase text-ink-3">{label}</div>
      <div className={cls}>{value}</div>
    </div>
  );
}

function SitemapBlock() {
  const sitemap = useSeoStore((s) => s.sitemap);
  const diff = useSeoStore((s) => s.sitemapDiff);
  return (
    <div className="rounded-sm border border-line bg-bg-subtle/30 p-2 text-[11px]">
      <div className="flex items-center gap-1.5">
        <span className="text-caps text-[10px] text-ink-3">Sitemap</span>
        <Chip size="xs" tone={diff.hasSitemap ? 'static' : 'err'}>
          {diff.hasSitemap ? 'app/sitemap.ts' : 'missing'}
        </Chip>
        <Chip size="xs" tone={diff.hasRobots ? 'static' : 'warn'}>
          {diff.hasRobots ? 'app/robots.ts' : 'no robots'}
        </Chip>
        <span className="ml-auto text-ink-3">
          {sitemap.entries.length} entries
        </span>
      </div>
      {diff.missingFromSitemap.length > 0 ? (
        <div className="mt-1 text-sev-warn">
          Missing: {diff.missingFromSitemap.join(', ')}
        </div>
      ) : null}
      {diff.orphans.length > 0 ? (
        <div className="text-ink-3">Orphans: {diff.orphans.join(', ')}</div>
      ) : null}
    </div>
  );
}

function keep(r: RouteSeoReport, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'errors') return r.issues.some((i) => i.severity === 'error');
  if (f === 'critical') return r.metadata.critical !== null;
  if (f === 'aeo')
    return r.issues.some((i) => i.kind.startsWith('aeo-missing'));
  return true;
}

function summarize(reports: ReadonlyArray<RouteSeoReport>) {
  const errors = reports.reduce(
    (n, r) => n + r.issues.filter((i) => i.severity === 'error').length,
    0,
  );
  const aeo = reports.reduce(
    (n, r) =>
      n + r.issues.filter((i) => i.kind.startsWith('aeo-missing')).length,
    0,
  );
  const avgScore =
    reports.length === 0
      ? 0
      : Math.round(
          reports.reduce((n, r) => n + r.score, 0) / reports.length,
        );
  return { routes: reports.length, errors, aeo, avgScore };
}
