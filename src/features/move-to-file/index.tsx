import { useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { TARGET } from './helpers';

export function MoveToFileOverlay() {
  const open = useUiStore((s) => s.overlays.moveToFile.open);
  const close = useUiStore((s) => s.closeOverlay);

  const initialDest =
    TARGET.destinations.find((d) => d.suggested)?.id ??
    TARGET.destinations[0]?.id ??
    '';
  const [destId, setDestId] = useState<string>(initialDest);
  const [overrideName, setOverrideName] = useState<string>(TARGET.symbol);
  const [updateCallers, setUpdateCallers] = useState<ReadonlySet<string>>(
    new Set(TARGET.callers.map((c) => c.id)),
  );

  const dest =
    TARGET.destinations.find((d) => d.id === destId) ?? TARGET.destinations[0];

  const toggleCaller = (id: string) => {
    setUpdateCallers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apply = () => {
    toast('Move applied', {
      description: `${overrideName} → ${dest?.path ?? '?'} · ${updateCallers.size} imports updated`,
    });
    close('moveToFile');
  };

  const dryRun = () => {
    toast('Dry run', {
      description: `Would move ${overrideName} to ${dest?.path ?? '?'}`,
    });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: TARGET.sourceFile });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('moveToFile')}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Icon.Folder className="h-4 w-4 text-ink-3" />
          <span>Move to file</span>
        </span>
      }
      subtitle={
        <span className="font-mono">
          {TARGET.symbol} from {TARGET.sourceFile}
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
          <Button tone="accent" onClick={apply}>
            Apply
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="min-w-0">
          <div className="space-y-2 px-3 py-2 hairline-b">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-caps text-ink-3">Destination</span>
              {TARGET.destinations.map((d) => (
                <ToggleChip
                  key={d.id}
                  active={destId === d.id}
                  onClick={() => setDestId(d.id)}
                  title={d.note}
                >
                  <span className="font-mono">{d.path}</span>
                  {d.suggested ? (
                    <Chip tone="accent" size="xs" className="ml-1">
                      suggested
                    </Chip>
                  ) : null}
                </ToggleChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caps text-ink-3">Rename on move</span>
              <input
                value={overrideName}
                onChange={(e) => setOverrideName(e.target.value)}
                className="h-7 w-44 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder={TARGET.symbol}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="p-3">
              <div className="mb-1.5 text-caps text-ink-3">
                Before — source
              </div>
              <CodeBlock
                code={TARGET.beforeSource}
                language="ts"
                maxHeight={300}
              />
            </div>
            <div className="p-3">
              <div className="mb-1.5 text-caps text-ink-3">
                After — destination
              </div>
              <CodeBlock
                code={TARGET.afterDestination}
                language="ts"
                maxHeight={300}
              />
            </div>
          </div>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Link className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Update imports</span>
            <Chip tone="muted" size="xs" className="ml-auto">
              {updateCallers.size} / {TARGET.callers.length}
            </Chip>
          </header>
          <ul className="divide-y divide-line">
            {TARGET.callers.map((c) => {
              const checked = updateCallers.has(c.id);
              return (
                <li key={c.id} className="px-3 py-2 text-[11px]">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCaller(c.id)}
                      className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-ink-1">
                        {c.path}
                      </div>
                      <div className="truncate font-mono text-[10px] text-sev-err line-through">
                        {c.oldImport}
                      </div>
                      <div className="truncate font-mono text-[10px] text-sem-static">
                        {c.newImport}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
