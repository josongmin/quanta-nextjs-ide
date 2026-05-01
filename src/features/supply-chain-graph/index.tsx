import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  PROVENANCE_FILL,
  PROVENANCE_TONE,
  SUPPLY_EDGES,
  SUPPLY_PACKAGES,
  radiusFor,
  type Provenance,
  type SupplyPackage,
} from './helpers';

const ALL_PROV: ReadonlyArray<Provenance> = ['signed', 'unsigned', 'unknown'];
type Hop = '1' | '2' | '3';

export function SupplyChainGraphOverlay() {
  const open = useUiStore((s) => s.overlays.supplyChainGraph.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeProv, setActiveProv] =
    useState<ReadonlyArray<Provenance>>(ALL_PROV);
  const [hopLimit, setHopLimit] = useState<Hop>('3');
  const [selectedId, setSelectedId] = useState<string>('app');

  const limit = parseInt(hopLimit, 10);

  const visible = useMemo(
    () =>
      SUPPLY_PACKAGES.filter(
        (p) => p.hop <= limit && activeProv.includes(p.provenance),
      ),
    [activeProv, limit],
  );

  const visibleIds = useMemo(() => new Set(visible.map((v) => v.id)), [visible]);

  const visibleEdges = useMemo(
    () =>
      SUPPLY_EDGES.filter(
        (e) => visibleIds.has(e.from) && visibleIds.has(e.to),
      ),
    [visibleIds],
  );

  const selected =
    visible.find((v) => v.id === selectedId) ??
    SUPPLY_PACKAGES.find((p) => p.id === selectedId) ??
    null;

  const counts = useMemo(() => {
    const total = visible.length;
    const unsigned = visible.filter((v) => v.provenance !== 'signed').length;
    const vulnerable = visible.filter((v) => v.advisories.length > 0).length;
    return { total, unsigned, vulnerable };
  }, [visible]);

  const toggleProv = (p: Provenance) => {
    setActiveProv((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('supplyChainGraph'))}
      title="Supply Chain Graph"
      subtitle={`${counts.total} pkgs · ${counts.unsigned} unsigned · ${counts.vulnerable} vulnerable`}
      size="xl"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {counts.total} total · {counts.unsigned} unsigned ·{' '}
            <span className="text-sev-err">{counts.vulnerable} vulnerable</span>
          </span>
          <Button
            size="xs"
            tone="accent"
            onClick={() => toast('Direct deps pinned in package.json')}
          >
            <Icon.Pin className="h-3 w-3" /> Pin direct deps
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="text-caps text-ink-3">Provenance</span>
        {ALL_PROV.map((p) => (
          <ToggleChip
            key={p}
            active={activeProv.includes(p)}
            onClick={() => toggleProv(p)}
          >
            {p}
          </ToggleChip>
        ))}
        <span className="hairline-r mx-1 h-4" />
        <SelectControl<Hop>
          label="Hops"
          value={hopLimit}
          onChange={setHopLimit}
          options={[
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
          ]}
        />
      </PanelHeader>

      <div className="grid grid-cols-[1fr_320px]">
        <div className="min-w-0 hairline-r p-3">
          {visible.length === 0 ? (
            <EmptyState title="No packages match" />
          ) : (
            <DepGraph
              packages={visible}
              edges={visibleEdges}
              selectedId={selected?.id ?? null}
              onSelect={(id) => setSelectedId(id)}
            />
          )}
        </div>
        <PackageDetail pkg={selected} />
      </div>
    </OverlayPanel>
  );
}

interface GraphProps {
  packages: ReadonlyArray<SupplyPackage>;
  edges: ReadonlyArray<{ from: string; to: string }>;
  selectedId: string | null;
  onSelect(id: string): void;
}

