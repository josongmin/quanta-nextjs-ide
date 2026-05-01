// Shape types live in `shared/types`; mock data lives in `shared/mocks`.
// This helper re-exports them and adds feature-local coverage helpers.
export type { Locale, Namespace, I18nKey } from '@shared/types';

import type { I18nKey, Locale, Namespace } from '@shared/types';
import {
  mockI18nKeys,
  mockI18nLocales,
  mockI18nNamespaces,
} from '@shared/mocks/i18n';

export const locales: ReadonlyArray<Locale> = mockI18nLocales;
export const namespaces: ReadonlyArray<Namespace> = mockI18nNamespaces;
export const keys: ReadonlyArray<I18nKey> = mockI18nKeys;

export function coverage(locale: Locale): { covered: number; total: number } {
  let covered = 0;
  for (const k of keys) {
    if (k.values[locale] !== undefined) covered += 1;
  }
  return { covered, total: keys.length };
}

export function coveragePercent(locale: Locale): number {
  const { covered, total } = coverage(locale);
  return total === 0 ? 0 : Math.round((covered / total) * 100);
}

export function namespaceCoverage(
  locale: Locale,
  ns: Namespace,
): { covered: number; total: number; missing: I18nKey[] } {
  const inNs = keys.filter((k) => k.ns === ns);
  const missing = inNs.filter((k) => k.values[locale] === undefined);
  return { covered: inNs.length - missing.length, total: inNs.length, missing };
}

export function orphanKeys(): ReadonlyArray<I18nKey> {
  return keys.filter((k) => k.usedIn.length === 0);
}

const RTL_RE = /[֐-׿؀-ۿݐ-ݿࢠ-ࣿ]/;

export function hasRtlContent(k: I18nKey): boolean {
  return Object.values(k.values).some((v) => typeof v === 'string' && RTL_RE.test(v));
}
