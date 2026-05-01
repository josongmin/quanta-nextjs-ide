/**
 * Keyword + path-pattern heuristics for critical flow detection.
 *
 * Each heuristic carries a `weight` so the detector can sum hits and
 * derive a confidence score. Patterns are intentionally permissive —
 * the detector treats this as "candidate evidence" not absolute truth.
 */

import type { CriticalFlowKind } from './types';

export interface FlowHeuristic {
  kind: CriticalFlowKind;
  /** Regex tested against route paths and file paths. */
  pattern: RegExp;
  /** Plain keywords matched against action names. */
  keywords: string[];
  weight: number;
  label: string;
}

export const FLOW_HEURISTICS: FlowHeuristic[] = [
  {
    kind: 'payment',
    label: 'Payment / Checkout',
    pattern: /(checkout|payment|stripe|paypal|braintree|charge|invoice)/i,
    keywords: ['checkout', 'pay', 'charge', 'capturePayment', 'createPaymentIntent'],
    weight: 1.0,
  },
  {
    kind: 'auth',
    label: 'Authentication',
    pattern: /(auth|login|signup|sign-in|sign-up|register|password|session|reset-password|jwt|oauth)/i,
    keywords: ['login', 'logout', 'signup', 'authenticate', 'resetPassword', 'verifyEmail'],
    weight: 0.9,
  },
  {
    kind: 'admin',
    label: 'Admin / Role',
    pattern: /(\/admin\b|\brole\b|grant|impersonate|backoffice)/i,
    keywords: ['changeRole', 'grantRole', 'impersonate', 'banUser'],
    weight: 0.85,
  },
  {
    kind: 'billing',
    label: 'Billing / Subscription',
    pattern: /(billing|subscription|plan|invoice|trial|coupon)/i,
    keywords: ['subscribe', 'cancelSubscription', 'changePlan', 'applyCoupon'],
    weight: 0.8,
  },
  {
    kind: 'order',
    label: 'Order / Cart',
    pattern: /(order|cart|fulfillment|ship|inventory)/i,
    keywords: ['placeOrder', 'cancelOrder', 'addToCart', 'fulfillOrder'],
    weight: 0.75,
  },
  {
    kind: 'pii',
    label: 'Personal data',
    pattern: /(profile|account|address|ssn|tax-id|kyc|gdpr|export-data|delete-account)/i,
    keywords: ['updateProfile', 'updateAddress', 'exportData', 'deleteAccount'],
    weight: 0.7,
  },
];

/** Severity from confidence — used by UI badges. */
export function severityFromConfidence(
  confidence: number,
  kind: CriticalFlowKind,
): 'low' | 'medium' | 'high' | 'critical' {
  // Payment + auth always at least 'high' once detected.
  const floor = kind === 'payment' || kind === 'auth' ? 'high' : 'low';
  if (confidence >= 0.8) return 'critical';
  if (confidence >= 0.6) return 'high';
  if (confidence >= 0.35) return floor === 'high' ? 'high' : 'medium';
  return floor === 'high' ? 'high' : 'low';
}
