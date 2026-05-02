/**
 * Public surface of the Quanta i18n entity.
 *
 * Surfaces use:
 *   import { useT, useLocale } from '@shared/i18n';
 *   const t = useT('rsc');
 *   <span>{t('title')}</span>          // namespace-scoped
 *   const { locale, setLocale } = useLocale();
 *
 * For values outside React (analyzers, CLI scripts), use:
 *   import { i18n } from '@shared/i18n';
 *   i18n.t('common:actions.save');
 */

export { initI18n, loadLocale, setLocale, getInitialLocale } from './init';
export { useLocaleStore } from './locale.store';
export {
  formatBytes,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTime,
} from './format';
export {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  NAMESPACES,
  SUPPORTED_LOCALES,
  type Locale,
  type Namespace,
} from './types';

import { useTranslation } from 'react-i18next';
import i18nInstance from 'i18next';
import { useLocaleStore } from './locale.store';
import type { Locale, Namespace } from './types';

/**
 * Tiny wrapper over react-i18next's `useTranslation` that returns just
 * the `t` function pre-bound to a namespace.
 *
 * Usage:
 *   const t = useT('status');
 *   t('probe')        // → "PROBE"
 *   t('client', { kb: 12 })  // → "client 12KB"
 */
export function useT(namespace: Namespace = 'common'): (key: string, params?: Record<string, unknown>) => string {
  const { t } = useTranslation(namespace);
  return (key, params) => t(key, params as never) as unknown as string;
}

/**
 * Read + change the active locale from React.
 */
export function useLocale(): { locale: Locale; setLocale: (l: Locale) => Promise<void>; loading: boolean } {
  const locale = useLocaleStore((s) => s.locale);
  const loading = useLocaleStore((s) => s.loading);
  const setLocale = useLocaleStore((s) => s.setLocale);
  return { locale, setLocale, loading };
}

export const i18n = i18nInstance;
