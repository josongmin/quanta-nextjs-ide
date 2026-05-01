// Standalone harness: scans `e2e/fixtures/next-app/app` and prints the
// `'use cache'` analyzer's findings. Useful for sanity-checking the analyzer
// outside the browser bundle.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const fixtureRoot = join(root, 'e2e', 'fixtures', 'next-app');
const appRoot = join(fixtureRoot, 'app');
const analyzerSrc = join(root, 'src', 'shared', 'analyzer', 'use-cache.ts');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const files = walk(appRoot).map((abs) => ({
  path: relative(fixtureRoot, abs),
  content: readFileSync(abs, 'utf8'),
}));

// Transpile the analyzer to ESM and write next to it so its `'ts-morph'`
// import resolves through the project's node_modules.
const analyzerTs = readFileSync(analyzerSrc, 'utf8');
const analyzerJs = ts.transpileModule(analyzerTs, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    esModuleInterop: true,
  },
}).outputText;

const tmpPath = join(dirname(analyzerSrc), '__use-cache.tmp.mjs');
writeFileSync(tmpPath, analyzerJs);
const mod = await import(pathToFileURL(tmpPath).href);

const report = mod.analyzeUseCache(files);

console.log(JSON.stringify(report, null, 2));
console.log('---');
const counts = report.findings.reduce((acc, f) => {
  acc[f.kind] = (acc[f.kind] ?? 0) + 1;
  return acc;
}, {});
console.log('counts:', counts, 'filesScanned:', report.filesScanned, 'durationMs:', report.durationMs);
