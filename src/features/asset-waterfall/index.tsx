import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  ROUTE_DATA,
  lcpAttribution,
  totalsFor,
  type Asset,
  type AssetKind,
  type AssetRoute,
} from './helpers';
import { WaterfallToolbar } from './parts/waterfall-toolbar';
import { WaterfallTrack } from './parts/waterfall-track';
import { AssetDetail } from './parts/asset-detail';

export function AssetWaterfallOverlay() {
  const open = useUiStore((s) => s.overlays.assetWaterfall.open);
  const routeIdFromStore = useUiStore((s) => s.overlays.assetWaterfall.routeId);
  const close = useUiStore((s) => s.closeOverlay);

  const initialRoute = routeIdFromStore ?? '/';
  const [routeId, setRouteId] = useState<string>(initialRoute);
  const [activeKinds, setActiveKinds] = useState<ReadonlyArray<AssetKind>>([]);
  const [blockingOnly, setBlockingOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const route: AssetRoute =
    ROUTE_DATA.find((r) => r.routeId === routeId) ?? ROUTE_DATA[0]!;

  const filtered = useMemo<ReadonlyArray<Asset>>(() => {
    return [...route.assets]
      .filter((a) => {
        if (activeKinds.length > 0 && !activeKinds.includes(a.kind))
          return false;
        if (blockingOnly && !a.blocking) return false;
        return true;
      })
      .sort((a, b) => a.startMs - b.startMs);
  }, [route, activeKinds, blockingOnly]);

  const totals = totalsFor(route);
  const lcp = lcpAttribution(route);
  const selected = useMemo<Asset | undefined>(() => {
    return route.assets.find((a) => a.id === selectedId);
  }, [route, selectedId]);

  const duration = useMemo(() => {
    let max = route.ttiMs;
    for (const a of route.assets) {
      max = Math.max(max, a.startMs + a.ttfbMs + a.downloadMs);
    }
    return max + 30;
  }, [route]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('assetWaterfall')}
      title="Asset Waterfall"
      subtitle="annotated per-route asset timeline"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">total:</span>{' '}
              <span className="font-mono text-ink-1">
                {totals.totalKb.toFixed(0)}KB
              </span>
            </span>
            <span>
              <span className="text-ink-2">assets:</span>{' '}
              <span className="font-mono text-ink-1">
                {route.assets.length}
              </span>
            </span>
            <span>
              <span className="text-ink-2">blocking:</span>{' '}
              <span
                className={cn(
                  'font-mono',
                  totals.blocking > 3 ? 'text-sev-err' : 'text-ink-1',
                )}
              >
                {totals.blocking}
              </span>
            </span>
            {lcp ? (
              <Chip tone="warn" size="xs" title={lcp.url}>
                LCP: {lcp.url.slice(-32)}
              </Chip>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="accent"
              onClick={() => toast('Optimization plan generated (mock)')}
            >
              Generate optimization plan
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('assetWaterfall')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <WaterfallToolbar
        routeId={routeId}
        activeKinds={activeKinds}
        blockingOnly={blockingOnly}
        onChangeRoute={(id) => {
          setRouteId(id);
          setSelectedId(null);
        }}
        onToggleKind={(k) =>
          setActiveKinds((p) =>
            p.includes(k) ? p.filter((x) => x !== k) : [...p, k],
          )
        }
        onToggleBlocking={setBlockingOnly}
      />

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px' }}>
        <div className="hairline-r p-3">
          <WaterfallTrack
            route={route}
            filtered={filtered}
            duration={duration}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <AssetDetail selected={selected} route={route} />
      </div>
    </OverlayPanel>
  );
}
