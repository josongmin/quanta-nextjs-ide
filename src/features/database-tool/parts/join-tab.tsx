import { Chip } from '@shared/ui';
import { TABLES, suggestJoin, type DbTable } from '../helpers';
import { JoinDiagram } from './join-diagram';
import { SqlBlock } from './sql-block';

interface JoinTabProps {
  joinA: string;
  joinB: string;
  tableA: DbTable;
  tableB: DbTable;
  onChangeA: (v: string) => void;
  onChangeB: (v: string) => void;
}

export function JoinTab({
  joinA,
  joinB,
  tableA,
  tableB,
  onChangeA,
  onChangeB,
}: JoinTabProps): JSX.Element {
  const suggestion = suggestJoin(joinA, joinB);
  return (
    <div className="p-3">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          a
        </span>
        <select
          value={joinA}
          onChange={(e) => onChangeA(e.target.value)}
          className="h-6 rounded-sm border border-line bg-bg px-1.5 text-xs text-ink-1 focus:outline-none"
        >
          {TABLES.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="text-ink-3">⨝</span>
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          b
        </span>
        <select
          value={joinB}
          onChange={(e) => onChangeB(e.target.value)}
          className="h-6 rounded-sm border border-line bg-bg px-1.5 text-xs text-ink-1 focus:outline-none"
        >
          {TABLES.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        {suggestion ? (
          <Chip tone="accent" size="xs" className="ml-2">
            {suggestion.cardinality}
          </Chip>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-sm border border-line bg-bg-subtle/40 p-2">
        <JoinDiagram a={tableA} b={tableB} />
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
          suggested SQL
        </div>
        {suggestion ? (
          <SqlBlock sql={suggestion.sql} />
        ) : (
          <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-xs text-ink-3">
            No FK link between {joinA} and {joinB}. Try a different
            pairing.
          </div>
        )}
      </div>
    </div>
  );
}
