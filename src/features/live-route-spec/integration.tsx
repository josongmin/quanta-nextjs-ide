/**
 * `<LiveRouteSpec>` — single mount point for the editor area.
 *
 * Reads from existing stores, runs the aggregator, manages collapsed
 * persistence, and forwards to the viewzone manager. If the file does
 * not belong to a route, renders nothing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { toast } from 'sonner';
import type { editor as MonacoEditor } from 'monaco-editor';
import { useEditorStore } from '@entities/editor';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useCacheTagStore } from '@entities/cache-tag';
import { useActionStore } from '@entities/server-action';
import { useRenderModeStore } from '../render-mode-badge/store';
import { aggregateRouteSpec } from './aggregator';
import { LiveRouteSpecViewZone } from './viewzone';

const STORAGE_KEY = 'quanta.routeSpec.expanded';

interface PersistShape {
  /** routeId → expanded? */
  [routeId: string]: boolean;
}

const loadPrefs = (): PersistShape => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as PersistShape) : {};
  } catch {
    return {};
  }
};

const savePrefs = (prefs: PersistShape): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota or privacy mode — drop silently */
  }
};

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  file: string | undefined;
}

export function LiveRouteSpec({ editor, file }: Props) {
  const monaco = useMonaco();
  const routes = useRouteStore((s) => s.routes);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const actions = useActionStore((s) => s.actions);
  const cacheTags = useCacheTagStore((s) => s.tags);
  const resolvedFor = useRenderModeStore((s) => s.get);

  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const openTab = useEditorStore((s) => s.openTab);

  const [prefs, setPrefs] = useState<PersistShape>(() => loadPrefs());
  const seenRoutesRef = useRef<Set<string>>(new Set());

  // Build the spec. Returns null if file doesn't belong to a route.
  const spec = useMemo(() => {
    if (!file) return null;
    const routeForFile = routes.find((r) =>
      Object.values(r.files).some((f) => f === file),
    );
    const resolved = routeForFile ? resolvedFor(routeForFile.path) ?? null : null;
    const cacheTagsForRoute = routeForFile
      ? cacheTags
          .filter((t) => t.affectedRouteIds.includes(routeForFile.id))
          .map((t) => ({
            name: t.name,
            producers: t.producers.map((p) => p.location.file),
            invalidators: t.invalidators.map((i) => i.location.file),
          }))
      : [];
    return aggregateRouteSpec({
      file,
      routes,
      diagnostics,
      actions,
      resolved,
      cacheTagsForRoute,
    });
  }, [file, routes, diagnostics, actions, cacheTags, resolvedFor]);

  // Determine collapsed/expanded state from prefs (default: expanded).
  const collapsed = spec ? prefs[spec.routeId] === false : true;
  // Detect first reveal of this route in this session.
  const firstReveal = !!spec && !seenRoutesRef.current.has(spec.routeId);
  useEffect(() => {
    if (spec) seenRoutesRef.current.add(spec.routeId);
  }, [spec]);

  const onToggle = useCallback(() => {
    if (!spec) return;
    setPrefs((prev) => {
      // Stored value semantics: explicit `false` means collapsed.
      const wasExpanded = prev[spec.routeId] !== false;
      const next: PersistShape = { ...prev, [spec.routeId]: !wasExpanded };
      savePrefs(next);
      return next;
    });
  }, [spec]);

  const onJumpEvidence = useCallback(
    (target: string, line: number) => {
      if (!editor) return;
      // Same-file jump: just reveal/select.
      const model = editor.getModel();
      if (model && model.uri.path.endsWith(target)) {
        editor.revealLineInCenter(line);
        editor.setSelection({
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 1,
        });
        editor.focus();
        return;
      }
      // Cross-file: open a new tab; the editor surface will reveal.
      openTab({
        id: `tab-${target}`,
        file: target,
        label: target.split('/').pop() ?? target,
      });
      toast(`Open ${target}:${line}`);
    },
    [editor, openTab],
  );

  const onOpenInspector = useCallback(() => {
    if (!spec) return;
    setInspectorContext({ kind: 'route', routeId: spec.routeId });
  }, [spec, setInspectorContext]);

  const onSeeAllRisks = useCallback(() => {
    if (!spec) return;
    setInspectorContext({ kind: 'route', routeId: spec.routeId });
  }, [spec, setInspectorContext]);

  const onShipNow = useCallback(() => {
    if (!spec) return;
    // The ship-drawer feature owns the actual flow; we surface intent here.
    toast(`Ship ${spec.path}`);
  }, [spec]);

  const onTraceFullstack = useCallback(() => {
    if (!spec) return;
    openOverlay('blastRadius', { sourceFile: file });
  }, [spec, openOverlay, file]);

  if (!spec || !editor) return null;

  return (
    <LiveRouteSpecViewZone
      editor={editor}
      monaco={monaco}
      spec={spec}
      collapsed={collapsed}
      firstReveal={firstReveal}
      onToggle={onToggle}
      onJumpEvidence={onJumpEvidence}
      onOpenInspector={onOpenInspector}
      onSeeAllRisks={onSeeAllRisks}
      onShipNow={onShipNow}
      onTraceFullstack={onTraceFullstack}
    />
  );
}
