import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { Route } from '@shared/types';
import { FILTERS, type GraphFilter } from '../helpers';

interface ToolbarProps {
  route: Route | undefined;
  pageRoutes: ReadonlyArray<Route>;
  onRouteChange(id: string): void;
  filter: GraphFilter;
  onFilterChange(f: GraphFilter): void;
  counts: { server: number; client: number; hotspots: number };
}

export function Toolbar({
  route,
  pageRoutes,
  onRouteChange,
  filter,
  onFilterChange,
  counts,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 hairline-b">
      <label className="flex items-center gap-1.5 text-[11px] text-ink-3">
        <span className="text-caps">Route</span>
        <select
          value={route?.id ?? ''}
          onChange={(e) => onRouteChange(e.target.value)}
          className={cn(
            'rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1',
            'focus:outline-2 focus:outline-accent',
          )}
        >
          {pageRoutes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.path}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={cn(
              'h-6 rounded-sm border px-2 text-[11px] transition-colors',
              filter === f.id
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Chip tone="server" size="xs">
          {counts.server} server
        </Chip>
        <Chip tone="client" size="xs">
          {counts.client} client
        </Chip>
        <Chip tone="warn" size="xs">
          {counts.hotspots} hotspots
        </Chip>
      </div>
    </div>
  );
}
