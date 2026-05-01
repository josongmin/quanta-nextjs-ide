import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  OverlayPanel,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  KINDS,
  REMOTES,
  fmtUptime,
  kindGlyph,
  relTime,
  statusTone,
  type Remote,
  type RemoteKind,
} from './helpers';

export function RemoteSessionOverlay() {
  const open = useUiStore((s) => s.overlays.remoteSession.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [kindFilter, setKindFilter] =
    useState<ReadonlyArray<RemoteKind>>(KINDS);
  const [selectedId, setSelectedId] = useState<string>(REMOTES[0]?.id ?? '');
  const [switchOpen, setSwitchOpen] = useState(false);

  const filtered = useMemo<ReadonlyArray<Remote>>(
    () => REMOTES.filter((r) => kindFilter.includes(r.kind)),
    [kindFilter],
  );

  const selected = useMemo(
    () =>
      REMOTES.find((r) => r.id === selectedId) ??
      filtered[0] ??
      REMOTES[0] ??
      null,
    [selectedId, filtered],
  );

  const connected = REMOTES.filter((r) => r.status === 'connected');
  const avgLatency =
    connected.length === 0
      ? 0
      : Math.round(
          connected.reduce((acc, r) => acc + r.latencyMs, 0) / connected.length,
        );

  const primaryAction = (r: Remote) => {
    if (r.status === 'connected') return 'Disconnect';
    if (r.status === 'error') return 'Reconnect';
    if (r.status === 'connecting') return 'Cancel';
    return 'Connect';
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('remoteSession'))}
      title="Remote Session"
      subtitle={`${REMOTES.length} endpoints · ${connected.length} connected`}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            <Chip tone="info" size="xs">
              {connected.length} connected
            </Chip>
            <span className="font-mono text-ink-2">
              avg latency {avgLatency}ms
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={switchOpen} onOpenChange={setSwitchOpen}>
              <PopoverTrigger asChild>
                <Button size="xs" tone="default">
                  Switch active session ▾
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <ul className="py-1">
                  {connected.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(r.id);
                          setSwitchOpen(false);
                          toast(`Active: ${r.label}`);
                        }}
                        className="flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-xs hover:bg-bg-hover"
                      >
                        <span className="font-medium text-ink-1">{r.label}</span>
                        <span className="font-mono text-[10px] text-ink-3">
                          {r.latencyMs}ms
                        </span>
                      </button>
                    </li>
                  ))}
                  {connected.length === 0 && (
                    <li className="px-2 py-2 text-[11px] text-ink-3">
                      No connected sessions.
                    </li>
                  )}
                </ul>
              </PopoverContent>
            </Popover>
            <Button size="xs" tone="ghost" onClick={() => close('remoteSession')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          kind
        </span>
        {KINDS.map((k) => (
          <ToggleChip
            key={k}
            active={kindFilter.includes(k)}
            onClick={() =>
              setKindFilter((prev) =>
                prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
              )
            }
          >
            {k}
          </ToggleChip>
        ))}
        <span className="h-4 w-px bg-line" aria-hidden />
        <Button
          size="xs"
          tone="default"
          onClick={() => toast('Add remote (mock dialog)')}
        >
          + Add remote
        </Button>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="max-h-[64vh] overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((r) => {
              const isSel = r.id === selected?.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    'cursor-pointer rounded-sm border border-line bg-bg p-2 hover:border-line-strong',
                    isSel && 'border-accent ring-1 ring-accent/30',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        aria-hidden
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-line bg-bg-subtle text-[12px] text-ink-2"
                      >
                        {kindGlyph(r.kind)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink-1">
                          {r.label}
                        </div>
                        <div className="truncate font-mono text-[10px] text-ink-3" title={r.host}>
                          {r.host}
                        </div>
                      </div>
                    </div>
                    <Chip tone={statusTone(r.status)} size="xs">
                      {r.status}
                    </Chip>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-3">
                    <Chip tone="muted" size="xs">
                      {r.latencyMs > 0 ? `${r.latencyMs}ms` : '—'}
                    </Chip>
                    <span className="font-mono">
                      last {relTime(r.lastUsed)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex justify-end">
                    <Button
                      size="xs"
                      tone={
                        r.status === 'connected'
                          ? 'warn'
                          : r.status === 'error'
                            ? 'err'
                            : 'default'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toast(`${primaryAction(r)} ${r.label}`);
                      }}
                    >
                      {primaryAction(r)}
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-3 py-8 text-center text-[11px] text-ink-3">
                No remotes match.
              </div>
            )}
          </div>
        </div>

        <aside className="max-h-[64vh] overflow-y-auto bg-bg-subtle">
          {selected ? (
            <div className="px-3 py-3">
              <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
                Session
              </div>
              <div className="text-sm font-medium text-ink-1">
                {selected.label}
              </div>
              <div className="font-mono text-[11px] text-ink-3">
                {selected.host}
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                <Chip tone={statusTone(selected.status)} size="xs">
                  {selected.status}
                </Chip>
                <Chip tone="muted" size="xs">
                  uptime {fmtUptime(selected.uptimeMin)}
                </Chip>
                <Chip tone="muted" size="xs">
                  {selected.latencyMs > 0 ? `${selected.latencyMs}ms` : '—'}
                </Chip>
              </div>

              <div className="mt-3">
                <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
                  Environment
                </div>
                <div className="flex flex-wrap gap-1">
                  {selected.envChips.map((c, i) => (
                    <Chip key={i} tone="info" size="xs">
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
                  Recent commands
                </div>
                <ul className="divide-y divide-line rounded-sm border border-line bg-bg">
                  {selected.recentCommands.map((c, i) => (
                    <li
                      key={i}
                      className="px-2 py-1 font-mono text-[11px] text-ink-1"
                    >
                      <span className="mr-1 text-ink-3">$</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast(`Open shell: ${selected.label}`)}
                >
                  Open shell
                </Button>
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => toast(`Forward port → ${selected.label}`)}
                >
                  Forward port
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-6 text-xs text-ink-3">
              Select a remote.
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
