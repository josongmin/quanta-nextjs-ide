export type RiskTier = 'low' | 'mid' | 'high';

export interface MiddlewareDef {
  readonly id: string;
  readonly name: string;
  /** suggested 0-based position when stacking. Lower = earlier. */
  readonly positionSuggested: number;
  readonly requiresContext: boolean;
  readonly blocking: boolean;
  readonly riskTier: RiskTier;
  readonly latencyMs: number;
  readonly description: string;
  /** Failure modes (mock). */
  readonly failureModes: ReadonlyArray<string>;
  /** Codegen line — pure transform, no runtime. */
  readonly callExpr: string;
  /** Decorator-style import path. */
  readonly importLine: string;
}

export const MIDDLEWARES: ReadonlyArray<MiddlewareDef> = [
  {
    id: 'requireAuth',
    name: 'requireAuth',
    positionSuggested: 0,
    requiresContext: true,
    blocking: true,
    riskTier: 'high',
    latencyMs: 4,
    description: 'Reject if no session. Reads cookies, validates JWT.',
    failureModes: ['401 Unauthorized', 'Session expired'],
    callExpr: 'requireAuth()',
    importLine: "import { requireAuth } from '@/middleware/auth';",
  },
  {
    id: 'requireRole',
    name: 'requireRole(admin)',
    positionSuggested: 1,
    requiresContext: true,
    blocking: true,
    riskTier: 'high',
    latencyMs: 1,
    description: 'Require role=admin on session. Must run after requireAuth.',
    failureModes: ['403 Forbidden'],
    callExpr: "requireRole('admin')",
    importLine: "import { requireRole } from '@/middleware/role';",
  },
  {
    id: 'rateLimit',
    name: 'rateLimit(60s,10)',
    positionSuggested: 2,
    requiresContext: false,
    blocking: true,
    riskTier: 'mid',
    latencyMs: 3,
    description: 'Sliding window: 10 req / 60s per actor. Backed by Redis (mock).',
    failureModes: ['429 Too Many Requests', 'Redis unavailable → fail-open'],
    callExpr: "rateLimit({ window: '60s', max: 10 })",
    importLine: "import { rateLimit } from '@/middleware/rate-limit';",
  },
  {
    id: 'csrfCheck',
    name: 'csrfCheck',
    positionSuggested: 3,
    requiresContext: true,
    blocking: true,
    riskTier: 'mid',
    latencyMs: 1,
    description: 'Validate CSRF token on mutating actions.',
    failureModes: ['403 CSRF token mismatch'],
    callExpr: 'csrfCheck()',
    importLine: "import { csrfCheck } from '@/middleware/csrf';",
  },
  {
    id: 'idempotency',
    name: 'idempotency(ttl=10m)',
    positionSuggested: 4,
    requiresContext: true,
    blocking: false,
    riskTier: 'mid',
    latencyMs: 6,
    description: 'Dedupe via Idempotency-Key header for 10 minutes.',
    failureModes: ['Cached duplicate response', 'Cache miss → re-execute'],
    callExpr: "idempotency({ ttl: '10m' })",
    importLine: "import { idempotency } from '@/middleware/idempotency';",
  },
  {
    id: 'validate',
    name: 'validate(zodSchema)',
    positionSuggested: 5,
    requiresContext: false,
    blocking: true,
    riskTier: 'low',
    latencyMs: 2,
    description: 'Parse input via zod schema; return 422 on failure.',
    failureModes: ['422 Validation error'],
    callExpr: 'validate(CreateOrderInput)',
    importLine: "import { validate } from '@/middleware/validate';",
  },
  {
    id: 'logging',
    name: 'logging',
    positionSuggested: 6,
    requiresContext: true,
    blocking: false,
    riskTier: 'low',
    latencyMs: 1,
    description: 'Structured request/response logging with timing.',
    failureModes: [],
    callExpr: 'logging()',
    importLine: "import { logging } from '@/middleware/logging';",
  },
  {
    id: 'audit',
    name: 'audit',
    positionSuggested: 7,
    requiresContext: true,
    blocking: false,
    riskTier: 'low',
    latencyMs: 5,
    description: 'Append-only audit trail to BigQuery sink (async).',
    failureModes: ['Sink lag', 'Drop on backpressure'],
    callExpr: 'audit()',
    importLine: "import { audit } from '@/middleware/audit';",
  },
];

export interface ServerAction {
  readonly id: string;
  readonly name: string;
  readonly file: string;
  readonly inputType: string;
  readonly returnType: string;
  readonly description: string;
}

