/**
 * AI Settings — minimal panel for managing the Anthropic API key.
 *
 * Uses localStorage for now. TODO: migrate to Tauri stronghold or the
 * macOS keychain so the key isn't accessible from the renderer's
 * `window.localStorage`.
 */

import { useEffect, useState } from 'react';
import { Button } from '@shared/ui';
import {
  DEFAULT_MODEL,
  getStoredApiKey,
  hasApiKey,
  setStoredApiKey,
} from '@shared/ai';

export interface AiSettingsPanelProps {
  onSaved?: () => void;
}

export function AiSettingsPanel({ onSaved }: AiSettingsPanelProps) {
  const [key, setKey] = useState<string>('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setKey(getStoredApiKey());
  }, []);

  const handleSave = () => {
    setStoredApiKey(key.trim());
    setSavedFlash(true);
    onSaved?.();
    window.setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleClear = () => {
    setStoredApiKey('');
    setKey('');
  };

  return (
    <div className="space-y-3 p-3 text-[11px]">
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-caps text-ink-3">
          Anthropic API key
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-…"
          className="h-7 w-full rounded border border-line-1 bg-bg-1 px-2 font-mono text-[10px] outline-none focus:border-accent"
        />
        <div className="mt-1 text-[10px] text-ink-3">
          Stored in <code>localStorage</code>. TODO: migrate to Tauri stronghold/keychain.
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-caps text-ink-3">
          Default model
        </label>
        <div className="font-mono text-[11px] text-ink-1">{DEFAULT_MODEL}</div>
      </div>
      <div className="flex gap-2">
        <Button size="xs" tone="accent" onClick={handleSave} disabled={key.trim() === getStoredApiKey()}>
          {savedFlash ? 'Saved ✓' : 'Save'}
        </Button>
        <Button size="xs" tone="ghost" onClick={handleClear} disabled={!hasApiKey() && key === ''}>
          Clear
        </Button>
      </div>
    </div>
  );
}
