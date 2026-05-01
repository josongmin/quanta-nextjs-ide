import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  CATEGORIES,
  CONFIG_OPTIONS,
  PRESETS,
  buildConfigSnippet,
  findOptionByKey,
  type ConfigCategory,
  type ConfigOption,
  type ImpactChip,
} from './helpers';

type OverrideMap = Record<string, string | number | boolean>;

export function NextConfigLabOverlay() {
  const open = useUiStore((s) => s.overlays.nextConfigLab.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeCats, setActiveCats] = useState<ReadonlyArray<ConfigCategory>>([]);
  const [search, setSearch] = useState('');
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [selectedKey, setSelectedKey] = useState<string>(
    CONFIG_OPTIONS[0]?.key ?? 'reactStrictMode',
  );

  const selected = useMemo(
    () => findOptionByKey(selectedKey) ?? CONFIG_OPTIONS[0],
    [selectedKey],
  );

  const filtered = useMemo<ReadonlyArray<ConfigOption>>(() => {
    return CONFIG_OPTIONS.filter((o) => {
      if (activeCats.length > 0 && !activeCats.includes(o.category)) return false;
      if (search.length > 0) {
        const q = search.toLowerCase();
        if (!o.key.toLowerCase().includes(q) && !o.description.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [activeCats, search]);

  const grouped = useMemo(() => {
    const m = new Map<ConfigCategory, ConfigOption[]>();
    for (const c of CATEGORIES) m.set(c, []);
    for (const o of filtered) {
      const arr = m.get(o.category) ?? [];
      arr.push(o);
      m.set(o.category, arr);
    }
    return m;
  }, [filtered]);

  const snippet = useMemo(() => buildConfigSnippet(overrides), [overrides]);

  const overrideEntries = useMemo(() => Object.entries(overrides), [overrides]);

  const setOverride = (key: string, val: string | number | boolean) => {
    setOverrides((cur) => {
      const opt = findOptionByKey(key);
      if (opt && val === opt.defaultValue) {
        const { [key]: _drop, ...rest } = cur;
        void _drop;
        return rest;
      }
      return { ...cur, [key]: val };
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setOverrides((cur) => ({ ...cur, ...preset.overrides }));
    toast(`Applied preset: ${preset.label}`);
  };

  const value = selected ? overrides[selected.key] ?? selected.defaultValue : '';
  const impactChips: ReadonlyArray<ImpactChip> = selected
    ? selected.impact(value as string | number | boolean)
    : [];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('nextConfigLab'))}
      title="Next config lab"
      subtitle={`${CONFIG_OPTIONS.length} options · ${overrideEntries.length} override${overrideEntries.length === 1 ? '' : 's'}`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Diff against current (mock)')}>
            Diff against current
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Open codemod (mock)')}>
            Open codemod
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => toast('Generated next.config.ts (mock)')}
          >
            Generate next.config.ts
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="tracking-caps text-ink-3">categories</span>
        {CATEGORIES.map((c) => (
          <ToggleChip
            key={c}
            active={activeCats.includes(c)}
            onClick={() =>
              setActiveCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
            }
          >
            {c}
          </ToggleChip>
        ))}
        <span className="ml-auto" />
        <SearchInput value={search} onChange={setSearch} placeholder="Search options" />
      </PanelHeader>

      <div className="grid grid-cols-[320px_1fr_260px] divide-x divide-line">
        {/* Left rail: tree */}
        <ScrollArea className="h-[540px]">
          <div className="py-1">
            {CATEGORIES.map((c) => {
              const arr = grouped.get(c) ?? [];
              if (arr.length === 0) return null;
              return (
                <div key={c} className="hairline-b">
                  <div className="bg-bg-subtle px-3 py-1 text-[10px] uppercase tracking-caps text-ink-3">
                    {c}
                  </div>
                  <ul>
                    {arr.map((o) => {
                      const changed = overrides[o.key] !== undefined;
                      const isSel = o.key === selectedKey;
                      return (
                        <li key={o.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedKey(o.key)}
                            className={cn(
                              'flex w-full items-center gap-2 px-3 py-1 text-left text-xs hover:bg-bg-hover',
                              isSel && 'bg-accent-soft',
                            )}
                          >
                            <span className="flex-1 truncate font-mono text-ink-1">
                              {o.key}
                            </span>
                            {changed ? (
                              <span
                                aria-label="modified"
                                className="text-[10px] text-accent"
                                title="Modified"
                              >
                                ✏
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Main editor */}
        <div className="flex h-[540px] flex-col">
          {selected ? (
            <ScrollArea className="flex-1">
              <div className="px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-mono text-sm text-ink-1">{selected.key}</h3>
                  <Chip tone="muted" size="xs">
                    {selected.kind}
                  </Chip>
                  <Chip tone="neutral" size="xs">
                    {selected.category}
                  </Chip>
                </div>
                <p className="mt-1 text-xs text-ink-2">{selected.description}</p>
                <div className="mt-3 hairline-b pb-3">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">value</div>
                  <ValueEditor option={selected} value={value} onChange={(v) => setOverride(selected.key, v)} />
                  <div className="mt-1 text-[10px] text-ink-3">
                    Default:{' '}
                    <code className="font-mono text-ink-2">
                      {String(selected.defaultValue)}
                    </code>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Impact estimate
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {impactChips.map((c, i) => (
                      <Chip key={i} tone={c.tone} size="sm">
                        {c.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Effective config snippet
                  </div>
                  <div className="mt-1">
                    <CodeBlock code={snippet} language="ts" maxHeight={220} />
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </div>

        {/* Right rail */}
        <ScrollArea className="h-[540px]">
          <div className="px-3 py-3">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              Your overrides
            </div>
            {overrideEntries.length === 0 ? (
              <div className="mt-2 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
                None — click an option to change it.
              </div>
            ) : (
              <ul className="mt-2 space-y-1">
                {overrideEntries.map(([k, v]) => {
                  const opt = findOptionByKey(k);
                  return (
                    <li
                      key={k}
                      className="rounded-sm border border-line bg-bg px-2 py-1 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-mono text-ink-1">{k}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const { [k]: _drop, ...rest } = overrides;
                            void _drop;
                            setOverrides(rest);
                          }}
                          className="text-[10px] text-ink-3 hover:text-ink-1"
                          aria-label="Reset"
                        >
                          reset
                        </button>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="text-sev-err line-through">
                          {String(opt?.defaultValue ?? '?')}
                        </span>
                        <span className="text-ink-3">→</span>
                        <span className="text-sem-static">{String(v)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 text-[10px] uppercase tracking-caps text-ink-3">
              Recommended bundles
            </div>
            <ul className="mt-2 space-y-2">
              {PRESETS.map((p) => (
                <li
                  key={p.id}
                  className="rounded-sm border border-line bg-bg px-2 py-2 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <Chip tone="accent" size="xs">
                      {p.label}
                    </Chip>
                    <button
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className="text-[10px] text-accent hover:underline"
                    >
                      apply
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-ink-3">{p.description}</p>
                  <div className="mt-1 text-[10px] font-mono text-ink-2">
                    {Object.keys(p.overrides).length} keys
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

function ValueEditor({
  option,
  value,
  onChange,
}: {
  option: ConfigOption;
  value: string | number | boolean;
  onChange(v: string | number | boolean): void;
}) {
  if (option.kind === 'bool') {
    return (
      <div className="mt-2 flex gap-1.5">
        {[true, false].map((b) => (
          <button
            key={String(b)}
            type="button"
            onClick={() => onChange(b)}
            className={cn(
              'h-6 rounded-sm border px-2 font-mono text-[11px]',
              value === b
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {String(b)}
          </button>
        ))}
      </div>
    );
  }
  if (option.kind === 'enum' && option.options) {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {option.options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              'h-6 rounded-sm border px-2 font-mono text-[11px]',
              value === o
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {o}
          </button>
        ))}
      </div>
    );
  }
  if (option.kind === 'number') {
    return (
      <input
        type="number"
        value={typeof value === 'number' ? value : Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-7 w-32 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-accent"
      />
    );
  }
  return (
    <input
      type="text"
      value={typeof value === 'string' ? value : String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={option.kind === 'object' ? '[]' : ''}
      className="mt-2 h-7 w-full rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-accent"
    />
  );
}
