import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  AFFECTED_FILES,
  TARGET,
  buildSignature,
  reorderParams,
  type ExtractParam,
  type TargetFileMode,
} from './helpers';

export function ExtractFunctionOverlay() {
  const open = useUiStore((s) => s.overlays.extractFunction.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [name, setName] = useState(TARGET.defaultName);
  const [params, setParams] = useState<ReadonlyArray<ExtractParam>>(
    TARGET.params,
  );
  const [targetMode, setTargetMode] = useState<TargetFileMode>('current');

  const signature = useMemo(
    () => buildSignature(name, params, TARGET.returnType),
    [name, params],
  );

  const move = (fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= params.length) return;
    setParams((p) => reorderParams(p, fromIdx, toIdx));
  };

  const apply = () => {
    toast('Extract function applied', {
      description: `${name}(${params.map((p) => p.name).join(', ')}) → ${TARGET.file}`,
    });
    close('extractFunction');
  };

  const dryRun = () => {
    toast('Dry run', {
      description: `${name} would replace lines ${TARGET.startLine}–${TARGET.endLine}`,
    });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: TARGET.file });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('extractFunction')}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Icon.Code className="h-4 w-4 text-ink-3" />
          <span>Extract function</span>
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
      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b">
            <span className="text-caps text-ink-3">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 w-56 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <Chip tone="muted" size="xs" className="font-mono">
              returns {TARGET.returnType}
            </Chip>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 hairline-b">
            <span className="text-caps text-ink-3">Suggested</span>
            {TARGET.nameCandidates.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setName(c)}
                className={cn(
                  'inline-flex h-5 items-center gap-1 rounded-full border px-2 font-mono text-[11px]',
                  name === c
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="p-3">
              <div className="mb-1.5 text-caps text-ink-3">Before</div>
              <CodeBlock
                code={TARGET.beforeCode}
                language="tsx"
                maxHeight={360}
              />
            </div>
            <div className="p-3">
              <div className="mb-1.5 text-caps text-ink-3">Preview after</div>
              <CodeBlock
                code={TARGET.afterSelectionCode}
                language="tsx"
                maxHeight={360}
              />
            </div>
          </div>
          <div className="px-3 pb-3">
            <div className="rounded-sm border border-line bg-bg-subtle p-2 font-mono text-[11px] text-ink-1">
              {signature}
            </div>
          </div>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Settings className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Options</span>
          </header>
          <div className="space-y-3 p-3 text-[11px]">
            <div>
              <div className="mb-1.5 text-caps text-ink-3">Target file</div>
              <div className="flex flex-wrap gap-1.5">
                <ToggleChip
                  active={targetMode === 'current'}
                  onClick={() => setTargetMode('current')}
                >
                  Current file
                </ToggleChip>
                <ToggleChip
                  active={targetMode === 'new'}
                  onClick={() => setTargetMode('new')}
                >
                  New helpers.ts
                </ToggleChip>
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-caps text-ink-3">Parameters</div>
              <ul className="space-y-1">
                {params.map((p, idx) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-1.5 rounded-sm border border-line bg-bg p-1.5"
                  >
                    <span
                      aria-hidden
                      className="flex h-4 w-4 cursor-grab select-none items-center justify-center text-ink-3"
                    >
                      <DragHandle />
                    </span>
                    <span className="font-mono text-ink-1">{p.name}</span>
                    <span className="font-mono text-ink-3">: {p.type}</span>
                    <Chip tone="muted" size="xs" className="ml-auto">
                      {p.origin}
                    </Chip>
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-ink-1 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <Icon.Up className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === params.length - 1}
                      className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-ink-1 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <Icon.Down className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b hairline-t">
            <Icon.File className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Affected files</span>
          </header>
          <ul className="p-3 text-[11px]">
            {AFFECTED_FILES.map((f) => (
              <li
                key={f.path}
                className="flex items-center gap-2 py-0.5 font-mono text-ink-1"
              >
                <Icon.File className="h-3 w-3 text-ink-3" />
                <span className="truncate">{f.path}</span>
                <Chip tone="muted" size="xs" className="ml-auto">
                  {f.hunks} hunk
                </Chip>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function DragHandle() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden>
      <circle cx="4" cy="3" r="1" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="9" r="1" />
      <circle cx="8" cy="3" r="1" />
      <circle cx="8" cy="6" r="1" />
      <circle cx="8" cy="9" r="1" />
    </svg>
  );
}
