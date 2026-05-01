import { toast } from 'sonner';
import { useBoundaryStore } from '@entities/boundary';
import { Button, Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { RscTraceSection } from '../parts/rsc-trace-section';

interface CapProps {
  ok: boolean;
  label: string;
}
function Capability({ ok, label }: CapProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px]',
        ok
          ? 'border-sem-static/30 bg-white text-sem-static'
          : 'border-line bg-bg-subtle text-ink-3',
      )}
    >
      <span>{label}</span>
      <span className={cn('font-bold', ok ? 'text-sem-static' : 'text-ink-3')}>
        {ok ? '✓' : '✗'}
      </span>
    </div>
  );
}

export function MidTab() {
  const m = useBoundaryStore((s) => s.middleware);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <span className="text-[10px] tracking-caps text-ink-3">MIDDLEWARE</span>
        <span className="ml-auto text-[10px] text-ink-3">
          {m.warnings.length} warning{m.warnings.length === 1 ? '' : 's'}
        </span>
      </TabHeader>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="hairline-b px-2 py-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Icon.Net className="h-3.5 w-3.5 text-ink-3" />
            <span className="font-mono text-ink-1">{m.file}</span>
            <Chip tone={m.runtime === 'edge' ? 'edge' : 'muted'} size="xs" className="ml-auto">
              {m.runtime}
            </Chip>
          </div>
        </div>

        <div className="hairline-b px-2 py-2">
          <div className="text-[10px] tracking-caps text-ink-3">MATCHER</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {m.matcher.length === 0 ? (
              <span className="text-xs text-ink-3">— none —</span>
            ) : (
              m.matcher.map((p) => (
                <Chip key={p} tone="muted" size="xs" className="font-mono">
                  {p}
                </Chip>
              ))
            )}
            {m.matchesAllRoutes && (
              <Chip tone="warn" size="xs">
                ⚠ matches all routes
              </Chip>
            )}
            {m.matchesStaticAssets && (
              <Chip tone="warn" size="xs">
                ⚠ matches /_next/static/*
              </Chip>
            )}
          </div>
        </div>

        <div className="hairline-b px-2 py-2">
          <div className="text-[10px] tracking-caps text-ink-3">CAPABILITIES</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Capability ok={m.usesAuthCheck} label="auth" />
            <Capability ok={m.usesRedirect} label="redirect" />
            <Capability ok={m.usesDb} label="db" />
          </div>
        </div>

        <div className="px-2 py-2">
          <div className="text-[10px] tracking-caps text-ink-3">WARNINGS</div>
          {m.warnings.length === 0 ? (
            <div className="mt-1 text-xs text-ink-3">— none —</div>
          ) : (
            <ul className="mt-1 flex flex-col gap-1">
              {m.warnings.map((w, i) => (
                <li
                  key={i}
                  className="group flex items-start gap-1.5 rounded-sm border border-line/50 bg-bg p-1.5 text-xs hover:bg-bg-hover"
                >
                  <span
                    aria-hidden
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sev-warn"
                  />
                  <span className="flex-1 text-ink-2">
                    <span className="text-sev-warn">⚠ </span>
                    {w}
                  </span>
                  <Button
                    tone="ghost"
                    size="xs"
                    onClick={() =>
                      toast('Open in editor', { description: `${m.file} · ${w.slice(0, 40)}` })
                    }
                  >
                    view
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <RscTraceSection mode="mid" />
      </div>
    </div>
  );
}
