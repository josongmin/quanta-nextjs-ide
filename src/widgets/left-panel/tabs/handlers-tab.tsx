import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useActionStore } from '@entities/server-action';
import type { RouteHandler } from '@shared/types';
import { Chip, Icon, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { RscTraceSection } from '../parts/rsc-trace-section';

type MethodFilter = 'all' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type RuntimeFilter = 'all' | 'edge' | 'node';

const METHOD_OPTIONS: ReadonlyArray<FilterChipOption<MethodFilter>> = [
  { value: 'all', label: 'All' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DEL' },
];

const RUNTIME_OPTIONS: ReadonlyArray<FilterChipOption<RuntimeFilter>> = [
  { value: 'all', label: 'all' },
  { value: 'edge', label: 'edge' },
  { value: 'node', label: 'node' },
];

function methodTone(method: RouteHandler['method']) {
  return match(method)
    .with('GET', () => 'static' as const)
    .with('POST', () => 'info' as const)
    .with('PUT', () => 'isr' as const)
    .with('PATCH', () => 'isr' as const)
    .with('DELETE', () => 'err' as const)
    .with('OPTIONS', () => 'muted' as const)
    .exhaustive();
}

interface CheckProps {
  ok: boolean;
  label: string;
}
function Check({ ok, label }: CheckProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px]',
        ok ? 'text-sem-static' : 'text-ink-3',
      )}
      title={`${label}: ${ok ? 'present' : 'missing'}`}
    >
      {label}
      <span className={cn('font-bold', ok ? 'text-sem-static' : 'text-sev-warn')}>
        {ok ? '✓' : '✗'}
      </span>
    </span>
  );
}

export function HandlersTab() {
  const handlers = useActionStore((s) => s.handlers);
  const [method, setMethod] = useState<MethodFilter>('all');
  const [runtime, setRuntime] = useState<RuntimeFilter>('all');

  const filtered = useMemo(() => {
    return handlers.filter((h) => {
      if (method !== 'all' && h.method !== method) return false;
      if (runtime !== 'all' && h.runtime !== runtime) return false;
      return true;
    });
  }, [handlers, method, runtime]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup
          options={METHOD_OPTIONS}
          value={method}
          onChange={(v) => setMethod(v)}
        />
        <FilterChipGroup
          options={RUNTIME_OPTIONS}
          value={runtime}
          onChange={(v) => setRuntime(v)}
          className="ml-1"
        />
        <span className="ml-auto text-[10px] text-ink-3">{filtered.length} routes</span>
      </TabHeader>
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line/70">
        {filtered.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-ink-3">
            No handlers match
          </div>
        ) : (
          filtered.map((h) => (
            <div
              key={h.id}
              role="button"
              tabIndex={0}
              onClick={() => toast(`${h.method} ${h.path}`, { description: h.file })}
              className="group flex h-8 items-center gap-2 px-2 text-xs hover:bg-bg-hover"
            >
              <Chip tone={methodTone(h.method)} size="xs" className="font-mono font-semibold">
                {h.method}
              </Chip>
              <span className="font-mono text-ink-1">{h.path}</span>
              {h.isWebhook && (
                <Tooltip content="Webhook endpoint">
                  <span className="text-sem-edge">
                    <Icon.Zap className="h-3 w-3" />
                  </span>
                </Tooltip>
              )}
              <Chip
                tone={h.runtime === 'edge' ? 'edge' : 'muted'}
                size="xs"
                className="ml-1"
              >
                {h.runtime}
              </Chip>
              <span className="ml-2 inline-flex items-center gap-2">
                <Check ok={h.hasAuth} label="auth" />
                <Check ok={h.hasCacheHeader} label="cache" />
                <Check ok={h.hasRateLimit} label="rate" />
                <Check ok={h.hasIdempotency} label="idem" />
              </span>
              {h.riskCount > 0 && (
                <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-sev-warn">
                  <Icon.Alert className="h-3 w-3" />
                  {h.riskCount}
                </span>
              )}
              {h.riskCount === 0 && (
                <span className="ml-auto truncate font-mono text-[10px] text-ink-3">
                  {h.file.split('/').slice(-2).join('/')}
                </span>
              )}
            </div>
          ))
        )}
        <RscTraceSection mode="actions" />
      </div>
    </div>
  );
}
