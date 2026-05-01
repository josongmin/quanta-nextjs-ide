export type Compatibility = 'yes' | 'cond' | 'no';

export const LICENSES: ReadonlyArray<string> = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'MPL-2.0',
  'LGPL-3.0',
  'GPL-3.0',
  'AGPL-3.0',
  'CC-BY-NC-4.0',
  'Unlicense',
  'EPL-2.0',
];

// matrix[lib][project] = compatibility
type Matrix = Readonly<Record<string, Readonly<Record<string, Compatibility>>>>;

const PERMISSIVE = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'Unlicense',
]);

function compat(lib: string, project: string): Compatibility {
  if (lib === project) return 'yes';
  if (PERMISSIVE.has(lib) && PERMISSIVE.has(project)) return 'yes';
  if (lib === 'CC-BY-NC-4.0') return 'no';
  if (lib === 'AGPL-3.0' && project !== 'AGPL-3.0') return 'no';
  if (lib === 'GPL-3.0') {
    if (project === 'GPL-3.0' || project === 'AGPL-3.0') return 'yes';
    if (project === 'LGPL-3.0') return 'cond';
    return 'no';
  }
  if (lib === 'LGPL-3.0') {
    if (PERMISSIVE.has(project)) return 'cond';
    return 'yes';
  }
  if (lib === 'MPL-2.0') {
    if (PERMISSIVE.has(project)) return 'cond';
    return 'yes';
  }
  if (lib === 'EPL-2.0') {
    if (PERMISSIVE.has(project)) return 'cond';
    return 'yes';
  }
  if (PERMISSIVE.has(lib)) return 'yes';
  return 'cond';
}

export const MATRIX: Matrix = LICENSES.reduce<Record<string, Record<string, Compatibility>>>(
  (acc, lib) => {
    acc[lib] = LICENSES.reduce<Record<string, Compatibility>>((row, proj) => {
      row[proj] = compat(lib, proj);
      return row;
    }, {});
    return acc;
  },
  {},
);

export const COMPAT_FILL: Record<Compatibility, string> = {
  yes: 'rgb(187 247 208)',
  cond: 'rgb(254 215 170)',
  no: 'rgb(254 202 202)',
};

export const COMPAT_LABEL: Record<Compatibility, string> = {
  yes: 'Compatible',
  cond: 'With conditions',
  no: 'Incompatible',
};

export const COMPAT_RULE: Record<Compatibility, string> = {
  yes: 'No additional obligations beyond attribution.',
  cond: 'Permitted with conditions: source disclosure, NOTICE, or distribution limits.',
  no: 'License terms conflict — distribution would violate the project license.',
};

export interface DepLicense {
  name: string;
  version: string;
  license: string;
  count: number;
}

const NAMES: ReadonlyArray<string> = [
  'next', 'react', 'react-dom', 'tailwindcss', 'sonner', '@radix-ui/react-dialog',
  'zustand', 'sharp', 'webpack', 'postcss', 'autoprefixer', 'scheduler',
  'lodash', 'glob', 'minimatch', 'semver', 'chalk', 'esbuild',
  'detective', 'color-name', 'ms', 'ffmpeg-installer', 'audio-codec', 'icon-pack-nc',
];

const ASSIGN: ReadonlyArray<string> = [
  'MIT', 'MIT', 'MIT', 'MIT', 'MIT', 'MIT',
  'MIT', 'Apache-2.0', 'MIT', 'MIT', 'MIT', 'MIT',
  'MIT', 'ISC', 'ISC', 'ISC', 'MIT', 'MIT',
  'MPL-2.0', 'MIT', 'MIT', 'LGPL-3.0', 'GPL-3.0', 'CC-BY-NC-4.0',
];

export const DEPENDENCIES: ReadonlyArray<DepLicense> = NAMES.map((n, i) => ({
  name: n,
  version: `${(i % 8) + 1}.${(i * 3) % 9}.${(i * 5) % 12}`,
  license: ASSIGN[i] ?? 'MIT',
  count: 1,
}));

export const REPLACEMENTS: Record<string, ReadonlyArray<string>> = {
  'CC-BY-NC-4.0': ['lucide-react', 'react-icons'],
  'GPL-3.0': ['fluent-ffmpeg', 'wavesurfer.js'],
  'AGPL-3.0': ['better-licensed-fork'],
  'LGPL-3.0': ['libsodium-wrappers'],
};

export function violatorsFor(
  project: string,
): ReadonlyArray<DepLicense & { compatibility: Compatibility }> {
  return DEPENDENCIES.map((d) => ({
    ...d,
    compatibility: MATRIX[d.license]?.[project] ?? 'cond',
  })).filter((d) => d.compatibility !== 'yes');
}
