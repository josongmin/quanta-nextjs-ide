import { useMemo } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { useLastTraceStore } from '@entities/rsc-payload';
import { useCodeGraphStore } from '@entities/code-graph';
import { runAllPlugins, listPlugins } from '@shared/plugins';
import { useT } from '@shared/i18n';
import { Chip, OverlayPanel, ScrollArea } from '@shared/ui';

/**
 * Plugin findings overlay.
 *
 * Runs every registered Quanta plugin (built-in + user) against the current
 * Probe + AST snapshot and lists their findings.
 */
export function PluginFindingsOverlay() {
  const open = useUiStore((s) => s.overlays.pluginFindings?.open);
  const close = useUiStore((s) => s.closeOverlay);
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const files = useCodeGraphStore((s) => s.files);
  const plugins = listPlugins();
  const findings = useMemo(
    () => runAllPlugins({ url, chunks, files }),
    [url, chunks, files],
  );
  const t = useT('plugins');

  return (
    <OverlayPanel
      open={!!open}
      onOpenChange={(o) => (o ? null : close('pluginFindings'))}
      title={t('title')}
      subtitle={t('subtitle', { plugins: plugins.length, findings: findings.length })}
      width={680}
    >
      <div className="hairline-b bg-bg-subtle px-3 py-2 text-[11px] text-ink-3">
        {t('registered', { list: plugins.map((p) => p.id).join(', ') || t('none') })}
      </div>
      <ScrollArea className="h-[420px]">
        {findings.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            {t('empty')}
          </div>
        ) : (
          <div className="divide-y divide-line/70">
            {findings.map((f, i) => (
              <div key={`${f.ruleId}_${i}`} className="flex items-start gap-2 px-3 py-2 text-xs">
                <Chip
                  tone={
                    f.severity === 'err'
                      ? 'edge'
                      : f.severity === 'warn'
                        ? 'info'
                        : 'muted'
                  }
                  size="xs"
                >
                  {t(`severity.${f.severity}`)}
                </Chip>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-ink-1">{f.ruleId}</div>
                  <div className="text-ink-2">{f.message}</div>
                  {f.file ? (
                    <div className="font-mono text-[10px] text-ink-3">{f.file}</div>
                  ) : null}
                  {f.chunkId ? (
                    <div className="font-mono text-[10px] text-ink-3">chunk {f.chunkId}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </OverlayPanel>
  );
}
