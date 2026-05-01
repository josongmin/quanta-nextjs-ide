import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { getGitStatus, type GitStatus } from '@entities/git';
import { getWorkspaceRoot } from '@shared/runner';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';

const STATUS_LABEL: Record<string, { label: string; tone: 'accent' | 'edge' | 'info' | 'muted' }> = {
  M: { label: 'modified', tone: 'info' },
  A: { label: 'added', tone: 'accent' },
  D: { label: 'deleted', tone: 'edge' },
  R: { label: 'renamed', tone: 'info' },
  '?': { label: 'untracked', tone: 'muted' },
  '!': { label: 'ignored', tone: 'muted' },
};

function tone(code: string): { label: string; tone: 'accent' | 'edge' | 'info' | 'muted' } {
  const key = code.trim().charAt(0);
  return STATUS_LABEL[key] ?? { label: code.trim() || '·', tone: 'muted' };
}

export function GitStatusOverlay() {
  const open = useUiStore((s) => s.overlays.gitStatus?.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      // Run git inside the user's open workspace, not the IDE's cwd.
      const cwd = getWorkspaceRoot() || undefined;
      setStatus(await getGitStatus(cwd));
    } catch (e) {
      toast.error(`git failed: ${(e as Error).message}`);
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
      title="Git status"
      subtitle="via shell bridge"
      width={620}
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {status?.available ? (
              <>
                branch <span className="font-mono text-ink-1">{status.branch}</span>
                {status.ahead || status.behind ? (
                  <>
                    {' · '}
                    <Chip tone="accent" size="xs">↑{status.ahead}</Chip>
                    <Chip tone="edge" size="xs">↓{status.behind}</Chip>
                  </>
                ) : null}
              </>
            ) : (
              <>shell unavailable — Tauri build needed</>
            )}
          </span>
          <Button size="xs" tone="ghost" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </>
      }
    >
      <ScrollArea className="h-[380px]">
        {!status ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">Loading…</div>
        ) : !status.available ? (
          <div className="space-y-2 px-3 py-3 text-xs text-ink-3">
            <div className="font-mono text-ink-2">{status.reason}</div>
            <div>
              In a browser the IDE has no shell access. The Tauri build (Phase
              14b) injects a shell bridge that runs <span className="font-mono">git status</span>{' '}
              against the open project.
            </div>
          </div>
        ) : status.files.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            Working tree clean — nothing to commit.
          </div>
        ) : (
          <div className="divide-y divide-line/70">
            {status.files.map((f) => {
              const t = tone(f.status);
              return (
                <div key={f.path} className="flex items-center gap-2 px-3 py-1 text-xs">
                  <span className="w-12 font-mono text-[10px] text-ink-3">{f.status}</span>
                  <Chip tone={t.tone} size="xs">{t.label}</Chip>
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
