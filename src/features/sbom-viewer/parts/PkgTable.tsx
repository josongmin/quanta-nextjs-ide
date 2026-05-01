import { ScrollArea } from '@shared/ui';
import type { SbomPackage } from '../helpers';
import { PkgRow } from './PkgRow';
import { SortHeader, type SortDir, type SortKey } from './SortHeader';

interface PkgTableProps {
  packages: ReadonlyArray<SbomPackage>;
  maxSize: number;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort(k: SortKey): void;
  expandedId: string | null;
  onToggleExpand(id: string): void;
}

export function PkgTable({
  packages,
  maxSize,
  sortKey,
  sortDir,
  onToggleSort,
  expandedId,
  onToggleExpand,
}: PkgTableProps) {
  return (
    <ScrollArea className="max-h-[60vh]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 hairline-b bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
          <tr>
            <SortHeader
              label="Name"
              sortKey="name"
              activeKey={sortKey}
              dir={sortDir}
              onClick={onToggleSort}
            />
            <SortHeader
              label="Ver"
              sortKey="version"
              activeKey={sortKey}
              dir={sortDir}
              onClick={onToggleSort}
            />
            <SortHeader
              label="Supplier"
              sortKey="supplier"
              activeKey={sortKey}
              dir={sortDir}
              onClick={onToggleSort}
            />
            <SortHeader
              label="License"
              sortKey="license"
              activeKey={sortKey}
              dir={sortDir}
              onClick={onToggleSort}
            />
            <SortHeader
              label="Size"
              sortKey="size"
              activeKey={sortKey}
              dir={sortDir}
              onClick={onToggleSort}
            />
            <th className="px-2 py-1.5 text-left font-medium">Hash</th>
            <th className="px-2 py-1.5 text-left font-medium">Entry</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((p) => (
            <PkgRow
              key={p.id}
              pkg={p}
              maxSize={maxSize}
              expanded={expandedId === p.id}
              onToggle={() => onToggleExpand(p.id)}
            />
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}
