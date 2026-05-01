import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  LAST_SWITCH_TS,
  PROFILES,
  fmtRel,
  type Profile,
} from './helpers';

export function ProfileSwitcherOverlay() {
  const open = useUiStore((s) => s.overlays.profileSwitcher.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeId, setActiveId] = useState<string>(
    PROFILES.find((p) => p.isActive)?.id ?? PROFILES[0]?.id ?? '',
  );
  const [selectedId, setSelectedId] = useState<string>(activeId);

  const selected = useMemo<Profile | null>(
    () => PROFILES.find((p) => p.id === selectedId) ?? PROFILES[0] ?? null,
    [selectedId],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('profileSwitcher'))}
      title="Profiles"
      subtitle={`${PROFILES.length} profiles · 1 active`}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            <Chip tone="muted" size="xs">
              last switch {fmtRel(LAST_SWITCH_TS)}
            </Chip>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Captured current setup as new profile (mock)')}
            >
              Create from current setup
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('profileSwitcher')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 divide-x divide-line">
        <div className="max-h-[64vh] overflow-y-auto p-3">
          <ul className="space-y-1.5">
            {PROFILES.map((p) => {
              const isActive = p.id === activeId;
              const isSel = p.id === selected?.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      'w-full rounded-sm border border-line bg-bg p-2 text-left hover:border-line-strong',
                      isSel && 'border-accent ring-1 ring-accent/30',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-1">
                          {p.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-ink-3">
                          {p.description}
                        </div>
                      </div>
                      {isActive ? (
                        <Chip tone="accent" size="xs">
                          active
                        </Chip>
                      ) : null}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-3">
                      <Chip tone="muted" size="xs">
                        {p.settingCount} settings
                      </Chip>
                      <Chip tone="muted" size="xs">
                        {p.extensions.length} extensions
                      </Chip>
                      <Chip tone="muted" size="xs">
                        {p.keybindingsCount} keys
                      </Chip>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="max-h-[64vh] overflow-y-auto p-3">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-md font-semibold text-ink-1">
                    {selected.name}
                  </div>
                  <div className="text-[11px] text-ink-3">
                    {selected.description}
                  </div>
                </div>
                {selected.id === activeId ? (
                  <Chip tone="accent" size="xs">
                    active
                  </Chip>
                ) : null}
              </div>

              <div className="mt-3">
                <h4 className="text-caps mb-1 text-[10px] uppercase text-ink-3">
                  Extensions ({selected.extensions.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selected.extensions.map((e) => (
                    <Chip key={e.id} tone="info" size="xs">
                      {e.name}
                      <span className="ml-1 font-mono text-[10px] text-ink-3">
                        {e.version}
                      </span>
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-caps mb-1 text-[10px] uppercase text-ink-3">
                  Settings overrides ({selected.overrides.length} of{' '}
                  {selected.settingCount})
                </h4>
                <div className="overflow-hidden rounded-sm border border-line">
                  <table className="w-full font-mono text-[11px]">
                    <thead>
                      <tr className="hairline-b bg-bg-subtle text-left text-ink-3">
                        <th className="px-2 py-1 font-medium">key</th>
                        <th className="px-2 py-1 font-medium">value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.overrides.map((o, i) => (
                        <tr key={i} className="hairline-b last:border-b-0">
                          <td className="px-2 py-1 text-ink-1">{o.key}</td>
                          <td className="px-2 py-1 text-ink-2">{o.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-caps mb-1 text-[10px] uppercase text-ink-3">
                  Keybindings
                </h4>
                <Chip tone="muted" size="xs">
                  {selected.keybindingsCount} bindings
                </Chip>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Button
                  size="xs"
                  tone="accent"
                  disabled={selected.id === activeId}
                  onClick={() => {
                    setActiveId(selected.id);
                    toast(`Activated profile: ${selected.name}`);
                  }}
                >
                  Activate
                </Button>
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast(`Duplicated ${selected.name}`)}
                >
                  Duplicate
                </Button>
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() =>
                    toast(`Exported ${selected.id}.profile.json (mock)`)
                  }
                >
                  Export profile.json
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-ink-3">Select a profile.</div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
