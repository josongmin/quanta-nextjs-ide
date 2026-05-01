import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { BENEFITS, FALLBACKS, TARGET, type FallbackKind } from './helpers';

export function WrapWithSuspenseOverlay() {
  const open = useUiStore((s) => s.overlays.wrapWithSuspense.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [kind, setKind] = useState<FallbackKind>('skeleton');
  const [extractSkeleton, setExtractSkeleton] = useState(true);

  const after = useMemo(() => TARGET.buildAfterCode(kind), [kind]);

  const apply = () => {
    toast('Wrapped with Suspense', {
      description: `${TARGET.file} · fallback=${kind}${extractSkeleton ? ' · extracted skeleton' : ''}`,
    });
    close('wrapWithSuspense');
  };

  const dryRun = () => {
    toast('Dry run', { description: `Suspense boundary previewed (${kind})` });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: TARGET.file });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('wrapWithSuspense')}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Icon.Layers className="h-4 w-4 text-ink-3" />
          <span>Wrap with Suspense</span>
        </span>
      }
      subtitle={<span className="font-mono">{TARGET.file}</span>}
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
      <div className="grid grid-cols-[1fr_240px] divide-x divide-line">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b">
            <SelectControl
              label="Fallback"
              value={kind}
              options={FALLBACKS.map((f) => ({ value: f.value, label: f.label }))}
              onChange={(v) => setKind(v)}
            />
            <label className="inline-flex items-center gap-1.5 text-[11px] text-ink-2">
              <input
                type="checkbox"
                checked={extractSkeleton}
                onChange={(e) => setExtractSkeleton(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer accent-accent"
              />
              Extract loading skeleton
            </label>
          </div>
          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="p-3">
              <div className="mb-1.5 text-caps text-ink-3">Before</div>
              <CodeBlock
                code={TARGET.beforeCode}
                language="tsx"
                maxHeight={300}
              />
            </div>
            <div className="p-3">
              <div className="mb-1.5 text-caps text-ink-3">Preview after</div>
              <CodeBlock code={after} language="tsx" maxHeight={300} />
            </div>
          </div>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Zap className="h-3 w-3 text-sem-static" />
            <span className="text-caps text-ink-3">Streaming benefits</span>
          </header>
          <ul className="divide-y divide-line">
            {BENEFITS.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-[11px]"
              >
                <span className="text-ink-2">{b.label}</span>
                <Chip tone={b.tone} size="xs">
                  {b.value}
                </Chip>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
