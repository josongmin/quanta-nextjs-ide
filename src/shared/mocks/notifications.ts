import type { Notification } from '@shared/types';

const HOUR = 60 * 60 * 1000;

const NOW = Date.parse('2026-04-30T10:30:00.000Z');

export const mockNotifications: Notification[] = [
  {
    id: 'n_001',
    kind: 'risk',
    title: 'Auth guard removed on /admin/users/delete',
    body: 'requireRole("admin") was removed in commit a8f1c2 — admission gate flagged.',
    at: NOW - 0.5 * HOUR,
    read: false,
  },
  {
    id: 'n_002',
    kind: 'pr',
    title: 'PR Summary ready — feature/checkout-overhaul',
    body: '6 routes ISR -> Dynamic. Estimated server cost +18%.',
    at: NOW - 1 * HOUR,
    read: false,
  },
  {
    id: 'n_003',
    kind: 'analysis',
    title: 'Cache lineage drift detected',
    body: 'updateProduct() invalidates "products" but is paired with revalidatePath only.',
    at: NOW - 3 * HOUR,
    read: false,
  },
  {
    id: 'n_004',
    kind: 'build',
    title: 'Type-check passed (4.1s)',
    body: 'No new type errors. 0 regressions.',
    at: NOW - 5 * HOUR,
    read: true,
  },
  {
    id: 'n_005',
    kind: 'tip',
    title: 'New rule available: react-19-action-state',
    body: 'Detects useActionState patterns that swallow form errors.',
    at: NOW - 9 * HOUR,
    read: false,
  },
  {
    id: 'n_006',
    kind: 'risk',
    title: '"use client" promoted to root layout',
    body: 'Blast radius: +280KB shipped to all routes.',
    at: NOW - 18 * HOUR,
    read: true,
  },
  {
    id: 'n_007',
    kind: 'pr',
    title: 'Patch admission: NEEDS REVIEW',
    body: 'AI patch from claude-sonnet flagged 2 cache pair violations.',
    at: NOW - 26 * HOUR,
    read: true,
  },
  {
    id: 'n_008',
    kind: 'analysis',
    title: 'Hot file: app/(shop)/products/[id]/page.tsx',
    body: '12 diagnostics across rendering, cache, and a11y.',
    at: NOW - 36 * HOUR,
    read: true,
  },
  {
    id: 'n_009',
    kind: 'build',
    title: 'Bundle budget violated: client-cart',
    body: 'Total JS for /cart is 312KB — budget is 280KB.',
    at: NOW - 50 * HOUR,
    read: true,
  },
  {
    id: 'n_010',
    kind: 'tip',
    title: 'Try the AI Patch Gate',
    body: 'Review incoming AI patches against your project invariants before admitting.',
    at: NOW - 72 * HOUR,
    read: true,
  },
];
