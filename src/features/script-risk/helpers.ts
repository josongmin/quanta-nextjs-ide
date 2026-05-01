export type ScriptCategory = 'analytics' | 'payment' | 'tag-manager' | 'chat' | 'misc';
export type Strategy = 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' | 'worker';

export interface ScriptUsage {
  id: string;
  src: string;
  category: ScriptCategory;
  file: string;
  line: number;
  strategy: Strategy;
  consentRequired: boolean;
  lcpDelta: number; // ms estimate
  loadsOnAllRoutes: boolean;
  hasSri: boolean;
}

export const MOCK_SCRIPTS: ReadonlyArray<ScriptUsage> = [
  {
    id: 's_gtm',
    src: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
    category: 'tag-manager',
    file: 'app/layout.tsx',
    line: 14,
    strategy: 'beforeInteractive',
    consentRequired: true,
    lcpDelta: 320,
    loadsOnAllRoutes: true,
    hasSri: false,
  },
  {
    id: 's_stripe',
    src: 'https://js.stripe.com/v3',
    category: 'payment',
    file: 'app/(shop)/checkout/page.tsx',
    line: 8,
    strategy: 'lazyOnload',
    consentRequired: false,
    lcpDelta: 40,
    loadsOnAllRoutes: false,
    hasSri: false,
  },
  {
    id: 's_plausible',
    src: 'https://plausible.io/js/script.js',
    category: 'analytics',
    file: 'app/layout.tsx',
    line: 18,
    strategy: 'afterInteractive',
    consentRequired: false,
    lcpDelta: 30,
    loadsOnAllRoutes: true,
    hasSri: true,
  },
  {
    id: 's_intercom',
    src: 'https://widget.intercom.io/widget/abc123',
    category: 'chat',
    file: 'components/AppShell.tsx',
    line: 32,
    strategy: 'afterInteractive',
    consentRequired: true,
    lcpDelta: 180,
    loadsOnAllRoutes: true,
    hasSri: false,
  },
  {
    id: 's_sentry',
    src: 'https://browser.sentry-cdn.com/7.x/bundle.tracing.min.js',
    category: 'misc',
    file: 'app/layout.tsx',
    line: 22,
    strategy: 'afterInteractive',
    consentRequired: false,
    lcpDelta: 80,
    loadsOnAllRoutes: true,
    hasSri: true,
  },
  {
    id: 's_recaptcha',
    src: 'https://www.google.com/recaptcha/api.js',
    category: 'misc',
    file: 'app/(auth)/register/page.tsx',
    line: 10,
    strategy: 'beforeInteractive',
    consentRequired: false,
    lcpDelta: 240,
    loadsOnAllRoutes: false,
    hasSri: false,
  },
];

export function analyzeScript(s: ScriptUsage): string[] {
  const risks: string[] = [];
  if (s.strategy === 'beforeInteractive' && s.lcpDelta > 100) risks.push('blocking LCP');
  if (!s.hasSri) risks.push('no SRI');
  if (s.consentRequired && s.strategy !== 'lazyOnload') risks.push('runs before consent');
  if (s.loadsOnAllRoutes && s.category !== 'analytics' && s.category !== 'tag-manager')
    risks.push('loads on every route');
  if (s.lcpDelta > 250) risks.push('heavy LCP cost');
  return risks;
}
