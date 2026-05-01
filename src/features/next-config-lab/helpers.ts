export type ConfigCategory =
  | 'Build'
  | 'Runtime'
  | 'Image'
  | 'Cache'
  | 'Experimental'
  | 'Logging';

export type ConfigKind = 'bool' | 'number' | 'enum' | 'string' | 'object';

export type ImpactTone = 'static' | 'warn' | 'info' | 'err' | 'accent' | 'neutral';

export interface ImpactChip {
  label: string;
  tone: ImpactTone;
}

export interface ConfigOption {
  id: string;
  key: string;
  kind: ConfigKind;
  defaultValue: string | number | boolean;
  options?: ReadonlyArray<string>;
  description: string;
  category: ConfigCategory;
  impact(value: string | number | boolean): ReadonlyArray<ImpactChip>;
}

function impactBool(
  trueChips: ReadonlyArray<ImpactChip>,
  falseChips: ReadonlyArray<ImpactChip>,
) {
  return (v: string | number | boolean): ReadonlyArray<ImpactChip> =>
    v === true ? trueChips : falseChips;
}

function impactStatic(chips: ReadonlyArray<ImpactChip>) {
  return (): ReadonlyArray<ImpactChip> => chips;
}

export const CONFIG_OPTIONS: ReadonlyArray<ConfigOption> = [
  {
    id: 'reactStrictMode',
    key: 'reactStrictMode',
    kind: 'bool',
    defaultValue: true,
    description: 'Enables React Strict Mode (double-invokes effects in dev).',
    category: 'Build',
    impact: impactBool(
      [
        { label: '+0 KB', tone: 'static' },
        { label: 'effect double-invoke in dev', tone: 'warn' },
      ],
      [{ label: 'masks render bugs', tone: 'warn' }],
    ),
  },
  {
    id: 'swcMinify',
    key: 'swcMinify',
    kind: 'bool',
    defaultValue: true,
    description: 'Use SWC for minification instead of Terser.',
    category: 'Build',
    impact: impactBool(
      [
        { label: '~30% faster build', tone: 'static' },
        { label: '−5 KB avg gzip', tone: 'static' },
      ],
      [{ label: 'slower CI', tone: 'warn' }],
    ),
  },
  {
    id: 'productionBrowserSourceMaps',
    key: 'productionBrowserSourceMaps',
    kind: 'bool',
    defaultValue: false,
    description: 'Emit browser source maps in production output.',
    category: 'Build',
    impact: impactBool(
      [
        { label: '+~2 MB total', tone: 'warn' },
        { label: 'better Sentry traces', tone: 'info' },
      ],
      [{ label: 'no impact', tone: 'neutral' }],
    ),
  },
  {
    id: 'output',
    key: 'output',
    kind: 'enum',
    defaultValue: 'standalone',
    options: ['default', 'standalone', 'export'],
    description: 'Build output mode for deploy target.',
    category: 'Build',
    impact: (v) => {
      if (v === 'standalone')
        return [
          { label: 'Docker-ready', tone: 'static' },
          { label: 'self-contained', tone: 'info' },
        ];
      if (v === 'export')
        return [
          { label: 'static-only', tone: 'warn' },
          { label: 'no SSR / RSC', tone: 'err' },
        ];
      return [{ label: 'platform default', tone: 'neutral' }];
    },
  },
  {
    id: 'poweredByHeader',
    key: 'poweredByHeader',
    kind: 'bool',
    defaultValue: true,
    description: 'Send the X-Powered-By header.',
    category: 'Runtime',
    impact: impactBool(
      [{ label: 'minor info leak', tone: 'warn' }],
      [{ label: 'recommended', tone: 'static' }],
    ),
  },
  {
    id: 'compress',
    key: 'compress',
    kind: 'bool',
    defaultValue: true,
    description: 'gzip-compress responses from the Node server.',
    category: 'Runtime',
    impact: impactBool(
      [{ label: '~70% smaller HTML', tone: 'static' }],
      [{ label: 'rely on edge proxy', tone: 'info' }],
    ),
  },
  {
    id: 'trailingSlash',
    key: 'trailingSlash',
    kind: 'bool',
    defaultValue: false,
    description: 'Force trailing slash on all routes.',
    category: 'Runtime',
    impact: impactBool(
      [{ label: 'breaking change', tone: 'err' }, { label: 'redirects added', tone: 'warn' }],
      [{ label: 'standard', tone: 'neutral' }],
    ),
  },
  {
    id: 'basePath',
    key: 'basePath',
    kind: 'string',
    defaultValue: '',
    description: 'Mount the app under a sub-path.',
    category: 'Runtime',
    impact: (v) =>
      typeof v === 'string' && v.length > 0
        ? [
            { label: 'sub-path mount', tone: 'info' },
            { label: 'all <Link> rewritten', tone: 'warn' },
          ]
        : [{ label: 'root mount', tone: 'neutral' }],
  },
  {
    id: 'assetPrefix',
    key: 'assetPrefix',
    kind: 'string',
    defaultValue: '',
    description: 'Prefix for static asset URLs (CDN).',
    category: 'Runtime',
    impact: (v) =>
      typeof v === 'string' && v.length > 0
        ? [{ label: 'CDN-served', tone: 'static' }]
        : [{ label: 'same-origin', tone: 'neutral' }],
  },
  {
    id: 'images.formats',
    key: 'images.formats',
    kind: 'enum',
    defaultValue: 'avif+webp',
    options: ['webp', 'avif+webp', 'all'],
    description: 'Output formats for next/image optimization.',
    category: 'Image',
    impact: (v) =>
      v === 'avif+webp'
        ? [
            { label: '−25% bytes vs webp', tone: 'static' },
            { label: '+CPU at edge', tone: 'warn' },
          ]
        : v === 'all'
          ? [{ label: 'broadest support', tone: 'info' }]
          : [{ label: 'baseline', tone: 'neutral' }],
  },
  {
    id: 'images.minimumCacheTTL',
    key: 'images.minimumCacheTTL',
    kind: 'number',
    defaultValue: 60,
    description: 'Minimum cache TTL (seconds) for optimized images.',
    category: 'Image',
    impact: (v) => {
      const n = typeof v === 'number' ? v : Number(v);
      if (n >= 86400) return [{ label: '24h+ cache', tone: 'static' }];
      if (n >= 3600) return [{ label: '1h+ cache', tone: 'info' }];
      return [{ label: 'frequent re-optimize', tone: 'warn' }];
    },
  },
  {
    id: 'images.dangerouslyAllowSVG',
    key: 'images.dangerouslyAllowSVG',
    kind: 'bool',
    defaultValue: false,
    description: 'Allow <Image> to render SVG (XSS risk).',
    category: 'Image',
    impact: impactBool(
      [{ label: 'XSS risk', tone: 'err' }],
      [{ label: 'safe default', tone: 'static' }],
    ),
  },
  {
    id: 'images.unoptimized',
    key: 'images.unoptimized',
    kind: 'bool',
    defaultValue: false,
    description: 'Disable next/image optimization globally.',
    category: 'Image',
    impact: impactBool(
      [{ label: 'no optimization', tone: 'warn' }, { label: '+~1.2 MB LCP', tone: 'err' }],
      [{ label: 'optimized', tone: 'static' }],
    ),
  },
  {
    id: 'staleTimes.dynamic',
    key: 'experimental.staleTimes.dynamic',
    kind: 'number',
    defaultValue: 30,
    description: 'Client-side cache TTL for dynamic segments.',
    category: 'Cache',
    impact: (v) => {
      const n = typeof v === 'number' ? v : Number(v);
      return n > 0
        ? [{ label: `${n}s soft cache`, tone: 'info' }]
        : [{ label: 'no client cache', tone: 'warn' }];
    },
  },
  {
    id: 'staleTimes.static',
    key: 'experimental.staleTimes.static',
    kind: 'number',
    defaultValue: 300,
    description: 'Client-side cache TTL for static segments.',
    category: 'Cache',
    impact: (v) => {
      const n = typeof v === 'number' ? v : Number(v);
      return [{ label: `${n}s router cache`, tone: 'info' }];
    },
  },
  {
    id: 'cacheHandler',
    key: 'cacheHandler',
    kind: 'string',
    defaultValue: '',
    description: 'Custom cache handler module path (Redis, etc.).',
    category: 'Cache',
    impact: (v) =>
      typeof v === 'string' && v.length > 0
        ? [{ label: 'remote cache', tone: 'static' }, { label: 'multi-instance safe', tone: 'info' }]
        : [{ label: 'in-memory only', tone: 'warn' }],
  },
  {
    id: 'experimental.ppr',
    key: 'experimental.ppr',
    kind: 'enum',
    defaultValue: 'incremental',
    options: ['off', 'incremental', 'on'],
    description: 'Partial Prerendering (PPR) mode.',
    category: 'Experimental',
    impact: (v) =>
      v === 'on'
        ? [{ label: 'breaking change', tone: 'err' }, { label: 'all routes shelled', tone: 'warn' }]
        : v === 'incremental'
          ? [{ label: 'opt-in per route', tone: 'info' }]
          : [{ label: 'disabled', tone: 'neutral' }],
  },
  {
    id: 'experimental.serverActions',
    key: 'experimental.serverActions',
    kind: 'bool',
    defaultValue: true,
    description: 'Enable Server Actions.',
    category: 'Experimental',
    impact: impactBool(
      [{ label: '+~3 KB runtime', tone: 'warn' }, { label: 'mutation API', tone: 'static' }],
      [{ label: 'no mutations', tone: 'neutral' }],
    ),
  },
  {
    id: 'experimental.typedRoutes',
    key: 'experimental.typedRoutes',
    kind: 'bool',
    defaultValue: false,
    description: 'Generate typed Link href definitions.',
    category: 'Experimental',
    impact: impactBool(
      [{ label: 'typed <Link>', tone: 'static' }, { label: 'dev-only', tone: 'info' }],
      [{ label: 'string hrefs', tone: 'neutral' }],
    ),
  },
  {
    id: 'experimental.optimizePackageImports',
    key: 'experimental.optimizePackageImports',
    kind: 'object',
    defaultValue: '[]',
    description: 'Modular import optimization for big libs.',
    category: 'Experimental',
    impact: (v) => {
      const s = String(v);
      if (s.length > 2)
        return [
          { label: '−10–40 KB bundle', tone: 'static' },
          { label: 'tree-shake assist', tone: 'info' },
        ];
      return [{ label: 'no optimization', tone: 'neutral' }];
    },
  },
  {
    id: 'logging.fetches.fullUrl',
    key: 'logging.fetches.fullUrl',
    kind: 'bool',
    defaultValue: false,
    description: 'Log full fetch URLs in dev console.',
    category: 'Logging',
    impact: impactBool(
      [{ label: 'verbose dev logs', tone: 'info' }, { label: 'dev-only', tone: 'static' }],
      [{ label: 'minimal logs', tone: 'neutral' }],
    ),
  },
  {
    id: 'logging.level',
    key: 'logging.level',
    kind: 'enum',
    defaultValue: 'warn',
    options: ['silent', 'warn', 'info', 'verbose'],
    description: 'Server-side log verbosity.',
    category: 'Logging',
    impact: (v) =>
      v === 'silent'
        ? [{ label: 'logs hidden', tone: 'warn' }]
        : v === 'verbose'
          ? [{ label: 'noisy', tone: 'warn' }, { label: '+disk', tone: 'info' }]
          : [{ label: 'default', tone: 'neutral' }],
  },
  {
    id: 'devIndicators.buildActivity',
    key: 'devIndicators.buildActivity',
    kind: 'bool',
    defaultValue: true,
    description: 'Show build activity indicator in dev.',
    category: 'Logging',
    impact: impactBool(
      [{ label: 'dev-only HUD', tone: 'static' }],
      [{ label: 'no HUD', tone: 'neutral' }],
    ),
  },
  {
    id: 'eslint.ignoreDuringBuilds',
    key: 'eslint.ignoreDuringBuilds',
    kind: 'bool',
    defaultValue: false,
    description: 'Skip ESLint during next build.',
    category: 'Build',
    impact: impactStatic([
      { label: 'breaking change', tone: 'err' },
      { label: 'CI risk', tone: 'warn' },
    ]),
  },
];

