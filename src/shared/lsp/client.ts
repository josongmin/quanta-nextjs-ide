/**
 * Frontend LSP client — typed wrapper over the Rust `tsserver_*` Tauri commands.
 *
 * Wire protocol:
 *   - tsserver speaks JSON over stdio with Content-Length headers (LSP-style framing).
 *     The Rust side handles framing; we just pass `command`, `arguments`, and a `seq`.
 *   - Responses come back inline via Promise resolution. Async events (diagnostics)
 *     are delivered via the Tauri event `tsserver:event` and dispatched here.
 *
 * On the web build (no Tauri), every method is a no-op that resolves to undefined
 * and the store is left empty — callers can branch on `useLspStore.ready` if they
 * want to short-circuit UI.
 */

import { isNative, nativeInvoke } from '@shared/native';
import type {
  TsCompletionInfo,
  TsDiagnostic,
  TsDiagEvent,
  TsFileSpan,
  TsQuickInfo,
  TsReferencesResponse,
  TsRenameInfo,
  TsResponse,
} from './types';
import { useLspStore } from './store';

type TauriEventApi = {
  listen: <T>(
    event: string,
    cb: (e: { payload: T }) => void,
  ) => Promise<() => void>;
};

function tauriEvent(): TauriEventApi | null {
  const t = (globalThis as { __TAURI__?: { event?: TauriEventApi } }).__TAURI__;
  return t?.event ?? null;
}

let nextSeq = 1;
let eventUnlisten: (() => void) | null = null;
let started = false;

async function ensureEventSubscription(): Promise<void> {
  if (eventUnlisten || !isNative()) return;
  const ev = tauriEvent();
  if (!ev) return;
  eventUnlisten = await ev.listen<TsDiagEvent | { type: string; event?: string; body?: unknown }>(
    'tsserver:event',
    (msg) => {
      const payload = msg.payload as TsDiagEvent;
      if (!payload || payload.type !== 'event') return;
      if (
        payload.event === 'semanticDiag' ||
        payload.event === 'syntaxDiag' ||
        payload.event === 'suggestionDiag'
      ) {
        const kind =
          payload.event === 'semanticDiag'
            ? 'semantic'
            : payload.event === 'syntaxDiag'
              ? 'syntax'
              : 'suggestion';
        const file = payload.body?.file;
        const diagnostics: TsDiagnostic[] = payload.body?.diagnostics ?? [];
        if (file) useLspStore.getState().setDiagnostics(file, kind, diagnostics);
      }
    },
  );
}

async function request<TBody = unknown>(
  command: string,
  args: Record<string, unknown> = {},
): Promise<TBody | undefined> {
  if (!isNative()) return undefined;
  const seq = nextSeq++;
  const result = await nativeInvoke<TsResponse<TBody>>('tsserver_request', {
    seq,
    command,
    arguments: args,
  });
  if (!result) return undefined;
  if (!result.success) {
    // Surface the message but don't throw — callers can branch on `undefined`.
    // Many tsserver commands return { success: false, message } on benign races
    // (e.g. file closed mid-request).
    if (result.message) {
      // eslint-disable-next-line no-console
      console.warn(`[lsp] ${command} failed:`, result.message);
    }
    return undefined;
  }
  return result.body;
}

/** Notification-style request (no response body, fire-and-forget). */
async function notify(command: string, args: Record<string, unknown> = {}): Promise<void> {
  if (!isNative()) return;
  const seq = nextSeq++;
  // tsserver still returns a response for most commands; we just don't await it
  // for performance. But we must await the invoke — Tauri's invoke resolves
  // when the response arrives. For "open"/"change" which have no response,
  // we still send via tsserver_request and let the Rust side wait — tsserver
  // sends an immediate reqCompleted-like ack only for some. To stay simple,
  // we await the invoke too.
  await nativeInvoke('tsserver_request', { seq, command, arguments: args });
}

