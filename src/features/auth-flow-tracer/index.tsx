import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import {
  Database,
  Key,
  Lock,
  Network,
  RotateCw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import {
  Button,
  Chip,
  OverlayPanel,
  SeverityDot,
} from '@shared/ui';
import { KvRow, StateIcon } from '@widgets/right-panel/parts';
import { cn } from '@shared/lib/cn';
import { findFlow, flows, type AuthHop } from './helpers';

function HopIcon({ kind, className }: { kind: AuthHop['kind']; className?: string }) {
  const Cmp = match(kind)
    .with('cookie', () => Lock)
    .with('jwt-decode', () => Key)
    .with('db', () => Database)
    .with('cache', () => RotateCw)
    .with('middleware', () => Shield)
    .with('redirect', () => Network)
    .with('render', () => Sparkles)
    .exhaustive();
  return <Cmp className={cn('h-3.5 w-3.5', className)} />;
}

function hopTone(hop: AuthHop): 'static' | 'warn' | 'err' | 'info' | 'muted' {
  if (!hop.safe) return 'err';
  return match(hop.kind)
    .with('cookie', () => 'info' as const)
    .with('jwt-decode', () => 'info' as const)
    .with('db', () => 'isr' as const)
    .with('cache', () => 'static' as const)
    .with('middleware', () => 'warn' as const)
    .with('redirect', () => 'muted' as const)
    .with('render', () => 'static' as const)
    .exhaustive() as 'static' | 'warn' | 'err' | 'info' | 'muted';
}

export function AuthFlowTracerOverlay() {
  const open = useUiStore((s) => s.overlays.authFlowTracer.open);
  const requestedRouteId = useUiStore((s) => s.overlays.authFlowTracer.routeId);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);

  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const effectiveRouteId =
    activeRouteId ?? requestedRouteId ?? flows[0]?.routeId;

  const flow = useMemo(() => findFlow(effectiveRouteId), [effectiveRouteId]);
  const totalMs = useMemo(
    () => flow.hops.reduce((acc, h) => acc + h.ms, 0),
    [flow],
  );

  const tracedRouteIds = useMemo(
    () => new Set(flows.map((f) => f.routeId)),
    [],
  );
  const tracedRoutes = useMemo(
    () =>
      routes
        .filter((r) => tracedRouteIds.has(r.id))
        .sort((a, b) => a.path.localeCompare(b.path)),
    [routes, tracedRouteIds],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('authFlowTracer'))}
      title="Auth Flow"
      subtitle="cookie · session · user · render"
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast(`Open ${flow.routePath}`)}
          >
            Open route
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => toast('Show as semantic diff (preview)')}
          >
            Show as semantic diff
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Route</span>
        <select
          value={flow.routeId}
          onChange={(e) => setActiveRouteId(e.target.value)}
          className="h-6 rounded-sm border border-line bg-bg px-1.5 font-mono text-[11px] text-ink-1"
        >
          {tracedRoutes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.path}
            </option>
          ))}
        </select>
        <Chip tone="muted" size="xs">
          {flow.archetype}
        </Chip>
        <span className="ml-auto text-[10px] text-ink-3">
          {flow.hops.length} hops · ~{totalMs}ms
        </span>
      </div>

      <div className="grid grid-cols-[1fr_260px] divide-x divide-line">
        {/* Timeline */}
        <div className="relative px-4 py-3">
          <div className="relative">
            <div className="absolute bottom-1 left-[15px] top-1 w-px bg-line" aria-hidden />
            <ol className="relative space-y-2">
              {flow.hops.map((hop, idx) => (
                <li key={hop.id} className="relative grid grid-cols-[32px_1fr] items-start gap-2">
                  <div
                    className={cn(
                      'relative z-10 mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-bg',
                      hop.safe ? 'border-line text-ink-2' : 'border-sev-err/40 text-sev-err',
                    )}
                    title={hop.kind}
                  >
                    <HopIcon kind={hop.kind} />
                  </div>
                  <div
                    className={cn(
                      'rounded-sm border bg-bg p-2 text-xs',
                      hop.safe ? 'border-line' : 'border-sev-err/40 bg-sev-err-soft/30',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-caps text-ink-3">
                          {idx + 1}
                        </span>
                        <Chip tone={hopTone(hop)} size="xs">
                          {hop.kind}
                        </Chip>
                        <span className="truncate font-mono text-ink-1">{hop.label}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="font-mono text-[10px] text-ink-3">
                          {hop.ms}ms
                        </span>
                        <StateIcon state={hop.safe ? 'ok' : 'warn'} />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-3">
                      <span className="font-mono">
                        {hop.file}:{hop.line}
                      </span>
                      {hop.note ? (
                        <span className="italic text-ink-3">— {hop.note}</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Side panel */}
        <aside className="px-3 py-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">Cookie</div>
          <div className="mt-1.5">
            <KvRow label="httpOnly">
              <span className="inline-flex items-center gap-1">
                <StateIcon state={flow.cookieFlags.httpOnly ? 'ok' : 'missing'} />
                {String(flow.cookieFlags.httpOnly)}
              </span>
            </KvRow>
            <KvRow label="secure">
              <span className="inline-flex items-center gap-1">
                <StateIcon state={flow.cookieFlags.secure ? 'ok' : 'missing'} />
                {String(flow.cookieFlags.secure)}
              </span>
            </KvRow>
            <KvRow label="sameSite">
              <span className="inline-flex items-center gap-1">
                <StateIcon
                  state={flow.cookieFlags.sameSite === 'none' ? 'warn' : 'ok'}
                />
                <span className="font-mono">{flow.cookieFlags.sameSite}</span>
              </span>
            </KvRow>
          </div>

          <div className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">
            CSRF / Session
          </div>
          <div className="mt-1.5">
            <KvRow label="CSRF">
              <span className="inline-flex items-center gap-1">
                <StateIcon state={flow.csrfOK ? 'ok' : 'missing'} />
                {flow.csrfOK ? 'token validated' : 'unchecked'}
              </span>
            </KvRow>
            <KvRow label="refresh">
              <span className="inline-flex items-center gap-1">
                <StateIcon state={flow.sessionRefreshOK ? 'ok' : 'partial'} />
                {flow.sessionStrategy}
              </span>
            </KvRow>
          </div>

          <div className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">
            Weaknesses
          </div>
          {flow.weaknesses.length === 0 ? (
            <div className="mt-1 rounded-sm border border-line bg-bg-subtle px-2 py-1.5 text-[11px] text-ink-3">
              No issues found in this flow.
            </div>
          ) : (
            <ul className="mt-1 space-y-1">
              {flow.weaknesses.map((w) => (
                <li
                  key={w.id}
                  className="flex items-start gap-1.5 rounded-sm border border-line bg-bg px-2 py-1 text-[11px] text-ink-1"
                >
                  <SeverityDot severity={w.severity} className="mt-1" />
                  <span className="min-w-0">{w.label}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
