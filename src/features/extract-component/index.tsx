import { useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel, Switch } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  AFFECTED_FILES_BY_PLACEMENT,
  PLACEMENT_LABEL,
  TARGET,
  type Placement,
  type PropDef,
} from './helpers';

const PLACEMENTS: ReadonlyArray<Placement> = ['same', 'colocated', 'shared'];

export function ExtractComponentOverlay() {
  const open = useUiStore((s) => s.overlays.extractComponent.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [name, setName] = useState(TARGET.defaultName);
  const [placement, setPlacement] = useState<Placement>('colocated');
  const [props, setProps] = useState<ReadonlyArray<PropDef>>(TARGET.props);
  const [adoptedUsages, setAdoptedUsages] = useState<ReadonlySet<string>>(
    new Set(TARGET.usages.map((u) => u.id)),
  );

  const toggleRequired = (id: string) => {
    setProps((prev) =>
      prev.map((p) => (p.id === id ? { ...p, required: !p.required } : p)),
    );
  };

  const toggleUsage = (id: string) => {
    setAdoptedUsages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apply = () => {
    toast('Extract component applied', {
      description: `${name} → ${PLACEMENT_LABEL[placement]} · ${adoptedUsages.size} usages adopted`,
    });
    close('extractComponent');
  };

  const dryRun = () => {
    toast('Dry run', {
      description: `Would extract <${name}/> with ${props.length} props`,
    });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: TARGET.file });
  };

  const affected = AFFECTED_FILES_BY_PLACEMENT[placement];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('extractComponent')}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Icon.Box className="h-4 w-4 text-ink-3" />
          <span>Extract component</span>
        </span>
      }
      subtitle={
        <span className="font-mono">
          {TARGET.file}:{TARGET.startLine}–{TARGET.endLine}
        </span>
      }
      footer={
        <>
          <Button tone="ghost" onClick={dryRun}>
            Dry-run only
          </Button>
          <Button tone="default" onClick={openInEditor}>
            <Icon.UpRight className="h-3 w-3" /> Open in editor
          </Button>
          <Button tone="accent" onClick={apply} disabled={name.trim().length === 0}>
            Apply
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b">
            <span className="text-caps text-ink-3">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 w-44 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <span className="text-caps text-ink-3">Placement</span>
            {PLACEMENTS.map((p) => (
              <ToggleChip
                key={p}
                active={placement === p}
                onClick={() => setPlacement(p)}
              >
                {PLACEMENT_LABEL[p]}
              </ToggleChip>
            ))}
          </div>

          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="p-3">
              <div className="mb-1.5 text-caps text-ink-3">Before</div>
              <CodeBlock code={TARGET.beforeCode} language="tsx" maxHeight={300} />
            </div>
            <div className="p-3">
              <div className="mb-1.5 text-caps text-ink-3">Preview after</div>
              <CodeBlock code={TARGET.afterCode} language="tsx" maxHeight={300} />
            </div>
          </div>

          <div className="px-3 pb-3">
            <div className="mb-1.5 text-caps text-ink-3">Props</div>
            <div className="overflow-hidden rounded-sm border border-line">
              <table className="w-full text-[11px]">
                <thead className="bg-bg-subtle text-ink-3">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">Name</th>
                    <th className="px-2 py-1 text-left font-medium">Type</th>
                    <th className="px-2 py-1 text-left font-medium">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map((p) => (
                    <tr key={p.id} className="border-t border-line">
                      <td className="px-2 py-1 font-mono text-ink-1">{p.name}</td>
                      <td className="px-2 py-1 font-mono text-ink-3">{p.type}</td>
                      <td className="px-2 py-1">
                        <Switch
                          size="sm"
                          checked={p.required}
                          onCheckedChange={() => toggleRequired(p.id)}
                          label={p.required ? 'Mark optional' : 'Mark required'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Search className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Adoptable usages</span>
            <Chip tone="muted" size="xs" className="ml-auto">
              {adoptedUsages.size} / {TARGET.usages.length}
            </Chip>
          </header>
          <ul className="divide-y divide-line">
            {TARGET.usages.map((u) => {
              const adopted = adoptedUsages.has(u.id);
              return (
                <li key={u.id} className="px-3 py-2 text-[11px]">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={adopted}
                      onChange={() => toggleUsage(u.id)}
                      className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-ink-1">
                        {u.file}:{u.line}
                      </div>
                      <div className="truncate font-mono text-[10px] text-ink-3">
                        {u.snippet}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b hairline-t">
            <Icon.File className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Affected files</span>
          </header>
          <ul className="p-3 text-[11px]">
            {affected.map((f) => (
              <li
                key={f.path}
                className="flex items-center gap-2 py-0.5 font-mono text-ink-1"
              >
                <Icon.File className="h-3 w-3 text-ink-3" />
                <span className="truncate">{f.path}</span>
                <Chip tone="muted" size="xs" className="ml-auto">
                  {f.note}
                </Chip>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
