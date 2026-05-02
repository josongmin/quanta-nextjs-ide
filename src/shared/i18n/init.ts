/**
 * i18next bootstrap.
 *
 * - All English bundles are inlined (default fallback) so the IDE never
 *   shows a missing string while the user's locale chunk is still loading.
 * - Other locales are lazy-imported on first switch via `loadLocale()`.
 * - ICU MessageFormat plugin handles `{count, plural, ...}` syntax used
 *   in `probeTitleActive`, `probe.captured`, etc.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';

import enCommon from './locales/en/common.json';
import enStatus from './locales/en/status.json';
import enRsc from './locales/en/rsc.json';
import enProbe from './locales/en/probe.json';
import enAi from './locales/en/ai.json';
import enGit from './locales/en/git.json';
import enPlugins from './locales/en/plugins.json';
import enErrors from './locales/en/errors.json';
import enNative from './locales/en/native.json';

import { DEFAULT_LOCALE, NAMESPACES, SUPPORTED_LOCALES, type Locale } from './types';

const STORAGE_KEY = 'quanta.locale';

const enBundle = {
  common: enCommon,
  status: enStatus,
  rsc: enRsc,
  probe: enProbe,
  ai: enAi,
  git: enGit,
  plugins: enPlugins,
  errors: enErrors,
  native: enNative,
};

let initialized = false;

export function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {
    /* ignore */
  }
  // Browser language with region stripped (en-US → en).
  const navLang = (
    typeof navigator !== 'undefined' ? navigator.language : DEFAULT_LOCALE
  )
    .split('-')[0]
    ?.toLowerCase();
  if (navLang && (SUPPORTED_LOCALES as readonly string[]).includes(navLang)) {
    return navLang as Locale;
  }
  return DEFAULT_LOCALE;
}

export function initI18n(): typeof i18n {
  if (initialized) return i18n;
  initialized = true;
  void i18n
    .use(ICU)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: getInitialLocale(),
      fallbackLng: DEFAULT_LOCALE,
      defaultNS: 'common',
      ns: [...NAMESPACES],
      supportedLngs: [...SUPPORTED_LOCALES],
      interpolation: {
        // ICU plugin handles formatting; disable i18next's default
        // {{var}} interpolation so we use a single syntax ({var}).
        escapeValue: false,
      },
      resources: {
        en: enBundle,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: STORAGE_KEY,
        caches: ['localStorage'],
      },
      react: {
        useSuspense: false,
      },
    });
  return i18n;
}

const localeImporters: Record<Locale, () => Promise<Record<string, object>>> = {
  en: async () => enBundle,
  ko: async () => ({
    common: (await import('./locales/ko/common.json')).default,
    status: (await import('./locales/ko/status.json')).default,
    rsc: (await import('./locales/ko/rsc.json')).default,
    probe: (await import('./locales/ko/probe.json')).default,
    ai: (await import('./locales/ko/ai.json')).default,
    git: (await import('./locales/ko/git.json')).default,
    plugins: (await import('./locales/ko/plugins.json')).default,
    errors: (await import('./locales/ko/errors.json')).default,
    native: (await import('./locales/ko/native.json')).default,
  }),
  zh: async () => ({
    common: (await import('./locales/zh/common.json')).default,
    status: (await import('./locales/zh/status.json')).default,
    rsc: (await import('./locales/zh/rsc.json')).default,
    probe: (await import('./locales/zh/probe.json')).default,
    ai: (await import('./locales/zh/ai.json')).default,
    git: (await import('./locales/zh/git.json')).default,
    plugins: (await import('./locales/zh/plugins.json')).default,
    errors: (await import('./locales/zh/errors.json')).default,
    native: (await import('./locales/zh/native.json')).default,
  }),
};

const loaded = new Set<Locale>(['en']);

export async function loadLocale(locale: Locale): Promise<void> {
  if (loaded.has(locale)) return;
  const bundle = await localeImporters[locale]();
  for (const ns of NAMESPACES) {
    const data = (bundle as Record<string, object | undefined>)[ns];
    if (data) i18n.addResourceBundle(locale, ns, data, true, true);
  }
  loaded.add(locale);
}

export async function setLocale(locale: Locale): Promise<void> {
  await loadLocale(locale);
  await i18n.changeLanguage(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  // Reflect locale on <html lang> for accessibility + Intl pickups.
  document.documentElement.lang = locale;
}
