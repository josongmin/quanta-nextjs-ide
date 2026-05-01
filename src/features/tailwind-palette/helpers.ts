export interface ColorToken {
  name: string;
  cssVar: string;
  group: 'surface' | 'border' | 'text' | 'accent' | 'severity' | 'semantic';
  usages: number;
}

export interface SpacingToken {
  name: string;
  px: number;
  usages: number;
}

export interface RadiusToken {
  name: string;
  px: number;
  usages: number;
}

export interface ShadowToken {
  name: string;
  className: string;
  usages: number;
}

export interface TypographyToken {
  name: string;
  px: number;
  lineHeightPx: number;
  usages: number;
  sample: string;
}

export interface TokenViolations {
  rawColors: number;
  rawSpacing: number;
  rawRadius: number;
  rawShadow: number;
  rawTypography: number;
}

// Mirrors tailwind.config.ts and src/app/styles/tokens.css.
export const colorTokens: readonly ColorToken[] = [
  { name: 'bg', cssVar: 'bg', group: 'surface', usages: 412 },
  { name: 'bg-subtle', cssVar: 'bg-subtle', group: 'surface', usages: 188 },
  { name: 'bg-hover', cssVar: 'bg-hover', group: 'surface', usages: 96 },
  { name: 'bg-selected', cssVar: 'bg-selected', group: 'surface', usages: 38 },
  { name: 'bg-active', cssVar: 'bg-active', group: 'surface', usages: 12 },
  { name: 'border', cssVar: 'border', group: 'border', usages: 322 },
  { name: 'border-strong', cssVar: 'border-strong', group: 'border', usages: 18 },
  { name: 'border-faint', cssVar: 'border-faint', group: 'border', usages: 7 },
  { name: 'text', cssVar: 'text', group: 'text', usages: 246 },
  { name: 'text-2', cssVar: 'text-2', group: 'text', usages: 144 },
  { name: 'text-3', cssVar: 'text-3', group: 'text', usages: 287 },
  { name: 'accent', cssVar: 'accent', group: 'accent', usages: 64 },
  { name: 'accent-soft', cssVar: 'accent-soft', group: 'accent', usages: 22 },
  { name: 'sev-err', cssVar: 'err', group: 'severity', usages: 38 },
  { name: 'sev-warn', cssVar: 'warn', group: 'severity', usages: 71 },
  { name: 'sev-info', cssVar: 'info', group: 'severity', usages: 18 },
  { name: 'sev-hint', cssVar: 'hint', group: 'severity', usages: 9 },
  { name: 'sem-static', cssVar: 'sem-static', group: 'semantic', usages: 26 },
  { name: 'sem-isr', cssVar: 'sem-isr', group: 'semantic', usages: 14 },
  { name: 'sem-dynamic', cssVar: 'sem-dynamic', group: 'semantic', usages: 19 },
  { name: 'sem-edge', cssVar: 'sem-edge', group: 'semantic', usages: 5 },
  { name: 'sem-client', cssVar: 'sem-client', group: 'semantic', usages: 27 },
  { name: 'sem-server', cssVar: 'sem-server', group: 'semantic', usages: 23 },
];

export const spacingTokens: readonly SpacingToken[] = [
  { name: '1', px: 4, usages: 211 },
  { name: '2', px: 8, usages: 388 },
  { name: '3', px: 12, usages: 162 },
  { name: '4', px: 16, usages: 96 },
  { name: '6', px: 24, usages: 41 },
  { name: '8', px: 32, usages: 18 },
  { name: '12', px: 48, usages: 7 },
];

export const radiusTokens: readonly RadiusToken[] = [
  { name: 'none', px: 0, usages: 4 },
  { name: 'xs', px: 2, usages: 18 },
  { name: 'sm', px: 3, usages: 312 },
  { name: 'DEFAULT', px: 4, usages: 28 },
  { name: 'md', px: 6, usages: 9 },
  { name: 'lg', px: 8, usages: 3 },
];

export const shadowTokens: readonly ShadowToken[] = [
  { name: 'pop', className: 'shadow-pop', usages: 14 },
  { name: 'focus', className: 'shadow-focus', usages: 7 },
];

export const typographyTokens: readonly TypographyToken[] = [
  { name: '2xs', px: 10, lineHeightPx: 14, usages: 88, sample: 'caption text' },
  { name: 'xs', px: 11, lineHeightPx: 16, usages: 312, sample: 'meta and chip text' },
  { name: 'sm', px: 12, lineHeightPx: 16, usages: 412, sample: 'body — dense lists' },
  { name: 'base', px: 13, lineHeightPx: 20, usages: 132, sample: 'default UI body' },
  { name: 'md', px: 14, lineHeightPx: 20, usages: 64, sample: 'panel titles' },
  { name: 'lg', px: 16, lineHeightPx: 24, usages: 12, sample: 'overlay headers' },
];

export const violations: TokenViolations = {
  rawColors: 3,
  rawSpacing: 5,
  rawRadius: 1,
  rawShadow: 2,
  rawTypography: 0,
};

export type PaletteTab = 'color' | 'spacing' | 'radius' | 'shadow' | 'typography';
