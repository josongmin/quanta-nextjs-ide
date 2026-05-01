export type VarType = 'string' | 'number' | 'enum' | 'json' | 'text';
export type ModelId = 'opus' | 'sonnet' | 'haiku';

export interface PromptVar {
  readonly name: string;
  readonly type: VarType;
  readonly defaultValue: string;
}

export interface PromptExample {
  readonly id: string;
  readonly label: string;
  readonly values: Readonly<Record<string, string>>;
}

export interface PromptVersion {
  readonly id: string;
  readonly label: string;
  readonly when: string;
  readonly note: string;
}

export interface PromptTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly system: string;
  readonly user: string;
  readonly variables: ReadonlyArray<PromptVar>;
  readonly examples: ReadonlyArray<PromptExample>;
  readonly versions: ReadonlyArray<PromptVersion>;
}

export const TEMPLATES: ReadonlyArray<PromptTemplate> = [
  {
    id: 'summarize',
    name: 'summarize',
    description: 'Summarize long text into N bullets',
    system: 'You are a precise summarizer. Output {{maxBullets}} bullet points only.',
    user: 'Summarize the following:\n\n{{text}}',
    variables: [
      { name: 'maxBullets', type: 'number', defaultValue: '5' },
      { name: 'text', type: 'text', defaultValue: 'Long passage about Next.js streaming...' },
    ],
    examples: [
      {
        id: 'ex1',
        label: 'Streaming docs',
        values: {
          maxBullets: '5',
          text: 'Next.js streaming sends HTML in chunks via Suspense boundaries. The shell renders first, then async data resolves...',
        },
      },
      {
        id: 'ex2',
        label: 'Release notes',
        values: {
          maxBullets: '3',
          text: 'v13.4 adds turbopack stable, partial prerendering, and updated server actions...',
        },
      },
      {
        id: 'ex3',
        label: 'Long article',
        values: {
          maxBullets: '7',
          text: 'A long-form article about React 19 server components and the future of the framework...',
        },
      },
    ],
    versions: [
      { id: 'v4', label: 'v4', when: '2026-04-22', note: 'Tightened bullet wording rule' },
      { id: 'v3', label: 'v3', when: '2026-04-12', note: 'Added max-bullets variable' },
      { id: 'v2', label: 'v2', when: '2026-03-30', note: 'Switched to system+user' },
      { id: 'v1', label: 'v1', when: '2026-03-15', note: 'Initial' },
    ],
  },
  {
    id: 'extract-fields',
    name: 'extract-fields',
    description: 'Extract structured fields as JSON',
    system: 'Extract the listed fields as strict JSON. Return only JSON.',
    user: 'Fields: {{fields}}\n\nText:\n{{text}}',
    variables: [
      { name: 'fields', type: 'string', defaultValue: 'name, email, phone' },
      { name: 'text', type: 'text', defaultValue: 'Contact: Jane Doe jane@example.com 555-1212' },
    ],
    examples: [
      {
        id: 'ex1',
        label: 'Contact card',
        values: {
          fields: 'name, email, phone',
          text: 'Jane Doe · jane@example.com · 555-1212',
        },
      },
      {
        id: 'ex2',
        label: 'Invoice',
        values: {
          fields: 'invoiceNo, total, currency',
          text: 'Invoice INV-204 · USD 1,240.00',
        },
      },
      {
        id: 'ex3',
        label: 'Receipt',
        values: {
          fields: 'merchant, total, date',
          text: 'Coffee · $4.20 · 2026-04-30',
        },
      },
    ],
    versions: [
      { id: 'v3', label: 'v3', when: '2026-04-15', note: 'Strict JSON-only' },
      { id: 'v2', label: 'v2', when: '2026-04-01', note: 'Added fields var' },
      { id: 'v1', label: 'v1', when: '2026-03-20', note: 'Initial' },
      { id: 'v0', label: 'v0', when: '2026-03-10', note: 'Draft' },
    ],
  },
  {
    id: 'generate-route',
    name: 'generate-route',
    description: 'Scaffold a Next.js route handler',
    system: 'You are a Next.js 15 expert. Output only valid TypeScript.',
    user: 'Create a {{method}} handler for /{{path}} that {{behavior}}.',
    variables: [
      { name: 'method', type: 'enum', defaultValue: 'POST' },
      { name: 'path', type: 'string', defaultValue: 'api/checkout' },
      { name: 'behavior', type: 'text', defaultValue: 'creates a Stripe checkout session and returns the URL' },
    ],
    examples: [
      {
        id: 'ex1',
        label: 'Stripe checkout',
        values: {
          method: 'POST',
          path: 'api/checkout',
          behavior: 'creates a Stripe checkout session and returns the URL',
        },
      },
      {
        id: 'ex2',
        label: 'Health',
        values: { method: 'GET', path: 'api/health', behavior: 'returns { ok: true }' },
      },
      {
        id: 'ex3',
        label: 'Webhook',
        values: {
          method: 'POST',
          path: 'api/webhooks/stripe',
          behavior: 'verifies signature and dispatches to the queue',
        },
      },
    ],
    versions: [
      { id: 'v2', label: 'v2', when: '2026-04-20', note: 'Force ts-only' },
      { id: 'v1', label: 'v1', when: '2026-04-05', note: 'Initial' },
      { id: 'v0a', label: 'v0a', when: '2026-04-01', note: 'Draft' },
      { id: 'v0', label: 'v0', when: '2026-03-25', note: 'Sketch' },
    ],
  },
  {
    id: 'code-review',
    name: 'code-review',
    description: 'Review a diff for issues',
    system: 'You are a senior reviewer. Be terse and only flag real issues.',
    user: 'Review this diff:\n\n{{diff}}\n\nFocus: {{focus}}',
    variables: [
      { name: 'diff', type: 'text', defaultValue: '+ const x = 1' },
      { name: 'focus', type: 'enum', defaultValue: 'correctness' },
    ],
    examples: [
      {
        id: 'ex1',
        label: 'Correctness',
        values: { diff: '+ const x = 1', focus: 'correctness' },
      },
      {
        id: 'ex2',
        label: 'Security',
        values: {
          diff: '+ db.query("select * from users where id=" + id)',
          focus: 'security',
        },
      },
      {
        id: 'ex3',
        label: 'Perf',
        values: {
          diff: '+ items.map(i => items.find(j => j.id === i.refId))',
          focus: 'performance',
        },
      },
    ],
    versions: [
      { id: 'v3', label: 'v3', when: '2026-04-25', note: 'Reduce nitpicks' },
      { id: 'v2', label: 'v2', when: '2026-04-12', note: 'Add focus var' },
      { id: 'v1', label: 'v1', when: '2026-03-29', note: 'Initial' },
      { id: 'v0', label: 'v0', when: '2026-03-21', note: 'Draft' },
    ],
  },
  {
    id: 'translate',
    name: 'translate',
    description: 'Translate between languages',
    system: 'Translate from {{src}} to {{dst}}. Preserve markdown.',
    user: '{{text}}',
    variables: [
      { name: 'src', type: 'enum', defaultValue: 'en' },
      { name: 'dst', type: 'enum', defaultValue: 'ko' },
      { name: 'text', type: 'text', defaultValue: 'Hello world' },
    ],
    examples: [
      {
        id: 'ex1',
        label: 'EN→KO',
        values: { src: 'en', dst: 'ko', text: 'Hello world' },
      },
      {
        id: 'ex2',
        label: 'EN→JA',
        values: { src: 'en', dst: 'ja', text: 'How are you?' },
      },
      {
        id: 'ex3',
        label: 'EN→ES',
        values: { src: 'en', dst: 'es', text: 'Good morning' },
      },
    ],
    versions: [
      { id: 'v2', label: 'v2', when: '2026-04-18', note: 'Preserve markdown' },
      { id: 'v1', label: 'v1', when: '2026-04-02', note: 'Initial' },
      { id: 'v0a', label: 'v0a', when: '2026-03-25', note: 'Draft' },
      { id: 'v0', label: 'v0', when: '2026-03-18', note: 'Sketch' },
    ],
  },
  {
    id: 'classify',
    name: 'classify',
    description: 'Classify text into a label set',
    system: 'Classify text into one of: {{labels}}. Output only the label.',
    user: '{{text}}',
    variables: [
      { name: 'labels', type: 'string', defaultValue: 'positive, neutral, negative' },
      { name: 'text', type: 'text', defaultValue: 'I love it.' },
    ],
    examples: [
      {
        id: 'ex1',
        label: 'Sentiment',
        values: {
          labels: 'positive, neutral, negative',
          text: 'I love it.',
        },
      },
      {
        id: 'ex2',
        label: 'Intent',
        values: { labels: 'refund, support, sales', text: 'I need my money back.' },
      },
      {
        id: 'ex3',
        label: 'Topic',
        values: { labels: 'finance, tech, sports', text: 'Apple released a new chip.' },
      },
    ],
    versions: [
      { id: 'v2', label: 'v2', when: '2026-04-21', note: 'Strict label-only' },
      { id: 'v1', label: 'v1', when: '2026-04-08', note: 'Add labels var' },
      { id: 'v0a', label: 'v0a', when: '2026-03-28', note: 'Draft' },
      { id: 'v0', label: 'v0', when: '2026-03-19', note: 'Sketch' },
    ],
  },
];

export interface ModelInfo {
  readonly id: ModelId;
  readonly label: string;
  readonly inputCostPerMTok: number;
  readonly outputCostPerMTok: number;
}

export const MODELS: ReadonlyArray<ModelInfo> = [
  { id: 'opus', label: 'Claude Opus 4.7', inputCostPerMTok: 15, outputCostPerMTok: 75 },
  { id: 'sonnet', label: 'Claude Sonnet 4.6', inputCostPerMTok: 3, outputCostPerMTok: 15 },
  { id: 'haiku', label: 'Claude Haiku 4', inputCostPerMTok: 0.8, outputCostPerMTok: 4 },
];

export function templateById(id: string): PromptTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}

export function modelById(id: ModelId): ModelInfo {
  return MODELS.find((m) => m.id === id) ?? MODELS[0]!;
}

export function renderPrompt(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    values[k] !== undefined ? values[k]! : `{{${k}}}`,
  );
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateCostUsd(
  model: ModelInfo,
  inputTokens: number,
  outputTokens = 600,
): number {
  return (
    (inputTokens / 1_000_000) * model.inputCostPerMTok +
    (outputTokens / 1_000_000) * model.outputCostPerMTok
  );
}
