/**
 * Quanta i18n — public types.
 *
 * Locale list is the single source of truth: every translation file under
 * `locales/<locale>/<namespace>.json` must exist for every locale here.
 *
 * Type-safe keys: `LocaleKeys` extracts the literal keys from the canonical
 * (English) bundle so `t('foo.bar')` autocompletes and breaks the build if
 * `foo.bar` is removed.
 */

import type enCommon from './locales/en/common.json';
import type enStatus from './locales/en/status.json';
import type enRsc from './locales/en/rsc.json';
import type enProbe from './locales/en/probe.json';
import type enAi from './locales/en/ai.json';
import type enGit from './locales/en/git.json';
import type enPlugins from './locales/en/plugins.json';
import type enErrors from './locales/en/errors.json';
import type enNative from './locales/en/native.json';

export const SUPPORTED_LOCALES = ['en', 'ko', 'zh'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, { native: string; english: string; flag: string }> = {
  en: { native: 'English', english: 'English', flag: '🇺🇸' },
  ko: { native: '한국어', english: 'Korean', flag: '🇰🇷' },
  zh: { native: '中文', english: 'Chinese', flag: '🇨🇳' },
};

export const NAMESPACES = [
  'common',
  'status',
  'rsc',
  'probe',
  'ai',
  'git',
  'plugins',
  'errors',
  'native',
] as const;
export type Namespace = (typeof NAMESPACES)[number];

/**
 * Compile-time map of namespace → its English bundle shape. The i18next type
 * augmentation below uses this to give `t('rsc.title')` autocomplete +
 * compile errors for typos.
 */
export interface QuantaResources {
  common: typeof enCommon;
  status: typeof enStatus;
  rsc: typeof enRsc;
  probe: typeof enProbe;
  ai: typeof enAi;
  git: typeof enGit;
  plugins: typeof enPlugins;
  errors: typeof enErrors;
  native: typeof enNative;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: QuantaResources;
  }
}
