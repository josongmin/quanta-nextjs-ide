#!/usr/bin/env node
/* Wave 16 codemod: rewrite @app/store imports to @entities/ui-shell or @entities/editor. */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const UI_SHELL_NAMES = new Set([
  'useUiStore',
  'initialOverlays',
  'UiStore',
  'LeftTab',
  'BottomTab',
  'InspectorContext',
  'Density',
  'InspectionProfile',
  'ColorMode',
  'AutofixPolicy',
  'OverlayState',
  'RecentItem',
  'Annotation',
]);

const EDITOR_NAMES = new Set([
  'useEditorStore',
  'EditorTab',
  'CursorPosition',
]);

const out = execSync("grep -rln \"from '@app/store'\" src/", { encoding: 'utf8' });
const files = out.split('\n').map((s) => s.trim()).filter(Boolean).filter((f) => f !== 'src/entities/ui-shell/ui.store.ts');

const stats = { files: 0, uiShellOnly: 0, editorOnly: 0, both: 0, totalImports: 0 };

// Match `import ... from '@app/store';` (single line, optionally with `type` keyword on the import or per-specifier).
// Capture the spec list inside braces. We support: `import { A, B } from '@app/store';`
//   and: `import type { A, B } from '@app/store';`
// We do NOT support default/namespace imports because the shim doesn't export any.
const RE = /^(?<indent>[ \t]*)import\s+(?<typeKw>type\s+)?\{(?<body>[^}]*)\}\s+from\s+['"]@app\/store['"];?[ \t]*\r?\n/gm;

function classify(spec) {
  // spec like "useUiStore" or "type Annotation" or "useUiStore as foo"
  const trimmed = spec.trim();
  if (!trimmed) return null;
  // Strip leading "type "
  const noType = trimmed.replace(/^type\s+/, '');
  // Take the local symbol name (before "as") and trim whitespace
  const name = noType.split(/\s+as\s+/)[0].trim();
  if (UI_SHELL_NAMES.has(name)) return 'ui-shell';
  if (EDITOR_NAMES.has(name)) return 'editor';
  return 'unknown';
}

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  let changed = false;
  let fileHasUi = false;
  let fileHasEditor = false;
  let fileImports = 0;

  const next = src.replace(RE, (match, ...args) => {
    const groups = args[args.length - 1];
    const indent = groups.indent ?? '';
    const typeKw = groups.typeKw ? 'type ' : '';
    const body = groups.body;
    const specs = body.split(',').map((s) => s.trim()).filter(Boolean);
    if (specs.length === 0) return match;

    const ui = [];
    const editor = [];
    for (const s of specs) {
      const cls = classify(s);
      if (cls === 'ui-shell') ui.push(s);
      else if (cls === 'editor') editor.push(s);
      else {
        console.error(`UNKNOWN spec ${s} in ${file}`);
        process.exit(2);
      }
    }
    fileImports++;
    changed = true;
    const lines = [];
    if (ui.length) {
      fileHasUi = true;
      lines.push(`${indent}import ${typeKw}{ ${ui.join(', ')} } from '@entities/ui-shell';\n`);
    }
    if (editor.length) {
      fileHasEditor = true;
      lines.push(`${indent}import ${typeKw}{ ${editor.join(', ')} } from '@entities/editor';\n`);
    }
    return lines.join('');
  });

  if (changed) {
    writeFileSync(file, next);
    stats.files++;
    stats.totalImports += fileImports;
    if (fileHasUi && fileHasEditor) stats.both++;
    else if (fileHasUi) stats.uiShellOnly++;
    else if (fileHasEditor) stats.editorOnly++;
  } else {
    console.error(`NO CHANGE in ${file}`);
  }
}

console.log(JSON.stringify(stats, null, 2));
