import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { useUiStore } from '@entities/ui-shell';
import { getPlatform } from '@shared/native';
import { initI18n, getInitialLocale, loadLocale, setLocale } from '@shared/i18n';
import './app/styles/tokens.css';
import './app/styles/native.css';

if (import.meta.env.DEV) {
  // Dev-only debug hatch for e2e/Playwright (no effect in production builds).
  (window as unknown as { __quanta?: unknown }).__quanta = {
    ui: useUiStore,
  };
}

// Tag the document with the host platform so native.css scopes apply.
document.documentElement.dataset.platform = getPlatform();

// Bootstrap i18n. English is inlined; non-English locales load async, and we
// wait so the very first paint is in the user's locale (no flash of English).
async function bootstrap() {
  initI18n();
  const initialLocale = getInitialLocale();
  document.documentElement.lang = initialLocale;
  if (initialLocale !== 'en') {
    await loadLocale(initialLocale);
    await setLocale(initialLocale);
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
