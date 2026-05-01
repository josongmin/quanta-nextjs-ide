import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { Button, Chip, EmptyState, Icon, OverlayPanel, ScrollArea } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { cn } from '@shared/lib/cn';
import {
  rscComponents,
  sortComponents,
  suggestionsFor,
  type RscComponent,
  type SortKey,
} from './helpers';

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'renderMs', label: 'render ms' },
  { value: 'payload', label: 'payload bytes' },
  { value: 'cacheHit', label: 'cache hit' },
  { value: 'awaits', label: 'awaits' },
];

export function RscProfilerOverlay() {
  const open = useUiStore((s) => s.overlays.rscProfiler.open);
  const requested = useUiStore((s) => s.overlays.rscProfiler.routeId);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);

  const routeIds = useMemo(
    () => Array.from(new Set(rscComponents.map((c) => c.routeId))),
    [],
  );

  const [routeId, setRouteId] = useState<string>(routeIds[0] ?? 'route_home');
  const [sortKey, setSortKey] = useState<SortKey>('renderMs');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (requested && routeIds.includes(requested)) setRouteId(requested);
  }, [open, requested, routeIds]);

  const routeOptions = useMemo(
    () =>
      routeIds.map((rid) => {
        const r = routes.find((x) => x.id === rid);
        return { value: rid, label: r?.path ?? rid };
      }),
    [routes, routeIds],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rscComponents.filter((c) => c.routeId === routeId);
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
    return sortComponents(list, sortKey);
  }, [routeId, sortKey, search]);

  useEffect(() => {
    setSelectedId((id) => {
      if (id && visible.some((c) => c.id === id)) return id;
      return visible[0]?.id ?? null;
    });
  }, [visible]);

  const selected = visible.find((c) => c.id === selectedId) ?? null;

  const maxRender = Math.max(1, ...visible.map((c) => c.renderMs));
  const maxPayload = Math.max(1, ...visible.map((c) => c.payloadBytes));

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('rscProfiler'))}
      title="RSC Profiler"
      subtitle="render time · payload size per server component"
      size="md"
      footer={
        <Button size="xs" tone="default" onClick={() => toast('Profiler run queued (mock)')}>
          <Icon.Refresh className="h-3 w-3" /> Run profiler
        </Button>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <SelectControl label="route" value={routeId} options={routeOptions} onChange={setRouteId} />
        <SelectControl<SortKey>
          label="sort"
          value={sortKey}
          options={SORT_OPTIONS}
          onChange={(v) => setSortKey(v)}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="filter by component name"
          className="ml-auto w-56"
        />
      </div>

      {visible.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No components" description="No RSC components match the filters." />
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_300px]">
          <ScrollArea className="max-h-[60vh] hairline-r">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
                <tr>
                  <th className="px-3 py-1 text-left">name</th>
                  <th className="px-3 py-1 text-left">render</th>
                  <th className="px-3 py-1 text-left">payload</th>
                  <th className="px-3 py-1 text-left">awaits</th>
                  <th className="px-3 py-1 text-left">cache</th>
                  <th className="px-3 py-1 text-left">blocked by</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'cursor-pointer border-t border-line/60 hover:bg-bg-hover',
                      c.id === selectedId && 'bg-bg-selected',
                    )}
                  >
                    <td className="px-3 py-1 font-mono text-ink-1">{c.name}</td>
                    <td className="px-3 py-1">
                      <Bar value={c.renderMs} max={maxRender} tone={c.renderMs > 200 ? 'warn' : 'info'} suffix="ms" />
                    </td>
                    <td className="px-3 py-1">
                      <Bar value={c.payloadBytes} max={maxPayload} tone="static" suffix=" b" />
                    </td>
                    <td className="px-3 py-1 font-mono text-ink-1">{c.awaitsCount}</td>
                    <td className="px-3 py-1">
                      <Chip tone={c.cacheHit ? 'static' : 'muted'} size="xs">
                        {c.cacheHit ? 'HIT' : 'MISS'}
                      </Chip>
                    </td>
                    <td className="px-3 py-1">
                      <div className="flex flex-wrap gap-1">
                        {c.blockedBy.length === 0 ? (
                          <span className="text-ink-3">—</span>
                        ) : (
                          c.blockedBy.map((b) => (
                            <Chip key={b} tone="muted" size="xs">
                              <span className="font-mono">
                                {rscComponents.find((x) => x.id === b)?.name ?? b}
                              </span>
                            </Chip>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>

          <div className="bg-bg-subtle/40 p-3 text-xs">
            {selected ? <ComponentDetail c={selected} all={visible} /> : null}
          </div>
        </div>
      )}
    </OverlayPanel>
  );
}

