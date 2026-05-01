import { useUiStore } from '@entities/ui-shell';
import { useLastTraceStore } from '@entities/rsc-payload';
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

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('probeInfo'))}
      title="Quanta Probe"
      subtitle="Real RSC stream capture, parser, and cross-surface fan-out"
      width={680}
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            v0 · pre-plugin · external fetch only
          </span>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => close('probeInfo')}
          >
            Close
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => {
              close('probeInfo');
              openOverlay('rscPayloadStep');
            }}
          >
            Open RSC payload step →
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
            current status
          </span>
          {active ? (
            <>
              <Chip tone="accent" size="xs">active</Chip>
              <span className="font-mono text-ink-2">{url}</span>
              <span className="text-ink-3">
                {chunks.length} chunks · {totalBytes}B
              </span>
            </>
          ) : (
            <>
              <Chip tone="muted" size="xs">idle</Chip>
              <span className="text-ink-3">No RSC trace captured yet.</span>
            </>
          )}
        </section>

        <section>
          <h3 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            What is Probe?
          </h3>
          <p>
            Probe is the RSC capture system inside the IDE. It fetches a
            Next.js route's React Flight payload, parses each chunk, and shares
            the analysis with every panel that knows how to read it — without
            you opening 6 different overlays.
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            How to capture
          </h3>
          <ol className="ml-4 list-decimal space-y-1 text-ink-2">
            <li>
              Open <span className="font-mono text-ink-1">RSC payload step</span> overlay
            </li>
            <li>
              Switch to <span className="font-mono text-ink-1">Live</span>, paste a route URL (e.g. <span className="font-mono text-ink-1">/__rsc/products/walnut-table</span>)
            </li>
            <li>
              Click <span className="font-mono text-ink-1">Fetch</span> — every surface listed below updates automatically
            </li>
          </ol>
        </section>

        <section>
          <h3 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            Where Probe data appears
          </h3>
          <ul className="grid grid-cols-2 gap-1 text-ink-2">
            <li>· RSC payload step (Live, Waterfall, Boundaries)</li>
            <li>· Snapshots + Diff (capture &amp; compare)</li>
            <li>· Routes tab (probe banner)</li>
            <li>· Islands tab (real client modules)</li>
            <li>· Bundle &amp; Vitals → RSC view</li>
            <li>· Server-only tracker (banner)</li>
            <li>· Cache lineage (banner)</li>
            <li>· Streaming visualizer (banner)</li>
            <li>· Problems (client-leak diagnostic)</li>
            <li>· Status bar (Probe chip)</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            What's next (roadmap)
          </h3>
          <ul className="ml-4 list-disc space-y-0.5 text-ink-2">
            <li>
              <Chip tone="info" size="xs">soon</Chip>{' '}
              Auto-attach loader so the IDE injects Probe into your{' '}
              <span className="font-mono text-ink-1">next dev</span> process
              automatically
            </li>
            <li>
              <Chip tone="muted" size="xs">later</Chip>{' '}
              WebSocket push: capture every page navigation in real time, with
              source maps
            </li>
            <li>
              <Chip tone="muted" size="xs">later</Chip>{' '}
              CI mode: batch-capture all routes, post bundle delta to PR
            </li>
          </ul>
        </section>
      </div>
    </OverlayPanel>
  );
}
