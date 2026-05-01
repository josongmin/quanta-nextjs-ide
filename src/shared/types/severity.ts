import { z } from 'zod';

export const severityZ = z.enum(['err', 'warn', 'info', 'hint']);
export type Severity = z.infer<typeof severityZ>;

export const confidenceZ = z.enum(['high', 'medium', 'low']);
export type Confidence = z.infer<typeof confidenceZ>;

export const renderingClassZ = z.enum(['static', 'isr', 'dynamic', 'unknown']);
export type RenderingClass = z.infer<typeof renderingClassZ>;

export const costClassZ = z.enum(['A', 'B', 'C', 'D', 'E']);
export type CostClass = z.infer<typeof costClassZ>;

export const runtimeZ = z.enum(['node', 'edge']);
export type Runtime = z.infer<typeof runtimeZ>;

export const archetypeZ = z.enum([
  'marketing',
  'commerce.list',
  'commerce.product-detail',
  'commerce.cart',
  'commerce.checkout',
  'admin',
  'account',
  'dashboard',
  'auth',
  'blog',
  'docs',
  'api',
  'webhook',
  'unknown',
]);
export type Archetype = z.infer<typeof archetypeZ>;
