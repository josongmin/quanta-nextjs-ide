/**
 * i18n shape types.
 *
 * Lives in `shared/types` so the `i18n-coverage` feature and the
 * `shared/mocks/i18n.ts` mock data can both reference these without
 * a shared-to-feature import.
 */

export type Locale = 'en' | 'ko' | 'ja' | 'es' | 'de';

export type Namespace = 'common' | 'product' | 'checkout' | 'account' | 'errors';

export interface I18nKey {
  id: string;
  key: string;
  ns: Namespace;
  usedIn: string[];
  values: Partial<Record<Locale, string>>;
}