export const CATEGORIES: ReadonlyArray<ConfigCategory> = [
  'Build',
  'Runtime',
  'Image',
  'Cache',
  'Experimental',
  'Logging',
];

export interface PresetBundle {
  id: string;
  label: string;
  description: string;
  overrides: Record<string, string | number | boolean>;
}

export const PRESETS: ReadonlyArray<PresetBundle> = [
  {
    id: 'production-grade',
    label: 'Production-grade',
    description: 'Hardened defaults for stable shipping.',
    overrides: {
      poweredByHeader: false,
      compress: true,
      'images.minimumCacheTTL': 86400,
      'experimental.ppr': 'incremental',
    },
  },
  {
    id: 'edge-friendly',
    label: 'Edge-friendly',
    description: 'Trim bundle and lean on the platform CDN.',
    overrides: {
      output: 'standalone',
      'images.formats': 'avif+webp',
      compress: false,
      'experimental.optimizePackageImports': '["lodash","date-fns","lucide-react"]',
    },
  },
  {
    id: 'dx-first',
    label: 'DX-first',
    description: 'Maximum developer feedback in dev mode.',
    overrides: {
      'experimental.typedRoutes': true,
      'logging.fetches.fullUrl': true,
      'logging.level': 'verbose',
      reactStrictMode: true,
    },
  },
];