export type LspClient = {
  start(workspaceRoot: string): Promise<void>;
  stop(): Promise<void>;
  isStarted(): boolean;
  openFile(path: string, content: string, scriptKindName?: 'TS' | 'TSX' | 'JS' | 'JSX'): Promise<void>;
  changeFile(path: string, content: string): Promise<void>;
  closeFile(path: string): Promise<void>;
  definition(path: string, line: number, offset: number): Promise<TsFileSpan[] | undefined>;
  references(path: string, line: number, offset: number): Promise<TsReferencesResponse | undefined>;
  completions(
    path: string,
    line: number,
    offset: number,
    prefix?: string,
  ): Promise<TsCompletionInfo | undefined>;
  diagnostics(path: string): Promise<void>;
  rename(path: string, line: number, offset: number, newName: string): Promise<TsRenameInfo | undefined>;
  quickInfo(path: string, line: number, offset: number): Promise<TsQuickInfo | undefined>;
};

export const lspClient: LspClient = {
  async start(workspaceRoot) {
    if (!isNative()) return;
    if (started) return;
    await ensureEventSubscription();
    await nativeInvoke('tsserver_start', { workspaceRoot });
    started = true;
    useLspStore.getState().setReady(true, workspaceRoot);
    // Configure for richer diagnostics + ts > 4.x preferences.
    await request('configure', {
      hostInfo: 'quanta-ide',
      preferences: {
        includeCompletionsForModuleExports: true,
        includeCompletionsWithInsertText: true,
        allowIncompleteCompletions: true,
        importModuleSpecifierPreference: 'shortest',
      },
    });
  },

  async stop() {
    if (!isNative()) return;
    if (eventUnlisten) {
      eventUnlisten();
      eventUnlisten = null;
    }
    await nativeInvoke('tsserver_stop');
    started = false;
    useLspStore.getState().setReady(false, null);
    useLspStore.getState().clearAll();
  },

  isStarted() {
    return started;
  },

  async openFile(path, content, scriptKindName) {
    await notify('open', {
      file: path,
      fileContent: content,
      scriptKindName: scriptKindName ?? guessScriptKind(path),
    });
    // Kick off diagnostics for this file.
    await request('geterr', { delay: 0, files: [path] });
  },

  async changeFile(path, content) {
    // Replace the entire file's content with one change command.
    // tsserver `change` uses 1-based positions and an inclusive-exclusive range.
    await notify('change', {
      file: path,
      line: 1,
      offset: 1,
      endLine: Number.MAX_SAFE_INTEGER,
      endOffset: 1,
      insertString: content,
    });
    await request('geterr', { delay: 50, files: [path] });
  },

  async closeFile(path) {
    await notify('close', { file: path });
    useLspStore.getState().clearFile(path);
  },

  async definition(path, line, offset) {
    return await request<TsFileSpan[]>('definition', { file: path, line, offset });
  },

  async references(path, line, offset) {
    return await request<TsReferencesResponse>('references', { file: path, line, offset });
  },

  async completions(path, line, offset, prefix) {
    return await request<TsCompletionInfo>('completionInfo', {
      file: path,
      line,
      offset,
      prefix: prefix ?? '',
      includeExternalModuleExports: true,
      includeInsertTextCompletions: true,
    });
  },

  async diagnostics(path) {
    await request('geterr', { delay: 0, files: [path] });
  },

  async rename(path, line, offset, newName) {
    return await request<TsRenameInfo>('rename', {
      file: path,
      line,
      offset,
      findInComments: false,
      findInStrings: false,
      newName,
    });
  },

  async quickInfo(path, line, offset) {
    return await request<TsQuickInfo>('quickinfo', { file: path, line, offset });
  },
};

function guessScriptKind(path: string): 'TS' | 'TSX' | 'JS' | 'JSX' {
  if (path.endsWith('.tsx')) return 'TSX';
  if (path.endsWith('.ts')) return 'TS';
  if (path.endsWith('.jsx')) return 'JSX';
  return 'JS';
}
