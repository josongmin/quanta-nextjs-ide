import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, EmptyState, Icon, OverlayPanel } from '@shared/ui';
import {
  ALL_LICENSES,
  SBOM_PACKAGES,
  licenseBreakdown,
  supplierCounts,
} from './helpers';
import { PkgTable } from './parts/PkgTable';
import type { SortDir, SortKey } from './parts/SortHeader';
import { SummaryAside } from './parts/SummaryAside';
import { Toolbar } from './parts/Toolbar';

export function SbomViewerOverlay() {
  const open = useUiStore((s) => s.overlays.sbomViewer.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [query, setQuery] = useState('');
  const [activeLicenses, setActiveLicenses] =
    useState<ReadonlyArray<string>>(ALL_LICENSES);
  const [supplier, setSupplier] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = SBOM_PACKAGES.filter((p) => {
      if (!activeLicenses.includes(p.license)) return false;
      if (supplier !== 'all' && p.supplier !== supplier) return false;
      if (q.length > 0 && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...arr].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'version':
          return dir * a.version.localeCompare(b.version);
        case 'supplier':
          return dir * a.supplier.localeCompare(b.supplier);
        case 'license':
          return dir * a.license.localeCompare(b.license);
        case 'size':
          return dir * (a.sizeKb - b.sizeKb);
      }
    });
  }, [query, activeLicenses, supplier, sortKey, sortDir]);

  const totalSize = filtered.reduce((s, p) => s + p.sizeKb, 0);
  const breakdown = useMemo(() => licenseBreakdown(filtered), [filtered]);
  const suppliers = useMemo(() => supplierCounts(filtered), [filtered]);
  const maxSize = Math.max(1, ...filtered.map((p) => p.sizeKb));

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setSortDir('asc');
    }
  };

  const toggleLicense = (l: string) => {
    setActiveLicenses((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('sbomViewer'))}
      title="SBOM Viewer"
      subtitle={`${filtered.length} of ${SBOM_PACKAGES.length} packages · ${totalSize} KB`}
      size="xl"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {filtered.length} pkgs · {totalSize} KB total
          </span>
          <Button
            size="xs"
            tone="accent"
            onClick={() => toast('SBOM exported (CycloneDX mock)')}
          >
            <Icon.Doc className="h-3 w-3" /> Export SBOM (CycloneDX)
          </Button>
        </>
      }
    >
      <Toolbar
        query={query}
        onQueryChange={setQuery}
        activeLicenses={activeLicenses}
        onToggleLicense={toggleLicense}
        supplier={supplier}
        onSupplierChange={setSupplier}
      />

      <div className="grid grid-cols-[1fr_300px]">
        <div className="min-w-0 hairline-r">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No packages match" />
            </div>
          ) : (
            <PkgTable
              packages={filtered}
              maxSize={maxSize}
              sortKey={sortKey}
              sortDir={sortDir}
              onToggleSort={toggleSort}
              expandedId={expanded}
              onToggleExpand={(id) => setExpanded((c) => (c === id ? null : id))}
            />
          )}
        </div>
        <SummaryAside breakdown={breakdown} suppliers={suppliers} />
      </div>
    </OverlayPanel>
  );
}