export function formatValue(v: string | number | boolean): string {
  if (typeof v === 'string') {
    if (v.startsWith('[') || v.startsWith('{')) return v;
    return `'${v}'`;
  }
  return String(v);
}

interface DotNode {
  [k: string]: string | number | boolean | DotNode;
}

export function buildConfigSnippet(
  overrides: Record<string, string | number | boolean>,
): string {
  const root: DotNode = {};
  for (const [key, val] of Object.entries(overrides)) {
    const parts = key.split('.');
    let cur: DotNode = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const p = parts[i];
      if (!p) continue;
      const existing = cur[p];
      if (typeof existing !== 'object' || existing === null) {
        const next: DotNode = {};
        cur[p] = next;
        cur = next;
      } else {
        cur = existing;
      }
    }
    const leaf = parts[parts.length - 1];
    if (leaf) cur[leaf] = val;
  }

  const render = (node: DotNode, indent: number): string => {
    const pad = '  '.repeat(indent);
    const lines: string[] = [];
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'object' && v !== null) {
        lines.push(`${pad}${k}: {`);
        lines.push(render(v, indent + 1));
        lines.push(`${pad}},`);
      } else {
        lines.push(`${pad}${k}: ${formatValue(v)},`);
      }
    }
    return lines.join('\n');
  };

  if (Object.keys(root).length === 0) {
    return `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n`;
  }

  return `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {\n${render(root, 1)}\n};\n\nexport default nextConfig;\n`;
}

export function findOptionByKey(key: string): ConfigOption | undefined {
  return CONFIG_OPTIONS.find((o) => o.key === key);
}
