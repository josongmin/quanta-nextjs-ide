import { useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useRouteStore } from '@entities/route';
import { cn } from '@shared/lib/cn';
import { ActivityFeed } from '@features/activity-feed';
import { CockpitView } from '@features/cockpit';
import { FixSafelyFab } from '@features/full-context-hover/fix-safely';
import { EditorTabs } from './editor-tabs';
import { EditorBreadcrumb } from './editor-breadcrumb';
import { EditorSurface } from './editor-surface';
import { EditorSticky } from './parts/editor-sticky';
import { EditorMinimap } from './parts/editor-minimap';
import { AnnotationsLayer } from './parts/annotations-layer';
import { InlineBlameLayer } from './parts/inline-blame-layer';
import { ColorPickerLayer } from './parts/color-picker-layer';
import { ImagePreviewLayer } from './parts/image-preview-layer';
import { LinkedEditingLayer } from './parts/linked-editing-layer';
import { StickyScrollLayer } from './parts/sticky-scroll-layer';
import { BracketColorizationLayer } from './parts/bracket-colorization-layer';
import { InlineParamHintsLayer } from './parts/inline-param-hints-layer';
import { CodeLensLayer } from './parts/code-lens-layer';
import { LiveRouteSpec } from '@features/live-route-spec';

export function EditorArea() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const active = tabs.find((t) => t.id === activeTabId);
  const routes = useRouteStore((s) => s.routes);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const focusMode = useUiStore((s) => s.focusMode);
  const currentRoute = active
    ? routes.find(
        (r) => r.files.page === active.file || r.files.layout === active.file,
      )
    : undefined;

  // Editor instance is lifted up from EditorSurface so siblings (sticky / minimap
  // / annotations layer) can read scroll & viewport state from the same Monaco
  // instance.
  const [editorInstance, setEditorInstance] =
    useState<MonacoEditor.IStandaloneCodeEditor | null>(null);

  if (!active) {
    // Phase 15 — replace the "No file open" placeholder with the project
    // pulse cockpit. Renders a derive-on-mount snapshot so the user sees
    // health/risks/ship-readiness instantly with no clicks.
    return <CockpitView inline />;
  }

  return (
    <main className={cn('relative flex h-full min-h-0 flex-col bg-bg')}>
      <EditorTabs />
      <EditorBreadcrumb file={active.file} route={currentRoute} />
      <EditorSticky file={active.file} editor={editorInstance} />
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <div className="relative flex-1 min-w-0 overflow-hidden">
          <EditorSurface
            file={active.file}
            onEditorReady={setEditorInstance}
          />
          {/* Annotation pins layer — synced to Monaco scroll, sits on the far
              left of the editor surface. */}
          <AnnotationsLayer editor={editorInstance} file={active.file} />
          {/* SOTA editor niceties — each is an independent overlay synced to
              Monaco scroll/cursor. They are intentionally always-on (mirrors
              AnnotationsLayer) since they are passive hints. */}
          <InlineBlameLayer editor={editorInstance} file={active.file} />
          <ColorPickerLayer editor={editorInstance} file={active.file} />
          <ImagePreviewLayer editor={editorInstance} />
          <LinkedEditingLayer editor={editorInstance} file={active.file} />
          <StickyScrollLayer editor={editorInstance} file={active.file} />
          <BracketColorizationLayer editor={editorInstance} />
          <InlineParamHintsLayer editor={editorInstance} file={active.file} />
          <CodeLensLayer editor={editorInstance} file={active.file} />
          {/* Phase 16 — Live Route Spec contract card (Monaco viewzone). */}
          <LiveRouteSpec editor={editorInstance} file={active.file} />
        </div>
        {/*
          Floating minimap overlay (SOTA pattern à la VS Code):
          - No layout cost — sits absolutely on top of the editor's right edge.
          - Recedes to ~30% opacity in resting state.
          - Reaches full opacity on hover so it's clearly inspectable.
          - Soft hairline + faint translucent surface so the underlying code
            is still legible under it.
        */}
        <div
          className={cn(
            'pointer-events-none absolute top-2 bottom-2 right-2 z-20',
            'opacity-30 transition-opacity duration-150 hover:opacity-100',
          )}
        >
          <EditorMinimap
            file={active.file}
            editor={editorInstance}
            diagnostics={diagnostics}
            className={cn(
              'pointer-events-auto h-full overflow-hidden rounded-md border border-line/60 bg-bg/80 backdrop-blur-[2px] shadow-pop',
            )}
          />
        </div>
      </div>
      {/* Activity feed sidecar — bottom-right floating dock. Hidden when focus
          mode is on so the editor view stays unobstructed. */}
      {!focusMode ? <ActivityFeed /> : null}
      {/* Phase 6 — Fix safely floating action. Self-gated; renders nothing
          unless a diagnostic is selected or an agent patch is pending. */}
      {!focusMode ? <FixSafelyFab /> : null}
    </main>
  );
}
