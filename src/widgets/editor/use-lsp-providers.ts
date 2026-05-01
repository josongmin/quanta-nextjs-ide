/**
 * Monaco <-> tsserver bridge.
 *
 * Registers Monaco language service providers (definition, references, completion,
 * hover, rename) that delegate to the LSP client (which talks to a real tsserver
 * spawned by the Rust side). Also wires `onDidChangeModelContent` to push edits
 * into tsserver and renders incoming diagnostics as Monaco markers.
 *
 * Position mapping: tsserver uses 1-based `line` and 1-based `offset` (column).
 * Monaco uses 1-based `lineNumber` and 1-based `column`. They map 1:1.
 */

import { useEffect, useRef } from 'react';
import type { Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor, IDisposable, languages } from 'monaco-editor';
import { lspClient } from '@shared/lsp';
import { useLspStore } from '@shared/lsp/store';
import type { TsDiagnostic } from '@shared/lsp/types';

const OWNER = 'quanta-tsserver';

function diagSeverity(
  monaco: Monaco,
  category: TsDiagnostic['category'],
): MonacoEditor.IMarkerData['severity'] {
  switch (category) {
    case 'error':
      return monaco.MarkerSeverity.Error;
    case 'warning':
      return monaco.MarkerSeverity.Warning;
    case 'suggestion':
      return monaco.MarkerSeverity.Info;
    default:
      return monaco.MarkerSeverity.Hint;
  }
}

export interface UseLspProvidersArgs {
  monaco: Monaco | null;
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  /** Logical file path used as the tsserver `file` key (absolute, ideally). */
  file: string | null;
  /** Initial source. Sent as the `open` payload. */
  source: string | null;
}

/**
 * Mounts Monaco providers + diagnostic markers + content sync for one editor.
 * Safe to call when `lspClient` isn't started — providers return empty results.
 */
