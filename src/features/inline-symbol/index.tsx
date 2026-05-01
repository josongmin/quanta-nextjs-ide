import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { SCOPES, TARGET, type Scope } from './helpers';

export function InlineSymbolOverlay() {
  const open = useUiStore((s) => s.overlays.inlineSymbol.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [scope, setScope] = useState<Scope>('project');
  const [accepted, setAccepted] = useState<ReadonlySet<string>>(
    new Set(TARGET.callsites.map((c) => c.id)),
  );

  const filtered = useMemo(() => {
    if (scope === 'file') {
      const firstFile = TARGET.callsites[0]?.file;
      return TARGET.callsites.filter((c) => c.file === firstFile);
    }
    return TARGET.callsites;
  }, [scope]);

  const warnings = TARGET.callsites.filter((c) => c.warning !== undefined);
  const acceptedCount = filtered.filter((c) => accepted.has(c.id)).length;

  const toggle = (id: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apply = () => {
    toast('Inline applied', {
      description: `${TARGET.name}: inlined at ${acceptedCount} callsites`,
    });
    close('inlineSymbol');
  };

  const dryRun = () => {
    toast('Dry run', {
      description: `${acceptedCount} callsites would be inlined`,
    });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: TARGET.file });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('inlineSymbol')}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Icon.Zap className="h-4 w-4 text-ink-3" />
          <span>Inline symbol</span>
        </span>
      }
      subtitle={
        <span className="font-mono">
          {TARGET.name} · {TARGET.file}
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
          <Button tone="accent" onClick={apply} disabled={acceptedCount === 0}>
            Apply ({acceptedCount})
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b">
            <Chip tone="muted" size="sm" className="font-mono">
              {TARGET.name}
            </Chip>
            <SelectControl
              label="Scope"
              value={scope}
              options={SCOPES}
              onChange={(v) => setScope(v)}
            />
            <Chip tone="muted" size="xs" className="ml-auto">
              {acceptedCount} / {filtered.length} selected
            </Chip>
          </div>

          <div className="px-3 pt-3">
            <div className="mb-1.5 text-caps text-ink-3">Definition</div>
            <CodeBlock code={TARGET.definition} language="ts" maxHeight={80} />
          </div>

          <ul className="divide-y divide-line p-3">
            {filtered.map((c) => {
              const isAccepted = accepted.has(c.id);
              return (
                <li key={c.id} className="py-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isAccepted}
                      onChange={() => toggle(c.id)}
                      className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-accent"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="truncate text-ink-1">{c.file}</span>
                        <span className="text-ink-3">:{c.line}</span>
                        {c.warning ? (
                          <Chip tone="warn" size="xs">
                            warn
                          </Chip>
                        ) : null}
                      </div>
                      <div className="rounded-sm border border-sev-err/20 bg-sev-err-soft/40 px-2 py-1 font-mono text-[11px] text-sev-err">
                        <span className="select-none">- </span>
                        {c.before}
                      </div>
                      <div className="rounded-sm border border-sem-static/20 bg-sem-static-soft/40 px-2 py-1 font-mono text-[11px] text-sem-static">
                        <span className="select-none">+ </span>
                        {c.after}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Alert className="h-3 w-3 text-sev-warn" />
            <span className="text-caps text-ink-3">Warnings</span>
            <Chip tone="warn" size="xs" className="ml-auto">
              {warnings.length}
            </Chip>
          </header>
          <ul className="divide-y divide-line">
            {warnings.length === 0 ? (
              <li className="px-3 py-2 text-[11px] text-ink-3">
                No warnings — all callsites safe to inline.
              </li>
            ) : (
              warnings.map((w) => (
                <li key={w.id} className="px-3 py-2 text-[11px]">
                  <div className="font-mono text-ink-1">
                    {w.file}:{w.line}
                  </div>
                  <p className="mt-0.5 text-sev-warn">{w.warning}</p>
                </li>
              ))
            )}
          </ul>
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b hairline-t">
            <Icon.File className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Affected files</span>
          </header>
          <ul className="p-3 text-[11px] font-mono">
            {Array.from(new Set(filtered.map((c) => c.file))).map((f) => (
              <li key={f} className="truncate py-0.5 text-ink-1">
                {f}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