export const ACTIONS: ReadonlyArray<ServerAction> = [
  {
    id: 'createOrder',
    name: 'createOrder',
    file: 'features/checkout/checkout.action.ts',
    inputType: 'CreateOrderInput',
    returnType: 'OrderResult',
    description: 'Creates a new order from cart contents.',
  },
  {
    id: 'cancelOrder',
    name: 'cancelOrder',
    file: 'features/checkout/cancel.action.ts',
    inputType: 'CancelOrderInput',
    returnType: 'OrderResult',
    description: 'Cancels and refunds an order.',
  },
  {
    id: 'updateProfile',
    name: 'updateProfile',
    file: 'features/account/profile.action.ts',
    inputType: 'ProfileInput',
    returnType: 'Profile',
    description: 'Updates user profile fields.',
  },
  {
    id: 'addReview',
    name: 'addReview',
    file: 'features/reviews/review.action.ts',
    inputType: 'ReviewInput',
    returnType: 'Review',
    description: 'Adds a review on a product.',
  },
];

export function middlewareById(id: string): MiddlewareDef {
  const m = MIDDLEWARES.find((x) => x.id === id);
  if (!m) throw new Error(`unknown middleware ${id}`);
  return m;
}

export function actionById(id: string): ServerAction {
  const a = ACTIONS.find((x) => x.id === id);
  if (!a) throw new Error(`unknown action ${id}`);
  return a;
}

export interface PipelineConflict {
  readonly id: string;
  readonly message: string;
  readonly severity: 'err' | 'warn';
}

/** Detect ordering / context conflicts in a pipeline. */
export function detectConflicts(pipeline: ReadonlyArray<string>): ReadonlyArray<PipelineConflict> {
  const out: PipelineConflict[] = [];
  const idx = (id: string): number => pipeline.indexOf(id);

  if (idx('requireRole') >= 0) {
    if (idx('requireAuth') < 0) {
      out.push({
        id: 'role-without-auth',
        message: 'requireRole(admin) needs requireAuth in the pipeline.',
        severity: 'err',
      });
    } else if (idx('requireRole') < idx('requireAuth')) {
      out.push({
        id: 'role-before-auth',
        message: 'requireAuth must come before requireRole.',
        severity: 'err',
      });
    }
  }
  if (idx('csrfCheck') >= 0 && idx('requireAuth') >= 0 && idx('csrfCheck') < idx('requireAuth')) {
    out.push({
      id: 'csrf-before-auth',
      message: 'csrfCheck typically runs after requireAuth (so we have a session).',
      severity: 'warn',
    });
  }
  if (idx('validate') >= 0 && idx('rateLimit') >= 0 && idx('validate') < idx('rateLimit')) {
    out.push({
      id: 'validate-before-ratelimit',
      message: 'rateLimit should run before validate to drop floods early.',
      severity: 'warn',
    });
  }
  if (idx('audit') >= 0 && idx('logging') < 0) {
    out.push({
      id: 'audit-without-logging',
      message: 'audit without logging — recommended pair for traceability.',
      severity: 'warn',
    });
  }
  return out;
}

export function recommendedOrder(): ReadonlyArray<string> {
  return [...MIDDLEWARES]
    .sort((a, b) => a.positionSuggested - b.positionSuggested)
    .map((m) => m.id);
}

export function compileOutput(actionId: string, pipeline: ReadonlyArray<string>): string {
  const action = actionById(actionId);
  const usedImports = pipeline.map((id) => middlewareById(id).importLine);
  // wrap order: outer-most = first in pipeline
  const wrap = pipeline
    .map((id) => `  ${middlewareById(id).callExpr}`)
    .join(',\n');
  const lines: string[] = [];
  lines.push("'use server';");
  lines.push('');
  lines.push("import { compose } from '@/middleware/compose';");
  for (const imp of usedImports) lines.push(imp);
  lines.push(`import type { ${action.inputType}, ${action.returnType} } from './types';`);
  lines.push('');
  lines.push(`async function ${action.name}Impl(input: ${action.inputType}): Promise<${action.returnType}> {`);
  lines.push('  // ... business logic');
  lines.push(`  return null as unknown as ${action.returnType};`);
  lines.push('}');
  lines.push('');
  if (pipeline.length === 0) {
    lines.push(`export const ${action.name} = ${action.name}Impl;`);
  } else {
    lines.push(`export const ${action.name} = compose([`);
    lines.push(wrap);
    lines.push(`])(${action.name}Impl);`);
  }
  return lines.join('\n');
}

export function totalLatency(pipeline: ReadonlyArray<string>): number {
  return pipeline.reduce((acc, id) => acc + middlewareById(id).latencyMs, 0);
}

export function aggregateFailureModes(
  pipeline: ReadonlyArray<string>,
): ReadonlyArray<{ id: string; from: string; message: string }> {
  const out: Array<{ id: string; from: string; message: string }> = [];
  for (const id of pipeline) {
    const m = middlewareById(id);
    for (const f of m.failureModes) {
      out.push({ id: `${id}-${f}`, from: m.name, message: f });
    }
  }
  return out;
}

export function riskChipTone(r: RiskTier): 'err' | 'warn' | 'info' {
  return r === 'high' ? 'err' : r === 'mid' ? 'warn' : 'info';
}
