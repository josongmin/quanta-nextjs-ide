/**
 * Lightweight Monaco setup.
 *
 * Monaco's default behaviour is to spin up four language web workers
 * (typescript, json, css, html) on demand. We don't use any of those —
 * language intelligence comes from the tsserver bridge in `@shared/lsp`.
 * Replace them with empty stub workers so they cost ~0 to load.
 *
 * Call `setupLightweightMonaco()` once before any editor mounts.
 */

let installed = false;

const STUB_SOURCE = 'self.onmessage = () => {};';

function makeStubWorker(): Worker {
  const blob = new Blob([STUB_SOURCE], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob), { name: 'quanta-noop' });
}

export function setupLightweightMonaco(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Monaco reads `self.MonacoEnvironment` (typed by monaco itself) on first
  // worker request. Cast to `unknown` to set our minimal shape without
  // colliding with monaco's own ambient declaration.
  (self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      if (label === 'editorWorkerService' || label === 'editor') {
        // Core editor worker — required, but small.
        return new Worker(
          new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
          { type: 'module', name: 'monaco-editor-worker' },
        );
      }
      // typescript / javascript / json / css / html / handlebars / razor —
      // not needed because tsserver does the heavy lifting.
      return makeStubWorker();
    },
  };
}
