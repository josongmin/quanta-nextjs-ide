export interface SbomPackage {
  id: string;
  name: string;
  version: string;
  supplier: string;
  license: string;
  sourceUrl: string;
  sizeKb: number;
  hash: string; // mock sha256
  introducedBy: string; // entry-point key
}

export const ENTRY_POINTS: ReadonlyArray<string> = [
  'app/layout.tsx',
  'middleware.ts',
  'app/api/route.ts',
  'next.config.js',
];

const SUPPLIERS: ReadonlyArray<string> = [
  'Vercel',
  'Meta',
  'Microsoft',
  'Tailwind Labs',
  'Radix',
  'OpenJS',
  'Community',
  'AWS',
];

const LICENSES: ReadonlyArray<string> = [
  'MIT',
  'Apache-2.0',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'MPL-2.0',
  'LGPL-3.0',
];

const NAMES: ReadonlyArray<string> = [
  'next', 'react', 'react-dom', 'tailwindcss', 'sonner', '@radix-ui/react-dialog',
  'zustand', 'sharp', 'styled-jsx', 'webpack', 'postcss', 'autoprefixer',
  'scheduler', 'tslib', 'lodash', 'glob', 'minimatch', 'semver',
  'color-name', 'chalk', 'ms', 'detective', 'esbuild', 'tsup',
  'typescript', 'eslint', 'prettier', 'rollup', 'vite', 'date-fns',
  'zod', 'yargs', 'commander', 'fs-extra', 'graceful-fs', 'rimraf',
  'cross-spawn', 'acorn', 'react-router', 'history', 'classnames', 'clsx',
  'fast-glob', 'micromatch', 'picomatch', 'fast-deep-equal', 'json5', 'jsonschema',
  'cheerio', 'mdx-js', 'remark', 'rehype', 'unified', 'unist-util-visit',
  'mdast-util-to-string', 'estree-walker', 'magic-string', '@swc/core', '@babel/core', 'browserslist',
];

function mockHash(seed: number): string {
  const hex = '0123456789abcdef';
  let out = '';
  let s = seed | 0;
  for (let i = 0; i < 16; i++) {
    s = (s * 1664525 + 1013904223) | 0;
    out += hex[(s >>> 4) & 0xf] ?? '0';
  }
  return `sha256:${out}…`;
}

function v(idx: number): string {
  return `${(idx % 9) + 1}.${(idx % 18) + 0}.${idx % 30}`;
}

export const SBOM_PACKAGES: ReadonlyArray<SbomPackage> = NAMES.slice(0, 60).map(
  (name, i) => ({
    id: `sbom_${i}`,
    name,
    version: v(i + 7),
    supplier: SUPPLIERS[i % SUPPLIERS.length] ?? 'Community',
    license: LICENSES[i % LICENSES.length] ?? 'MIT',
    sourceUrl: `https://registry.npmjs.org/${name}`,
    sizeKb: 8 + ((i * 17) % 420),
    hash: mockHash(i + 1),
    introducedBy: ENTRY_POINTS[i % ENTRY_POINTS.length] ?? ENTRY_POINTS[0] ?? 'app/layout.tsx',
  }),
);

export const ALL_LICENSES: ReadonlyArray<string> = Array.from(
  new Set(SBOM_PACKAGES.map((p) => p.license)),
);

export const ALL_SUPPLIERS: ReadonlyArray<string> = Array.from(
  new Set(SBOM_PACKAGES.map((p) => p.supplier)),
);

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

const LICENSE_COLORS: Record<string, string> = {
  MIT: 'rgb(56 189 248)',
  'Apache-2.0': 'rgb(34 197 94)',
  ISC: 'rgb(168 85 247)',
  'BSD-2-Clause': 'rgb(245 158 11)',
  'BSD-3-Clause': 'rgb(249 115 22)',
  '0BSD': 'rgb(99 102 241)',
  'MPL-2.0': 'rgb(236 72 153)',
  'LGPL-3.0': 'rgb(239 68 68)',
};

export function licenseBreakdown(
  pkgs: ReadonlyArray<SbomPackage>,
): ReadonlyArray<DonutSlice> {
  const counts = new Map<string, number>();
  for (const p of pkgs) counts.set(p.license, (counts.get(p.license) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      color: LICENSE_COLORS[label] ?? 'rgb(148 163 184)',
    }));
}

export function supplierCounts(
  pkgs: ReadonlyArray<SbomPackage>,
): ReadonlyArray<{ supplier: string; count: number }> {
  const m = new Map<string, number>();
  for (const p of pkgs) m.set(p.supplier, (m.get(p.supplier) ?? 0) + 1);
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([supplier, count]) => ({ supplier, count }));
}

export function dependencyPath(
  pkg: SbomPackage,
): ReadonlyArray<string> {
  // mock 3-5 hop chain ending at pkg name
  const depth = 3 + (pkg.id.length % 3);
  const chain: string[] = [pkg.introducedBy];
  for (let i = 1; i < depth; i++) {
    chain.push(`pkg-${(pkg.id.length + i) % NAMES.length}`);
  }
  chain.push(pkg.name);
  return chain;
}