export function useLspProviders({ monaco, editor, file, source }: UseLspProvidersArgs): void {
  const providersRef = useRef<IDisposable[]>([]);
  const openedRef = useRef<string | null>(null);

  // Register providers once per Monaco instance.
  useEffect(() => {
    if (!monaco) return;
    const langs = ['typescript', 'javascript'];
    const disposables: IDisposable[] = [];

    disposables.push(
      monaco.languages.registerDefinitionProvider(langs, {
        provideDefinition: async (model, position) => {
          const path = modelPath(model);
          if (!path) return null;
          const defs = await lspClient.definition(path, position.lineNumber, position.column);
          if (!defs || defs.length === 0) return null;
          return defs.map<languages.LocationLink>((d) => ({
            uri: monaco.Uri.file(d.file),
            range: spanToRange(d.start, d.end),
          }));
        },
      }),
    );

    disposables.push(
      monaco.languages.registerReferenceProvider(langs, {
        provideReferences: async (model, position) => {
          const path = modelPath(model);
          if (!path) return [];
          const res = await lspClient.references(path, position.lineNumber, position.column);
          if (!res) return [];
          return res.refs.map<languages.Location>((r) => ({
            uri: monaco.Uri.file(r.file),
            range: spanToRange(r.start, r.end),
          }));
        },
      }),
    );

    disposables.push(
      monaco.languages.registerCompletionItemProvider(langs, {
        triggerCharacters: ['.', '"', "'", '`', '/', '@', '<', '#', ' '],
        provideCompletionItems: async (model, position) => {
          const path = modelPath(model);
          if (!path) return { suggestions: [] };
          const word = model.getWordUntilPosition(position);
          const info = await lspClient.completions(
            path,
            position.lineNumber,
            position.column,
            word.word,
          );
          if (!info) return { suggestions: [] };
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const suggestions = info.entries.map<languages.CompletionItem>((e) => ({
            label: e.name,
            kind: completionKind(monaco, e.kind),
            insertText: e.insertText ?? e.name,
            sortText: e.sortText,
            range,
            detail: e.kindModifiers || undefined,
          }));
          return { suggestions };
        },
      }),
    );

    disposables.push(
      monaco.languages.registerHoverProvider(langs, {
        provideHover: async (model, position) => {
          const path = modelPath(model);
          if (!path) return null;
          const qi = await lspClient.quickInfo(path, position.lineNumber, position.column);
          if (!qi) return null;
          const docs =
            typeof qi.documentation === 'string'
              ? qi.documentation
              : Array.isArray(qi.documentation)
                ? qi.documentation.map((p) => p.text).join('\n')
                : '';
          return {
            range: spanToRange(qi.start, qi.end),
            contents: [
              { value: '```ts\n' + qi.displayString + '\n```' },
              ...(docs ? [{ value: docs }] : []),
            ],
          };
        },
      }),
    );

    disposables.push(
      monaco.languages.registerRenameProvider(langs, {
        provideRenameEdits: async (model, position, newName) => {
          const path = modelPath(model);
          if (!path) return { edits: [] };
          const res = await lspClient.rename(path, position.lineNumber, position.column, newName);
          if (!res || !res.info.canRename) return { edits: [] };
          const edits: languages.IWorkspaceTextEdit[] = [];
          for (const group of res.locs) {
            for (const loc of group.locs) {
              edits.push({
                resource: monaco.Uri.file(group.file),
                versionId: undefined,
                textEdit: {
                  range: spanToRange(loc.start, loc.end),
                  text: (loc.prefixText ?? '') + newName + (loc.suffixText ?? ''),
                },
              });
            }
          }
          return { edits };
        },
      }),
    );

    providersRef.current = disposables;
    return () => {
      for (const d of disposables) d.dispose();
      providersRef.current = [];
    };
  }, [monaco]);

  // Open the file in tsserver + listen to model edits.
  useEffect(() => {
    if (!monaco || !editor || !file) return;
    if (!lspClient.isStarted()) return;
    const model = editor.getModel();
    if (!model) return;

    const initial = source ?? model.getValue();
    void lspClient.openFile(file, initial);
    openedRef.current = file;

    const sub = model.onDidChangeContent(() => {
      const text = model.getValue();
      void lspClient.changeFile(file, text);
    });

    return () => {
      sub.dispose();
      const closed = openedRef.current;
      openedRef.current = null;
      if (closed) void lspClient.closeFile(closed);
    };
    // We intentionally don't depend on `source` — content changes flow via
    // onDidChangeContent. We re-open only when file or editor changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, editor, file]);

  // Project diagnostics -> Monaco markers.
  useEffect(() => {
    if (!monaco || !file) return;
    const apply = () => {
      const bucket = useLspStore.getState().byFile[file];
      const all: TsDiagnostic[] = bucket
        ? [...bucket.syntax, ...bucket.semantic, ...bucket.suggestion]
        : [];
      const markers: MonacoEditor.IMarkerData[] = all.map((d) => ({
        severity: diagSeverity(monaco, d.category),
        message: d.text,
        startLineNumber: d.start.line,
        startColumn: d.start.offset,
        endLineNumber: d.end.line,
        endColumn: d.end.offset,
        code: d.code != null ? String(d.code) : undefined,
        source: d.source ?? 'ts',
      }));
      // Resolve the model by file path. Monaco models use Uri; the @monaco-editor/react
      // `path` prop creates `inmemory://...` URIs. We try both file: and any model whose
      // path ends with our file.
      const all_models = monaco.editor.getModels();
      for (const model of all_models) {
        const decoded = decodeURIComponent(model.uri.path);
        if (decoded.endsWith(file) || model.uri.toString().endsWith(file)) {
          monaco.editor.setModelMarkers(model, OWNER, markers);
        }
      }
    };
    apply();
    const unsub = useLspStore.subscribe(apply);
    return () => unsub();
  }, [monaco, file]);
}

function modelPath(model: MonacoEditor.ITextModel): string | null {
  // Prefer a clean filesystem-like path for tsserver. @monaco-editor/react's
  // `path` prop materializes as `inmemory://model/<n>` initially but the
  // Uri's `path` typically ends with the logical file.
  const decoded = decodeURIComponent(model.uri.path);
  // Strip a leading slash if present so tsserver receives a workspace-relative
  // or absolute path consistent with what was sent in `openFile`.
  return decoded || null;
}

function spanToRange(start: { line: number; offset: number }, end: { line: number; offset: number }) {
  return {
    startLineNumber: start.line,
    startColumn: start.offset,
    endLineNumber: end.line,
    endColumn: end.offset,
  };
}

function completionKind(monaco: Monaco, kind: string): languages.CompletionItemKind {
  const C = monaco.languages.CompletionItemKind;
  switch (kind) {
    case 'method':
    case 'function':
      return C.Function;
    case 'property':
      return C.Property;
    case 'class':
      return C.Class;
    case 'interface':
      return C.Interface;
    case 'enum':
      return C.Enum;
    case 'variable':
    case 'local var':
    case 'parameter':
      return C.Variable;
    case 'keyword':
      return C.Keyword;
    case 'module':
    case 'external module name':
      return C.Module;
    case 'type':
    case 'type parameter':
      return C.TypeParameter;
    case 'const':
      return C.Constant;
    case 'string':
      return C.Value;
    default:
      return C.Text;
  }
}
