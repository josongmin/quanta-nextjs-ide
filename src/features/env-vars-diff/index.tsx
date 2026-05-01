import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  ENVS,
  ENV_VARS,
  KIND_TONE,
  isSecret,
  maskValue,
  type EnvName,
  type EnvVar,
} from './helpers';

export function EnvVarsDiffOverlay() {
  const open = useUiStore((s) => s.overlays.envVarsDiff.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [pickedEnvs, setPickedEnvs] = useState<ReadonlyArray<EnvName>>([
    'local',
    'preview',
    'staging',
    'production',
  ]);
  const [search, setSearch] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>(ENV_VARS[0]!.key);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const baseline: EnvName = pickedEnvs[0] ?? 'production';

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ENV_VARS.filter((v) => {
      if (q && !v.key.toLowerCase().includes(q)) return false;
      if (missingOnly) {
        const anyMissing = pickedEnvs.some((e) => v.values[e] === undefined);
        if (!anyMissing) return false;
      }
      return true;
    });
  }, [search, missingOnly, pickedEnvs]);

  const stats = useMemo(() => {
    let missing = 0;
    let secrets = 0;
    let required = 0;
    for (const v of ENV_VARS) {
      if (isSecret(v.key)) secrets++;
      if (v.required) required++;
      for (const e of pickedEnvs) {
        if (v.values[e] === undefined) {
          missing++;
          break;
        }
      }
    }
    return { missing, secrets, required };
  }, [pickedEnvs]);

  const selected: EnvVar =
    ENV_VARS.find((v) => v.key === selectedKey) ?? ENV_VARS[0]!;

  const togglePicked = (e: EnvName) => {
    setPickedEnvs((prev) => {
      if (prev.includes(e)) return prev.filter((x) => x !== e);
      if (prev.length >= 4) return prev;
      return ENVS.filter((x) => prev.includes(x) || x === e);
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('envVarsDiff')}
      title="Env Vars Diff"
      subtitle={`${ENV_VARS.length} variables · ${pickedEnvs.length} envs compared`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            {stats.missing} missing · {stats.secrets} secrets · {stats.required} required
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('.env.example generated (mock)')}
            >
              Generate .env.example
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Synced to vault (mock)')}
            >
              Sync to vault
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex">
        <div className="min-w-0 flex-1">
          <PanelHeader>
            <span className="text-ink-3">compare:</span>
            {ENVS.map((e) => (
              <ToggleChip
                key={e}
                active={pickedEnvs.includes(e)}
                onClick={() => togglePicked(e)}
              >
                {e}
              </ToggleChip>
            ))}
            <span className="mx-1 h-3 w-px bg-line" />
            <ToggleChip
              active={missingOnly}
              onClick={() => setMissingOnly(!missingOnly)}
            >
              missing in any
            </ToggleChip>
            <div className="ml-auto w-44">
              <SearchInput value={search} onChange={setSearch} placeholder="key" />
            </div>
          </PanelHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2">
              <table className="w-full border-separate border-spacing-0 text-[11px]">
                <thead>
                  <tr className="text-left text-ink-3">
                    <th className="hairline-b sticky top-0 z-10 bg-bg-subtle px-2 py-1 font-normal">
                      key
                    </th>
                    <th className="hairline-b sticky top-0 z-10 bg-bg-subtle px-2 py-1 font-normal">
                      kind
                    </th>
                    {pickedEnvs.map((e) => (
                      <th
                        key={e}
                        className="hairline-b sticky top-0 z-10 bg-bg-subtle px-2 py-1 font-normal"
                      >
                        {e}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((v) => {
                    const baseVal = v.values[baseline];
                    return (
                      <tr
                        key={v.key}
                        className={cn(
                          'cursor-pointer hover:bg-bg-hover',
                          selectedKey === v.key && 'bg-accent-soft/40',
                        )}
                        onClick={() => setSelectedKey(v.key)}
                      >
                        <td className="hairline-b px-2 py-1 font-mono text-ink-1">
                          <span className="inline-flex items-center gap-1">
                            {v.key}
                            {v.required ? (
                              <Chip tone="warn" size="xs">
                                req
                              </Chip>
                            ) : null}
                          </span>
                        </td>
                        <td className="hairline-b px-2 py-1">
                          <Chip tone={KIND_TONE[v.kind]} size="xs">
                            {v.kind}
                          </Chip>
                        </td>
                        {pickedEnvs.map((e) => {
                          const val = v.values[e];
                          if (val === undefined) {
                            return (
                              <td key={e} className="hairline-b px-2 py-1">
                                <Chip tone="err" size="xs">
                                  missing
                                </Chip>
                              </td>
                            );
                          }
                          const differs = baseVal !== undefined && val !== baseVal;
                          const display = isSecret(v.key) ? maskValue(val) : val;
                          return (
                            <td key={e} className="hairline-b px-2 py-1">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 font-mono text-[10px]',
                                  differs ? 'text-sev-warn' : 'text-ink-1',
                                )}
                                title={isSecret(v.key) ? 'secret · masked' : val}
                              >
                                {display}
                                {differs ? (
                                  <Chip tone="warn" size="xs">
                                    differs
                                  </Chip>
                                ) : null}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>

        <aside className="w-[320px] shrink-0 hairline-l bg-bg-subtle/40">
          <div className="p-3">
            <div className="text-caps text-ink-3">Selected variable</div>
            <div className="mt-1 break-all font-mono text-md text-ink-1">
              {selected.key}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <Chip tone={KIND_TONE[selected.kind]} size="xs">
                {selected.kind}
              </Chip>
              {selected.required ? (
                <Chip tone="warn" size="xs">
                  required
                </Chip>
              ) : null}
              {isSecret(selected.key) ? (
                <Chip tone="err" size="xs">
                  secret
                </Chip>
              ) : null}
            </div>

            <h4 className="text-caps mt-3 text-ink-3">Values</h4>
            <ul className="mt-1 space-y-1">
              {ENVS.map((e) => {
                const val = selected.values[e];
                const k = `${selected.key}:${e}`;
                const r = reveal[k] === true;
                const masked = isSecret(selected.key) && !r;
                return (
                  <li
                    key={e}
                    className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1"
                  >
                    <span className="w-16 text-[10px] uppercase tracking-caps text-ink-3">
                      {e}
                    </span>
                    {val === undefined ? (
                      <Chip tone="err" size="xs">
                        missing
                      </Chip>
                    ) : (
                      <span className="flex-1 truncate font-mono text-[10px] text-ink-1">
                        {masked ? maskValue(val) : val}
                      </span>
                    )}
                    {val !== undefined && isSecret(selected.key) ? (
                      <button
                        type="button"
                        className="text-[10px] text-ink-3 hover:text-ink-1"
                        onClick={() => {
                          setReveal((p) => ({ ...p, [k]: !p[k] }));
                          toast(r ? 'Hidden secret' : 'Revealed secret (mock)');
                        }}
                      >
                        {r ? 'hide' : 'reveal'}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <h4 className="text-caps mt-3 text-ink-3">Used in</h4>
            <ul className="mt-1 space-y-0.5">
              {selected.usedIn.map((u) => (
                <li
                  key={`${u.file}:${u.line}`}
                  className="font-mono text-[10px] text-ink-2"
                >
                  {u.file}
                  <span className="text-ink-3">:{u.line}</span>
                </li>
              ))}
            </ul>

            {selected.nextRotation ? (
              <div className="mt-3 rounded-sm border border-line bg-bg p-2 text-[11px]">
                <span className="text-ink-3">Suggested rotation: </span>
                <span className="font-mono text-ink-1">{selected.nextRotation}</span>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
