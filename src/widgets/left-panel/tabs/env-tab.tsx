import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useBoundaryStore } from '@entities/boundary';
import type { EnvVar } from '@shared/types';
import { Chip, Icon, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { SearchInput } from '../parts/search-input';

type ScopeFilter = 'all' | EnvVar['scope'];

const SCOPE_OPTIONS: ReadonlyArray<FilterChipOption<ScopeFilter>> = [
  { value: 'all', label: 'All' },
  { value: 'server-only', label: 'Server' },
  { value: 'public', label: 'Public' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'unknown', label: '?' },
];

function scopeTone(scope: EnvVar['scope']) {
  return match(scope)
    .with('server-only', () => 'info' as const)
    .with('public', () => 'static' as const)
    .with('mixed', () => 'warn' as const)
    .with('unknown', () => 'muted' as const)
    .exhaustive();
}

function leakColor(risk: EnvVar['leakRisk']) {
  return match(risk)
    .with('high', () => 'bg-sev-err' as const)
    .with('medium', () => 'bg-sev-warn' as const)
    .with('low', () => 'bg-sev-info' as const)
    .with('none', () => 'bg-line' as const)
    .exhaustive();
}

export function EnvTab() {
  const envVars = useBoundaryStore((s) => s.envVars);
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    return envVars.filter((e) => {
      if (scope !== 'all' && e.scope !== scope) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [envVars, scope, search]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup
          options={SCOPE_OPTIONS}
          value={scope}
          onChange={(v) => setScope(v)}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by name"
          className="ml-1"
        />
      </TabHeader>
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line/70">
        {visible.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-ink-3">
            No env vars match
          </div>
        ) : (
          visible.map((e) => (
            <div
              key={e.name}
              role="button"
              tabIndex={0}
              onClick={() =>
                toast('Open env audit', {
                  description: `${e.name} · used in ${e.fileCount} files`,
                })
              }
              className={cn(
                'group flex h-8 items-center gap-2 px-2 text-xs hover:bg-bg-hover',
              )}
            >
              <Icon.Lock className="h-3 w-3 text-ink-3" />
              <span className="font-mono text-ink-1">{e.name}</span>
              <Chip tone={scopeTone(e.scope)} size="xs">
                {e.scope}
              </Chip>
              <span className="text-[10px] text-ink-3">used in {e.fileCount} files</span>
              <Tooltip content={`Leak risk: ${e.leakRisk}`}>
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-ink-3">
                  leak
                  <span
                    className={cn('inline-block h-2 w-2 rounded-full', leakColor(e.leakRisk))}
                    aria-label={`leak risk ${e.leakRisk}`}
                  />
                </span>
              </Tooltip>
              {e.scope === 'mixed' && (
                <span className="text-sev-warn">
                  <Icon.Alert className="h-3 w-3" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
