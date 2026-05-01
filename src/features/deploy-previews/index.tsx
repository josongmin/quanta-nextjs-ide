import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  DEPLOYS,
  KIND_TONE,
  STATUS_TONE,
  deployById,
  type DeployEnv,
  type DeployKind,
  type DeployStatus,
} from './helpers';

const KINDS: ReadonlyArray<DeployKind> = ['production', 'staging', 'canary', 'preview'];
const STATUSES: ReadonlyArray<DeployStatus> = ['live', 'building', 'failed', 'stale'];

const SPARK_W = 120;
const SPARK_H = 24;

function Sparkline({ uptime }: { uptime: ReadonlyArray<number> }) {
  const min = 0.85;
  const max = 1;
  const stepX = SPARK_W / (uptime.length - 1);
  const toY = (v: number) =>
    SPARK_H - ((v - min) / (max - min)) * (SPARK_H - 2) - 1;
  const path = uptime
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(v)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      className="h-6 w-full"
      role="img"
      aria-label="uptime"
    >
      <path d={path} fill="none" className="stroke-accent" strokeWidth={1.2} />
    </svg>
  );
}

const CANARY_W = 740;
const CANARY_H = 70;

function CanarySplit({ prodPct, canaryPct }: { prodPct: number; canaryPct: number }) {
  const prodW = (CANARY_W * prodPct) / 100;
  const canaryW = (CANARY_W * canaryPct) / 100;
  return (
    <svg
      viewBox={`0 0 ${CANARY_W} ${CANARY_H}`}
      className="w-full"
      role="img"
      aria-label="canary traffic split"
    >
      <defs>
        <linearGradient id="prodGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" className="[stop-color:rgb(99,102,241)]" stopOpacity={0.85} />
          <stop offset="100%" className="[stop-color:rgb(99,102,241)]" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient id="canaryGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" className="[stop-color:rgb(234,179,8)]" stopOpacity={0.55} />
          <stop offset="100%" className="[stop-color:rgb(234,179,8)]" stopOpacity={0.85} />
        </linearGradient>
      </defs>
      <rect x={0} y={20} width={prodW} height={30} fill="url(#prodGrad)" rx={3} />
      <rect
        x={prodW}
        y={20}
        width={canaryW}
        height={30}
        fill="url(#canaryGrad)"
        rx={3}
      />
      <text x={6} y={14} className="fill-ink-2 font-mono text-[10px]">
        production · {prodPct}%
      </text>
      <text
        x={CANARY_W - 4}
        y={14}
        textAnchor="end"
        className="fill-ink-2 font-mono text-[10px]"
      >
        canary · {canaryPct}%
      </text>
      <text
        x={prodW / 2}
        y={40}
        textAnchor="middle"
        className="fill-white font-mono text-[10px]"
      >
        {prodPct}%
      </text>
      <text
        x={prodW + canaryW / 2}
        y={40}
        textAnchor="middle"
        className="fill-white font-mono text-[10px]"
      >
        {canaryPct}%
      </text>
      <line
        x1={prodW}
        x2={prodW}
        y1={16}
        y2={54}
        className="stroke-line"
        strokeWidth={1}
      />
      <text
        x={CANARY_W / 2}
        y={66}
        textAnchor="middle"
        className="fill-ink-3 text-[10px]"
      >
        gradual ramp · 5 → 25 → 50 → 100%
      </text>
    </svg>
  );
}

