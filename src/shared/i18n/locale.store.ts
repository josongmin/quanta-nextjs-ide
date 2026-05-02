import { create } from 'zustand';
import { getInitialLocale, setLocale as applyLocale } from './init';
import type { Locale } from './types';

interface LocaleState {
  locale: Locale;
  /** True while a non-default bundle is being loaded. */
  loading: boolean;
  setLocale(locale: Locale): Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getInitialLocale(),
  loading: false,
  setLocale: async (locale) => {
    set({ loading: true });
    await applyLocale(locale);
    set({ locale, loading: false });
  },
}));
