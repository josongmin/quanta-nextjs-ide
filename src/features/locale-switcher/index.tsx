import { LOCALE_LABELS, SUPPORTED_LOCALES, useLocale, useT } from '@shared/i18n';

/**
 * Compact locale picker — used in status bar + settings overlay.
 *
 * Shows the current language's flag + native name; clicking cycles
 * through the supported locales. Hold Shift to step backwards.
 */
export function LocaleChip() {
  const { locale, setLocale, loading } = useLocale();
  const t = useT('native');
  const idx = SUPPORTED_LOCALES.indexOf(locale);
  const next = SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length] ?? 'en';
  const prev =
    SUPPORTED_LOCALES[(idx - 1 + SUPPORTED_LOCALES.length) % SUPPORTED_LOCALES.length] ?? 'en';
  const current = LOCALE_LABELS[locale];
  const onClick = (e: React.MouseEvent) => {
    void setLocale(e.shiftKey ? prev : next);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1 hover:text-ink-1 disabled:opacity-50"
      aria-label={t('locale.label')}
      data-testid="locale-chip"
      title={t('locale.switchTo', {
        name: LOCALE_LABELS[next].native,
      })}
    >
      <span aria-hidden>{current.flag}</span>
      <span className="text-[10px] uppercase tracking-caps text-ink-3">
        {locale}
      </span>
    </button>
  );
}

/**
 * Full locale list as radio buttons — for settings overlay.
 */
export function LocaleRadioGroup() {
  const { locale, setLocale, loading } = useLocale();
  const t = useT('native');
  return (
    <fieldset className="flex flex-col gap-1" aria-label={t('locale.label')}>
      <legend className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
        {t('locale.label')}
      </legend>
      {SUPPORTED_LOCALES.map((l) => {
        const info = LOCALE_LABELS[l];
        return (
          <label
            key={l}
            className="flex items-center gap-2 text-xs"
            data-locale={l}
          >
            <input
              type="radio"
              name="locale"
              value={l}
              checked={l === locale}
              disabled={loading}
              onChange={() => void setLocale(l)}
            />
            <span aria-hidden>{info.flag}</span>
            <span className="font-mono text-ink-1">{info.native}</span>
            <span className="text-ink-3">({info.english})</span>
          </label>
        );
      })}
    </fieldset>
  );
}
