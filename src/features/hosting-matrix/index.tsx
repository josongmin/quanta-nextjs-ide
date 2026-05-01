import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  OverlayPanel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  FEATURES,
  GROUP_LABEL,
  HOSTS,
  MATRIX,
  STATUS_FILL,
  STATUS_LABEL,
  STATUS_TONE,
  compatibility,
  type FeatureGroup,
  type HostId,
} from './helpers';

interface Selection {
  featureId: string;
  hostId: HostId;
}

const ROW_H = 28;
const COL_W = 130;
const LABEL_W = 200;

export function HostingMatrixOverlay() {
  const open = useUiStore((s) => s.overlays.hostingMatrix.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [search, setSearch] = useState('');
  const [hostFilter, setHostFilter] = useState<ReadonlySet<HostId>>(
    () => new Set(HOSTS.map((h) => h.id)),
  );
  const [highlightGroup, setHighlightGroup] = useState<FeatureGroup | null>(null);
  const [selection, setSelection] = useState<Selection>({ featureId: 'isr', hostId: 'vercel' });

  const visibleHosts = useMemo(
    () => HOSTS.filter((h) => hostFilter.has(h.id)),
    [hostFilter],
  );
  const visibleFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FEATURES;
    return FEATURES.filter((f) => f.label.toLowerCase().includes(q) || f.id.includes(q));
  }, [search]);

  const totalW = LABEL_W + visibleHosts.length * COL_W;
  const totalH = (visibleFeatures.length + 1) * ROW_H;

  const selFeature = FEATURES.find((f) => f.id === selection.featureId);
  const selCell = selFeature ? MATRIX[selection.featureId]?.[selection.hostId] : undefined;
  const selHost = HOSTS.find((h) => h.id === selection.hostId);

  function toggleHost(id: HostId) {
    setHostFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) return prev;
      return next;
    });
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('hostingMatrix')}
      title={
        <span className="flex items-center gap-2">
          <span>Hosting compatibility matrix</span>
          <Chip tone="muted" size="xs">
            {FEATURES.length} features × {HOSTS.length} hosts
          </Chip>
        </span>
      }
      subtitle="Self-hosted vs Vercel vs Netlify vs Cloudflare"
      size="xl"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            Click a cell for detail. Statuses are mock.
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                tone="accent"
                onClick={() => toast('Scoring current routes (mock)')}
              >
                Score your stack
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="text-caps mb-2 text-ink-3">Compatibility</div>
              <ul className="space-y-1.5">
                {HOSTS.map((h) => {
                  const pct = compatibility(h.id);
                  return (
                    <li key={h.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-ink-1">{h.label}</span>
                        <span className="font-mono text-ink-2">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-bg-subtle">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </PopoverContent>
          </Popover>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
        <SearchInput value={search} onChange={setSearch} placeholder="filter features" />
        <span className="ml-2 text-caps text-ink-3">Hosts</span>
        <div className="flex items-center gap-1">
          {HOSTS.map((h) => (
            <ToggleChip
              key={h.id}
              active={hostFilter.has(h.id)}
              onClick={() => toggleHost(h.id)}
            >
              {h.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        {/* Heatmap + groups */}
        <div className="min-w-0 max-h-[68vh] overflow-auto p-3">
          <svg
            width={totalW}
            height={totalH}
            role="img"
            aria-label="Hosting compatibility heatmap"
            className="block"
          >
            {/* Header row: hosts */}
            {visibleHosts.map((h, i) => (
              <g key={h.id} transform={`translate(${LABEL_W + i * COL_W}, 0)`}>
                <rect width={COL_W - 4} height={ROW_H - 4} rx={3} fill="#f8fafc" stroke="#e5e7eb" />
                <text
                  x={COL_W / 2}
                  y={ROW_H / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={600}
                  fill="#0a0a0a"
                >
                  {h.label}
                </text>
              </g>
            ))}

            {/* Feature rows */}
            {visibleFeatures.map((f, rowIdx) => {
              const rowY = (rowIdx + 1) * ROW_H;
              const dim = highlightGroup !== null && f.group !== highlightGroup;
              return (
                <g key={f.id} transform={`translate(0, ${rowY})`} opacity={dim ? 0.35 : 1}>
                  <rect
                    width={LABEL_W - 4}
                    height={ROW_H - 4}
                    rx={3}
                    fill="#ffffff"
                    stroke="#e5e7eb"
                  />
                  <text
                    x={10}
                    y={ROW_H / 2 + 4}
                    fontSize={11}
                    fontFamily="Inter, system-ui, sans-serif"
                    fill="#0a0a0a"
                  >
                    {f.label}
                  </text>
                  <text
                    x={LABEL_W - 14}
                    y={ROW_H / 2 + 4}
                    fontSize={9}
                    textAnchor="end"
                    fontFamily="ui-monospace, monospace"
                    fill="#737373"
                  >
                    {f.group}
                  </text>

                  {visibleHosts.map((h, cIdx) => {
                    const c = MATRIX[f.id]?.[h.id];
                    if (!c) return null;
                    const fill = STATUS_FILL[c.status];
                    const isSel =
                      selection.featureId === f.id && selection.hostId === h.id;
                    return (
                      <g
                        key={h.id}
                        transform={`translate(${LABEL_W + cIdx * COL_W}, 0)`}
                      >
                        <rect
                          width={COL_W - 4}
                          height={ROW_H - 4}
                          rx={3}
                          fill={fill}
                          fillOpacity={0.18}
                          stroke={isSel ? '#0a0a0a' : fill}
                          strokeOpacity={isSel ? 1 : 0.5}
                          strokeWidth={isSel ? 2 : 1}
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            setSelection({ featureId: f.id, hostId: h.id })
                          }
                        >
                          <title>{`${h.label} · ${f.label}: ${STATUS_LABEL[c.status]}`}</title>
                        </rect>
                        <circle
                          cx={14}
                          cy={ROW_H / 2 - 2}
                          r={4}
                          fill={fill}
                          pointerEvents="none"
                        />
                        <text
                          x={28}
                          y={ROW_H / 2 + 3}
                          fontSize={10}
                          fontFamily="Inter, system-ui, sans-serif"
                          fill="#0a0a0a"
                          pointerEvents="none"
                        >
                          {STATUS_LABEL[c.status]}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Legend & group toggles */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-caps text-ink-3">Legend</span>
              {(['yes', 'partial', 'workaround', 'no'] as const).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 text-[11px] text-ink-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: STATUS_FILL[s] }}
                  />
                  {STATUS_LABEL[s]}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-caps text-ink-3">Highlight</span>
              {(Object.keys(GROUP_LABEL) as FeatureGroup[]).map((g) => (
                <ToggleChip
                  key={g}
                  active={highlightGroup === g}
                  onClick={() =>
                    setHighlightGroup((prev) => (prev === g ? null : g))
                  }
                >
                  {GROUP_LABEL[g]}
                </ToggleChip>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail: selected detail */}
        <aside className="min-w-0 max-h-[68vh] space-y-3 overflow-y-auto p-3">
          {selFeature && selHost && selCell ? (
            <>
              <header className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-caps text-ink-3">{selHost.label}</span>
                  <Chip tone={STATUS_TONE[selCell.status]} size="sm">
                    {STATUS_LABEL[selCell.status]}
                  </Chip>
                </div>
                <h3 className="text-md font-semibold text-ink-1">{selFeature.label}</h3>
                <div className="text-[11px] text-ink-3">group: {selFeature.group}</div>
              </header>
              <p className="rounded-sm border border-line bg-bg-subtle/40 p-2 text-[12px] text-ink-2">
                {selCell.notes}
              </p>
              <Tooltip content={selCell.evidence}>
                <button
                  type="button"
                  onClick={() =>
                    toast('Opened evidence', { description: selCell.evidence })
                  }
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border border-line bg-bg-subtle px-2 py-0.5 text-[11px] text-ink-2 hover:bg-bg-hover',
                  )}
                >
                  <span aria-hidden>↗</span> evidence
                </button>
              </Tooltip>
              {selCell.workaround !== undefined ? (
                <section>
                  <header className="mb-1 text-caps text-ink-3">Suggested workaround</header>
                  <CodeBlock code={selCell.workaround} language="typescript" maxHeight={240} />
                </section>
              ) : null}
              <section>
                <header className="mb-1 text-caps text-ink-3">All hosts for this feature</header>
                <ul className="space-y-1">
                  {HOSTS.map((h) => {
                    const c = MATRIX[selFeature.id]?.[h.id];
                    if (!c) return null;
                    return (
                      <li
                        key={h.id}
                        className={cn(
                          'flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1 text-[11px]',
                          h.id === selection.hostId && 'border-accent bg-accent-soft/30',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelection({ featureId: selFeature.id, hostId: h.id })
                          }
                          className="truncate text-ink-1 hover:text-ink-1"
                        >
                          {h.label}
                        </button>
                        <Chip tone={STATUS_TONE[c.status]} size="xs">
                          {STATUS_LABEL[c.status]}
                        </Chip>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          ) : (
            <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 p-4 text-center text-xs text-ink-3">
              Click a cell to inspect details.
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
