import { useEffect, useRef, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useRouteStore } from '@entities/route';
import { getSourceForFile } from '@shared/mocks';
import { useLineSemantics } from './use-line-semantics';
import { useMonacoDecorations } from './use-monaco-decorations';
import { useLspProviders } from './use-lsp-providers';
import { useContextHover } from './use-context-hover';
import { EditorGutter, GUTTER_WIDTH } from './parts/editor-gutter';
import { SelectionActionBar } from './parts/selection-action-bar';
import { DiagnosticHover } from './parts/diagnostic-hover';
import { InlineLenses } from './parts/inline-lenses';
import { EditorContextMenu } from './parts/editor-context-menu';
import { EditorDiffGutter, DIFF_GUTTER_WIDTH } from './parts/editor-diff-gutter';
import { EditorLightbulb, LIGHTBULB_WIDTH } from './parts/editor-lightbulb';
import { useCauseGlyphs, CauseGlyphsLegend } from '@features/cause-glyphs';

interface Props {
  file: string;
  /** lift the Monaco editor instance up so sibling surfaces (sticky/minimap) can sync */
  onEditorReady?: (editor: MonacoEditor.IStandaloneCodeEditor | null) => void;
}

const EXTRA_GUTTER_WIDTH = LIGHTBULB_WIDTH + DIFF_GUTTER_WIDTH;

const NSS_THEME_ID = 'nss-light';

const localStyles = `
.nss-ghost-after {
  color: hsl(var(--text-3)) !important;
  font-style: italic;
  font-size: 11px;
  opacity: 0.75;
  margin-left: 4px;
}
.nss-lens-zone {
  display: flex;
  align-items: center;
  background: hsl(var(--bg-subtle));
  border-top: 1px solid hsl(var(--border-faint));
  border-bottom: 1px solid hsl(var(--border-faint));
}
`;

function languageFor(file: string): string {
  if (file.endsWith('.tsx')) return 'typescript';
  if (file.endsWith('.ts')) return 'typescript';
  if (file.endsWith('.jsx')) return 'javascript';
  if (file.endsWith('.js')) return 'javascript';
  if (file.endsWith('.json')) return 'json';
  if (file.endsWith('.css')) return 'css';
  return 'plaintext';
}

