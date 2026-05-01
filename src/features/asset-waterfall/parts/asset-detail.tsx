import { Chip } from '@shared/ui';
import {
  kindTone,
  totalsFor,
  type Asset,
  type AssetRoute,
} from '../helpers';

interface AssetDetailProps {
  selected: Asset | undefined;
  route: AssetRoute;
}

export function AssetDetail({ selected, route }: AssetDetailProps): JSX.Element {
  const totals = totalsFor(route);
  return (
    <aside className="p-3">
      <div className="rounded-sm border border-line bg-bg">
        <div className="flex h-7 items-center hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
          selected asset
        </div>
        <div className="p-3">
          {selected ? (
            <>
              <div className="flex items-center gap-1.5">
                <Chip tone={kindTone(selected.kind)} size="xs">
                  {selected.kind}
                </Chip>
                {selected.blocking ? (
                  <Chip tone="err" size="xs">
                    blocking
                  </Chip>
                ) : null}
                <Chip
                  tone={selected.priority === 'high' ? 'warn' : 'muted'}
                  size="xs"
                >
                  {selected.priority}
                </Chip>
                <Chip
                  tone={
                    selected.origin === '3p'
                      ? 'warn'
                      : selected.origin === 'cdn'
                        ? 'info'
                        : 'static'
                  }
                  size="xs"
                >
                  {selected.origin}
                </Chip>
              </div>
              <p
                className="mt-2 break-all font-mono text-[11px] text-ink-1"
                title={selected.url}
              >
                {selected.url}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-y-0.5 text-[11px]">
                <dt className="text-ink-3">size</dt>
                <dd className="font-mono text-ink-1">
                  {selected.sizeKb.toFixed(1)}KB
                </dd>
                <dt className="text-ink-3">ttfb</dt>
                <dd className="font-mono text-ink-1">
                  {selected.ttfbMs}ms
                </dd>
                <dt className="text-ink-3">download</dt>
                <dd className="font-mono text-ink-1">
                  {selected.downloadMs}ms
                </dd>
                <dt className="text-ink-3">start</dt>
                <dd className="font-mono text-ink-1">
                  {selected.startMs}ms
                </dd>
                <dt className="text-ink-3">cached</dt>
                <dd className="font-mono text-ink-1">
                  {selected.cached ? 'yes' : 'no'}
                </dd>
              </dl>
              {selected.suggestion ? (
                <div className="mt-2 inline-flex">
                  <Chip tone="hint" size="sm">
                    suggest: {selected.suggestion}
                  </Chip>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-[11px] text-ink-3">
              Click a row in the waterfall to inspect.
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 rounded-sm border border-line bg-bg p-2">
        <h4 className="text-[10px] uppercase tracking-caps text-ink-3">
          route summary
        </h4>
        <dl className="mt-1 grid grid-cols-2 gap-y-0.5 text-[11px]">
          <dt className="text-ink-3">FCP</dt>
          <dd className="font-mono text-ink-1">{route.fcpMs}ms</dd>
          <dt className="text-ink-3">LCP</dt>
          <dd className="font-mono text-ink-1">{route.lcpMs}ms</dd>
          <dt className="text-ink-3">TTI</dt>
          <dd className="font-mono text-ink-1">{route.ttiMs}ms</dd>
          <dt className="text-ink-3">3p assets</dt>
          <dd className="font-mono text-ink-1">{totals.thirdParty}</dd>
        </dl>
      </div>
    </aside>
  );
}
