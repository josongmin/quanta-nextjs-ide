import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import {
  CATEGORIES,
  DEVICES,
  DIFF_ENTRIES,
  DIFF_SUMMARY,
  relTime,
  statusTone,
  totalConflicts,
  type Device,
  type DiffCategory,
  type SyncDirection,
} from './helpers';

const DIRECTIONS: ReadonlyArray<{ value: SyncDirection; label: string }> = [
  { value: 'up', label: 'up' },
  { value: 'down', label: 'down' },
  { value: 'both', label: 'both' },
];

export function SettingsSyncOverlay() {
  const open = useUiStore((s) => s.overlays.settingsSync.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [devices, setDevices] = useState<ReadonlyArray<Device>>(DEVICES);
  const [activeDeviceId, setActiveDeviceId] = useState<string>(
    DEVICES[1]?.id ?? DEVICES[0]?.id ?? '',
  );
  const [category, setCategory] = useState<DiffCategory>('settings');

  const activeDevice = useMemo<Device | null>(
    () => devices.find((d) => d.id === activeDeviceId) ?? devices[0] ?? null,
    [devices, activeDeviceId],
  );

  const diffEntries = DIFF_ENTRIES[category];
  const summary = DIFF_SUMMARY[category];

  const setDirection = (id: string, dir: SyncDirection) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, direction: dir } : d)),
    );
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('settingsSync'))}
      title="Settings Sync"
      subtitle={`${devices.length} devices · ${totalConflicts()} conflicts`}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            <Chip
              tone={totalConflicts() > 0 ? 'err' : 'info'}
              size="xs"
            >
              {totalConflicts()} conflicts
            </Chip>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Resolved all (kept mine)')}
            >
              Resolve all (mine)
            </Button>
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Resolved all (took theirs)')}
            >
              Resolve all (theirs)
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('settingsSync')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          device
        </span>
        <SelectControl
          value={activeDeviceId}
          onChange={setActiveDeviceId}
          options={devices.map((d) => ({ value: d.id, label: d.name }))}
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        <Button
          size="xs"
          tone="accent"
          onClick={() =>
            toast(`Sync now → ${activeDevice?.name ?? 'all devices'}`)
          }
        >
          ↻ Sync now
        </Button>
      </PanelHeader>

      <div className="grid grid-cols-[300px_1fr_320px] divide-x divide-line">
        {/* Devices */}
        <div className="max-h-[64vh] overflow-y-auto p-2">
          <ul className="space-y-1.5">
            {devices.map((d) => {
              const isActive = d.id === activeDeviceId;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setActiveDeviceId(d.id)}
                    className={cn(
                      'w-full rounded-sm border border-line bg-bg p-2 text-left hover:border-line-strong',
                      isActive && 'border-accent ring-1 ring-accent/30',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink-1">
                          {d.name}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-ink-3">
                          {d.settingsHash}
                        </div>
                      </div>
                      <Chip tone={statusTone(d.status)} size="xs">
                        {d.status}
                      </Chip>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-3">
                      <span className="font-mono">
                        last {relTime(d.lastSync)}
                      </span>
                      {d.conflictCount > 0 ? (
                        <Chip tone="err" size="xs">
                          {d.conflictCount} conflicts
                        </Chip>
                      ) : (
                        <Chip tone="info" size="xs">
                          clean
                        </Chip>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[10px] text-ink-3">direction:</span>
                      {DIRECTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDirection(d.id, opt.value);
                          }}
                          className={cn(
                            'rounded-sm border px-1 text-[10px]',
                            d.direction === opt.value
                              ? 'border-accent bg-accent-soft text-accent'
                              : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Diff summary */}
        <div className="max-h-[64vh] overflow-y-auto p-3">
          <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
            Diff summary {activeDevice ? `· ${activeDevice.name}` : ''}
          </div>
          <table className="w-full overflow-hidden rounded-sm border border-line text-[11px]">
            <thead>
              <tr className="hairline-b bg-bg-subtle text-left text-ink-3">
                <th className="px-2 py-1 font-medium">category</th>
                <th className="px-2 py-1 font-medium text-right">+ added</th>
                <th className="px-2 py-1 font-medium text-right">− removed</th>
                <th className="px-2 py-1 font-medium text-right">~ changed</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => {
                const s = DIFF_SUMMARY[c];
                const isSel = c === category;
                return (
                  <tr
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'cursor-pointer hairline-b last:border-b-0 hover:bg-bg-hover',
                      isSel && 'bg-accent-soft/40',
                    )}
                  >
                    <td className="px-2 py-1 font-medium text-ink-1">{c}</td>
                    <td className="px-2 py-1 text-right">
                      <Chip tone="static" size="xs">
                        +{s.added}
                      </Chip>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <Chip tone="err" size="xs">
                        −{s.removed}
                      </Chip>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <Chip tone="warn" size="xs">
                        ~{s.changed}
                      </Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 text-caps text-[10px] uppercase text-ink-3">
            Selected: <span className="text-ink-1">{category}</span>
          </div>
          <div className="mt-1 text-[11px] text-ink-3">
            {summary.added + summary.removed + summary.changed} entries differ
            between local and remote profile.
          </div>
        </div>

        {/* Per-category detail */}
        <aside className="max-h-[64vh] overflow-y-auto bg-bg-subtle">
          <div className="px-3 py-3">
            <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
              {category} · {diffEntries.length} entries
            </div>
            <ul className="space-y-2">
              {diffEntries.map((e, i) => (
                <li
                  key={i}
                  className="rounded-sm border border-line bg-bg p-2 text-[11px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-ink-1 truncate" title={e.key}>
                      {e.key}
                    </span>
                    <Chip
                      tone={
                        e.changeType === 'added'
                          ? 'static'
                          : e.changeType === 'removed'
                            ? 'err'
                            : 'warn'
                      }
                      size="xs"
                    >
                      {e.changeType}
                    </Chip>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    <div>
                      <div className="text-[9px] uppercase text-ink-3">mine</div>
                      <CodeBlock
                        code={e.oldValue}
                        showLineNumbers={false}
                        maxHeight={40}
                      />
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-ink-3">theirs</div>
                      <CodeBlock
                        code={e.newValue}
                        showLineNumbers={false}
                        maxHeight={40}
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 flex justify-end gap-1">
                    <Button
                      size="xs"
                      tone="ghost"
                      onClick={() => toast(`Kept mine: ${e.key}`)}
                    >
                      Keep mine
                    </Button>
                    <Button
                      size="xs"
                      tone="default"
                      onClick={() => toast(`Took theirs: ${e.key}`)}
                    >
                      Take theirs
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
