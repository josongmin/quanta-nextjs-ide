import { create } from 'zustand';
import type { AiProviderConfig } from '@shared/ai';

const KEY_STORAGE = 'quanta.ai.key';
const PROVIDER_STORAGE = 'quanta.ai.provider';

function readKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}
function readProvider(): 'stub' | 'anthropic' {
  try {
    const v = localStorage.getItem(PROVIDER_STORAGE);
    return v === 'anthropic' ? 'anthropic' : 'stub';
  } catch {
    return 'stub';
  }
}

interface AiSettingsState {
  apiKey: string;
  provider: 'stub' | 'anthropic';
  setApiKey(key: string): void;
  setProvider(provider: 'stub' | 'anthropic'): void;
  toConfig(): AiProviderConfig;
}

export const useAiSettingsStore = create<AiSettingsState>((set, get) => ({
  apiKey: readKey(),
  provider: readProvider(),
  setApiKey: (key) => {
    try {
      if (key) localStorage.setItem(KEY_STORAGE, key);
      else localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* ignore */
    }
    set({ apiKey: key });
  },
  setProvider: (provider) => {
    try {
      localStorage.setItem(PROVIDER_STORAGE, provider);
    } catch {
      /* ignore */
    }
    set({ provider });
  },
  toConfig: () => {
    const s = get();
    return { kind: s.provider, apiKey: s.apiKey };
  },
}));
