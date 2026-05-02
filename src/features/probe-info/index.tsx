import { useUiStore } from '@entities/ui-shell';
import { useLastTraceStore } from '@entities/rsc-payload';
import { useT } from '@shared/i18n';
import { Button, Chip, OverlayPanel } from '@shared/ui';

/**
 * Quanta Probe — explanatory overlay.
 *
 * One-time orientation panel describing what the Probe is, what it captures,
 * and where the data shows up across the IDE. Triggered from the status-bar
 * Probe chip's context (or via command palette in the future).
 */
export function ProbeInfoOverlay() {
  const open = useUiStore((s) => s.overlays.probeInfo.open);
  const close = useUiStore((s) => s.closeOverlay);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const totalBytes = useLastTraceStore((s) => s.totalBytes);
  const active = !!url && chunks.length > 0;
  const t = useT('probe');
  const tc = useT('common');

  const whereItems = t('where.items') as unknown as string[] | string;
  const items = Array.isArray(whereItems) ? whereItems : [];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('probeInfo'))}
      title={t('title')}
      subtitle={t('subtitle')}
      width={680}
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">{t('footer.version')}</span>
          <Button size="xs" tone="ghost" onClick={() => close('probeInfo')}>
            {tc('actions.close')}
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => {
              close('probeInfo');
              openOverlay('rscPayloadStep');
            }}
          >
            {t('footer.openRsc')}
          </Button>
        </>
      }
    >
      <div className="space-y-4 px-4 py-3 text-[12px] leading-relaxed text-ink-1">
        <section className="flex items-center gap-2">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${active ? 'bg-accent' : 'bg-ink-3'}`}
          />
          <span className="text-[10px] uppercase tracking-caps text-ink-3">
            {t('currentStatus')}
          </span>
          {active ? (
            <>
              <Chip tone="accent" size="xs">{t('active')}</Chip>
              <span className="font-mono text-ink-2">{url}</span>
              <span className="text-ink-3">
                {t('captured', { count: chunks.length, bytes: totalBytes })}
              </span>
            </>
          ) : (
            <>
              <Chip tone="muted" size="xs">{t('idle')}</Chip>
              <span className="text-ink-3">{t('noTrace')}</span>
            </>
          )}
        </section>

        <section>
          <h3 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            {t('whatIs.heading')}
          </h3>
          <p>{t('whatIs.body')}</p>
        </section>

        <section>
          <h3 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            {t('howTo.heading')}
          </h3>
          <ol className="ml-4 list-decimal space-y-1 text-ink-2">
            <li>{t('howTo.step1')}</li>
            <li>{t('howTo.step2')}</li>
            <li>{t('howTo.step3')}</li>
          </ol>
        </section>

        <section>
          <h3 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            {t('where.heading')}
          </h3>
          <ul className="grid grid-cols-2 gap-1 text-ink-2">
            {items.map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            {t('roadmap.heading')}
          </h3>
          <ul className="ml-4 list-disc space-y-0.5 text-ink-2">
            <li>
              <Chip tone="info" size="xs">{t('roadmap.soon')}</Chip>{' '}
              {t('roadmap.autoAttach')}
            </li>
            <li>
              <Chip tone="muted" size="xs">{t('roadmap.later')}</Chip>{' '}
              {t('roadmap.ws')}
            </li>
            <li>
              <Chip tone="muted" size="xs">{t('roadmap.later')}</Chip>{' '}
              {t('roadmap.ci')}
            </li>
          </ul>
        </section>
      </div>
    </OverlayPanel>
  );
}
