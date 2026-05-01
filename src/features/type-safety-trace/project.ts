/**
 * Lazy shared `ts-morph` Project for the Type Safety Trace feature.
 *
 * All four sub-features (Props Origin, Any Leakage, Unsafe Cast, Import
 * Cost) want to walk the user's TypeScript graph. Re-creating a Project
 * per scan is expensive (it parses every source file again), so we cache
 * a single instance and let callers add files on demand.
 *
 * The Project is created with NO filesystem access — every source must be
 * fed in explicitly via `addOrUpdateSource(path, text)`. This keeps the
 * analyzer working in the browser AND on the Tauri side without diverging
 * code paths.
 */

import { Project, ScriptKind, type SourceFile } from 'ts-morph';

let project: Project | null = null;
let booting: Promise<Project> | null = null;

function scriptKindFor(path: string): ScriptKind {
  if (path.endsWith('.tsx')) return ScriptKind.TSX;
  if (path.endsWith('.ts')) return ScriptKind.TS;
  if (path.endsWith('.jsx')) return ScriptKind.JSX;
  if (path.endsWith('.js')) return ScriptKind.JS;
  return ScriptKind.TS;
}

async function create(): Promise<Project> {
  if (project) return project;
  // ts-morph imports a fairly heavy compiler bundle; the lazy boot keeps
  // the editor's main bundle smaller until something actually opens the
  // Type Safety panel or hovers a JSX prop.
  project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      jsx: 4 /* React JSX */,
      target: 99 /* ESNext */,
      module: 99 /* ESNext */,
      moduleResolution: 100 /* Bundler */,
      strict: true,
      noEmit: true,
      allowJs: true,
      esModuleInterop: true,
      skipLibCheck: true,
      isolatedModules: true,
    },
  });
  return project;
}

/**
 * Returns the shared Project, lazily booting it on first call. Subsequent
 * calls reuse the same instance.
 */
export async function getSharedProject(): Promise<Project> {
  if (project) return project;
  if (!booting) booting = create();
  return booting;
}

/** Replace or insert a source file in the shared project. */
export async function addOrUpdateSource(path: string, text: string): Promise<SourceFile> {
  const p = await getSharedProject();
  const existing = p.getSourceFile(path);
  if (existing) {
    if (existing.getFullText() !== text) existing.replaceWithText(text);
    return existing;
  }
  return p.createSourceFile(path, text, {
    scriptKind: scriptKindFor(path),
    overwrite: true,
  });
}

/** Bulk-feed sources at boot time. */
export async function addOrUpdateSources(
  files: ReadonlyArray<{ path: string; text: string }>,
): Promise<void> {
  for (const f of files) {
    // eslint-disable-next-line no-await-in-loop
    await addOrUpdateSource(f.path, f.text);
  }
}

/** Test-only — drop the cached project so a fresh one is built next call. */
export function resetSharedProject(): void {
  project = null;
  booting = null;
}