export function DeployPreviewsOverlay() {
  const open = useUiStore((s) => s.overlays.deployPreviews.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [kindFilter, setKindFilter] = useState<DeployKind | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DeployStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('prod');
  const [canaryPct, setCanaryPct] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DEPLOYS.filter((d) => {
      if (kindFilter !== 'all' && d.kind !== kindFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (q && !`${d.name} ${d.branch} ${d.sha}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [kindFilter, statusFilter, search]);

  const selected: DeployEnv = deployById(selectedId);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('deployPreviews')}
      title="Deploy Previews"
      subtitle={`${DEPLOYS.length} environments · canary traffic ${canaryPct}%`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            {filtered.length} shown · click cards to inspect
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="default" onClick={() => toast('Promoting canary (mock)')}>
              Promote canary
            </Button>
            <Button size="xs" tone="warn" onClick={() => toast('Rollback queued (mock)')}>
              Rollback
            </Button>
            <Button size="xs" tone="ghost" onClick={() => toast('Traffic pinned (mock)')}>
              Pin traffic
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex">
        <div className="min-w-0 flex-1">
          <PanelHeader>
            <div className="flex items-center gap-1">
              <span className="text-ink-3">kind:</span>
              <ToggleChip
                active={kindFilter === 'all'}
                onClick={() => setKindFilter('all')}
              >
                all
              </ToggleChip>
              {KINDS.map((k) => (
                <ToggleChip
                  key={k}
                  active={kindFilter === k}
                  onClick={() => setKindFilter(k)}
                >
                  {k}
                </ToggleChip>
              ))}
            </div>
            <span className="mx-1 h-3 w-px bg-line" />
            <div className="flex items-center gap-1">
              <span className="text-ink-3">status:</span>
              <ToggleChip
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              >
                all
              </ToggleChip>
              {STATUSES.map((s) => (
                <ToggleChip
                  key={s}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </ToggleChip>
              ))}
            </div>
            <div className="ml-auto w-44">
              <SearchInput value={search} onChange={setSearch} placeholder="branch / sha / name" />
            </div>
          </PanelHeader>
          <ScrollArea className="max-h-[58vh]">
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {filtered.map((d) => {
                  const active = selectedId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedId(d.id)}
                      className={cn(
                        'rounded-sm border bg-bg p-2 text-left hover:bg-bg-hover',
                        active ? 'border-accent' : 'border-line',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-mono text-[12px] text-ink-1">
                          {d.name}
                        </span>
                        <Chip tone={STATUS_TONE[d.status]} size="xs">
                          {d.status}
                        </Chip>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <Chip tone={KIND_TONE[d.kind]} size="xs">
                          {d.kind}
                        </Chip>
                        <span className="truncate font-mono text-[10px] text-ink-3">
                          {d.branch}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-ink-3">
                        sha {d.sha}
                      </div>
                      <div className="mt-1">
                        <Sparkline uptime={d.uptime} />
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-subtle">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${d.trafficPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-ink-3">
                          {d.trafficPct}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <h3 className="text-caps mt-4 text-ink-3">Canary traffic split</h3>
              <div className="mt-2 rounded-sm border border-line bg-bg p-3">
                <CanarySplit prodPct={100 - canaryPct} canaryPct={canaryPct} />
                <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-3">
                  <span>ramp:</span>
                  {[5, 10, 25, 50, 100].map((p) => (
                    <ToggleChip
                      key={p}
                      active={canaryPct === p}
                      onClick={() => setCanaryPct(p)}
                    >
                      {p}%
                    </ToggleChip>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <aside className="w-[300px] shrink-0 hairline-l bg-bg-subtle/40">
          <div className="p-3">
            <div className="text-caps text-ink-3">Selected env</div>
            <div className="mt-1 font-mono text-md text-ink-1">{selected.name}</div>
            <div className="mt-1 flex items-center gap-1">
              <Chip tone={KIND_TONE[selected.kind]} size="xs">
                {selected.kind}
              </Chip>
              <Chip tone={STATUS_TONE[selected.status]} size="xs">
                {selected.status}
              </Chip>
              <Chip tone="muted" size="xs">
                {selected.envVarsCount} vars
              </Chip>
            </div>
            <div className="mt-1 truncate font-mono text-[10px] text-ink-3">
              {selected.url}
            </div>

            <h4 className="text-caps mt-3 text-ink-3">Deploy log</h4>
            <div className="mt-1">
              <CodeBlock
                code={selected.deployLog}
                language="log"
                showLineNumbers={false}
                maxHeight={180}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <Button
                size="xs"
                tone="default"
                onClick={() => toast(`Rebuilding ${selected.name} (mock)`)}
              >
                Rebuild
              </Button>
              <Button
                size="xs"
                tone="ghost"
                onClick={() => toast(`Opening ${selected.url} (mock)`)}
              >
                Open URL
              </Button>
              <Button
                size="xs"
                tone="ghost"
                className="col-span-2"
                onClick={() => toast(`Diff ${selected.name} ↔ production (mock)`)}
              >
                Diff with prod
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
