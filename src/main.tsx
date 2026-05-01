import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { useUiStore } from '@entities/ui-shell';
import { getPlatform } from '@shared/native';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
