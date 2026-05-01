export type Provenance = 'signed' | 'unsigned' | 'unknown';

export interface SupplyPackage {
  id: string;
  name: string;
  version: string;
  provenance: Provenance;
  maintainerCount: number;
  weeklyDownloads: number;
  advisories: ReadonlyArray<{ id: string; severity: 'low' | 'med' | 'high' | 'crit' }>;
  license: string;
  parents: ReadonlyArray<string>;
  hop: number; // 0 = app, 1 = direct, 2+ = transitive
}

export interface SupplyEdge {
  from: string;
  to: string;
}

const RAW: ReadonlyArray<{
  id: string;
  name: string;
  version: string;
  provenance: Provenance;
  maintainerCount: number;
  weeklyDownloads: number;
  advisories: number;
  license: string;
  hop: number;
  parents: ReadonlyArray<string>;
}> = [
  { id: 'app', name: '@app/root', version: '1.0.0', provenance: 'signed', maintainerCount: 4, weeklyDownloads: 0, advisories: 0, license: 'UNLICENSED', hop: 0, parents: [] },
  { id: 'next', name: 'next', version: '14.2.5', provenance: 'signed', maintainerCount: 24, weeklyDownloads: 6_500_000, advisories: 1, license: 'MIT', hop: 1, parents: ['app'] },
  { id: 'react', name: 'react', version: '18.3.1', provenance: 'signed', maintainerCount: 18, weeklyDownloads: 22_000_000, advisories: 0, license: 'MIT', hop: 1, parents: ['app'] },
  { id: 'react-dom', name: 'react-dom', version: '18.3.1', provenance: 'signed', maintainerCount: 18, weeklyDownloads: 21_000_000, advisories: 0, license: 'MIT', hop: 1, parents: ['app'] },
  { id: 'tailwind', name: 'tailwindcss', version: '3.4.4', provenance: 'signed', maintainerCount: 8, weeklyDownloads: 9_000_000, advisories: 0, license: 'MIT', hop: 1, parents: ['app'] },
  { id: 'sonner', name: 'sonner', version: '1.5.0', provenance: 'unsigned', maintainerCount: 1, weeklyDownloads: 800_000, advisories: 0, license: 'MIT', hop: 1, parents: ['app'] },
  { id: 'radix', name: '@radix-ui/react-dialog', version: '1.0.5', provenance: 'signed', maintainerCount: 6, weeklyDownloads: 3_000_000, advisories: 0, license: 'MIT', hop: 1, parents: ['app'] },
  { id: 'zustand', name: 'zustand', version: '4.5.2', provenance: 'signed', maintainerCount: 3, weeklyDownloads: 4_200_000, advisories: 0, license: 'MIT', hop: 1, parents: ['app'] },
  { id: 'sharp', name: 'sharp', version: '0.33.4', provenance: 'unsigned', maintainerCount: 2, weeklyDownloads: 4_700_000, advisories: 1, license: 'Apache-2.0', hop: 2, parents: ['next'] },
  { id: 'styled-jsx', name: 'styled-jsx', version: '5.1.1', provenance: 'signed', maintainerCount: 4, weeklyDownloads: 6_400_000, advisories: 0, license: 'MIT', hop: 2, parents: ['next'] },
  { id: 'webpack', name: 'webpack', version: '5.92.1', provenance: 'signed', maintainerCount: 14, weeklyDownloads: 27_000_000, advisories: 1, license: 'MIT', hop: 2, parents: ['next'] },
  { id: 'postcss', name: 'postcss', version: '8.4.39', provenance: 'signed', maintainerCount: 7, weeklyDownloads: 65_000_000, advisories: 0, license: 'MIT', hop: 2, parents: ['next', 'tailwind'] },
  { id: 'autoprefixer', name: 'autoprefixer', version: '10.4.19', provenance: 'signed', maintainerCount: 3, weeklyDownloads: 30_000_000, advisories: 0, license: 'MIT', hop: 2, parents: ['tailwind'] },
  { id: 'scheduler', name: 'scheduler', version: '0.23.0', provenance: 'signed', maintainerCount: 12, weeklyDownloads: 21_000_000, advisories: 0, license: 'MIT', hop: 2, parents: ['react', 'react-dom'] },
  { id: 'tslib', name: 'tslib', version: '2.6.3', provenance: 'signed', maintainerCount: 9, weeklyDownloads: 75_000_000, advisories: 0, license: '0BSD', hop: 2, parents: ['radix', 'zustand'] },
  { id: 'lodash', name: 'lodash', version: '4.17.21', provenance: 'unsigned', maintainerCount: 1, weeklyDownloads: 50_000_000, advisories: 1, license: 'MIT', hop: 3, parents: ['webpack'] },
  { id: 'glob', name: 'glob', version: '10.4.2', provenance: 'signed', maintainerCount: 5, weeklyDownloads: 100_000_000, advisories: 0, license: 'ISC', hop: 3, parents: ['webpack', 'next'] },
  { id: 'minimatch', name: 'minimatch', version: '9.0.5', provenance: 'signed', maintainerCount: 5, weeklyDownloads: 110_000_000, advisories: 0, license: 'ISC', hop: 3, parents: ['glob'] },
  { id: 'semver', name: 'semver', version: '7.6.2', provenance: 'signed', maintainerCount: 6, weeklyDownloads: 220_000_000, advisories: 0, license: 'ISC', hop: 3, parents: ['next', 'sharp'] },
  { id: 'color-name', name: 'color-name', version: '1.1.4', provenance: 'unknown', maintainerCount: 1, weeklyDownloads: 95_000_000, advisories: 0, license: 'MIT', hop: 3, parents: ['tailwind'] },
  { id: 'chalk', name: 'chalk', version: '5.3.0', provenance: 'signed', maintainerCount: 3, weeklyDownloads: 250_000_000, advisories: 0, license: 'MIT', hop: 2, parents: ['next'] },
  { id: 'ms', name: 'ms', version: '2.1.3', provenance: 'unknown', maintainerCount: 1, weeklyDownloads: 200_000_000, advisories: 0, license: 'MIT', hop: 3, parents: ['webpack'] },
  { id: 'detective', name: 'detective', version: '5.2.1', provenance: 'unsigned', maintainerCount: 1, weeklyDownloads: 1_500_000, advisories: 1, license: 'MIT', hop: 3, parents: ['webpack'] },
  { id: 'esbuild', name: 'esbuild', version: '0.21.5', provenance: 'signed', maintainerCount: 4, weeklyDownloads: 30_000_000, advisories: 0, license: 'MIT', hop: 2, parents: ['next'] },
];

