import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { TARGET } from './helpers';

export function ConvertToServerOverlay() {
  const open = useUiStore((s) => s.overlays.convertToServer.open);
  const close = useUiStore((s) => s.closeOverlay);

  const apply = () => {
    toast('Converted to Server Component', {
      description: `${TARGET.file} · removed 'use client' directive`,
    });
    close('convertToServer');
  };

  const dryRun = () => {
    toast('Dry run', { description: `Would convert ${TARGET.file} to RSC` });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: TARGET.file });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('convertToServer')}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Icon.Server className="h-4 w-4 text-sem-server" />
          <span>Convert to Server Component</span>
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
      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Chip tone="client" size="xs">
                client
              </Chip>
              <span className="text-caps text-ink-3">Before</span>
            </div>
            <CodeBlock code={TARGET.beforeCode} language="tsx" maxHeight={360} />
          </div>
          <div className="p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Chip tone="server" size="xs">
                server
              </Chip>
              <span className="text-caps text-ink-3">Preview after</span>
            </div>
            <CodeBlock code={TARGET.afterCode} language="tsx" maxHeight={360} />
          </div>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Shield className="h-3 w-3 text-sem-static" />
            <span className="text-caps text-ink-3">Client-only flags</span>
          </header>
          <ul className="divide-y divide-line">
            {TARGET.flags.map((f) => (
              <li
                key={f.id}
                className="flex items-start gap-2 px-3 py-2 text-[11px]"
              >
                <CheckIcon ok={!f.detected} />
                <div className="min-w-0">
                  <div className="font-mono text-ink-1">{f.label}</div>
                  <div className="text-ink-3">{f.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b hairline-t">
            <Icon.Bulb className="h-3 w-3 text-sem-static" />
            <span className="text-caps text-ink-3">Why this is safe</span>
          </header>
          <div className="flex flex-wrap gap-1.5 p-3">
            {TARGET.safetyReasons.map((r) => (
              <Chip key={r} tone="static" size="xs">
                {r}
              </Chip>
            ))}
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function CheckIcon({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <svg
        viewBox="0 0 12 12"
        className="h-3.5 w-3.5 shrink-0 text-sem-static"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path
          d="M2 6.5l2.5 2.5L10 3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3.5 w-3.5 shrink-0 text-sev-warn"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
    </svg>
  );
}