function DepGraph({ packages, edges, selectedId, onSelect }: GraphProps) {
  const W = 820;
  const H = 460;
  const layout = useMemo(() => {
    // Layered layout: hop is the radius. Distribute around angle.
    const byHop = new Map<number, SupplyPackage[]>();
    for (const p of packages) {
      const arr = byHop.get(p.hop) ?? [];
      arr.push(p);
      byHop.set(p.hop, arr);
    }
    const cx = W / 2;
    const cy = H / 2;
    const radii = [0, 90, 170, 220];
    const out = new Map<string, { x: number; y: number }>();
    byHop.forEach((arr, hop) => {
      if (hop === 0) {
        for (const p of arr) out.set(p.id, { x: cx, y: cy });
        return;
      }
      const r = radii[Math.min(hop, radii.length - 1)] ?? 220;
      const n = arr.length;
      arr.forEach((p, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        out.set(p.id, {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        });
      });
    });
    return out;
  }, [packages]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label="Supply chain graph"
    >
      {/* Edges */}
      {edges.map((e, i) => {
        const a = layout.get(e.from);
        const b = layout.get(e.to);
        if (!a || !b) return null;
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgb(203 213 225)"
            strokeWidth={1}
          />
        );
      })}
      {/* Nodes */}
      {packages.map((p) => {
        const pos = layout.get(p.id);
        if (!pos) return null;
        const r = p.id === 'app' ? 16 : radiusFor(p.weeklyDownloads);
        const fill = p.id === 'app' ? 'rgb(15 23 42)' : PROVENANCE_FILL[p.provenance];
        const isSel = p.id === selectedId;
        const hasAdv = p.advisories.length > 0;
        return (
          <g
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="cursor-pointer"
          >
            {hasAdv ? (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r + 3}
                fill="none"
                stroke="rgb(239 68 68)"
                strokeWidth={1.5}
              />
            ) : null}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={r}
              fill={fill}
              opacity={0.85}
              stroke={isSel ? 'rgb(15 23 42)' : 'transparent'}
              strokeWidth={isSel ? 2 : 0}
            />
            <text
              x={pos.x}
              y={pos.y + r + 10}
              textAnchor="middle"
              className="fill-ink-1 text-[9px]"
            >
              {p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PackageDetail({ pkg }: { pkg: SupplyPackage | null }) {
  if (!pkg) {
    return (
      <aside className="bg-bg-subtle/60 p-3">
        <EmptyState title="Select a package" />
      </aside>
    );
  }
  return (
    <aside className="bg-bg-subtle/60">
      <div className="px-3 py-2 hairline-b">
        <div className="text-caps text-ink-3">Package</div>
        <div className="mt-0.5 truncate font-mono text-sm text-ink-1">
          {pkg.name}
        </div>
        <div className="mt-1 flex items-center gap-1">
          <Chip tone="muted" size="xs">
            <span className="font-mono">{pkg.version}</span>
          </Chip>
          <Chip tone={PROVENANCE_TONE[pkg.provenance]} size="xs">
            {pkg.provenance}
          </Chip>
          <Chip tone="muted" size="xs">
            hop {pkg.hop}
          </Chip>
        </div>
      </div>
      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-3 p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-caps text-ink-3">Maintainers</div>
              <div className="font-mono text-ink-1">{pkg.maintainerCount}</div>
            </div>
            <div>
              <div className="text-caps text-ink-3">Weekly downloads</div>
              <div className="font-mono text-ink-1">
                {pkg.weeklyDownloads.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-caps text-ink-3">License</div>
              <div className="font-mono text-ink-1">{pkg.license}</div>
            </div>
            <div>
              <div className="text-caps text-ink-3">Advisories</div>
              <div className="font-mono text-ink-1">{pkg.advisories.length}</div>
            </div>
          </div>
          <div>
            <div className="text-caps text-ink-3">Advisories list</div>
            {pkg.advisories.length === 0 ? (
              <div className="mt-1 text-ink-3">None.</div>
            ) : (
              <ul className="mt-1 space-y-1">
                {pkg.advisories.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1"
                  >
                    <span className="font-mono text-[11px] text-ink-1">
                      {a.id}
                    </span>
                    <Chip
                      tone={
                        a.severity === 'crit'
                          ? 'err'
                          : a.severity === 'high'
                            ? 'warn'
                            : a.severity === 'med'
                              ? 'info'
                              : 'muted'
                      }
                      size="xs"
                    >
                      {a.severity}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
