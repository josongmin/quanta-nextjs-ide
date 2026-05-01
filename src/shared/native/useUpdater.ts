import { useEffect, useState } from 'react';
import { isNative, nativeNotify } from '.';

export interface UpdateInfo {
  version: string;
  notes?: string;
  date?: string;
}

interface UpdaterState {
  available: UpdateInfo | null;
  checking: boolean;
  installing: boolean;
  error: string | null;
}

/**
 * Polls Tauri's updater on launch + every 6 hours.
 *
 * Native build: uses `@tauri-apps/plugin-updater` if available on the global.
 * Web build: returns idle state.
 */
export function useUpdater(): UpdaterState & { install(): Promise<void> } {
  const [state, setState] = useState<UpdaterState>({
    available: null,
    checking: false,
    installing: false,
    error: null,
  });

  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;
    let timer: number | undefined;

    const tauri = (globalThis as {
      __TAURI__?: {
        updater?: {
          check: () => Promise<{
            available: boolean;
            version?: string;
            body?: string;
            date?: string;
          } | null>;
        };
      };
    }).__TAURI__;
    if (!tauri?.updater) return;

    const check = async () => {
      if (cancelled) return;
      setState((s) => ({ ...s, checking: true, error: null }));
      try {
        const update = await tauri.updater!.check();
        if (cancelled) return;
        if (update?.available) {
          const info: UpdateInfo = {
            version: update.version ?? '?',
            notes: update.body,
            date: update.date,
          };
          setState({ available: info, checking: false, installing: false, error: null });
          await nativeNotify(`Quanta ${info.version} available`, info.notes ?? '');
        } else {
          setState((s) => ({ ...s, checking: false }));
        }
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, checking: false, error: (e as Error).message }));
      }
    };

    void check();
    timer = window.setInterval(() => void check(), 6 * 60 * 60 * 1000);

    return () => {
      cancelled = true;
      if (timer != null) window.clearInterval(timer);
    };
  }, []);

  const install = async () => {
    const tauri = (globalThis as {
      __TAURI__?: {
        updater?: {
          downloadAndInstall: () => Promise<void>;
        };
        process?: { relaunch: () => Promise<void> };
      };
    }).__TAURI__;
    if (!tauri?.updater) return;
    setState((s) => ({ ...s, installing: true }));
    try {
      await tauri.updater.downloadAndInstall();
      await tauri.process?.relaunch();
    } catch (e) {
      setState((s) => ({ ...s, installing: false, error: (e as Error).message }));
    }
  };

  return { ...state, install };
}