export function EditorSurface({ file, onEditorReady }: Props) {
  const monaco = useMonaco();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const [editorInstance, setEditorInstance] =
    useState<MonacoEditor.IStandaloneCodeEditor | null>(null);

  // Notify parent whenever the live instance changes (mount / unmount).
  useEffect(() => {
    onEditorReady?.(editorInstance);
    return () => {
      onEditorReady?.(null);
    };
  }, [editorInstance, onEditorReady]);

  const setCursor = useEditorStore((s) => s.setCursor);
  const setSelection = useEditorStore((s) => s.setSelection);
  const openOverlay = useUiStore((s) => s.openOverlay);

  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const routes = useRouteStore((s) => s.routes);
  const route = routes.find(
    (r) => r.files.page === file || r.files.layout === file,
  );

  const source = getSourceForFile(file);
  const semantics = useLineSemantics(source, file, diagnostics, route);

  // Theme + global config (one time, when monaco is ready)
  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme(NSS_THEME_ID, {
      base: 'vs',
      inherit: true,
      rules: [
        // muted, modern minimal palette
        { token: '', foreground: '18181B' },
        { token: 'comment', foreground: 'A1A1AA', fontStyle: 'italic' },
        { token: 'keyword', foreground: '4F46E5' },
        { token: 'keyword.control', foreground: '4F46E5' },
        { token: 'identifier', foreground: '52525B' },
        { token: 'type', foreground: '52525B' },
        { token: 'string', foreground: '52525B' },
        { token: 'number', foreground: '52525B' },
        { token: 'delimiter', foreground: 'A1A1AA' },
        { token: 'tag', foreground: '4F46E5' },
        { token: 'attribute.name', foreground: '52525B' },
        { token: 'attribute.value', foreground: '52525B' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#18181B',
        'editorLineNumber.foreground': '#FFFFFF',
        'editorCursor.foreground': '#4F46E5',
        'editor.selectionBackground': '#E0E7FF',
        'editor.inactiveSelectionBackground': '#EEF2FF',
        'editor.lineHighlightBackground': '#FFFFFF',
        'editor.lineHighlightBorder': '#FFFFFF',
        'editorIndentGuide.background': '#F4F4F5',
        'editorIndentGuide.activeBackground': '#E4E4E7',
        'editorOverviewRuler.border': '#FFFFFF',
        'editorWidget.background': '#FFFFFF',
        'editorWidget.border': '#E4E4E7',
        'editorHoverWidget.background': '#FFFFFF',
        'editorHoverWidget.border': '#E4E4E7',
      },
    });
    monaco.editor.setTheme(NSS_THEME_ID);

    // Disable TS service diagnostics; we render our own.
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
    });
  }, [monaco]);

  // Decorations + ghost annotations
  useMonacoDecorations({ editor: editorInstance, monaco, semantics });

  // tsserver-backed language services (defs, refs, completions, hover, rename,
  // markers). Providers register once; per-file open/close + diag mirroring is
  // gated on `lspClient.isStarted()` internally.
  useLspProviders({
    monaco,
    editor: editorInstance,
    file,
    source,
  });

  // Phase 6 — Full Context Hover (36-1). Adds a Monaco IContentWidget that
  // renders our React-based hover card. Strictly additive: existing markdown
  // hover from useLspProviders continues to work unchanged.
  useContextHover({ editor: editorInstance, file });

  // Phase 17 — Gutter Cause Glyphs. Strictly additive: paints a 3px colored
  // bar in Monaco's glyph margin for every line that carries Next.js
  // semantic weight (dynamic triggers, cache mutations, leaks, secrets).
  const causeGlyphs = useCauseGlyphs({ editor: editorInstance, monaco, file, source });

  // Inlay hints provider (semantic ⟨...⟩ labels at end of relevant lines)
  useEffect(() => {
    if (!monaco) return;
    const dispose = monaco.languages.registerInlayHintsProvider(
      ['typescript', 'javascript'],
      {
        provideInlayHints: (model) => {
          const hints: import('monaco-editor').languages.InlayHint[] = [];
          // Match by suffix on decoded path — @monaco-editor/react encodes `[id]` etc.
          const decoded = decodeURIComponent(model.uri.path);
          if (!decoded.endsWith(file) && !model.uri.toString().endsWith(file)) {
            return { hints: [], dispose: () => undefined };
          }
          for (const li of semantics.lines) {
            let label: string | undefined;
            if (li.kind === 'dynamic-trigger') label = '⟨dynamic⟩';
            else if (li.kind === 'use-client') label = '⟨↑ 38 files⟩';
            else if (li.kind === 'fetch' && route?.dataSources[0]) {
              const ds = route.dataSources[0];
              const tag = ds.cacheTags[0];
              if (tag && ds.revalidate) label = `⟨tag: ${tag} · rev ${ds.revalidate}⟩`;
            } else if (li.kind === 'route-top' && route) {
              label = `⟨${route.rendering.toUpperCase()} · ${route.path}⟩`;
            }
            if (!label) continue;
            const col = model.getLineMaxColumn(li.line);
            hints.push({
              kind: monaco.languages.InlayHintKind.Type,
              position: { lineNumber: li.line, column: col },
              label,
              paddingLeft: true,
            });
          }
          return { hints, dispose: () => undefined };
        },
      },
    );
    return () => dispose.dispose();
  }, [monaco, semantics, file, route]);

  const handleMount = (
    editor: MonacoEditor.IStandaloneCodeEditor,
    monacoApi: typeof import('monaco-editor'),
  ) => {
    editorRef.current = editor;
    setEditorInstance(editor);

    // Ensure theme applied
    monacoApi.editor.setTheme(NSS_THEME_ID);

    editor.onDidChangeCursorPosition((e) => {
      setCursor({
        file,
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    editor.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      if (sel.isEmpty()) {
        setSelection(null);
        return;
      }
      const model = editor.getModel();
      if (!model) return;
      setSelection({
        startLine: sel.startLineNumber,
        endLine: sel.endLineNumber,
        text: model.getValueInRange(sel),
      });
    });
  };

  const handleBlastClick = (line: number) => {
    const dx = semantics.diagnosticsByLine.get(line)?.[0];
    openOverlay('blastRadius', dx ? { sourceFile: file } : { sourceFile: file });
  };

  return (
    <EditorContextMenu>
      <div className="relative h-full w-full bg-bg">
        <style>{localStyles}</style>

        {/* Custom gutter overlaid on left side */}
        <EditorGutter
          editor={editorInstance}
          semantics={semantics}
          onClickBlast={handleBlastClick}
        />

        {/* Lightbulb column (16px) — quick fix affordance for diagnostic lines */}
        <EditorLightbulb
          editor={editorInstance}
          diagnosticsByLine={semantics.diagnosticsByLine}
          left={GUTTER_WIDTH}
        />

        {/* Semantic-diff strip (6px) — colored marks per diff entry */}
        <EditorDiffGutter
          file={file}
          editor={editorInstance}
          left={GUTTER_WIDTH + LIGHTBULB_WIDTH}
        />

        <div
          className="absolute right-0 top-0 h-full"
          style={{ left: GUTTER_WIDTH + EXTRA_GUTTER_WIDTH }}
        >
          <Editor
            theme={NSS_THEME_ID}
            language={languageFor(file)}
            path={file}
            value={source}
            onMount={handleMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'off',
              folding: true,
              glyphMargin: true,
              scrollBeyondLastLine: false,
              renderLineHighlight: 'none',
              padding: { top: 8, bottom: 8 },
              fontSize: 13,
              lineHeight: 20,
              fontFamily:
                'JetBrains Mono, Fira Code, ui-monospace, SFMono-Regular, monospace',
              renderWhitespace: 'none',
              wordWrap: 'off',
              smoothScrolling: true,
              scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                useShadows: false,
              },
              guides: {
                indentation: false,
                highlightActiveIndentation: false,
              },
              overviewRulerLanes: 0,
              overviewRulerBorder: false,
              fixedOverflowWidgets: true,
              contextmenu: false,
              quickSuggestions: false,
              hover: { enabled: false },
              parameterHints: { enabled: false },
              suggestOnTriggerCharacters: false,
              renderValidationDecorations: 'off',
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
            }}
          />
        </div>

        {/* React-rendered overlays */}
        <InlineLenses
          editor={editorInstance}
          monaco={monaco}
          semantics={semantics}
          file={file}
        />
        <SelectionActionBar editor={editorInstance} />
        <DiagnosticHover
          editor={editorInstance}
          diagnosticsByLine={semantics.diagnosticsByLine}
        />

        {/* Phase 17 — Cause glyphs legend (bottom-right floating pill row). */}
        <CauseGlyphsLegend result={causeGlyphs} />
      </div>
    </EditorContextMenu>
  );
}
