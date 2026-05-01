import { toast } from 'sonner';
import { Button, Chip, CodeBlock, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { SAVED_QUERIES, type SavedQuery } from '../helpers';
import { SqlBlock } from './sql-block';

interface QueryTabProps {
  queryId: string;
  selectedQuery: SavedQuery;
  editorSql: string;
  showPlan: boolean;
  onChooseQuery: (id: string) => void;
  onTogglePlan: () => void;
}

export function QueryTab({
  queryId,
  selectedQuery,
  editorSql,
  showPlan,
  onChooseQuery,
  onTogglePlan,
}: QueryTabProps): JSX.Element {
  return (
    <div className="grid" style={{ gridTemplateColumns: '220px 1fr' }}>
      <aside className="hairline-r">
        <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b bg-bg-subtle">
          saved queries
        </div>
        <ScrollArea className="max-h-[480px]">
          <ul className="px-1 py-1">
            {SAVED_QUERIES.map((q) => (
              <li key={q.id}>
                <button
                  onClick={() => onChooseQuery(q.id)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 rounded-sm px-2 py-1 text-left hover:bg-bg-hover',
                    q.id === queryId && 'bg-bg-selected',
                  )}
                >
                  <span className="truncate text-xs text-ink-1">
                    {q.name}
                  </span>
                  <span className="font-mono text-[10px] text-ink-3">
                    {q.ms}ms · {q.rowCount} rows
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </aside>
      <section className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium text-ink-1">
            {selectedQuery.name}
          </span>
          <Chip tone="info" size="xs">
            {selectedQuery.ms}ms
          </Chip>
          <Chip tone="muted" size="xs">
            {selectedQuery.rowCount} rows
          </Chip>
          <span className="ml-auto flex items-center gap-1.5">
            <Button size="xs" tone="ghost" onClick={onTogglePlan}>
              {showPlan ? 'Hide plan' : 'Show plan'}
            </Button>
            <Button
              size="xs"
              tone="accent"
              onClick={() =>
                toast(`Ran query · ${selectedQuery.rowCount} rows (mock)`)
              }
            >
              Run
            </Button>
          </span>
        </div>

        <SqlBlock sql={editorSql} />

        {showPlan ? (
          <div className="mt-2">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              plan
            </div>
            <CodeBlock
              code={selectedQuery.plan}
              language="plan"
              maxHeight={120}
              showLineNumbers={false}
            />
          </div>
        ) : null}

        <div className="mt-3">
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            result
          </div>
          <div className="overflow-hidden rounded-sm border border-line bg-bg">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-bg-subtle text-left">
                  {selectedQuery.cols.map((c) => (
                    <th
                      key={c}
                      className="px-2 py-1 font-mono text-[10px] uppercase tracking-caps text-ink-3 hairline-b"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedQuery.rows.map((r, i) => (
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
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
