import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  OverlayPanel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  CONFIGS,
  fmtMs,
  statusTone,
  type RunConfig,
  type RunStatus,
} from './helpers';

const STATUS_FILTERS: ReadonlyArray<RunStatus> = [
  'idle',
  'running',
  'done',
  'failed',
];

interface SparklineProps {
  values: ReadonlyArray<number>;
  className?: string;
}

function Sparkline({ values, className }: SparklineProps) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const W = 80;
  const H = 18;
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / Math.max(1, max - min)) * (H - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn('h-[18px] w-[80px]', className)}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        className="stroke-accent"
        strokeWidth={1.2}
      />
    </svg>
  );
}

export function RunConfigurationsOverlay() {
  const open = useUiStore((s) => s.overlays.runConfigurations.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState<ReadonlyArray<RunStatus>>(
    [],
  );
  const [selectedId, setSelectedId] = useState<string>(CONFIGS[0]!.id);
  const [parallelWith, setParallelWith] = useState<ReadonlyArray<string>>([]);

  const filtered = useMemo<ReadonlyArray<RunConfig>>(() => {
    const q = search.trim().toLowerCase();
    return CONFIGS.filter((c) => {
      const sMatch =
        statusFilters.length === 0 || statusFilters.includes(c.status);
      const qMatch =
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        c.command.toLowerCase().includes(q);
      return sMatch && qMatch;
    });
  }, [search, statusFilters]);

  const selected =
    CONFIGS.find((c) => c.id === selectedId) ?? CONFIGS[0]!;

  function toggleParallel(id: string): void {
    setParallelWith((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
    );
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('runConfigurations')}
      title="Run Configurations"
      subtitle="Saved run profiles · parallel state"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            {parallelWith.length > 0 ? (
              <Chip tone="accent" size="sm">
                running in parallel × {parallelWith.length + 1}
              </Chip>
            ) : (
              <span>
                configs:{' '}
                <span className="font-mono text-ink-1">{CONFIGS.length}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Running all favourites (mock)')}
            >
              Run all favourites
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Scheduled periodic run · every 30m (mock)')}
            >
              Schedule periodic run
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => close('runConfigurations')}
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or command"
          className="w-56"
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          status
        </span>
        {STATUS_FILTERS.map((s) => {
          const active = statusFilters.includes(s);
          return (
            <ToggleChip
              key={s}
              active={active}
              onClick={() =>
                setStatusFilters((p) =>
                  p.includes(s) ? p.filter((x) => x !== s) : [...p, s],
                )
              }
            >
              {s}
            </ToggleChip>
          );
        })}
        <span className="ml-auto">
          <Button
            size="xs"
            tone="default"
            onClick={() => toast('New configuration created (mock)')}
          >
            + New config
          </Button>
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px' }}>
        <section className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((c) => {
              const active = c.id === selected.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-sm border border-line bg-bg p-2 text-left hover:border-line-strong',
                    active && 'border-accent ring-1 ring-accent/30',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium text-ink-1">
                      {c.name}
                    </span>
                    {c.favorite ? (
                      <Chip tone="accent" size="xs">
                        ★
                      </Chip>
                    ) : null}
                    <Chip tone={statusTone(c.status)} size="xs" className="ml-auto">
                      {c.status}
                    </Chip>
                  </div>
                  <code className="block truncate rounded-sm border border-line bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-2">
                    $ {c.command}
                  </code>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-3">
                      last: {fmtMs(c.lastRun.durationMs)}{' '}
                      {c.lastRun.status === 'failed' ? (
                        <span className="text-sev-err">· exit {c.lastRun.exit}</span>
                      ) : null}
                    </span>
                    <Sparkline values={c.history} />
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <div className="col-span-3 px-2 py-6 text-center text-xs text-ink-3">
                No configurations match the filters.
              </div>
            ) : null}
          </div>
        </section>

        <aside className="hairline-l p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs font-medium text-ink-1">
              {selected.name}
            </span>
            <Chip tone={statusTone(selected.status)} size="xs">
              {selected.status}
            </Chip>
          </div>
          <code className="mb-2 block truncate rounded-sm border border-line bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-2">
            $ {selected.command}
          </code>

          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            output
          </div>
          <CodeBlock
            code={selected.lastRun.output}
            language="log"
            maxHeight={180}
            showLineNumbers={false}
          />

          <div className="mt-3 mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            env
          </div>
          <div className="rounded-sm border border-line bg-bg">
            {Object.entries(selected.env).length === 0 ? (
              <div className="px-2 py-1.5 text-[11px] text-ink-3">
                (no env vars)
              </div>
            ) : (
              <ul>
                {Object.entries(selected.env).map(([k, v]) => (
                  <li
                    key={k}
                    className="flex items-center justify-between gap-2 border-b border-line/60 px-2 py-1 text-[10px] last:border-b-0"
                  >
                    <span className="font-mono text-ink-2">{k}</span>
                    <span className="truncate font-mono text-ink-1">{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Button
              size="xs"
              tone="accent"
              onClick={() => toast(`Started ${selected.name} (mock)`)}
            >
              Run
            </Button>
            <Button
              size="xs"
              tone="warn"
              onClick={() => toast(`Stopped ${selected.name} (mock)`)}
            >
              Stop
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="xs" tone="soft">
                  Parallel…
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1">
                <div className="px-2 py-1 text-[10px] uppercase tracking-caps text-ink-3">
                  Run in parallel with
                </div>
                <ul className="max-h-56 overflow-y-auto">
                  {CONFIGS.filter((c) => c.id !== selected.id).map((c) => {
                    const checked = parallelWith.includes(c.id);
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => toggleParallel(c.id)}
                          className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-xs hover:bg-bg-hover"
                        >
                          <span
                            className={cn(
                              'inline-block h-3 w-3 rounded-sm border',
                              checked
                                ? 'border-accent bg-accent'
                                : 'border-line bg-bg',
                            )}
                            aria-hidden
                          />
                          <span className="truncate text-ink-1">{c.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="hairline-t px-2 py-1 text-right">
                  <Button
                    size="xs"
                    tone="accent"
                    onClick={() =>
                      toast(
                        `Running ${selected.name} alongside ${parallelWith.length} others (mock)`,
                      )
                    }
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </aside>
      </div>

      <ScrollArea className="hidden" />
    </OverlayPanel>
  );
}
