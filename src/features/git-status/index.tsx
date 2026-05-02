import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { getGitStatus, type GitStatus } from '@entities/git';
import { getWorkspaceRoot } from '@shared/runner';
import { useT } from '@shared/i18n';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';

const STATUS_TONE: Record<string, 'accent' | 'edge' | 'info' | 'muted'> = {
  M: 'info',
  A: 'accent',
  D: 'edge',
  R: 'info',
  '?': 'muted',
  '!': 'muted',
};
const STATUS_KEY: Record<string, string> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  '?': 'untracked',
  '!': 'ignored',
};

function statusTone(code: string): { tone: 'accent' | 'edge' | 'info' | 'muted'; key: string } {
  const k = code.trim().charAt(0);
  return { tone: STATUS_TONE[k] ?? 'muted', key: STATUS_KEY[k] ?? '' };
}

export function GitStatusOverlay() {
  const open = useUiStore((s) => s.overlays.gitStatus?.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useT('git');
  const tc = useT('common');

  const refresh = async () => {
    setLoading(true);
    try {
      const cwd = getWorkspaceRoot() || undefined;
      setStatus(await getGitStatus(cwd));
    } catch (e) {
      toast.error(t('errors.gitFailed', { message: (e as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void refresh();
  }, [open]);

  return (
    <OverlayPanel
      open={!!open}
      onOpenChange={(o) => (o ? null : close('gitStatus'))}
      title={t('title')}
      subtitle={t('subtitle')}
      width={620}
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {status?.available ? (
              <>
                {t('branch')} <span className="font-mono text-ink-1">{status.branch}</span>
                {status.ahead || status.behind ? (
                  <>
                    {' · '}
                    <Chip tone="accent" size="xs">{t('ahead', { count: status.ahead })}</Chip>
                    <Chip tone="edge" size="xs">{t('behind', { count: status.behind })}</Chip>
                  </>
                ) : null}
              </>
            ) : (
              <>{t('shellUnavailable')}</>
            )}
          </span>
          <Button size="xs" tone="ghost" onClick={refresh} disabled={loading}>
            {tc('actions.refresh')}
          </Button>
        </>
      }
    >
      <ScrollArea className="h-[380px]">
        {!status ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">{t('loading')}</div>
        ) : !status.available ? (
          <div className="space-y-2 px-3 py-3 text-xs text-ink-3">
            <div className="font-mono text-ink-2">{status.reason}</div>
            <div>{t('shellUnavailableLong')}</div>
          </div>
        ) : status.files.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            {t('clean')}
          </div>
        ) : (
          <div className="divide-y divide-line/70">
            {status.files.map((f) => {
              const st = statusTone(f.status);
              return (
                <div key={f.path} className="flex items-center gap-2 px-3 py-1 text-xs">
                  <span className="w-12 font-mono text-[10px] text-ink-3">{f.status}</span>
                  <Chip tone={st.tone} size="xs">
                    {st.key ? t(`status.${st.key}`) : f.status.trim() || '·'}
                  </Chip>
                  <span className="flex-1 truncate font-mono text-ink-1" title={f.path}>
                    {f.path}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </OverlayPanel>
  );
}
