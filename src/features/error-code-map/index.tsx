import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useRouteStore } from '@entities/route';
import { Button, Chip, EmptyState, Icon, OverlayPanel } from '@shared/ui';
import { enrichFrame, type EnrichedFrame } from './enricher';
import { resolveFrame } from './sourcemap';
import { useErrorMapStore } from './store';
import { IncidentCard } from './incident-card';

const SAMPLE_TESTS = [
  { file: 'src/lib/__tests__/cart.test.ts', deps: ['src/lib/cart.ts'] },
  {
    file: 'src/components/__tests__/product-card.test.tsx',
    deps: ['src/components/ProductCard.tsx', 'src/utils/format.ts'],
  },
  {
    file: 'src/server/__tests__/checkout.test.ts',
    deps: ['src/server/checkout.ts', 'src/components/CheckoutForm.tsx'],
  },
];

const tabId = (file: string): string => `error-code-map-${file}`;
const shortLabel = (file: string): string => {
  const segs = file.split('/');
  return segs[segs.length - 1] ?? file;
};

export function ErrorCodeMapOverlay() {
  const open = useUiStore((s) => s.overlays.errorCodeMap.open);
  const close = useUiStore((s) => s.closeOverlay);
  const incidents = useErrorMapStore((s) => s.incidents);
  const addIncident = useErrorMapStore((s) => s.add);
  const removeIncident = useErrorMapStore((s) => s.remove);
  const clear = useErrorMapStore((s) => s.clear);
  const routes = useRouteStore((s) => s.routes);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const openTab = useEditorStore((s) => s.openTab);

  const [pasteText, setPasteText] = useState('');

  // No source-map registry connected yet — feature works on raw paths.
  const registry = useMemo(() => new Map(), []);

  const enrichedById = useMemo(() => {
    const m = new Map<string, ReadonlyArray<EnrichedFrame>>();
    for (const inc of incidents) {
      const frames = inc.parsed.frames.map((rf) => {
        const resolved = resolveFrame(
          {
            file: rf.file,
            line: rf.line,
            ...(rf.column !== undefined ? { column: rf.column } : {}),
          },
          registry,
        );
        return enrichFrame(
          {
            ...resolved,
            ...(rf.fn !== undefined ? { fn: rf.fn } : {}),
            synthetic: rf.synthetic,
          },
          { routes, diagnostics, tests: SAMPLE_TESTS },
        );
      });
      m.set(inc.id, frames);
    }
    return m;
  }, [incidents, routes, diagnostics, registry]);

  const totals = useMemo(() => {
    let app = 0;
    let mapped = 0;
    let total = 0;
    for (const frames of enrichedById.values()) {
      for (const f of frames) {
        total += 1;
        if (!f.synthetic) app += 1;
        if (f.mapped) mapped += 1;
      }
    }
    return { app, mapped, total };
  }, [enrichedById]);

  const handleAdd = () => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      toast.error('Paste a stack trace first');
      return;
    }
    addIncident(trimmed);
    setPasteText('');
    toast.success('Incident parsed');
  };

  const handleJump = (file: string, line: number) => {
    openTab({
      id: tabId(file),
      file,
      label: shortLabel(file),
    });
    toast(`Open ${shortLabel(file)}:${line}`);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('errorCodeMap'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Alert className="h-4 w-4 text-sev-err" />
          <span>Error → Code Map</span>
        </span>
      }
      subtitle="paste stack traces · resolve frames · jump to source"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span>
            incidents: <span className="font-mono text-ink-1">{incidents.length}</span>
          </span>
          <span>
            app frames: <span className="font-mono text-ink-1">{totals.app}</span>
          </span>
          <span>
            mapped:{' '}
            <span className="font-mono text-sem-isr">{totals.mapped}</span> /{' '}
            <span className="font-mono">{totals.total}</span>
          </span>
          <span className="ml-auto">
            <Button size="xs" tone="ghost" onClick={() => clear()}>
              Clear all
            </Button>
          </span>
        </span>
      }
    >
      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="max-h-[480px] overflow-y-auto">
          {incidents.length === 0 ? (
            <EmptyState
              icon={<Icon.Alert className="h-5 w-5 text-ink-3" />}
              title="No incidents yet"
              description="Paste a production error stack trace on the right to start."
            />
          ) : (
            <div>
              {incidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  frames={enrichedById.get(inc.id) ?? []}
                  onJump={handleJump}
                  onRemove={removeIncident}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 p-3">
          <div className="text-caps text-ink-3">paste stack</div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={
              'TypeError: Cannot read properties of undefined…\n    at Comp (file:line:col)'
            }
            className="h-48 resize-none rounded-sm border border-line bg-bg p-2 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" tone="accent" onClick={handleAdd}>
              Parse incident
            </Button>
            <Button
              size="sm"
              tone="ghost"
              onClick={() => setPasteText('')}
              disabled={!pasteText}
            >
              Reset
            </Button>
          </div>
          <div className="mt-2 rounded-sm border border-line bg-bg-subtle/40 p-2 text-[11px] text-ink-3">
            <div className="text-caps mb-1">tips</div>
            <ul className="space-y-0.5">
              <li>· V8 / Node / Next.js bundle frames are auto-detected.</li>
              <li>· Synthetic frames (webpack-internal, native) are dimmed.</li>
              <li>· Click an app frame to open its source.</li>
            </ul>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Chip tone="isr" size="xs">
              ◆ source-mapped
            </Chip>
            <Chip tone="warn" size="xs">
              ◇ unmapped
            </Chip>
            <Chip tone="muted" size="xs">
              · synthetic
            </Chip>
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}
