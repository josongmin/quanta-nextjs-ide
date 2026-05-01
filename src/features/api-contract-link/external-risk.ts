// External SDK risk scanner. Detects usage of well-known third-party SDKs
// and flags missing reliability safeguards (retry/timeout/rate-limit).

export type ExternalProvider =
  | 'stripe'
  | 'supabase'
  | 'firebase'
  | 'aws-s3'
  | 'twilio'
  | 'sendgrid'
  | 'openai'
  | 'anthropic'
  | 'resend';

export interface ExternalCallSite {
  file: string;
  line: number;
  snippet: string;
}

export interface ExternalSafeguards {
  hasRetry: boolean;
  hasTimeout: boolean;
  hasRateLimit: boolean;
}

export interface ExternalCallRisk {
  provider: ExternalProvider;
  callSites: ExternalCallSite[];
  safeguards: ExternalSafeguards;
  /** 0–100, higher is safer. */
  reliabilityScore: number;
  severity: 'low' | 'medium' | 'high';
  missing: string[];
}

interface SourceFile {
  file: string;
  source: string;
}

const PROVIDER_PATTERNS: Record<ExternalProvider, RegExp[]> = {
  stripe: [/\bnew\s+Stripe\(/, /from\s+['"]stripe['"]/, /stripe\.[a-z]+\.\w+\(/i],
  supabase: [/createClient\s*\(\s*['"]https?:\/\/[^'"]+\.supabase/, /from\s+['"]@supabase\/supabase-js['"]/, /supabase\.\w+\(/],
  firebase: [/from\s+['"]firebase\/[\w/-]+['"]/, /\binitializeApp\s*\(/],
  'aws-s3': [/from\s+['"]@aws-sdk\/client-s3['"]/, /\bnew\s+S3Client\(/, /\bnew\s+S3\(/],
  twilio: [/from\s+['"]twilio['"]/, /\btwilio\s*\(\s*['"]/],
  sendgrid: [/from\s+['"]@sendgrid\/(?:mail|client)['"]/, /sgMail\.\w+\(/],
  openai: [/from\s+['"]openai['"]/, /\bnew\s+OpenAI\(/],
  anthropic: [/from\s+['"]@anthropic-ai\/sdk['"]/, /\bnew\s+Anthropic\(/],
  resend: [/from\s+['"]resend['"]/, /\bnew\s+Resend\(/],
};

const RETRY_PATTERNS = [
  /\bp-retry\b/,
  /\bretry\(/,
  /\bmaxRetries\s*[:=]/,
  /for\s*\([^)]*attempt[^)]*\)/i,
  /while\s*\([^)]*retr/i,
];

const TIMEOUT_PATTERNS = [
  /\btimeout\s*[:=]/,
  /\bAbortSignal\.timeout\(/,
  /\bsetTimeout\(/,
  /\brequestTimeout\s*[:=]/,
];

const RATE_LIMIT_PATTERNS = [
  /\bp-limit\b/,
  /\bbottleneck\b/i,
  /\b@upstash\/ratelimit\b/,
  /\brateLimiter?\b/,
];

function lineOf(src: string, idx: number): number {
  let line = 1;
  for (let i = 0; i < idx; i++) if (src[i] === '\n') line++;
  return line;
}

function snippet(src: string, line: number): string {
  return (src.split('\n')[line - 1] ?? '').trim();
}

function detectProvider(
  files: SourceFile[],
  provider: ExternalProvider,
): ExternalCallSite[] {
  const sites: ExternalCallSite[] = [];
  const patterns = PROVIDER_PATTERNS[provider];
  for (const f of files) {
    for (const re of patterns) {
      const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
      let m: RegExpExecArray | null;
      while ((m = g.exec(f.source)) !== null) {
        const line = lineOf(f.source, m.index);
        sites.push({ file: f.file, line, snippet: snippet(f.source, line) });
      }
    }
  }
  // Dedupe by (file, line)
  const seen = new Set<string>();
  return sites.filter((s) => {
    const k = `${s.file}:${s.line}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function checkPatterns(source: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(source));
}

function computeRisk(
  provider: ExternalProvider,
  callSites: ExternalCallSite[],
  globalSource: string,
): ExternalCallRisk {
  const safeguards: ExternalSafeguards = {
    hasRetry: checkPatterns(globalSource, RETRY_PATTERNS),
    hasTimeout: checkPatterns(globalSource, TIMEOUT_PATTERNS),
    hasRateLimit: checkPatterns(globalSource, RATE_LIMIT_PATTERNS),
  };
  const missing: string[] = [];
  if (!safeguards.hasRetry) missing.push('retry');
  if (!safeguards.hasTimeout) missing.push('timeout');
  if (!safeguards.hasRateLimit) missing.push('rate-limit');

  const score = Math.round(
    100 -
      (missing.includes('retry') ? 35 : 0) -
      (missing.includes('timeout') ? 35 : 0) -
      (missing.includes('rate-limit') ? 20 : 0),
  );
  const severity: ExternalCallRisk['severity'] =
    score < 50 ? 'high' : score < 75 ? 'medium' : 'low';

  return {
    provider,
    callSites,
    safeguards,
    reliabilityScore: Math.max(0, Math.min(100, score)),
    severity,
    missing,
  };
}

export function scanExternalRisks(files: SourceFile[]): ExternalCallRisk[] {
  const allSource = files.map((f) => f.source).join('\n');
  const out: ExternalCallRisk[] = [];
  for (const provider of Object.keys(PROVIDER_PATTERNS) as ExternalProvider[]) {
    const sites = detectProvider(files, provider);
    if (sites.length === 0) continue;
    out.push(computeRisk(provider, sites, allSource));
  }
  return out;
}

export const PROVIDER_LABEL: Record<ExternalProvider, string> = {
  stripe: 'Stripe',
  supabase: 'Supabase',
  firebase: 'Firebase',
  'aws-s3': 'AWS S3',
  twilio: 'Twilio',
  sendgrid: 'SendGrid',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  resend: 'Resend',
};
