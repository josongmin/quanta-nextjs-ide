export const DEFAULT_FETCH_URL = '/__rsc/';
export const URL_STORAGE_KEY = 'quanta.rsc-payload-step.url';

export function readStoredUrl(): string {
  try {
    return localStorage.getItem(URL_STORAGE_KEY) ?? DEFAULT_FETCH_URL;
  } catch {
    return DEFAULT_FETCH_URL;
  }
}

export function persistUrl(url: string): void {
  try {
    localStorage.setItem(URL_STORAGE_KEY, url);
  } catch {
    /* ignore */
  }
}

export function computeStatusLabel(status: 'idle' | 'streaming' | 'done' | 'error'): string {
  if (status === 'streaming') return 'streaming';
  if (status === 'done') return 'done';
  if (status === 'error') return 'error';
  return 'idle';
}

export function computeStatusTone(
  status: 'idle' | 'streaming' | 'done' | 'error',
): 'accent' | 'edge' | 'muted' | 'info' {
  if (status === 'streaming') return 'accent';
  if (status === 'done') return 'info';
  if (status === 'error') return 'edge';
  return 'muted';
}

export function buildBatchEntries(raw: string): ReadonlyArray<{ url: string; prefix: string }> {
  const paths = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return paths.map((p) => {
    const route = p.startsWith('/__rsc') ? p.replace(/^\/__rsc/, '') : p;
    const url = `/__rsc${route.startsWith('/') ? route : '/' + route}`;
    const prefix = route === '' || route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '_');
    return { url, prefix };
  });
}

export function safeFilenameFromUrl(url: string): string {
  return url.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'trace';
}

export function downloadTraceFile(trace: unknown, filenameSource: string): void {
  const json = JSON.stringify(trace, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const dataUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = dataUrl;
  const safe = filenameSource === 'mock' ? 'mock' : safeFilenameFromUrl(filenameSource);
  a.download = `${safe}.rsc-trace.json`;
  a.click();
  URL.revokeObjectURL(dataUrl);
}

export type {
  ChunkKind,
  RscChunk,
  TreeNode,
} from '@entities/rsc-payload';
export {
  KIND_LABEL,
  KIND_TONE,
  buildResolvedTree as buildResolvedTreeFromChunks,
} from '@entities/rsc-payload';
export { mockRscChunks as mockChunks, MOCK_RSC_TOTAL_MS as TOTAL_MS } from '@shared/mocks/rsc-payload';

import { buildResolvedTree as buildTree } from '@entities/rsc-payload';
import { mockRscChunks } from '@shared/mocks/rsc-payload';

/** @deprecated Mock-only helper retained for legacy callers; prefer buildResolvedTree(chunks, uptoMs) */
export function buildResolvedTree(uptoMs: number) {
  return buildTree(mockRscChunks, uptoMs);
}
