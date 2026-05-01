import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { KIND_LABEL, cacheBuckets, idbDbs, type StoreKind } from '../helpers';

interface StoreSidebarProps {
  kind: StoreKind;
  onKindChange(k: StoreKind): void;
  counts: Record<StoreKind, number>;
  idbSel: { db: string; store: string };
  onIdbSelChange(sel: { db: string; store: string }): void;
  cacheSel: string;
  onCacheSelChange(s: string): void;
}

export function StoreSidebar({
  kind,
  onKindChange,
  counts,
  idbSel,
  onIdbSelChange,
  cacheSel,
  onCacheSelChange,
}: StoreSidebarProps) {
  return (
    <aside className="overflow-y-auto p-2">
      <div className="text-[10px] uppercase tracking-caps text-ink-3 px-1">
        Stores
      </div>
      <ul className="mt-1 space-y-0.5">
        {(Object.keys(KIND_LABEL) as StoreKind[]).map((k) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => onKindChange(k)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-sm border px-2 py-1 text-[11px]',
                kind === k
                  ? 'border-accent/40 bg-accent-soft text-ink-1'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              <span>{KIND_LABEL[k]}</span>
              <Chip tone="muted" size="xs">
                {counts[k]}
              </Chip>
            </button>
          </li>
        ))}
      </ul>

      {kind === 'idb' && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3 px-1">
            Databases
          </div>
          <ul className="mt-1 space-y-1">
            {idbDbs.map((db) => (
              <li key={db.name}>
                <div className="px-1 text-[11px] font-mono text-ink-1">
                  {db.name}{' '}
                  <span className="text-ink-3">v{db.version}</span>
                </div>
                <ul className="ml-2 mt-0.5 space-y-0.5">
                  {db.stores.map((s) => (
                    <li key={s.name}>
                      <button
                        type="button"
                        onClick={() => onIdbSelChange({ db: db.name, store: s.name })}
                        className={cn(
                          'w-full rounded-sm px-2 py-0.5 text-left font-mono text-[11px]',
                          idbSel.db === db.name && idbSel.store === s.name
                            ? 'bg-accent-soft text-ink-1'
                            : 'text-ink-2 hover:bg-bg-hover',
                        )}
                      >
                        {s.name}{' '}
                        <span className="text-ink-3">
                          ({s.records.length})
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {kind === 'cache' && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3 px-1">
            Cache buckets
          </div>
          <ul className="mt-1 space-y-0.5">
            {cacheBuckets.map((b) => (
              <li key={b.name}>
                <button
                  type="button"
                  onClick={() => onCacheSelChange(b.name)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-sm border px-2 py-1 text-[11px]',
                    cacheSel === b.name
                      ? 'border-accent/40 bg-accent-soft text-ink-1'
                      : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                  )}
                >
                  <span className="font-mono">{b.name}</span>
                  <span className="text-ink-3">{b.entries.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
