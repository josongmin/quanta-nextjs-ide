import { ScrollArea } from '@shared/ui';
import { Donut } from './Donut';

interface SummaryAsideProps {
  breakdown: ReadonlyArray<{ value: number; color: string; label: string }>;
  suppliers: ReadonlyArray<{ supplier: string; count: number }>;
}

export function SummaryAside({ breakdown, suppliers }: SummaryAsideProps) {
  return (
    <aside className="bg-bg-subtle/60">
      <div className="px-3 py-2 hairline-b text-caps text-ink-3">
        License breakdown
      </div>
      <div className="flex items-center gap-3 p-3">
        <Donut slices={breakdown} />
        <ul className="flex-1 space-y-1 text-xs">
          {breakdown.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: s.color }}
                />
                <span className="font-mono text-[11px] text-ink-1">{s.label}</span>
              </span>
              <span className="font-mono text-[10px] text-ink-3">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-3 py-2 hairline-t hairline-b text-caps text-ink-3">
        Suppliers
      </div>
      <ScrollArea className="max-h-[180px]">
        <ul className="divide-y divide-line/60">
          {suppliers.map((s) => (
            <li
              key={s.supplier}
              className="flex items-center justify-between px-3 py-1.5 text-xs"
            >
              <span className="text-ink-1">{s.supplier}</span>
              <span className="font-mono text-[10px] text-ink-3">{s.count}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}
