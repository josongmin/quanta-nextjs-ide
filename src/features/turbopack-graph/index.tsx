import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { EmptyState, OverlayPanel } from '@shared/ui';
import {
  EDGES,
  MODULES,
  deadExportsFor,
  importersOf,
  importsOf,
  moduleById,
  reachableFrom,
  snapshotFor,
  totalKB,
  type Bundler,
  type ModuleKind,
} from './helpers';
import { FooterBar } from './parts/FooterBar';
import { GraphSvg } from './parts/GraphSvg';
import { ModuleAside } from './parts/ModuleAside';
import { Toolbar } from './parts/Toolbar';
import { TreeShakingTrace } from './parts/TreeShakingTrace';

export function TurbopackGraphOverlay() {
  const open = useUiStore((s) => s.overlays.turbopackGraph.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [bundler, setBundler] = useState<Bundler>('turbopack');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<ModuleKind | 'all'>('all');
  const [hmrOnly, setHmrOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('m4');

  const snap = snapshotFor(bundler);

  const reach = useMemo(() => {
    const m = moduleById(selectedId);
    if (m.entryPoint) return reachableFrom(selectedId);
    const set = new Set<string>([selectedId]);
    for (const e of EDGES) {
      if (e.from === selectedId) set.add(e.to);
      if (e.to === selectedId) set.add(e.from);
    }
    return set;
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MODULES.filter((m) => {
      if (kindFilter !== 'all' && m.kind !== kindFilter) return false;
      if (hmrOnly && !m.hmrBoundary) return false;
      if (q.length > 0 && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, kindFilter, hmrOnly]);

  const visibleIds = useMemo(() => new Set(filtered.map((m) => m.id)), [filtered]);

  const selected = moduleById(selectedId);
  const selectedSize = snap.sizes[selectedId] ?? selected.sizeKB;
  const selectedImporters = importersOf(selectedId);
  const selectedImports = importsOf(selectedId);
  const dead = deadExportsFor(selectedId);
  const deadSavings = dead.reduce((acc, d) => acc + d.savingsKB, 0);

  const totalT = totalKB('turbopack');
  const totalW = totalKB('webpack');

  const diffRows = useMemo(() => {
    const t = snapshotFor('turbopack');
    const w = snapshotFor('webpack');
    return MODULES.map((m) => {
      const tk = t.sizes[m.id] ?? 0;
      const wk = w.sizes[m.id] ?? 0;
      return { m, tk, wk, delta: wk - tk };
    })
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 8);
  }, []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('turbopackGraph')}
      title="Turbopack module graph"
      subtitle="Inspect module dependencies, sizes, HMR boundaries"
      size="xl"
      footer={
        <FooterBar
          bundler={bundler}
          totalT={totalT}
          totalW={totalW}
          diffRows={diffRows}
          onClose={() => close('turbopackGraph')}
        />
      }
    >
      <Toolbar
        bundler={bundler}
        onBundlerChange={setBundler}
        search={search}
        onSearchChange={setSearch}
        kindFilter={kindFilter}
        onKindFilterChange={setKindFilter}
        hmrOnly={hmrOnly}
        onHmrOnlyChange={setHmrOnly}
      />

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <main className="min-w-0 px-3 py-3">
          {filtered.length === 0 ? (
            <EmptyState
              title="No modules match"
              description="Try a different search or kind filter."
            />
          ) : (
            <GraphSvg
              snap={snap}
              reach={reach}
              visibleIds={visibleIds}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}

          <TreeShakingTrace selected={selected} dead={dead} deadSavings={deadSavings} />
        </main>

        <ModuleAside
          selected={selected}
          selectedSize={selectedSize}
          selectedImporters={selectedImporters}
          selectedImports={selectedImports}
        />
      </div>
    </OverlayPanel>
  );
}
