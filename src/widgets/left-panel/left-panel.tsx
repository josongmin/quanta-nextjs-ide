import { match } from 'ts-pattern';
import { useUiStore, type LeftTab } from '@entities/ui-shell';
import { Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { FilesTab } from './tabs/files-tab';
import { RoutesTab } from './tabs/routes-tab';
import { ActionsTab } from './tabs/actions-tab';
import { HandlersTab } from './tabs/handlers-tab';
import { TagsTab } from './tabs/tags-tab';
import { IslandsTab } from './tabs/islands-tab';
import { LayoutsTab } from './tabs/layouts-tab';
import { MetadataTab } from './tabs/metadata-tab';
import { EnvTab } from './tabs/env-tab';
import { MidTab } from './tabs/mid-tab';
import { QualityTab } from './tabs/quality-tab';
import { DbTab } from './tabs/db-tab';
import { ApisTab } from './tabs/apis-tab';
import { I18nTab } from './tabs/i18n-tab';

const tabs: Array<{
  key: LeftTab;
  label: string;
  iconKey: keyof typeof Icon;
}> = [
  { key: 'files', label: 'Files', iconKey: 'File' },
  { key: 'routes', label: 'Routes', iconKey: 'Folder' },
  { key: 'actions', label: 'Actions', iconKey: 'Zap' },
  { key: 'handlers', label: 'Handlers', iconKey: 'Globe' },
  { key: 'tags', label: 'Tags', iconKey: 'Tag' },
  { key: 'islands', label: 'Islands', iconKey: 'Hex' },
  { key: 'layouts', label: 'Layouts', iconKey: 'Layers' },
  { key: 'meta', label: 'Meta', iconKey: 'Doc' },
  { key: 'env', label: 'Env', iconKey: 'Lock' },
  { key: 'mid', label: 'Mid', iconKey: 'Net' },
  { key: 'quality', label: 'Quality', iconKey: 'Shield' },
  { key: 'db', label: 'DB', iconKey: 'Database' },
  { key: 'apis', label: 'APIs', iconKey: 'Net' },
  { key: 'i18n', label: 'i18n', iconKey: 'Globe' },
];

export function LeftPanel() {
  const leftTab = useUiStore((s) => s.leftTab);
  const setLeftTab = useUiStore((s) => s.setLeftTab);

  return (
    <aside
      role="navigation"
      aria-label="Next App Map"
      className="flex h-full min-h-0 flex-col bg-bg-subtle"
    >
      <div className="flex shrink-0 items-stretch overflow-x-auto hairline-b bg-bg">
        {tabs.map((t) => {
          const I = Icon[t.iconKey];
          const active = leftTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setLeftTab(t.key)}
              aria-current={active}
              className={cn(
                'group relative flex h-9 shrink-0 items-center gap-1.5 px-2 text-sm text-ink-2 hover:text-ink-1',
                active && 'text-ink-1 font-medium',
              )}
            >
              <I className="h-3.5 w-3.5" />
              <span>{t.label}</span>
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-1 -bottom-px h-px bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {match(leftTab)
          .with('files', () => <FilesTab />)
          .with('routes', () => <RoutesTab />)
          .with('actions', () => <ActionsTab />)
          .with('handlers', () => <HandlersTab />)
          .with('tags', () => <TagsTab />)
          .with('islands', () => <IslandsTab />)
          .with('layouts', () => <LayoutsTab />)
          .with('meta', () => <MetadataTab />)
          .with('env', () => <EnvTab />)
          .with('mid', () => <MidTab />)
          .with('quality', () => <QualityTab />)
          .with('db', () => <DbTab />)
          .with('apis', () => <ApisTab />)
          .with('i18n', () => <I18nTab />)
          .exhaustive()}
      </div>
    </aside>
  );
}
