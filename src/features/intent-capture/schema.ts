/**
 * Zod schema for parsed Intent. The schema doubles as a contract for the
 * LLM-driven parser: we hand the JSON-shape description to the model and
 * validate the result before storing it.
 */

import { z } from 'zod';

export const IntentScopeSchema = z.object({
  routes: z.array(z.string()).default([]),
  files: z.array(z.string()).default([]),
  symbols: z.array(z.string()).default([]),
});

export const IntentConstraintSchema = z.enum([
  'preserve-cache',
  'no-secret-leak',
  'preserve-auth',
  'no-breaking-api',
  'no-perf-regression',
  'preserve-types',
]);

export const IntentSchema = z.object({
  goal: z.string().min(1),
  scope: IntentScopeSchema,
  constraints: z.array(IntentConstraintSchema).default([]),
  /** Optional flow id (e.g. 'payment', 'auth') from critical-flow. */
  targetFlow: z.string().nullable().default(null),
  /** Original user input — preserved for audit. */
  rawInput: z.string(),
  /** When parsed (epoch ms). */
  parsedAt: z.number(),
});

export type Intent = z.infer<typeof IntentSchema>;
export type IntentConstraint = z.infer<typeof IntentConstraintSchema>;
export type IntentScope = z.infer<typeof IntentScopeSchema>;

export const CONSTRAINT_LABEL: Record<IntentConstraint, string> = {
  'preserve-cache': 'Preserve cache',
  'no-secret-leak': 'No secret leak',
  'preserve-auth': 'Preserve auth',
  'no-breaking-api': 'No breaking API',
  'no-perf-regression': 'No perf regression',
  'preserve-types': 'Preserve types',
};
