import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  EmptyState,
  OverlayPanel,
  ScrollArea,
  Tooltip,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  LOCALES,
  ROUTES,
  compareBlock,
  diffBg,
  localeData,
  localeInfo,
  missingPercent,
  renderingImplications,
  routeById,
  severityChipTone,
  totalChars,
  totalTokens,
  type LocaleId,
} from './helpers';

export function I18nRouteDiffOverlay() {
  const open = useUiStore((s) => s.overlays.i18nRouteDiff.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [routeId, setRouteId] = useState<string>('product-detail');
  const [primary, setPrimary] = useState<LocaleId>('KR');
  const [comparisons, setComparisons] = useState<ReadonlyArray<LocaleId>>([
    'EN',
    'JP',
    'ES',
  ]);

  const route = routeById(routeId);
  const primaryData = localeData(routeId, primary);
  const blockCount = primaryData.blocks.length;

  const implications = useMemo(() => renderingImplications(routeId), [routeId]);

  function toggleComp(loc: LocaleId): void {
    if (loc === primary) {
      toast(`${loc} is the primary locale — switch primary first`);
      return;
    }
    setComparisons((p) =>
      p.includes(loc) ? p.filter((x) => x !== loc) : [...p, loc],
    );
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('i18nRouteDiff')}
      title="i18n route diff"
      subtitle="Compare a route across locales — length, missing keys, layout impact"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">route:</span>{' '}
              <span className="font-mono text-ink-1">{route.path}</span>
            </span>
            <span>
              <span className="text-ink-2">locales:</span>{' '}
              <span className="font-mono text-ink-1">
                {primary} vs {comparisons.join(', ') || '—'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Fallback list generated (mock)')}
            >
              Generate fallback list
            </Button>
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Translation editor opened (mock)')}
            >
              Open translation editor
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <span className="text-[10px] uppercase tracking-caps text-ink-3">route</span>
        {ROUTES.map((r) => (
          <ToggleChip
            key={r.id}
            active={routeId === r.id}
            onClick={() => setRouteId(r.id)}
          >
            {r.path}
          </ToggleChip>
        ))}
        <span className="h-4 w-px bg-line" aria-hidden />
        <SelectControl<LocaleId>
          label="primary"
          value={primary}
          onChange={(v) => {
            setPrimary(v);
            setComparisons((p) => p.filter((x) => x !== v));
          }}
          options={LOCALES.map((l) => ({ value: l.id, label: l.id }))}
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          compare
        </span>
        {LOCALES.filter((l) => l.id !== primary).map((l) => (
          <ToggleChip
            key={l.id}
            active={comparisons.includes(l.id)}
            onClick={() => toggleComp(l.id)}
          >
            {l.id}
          </ToggleChip>
        ))}
      </PanelHeader>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <main className="min-w-0 px-3 py-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Primary column */}
            <section>
              <header className="mb-1.5 flex items-center gap-1.5">
                <Chip tone="accent" size="xs">
                  primary · {primary}
                </Chip>
                <span className="font-mono text-[10px] text-ink-3">
                  {primaryData.hreflang}
                </span>
                <span className="ml-auto font-mono text-[10px] text-ink-3">
                  {totalChars(primaryData)} chars · {totalTokens(primaryData)} tokens
                </span>
              </header>
              <ul className="space-y-1.5">
                {primaryData.blocks.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-sm border border-line bg-bg px-2 py-1.5"
                  >
                    <div className="text-[10px] uppercase tracking-caps text-ink-3">
                      {b.id}
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-1">
                      {b.text || '—'}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Comparisons column */}
            <section className="space-y-3">
              {comparisons.length === 0 ? (
                <EmptyState
                  title="No comparison locales"
                  description="Toggle a locale chip in the toolbar to compare."
                />
              ) : (
                comparisons.map((cId) => {
                  const data = localeData(routeId, cId);
                  return (
                    <div key={cId}>
                      <header className="mb-1.5 flex items-center gap-1.5">
                        <Chip tone="muted" size="xs">
                          {cId}
                        </Chip>
                        <span className="font-mono text-[10px] text-ink-3">
                          {data.hreflang}
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-ink-3">
                          {totalChars(data)} chars · {totalTokens(data)} tokens
                        </span>
                      </header>
                      <ul className="space-y-1.5">
                        {primaryData.blocks.map((p) => {
                          const c = data.blocks.find((x) => x.id === p.id);
                          const cmp = compareBlock(p, c);
                          const charsP = p.text.length;
                          const charsC = c?.text.length ?? 0;
                          return (
                            <Tooltip
                              key={p.id}
                              content={
                                <div className="space-y-0.5">
                                  <div className="font-mono text-ink-1">{p.id}</div>
                                  <div className="text-ink-3">
                                    {primary} {charsP} chars · {cId} {charsC} chars
                                  </div>
                                  <div className="text-ink-3">
                                    ratio: {cmp.ratio.toFixed(2)} · {cmp.status}
                                  </div>
                                </div>
                              }
                            >
                              <li
                                className={cn(
                                  'rounded-sm border px-2 py-1.5',
                                  diffBg(cmp.status),
                                )}
                              >
                                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-caps text-ink-3">
                                  <span>{p.id}</span>
                                  <span className="ml-auto font-mono">
                                    {cmp.status} · {Math.round(cmp.ratio * 100)}%
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    'mt-0.5 text-[12px]',
                                    cmp.status === 'missing' ? 'text-sev-err' : 'text-ink-1',
                                  )}
                                >
                                  {cmp.status === 'missing'
                                    ? `(missing — falls back to ${primary})`
                                    : c?.text}
                                </div>
                              </li>
                            </Tooltip>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}
            </section>
          </div>

          {/* Rendering implications */}
          <div className="mt-3 rounded-sm border border-line bg-bg-subtle px-3 py-2">
            <div className="mb-1.5 text-[10px] uppercase tracking-caps text-ink-3">
              Rendering implications
            </div>
            {implications.length === 0 ? (
              <p className="text-[11px] text-ink-3">
                No layout-affecting differences detected.
              </p>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {implications.map((im) => (
                  <li key={im.id} className="flex items-start gap-1.5">
                    <Chip tone={severityChipTone(im.severity)} size="xs">
                      {im.severity}
                    </Chip>
                    <Chip tone="muted" size="xs">
                      {im.locale}
                    </Chip>
                    <span className="flex-1 text-ink-2">{im.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>

        <aside className="min-w-0 px-3 py-3">
          <h4 className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">
            Per-locale stats
          </h4>
          <ScrollArea className="max-h-[480px]">
            <ul className="space-y-2">
              {[primary, ...comparisons].map((loc) => {
                const d = localeData(routeId, loc);
                const info = localeInfo(loc);
                const miss = missingPercent(d, blockCount);
                return (
                  <li
                    key={loc}
                    className="rounded-sm border border-line bg-bg px-2 py-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <Chip tone={loc === primary ? 'accent' : 'muted'} size="xs">
                        {loc}
                      </Chip>
                      <span className="text-[11px] text-ink-2">{info.label}</span>
                      <span className="ml-auto font-mono text-[10px] text-ink-3">
                        {d.hreflang}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                      <span className="text-ink-3">tokens</span>
                      <span className="text-right font-mono text-ink-2">
                        {totalTokens(d)}
                      </span>
                      <span className="text-ink-3">chars</span>
                      <span className="text-right font-mono text-ink-2">
                        {totalChars(d)}
                      </span>
                      <span className="text-ink-3">missing</span>
                      <span
                        className={cn(
                          'text-right font-mono',
                          miss > 0 ? 'text-sev-err' : 'text-sem-static',
                        )}
                      >
                        {miss}%
                      </span>
                      <span className="text-ink-3">last update</span>
                      <span className="text-right text-ink-2">
                        {d.lastUpdatedRel}
                      </span>
                    </div>
                    {d.missingKeys.length > 0 ? (
                      <div className="mt-1.5 rounded-sm bg-sev-err-soft px-1.5 py-1 text-[10px] text-sev-err">
                        Re-translate{' '}
                        <span className="font-mono">{d.missingKeys[0]}</span>
                        {d.missingKeys.length > 1
                          ? ` + ${d.missingKeys.length - 1} more`
                          : ''}{' '}
                        for {loc}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </aside>
      </div>
    </OverlayPanel>
  );
}
