import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, Section } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  coveragePercent,
  hasRtlContent,
  keys,
  locales,
  namespaces,
  orphanKeys,
  type Locale,
  type Namespace,
} from './helpers';

function CoverageBar({
  pct,
  className,
}: {
  pct: number;
  className?: string;
}) {
  const tone =
    pct >= 95
      ? 'bg-sem-static'
      : pct >= 80
        ? 'bg-sev-info'
        : pct >= 60
          ? 'bg-sev-warn'
          : 'bg-sev-err';
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-block h-1 w-12 overflow-hidden rounded-full bg-bg-subtle',
        className,
      )}
    >
      <span
        className={cn('absolute left-0 top-0 h-full', tone)}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

export function I18nCoverageOverlay() {
  const open = useUiStore((s) => s.overlays.i18nCoverage.open);
  const requestedLocale = useUiStore((s) => s.overlays.i18nCoverage.locale) as
    | Locale
    | undefined;
  const close = useUiStore((s) => s.closeOverlay);

  const [activeLocale, setActiveLocale] = useState<Locale>(
    (requestedLocale && locales.includes(requestedLocale)
      ? requestedLocale
      : 'en') as Locale,
  );
  const [rtlOnly, setRtlOnly] = useState(false);

  const orphans = useMemo(() => orphanKeys(), []);

  const grouped = useMemo(() => {
    const map: Record<Namespace, typeof keys> = {
      common: [],
      product: [],
      checkout: [],
      account: [],
      errors: [],
    };
    for (const key of keys) {
      const arr = map[key.ns] as Array<typeof key>;
      arr.push(key);
    }
    return map;
  }, []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('i18nCoverage'))}
      title="i18n Coverage"
      subtitle="translation keys × locales"
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Export missing keys (preview)')}
          >
            Export missing keys
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => toast('Generate placeholder values (preview)')}
          >
            Auto-fill placeholders
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Locales</span>
        <div className="inline-flex items-center gap-1">
          {locales.map((l) => {
            const pct = coveragePercent(l);
            const active = activeLocale === l;
            return (
              <button
                key={l}
                onClick={() => setActiveLocale(l)}
                aria-selected={active}
                className={cn(
                  'inline-flex h-6 items-center gap-1.5 rounded-sm border px-1.5 text-[11px]',
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                )}
              >
                <span className="font-mono uppercase">{l}</span>
                <span className="font-mono text-[10px] text-ink-3">{pct}%</span>
                <CoverageBar pct={pct} />
              </button>
            );
          })}
        </div>
        <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-ink-2">
          <input
            type="checkbox"
            checked={rtlOnly}
            onChange={(e) => setRtlOnly(e.target.checked)}
            className="h-3 w-3"
          />
          RTL test
        </label>
      </div>

      <div className="px-3 py-2">
        {namespaces.map((ns) => {
          const nsKeys = grouped[ns];
          const filtered = rtlOnly ? nsKeys.filter(hasRtlContent) : nsKeys;
          const missingHere = nsKeys.filter(
            (k) => k.values[activeLocale] === undefined,
          ).length;
          return (
            <Section
              key={ns}
              defaultOpen={ns === 'common' || ns === 'errors'}
              title={
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono uppercase tracking-caps text-[10px] text-ink-3">
                    {ns}
                  </span>
                  <span className="text-ink-1">{nsKeys.length} keys</span>
                </span>
              }
              trailing={
                <>
                  {missingHere > 0 ? (
                    <Chip tone="warn" size="xs">
                      {missingHere} missing in {activeLocale}
                    </Chip>
                  ) : (
                    <Chip tone="static" size="xs">
                      complete
                    </Chip>
                  )}
                </>
              }
            >
              {filtered.length === 0 ? (
                <div className="px-1 py-1 text-[11px] text-ink-3">
                  {rtlOnly
                    ? 'No keys with RTL content in this namespace.'
                    : 'No keys.'}
                </div>
              ) : (
                <div className="overflow-hidden rounded-sm border border-line">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
                        <th className="px-2 py-1 text-left">Key</th>
                        {locales.map((l) => (
                          <th
                            key={l}
                            className="px-2 py-1 text-center font-mono"
                          >
                            {l}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((k) => (
                        <tr
                          key={k.id}
                          className="border-t border-line/60 hover:bg-bg-hover"
                        >
                          <td className="px-2 py-1">
                            <div className="font-mono text-ink-1">
                              {k.ns}.{k.key}
                            </div>
                            <div className="truncate text-[10px] text-ink-3">
                              {k.usedIn.length === 0
                                ? 'orphan (no usage)'
                                : k.usedIn.join(' · ')}
                            </div>
                          </td>
                          {locales.map((l) => {
                            const v = k.values[l];
                            const isInherit =
                              v === undefined &&
                              l !== 'en' &&
                              k.values.en !== undefined;
                            return (
                              <td
                                key={l}
                                className="px-1 py-1 text-center"
                              >
                                <button
                                  onClick={() =>
                                    toast(
                                      v
                                        ? `${k.ns}.${k.key} (${l}) — ${v}`
                                        : isInherit
                                          ? `${k.ns}.${k.key} (${l}) — would inherit from en`
                                          : `${k.ns}.${k.key} (${l}) — missing`,
                                    )
                                  }
                                  className={cn(
                                    'inline-flex h-5 w-5 items-center justify-center rounded-sm text-sm',
                                    v
                                      ? 'text-sem-static hover:bg-bg-hover'
                                      : isInherit
                                        ? 'text-sev-info hover:bg-bg-hover'
                                        : 'text-sev-err hover:bg-sev-err-soft',
                                  )}
                                  aria-label={`${k.ns}.${k.key} ${l}`}
                                >
                                  {v ? '✓' : isInherit ? '↺' : '✗'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          );
        })}

        {orphans.length > 0 && (
          <Section
            defaultOpen={false}
            title={
              <span className="inline-flex items-center gap-1.5">
                <span className="font-mono uppercase tracking-caps text-[10px] text-ink-3">
                  Orphan keys
                </span>
                <span className="text-ink-1">{orphans.length}</span>
              </span>
            }
            trailing={
              <Chip tone="warn" size="xs">
                no usages
              </Chip>
            }
          >
            <ul className="space-y-1">
              {orphans.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1 text-xs"
                >
                  <span className="font-mono text-ink-1">
                    {o.ns}.{o.key}
                  </span>
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() => toast(`Remove ${o.ns}.${o.key} (preview)`)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </OverlayPanel>
  );
}
