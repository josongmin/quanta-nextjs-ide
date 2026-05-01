export type CspProfile = 'strict' | 'standard' | 'loose';

export interface CspSource {
  directive: 'img-src' | 'script-src' | 'connect-src' | 'style-src' | 'font-src' | 'frame-src';
  source: string;
  file?: string;
  line?: number;
  risk: 'safe' | 'review' | 'risky';
}

export const CSP_SOURCES: ReadonlyArray<CspSource> = [
  { directive: 'img-src', source: 'images.unsplash.com', file: 'app/page.tsx', line: 22, risk: 'safe' },
  { directive: 'img-src', source: 'cdn.example.com', file: 'components/ProductCard.tsx', line: 18, risk: 'safe' },
  { directive: 'img-src', source: 'data:', risk: 'review' },
  { directive: 'img-src', source: '*.gravatar.com', file: 'components/UserMenu.client.tsx', line: 12, risk: 'safe' },
  { directive: 'script-src', source: 'js.stripe.com', file: 'app/(shop)/checkout/page.tsx', line: 8, risk: 'safe' },
  { directive: 'script-src', source: 'www.googletagmanager.com', file: 'app/layout.tsx', line: 14, risk: 'review' },
  { directive: 'script-src', source: 'plausible.io', file: 'app/layout.tsx', line: 18, risk: 'safe' },
  { directive: 'connect-src', source: 'api.stripe.com', file: 'lib/stripe.ts', line: 4, risk: 'safe' },
  { directive: 'connect-src', source: 'sentry.io', file: 'instrumentation.ts', line: 6, risk: 'safe' },
  { directive: 'connect-src', source: '*.supabase.co', file: 'lib/db.ts', line: 2, risk: 'safe' },
  { directive: 'style-src', source: "'unsafe-inline'", risk: 'risky' },
  { directive: 'font-src', source: 'fonts.gstatic.com', file: 'app/layout.tsx', line: 4, risk: 'safe' },
  { directive: 'frame-src', source: 'js.stripe.com', risk: 'safe' },
  { directive: 'frame-src', source: 'www.youtube.com', file: 'app/blog/[slug]/page.tsx', line: 22, risk: 'review' },
];

export const INLINE_SCRIPTS: ReadonlyArray<{ file: string; line: number; hash: string; suggestion: string }> = [
  {
    file: 'app/layout.tsx',
    line: 28,
    hash: "'sha256-XK1+...d='",
    suggestion: "Add hash to script-src or move to external file",
  },
];

export function generateCspHeader(
  sources: ReadonlyArray<CspSource>,
  profile: CspProfile,
): string {
  const grouped = new Map<CspSource['directive'], string[]>();
  for (const s of sources) {
    if (profile === 'strict' && s.risk === 'risky') continue;
    if (profile === 'standard' && s.risk === 'risky') continue;
    const arr = grouped.get(s.directive) ?? [];
    if (!arr.includes(s.source)) arr.push(s.source);
    grouped.set(s.directive, arr);
  }
  const parts: string[] = [
    "default-src 'self'",
  ];
  if (profile === 'strict') parts.push("base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'");
  for (const [dir, list] of grouped) {
    parts.push(`${dir} 'self' ${list.join(' ')}`);
  }
  if (profile === 'loose') parts.push("style-src 'self' 'unsafe-inline'");
  parts.push("upgrade-insecure-requests");
  return parts.join('; ');
}
