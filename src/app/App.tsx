import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { AppRouter } from './router';
import { useRouteStore } from '@entities/route';
import { useDiagnosticStore } from '@entities/diagnostic';
import { analyzeRoutes, buildRouteTree } from '@shared/analyzer/routes';
import { registerBuiltInAnalyzers } from '@shared/analyzer/register-analyzers';
import { analyzerBus } from '@shared/analyzer/bus';
import { DEMO_WORKSPACE_ROOT, useWorkspaceStore } from '@shared/workspace';
import { useNativeMenu } from '@shared/native/useNativeMenu';
import { useEditorSave } from '@shared/native/useEditorSave';
import { UpdateBanner } from '@features/update-banner';
import { lspClient } from '@shared/lsp';
import { setWorkspaceRoot as setAiWorkspaceRoot } from '@shared/ai';
import { isNative } from '@shared/native';
// `@shared/analyzer/ts-strict` pulls in ts-morph (~1.6 MB gzipped), so we
// dynamic-import it inside `FixtureTsStrictSeed` to keep that payload off
// the main bundle's critical path.

function ThemeBridge() {
  const colorMode = useUiStore((s) => s.colorMode);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = colorMode;
    root.dataset.macEdition = colorMode === 'mac' ? 'true' : 'false';
  }, [colorMode]);
  return null;
}

/**
 * Toggles `data-scrolling="true"` on <html> while ANY scrollable descendant
 * is being scrolled. CSS uses this attr to fade scrollbars in (overlay-style).
 * Clears after 800ms of inactivity.
 */
function ScrollFadeBridge() {
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => {
      if (root.dataset.scrolling !== 'true') {
        root.dataset.scrolling = 'true';
      }
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        root.dataset.scrolling = 'false';
      }, 800);
    };
    // Capture phase so nested overflow containers also trigger.
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);
  return null;
}

/**
 * In dev, seed the route store with the file-system snapshot of the
 * fixture Next app instead of the hand-written `mockRoutes`. If the
 * analyzer returns zero routes (e.g. fixture missing), keep the mock
 * data already wired in the store.
 */
function FixtureRoutesSeed() {
  const setRoutes = useRouteStore((s) => s.setRoutes);
  const seeded = useRef(false);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (seeded.current) return;
    seeded.current = true;
    const routes = analyzeRoutes('e2e/fixtures/next-app');
    if (routes.length === 0) return;
    const tree = buildRouteTree(routes);
    setRoutes(routes, tree);
  }, [setRoutes]);
  return null;
}

/**
 * In dev, run the TS-strict analyzer once over the fixture corpus and append
 * the resulting diagnostics to whatever the store was seeded with (mock data
 * by default). Mock + real coexist so the UI keeps its variety while gaining
 * real findings.
 */
function FixtureTsStrictSeed() {
  const seeded = useRef(false);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (seeded.current) return;
    seeded.current = true;
    // Lazy import keeps ts-morph out of the main chunk — it ships in its
    // own async chunk fetched only after the app has hydrated.
    void import('@shared/analyzer/ts-strict').then(
      ({ analyzeFixtureTsStrict, findingToDiagnostic }) => {
        const report = analyzeFixtureTsStrict();
        if (report.findings.length === 0) return;
        const real = report.findings.map((f, i) => findingToDiagnostic(f, i));
        useDiagnosticStore.setState((s) => ({
          diagnostics: [...s.diagnostics, ...real],
        }));
      },
    );
  }, []);
  return null;
}

function NativeBridges() {
  useNativeMenu();
  useEditorSave();
  return null;
}

/**
 * Phase 1: register the built-in analyzers with the bus and kick off a
 * demo-mode initial pass so non-Tauri hosts still see fixture data flow.
 *
 * When the user opens a real workspace via the workspace store, the store
 * calls `analyzerBus.runAll(realRoot)` which re-runs every analyzer with
 * the live workspace root. The Rust file watcher then drives subsequent
 * incremental re-runs through `fs:changed` events.
 */
function AnalyzerBootstrap() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    registerBuiltInAnalyzers();
    // Demo run kicks the existing fixture pipeline so Storybook/dev keep
    // working without a real workspace open.
    void analyzerBus.runAll(DEMO_WORKSPACE_ROOT);
  }, []);
  return null;
}

/**
 * Boots the tsserver bridge against the current workspace root.
 * Subscribes to the workspace store so opening a new folder restarts tsserver.
 */
function LspBootstrap() {
  const root = useWorkspaceStore((s) => s.root);
  useEffect(() => {
    if (!isNative()) return;
    if (!root || root === DEMO_WORKSPACE_ROOT) return;
    void lspClient.start(root);
    return () => {
      void lspClient.stop();
    };
  }, [root]);
  return null;
}

/**
 * Pushes the workspace root from the Phase 1 store into the AI agent's
 * workspace shim so `read_file` / `grep` / `list_files` tools resolve
 * against the user's real folder.
 */
function AiWorkspaceBridge() {
  const root = useWorkspaceStore((s) => s.root);
  useEffect(() => {
    setAiWorkspaceRoot(root && root !== DEMO_WORKSPACE_ROOT ? root : null);
  }, [root]);
  return null;
}

export function App() {
  return (
    <>
      <ThemeBridge />
      <ScrollFadeBridge />
      <FixtureRoutesSeed />
      <FixtureTsStrictSeed />
      <NativeBridges />
      <AnalyzerBootstrap />
      <LspBootstrap />
      <AiWorkspaceBridge />
      <UpdateBanner />
      <AppRouter />
      <Toaster position="bottom-right" theme="light" richColors closeButton />
    </>
  );
}
