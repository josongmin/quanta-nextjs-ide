import { toast } from 'sonner';
import { Button, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TABLES, type DbTable } from '../helpers';

interface DataTabProps {
  dataTable: string;
  tableObj: DbTable;
  filteredRows: ReadonlyArray<ReadonlyArray<string | number>>;
  sortCol: number | undefined;
  sortDir: 'asc' | 'desc';
  dataFilter: string;
  onSelectTable: (name: string) => void;
  onFilterChange: (v: string) => void;
  onToggleSort: (idx: number) => void;
}

export function DataTab({
  dataTable,
  tableObj,
  filteredRows,
  sortCol,
  sortDir,
  dataFilter,
  onSelectTable,
  onFilterChange,
  onToggleSort,
}: DataTabProps): JSX.Element {
  return (
    <div className="grid" style={{ gridTemplateColumns: '180px 1fr' }}>
      <aside className="hairline-r">
        <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b bg-bg-subtle">
          tables
        </div>
        <ul className="px-1 py-1">
          {TABLES.map((t) => (
            <li key={t.name}>
              <button
                onClick={() => onSelectTable(t.name)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1 text-left text-xs hover:bg-bg-hover',
                  t.name === dataTable && 'bg-bg-selected',
                )}
              >
                <span className="truncate font-mono">{t.name}</span>
                <span className="font-mono text-[10px] text-ink-3">
                  {t.rowCount.toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium text-ink-1">
            {tableObj.name}
          </span>
          <Chip tone="muted" size="xs">
            {filteredRows.length} / {tableObj.rows.length}
          </Chip>
          <input
            value={dataFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter rows…"
            className="h-6 w-44 rounded-sm border border-line bg-bg px-1.5 text-xs text-ink-1 focus:border-accent focus:outline-none"
          />
          <Button
            size="xs"
            tone="ghost"
            className="ml-auto"
            onClick={() =>
              toast(`Exported ${tableObj.name}.csv (mock)`)
            }
          >
            Export CSV
          </Button>
        </div>

        <div className="overflow-hidden rounded-sm border border-line bg-bg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-bg-subtle text-left">
                {tableObj.columns.map((c, i) => (
                  <th
                    key={c.name}
                    className="cursor-pointer px-2 py-1 font-mono text-[10px] uppercase tracking-caps text-ink-3 hairline-b hover:text-ink-1"
                    onClick={() => onToggleSort(i)}
                  >
                    {c.name}
                    {sortCol === i ? (
                      <span className="ml-1 text-accent">
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i} className="hover:bg-bg-hover">
                  {r.map((cell, j) => (
                    <td
                      key={j}
                      className="border-b border-line/60 px-2 py-1 font-mono text-ink-1"
                    >
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableObj.columns.length}
                    className="px-2 py-3 text-center text-[11px] text-ink-3"
                  >
                    No rows match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
