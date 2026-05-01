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
import { SelectControl } from '@shared/ui/select-control';
import { KvRow } from '@widgets/right-panel/parts';
import { cn } from '@shared/lib/cn';
import {
  kindLabel,
  migrationBranches,
  migrationOps,
  riskScore,
  stageLabel,
  stageOrder,
  type MigrationOp,
  type RiskLevel,
} from './helpers';

const RISK_TONE: Record<RiskLevel, 'info' | 'warn' | 'err'> = {
  low: 'info',
  medium: 'warn',
  high: 'err',
};

export function MigrationPlannerOverlay() {
  const open = useUiStore((s) => s.overlays.migrationPlanner.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [branch, setBranch] = useState<string>(migrationBranches[1]?.id ?? 'main');
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(migrationOps.map((o) => [o.id, true])),
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  const planOps = useMemo(
    () => migrationOps.filter((o) => included[o.id]),
    [included],
  );

  const branchOptions = useMemo(
    () => migrationBranches.map((b) => ({ value: b.id, label: b.label })),
    [],
  );
  const branchInfo = migrationBranches.find((b) => b.id === branch);

  const stageGroups = useMemo(() => {
    return stageOrder.map((s) => ({
      stage: s,
      ops: planOps.filter((o) => o.stage === s),
    }));
  }, [planOps]);

  const totalDowntime = planOps.reduce((acc, o) => acc + o.downtimeSec, 0);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('migrationPlanner')}
      title="Migration Planner"
      subtitle="Stage and review schema migrations before rollout"
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {planOps.length}/{migrationOps.length} ops · ~{totalDowntime}s downtime
          </span>
          <Button size="xs" tone="ghost" onClick={() => toast('Runbook generated (mock)')}>
            Generate runbook
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Dry-run started (mock)')}>
            Dry-run
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Migration exported (mock)')}>
            Export migration
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <SelectControl
          label="target"
          value={branch}
          options={branchOptions}
          onChange={setBranch}
        />
        <span className="text-ink-3">{branchInfo?.diffSummary}</span>
      </div>

      <div className="grid grid-cols-[1fr_320px]">
        <ScrollArea className="max-h-[60vh] hairline-r">
          <ul>
            {migrationOps.map((op) => {
              const isOpen = expanded === op.id;
              const enabled = included[op.id];
              return (
                <li key={op.id} className="border-t border-line/60 first:border-t-0">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        setIncluded((m) => ({ ...m, [op.id]: e.target.checked }))
                      }
                      className="h-3.5 w-3.5 cursor-pointer"
                      aria-label={`Include ${op.label}`}
                    />
                    <Chip tone="muted" size="xs">
                      {kindLabel(op.kind)}
                    </Chip>
                    <Chip tone={RISK_TONE[op.riskLevel]} size="xs">
                      {op.riskLevel}
                    </Chip>
                    <button
                      onClick={() => setExpanded(isOpen ? null : op.id)}
                      className="flex-1 text-left text-xs text-ink-1 hover:text-accent"
                    >
                      <span className="font-mono text-ink-2">{op.table}</span>
                      <span className="mx-1 text-ink-3">·</span>
                      <span>{op.label}</span>
                    </button>
                    {op.blocksWrites ? (
                      <Chip tone="warn" size="xs">
                        blocks writes
                      </Chip>
                    ) : null}
                    <span className="font-mono text-[10px] text-ink-3">
                      ~{op.affectedRows.toLocaleString()} rows
                    </span>
                  </div>
                  {isOpen ? (
                    <div className="bg-bg-subtle/50 px-3 py-2">
                      <CodeBlock code={op.sql} language="sql" maxHeight={140} />
                      <div className="mt-2 grid grid-cols-2 gap-x-3">
                        {op.impact.map((kv) => (
                          <KvRow key={kv.k} label={kv.k} mono>
                            {kv.v}
                          </KvRow>
                        ))}
                        <KvRow label="downtime" mono>
                          ~{op.downtimeSec}s
                        </KvRow>
                        <KvRow label="stage" mono>
                          {stageLabel(op.stage)}
                        </KvRow>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </ScrollArea>

        <div className="bg-bg-subtle/40 p-3 text-xs">
          <div className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">timeline</div>
          <ol className="flex flex-col gap-2">
            {stageGroups.map((g, i) => {
              const total = g.ops.reduce((s, o) => s + riskScore(o.riskLevel), 0);
              const max = g.ops.length * 3;
              const pct = max === 0 ? 0 : Math.round((total / max) * 100);
              const tone =
                pct >= 70 ? 'bg-sev-err' : pct >= 40 ? 'bg-sev-warn' : 'bg-sev-info';
              return (
                <li
                  key={g.stage}
                  className="rounded-sm border border-line bg-bg p-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent">
                        {i + 1}
                      </span>
                      <span className="font-medium text-ink-1">{stageLabel(g.stage)}</span>
                    </div>
                    <span className="text-[10px] text-ink-3">{g.ops.length} ops</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="relative inline-block h-1 flex-1 overflow-hidden rounded-full bg-bg-subtle">
                      <span
                        className={cn('absolute left-0 top-0 h-full', tone)}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="font-mono text-[10px] text-ink-3">{pct}%</span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {g.ops.length === 0 ? (
                      <li className="text-[10px] text-ink-3">— empty —</li>
                    ) : (
                      g.ops.map((o) => (
                        <li key={o.id} className="flex items-center gap-1.5">
                          <Chip tone={RISK_TONE[o.riskLevel]} size="xs">
                            {o.riskLevel.charAt(0).toUpperCase()}
                          </Chip>
                          <span className="truncate font-mono text-[10px] text-ink-2">
                            {o.label}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </OverlayPanel>
  );
}

// Suppress unused warning when MigrationOp is only used via inference above.
export type { MigrationOp };
