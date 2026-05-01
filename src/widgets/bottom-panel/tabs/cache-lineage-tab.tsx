import { useMemo } from 'react';
import { match } from 'ts-pattern';
import { useEditorStore } from '@entities/editor';
import { useActionStore } from '@entities/server-action';
import { useCacheTagStore } from '@entities/cache-tag';
import { useLastTraceStore } from '@entities/rsc-payload';
import type { CacheTag, CacheTagSite, ServerAction } from '@shared/types';
import { Chip, Icon, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';

type CoverageMark = 'ok' | 'missing' | 'na';

function tabIdFor(file: string): string {
  return `tab-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

function tabLabelFor(file: string): string {
  return file.split('/').pop() ?? file;
}

/**
 * Build coverage matrix: rows=tags, cols=server-actions.
 * - 'ok' if action revalidates and route(s) using the action belong to tag
 * - 'missing' if action mutates but doesn't revalidate the tag
 * - 'na' if action has no relation to the tag
 */
function buildCoverage(
  tags: CacheTag[],
  actions: ServerAction[],
): Array<{ tag: CacheTag; row: Array<{ action: ServerAction; mark: CoverageMark }> }> {
  return tags.map((tag) => ({
    tag,
    row: actions.map((action) => {
      const revalidate = action.checklist.find((c) => c.key === 'revalidate');
      const mutation = action.checklist.find((c) => c.key === 'mutation');
      const actionUsesTag =
        action.routeId !== null &&
        tag.affectedRouteIds.includes(action.routeId);

      let mark: CoverageMark = 'na';
      if (mutation?.state === 'ok' || mutation?.state === 'partial') {
        if (actionUsesTag) {
          mark = revalidate?.state === 'ok' ? 'ok' : 'missing';
        }
      }
      return { action, mark };
    }),
  }));
}

export function CacheLineageTab() {
  const tags = useCacheTagStore((s) => s.tags);
  const selectedTagId = useCacheTagStore((s) => s.selectedTagId);
  const setSelected = useCacheTagStore((s) => s.setSelected);
  const view = useCacheTagStore((s) => s.view);
  const setView = useCacheTagStore((s) => s.setView);
  const actions = useActionStore((s) => s.actions);
  const openTab = useEditorStore((s) => s.openTab);

  const tagOptions = useMemo(
    () => tags.map((t) => ({ value: t.id, label: t.name })),
    [tags],
  );
  const tag = useMemo(
    () => tags.find((t) => t.id === selectedTagId) ?? tags[0] ?? null,
    [tags, selectedTagId],
  );

  const coverage = useMemo(() => buildCoverage(tags, actions), [tags, actions]);

  const onSiteClick = (s: CacheTagSite) => {
    openTab({
      id: tabIdFor(s.location.file),
      file: s.location.file,
      label: tabLabelFor(s.location.file),
    });
  };

  if (!tag) {
    return (
      <div className="px-3 py-6 text-center text-xs text-ink-3">
        No cache tags indexed.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <RscRevalidationBanner />
      <PanelHeader>
        <Icon.Tag className="h-3.5 w-3.5 text-ink-3" />
        <span className="text-[11px] text-ink-3">tag</span>
        <SelectControl
          value={tag.id}
          options={tagOptions}
          onChange={setSelected}
          className="font-mono"
        />

        <span className="text-ink-3">·</span>
        <span className="text-[11px] text-ink-3">
          {tag.producers.length} producer
          {tag.producers.length === 1 ? '' : 's'} ·{' '}
          {tag.invalidators.length} invalidator
          {tag.invalidators.length === 1 ? '' : 's'}
        </span>

        {tag.inconsistencyGroup ? (
          <Chip tone="warn" size="xs">
            naming-inconsistency
          </Chip>
        ) : null}

        <div className="ml-auto inline-flex h-6 items-center rounded-sm border border-line bg-bg p-px">
          {(['list', 'graph'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-selected={view === v}
              className={cn(
                'h-5 px-2 text-[11px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                view === v && 'rounded-sm bg-bg-selected text-ink-1',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </PanelHeader>

      <ScrollArea className="flex-1">
        {match(view)
          .with('list', () => (
            <ListView
              tag={tag}
              coverage={coverage}
              actions={actions}
              onSiteClick={onSiteClick}
            />
          ))
          .with('graph', () => <GraphView tag={tag} onSiteClick={onSiteClick} />)
          .exhaustive()}
      </ScrollArea>
    </div>
  );
}

interface ListViewProps {
  tag: CacheTag;
  coverage: Array<{
    tag: CacheTag;
    row: Array<{ action: ServerAction; mark: CoverageMark }>;
  }>;
  actions: ServerAction[];
  onSiteClick(s: CacheTagSite): void;
}

function ListView({ tag, coverage, actions, onSiteClick }: ListViewProps) {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <SitesColumn
          title={`Producers (${tag.producers.length})`}
          sites={tag.producers}
          tone="server"
          onClick={onSiteClick}
        />
        <div className="hairline-l">
          <SitesColumn
            title={`Invalidators (${tag.invalidators.length})`}
            sites={tag.invalidators}
            tone="dynamic"
            onClick={onSiteClick}
          />
        </div>
      </div>

      <section>
        <div className="flex h-7 items-center gap-2 hairline-t hairline-b bg-bg-subtle px-3 text-[10px] uppercase tracking-caps text-ink-3">
          <Icon.Layers className="h-3 w-3" />
          Coverage matrix · mutation × tag
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="hairline-b">
                <th className="sticky left-0 z-10 bg-bg-subtle px-3 py-1 text-left font-medium text-ink-3">
                  tag
                </th>
                {actions.map((a) => (
                  <th
                    key={a.id}
                    className="px-2 py-1 text-left font-mono text-[11px] font-normal text-ink-2"
                    title={`${a.name} (${a.file})`}
                  >
                    {a.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coverage.map(({ tag: t, row }) => (
                <tr key={t.id} className="hairline-b">
                  <td
                    className={cn(
                      'sticky left-0 z-10 bg-bg px-3 py-1 font-mono text-ink-1',
                      t.id === tag.id && 'bg-bg-selected',
                    )}
                  >
                    {t.name}
                  </td>
                  {row.map(({ action, mark }) => (
                    <td
                      key={action.id}
                      className={cn(
                        'px-2 py-1 text-center font-mono text-[12px]',
                        t.id === tag.id && 'bg-bg-subtle',
                      )}
                      title={`${t.name} × ${action.name}: ${mark}`}
                    >
                      {match(mark)
                        .with('ok', () => (
                          <span className="text-sem-static">✓</span>
                        ))
                        .with('missing', () => (
                          <span className="text-sev-err">✗</span>
                        ))
                        .with('na', () => <span className="text-ink-3">—</span>)
                        .exhaustive()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

interface SitesColumnProps {
  title: string;
  sites: CacheTagSite[];
  tone: 'server' | 'dynamic';
  onClick(s: CacheTagSite): void;
}

function SitesColumn({ title, sites, tone, onClick }: SitesColumnProps) {
  return (
    <div className="flex flex-col">
      <div className="flex h-7 items-center gap-2 hairline-b bg-bg-subtle px-3 text-[10px] uppercase tracking-caps text-ink-3">
        {tone === 'server' ? (
          <Icon.Server className="h-3 w-3 text-sem-server" />
        ) : (
          <Icon.Refresh className="h-3 w-3 text-sem-dynamic" />
        )}
        {title}
      </div>
      {sites.length === 0 ? (
        <div className="px-3 py-4 text-xs text-ink-3">None.</div>
      ) : (
        <ul className="flex flex-col">
          {sites.map((s, i) => (
            <li key={`${s.location.file}-${s.location.line}-${i}`}>
              <button
                type="button"
                onClick={() => onClick(s)}
                className="flex h-7 w-full items-center gap-2 hairline-b px-3 text-left text-xs text-ink-1 hover:bg-bg-hover"
              >
                <Icon.File className="h-3 w-3 shrink-0 text-ink-3" />
                <span className="truncate font-mono">
                  {s.location.file}:{s.location.line}
                </span>
                {s.fetchUrl ? (
                  <Chip tone="muted" size="xs" className="ml-auto shrink-0">
                    {s.fetchUrl}
                  </Chip>
                ) : null}
                {s.revalidate != null ? (
                  <Chip tone="info" size="xs" className="shrink-0">
                    {s.revalidate}s
                  </Chip>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface GraphViewProps {
  tag: CacheTag;
  onSiteClick(s: CacheTagSite): void;
}

function GraphView({ tag, onSiteClick }: GraphViewProps) {
  const W = 720;
  const H = 320;
  const CX = W / 2;
  const CY = H / 2;

  const layoutCol = (sites: CacheTagSite[], x: number) =>
    sites.map((s, i) => {
      const total = sites.length || 1;
      const yStep = (H - 60) / total;
      const y = 30 + yStep * (i + 0.5);
      return { x, y, site: s };
    });

  const producers = layoutCol(tag.producers, 80);
  const invalidators = layoutCol(tag.invalidators, W - 80);

  return (
    <div className="px-3 py-3">
      <div className="hairline rounded-sm bg-bg p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[320px] w-full"
          role="img"
          aria-label={`Cache lineage graph for tag ${tag.name}`}
        >
          {producers.map(({ x, y }, i) => (
            <line
              key={`pl-${i}`}
              x1={x + 8}
              y1={y}
              x2={CX - 36}
              y2={CY}
              className="stroke-sem-server/60"
              strokeWidth={1}
            />
          ))}
          {invalidators.map(({ x, y }, i) => (
            <line
              key={`il-${i}`}
              x1={CX + 36}
              y1={CY}
              x2={x - 8}
              y2={y}
              className="stroke-sem-isr"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}

          <g>
            <rect
              x={CX - 60}
              y={CY - 16}
              width={120}
              height={32}
              rx={4}
              className="fill-bg stroke-sem-isr"
              strokeWidth={1.5}
            />
            <text
              x={CX}
              y={CY + 4}
              textAnchor="middle"
              className="fill-sem-isr font-mono text-[12px] font-medium"
            >
              {tag.name}
            </text>
          </g>

          {producers.map(({ x, y, site }, i) => (
            <g
              key={`p-${i}`}
              className="cursor-pointer"
              onClick={() => onSiteClick(site)}
            >
              <circle
                cx={x}
                cy={y}
                r={8}
                className="fill-bg stroke-sem-server"
                strokeWidth={1.5}
              />
              <text
                x={x + 14}
                y={y + 3}
                className="fill-ink-1 font-mono text-[10px]"
              >
                {site.location.file.split('/').pop()}:{site.location.line}
              </text>
            </g>
          ))}

          {invalidators.map(({ x, y, site }, i) => (
            <g
              key={`i-${i}`}
              className="cursor-pointer"
              onClick={() => onSiteClick(site)}
            >
              <circle
                cx={x}
                cy={y}
                r={8}
                className="fill-bg stroke-sem-dynamic"
                strokeWidth={1.5}
              />
              <text
                x={x - 14}
                y={y + 3}
                textAnchor="end"
                className="fill-ink-1 font-mono text-[10px]"
              >
                {site.location.file.split('/').pop()}:{site.location.line}
              </text>
            </g>
          ))}

          <text
            x={80}
            y={20}
            className="fill-ink-3 text-[10px] uppercase tracking-[0.05em]"
          >
            producers
          </text>
          <text
            x={W - 80}
            y={20}
            textAnchor="end"
            className="fill-ink-3 text-[10px] uppercase tracking-[0.05em]"
          >
            invalidators
          </text>
        </svg>
      </div>
    </div>
  );
}

function RscRevalidationBanner() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const capturedAt = useLastTraceStore((s) => s.capturedAt);
  if (!url) return null;
  const hexIds = new Set<string>();
  for (const c of chunks) hexIds.add(c.id);
  const ago = capturedAt ? Math.round((Date.now() - capturedAt) / 1000) : 0;
  return (
    <div className="hairline-b bg-bg-subtle px-3 py-1.5 text-[11px]">
      <span className="mr-2 text-[10px] uppercase tracking-caps text-ink-3">
        Last RSC trace
      </span>
      <span className="font-mono text-ink-2">{url}</span>
      <span className="mx-2 text-ink-3">·</span>
      <span className="font-mono text-ink-3">
        {chunks.length} chunks · {hexIds.size} unique
      </span>
      {ago < 3600 ? (
        <span className="ml-2 text-ink-3">{ago}s ago</span>
      ) : null}
      <span className="ml-2 text-ink-3">
        — re-fetch the same URL in the RSC overlay to compare which chunks revalidated.
      </span>
    </div>
  );
}
