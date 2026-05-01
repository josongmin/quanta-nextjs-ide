import { useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { TARGET } from './helpers';

export function ExtractServerActionOverlay() {
  const open = useUiStore((s) => s.overlays.extractServerAction.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [actionName, setActionName] = useState(TARGET.defaultActionName);
  const [path, setPath] = useState(TARGET.defaultPath);
  const [tag, setTag] = useState(TARGET.defaultRevalidateTag);

  const apply = () => {
    toast('Server action extracted', {
      description: `${actionName} → ${path} · revalidateTag('${tag}')`,
    });
    close('extractServerAction');
  };

  const dryRun = () => {
    toast('Dry run', { description: `Would create ${path}` });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: TARGET.file });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('extractServerAction')}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Icon.Server className="h-4 w-4 text-sem-server" />
          <span>Extract Server Action</span>
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
          <Button tone="accent" onClick={apply} disabled={actionName.trim().length === 0}>
            Apply
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b">
            <span className="text-caps text-ink-3">Action name</span>
            <input
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="h-7 w-44 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <span className="text-caps text-ink-3">Path</span>
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="h-7 w-64 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <Chip tone="client" size="xs">
                  client
                </Chip>
                <span className="text-caps text-ink-3">Before</span>
              </div>
              <CodeBlock code={TARGET.beforeCode} language="tsx" maxHeight={300} />
            </div>
            <div className="space-y-3 p-3">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Chip tone="client" size="xs">
                    client
                  </Chip>
                  <span className="text-caps text-ink-3">After (form)</span>
                </div>
                <CodeBlock
                  code={TARGET.afterClientCode}
                  language="tsx"
                  maxHeight={140}
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Chip tone="server" size="xs">
                    server
                  </Chip>
                  <span className="text-caps text-ink-3">After (action)</span>
                </div>
                <CodeBlock
                  code={TARGET.afterServerCode}
                  language="ts"
                  maxHeight={180}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Shield className="h-3 w-3 text-sem-static" />
            <span className="text-caps text-ink-3">Zod schema (auto)</span>
          </header>
          <ul className="divide-y divide-line">
            {TARGET.fields.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 px-3 py-2 text-[11px] font-mono"
              >
                <span className="text-ink-1">{f.name}</span>
                <span className="text-ink-3">:</span>
                <span className="truncate text-sem-static">{f.schema}</span>
              </li>
            ))}
          </ul>
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b hairline-t">
            <Icon.Refresh className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Revalidation tag</span>
          </header>
          <div className="p-3">
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="orders"
              className="h-7 w-full rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1 text-[11px] text-ink-3">
              Will emit revalidateTag('{tag}') after success.
            </p>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
