import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  effectLog,
  EFFECT_COMPONENTS,
  isStaleDeps,
  phaseTone,
  type EffectEntry,
  type EffectPhase,
} from './helpers';

const PHASES: ReadonlyArray<EffectPhase> = ['mount', 'update', 'unmount'];

function Row({ e }: { e: EffectEntry }) {
  const [open, setOpen] = useState(false);
  const stale = isStaleDeps(e);
  return (
    <>
      <tr
        className={cn(
          'cursor-pointer hover:bg-bg-hover',
          stale && 'bg-sev-warn-soft/30',
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-2 py-1 font-mono text-[10px] text-ink-3">
          T+{e.at}ms
        </td>
        <td className="px-2 py-1 text-[11px] text-ink-1">{e.component}</td>
        <td className="px-2 py-1 font-mono text-[11px] text-ink-2">
          {e.effectId}
        </td>
        <td className="px-2 py-1">
          <Chip tone={phaseTone(e.phase)} size="xs">
            {e.phase}
          </Chip>
        </td>
        <td className="px-2 py-1">
          <span className="flex flex-wrap gap-0.5">
            {e.deps.length === 0 ? (
              <span className="font-mono text-[10px] text-ink-3">[]</span>
            ) : (
              e.deps.map((d) => (
                <span
                  key={d}
                  className={cn(
                    'inline-block rounded-sm border px-1 font-mono text-[10px]',
                    e.depsChanged.includes(d)
                      ? 'border-accent/40 bg-accent-soft text-accent'
                      : 'border-line text-ink-3',
                  )}
                >
                  {d}
                </span>
              ))
            )}
          </span>
        </td>
        <td className="px-2 py-1 text-right font-mono text-[10px] text-ink-3">
          {e.durationMs.toFixed(1)}ms
        </td>
        <td className="px-2 py-1 text-center text-[11px]">
          {e.cleanedUp ? (
            <span className="text-sem-static">✓</span>
          ) : (
            <span className="text-ink-3">·</span>
          )}
        </td>
        <td className="px-1 text-ink-3">
          <Icon.ChevRight
            className={cn('h-3 w-3 transition-transform', open && 'rotate-90')}
          />
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={8} className="bg-bg-subtle/40 px-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-caps mb-1 text-ink-3">deps array</div>
                <CodeBlock
                  code={`[${e.deps.join(', ')}]`}
                  showLineNumbers={false}
                  maxHeight={60}
                />
              </div>
              <div>
                <div className="text-caps mb-1 text-ink-3">suggestion</div>
                <div className="rounded-sm border border-line bg-bg p-2 text-[11px] text-ink-1">
                  {e.fix ?? 'Effect ran as expected.'}
                  {e.cleanupMs ? (
                    <div className="mt-1 text-[10px] text-ink-3">
                      cleanup: {e.cleanupMs}ms
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function EffectLogOverlay() {
  const open = useUiStore((s) => s.overlays.effectLog.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [comp, setComp] = useState<string>('all');
  const [phase, setPhase] = useState<Set<EffectPhase>>(new Set());
  const [staleOnly, setStaleOnly] = useState<boolean>(false);

  const filtered = useMemo(() => {
    return effectLog.filter((e) => {
      if (comp !== 'all' && e.component !== comp) return false;
      if (phase.size > 0 && !phase.has(e.phase)) return false;
      if (staleOnly && !isStaleDeps(e)) return false;
      return true;
    });
  }, [comp, phase, staleOnly]);

  const stats = useMemo(() => {
    const m = { mount: 0, update: 0, unmount: 0, stale: 0 };
    filtered.forEach((e) => {
      m[e.phase] += 1;
      if (isStaleDeps(e)) m.stale += 1;
    });
    return m;
  }, [filtered]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('effectLog'))}
      title="Effect Log"
      subtitle="useEffect fires · deps changes"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span>
            mounts: <span className="font-mono text-ink-1">{stats.mount}</span>
          </span>
          <span>
            updates: <span className="font-mono text-ink-1">{stats.update}</span>
          </span>
          <span>
            unmounts:{' '}
            <span className="font-mono text-ink-1">{stats.unmount}</span>
          </span>
          <span>
            stale-deps:{' '}
            <span className="font-mono text-sev-warn">{stats.stale}</span>
          </span>
          <span className="ml-auto">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Jump to effect site in editor (mock)')}
            >
              Find missing deps in editor
            </Button>
          </span>
        </span>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <SelectControl
          label="comp"
          value={comp}
          onChange={setComp}
          options={[
            { value: 'all', label: 'all' },
            ...EFFECT_COMPONENTS.map((c) => ({ value: c, label: c })),
          ]}
        />
        <span className="text-caps text-ink-3">phase</span>
        <div className="flex items-center gap-1">
          {PHASES.map((p) => (
            <ToggleChip
              key={p}
              active={phase.has(p)}
              onClick={() => {
                setPhase((prev) => {
                  const n = new Set(prev);
                  if (n.has(p)) n.delete(p);
                  else n.add(p);
                  return n;
                });
              }}
            >
              {p}
            </ToggleChip>
          ))}
        </div>
        <ToggleChip active={staleOnly} onClick={() => setStaleOnly((v) => !v)}>
          stale-deps only
        </ToggleChip>
        <span className="ml-auto text-[11px] text-ink-3">
          {filtered.length} entries
        </span>
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="hairline-b bg-bg-subtle text-left text-[10px] uppercase tracking-caps text-ink-3">
              <th className="px-2 py-1 font-medium">time</th>
              <th className="px-2 py-1 font-medium">component</th>
              <th className="px-2 py-1 font-medium">effect</th>
              <th className="px-2 py-1 font-medium">phase</th>
              <th className="px-2 py-1 font-medium">deps</th>
              <th className="px-2 py-1 text-right font-medium">dur</th>
              <th className="px-2 py-1 text-center font-medium">clean</th>
              <th className="px-1" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <Row key={e.id} e={e} />
            ))}
          </tbody>
        </table>
      </div>
    </OverlayPanel>
  );
}
