import { useState } from 'react';
import {
  coverage,
  coveragePercent,
  locales,
  namespaceCoverage,
  namespaces,
  type Locale,
} from '@features/i18n-coverage/helpers';
import { useUiStore } from '@entities/ui-shell';
import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';

const LOCALE_OPTIONS: ReadonlyArray<FilterChipOption<Locale>> = locales.map(
  (l) => ({ value: l, label: l.toUpperCase() }),
);

export function I18nTab() {
  const [locale, setLocale] = useState<Locale>('en');
  const openOverlay = useUiStore((s) => s.openOverlay);

  const cov = coverage(locale);
  const pct = coveragePercent(locale);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup
          options={LOCALE_OPTIONS}
          value={locale}
          onChange={(v) => setLocale(v)}
        />
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-ink-3">
          <span>
            {cov.covered}/{cov.total}
          </span>
          <span className="font-mono">{pct}%</span>
        </span>
      </TabHeader>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <button
          onClick={() => openOverlay('i18nCoverage', { locale })}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[11px] text-ink-2 hover:bg-bg-hover"
        >
          <span className="text-[10px] uppercase tracking-caps text-ink-3">
            Locale
          </span>
          <span className="font-mono uppercase text-ink-1">{locale}</span>
          <span
            className={cn(
              'ml-auto font-mono text-[11px]',
              pct >= 95
                ? 'text-sem-static'
                : pct >= 80
                  ? 'text-sev-info'
                  : pct >= 60
                    ? 'text-sev-warn'
                    : 'text-sev-err',
            )}
          >
            {pct}% coverage
          </span>
        </button>
        <ul className="divide-y divide-line/60">
          {namespaces.map((ns) => {
            const nc = namespaceCoverage(locale, ns);
            const npct =
              nc.total === 0 ? 100 : Math.round((nc.covered / nc.total) * 100);
            const tone =
              npct >= 100
                ? 'static'
                : npct >= 80
                  ? 'info'
                  : npct >= 60
                    ? 'warn'
                    : 'err';
            return (
              <li key={ns}>
                <button
                  onClick={() => openOverlay('i18nCoverage', { locale })}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-bg-hover"
                >
                  <span className="font-mono text-[11px] uppercase tracking-caps text-ink-3">
                    {ns}
                  </span>
                  <span className="text-[11px] text-ink-1">
                    {nc.total} keys
                  </span>
                  {nc.missing.length > 0 ? (
                    <span className="text-[10px] text-sev-warn">
                      {nc.missing.length} missing
                    </span>
                  ) : null}
                  <Chip tone={tone} size="xs" className="ml-auto">
                    {npct}%
                  </Chip>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
