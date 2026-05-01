import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel } from '@shared/ui';
import {
  FLAGS,
  type Audience,
  type Flag,
  type FlagStatus,
} from './helpers';
import { FilterToolbar } from './parts/filter-toolbar';
import { FlagList } from './parts/flag-list';
import { FlagDetail } from './parts/flag-detail';
import { DependencyGraph } from './parts/dependency-graph';

export function FeatureFlagOrchestratorOverlay() {
  const open = useUiStore((s) => s.overlays.featureFlagOrchestrator.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FlagStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string>(FLAGS[0]?.id ?? '');
  const [percentage, setPercentage] = useState(25);
  const [audiences, setAudiences] = useState<ReadonlyArray<Audience>>([
    'internal',
    'beta',
  ]);
  const [checked, setChecked] = useState<ReadonlyArray<string>>(['tests']);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FLAGS.filter((f) => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (q && !f.key.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [search, statusFilter]);

  const selected: Flag | undefined =
    FLAGS.find((f) => f.id === selectedId) ?? filtered[0];

  function toggleAudience(a: Audience) {
    setAudiences((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  }

  function toggleCheck(id: string) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function selectFlag(f: Flag) {
    setSelectedId(f.id);
    setPercentage(f.percentage);
    setAudiences(f.audiences);
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('featureFlagOrchestrator')}
      title="Feature Flag Orchestrator"
      subtitle="Rollout planner · audiences · dependencies"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            {selected ? (
              <>
                <span className="text-ink-2">Selected:</span>{' '}
                <span className="font-mono text-ink-1">{selected.key}</span>
              </>
            ) : (
              'No flag selected'
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="warn" onClick={() => toast('Pause queued (mock)')}>
              Pause rollout
            </Button>
            <Button size="xs" tone="err" onClick={() => toast('Rollback initiated (mock)')}>
              Rollback
            </Button>
            <Button size="xs" tone="accent" onClick={() => toast('Rollout scheduled (mock)')}>
              Schedule rollout
            </Button>
          </div>
        </div>
      }
    >
      <FilterToolbar
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="grid grid-cols-[280px_1fr_240px] divide-x divide-line">
        <FlagList
          flags={filtered}
          selectedId={selected?.id}
          onSelect={selectFlag}
        />

        <main className="min-w-0 px-3 py-3">
          {selected ? (
            <FlagDetail
              selected={selected}
              percentage={percentage}
              audiences={audiences}
              checked={checked}
              onPercentageChange={setPercentage}
              onToggleAudience={toggleAudience}
              onToggleCheck={toggleCheck}
            />
          ) : (
            <div className="text-[11px] text-ink-3">No flag selected.</div>
          )}
        </main>

        <aside className="min-w-0 px-3 py-3">
          <h4 className="text-caps text-ink-3">Dependency graph</h4>
          <DependencyGraph selectedId={selected?.id ?? ''} />
        </aside>
      </div>
    </OverlayPanel>
  );
}
