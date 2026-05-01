import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  LINKS,
  ROUTES,
  errorLabel,
  errorTone,
  uniqueSourceFiles,
  type LinkUsage,
} from './helpers';

const SVG_W = 760;
const SVG_H = 460;
const ROUTE_X = SVG_W / 2;
const FILE_X = 40;

export function TypedRoutingGraphOverlay() {
  const open = useUiStore((s) => s.overlays.typedRoutingGraph.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [fileFilter, setFileFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(LINKS[0]?.id ?? null);

  const sourceFiles = useMemo(() => uniqueSourceFiles(), []);

  const fileOptions = useMemo(() => {
    return [
      { value: 'all' as const, label: 'all files' },
      ...sourceFiles.map((f) => ({ value: f, label: f })),
    ];
  }, [sourceFiles]);

  const filteredLinks = useMemo<ReadonlyArray<LinkUsage>>(() => {
    return LINKS.filter((l) => {
      if (errorsOnly && !l.errorKind) return false;
      if (fileFilter !== 'all' && l.sourceFile !== fileFilter) return false;
      return true;
    });
  }, [errorsOnly, fileFilter]);

  const selected = useMemo(
    () => LINKS.find((l) => l.id === selectedId),
    [selectedId],
  );

  const fileLayout = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    sourceFiles.forEach((f, i) => {
      const y = 30 + i * ((SVG_H - 60) / Math.max(1, sourceFiles.length - 1));
      m.set(f, { x: FILE_X, y });
    });
    return m;
  }, [sourceFiles]);

  const routeLayout = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    const radius = 130;
    const cx = ROUTE_X + 80;
    const cy = SVG_H / 2;
    ROUTES.forEach((r, i) => {
      const angle = (i / ROUTES.length) * Math.PI * 2 - Math.PI / 2;
      m.set(r.id, {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    });
    return m;
  }, []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('typedRoutingGraph'))}
      title="Typed routing graph"
      subtitle={`${LINKS.length} <Link> usages · ${LINKS.filter((l) => l.errorKind).length} type errors`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Generated routes manifest (mock)')}>
            Generate manifest
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Opened type checker (mock)')}>
            Open type checker
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast('Auto-fixed all errors (mock)')}>
            Fix all
          </Button>
        </>
      }
    >
      <PanelHeader>
        <SelectControl
          label="file"
          value={fileFilter}
          options={fileOptions}
          onChange={setFileFilter}
        />
        <span className="ml-auto" />
        <ToggleChip active={errorsOnly} onClick={() => setErrorsOnly((v) => !v)}>
          errors only
        </ToggleChip>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="flex h-[540px] flex-col">
          <div className="hairline-b">
            <div className="px-3 py-2 text-[10px] uppercase tracking-caps text-ink-3">
              Source files → routes
            </div>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block w-full" style={{ height: 320 }}>
              {/* edges */}
              {filteredLinks.map((l) => {
                const src = fileLayout.get(l.sourceFile);
                const dst = routeLayout.get(l.routeId);
                if (!src || !dst) return null;
                const isErr = !!l.errorKind;
                const isSel = l.id === selectedId;
                return (
                  <line
                    key={l.id}
                    x1={src.x + 90}
                    y1={src.y}
                    x2={dst.x}
                    y2={dst.y}
                    className={cn(
                      isErr ? 'stroke-sev-err' : 'stroke-line',
                      isSel && 'stroke-accent',
                    )}
                    strokeWidth={isSel ? 1.5 : 0.75}
                    onClick={() => setSelectedId(l.id)}
                  />
                );
              })}
              {/* file nodes */}
              {sourceFiles.map((f) => {
                const pos = fileLayout.get(f);
                if (!pos) return null;
                const display = f.length > 20 ? '…' + f.slice(-19) : f;
                return (
                  <g key={f} transform={`translate(${pos.x},${pos.y - 10})`}>
                    <rect
                      x={0}
                      y={0}
                      width={180}
                      height={20}
                      rx={3}
                      className="fill-bg-subtle stroke-line"
                    />
                    <text x={6} y={14} fontSize={9} className="fill-ink-1 font-mono">
                      {display}
                    </text>
                  </g>
                );
              })}
              {/* route nodes */}
              {ROUTES.map((r) => {
                const pos = routeLayout.get(r.id);
                if (!pos) return null;
                const isSelected = selected?.routeId === r.id;
                return (
                  <g key={r.id} transform={`translate(${pos.x - 70},${pos.y - 10})`}>
                    <rect
                      x={0}
                      y={0}
                      width={140}
                      height={20}
                      rx={3}
                      className={cn(
                        'fill-accent-soft',
                        isSelected ? 'stroke-accent' : 'stroke-line',
                      )}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />
                    <text
                      x={70}
                      y={14}
                      textAnchor="middle"
                      fontSize={9}
                      className="fill-accent font-mono"
                    >
                      {r.path}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Link table */}
          <ScrollArea className="flex-1">
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10 bg-bg-subtle">
                <tr className="text-[10px] uppercase tracking-caps text-ink-3">
                  <Th>source</Th>
                  <Th>href</Th>
                  <Th>inferred</Th>
                  <Th right>error</Th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((l) => {
                  const isSel = selectedId === l.id;
                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedId(l.id)}
                      className={cn(
                        'cursor-pointer hover:bg-bg-hover',
                        isSel && 'bg-accent-soft/30',
                      )}
                    >
                      <td className="hairline-b px-2 py-1 font-mono text-[11px] text-ink-1">
                        {l.sourceFile}:{l.line}
                      </td>
                      <td className="hairline-b px-2 py-1 font-mono text-[11px] text-ink-2">
                        {l.href}
                      </td>
                      <td className="hairline-b px-2 py-1 font-mono text-[10px] text-ink-3">
                        {l.inferredType}
                      </td>
                      <td className="hairline-b px-2 py-1 text-right">
                        {l.errorKind ? (
                          <Chip tone={errorTone(l.errorKind)} size="xs">
                            {errorLabel(l.errorKind)}
                          </Chip>
                        ) : (
                          <Chip tone="static" size="xs">
                            ok
                          </Chip>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-[11px] text-ink-3">
                      No links match this filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </ScrollArea>
        </div>

        {/* Right rail */}
        <ScrollArea className="h-[540px]">
          <div className="px-3 py-3">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              Link detail
            </div>
            {selected ? (
              <div className="mt-2 space-y-3 text-xs">
                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="font-mono text-ink-1">
                    {selected.sourceFile}:{selected.line}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-ink-3">
                    href = {selected.href}
                  </div>
                </div>
                {selected.errorKind ? (
                  <div className="rounded-sm border border-sev-err/40 bg-sev-err-soft px-2 py-2">
                    <div className="flex items-center gap-1">
                      <Chip tone={errorTone(selected.errorKind)} size="xs">
                        {errorLabel(selected.errorKind)}
                      </Chip>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-sev-err">
                      {selected.errorMessage}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-sm border border-sem-static/30 bg-sem-static-soft px-2 py-2 text-[11px] text-sem-static">
                    Type-checked OK.
                  </div>
                )}

                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Expected
                  </div>
                  <CodeBlock
                    code={selected.expectedType}
                    language="ts"
                    diff="after"
                    showLineNumbers={false}
                    maxHeight={80}
                  />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Actual
                  </div>
                  <CodeBlock
                    code={selected.inferredType}
                    language="ts"
                    diff={selected.errorKind ? 'before' : undefined}
                    showLineNumbers={false}
                    maxHeight={80}
                  />
                </div>
                {selected.errorKind ? (
                  <div>
                    <div className="text-[10px] uppercase tracking-caps text-ink-3">
                      Suggested fix
                    </div>
                    <p className="mt-1 text-[11px] text-ink-2">
                      {fixSuggestion(selected)}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
                Select a link to inspect.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        'hairline-b bg-bg-subtle px-2 py-1.5 font-normal',
        right ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

function fixSuggestion(l: LinkUsage): string {
  switch (l.errorKind) {
    case 'missing-param':
      return `Pass the missing param: <Link href={{ pathname: '${l.href}', params: ${l.expectedType} }} />.`;
    case 'wrong-type':
      return `Coerce the param to match the expected shape (${l.expectedType}).`;
    case 'deprecated':
      return 'Update the href to the replacement route, or run the codemod.';
    case 'unknown-route':
      return 'Either create the route folder or remove this Link.';
    default:
      return '';
  }
}
