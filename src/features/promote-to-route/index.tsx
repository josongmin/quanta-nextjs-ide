import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  Icon,
  OverlayPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { ARCHETYPES, TARGET, type Archetype } from './helpers';

export function PromoteToRouteOverlay() {
  const open = useUiStore((s) => s.overlays.promoteToRoute.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [archetype, setArchetype] = useState<Archetype>('page');
  const [path, setPath] = useState(TARGET.defaultPath);

  const visibleFiles = useMemo(
    () => TARGET.files.filter((f) => f.archetypes.includes(archetype)),
    [archetype],
  );
  const initialTab = visibleFiles[0]?.id ?? '';
  const [tab, setTab] = useState<string>(initialTab);

  // keep tab in-range when archetype changes
  const activeTab = visibleFiles.some((f) => f.id === tab)
    ? tab
    : (visibleFiles[0]?.id ?? '');

  const apply = () => {
    toast('Route promoted', {
      description: `${path} · ${visibleFiles.length} files generated`,
    });
    close('promoteToRoute');
  };

  const dryRun = () => {
    toast('Dry run', { description: `Would create ${visibleFiles.length} files` });
  };

  const openInEditor = () => {
    toast('Open in editor', { description: visibleFiles[0]?.path ?? path });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('promoteToRoute')}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Icon.Branch className="h-4 w-4 text-ink-3" />
          <span>Promote to route</span>
        </span>
      }
      subtitle={<span className="font-mono">{TARGET.sourceFile}</span>}
      footer={
        <>
          <Button tone="ghost" onClick={dryRun}>
            Dry-run only
          </Button>
          <Button tone="default" onClick={openInEditor}>
            <Icon.UpRight className="h-3 w-3" /> Open in editor
          </Button>
          <Button tone="accent" onClick={apply} disabled={path.trim().length === 0}>
            Apply
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="min-w-0">
          <div className="space-y-2 px-3 py-2 hairline-b">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caps text-ink-3">Segment path</span>
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="h-7 w-72 rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-caps text-ink-3">Archetype</span>
              {ARCHETYPES.map((a) => (
                <ToggleChip
                  key={a.value}
                  active={archetype === a.value}
                  onClick={() => setArchetype(a.value)}
                  title={a.hint}
                >
                  {a.label}
                </ToggleChip>
              ))}
            </div>
          </div>

          <div className="px-3 py-2 hairline-b">
            <div className="mb-1.5 text-caps text-ink-3">Files to create</div>
            <ul className="space-y-0.5 text-[11px] font-mono">
              {visibleFiles.map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-ink-1">
                  <Icon.Plus className="h-3 w-3 text-sem-static" />
                  <span className="truncate">{f.path}</span>
                </li>
              ))}
            </ul>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setTab(v)}>
            <TabsList>
              {visibleFiles.map((f) => (
                <TabsTrigger key={f.id} value={f.id}>
                  {f.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {visibleFiles.map((f) => (
              <TabsContent key={f.id} value={f.id} className="p-3">
                <CodeBlock code={f.code} language="tsx" maxHeight={280} />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <aside className="min-w-0">
          <header className="flex items-center gap-2 bg-bg-subtle px-3 py-2 hairline-b">
            <Icon.Net className="h-3 w-3 text-ink-3" />
            <span className="text-caps text-ink-3">Re-route imports</span>
            <Chip tone="muted" size="xs" className="ml-auto">
              {TARGET.redirects.length}
            </Chip>
          </header>
          <ul className="divide-y divide-line">
            {TARGET.redirects.map((r) => (
              <li key={r.id} className="px-3 py-2 text-[11px]">
                <div className="truncate font-mono text-ink-1">{r.file}</div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-sev-err line-through">
                  {r.oldImport}
                </div>
                <div className="truncate font-mono text-[10px] text-sem-static">
                  {r.newHref}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
