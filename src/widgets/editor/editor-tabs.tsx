import { useEditorStore } from '@entities/editor';
import { Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { EditorTabBadge } from './parts/editor-tab-badge';

export function EditorTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActive = useEditorStore((s) => s.setActive);
  const closeTab = useEditorStore((s) => s.closeTab);

  return (
    <div role="tablist" className="flex h-9 items-stretch overflow-x-auto hairline-b bg-bg-subtle">
      {tabs.map((t) => {
        const active = t.id === activeTabId;
        return (
          <div
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => setActive(t.id)}
            className={cn(
              'group relative inline-flex h-9 cursor-pointer items-center gap-2 px-3 text-sm text-ink-2 hover:text-ink-1',
              active && 'bg-bg text-ink-1 hairline-r hairline-l',
            )}
          >
            <span className="font-mono text-[12px]">{t.label}</span>
            <EditorTabBadge file={t.file} />
            <span
              aria-label={t.dirty ? 'Unsaved' : 'Saved'}
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                t.dirty ? 'bg-accent' : 'bg-transparent',
              )}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(t.id);
              }}
              className="text-ink-3 opacity-0 hover:text-ink-1 group-hover:opacity-100"
              aria-label={`Close ${t.label}`}
            >
              <Icon.X className="h-3 w-3" />
            </button>
            {active && (
              <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-accent" />
            )}
          </div>
        );
      })}
    </div>
  );
}
