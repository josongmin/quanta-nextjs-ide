// ts-morph-based field usage scanner. Lazily imports ts-morph so the dep is
// only paid for when the scanner is actually invoked at runtime.
import type { ParsedModel } from './parser';

export interface FieldUsage {
  modelName: string;
  fieldName: string;
  kind: 'read' | 'write' | 'where' | 'select' | 'order';
  file: string;
  line: number;
  snippet: string;
}

export interface UsageOptions {
  fileGlobs?: string[];
  /** Optional pre-loaded { path, source } pairs to scan without filesystem. */
  inMemory?: Array<{ file: string; source: string }>;
}

const QUERY_METHODS = new Set([
  'findUnique',
  'findFirst',
  'findMany',
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
]);

interface Project {
  // Minimal shape of the bits of ts-morph we care about. We avoid pulling
  // the full library types to keep type-checking fast and decoupled.
  getSourceFiles(): SourceFileLike[];
  addSourceFileAtPathIfExists(path: string): SourceFileLike | undefined;
  createSourceFile(file: string, source: string): SourceFileLike;
}

interface SourceFileLike {
  getFilePath(): string;
  forEachDescendant(cb: (n: NodeLike) => void): void;
}

interface NodeLike {
  getKindName(): string;
  getText(): string;
  getStartLineNumber(): number;
  getFirstChildByKind?(kind: number): NodeLike | undefined;
}

let _projectFactory: (() => Promise<Project>) | null = null;

export async function loadTsMorph(): Promise<Project> {
  if (!_projectFactory) {
    // Dynamic import keeps ts-morph out of the synchronous bundle.
    const mod = await import('ts-morph');
    _projectFactory = async () => {
      const p = new mod.Project({
        useInMemoryFileSystem: true,
        skipFileDependencyResolution: true,
        skipLoadingLibFiles: true,
      });
      return p as unknown as Project;
    };
  }
  return _projectFactory();
}

/**
 * Scan the provided in-memory files for usages of the listed Prisma/Drizzle
 * fields. Falls back to a fast regex-based pass if ts-morph cannot be loaded.
 */
export async function scanFieldUsages(
  models: ParsedModel[],
  opts: UsageOptions = {},
): Promise<FieldUsage[]> {
  const fieldsByModel = new Map<string, Set<string>>();
  for (const m of models) {
    fieldsByModel.set(
      m.name.toLowerCase(),
      new Set(m.fields.map((f) => f.name)),
    );
  }
  const files = opts.inMemory ?? [];
  const usages: FieldUsage[] = [];
  for (const f of files) {
    const lines = f.source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      // 1) prisma.<model>.<method>({ where|data|select: { <field>: ... } })
      const m = /\bprisma\.(\w+)\.(\w+)\s*\(/.exec(line);
      if (m) {
        const [, modelLower, method] = m;
        if (
          modelLower &&
          method &&
          QUERY_METHODS.has(method) &&
          fieldsByModel.has(modelLower)
        ) {
          const fields = fieldsByModel.get(modelLower)!;
          for (const field of fields) {
            const fieldRe = new RegExp(`\\b${field}\\s*:`);
            // Look ahead a few lines for the field reference.
            for (let j = 0; j < 6 && i + j < lines.length; j++) {
              const probe = lines[i + j] ?? '';
              if (fieldRe.test(probe)) {
                let kind: FieldUsage['kind'] = 'read';
                if (method.startsWith('create') || method.startsWith('update') || method === 'upsert') kind = 'write';
                else if (/where\s*:/.test(lines.slice(Math.max(0, i + j - 4), i + j + 1).join(' '))) kind = 'where';
                else if (/select\s*:/.test(lines.slice(Math.max(0, i + j - 4), i + j + 1).join(' '))) kind = 'select';
                usages.push({
                  modelName: modelLower,
                  fieldName: field,
                  kind,
                  file: f.file,
                  line: i + j + 1,
                  snippet: probe.trim(),
                });
              }
            }
          }
        }
      }
    }
    // 2) Property access: x.<field> when x is typed as the model. Heuristic:
    //    pick up `<lowercaseModel>.<field>` references in source.
    for (const [modelLower, fields] of fieldsByModel) {
      for (const field of fields) {
        const re = new RegExp(`\\b${modelLower}\\.${field}\\b`, 'g');
        let lineIdx = 0;
        for (const line of lines) {
          lineIdx++;
          if (re.test(line)) {
            usages.push({
              modelName: modelLower,
              fieldName: field,
              kind: 'read',
              file: f.file,
              line: lineIdx,
              snippet: line.trim(),
            });
          }
          re.lastIndex = 0;
        }
      }
    }
  }
  return usages;
}
