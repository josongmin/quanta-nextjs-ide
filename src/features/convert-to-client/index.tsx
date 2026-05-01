import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { TARGET } from './helpers';

export function ConvertToClientOverlay() {
  const open = useUiStore((s) => s.overlays.convertToClient.open);
  const close = useUiStore((s) => s.closeOverlay);

  const apply = () => {
    toast('Converted to Client Component', {
      description: `${TARGET.file} · added 'use client' · +${TARGET.blastKb.toFixed(1)} KB`,
    });
    close('convertToClient');
  };

  const dryRun = () => {
    toast('Dry run', {
      description: `Boundary blast estimate: +${TARGET.blastKb.toFixed(1)} KB`,
    });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: TARGET.file });
  };

  const suggestLeaf = () => {
    toast('Suggestion', { description: TARGET.suggestion });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('convertToClient')}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Icon.Globe className="h-4 w-4 text-sem-client" />
          <span>Convert to Client Component</span>
        </span>
      }
      subtitle={<span className="font-mono">{TARGET.file}</span>}
      footer={
        <>
          <Button tone="ghost" onClick={suggestLeaf}>
            <Icon.Bulb className="h-3 w-3" /> Extract as leaf island
          </Button>
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
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Chip tone="server" size="xs">
                server
              </Chip>
              <span className="text-caps text-ink-3">Before</span>
            </div>
            <CodeBlock code={TARGET.beforeCode} language="tsx" maxHeight={360} />
          </div>
          <div className="p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Chip tone="client" size="xs">
                client
              </Chip>
              <span className="text-caps text-ink-3">Preview after</span>
            </div>
            <CodeBlock code={TARGET.afterCode} language="tsx" maxHeight={360} />
          </div>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Zap className="h-3 w-3 text-sem-client" />
            <span className="text-caps text-ink-3">Reasons to be client</span>
          </header>
          <ul className="divide-y divide-line">
            {TARGET.reasons.map((r) => (
              <li key={r.id} className="px-3 py-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Chip tone="client" size="xs">
                    {r.label}
                  </Chip>
                </div>
                <div className="mt-0.5 text-ink-3">{r.detail}</div>
              </li>
            ))}
          </ul>
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b hairline-t">
            <Icon.Alert className="h-3 w-3 text-sev-warn" />
            <span className="text-caps text-ink-3">Boundary blast</span>
          </header>
          <div className="space-y-2 p-3 text-[11px]">
            <div className="rounded-sm border border-sev-warn/30 bg-sev-warn-soft p-2">
              <div className="font-mono text-sev-warn">
                +{TARGET.blastKb.toFixed(1)} KB to client bundle
              </div>
              <div className="text-ink-3">
                downstream tree converts to client too.
              </div>
            </div>
            <div className="rounded-sm border border-line bg-bg-subtle p-2 text-ink-2">
              <Icon.Bulb className="mr-1 inline h-3 w-3 text-sev-info" />
              {TARGET.suggestion}
            </div>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
