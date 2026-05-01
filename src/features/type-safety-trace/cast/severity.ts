/**
 * Severity scoring for unsafe casts.
 *
 * Inputs (currently): cast kind, downstream symbol count, critical-flow
 * flag, server/client boundary crossing flag.
 *
 * Outputs: low / medium / high / critical.
 *
 * If `@features/critical-flow` ships its store API, callers can tag
 * `inCriticalFlow` before scoring; this module remains pure.
 */

import type { UnsafeCast } from './types';
import type { SeverityLevel } from '../types';

const KIND_BASE: Record<UnsafeCast['kind'], number> = {
  'as-any': 3,
  'double-assert': 3,
  'non-null': 1,
  'unknown-cast': 2,
};

export function scoreCast(c: UnsafeCast): SeverityLevel {
  let score = KIND_BASE[c.kind];
  const fanout = c.downstream.length;
  if (fanout >= 20) score += 2;
  else if (fanout >= 5) score += 1;
  if (c.crossesBoundary) score += 1;
  if (c.inCriticalFlow) score += 2;
  if (score >= 6) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}