function Bar({
  value,
  max,
  tone,
  suffix,
}: {
  value: number;
  max: number;
  tone: 'info' | 'warn' | 'static';
  suffix: string;
}) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  const cls =
    tone === 'warn' ? 'bg-sev-warn' : tone === 'info' ? 'bg-sev-info' : 'bg-sem-static';
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative inline-block h-1 w-24 overflow-hidden rounded-full bg-bg-subtle">
        <span className={cn('absolute left-0 top-0 h-full', cls)} style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[10px] text-ink-2">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function ComponentDetail({ c, all }: { c: RscComponent; all: ReadonlyArray<RscComponent> }) {
  const suggestions = suggestionsFor(c);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-caps text-ink-3">component</div>
        <div className="mt-0.5 font-mono text-ink-1">{c.name}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KvRow k="render" v={`${c.renderMs}ms`} />
        <KvRow k="payload" v={`${c.payloadBytes} b`} />
        <KvRow k="awaits" v={String(c.awaitsCount)} />
        <KvRow k="cache" v={c.cacheHit ? 'HIT' : 'MISS'} />
        <KvRow k="serialize" v={`${c.serializationCost} b`} />
        <KvRow k="blocked by" v={String(c.blockedBy.length)} />
      </div>

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">dependency graph</div>
        <DepGraph c={c} all={all} />
      </div>

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">suggestions</div>
        <ul className="space-y-1">
          {suggestions.map((s) => (
            <li
              key={s}
              className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1"
            >
              <span className="text-ink-1">{s}</span>
              <Button size="xs" tone="ghost" onClick={() => toast(`Apply: ${s} (preview)`)}>
                Apply
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KvRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1">
      <span className="text-[10px] uppercase tracking-caps text-ink-3">{k}</span>
      <span className="font-mono text-ink-1">{v}</span>
    </div>
  );
}

function DepGraph({ c, all }: { c: RscComponent; all: ReadonlyArray<RscComponent> }) {
  const parents = c.blockedBy
    .map((id) => all.find((x) => x.id === id) ?? rscComponents.find((x) => x.id === id))
    .filter((x): x is RscComponent => x != null);
  const children = rscComponents.filter((x) => x.blockedBy.includes(c.id) && x.routeId === c.routeId);

  const W = 260;
  const H = 120;
  const cx = W / 2;
  const cy = H / 2;

  const placeRow = (
    count: number,
    y: number,
    lbl: (i: number) => string,
    ids: string[],
  ): Array<{ x: number; y: number; label: string; id: string }> => {
    const out: Array<{ x: number; y: number; label: string; id: string }> = [];
    for (let i = 0; i < count; i += 1) {
      const x = ((i + 1) / (count + 1)) * W;
      out.push({ x, y, label: lbl(i), id: ids[i]! });
    }
    return out;
  };

  const ps = placeRow(parents.length, 18, (i) => parents[i]!.name, parents.map((p) => p.id));
  const cs = placeRow(children.length, H - 18, (i) => children[i]!.name, children.map((c2) => c2.id));

  return (
    <div className="rounded-sm border border-line bg-bg">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="dependency graph">
        {ps.map((p) => (
          <g key={`p-${p.id}`}>
            <line x1={p.x} y1={p.y + 8} x2={cx} y2={cy - 10} stroke="#9ca3af" strokeWidth={1} />
            <rect x={p.x - 36} y={p.y - 8} width={72} height={16} rx={3} fill="#f3f4f6" stroke="#d1d5db" />
            <text
              x={p.x}
              y={p.y + 4}
              fill="#374151"
              fontSize="10"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {p.label}
            </text>
          </g>
        ))}
        <rect x={cx - 44} y={cy - 12} width={88} height={24} rx={4} fill="#dbeafe" stroke="#3b82f6" />
        <text
          x={cx}
          y={cy + 3}
          fill="#1e3a8a"
          fontSize="11"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
        >
          {c.name}
        </text>
        {cs.map((cc) => (
          <g key={`c-${cc.id}`}>
            <line x1={cx} y1={cy + 12} x2={cc.x} y2={cc.y - 8} stroke="#9ca3af" strokeWidth={1} />
            <rect x={cc.x - 36} y={cc.y - 8} width={72} height={16} rx={3} fill="#f3f4f6" stroke="#d1d5db" />
            <text
              x={cc.x}
              y={cc.y + 4}
              fill="#374151"
              fontSize="10"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {cc.label}
            </text>
          </g>
        ))}
        {parents.length === 0 && children.length === 0 ? (
          <text x={cx} y={H - 10} fill="#9ca3af" fontSize="10" textAnchor="middle">
            no dependencies
          </text>
        ) : null}
      </svg>
    </div>
  );
}