export const SUPPLY_PACKAGES: ReadonlyArray<SupplyPackage> = RAW.map((r) => ({
  id: r.id,
  name: r.name,
  version: r.version,
  provenance: r.provenance,
  maintainerCount: r.maintainerCount,
  weeklyDownloads: r.weeklyDownloads,
  license: r.license,
  hop: r.hop,
  parents: r.parents,
  advisories: Array.from({ length: r.advisories }).map((_, i) => ({
    id: `GHSA-${r.id.slice(0, 4)}-${1000 + i}`,
    severity: (['med', 'high', 'crit'] as const)[i % 3] ?? 'med',
  })),
}));

export const SUPPLY_EDGES: ReadonlyArray<SupplyEdge> = SUPPLY_PACKAGES.flatMap(
  (p) => p.parents.map((from) => ({ from, to: p.id })),
);

export const PROVENANCE_FILL: Record<Provenance, string> = {
  signed: 'rgb(34 197 94)',
  unsigned: 'rgb(245 158 11)',
  unknown: 'rgb(239 68 68)',
};

export const PROVENANCE_TONE: Record<
  Provenance,
  'static' | 'warn' | 'err'
> = {
  signed: 'static',
  unsigned: 'warn',
  unknown: 'err',
};

export function radiusFor(downloads: number): number {
  // log scale; map roughly 1k..300M -> 6..22
  const log = Math.log10(Math.max(1, downloads + 1));
  const r = 5 + (log - 3) * 3.2;
  return Math.max(6, Math.min(22, r));
}
