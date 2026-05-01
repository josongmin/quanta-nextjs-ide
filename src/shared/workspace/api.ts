/**
 * Workspace API — thin wrapper over the Tauri commands declared in
 * `src-tauri/src/workspace/mod.rs`.
 *
 * Every call short-circuits to a friendly error when running outside Tauri
 * (Storybook, Vitest, plain `vite dev`). That keeps every consumer free of
 * `if (isNative()) …` ceremony.
 *
 * The Tauri JS package is loaded dynamically so the web build does not have
 * to depend on it at compile time. `vite.config.ts` already externalizes
 * Tauri plugins; we extend the same pattern to `@tauri-apps/api`.
 */

import { isNative } from '@shared/native';
import type { FsChangedPayload, WorkspaceInfo } from './types';

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
type ListenFn = <P>(
  event: string,
  handler: (e: { payload: P }) => void,
) => Promise<() => void>;

let invokeImpl: InvokeFn | null = null;
let listenImpl: ListenFn | null = null;

async function getInvoke(): Promise<InvokeFn | null> {
  if (invokeImpl) return invokeImpl;
  if (!isNative()) return null;
  try {
    // Use the global `__TAURI__` runtime first to avoid a hard dependency on
    // `@tauri-apps/api`. Tauri 2 exposes `__TAURI_INTERNALS__.invoke`.
    const internals = (globalThis as { __TAURI_INTERNALS__?: { invoke?: InvokeFn } })
      .__TAURI_INTERNALS__;
    if (internals?.invoke) {
      invokeImpl = internals.invoke;
      return invokeImpl;
    }
    const spec = '@tauri-apps/api/core';
    const mod = (await import(/* @vite-ignore */ spec)) as { invoke: InvokeFn };
    invokeImpl = mod.invoke;
    return invokeImpl;
  } catch {
    return null;
  }
}

async function getListen(): Promise<ListenFn | null> {
  if (listenImpl) return listenImpl;
  if (!isNative()) return null;
  try {
    const spec = '@tauri-apps/api/event';
    const mod = (await import(/* @vite-ignore */ spec)) as { listen: ListenFn };
    listenImpl = mod.listen;
    return listenImpl;
  } catch {
    return null;
  }
}

export async function openWorkspace(path: string): Promise<WorkspaceInfo> {
  const invoke = await getInvoke();
  if (!invoke) throw new Error('Tauri runtime unavailable');
  return invoke<WorkspaceInfo>('open_workspace', { path });
}

export async function closeWorkspace(): Promise<void> {
  const invoke = await getInvoke();
  if (!invoke) return;
  await invoke<void>('close_workspace');
}

export async function readWorkspaceFile(relativePath: string): Promise<string> {
  const invoke = await getInvoke();
  if (!invoke) throw new Error('Tauri runtime unavailable');
  return invoke<string>('read_workspace_file', { relativePath });
}

export async function listWorkspaceFiles(glob: string): Promise<string[]> {
  const invoke = await getInvoke();
  if (!invoke) return [];
  return invoke<string[]>('list_workspace_files', { glob });
}

export async function getCurrentWorkspace(): Promise<string | null> {
  const invoke = await getInvoke();
  if (!invoke) return null;
  return invoke<string | null>('current_workspace');
}

/** Subscribe to fs:changed events. Returns an unsubscribe function. */
export async function onFsChanged(
  handler: (payload: FsChangedPayload) => void,
): Promise<() => void> {
  const listen = await getListen();
  if (!listen) return () => undefined;
  const unlisten = await listen<FsChangedPayload>('fs:changed', (e) =>
    handler(e.payload),
  );
  return unlisten;
}

/**
 * Open a native folder picker. Falls back to `null` when not running under
 * Tauri so callers can show a manual prompt.
 */
export async function pickFolder(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    // Use a runtime-resolved string so TS doesn't try to type-check the
    // missing module — it's externalized in vite.config.ts and resolved at
    // runtime by the Tauri host.
    const spec = '@tauri-apps/plugin-dialog';
    const mod = (await import(/* @vite-ignore */ spec)) as {
      open: (opts: {
        directory: boolean;
        multiple: false;
      }) => Promise<string | null>;
    };
    const picked = await mod.open({ directory: true, multiple: false });
    return picked ?? null;
  } catch {
    return null;
  }
}
