import { useUpdater } from '@shared/native/useUpdater';
import { useT } from '@shared/i18n';
import { Button, Chip } from '@shared/ui';

/**
 * Persistent thin banner at the top of the IDE when an update is available.
 *
 * Mounted at the app root (next to the topbar). Renders nothing on web or
 * when no update is detected.
 */
export function UpdateBanner() {
  const updater = useUpdater();
  const t = useT('native');
  if (!updater.available) return null;
  return (
    <div className="flex h-7 items-center gap-2 border-b border-accent/40 bg-accent/10 px-3 text-[11px]">
      <Chip tone="accent" size="xs">update</Chip>
      <span className="font-mono text-ink-1">
        {t('update.available', { version: updater.available.version })}
      </span>
      {updater.available.notes ? (
        <span className="truncate text-ink-3" title={updater.available.notes}>
          — {updater.available.notes}
        </span>
      ) : null}
      <span className="ml-auto flex gap-1">
        <Button
          size="xs"
          tone="accent"
          onClick={() => void updater.install()}
          disabled={updater.installing}
        >
          {updater.installing ? t('update.installing') : t('update.install')}
        </Button>
      </span>
    </div>
  );
}
